import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '../lib/supabase';
import { initialState } from '../store/constants';

export function SyncManager() {
  const { 
    supabaseSyncEnabled, 
    lastModified, 
    saveHistoryVersion 
  } = useStore(useShallow(state => ({
    supabaseSyncEnabled: state.supabaseSyncEnabled,
    lastModified: state.lastModified,
    saveHistoryVersion: state.saveHistoryVersion
  })));

  const historyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Auto-save history every 5 minutes
  useEffect(() => {
    if (supabaseSyncEnabled && supabase) {
      console.log('Starting auto-save history timer (5m)');
      historyTimerRef.current = setInterval(() => {
        console.log('Auto-saving history version...');
        saveHistoryVersion('Auto-Save');
      }, 5 * 60 * 1000);
    } else {
      if (historyTimerRef.current) {
        clearInterval(historyTimerRef.current);
        historyTimerRef.current = null;
      }
    }

    return () => {
      if (historyTimerRef.current) {
        clearInterval(historyTimerRef.current);
      }
    };
  }, [supabaseSyncEnabled, saveHistoryVersion]);

  // 2. Background sync to Supabase (id: '00000000-0000-0000-0000-000000000000')
  // We'll use a subscription to watch for state changes and update lastModified
  const prevStateRef = useRef<any>(useStore.getState());

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      const prevState = prevStateRef.current;
      prevStateRef.current = state;

      if (!state.supabaseSyncEnabled || !supabase) return;

      // Check if data fields changed (excluding metadata)
      const dataKeys = Object.keys(initialState).filter(k => k !== 'lastModified' && k !== 'syncStatus' && k !== 'syncError');
      const dataChanged = dataKeys.some(key => (state as any)[key] !== (prevState as any)[key]);

      if (dataChanged) {
        // Update lastModified (this will trigger the sync useEffect below)
        useStore.setState({ lastModified: Date.now() });
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync to cloud when lastModified changes
  useEffect(() => {
    if (!supabaseSyncEnabled || !supabase) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    // Debounce sync to cloud
    syncTimerRef.current = setTimeout(async () => {
      console.log('Syncing state to cloud...');
      useStore.setState({ syncStatus: 'syncing' });
      
      try {
        const currentState = useStore.getState();
        const dataKeys = Object.keys(initialState);
        const stateToSync = Object.fromEntries(
          Object.entries(currentState).filter(([key]) => dataKeys.includes(key))
        );

        const { error } = await supabase
          .from('app_state')
          .upsert([{ 
            id: '00000000-0000-0000-0000-000000000000', 
            state: stateToSync 
          }]);

        if (error) throw error;
        useStore.setState({ syncStatus: 'success', syncError: null });
        console.log('Cloud sync successful.');
      } catch (err: any) {
        console.error('Cloud sync failed:', err);
        useStore.setState({ syncStatus: 'error', syncError: err.message });
      }
    }, 2000); // 2 second debounce

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [lastModified, supabaseSyncEnabled]);

  return null;
}
