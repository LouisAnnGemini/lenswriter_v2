import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, Plus, Clock, Trash2, Edit2, Check, Inbox, Book, FileText, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function MobileInboxDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote,
    activeWorkId,
    works,
    scenes,
    chapters
  } = useStore(useShallow(state => ({
    notes: state.notes,
    addNote: state.addNote,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
    activeWorkId: state.activeWorkId,
    works: state.works,
    scenes: state.scenes,
    chapters: state.chapters
  })));

  const [noteScope, setNoteScope] = useState<'global' | 'work'>('global');
  const [newContent, setNewContent] = useState('');
  const [newSceneId, setNewSceneId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
 
  const activeWork = works.find(w => w.id === activeWorkId);
  const workScenes = scenes.filter(s => chapters.some(c => c.id === s.chapterId && c.workId === activeWorkId)).sort((a, b) => a.order - b.order);

  const inboxItems = [...(notes || [])]
    .filter(note => noteScope === 'global' ? note.workId === null : note.workId === activeWorkId)
    .sort((a, b) => b.createdAt - a.createdAt);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (newContent.trim()) {
      addNote({ 
        content: newContent.trim(), 
        workId: noteScope === 'work' ? activeWorkId : null, 
        sceneId: noteScope === 'work' ? newSceneId : null 
      });
      setNewContent('');
      setNewSceneId(null);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 md:hidden transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-stone-50 rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out transform translate-y-0" style={{ maxHeight: '85vh' }}>
        {/* Handle for dragging (visual only) */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        <div className="px-4 pb-2 flex items-center justify-between border-b border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Inbox size={20} className="text-emerald-600" />
            Notes
          </h2>
          <button onClick={onClose} className="p-2 text-stone-500 hover:bg-stone-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Scope Toggle */}
          <div className="flex gap-2">
            <button 
              onClick={() => setNoteScope('global')}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                noteScope === 'global' ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200"
              )}
            >
              <Inbox size={14} /> Global
            </button>
            {activeWorkId && (
              <button 
                onClick={() => setNoteScope('work')}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  noteScope === 'work' ? "bg-emerald-600 text-white" : "bg-white text-stone-600 border border-stone-200"
                )}
              >
                <Book size={14} /> Work
              </button>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <textarea
              ref={inputRef}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={noteScope === 'global' ? "Quick global idea..." : `Note for ${activeWork?.title || 'work'}...`}
              className="w-full text-sm bg-transparent border-none outline-none resize-none min-h-[60px] text-stone-800 placeholder:text-stone-400"
            />
            
            {noteScope === 'work' && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100">
                <FileText size={12} className="text-stone-400" />
                <div className="relative flex-1">
                  <select
                    value={newSceneId || ''}
                    onChange={(e) => setNewSceneId(e.target.value || null)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded px-2 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">No Scene Linked</option>
                    {workScenes.map(scene => (
                      <option key={scene.id} value={scene.id}>{scene.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="flex justify-end mt-2 pt-2 border-t border-stone-100">
              <button
                onClick={handleAdd}
                disabled={!newContent.trim()}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-xs font-medium flex items-center gap-1"
              >
                <Plus size={14} />
                Save
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3 pb-safe">
            {inboxItems.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-sm">
                No notes found.
              </div>
            ) : (
              inboxItems.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-sm bg-stone-50 border border-stone-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none min-h-[60px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md flex items-center gap-1"
                        >
                          <Check size={14} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-stone-800 whitespace-pre-wrap break-words leading-relaxed">
                        {item.content}
                      </div>
                      
                      {item.sceneId && (
                        <div className="mt-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px]">
                            <FileText size={10} />
                            {scenes.find(s => s.id === item.sceneId)?.title || 'Unknown Scene'}
                          </span>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <div className="flex items-center text-[10px] text-stone-400 font-medium">
                          <Clock size={12} className="mr-1" />
                          {new Date(item.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          {deletingId === item.id ? (
                            <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-md">
                              <span className="text-[10px] text-red-600 font-medium">Delete?</span>
                              <button onClick={() => confirmDelete(item.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <Check size={12} />
                              </button>
                              <button onClick={() => setDeletingId(null)} className="p-1 text-stone-500 hover:bg-stone-200 rounded">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(item.id, item.content)} className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => setDeletingId(item.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                                <Trash2 size={14} />
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
    </>
  );
}
