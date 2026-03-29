import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, Send, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function QuickCapture() {
  const { addInboxItem } = useStore(useShallow(state => ({
    addInboxItem: state.addInboxItem
  })));
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      addInboxItem({ content: content.trim() });
      setContent('');
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
            <Inbox size={20} className="text-stone-600" /> Quick Capture
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
        </div>
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
          <div className="text-xs text-stone-400">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-500 font-mono">Cmd/Ctrl + Enter</kbd> to save
          </div>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-stone-800 text-white text-sm font-medium rounded-md hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            Save to Inbox
          </button>
        </div>
      </div>
    </div>
  );
}
