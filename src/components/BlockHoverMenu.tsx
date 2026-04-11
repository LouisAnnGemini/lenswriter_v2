import React from 'react';
import { Plus, MoreVertical, Highlighter, ArrowUpToLine, Scissors, GitCompare, Trash2, Archive } from 'lucide-react';
import { cn } from '../lib/utils';

interface BlockHoverMenuProps {
  blockId: string;
  docId: string;
  isLens: boolean;
  canMergeUp: boolean;
  isScene: boolean;
  openMenuBlockId: string | null;
  setOpenMenuBlockId: (id: string | null) => void;
  handleAddBlock: (isLens: boolean, blockId: string, docId: string) => void;
  handleBlockChange: (blockId: string, updates: any) => void;
  handleMergeUp: (blockId: string) => void;
  handleSplitScene: (blockId: string) => void;
  setComparingBlockId: (blockId: string | null) => void;
  handleDeleteBlock: (blockId: string) => void;
}

export function BlockHoverMenu({
  blockId,
  docId,
  isLens,
  canMergeUp,
  isScene,
  openMenuBlockId,
  setOpenMenuBlockId,
  handleAddBlock,
  handleBlockChange,
  handleMergeUp,
  handleSplitScene,
  setComparingBlockId,
  handleDeleteBlock
}: BlockHoverMenuProps) {
  return (
    <div className="absolute top-0 bottom-0 -left-10 w-10 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="sticky top-8 flex items-center space-x-1">
        <button 
          onClick={() => handleAddBlock(false, blockId, docId)}
          className="p-1 text-stone-300 hover:text-emerald-600 hover:bg-stone-100 rounded transition-colors"
          title="Add Text Block Below"
        >
          <Plus size={16} />
        </button>
        <div className="relative">
          <button 
            onClick={() => setOpenMenuBlockId(openMenuBlockId === blockId ? null : blockId)}
            className={cn("p-1 rounded transition-colors", openMenuBlockId === blockId ? "text-stone-600 bg-stone-100" : "text-stone-300 hover:text-stone-600 hover:bg-stone-100")}
            title="More Actions"
          >
            <MoreVertical size={16} />
          </button>
          {openMenuBlockId === blockId && (
            <div className="absolute left-full top-0 ml-1 flex items-center space-x-1 bg-white shadow-sm rounded-md border border-stone-200 p-1 z-20">
              <button 
                onClick={() => {
                  handleBlockChange(blockId, { isLens: !isLens });
                  setOpenMenuBlockId(null);
                }}
                className="p-1 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                title={isLens ? "Convert to Normal Block" : "Convert to Lens Block"}
              >
                <Highlighter size={14} />
              </button>
              {canMergeUp && (
                <button 
                  onClick={() => {
                    handleMergeUp(blockId);
                    setOpenMenuBlockId(null);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                  title="Merge with previous text block"
                >
                  <ArrowUpToLine size={14} />
                </button>
              )}
              {isScene && (
                <button 
                  onClick={() => {
                    handleSplitScene(blockId);
                    setOpenMenuBlockId(null);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                  title="Split Scene After This Block"
                >
                  <Scissors size={14} />
                </button>
              )}
              <button 
                onClick={() => {
                  setComparingBlockId(blockId);
                  setOpenMenuBlockId(null);
                }}
                className="p-1 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Compare & Edit"
              >
                <GitCompare size={14} />
              </button>
              <button 
                onClick={() => {
                  handleBlockChange(blockId, { isStashed: true, isLens: true, lensColor: 'white' });
                  setOpenMenuBlockId(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                title="Stash Block"
              >
                <Archive size={14} />
              </button>
              <button 
                onClick={() => {
                  handleDeleteBlock(blockId);
                  setOpenMenuBlockId(null);
                }}
                className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Block"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
