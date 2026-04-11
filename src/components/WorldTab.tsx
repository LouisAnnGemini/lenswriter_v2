import React from 'react';
import { useStore } from '../store/stores/useStore';
import { cn } from '../lib/utils';
import { CharactersTab } from './CharactersTab';
import { LocationsTab } from './LocationsTab';

export function WorldTab() {
  const worldViewMode = useStore(state => state.worldViewMode);

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-stone-50 overflow-hidden",
      "pb-16 md:pb-0" // Space for mobile bottom nav
    )}>
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {worldViewMode === 'characters' ? <CharactersTab /> : <LocationsTab isSubTab />}
      </div>
    </div>
  );
}
