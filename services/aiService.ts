import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, type AIConfig, type Tender, type RiskAssessment, type ManagedDocument, type DocumentAnalysis, type TechnicalDetails, AIExtractedItem, AIInsights } from '../types';
import { CORS_PROXY_URL, DEFAULT_TECH_SPEC_FIELDS } from '../constants';

// --- HELPER FUNCTIONS ---

const stripHtml = (html: string): string => {
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const mainContent = doc.querySelector('main, article, .content, .main, .post, #main, #content, [role=main]');
        const text = mainContent ? (mainContent as HTMLElement).innerText : doc.body.innerText;
        return text.replace(/\s\s+/g, ' ').trim();
    } catch(e) {
        return html.replace(/<[^>]*>?/gm, '');
    }
};

const handleApiError = (provider: AIProvider, error: any): never => {
    console.error(`Error calling ${provider} API:`, error);
    const errorMessage = error?.message || (typeof error === 'string' ? error : 'An unknown error occurred');
    if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('authentication')) {
        throw new Error(`The provided API key for ${provider} is not valid. Please check it in the settings.`);
    }
    throw new Error(`Failed to get a response from ${provider} due to an API error: ${errorMessage}`);
};


// --- PROVIDER-SPECIFIC API CALLERS ---

async function callGemini(prompt: any, config: AIConfig, schema?: any): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const model = config.model || 'gemini-2.5-flash';

    try {
        const generationConfig: any = {};
        if (schema) {
            generationConfig.responseMimeType = "application/json";
            generationConfig.responseSchema = schema;
        }

        // The 'tools' property is specific to Gemini for features like Google Search grounding.
        // It's added here conditionally.
        if (prompt.tools) {
            generationConfig.tools = prompt.tools;
        }

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: generationConfig,
        });
        
        return response.text;
    } catch (error) {
        handleApiError(AIProvider.GEMINI, error);
    }
}

async function callApi(apiUrl: string, headers: Record<string, string>, body: any, provider: AIProvider, responseExtractor: (json: any) => string): Promise<string> {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }
        const json = await response.json();
        return responseExtractor(json);
    } catch (error) {
        handleApiError(provider, error);
    }
}

async function callOpenAICompatible(apiUrl: string, prompt: any, config: AIConfig, schema: any | undefined, provider: AIProvider): Promise<string> {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` };
    const messages = Array.isArray(prompt.parts) ? prompt.parts.map((part: any) => {
        if(part.text) return { role: 'user', content: part.text };
        if(part.inlineData) return { role: 'user', content: [ { type: 'image_url', image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }}]};
        return { role: 'user', content: ''};
    }) : [{ role: 'user', content: prompt }];
    
    const body: any = {
        model: config.model,
        messages: messages,
        max_tokens: 4096,
    };
    if (schema) body.response_format = { type: 'json_object' };

    return callApi(apiUrl, headers, body, provider, (json) => json.choices[0].message.content);
}

async function callAnthropic(prompt: any, config: AIConfig, schema: any | undefined): Promise<string> {
    const headers = { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
    
    const body: any = {
        model: config.model,
        max_tokens: 4096,
        messages: []
    };
    
    let systemPrompt = '';
    if (schema) {
        systemPrompt = `You MUST respond ONLY with a valid JSON object. Do not include any text before or after the JSON. The JSON should conform to this schema: ${JSON.stringify(schema)}`;
        body.system = systemPrompt;
    }
    
    const userContent = Array.isArray(prompt.parts) ? prompt.parts.map((part: any) => {
        if(part.text) return { type: 'text', text: part.text };
        if(part.inlineData) return { type: 'image', source: { type: 'base64', media_type: part.inlineData.mimeType, data: part.inlineData.data }};
        return {type: 'text', text: ''};
    }) : [{ type: 'text', text: prompt }];

    body.messages.push({ role: 'user', content: userContent });

    return callApi('https://api.anthropic.com/v1/messages', headers, body, AIProvider.ANTHROPIC, (json) => json.content[0].text);
}


// --- CENTRAL DISPATCHER ---

async function generateContent(prompt: string | { parts: any[], tools?: any[] }, config: AIConfig, schema?: any): Promise<string> {
    if (!config.apiKey) throw new Error(`API key for ${config.provider} is not configured. Please add it in Settings.`);
    if (!config.model) throw new Error(`Model for ${config.provider} is not configured. Please select one in Settings.`);

    // Normalize prompt to the object structure for simplicity
    const promptObject = typeof prompt === 'string' ? { parts: [{ text: prompt }] } : prompt;

    switch (config.provider) {
        case AIProvider.GEMINI:
            return callGemini(promptObject, config, schema);
        case AIProvider.OPENAI:
            return callOpenAICompatible('https://api.openai.com/v1/chat/completions', promptObject, config, schema, AIProvider.OPENAI);
        case AIProvider.DEEPSEEK:
             return callOpenAICompatible('https://api.deepseek.com/chat/completions', promptObject, config, schema, AIProvider.DEEPSEEK);
        case AIProvider.ANTHROPIC:
            return callAnthropic(promptObject, config, schema);
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}


// --- EXPORTED BUSINESS LOGIC FUNCTIONS ---

const tenderDetailsSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The official title of the tender." },
        summary: { type: Type.STRING, description: "A concise summary of the tender's scope and objective." },
        closingDate: { type: Type.STRING, description: "The submission deadline in YYYY-MM-DD format." }
    },
    required: ['title', 'summary', 'closingDate']
};

export const extractTenderDetailsFromUrl = async (url: string, config: AIConfig): Promise<Partial<Tender>> => {
    if (!url || !url.startsWith('http')) throw new Error("A valid URL is required.");
    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Failed to fetch page content. Status: ${response.status}`);
        const html = await response.text();
        const textContent = stripHtml(html);
        if (!textContent || textContent.length < 100) throw new Error("Could not extract meaningful text from the page.");

        const prompt = `You are a procurement expert. Analyze the following text from a tender webpage and extract the key details.

Webpage Text:
---
${textContent.substring(0, 15000)}
---

Extract the following information:
1.  **title**: The official title of the tender.
2.  **summary**: A concise summary of the tender's scope and objective.
3.  **closingDate**: The submission deadline. Find the most likely closing date and return it ONLY in YYYY-MM-DD format. If multiple dates are present, pick the one explicitly labeled as the closing or submission date.`;

        const jsonText = await generateContent(prompt, config, tenderDetailsSchema);
        const data = JSON.parse(jsonText);
        return {
            title: data.title,
            summary: data.summary,
            closingDate: data.closingDate,
            link: url,
        };

    } catch (error: any) {
        throw new Error(error.message || `Failed to process the page at ${url}.`);
    }
};

export const extractTenderDetailsFromDocument = async (document: { fileData: string; mimeType: string }, config: AIConfig): Promise<Partial<Tender>> => {
    const promptText = `You are a procurement expert. Analyze the attached document (RFP, RFQ, etc.) and extract the key details.

Extract the following information:
1.  **title**: The official title of the tender.
2.  **summary**: A concise summary of the tender's scope and objective.
3.  **closingDate**: The submission deadline. Find the most likely closing date and return it ONLY in YYYY-MM-DD format.`;

    if (!document.fileData || !document.mimeType) throw new Error("Document content or mimeType is missing.");
    const base64Data = document.fileData.substring(document.fileData.indexOf(',') + 1);
    const filePart = { inlineData: { data: base64Data, mimeType: document.mimeType } };
    
    const prompt = { parts: [filePart, { text: promptText }] };
    const jsonText = await generateContent(prompt, config, tenderDetailsSchema);
    const data = JSON.parse(jsonText);
     return {
        title: data.title,
        summary: data.summary,
        closingDate: data.closingDate,
        link: '', // No link from a document
    };
};

export const summarizeText = async (textContent: string, config: AIConfig): Promise<string> => {
    const prompt = `You are an expert procurement assistant. Summarize the following tender information from a web page concisely for a busy manager. Focus on the core requirements, deliverables, and any mentioned deadlines or key dates. Ignore navigation menus, ads, and boilerplate text. Present the output in clear, easy-to-read bullet points.

Tender Information:
---
${textContent.substring(0, 15000)}
---

Summary:`;
    return generateContent(prompt, config);
};

export const summarizeLivePage = async (url: string, config: AIConfig): Promise<string> => {
    if (!url || !url.startsWith('http')) throw new Error("A valid tender URL is required for summarization.");
    try {
        const response = await fetch(`${CORS_PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`Failed to fetch tender page content. Status: ${response.status}`);
        const html = await response.text();
        const textContent = stripHtml(html);
        if (!textContent || textContent.length < 100) throw new Error("Could not extract meaningful text from the tender page.");
        return summarizeText(textContent, config);
    } catch (error: any) {
        throw new Error(error.message || `Failed to process the tender page at ${url}.`);
    }
};

export const categorizeTender = async (tender: Tender, config: AIConfig): Promise<string> => {
    const prompt = `Based on the following tender title and summary, provide a single, concise category for it (e.g., "IT Hardware", "Construction Services", "Medical Supplies", "Consulting"). Respond with ONLY the category name and nothing else.

Title: ${tender.title}
Summary: ${tender.summary}`;

    const category = await generateContent(prompt, config);
    // Clean up response to ensure it's just the category
    return category.replace(/["\n.]/g, '').trim();
};

export const extractTenderInsights = async (tender: Tender, config: AIConfig): Promise<AIInsights> => {
    const prompt = `Analyze the following tender information. Extract key terms/technologies as 'keywords' (an array of 3-5 strings). If a budget or value is explicitly mentioned (e.g., "budget of", "valued at"), extract it as a formatted string in 'estimatedValue'. If no value is mentioned, omit the 'estimatedValue' field entirely.

Title: ${tender.title}
Summary: ${tender.summary}`;

    const insightsSchema = {
        type: Type.OBJECT,
        properties: {
            keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 3-5 most relevant keywords or technologies."
            },
            estimatedValue: {
                type: Type.STRING,
                description: "The estimated budget or value if explicitly mentioned in the text."
            }
        },
        required: ['keywords']
    };

    try {
        const jsonText = await generateContent(prompt, config, insightsSchema);
        return JSON.parse(jsonText) as AIInsights;
    } catch (e) {
        console.error("Failed to extract tender insights:", e);
        return { keywords: [] }; // Return empty object on failure
    }
};


export const assessTenderRisk = async (tender: Tender, quoteValue: number, config: AIConfig): Promise<Omit<RiskAssessment, 'generatedAt'>> => {
    const prompt = `
        As an expert procurement and risk analyst, evaluate the following tender based on its summary, closing date, and our estimated quote value.
        Provide a structured risk assessment in JSON format.
        
        Tender Information:
        - Title: ${tender.title}
        - Summary: ${tender.summary}
        - Closing Date: ${tender.closingDate}
        - Our Estimated Quote Value: $${quoteValue.toFixed(2)}

        Analyze potential risks such as tight deadlines, unclear requirements, high competition (if inferable), logistical challenges, and financial viability. 
        Provide an overall risk level (Low, Medium, or High), list 3-5 key risks, suggest a mitigation strategy for each, and give a confidence score for your analysis.
    `;
    
    // Schema is defined for Gemini's structured output. Other models use it as a signal.
    const riskSchema = {
        type: Type.OBJECT,
        properties: {
            overallRisk: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            identifiedRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            mitigationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceScore: { type: Type.NUMBER }
        },
        required: ['overallRisk', 'identifiedRisks', 'mitigationStrategies', 'confidenceScore']
    };

    const jsonText = await generateContent(prompt, config, riskSchema);
    return JSON.parse(jsonText) as Omit<RiskAssessment, 'generatedAt'>;
};

export const analyzeDocument = async (document: Pick<ManagedDocument, 'fileData' | 'mimeType'>, config: AIConfig): Promise<Omit<DocumentAnalysis, 'generatedAt'>> => {
    const promptText = `
        You are an expert procurement document analyst. Analyze the attached document (e.g., RFP, RFQ, technical specs).
        Extract the following information and provide it in a structured JSON format:
        1.  **Summary**: A brief, one-paragraph summary of the document's main purpose.
        2.  **Key Requirements**: A bulleted list of the most critical technical, operational, or commercial requirements mentioned.
        3.  **Deadlines**: A list of any specific dates or deadlines mentioned in the document.
        4.  **Risks or Red Flags**: A list of potential issues, ambiguities, or challenging requirements that could pose a risk to the bid.
    `;
    
    const analysisSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING },
            keyRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            deadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
            risksOrRedFlags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['summary', 'keyRequirements', 'deadlines', 'risksOrRedFlags']
    };
    
    if (!document.fileData || !document.mimeType) throw new Error("Document content or mimeType is missing.");
    const base64Data = document.fileData.substring(document.fileData.indexOf(',') + 1);
    const filePart = { inlineData: { data: base64Data, mimeType: document.mimeType } };
    
    const prompt = { parts: [filePart, { text: promptText }] };
    const jsonText = await generateContent(prompt, config, analysisSchema);
    return JSON.parse(jsonText) as Omit<DocumentAnalysis, 'generatedAt'>;
};

export const fillTechnicalSpecs = async (manufacturer: string, model: string, config: AIConfig): Promise<TechnicalDetails> => {
    const promptText = `
        Find the detailed technical specifications for the following product and return them as a JSON object.
        - Manufacturer: ${manufacturer}
        - Model: ${model}

        Provide detailed information for as many of the following fields as you can find. If information for a field is not available or you are not certain, omit it entirely from the JSON. Only return accurate data.
        The fields and their keys are: ${DEFAULT_TECH_SPEC_FIELDS.map(f => `"${f.label}" (key: ${f.id})`).join(', ')}.
    `;
    
    const specSchemaProperties: { [key: string]: { type: Type.STRING } } = {};
    DEFAULT_TECH_SPEC_FIELDS.forEach(field => { specSchemaProperties[field.id] = { type: Type.STRING }; });
    const specSchema = { type: Type.OBJECT, properties: specSchemaProperties };

    // Note: Google Search grounding is a Gemini-specific feature.
    // We'll only add the 'tools' parameter for Gemini. Other models will use their training data.
    const prompt: any = { parts: [{ text: promptText }] };
    if (config.provider === AIProvider.GEMINI) {
        prompt.tools = [{ googleSearch: {} }];
    }

    const jsonText = await generateContent(prompt, config, specSchema);
    return JSON.parse(jsonText) as TechnicalDetails;
};

export const fillTechnicalSpecsFromDocument = async (document: Pick<ManagedDocument, 'fileData' | 'mimeType'>, itemName: string, config: AIConfig): Promise<TechnicalDetails> => {
    const promptText = `
        Analyze the attached document (which could be a product catalog, brochure, or spec sheet) and find the detailed technical specifications for the item named "${itemName}".
        Return the specifications as a JSON object.

        Extract detailed information for as many of the following fields as you can find within the document for the specified item. 
        If information for a field is not available or you are not certain of its accuracy, omit it entirely from the JSON.
        The fields and their keys are: ${DEFAULT_TECH_SPEC_FIELDS.map(f => `"${f.label}" (key: ${f.id})`).join(', ')}.
    `;

    const specSchemaProperties: { [key: string]: { type: Type.STRING } } = {};
    DEFAULT_TECH_SPEC_FIELDS.forEach(field => { specSchemaProperties[field.id] = { type: Type.STRING }; });
    const specSchema = { type: Type.OBJECT, properties: specSchemaProperties };

    if (!document.fileData || !document.mimeType) throw new Error("Document content or mimeType is missing.");
    const base64Data = document.fileData.substring(document.fileData.indexOf(',') + 1);
    const filePart = { inlineData: { data: base64Data, mimeType: document.mimeType } };
    
    const prompt = { parts: [filePart, { text: promptText }] };
    const jsonText = await generateContent(prompt, config, specSchema);
    return JSON.parse(jsonText) as TechnicalDetails;
};

export const generateWorkspaceSummary = async (tender: Tender, config: AIConfig): Promise<string> => {
    if (!tender.link) return summarizeText(`${tender.title}\n\n${tender.summary}`, config);
    return summarizeLivePage(tender.link, config);
};

export const extractCatalogItemsFromDocument = async (document: Pick<ManagedDocument, 'fileData' | 'mimeType'>, config: AIConfig): Promise<AIExtractedItem[]> => {
    const promptText = `
        Analyze the attached vendor quotation or proforma invoice. Extract each line item into a structured JSON array.
        For each item, provide:
        - 'itemName': The name or title of the product/service.
        - 'description': A detailed description.
        - 'cost': The unit price. This is the COST price from the vendor.
        - 'uom': The unit of measure (e.g., "each", "pcs", "lot"), if available.
        - 'manufacturer': The manufacturer name, if specified.
        - 'model': The model number, if specified.
        - 'hsnCode': The HSN (Harmonized System of Nomenclature) code, if available.
        - 'technicalSpecs': An array of objects, where each object has a 'specName' and a 'specValue' for any technical specifications listed for the item.

        If a field is not present for an item, omit it. Ensure the 'cost' is a number.
    `;
    
    const itemSchema = {
        type: Type.OBJECT,
        properties: {
            itemName: { type: Type.STRING },
            description: { type: Type.STRING },
            cost: { type: Type.NUMBER },
            uom: { type: Type.STRING },
            manufacturer: { type: Type.STRING },
            model: { type: Type.STRING },
            hsnCode: { type: Type.STRING },
            technicalSpecs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        specName: { type: Type.STRING },
                        specValue: { type: Type.STRING },
                    },
                    required: ['specName', 'specValue']
                }
            }
        },
        required: ['itemName', 'description', 'cost']
    };
    const catalogExtractionSchema = { type: Type.ARRAY, items: itemSchema };

    if (!document.fileData || !document.mimeType) throw new Error("Document content or mimeType is missing.");
    const base64Data = document.fileData.substring(document.fileData.indexOf(',') + 1);
    const filePart = { inlineData: { data: base64Data, mimeType: document.mimeType } };

    const prompt = { parts: [filePart, { text: promptText }] };
    const jsonText = await generateContent(prompt, config, catalogExtractionSchema);
    return JSON.parse(jsonText) as AIExtractedItem[];
};