import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { AlignLeft, Highlighter, Trash2, Maximize2, Minimize2, MoreVertical, Link as LinkIcon, Copy, Check, ChevronLeft, ArrowUpToLine, MessageSquare, CheckCircle2, Circle, List, PanelRightClose, PanelRightOpen, MessageSquareOff, Search, ExternalLink, Eye, FileText, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { FindReplaceBar } from './FindReplaceBar';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  brown: 'bg-orange-200 border-orange-200 text-orange-900',
  black: 'bg-stone-900 border-stone-700 text-stone-100',
};

const SCENE_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  none: { bg: 'bg-white', border: 'border-stone-200', text: 'text-stone-900', dot: 'bg-stone-200', label: 'No Status' },
  yellow: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-900', dot: 'bg-amber-400', label: 'Writing' },
  green: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-900', dot: 'bg-emerald-400', label: 'Finished' },
  blue: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-900', dot: 'bg-blue-400', label: 'Modified' },
  red: { bg: 'bg-red-50/50', border: 'border-red-200', text: 'text-red-900', dot: 'bg-red-400', label: 'Discarded' },
};

const AutoResizeTextarea = ({ value, onChange, className, placeholder, scrollContainerRef, searchTerm, blockId, ...props }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  
  const adjustHeight = React.useCallback(() => {
    if (ref.current) {
      const scrollContainer = scrollContainerRef?.current;
      const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
      
      if (scrollContainer) {
        if (scrollContainer.scrollTop !== currentScrollTop) {
          scrollContainer.scrollTop = currentScrollTop;
        }
      } else if (window.scrollY !== currentScrollTop) {
        window.scrollTo(window.scrollX, currentScrollTop);
      }
    }
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let previousWidth = element.clientWidth;

    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!element) return;
        let widthChanged = false;
        for (const entry of entries) {
          if (entry.contentRect.width !== previousWidth) {
            previousWidth = entry.contentRect.width;
            widthChanged = true;
          }
        }
        if (widthChanged) {
          adjustHeight();
        }
      });
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [adjustHeight]);

  const renderHighlights = () => {
    if (!searchTerm || !value) return null;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = value.split(regex);
    
    return (
      <div 
        className={cn(className, "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-transparent bg-transparent z-0")} 
        aria-hidden="true"
      >
        {parts.map((part: string, i: number) => {
          if (i % 2 === 1) {
            const matchIndex = (i - 1) / 2;
            return <span key={i} id={blockId ? `highlight-${blockId}-${matchIndex}` : undefined} className="bg-yellow-200/50 text-transparent">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full group">
      {renderHighlights()}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("overflow-hidden resize-none relative z-10 bg-transparent w-full", className)}
        rows={1}
        {...props}
      />
    </div>
  );
};

export function EditorPanel() {
  const { state, dispatch } = useStore();
  const [copied, setCopied] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const showDescriptions = state.showDescriptions;
  const activeDocId = state.activeDocumentId;
  const activeWorkId = state.activeWorkId;
  const isFocusMode = state.focusMode;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeDocument = state.scenes.find(s => s.id === activeDocId) || state.chapters.find(c => c.id === activeDocId);
  const isScene = state.scenes.some(s => s.id === activeDocId);
  const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
  const chapter = state.chapters.find(c => c.id === chapterId);
  const isArchived = chapter?.archived;
  
  const blocks = state.blocks.filter(b => b.documentId === activeDocId).sort((a, b) => a.order - b.order);
  const characters = state.characters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const chapters = state.chapters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);

  // Global Undo/Redo Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  if (!activeDocument) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-stone-400 bg-white">
        <AlignLeft size={48} className="mb-4 opacity-20" />
        <p>Select a chapter or scene to start writing.</p>
      </div>
    );
  }

  const handleBlockChange = (id: string, updates: Partial<typeof state.blocks[0]>) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...updates } });
  };

  const navigateToBlock = (blockId: string) => {
    const block = state.blocks.find(b => b.id === blockId);
    if (block) {
      if (block.documentId !== activeDocId) {
        dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: block.documentId });
      }
      setTimeout(() => {
        const el = document.getElementById(`block-${blockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2'), 2000);
        }
      }, 100);
    }
  };

  const toggleBlockDescription = (block: typeof state.blocks[0]) => {
    if (block.description === undefined) {
      handleBlockChange(block.id, { description: '' });
    } else if (block.description === '') {
      handleBlockChange(block.id, { description: undefined });
    }
  };

  const handleAddBlock = (type: 'text' | 'lens', afterBlockId?: string) => {
    dispatch({ type: 'ADD_BLOCK', payload: { documentId: activeDocId, type, afterBlockId } });
  };

  const handleLensColorChange = (id: string, color: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, color } });
  };

  const handleRemoveLens = (id: string) => {
    dispatch({ type: 'REMOVE_LENS', payload: id });
  };

  const handleDeleteBlock = (id: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: id });
  };

  const handleMergeUp = (id: string) => {
    dispatch({ type: 'MERGE_BLOCK_UP', payload: id });
  };

  const toggleCharacter = (charId: string) => {
    if (isScene) {
      dispatch({ type: 'TOGGLE_SCENE_CHARACTER', payload: { sceneId: activeDocId, characterId: charId } });
    }
  };

  const handleCopyScene = () => {
    const text = blocks
      .filter(b => !(b.type === 'lens' && b.color?.toLowerCase() === 'black'))
      .map(b => b.content)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Calculate chapter stats if it's a chapter
  let chapterCharacters: string[] = [];
  if (!isScene) {
    const chapterScenes = state.scenes.filter(s => s.chapterId === activeDocId);
    const charIds = new Set<string>();
    chapterScenes.forEach(s => s.characterIds.forEach(id => charIds.add(id)));
    chapterCharacters = Array.from(charIds);
  }

  // TOC Data
  const tocSections: { title: string; documentId: string; entries: { id: string; description: string; completed: boolean; documentId: string }[] }[] = [];
  if (activeDocument) {
    const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
    const chapter = state.chapters.find(c => c.id === chapterId);
    
    if (chapter) {
      const chapterBlocks = state.blocks.filter(b => b.documentId === chapterId && b.type === 'text' && b.description !== undefined).sort((a, b) => a.order - b.order);
      if (chapterBlocks.length > 0) {
        tocSections.push({
          title: chapter.title || 'Untitled Chapter',
          documentId: chapterId,
          entries: chapterBlocks.map(b => ({ id: b.id, description: b.description || 'Untitled Block', completed: !!b.completed, documentId: b.documentId }))
        });
      }
      
      const chapterScenes = state.scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
      for (const scene of chapterScenes) {
        const sceneBlocks = state.blocks.filter(b => b.documentId === scene.id && b.type === 'text' && b.description !== undefined).sort((a, b) => a.order - b.order);
        if (sceneBlocks.length > 0) {
          tocSections.push({
            title: scene.title || 'Untitled Scene',
            documentId: scene.id,
            entries: sceneBlocks.map(b => ({ id: b.id, description: b.description || 'Untitled Block', completed: !!b.completed, documentId: b.documentId }))
          });
        }
      }
    }
  }

  return (
    <div className={cn(
      "flex-1 flex bg-white overflow-hidden relative transition-all duration-300",
      !activeDocId ? "hidden md:flex" : "flex"
    )}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {showFindReplace && (
          <div className="border-b border-stone-200 z-20 bg-stone-50">
            <FindReplaceBar 
              onClose={() => {
                setShowFindReplace(false);
                setSearchTerm('');
              }} 
              onSearchChange={setSearchTerm} 
            />
          </div>
        )}
        <div 
          ref={scrollContainerRef}
        className={cn(
        "flex-1 overflow-y-auto pb-32 md:pb-12 transition-all duration-300",
        isFocusMode 
          ? "px-4 py-8 md:px-8 md:py-12 lg:px-24 xl:px-48" 
          : "px-4 py-8 md:px-8 md:py-12 lg:px-12 xl:px-16"
      )}>
        <div className={cn(
          "mx-auto transition-all duration-300",
          isFocusMode ? "max-w-3xl" : "max-w-5xl"
        )}>
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={activeDocument.title}
              disabled={isArchived}
              onChange={(e) => {
                if (isScene) {
                  dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, title: e.target.value } });
                } else {
                  dispatch({ type: 'UPDATE_CHAPTER', payload: { id: activeDocId, title: e.target.value } });
                }
              }}
              className={cn(
                "flex-1 outline-none placeholder:text-stone-300 bg-transparent whitespace-normal break-words",
                state.disguiseMode 
                  ? "font-mono text-base leading-snug text-black font-normal" 
                  : "text-2xl md:text-3xl font-serif font-semibold text-stone-900"
              )}
              placeholder="Untitled..."
            />
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setShowFindReplace(!showFindReplace)}
                className={cn("p-2 rounded-md transition-colors", showFindReplace ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
                title="Find and Replace (Ctrl+F)"
              >
                <Search size={20} />
              </button>
              {!isTocOpen && tocSections.length > 0 && !state.disguiseMode && (
                <button
                  onClick={() => setIsTocOpen(true)}
                  className="p-2 rounded-md transition-colors hidden lg:flex text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                  title="Open Directory"
                >
                  <PanelRightOpen size={20} />
                </button>
              )}
              {isScene ? (
                <button
                  onClick={handleCopyScene}
                  className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                  title="Copy Scene Text"
                >
                  {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('Delete this chapter?')) {
                      dispatch({ type: 'DELETE_CHAPTER', payload: activeDocId });
                    }
                  }}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Chapter"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          {isScene && !state.disguiseMode && (
            <div className="mb-12 flex items-center space-x-3">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Parent Chapter:</label>
              <select
                value={(activeDocument as any).chapterId}
                onChange={(e) => {
                  dispatch({ 
                    type: 'MOVE_SCENE', 
                    payload: { 
                      sceneId: activeDocId, 
                      newChapterId: e.target.value, 
                      newIndex: 0 // Move to top of new chapter
                    } 
                  });
                }}
                className="text-sm bg-stone-100 border-none rounded-md px-3 py-1.5 text-stone-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {chapters.map(chap => (
                  <option key={chap.id} value={chap.id}>{chap.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Character Binding Area */}
          {!state.disguiseMode && (
            <div className="mb-12 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider mr-2">
                {isScene ? 'Characters in Scene:' : 'Characters in Chapter:'}
              </span>
              
              {characters.map(char => {
                const isActive = isScene 
                  ? (activeDocument as any).characterIds.includes(char.id)
                  : chapterCharacters.includes(char.id);
                  
                return (
                  <button
                    key={char.id}
                    onClick={() => toggleCharacter(char.id)}
                    disabled={!isScene}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                      isActive 
                        ? "bg-stone-800 text-stone-100 border-stone-800" 
                        : "bg-white text-stone-500 border-stone-200 hover:border-stone-300",
                      !isScene && "cursor-default opacity-80"
                    )}
                  >
                    {char.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Chapter Scenes List */}
          {!isScene && !state.disguiseMode && (
            <div className="mb-12 space-y-4">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Scenes in this Chapter</h3>
              {state.scenes.filter(s => s.chapterId === activeDocId).sort((a, b) => a.order - b.order).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {state.scenes.filter(s => s.chapterId === activeDocId).sort((a, b) => a.order - b.order).map(scene => {
                    const status = SCENE_STATUS_COLORS[scene.statusColor || 'none'] || SCENE_STATUS_COLORS.none;
                    return (
                      <div
                        key={scene.id}
                        className={cn(
                          "group relative flex flex-col rounded-xl border transition-all duration-300 hover:shadow-md",
                          status.bg,
                          status.border
                        )}
                      >
                        <button
                          onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: scene.id })}
                          className="flex-1 p-4 text-left"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className={cn("w-2 h-2 rounded-full shrink-0", status.dot)} />
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Scene {scene.order + 1}</span>
                          </div>
                          <div className={cn("text-sm font-semibold truncate mb-1", status.text)}>
                            {scene.title || 'Untitled Scene'}
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center opacity-60">
                            <FileText size={10} className="mr-1" />
                            {state.blocks.filter(b => b.documentId === scene.id && b.type === 'text').reduce((acc, b) => acc + b.content.length, 0)} chars
                          </div>
                        </button>

                        {/* Color Picker Overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-stone-200">
                          {Object.keys(SCENE_STATUS_COLORS).map(colorKey => (
                            <button
                              key={colorKey}
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'UPDATE_SCENE', payload: { id: scene.id, statusColor: colorKey === 'none' ? undefined : colorKey } });
                              }}
                              className={cn(
                                "w-3 h-3 rounded-full border border-black/5 transition-transform hover:scale-125",
                                SCENE_STATUS_COLORS[colorKey].dot,
                                (scene.statusColor || 'none') === colorKey && "ring-1 ring-offset-1 ring-stone-400"
                              )}
                              title={SCENE_STATUS_COLORS[colorKey].label}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-stone-500 italic p-4 bg-stone-50 rounded-lg border border-stone-100 text-center">
                  No scenes in this chapter yet.
                </div>
              )}
            </div>
          )}

          {/* Chapter Character Summary */}
          {!isScene && chapterCharacters.length > 0 && !state.disguiseMode && (
            <div className="mb-12 space-y-6">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Character Appearances</h3>
              {chapterCharacters.map(charId => {
                const char = characters.find(c => c.id === charId);
                if (!char) return null;
                
                const scenesWithChar = state.scenes.filter(s => s.chapterId === activeDocId && s.characterIds.includes(charId)).sort((a, b) => a.order - b.order);
                
                return (
                  <div key={charId} className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                    <div className="font-semibold text-stone-900 mb-3">{char.name} appears in:</div>
                    <div className="space-y-2 pl-2 border-l-2 border-emerald-200">
                      {scenesWithChar.map(scene => {
                        const sceneIndex = `${activeDocument.order + 1}-${scene.order + 1}`;
                        return (
                          <div key={scene.id} className="flex items-start space-x-3">
                            <span className="text-xs font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{sceneIndex}</span>
                            <AutoResizeTextarea
                              scrollContainerRef={scrollContainerRef}
                              value={scene.characterNotes?.[charId] || ''}
                              onChange={(e: any) => dispatch({ type: 'UPDATE_SCENE_CHARACTER_NOTE', payload: { sceneId: scene.id, characterId: charId, note: e.target.value } })}
                              placeholder={`Notes for ${char.name} in this scene...`}
                              className="flex-1 bg-transparent text-sm text-stone-700 outline-none border-b border-transparent focus:border-emerald-300 transition-colors"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Blocks */}
          <div className={cn("space-y-6", state.disguiseMode && "space-y-4")}>
            {blocks.map((block, index) => {
              const prevBlock = index > 0 ? blocks[index - 1] : null;
              const canMergeUp = block.type === 'text' && prevBlock && prevBlock.type === 'text' && !state.disguiseMode;

              return (
              <div key={block.id} id={`block-${block.id}`} className="group relative flex flex-col transition-colors duration-500">
                {/* Merge Up Button */}
                {canMergeUp && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => handleMergeUp(block.id)}
                      className="flex items-center px-2 py-1 bg-white border border-stone-200 shadow-sm text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-full transition-colors"
                      title="Merge with previous text block"
                    >
                      <ArrowUpToLine size={12} className="mr-1" /> Merge Up
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Block Content */}
                    <div className={cn(
                      "w-full rounded-lg transition-colors",
                      block.type === 'lens' && !state.disguiseMode ? cn("p-4 border-2", LENS_COLORS[block.color as keyof typeof LENS_COLORS] || LENS_COLORS.red) : "",
                      state.disguiseMode && "rounded-none"
                    )}>
                      {block.type === 'lens' && !state.disguiseMode && (
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex space-x-1">
                            {Object.keys(LENS_COLORS).map(color => (
                              <button
                                key={color}
                                onClick={() => handleLensColorChange(block.id, color)}
                                className={cn(
                                  "w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-110",
                                  color === 'red' && "bg-red-400",
                                  color === 'blue' && "bg-blue-400",
                                  color === 'green' && "bg-emerald-400",
                                  color === 'yellow' && "bg-amber-400",
                                  color === 'purple' && "bg-purple-400",
                                  color === 'brown' && "bg-orange-400",
                                  color === 'black' && "bg-stone-900",
                                  block.color === color && "ring-2 ring-offset-1 ring-stone-400"
                                )}
                                title={color.charAt(0).toUpperCase() + color.slice(1)}
                              />
                            ))}
                          </div>
                          <div className="flex items-center space-x-2 text-black/40">
                            {block.linkedLensIds && block.linkedLensIds.length > 0 && (
                              <div className="flex items-center text-xs font-medium bg-black/5 px-2 py-0.5 rounded-full">
                                <LinkIcon size={10} className="mr-1" />
                                {block.linkedLensIds.length} Linked
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                dispatch({ type: 'SET_ACTIVE_LENS', payload: block.id });
                                dispatch({ type: 'SET_ACTIVE_TAB', payload: 'lenses' });
                              }}
                              className="p-1 hover:bg-black/5 rounded transition-colors"
                              title="Go to Lens in Lenses Tab"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button 
                              onClick={() => handleRemoveLens(block.id)}
                              className="p-1 hover:bg-black/5 rounded transition-colors"
                              title="Remove Lens (keep text)"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <AutoResizeTextarea
                        scrollContainerRef={scrollContainerRef}
                        value={block.content}
                        searchTerm={searchTerm}
                        blockId={block.id}
                        disabled={isArchived}
                        onChange={(e: any) => handleBlockChange(block.id, { content: e.target.value })}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            const newType = block.type === 'text' ? 'lens' : 'text';
                            dispatch({ 
                              type: 'UPDATE_BLOCK', 
                              payload: { 
                                id: block.id, 
                                type: newType,
                              } 
                            });
                          }
                        }}
                        placeholder={block.type === 'lens' ? (block.color === 'black' ? "Hidden content..." : "Enter lens content...") : "Start writing..."}
                        className={cn(
                          "w-full outline-none bg-transparent p-0",
                          state.disguiseMode ? "font-mono text-base leading-snug text-black" : (block.type === 'lens' ? "text-sm font-medium leading-relaxed" : "text-lg leading-loose tracking-wide text-stone-800 font-serif"),
                          block.type === 'lens' && block.color === 'black' && !state.disguiseMode ? "text-transparent focus:text-stone-100 placeholder:text-stone-700 focus:placeholder:text-stone-500 selection:bg-stone-700 selection:text-stone-100" : ""
                        )}
                      />
                      
                      {block.type === 'lens' && block.linkedLensIds && block.linkedLensIds.length > 0 && !state.disguiseMode && (
                        <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap gap-2">
                          {block.linkedLensIds.map(linkedId => {
                            const linkedLens = state.blocks.find(b => b.id === linkedId);
                            if (!linkedLens) return null;
                            return (
                              <button
                                key={linkedId}
                                onClick={() => navigateToBlock(linkedId)}
                                className={cn(
                                  "text-xs flex items-center px-2 py-1 rounded transition-colors font-medium",
                                  block.color === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                                )}
                              >
                                <LinkIcon size={10} className="mr-1 shrink-0" />
                                <span className="truncate max-w-[200px]">
                                  {linkedLens.color === 'black' ? 'Hidden Content' : (linkedLens.content || 'Empty lens')}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Description Editor */}
                      {block.type === 'text' && block.description !== undefined && showDescriptions && (
                        <div className="mt-2 pl-4 border-l-2 border-emerald-200 flex items-start gap-2">
                          <AutoResizeTextarea
                            scrollContainerRef={scrollContainerRef}
                            value={block.description}
                            onChange={(e: any) => handleBlockChange(block.id, { description: e.target.value })}
                            placeholder="Enter block description..."
                            className="flex-1 text-sm text-stone-600 bg-stone-50 p-2 rounded-md outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleBlockChange(block.id, { completed: !block.completed })}
                            className={cn(
                              "mt-1 p-1 rounded-full transition-colors shrink-0",
                              block.completed ? "text-emerald-500 hover:bg-emerald-50" : "text-stone-300 hover:text-stone-400 hover:bg-stone-100"
                            )}
                            title={block.completed ? "Mark as incomplete" : "Mark as complete"}
                          >
                            {block.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Block Actions (Hover) */}
                    {!state.disguiseMode && !isArchived && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 px-2 absolute top-full left-0 z-10 bg-white shadow-sm rounded-md border border-stone-200 py-0.5 mt-1">
                        <button 
                          onClick={() => handleAddBlock('text', block.id)}
                          className="flex items-center px-2 py-0.5 text-[10px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                          title="Add Text Block Below"
                        >
                          <AlignLeft size={12} className="mr-1" /> Add Text
                        </button>
                        <button 
                          onClick={() => handleAddBlock('lens', block.id)}
                          className="flex items-center px-2 py-0.5 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          title="Add Color Lens Below"
                        >
                          <Highlighter size={12} className="mr-1" /> Add Lens
                        </button>
                        <button 
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Block"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Side Actions for Text Blocks */}
                  {block.type === 'text' && !state.disguiseMode && !isArchived && (
                    <div className={cn(
                      "flex flex-col items-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 w-8 shrink-0"
                    )}>
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
                  )}
                </div>
              </div>
              );
            })}

            {blocks.length === 0 && !state.disguiseMode && (
              <div className="flex space-x-4 mt-8">
                <button 
                  onClick={() => handleAddBlock('text')}
                  className="flex items-center px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors text-sm font-medium"
                >
                  <AlignLeft size={16} className="mr-2" />
                  Add Text
                </button>
                <button 
                  onClick={() => handleAddBlock('lens')}
                  className="flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors text-sm font-medium"
                >
                  <Highlighter size={16} className="mr-2" />
                  Add Color Lens
                </button>
              </div>
            )}
          </div>
          
          <div className="h-64" /> {/* Bottom padding */}
        </div>
      </div>
      </div>
      
      {/* TOC Sidebar */}
      {tocSections.length > 0 && isTocOpen && !state.disguiseMode && (
        <div className="w-64 border-l border-stone-200 bg-stone-50/50 flex-col hidden lg:flex shrink-0">
          <div className="p-4 border-b border-stone-200 flex items-center bg-white">
            <button
              onClick={() => setIsTocOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors mr-2"
              title="Close Directory"
            >
              <PanelRightClose size={16} />
            </button>
            <div className="flex items-center">
              <List size={16} className="text-stone-400 mr-2" />
              <h3 className="font-semibold text-stone-900 text-sm uppercase tracking-wider">Block Directory</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {tocSections.map((section, idx) => (
              <div key={`${section.documentId}-${idx}`}>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{section.title}</h4>
                <div className="space-y-1">
                  {section.entries.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => navigateToBlock(entry.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors truncate",
                        entry.completed ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "text-stone-500 hover:bg-stone-200 hover:text-stone-800"
                      )}
                      title={entry.description}
                    >
                      {entry.description}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
