import { StateCreator } from 'zustand';
import { StoreState, UISlice } from '../../types';

export const createUISlice: StateCreator<StoreState, [], [], UISlice> = (set, get) => ({
  setActiveDocument: (documentId) => set({ activeDocumentId: documentId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTimelineViewMode: (mode) => set({ timelineViewMode: mode }),
  setDeadlineViewMode: (mode) => set({ deadlineViewMode: mode }),
  setActiveLens: (lensId) => set({ activeLensId: lensId }),
  setSelectedEventId: (eventId) => set({ selectedEventId: eventId }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
  toggleDisguiseMode: () => set((state) => ({ disguiseMode: !state.disguiseMode })),
  setRightSidebarMode: (mode) => set({ rightSidebarMode: mode }),
  toggleShowDescriptions: () => set((state) => ({ showDescriptions: !state.showDescriptions })),
  setLetterSpacing: (spacing) => set({ letterSpacing: spacing }),
  setEditorMargin: (margin) => set({ editorMargin: margin }),
  setTimelineTableColumns: (columns) => set({ timelineTableColumns: columns }),
  toggleSupabaseSync: () => set((state) => ({ supabaseSyncEnabled: !state.supabaseSyncEnabled })),
  setAppMode: (mode) => set({ appMode: mode }),
  updateTabConfig: (mode, config) => set((state) => ({
    tabConfig: {
      ...state.tabConfig,
      [mode]: config
    }
  })),
  toggleAppMode: () => set((state) => {
    const newMode = state.appMode === 'design' ? 'review' : state.appMode === 'review' ? 'management' : 'design';
    let newTab = state.activeTab;
    let newTimelineViewMode = state.timelineViewMode;

    if (newMode === 'design' && ['deadline', 'compile'].includes(state.activeTab)) {
      newTab = 'design';
    } else if (newMode === 'management' && ['world'].includes(state.activeTab)) {
      newTab = 'design';
    } else if (newMode === 'review' && ['world'].includes(state.activeTab)) {
      newTab = 'design';
    }

    if (newMode === 'management' || newMode === 'review') {
      newTimelineViewMode = 'list';
    }

    return { appMode: newMode, activeTab: newTab, timelineViewMode: newTimelineViewMode };
  }),
  saveHistoryVersion: async (name) => {
    // saveHistoryVersion called with name: name
    const state = get();
    const { supabase } = await import('../../../lib/supabase');
    const { getDeviceType } = await import('../../../lib/utils');
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    try {
      const stateToSave = {
        ...state,
        _isHistory: true,
        _timestamp: Date.now(),
        _device: getDeviceType()
      };

      // Saving state: stateToSave
      const { error } = await supabase
        .from('app_state')
        .insert([{ 
          id: crypto.randomUUID(), 
          state: stateToSave
        }]);

      if (error) {
        console.error('Failed to save history version:', error);
        return false;
      }
      
      // Saved history version: name
      
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
            
            // Deleted idsToDelete.length old history version(s).
          }
        }
      } catch (rotateError) {
        console.error('Failed to rotate history versions:', rotateError);
      }
      
      return true;
    } catch (err) {
      console.error('Unexpected error in saveHistoryVersion:', err);
      return false;
    }
  },
});
