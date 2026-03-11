import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Layers, MapPin, Edit2, Link as LinkIcon, X, Plus, Lock, Filter, ExternalLink, Search, Pin } from 'lucide-react';
import { cn } from '../lib/utils';

const LENS_COLORS = {
  red: 'bg-red-50/80 border-red-200 text-red-900 hover:bg-red-50',
  blue: 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-50',
  green: 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-50',
  yellow: 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-50',
  purple: 'bg-purple-50/80 border-purple-200 text-purple-900 hover:bg-purple-50',
  brown: 'bg-orange-200 border-orange-200 text-orange-900 hover:bg-orange-200',
  black: 'bg-stone-900 border-stone-700 text-stone-100 hover:bg-stone-800',
};

export function LensesTab() {
  const { state, dispatch } = useStore();
  const activeWorkId = state.activeWorkId;
  const activeWork = state.works.find(w => w.id === activeWorkId);
  const selectedLensId = state.activeLensId;
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [filterChapterIds, setFilterChapterIds] = useState<string[]>([]);
  const [privateSearchTerm, setPrivateSearchTerm] = useState('');
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

  if (!activeWorkId) return <div className="flex-1 flex items-center justify-center text-stone-400">Select a work</div>;

  // Get all lenses for the active work
  const workChapters = state.chapters.filter(c => c.workId === activeWorkId);
  const workScenes = state.scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  const documentIds = [...workChapters.map(c => c.id), ...workScenes.map(s => s.id)];
  
  let allLenses = state.blocks.filter(b => b.type === 'lens' && documentIds.includes(b.documentId));
  
  // Apply filters
  if (filterColors.length > 0) {
    allLenses = allLenses.filter(l => filterColors.includes(l.color));
  }

  if (filterChapterIds.length > 0) {
    allLenses = allLenses.filter(l => {
      // Direct chapter lens
      if (filterChapterIds.includes(l.documentId)) return true;
      
      // Scene lens belonging to this chapter
      const scene = state.scenes.find(s => s.id === l.documentId);
      if (scene && filterChapterIds.includes(scene.chapterId)) return true;
      
      return false;
    });
  }

  if (privateSearchTerm) {
    const term = privateSearchTerm.toLowerCase();
    allLenses = allLenses.filter(l => l.notes && l.notes.toLowerCase().includes(term));
  }

  const pinnedLenses = allLenses.filter(l => l.pinned);
  const unpinnedLenses = allLenses.filter(l => !l.pinned);

  const getLensLocation = (docId: string) => {
    const scene = state.scenes.find(s => s.id === docId);
    if (scene) {
      const chapter = state.chapters.find(c => c.id === scene.chapterId);
      return `${chapter?.title || 'Unknown Chapter'} > ${scene.title}`;
    }
    const chapter = state.chapters.find(c => c.id === docId);
    return chapter?.title || 'Unknown Location';
  };

  const handleUpdateLens = (id: string, updates: any) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...updates } });
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
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'writing' });
    dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: documentId });
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
      <div className={cn("flex-1 overflow-y-auto p-4 md:p-6 transition-all pb-24 md:pb-6", selectedLensId ? "hidden md:block md:pr-96" : "")}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-8 space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-serif font-semibold text-stone-900">Color Lenses</h2>
              <textarea
                ref={descriptionRef}
                value={activeWork?.lensesDescription ?? "Global summary of all highlighted information."}
                onChange={(e) => {
                  dispatch({ type: 'UPDATE_WORK', payload: { id: activeWorkId, lensesDescription: e.target.value } });
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="text-sm text-stone-500 mt-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-emerald-500 outline-none w-full transition-colors resize-none overflow-hidden block"
                placeholder="Enter a description for your lenses..."
                rows={1}
                style={{ minHeight: '24px' }}
              />
            </div>

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
                  {Object.keys(LENS_COLORS).map(color => {
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
                        LENS_COLORS[lens.color as keyof typeof LENS_COLORS] || LENS_COLORS.red,
                        selectedLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-2 shadow-md"
                      )}
                      onClick={() => dispatch({ type: 'SET_ACTIVE_LENS', payload: lens.id })}
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
                              dispatch({ type: 'TOGGLE_LENS_PIN', payload: lens.id });
                            }}
                            className={cn("p-1 rounded transition-colors", lens.pinned ? "text-emerald-600 bg-emerald-100" : "text-stone-400 hover:text-emerald-600 hover:bg-black/5")}
                            title={lens.pinned ? "Unpin lens" : "Pin lens"}
                          >
                            <Pin size={14} />
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
                      
                      <div className="text-sm leading-relaxed font-medium line-clamp-6 mb-4">
                        {lens.color === 'black' ? (
                          <span className="text-stone-500 italic flex items-center"><Lock size={14} className="mr-1"/> Hidden Content</span>
                        ) : (
                          lens.content || <span className="italic opacity-50">Empty lens...</span>
                        )}
                      </div>

                      {lens.notes && (
                        <div className="mb-4 p-3 bg-white/50 rounded-lg text-xs text-stone-700 whitespace-pre-wrap border border-black/5">
                          <span className="font-bold block mb-1 opacity-70">Private Notes:</span>
                          {lens.notes}
                        </div>
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
                                  lens.color === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                                )}
                              >
                                <LinkIcon size={10} className="mr-1 shrink-0" />
                                <span className="truncate max-w-[150px]">
                                  {linkedLens.color === 'black' ? 'Hidden Content' : (linkedLens.content || 'Empty lens')}
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
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ACTIVE_LENS', payload: lens.id }); }}
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
              <h3 className="text-lg font-serif font-semibold text-stone-900">All Lenses</h3>
              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {unpinnedLenses.map(lens => (
                  <div 
                    key={lens.id}
                    id={`lens-card-${lens.id}`}
                    className={cn(
                      "break-inside-avoid rounded-xl border p-5 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer group relative backdrop-blur-sm",
                      LENS_COLORS[lens.color as keyof typeof LENS_COLORS] || LENS_COLORS.red,
                      selectedLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-2 shadow-md"
                    )}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_LENS', payload: lens.id })}
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
                            dispatch({ type: 'TOGGLE_LENS_PIN', payload: lens.id });
                          }}
                          className={cn("p-1 rounded transition-colors", lens.pinned ? "text-emerald-600 bg-emerald-100" : "text-stone-400 hover:text-emerald-600 hover:bg-black/5")}
                          title={lens.pinned ? "Unpin lens" : "Pin lens"}
                        >
                          <Pin size={14} />
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
                    
                    <div className="text-sm leading-relaxed font-medium line-clamp-6 mb-4">
                      {lens.color === 'black' ? (
                        <span className="text-stone-500 italic flex items-center"><Lock size={14} className="mr-1"/> Hidden Content</span>
                      ) : (
                        lens.content || <span className="italic opacity-50">Empty lens...</span>
                      )}
                    </div>

                    {lens.notes && (
                      <div className="mb-4 p-3 bg-white/50 rounded-lg text-xs text-stone-700 whitespace-pre-wrap border border-black/5">
                        <span className="font-bold block mb-1 opacity-70">Private Notes:</span>
                        {lens.notes}
                      </div>
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
                                lens.color === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                              )}
                            >
                              <LinkIcon size={10} className="mr-1 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {linkedLens.color === 'black' ? 'Hidden Content' : (linkedLens.content || 'Empty lens')}
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
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ACTIVE_LENS', payload: lens.id }); }}
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

      {/* Detail Sidebar */}
      {selectedLensId && (
        <div className="w-full md:w-96 border-l border-stone-200 bg-white shadow-2xl fixed right-0 top-0 md:top-14 bottom-0 z-50 md:z-20 flex flex-col animate-in slide-in-from-right-8 duration-300 pb-safe">
          {(() => {
            const lens = lenses.find(l => l.id === selectedLensId);
            if (!lens) return null;

            return (
              <>
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 pt-safe-top">
                  <h3 className="font-semibold text-stone-900 flex items-center">
                    <Layers size={16} className="mr-2 text-stone-400" />
                    Lens Details
                  </h3>
                  <button 
                    onClick={() => dispatch({ type: 'SET_ACTIVE_LENS', payload: null })}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Color Selection */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Color</label>
                    <div className="flex space-x-2">
                      {Object.keys(LENS_COLORS).map(color => (
                        <button
                          key={color}
                          onClick={() => handleUpdateLens(lens.id, { color })}
                          className={cn(
                            "w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110",
                            color === 'red' && "bg-red-400",
                            color === 'blue' && "bg-blue-400",
                            color === 'green' && "bg-emerald-400",
                            color === 'yellow' && "bg-amber-400",
                            color === 'purple' && "bg-purple-400",
                            color === 'brown' && "bg-orange-400",
                            color === 'black' && "bg-stone-900",
                            lens.color === color && "ring-2 ring-offset-2 ring-stone-400"
                          )}
                          title={color.charAt(0).toUpperCase() + color.slice(1)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Content Edit */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Content</label>
                    <textarea
                      value={lens.content}
                      onChange={(e) => handleUpdateLens(lens.id, { content: e.target.value })}
                      placeholder={lens.color === 'black' ? "Hidden content..." : "Enter lens content..."}
                      className={cn(
                        "w-full h-48 p-4 rounded-lg border resize-none outline-none text-sm font-medium leading-relaxed shadow-inner transition-colors",
                        LENS_COLORS[lens.color as keyof typeof LENS_COLORS] || LENS_COLORS.red,
                        lens.color === 'black' ? "text-transparent focus:text-stone-100 placeholder:text-stone-700 focus:placeholder:text-stone-500 selection:bg-stone-700 selection:text-stone-100" : "focus:ring-2 focus:ring-emerald-500/20"
                      )}
                    />
                  </div>

                  {/* Private Notes */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Private Notes</span>
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">Not in editor</span>
                    </label>
                    <textarea
                      value={lens.notes || ''}
                      onChange={(e) => handleUpdateLens(lens.id, { notes: e.target.value })}
                      placeholder="Add private notes, lore, or ideas here..."
                      className="w-full h-32 p-3 rounded-lg border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-stone-700"
                    />
                  </div>

                  {/* Linking */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Linked Lenses</label>
                    <div className="space-y-2">
                      {lens.linkedLensIds?.map(linkedId => {
                        const linkedLens = lenses.find(l => l.id === linkedId);
                        if (!linkedLens) return null;
                        return (
                          <div key={linkedId} className="flex items-center justify-between p-2 rounded-md border border-stone-200 bg-white text-sm">
                            <span className="truncate flex-1 mr-2 text-stone-600 font-medium">{linkedLens.content}</span>
                            <button 
                              onClick={() => handleUpdateLens(lens.id, { linkedLensIds: lens.linkedLensIds?.filter(id => id !== linkedId) })}
                              className="text-stone-400 hover:text-red-500 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                      
                      <div className="relative mt-2">
                        <select
                          className="w-full p-2 text-sm border border-stone-200 rounded-md bg-stone-50 text-stone-600 outline-none focus:border-emerald-500 appearance-none"
                          onChange={(e) => {
                            if (e.target.value) {
                              const newLinks = [...(lens.linkedLensIds || []), e.target.value];
                              handleUpdateLens(lens.id, { linkedLensIds: newLinks });
                              e.target.value = '';
                            }
                          }}
                          value=""
                        >
                          <option value="" disabled>+ Link another lens...</option>
                          {lenses.filter(l => l.id !== lens.id && !(lens.linkedLensIds || []).includes(l.id)).map(l => (
                            <option key={l.id} value={l.id}>{l.content.substring(0, 40)}...</option>
                          ))}
                        </select>
                        <Plus size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
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
