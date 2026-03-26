import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createChapterSlice } from './chapterSlice';

describe('chapterSlice', () => {
  let useTestStore: any;
  const mockWorkId = 'work-1';

  beforeEach(() => {
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      chapters: [
        { id: 'chap-1', workId: mockWorkId, title: 'Chapter 1', order: 0, completed: false, archived: false },
        { id: 'chap-2', workId: mockWorkId, title: 'Chapter 2', order: 1, completed: false, archived: false },
      ],
      scenes: [
        { id: 'scene-1', chapterId: 'chap-1', title: 'Scene 1', order: 0, characterIds: [] },
      ],
      blocks: [
        { id: 'block-1', documentId: 'scene-1', type: 'text', content: 'Block 1', order: 0 },
        { id: 'block-2', documentId: 'chap-1', type: 'text', content: 'Block 2', order: 0 },
      ],
      ...createChapterSlice(set, get, api as any),
    } as StoreState));
  });

  it('should add a new chapter', () => {
    const { addChapter } = useTestStore.getState();
    addChapter(mockWorkId, 'New Chapter');
    
    const state = useTestStore.getState();
    expect(state.chapters.length).toBe(3);
    const newChap = state.chapters[state.chapters.length - 1];
    expect(newChap.title).toBe('New Chapter');
    expect(newChap.workId).toBe(mockWorkId);
    expect(newChap.order).toBe(2);
  });

  it('should update a chapter', () => {
    const { updateChapter } = useTestStore.getState();
    updateChapter({ id: 'chap-1', title: 'Updated Chapter' });
    
    const state = useTestStore.getState();
    const updatedChap = state.chapters.find((c: any) => c.id === 'chap-1');
    expect(updatedChap?.title).toBe('Updated Chapter');
  });

  it('should delete a chapter and its associated scenes and blocks', () => {
    const { deleteChapter } = useTestStore.getState();
    deleteChapter('chap-1');
    
    const state = useTestStore.getState();
    
    // Chapter deleted
    expect(state.chapters.length).toBe(1);
    expect(state.chapters.some((c: any) => c.id === 'chap-1')).toBe(false);
    
    // Associated scenes deleted
    expect(state.scenes.some((s: any) => s.chapterId === 'chap-1')).toBe(false);
    
    // Associated blocks deleted (both from scenes and chapter directly)
    expect(state.blocks.some((b: any) => b.documentId === 'scene-1')).toBe(false);
    expect(state.blocks.some((b: any) => b.documentId === 'chap-1')).toBe(false);
  });

  it('should toggle chapter archive status', () => {
    const { toggleChapterArchive } = useTestStore.getState();
    
    toggleChapterArchive('chap-1');
    expect(useTestStore.getState().chapters.find((c: any) => c.id === 'chap-1')?.archived).toBe(true);
    
    toggleChapterArchive('chap-1');
    expect(useTestStore.getState().chapters.find((c: any) => c.id === 'chap-1')?.archived).toBe(false);
  });

  it('should reorder chapters', () => {
    const { reorderChapters } = useTestStore.getState();
    reorderChapters(mockWorkId, 0, 1);
    
    const state = useTestStore.getState();
    const chap1 = state.chapters.find((c: any) => c.id === 'chap-1');
    const chap2 = state.chapters.find((c: any) => c.id === 'chap-2');
    
    expect(chap1?.order).toBe(1);
    expect(chap2?.order).toBe(0);
  });
});
