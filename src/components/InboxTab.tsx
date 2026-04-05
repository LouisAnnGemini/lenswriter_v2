import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Trash2, Edit2, Check, X, Plus, Inbox, Settings, Book, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';

export function InboxTab() {
  const { 
    notes, 
    inboxTags, 
    addNote, 
    updateNote, 
    deleteNote, 
    addInboxTag, 
    updateInboxTag, 
    deleteInboxTag,
    activeWorkId,
    works,
    scenes,
    chapters
  } = useStore(useShallow(state => ({
    notes: state.notes,
    inboxTags: state.inboxTags,
    addNote: state.addNote,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
    addInboxTag: state.addInboxTag,
    updateInboxTag: state.updateInboxTag,
    deleteInboxTag: state.deleteInboxTag,
    activeWorkId: state.activeWorkId,
    works: state.works,
    scenes: state.scenes,
    chapters: state.chapters
  })));
  
  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'manageTags'>('inbox');
  const [noteScope, setNoteScope] = useState<'global' | 'work'>('global');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTagIds, setNewTagIds] = useState<string[]>([]);
  const [newSceneId, setNewSceneId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');

  const activeWork = works.find(w => w.id === activeWorkId);
  const workScenes = scenes.filter(s => chapters.some(c => c.id === s.chapterId && c.workId === activeWorkId)).sort((a, b) => a.order - b.order);

  // Filter notes based on scope
  const inboxItems = [...(notes || [])]
    .filter(note => noteScope === 'global' ? note.workId === null : note.workId === activeWorkId)
    .sort((a, b) => b.createdAt - a.createdAt);
  
  // Get 5 most recently used tags
  const recentTags = React.useMemo(() => {
    const tagCounts: Record<string, number> = {};
    notes.forEach(item => item.tagIds?.forEach(id => tagCounts[id] = (tagCounts[id] || 0) + 1));
    return inboxTags
      .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
      .slice(0, 5);
  }, [notes, inboxTags]);

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
      updateNote({ id: editingId, content: editContent.trim() });
      setEditingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    deleteNote(id);
    setDeletingId(null);
  };

  const handleAdd = () => {
    if (newContent.trim()) {
      let finalWorkId = noteScope === 'work' ? activeWorkId : null;
      let finalSceneId = noteScope === 'work' ? newSceneId : null;

      if (newSceneId) {
        const scene = scenes.find(s => s.id === newSceneId);
        if (scene) {
          const chapter = chapters.find(c => c.id === scene.chapterId);
          if (chapter) {
            finalWorkId = chapter.workId;
            finalSceneId = newSceneId;
          }
        }
      }

      addNote({ 
        content: newContent.trim(), 
        tagIds: newTagIds, 
        workId: finalWorkId, 
        sceneId: finalSceneId 
      });
      setNewContent('');
      setNewTagIds([]);
      setNewSceneId(null);
    }
  };

  const sceneOptions = workScenes.map(s => ({ id: s.id, title: s.title }));

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
            <Inbox size={32} className="text-emerald-600" /> 收件箱
          </h1>
          <div className="flex bg-stone-200 rounded-lg p-1 self-start sm:self-auto">
            <button onClick={() => setActiveSubTab('inbox')} className={cn("px-4 py-2 rounded-md text-sm font-medium", activeSubTab === 'inbox' ? "bg-white shadow" : "text-stone-600")}>灵感笔记</button>
            <button onClick={() => setActiveSubTab('manageTags')} className={cn("px-4 py-2 rounded-md text-sm font-medium", activeSubTab === 'manageTags' ? "bg-white shadow" : "text-stone-600")}>标签管理</button>
          </div>
        </div>

        {activeSubTab === 'manageTags' ? (
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">管理标签</h2>
            <div className="flex gap-2 mb-4">
              <input 
                placeholder="新标签名称" 
                onKeyDown={(e) => { if(e.key === 'Enter' && e.currentTarget.value) { addInboxTag({ name: e.currentTarget.value }); e.currentTarget.value = ''; } }}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="space-y-2">
              {inboxTags.map(tag => (
                <div key={tag.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  {editingTagId === tag.id ? (
                    <input autoFocus value={editTagName} onChange={e => setEditTagName(e.target.value)} onBlur={() => { updateInboxTag({ id: tag.id, name: editTagName }); setEditingTagId(null); }} className="flex-1 px-2 py-1 border rounded" />
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
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => setNoteScope('global')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
                  noteScope === 'global' ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                )}
              >
                <Inbox size={16} /> 全局笔记
              </button>
              {activeWorkId && (
                <button 
                  onClick={() => setNoteScope('work')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
                    noteScope === 'work' ? "bg-emerald-600 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                  )}
                >
                  <Book size={16} /> {activeWork?.title || '当前作品'} 笔记
                </button>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-8">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={noteScope === 'global' ? "在这里输入全局灵感..." : `为 ${activeWork?.title || '当前作品'} 记录笔记...`}
                className="w-full text-base bg-transparent border-none outline-none resize-y min-h-[100px] text-stone-800 placeholder:text-stone-400"
              />
              
              {noteScope === 'work' && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-stone-400" />
                    <span className="text-xs text-stone-500">Link to Scene (Optional):</span>
                  </div>
                  <div className="w-full sm:w-64">
                    <SearchableSelect
                      options={sceneOptions}
                      value={newSceneId}
                      onChange={setNewSceneId}
                      placeholder="Search scenes..."
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-stone-100">
                {newTagIds.map(tagId => {
                  const tag = inboxTags.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tag.id} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs flex items-center gap-1">
                      {tag.name} 
                      <button onClick={() => setNewTagIds(prev => prev.filter(id => id !== tagId))}><X size={10} /></button>
                    </span>
                  ) : null;
                })}
                <div className="relative group">
                  <input 
                    placeholder="Search tags..." 
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="text-xs bg-stone-100 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-emerald-500"
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
                            <button key={tag.id} onClick={() => { setNewTagIds(prev => prev.includes(tag.id) ? prev : [...prev, tag.id]); setTagSearch(''); }} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
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
                  <Plus size={18} /> Save Note
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {inboxItems.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Inbox size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No notes found in this scope.</p>
                </div>
              ) : (
                inboxItems.map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm group">
                    {editingId === item.id ? (
                      <div className="mb-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full text-base bg-stone-50 border border-stone-200 rounded p-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm text-stone-500 hover:bg-stone-100 rounded">Cancel</button>
                          <button onClick={handleSaveEdit} className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-base text-stone-800 mb-3 whitespace-pre-wrap">{item.content}</div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.sceneId && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs flex items-center gap-1">
                            <FileText size={12} />
                            {scenes.find(s => s.id === item.sceneId)?.title || 'Unknown Scene'}
                          </span>
                        )}
                        
                        {item.tagIds?.map(tagId => {
                          const tag = inboxTags.find(t => t.id === tagId);
                          return tag ? (
                            <span key={tag.id} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs flex items-center gap-1">
                              {tag.name} 
                              <button onClick={() => updateNote({ id: item.id, tagIds: item.tagIds?.filter(id => id !== tagId) })}><X size={10} /></button>
                            </span>
                          ) : null;
                        })}
                        
                        <div className="relative group/tag">
                          <button className="text-xs text-stone-400 hover:text-stone-600 px-2 py-0.5 rounded hover:bg-stone-100 flex items-center gap-1">
                            <Plus size={12} /> Tag
                          </button>
                          <div className="absolute top-full left-0 bg-white border rounded shadow-lg z-10 w-40 max-h-40 overflow-y-auto hidden group-hover/tag:block">
                            <div className="text-[10px] text-stone-500 px-2 py-1">Recent:</div>
                            {recentTags.map(tag => (
                              <button key={tag.id} onClick={() => updateNote({ id: item.id, tagIds: [...(item.tagIds || []), tag.id] })} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
                            ))}
                            <div className="text-[10px] text-stone-500 px-2 py-1 border-t">All:</div>
                            {inboxTags.map(tag => (
                              <button key={tag.id} onClick={() => updateNote({ id: item.id, tagIds: [...(item.tagIds || []), tag.id] })} className="block w-full text-left px-2 py-1 text-xs hover:bg-stone-100">{tag.name}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                        <div className="relative group/scope">
                          <button className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded" title="Change Scope">
                            <Settings size={14} />
                          </button>
                          <div className="absolute bottom-full right-0 mb-1 bg-white border rounded shadow-lg z-10 w-48 hidden group-hover/scope:block p-2">
                            <div className="text-xs font-medium text-stone-700 mb-2">Move Note To:</div>
                            <button 
                              onClick={() => updateNote({ id: item.id, workId: null, sceneId: null })}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-stone-100 rounded flex items-center gap-2"
                            >
                              <Inbox size={12} /> Global Notes
                            </button>
                            {activeWorkId && (
                              <>
                                <button 
                                  onClick={() => updateNote({ id: item.id, workId: activeWorkId, sceneId: null })}
                                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-stone-100 rounded flex items-center gap-2 mt-1"
                                >
                                  <Book size={12} /> Current Work
                                </button>
                                <div className="mt-2 pt-2 border-t border-stone-100">
                                  <div className="text-[10px] text-stone-500 mb-1 px-2">Link to Scene:</div>
                                  <div className="max-h-32 overflow-y-auto">
                                    {workScenes.map(scene => (
                                      <button 
                                        key={scene.id}
                                        onClick={() => updateNote({ id: item.id, workId: activeWorkId, sceneId: scene.id })}
                                        className={cn(
                                          "w-full text-left px-2 py-1 text-xs hover:bg-stone-100 rounded truncate",
                                          item.sceneId === scene.id && "bg-emerald-50 text-emerald-700"
                                        )}
                                      >
                                        {scene.title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleEdit(item.id, item.content)}
                          className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        
                        {deletingId === item.id ? (
                          <div className="flex items-center gap-1 bg-red-50 rounded px-1">
                            <button onClick={() => confirmDelete(item.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Check size={14} /></button>
                            <button onClick={() => setDeletingId(null)} className="p-1 text-stone-500 hover:bg-stone-200 rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
