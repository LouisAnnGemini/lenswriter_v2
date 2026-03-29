import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { AlignLeft, Highlighter, Trash2, Maximize2, Minimize2, MoreVertical, Link as LinkIcon, Copy, Check, ChevronLeft, ArrowUpToLine, MessageSquare, CheckCircle2, Circle, List, PanelRightClose, PanelRightOpen, MessageSquareOff, Search, ExternalLink, Eye, FileText, ChevronRight, Settings2, Plus, Folder, Info, X, RotateCcw, Clock, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { FindReplaceBar } from './FindReplaceBar';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { MultiSelectDropdown } from './MultiSelectDropdown';

import { LensesPanel } from './LensesPanel';
import { EventPoolPanel } from './EventPoolPanel';
import { InboxPanel } from './InboxPanel';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { ChapterScenesList, SCENE_STATUS_COLORS } from './ChapterScenesList';
import { ChapterCharacterSummary } from './ChapterCharacterSummary';
import { SnapshotDialog } from './SnapshotDialog';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-stone-50 border-stone-200 text-stone-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  brown: 'bg-orange-200 border-orange-200 text-orange-900',
  black: 'bg-stone-900 border-stone-700 text-stone-100',
};

export function EditorPanel({ compact }: { compact?: boolean }) {
  const {
    setRightSidebarMode,
    undo,
    redo,
    updateBlock,
    setActiveDocument,
    setActiveLens,
    addBlock,
    removeLens,
    deleteBlock,
    mergeBlockUp,
    toggleSceneCharacter,
    updateScene,
    updateChapter,
    deleteChapter,
    addScene,
    moveScene,
    updateTimelineEventCharacterAction,
    setLetterSpacing,
    setEditorMargin,
    toggleDisguiseMode,
    addSnapshot,
    appMode,
    toggleAppMode,
    showDescriptions,
    activeDocumentId: activeDocId,
    activeWorkId,
    scenes,
    chapters: allChapters,
    blocks: allBlocks,
    characters: allCharacters,
    timelineEvents,
    focusMode: isFocusMode,
    rightSidebarMode,
    lastInspectorTab,
    disguiseMode,
    letterSpacing,
    editorMargin
  } = useStore(useShallow(state => ({
    setRightSidebarMode: state.setRightSidebarMode,
    undo: state.undo,
    redo: state.redo,
    updateBlock: state.updateBlock,
    setActiveDocument: state.setActiveDocument,
    setActiveLens: state.setActiveLens,
    addBlock: state.addBlock,
    removeLens: state.removeLens,
    deleteBlock: state.deleteBlock,
    mergeBlockUp: state.mergeBlockUp,
    toggleSceneCharacter: state.toggleSceneCharacter,
    updateScene: state.updateScene,
    updateChapter: state.updateChapter,
    deleteChapter: state.deleteChapter,
    addScene: state.addScene,
    moveScene: state.moveScene,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction,
    setLetterSpacing: state.setLetterSpacing,
    setEditorMargin: state.setEditorMargin,
    toggleDisguiseMode: state.toggleDisguiseMode,
    addSnapshot: state.addSnapshot,
    showDescriptions: state.showDescriptions,
    activeDocumentId: state.activeDocumentId,
    activeWorkId: state.activeWorkId,
    scenes: state.scenes,
    chapters: state.chapters,
    blocks: state.blocks,
    characters: state.characters,
    timelineEvents: state.timelineEvents,
    focusMode: state.focusMode,
    rightSidebarMode: state.rightSidebarMode,
    lastInspectorTab: state.lastInspectorTab,
    disguiseMode: state.disguiseMode,
    appMode: state.appMode,
    toggleAppMode: state.toggleAppMode,
    letterSpacing: state.letterSpacing,
    editorMargin: state.editorMargin
  })));

  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [showCreateSnapshotModal, setShowCreateSnapshotModal] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const activeDocument = scenes.find(s => s.id === activeDocId) || allChapters.find(c => c.id === activeDocId);
  const isScene = scenes.some(s => s.id === activeDocId);
  const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
  const chapter = allChapters.find(c => c.id === chapterId);
  const isArchived = chapter?.archived;
  const blocks = allBlocks.filter(b => b.documentId === activeDocId).sort((a, b) => a.order - b.order);
  const characters = allCharacters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const chapters = allChapters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rightSidebarMode !== 'closed') {
      const canShowCurrentTab = isScene || (rightSidebarMode !== 'info' && rightSidebarMode !== 'macro');
      if (!canShowCurrentTab) {
        setRightSidebarMode('micro');
      }
    }
  }, [rightSidebarMode, isScene, setRightSidebarMode]);

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
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInput) return; // Let native undo/redo handle text inputs

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  if (!activeDocument) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-stone-400 bg-white">
        <AlignLeft size={48} className="mb-4 opacity-20" />
        <p>Select a chapter or scene to start writing.</p>
      </div>
    );
  }

  const handleBlockChange = (id: string, updates: Partial<typeof allBlocks[0]>) => {
    updateBlock({ id, ...updates });
  };

  const navigateToBlock = (blockId: string) => {
    const block = allBlocks.find(b => b.id === blockId);
    if (block) {
      if (block.documentId !== activeDocId) {
        setActiveDocument(block.documentId);
      }
      
      // Auto-close inspector on mobile when jumping to text
      if (window.innerWidth < 768) {
        setRightSidebarMode('closed');
      }

      setTimeout(() => {
        const el = document.getElementById(`block-${blockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-stone-500', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-stone-500', 'ring-offset-2'), 2000);
        }
      }, 100);
    }
  };

  const toggleBlockDescription = (block: typeof allBlocks[0]) => {
    if (block.description === undefined) {
      handleBlockChange(block.id, { description: '' });
    } else if (block.description === '') {
      handleBlockChange(block.id, { description: undefined });
    }
  };

  const handleAddBlock = (isLens?: boolean, afterBlockId?: string) => {
    addBlock({ documentId: activeDocId, type: 'text', isLens, lensColor: isLens ? 'red' : undefined, afterBlockId });
  };

  const handleLensColorChange = (id: string, color: string) => {
    updateBlock({ id, lensColor: color });
  };

  const handleRemoveLens = (id: string) => {
    removeLens(id);
  };

  const handleDeleteBlock = (id: string) => {
    deleteBlock(id);
  };

  const handleMergeUp = (id: string) => {
    mergeBlockUp(id);
  };

  const toggleCharacter = (charId: string) => {
    if (isScene) {
      toggleSceneCharacter(activeDocId, charId);
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
    const chapterScenes = scenes.filter(s => s.chapterId === activeDocId);
    const charIds = new Set<string>();
    chapterScenes.forEach(s => s.characterIds.forEach(id => charIds.add(id)));
    chapterCharacters = Array.from(charIds);
  }

  // TOC Data
  const tocSections: { title: string; documentId: string; entries: { id: string; description: string; content: string; completed: boolean; documentId: string }[] }[] = [];
  if (activeDocument) {
    const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
    const chapter = allChapters.find(c => c.id === chapterId);
    
    if (chapter) {
      const chapterBlocks = allBlocks.filter(b => b.documentId === chapterId && b.description !== undefined).sort((a, b) => a.order - b.order);
      if (chapterBlocks.length > 0) {
        tocSections.push({
          title: chapter.title || 'Untitled Chapter',
          documentId: chapterId,
          entries: chapterBlocks.map(b => ({ id: b.id, description: b.description || '', content: b.content || '', completed: !!b.completed, documentId: b.documentId }))
        });
      }
      
      const chapterScenes = scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
      for (const scene of chapterScenes) {
        const sceneBlocks = allBlocks.filter(b => b.documentId === scene.id && b.description !== undefined).sort((a, b) => a.order - b.order);
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
      {showSnapshotDialog && isScene && (
        <SnapshotDialog
          sceneId={activeDocId}
          onClose={() => setShowSnapshotDialog(false)}
        />
      )}
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
                    updateScene({ id: activeDocId, title: e.target.value });
                  } else {
                    updateChapter({ id: activeDocId, title: e.target.value });
                  }
                }}
                className={cn(
                  "w-full outline-none placeholder:text-stone-300 bg-transparent whitespace-normal break-words caret-stone-800",
                  disguiseMode 
                    ? "font-mono text-base leading-snug text-black font-normal" 
                    : "text-2xl md:text-3xl font-serif font-semibold text-stone-800"
                )}
                placeholder="Untitled..."
              />
            </div>
            <div className="flex items-center flex-wrap justify-end gap-1 md:gap-2 relative shrink-0">
              <button
                onClick={() => setShowFindReplace(!showFindReplace)}
                className={cn("p-2 rounded-md transition-colors", showFindReplace ? "text-stone-800 bg-stone-200 hover:bg-stone-300" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
                title="Find and Replace (Ctrl+F)"
              >
                <Search size={20} />
              </button>

              {isScene && (
                <button
                  onClick={handleCopyScene}
                  className={cn("p-2 rounded-md transition-colors", copied ? "text-stone-800 bg-stone-200 hover:bg-stone-300" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
                  title="Copy Scene Text"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              )}
              
              {!isScene && (
                <ConfirmDeleteButton
                  onConfirm={() => deleteChapter(activeDocId)}
                  className="p-2"
                  title="Delete Chapter"
                  iconSize={20}
                />
              )}
            </div>
          </div>

          {/* Chapter Scenes List */}
          <ChapterScenesList
            isScene={isScene}
            disguiseMode={disguiseMode}
            activeDocId={activeDocId}
            scenes={scenes}
            allBlocks={allBlocks}
            addScene={addScene}
            setActiveDocument={setActiveDocument}
            updateScene={updateScene}
          />

          {/* Chapter Character Summary */}
          <ChapterCharacterSummary
            isScene={isScene}
            disguiseMode={disguiseMode}
            chapterCharacters={chapterCharacters}
            characters={characters}
            scenes={scenes}
            activeDocId={activeDocId}
            activeDocumentOrder={activeDocument.order}
          />

          {/* Blocks */}
          <div className={cn("space-y-6", disguiseMode && "space-y-4")}>
            {blocks.map((block, index) => {
              const prevBlock = index > 0 ? blocks[index - 1] : null;
              const canMergeUp = !block.isLens && prevBlock && !prevBlock.isLens && !disguiseMode;

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
                  paddingLeft: `${(editorMargin || 0)}rem`,
                  paddingRight: `${(editorMargin || 0)}rem`,
                }}>
                  <div className="flex-1 min-w-0">
                    {/* Block Content */}
                    <div className={cn(
                      "w-full rounded-lg transition-colors",
                      block.isLens && !disguiseMode 
                        ? cn("p-4 border-2", LENS_COLORS[block.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.red) 
                        : "px-4 border-2 border-transparent",
                      disguiseMode && "rounded-none p-0 border-0"
                    )}>
                      {block.isLens && !disguiseMode && (
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
                                  color === 'green' && "bg-stone-400",
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
                          <button
                            onClick={() => {
                              setRightSidebarMode('meso');
                              setActiveLens(block.id);
                            }}
                            className="p-1 hover:bg-black/10 rounded transition-colors text-stone-600"
                            title="Jump to Lens in Sidebar"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      )}
                      
                      <AutoResizeTextarea
                        scrollContainerRef={scrollContainerRef}
                        value={block.content || ''}
                        searchTerm={searchTerm}
                        blockId={block.id}
                        disabled={isArchived}
                        enableReadMode={true}
                        isDimmed={focusedBlockId !== null && focusedBlockId !== block.id}
                        onFocus={() => setFocusedBlockId(block.id)}
                        onBlur={() => {
                          console.log('EditorPanel onBlur for block:', block.id);
                          setFocusedBlockId(null);
                        }}
                        onChange={(e: any) => handleBlockChange(block.id, { content: e.target.value })}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            updateBlock({ 
                              id: block.id, 
                              isLens: !block.isLens,
                              lensColor: !block.isLens ? (block.lensColor || 'red') : undefined
                            });
                          }
                        }}
                        placeholder={block.isLens ? (block.lensColor === 'black' ? "Hidden content..." : "Enter lens content...") : "Start writing..."}
                        className={cn(
                          "w-full outline-none bg-transparent p-0",
                          disguiseMode ? "font-mono text-base leading-snug text-black" : (block.isLens ? "text-base md:text-sm font-medium leading-relaxed" : "text-lg leading-loose tracking-wide text-stone-800 font-serif"),
                          block.isLens && block.lensColor === 'black' && !disguiseMode ? "text-transparent focus:text-stone-100 placeholder:text-stone-700 focus:placeholder:text-stone-500 selection:bg-stone-700 selection:text-stone-100" : ""
                        )}
                        style={{ letterSpacing: `${(letterSpacing || 0) * 0.05}em` }}
                      />
                    </div>

                    {/* Block Actions (Hover) */}
                    {!disguiseMode && !isArchived && (
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
                          className="flex items-center px-2 py-0.5 text-[10px] font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
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
                  {!disguiseMode && !isArchived && (
                    <div className={cn(
                      "flex flex-col items-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 w-8 shrink-0"
                    )}>
                      <button 
                        onClick={() => toggleBlockDescription(block)}
                        className={cn("p-1.5 rounded-md transition-colors", block.description !== undefined ? "text-stone-800 bg-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
                        title="Block Description"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button 
                        onClick={() => handleBlockChange(block.id, { completed: !block.completed })}
                        className={cn("p-1.5 rounded-md transition-colors", block.completed ? "text-stone-800 bg-stone-200" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100")}
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

            {blocks.length === 0 && !disguiseMode && (
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
                  className="flex items-center px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md transition-colors text-sm font-medium"
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
      {rightSidebarMode !== 'closed' && !disguiseMode && (
        <div className={cn(
          "bg-stone-50 border-l border-stone-200 shrink-0 flex flex-col transition-all duration-300",
          "fixed inset-0 w-full z-[60] md:relative md:w-72 md:inset-auto md:z-20"
        )}>
          <div className="p-2 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {isScene && (
                <button
                  onClick={() => setRightSidebarMode('info')}
                  className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'info' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
                >
                  Info
                </button>
              )}
              <button
                onClick={() => setRightSidebarMode('micro')}
                className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'micro' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
              >
                Directory
              </button>
              <button
                onClick={() => setRightSidebarMode('meso')}
                className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'meso' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
              >
                Lenses
              </button>
              {isScene && (
                <button
                  onClick={() => setRightSidebarMode('macro')}
                  className={cn("px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap", rightSidebarMode === 'macro' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100")}
                >
                  Events
                </button>
              )}
            </div>
            <button
              onClick={() => setRightSidebarMode('closed')}
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
                            entry.completed ? "border-stone-300" : "border-stone-200"
                          )}>
                            <div className="flex justify-between items-start">
                              <textarea
                                value={entry.description || ''}
                                onChange={(e) => updateBlock({ id: entry.id, description: e.target.value })}
                                className={cn(
                                  "w-full bg-transparent border-none outline-none text-sm font-medium focus:ring-0 p-0 resize-none",
                                  entry.completed ? "text-stone-500" : "text-stone-900",
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
            {rightSidebarMode === 'meso' && activeDocId && (
              <LensesPanel documentId={activeDocId} onClose={() => setRightSidebarMode('closed')} onNavigateToBlock={navigateToBlock} />
            )}
            {rightSidebarMode === 'macro' && activeDocId && isScene && (
              <EventPoolPanel documentId={activeDocId} onClose={() => setRightSidebarMode('closed')} />
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
                        moveScene(activeDocId, e.target.value, 0);
                      }}
                      className="text-xs bg-white border border-stone-200 rounded px-2 h-9 w-full focus:outline-none focus:ring-2 focus:ring-stone-500/20 text-stone-700"
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
                        onClick={() => updateScene({ id: activeDocId, statusColor: undefined })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.none.bg, SCENE_STATUS_COLORS.none.border, SCENE_STATUS_COLORS.none.text,
                          !(activeDocument as any).statusColor ? "ring-2 ring-stone-500/50 border-stone-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <Circle size={10} className="text-stone-400" />
                        {SCENE_STATUS_COLORS.none.label}
                      </button>
                      <button
                        onClick={() => updateScene({ id: activeDocId, statusColor: 'yellow' })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.yellow.bg, SCENE_STATUS_COLORS.yellow.border, SCENE_STATUS_COLORS.yellow.text,
                          (activeDocument as any).statusColor === 'yellow' ? "ring-2 ring-stone-500/50 border-stone-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <FileText size={10} className="text-amber-500" />
                        {SCENE_STATUS_COLORS.yellow.label}
                      </button>
                      <button
                        onClick={() => updateScene({ id: activeDocId, statusColor: 'blue' })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.blue.bg, SCENE_STATUS_COLORS.blue.border, SCENE_STATUS_COLORS.blue.text,
                          (activeDocument as any).statusColor === 'blue' ? "ring-2 ring-stone-500/50 border-stone-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <RotateCcw size={10} className="text-blue-500" />
                        {SCENE_STATUS_COLORS.blue.label}
                      </button>
                      <button
                        onClick={() => updateScene({ id: activeDocId, statusColor: 'red' })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-medium border transition-all flex items-center gap-1.5 justify-center whitespace-nowrap",
                          SCENE_STATUS_COLORS.red.bg, SCENE_STATUS_COLORS.red.border, SCENE_STATUS_COLORS.red.text,
                          (activeDocument as any).statusColor === 'red' ? "ring-2 ring-stone-500/50 border-stone-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <X size={10} className="text-red-500" />
                        {SCENE_STATUS_COLORS.red.label}
                      </button>
                      <button
                        onClick={() => updateScene({ id: activeDocId, statusColor: 'green' })}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 col-span-2",
                          SCENE_STATUS_COLORS.green.bg, SCENE_STATUS_COLORS.green.border, SCENE_STATUS_COLORS.green.text,
                          (activeDocument as any).statusColor === 'green' ? "ring-2 ring-stone-500/50 border-stone-500" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <Check size={14} className="text-stone-600" />
                        {SCENE_STATUS_COLORS.green.label}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress & Deadline */}
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5 block">Progress</label>
                    <div className="relative h-9 overflow-hidden bg-white border border-stone-200 rounded focus-within:ring-2 focus-within:ring-stone-500/20 transition-all">
                      <div className="flex items-center gap-2 px-2 h-full">
                        <div className="text-xs font-bold text-stone-900 shrink-0">{totalWords}</div>
                        <div className="text-stone-300 font-light text-xs">/</div>
                        <input 
                          type="number"
                          value={(activeDocument as any).goalWordCount || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (isScene) {
                              updateScene({ id: activeDocId, goalWordCount: val });
                            }
                          }}
                          className="w-full bg-transparent outline-none text-xs text-stone-600 font-medium h-full"
                          placeholder="Goal"
                        />
                      </div>
                      {((activeDocument as any).goalWordCount || 0) > 0 && (
                        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-stone-100">
                          <div 
                            className="h-full bg-stone-800 transition-all duration-500"
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
                          updateScene({ id: activeDocId, deadline: e.target.value });
                        }
                      }}
                      className="w-full h-9 bg-white border border-stone-200 rounded px-2 text-xs focus:outline-none focus:ring-2 focus:ring-stone-500/20 text-stone-700"
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
                            updateScene({ id: activeDocId, characterIds: newIds });
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
                    options={timelineEvents.filter(e => e.workId === activeWorkId).map(e => ({ id: e.id, title: e.title }))}
                    selectedIds={(activeDocument as any).linkedEventIds || []}
                    onChange={(ids) => updateScene({ id: activeDocId, linkedEventIds: ids })}
                    placeholder="Select events..."
                  />
                </div>

                {/* Character Actions */}
                {(activeDocument as any).linkedEventIds?.length > 0 && (
                  <div className="pt-4 border-t border-stone-200">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Character Actions</label>
                    <div className="space-y-4">
                      {(() => {
                        const linkedEvents = timelineEvents
                          .filter(e => (activeDocument as any).linkedEventIds.includes(e.id))
                          .sort((a, b) => (a.order || 0) - (b.order || 0));
                        
                        const sceneCharIds = (activeDocument as any).characterIds || [];
                        const eventCharIds = Array.from(new Set(linkedEvents.flatMap(e => Object.keys(e.characterActions))));
                        const allRelevantCharIds = Array.from(new Set([...sceneCharIds, ...eventCharIds]));
                        
                        return allRelevantCharIds.map(charId => {
                          const char = allCharacters.find(c => c.id === charId);
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
                                        updateTimelineEventCharacterAction(event.id, charId, e.target.value);
                                      }}
                                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-600 focus:ring-1 focus:ring-stone-500 resize-none overflow-hidden min-h-[2rem] placeholder:text-stone-300 text-xs"
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
          isFocusMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
          <button
            onClick={scrollToTop}
            className="p-3 bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300 rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center group"
            title="Back to Top"
          >
            <ArrowUpToLine size={24} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Floating View Settings Button */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-opacity duration-300 flex items-end justify-end",
        isFocusMode ? "opacity-0 hover:opacity-100 w-32 h-32" : "opacity-100"
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
            {isScene && (
              <div className="mb-4 pb-4 border-b border-stone-100 space-y-2">
                <button
                  onClick={() => {
                    setNewSnapshotName(new Date().toLocaleString());
                    setShowCreateSnapshotModal(true);
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Camera size={16} />
                    Create Snapshot
                  </div>
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => {
                    setShowSnapshotDialog(true);
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-stone-500" />
                    History Snapshots
                  </div>
                  <ChevronRight size={16} className="text-stone-400" />
                </button>
              </div>
            )}
            <div className="mb-4">
              <label className="text-sm font-medium text-stone-700 mb-2 block">App Mode</label>
              <div className="flex bg-stone-100 rounded-lg p-1">
                <button
                  onClick={() => toggleAppMode()}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    appMode === 'writing' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  Writing
                </button>
                <button
                  onClick={() => toggleAppMode()}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                    appMode === 'management' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  Management
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-stone-700">Letter Spacing</label>
                <span className="text-xs text-stone-500">{letterSpacing}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={letterSpacing || 0}
                onChange={(e) => setLetterSpacing(parseInt(e.target.value))}
                className="w-full accent-stone-600"
              />
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-stone-700">Editor Margin</label>
                <span className="text-xs text-stone-500">{editorMargin}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                value={editorMargin || 0}
                onChange={(e) => setEditorMargin(parseInt(e.target.value))}
                className="w-full accent-stone-600"
              />
            </div>
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-stone-500" />
                <label className="text-sm font-medium text-stone-700">Disguise Mode</label>
              </div>
              <button
                onClick={() => toggleDisguiseMode()}
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  disguiseMode ? "bg-stone-800" : "bg-stone-200"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform",
                  disguiseMode ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateSnapshotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Create Snapshot</h3>
              <p className="text-sm text-stone-500 mb-4">
                Save a snapshot of the current scene. You can restore it later from History Snapshots.
              </p>
              <input
                type="text"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                placeholder="Snapshot Name (e.g., Draft 1)"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSnapshotName.trim()) {
                    addSnapshot(activeDocId, newSnapshotName.trim());
                    setShowCreateSnapshotModal(false);
                  } else if (e.key === 'Escape') {
                    setShowCreateSnapshotModal(false);
                  }
                }}
              />
            </div>
            <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateSnapshotModal(false)}
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newSnapshotName.trim()) {
                    addSnapshot(activeDocId, newSnapshotName.trim());
                    setShowCreateSnapshotModal(false);
                  }
                }}
                disabled={!newSnapshotName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
