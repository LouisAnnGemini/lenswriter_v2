import React from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { MontageBoard } from './MontageBoard';

export function MontageTab() {
  const { 
    activeWorkId, 
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
  })));

  if (!activeWorkId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/50 overflow-hidden">
      <MontageBoard />
    </div>
  );
}
