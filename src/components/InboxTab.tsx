import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, Edit2, Check, X, Clock, Plus, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function InboxTab() {
  const { inbox, addInboxItem, updateInboxItem, deleteInboxItem } = useStore(useShallow(state => ({
    inbox: state.inbox,
    addInboxItem: state.addInboxItem,
    updateInboxItem: state.updateInboxItem,
    deleteInboxItem: state.deleteInboxItem
  })));
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newContent, setNewContent] = useState('');
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

  const handleAdd = () => {
    if (newContent.trim()) {
      addInboxItem({ content: newContent.trim() });
      setNewContent('');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Inbox size={32} className="text-stone-600" /> Inbox
          </h1>
          <p className="text-stone-500 mt-2">
            Your global collection of ideas, snippets, and inspiration. 
            Press <kbd className="px-1.5 py-0.5 bg-stone-200 border border-stone-300 rounded font-mono text-xs text-stone-600">Cmd/Ctrl + Shift + I</kbd> anywhere to capture quickly.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-8">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Type a new idea here... (Cmd/Ctrl + Enter to save)"
            className="w-full text-base bg-transparent border-none outline-none resize-y min-h-[100px] text-stone-800 placeholder:text-stone-400"
          />
          <div className="flex justify-end mt-2 pt-2 border-t border-stone-100">
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} />
              Save Idea
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {inboxItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-stone-200 border-dashed">
              <span className="text-4xl mb-4 block">📭</span>
              <h3 className="text-lg font-medium text-stone-700 mb-1">Your inbox is empty</h3>
              <p className="text-stone-500">Capture your first idea to get started.</p>
            </div>
          ) : (
            inboxItems.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm group hover:shadow-md transition-shadow">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-base bg-stone-50 border border-stone-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 resize-y min-h-[100px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 text-sm font-medium bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Check size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-base text-stone-800 whitespace-pre-wrap break-words leading-relaxed">
                      {item.content}
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center text-xs text-stone-500 font-medium">
                        <Clock size={14} className="mr-1.5" />
                        {new Date(item.createdAt).toLocaleString(undefined, { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {deletingId === item.id ? (
                          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
                            <span className="text-xs text-red-600 font-medium mr-1">Delete?</span>
                            <button
                              onClick={() => confirmDelete(item.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Confirm"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="p-1 text-stone-500 hover:bg-stone-200 rounded transition-colors"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item.id, item.content)}
                              className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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
    </div>
  );
}
