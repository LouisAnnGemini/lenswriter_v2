import { StateCreator } from 'zustand';
import { StoreState, SnapshotSlice, SceneSnapshot } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createSnapshotSlice: StateCreator<
  StoreState,
  [['zustand/persist', unknown]],
  [],
  SnapshotSlice
> = (set, get) => ({
  addSnapshot: (sceneId, name) =>
    set((state) => {
      const sceneBlocks = state.blocks.filter((b) => b.documentId === sceneId);
      // Deep copy blocks to prevent reference issues
      const copiedBlocks = JSON.parse(JSON.stringify(sceneBlocks));
      
      const newSnapshot: SceneSnapshot = {
        id: uuidv4(),
        sceneId,
        name,
        createdAt: Date.now(),
        blocks: copiedBlocks,
      };

      return {
        snapshots: [...(state.snapshots || []), newSnapshot],
      };
    }),

  renameSnapshot: (id, name) =>
    set((state) => ({
      snapshots: (state.snapshots || []).map((s) =>
        s.id === id ? { ...s, name } : s
      ),
    })),

  deleteSnapshot: (id) =>
    set((state) => ({
      snapshots: (state.snapshots || []).filter((s) => s.id !== id),
    })),

  restoreSnapshot: (id) =>
    set((state) => {
      const snapshot = (state.snapshots || []).find((s) => s.id === id);
      if (!snapshot) return state;

      const sceneId = snapshot.sceneId;
      const otherBlocks = state.blocks.filter((b) => b.documentId !== sceneId);
      const previousBlocks = state.blocks.filter((b) => b.documentId === sceneId);
      
      // Deep copy snapshot blocks to prevent reference issues
      const restoredBlocks = JSON.parse(JSON.stringify(snapshot.blocks));

      return {
        blocks: [...otherBlocks, ...restoredBlocks],
        pastActions: [
          ...(state.pastActions || []),
          { type: 'RESTORE_SNAPSHOT', sceneId, previousBlocks, restoredBlocks }
        ].slice(-50),
        futureActions: [],
      };
    }),
});
