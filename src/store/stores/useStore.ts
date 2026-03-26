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
      importData: (data) => set((state) => ({ ...state, ...data })),
      syncFromCloud: (data) => set((state) => ({ ...state, ...data })),
      undo: () => {
        // Basic undo/redo placeholder for now if needed, 
        // though the original reducer had a more complex one.
        // For now, we'll just keep it as a placeholder to satisfy the interface.
      },
      redo: () => {
        // Placeholder
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
