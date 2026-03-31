import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreState } from '../types';
import { initialState } from '../constants';
import { createWorkSlice } from './slices/workSlice';
import { createCharacterSlice } from './slices/characterSlice';
import { createChapterSlice } from './slices/chapterSlice';
import { createSceneSlice } from './slices/sceneSlice';
import { createBlockSlice } from './slices/blockSlice';
import { createTagSlice, createDeadlineSlice, createInboxSlice } from './slices/tagDeadlineInboxSlice';
import { createTimelineSlice } from './slices/timelineSlice';
import { createUISlice } from './slices/uiSlice';
import { createLocationSlice } from './slices/locationSlice';
import { createSnapshotSlice } from './slices/snapshotSlice';

export const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...initialState,
      ...createWorkSlice(set, get, api),
      ...createCharacterSlice(set, get, api),
      ...createChapterSlice(set, get, api),
      ...createSceneSlice(set, get, api),
      ...createBlockSlice(set, get, api),
      ...createTagSlice(set, get, api),
      ...createDeadlineSlice(set, get, api),
      ...createInboxSlice(set, get, api),
      ...createTimelineSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createLocationSlice(set, get, api),
      ...createSnapshotSlice(set, get, api),
      importData: (data) => set((state) => ({ ...state, ...data })),
      syncFromCloud: (data) => set((state) => ({ ...state, ...data })),
      undo: () => set((state) => {
        if (!state.pastActions || state.pastActions.length === 0) return state;
        
        const action = state.pastActions[state.pastActions.length - 1];
        const newPast = state.pastActions.slice(0, -1);
        const newFuture = [action, ...(state.futureActions || [])];
        
        let newBlocks = [...state.blocks];

        switch (action.type) {
          case 'DELETE_BLOCK':
            newBlocks.splice(action.index, 0, action.block);
            break;
          case 'ADD_BLOCK':
            newBlocks = newBlocks.filter(b => b.id !== action.block.id);
            break;
          case 'MERGE_BLOCK':
            newBlocks.splice(action.index, 0, action.deletedBlock);
            newBlocks = newBlocks.map(b => 
              b.id === action.prevBlockId ? { ...b, content: action.originalPrevContent } : b
            );
            break;
          case 'REMOVE_LENS':
            newBlocks = newBlocks.map(b => 
              b.id === action.blockId ? { ...b, isLens: true, lensColor: action.originalLensColor } : b
            );
            break;
          case 'RESTORE_SNAPSHOT':
            newBlocks = [
              ...newBlocks.filter(b => b.documentId !== action.sceneId),
              ...action.previousBlocks
            ];
            break;
        }

        return {
          blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
          pastActions: newPast,
          futureActions: newFuture
        };
      }),
      redo: () => set((state) => {
        if (!state.futureActions || state.futureActions.length === 0) return state;
        
        const action = state.futureActions[0];
        const newFuture = state.futureActions.slice(1);
        const newPast = [...(state.pastActions || []), action];
        
        let newBlocks = [...state.blocks];

        switch (action.type) {
          case 'DELETE_BLOCK':
            newBlocks = newBlocks.filter(b => b.id !== action.block.id);
            break;
          case 'ADD_BLOCK':
            newBlocks.splice(action.index, 0, action.block);
            break;
          case 'MERGE_BLOCK':
            const prevBlock = newBlocks.find(b => b.id === action.prevBlockId);
            if (prevBlock) {
              const updatedPrevBlock = { 
                ...prevBlock, 
                content: prevBlock.content + (prevBlock.content && action.deletedBlock.content ? '\n' : '') + action.deletedBlock.content 
              };
              newBlocks = newBlocks.filter(b => b.id !== action.deletedBlock.id).map(b => b.id === prevBlock.id ? updatedPrevBlock : b);
            }
            break;
          case 'REMOVE_LENS':
            newBlocks = newBlocks.map(b => 
              b.id === action.blockId ? { ...b, isLens: false, lensColor: undefined } : b
            );
            break;
          case 'RESTORE_SNAPSHOT':
            newBlocks = [
              ...newBlocks.filter(b => b.documentId !== action.sceneId),
              ...action.restoredBlocks
            ];
            break;
        }

        return {
          blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
          pastActions: newPast,
          futureActions: newFuture
        };
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.appMode = 'design';
        }
      }
    }
  )
);
