import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useStore } from '../store/stores/useStore';
import { State } from '../store/types';
import { initialState } from '../store/constants';

type BackupContextType = {
  directoryHandle: FileSystemDirectoryHandle | null;
  isBackupEnabled: boolean;
  lastBackupTime: Date | null;
  backupCount: number;
  statusMessage: string;
  statusType: 'info' | 'success' | 'error';
  selectDirectory: () => Promise<void>;
  toggleBackup: () => void;
  performBackup: () => Promise<void>;
  isSupported: boolean;
};

const BackupContext = createContext<BackupContextType | undefined>(undefined);

export const BackupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useStore();
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isBackupEnabled, setIsBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [backupCount, setBackupCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = 'showDirectoryPicker' in window;

  const selectDirectory = async () => {
    if (!isSupported) {
      setStatusMessage('File System Access API is not supported in this browser.');
      setStatusType('error');
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      setStatusMessage(`Selected directory: ${handle.name}`);
      setStatusType('success');
      
      // Count existing backups
      let count = 0;
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('lenswriter_backup_') && entry.name.endsWith('.json')) {
          count++;
        }
      }
      setBackupCount(count);
    } catch (error) {
      console.error('Error selecting directory:', error);
      setStatusMessage('Failed to select directory or permission denied.');
      setStatusType('error');
    }
  };

  const performBackup = async () => {
    if (!directoryHandle) return;

    try {
      // 1. Generate filename
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `lenswriter_backup_${timestamp}.json`;
      
      // Extract only data fields from the store
      const currentState = useStore.getState();
      const dataKeys = Object.keys(initialState);
      const stateToBackup = Object.fromEntries(
        Object.entries(currentState).filter(([key]) => dataKeys.includes(key))
      );

      const content = JSON.stringify(stateToBackup, null, 2);

      // 2. Write new file
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      setLastBackupTime(now);
      setStatusMessage(`Backup created: ${filename}`);
      setStatusType('success');

      // 3. Rotate backups (keep last 30)
      const backups: { name: string, handle: FileSystemFileHandle }[] = [];
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('lenswriter_backup_') && entry.name.endsWith('.json')) {
          backups.push({ name: entry.name, handle: entry as FileSystemFileHandle });
        }
      }

      // Sort by name (which includes timestamp)
      backups.sort((a, b) => a.name.localeCompare(b.name));

      setBackupCount(backups.length);

      if (backups.length > 30) {
        const toDelete = backups.slice(0, backups.length - 30);
        for (const file of toDelete) {
          await directoryHandle.removeEntry(file.name);
        }
        setBackupCount(30);
        setStatusMessage(`Backup created. Removed ${toDelete.length} old backup(s).`);
      }

    } catch (error) {
      console.error('Backup failed:', error);
      setStatusMessage('Backup failed. Permission might have expired.');
      setStatusType('error');
      setIsBackupEnabled(false); // Stop auto-backup on error
    }
  };

  const toggleBackup = () => {
    setIsBackupEnabled(prev => !prev);
  };

  useEffect(() => {
    if (isBackupEnabled && directoryHandle) {
      // Perform immediate backup when enabled
      performBackup();

      // Set interval for 10 minutes
      intervalRef.current = setInterval(performBackup, 10 * 60 * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isBackupEnabled, directoryHandle]);

  return (
    <BackupContext.Provider value={{
      directoryHandle,
      isBackupEnabled,
      lastBackupTime,
      backupCount,
      statusMessage,
      statusType,
      selectDirectory,
      toggleBackup,
      performBackup,
      isSupported
    }}>
      {children}
    </BackupContext.Provider>
  );
};

export const useBackup = () => {
  const context = useContext(BackupContext);
  if (!context) throw new Error('useBackup must be used within a BackupProvider');
  return context;
};
