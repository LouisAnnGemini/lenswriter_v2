import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { AlignLeft, Highlighter, Trash2, Maximize2, Minimize2, MoreVertical, Link as LinkIcon, Copy, Check, ChevronLeft, ArrowUpToLine, MessageSquare, CheckCircle2, Circle, List, PanelRightClose, PanelRightOpen, MessageSquareOff, Search, ExternalLink, Eye, FileText, ChevronRight, Settings2, Plus, Folder, Info, X, RotateCcw, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { FindReplaceBar } from './FindReplaceBar';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { MultiSelectDropdown } from './MultiSelectDropdown';

import { LensesPanel } from './LensesPanel';
import { EventPoolPanel } from './EventPoolPanel';
import { InboxPanel } from './InboxPanel';

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
  none: { bg: 'bg-white', border: 'border-stone-200', text: 'text-stone-900', dot: 'bg-stone-200', label: 'Draft' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'First Draft' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Finished' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Revised' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', label: 'Discarded' },
};

const AutoResizeTextarea = ({ value, onChange, className, placeholder, scrollContainerRef, searchTerm, blockId, style, ...props }: any) => {
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
  }, [value, className, style?.letterSpacing, adjustHeight]);

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
        style={style}
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
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("overflow-hidden resize-none relative z-10 bg-transparent w-full", className)}
        style={style}
        rows={1}
        {...props}
      />
    </div>
  );
};

export function EditorPanel({ compact }: { compact?: boolean }) {
  const { state, dispatch } = useStore();
  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const showDescriptions = state.showDescriptions;
  const activeDocId = state.activeDocumentId;
  const activeWorkId = state.activeWorkId;
  const activeDocument = state.scenes.find(s => s.id === activeDocId) || state.chapters.find(c => c.id === activeDocId);
  const isScene = state.scenes.some(s => s.id === activeDocId);
  const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
  const chapter = state.chapters.find(c => c.id === chapterId);
  const isArchived = chapter?.archived;
  const blocks = state.blocks.filter(b => b.documentId === activeDocId).sort((a, b) => a.order - b.order);
  const characters = state.characters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const chapters = state.chapters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const isFocusMode = state.focusMode;
  const rightSidebarMode = state.rightSidebarMode;
  const lastInspectorTab = state.lastInspectorTab;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rightSidebarMode !== 'closed') {
      const canShowCurrentTab = isScene || (rightSidebarMode !== 'info' && rightSidebarMode !== 'macro');
      if (!canShowCurrentTab) {
        dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'micro' });
      }
    }
  }, [rightSidebarMode, isScene, dispatch]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowBackToTop(container.scrollTop > 500);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      
      // Auto-close inspector on mobile when jumping to text
      if (window.innerWidth < 768) {
        dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'closed' });
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

  const handleAddBlock = (isLens?: boolean, afterBlockId?: string) => {
    dispatch({ type: 'ADD_BLOCK', payload: { documentId: activeDocId, type: 'text', isLens, lensColor: isLens ? 'red' : undefined, afterBlockId } });
  };

  const handleLensColorChange = (id: string, color: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, lensColor: color } });
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
      .filter(b => !(b.isLens && b.lensColor?.toLowerCase() === 'black'))
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
  const tocSections: { title: string; documentId: string; entries: { id: string; description: string; content: string; completed: boolean; documentId: string }[] }[] = [];
  if (activeDocument) {
    const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
    const chapter = state.chapters.find(c => c.id === chapterId);
    
    if (chapter) {
      const chapterBlocks = state.blocks.filter(b => b.documentId === chapterId && b.description !== undefined).sort((a, b) => a.order - b.order);
      if (chapterBlocks.length > 0) {
        tocSections.push({
          title: chapter.title || 'Untitled Chapter',
          documentId: chapterId,
          entries: chapterBlocks.map(b => ({ id: b.id, description: b.description || '', content: b.content || '', completed: !!b.completed, documentId: b.documentId }))
        });
      }
      
      const chapterScenes = state.scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
      for (const scene of chapterScenes) {
        const sceneBlocks = state.blocks.filter(b => b.documentId === scene.id && b.description !== undefined).sort((a, b) => a.order - b.order);
        if (sceneBlocks.length > 0) {
          tocSections.push({
            title: scene.title || 'Untitled Scene',
            documentId: scene.id,
            entries: sceneBlocks.map(b => ({ id: b.id, description: b.description || '', content: b.content || '', completed: !!b.completed, documentId: b.documentId }))
          });
        }
      }
    }
  }

  const countWords = (text: string) => {
    if (!text) return 0;
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z0-9]+/g) || [];
    return chineseChars.length + englishWords.length;
  };

  const totalWords = blocks.reduce((sum, b) => sum + countWords(b.content || ''), 0);

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
        "flex-1 overflow-y-auto overflow-x-hidden pb-32 md:pb-12 transition-all duration-300",
        isFocusMode 
          ? "px-4 py-8 md:px-8 md:py-12 lg:px-24 xl:px-48" 
          : compact
            ? "px-4 py-6 md:px-6 md:py-8"
            : "px-4 py-8 md:px-8 md:py-12 lg:px-12 xl:px-16"
      )}>
        <div 
          className={cn(
            "mx-auto transition-all duration-300",
            isFocusMode ? "max-w-3xl" : "max-w-5xl"
          )}
        >
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={activeDocument.title || ''}
                disabled={isArchived}
                onChange={(e) => {
                  if (isScene) {
                    dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, title: e.target.value } });
                  } else {
                    dispatch({ type: 'UPDATE_CHAPTER', payload: { id: activeDocId, title: e.target.value } });
                  }
                }}
                className={cn(
                  "w-full outline-none placeholder:text-stone-300 bg-transparent whitespace-normal break-words",
                  state.disguiseMode 
                    ? "font-mono text-base leading-snug text-black font-normal" 
                    : "text-2xl md:text-3xl font-serif font-semibold text-stone-900"
                )}
                placeholder="Untitled..."
              />
            </div>
            <div className="flex items-center flex-wrap justify-end gap-1 md:gap-2 relative shrink-0">
              <button
                onClick={() => setShowFindReplace(!showFindReplace)}
                className={cn("p-2 rounded-md transition-colors", showFindReplace ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
                title="Find and Replace (Ctrl+F)"
              >
                <Search size={20} />
              </button>

              {isScene && (
                <button
                  onClick={handleCopyScene}
                  className={cn("p-2 rounded-md transition-colors", copied ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
                  title="Copy Scene Text"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              )}
              
              {!isScene && (
                <ConfirmDeleteButton
                  onConfirm={() => dispatch({ type: 'DELETE_CHAPTER', payload: activeDocId })}
                  className="p-2"
                  title="Delete Chapter"
                  iconSize={20}
                />
              )}
            </div>
          </div>

          {/* Chapter Scenes List */}
          {!isScene && !state.disguiseMode && (
            <div className="mb-12 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Scenes in this Chapter</h3>
                <button
                  onClick={() => dispatch({ type: 'ADD_SCENE', payload: { chapterId: activeDocId } })}
                  className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                >
                  <Plus size={14} />
                  Add Scene
                </button>
              </div>
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
                            {state.blocks.filter(b => b.documentId === scene.id && !b.isLens).reduce((acc, b) => acc + b.content.length, 0)} chars
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
                            <span className="text-sm text-stone-700">{scene.title || 'Untitled Scene'}</span>
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
              const canMergeUp = !block.isLens && prevBlock && !prevBlock.isLens && !state.disguiseMode;

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

                <div className="flex items-start gap-2" style={{
                  paddingLeft: `${(state.editorMargin || 0)}rem`,
                  paddingRight: `${(state.editorMargin || 0)}rem`,
                }}>
                  <div className="flex-1 min-w-0">
                    {/* Block Content */}
                    <div className={cn(
                      "w-full rounded-lg transition-colors",
                      block.isLens && !state.disguiseMode 
                        ? cn("p-4 border-2", LENS_COLORS[block.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.red) 
                        : "px-4 border-2 border-transparent",
                      state.disguiseMode && "rounded-none p-0 border-0"
                    )}>
                      {block.isLens && !state.disguiseMode && (
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
                                  block.lensColor === color && "ring-2 ring-offset-1 ring-stone-400"
                                )}
                                title={color.charAt(0).toUpperCase() + color.slice(1)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <AutoResizeTextarea
                        scrollContainerRef={scrollContainerRef}
                        value={block.content || ''}
                        searchTerm={searchTerm}
                        blockId={block.id}
                        disabled={isArchived}
                        onChange={(e: any) => handleBlockChange(block.id, { content: e.target.value })}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            dispatch({ 
                              type: 'UPDATE_BLOCK', 
                              payload: { 
                                id: block.id, 
                                isLens: !block.isLens,
                                lensColor: !block.isLens ? (block.lensColor || 'red') : undefined
                              } 
                            });
                          }
                        }}
                        placeholder={block.isLens ? (block.lensColor === 'black' ? "Hidden content..." : "Enter lens content...") : "Start writing..."}
                        className={cn(
                          "w-full outline-none bg-transparent p-0",
                          state.disguiseMode ? "font-mono text-base leading-snug text-black" : (block.isLens ? "text-base md:text-sm font-medium leading-relaxed" : "text-lg leading-loose tracking-wide text-stone-800 font-serif"),
                          block.isLens && block.lensColor === 'black' && !state.disguiseMode ? "text-transparent focus:text-stone-100 placeholder:text-stone-700 focus:placeholder:text-stone-500 selection:bg-stone-700 selection:text-stone-100" : ""
                        )}
                        style={{ letterSpacing: `${(state.letterSpacing || 0) * 0.05}em` }}
                      />
                    </div>

                    {/* Block Actions (Hover) */}
                    {!state.disguiseMode && !isArchived && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2 px-2 absolute top-full left-0 z-10 bg-white shadow-sm rounded-md border border-stone-200 py-0.5 mt-1">
                        <button 
                          onClick={() => handleAddBlock(false, block.id)}
                          className="flex items-center px-2 py-0.5 text-[10px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                          title="Add Text Block Below"
                        >
                          <AlignLeft size={12} className="mr-1" /> Add Text
                        </button>
                        <button 
                          onClick={() => handleAddBlock(true, block.id)}
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
                  {!state.disguiseMode && !isArchived && (
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
                  onClick={() => handleAddBlock(false)}
                  className="flex items-center px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors text-sm font-medium"
                >
                  <AlignLeft size={16} className="mr-2" />
                  Add Text
                </button>
                <button 
                  onClick={() => handleAddBlock(true)}
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
      
      {/* Inspector Sidebar */}
      {rightSidebarMode !== 'closed' && !state.disguiseMode && (
        <div className={cn(
          "bg-stone-50 border-l border-stone-200 shrink-0 flex flex-col transition-all duration-300",
          "fixed inset-0 w-full z-[60] md:relative md:w-72 md:inset-auto md:z-20"
        )}>
          <div className="p-2 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {isScene && (
                <button
                  onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'info' })}
                  className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'info' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
                >
                  Info
                </button>
              )}
              <button
                onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'micro' })}
                className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'micro' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
              >
                Directory
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'meso' })}
                className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'meso' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
              >
                Lenses
              </button>
              {isScene && (
                <button
                  onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'macro' })}
                  className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'macro' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
                >
                  Events
                </button>
              )}
              <button
                onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'inbox' })}
                className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'inbox' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
              >
                Inbox
              </button>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'closed' })}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-200 rounded-md transition-colors shrink-0 ml-1"
              title="Close Inspector"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightSidebarMode === 'micro' && (
              <div className="p-4 space-y-6">
                {tocSections.length === 0 ? (
                  <div className="text-center text-xs text-stone-500 py-4">No blocks found.</div>
                ) : (
                  tocSections.map((section, idx) => (
                    <div key={`${section.documentId}-${idx}`}>
                      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{section.title}</h4>
                      <div className="space-y-1">
                        {section.entries.map(entry => (
                          <div key={entry.id} className={cn(
                            "p-3 bg-white rounded-lg border shadow-sm transition-colors",
                            entry.completed ? "border-emerald-200" : "border-stone-200"
                          )}>
                            <div className="flex justify-between items-start">
                              <textarea
                                value={entry.description || ''}
                                onChange={(e) => dispatch({ type: 'UPDATE_BLOCK', payload: { id: entry.id, description: e.target.value } })}
                                className={cn(
                                  "w-full bg-transparent border-none outline-none text-sm font-medium focus:ring-0 p-0 resize-none",
                                  entry.completed ? "text-emerald-700" : "text-stone-900",
                                  !entry.description ? "text-stone-400 italic" : ""
                                )}
                                placeholder="Untitled block"
                                rows={2}
                              />
                              <button
                                onClick={() => navigateToBlock(entry.id)}
                                className="p-1 hover:bg-black/5 rounded transition-colors ml-2 shrink-0"
                                title="Jump to Text"
                              >
                                <ArrowLeft size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {rightSidebarMode === 'inbox' && (
              <InboxPanel />
            )}
            {rightSidebarMode === 'meso' && activeDocId && (
              <LensesPanel documentId={activeDocId} onClose={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'closed' })} onNavigateToBlock={navigateToBlock} />
            )}
            {rightSidebarMode === 'macro' && activeDocId && isScene && (
              <EventPoolPanel documentId={activeDocId} onClose={() => dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'closed' })} />
            )}
            {rightSidebarMode === 'info' && activeDocId && isScene && (
              <div className="p-4 space-y-6">
                {/* Chapter & Status */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Parent Chapter</label>
                    <select
                      value={(activeDocument as any).chapterId || ''}
                      onChange={(e) => {
                        dispatch({ 
                          type: 'MOVE_SCENE', 
                          payload: { sceneId: activeDocId, newChapterId: e.target.value, newIndex: 0 } 
                        });
                      }}
                      className="text-xs bg-white border border-stone-200 rounded px-2 h-9 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-700"
                    >
                      {chapters.map(chap => (
                        <option key={chap.id} value={chap.id}>{chap.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Status</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, statusColor: undefined } })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.none.bg, SCENE_STATUS_COLORS.none.border, SCENE_STATUS_COLORS.none.text,
                          !(activeDocument as any).statusColor ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <Circle size={10} className="text-stone-400" />
                        {SCENE_STATUS_COLORS.none.label}
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, statusColor: 'yellow' } })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.yellow.bg, SCENE_STATUS_COLORS.yellow.border, SCENE_STATUS_COLORS.yellow.text,
                          (activeDocument as any).statusColor === 'yellow' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <FileText size={10} className="text-amber-500" />
                        {SCENE_STATUS_COLORS.yellow.label}
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, statusColor: 'blue' } })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.blue.bg, SCENE_STATUS_COLORS.blue.border, SCENE_STATUS_COLORS.blue.text,
                          (activeDocument as any).statusColor === 'blue' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <RotateCcw size={10} className="text-blue-500" />
                        {SCENE_STATUS_COLORS.blue.label}
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, statusColor: 'red' } })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.red.bg, SCENE_STATUS_COLORS.red.border, SCENE_STATUS_COLORS.red.text,
                          (activeDocument as any).statusColor === 'red' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <X size={10} className="text-red-500" />
                        {SCENE_STATUS_COLORS.red.label}
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, statusColor: 'green' } })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 col-span-2",
                          SCENE_STATUS_COLORS.green.bg, SCENE_STATUS_COLORS.green.border, SCENE_STATUS_COLORS.green.text,
                          (activeDocument as any).statusColor === 'green' ? "ring-2 ring-emerald-500/50 border-emerald-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <Check size={14} className="text-emerald-500" />
                        {SCENE_STATUS_COLORS.green.label}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress & Deadline */}
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Progress</label>
                    <div className="relative h-9 overflow-hidden bg-white border border-stone-200 rounded focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                      <div className="flex items-center gap-2 px-2 h-full">
                        <div className="text-xs font-bold text-stone-900 shrink-0">{totalWords}</div>
                        <div className="text-stone-300 font-light text-xs">/</div>
                        <input 
                          type="number"
                          value={(activeDocument as any).goalWordCount || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (isScene) {
                              dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, goalWordCount: val } });
                            }
                          }}
                          className="w-full bg-transparent outline-none text-xs text-stone-600 font-medium h-full"
                          placeholder="Goal"
                        />
                      </div>
                      {((activeDocument as any).goalWordCount || 0) > 0 && (
                        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-stone-100">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, (totalWords / ((activeDocument as any).goalWordCount || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Deadline</label>
                    <input 
                      type="date" 
                      value={(activeDocument as any).deadline || ''} 
                      onChange={(e) => {
                        if (isScene) {
                          dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, deadline: e.target.value } });
                        }
                      }}
                      className="w-full h-9 bg-white border border-stone-200 rounded px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-stone-700"
                    />
                  </div>
                </div>

                {/* Characters */}
                <div className="pt-4 border-t border-stone-200">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Characters</label>
                  <div className="flex flex-wrap gap-1">
                    {characters.map(char => {
                      const isIncluded = (activeDocument as any).characterIds?.includes(char.id);
                      return (
                        <button
                          key={char.id}
                          onClick={() => {
                            const currentIds = (activeDocument as any).characterIds || [];
                            const newIds = isIncluded 
                              ? currentIds.filter((id: string) => id !== char.id)
                              : [...currentIds, char.id];
                            dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, characterIds: newIds } });
                          }}
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium border transition-all",
                            isIncluded ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                          )}
                        >
                          {char.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Linked Events */}
                <div className="pt-4 border-t border-stone-200">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Linked Events</label>
                  <MultiSelectDropdown
                    options={state.timelineEvents.filter(e => e.workId === activeWorkId).map(e => ({ id: e.id, title: e.title }))}
                    selectedIds={(activeDocument as any).linkedEventIds || []}
                    onChange={(ids) => dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, linkedEventIds: ids } })}
                    placeholder="Select events..."
                  />
                </div>

                {/* Character Actions */}
                {(activeDocument as any).linkedEventIds?.length > 0 && (
                  <div className="pt-4 border-t border-stone-200">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Character Actions</label>
                    <div className="space-y-4">
                      {(() => {
                        const linkedEvents = state.timelineEvents
                          .filter(e => (activeDocument as any).linkedEventIds.includes(e.id))
                          .sort((a, b) => (a.order || 0) - (b.order || 0));
                        
                        const sceneCharIds = (activeDocument as any).characterIds || [];
                        const eventCharIds = Array.from(new Set(linkedEvents.flatMap(e => Object.keys(e.characterActions))));
                        const allRelevantCharIds = Array.from(new Set([...sceneCharIds, ...eventCharIds]));
                        
                        return allRelevantCharIds.map(charId => {
                          const char = state.characters.find(c => c.id === charId);
                          if (!char) return null;
                          
                          const isInScene = sceneCharIds.includes(charId);
                          const hasAction = linkedEvents.some(e => charId in e.characterActions);
                          if (!isInScene && !hasAction) return null;

                          return (
                            <div key={charId} className="flex flex-col gap-2 text-xs border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                              <span className={cn(
                                "font-semibold truncate",
                                isInScene ? "text-stone-900" : "text-stone-400 italic"
                              )} title={char.name}>
                                {char.name}
                              </span>
                              <div className="flex flex-col gap-2">
                                {linkedEvents.map((event) => (
                                  <div key={event.id} className="flex flex-col gap-1 group/action">
                                    <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded w-fit truncate max-w-full" title={event.title}>
                                      {event.title}
                                    </span>
                                    <AutoResizeTextarea
                                      value={event.characterActions[charId] || ''}
                                      placeholder="Add action..."
                                      onChange={(e: any) => {
                                        dispatch({
                                          type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION',
                                          payload: {
                                            eventId: event.id,
                                            characterId: charId,
                                            action: e.target.value
                                          }
                                        });
                                      }}
                                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-600 focus:ring-1 focus:ring-emerald-500 resize-none overflow-hidden min-h-[2rem] placeholder:text-stone-300 text-xs"
                                      scrollContainerRef={scrollContainerRef}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <div className={cn(
          "fixed bottom-20 right-6 z-50 transition-all duration-300",
          state.focusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
          <button
            onClick={scrollToTop}
            className="p-3 bg-white border border-stone-200 text-stone-500 hover:text-emerald-600 hover:border-emerald-200 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
            title="Back to Top"
          >
            <ArrowUpToLine size={24} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Floating View Settings Button */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-opacity duration-300 flex items-end justify-end",
        state.focusMode ? "opacity-0 hover:opacity-100 w-32 h-32" : "opacity-100"
      )}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-stone-900 text-white hover:bg-stone-800 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center"
          title="View Settings"
        >
          <Settings2 size={24} />
        </button>
        
        {showSettings && (
          <div className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-lg shadow-xl border border-stone-200 p-4 z-50 origin-bottom-right animate-in fade-in slide-in-from-bottom-2">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-stone-700">Letter Spacing</label>
                <span className="text-xs text-stone-500">{state.letterSpacing}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={state.letterSpacing || 0}
                onChange={(e) => dispatch({ type: 'SET_LETTER_SPACING', payload: parseInt(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-stone-700">Editor Margin</label>
                <span className="text-xs text-stone-500">{state.editorMargin}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={state.editorMargin || 0}
                onChange={(e) => dispatch({ type: 'SET_EDITOR_MARGIN', payload: parseInt(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-stone-500" />
                <label className="text-sm font-medium text-stone-700">Disguise Mode</label>
              </div>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_DISGUISE_MODE' })}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  state.disguiseMode ? "bg-emerald-500" : "bg-stone-200"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                  state.disguiseMode ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
