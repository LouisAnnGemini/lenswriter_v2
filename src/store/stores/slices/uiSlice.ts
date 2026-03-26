import { StateCreator } from 'zustand';
import { StoreState, UISlice } from '../../types';

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set) => ({
  setActiveDocument: (documentId) => set({ activeDocumentId: documentId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDeadlineViewMode: (mode) => set({ deadlineViewMode: mode }),
  setBoardViewMode: (mode) => set({ boardViewMode: mode }),
  setActiveLens: (lensId) => set({ activeLensId: lensId }),
  setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  toggleDisguiseMode: () => set((state) => ({ disguiseMode: !state.disguiseMode })),
  setRightSidebarMode: (mode) => set({ rightSidebarMode: mode }),
  toggleShowDescriptions: () => set((state) => ({ showDescriptions: !state.showDescriptions })),
  setLetterSpacing: (spacing) => set({ letterSpacing: spacing }),
  setEditorMargin: (margin) => set({ editorMargin: margin }),
  toggleSupabaseSync: () => set((state) => ({ supabaseSyncEnabled: !state.supabaseSyncEnabled })),
  saveHistoryVersion: (name) => {
    // Placeholder for history versioning
    console.log('Saving history version:', name);
  },
});
