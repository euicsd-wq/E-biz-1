import { TenderStatus, type WatchlistItem } from './types';

export const formatTenderDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    const day = String(date.getDate()).padStart(2, '0');
    // Using a custom array for month abbreviations to match user's example "Sept"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return 'Invalid Date';
  }
};

export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    
    let interval = seconds / 31536000;
    if (interval > 1) {
      const years = Math.floor(interval);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      const months = Math.floor(interval);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
      const days = Math.floor(interval);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
      const hours = Math.floor(interval);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 60;
    if (interval > 1) {
      const minutes = Math.floor(interval);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    return Math.floor(seconds) + " seconds ago";
  } catch (e) {
    return 'Invalid Date';
  }
};

/**
 * Generates a consistent HSL color from a string.
 * Uses a simple hashing function and maps the hash to the hue value.
 * Saturation and lightness are fixed for aesthetic consistency.
 * @param str The input string (e.g., a source name).
 * @returns An HSL color string (e.g., 'hsl(120, 70%, 40%)').
 */
export const generateHslColorFromString = (str: string): string => {
  let hash = 0;
  if (str.length === 0) return 'hsl(0, 70%, 40%)';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const h = hash % 360;
  // Using fixed saturation and lightness for consistent, pleasant colors.
  // Lightness is set to 40% to ensure good contrast with light text.
  return `hsl(${h}, 70%, 40%)`;
};


export const calculateRemainingDays = (closingDate: string): number => {
  if (!closingDate) return Number.MAX_SAFE_INTEGER;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to compare just the date part

    const closing = new Date(closingDate);
    if (isNaN(closing.getTime())) return Number.MAX_SAFE_INTEGER;
    closing.setHours(0, 0, 0, 0); // Set to midnight

    const diff = closing.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch (e) {
    return Number.MAX_SAFE_INTEGER;
  }
};

export const getRemainingDaysInfo = (days: number): { text: string; textColor: string; bgColor: string; ringColor: string; animation: string } => {
  if (days < 0) {
    return {
      text: 'Closed',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-600/30',
      ringColor: '',
      animation: ''
    };
  }
  if (days === 0) {
    return {
      text: 'Closes today',
      textColor: 'text-red-300',
      bgColor: 'bg-red-600/55',
      ringColor: 'ring-2 ring-red-500',
      animation: 'animate-pulse-status'
    };
  }
  if (days === 1) {
    return {
      text: '1 day left',
      textColor: 'text-orange-300',
      bgColor: 'bg-orange-500/35',
      ringColor: '',
      animation: ''
    };
  }
  if (days <= 7) {
    return {
      text: `${days} days left`,
      textColor: 'text-orange-300',
      bgColor: 'bg-orange-500/35',
      ringColor: '',
      animation: ''
    };
  }
   if (days <= 14) {
    return {
      text: `${days} days left`,
      textColor: 'text-yellow-300',
      bgColor: 'bg-yellow-500/25',
      ringColor: '',
      animation: ''
    };
  }
  return {
    text: `${days} days left`,
    textColor: 'text-green-300',
    bgColor: 'bg-green-500/25',
    ringColor: '',
    animation: ''
  };
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

export const exportToCsv = (data: any[], fileName: string): void => {
  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row =>
      headers.map(fieldName => {
        let value = row[fieldName];
        if (value === null || value === undefined) {
          value = '';
        }
        // Stringify and escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ];
  
  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getContrastingTextColor = (hexcolor: string): string => {
  if (!hexcolor) return '#000000';
  const hex = hexcolor.startsWith('#') ? hexcolor.slice(1) : hexcolor;
  if (hex.length !== 6) return '#000000';
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Using the YIQ formula to determine brightness
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

export const calculateTenderValue = (item: WatchlistItem): number => {
    const subtotal = item.quoteItems?.reduce((acc, q) => acc + q.quantity * q.unitPrice, 0) || 0;
    const delivery = item.financialDetails?.deliveryCost ?? 0;
    const installation = item.financialDetails?.installationCost ?? 0;
    const vat = subtotal * ((item.financialDetails?.vatPercentage ?? 0) / 100);
    return subtotal + delivery + installation + vat;
};

export const getStatusColors = (status: TenderStatus): { bg: string, text: string, ring: string } => {
  const statusColorMap: Record<TenderStatus, { bg: string, text: string, ring: string }> = {
    [TenderStatus.WATCHING]: { bg: 'bg-blue-500/30', text: 'text-blue-200', ring: 'ring-blue-500/30' },
    [TenderStatus.APPLYING]: { bg: 'bg-yellow-500/30', text: 'text-yellow-200', ring: 'ring-yellow-500/30' },
    [TenderStatus.SUBMITTED]: { bg: 'bg-purple-500/30', text: 'text-purple-200', ring: 'ring-purple-500/30' },
    [TenderStatus.WON]: { bg: 'bg-green-500/30', text: 'text-green-200', ring: 'ring-green-500/30' },
    [TenderStatus.LOST]: { bg: 'bg-red-500/30', text: 'text-red-200', ring: 'ring-red-500/30' },
    [TenderStatus.ARCHIVED]: { bg: 'bg-slate-500/30', text: 'text-slate-300', ring: 'ring-slate-500/30' },
  };
  return statusColorMap[status];
};