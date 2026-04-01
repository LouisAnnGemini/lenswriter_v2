import { StateCreator } from 'zustand';
import { StoreState, Chapter, ChapterSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createChapterSlice: StateCreator<StoreState, [], [], ChapterSlice> = (set) => ({
  addChapter: (workId, title) => set((state) => ({
    chapters: [...state.chapters, { id: uuidv4(), workId, title, order: state.chapters.length, completed: false, archived: false }],
    lastModified: Date.now()
  })),
  updateChapter: (chapter) => set((state) => ({
    chapters: state.chapters.map(c => c.id === chapter.id ? { ...c, ...chapter } : c),
    lastModified: Date.now()
  })),
  deleteChapter: (chapterId) => set((state) => {
    const scenesToDelete = state.scenes.filter(s => s.chapterId === chapterId).map(s => s.id);
    return {
      chapters: state.chapters.filter(c => c.id !== chapterId),
      scenes: state.scenes.filter(s => s.chapterId !== chapterId),
      blocks: state.blocks.filter(b => !scenesToDelete.includes(b.documentId) && b.documentId !== chapterId),
      notes: state.notes.map(n => n.sceneId && scenesToDelete.includes(n.sceneId) ? { ...n, sceneId: null } : n),
      lastModified: Date.now()
    };
  }),
  toggleChapterArchive: (chapterId) => set((state) => ({
    chapters: state.chapters.map(c => c.id === chapterId ? { ...c, archived: !c.archived } : c),
    lastModified: Date.now()
  })),
  reorderChapters: (workId, startIndex, endIndex) => set((state) => {
    const chapters = [...state.chapters].filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
    const [removed] = chapters.splice(startIndex, 1);
    chapters.splice(endIndex, 0, removed);
    const updatedChapters = chapters.map((c, i) => ({ ...c, order: i }));
    return {
      chapters: [
        ...state.chapters.filter(c => c.workId !== workId),
        ...updatedChapters
      ],
      lastModified: Date.now()
    };
  }),
});
