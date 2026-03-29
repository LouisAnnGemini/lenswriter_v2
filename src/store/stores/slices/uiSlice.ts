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
  setAppMode: (mode) => set({ appMode: mode }),
  toggleAppMode: () => set((state) => {
    const newMode = state.appMode === 'writing' ? 'management' : 'writing';
    let newTab = state.activeTab;
    if (newMode === 'writing' && ['deadline', 'compile'].includes(state.activeTab)) {
      newTab = 'writing';
    } else if (newMode === 'management' && ['board', 'world'].includes(state.activeTab)) {
      newTab = 'writing';
    }
    return { appMode: newMode, activeTab: newTab };
  }),
  saveHistoryVersion: async (name) => {
    console.log('saveHistoryVersion called with name:', name);
    const state = get();
    const { supabase } = await import('../../../lib/supabase');
    const { getDeviceType } = await import('../../../lib/utils');
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const stateToSave = {
      ...state,
      _isHistory: true,
      _timestamp: Date.now(),
      _device: getDeviceType()
    };

    console.log('Saving state:', stateToSave);
    const { error } = await supabase
      .from('app_state')
      .insert([{ id: crypto.randomUUID(), state: stateToSave }]);

    if (error) {
      console.error('Failed to save history version:', error);
    } else {
      console.log('Saved history version:', name);
      
      // Rotate history: keep only the last 20 versions
      try {
        // Use JSONB extraction to avoid downloading the massive state object
        const { data: history, error: fetchError } = await supabase
          .from('app_state')
          .select('id, _isHistory:state->>_isHistory, _timestamp:state->>_timestamp')
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (fetchError) throw fetchError;
        
        if (history) {
          const versions = history
            // JSONB extraction returns strings, so we check for 'true'
            .filter(row => row._isHistory === 'true')
            // Convert string timestamp back to number for sorting
            .sort((a, b) => Number(b._timestamp) - Number(a._timestamp));
          
          if (versions.length > 20) {
            const toDelete = versions.slice(20);
            const idsToDelete = toDelete.map(v => v.id);
            
            await supabase
              .from('app_state')
              .delete()
              .in('id', idsToDelete);
            
            console.log(`Deleted ${idsToDelete.length} old history version(s).`);
          }
        }
      } catch (rotateError) {
        console.error('Failed to rotate history versions:', rotateError);
      }
    }
  },
});
