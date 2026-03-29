import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '../lib/supabase';
import { initialState } from '../store/constants';
import { getDeviceType } from '../lib/utils';

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
  const isSyncingFromCloud = useRef(false);

  // 0. Real-time subscription
  useEffect(() => {
    if (!supabase || !supabaseSyncEnabled) return;

    console.log('Setting up real-time subscription...');
    const channel = supabase
      .channel('app_state_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_state',
          filter: `id=eq.00000000-0000-0000-0000-000000000000`
        },
        (payload) => {
          const newState = payload.new.state;
          const currentState = useStore.getState();

          if (newState && newState.lastModified > currentState.lastModified) {
            console.log('Real-time sync: updating local state from cloud');
            
            const dataKeys = Object.keys(initialState);
            const updates = Object.fromEntries(
              Object.entries(newState).filter(([key]) => dataKeys.includes(key))
            );
            
            isSyncingFromCloud.current = true;
            useStore.setState(updates);
            isSyncingFromCloud.current = false;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseSyncEnabled]);

  // 1. Auto-save history every 10 minutes
  useEffect(() => {
    if (supabaseSyncEnabled && supabase) {
      console.log('Starting auto-save history timer (10m)');
      historyTimerRef.current = setInterval(() => {
        console.log('Auto-saving history version...');
        saveHistoryVersion('Auto-Save');
      }, 10 * 60 * 1000);
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
      if (isSyncingFromCloud.current) {
        prevStateRef.current = state;
        return;
      }

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
        const stateToSync = {
          ...Object.fromEntries(
            Object.entries(currentState).filter(([key]) => dataKeys.includes(key))
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
        useStore.setState({ syncStatus: 'success', syncError: null });
        console.log('Cloud sync successful.');
      } catch (err: any) {
        console.error('Cloud sync failed:', err);
        useStore.setState({ syncStatus: 'error', syncError: err.message });
      }
    }, 15000); // 15 second debounce to reduce Realtime/PostgREST egress

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [lastModified, supabaseSyncEnabled]);

  return null;
}
