import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StoreState } from '../types';
import { initialState } from '../constants';
import { createWorkSlice } from './slices/workSlice';
import { createCharacterSlice } from './slices/characterSlice';
import { createChapterSlice } from './slices/chapterSlice';
import { createSceneSlice } from './slices/sceneSlice';
import { createBlockSlice } from './slices/blockSlice';
import { createTagSlice, createDeadlineSlice } from './slices/tagDeadlineInboxSlice';
import { createTimelineSlice } from './slices/timelineSlice';
import { createUISlice } from './slices/uiSlice';
import { createLocationSlice } from './slices/locationSlice';
import { createSnapshotSlice } from './slices/snapshotSlice';
import { createNoteSlice } from './slices/noteSlice';
import { createMetroSlice } from './slices/metroSlice';
import { createPublishSlice } from './slices/publishSlice';

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
      ...createTimelineSlice(set, get, api),
      ...createUISlice(set, get, api),
      ...createLocationSlice(set, get, api),
      ...createSnapshotSlice(set, get, api),
      ...createNoteSlice(set, get, api),
      ...createMetroSlice(set, get, api),
      ...createPublishSlice(set, get, api),
      importData: (data) => set((state) => ({ ...state, ...data })),
      mergeData: (data: Partial<StoreState>) => set((state) => {
        const newState = { ...state };
        Object.keys(data).forEach((key) => {
          const k = key as keyof StoreState;
          if (Array.isArray(data[k])) {
            // Merge arrays, assuming they have an 'id' property
            const existingItems = (state[k] as any[]) || [];
            const newItems = data[k] as any[];
            const mergedItems = [...existingItems];
            newItems.forEach(newItem => {
              // Only merge by ID if the item has an ID, otherwise just append or overwrite if it's a simple array
              const index = newItem && typeof newItem === 'object' && 'id' in newItem 
                ? mergedItems.findIndex(item => item.id === newItem.id) 
                : -1;
              
              if (index !== -1) {
                mergedItems[index] = newItem; // Update existing
              } else {
                mergedItems.push(newItem); // Add new
              }
            });
            newState[k] = mergedItems as any;
          } else {
            // Overwrite primitives/objects
            newState[k] = data[k] as any;
          }
        });
        return newState;
      }),
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
      merge: (persistedState: any, currentState: StoreState) => {
        // Merge tabConfig to ensure new tabs are available
        const mergedTabConfig = { ...currentState.tabConfig };
        
        if (persistedState.tabConfig) {
          ['design', 'review', 'management'].forEach(mode => {
            const persistedTabs = persistedState.tabConfig[mode] || [];
            const currentTabs = currentState.tabConfig[mode as 'design' | 'review' | 'management'];
            
            // Start with persisted tabs, removing duplicates
            const mergedTabs = persistedTabs
              .filter((t: any, index: number, self: any[]) => 
                index === self.findIndex((inner: any) => inner.id === t.id)
              );
            
            // Add any missing tabs from current state
            currentTabs.forEach(currentTab => {
              if (!mergedTabs.some((t: any) => t.id === currentTab.id)) {
                mergedTabs.push(currentTab);
              }
            });
            
            mergedTabConfig[mode as 'design' | 'review' | 'management'] = mergedTabs;
          });
        }

        return {
          ...currentState,
          ...persistedState,
          tabConfig: persistedState.tabConfig ? mergedTabConfig : currentState.tabConfig
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.appMode = 'design';
        }
      }
    }
  )
);
