import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { createSnapshotSlice } from './snapshotSlice';

describe('snapshotSlice', () => {
  let useStore: any;

  beforeEach(() => {
    useStore = create<StoreState>()((set, get, api) => ({
      ...createSnapshotSlice(set, get, api as any),
      blocks: [],
      snapshots: [],
      pastActions: [],
      futureActions: [],
    } as any));
  });

  it('should add a snapshot', () => {
    useStore.setState({
      blocks: [
        { id: 'b1', documentId: 's1', content: 'hello' },
        { id: 'b2', documentId: 's2', content: 'world' },
      ],
    });

    useStore.getState().addSnapshot('s1', 'My Snapshot');

    const state = useStore.getState();
    expect(state.snapshots.length).toBe(1);
    expect(state.snapshots[0].name).toBe('My Snapshot');
    expect(state.snapshots[0].sceneId).toBe('s1');
    expect(state.snapshots[0].blocks).toEqual([{ id: 'b1', documentId: 's1', content: 'hello' }]);
  });

  it('should rename a snapshot', () => {
    useStore.setState({
      snapshots: [
        { id: 'snap1', name: 'Old Name', sceneId: 's1', blocks: [] },
      ],
    });

    useStore.getState().renameSnapshot('snap1', 'New Name');

    const state = useStore.getState();
    expect(state.snapshots[0].name).toBe('New Name');
  });

  it('should delete a snapshot', () => {
    useStore.setState({
      snapshots: [
        { id: 'snap1', name: 'Snap 1', sceneId: 's1', blocks: [] },
        { id: 'snap2', name: 'Snap 2', sceneId: 's1', blocks: [] },
      ],
    });

    useStore.getState().deleteSnapshot('snap1');

    const state = useStore.getState();
    expect(state.snapshots.length).toBe(1);
    expect(state.snapshots[0].id).toBe('snap2');
  });

  it('should restore a snapshot', () => {
    useStore.setState({
      blocks: [
        { id: 'b1', documentId: 's1', content: 'current content' },
        { id: 'b2', documentId: 's2', content: 'other scene' },
      ],
      snapshots: [
        {
          id: 'snap1',
          name: 'Old Snap',
          sceneId: 's1',
          blocks: [{ id: 'b1', documentId: 's1', content: 'old content' }],
        },
      ],
    });

    useStore.getState().restoreSnapshot('snap1');

    const state = useStore.getState();
    expect(state.blocks).toEqual([
      { id: 'b2', documentId: 's2', content: 'other scene' },
      { id: 'b1', documentId: 's1', content: 'old content' },
    ]);
    expect(state.pastActions.length).toBe(1);
    expect(state.pastActions[0].type).toBe('RESTORE_SNAPSHOT');
    expect(state.pastActions[0].previousBlocks).toEqual([{ id: 'b1', documentId: 's1', content: 'current content' }]);
  });
});
