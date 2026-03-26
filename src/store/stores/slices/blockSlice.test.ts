import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createBlockSlice } from './blockSlice';
import { v4 as uuidv4 } from 'uuid';

describe('blockSlice', () => {
  let useTestStore: any;
  const mockDocumentId = 'doc-1';

  beforeEach(() => {
    // Create a fresh store for each test
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      blocks: [
        { id: 'block-1', documentId: mockDocumentId, type: 'text', content: 'Block 1', order: 0 },
        { id: 'block-2', documentId: mockDocumentId, type: 'text', content: 'Block 2', order: 1 },
        { id: 'block-3', documentId: mockDocumentId, type: 'text', isLens: true, lensColor: 'red', content: 'Lens Block', order: 2 },
      ],
      ...createBlockSlice(set, get, api as any),
    } as StoreState));
  });

  it('should add a new block at the end', () => {
    const { addBlock } = useTestStore.getState();
    const initialBlocksCount = useTestStore.getState().blocks.length;
    
    addBlock({ documentId: mockDocumentId, type: 'text' });
    
    const state = useTestStore.getState();
    expect(state.blocks.length).toBe(initialBlocksCount + 1);
    
    const newBlock = state.blocks[state.blocks.length - 1];
    expect(newBlock.documentId).toBe(mockDocumentId);
    expect(newBlock.content).toBe('');
  });

  it('should add a new block after a specific block', () => {
    const { addBlock } = useTestStore.getState();
    
    addBlock({ documentId: mockDocumentId, type: 'text', afterBlockId: 'block-1' });
    
    const state = useTestStore.getState();
    const newBlock = state.blocks[1]; // Should be inserted after block-1 (index 0)
    
    expect(newBlock.documentId).toBe(mockDocumentId);
    expect(newBlock.content).toBe('');
    expect(state.blocks[2].id).toBe('block-2'); // block-2 should be shifted
  });

  it('should update a block', () => {
    const { updateBlock } = useTestStore.getState();
    
    updateBlock({ id: 'block-1', content: 'Updated Block 1' });
    
    const state = useTestStore.getState();
    const updatedBlock = state.blocks.find((b: any) => b.id === 'block-1');
    expect(updatedBlock?.content).toBe('Updated Block 1');
  });

  it('should delete a block', () => {
    const { deleteBlock } = useTestStore.getState();
    
    deleteBlock('block-2');
    
    const state = useTestStore.getState();
    expect(state.blocks.some((b: any) => b.id === 'block-2')).toBe(false);
    expect(state.blocks.length).toBe(2);
  });

  it('should remove lens properties from a block', () => {
    const { removeLens } = useTestStore.getState();
    
    removeLens('block-3');
    
    const state = useTestStore.getState();
    const updatedBlock = state.blocks.find((b: any) => b.id === 'block-3');
    expect(updatedBlock?.isLens).toBe(false);
    expect(updatedBlock?.lensColor).toBeUndefined();
  });

  it('should merge a block up with the previous block', () => {
    const { mergeBlockUp } = useTestStore.getState();
    
    mergeBlockUp('block-2');
    
    const state = useTestStore.getState();
    expect(state.blocks.length).toBe(2); // One block removed
    
    const mergedBlock = state.blocks.find((b: any) => b.id === 'block-1');
    expect(mergedBlock?.content).toBe('Block 1\nBlock 2');
  });

  it('should not merge if either block is a lens', () => {
    const { mergeBlockUp } = useTestStore.getState();
    
    // block-3 is a lens, block-2 is normal text
    mergeBlockUp('block-3');
    
    const state = useTestStore.getState();
    expect(state.blocks.length).toBe(3); // No blocks removed
    
    const block2 = state.blocks.find((b: any) => b.id === 'block-2');
    expect(block2?.content).toBe('Block 2'); // Content unchanged
  });

  it('should bulk update blocks', () => {
    const { bulkUpdateBlocks } = useTestStore.getState();
    
    bulkUpdateBlocks([
      { id: 'block-1', content: 'Bulk Updated 1' },
      { id: 'block-2', content: 'Bulk Updated 2' }
    ]);
    
    const state = useTestStore.getState();
    expect(state.blocks.find((b: any) => b.id === 'block-1')?.content).toBe('Bulk Updated 1');
    expect(state.blocks.find((b: any) => b.id === 'block-2')?.content).toBe('Bulk Updated 2');
    expect(state.blocks.find((b: any) => b.id === 'block-3')?.content).toBe('Lens Block'); // Unchanged
  });
});
