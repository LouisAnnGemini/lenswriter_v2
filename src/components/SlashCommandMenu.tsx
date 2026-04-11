import React, { useState, useEffect } from 'react';
import { Highlighter, ArrowUpToLine, Scissors, GitCompare, Trash2, Archive } from 'lucide-react';
import { cn } from '../lib/utils';

interface SlashCommandMenuProps {
  onClose: () => void;
  onSelect: (action: string) => void;
  position: { top: number; left: number };
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ onClose, onSelect, position }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const actions = [
    { name: 'Convert Block', icon: Highlighter, action: 'convert' },
    { name: 'Stash Block', icon: Archive, action: 'stash' },
    { name: 'Merge Up', icon: ArrowUpToLine, action: 'merge' },
    { name: 'Split Scene', icon: Scissors, action: 'split' },
    { name: 'Compare', icon: GitCompare, action: 'compare' },
    { name: 'Delete', icon: Trash2, action: 'delete' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (e.target instanceof Node && !document.querySelector('.slash-menu')?.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % actions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + actions.length) % actions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(actions[selectedIndex].action);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, actions, onSelect, onClose]);

  return (
    <div 
      className="fixed z-[9999] bg-white shadow-lg rounded-md border border-stone-200 p-1 w-48 slash-menu"
      style={{ top: position.top, left: position.left }}
    >
      {actions.map((action, index) => (
        <button
          key={action.action}
          onClick={() => onSelect(action.action)}
          className={cn(
            "flex items-center w-full p-2 text-sm text-stone-700 rounded-sm",
            index === selectedIndex ? "bg-stone-100" : "hover:bg-stone-100"
          )}
        >
          <action.icon size={16} className="mr-2" />
          {action.name}
        </button>
      ))}
    </div>
  );
};
