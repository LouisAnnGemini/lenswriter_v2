import React from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { LensesTab } from './LensesTab';
import { TimelineTab } from './TimelineTab';
import { BlockManagementTab } from './BlockManagementTab';
import { cn } from '../lib/utils';

export function BoardTab() {
  const { activeWorkId, boardViewMode, appMode } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    boardViewMode: state.boardViewMode,
    appMode: state.appMode
  })));

  if (!activeWorkId) return null;

  if (appMode === 'writing') {
    return (
      <div className="flex-1 grid grid-cols-3 gap-4 p-4 h-full overflow-hidden">
        <div className="flex flex-col overflow-hidden border border-stone-200 rounded-lg bg-white shadow-sm">
          <div className="p-2 border-b border-stone-100 font-medium text-sm text-stone-700 bg-stone-50">Block Description</div>
          <div className="flex-1 overflow-hidden"><BlockManagementTab /></div>
        </div>
        <div className="flex flex-col overflow-hidden border border-stone-200 rounded-lg bg-white shadow-sm">
          <div className="p-2 border-b border-stone-100 font-medium text-sm text-stone-700 bg-stone-50">Lenses</div>
          <div className="flex-1 overflow-hidden"><LensesTab isSubTab /></div>
        </div>
        <div className="flex flex-col overflow-hidden border border-stone-200 rounded-lg bg-white shadow-sm">
          <div className="p-2 border-b border-stone-100 font-medium text-sm text-stone-700 bg-stone-50">Timeline Events</div>
          <div className="flex-1 overflow-hidden"><TimelineTab isSubTab /></div>
        </div>
      </div>
    );
  }

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
