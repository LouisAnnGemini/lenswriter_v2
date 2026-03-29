import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const EditableInput = ({ 
  value, 
  onSave, 
  className, 
  type = "text",
  placeholder
}: { 
  value: string | number, 
  onSave: (val: any) => void, 
  className?: string,
  type?: string,
  placeholder?: string
}) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const val = type === 'number' ? (parseInt(localValue) || 0) : localValue;
        if (val !== value) onSave(val);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const val = type === 'number' ? (parseInt(localValue) || 0) : localValue;
          if (val !== value) onSave(val);
          (e.target as HTMLInputElement).blur();
        }
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={className}
      placeholder={placeholder}
    />
  );
};

export const EditableTextarea = ({ 
  value, 
  onSave, 
  className, 
  placeholder,
  rows = 2
}: { 
  value: string, 
  onSave: (val: string) => void, 
  className?: string,
  placeholder?: string,
  rows?: number
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) onSave(localValue);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={className}
      placeholder={placeholder}
      rows={rows}
    />
  );
};

export const InlineMultiSelect = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select...',
  renderTag,
  className,
  onCreateOption
}: {
  options: { id: string; title: string; color?: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  renderTag?: (option: any, onRemove: () => void) => React.ReactNode;
  className?: string;
  onCreateOption?: (title: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom, left: rect.left });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  const filteredOptions = React.useMemo(() => 
    options.filter(opt => (opt.title || '').toLowerCase().includes((search || '').toLowerCase())),
    [options, search]
  );

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sId => sId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div 
        className="min-h-[24px] flex flex-wrap gap-1 items-center cursor-pointer group"
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
      >
        {selectedIds.length === 0 && <span className="text-stone-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">{placeholder}</span>}
        {selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;
          if (renderTag) return renderTag(option, () => toggleOption(id));
          return (
            <span key={id} className="bg-stone-100 text-stone-600 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
              {option.title}
              <button onClick={(e) => { e.stopPropagation(); toggleOption(id); }} className="hover:text-red-500"><X size={10} /></button>
            </span>
          );
        })}
      </div>

      {isOpen && (
        <div 
          className="fixed z-[100] w-48 mt-1 bg-white border border-stone-200 rounded-md shadow-lg"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2 border-b border-stone-100">
            <div className="flex items-center gap-2 bg-stone-50 px-2 py-1 rounded">
              <Search size={12} className="text-stone-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none"
                placeholder="Search..."
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto py-1">
            {filteredOptions.length === 0 && !onCreateOption ? (
              <div className="px-3 py-2 text-xs text-stone-500 italic">No results</div>
            ) : (
              <>
                {filteredOptions.map(opt => (
                  <div 
                    key={opt.id} 
                    className="px-3 py-1.5 text-xs hover:bg-stone-50 cursor-pointer flex items-center justify-between"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleOption(opt.id); }}
                  >
                    {opt.color ? (
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", opt.color)}>
                        {opt.title}
                      </span>
                    ) : (
                      <span className="truncate">{opt.title}</span>
                    )}
                    {selectedIds.includes(opt.id) && <Check size={12} className="text-stone-600 shrink-0" />}
                  </div>
                ))}
                {onCreateOption && search.trim() !== '' && !options.some(opt => opt.title.toLowerCase() === search.trim().toLowerCase()) && (
                  <div 
                    className="px-3 py-1.5 text-xs hover:bg-stone-50 cursor-pointer flex items-center text-stone-600"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCreateOption(search.trim());
                      setSearch('');
                    }}
                  >
                    + Create "{search.trim()}"
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TAG_COLORS = [
  'bg-red-100 text-red-800 border-red-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  'bg-lime-100 text-lime-800 border-lime-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-stone-100 text-stone-800 border-stone-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-rose-100 text-rose-800 border-rose-200'
];

export const getRandomColor = () => TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

export const EVENT_COLORS = {
  stone: 'bg-stone-100 border-stone-200 text-stone-800',
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-stone-50 border-stone-200 text-stone-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
};
