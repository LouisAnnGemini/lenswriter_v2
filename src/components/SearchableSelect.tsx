import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  id: string;
  title: string;
  color?: string; // Optional color for display
}

interface SearchableSelectProps {
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  renderOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => 
    options.filter(opt => (opt.title || '').toLowerCase().includes((search || '').toLowerCase())),
    [options, search]
  );

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="min-h-[36px] bg-stone-50 border border-stone-200 rounded px-2 py-1.5 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("text-sm", !selectedOption && "text-stone-400")}>
          {selectedOption ? (renderOption ? renderOption(selectedOption) : selectedOption.title) : placeholder}
        </span>
        <Search size={14} className="text-stone-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg min-w-[150px]">
          <div className="p-2 border-b border-stone-100">
            <div className="flex items-center gap-2 bg-stone-50 px-2 py-1 rounded">
              <Search size={14} className="text-stone-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none"
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filteredOptions.map(opt => (
              <div 
                key={opt.id} 
                className={cn(
                  "px-3 py-2 text-xs hover:bg-stone-50 cursor-pointer flex items-center justify-between",
                  value === opt.id && "bg-emerald-50"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(opt.id);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {renderOption ? renderOption(opt) : opt.title}
                {value === opt.id && <Check size={12} className="text-emerald-600" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
