import { StateCreator } from 'zustand';
import { StoreState, Work, WorkSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createWorkSlice: StateCreator<StoreState, [], [], WorkSlice> = (set, get) => ({
  addWork: (title) => set((state) => {
    const newWork: Work = { id: uuidv4(), title, createdAt: Date.now(), order: state.works.length };
    return { works: [...state.works, newWork], activeWorkId: newWork.id, activeDocumentId: null };
  }),
  updateWork: (work) => set((state) => ({
    works: state.works.map(w => w.id === work.id ? { ...w, ...work } : w)
  })),
  deleteWork: (workId) => set((state) => {
    const chaptersToDelete = state.chapters.filter(c => c.workId === workId).map(c => c.id);
    const scenesToDelete = state.scenes.filter(s => chaptersToDelete.includes(s.chapterId)).map(s => s.id);
    const docsToDelete = [...chaptersToDelete, ...scenesToDelete];
    const blocksToDelete = state.blocks.filter(b => docsToDelete.includes(b.documentId)).map(b => b.id);
    const metroLinesToDelete = state.metroLines.filter(l => l.workId === workId).map(l => l.id);

    return {
      works: state.works.filter(w => w.id !== workId),
      chapters: state.chapters.filter(c => c.workId !== workId),
      scenes: state.scenes.filter(s => !chaptersToDelete.includes(s.chapterId)),
      characters: state.characters.filter(c => c.workId !== workId),
      locations: state.locations.filter(l => l.workId !== workId),
      tags: state.tags.filter(t => t.workId !== workId),
      timelineEvents: state.timelineEvents.filter(e => e.workId !== workId),
      deadlines: (state.deadlines || []).filter(d => d.workId !== workId),
      snapshots: state.snapshots.filter(s => !scenesToDelete.includes(s.sceneId)),
      chapterSnapshots: state.chapterSnapshots ? state.chapterSnapshots.filter(s => !chaptersToDelete.includes(s.chapterId)) : [],
      platformTrackings: state.platformTrackings ? state.platformTrackings.filter(p => p.workId !== workId) : [],
      metroLines: state.metroLines.filter(l => l.workId !== workId),
      metroNodes: state.metroNodes.filter(n => !metroLinesToDelete.includes(n.lineId)),
      blocks: state.blocks.filter(b => !docsToDelete.includes(b.documentId)).map(b => {
        if (b.linkedLensIds && b.linkedLensIds.some(id => blocksToDelete.includes(id))) {
          return { ...b, linkedLensIds: b.linkedLensIds.filter(id => !blocksToDelete.includes(id)) };
        }
        return b;
      }),
      activeWorkId: state.activeWorkId === workId ? null : state.activeWorkId,
      activeDocumentId: docsToDelete.includes(state.activeDocumentId!) ? null : state.activeDocumentId,
      notes: state.notes.map(n => n.workId === workId ? { ...n, workId: null, sceneId: null } : n)
    };
  }),
  reorderWorks: (startIndex, endIndex) => set((state) => {
    const works = [...state.works].sort((a, b) => a.order - b.order);
    const [removed] = works.splice(startIndex, 1);
    works.splice(endIndex, 0, removed);
    const updatedWorks = works.map((w, i) => ({ ...w, order: i }));
    return { works: updatedWorks };
  }),
  setActiveWork: (workId) => set((state) => {
    const firstChapter = state.chapters
      .filter(c => c.workId === workId && !c.archived)
      .sort((a, b) => a.order - b.order)[0];
    
    let firstDocId = null;
    if (firstChapter) {
      firstDocId = firstChapter.id;
    } else {
      const anyChapter = state.chapters
        .filter(c => c.workId === workId)
        .sort((a, b) => a.order - b.order)[0];
      
      if (anyChapter) {
        firstDocId = anyChapter.id;
      }
    }
    
    return { activeWorkId: workId, activeDocumentId: firstDocId };
  }),
  addCharacterField: (workId, field) => set((state) => ({
    works: state.works.map(w => w.id === workId ? { ...w, characterFields: [...(w.characterFields || []), field] } : w)
  })),
  updateCharacterField: (workId, fieldId, updates) => set((state) => ({
    works: state.works.map(w => w.id === workId ? { ...w, characterFields: (w.characterFields || []).map(f => f.id === fieldId ? { ...f, ...updates } : f) } : w)
  })),
  deleteCharacterField: (workId, fieldId) => set((state) => ({
    works: state.works.map(w => w.id === workId ? { ...w, characterFields: (w.characterFields || []).filter(f => f.id !== fieldId) } : w)
  })),
  reorderCharacterFields: (workId, startIndex, endIndex) => set((state) => ({
    works: state.works.map(w => {
      if (w.id === workId) {
        const fields = [...(w.characterFields || [])];
        const [removed] = fields.splice(startIndex, 1);
        fields.splice(endIndex, 0, removed);
        return { ...w, characterFields: fields };
      }
      return w;
    })
  })),
});
