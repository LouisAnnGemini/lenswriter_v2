import React, { useState, useMemo } from 'react';
import { Check, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  id: string;
  title: string;
  color?: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select events...',
  renderOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => 
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
    <div className="relative w-full">
      <div 
        className="min-h-[36px] bg-white border border-stone-200 rounded px-2 py-1 flex flex-wrap gap-1 items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedIds.length === 0 && <span className="text-stone-400 text-xs">{placeholder}</span>}
        {selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          return option ? (
            <span key={id} className={cn("text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border", option.color || "bg-amber-100 text-amber-800 border-amber-200")}>
              {option.title}
              <X size={10} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleOption(id); }} />
            </span>
          ) : null;
        })}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-md shadow-lg">
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
                className="px-3 py-2 text-xs hover:bg-stone-50 cursor-pointer flex items-center justify-between"
                onClick={() => toggleOption(opt.id)}
              >
                {renderOption ? renderOption(opt) : (
                  opt.color ? (
                    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", opt.color)}>
                      {opt.title}
                    </span>
                  ) : (
                    <span className="truncate">{opt.title}</span>
                  )
                )}
                {selectedIds.includes(opt.id) && <Check size={12} className="text-emerald-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
