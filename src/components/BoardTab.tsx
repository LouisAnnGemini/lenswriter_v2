import React from 'react';
import { useStore } from '../store/StoreContext';
import { LensesTab } from './LensesTab';
import { TimelineTab } from './TimelineTab';
import { BlockManagementTab } from './BlockManagementTab';
import { cn } from '../lib/utils';

export function BoardTab() {
  const { state, dispatch } = useStore();

  if (!state.activeWorkId) return null;

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-stone-50 overflow-hidden",
      "pb-28 md:pb-0" // Space for mobile bottom nav (16) + board switcher (12)
    )}>
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {state.boardViewMode === 'micro' && <BlockManagementTab />}
        {state.boardViewMode === 'meso' && <LensesTab isSubTab />}
        {state.boardViewMode === 'macro' && <TimelineTab isSubTab />}
      </div>
    </div>
  );
}
