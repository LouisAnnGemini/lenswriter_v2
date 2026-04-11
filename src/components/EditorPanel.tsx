import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { SlashCommandMenu } from './SlashCommandMenu';
import { AlignLeft, Highlighter, Trash2, Maximize2, Minimize2, MoreVertical, Link as LinkIcon, Copy, Check, ChevronLeft, ArrowUpToLine, MessageSquare, CheckCircle2, Circle, List, PanelRightClose, PanelRightOpen, MessageSquareOff, Search, ExternalLink, Eye, FileText, ChevronRight, ChevronDown, Settings2, Plus, Folder, Info, X, RotateCcw, Clock, ArrowRight, ArrowLeft, Camera, Scissors, Keyboard, LayoutGrid, GitCompare } from 'lucide-react';
import { cn, stripHtml } from '../lib/utils';
import { FindReplaceBar } from './FindReplaceBar';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { toast } from 'sonner';

import { LensesPanel } from './LensesPanel';
import { EventPoolPanel } from './EventPoolPanel';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { ChapterScenesList } from './ChapterScenesList';
import { SCENE_STATUS_COLORS } from '../store/constants';
import { CharacterAppearanceMatrix } from './CharacterAppearanceMatrix';
import { SnapshotTab } from './SnapshotTab';
import { StashTab } from './StashTab';
import { BlockCompareModal } from './BlockCompareModal';
import { WordRibbon, WordStatusBar } from './WordDisguise';
import { InspectorSidebar } from './InspectorSidebar';
import { ViewSettingsMenu } from './ViewSettingsMenu';
import { DisguiseSettingsModal } from './DisguiseSettingsModal';
import { FloatingBackToTop } from './FloatingBackToTop';
import { BlockHoverMenu } from './BlockHoverMenu';
import { BlockRightActions } from './BlockRightActions';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  brown: 'bg-orange-200 border-orange-200 text-orange-900',
  black: 'bg-stone-900 border-stone-700 text-stone-100',
  white: 'bg-transparent border-transparent text-stone-900',
};

export function EditorPanel({ compact, fullscreenMode }: { compact?: boolean, fullscreenMode?: boolean }) {
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
    updateSceneCharacterNote,
    updateScene,
    updateChapter,
    deleteChapter,
    addScene,
    moveScene,
    updateTimelineEventCharacterAction,
    splitSceneAtBlock,
    setLetterSpacing,
    setEditorMargin,
    toggleDisguiseMode,
    addSnapshot,
    showDescriptions,
    activeDocumentId: activeDocId,
    activeWorkId,
    scenes,
    chapters: allChapters,
    blocks: allBlocks,
    characters: allCharacters,
    timelineEvents,
    fullscreenMode: storeFullscreenMode,
    scrollMode,
    toggleScrollMode,
    rightSidebarMode,
    lastInspectorTab,
    disguiseMode,
    writingFocusMode,
    toggleWritingFocusMode,
    disguiseBackgroundText,
    setDisguiseBackgroundText,
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
    updateSceneCharacterNote: state.updateSceneCharacterNote,
    updateScene: state.updateScene,
    updateChapter: state.updateChapter,
    deleteChapter: state.deleteChapter,
    addScene: state.addScene,
    moveScene: state.moveScene,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction,
    splitSceneAtBlock: state.splitSceneAtBlock,
    setLetterSpacing: state.setLetterSpacing,
    setEditorMargin: state.setEditorMargin,
    toggleDisguiseMode: state.toggleDisguiseMode,
    setDisguiseBackgroundText: state.setDisguiseBackgroundText,
    addSnapshot: state.addSnapshot,
    showDescriptions: state.showDescriptions,
    activeDocumentId: state.activeDocumentId,
    activeWorkId: state.activeWorkId,
    scenes: state.scenes,
    chapters: state.chapters,
    blocks: state.blocks,
    characters: state.characters,
    timelineEvents: state.timelineEvents,
    fullscreenMode: state.fullscreenMode,
    scrollMode: state.scrollMode,
    toggleScrollMode: state.toggleScrollMode,
    toggleWritingFocusMode: state.toggleWritingFocusMode,
    rightSidebarMode: state.rightSidebarMode,
    lastInspectorTab: state.lastInspectorTab,
    disguiseMode: state.disguiseMode,
    writingFocusMode: state.writingFocusMode,
    disguiseBackgroundText: state.disguiseBackgroundText,
    letterSpacing: state.letterSpacing,
    editorMargin: state.editorMargin
  })));

  const isFullscreenMode = fullscreenMode !== undefined ? fullscreenMode : storeFullscreenMode;

  const [copied, setCopied] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [openMenuBlockId, setOpenMenuBlockId] = useState<string | null>(null);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState<{ blockId: string, position: { top: number, left: number } } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDisguiseSettings, setShowDisguiseSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedTocSections, setCollapsedTocSections] = useState<Set<string> | null>(null);
  const [comparingBlockId, setComparingBlockId] = useState<string | null>(null);
  const blocksContainerRef = useRef<HTMLDivElement>(null);
  const lastMousePosRef = useRef<{clientX: number, clientY: number} | null>(null);
  const preventScrollRef = useRef(false);

  const activeDocument = scenes.find(s => s.id === activeDocId) || allChapters.find(c => c.id === activeDocId);
  const isScene = scenes.some(s => s.id === activeDocId);
  const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
  const chapter = allChapters.find(c => c.id === chapterId);
  const isArchived = chapter?.archived;
  const activeDocBlocks = allBlocks.filter(b => b.documentId === activeDocId && !b.isStashed).sort((a, b) => a.order - b.order);
  const characters = allCharacters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const chapters = allChapters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  
  const chapterScenes = scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
  const currentSceneIndex = chapterScenes.findIndex(s => s.id === activeDocId);

  // TOC Data
  const tocSections: { title: string; documentId: string; entries: { id: string; description: string; content: string; completed: boolean; documentId: string }[] }[] = [];
  if (activeDocument) {
    const chapterId = isScene ? (activeDocument as any).chapterId : activeDocId;
    const chapter = allChapters.find(c => c.id === chapterId);
    
    if (chapter) {
      const chapterBlocks = allBlocks.filter(b => b.documentId === chapterId && b.description !== undefined && !b.isStashed).sort((a, b) => a.order - b.order);
      if (chapterBlocks.length > 0) {
        tocSections.push({
          title: chapter.title || 'Untitled Chapter',
          documentId: chapterId,
          entries: chapterBlocks.map(b => ({ id: b.id, description: b.description || '', content: b.content || '', completed: !!b.completed, documentId: b.documentId }))
        });
      }
      
      const chapterScenes = scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
      for (const scene of chapterScenes) {
        const sceneBlocks = allBlocks.filter(b => b.documentId === scene.id && b.description !== undefined && !b.isStashed).sort((a, b) => a.order - b.order);
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

  const isSectionCollapsed = (documentId: string) => {
    if (collapsedTocSections === null) return true;
    return collapsedTocSections.has(documentId);
  };

  const toggleTocSection = (documentId: string) => {
    setCollapsedTocSections(prev => {
      const current = prev === null ? new Set(tocSections.map(s => s.documentId)) : prev;
      const newSet = new Set(current);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };
  
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
    if (scrollMode && isScene) {
      if (preventScrollRef.current) {
        preventScrollRef.current = false;
        return;
      }
      const element = document.getElementById(`document-${activeDocId}`);
      if (element) {
        // Add a small delay to ensure rendering is complete
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    }
  }, [activeDocId, scrollMode, isScene]);

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

  const toggleBlockLens = React.useCallback((blockId: string) => {
    const blocks = useStore.getState().blocks;
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      if (block.isLens) {
        updateBlock({ id: blockId, isLens: false });
      } else {
        updateBlock({ id: blockId, isLens: true, lensColor: 'red' });
      }
      // Re-focus the block after the update
      setTimeout(() => {
        const el = document.getElementById(`block-${blockId}`);
        if (el) {
          const textarea = el.querySelector('textarea');
          if (textarea) {
            textarea.focus();
          }
        }
      }, 0);
    }
  }, [updateBlock]);

  const handleBlockChange = (id: string, updates: Partial<typeof allBlocks[0]>) => {
    updateBlock({ id, ...updates });
  };

  const handleAddBlock = React.useCallback((isLens?: boolean, afterBlockId?: string, targetDocumentId?: string) => {
    const newId = uuidv4();
    let docId = targetDocumentId || activeDocId;
    
    if (!targetDocumentId && afterBlockId) {
      const block = allBlocks.find(b => b.id === afterBlockId);
      if (block) {
        docId = block.documentId;
      }
    }
    
    if (!docId) return;
    addBlock({ id: newId, documentId: docId, type: 'text', isLens, lensColor: isLens ? 'red' : undefined, afterBlockId });
    setFocusedBlockId(newId);
  }, [addBlock, activeDocId, setFocusedBlockId, allBlocks]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+/ Toggle Block/Lens
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        if (focusedBlockId) {
          toggleBlockLens(focusedBlockId);
        }
      }

      // Ctrl+Enter Add Block Below
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // Find the focused block
        if (focusedBlockId) {
          handleAddBlock(false, focusedBlockId);
        } else {
          handleAddBlock(false);
        }
      }

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
  }, [undo, redo, handleAddBlock, focusedBlockId, toggleBlockLens]);

  if (!activeDocument) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-stone-400 bg-white">
        <AlignLeft size={48} className="mb-4 opacity-20" />
        <p>Select a chapter or scene to start writing.</p>
      </div>
    );
  }

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
          el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2'), 2000);
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

  const handleLensColorChange = (id: string, color: string) => {
    updateBlock({ id, lensColor: color });
  };

  const handleRemoveLens = (id: string) => {
    removeLens(id);
  };

  const handleDeleteBlock = (id: string) => {
    deleteBlock(id);
    toast.success('Deleted 1 block', {
      action: {
        label: 'Undo',
        onClick: () => undo()
      },
      duration: 5000,
    });
  };

  const handleMergeUp = (id: string) => {
    mergeBlockUp(id);
  };

  const handleSplitScene = (blockId: string) => {
    if (isScene) {
      const block = allBlocks.find(b => b.id === blockId);
      if (block) {
        splitSceneAtBlock(block.documentId, blockId);
      }
    }
  };

  const toggleCharacter = (charId: string) => {
    if (isScene) {
      toggleSceneCharacter(activeDocId, charId);
    }
  };

  const handleCopyScene = (sceneId?: string | React.MouseEvent) => {
    const targetId = typeof sceneId === 'string' ? sceneId : activeDocId;
    const sceneBlocks = allBlocks.filter(b => b.documentId === targetId && !b.isStashed).sort((a, b) => a.order - b.order);
    const text = sceneBlocks
      .filter(b => !(b.isLens && b.lensColor?.toLowerCase() === 'black'))
      .map(b => stripHtml(b.content))
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Calculate chapter stats if it's a chapter
  let chapterCharacters: string[] = [];
  if (!isScene) {
    const charIds = new Set<string>();
    chapterScenes.forEach(s => s.characterIds.forEach(id => charIds.add(id)));
    chapterCharacters = Array.from(charIds);
  }

  const countWords = (text: string) => {
    if (!text) return 0;
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.match(/[a-zA-Z0-9]+/g) || [];
    return chineseChars.length + englishWords.length;
  };

  const totalWords = activeDocBlocks.reduce((sum, b) => sum + countWords(b.content || ''), 0);

  return (
    <div className={cn(
      "flex-1 flex overflow-hidden relative transition-all duration-300",
      !activeDocId ? "hidden md:flex" : "flex",
      disguiseMode ? "bg-[#F3F2F1]" : "bg-white"
    )}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {disguiseMode && (
          <WordRibbon 
            title={activeDocument?.title || ''} 
            onClose={toggleDisguiseMode} 
            onEdit={() => {
              setShowDisguiseSettings(true);
            }}
          />
        )}
        {showFindReplace && (
          <div className="absolute top-4 right-4 z-[100] bg-white/90 backdrop-blur-md shadow-xl rounded-xl border border-stone-200/50 p-2 animate-in fade-in slide-in-from-top-4">
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
          onScroll={() => {
            if (disguiseMode && lastMousePosRef.current && blocksContainerRef.current) {
              const rect = blocksContainerRef.current.getBoundingClientRect();
              const x = lastMousePosRef.current.clientX - rect.left;
              const y = lastMousePosRef.current.clientY - rect.top;
              blocksContainerRef.current.style.setProperty('--mouse-x', `${x}px`);
              blocksContainerRef.current.style.setProperty('--mouse-y', `${y}px`);
            }
          }}
        className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden pb-32 md:pb-12 transition-all duration-300 relative",
        disguiseMode ? "px-4 md:px-8" : (
          isFullscreenMode 
            ? "px-6 py-12 md:px-12 md:py-16 lg:px-20 xl:px-24" 
            : compact
              ? "px-4 py-6 md:px-8 md:py-10"
              : "px-6 py-10 md:px-12 md:py-16 lg:px-16 xl:px-20"
        )
      )}>
        <div 
          className={cn(
            "mx-auto transition-all duration-300",
            disguiseMode ? "max-w-4xl grid w-full" : "max-w-4xl"
          )}
        >
          {disguiseMode && (
            <div className="col-start-1 row-start-1 pointer-events-none z-0 h-full">
              <div className="bg-white shadow-md border border-[#E1DFDD] px-8 md:px-16 py-16 w-full max-w-none my-8 min-h-[1056px] h-[calc(100%-4rem)] text-[#323130] font-sans text-[15px] leading-[1.5] whitespace-pre-wrap">
                {disguiseBackgroundText}
              </div>
            </div>
          )}

          <div className={cn(disguiseMode ? "col-start-1 row-start-1 z-10 flex flex-col w-full" : "flex flex-col")}>
            <div className={cn("flex items-start justify-between mb-4 gap-4 flex-col md:flex-row", disguiseMode && "hidden")}>
            <div className="flex items-center flex-1 min-w-0 gap-2 w-full">
              <button
                onClick={() => setActiveDocument(null)}
                className="md:hidden p-2 -ml-2 text-stone-400 hover:text-stone-600 rounded-md shrink-0"
                title="Back to Outline"
              >
                <ChevronLeft size={24} />
              </button>
              <input
                type="text"
                value={(scrollMode && isScene ? chapter?.title : activeDocument.title) || ''}
                disabled={isArchived}
                onChange={(e) => {
                  if (scrollMode && isScene) {
                    updateChapter({ id: chapterId, title: e.target.value });
                  } else if (isScene) {
                    updateScene({ id: activeDocId, title: e.target.value });
                  } else {
                    updateChapter({ id: activeDocId, title: e.target.value });
                  }
                }}
                className={cn(
                  "w-full outline-none placeholder:text-stone-300 bg-transparent whitespace-normal break-words caret-blue-500",
                  disguiseMode 
                    ? "font-mono text-base leading-snug text-black font-normal" 
                    : "text-2xl md:text-3xl font-serif font-semibold text-stone-900"
                )}
                placeholder="Untitled..."
              />
            </div>
            <div className="flex items-center flex-wrap justify-end gap-1 md:gap-2 relative shrink-0 w-full md:w-auto">
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

          {/* Character Appearance Matrix */}
          {!isScene && !disguiseMode && chapterCharacters.length > 0 && (
            <div className="mb-12 space-y-6">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Character Appearance Matrix</h3>
              <CharacterAppearanceMatrix
                scenes={chapterScenes}
                characters={characters.filter(c => chapterCharacters.includes(c.id))}
                selectedCharacterIds={chapterCharacters}
                onTogglePresence={toggleSceneCharacter}
                onUpdateNote={updateSceneCharacterNote}
              />
            </div>
          )}

          {/* Blocks */}
          <div 
            ref={blocksContainerRef}
            className={cn(
            disguiseMode 
              ? "bg-white shadow-md border border-[#E1DFDD] px-8 md:px-16 py-16 w-full max-w-none my-8 min-h-[1056px] relative" 
              : "space-y-6"
          )}
          onMouseMove={disguiseMode ? (e) => {
            lastMousePosRef.current = { clientX: e.clientX, clientY: e.clientY };
            if (blocksContainerRef.current) {
              const rect = blocksContainerRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              blocksContainerRef.current.style.setProperty('--mouse-x', `${x}px`);
              blocksContainerRef.current.style.setProperty('--mouse-y', `${y}px`);
              blocksContainerRef.current.style.opacity = '1';
            }
          } : undefined}
          onMouseLeave={disguiseMode ? () => {
            lastMousePosRef.current = null;
            if (blocksContainerRef.current) {
              blocksContainerRef.current.style.opacity = '0';
            }
          } : undefined}
          style={disguiseMode ? {
            WebkitMaskImage: `radial-gradient(circle 250px at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black 40%, transparent 100%)`,
            maskImage: `radial-gradient(circle 250px at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black 40%, transparent 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease-out'
          } : {}}
          >
            {(!isScene ? [{ id: activeDocId, isChapter: true, title: activeDocument.title }] : (scrollMode ? chapterScenes : [activeDocument as any])).map((doc, docIndex, docArray) => {
              const currentBlocks = doc.isChapter ? activeDocBlocks : allBlocks.filter(b => b.documentId === doc.id && !b.isStashed).sort((a, b) => a.order - b.order);
              const isLastDoc = docIndex === docArray.length - 1;
              
              return (
                <div key={doc.id} id={`document-${doc.id}`} className="flex flex-col w-full">
                  {scrollMode && isScene && (
                    <div className={cn("mb-6 mt-8 first:mt-0 flex items-center justify-between group/scene-header", disguiseMode && "hidden")}>
                      <input
                        type="text"
                        value={doc.title || ''}
                        disabled={isArchived}
                        onChange={(e) => updateScene({ id: doc.id, title: e.target.value })}
                        onFocus={() => {
                          if (doc.id !== activeDocId) {
                            preventScrollRef.current = true;
                            setActiveDocument(doc.id);
                          }
                        }}
                        className={cn(
                          "flex-1 min-w-0 outline-none placeholder:text-stone-300 bg-transparent whitespace-normal break-words caret-blue-500",
                          disguiseMode 
                            ? "font-mono text-lg leading-snug text-black font-bold" 
                            : "text-xl md:text-2xl font-serif font-semibold text-stone-800"
                        )}
                        placeholder="Untitled Scene..."
                      />
                      <button
                        onClick={() => handleCopyScene(doc.id)}
                        className="p-1.5 rounded-md text-stone-300 hover:text-stone-600 hover:bg-stone-100 opacity-0 group-hover/scene-header:opacity-100 transition-all"
                        title="Copy Scene Text"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                  
                  {currentBlocks.map((block, index) => {
                    const prevBlock = index > 0 ? currentBlocks[index - 1] : null;
                    const canMergeUp = !block.isLens && prevBlock && !prevBlock.isLens && !disguiseMode;

                    return (
                    <div key={block.id} id={`block-${block.id}`} className={cn(
                      "group relative flex flex-col transition-colors duration-500 w-full",
                      disguiseMode 
                        ? "mb-4 last:mb-0 relative"
                        : "mb-6 last:mb-0"
                    )}>
                      {disguiseMode && block.description && (
                        <div className="absolute -right-48 top-0 w-40 bg-yellow-100 border border-yellow-200 p-3 text-xs text-yellow-900 rounded shadow-sm">
                          <span className="font-bold block mb-1">批注:</span>
                          {block.description}
                        </div>
                      )}
                      
                      {showSlashMenu?.blockId === block.id && !disguiseMode && (
                        <SlashCommandMenu
                          onClose={() => setShowSlashMenu(null)}
                          onSelect={(action) => {
                            if (action === 'convert') toggleBlockLens(block.id);
                            if (action === 'stash') handleBlockChange(block.id, { isStashed: true, isLens: true, lensColor: 'white' });
                            if (action === 'merge') handleMergeUp(block.id);
                            if (action === 'split') handleSplitScene(block.id);
                            if (action === 'compare') setComparingBlockId(block.id);
                            if (action === 'delete') handleDeleteBlock(block.id);
                            setShowSlashMenu(null);
                          }}
                          position={showSlashMenu.position}
                        />
                      )}

                      <div className="flex items-stretch gap-2 w-full" style={{
                        paddingLeft: `${disguiseMode ? 0 : (editorMargin || 0)}rem`,
                        paddingRight: `${disguiseMode ? 0 : (editorMargin || 0)}rem`,
                      }}>
                        <div className="flex-1 min-w-0 w-full">
                          {/* Block Content */}
                          <div className={cn(
                            "w-full rounded-lg transition-colors relative",
                            block.isComparing && "ring-2 ring-blue-500 shadow-sm",
                            block.isLens && !disguiseMode && block.lensColor !== 'white'
                              ? cn("p-4 border-2", LENS_COLORS[block.lensColor as keyof typeof LENS_COLORS] || LENS_COLORS.red) 
                              : "px-4 border-2 border-transparent",
                            disguiseMode && "rounded-none p-0 border-0 bg-transparent"
                          )}>
                            {block.isComparing && !disguiseMode && (
                              <div className="absolute -top-8 bottom-0 right-0 w-0 z-50 pointer-events-none">
                                <div 
                                  className="sticky top-2 float-right bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md cursor-pointer hover:bg-blue-600 transition-colors flex items-center gap-1 pointer-events-auto whitespace-nowrap"
                                  onClick={() => setComparingBlockId(block.id)}
                                >
                                  <GitCompare size={12} />
                                  Comparing
                                </div>
                              </div>
                            )}
                            {block.isLens && !disguiseMode && (
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex space-x-1">
                                  {Object.keys(LENS_COLORS).filter(c => c !== 'white').map(color => (
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
                                        color === 'white' && "bg-white border-stone-300",
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
                            
                            {block.isLens && block.lensColor === 'white' && block.notes && !disguiseMode && (
                              <div className="mb-2 p-3 bg-stone-50 border border-stone-200 rounded-md text-sm text-stone-600 italic relative group/note">
                                <span className="font-bold not-italic text-stone-700 mr-2">💡 Inspiration:</span>
                                {block.notes}
                              </div>
                            )}
                            
                            <AutoResizeTextarea
                              scrollContainerRef={scrollContainerRef}
                              value={block.content || ''}
                              searchTerm={searchTerm}
                              blockId={block.id}
                              disabled={isArchived}
                              enableReadMode={!disguiseMode}
                              isFocused={focusedBlockId === block.id}
                              isDimmed={!disguiseMode && writingFocusMode && focusedBlockId !== null && focusedBlockId !== block.id}
                              isDisguiseMode={disguiseMode}
                              onFocus={() => {
                                setFocusedBlockId(block.id);
                                setOpenMenuBlockId(null);
                                if (block.documentId !== activeDocId) {
                                  preventScrollRef.current = true;
                                  setActiveDocument(block.documentId);
                                }
                              }}
                              onBlur={() => {
                                // Only clear if the focused block is still this one
                                setFocusedBlockId(prev => prev === block.id ? null : prev);
                              }}
                              onChange={(e: any) => handleBlockChange(block.id, { content: e.target.value })}
                              onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === '/' && !disguiseMode) {
                                  const textarea = e.currentTarget as HTMLTextAreaElement;
                                  const pos = textarea.selectionStart;
                                  const isStartOfBlock = pos === 0;
                                  const isStartOfParagraph = pos > 0 && textarea.value[pos - 1] === '\n';
                                  
                                  if (isStartOfBlock || isStartOfParagraph) {
                                    e.preventDefault();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setShowSlashMenu({ blockId: block.id, position: { top: rect.top + 20, left: rect.left } });
                                  }
                                }
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  const currentIndex = currentBlocks.findIndex(b => b.id === block.id);
                                  
                                  if (e.shiftKey) {
                                    // Shift + Tab: Previous block
                                    if (currentIndex > 0) {
                                      const prevBlock = currentBlocks[currentIndex - 1];
                                      setFocusedBlockId(prevBlock.id);
                                    } else if (isScene) {
                                      const blockSceneIndex = chapterScenes.findIndex(s => s.id === block.documentId);
                                      if (blockSceneIndex > 0) {
                                        // Move to previous scene in same chapter
                                        const prevScene = chapterScenes[blockSceneIndex - 1];
                                        const prevSceneBlocks = allBlocks
                                          .filter(b => b.documentId === prevScene.id)
                                          .sort((a, b) => a.order - b.order);
                                        
                                        if (prevSceneBlocks.length > 0) {
                                          const lastBlock = prevSceneBlocks[prevSceneBlocks.length - 1];
                                          if (!scrollMode) setActiveDocument(prevScene.id);
                                          setFocusedBlockId(lastBlock.id);
                                        }
                                      }
                                    }
                                  } else {
                                    // Tab: Next block
                                    if (currentIndex < currentBlocks.length - 1) {
                                      const nextBlock = currentBlocks[currentIndex + 1];
                                      setFocusedBlockId(nextBlock.id);
                                    } else if (isScene) {
                                      const blockSceneIndex = chapterScenes.findIndex(s => s.id === block.documentId);
                                      if (blockSceneIndex < chapterScenes.length - 1) {
                                        // Move to next scene in same chapter
                                        const nextScene = chapterScenes[blockSceneIndex + 1];
                                        const nextSceneBlocks = allBlocks
                                          .filter(b => b.documentId === nextScene.id)
                                          .sort((a, b) => a.order - b.order);
                                        
                                        if (nextSceneBlocks.length > 0) {
                                          const firstBlock = nextSceneBlocks[0];
                                          if (!scrollMode) setActiveDocument(nextScene.id);
                                          setFocusedBlockId(firstBlock.id);
                                        }
                                      }
                                    }
                                  }
                                }
                              }}
                              placeholder={block.isLens ? (block.lensColor === 'black' ? "Hidden content..." : "Enter lens content...") : "Start writing..."}
                              className={cn(
                                "w-full outline-none bg-transparent p-0",
                                disguiseMode 
                                  ? "font-sans text-[15px] leading-[1.5] text-[#323130]" 
                                  : (block.isLens 
                                      ? "text-base md:text-sm font-medium leading-relaxed" 
                                      : "text-lg leading-loose tracking-wide text-stone-900 font-serif"
                                    ),
                                block.isLens && block.lensColor === 'black' && !disguiseMode 
                                  ? "text-transparent focus:text-stone-900 placeholder:text-stone-400 focus:placeholder:text-stone-300 selection:bg-stone-200 selection:text-stone-900" 
                                  : ""
                              )}
                              style={{ letterSpacing: `${(letterSpacing || 0) * 0.05}em` }}
                            />
                          </div>

                          {/* Block Actions (Hover) */}
                          {!disguiseMode && !isArchived && (
                            <BlockHoverMenu
                              blockId={block.id}
                              docId={doc.id}
                              isLens={block.isLens}
                              canMergeUp={canMergeUp}
                              isScene={isScene}
                              openMenuBlockId={openMenuBlockId}
                              setOpenMenuBlockId={setOpenMenuBlockId}
                              handleAddBlock={handleAddBlock}
                              handleBlockChange={handleBlockChange}
                              handleMergeUp={handleMergeUp}
                              handleSplitScene={handleSplitScene}
                              setComparingBlockId={setComparingBlockId}
                              handleDeleteBlock={handleDeleteBlock}
                            />
                          )}
                        </div>

                        {/* Right Side Actions for Text Blocks */}
                        {!disguiseMode && !isArchived && (
                          <BlockRightActions
                            block={block}
                            toggleBlockDescription={toggleBlockDescription}
                            handleBlockChange={handleBlockChange}
                          />
                        )}
                      </div>
                    </div>
                    );
                  })}

                  {currentBlocks.length === 0 && !disguiseMode && (
                    <div className="flex space-x-4 mt-8">
                      <button 
                        onClick={() => handleAddBlock(false, undefined, doc.id)}
                        className="flex items-center px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors text-sm font-medium"
                      >
                        <AlignLeft size={16} className="mr-2" />
                        Add Text
                      </button>
                      <button 
                        onClick={() => handleAddBlock(true, undefined, doc.id)}
                        className="flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors text-sm font-medium"
                      >
                        <Highlighter size={16} className="mr-2" />
                        Add Color Lens
                      </button>
                    </div>
                  )}

                  {scrollMode && isScene && !isLastDoc && (
                    <hr className="border-t-2 border-dashed border-stone-200 my-16" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="h-[50vh]" /> {/* Bottom padding for Scroll Past End */}
        </div>
      </div>
      {disguiseMode && <WordStatusBar words={totalWords} />}
      </div>
      </div>
      
      <InspectorSidebar
        rightSidebarMode={rightSidebarMode}
        setRightSidebarMode={setRightSidebarMode}
        isScene={isScene}
        activeDocId={activeDocId}
        activeDocument={activeDocument}
        chapters={chapters}
        scenes={scenes}
        tocSections={tocSections}
        collapsedTocSections={collapsedTocSections}
        setCollapsedTocSections={setCollapsedTocSections}
        isSectionCollapsed={isSectionCollapsed}
        toggleTocSection={toggleTocSection}
        updateBlock={updateBlock}
        navigateToBlock={navigateToBlock}
        moveScene={moveScene}
        updateScene={updateScene}
        totalWords={totalWords}
        characters={characters}
        activeWorkId={activeWorkId}
        setActiveDocument={setActiveDocument}
        isFullscreenMode={isFullscreenMode}
        disguiseMode={disguiseMode}
      />

      <DisguiseSettingsModal
        showDisguiseSettings={showDisguiseSettings}
        setShowDisguiseSettings={setShowDisguiseSettings}
        disguiseBackgroundText={disguiseBackgroundText}
        setDisguiseBackgroundText={setDisguiseBackgroundText}
      />

      <FloatingBackToTop
        showBackToTop={showBackToTop}
        disguiseMode={disguiseMode}
        rightSidebarMode={rightSidebarMode}
        isFullscreenMode={isFullscreenMode}
        scrollToTop={scrollToTop}
      />

      <ViewSettingsMenu
        disguiseMode={disguiseMode}
        rightSidebarMode={rightSidebarMode}
        isFullscreenMode={isFullscreenMode}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        scrollMode={scrollMode}
        toggleScrollMode={toggleScrollMode}
        toggleDisguiseMode={toggleDisguiseMode}
        writingFocusMode={writingFocusMode}
        toggleWritingFocusMode={toggleWritingFocusMode}
        letterSpacing={letterSpacing}
        setLetterSpacing={setLetterSpacing}
        editorMargin={editorMargin}
        setEditorMargin={setEditorMargin}
        isScene={isScene}
      />
      
      {comparingBlockId && (
        <BlockCompareModal
          blockId={comparingBlockId}
          onClose={() => setComparingBlockId(null)}
        />
      )}
      </div>
  );
}
