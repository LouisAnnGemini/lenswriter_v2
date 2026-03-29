import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WorkIcon } from './WorkIcon';
import { Smile } from 'lucide-react';

interface WorkIconPickerProps {
  currentIcon?: string;
  onSelect: (icon: string) => void;
  children: React.ReactNode;
}

const BUILT_IN_ICONS = [
  '', // Default
  'book-red',
  'book-orange',
  'book-yellow',
  'book-green',
  'book-blue',
  'book-purple',
  'book-pink',
];

const COMMON_EMOJIS = ['🚀', '🌟', '💡', '🔥', '✨', '📝', '📚', '🎨', '🎭', '🎬', '🔮', '🗡️', '🛡️', '👑', '🐉', '👽', '🤖', '👻', '💀', '❤️'];

export function WorkIconPicker({ currentIcon, onSelect, children }: WorkIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Calculate position
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (icon: string) => {
    onSelect(icon);
    setIsOpen(false);
  };

  const handleCustomEmojiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmoji) {
      // Get the first emoji/character
      const emoji = Array.from(customEmoji)[0] as string;
      if (emoji) {
        handleSelect(emoji);
        setCustomEmoji('');
      }
    }
  };

  const popoverContent = isOpen ? (
    <div 
      ref={popoverRef}
      className="fixed z-[100] w-64 bg-white rounded-lg shadow-xl border border-stone-200 p-3"
      style={{ top: coords.top, left: coords.left }}
    >
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Colors</h4>
        <div className="flex flex-wrap gap-2">
          {BUILT_IN_ICONS.map((icon) => (
            <button
              key={icon || 'default'}
              onClick={() => handleSelect(icon)}
              className={`p-1.5 rounded hover:bg-stone-100 transition-colors ${currentIcon === icon ? 'bg-stone-100 ring-1 ring-stone-300' : ''}`}
              title={icon ? icon.split('-')[1] : 'Default'}
            >
              <WorkIcon icon={icon} size={18} className={!icon ? 'text-stone-400' : ''} />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Common Emojis</h4>
        <div className="flex flex-wrap gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-stone-100 transition-colors text-lg ${currentIcon === emoji ? 'bg-stone-100 ring-1 ring-stone-300' : ''}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Custom Emoji</h4>
        <form onSubmit={handleCustomEmojiSubmit} className="flex gap-2">
          <input
            type="text"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="Paste an emoji..."
            className="flex-1 text-sm px-2 py-1.5 border border-stone-200 rounded outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            maxLength={2} // Allow surrogate pairs
          />
          <button 
            type="submit"
            disabled={!customEmoji}
            className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded text-sm font-medium hover:bg-stone-200 disabled:opacity-50 transition-colors"
          >
            Set
          </button>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
      </div>
      {isOpen && createPortal(popoverContent, document.body)}
    </div>
  );
}
