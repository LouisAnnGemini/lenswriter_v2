import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { initialState } from '../constants';

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      ...initialState,
      blocks: [],
      pastActions: [],
      futureActions: [],
    });
  });

  it('should undo and redo DELETE_BLOCK', () => {
    const block = { id: 'b1', documentId: 's1', type: 'text' as const, content: 'hello', order: 0 };
    useStore.setState({
      blocks: [],
      pastActions: [{ type: 'DELETE_BLOCK', block, index: 0 }],
      futureActions: [],
    });

    useStore.getState().undo();
    let state = useStore.getState();
    expect(state.blocks.length).toBe(1);
    expect(state.blocks[0].id).toBe('b1');
    expect(state.pastActions.length).toBe(0);
    expect(state.futureActions.length).toBe(1);

    useStore.getState().redo();
    state = useStore.getState();
    expect(state.blocks.length).toBe(0);
    expect(state.pastActions.length).toBe(1);
    expect(state.futureActions.length).toBe(0);
  });

  it('should undo and redo ADD_BLOCK', () => {
    const block = { id: 'b1', documentId: 's1', type: 'text' as const, content: 'hello', order: 0 };
    useStore.setState({
      blocks: [block],
      pastActions: [{ type: 'ADD_BLOCK', block, index: 0 }],
      futureActions: [],
    });

    useStore.getState().undo();
    let state = useStore.getState();
    expect(state.blocks.length).toBe(0);
    expect(state.pastActions.length).toBe(0);
    expect(state.futureActions.length).toBe(1);

    useStore.getState().redo();
    state = useStore.getState();
    expect(state.blocks.length).toBe(1);
    expect(state.blocks[0].id).toBe('b1');
    expect(state.pastActions.length).toBe(1);
    expect(state.futureActions.length).toBe(0);
  });

  it('should undo and redo MERGE_BLOCK', () => {
    const prevBlock = { id: 'b1', documentId: 's1', type: 'text' as const, content: 'hello\nworld', order: 0 };
    const deletedBlock = { id: 'b2', documentId: 's1', type: 'text' as const, content: 'world', order: 1 };
    
    useStore.setState({
      blocks: [prevBlock],
      pastActions: [{ 
        type: 'MERGE_BLOCK', 
        blockId: 'b2',
        prevBlockId: 'b1', 
        deletedBlock, 
        originalPrevContent: 'hello',
        index: 1 
      }],
      futureActions: [],
    });

    useStore.getState().undo();
    let state = useStore.getState();
    expect(state.blocks.length).toBe(2);
    expect(state.blocks[0].content).toBe('hello');
    expect(state.blocks[1].content).toBe('world');
    expect(state.pastActions.length).toBe(0);
    expect(state.futureActions.length).toBe(1);

    useStore.getState().redo();
    state = useStore.getState();
    expect(state.blocks.length).toBe(1);
    expect(state.blocks[0].content).toBe('hello\nworld');
    expect(state.pastActions.length).toBe(1);
    expect(state.futureActions.length).toBe(0);
  });

  it('should undo and redo REMOVE_LENS', () => {
    const block = { id: 'b1', documentId: 's1', type: 'text' as const, content: 'hello', order: 0, isLens: false };
    
    useStore.setState({
      blocks: [block],
      pastActions: [{ 
        type: 'REMOVE_LENS', 
        blockId: 'b1', 
        originalLensColor: 'red'
      }],
      futureActions: [],
    });

    useStore.getState().undo();
    let state = useStore.getState();
    expect(state.blocks[0].isLens).toBe(true);
    expect(state.blocks[0].lensColor).toBe('red');
    expect(state.pastActions.length).toBe(0);
    expect(state.futureActions.length).toBe(1);

    useStore.getState().redo();
    state = useStore.getState();
    expect(state.blocks[0].isLens).toBe(false);
    expect(state.blocks[0].lensColor).toBeUndefined();
    expect(state.pastActions.length).toBe(1);
    expect(state.futureActions.length).toBe(0);
  });

  it('should undo and redo RESTORE_SNAPSHOT', () => {
    const block1 = { id: 'b1', documentId: 's1', type: 'text' as const, content: 'current', order: 0 };
    const block2 = { id: 'b2', documentId: 's2', type: 'text' as const, content: 'other', order: 1 };
    const oldBlock = { id: 'b1', documentId: 's1', type: 'text' as const, content: 'old', order: 0 };
    
    useStore.setState({
      blocks: [block1, block2],
      pastActions: [{ 
        type: 'RESTORE_SNAPSHOT', 
        sceneId: 's1', 
        previousBlocks: [oldBlock],
        restoredBlocks: [block1]
      }],
      futureActions: [],
    });

    useStore.getState().undo();
    let state = useStore.getState();
    expect(state.blocks.length).toBe(2);
    expect(state.blocks.find(b => b.id === 'b1')?.content).toBe('old');
    expect(state.blocks.find(b => b.id === 'b2')?.content).toBe('other');
    expect(state.pastActions.length).toBe(0);
    expect(state.futureActions.length).toBe(1);

    useStore.getState().redo();
    state = useStore.getState();
    expect(state.blocks.length).toBe(2);
    expect(state.blocks.find(b => b.id === 'b1')?.content).toBe('current');
    expect(state.blocks.find(b => b.id === 'b2')?.content).toBe('other');
    expect(state.pastActions.length).toBe(1);
    expect(state.futureActions.length).toBe(0);
  });
});
