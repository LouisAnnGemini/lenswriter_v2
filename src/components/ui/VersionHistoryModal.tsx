import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { ConfirmationModal } from './ConfirmationModal';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistoryModal({ isOpen, onClose }: VersionHistoryModalProps) {
  const { fetchHistory, restoreFromSnapshot } = useStore(useShallow(state => ({
    fetchHistory: state.fetchHistory,
    restoreFromSnapshot: state.restoreFromSnapshot
  })));
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async (id: string) => {
    setRestoring(true);
    const success = await restoreFromSnapshot(id);
    setRestoring(false);
    if (success) {
      toast.success('Version restored');
      onClose();
    } else {
      toast.error('Failed to restore version');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchHistory().then(data => {
        setVersions(data);
        setLoading(false);
      });
    }
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-stone-900">Version History</h3>
        
        {loading || restoring ? (
          <div className="mt-4 text-center text-stone-500">{restoring ? 'Restoring...' : 'Loading versions...'}</div>
        ) : (
          <div className="mt-4 max-h-96 overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-sm text-stone-500">No history versions found.</p>
            ) : (
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between rounded-md border border-stone-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {new Date(Number(v._timestamp)).toLocaleString()}
                      </p>
                      <p className="text-xs text-stone-500">ID: {v.id}</p>
                    </div>
                    <button
                      onClick={() => handleRestore(v.id)}
                      className="rounded-md bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200"
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
