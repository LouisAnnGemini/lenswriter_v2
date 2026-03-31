import { StateCreator } from 'zustand';
import { StoreState, TimelineEvent, TimelineSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { validateEventUpdate } from '../../../lib/timelineUtils';
import { toast } from 'sonner';

export const createTimelineSlice: StateCreator<StoreState, [], [], TimelineSlice> = (set, get) => ({
  addTimelineEvent: (event) => set((state) => {
    const events = state.timelineEvents.filter(e => e.workId === event.workId && e.startTime === undefined);
    const newEvent: TimelineEvent = {
        id: event.id || uuidv4(),
        workId: event.workId,
        title: event.title,
        timestamp: event.timestamp,
        locationId: event.locationId,
        description: event.description,
        characterActions: event.characterActions || {},
        tagIds: event.tagIds || [],
        linkedEventIds: event.linkedEventIds || [],
        duration: event.duration || 1,
        importance: event.importance || 3,
        horizontalIds: event.horizontalIds || [],
        verticalIds: event.verticalIds || [],
        order: events.length
    };
    return { timelineEvents: [...state.timelineEvents, newEvent] };
  }),
  updateTimelineEvent: (event) => {
    const state = get();
    const validation = validateEventUpdate(event, state.timelineEvents);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid event update');
      return { success: false, error: validation.error };
    }

    set((state) => ({
      timelineEvents: state.timelineEvents.map(e => {
        if (e.id === event.id) {
          return { ...e, ...event };
        }
        return e;
      })
    }));
    return { success: true };
  },
  updateTimelineEventCharacterAction: (eventId, characterId, action) => set((state) => ({
    timelineEvents: state.timelineEvents.map(e => {
        if (e.id === eventId) {
            const newActions = { ...e.characterActions };
            if (action === 'DELETE_ACTION') {
                delete newActions[characterId];
            } else {
                newActions[characterId] = action;
            }
            return { ...e, characterActions: newActions };
        }
        return e;
    })
  })),
  toggleTimelineEventLink: (eventId: string, targetEventId: string) => set((state) => {
    const eventA = state.timelineEvents.find(e => e.id === eventId);
    if (!eventA) return state;
    
    const hasLink = (eventA.linkedEventIds || []).includes(targetEventId);
    
    return {
        timelineEvents: state.timelineEvents.map(e => {
            if (e.id === eventId) {
                const linkedIds = e.linkedEventIds || [];
                return {
                    ...e,
                    linkedEventIds: hasLink 
                        ? linkedIds.filter(id => id !== targetEventId)
                        : [...linkedIds, targetEventId]
                };
            }
            if (e.id === targetEventId) {
                const linkedIds = e.linkedEventIds || [];
                return {
                    ...e,
                    linkedEventIds: hasLink 
                        ? linkedIds.filter(id => id !== eventId)
                        : [...linkedIds, eventId]
                };
            }
            return e;
        })
    };
  }),
  toggleTimelineEventHorizontal: (eventId: string, targetEventId: string) => set((state) => {
    const eventA = state.timelineEvents.find(e => e.id === eventId);
    if (!eventA) return state;
    
    const hasLink = (eventA.horizontalIds || []).includes(targetEventId);
    
    return {
        timelineEvents: state.timelineEvents.map(e => {
            if (e.id === eventId) {
                const horizontalIds = e.horizontalIds || [];
                return {
                    ...e,
                    horizontalIds: hasLink 
                        ? horizontalIds.filter(id => id !== targetEventId)
                        : [...horizontalIds, targetEventId]
                };
            }
            if (e.id === targetEventId) {
                const horizontalIds = e.horizontalIds || [];
                return {
                    ...e,
                    horizontalIds: hasLink 
                        ? horizontalIds.filter(id => id !== eventId)
                        : [...horizontalIds, eventId]
                };
            }
            return e;
        })
    };
  }),
  toggleTimelineEventVertical: (eventId: string, targetEventId: string) => set((state) => {
    const eventA = state.timelineEvents.find(e => e.id === eventId);
    if (!eventA) return state;
    
    const hasLink = (eventA.verticalIds || []).includes(targetEventId);
    
    return {
        timelineEvents: state.timelineEvents.map(e => {
            if (e.id === eventId) {
                const verticalIds = e.verticalIds || [];
                return {
                    ...e,
                    verticalIds: hasLink 
                        ? verticalIds.filter(id => id !== targetEventId)
                        : [...verticalIds, targetEventId]
                };
            }
            if (e.id === targetEventId) {
                const verticalIds = e.verticalIds || [];
                return {
                    ...e,
                    verticalIds: hasLink 
                        ? verticalIds.filter(id => id !== eventId)
                        : [...verticalIds, eventId]
                };
            }
            return e;
        })
    };
  }),
  deleteTimelineEvent: (eventId: string) => set((state) => ({
    timelineEvents: state.timelineEvents
        .filter(e => e.id !== eventId)
        .map(e => ({
            ...e,
            linkedEventIds: e.linkedEventIds ? e.linkedEventIds.filter(id => id !== eventId) : e.linkedEventIds,
            horizontalIds: e.horizontalIds ? e.horizontalIds.filter(id => id !== eventId) : e.horizontalIds,
            verticalIds: e.verticalIds ? e.verticalIds.filter(id => id !== eventId) : e.verticalIds
        })),
    scenes: state.scenes.map(s => {
        if (s.linkedEventIds && s.linkedEventIds.includes(eventId)) {
            return { ...s, linkedEventIds: s.linkedEventIds.filter(id => id !== eventId) };
        }
        return s;
    })
  })),
  reorderTimelineEvents: (workId, sourceId, destinationIndex, isSourcePool, isDestPool) => set((state) => {
    const workEvents = state.timelineEvents.filter(e => e.workId === workId);
    const sourceEvent = workEvents.find(e => e.id === sourceId);
    if (!sourceEvent) return state;

    if (isSourcePool && isDestPool) {
        const listEvents = workEvents
            .filter(e => e.startTime === undefined)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const startIndex = listEvents.findIndex(e => e.id === sourceId);
        if (startIndex === -1) return state;
        
        const [removed] = listEvents.splice(startIndex, 1);
        listEvents.splice(destinationIndex, 0, removed);
        
        const updatedEvents = listEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.workId === workId && e.startTime === undefined) {
                    return updatedEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    const timelineEvents = workEvents
        .filter(e => e.startTime !== undefined)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!isSourcePool && !isDestPool) {
        const startIndex = timelineEvents.findIndex(e => e.id === sourceId);
        if (startIndex === -1) return state;
        
        const [removed] = timelineEvents.splice(startIndex, 1);
        timelineEvents.splice(destinationIndex, 0, removed);
        
        const updatedEvents = timelineEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.workId === workId && e.startTime !== undefined) {
                    return updatedEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    if (isSourcePool && !isDestPool) {
        const poolEvents = workEvents
            .filter(e => e.startTime === undefined)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
        const pIndex = poolEvents.findIndex(e => e.id === sourceId);
        if (pIndex === -1) return state;
        
        // When moving to timeline, we need a default startTime if not provided
        // But reorderTimelineEvents usually doesn't have it.
        // We'll assume the caller will handle startTime update separately if needed,
        // or we set a default here.
        const removed = { ...poolEvents[pIndex], startTime: poolEvents[pIndex].startTime || 0 };
        poolEvents.splice(pIndex, 1);
        
        timelineEvents.splice(destinationIndex, 0, removed);
        
        const updatedEvents = timelineEvents.map((e, i) => ({ ...e, order: i }));
        const updatedPoolEvents = poolEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.id === sourceId) return { ...removed, order: updatedEvents.find(ue => ue.id === e.id)?.order || 0 };
                if (e.workId === workId && e.startTime !== undefined) {
                    return updatedEvents.find(ue => ue.id === e.id) || e;
                }
                if (e.workId === workId && e.startTime === undefined) {
                    return updatedPoolEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    if (!isSourcePool && isDestPool) {
        const startIndex = timelineEvents.findIndex(e => e.id === sourceId);
        if (startIndex === -1) return state;
        
        const [removed] = timelineEvents.splice(startIndex, 1);
        const removedEvent = { ...removed, startTime: undefined };
        
        const updatedTimelineEvents = timelineEvents.map((e, i) => ({ ...e, order: i }));
        
        const poolEvents = workEvents
            .filter(e => e.startTime === undefined)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
        poolEvents.splice(destinationIndex, 0, removedEvent);
        const updatedPoolEvents = poolEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.id === sourceId) {
                    return { ...removedEvent, order: updatedPoolEvents.find(ue => ue.id === e.id)?.order || 0 };
                }
                if (e.workId === workId && e.startTime !== undefined) {
                    return updatedTimelineEvents.find(ue => ue.id === e.id) || e;
                }
                if (e.workId === workId && e.startTime === undefined) {
                    return updatedPoolEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    return state;
  }),
});
