import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Highlighter, Plus, X, Search, ArrowLeft, Link as LinkIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  brown: 'bg-orange-200 border-orange-200 text-orange-900',
  black: 'bg-stone-900 border-stone-700 text-stone-100',
};

function LensNoteTextarea({ lens }: { lens: any }) {
  const updateBlock = useStore(state => state.updateBlock);
  return (
    <textarea
      value={lens.notes || ''}
      onChange={(e) => {
        updateBlock({ id: lens.id, notes: e.target.value });
      }}
      placeholder="Add private notes, lore, or ideas here..."
      className="w-full h-24 p-2 rounded-lg border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-stone-700"
    />
  );
}

export function LensesPanel({ documentId, onClose, onNavigateToBlock }: { documentId: string, onClose: () => void, onNavigateToBlock: (blockId: string) => void }) {
  const { 
    blocks, 
    chapters, 
    scenes, 
    activeWorkId, 
    activeLensId, 
    addBlock, 
    removeLens 
  } = useStore(useShallow(state => ({
    blocks: state.blocks,
    chapters: state.chapters,
    scenes: state.scenes,
    activeWorkId: state.activeWorkId,
    activeLensId: state.activeLensId,
    addBlock: state.addBlock,
    removeLens: state.removeLens
  })));
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLensId, setExpandedLensId] = useState<string | null>(null);
  const lensRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    if (activeLensId && lensRefs.current[activeLensId]) {
      lensRefs.current[activeLensId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLensId]);

  const workChapters = chapters.filter(c => c.workId === activeWorkId);
  const workScenes = scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  const documentIds = [...workChapters.map(c => c.id), ...workScenes.map(s => s.id)];
  
  const allLenses = blocks.filter(b => b.isLens && documentIds.includes(b.documentId));
  
  const filteredLenses = allLenses.filter(l => {
    if (!searchTerm) return true;
    return l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleAddLens = (color: string) => {
    addBlock({
      documentId,
      type: 'text',
      isLens: true,
      lensColor: color
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-stone-200 bg-white">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Add Lens</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LENS_COLORS).map(([color, classes]) => (
            <button
              key={color}
              onClick={() => handleAddLens(color)}
              className={cn(
                "w-6 h-6 rounded-md transition-all border hover:scale-110",
                classes.split(' ')[0],
                classes.split(' ')[1]
              )}
              title={`Add ${color} lens to current document`}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-stone-200 bg-white">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search all lenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredLenses.length === 0 ? (
          <div className="text-center text-xs text-stone-500 py-4">No lenses found.</div>
        ) : (
          filteredLenses.map(lens => (
            <div 
              key={lens.id} 
              ref={el => lensRefs.current[lens.id] = el}
              className={cn(
                "p-3 rounded-lg border text-sm shadow-sm transition-colors",
                LENS_COLORS[lens.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.black,
                activeLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-1"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="text-sm font-medium mb-1 flex-1 cursor-pointer line-clamp-2" onClick={() => setExpandedLensId(expandedLensId === lens.id ? null : lens.id)}>
                  {lens.content}
                </div>
                <div className="flex items-center ml-2">
                  <button
                    onClick={() => onNavigateToBlock(lens.id)}
                    className="p-1 hover:bg-black/5 rounded transition-colors"
                    title="Jump to Text"
                  >
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
              
              {expandedLensId === lens.id && (
                <div className="mt-3 pt-3 border-t border-black/10 space-y-3">
                  <LensNoteTextarea lens={lens} />
                  
                  {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lens.linkedLensIds.map((linkedId: string) => {
                        const linkedLens = blocks.find((b: any) => b.id === linkedId);
                        if (!linkedLens) return null;
                        return (
                          <button
                            key={linkedId}
                            onClick={() => onNavigateToBlock(linkedId)}
                            className={cn(
                              "text-xs flex items-center px-2 py-1 rounded transition-colors font-medium",
                              lens.lensColor === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                            )}
                          >
                            <LinkIcon size={10} className="mr-1 shrink-0" />
                            <span className="truncate max-w-[200px]">
                              {linkedLens.lensColor === 'black' ? 'Hidden Content' : (linkedLens.content || 'Empty lens')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={() => removeLens(lens.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      title="Remove Lens (keep text)"
                    >
                      Remove Lens
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
