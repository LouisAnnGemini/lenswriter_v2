import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Trash2, Edit2, Check, X, StickyNote, Tag as TagIcon, Book, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotesTabProps {
  workId: string | null;
  sceneId: string | null;
}

export function NotesTab({ workId, sceneId }: NotesTabProps) {
  const { notes, inboxTags, scenes, chapters, addNote, updateNote, deleteNote, addInboxTag } = useStore(useShallow(state => ({
    notes: state.notes,
    inboxTags: state.inboxTags,
    scenes: state.scenes,
    chapters: state.chapters,
    addNote: state.addNote,
    updateNote: state.updateNote,
    deleteNote: state.deleteNote,
    addInboxTag: state.addInboxTag
  })));

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'document' | 'work'>('document');

  // If we are not in a scene, 'document' mode means work-level notes (sceneId === null)
  // If we are in a scene, 'document' mode means scene-level notes (sceneId === sceneId)
  // 'work' mode means ALL notes for the work, regardless of scene.
  const filteredNotes = notes.filter(note => {
    if (note.workId !== workId) return false;
    if (viewMode === 'work') return true;
    return note.sceneId === sceneId;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addNote({
        content: newNoteContent.trim(),
        workId,
        sceneId: viewMode === 'document' ? sceneId : null,
        tagIds: selectedTagIds
      });
      setNewNoteContent('');
      setSelectedTagIds([]);
    }
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim()) {
      updateNote({ id: editingId, content: editContent.trim() });
      setEditingId(null);
      setEditContent('');
    }
  };

  const sceneOptions = scenes.map(s => ({ id: s.id, title: s.title }));

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="p-4 border-b border-stone-200 bg-white">
        <div className="flex items-center justify-end mb-3">
          {sceneId && (
            <div className="flex bg-stone-100 rounded p-0.5">
              <button
                onClick={() => setViewMode('document')}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded-sm flex items-center gap-1 transition-colors",
                  viewMode === 'document' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
              >
                <FileText size={10} /> This Scene
              </button>
              <button
                onClick={() => setViewMode('work')}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded-sm flex items-center gap-1 transition-colors",
                  viewMode === 'work' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
              >
                <Book size={10} /> All Work
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder={viewMode === 'document' && sceneId ? "Add a note for this scene..." : "Add a work-level note..."}
            className="w-full p-2 text-sm border border-stone-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-20"
          />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {selectedTagIds.map(tagId => {
                const tag = inboxTags.find(t => t.id === tagId);
                return tag ? (
                  <span key={tag.id} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] flex items-center gap-1">
                    {tag.name}
                    <button onClick={() => setSelectedTagIds(prev => prev.filter(id => id !== tagId))}>
                      <X size={10} />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
            <button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
              className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote size={32} className="mx-auto text-stone-200 mb-2" />
            <p className="text-xs text-stone-400">No notes found.</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm group">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-stone-200 rounded outline-none focus:ring-1 focus:ring-emerald-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="p-1 text-stone-400 hover:text-stone-600">
                      <X size={16} />
                    </button>
                    <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:text-emerald-700">
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm text-stone-700 whitespace-pre-wrap mb-2">{note.content}</div>
                  
                  {viewMode === 'work' && note.sceneId && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px]">
                        <FileText size={10} />
                        Linked to Scene
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {note.tagIds?.map(tagId => {
                        const tag = inboxTags.find(t => t.id === tagId);
                        return tag ? (
                          <span key={tag.id} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 text-stone-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
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
