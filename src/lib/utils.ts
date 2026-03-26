import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function countWords(text: string): number {
  if (!text) return 0;
  // Count Chinese characters
  const chineseMatches = text.match(/[\u4e00-\u9fa5]/g);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;

  // Remove Chinese characters to count English words
  const textWithoutChinese = text.replace(/[\u4e00-\u9fa5]/g, ' ');
  
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
