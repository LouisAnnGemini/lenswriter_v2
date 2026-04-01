import { StateCreator } from 'zustand';
import { StoreState, NoteSlice, Note } from '../../types';
import { nanoid } from 'nanoid';

export const createNoteSlice: StateCreator<StoreState, [], [], NoteSlice> = (set) => ({
  addNote: (params) => set((state) => ({
    notes: [
      ...state.notes,
      {
        id: nanoid(),
        content: params.content,
        createdAt: Date.now(),
        workId: params.workId || null,
        sceneId: params.sceneId || null,
        tagIds: params.tagIds || [],
      },
    ],
    lastModified: Date.now(),
  })),
  updateNote: (note) => set((state) => ({
    notes: state.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
    lastModified: Date.now(),
  })),
  deleteNote: (noteId) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== noteId),
    lastModified: Date.now(),
  })),
  reassignNote: (noteId, workId, sceneId) => set((state) => ({
    notes: state.notes.map((n) => (n.id === noteId ? { ...n, workId, sceneId } : n)),
    lastModified: Date.now(),
  })),
  addInboxTag: (tag) => {
    const id = nanoid();
    set((state) => ({
      inboxTags: [...state.inboxTags, { id, ...tag }],
      lastModified: Date.now(),
    }));
    return id;
  },
  updateInboxTag: (tag) => set((state) => ({
    inboxTags: state.inboxTags.map((t) => (t.id === tag.id ? { ...t, ...tag } : t)),
    lastModified: Date.now(),
  })),
  deleteInboxTag: (tagId) => set((state) => ({
    inboxTags: state.inboxTags.filter((t) => t.id !== tagId),
    notes: state.notes.map((n) => ({ ...n, tagIds: n.tagIds?.filter((id) => id !== tagId) })),
    lastModified: Date.now(),
  })),
});
