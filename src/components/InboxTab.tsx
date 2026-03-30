import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, Edit2, Check, X, Clock, Plus, Inbox, Tag as TagIcon, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function InboxTab() {
  const { inbox, inboxTags, addInboxItem, updateInboxItem, deleteInboxItem, addInboxTag, updateInboxTag, deleteInboxTag } = useStore(useShallow(state => ({
    inbox: state.inbox,
    inboxTags: state.inboxTags,
    addInboxItem: state.addInboxItem,
    updateInboxItem: state.updateInboxItem,
    deleteInboxItem: state.deleteInboxItem,
    addInboxTag: state.addInboxTag,
    updateInboxTag: state.updateInboxTag,
    deleteInboxTag: state.deleteInboxTag
  })));
  
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'manageTags'>('inbox');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagIds, setNewTagIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');

  const inboxItems = [...(inbox || [])].sort((a, b) => b.createdAt - a.createdAt);
  
  // Get 5 most recently used tags
  const recentTags = React.useMemo(() => {
    const tagCounts: Record<string, number> = {};
    inbox.forEach(item => item.tagIds?.forEach(id => tagCounts[id] = (tagCounts[id] || 0) + 1));
    return inboxTags
      .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
      .slice(0, 5);
  }, [inbox, inboxTags]);

  const filteredTags = inboxTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0) {
        const tagId = filteredTags[0].id;
        setNewTagIds(prev => prev.includes(tagId) ? prev : [...prev, tagId]);
      } else if (tagSearch.trim()) {
        const newTagId = addInboxTag({ name: tagSearch.trim() });
        if (newTagId) setNewTagIds(prev => [...prev, newTagId]);
      }
      setTagSearch('');
    }
  };

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
      addInboxItem({ content: newContent.trim(), tagIds: newTagIds });
      setNewContent('');
      setNewTagIds([]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Inbox size={32} className="text-emerald-600" /> Inbox
          </h1>
          <div className="flex bg-stone-200 rounded-lg p-1">
            <button onClick={() => setActiveSubTab('inbox')} className={cn("px-4 py-2 rounded-md text-sm font-medium", activeSubTab === 'inbox' ? "bg-white shadow" : "text-stone-600")}>Inbox</button>
            <button onClick={() => setActiveSubTab('manageTags')} className={cn("px-4 py-2 rounded-md text-sm font-medium", activeSubTab === 'manageTags' ? "bg-white shadow" : "text-stone-600")}>Manage Tags</button>
          </div>
        </div>

        {activeSubTab === 'manageTags' ? (
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Manage Tags</h2>
            <div className="flex gap-2 mb-4">
              <input 
                placeholder="New tag name" 
                onKeyDown={(e) => { if(e.key === 'Enter' && e.currentTarget.value) { addInboxTag({ name: e.currentTarget.value }); e.currentTarget.value = ''; } }}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="space-y-2">
              {inboxTags.map(tag => (
                <div key={tag.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  {editingTagId === tag.id ? (
                    <input value={editTagName} onChange={e => setEditTagName(e.target.value)} onBlur={() => { updateInboxTag({ id: tag.id, name: editTagName }); setEditingTagId(null); }} className="flex-1 px-2 py-1 border rounded" />
                  ) : (
                    <span className="flex-1">{tag.name}</span>
                  )}
                  <button onClick={() => { setEditingTagId(tag.id); setEditTagName(tag.name); }}><Edit2 size={16} /></button>
                  <button onClick={() => deleteInboxTag(tag.id)} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-8">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Type a new idea here..."
                className="w-full text-base bg-transparent border-none outline-none resize-y min-h-[100px] text-stone-800 placeholder:text-stone-400"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {newTagIds.map(tagId => {
                  const tag = inboxTags.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tag.id} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs">{tag.name} <button onClick={() => setNewTagIds(prev => prev.filter(id => id !== tagId))}><X size={10} /></button></span>
                  ) : null;
                })}
                <div className="relative group">
                  <input 
                    placeholder="Search tags..." 
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="text-xs bg-stone-100 rounded px-2 py-1 w-full"
                  />
                  <div className="absolute top-full left-0 bg-white border rounded shadow-lg z-10 w-40 max-h-40 overflow-y-auto hidden group-focus-within:block">
                    <div className="text-[10px] text-stone-500 px-2 py-1">Recent:</div>
                    <div className="flex flex-wrap gap-1 px-2 pb-2">
                      {recentTags.map(tag => (
                        <button key={tag.id} onClick={() => setNewTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])} className="px-2 py-1 bg-stone-100 rounded text-[10px] hover:bg-stone-200">{tag.name}</button>
                      ))}
                    </div>
                    {tagSearch && (
                      <>
                        <div className="text-[10px] text-stone-500 px-2 py-1 border-t">Search Results:</div>
                        {filteredTags.length > 0 ? (
                          filteredTags.map(tag => (
                            <button key={tag.id} onClick={() => setNewTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id])} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
                          ))
                        ) : (
                          <button 
                            onClick={() => {
                              const newTagId = addInboxTag({ name: tagSearch });
                              if (newTagId) setNewTagIds(prev => [...prev, newTagId]);
                              setTagSearch('');
                            }}
                            className="block w-full text-left px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50"
                          >
                            + Add "{tagSearch}"
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-2 pt-2 border-t border-stone-100">
                <button onClick={handleAdd} disabled={!newContent.trim()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors">
                  <Plus size={18} /> Save Idea
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {inboxItems.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <div className="text-base text-stone-800 mb-2">{item.content}</div>
                  <div className="flex flex-wrap gap-2">
                    {item.tagIds?.map(tagId => {
                      const tag = inboxTags.find(t => t.id === tagId);
                      return tag ? (
                        <span key={tag.id} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs">{tag.name} <button onClick={() => updateInboxItem({ id: item.id, tagIds: item.tagIds?.filter(id => id !== tagId) })}><X size={10} /></button></span>
                      ) : null;
                    })}
                    <div className="relative group">
                      <input 
                        placeholder="Search tags..." 
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="text-xs bg-stone-100 rounded px-2 py-1 w-24"
                      />
                      <div className="absolute top-full left-0 bg-white border rounded shadow-lg z-10 w-40 max-h-40 overflow-y-auto hidden group-focus-within:block">
                        <div className="text-[10px] text-stone-500 px-2 py-1">Recent:</div>
                        {recentTags.map(tag => (
                          <button key={tag.id} onClick={() => updateInboxItem({ id: item.id, tagIds: [...(item.tagIds || []), tag.id] })} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
                        ))}
                        <div className="text-[10px] text-stone-500 px-2 py-1 border-t">All:</div>
                        {filteredTags.map(tag => (
                          <button key={tag.id} onClick={() => updateInboxItem({ id: item.id, tagIds: [...(item.tagIds || []), tag.id] })} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
