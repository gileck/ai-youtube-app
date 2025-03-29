/**
 * Format a number with commas for thousands and abbreviate large numbers
 * Pure function that formats numbers for display
 * 
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format a date string to a readable format
 * Pure function that formats dates for display
 * 
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Decode HTML entities in a string
 * @param text Text with HTML entities
 * @returns Decoded text
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x2F;': '/',
    '&#x2f;': '/',
    '&#x5C;': '\\',
    '&#x5c;': '\\',
    '&#x60;': '`',
    '&#x3D;': '=',
    '&#x3d;': '=',
    '&#x3C;': '<',
    '&#x3c;': '<',
    '&#x3E;': '>',
    '&#x3e;': '>',
  };
  
  return text.replace(/&[#\w]+;/g, match => entities[match] || match);
}
