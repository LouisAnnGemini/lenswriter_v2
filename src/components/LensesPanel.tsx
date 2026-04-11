import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Highlighter, Plus, X, Search, ArrowLeft, Link as LinkIcon, ExternalLink, ArrowLeftToLine, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { cn, stripHtml } from '../lib/utils';

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
    removeLens,
    updateBlock
  } = useStore(useShallow(state => ({
    blocks: state.blocks,
    chapters: state.chapters,
    scenes: state.scenes,
    activeWorkId: state.activeWorkId,
    activeLensId: state.activeLensId,
    addBlock: state.addBlock,
    removeLens: state.removeLens,
    updateBlock: state.updateBlock
  })));
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLensId, setExpandedLensId] = useState<string | null>(null);
  const [newLensContent, setNewLensContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<keyof typeof LENS_COLORS>('red');
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [stashedExpanded, setStashedExpanded] = useState(true);
  const lensRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    if (activeLensId && lensRefs.current[activeLensId]) {
      lensRefs.current[activeLensId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLensId]);

  React.useEffect(() => {
    // Repair logic: If a lens is NOT stashed but its documentId is the workId, 
    // it means it was promoted without a target. Stash it back.
    if (!activeWorkId) return;
    const orphanedLenses = blocks.filter(b => b.isLens && !b.isStashed && b.documentId === activeWorkId);
    orphanedLenses.forEach(l => {
      updateBlock({ id: l.id, isStashed: true });
    });
  }, [blocks, activeWorkId, updateBlock]);

  const workChapters = chapters.filter(c => c.workId === activeWorkId);
  const workScenes = scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  const documentIds = [activeWorkId || '', ...workChapters.map(c => c.id), ...workScenes.map(s => s.id)];
  
  const allLenses = blocks.filter(b => b.isLens && documentIds.includes(b.documentId));
  
  const activeLenses = allLenses.filter(l => !l.isStashed);
  const stashedLenses = allLenses.filter(l => l.isStashed);

  const filterFn = (l: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (l.notes && l.notes.toLowerCase().includes(term)) || 
           (l.content && l.content.toLowerCase().includes(term));
  };

  const filteredActive = activeLenses.filter(filterFn);
  const filteredStashed = stashedLenses.filter(filterFn);

  const handleAddStashedLens = () => {
    if (!newLensContent.trim()) return;
    const id = crypto.randomUUID();
    addBlock({
      id,
      documentId: activeWorkId || '',
      type: 'text',
      isLens: true,
      lensColor: selectedColor,
      isStashed: true
    });
    updateBlock({ id, content: newLensContent.trim() });
    setNewLensContent('');
  };

  const handlePromote = (lens: any) => {
    updateBlock({
      id: lens.id,
      isStashed: false,
      documentId: documentId || lens.documentId
    });
  };

  const handleStash = (lens: any) => {
    updateBlock({
      id: lens.id,
      isStashed: true
    });
  };

  const handleToggleLink = (lensId: string, targetIds: string[]) => {
    const lens = blocks.find(b => b.id === lensId);
    if (!lens) return;

    const currentLinks = lens.linkedLensIds || [];
    const added = targetIds.filter(id => !currentLinks.includes(id));
    const removed = currentLinks.filter(id => !targetIds.includes(id));

    // Update the source lens
    updateBlock({ id: lensId, linkedLensIds: targetIds });

    // Update added lenses (add backlink)
    added.forEach(id => {
      const target = blocks.find(b => b.id === id);
      if (target) {
        const targetLinks = target.linkedLensIds || [];
        if (!targetLinks.includes(lensId)) {
          updateBlock({ id, linkedLensIds: [...targetLinks, lensId] });
        }
      }
    });

    // Update removed lenses (remove backlink)
    removed.forEach(id => {
      const target = blocks.find(b => b.id === id);
      if (target) {
        const targetLinks = target.linkedLensIds || [];
        if (targetLinks.includes(lensId)) {
          updateBlock({ id, linkedLensIds: targetLinks.filter(tid => tid !== lensId) });
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="p-4 border-b border-stone-200 bg-white">
        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Add Stashed Lens</h4>
        <div className="space-y-3">
          <textarea
            value={newLensContent}
            onChange={(e) => setNewLensContent(e.target.value)}
            placeholder="Record a foreshadowing, plot hole, or idea..."
            className="w-full p-2 text-sm border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-20 bg-stone-50"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Object.entries(LENS_COLORS).map(([color, classes]) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color as keyof typeof LENS_COLORS)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all border shadow-sm",
                    classes.split(' ')[0],
                    classes.split(' ')[1],
                    selectedColor === color ? "ring-2 ring-emerald-500 ring-offset-1 scale-110" : "hover:scale-110"
                  )}
                />
              ))}
            </div>
            <button
              onClick={handleAddStashedLens}
              disabled={!newLensContent.trim()}
              className="px-3 py-1 bg-stone-900 text-white text-xs font-medium rounded hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Stash
            </button>
          </div>
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

      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {/* Active Lenses Section */}
        <div>
          <button 
            onClick={() => setActiveExpanded(!activeExpanded)}
            className="flex items-center gap-2 w-full px-1 mb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
          >
            {activeExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Active Lenses ({filteredActive.length})
          </button>
          
          {activeExpanded && (
            <div className="space-y-3">
              {filteredActive.length === 0 ? (
                <div className="text-center text-[10px] text-stone-400 py-4 italic">No active lenses in text.</div>
              ) : (
                filteredActive.map(lens => renderLensItem(lens, false))
              )}
            </div>
          )}
        </div>

        {/* Stashed Lenses Section */}
        <div>
          <button 
            onClick={() => setStashedExpanded(!stashedExpanded)}
            className="flex items-center gap-2 w-full px-1 mb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors"
          >
            {stashedExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Stashed Pool ({filteredStashed.length})
          </button>
          
          {stashedExpanded && (
            <div className="space-y-3">
              {filteredStashed.length === 0 ? (
                <div className="text-center text-[10px] text-stone-400 py-4 italic">No stashed lenses.</div>
              ) : (
                filteredStashed.map(lens => renderLensItem(lens, true))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function renderLensItem(lens: any, isStashed: boolean) {
    return (
      <div 
        key={lens.id} 
        ref={el => { lensRefs.current[lens.id] = el; }}
        className={cn(
          "p-3 rounded-lg border text-sm shadow-sm transition-all group",
          LENS_COLORS[lens.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.black,
          activeLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-1"
        )}
      >
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium mb-1 flex-1 cursor-pointer line-clamp-2" onClick={() => setExpandedLensId(expandedLensId === lens.id ? null : lens.id)}>
            {stripHtml(lens.content)}
          </div>
          <div className="flex items-center ml-2 space-x-1 shrink-0">
            {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
              <div className="flex items-center text-[10px] font-bold bg-black/5 px-1.5 py-0.5 rounded-full text-black/40" title={`${lens.linkedLensIds.length} linked lenses`}>
                <LinkIcon size={10} className="mr-1" />
                {lens.linkedLensIds.length}
              </div>
            )}
            
            {isStashed ? (
              <button
                onClick={() => handlePromote(lens)}
                className="p-1 hover:bg-black/5 rounded transition-colors text-emerald-700"
                title="Insert into Text"
              >
                <ArrowLeftToLine size={14} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleStash(lens)}
                  className="p-1 hover:bg-black/5 rounded transition-colors text-stone-500"
                  title="Stash to Pool"
                >
                  <Archive size={14} />
                </button>
                <button
                  onClick={() => onNavigateToBlock(lens.id)}
                  className="p-1 hover:bg-black/5 rounded transition-colors"
                  title="Jump to Text"
                >
                  <ArrowLeft size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        
        {expandedLensId === lens.id && (
          <div className="mt-3 pt-3 border-t border-black/10 space-y-4">
            <LensNoteTextarea lens={lens} />
            
            {/* Outgoing Links */}
            <div>
              <label className="block text-[10px] font-bold text-black/40 uppercase tracking-wider mb-2 flex items-center">
                <LinkIcon size={10} className="mr-1" /> Linked Lenses
              </label>
              
              {/* List of currently linked lenses with navigation */}
              {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {lens.linkedLensIds.map((linkedId: string) => {
                    const linkedLens = allLenses.find(l => l.id === linkedId);
                    if (!linkedLens) return null;
                    return (
                      <button
                        key={linkedId}
                        onClick={() => {
                          setExpandedLensId(linkedId);
                          setTimeout(() => {
                            lensRefs.current[linkedId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                        className={cn(
                          "text-xs flex items-center px-2 py-1 rounded transition-colors font-medium",
                          lens.lensColor === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                        )}
                      >
                        <ExternalLink size={10} className="mr-1 shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {linkedLens.lensColor === 'black' ? 'Hidden Content' : (stripHtml(linkedLens.content) || 'Empty lens')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <MultiSelectDropdown
                options={allLenses.filter(l => l.id !== lens.id).map(l => ({ id: l.id, title: stripHtml(l.content).substring(0, 40) + '...' }))}
                selectedIds={lens.linkedLensIds || []}
                onChange={(ids) => handleToggleLink(lens.id, ids)}
                placeholder="+ Link another lens..."
              />
            </div>

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
    );
  }
}
