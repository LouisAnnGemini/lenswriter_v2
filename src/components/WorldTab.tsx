import React, { useState } from 'react';
import { Users, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { CharactersTab } from './CharactersTab';
import { LocationsTab } from './LocationsTab';

export function WorldTab() {
  const [activeSubTab, setActiveSubTab] = useState<'characters' | 'locations'>('characters');

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-stone-50 overflow-hidden",
      "pb-16 md:pb-0" // Space for mobile bottom nav
    )}>
      <div className="p-4 border-b border-stone-200 bg-white shrink-0 flex flex-col sm:flex-row sm:items-center gap-4">
        <h2 className="text-xl font-bold text-stone-800">World</h2>
        <div className="flex bg-stone-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('characters')}
            className={cn(
              "flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeSubTab === 'characters' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Users size={16} className="mr-2" />
            Characters
          </button>
          <button
            onClick={() => setActiveSubTab('locations')}
            className={cn(
              "flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeSubTab === 'locations' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <MapPin size={16} className="mr-2" />
            Locations
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeSubTab === 'characters' ? <CharactersTab /> : <LocationsTab isSubTab />}
      </div>
    </div>
  );
}
