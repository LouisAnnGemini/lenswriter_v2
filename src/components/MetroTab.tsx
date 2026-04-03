import React from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { MetroBoard } from './MetroBoard';

export function MetroTab() {
  const { 
    activeWorkId, 
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
  })));

  if (!activeWorkId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/50 overflow-hidden">
      <MetroBoard />
    </div>
  );
}
