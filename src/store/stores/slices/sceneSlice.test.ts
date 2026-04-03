import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createSceneSlice } from './sceneSlice';

describe('sceneSlice', () => {
  let useTestStore: any;
  const mockChapterId = 'chap-1';

  beforeEach(() => {
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      scenes: [
        { id: 'scene-1', chapterId: mockChapterId, title: 'Scene 1', order: 0, characterIds: ['char-1'], linkedEventIds: ['event-1'] },
        { id: 'scene-2', chapterId: mockChapterId, title: 'Scene 2', order: 1, characterIds: [] },
      ],
      blocks: [
        { id: 'block-1', documentId: 'scene-1', type: 'text', content: 'Block 1', order: 0 },
      ],
      addBlock: () => {},
      ...createSceneSlice(set, get, api as any),
    } as unknown as StoreState));
  });

  it('should add a new scene', () => {
    const { addScene } = useTestStore.getState();
    addScene({ chapterId: mockChapterId, title: 'New Scene' });
    
    const state = useTestStore.getState();
    expect(state.scenes.length).toBe(3);
    const newScene = state.scenes[state.scenes.length - 1];
    expect(newScene.title).toBe('New Scene');
    expect(newScene.chapterId).toBe(mockChapterId);
    expect(newScene.order).toBe(2);
  });

  it('should update a scene', () => {
    const { updateScene } = useTestStore.getState();
    updateScene({ id: 'scene-1', title: 'Updated Scene' });
    
    const state = useTestStore.getState();
    const updatedScene = state.scenes.find((s: any) => s.id === 'scene-1');
    expect(updatedScene?.title).toBe('Updated Scene');
  });

  it('should delete a scene and its blocks', () => {
    const { deleteScene } = useTestStore.getState();
    deleteScene('scene-1');
    
    const state = useTestStore.getState();
    expect(state.scenes.length).toBe(1);
    expect(state.scenes.some((s: any) => s.id === 'scene-1')).toBe(false);
    expect(state.blocks.some((b: any) => b.documentId === 'scene-1')).toBe(false);
  });

  it('should reorder scenes', () => {
    const { reorderScenes } = useTestStore.getState();
    reorderScenes(mockChapterId, 0, 1);
    
    const state = useTestStore.getState();
    const scene1 = state.scenes.find((s: any) => s.id === 'scene-1');
    const scene2 = state.scenes.find((s: any) => s.id === 'scene-2');
    
    expect(scene1?.order).toBe(1);
    expect(scene2?.order).toBe(0);
  });

  it('should move a scene to another chapter', () => {
    const { moveScene } = useTestStore.getState();
    moveScene('scene-1', 'chap-2', 0);
    
    const state = useTestStore.getState();
    const movedScene = state.scenes.find((s: any) => s.id === 'scene-1');
    expect(movedScene?.chapterId).toBe('chap-2');
    expect(movedScene?.order).toBe(0);
  });

  it('should toggle scene character', () => {
    const { toggleSceneCharacter } = useTestStore.getState();
    
    // Remove character
    toggleSceneCharacter('scene-1', 'char-1');
    expect(useTestStore.getState().scenes.find((s: any) => s.id === 'scene-1')?.characterIds).not.toContain('char-1');
    
    // Add character
    toggleSceneCharacter('scene-1', 'char-1');
    expect(useTestStore.getState().scenes.find((s: any) => s.id === 'scene-1')?.characterIds).toContain('char-1');
  });

  it('should toggle scene event', () => {
    const { toggleSceneEvent } = useTestStore.getState();
    
    // Remove event
    toggleSceneEvent('scene-1', 'event-1');
    expect(useTestStore.getState().scenes.find((s: any) => s.id === 'scene-1')?.linkedEventIds).not.toContain('event-1');
    
    // Add event
    toggleSceneEvent('scene-1', 'event-1');
    expect(useTestStore.getState().scenes.find((s: any) => s.id === 'scene-1')?.linkedEventIds).toContain('event-1');
  });

  it('should reorder scene events', () => {
    const { toggleSceneEvent, reorderSceneEvents } = useTestStore.getState();
    
    // Add another event first
    toggleSceneEvent('scene-1', 'event-2');
    
    reorderSceneEvents('scene-1', 0, 1);
    
    const state = useTestStore.getState();
    const scene = state.scenes.find((s: any) => s.id === 'scene-1');
    expect(scene?.linkedEventIds?.[0]).toBe('event-2');
    expect(scene?.linkedEventIds?.[1]).toBe('event-1');
  });

  it('should toggle lens pin', () => {
    const { toggleLensPin } = useTestStore.getState();
    const initialState = useTestStore.getState();
    toggleLensPin('scene-1');
    // Currently a placeholder, so state should remain unchanged
    expect(useTestStore.getState()).toEqual(initialState);
  });
});
