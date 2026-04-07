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
  toggleScrollMode: () => set((state) => ({ scrollMode: !state.scrollMode })),
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

    const newModeConfig = state.tabConfig[newMode];
    const isTabVisible = newModeConfig.find(t => t.id === state.activeTab)?.visible;
    
    if (!isTabVisible) {
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
  pushToCloud: async () => {
    const state = get();
    const { supabase } = await import('../../../lib/supabase');
    const { getDeviceType } = await import('../../../lib/utils');
    const { initialState } = await import('../../constants');
    
    if (!supabase) return false;
    
    set({ syncStatus: 'syncing' });
    try {
      const dataKeys = Object.keys(initialState);
      const stateToSync = {
        ...Object.fromEntries(
          Object.entries(state).filter(([key]) => dataKeys.includes(key))
        ),
        lastDevice: getDeviceType()
      };

      const { error } = await supabase
        .from('app_state')
        .upsert([{ 
          id: '00000000-0000-0000-0000-000000000000', 
          state: stateToSync
        }]);

      if (error) throw error;
      set({ syncStatus: 'success', syncError: null, lastSynced: Date.now() });
      return true;
    } catch (err: any) {
      console.error('Cloud sync failed:', err);
      set({ syncStatus: 'error', syncError: err.message });
      return false;
    }
  },
  restoreFromSnapshot: async (snapshotId: string) => {
    const { supabase } = await import('../../../lib/supabase');
    if (!supabase) return false;
    
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state')
        .eq('id', snapshotId)
        .single();
        
      if (error) throw error;
      
      if (data && data.state) {
        set({ ...data.state, syncStatus: 'idle', syncError: null });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
      return false;
    }
  },
  undoPull: () => {
    const snapshot = localStorage.getItem('prePullSnapshot');
    if (snapshot) {
      const state = JSON.parse(snapshot);
      set({ ...state, syncStatus: 'idle', syncError: null });
      localStorage.removeItem('prePullSnapshot');
      return true;
    }
    return false;
  },
  restoreFromSnapshot: async (snapshotId: string) => {
    const { supabase } = await import('../../../lib/supabase');
    if (!supabase) return false;
    
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state')
        .eq('id', snapshotId)
        .single();
        
      if (error) throw error;
      
      if (data && data.state) {
        set({ ...data.state, syncStatus: 'idle', syncError: null });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
      return false;
    }
  },
  fetchHistory: async () => {
    const { supabase } = await import('../../../lib/supabase');
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('id, state->>_timestamp, state->>_isHistory')
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .order('state->>_timestamp', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch history:', err);
      return [];
    }
  },
  pullFromCloud: async () => {
    const { supabase } = await import('../../../lib/supabase');
    const { initialState } = await import('../../constants');
    const state = get();
    
    if (!supabase) return false;
    
    // Save snapshot before pulling
    localStorage.setItem('prePullSnapshot', JSON.stringify(state));
    
    set({ syncStatus: 'syncing' });
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (error) throw error;
      
      if (data && data.state) {
        const dataKeys = Object.keys(initialState);
        const updates = Object.fromEntries(
          Object.entries(data.state).filter(([key]) => dataKeys.includes(key))
        );
        set({ ...updates, syncStatus: 'success', syncError: null, lastSynced: Date.now() });
        return true;
      }
      set({ syncStatus: 'idle' });
      return false;
    } catch (err: any) {
      console.error('Cloud pull failed:', err);
      set({ syncStatus: 'error', syncError: err.message });
      return false;
    }
  },
  checkCloudVersion: async () => {
    const { supabase } = await import('../../../lib/supabase');
    if (!supabase) return;
    
    set({ isCheckingCloud: true });
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state->>lastModified')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
        
      if (error) throw error;
      
      if (data && data.lastModified) {
        set({ cloudLastModified: Number(data.lastModified) });
      }
    } catch (err) {
      console.error('Cloud version check failed:', err);
    } finally {
      set({ isCheckingCloud: false });
    }
  },
});
