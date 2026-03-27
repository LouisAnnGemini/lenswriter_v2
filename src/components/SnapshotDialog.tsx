import React, { useState, useMemo } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, Clock, Copy, RotateCcw, Trash2, Check, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import * as Diff from 'diff';

export function SnapshotDialog({ sceneId, onClose }: { sceneId: string, onClose: () => void }) {
  const { snapshots, addSnapshot, deleteSnapshot, restoreSnapshot, renameSnapshot, blocks } = useStore(useShallow(state => ({
    snapshots: state.snapshots,
    addSnapshot: state.addSnapshot,
    deleteSnapshot: state.deleteSnapshot,
    restoreSnapshot: state.restoreSnapshot,
    renameSnapshot: state.renameSnapshot,
    blocks: state.blocks,
  })));

  const sceneSnapshots = useMemo(() => {
    return (snapshots || []).filter(s => s.sceneId === sceneId).sort((a, b) => b.createdAt - a.createdAt);
  }, [snapshots, sceneId]);

  const currentSceneBlocks = useMemo(() => {
    return blocks.filter(b => b.documentId === sceneId).sort((a, b) => a.order - b.order);
  }, [blocks, sceneId]);

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(sceneSnapshots[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editingSnapshotName, setEditingSnapshotName] = useState('');
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  const selectedSnapshot = sceneSnapshots.find(s => s.id === selectedSnapshotId);

  const handleCreateSnapshot = () => {
    const defaultName = new Date().toLocaleString();
    addSnapshot(sceneId, newSnapshotName || defaultName);
    setIsCreating(false);
    setNewSnapshotName('');
  };

  const handleCopy = () => {
    if (!selectedSnapshot) return;
    const text = selectedSnapshot.blocks.map(b => b.content).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    if (!selectedSnapshot) return;
    restoreSnapshot(selectedSnapshot.id);
    onClose();
  };

  const handleRename = (id: string) => {
    if (editingSnapshotName.trim()) {
      renameSnapshot(id, editingSnapshotName.trim());
    }
    setEditingSnapshotId(null);
  };

  const handleDelete = (id: string) => {
    deleteSnapshot(id);
    if (selectedSnapshotId === id) {
      setSelectedSnapshotId(null);
    }
    setDeletingSnapshotId(null);
  };

  const diffResult = useMemo(() => {
    if (!selectedSnapshot) return null;
    
    const oldText = selectedSnapshot.blocks.map(b => b.content).join('\n\n');
    const newText = currentSceneBlocks.map(b => b.content).join('\n\n');
    
    return Diff.diffWords(oldText, newText);
  }, [selectedSnapshot, currentSceneBlocks]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-stone-500" />
            History Snapshots
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-stone-200 flex flex-col bg-stone-50">
            <div className="p-4 border-b border-stone-200">
              {isCreating ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    placeholder={new Date().toLocaleString()}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateSnapshot();
                      if (e.key === 'Escape') setIsCreating(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreateSnapshot} className="flex-1 bg-stone-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-stone-700">Save</button>
                    <button onClick={() => setIsCreating(false)} className="flex-1 bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-stone-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  Create Snapshot
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sceneSnapshots.length === 0 ? (
                <div className="text-center text-stone-500 text-sm py-8">No snapshots yet.</div>
              ) : (
                sceneSnapshots.map(snapshot => (
                  <div
                    key={snapshot.id}
                    onClick={() => {
                      if (editingSnapshotId !== snapshot.id && deletingSnapshotId !== snapshot.id) {
                        setSelectedSnapshotId(snapshot.id);
                        setShowRestoreConfirm(false);
                      }
                    }}
                    className={cn(
                      "group flex flex-col p-3 rounded-lg transition-colors",
                      selectedSnapshotId === snapshot.id ? "bg-stone-200" : "hover:bg-stone-100 cursor-pointer"
                    )}
                  >
                    {deletingSnapshotId === snapshot.id ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-red-600">Delete this snapshot?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(snapshot.id); }}
                            className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingSnapshotId(null); }}
                            className="flex-1 bg-stone-300 text-stone-700 px-2 py-1 rounded text-xs font-medium hover:bg-stone-400"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : editingSnapshotId === snapshot.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editingSnapshotName}
                          onChange={(e) => setEditingSnapshotName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(snapshot.id);
                            if (e.key === 'Escape') setEditingSnapshotId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRename(snapshot.id); }}
                            className="flex-1 bg-stone-800 text-white px-2 py-1 rounded text-xs font-medium hover:bg-stone-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingSnapshotId(null); }}
                            className="flex-1 bg-stone-300 text-stone-700 px-2 py-1 rounded text-xs font-medium hover:bg-stone-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-stone-800 truncate">{snapshot.name}</span>
                          <span className="text-xs text-stone-500">{new Date(snapshot.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSnapshotName(snapshot.name);
                              setEditingSnapshotId(snapshot.id);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded"
                            title="Rename snapshot"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSnapshotId(snapshot.id);
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedSnapshot ? (
              <>
                <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/50">
                  <div className="flex items-center gap-4 text-sm text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#ffe6e6] border border-red-200"></div>
                      <span>Deleted in current</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-[#e6ffe6] border border-green-200"></div>
                      <span>Added in current</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>
                    {showRestoreConfirm ? (
                      <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 animate-in fade-in slide-in-from-right-2">
                        <span className="text-sm font-medium">Overwrite current scene?</span>
                        <button
                          onClick={handleRestore}
                          className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setShowRestoreConfirm(false)}
                          className="px-2 py-0.5 bg-white text-stone-600 border border-stone-200 rounded text-xs font-medium hover:bg-stone-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRestoreConfirm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore This Version
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-serif text-lg leading-relaxed whitespace-pre-wrap">
                  {diffResult?.map((part, index) => {
                    if (part.added) {
                      return <span key={index} className="bg-[#e6ffe6] text-green-900 font-medium">{part.value}</span>;
                    }
                    if (part.removed) {
                      return <span key={index} className="bg-[#ffe6e6] text-red-900 line-through opacity-80">{part.value}</span>;
                    }
                    return <span key={index} className="text-stone-800">{part.value}</span>;
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-stone-500">
                Select a snapshot to view changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
