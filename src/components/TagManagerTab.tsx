import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Tag } from '../store/types';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

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

export function TagManagerTab() {
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
    <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 max-w-3xl mx-auto w-full custom-scrollbar">
      <div className="mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold text-stone-800 tracking-tight">Manage Tags</h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">Create and organize tags to categorize your timeline events.</p>
      </div>

      <form onSubmit={handleAddTag} className="mb-8 sm:mb-10 space-y-4 sm:space-y-5 bg-white p-4 sm:p-6 rounded-2xl border border-stone-200/80 shadow-sm">
        <div>
          <label className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-widest block mb-2">New Tag Name</label>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="e.g., Important, Subplot A"
            className="w-full text-xs sm:text-sm bg-stone-50/50 border border-stone-200/80 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all placeholder:text-stone-400"
          />
        </div>
        <div>
          <label className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-widest block mb-2 sm:mb-3">Tag Color</label>
          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={cn(
                  "w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all duration-200 hover:scale-110",
                  color,
                  newTagColor === color ? "ring-2 ring-offset-2 ring-emerald-500 shadow-sm scale-110" : "hover:shadow-sm"
                )}
              >
                {newTagColor === color && <Check size={12} className="opacity-75 sm:w-3.5 sm:h-3.5" />}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={!newTagName.trim()}
          className="w-full bg-stone-800 text-white rounded-xl py-2.5 sm:py-3 text-xs sm:text-sm font-bold tracking-wide hover:bg-stone-700 disabled:opacity-50 disabled:hover:bg-stone-800 flex items-center justify-center transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2 sm:w-[18px] sm:h-[18px]" /> Create Tag
        </button>
      </form>

      <div className="space-y-3 sm:space-y-4">
        <label className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-widest block mb-3 sm:mb-4 flex items-center gap-2">
          Existing Tags
          <span className="bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px]">{tags.length}</span>
        </label>
        
        {tags.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-stone-50/50 rounded-2xl border border-stone-200/50 border-dashed">
            <p className="text-xs sm:text-sm text-stone-400 italic">No tags created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-stone-200/80 bg-white hover:border-stone-300 hover:shadow-sm transition-all group">
                {editingTagId === tag.id ? (
                  <div className="flex-1 space-y-2 sm:space-y-3 mr-2 sm:mr-3">
                    <input
                      type="text"
                      value={editTagName}
                      onChange={(e) => setEditTagName(e.target.value)}
                      className="w-full text-xs sm:text-sm bg-stone-50/50 border border-stone-200/80 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                      {TAG_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setEditTagColor(color)}
                          className={cn(
                            "w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center transition-transform hover:scale-110",
                            color,
                            editTagColor === color ? "ring-2 ring-offset-1 ring-emerald-500 scale-110" : ""
                          )}
                        >
                          {editTagColor === color && <Check size={10} className="opacity-75 sm:w-3 sm:h-3" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={cn("px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm border font-bold tracking-tight shadow-sm", tag.color || TAG_COLORS[0])}>
                  {tag.name}
                </div>
              )}
              
              <div className="flex items-center space-x-0.5 sm:space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {editingTagId === tag.id ? (
                  <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                    <Check size={14} className="sm:w-4 sm:h-4" />
                  </button>
                ) : deletingTagId === tag.id ? (
                  <>
                    <button onClick={() => handleDelete(tag.id)} className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded font-bold text-[10px] sm:text-xs">
                      Confirm
                    </button>
                    <button onClick={() => setDeletingTagId(null)} className="p-1 sm:p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded text-[10px] sm:text-xs">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(tag)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded">
                      <Edit2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => setDeletingTagId(tag.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
