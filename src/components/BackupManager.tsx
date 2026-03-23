import React, { useState } from 'react';
import { useBackup } from '../context/BackupContext';
import { useStore } from '../store/StoreContext';
import { supabase, updateSupabaseConfig } from '../lib/supabase';
import { FolderOpen, Save, AlertCircle, CheckCircle2, Clock, RotateCcw, X, Cloud, Download, Settings, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

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

  const { state, dispatch, syncStatus, syncError } = useStore();
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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
        dispatch({ type: 'IMPORT_DATA', payload: data.state });
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
              
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                <div className="flex items-center font-semibold mb-2">
                  <Cloud size={16} className="mr-2" />
                  Recommended for Mobile
                </div>
                <p>
                  Use <strong>Supabase Cloud Sync</strong> below to keep your data synchronized across all your devices, including mobile.
                </p>
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

          {/* Supabase Cloud Sync Section - Always visible */}
          <div className="pt-6 border-t border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-medium text-stone-700">
                    <Cloud size={16} className="mr-2 text-blue-500" />
                    Supabase Cloud Sync
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_SUPABASE_SYNC' })}
                    disabled={!supabase}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      state.supabaseSyncEnabled ? "bg-blue-500" : "bg-stone-200",
                      !supabase && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        state.supabaseSyncEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                
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
                    </div>
                    
                    {state.supabaseSyncEnabled && (
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
                  </div>
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
