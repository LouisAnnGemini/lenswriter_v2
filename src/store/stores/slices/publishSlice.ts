import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { StoreState, PublishSlice, ChapterSnapshot, PlatformTracking, PlatformChapterStatus } from '../../types';

export const createPublishSlice: StateCreator<StoreState, [], [], PublishSlice> = (set, get) => ({
  createChapterSnapshot: (chapterId, versionName, note) => {
    const state = get();
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const scenes = state.scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
    const blocks = state.blocks.filter(b => scenes.some(s => s.id === b.documentId)).sort((a, b) => a.order - b.order);

    const newSnapshot: ChapterSnapshot = {
      id: uuidv4(),
      chapterId,
      versionName,
      data: {
        chapter: JSON.parse(JSON.stringify(chapter)),
        scenes: JSON.parse(JSON.stringify(scenes)),
        blocks: JSON.parse(JSON.stringify(blocks)),
      },
      timestamp: Date.now(),
      note,
    };

    set(state => ({
      chapterSnapshots: [...state.chapterSnapshots, newSnapshot],
      lastModified: Date.now(),
    }));
  },

  deleteChapterSnapshot: (snapshotId) => {
    set(state => ({
      chapterSnapshots: state.chapterSnapshots.filter(s => s.id !== snapshotId),
      platformTrackings: state.platformTrackings.map(p => ({
        ...p,
        chapterStatuses: Object.fromEntries(
          Object.entries(p.chapterStatuses).map(([cid, status]) => [
            cid,
            status.lastPublishedSnapshotId === snapshotId 
              ? { ...status, lastPublishedSnapshotId: null, status: 'not_published' as const } 
              : status
          ])
        )
      })),
      lastModified: Date.now(),
    }));
  },

  addPlatformTracking: (workId, platformName) => {
    const newPlatform: PlatformTracking = {
      id: uuidv4(),
      workId,
      platformName,
      chapterStatuses: {},
    };
    set(state => ({
      platformTrackings: [...state.platformTrackings, newPlatform],
      lastModified: Date.now(),
    }));
  },

  deletePlatformTracking: (id) => {
    set(state => ({
      platformTrackings: state.platformTrackings.filter(p => p.id !== id),
      lastModified: Date.now(),
    }));
  },

  publishChapterToPlatform: (platformId, chapterId, snapshotId) => {
    set(state => ({
      platformTrackings: state.platformTrackings.map(p => {
        if (p.id !== platformId) return p;
        
        const newStatus: PlatformChapterStatus = {
          chapterId,
          lastPublishedSnapshotId: snapshotId,
          status: 'published' as const,
        };

        return {
          ...p,
          chapterStatuses: {
            ...p.chapterStatuses,
            [chapterId]: newStatus
          }
        };
      }),
      lastModified: Date.now(),
    }));
  },

  syncPlatformStatus: (workId) => {
    const state = get();
    const workChapters = state.chapters.filter(c => c.workId === workId);
    
    set(state => ({
      platformTrackings: state.platformTrackings.map(p => {
        if (p.workId !== workId) return p;

        const updatedStatuses = { ...p.chapterStatuses };
        
        workChapters.forEach(chapter => {
          const currentStatus = updatedStatuses[chapter.id];
          if (!currentStatus || !currentStatus.lastPublishedSnapshotId) return;

          const snapshot = state.chapterSnapshots.find(s => s.id === currentStatus.lastPublishedSnapshotId);
          if (!snapshot) return;

          // Compare current chapter state with snapshot
          const currentScenes = state.scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order);
          const currentBlocks = state.blocks.filter(b => currentScenes.some(s => s.id === b.documentId)).sort((a, b) => a.order - b.order);

          const snapshotScenes = snapshot.data.scenes;
          const snapshotBlocks = snapshot.data.blocks;

          let hasChanged = false;

          if (currentScenes.length !== snapshotScenes.length || currentBlocks.length !== snapshotBlocks.length) {
            hasChanged = true;
          } else {
            // Compare content
            for (let i = 0; i < currentBlocks.length; i++) {
              if (currentBlocks[i].content !== snapshotBlocks[i].content) {
                hasChanged = true;
                break;
              }
            }
          }

          if (hasChanged) {
            updatedStatuses[chapter.id] = {
              ...currentStatus,
              status: 'to_update' as const
            };
          }
        });

        return {
          ...p,
          chapterStatuses: updatedStatuses
        };
      })
    }));
  },
});
