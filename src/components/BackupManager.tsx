import React from 'react';
import { useBackup } from '../context/BackupContext';
import { FolderOpen, Save, AlertCircle, CheckCircle2, Clock, RotateCcw, X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <h3 className="font-semibold text-stone-900 flex items-center">
            <Save size={18} className="mr-2 text-emerald-600" />
            Local Backup Settings
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {!isSupported ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              <div>
                Your browser does not support the File System Access API required for local backups. 
                Please use Chrome, Edge, or a compatible browser.
              </div>
            </div>
          ) : (
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
