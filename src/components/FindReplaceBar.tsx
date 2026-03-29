import React, { useState, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Search, ChevronUp, ChevronDown, X, Replace } from 'lucide-react';
import { cn } from '../lib/utils';

interface Match {
  blockId: string;
  index: number;
  length: number;
  content: string;
  localIndex: number;
}

export function FindReplaceBar({ onClose, onSearchChange }: { onClose: () => void; onSearchChange: (text: string) => void }) {
  const { 
    blocks, 
    chapters, 
    scenes, 
    activeWorkId, 
    activeDocumentId, 
    setActiveDocument, 
    bulkUpdateBlocks 
  } = useStore(useShallow(state => ({
    blocks: state.blocks,
    chapters: state.chapters,
    scenes: state.scenes,
    activeWorkId: state.activeWorkId,
    activeDocumentId: state.activeDocumentId,
    setActiveDocument: state.setActiveDocument,
    bulkUpdateBlocks: state.bulkUpdateBlocks
  })));

  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchWholeWork, setSearchWholeWork] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  
  // Track previous search params to decide whether to reset index
  const prevSearchParams = React.useRef({ findText, searchWholeWork });

  // Notify parent of search text change
  useEffect(() => {
    onSearchChange(findText);
  }, [findText, onSearchChange]);

  // Scroll to match
  const scrollToMatch = (match: Match) => {
    const highlightId = `highlight-${match.blockId}-${match.localIndex}`;
    const highlightEl = document.getElementById(highlightId);
    
    if (highlightEl) {
        highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const blockId = match.blockId;
    const element = document.getElementById(`block-${blockId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        const block = blocks.find(b => b.id === blockId);
        if (block && block.documentId !== activeDocumentId) {
            setActiveDocument(block.documentId);
            setTimeout(() => {
                const el = document.getElementById(highlightId) || document.getElementById(`block-${blockId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        const paramsChanged = prevSearchParams.current.findText !== findText || 
                              prevSearchParams.current.searchWholeWork !== searchWholeWork;
        
        prevSearchParams.current = { findText, searchWholeWork };

        if (!findText) {
            setMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const relevantBlocks = blocks.filter(b => {
            if (searchWholeWork) {
                const workChapters = chapters.filter(c => c.workId === activeWorkId).map(c => c.id);
                const workScenes = scenes.filter(s => workChapters.includes(s.chapterId)).map(s => s.id);
                const workDocs = [...workChapters, ...workScenes];
                return workDocs.includes(b.documentId);
            } else {
                return b.documentId === activeDocumentId;
            }
        });

        // Sort blocks
        let sortedBlocks = relevantBlocks;
        if (searchWholeWork) {
            const workChapters = chapters
                .filter(c => c.workId === activeWorkId)
                .sort((a, b) => a.order - b.order);
            
            const docOrder: string[] = [];
            workChapters.forEach(c => {
                docOrder.push(c.id);
                const workScenes = scenes
                    .filter(s => s.chapterId === c.id)
                    .sort((a, b) => a.order - b.order);
                workScenes.forEach(s => docOrder.push(s.id));
            });

            sortedBlocks = relevantBlocks.sort((a, b) => {
                const docIndexA = docOrder.indexOf(a.documentId);
                const docIndexB = docOrder.indexOf(b.documentId);
                if (docIndexA !== docIndexB) return docIndexA - docIndexB;
                return a.order - b.order;
            });
        } else {
            sortedBlocks = relevantBlocks.sort((a, b) => a.order - b.order);
        }

        const newMatches: Match[] = [];
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        sortedBlocks.forEach(block => {
            if (!block.content) return;
            let match;
            let localIndex = 0;
            while ((match = regex.exec(block.content)) !== null) {
                newMatches.push({
                    blockId: block.id,
                    index: match.index,
                    length: match[0].length,
                    content: block.content,
                    localIndex: localIndex++
                });
            }
        });

        setMatches(newMatches);

        if (newMatches.length > 0) {
            if (paramsChanged) {
                setCurrentMatchIndex(0);
                scrollToMatch(newMatches[0]);
            } else {
                // Try to preserve position
                setCurrentMatchIndex(prev => {
                    if (prev === -1) return 0;
                    return Math.min(prev, newMatches.length - 1);
                });
            }
        } else {
            setCurrentMatchIndex(-1);
        }

    }, 300);
    return () => clearTimeout(timeoutId);
  }, [findText, searchWholeWork, blocks, chapters, scenes, activeWorkId, activeDocumentId]); // Removed matches from deps

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(matches[nextIndex]);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(matches[prevIndex]);
  };

  const handleReplace = () => {
    if (currentMatchIndex === -1 || matches.length === 0) return;
    const match = matches[currentMatchIndex];
    
    // Construct new content
    const before = match.content.substring(0, match.index);
    const after = match.content.substring(match.index + match.length);
    const newContent = before + replaceText + after;

    bulkUpdateBlocks([{ id: match.blockId, content: newContent }]);
    
    // The useEffect will trigger re-search.
    // But we might want to stay on "next" match relative to current position?
    // For now, standard behavior is fine.
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    // Group matches by block ID to handle multiple replacements in same block
    const updates = new Map<string, string>();
    
    // We need to be careful about indices shifting if we replace multiple times in one block.
    // Easiest way: Iterate blocks, do global replace on content.
    
    const relevantBlockIds = new Set<string>(matches.map(m => m.blockId));
    const bulkUpdates: { id: string; content: string }[] = [];

    relevantBlockIds.forEach(blockId => {
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const newContent = block.content.replace(regex, replaceText);
            if (newContent !== block.content) {
                bulkUpdates.push({ id: blockId, content: newContent });
            }
        }
    });

    if (bulkUpdates.length > 0) {
        bulkUpdateBlocks(bulkUpdates);
    }
  };

  return (
    <div className="flex flex-col p-2 bg-stone-100 border-b border-stone-200 animate-in slide-in-from-top-2">
      <div className="flex items-center space-x-2 mb-2">
        <div className="relative flex-1">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
                autoFocus
                type="text"
                placeholder="Find..."
                value={findText}
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleNext();
                }}
                className="w-full pl-8 pr-2 py-1 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
        </div>
        <div className="flex items-center space-x-1">
            <button onClick={handlePrev} className="p-1 hover:bg-stone-200 rounded" title="Previous Match">
                <ChevronUp size={16} />
            </button>
            <button onClick={handleNext} className="p-1 hover:bg-stone-200 rounded" title="Next Match">
                <ChevronDown size={16} />
            </button>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded text-stone-500">
            <X size={16} />
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
            <Replace size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
                type="text"
                placeholder="Replace..."
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') handleReplace();
                }}
                className="w-full pl-8 pr-2 py-1 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={handleReplace} 
                disabled={currentMatchIndex === -1}
                className="px-2 py-1 text-xs bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
            >
                Replace
            </button>
            <button 
                onClick={handleReplaceAll}
                disabled={matches.length === 0}
                className="px-2 py-1 text-xs bg-white border border-stone-300 rounded hover:bg-stone-50 disabled:opacity-50"
            >
                All
            </button>
        </div>
      </div>

      <div className="flex items-center mt-2 space-x-4 text-xs text-stone-500">
        <label className="flex items-center space-x-1 cursor-pointer select-none">
            <input 
                type="checkbox" 
                checked={searchWholeWork} 
                onChange={e => setSearchWholeWork(e.target.checked)}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Search Whole Work</span>
        </label>
        <span>
            {matches.length === 0 ? 'No matches' : `${currentMatchIndex + 1} of ${matches.length}`}
        </span>
      </div>
    </div>
  );
}
