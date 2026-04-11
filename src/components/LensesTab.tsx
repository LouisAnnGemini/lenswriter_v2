import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Layers, MapPin, Edit2, Link as LinkIcon, X, Plus, Lock, Filter, ExternalLink, Search, Pin, Archive, ArrowLeftToLine, ChevronDown, ChevronRight, RotateCcw, FileText } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { cn, stripHtml } from '../lib/utils';

const LENS_COLORS = {
  red: 'bg-red-50/80 border-red-200 text-red-900 hover:bg-red-50',
  blue: 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-50',
  green: 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-50',
  yellow: 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-50',
  purple: 'bg-purple-50/80 border-purple-200 text-purple-900 hover:bg-purple-50',
  brown: 'bg-orange-200 border-orange-200 text-orange-900 hover:bg-orange-200',
  black: 'bg-stone-900 border-stone-700 text-stone-100 hover:bg-stone-800',
  white: 'bg-white border-stone-200 text-stone-900 hover:bg-stone-50',
};

export function LensesTab({ isSubTab }: { isSubTab?: boolean }) {
  const { 
    activeWorkId, 
    works, 
    activeLensId: selectedLensId, 
    chapters, 
    scenes, 
    blocks,
    updateBlock,
    addBlock,
    setActiveTab,
    setActiveDocument,
    updateWork,
    setActiveLens,
    toggleLensPin
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    works: state.works,
    activeLensId: state.activeLensId,
    chapters: state.chapters,
    scenes: state.scenes,
    blocks: state.blocks,
    updateBlock: state.updateBlock,
    addBlock: state.addBlock,
    setActiveTab: state.setActiveTab,
    setActiveDocument: state.setActiveDocument,
    updateWork: state.updateWork,
    setActiveLens: state.setActiveLens,
    toggleLensPin: state.toggleLensPin
  })));

  const activeWork = works.find(w => w.id === activeWorkId);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [filterChapterIds, setFilterChapterIds] = useState<string[]>([]);
  const [privateSearchTerm, setPrivateSearchTerm] = useState('');
  const [newLensContent, setNewLensContent] = useState('');
  const [selectedAddColor, setSelectedAddColor] = useState<string>('red');
  const [insertingLens, setInsertingLens] = useState<any | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedLensId) {
      // Scroll to the selected lens card
      setTimeout(() => {
        const el = document.getElementById(`lens-card-${selectedLensId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [selectedLensId]);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  }, [activeWork?.lensesDescription]);

  useEffect(() => {
    // Repair logic: If a lens is NOT stashed but its documentId is the workId, 
    // it means it was promoted without a target. Stash it back.
    if (!activeWorkId) return;
    const orphanedLenses = blocks.filter(b => b.isLens && !b.isStashed && b.documentId === activeWorkId);
    orphanedLenses.forEach(l => {
      updateBlock({ id: l.id, isStashed: true, isLens: true, lensColor: 'white' });
    });
  }, [blocks, activeWorkId, updateBlock]);

  if (!activeWorkId) return <div className="flex-1 flex items-center justify-center text-stone-400">Select a work</div>;

  // Get all lenses for the active work
  const workChapters = chapters.filter(c => c.workId === activeWorkId);
  const workScenes = scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  const documentIds = [activeWorkId || '', ...workChapters.map(c => c.id), ...workScenes.map(s => s.id)];
  
  let allLenses = blocks.filter(b => b.isLens && documentIds.includes(b.documentId));
  
  // Apply filters
  if (filterColors.length > 0) {
    allLenses = allLenses.filter(l => l.lensColor && filterColors.includes(l.lensColor));
  }

  if (filterChapterIds.length > 0) {
    allLenses = allLenses.filter(l => {
      // Direct chapter lens
      if (filterChapterIds.includes(l.documentId)) return true;
      
      // Scene lens belonging to this chapter
      const scene = scenes.find(s => s.id === l.documentId);
      if (scene && filterChapterIds.includes(scene.chapterId)) return true;
      
      return false;
    });
  }

  if (privateSearchTerm) {
    const term = privateSearchTerm.toLowerCase();
    allLenses = allLenses.filter(l => (l.notes && l.notes.toLowerCase().includes(term)) || (l.content && l.content.toLowerCase().includes(term)));
  }

  const lensesViewMode = useStore(state => state.lensesViewMode);

  // Filter based on lensesViewMode
  const displayLenses = allLenses.filter(l => lensesViewMode === 'stash' ? l.isStashed : !l.isStashed);

  const pinnedLenses = displayLenses.filter(l => l.pinned);
  const unpinnedLenses = displayLenses.filter(l => !l.pinned);

  const getLensLocation = (docId: string) => {
    if (docId === activeWorkId) return 'Stashed Pool';
    const scene = scenes.find(s => s.id === docId);
    if (scene) {
      const chapter = chapters.find(c => c.id === scene.chapterId);
      return `${chapter?.title || 'Unknown Chapter'} > ${scene.title}`;
    }
    const chapter = chapters.find(c => c.id === docId);
    return chapter?.title || 'Unknown Location';
  };

  const handleUpdateLens = (id: string, updates: any) => {
    updateBlock({ id, ...updates });
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

  const handleAddStashedLens = () => {
    if (!newLensContent.trim()) return;
    const id = crypto.randomUUID();
    addBlock({
      id,
      documentId: activeWorkId || '',
      type: 'text',
      isLens: true,
      lensColor: 'white',
      isStashed: true
    });
    updateBlock({ id, notes: newLensContent.trim() });
    setNewLensContent('');
  };

  const handlePromote = (lens: any, targetDocId?: string) => {
    if (!targetDocId) {
      setInsertingLens(lens);
      return;
    }
    updateBlock({
      id: lens.id,
      isStashed: false,
      isLens: true,
      lensColor: 'red',
      documentId: targetDocId
    });
    setInsertingLens(null);
  };

  const handleStash = (lens: any) => {
    updateBlock({
      id: lens.id,
      isStashed: true,
      isLens: true,
      lensColor: 'white'
    });
  };

  const scrollToLens = (lensId: string) => {
    const el = document.getElementById(`lens-card-${lensId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-2'), 2000);
    }
  };

  const handleNavigateToLens = (lensId: string, documentId: string) => {
    setActiveTab('design');
    setActiveDocument(documentId);
    setTimeout(() => {
      const el = document.getElementById(`block-${lensId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2'), 2000);
      }
    }, 100);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-stone-50/50">
      {/* Lenses Grid */}
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 transition-all pb-24 md:pb-6", selectedLensId ? "hidden md:block md:pr-96" : "")}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-8 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-serif font-semibold text-stone-900">
                {lensesViewMode === 'stash' ? 'Stash' : 'Color Lenses'}
              </h2>
              <textarea
                ref={descriptionRef}
                value={activeWork?.lensesDescription ?? "Global summary of all highlighted information."}
                onChange={(e) => {
                  updateWork({ id: activeWorkId, lensesDescription: e.target.value });
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="text-base md:text-sm text-stone-500 mt-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-emerald-500 outline-none w-full transition-colors resize-none overflow-hidden block"
                placeholder="Enter a description for your lenses..."
                rows={1}
                style={{ minHeight: '24px' }}
              />
            </div>

            {/* Add Lens Section */}
            {lensesViewMode === 'stash' && (
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Add Stashed Lens</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <textarea
                    value={newLensContent}
                    onChange={(e) => setNewLensContent(e.target.value)}
                    placeholder="Record a foreshadowing, plot hole, or idea..."
                    className="flex-1 p-3 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-20 bg-stone-50"
                  />
                  <div className="flex flex-col justify-between items-end gap-3">
                    <button
                      onClick={handleAddStashedLens}
                      disabled={!newLensContent.trim()}
                      className="px-6 py-2 bg-stone-900 text-white text-sm font-bold rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Stashed Lens
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Search Line */}
              <div className="flex items-center space-x-2 bg-white border border-stone-200 rounded-lg px-4 py-2.5 shadow-sm w-full focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                <Search size={16} className="text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={privateSearchTerm}
                  onChange={(e) => setPrivateSearchTerm(e.target.value)}
                  placeholder="Search private notes..."
                  className="text-sm font-medium bg-transparent border-none outline-none text-stone-600 w-full placeholder:text-stone-400"
                />
                {privateSearchTerm && (
                  <button onClick={() => setPrivateSearchTerm('')} className="text-stone-400 hover:text-stone-600 p-1">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters Line */}
              <div className="flex flex-col space-y-4 bg-stone-100/50 p-4 rounded-xl border border-stone-200/60">
                {/* Chapter Multi-select */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-2 flex items-center">
                    <Filter size={10} className="mr-1" /> Chapters
                  </span>
                  <button 
                    onClick={() => setFilterChapterIds([])}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full border transition-all",
                      filterChapterIds.length === 0 
                        ? "bg-stone-900 border-stone-900 text-white font-bold shadow-sm" 
                        : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                    )}
                  >
                    All
                  </button>
                  {workChapters.sort((a, b) => a.order - b.order).map(chap => {
                    const isSelected = filterChapterIds.includes(chap.id);
                    return (
                      <button
                        key={chap.id}
                        onClick={() => {
                          setFilterChapterIds(prev => 
                            prev.includes(chap.id) ? prev.filter(id => id !== chap.id) : [...prev, chap.id]
                          );
                        }}
                        className={cn(
                          "px-3 py-1 text-xs rounded-full border transition-all",
                          isSelected 
                            ? "bg-emerald-100 border-emerald-500 text-emerald-700 font-bold shadow-sm" 
                            : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                        )}
                      >
                        {chap.title}
                      </button>
                    );
                  })}
                </div>

                {/* Color Multi-select */}
                {lensesViewMode === 'color' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-2 flex items-center">
                      <Layers size={10} className="mr-1" /> Colors
                    </span>
                    <button 
                      onClick={() => setFilterColors([])}
                      className={cn(
                        "px-3 py-1 text-xs rounded-full border transition-all",
                        filterColors.length === 0 
                          ? "bg-stone-900 border-stone-900 text-white font-bold shadow-sm" 
                          : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                      )}
                    >
                      All
                    </button>
                    {Object.keys(LENS_COLORS).filter(c => c !== 'white').map(color => {
                      const isSelected = filterColors.includes(color);
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            setFilterColors(prev => 
                              prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
                            );
                          }}
                          className={cn(
                            "group flex items-center space-x-2 px-3 py-1 text-xs rounded-full border transition-all",
                            isSelected 
                              ? "bg-white border-emerald-500 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-500/20" 
                              : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                          )}
                        >
                          <div 
                            className={cn(
                              "w-2.5 h-2.5 rounded-full border border-black/10",
                              color === 'red' && "bg-red-400",
                              color === 'blue' && "bg-blue-400",
                              color === 'green' && "bg-emerald-400",
                              color === 'yellow' && "bg-amber-400",
                              color === 'purple' && "bg-purple-400",
                              color === 'brown' && "bg-orange-400",
                              color === 'black' && "bg-stone-900"
                            )} 
                          />
                          <span>{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {pinnedLenses.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-emerald-700">
                  <Pin size={18} />
                  <h3 className="text-lg font-serif font-semibold">Pinned Lenses</h3>
                </div>
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {pinnedLenses.map(lens => (
                    <div 
                      key={lens.id}
                      id={`lens-card-${lens.id}`}
                      className={cn(
                        "break-inside-avoid rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group relative backdrop-blur-sm",
                        lens.isStashed ? LENS_COLORS.white : (LENS_COLORS[lens.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.red),
                        selectedLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-2 shadow-md"
                      )}
                      onClick={() => setActiveLens(lens.id)}
                    >
                      <div className="flex justify-between items-start mb-3 pb-2 border-b border-black/10">
                        <div className="flex items-center text-xs font-medium opacity-60">
                          <MapPin size={12} className="mr-1.5 shrink-0" />
                          <span className="truncate">{getLensLocation(lens.documentId)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLensPin(lens.id);
                            }}
                            className={cn("p-1 rounded transition-colors", lens.pinned ? "text-emerald-600 bg-emerald-100" : "text-stone-400 hover:text-emerald-600 hover:bg-black/5")}
                            title={lens.pinned ? "Unpin lens" : "Pin lens"}
                          >
                            <Pin size={14} fill={lens.pinned ? "currentColor" : "none"} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToLens(lens.id, lens.documentId);
                            }}
                            className="text-stone-500 hover:text-emerald-700 p-1 hover:bg-black/5 rounded transition-colors"
                            title="Go to location in text"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {lens.isStashed ? (
                        <div className="space-y-4">
                          {/* Stashed Card Content */}
                          <div>
                            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                              💡 Inspiration / Notes
                            </div>
                            <div className="text-sm text-stone-700 whitespace-pre-wrap line-clamp-6">
                              {lens.notes || <span className="italic opacity-50">No inspiration...</span>}
                            </div>
                          </div>
                          <div className="pt-3 border-t border-stone-100">
                            <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              <FileText size={10} /> Draft Content
                            </div>
                            <div className="text-xs text-stone-500 line-clamp-4">
                              {stripHtml(lens.content) || <span className="italic opacity-50">No draft...</span>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Normal Card Content */}
                          <div className="text-sm leading-relaxed font-medium line-clamp-6 mb-4">
                            {lens.lensColor === 'black' ? (
                              <span className="text-stone-500 italic flex items-center"><Lock size={14} className="mr-1"/> Hidden Content</span>
                            ) : (
                              stripHtml(lens.content) || <span className="italic opacity-50">Empty lens...</span>
                            )}
                          </div>

                          {lens.notes && (
                            <div className="mb-4 p-3 bg-white/50 rounded-lg text-xs text-stone-700 whitespace-pre-wrap border border-black/5">
                              <span className="font-bold block mb-1 opacity-70">Private Notes:</span>
                              {lens.notes}
                            </div>
                          )}
                        </>
                      )}

                      {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                        <div className="mb-4 pt-3 border-t border-black/10 flex flex-wrap gap-2">
                          {lens.linkedLensIds.map(linkedId => {
                            const linkedLens = allLenses.find(l => l.id === linkedId);
                            if (!linkedLens) return null;
                            return (
                              <button
                                key={linkedId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollToLens(linkedId);
                                }}
                                className={cn(
                                  "text-xs flex items-center px-2 py-1 rounded transition-colors font-medium",
                                  lens.lensColor === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                                )}
                              >
                                <LinkIcon size={10} className="mr-1 shrink-0" />
                                <span className="truncate max-w-[150px]">
                                  {linkedLens.isStashed ? (linkedLens.notes || 'Empty notes') : (linkedLens.lensColor === 'black' ? 'Hidden Content' : (stripHtml(linkedLens.content) || 'Empty lens'))}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-black/10">
                        <div className="flex items-center space-x-3 text-xs font-semibold opacity-70">
                          {lens.notes && (
                            <span className="flex items-center"><Edit2 size={12} className="mr-1" /> Note</span>
                          )}
                          {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                            <span className="flex items-center"><LinkIcon size={12} className="mr-1" /> {lens.linkedLensIds.length}</span>
                          )}
                        </div>
                        <button 
                          className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-black/5 hover:bg-black/10 rounded-md text-xs font-bold transition-all"
                          onClick={(e) => { e.stopPropagation(); setActiveLens(lens.id); }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-serif font-semibold text-stone-900">
                {pinnedLenses.length > 0 ? "Other Lenses" : (lensesViewMode === 'stash' ? "Stashed Lenses" : "All Lenses")}
              </h3>
              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {unpinnedLenses.map(lens => (
                  <div 
                    key={lens.id}
                    id={`lens-card-${lens.id}`}
                    className={cn(
                      "break-inside-avoid rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group relative backdrop-blur-sm",
                      lens.isStashed ? LENS_COLORS.white : (LENS_COLORS[lens.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.red),
                      selectedLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-2 shadow-md"
                    )}
                    onClick={() => setActiveLens(lens.id)}
                  >
                    <div className="flex justify-between items-start mb-3 pb-2 border-b border-black/10">
                      <div className="flex items-center text-xs font-medium opacity-60">
                        <MapPin size={12} className="mr-1.5 shrink-0" />
                        <span className="truncate">{getLensLocation(lens.documentId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLensPin(lens.id);
                          }}
                          className={cn("p-1 rounded transition-colors", lens.pinned ? "text-emerald-600 bg-emerald-100" : "text-stone-400 hover:text-emerald-600 hover:bg-black/5")}
                          title={lens.pinned ? "Unpin lens" : "Pin lens"}
                        >
                          <Pin size={14} fill={lens.pinned ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToLens(lens.id, lens.documentId);
                          }}
                          className="text-stone-500 hover:text-emerald-700 p-1 hover:bg-black/5 rounded transition-colors"
                          title="Go to location in text"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {lens.isStashed ? (
                      <div className="space-y-4">
                        {/* Stashed Card Content */}
                        <div>
                          <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                            💡 Inspiration / Notes
                          </div>
                          <div className="text-sm text-stone-700 whitespace-pre-wrap line-clamp-6">
                            {lens.notes || <span className="italic opacity-50">No inspiration...</span>}
                          </div>
                        </div>
                        <div className="pt-3 border-t border-stone-100">
                          <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            <FileText size={10} /> Draft Content
                          </div>
                          <div className="text-xs text-stone-500 line-clamp-4">
                            {stripHtml(lens.content) || <span className="italic opacity-50">No draft...</span>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Normal Card Content */}
                        <div className="text-sm leading-relaxed font-medium line-clamp-6 mb-4">
                          {lens.lensColor === 'black' ? (
                            <span className="text-stone-500 italic flex items-center"><Lock size={14} className="mr-1"/> Hidden Content</span>
                          ) : (
                            stripHtml(lens.content) || <span className="italic opacity-50">Empty lens...</span>
                          )}
                        </div>

                        {lens.notes && (
                          <div className="mb-4 p-3 bg-white/50 rounded-lg text-xs text-stone-700 whitespace-pre-wrap border border-black/5">
                            <span className="font-bold block mb-1 opacity-70">Private Notes:</span>
                            {lens.notes}
                          </div>
                        )}
                      </>
                    )}

                    {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                      <div className="mb-4 pt-3 border-t border-black/10 flex flex-wrap gap-2">
                        {lens.linkedLensIds.map(linkedId => {
                          const linkedLens = allLenses.find(l => l.id === linkedId);
                          if (!linkedLens) return null;
                          return (
                            <button
                              key={linkedId}
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToLens(linkedId);
                              }}
                              className={cn(
                                "text-xs flex items-center px-2 py-1 rounded transition-colors font-medium",
                                lens.lensColor === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                              )}
                            >
                              <LinkIcon size={10} className="mr-1 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {linkedLens.isStashed ? (linkedLens.notes || 'Empty notes') : (linkedLens.lensColor === 'black' ? 'Hidden Content' : (stripHtml(linkedLens.content) || 'Empty lens'))}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-black/10">
                      <div className="flex items-center space-x-3 text-xs font-semibold opacity-70">
                        {lens.notes && (
                          <span className="flex items-center"><Edit2 size={12} className="mr-1" /> Note</span>
                        )}
                        {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                          <span className="flex items-center"><LinkIcon size={12} className="mr-1" /> {lens.linkedLensIds.length}</span>
                        )}
                      </div>
                      <button 
                        className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-black/5 hover:bg-black/10 rounded-md text-xs font-bold transition-all"
                        onClick={(e) => { e.stopPropagation(); setActiveLens(lens.id); }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scene Selection Modal */}
      {insertingLens && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <h3 className="font-bold text-stone-900 flex items-center">
                <ArrowLeftToLine size={18} className="mr-2 text-emerald-500" />
                Insert Lens into Text
              </h3>
              <button 
                onClick={() => setInsertingLens(null)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              <p className="text-xs text-stone-500 font-medium px-1">Select a scene to insert this lens into:</p>
              
              {workChapters.sort((a, b) => a.order - b.order).map(chapter => {
                const chapterScenes = scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
                if (chapterScenes.length === 0) return null;
                
                return (
                  <div key={chapter.id} className="space-y-1">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-1">
                      {chapter.title}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {chapterScenes.map(scene => (
                        <button
                          key={scene.id}
                          onClick={() => handlePromote(insertingLens, scene.id)}
                          className="flex items-center justify-between w-full p-3 text-left text-sm font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl border border-transparent hover:border-emerald-200 transition-all group"
                        >
                          <span>{scene.title}</span>
                          <Plus size={14} className="opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {workScenes.length === 0 && (
                <div className="text-center py-8 text-stone-400 text-sm italic">
                  No scenes found in this work.
                </div>
              )}
            </div>
            
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setInsertingLens(null)}
                className="px-4 py-2 text-sm font-bold text-stone-500 hover:text-stone-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Sidebar */}
      {selectedLensId && (
        <div className="w-full md:w-96 border-l border-stone-200 bg-white shadow-2xl fixed right-0 top-0 md:top-14 bottom-0 z-50 md:z-20 flex flex-col animate-in slide-in-from-right-8 duration-300 pb-safe">
          {(() => {
            const lens = allLenses.find(l => l.id === selectedLensId);
            if (!lens) return null;

            return (
              <>
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 pt-safe-top">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900 flex items-center">
                      <Layers size={16} className="mr-2 text-stone-400" />
                      Lens Details
                    </h3>
                    <button
                      onClick={() => toggleLensPin(lens.id)}
                      className={cn(
                        "p-1 rounded-md transition-all",
                        lens.pinned 
                          ? "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200" 
                          : "text-stone-400 hover:text-emerald-600 hover:bg-stone-100"
                      )}
                      title={lens.pinned ? "Unpin lens" : "Pin lens"}
                    >
                      <Pin size={14} fill={lens.pinned ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <button 
                    onClick={() => setActiveLens(null)}
                    className="p-2 md:p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
                  >
                    <X size={20} className="md:w-4 md:h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-24 md:pb-6">
                  {/* Color Selection */}
                  {!lens.isStashed && (
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Color</label>
                      <div className="flex space-x-2">
                        {Object.keys(LENS_COLORS).filter(c => c !== 'white').map(color => (
                          <button
                            key={color}
                            onClick={() => handleUpdateLens(lens.id, { lensColor: color })}
                            className={cn(
                              "w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                              color === 'red' && "bg-red-400",
                              color === 'blue' && "bg-blue-400",
                              color === 'green' && "bg-emerald-400",
                              color === 'yellow' && "bg-amber-400",
                              color === 'purple' && "bg-purple-400",
                              color === 'brown' && "bg-orange-400",
                              color === 'black' && "bg-stone-900",
                              lens.lensColor === color && "ring-2 ring-offset-2 ring-stone-400"
                            )}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Content/Notes Order based on isStashed */}
                  {lens.isStashed ? (
                    <>
                      {/* Private Notes (Primary for Stashed) */}
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span className="text-amber-600">💡 Inspiration / Notes</span>
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">Primary</span>
                        </label>
                        <textarea
                          value={lens.notes || ''}
                          onChange={(e) => handleUpdateLens(lens.id, { notes: e.target.value })}
                          placeholder="Add inspiration, lore, or ideas here..."
                          className="w-full h-48 p-4 rounded-lg border border-amber-200 bg-amber-50 resize-none outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-base md:text-sm text-stone-700 shadow-inner transition-colors"
                        />
                      </div>

                      {/* Content Edit (Secondary for Stashed) */}
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Draft Content</label>
                        <textarea
                          value={lens.content || ''}
                          onChange={(e) => handleUpdateLens(lens.id, { content: e.target.value })}
                          placeholder="Write draft here..."
                          className="w-full h-32 p-3 rounded-lg border border-stone-200 bg-white resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 text-base md:text-sm font-medium leading-relaxed transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Content Edit (Primary for Normal Lenses) */}
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Content</label>
                        <textarea
                          value={lens.content || ''}
                          onChange={(e) => handleUpdateLens(lens.id, { content: e.target.value })}
                          placeholder={lens.lensColor === 'black' ? "Hidden content..." : "Enter lens content..."}
                          className={cn(
                            "w-full h-48 p-4 rounded-lg border resize-none outline-none text-base md:text-sm font-medium leading-relaxed shadow-inner transition-colors",
                            LENS_COLORS[lens.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.red,
                            lens.lensColor === 'black' ? "text-transparent focus:text-stone-100 placeholder:text-stone-700 focus:placeholder:text-stone-500 selection:bg-stone-700 selection:text-stone-100" : "focus:ring-2 focus:ring-emerald-500/20"
                          )}
                        />
                      </div>

                      {/* Private Notes (Secondary for Normal Lenses) */}
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Private Notes</span>
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">Not in editor</span>
                        </label>
                        <textarea
                          value={lens.notes || ''}
                          onChange={(e) => handleUpdateLens(lens.id, { notes: e.target.value })}
                          placeholder="Add private notes, lore, or ideas here..."
                          className="w-full h-32 p-3 rounded-lg border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-base md:text-sm text-stone-700"
                        />
                      </div>
                    </>
                  )}

                  {/* Linking */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Linked Lenses</label>
                    <MultiSelectDropdown
                      options={allLenses.filter(l => l.id !== lens.id).map(l => ({ id: l.id, title: (l.isStashed ? (l.notes || 'Empty notes') : stripHtml(l.content)).substring(0, 40) + '...' }))}
                      selectedIds={lens.linkedLensIds || []}
                      onChange={(ids) => handleToggleLink(lens.id, ids)}
                      placeholder="+ Link another lens..."
                    />
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
