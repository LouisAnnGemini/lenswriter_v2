import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, Send, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function QuickCapture() {
  const { addNote, inboxTags, notes, addInboxTag } = useStore(useShallow(state => ({
    addNote: state.addNote,
    inboxTags: state.inboxTags,
    notes: state.notes,
    addInboxTag: state.addInboxTag
  })));
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const recentTags = React.useMemo(() => {
    const tagCounts: Record<string, number> = {};
    notes.forEach(item => item.tagIds?.forEach(id => tagCounts[id] = (tagCounts[id] || 0) + 1));
    return inboxTags
      .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
      .slice(0, 5);
  }, [notes, inboxTags]);

  const filteredTags = inboxTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        const tagId = filteredTags[0].id;
        setTagIds(prev => prev.includes(tagId) ? prev : [...prev, tagId]);
      } else if (tagSearch.trim()) {
        const newTagId = addInboxTag({ name: tagSearch.trim() });
        if (newTagId) setTagIds(prev => [...prev, newTagId]);
      }
      setTagSearch('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (content.trim()) {
      addNote({ content: content.trim(), tagIds, workId: null, sceneId: null });
      setContent('');
      setTagIds([]);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2 text-stone-700 font-medium">
            <Inbox size={20} className="text-emerald-600" /> Quick Note
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? (Cmd/Ctrl + Enter to save)"
            className="w-full h-32 resize-none outline-none text-stone-700 placeholder:text-stone-400 bg-transparent"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {tagIds.map(tagId => {
              const tag = inboxTags.find(t => t.id === tagId);
              return tag ? (
                <span key={tag.id} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs">{tag.name} <button onClick={() => setTagIds(prev => prev.filter(id => id !== tagId))}><X size={10} /></button></span>
              ) : null;
            })}
            <div className="relative group">
              <input 
                placeholder="Search tags..." 
                onChange={(e) => setTagSearch(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="text-xs bg-stone-100 rounded px-2 py-1 w-full"
              />
              <div className="absolute top-full left-0 bg-white border rounded shadow-lg z-10 w-40 max-h-40 overflow-y-auto hidden group-focus-within:block">
                <div className="text-[10px] text-stone-500 px-2 py-1">Recent:</div>
                <div className="flex flex-wrap gap-1 px-2 pb-2">
                  {recentTags.map(tag => (
                    <button key={tag.id} onClick={() => setTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])} className="px-2 py-1 bg-stone-100 rounded text-[10px] hover:bg-stone-200">{tag.name}</button>
                  ))}
                </div>
                {tagSearch && (
                  <>
                    <div className="text-[10px] text-stone-500 px-2 py-1 border-t">Search Results:</div>
                    {filteredTags.length > 0 ? (
                      filteredTags.map(tag => (
                        <button key={tag.id} onClick={() => setTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
                      ))
                    ) : (
                      <button 
                        onClick={() => {
                          const newTagId = addInboxTag({ name: tagSearch });
                          if (newTagId) setTagIds(prev => [...prev, newTagId]);
                          setTagSearch('');
                        }}
                        className="block w-full text-left px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50"
                      >
                        + Add "{tagSearch}"
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
          <div className="text-xs text-stone-400">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-500 font-mono">Cmd/Ctrl + Enter</kbd> to save
          </div>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Save to Notes
          </button>
        </div>
      </div>
    </div>
  );
}
