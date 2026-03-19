import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { cn } from '../lib/utils';
import { AlignLeft, LayoutGrid, Clock } from 'lucide-react';
import { LensesTab } from './LensesTab';
import { TimelineTab } from './TimelineTab';
import { BlockManagementTab } from './BlockManagementTab';

export function BoardTab() {
  const { state } = useStore();
  const [viewMode, setViewMode] = useState<'micro' | 'meso' | 'macro'>('meso');

  if (!state.activeWorkId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className="p-4 border-b border-stone-200 bg-white shrink-0 flex items-center space-x-4">
        <h2 className="text-xl font-bold text-stone-800 mr-4">Board</h2>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('micro')}
            className={cn(
              "flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'micro' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <AlignLeft size={16} className="mr-2" />
            Block Descriptions
          </button>
          <button
            onClick={() => setViewMode('meso')}
            className={cn(
              "flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'meso' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <LayoutGrid size={16} className="mr-2" />
            Lenses
          </button>
          <button
            onClick={() => setViewMode('macro')}
            className={cn(
              "flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === 'macro' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Clock size={16} className="mr-2" />
            Timeline Events
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {viewMode === 'micro' && <BlockManagementTab />}
        {viewMode === 'meso' && <LensesTab isSubTab />}
        {viewMode === 'macro' && <TimelineTab isSubTab />}
      </div>
    </div>
  );
}
