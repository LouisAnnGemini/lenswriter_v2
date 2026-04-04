import { StateCreator } from 'zustand';
import { StoreState, Block, BlockSlice, HistoryAction } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createBlockSlice: StateCreator<StoreState, [], [], BlockSlice> = (set) => ({
  addBlock: ({ id, documentId, type, isLens, lensColor, afterBlockId, notes }) => set((state) => {
    const newBlock: Block = { 
      id: id || uuidv4(), 
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
        const action: HistoryAction = { type: 'ADD_BLOCK', block: newBlock, index: afterIndex + 1 };
        return { 
          blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
          pastActions: [...(state.pastActions || []), action].slice(-50),
          futureActions: [],
          lastModified: Date.now()
        };
      }
    }
    
    const action: HistoryAction = { type: 'ADD_BLOCK', block: newBlock, index: state.blocks.length };
    return { 
      blocks: [...state.blocks, newBlock],
      pastActions: [...(state.pastActions || []), action].slice(-50),
      futureActions: [],
      lastModified: Date.now()
    };
  }),
  updateBlock: (block) => set((state) => ({
    blocks: state.blocks.map(b => {
      if (b.id === block.id) {
        const newBlock = { ...b, ...block };
        if (block.isLens === false) {
          delete newBlock.lensColor;
        }
        return newBlock;
      }
      return b;
    }),
    lastModified: Date.now()
  })),
  deleteBlock: (blockId) => set((state) => {
    const blockIndex = state.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return state;
    const deletedBlock = state.blocks[blockIndex];
    
    const action: HistoryAction = { type: 'DELETE_BLOCK', block: deletedBlock, index: blockIndex };
    
    return {
      blocks: state.blocks.filter(b => b.id !== blockId),
      pastActions: [...(state.pastActions || []), action].slice(-50),
      futureActions: [],
      lastModified: Date.now()
    };
  }),
  removeLens: (blockId) => set((state) => {
    const block = state.blocks.find(b => b.id === blockId);
    if (!block) return state;
    
    const action: HistoryAction = { type: 'REMOVE_LENS', blockId, originalLensColor: block.lensColor };
    
    return {
      blocks: state.blocks.map(b => b.id === blockId ? { ...b, isLens: false, lensColor: undefined } : b),
      pastActions: [...(state.pastActions || []), action].slice(-50),
      futureActions: [],
      lastModified: Date.now()
    };
  }),
  mergeBlockUp: (blockId) => set((state) => {
    const block = state.blocks.find(b => b.id === blockId);
    if (!block || block.isLens) return state;

    const docBlocks = state.blocks.filter(b => b.documentId === block.documentId).sort((a, b) => a.order - b.order);
    const blockIndexInDoc = docBlocks.findIndex(b => b.id === blockId);
    
    if (blockIndexInDoc <= 0) return state;
    
    const prevBlock = docBlocks[blockIndexInDoc - 1];
    if (prevBlock.isLens) return state;
    
    const action: HistoryAction = { 
      type: 'MERGE_BLOCK', 
      blockId, 
      prevBlockId: prevBlock.id, 
      originalPrevContent: prevBlock.content, 
      deletedBlock: block, 
      index: state.blocks.findIndex(b => b.id === blockId)
    };
    
    const updatedPrevBlock = { ...prevBlock, content: prevBlock.content + (prevBlock.content && block.content ? '\n' : '') + block.content };
    const newBlocks = state.blocks.filter(b => b.id !== blockId).map(b => b.id === prevBlock.id ? updatedPrevBlock : b);
    
    return { 
      blocks: newBlocks.map((b, i) => ({ ...b, order: i })),
      pastActions: [...(state.pastActions || []), action].slice(-50),
      futureActions: [],
      lastModified: Date.now()
    };
  }),
  bulkUpdateBlocks: (updates) => set((state) => {
    const updateMap = new Map(updates.map(u => [u.id, u.content]));
    return {
      blocks: state.blocks.map(b => {
        if (updateMap.has(b.id)) {
          return { ...b, content: updateMap.get(b.id)! };
        }
        return b;
      }),
      lastModified: Date.now()
    };
  }),
});
