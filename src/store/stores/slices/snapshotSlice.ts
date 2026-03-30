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
        lastModified: Date.now()
      };
    }),

  renameSnapshot: (id, name) =>
    set((state) => ({
      snapshots: (state.snapshots || []).map((s) =>
        s.id === id ? { ...s, name } : s
      ),
      lastModified: Date.now()
    })),

  deleteSnapshot: (id) =>
    set((state) => ({
      snapshots: (state.snapshots || []).filter((s) => s.id !== id),
      lastModified: Date.now()
    })),

  restoreSnapshot: (id) =>
    set((state) => {
      const snapshot = (state.snapshots || []).find((s) => s.id === id);
      if (!snapshot) return state;

      const sceneId = snapshot.sceneId;
      const otherBlocks = state.blocks.filter((b) => b.documentId !== sceneId);
      const previousBlocks = state.blocks.filter((b) => b.documentId === sceneId);
      
      // Deep copy snapshot blocks to prevent reference issues
      const restoredBlocks = JSON.parse(JSON.stringify(snapshot.blocks)) as typeof snapshot.blocks;

      return {
        blocks: [...otherBlocks, ...restoredBlocks],
        pastActions: [
          ...(state.pastActions || []),
          { type: 'RESTORE_SNAPSHOT' as const, sceneId, previousBlocks, restoredBlocks }
        ].slice(-50),
        futureActions: [],
        lastModified: Date.now()
      };
    }),
});
