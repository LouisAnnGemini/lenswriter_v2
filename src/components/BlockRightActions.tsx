import React from 'react';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Block } from '../store/types';

interface BlockRightActionsProps {
  block: Block;
  toggleBlockDescription: (block: Block) => void;
  handleBlockChange: (blockId: string, updates: any) => void;
}

export function BlockRightActions({
  block,
  toggleBlockDescription,
  handleBlockChange
}: BlockRightActionsProps) {
  return (
    <div className="relative w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="sticky top-8 flex flex-col items-center space-y-2">
        <button 
          onClick={() => toggleBlockDescription(block)}
          className={cn("p-1.5 rounded-md transition-colors", block.description !== undefined ? "text-emerald-600 bg-emerald-50" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
          title="Block Description"
        >
          <MessageSquare size={16} />
        </button>
        <button 
          onClick={() => handleBlockChange(block.id, { completed: !block.completed })}
          className={cn("p-1.5 rounded-md transition-colors", block.completed ? "text-emerald-600 bg-emerald-50" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
          title="Toggle Completion"
        >
          <CheckCircle2 size={16} />
        </button>
      </div>
    </div>
  );
}
