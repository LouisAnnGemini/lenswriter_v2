import { StateCreator } from 'zustand';
import { StoreState, Scene, SceneSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createSceneSlice: StateCreator<StoreState, [], [], SceneSlice> = (set, get) => ({
  addScene: ({ chapterId, title }) => {
    const newSceneId = uuidv4();
    set((state) => ({
      scenes: [...state.scenes, { id: newSceneId, chapterId, title: title || '', order: state.scenes.length, characterIds: [] }],
      lastModified: Date.now()
    }));
    get().addBlock({ documentId: newSceneId, type: 'text' });
  },
  updateScene: (scene) => set((state) => ({
    scenes: state.scenes.map(s => s.id === scene.id ? { ...s, ...scene } : s),
    lastModified: Date.now()
  })),
  deleteScene: (sceneId) => set((state) => ({
    scenes: state.scenes.filter(s => s.id !== sceneId),
    blocks: state.blocks.filter(b => b.documentId !== sceneId),
    notes: state.notes.map(n => n.sceneId === sceneId ? { ...n, sceneId: null } : n),
    lastModified: Date.now()
  })),
  reorderScenes: (chapterId, startIndex, endIndex) => set((state) => {
    const scenes = [...state.scenes].filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
    const [removed] = scenes.splice(startIndex, 1);
    scenes.splice(endIndex, 0, removed);
    const updatedScenes = scenes.map((s, i) => ({ ...s, order: i }));
    return {
      scenes: [
        ...state.scenes.filter(s => s.chapterId !== chapterId),
        ...updatedScenes
      ],
      lastModified: Date.now()
    };
  }),
  moveScene: (sceneId, newChapterId, newIndex) => set((state) => {
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return state;
    const scenes = state.scenes.filter(s => s.chapterId === newChapterId).sort((a, b) => a.order - b.order);
    scenes.splice(newIndex, 0, { ...scene, chapterId: newChapterId });
    const updatedScenes = scenes.map((s, i) => ({ ...s, order: i }));
    return {
      scenes: [
        ...state.scenes.filter(s => s.id !== sceneId && s.chapterId !== newChapterId),
        ...updatedScenes
      ],
      lastModified: Date.now()
    };
  }),
  toggleSceneCharacter: (sceneId, characterId) => set((state) => ({
    scenes: state.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const characterIds = s.characterIds.includes(characterId)
        ? s.characterIds.filter(id => id !== characterId)
        : [...s.characterIds, characterId];
      
      // If removing character, remove their note as well
      const characterPresence = { ...s.characterPresence };
      if (!characterIds.includes(characterId)) {
        delete characterPresence[characterId];
      }
      
      return { ...s, characterIds, characterPresence };
    }),
    lastModified: Date.now()
  })),
  updateSceneCharacterNote: (sceneId, characterId, note) => set((state) => ({
    scenes: state.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const characterPresence = { 
        ...(s.characterPresence || {}),
        [characterId]: { ...(s.characterPresence?.[characterId] || {}), note }
      };
      return { ...s, characterPresence };
    }),
    lastModified: Date.now()
  })),
  toggleSceneEvent: (sceneId, eventId) => set((state) => ({
    scenes: state.scenes.map(s => {
      if (s.id !== sceneId) return s;
      const linkedEventIds = s.linkedEventIds?.includes(eventId)
        ? s.linkedEventIds.filter(id => id !== eventId)
        : [...(s.linkedEventIds || []), eventId];
      return { ...s, linkedEventIds };
    }),
    lastModified: Date.now()
  })),
  reorderSceneEvents: (sceneId, startIndex, endIndex) => set((state) => ({
    scenes: state.scenes.map(s => {
      if (s.id !== sceneId || !s.linkedEventIds) return s;
      const linkedEventIds = [...s.linkedEventIds];
      const [removed] = linkedEventIds.splice(startIndex, 1);
      linkedEventIds.splice(endIndex, 0, removed);
      return { ...s, linkedEventIds };
    }),
    lastModified: Date.now()
  })),
  toggleLensPin: (sceneId) => set((state) => {
    // Placeholder logic for lens pinning
    // Toggling lens pin for scene: sceneId
    return state;
  }),
  splitSceneAtBlock: (sceneId, blockId) => set((state) => {
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return state;

    const sceneBlocks = state.blocks.filter(b => b.documentId === sceneId).sort((a, b) => a.order - b.order);
    const splitIndex = sceneBlocks.findIndex(b => b.id === blockId);
    
    if (splitIndex === -1) return state;

    const blocksToMove = sceneBlocks.slice(splitIndex + 1);
    const newSceneId = uuidv4();
    
    const newScene: Scene = {
      ...scene,
      id: newSceneId,
      title: `${scene.title || 'Untitled'} (Part 2)`,
      order: scene.order + 1,
    };

    const updatedScenes = state.scenes.map(s => {
      if (s.chapterId === scene.chapterId && s.order > scene.order) {
        return { ...s, order: s.order + 1 };
      }
      return s;
    });

    const blocksToMoveIds = new Set(blocksToMove.map(b => b.id));
    const updatedBlocks = state.blocks.map(b => {
      if (blocksToMoveIds.has(b.id)) {
        return { ...b, documentId: newSceneId };
      }
      return b;
    });

    return {
      scenes: [...updatedScenes, newScene],
      blocks: updatedBlocks,
      lastModified: Date.now()
    };
  }),
});
