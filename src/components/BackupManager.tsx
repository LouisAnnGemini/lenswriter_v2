import React, { useState } from 'react';
import { useBackup } from '../context/BackupContext';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { supabase, updateSupabaseConfig } from '../lib/supabase';
import { FolderOpen, Save, AlertCircle, CheckCircle2, Clock, RotateCcw, X, Cloud, Download, Settings, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export function BackupManager({ onClose }: { onClose: () => void }) {
  const {
    directoryHandle,
    isBackupEnabled,
    lastBackupTime,
    backupCount,
    statusMessage,
    statusType,
    selectDirectory,
    toggleBackup,
    isSupported
  } = useBackup();

  const { 
    supabaseSyncEnabled,
    lastModified,
    toggleSupabaseSync, 
    importData, 
    syncStatus, 
    syncError, 
    saveHistoryVersion
  } = useStore(useShallow(state => ({
    supabaseSyncEnabled: state.supabaseSyncEnabled,
    lastModified: state.lastModified,
    toggleSupabaseSync: state.toggleSupabaseSync,
    importData: state.importData,
    syncStatus: state.syncStatus,
    syncError: state.syncError,
    saveHistoryVersion: state.saveHistoryVersion
  })));
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [cloudHistory, setCloudHistory] = useState<Array<{id: string, timestamp: number, device?: string}>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  
  // Initial Sync Prompt State
  const [syncPrompt, setSyncPrompt] = useState<{ cloudState: any, localDate: number, cloudDate: number } | null>(null);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);

  // Supabase Config State
  const [tempUrl, setTempUrl] = useState(() => {
    const stored = localStorage.getItem('supabase_config');
    if (stored) return JSON.parse(stored).url;
    return import.meta.env.VITE_SUPABASE_URL || '';
  });
  const [tempKey, setTempKey] = useState(() => {
    const stored = localStorage.getItem('supabase_config');
    if (stored) return JSON.parse(stored).key;
    return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });

  const handleSaveConfig = () => {
    updateSupabaseConfig(tempUrl, tempKey);
  };

  const handleToggleSync = async () => {
    if (supabaseSyncEnabled) {
      toggleSupabaseSync();
      return;
    }

    if (!supabase) return;

    setIsCheckingCloud(true);
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data && data.state) {
        // Cloud data exists, prompt user
        setSyncPrompt({
          cloudState: data.state,
          localDate: lastModified,
          cloudDate: data.state.lastModified || 0
        });
      } else {
        // No cloud data, just enable
        toggleSupabaseSync();
      }
    } catch (err) {
      console.error("Error checking cloud state", err);
      alert("Failed to check cloud state. Please check your Supabase configuration.");
    } finally {
      setIsCheckingCloud(false);
    }
  };

  const handleSyncChoice = (choice: 'local' | 'cloud') => {
    if (!syncPrompt) return;

    if (choice === 'cloud') {
      importData({ ...syncPrompt.cloudState, supabaseSyncEnabled: true });
    } else {
      toggleSupabaseSync();
    }
    
    setSyncPrompt(null);
  };

  const handlePullFromSupabase = async () => {
    if (!supabase) return;
    setIsPulling(true);
    setPullStatus(null);
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      if (error) throw error;
      
      if (data && data.state) {
        importData({ ...data.state, supabaseSyncEnabled: true });
        setPullStatus({ type: 'success', message: 'Successfully loaded data from Supabase.' });
      } else {
        setPullStatus({ type: 'error', message: 'No data found in Supabase.' });
      }
    } catch (e: any) {
      console.error("Error pulling from Supabase", e);
      setPullStatus({ type: 'error', message: e.message || 'Failed to pull data from Supabase.' });
    } finally {
      setIsPulling(false);
    }
  };

  const fetchCloudHistory = async () => {
    if (!supabase) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('id, state')
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      if (data) {
        const history = data
          .filter(row => row.state?._isHistory)
          .map(row => ({ 
            id: row.id, 
            timestamp: row.state._timestamp, 
            device: row.state._device || row.state.lastDevice 
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setCloudHistory(history);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const restoreHistory = async (id: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('state')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data && data.state) {
        const { _isHistory, _timestamp, ...stateToRestore } = data.state;
        stateToRestore.lastModified = Date.now();
        stateToRestore.supabaseSyncEnabled = true;
        importData(stateToRestore);
        setPullStatus({ type: 'success', message: 'Successfully restored historical version.' });
        setConfirmRestoreId(null);
      }
    } catch (err) {
      console.error('Failed to restore history', err);
      setPullStatus({ type: 'error', message: 'Failed to restore history.' });
    }
  };

  React.useEffect(() => {
    if (supabaseSyncEnabled && supabase) {
      fetchCloudHistory();
    }
  }, [supabaseSyncEnabled, supabase]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50 shrink-0">
          <h3 className="font-semibold text-stone-900 flex items-center">
            <Save size={18} className="mr-2 text-emerald-600" />
            Data & Backup Settings
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Supabase Cloud Sync Section - Moved to top */}
          <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-stone-700">
                    <Cloud size={16} className="mr-2 text-blue-500" />
                    Supabase Cloud Sync
                  </div>
                  <button
                    onClick={handleToggleSync}
                    disabled={!supabase || isCheckingCloud}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      supabaseSyncEnabled ? "bg-blue-500" : "bg-stone-200",
                      (!supabase || isCheckingCloud) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        supabaseSyncEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                
                {syncPrompt && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="text-sm font-medium text-blue-900">Cloud Data Found</div>
                    <div className="text-xs text-blue-800">
                      We found existing data in the cloud. How would you like to initialize sync?
                    </div>
                    <div className="text-[10px] text-blue-700 space-y-1">
                      <div>Local last modified: {new Date(syncPrompt.localDate).toLocaleString()}</div>
                      <div className="flex items-center gap-1">
                        Cloud last modified: {new Date(syncPrompt.cloudDate).toLocaleString()}
                        {(syncPrompt.cloudState.lastDevice || syncPrompt.cloudState._device) && (
                          <span className="flex items-center text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded ml-1" title={`Saved from ${syncPrompt.cloudState.lastDevice || syncPrompt.cloudState._device}`}>
                            {(syncPrompt.cloudState.lastDevice || syncPrompt.cloudState._device) === 'Mobile' ? <Smartphone size={10} className="mr-1" /> : <Monitor size={10} className="mr-1" />}
                            {syncPrompt.cloudState.lastDevice || syncPrompt.cloudState._device}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSyncChoice('cloud')}
                        className="flex-1 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors"
                      >
                        Use Cloud Data
                      </button>
                      <button
                        onClick={() => handleSyncChoice('local')}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Keep Local Data
                      </button>
                    </div>
                    <button
                      onClick={() => setSyncPrompt(null)}
                      className="w-full px-3 py-1.5 bg-transparent text-blue-600 hover:text-blue-800 text-xs text-center"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Supabase URL</label>
                    <input
                      type="text"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Anon Key</label>
                    <input
                      type="password"
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      placeholder="your-anon-key"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    className="flex items-center justify-center w-full px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw size={14} className="mr-1.5" />
                    Save & Reload App
                  </button>
                </div>

                {!supabase ? (
                  <div className="text-xs text-stone-500 italic bg-amber-50 p-3 rounded-lg border border-amber-100">
                    Supabase is not yet connected. Enter your credentials above and click Save.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-stone-500">
                      When enabled, your data will automatically sync to Supabase in the background. Local storage remains your primary data source.
                    </div>
                    
                    <div className="text-[10px] text-stone-400 bg-stone-100 p-2 rounded border border-stone-200">
                      <strong>Note:</strong> Requires a table named <code>app_state</code> with columns <code>id</code> (text/uuid, primary key) and <code>state</code> (jsonb).
                      <br />
                      <strong>Important:</strong> To enable real-time cross-device sync, you must enable <strong>Realtime</strong> for the <code>app_state</code> table in your Supabase Database settings (Database &gt; Replication).
                    </div>
                    
                    {supabaseSyncEnabled && (
                      <div className={cn(
                        "text-xs p-3 rounded-lg border",
                        syncStatus === 'syncing' ? "bg-blue-50 border-blue-100 text-blue-700" :
                        syncStatus === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                        syncStatus === 'error' ? "bg-red-50 border-red-100 text-red-700" :
                        "bg-stone-50 border-stone-100 text-stone-500"
                      )}>
                        <div className="flex items-center font-medium mb-1">
                          {syncStatus === 'syncing' && <RefreshCw size={12} className="mr-1.5 animate-spin" />}
                          {syncStatus === 'success' && <CheckCircle2 size={12} className="mr-1.5" />}
                          {syncStatus === 'error' && <AlertCircle size={12} className="mr-1.5" />}
                          {syncStatus === 'idle' && <Clock size={12} className="mr-1.5" />}
                          Status: {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
                        </div>
                        {syncError && (
                          <div className="mt-1 text-[10px] opacity-80 break-words">
                            {syncError}
                            {(syncError.includes('RLS') || syncError.includes('row-level security') || syncError.includes('401') || syncError.includes('403')) && (
                              <div className="mt-1 font-semibold">
                                Tip: You must disable Row Level Security (RLS) on the `app_state` table, or add a policy allowing anon inserts/updates.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handlePullFromSupabase}
                      disabled={isPulling}
                      className="flex items-center justify-center w-full px-3 py-2 bg-white border border-stone-300 text-stone-700 rounded-md text-xs font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                      <Download size={14} className="mr-1.5" />
                      {isPulling ? 'Pulling Data...' : 'Pull Data from Supabase'}
                    </button>
                    
                    {pullStatus && (
                      <div className={cn(
                        "text-xs p-2 rounded",
                        pullStatus.type === 'error' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {pullStatus.message}
                      </div>
                    )}

                    {/* Cloud History Section */}
                    {supabaseSyncEnabled && (
                      <div className="pt-4 border-t border-stone-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-stone-700">Cloud History</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (saveHistoryVersion) {
                                  const success = await saveHistoryVersion('Manual Save');
                                  if (success) {
                                    toast.success('Version saved successfully');
                                    fetchCloudHistory();
                                  } else {
                                    toast.error('Failed to save version. Please check your connection.');
                                  }
                                }
                              }}
                              className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
                            >
                              Save Version Now
                            </button>
                            <button
                              onClick={fetchCloudHistory}
                              disabled={isLoadingHistory}
                              className="p-1 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors disabled:opacity-50"
                              title="Refresh History"
                            >
                              <RefreshCw size={14} className={cn(isLoadingHistory && "animate-spin")} />
                            </button>
                          </div>
                        </div>
                        <div className="text-[10px] text-stone-500">
                          Automatically saves a version every 5 minutes. Keeps the last 20 versions.
                        </div>
                        
                        <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-md divide-y divide-stone-100">
                          {cloudHistory.length === 0 ? (
                            <div className="p-3 text-xs text-stone-500 text-center italic">
                              No history versions available yet.
                            </div>
                          ) : (
                            cloudHistory.map((item, index) => (
                              <div key={item.id} className="flex flex-col p-2 hover:bg-stone-50">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-stone-700 flex items-center gap-2">
                                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                                    {item.device && (
                                      <span className="flex items-center text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded" title={`Saved from ${item.device}`}>
                                        {item.device === 'Mobile' ? <Smartphone size={10} className="mr-1" /> : <Monitor size={10} className="mr-1" />}
                                        {item.device}
                                      </span>
                                    )}
                                    {index === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Latest</span>}
                                  </div>
                                  {confirmRestoreId !== item.id && (
                                    <button
                                      onClick={() => setConfirmRestoreId(item.id)}
                                      className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline px-2 py-1"
                                    >
                                      Restore
                                    </button>
                                  )}
                                </div>
                                {confirmRestoreId === item.id && (
                                  <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-800 flex flex-col gap-2">
                                    <div>Are you sure? Current unsaved changes will be lost.</div>
                                    <div className="flex gap-2 justify-end">
                                      <button 
                                        onClick={() => setConfirmRestoreId(null)}
                                        className="px-2 py-1 bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-50"
                                      >
                                        Cancel
                                      </button>
                                      <button 
                                        onClick={() => restoreHistory(item.id)}
                                        className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                      >
                                        Yes, Restore
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
          </div>

          {/* Local Backup Section - Moved to bottom */}
          <div className="pt-6 border-t border-stone-100 space-y-4">
            <div className="flex items-center text-sm font-medium text-stone-700">
              <Save size={16} className="mr-2 text-stone-500" />
              Local Backup
            </div>
            
            {!isSupported && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-start border border-amber-100">
                  <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="font-semibold">Local Backup Not Supported</p>
                    <p>
                      The <strong>File System Access API</strong> is required for local folder backups, but it is currently 
                      <strong> not supported on mobile browsers</strong> (including Chrome for Android/iOS) or some desktop browsers like Safari.
                    </p>
                    <p className="text-xs opacity-80">
                      Please use Chrome or Edge on a <strong>Desktop</strong> computer to use local folder backups.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isSupported && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-stone-700">Backup Directory</div>
                    <button
                      onClick={selectDirectory}
                      className="flex items-center px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-medium transition-colors border border-stone-300"
                    >
                      <FolderOpen size={14} className="mr-1.5" />
                      {directoryHandle ? 'Change Folder' : 'Select Folder'}
                    </button>
                  </div>
                  
                  {directoryHandle ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <div className="text-xs text-emerald-800 font-medium truncate mb-1">
                        {directoryHandle.name}
                      </div>
                      <div className="text-[10px] text-emerald-600 flex items-center">
                        <CheckCircle2 size={10} className="mr-1" />
                        Ready for backups
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-xs text-stone-500 italic">
                      No folder selected. Please select a local folder to store backups.
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-stone-700">Auto-Backup (Every 10m)</div>
                    <button
                      onClick={toggleBackup}
                      disabled={!directoryHandle}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                        isBackupEnabled ? "bg-emerald-500" : "bg-stone-200",
                        !directoryHandle && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          isBackupEnabled ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  
                  <div className="text-xs text-stone-500">
                    Automatically saves a JSON copy every 10 minutes. Keeps the last 30 backups.
                  </div>
                </div>

                {/* Status Section */}
                <div className="pt-4 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Last Backup:
                    </span>
                    <span className="font-mono">
                      {lastBackupTime ? lastBackupTime.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="flex items-center">
                      <RotateCcw size={12} className="mr-1" />
                      Backups Kept:
                    </span>
                    <span className="font-mono">{backupCount} / 30</span>
                  </div>
                  
                  {statusMessage && (
                    <div className={cn(
                      "mt-3 text-xs p-2 rounded",
                      statusType === 'error' ? "bg-red-50 text-red-600" : 
                      statusType === 'success' ? "bg-emerald-50 text-emerald-600" : 
                      "bg-blue-50 text-blue-600"
                    )}>
                      {statusMessage}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
