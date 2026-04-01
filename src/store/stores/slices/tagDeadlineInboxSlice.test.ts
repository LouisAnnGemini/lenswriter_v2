import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createTagSlice, createDeadlineSlice } from './tagDeadlineInboxSlice';

describe('tagDeadlineInboxSlice', () => {
  let useTestStore: any;
  const mockWorkId = 'work-1';

  beforeEach(() => {
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      tags: [
        { id: 'tag-1', workId: mockWorkId, name: 'Tag 1' },
      ],
      deadlines: [
        { id: 'deadline-1', workId: mockWorkId, title: 'Deadline 1', date: '2026-01-01', completed: false },
      ],
      ...createTagSlice(set, get, api as any),
      ...createDeadlineSlice(set, get, api as any),
    } as StoreState));
  });

  describe('TagSlice', () => {
    it('should add a tag', () => {
      const { addTag } = useTestStore.getState();
      addTag({ workId: mockWorkId, name: 'New Tag' });
      
      const state = useTestStore.getState();
      expect(state.tags.length).toBe(2);
      expect(state.tags[1].name).toBe('New Tag');
    });

    it('should update a tag', () => {
      const { updateTag } = useTestStore.getState();
      updateTag({ id: 'tag-1', name: 'Updated Tag' });
      
      const state = useTestStore.getState();
      expect(state.tags.find((t: any) => t.id === 'tag-1')?.name).toBe('Updated Tag');
    });

    it('should delete a tag', () => {
      const { deleteTag } = useTestStore.getState();
      deleteTag('tag-1');
      
      const state = useTestStore.getState();
      expect(state.tags.length).toBe(0);
    });
  });

  describe('DeadlineSlice', () => {
    it('should add a deadline', () => {
      const { addDeadline } = useTestStore.getState();
      addDeadline({ workId: mockWorkId, title: 'New Deadline', date: '2026-02-01' });
      
      const state = useTestStore.getState();
      expect(state.deadlines.length).toBe(2);
      expect(state.deadlines[1].title).toBe('New Deadline');
      expect(state.deadlines[1].completed).toBe(false);
    });

    it('should update a deadline', () => {
      const { updateDeadline } = useTestStore.getState();
      updateDeadline({ id: 'deadline-1', title: 'Updated Deadline', completed: true });
      
      const state = useTestStore.getState();
      const updatedDeadline = state.deadlines.find((d: any) => d.id === 'deadline-1');
      expect(updatedDeadline?.title).toBe('Updated Deadline');
      expect(updatedDeadline?.completed).toBe(true);
    });

    it('should delete a deadline', () => {
      const { deleteDeadline } = useTestStore.getState();
      deleteDeadline('deadline-1');
      
      const state = useTestStore.getState();
      expect(state.deadlines.length).toBe(0);
    });
  });
});
