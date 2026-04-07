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

  // 1. Auto-save history every 10 minutes
  const lastModifiedRef = useRef(lastModified);
  useEffect(() => {
    lastModifiedRef.current = lastModified;
  }, [lastModified]);

  useEffect(() => {
    if (supabaseSyncEnabled && supabase) {
      // Starting auto-save history timer (10m)
      historyTimerRef.current = setInterval(() => {
        const checkWindow = 11 * 60 * 1000; // 11 minutes to ensure overlap with 10m interval
        if (Date.now() - lastModifiedRef.current < checkWindow) {
          // Auto-saving history version...
          saveHistoryVersion('Auto-Save');
        }
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

  // 2. Track changes to update lastModified
  const prevStateRef = useRef<any>(useStore.getState());

  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      const prevState = prevStateRef.current;
      prevStateRef.current = state;

      // If this state update was a sync completion, don't update lastModified
      if (state.lastSynced !== prevState.lastSynced) {
        return;
      }

      // Check if data fields changed (excluding metadata)
      const dataKeys = Object.keys(initialState).filter(k => k !== 'lastModified' && k !== 'lastSynced' && k !== 'syncStatus' && k !== 'syncError');
      const dataChanged = dataKeys.some(key => (state as any)[key] !== (prevState as any)[key]) || state.appMode !== prevState.appMode;

      if (dataChanged) {
        useStore.setState({ lastModified: Date.now() });
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
