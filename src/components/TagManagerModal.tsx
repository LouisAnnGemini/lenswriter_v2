import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Tag } from '../store/types';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface TagManagerModalProps {
  onClose: () => void;
}

const TAG_COLORS = [
  'bg-stone-100 text-stone-800 border-stone-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-rose-100 text-rose-800 border-rose-200',
];

export function TagManagerModal({ onClose }: TagManagerModalProps) {
  const { 
    tags: allTags, 
    activeWorkId, 
    addTag, 
    updateTag, 
    deleteTag 
  } = useStore(useShallow(state => ({
    tags: state.tags,
    activeWorkId: state.activeWorkId,
    addTag: state.addTag,
    updateTag: state.updateTag,
    deleteTag: state.deleteTag
  })));
  const tags = allTags.filter(t => t.workId === activeWorkId);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim() && activeWorkId) {
      addTag({ workId: activeWorkId, name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingTagId(tag.id);
    setDeletingTagId(null);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || TAG_COLORS[0]);
  };

  const saveEdit = () => {
    if (editingTagId && editTagName.trim()) {
      updateTag({ id: editingTagId, name: editTagName.trim(), color: editTagColor });
      setEditingTagId(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteTag(id);
    setDeletingTagId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-stone-100 shrink-0">
          <h3 className="text-xl font-bold text-stone-800">Manage Tags</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleAddTag} className="mb-6 space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">New Tag Name</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Important, Subplot A"
                className="w-full text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full border flex items-center justify-center",
                      color,
                      newTagColor === color ? "ring-2 ring-offset-1 ring-emerald-500" : ""
                    )}
                  >
                    {newTagColor === color && <Check size={12} className="opacity-75" />}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="w-full bg-stone-800 text-white rounded-md py-2 text-sm font-medium hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Plus size={16} className="mr-2" /> Add Tag
            </button>
          </form>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Existing Tags</label>
            {tags.length === 0 ? (
              <p className="text-sm text-stone-500 italic text-center py-4">No tags created yet.</p>
            ) : (
              tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg border border-stone-100 hover:bg-stone-50 group">
                  {editingTagId === tag.id ? (
                    <div className="flex-1 space-y-2 mr-2">
                      <input
                        type="text"
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        className="w-full text-sm bg-white border border-stone-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1">
                        {TAG_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setEditTagColor(color)}
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center",
                              color,
                              editTagColor === color ? "ring-2 ring-offset-1 ring-emerald-500" : ""
                            )}
                          >
                            {editTagColor === color && <Check size={10} className="opacity-75" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={cn("px-2 py-1 rounded-md text-sm border font-medium", tag.color || TAG_COLORS[0])}>
                      {tag.name}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingTagId === tag.id ? (
                      <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check size={16} />
                      </button>
                    ) : deletingTagId === tag.id ? (
                      <>
                        <button onClick={() => handleDelete(tag.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded font-bold text-xs">
                          Confirm
                        </button>
                        <button onClick={() => setDeletingTagId(null)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded text-xs">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(tag)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeletingTagId(tag.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
