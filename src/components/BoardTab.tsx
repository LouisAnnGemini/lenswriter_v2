import React from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { LensesTab } from './LensesTab';
import { TimelineTab } from './TimelineTab';
import { BlockManagementTab } from './BlockManagementTab';
import { cn } from '../lib/utils';

export function BoardTab() {
  const { activeWorkId, boardViewMode } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    boardViewMode: state.boardViewMode
  })));

  if (!activeWorkId) return null;

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-stone-50 overflow-hidden",
      "pb-28 md:pb-0" // Space for mobile bottom nav (16) + board switcher (12)
    )}>
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {boardViewMode === 'micro' && <BlockManagementTab />}
        {boardViewMode === 'meso' && <LensesTab isSubTab />}
        {boardViewMode === 'macro' && <TimelineTab isSubTab />}
      </div>
    </div>
  );
}
