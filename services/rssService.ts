import { CORS_PROXY_URL } from '../constants';
import type { Tender } from '../types';

function extractClosingDate(summary: string, pubDate: Date, sourceName: string): { closingDate: Date; isClosingDateEstimated: boolean } {
  // Specific logic for Africa CDC feed as requested.
  if (sourceName.toLowerCase().includes('africa cdc')) {
    // For this source, the publication date is considered the closing date.
    return { closingDate: pubDate, isClosingDateEstimated: false };
  }

  const keywords = ['closing date:', 'closing date', 'deadline', 'closes at', 'submission deadline', 'closing:'];
  const summaryLower = summary.toLowerCase();
  
  for (const keyword of keywords) {
    const index = summaryLower.indexOf(keyword);
    if (index !== -1) {
      const textAfterKeyword = summary.substring(index + keyword.length);

      // More robust list of date formats to try, with regex and a parser function.
      // Parsers now create Date objects directly to avoid timezone ambiguity.
      const dateFormats: { regex: RegExp, parser: (match: RegExpMatchArray) => Date | null }[] = [
        // Format: August 28, 2025 or Aug 28 2025
        { 
            regex: /([A-Za-z]{3,9})\s(\d{1,2}),?\s(\d{4})/, 
            parser: (match) => new Date(`${match[1]} ${match[2]} ${match[3]}`)
        },
        // Format: 28 August 2025, 28-Aug-2025, 28/August/2025
        { 
            regex: /(\d{1,2})[\s\-/]([A-Za-z]{3,9})[\s\-/](\d{4})/, 
            parser: (match) => new Date(`${match[1]} ${match[2]} ${match[3]}`)
        },
        // Format: YYYY-MM-DD (ISO format)
        { 
            regex: /(\d{4})-(\d{2})-(\d{2})/, 
            parser: (match) => {
              // Construct from components to ensure it's parsed in local timezone, not UTC.
              const year = parseInt(match[1], 10);
              const month = parseInt(match[2], 10);
              const day = parseInt(match[3], 10);
              return new Date(year, month - 1, day);
            }
        },
        // Format: DD/MM/YYYY or DD-MM-YYYY (assumes day-first format, common internationally)
        {
            regex: /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/,
            parser: (match) => {
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10);
                const year = parseInt(match[3], 10);
                
                if (month < 1 || month > 12 || day < 1 || day > 31) return null;
                
                return new Date(year, month - 1, day);
            }
        },
      ];

      for (const format of dateFormats) {
        // Look for a date within the first ~100 characters after the keyword for relevance.
        const relevantText = textAfterKeyword.substring(0, 100);
        const match = relevantText.match(format.regex);
        if (match) {
          const parsedDate = format.parser(match);
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            // Basic sanity check: date should be in the future or very recent past.
            const today = new Date();
            today.setHours(0,0,0,0);
            const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            if (parsedDate >= oneYearAgo) {
                return { closingDate: parsedDate, isClosingDateEstimated: false };
            }
          }
        }
      }
    }
  }

  // Fallback: estimate closing date if not found
  const estimatedDate = new Date(pubDate);
  estimatedDate.setDate(pubDate.getDate() + 30);
  return { closingDate: estimatedDate, isClosingDateEstimated: true };
}

const parseJsonFeed = (data: any, feedUrl: string): Tender[] => {
  const sourceName = data.title || feedUrl;
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item: any): Tender | null => {
    const title = item.title || "No Title";
    const link = item.url || "#";
    const summary = item.content_html || item.summary || "No Summary";
    const pubDateStr = item.date_published || item.published;
    const id = item.id || link || title;

    if (!pubDateStr) return null;

    const publishedDate = new Date(pubDateStr);
    const { closingDate, isClosingDateEstimated } = extractClosingDate(summary, publishedDate, sourceName);

    return {
      id,
      title,
      link,
      summary: summary.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...', // Clean and truncate summary
      publishedDate: publishedDate.toISOString(),
      closingDate: closingDate.toISOString(),
      isClosingDateEstimated,
      source: sourceName,
    };
  }).filter((tender): tender is Tender => tender !== null);
};

const parseXmlFeed = (xml: Document, feedUrl: string): Tender[] => {
    const items = Array.from(xml.querySelectorAll("item, entry"));
    const sourceName = xml.querySelector("channel > title, feed > title")?.textContent || feedUrl;
    
    return items.map((item): Tender | null => {
      const title = item.querySelector("title")?.textContent || "No Title";
      const link = item.querySelector("link")?.getAttribute('href') || item.querySelector("link")?.textContent || "#";
      const summary = item.querySelector("description, summary")?.textContent || "No Summary";
      const pubDateStr = item.querySelector("pubDate, published")?.textContent;
      const id = item.querySelector("guid, id")?.textContent || link || title;

      if (!pubDateStr) return null;
      
      const publishedDate = new Date(pubDateStr);
      const { closingDate, isClosingDateEstimated } = extractClosingDate(summary, publishedDate, sourceName);

      return {
        id,
        title,
        link,
        summary: summary.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...', // Clean and truncate summary
        publishedDate: publishedDate.toISOString(),
        closingDate: closingDate.toISOString(),
        isClosingDateEstimated,
        source: sourceName,
      };
    }).filter((tender): tender is Tender => tender !== null);
};

export const fetchAndParseRss = async (feedUrl: string): Promise<Tender[]> => {
  try {
    // REMOVED: Cache-busting parameter to reduce requests and avoid rate-limiting.
    const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(feedUrl)}`);
    if (!response.ok) {
      if (response.status === 429) {
          throw new Error(`Rate limit exceeded for feed: ${feedUrl}. Please wait before refreshing.`);
      }
      throw new Error(`HTTP error! status: ${response.status} for URL: ${feedUrl}`);
    }
    const text = await response.text();

    // Try parsing as JSON first
    try {
        const jsonData = JSON.parse(text);
        // Check if it's a valid JSON feed structure
        if (jsonData.items) {
          return parseJsonFeed(jsonData, feedUrl);
        }
    } catch (jsonError) {
        // If JSON parsing fails or it's not a JSON feed, it will fall through to XML parsing.
    }

    // Fallback to XML parsing
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    
    const errorNode = xml.querySelector("parsererror");
    if (errorNode) {
      console.error("Error parsing XML for", feedUrl, errorNode);
      // We tried JSON and it failed, now XML failed too.
      return [];
    }

    return parseXmlFeed(xml, feedUrl);

  } catch (error) {
    console.error(`Failed to fetch or parse RSS feed: ${feedUrl}`, error);
    // Re-throw the error so the calling function can handle it.
    throw error;
  }
};