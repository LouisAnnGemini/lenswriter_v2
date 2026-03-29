import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, Edit2, Check, X, Clock, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function InboxPanel() {
  const { inbox, updateInboxItem, deleteInboxItem } = useStore(useShallow(state => ({
    inbox: state.inbox,
    updateInboxItem: state.updateInboxItem,
    deleteInboxItem: state.deleteInboxItem
  })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inboxItems = [...(inbox || [])].sort((a, b) => b.createdAt - a.createdAt);

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
    setDeletingId(null);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      updateInboxItem({ id: editingId, content: editContent.trim() });
      setEditingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    deleteInboxItem({ id });
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="p-4 border-b border-stone-200 bg-white shadow-sm z-10 sticky top-0">
        <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
          <Inbox size={18} className="text-stone-600" /> Inbox
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Quick ideas captured globally. Press <kbd className="px-1 py-0.5 bg-stone-100 border border-stone-200 rounded font-mono text-[10px]">Cmd/Ctrl + Shift + I</kbd> anywhere to add.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {inboxItems.length === 0 ? (
          <div className="text-center text-xs text-stone-500 py-8 italic">
            Your inbox is empty.
          </div>
        ) : (
          inboxItems.map(item => (
            <div key={item.id} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm group">
              {editingId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-sm bg-stone-50 border border-stone-200 rounded p-2 outline-none focus:ring-1 focus:ring-stone-500 resize-y min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-stone-700 whitespace-pre-wrap break-words">
                    {item.content}
                  </div>
                  <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center text-[10px] text-stone-400">
                      <Clock size={10} className="mr-1" />
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      {deletingId === item.id ? (
                        <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded">
                          <span className="text-[10px] text-red-600 font-medium mr-1">Delete?</span>
                          <button
                            onClick={() => confirmDelete(item.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Confirm"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1 text-stone-500 hover:bg-stone-200 rounded transition-colors"
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(item.id, item.content)}
                            className="p-1 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
