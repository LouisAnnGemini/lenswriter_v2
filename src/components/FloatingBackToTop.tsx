import React from 'react';
import { cn } from '../lib/utils';
import { ArrowUpToLine } from 'lucide-react';

interface FloatingBackToTopProps {
  showBackToTop: boolean;
  disguiseMode: boolean;
  rightSidebarMode: string;
  isFullscreenMode: boolean;
  scrollToTop: () => void;
}

export function FloatingBackToTop({
  showBackToTop,
  disguiseMode,
  rightSidebarMode,
  isFullscreenMode,
  scrollToTop
}: FloatingBackToTopProps) {
  if (!showBackToTop || disguiseMode) return null;

  return (
    <div className={cn(
      "fixed bottom-32 z-50 transition-all duration-300",
      rightSidebarMode !== 'closed' ? "right-[340px]" : "right-6",
      isFullscreenMode ? "opacity-0 hover:opacity-100" : "opacity-100"
    )}>
      <button
        onClick={scrollToTop}
        className="p-3 bg-white border border-stone-200 text-stone-500 hover:text-emerald-600 hover:border-emerald-200 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
        title="Back to Top"
      >
        <ArrowUpToLine size={24} className="group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
