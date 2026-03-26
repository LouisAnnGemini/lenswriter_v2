import React from 'react';
import { Search, Filter, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SearchableSelect } from '../SearchableSelect';
import { Character, Location, Tag } from '../../store/types';

interface TimelineFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCharacters: string[];
  setSelectedCharacters: (ids: string[]) => void;
  selectedLocations: string[];
  setSelectedLocations: (ids: string[]) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedTags: string[];
  setSelectedTags: (ids: string[]) => void;
  characters: Character[];
  locations: Location[];
  tags: Tag[];
  activeWorkId: string;
  EVENT_COLORS: Record<string, string>;
  isFilterActive: boolean;
}

export const TimelineFilterBar = React.memo(({
  searchQuery,
  setSearchQuery,
  selectedCharacters,
  setSelectedCharacters,
  selectedLocations,
  setSelectedLocations,
  selectedColors,
  setSelectedColors,
  selectedTags,
  setSelectedTags,
  characters,
  locations,
  tags,
  activeWorkId,
  EVENT_COLORS,
  isFilterActive
}: TimelineFilterBarProps) => {
  return (
    <div className="p-4 md:p-6 pb-0 shrink-0">
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
          <Search size={16} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title or description..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-stone-800 placeholder-stone-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center text-xs font-medium text-stone-500 mr-2">
            <Filter size={14} className="mr-1.5" />
            Filters:
          </div>
          
          <SearchableSelect
            options={characters.filter(c => c.workId === activeWorkId).map(c => ({ id: c.id, label: c.name }))}
            selectedIds={selectedCharacters}
            onChange={setSelectedCharacters}
            placeholder="Characters"
            className="w-40"
          />
          
          <SearchableSelect
            options={locations.filter(l => l.workId === activeWorkId).map(l => ({ id: l.id, label: l.name }))}
            selectedIds={selectedLocations}
            onChange={setSelectedLocations}
            placeholder="Locations"
            className="w-40"
          />

          <SearchableSelect
            options={tags.map(t => ({ id: t.id, label: t.name, color: t.color }))}
            selectedIds={selectedTags}
            onChange={setSelectedTags}
            placeholder="Tags"
            className="w-40"
          />
          
          <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-lg border border-stone-200">
            {Object.entries(EVENT_COLORS).map(([colorKey, colorClass]) => (
              <button
                key={colorKey}
                onClick={() => {
                  if (selectedColors.includes(colorKey)) {
                    setSelectedColors(selectedColors.filter(c => c !== colorKey));
                  } else {
                    setSelectedColors([...selectedColors, colorKey]);
                  }
                }}
                className={cn(
                  "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                  colorClass,
                  selectedColors.includes(colorKey) ? "ring-2 ring-emerald-500 ring-offset-1 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"
                )}
                title={`Filter by ${colorKey}`}
              >
                {selectedColors.includes(colorKey) && <Check size={12} className="opacity-70" />}
              </button>
            ))}
          </div>

          {isFilterActive && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCharacters([]);
                setSelectedLocations([]);
                setSelectedColors([]);
                setSelectedTags([]);
              }}
              className="text-xs text-stone-500 hover:text-stone-800 underline decoration-stone-300 underline-offset-2 ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
