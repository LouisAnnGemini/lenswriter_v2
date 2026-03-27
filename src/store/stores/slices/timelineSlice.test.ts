import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createTimelineSlice } from './timelineSlice';

describe('timelineSlice', () => {
  let useTestStore: any;
  const mockWorkId = 'work-1';

  beforeEach(() => {
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      timelineEvents: [
        { id: 'event-1', workId: mockWorkId, title: 'Event 1', timestamp: 'Day 1', characterActions: {}, order: 0, status: 'timeline', linkedEventIds: ['event-2'] },
        { id: 'event-2', workId: mockWorkId, title: 'Event 2', timestamp: 'Day 2', characterActions: {}, order: 1, status: 'timeline', linkedEventIds: ['event-1'] },
        { id: 'event-3', workId: mockWorkId, title: 'Event 3', timestamp: 'Day 3', characterActions: {}, order: 0, status: 'pool' },
      ],
      scenes: [
        { id: 'scene-1', chapterId: 'chap-1', title: 'Scene 1', order: 0, characterIds: [], linkedEventIds: ['event-1'] },
      ],
      ...createTimelineSlice(set, get, api as any),
    } as StoreState));
  });

  it('should add a timeline event', () => {
    const { addTimelineEvent } = useTestStore.getState();
    addTimelineEvent({ workId: mockWorkId, title: 'New Event', timestamp: 'Day 4' });
    
    const state = useTestStore.getState();
    expect(state.timelineEvents.length).toBe(4);
    const newEvent = state.timelineEvents[state.timelineEvents.length - 1];
    expect(newEvent.title).toBe('New Event');
    expect(newEvent.status).toBe('pool');
    expect(newEvent.order).toBe(1); // Since there is already 1 event in the pool
  });

  it('should update a timeline event', () => {
    const { updateTimelineEvent } = useTestStore.getState();
    updateTimelineEvent({ id: 'event-1', title: 'Updated Event 1' });
    
    const state = useTestStore.getState();
    expect(state.timelineEvents.find((e: any) => e.id === 'event-1')?.title).toBe('Updated Event 1');
  });

  it('should update timeline event relations', () => {
    const { updateTimelineEventRelations } = useTestStore.getState();
    updateTimelineEventRelations('event-1', ['event-2'], [], []);
    
    const state = useTestStore.getState();
    const event1 = state.timelineEvents.find((e: any) => e.id === 'event-1');
    const event2 = state.timelineEvents.find((e: any) => e.id === 'event-2');
    
    expect(event1?.beforeIds).toContain('event-2');
    expect(event2?.afterIds).toContain('event-1');
  });

  it('should update timeline event character action', () => {
    const { updateTimelineEventCharacterAction } = useTestStore.getState();
    
    updateTimelineEventCharacterAction('event-1', 'char-1', 'Walks in');
    expect(useTestStore.getState().timelineEvents.find((e: any) => e.id === 'event-1')?.characterActions['char-1']).toBe('Walks in');
    
    updateTimelineEventCharacterAction('event-1', 'char-1', 'DELETE_ACTION');
    expect(useTestStore.getState().timelineEvents.find((e: any) => e.id === 'event-1')?.characterActions['char-1']).toBeUndefined();
  });

  it('should toggle timeline event link', () => {
    const { toggleTimelineEventLink } = useTestStore.getState();
    
    // Remove link
    toggleTimelineEventLink('event-1', 'event-2');
    let state = useTestStore.getState();
    expect(state.timelineEvents.find((e: any) => e.id === 'event-1')?.linkedEventIds).not.toContain('event-2');
    expect(state.timelineEvents.find((e: any) => e.id === 'event-2')?.linkedEventIds).not.toContain('event-1');
    
    // Add link
    toggleTimelineEventLink('event-1', 'event-2');
    state = useTestStore.getState();
    expect(state.timelineEvents.find((e: any) => e.id === 'event-1')?.linkedEventIds).toContain('event-2');
    expect(state.timelineEvents.find((e: any) => e.id === 'event-2')?.linkedEventIds).toContain('event-1');
  });

  it('should delete a timeline event and clean up references', () => {
    const { deleteTimelineEvent } = useTestStore.getState();
    deleteTimelineEvent('event-1');
    
    const state = useTestStore.getState();
    expect(state.timelineEvents.some((e: any) => e.id === 'event-1')).toBe(false);
    
    // Check if references in other events are cleaned up
    expect(state.timelineEvents.find((e: any) => e.id === 'event-2')?.linkedEventIds).not.toContain('event-1');
    
    // Check if references in scenes are cleaned up
    expect(state.scenes.find((s: any) => s.id === 'scene-1')?.linkedEventIds).not.toContain('event-1');
  });

  describe('reorderTimelineEvents', () => {
    it('should reorder events within the pool', () => {
      useTestStore.setState({
        timelineEvents: [
          { id: 'p1', workId: mockWorkId, status: 'pool', order: 0 },
          { id: 'p2', workId: mockWorkId, status: 'pool', order: 1 },
          { id: 'p3', workId: mockWorkId, status: 'pool', order: 2 },
        ]
      });

      useTestStore.getState().reorderTimelineEvents(mockWorkId, 'p1', 2, 'pool', 'pool');
      
      const state = useTestStore.getState();
      const p1 = state.timelineEvents.find((e: any) => e.id === 'p1');
      const p2 = state.timelineEvents.find((e: any) => e.id === 'p2');
      const p3 = state.timelineEvents.find((e: any) => e.id === 'p3');
      
      expect(p2.order).toBe(0);
      expect(p3.order).toBe(1);
      expect(p1.order).toBe(2);
    });

    it('should reorder events within the timeline', () => {
      useTestStore.setState({
        timelineEvents: [
          { id: 't1', workId: mockWorkId, status: 'timeline', order: 0 },
          { id: 't2', workId: mockWorkId, status: 'timeline', order: 1 },
          { id: 't3', workId: mockWorkId, status: 'timeline', order: 2 },
        ]
      });

      useTestStore.getState().reorderTimelineEvents(mockWorkId, 't1', 2, 'timeline', 'timeline');
      
      const state = useTestStore.getState();
      const t1 = state.timelineEvents.find((e: any) => e.id === 't1');
      const t2 = state.timelineEvents.find((e: any) => e.id === 't2');
      const t3 = state.timelineEvents.find((e: any) => e.id === 't3');
      
      expect(t2.order).toBe(0);
      expect(t3.order).toBe(1);
      expect(t1.order).toBe(2);
    });

    it('should move an event from pool to timeline', () => {
      useTestStore.setState({
        timelineEvents: [
          { id: 'p1', workId: mockWorkId, status: 'pool', order: 0 },
          { id: 't1', workId: mockWorkId, status: 'timeline', order: 0 },
        ]
      });

      useTestStore.getState().reorderTimelineEvents(mockWorkId, 'p1', 1, 'pool', 'timeline');
      
      const state = useTestStore.getState();
      const p1 = state.timelineEvents.find((e: any) => e.id === 'p1');
      
      expect(p1.status).toBe('timeline');
      expect(p1.order).toBe(1);
    });

    it('should move an event from timeline to pool', () => {
      useTestStore.setState({
        timelineEvents: [
          { id: 't1', workId: mockWorkId, status: 'timeline', order: 0 },
          { id: 'p1', workId: mockWorkId, status: 'pool', order: 0 },
        ]
      });

      useTestStore.getState().reorderTimelineEvents(mockWorkId, 't1', 1, 'timeline', 'pool');
      
      const state = useTestStore.getState();
      const t1 = state.timelineEvents.find((e: any) => e.id === 't1');
      
      expect(t1.status).toBe('pool');
      expect(t1.order).toBe(1);
    });
  });
});
