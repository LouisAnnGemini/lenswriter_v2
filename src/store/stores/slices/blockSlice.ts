import { StateCreator } from 'zustand';
import { StoreState, Block, BlockSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createBlockSlice: StateCreator<StoreState, [], [], BlockSlice> = (set) => ({
  addBlock: ({ documentId, type, isLens, lensColor, afterBlockId, notes }) => set((state) => {
    const newBlock: Block = { 
      id: uuidv4(), 
      documentId, 
      type, 
      isLens, 
      lensColor, 
      content: '', 
      order: state.blocks.length,
      notes
    };
    
    if (afterBlockId) {
      const afterIndex = state.blocks.findIndex(b => b.id === afterBlockId);
      if (afterIndex !== -1) {
        const newBlocks = [...state.blocks];
        newBlocks.splice(afterIndex + 1, 0, newBlock);
        return { blocks: newBlocks.map((b, i) => ({ ...b, order: i })) };
      }
    }
    
    return { blocks: [...state.blocks, newBlock] };
  }),
  updateBlock: (block) => set((state) => ({
    blocks: state.blocks.map(b => b.id === block.id ? { ...b, ...block } : b)
  })),
  deleteBlock: (blockId) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== blockId)
  })),
  removeLens: (blockId) => set((state) => ({
    blocks: state.blocks.map(b => b.id === blockId ? { ...b, isLens: false, lensColor: undefined } : b)
  })),
  mergeBlockUp: (blockId) => set((state) => {
    const blockIndex = state.blocks.findIndex(b => b.id === blockId);
    if (blockIndex <= 0) return state;
    
    const block = state.blocks[blockIndex];
    const prevBlock = state.blocks[blockIndex - 1];
    
    if (block.isLens || prevBlock.isLens) return state;
    
    const updatedPrevBlock = { ...prevBlock, content: prevBlock.content + (prevBlock.content && block.content ? '\n' : '') + block.content };
    const newBlocks = state.blocks.filter(b => b.id !== blockId).map(b => b.id === prevBlock.id ? updatedPrevBlock : b);
    
    return { blocks: newBlocks.map((b, i) => ({ ...b, order: i })) };
  }),
  bulkUpdateBlocks: (updates) => set((state) => {
    const updateMap = new Map(updates.map(u => [u.id, u.content]));
    return {
      blocks: state.blocks.map(b => {
        if (updateMap.has(b.id)) {
          return { ...b, content: updateMap.get(b.id)! };
        }
        return b;
      })
    };
  }),
});
