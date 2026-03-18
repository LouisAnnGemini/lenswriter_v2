import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function ConfirmDeleteButton({ 
  onConfirm, 
  className,
  title = "Delete",
  iconSize = 16
}: { 
  onConfirm: () => void;
  className?: string;
  title?: string;
  iconSize?: number;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center space-x-2 bg-red-50 px-2 py-1 rounded-md border border-red-100">
        <span className="text-xs font-medium text-red-600 whitespace-nowrap">Sure?</span>
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm(); setConfirming(false); }}
          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
          className="text-xs bg-stone-200 text-stone-700 px-2 py-1 rounded hover:bg-stone-300 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
      className={cn("text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors", className)}
      title={title}
    >
      <Trash2 size={iconSize} />
    </button>
  );
}
