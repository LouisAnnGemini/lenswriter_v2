import { StateCreator } from 'zustand';
import { StoreState, UISlice } from '../../types';

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => ({
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
  saveHistoryVersion: async (name) => {
    console.log('saveHistoryVersion called with name:', name);
    const state = get();
    const { supabase } = await import('../../../lib/supabase');
    console.log('Supabase client:', supabase);
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const stateToSave = {
      ...state,
      _isHistory: true,
      _timestamp: Date.now(),
      _device: 'Desktop' // Or detect device
    };

    console.log('Saving state:', stateToSave);
    const { error } = await supabase
      .from('app_state')
      .insert([{ id: crypto.randomUUID(), state: stateToSave }]);

    if (error) {
      console.error('Failed to save history version:', error);
    } else {
      console.log('Saved history version:', name);
    }
  },
});
