import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtml(html: string): string {
  if (!html) return '';
  if (!html.includes('<') || !html.includes('>')) return html;
  
  // Replace paragraph ends and line breaks with newlines to preserve structure
  const formattedHtml = html
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<\/p>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n');
    
  const doc = new DOMParser().parseFromString(formattedHtml, 'text/html');
  return (doc.body.textContent || "").trim();
}

export function countWords(text: string): number {
  if (!text) return 0;
  
  // Strip HTML tags if present (since Tiptap uses HTML)
  const plainText = text.replace(/<[^>]*>?/gm, ' ');

  // Count Chinese characters
  const chineseMatches = plainText.match(/[\u4e00-\u9fa5]/g);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;

  // Remove Chinese characters to count English words
  const textWithoutChinese = plainText.replace(/[\u4e00-\u9fa5]/g, ' ');
  
  // Count English words (alphanumeric sequences)
  const englishMatches = textWithoutChinese.match(/[a-zA-Z0-9]+/g);
  const englishCount = englishMatches ? englishMatches.length : 0;

  return chineseCount + englishCount;
}

export function getDeviceType(): 'Desktop' | 'Mobile' {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())) {
    return 'Mobile';
  }
  return 'Desktop';
}
