import { StateCreator } from 'zustand';
import { StoreState, TimelineEvent, TimelineSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createTimelineSlice: StateCreator<StoreState, [], [], TimelineSlice> = (set) => ({
  addTimelineEvent: (event) => set((state) => {
    const events = state.timelineEvents.filter(e => e.workId === event.workId && e.status === 'pool');
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
        order: events.length,
        status: 'pool',
        beforeIds: [],
        afterIds: [],
        simultaneousIds: []
    };
    return { timelineEvents: [...state.timelineEvents, newEvent] };
  }),
  updateTimelineEvent: (event) => set((state) => ({
    timelineEvents: state.timelineEvents.map(e => e.id === event.id ? { ...e, ...event } : e)
  })),
  updateTimelineEventRelations: (eventId, beforeIds, afterIds, simultaneousIds) => set((state) => ({
    timelineEvents: state.timelineEvents.map(e => {
        if (e.id === eventId) {
            return { ...e, beforeIds, afterIds, simultaneousIds };
        }
        
        let newBefore = e.beforeIds ? [...e.beforeIds] : [];
        let newAfter = e.afterIds ? [...e.afterIds] : [];
        let newSim = e.simultaneousIds ? [...e.simultaneousIds] : [];
        
        newBefore = newBefore.filter(id => id !== eventId);
        newAfter = newAfter.filter(id => id !== eventId);
        newSim = newSim.filter(id => id !== eventId);
        
        if (beforeIds.includes(e.id)) {
            if (!newAfter.includes(eventId)) newAfter.push(eventId);
        }
        if (afterIds.includes(e.id)) {
            if (!newBefore.includes(eventId)) newBefore.push(eventId);
        }
        if (simultaneousIds.includes(e.id)) {
            if (!newSim.includes(eventId)) newSim.push(eventId);
        }
        
        return { ...e, beforeIds: newBefore, afterIds: newAfter, simultaneousIds: newSim };
    })
  })),
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
  toggleTimelineEventLink: (eventId, targetEventId) => set((state) => {
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
  deleteTimelineEvent: (eventId) => set((state) => ({
    timelineEvents: state.timelineEvents
        .filter(e => e.id !== eventId)
        .map(e => ({
            ...e,
            linkedEventIds: e.linkedEventIds ? e.linkedEventIds.filter(id => id !== eventId) : e.linkedEventIds,
            beforeIds: e.beforeIds ? e.beforeIds.filter(id => id !== eventId) : e.beforeIds,
            afterIds: e.afterIds ? e.afterIds.filter(id => id !== eventId) : e.afterIds,
            simultaneousIds: e.simultaneousIds ? e.simultaneousIds.filter(id => id !== eventId) : e.simultaneousIds
        })),
    scenes: state.scenes.map(s => {
        if (s.linkedEventIds && s.linkedEventIds.includes(eventId)) {
            return { ...s, linkedEventIds: s.linkedEventIds.filter(id => id !== eventId) };
        }
        return s;
    })
  })),
  reorderTimelineEvents: (workId, sourceId, destinationIndex, sourceStatus, destinationStatus) => set((state) => {
    const workEvents = state.timelineEvents.filter(e => e.workId === workId);
    const sourceEvent = workEvents.find(e => e.id === sourceId);
    if (!sourceEvent) return state;

    if (sourceStatus === 'pool' && destinationStatus === 'pool') {
        const listEvents = workEvents
            .filter(e => e.status === 'pool')
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const startIndex = listEvents.findIndex(e => e.id === sourceId);
        if (startIndex === -1) return state;
        
        const [removed] = listEvents.splice(startIndex, 1);
        listEvents.splice(destinationIndex, 0, removed);
        
        const updatedEvents = listEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.workId === workId && e.status === 'pool') {
                    return updatedEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    const timelineEvents = workEvents
        .filter(e => (e.status || 'timeline') === 'timeline')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        
    const groupedEvents: { id: string, events: TimelineEvent[] }[] = [];
    const processedIds = new Set<string>();
    
    timelineEvents.forEach(event => {
        if (processedIds.has(event.id)) return;
        
        const groupEvents = [event];
        processedIds.add(event.id);
        
        let gAdded = true;
        while (gAdded) {
            gAdded = false;
            timelineEvents.forEach(e => {
                if (!processedIds.has(e.id)) {
                    if (groupEvents.some(ge => (ge.simultaneousIds || []).includes(e.id) || (e.simultaneousIds || []).includes(ge.id))) {
                        groupEvents.push(e);
                        processedIds.add(e.id);
                        gAdded = true;
                    }
                }
            });
        }
        groupedEvents.push({ id: groupEvents[0].id, events: groupEvents });
    });

    if (sourceStatus === 'timeline' && destinationStatus === 'timeline') {
        const startIndex = groupedEvents.findIndex(g => g.events.some(e => e.id === sourceId));
        if (startIndex === -1) return state;
        
        const [removedGroup] = groupedEvents.splice(startIndex, 1);
        groupedEvents.splice(destinationIndex, 0, removedGroup);
        
        const flatEvents = groupedEvents.flatMap(g => g.events);
        const updatedEvents = flatEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.workId === workId && (e.status || 'timeline') === 'timeline') {
                    return updatedEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    if (sourceStatus === 'pool' && destinationStatus === 'timeline') {
        const poolEvents = workEvents
            .filter(e => e.status === 'pool')
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
        const pIndex = poolEvents.findIndex(e => e.id === sourceId);
        if (pIndex === -1) return state;
        
        const removed = { ...poolEvents[pIndex], status: 'timeline' as const };
        poolEvents.splice(pIndex, 1);
        
        // Check if it should be grouped with any existing group
        const targetGroupIndex = groupedEvents.findIndex(g => g.events.some(e => (e.simultaneousIds || []).includes(removed.id) || (removed.simultaneousIds || []).includes(e.id)));
        
        if (targetGroupIndex !== -1) {
            // If it joins a group, we just add it and re-group everything to ensure transitive merges
            timelineEvents.push(removed);
        } else {
            // If it doesn't join a group, we insert it at the specific flat index corresponding to destinationIndex
            // Actually, destinationIndex is the group index. We can just insert it into groupedEvents and then flatten.
            groupedEvents.splice(destinationIndex, 0, { id: removed.id, events: [removed] });
            timelineEvents.length = 0;
            timelineEvents.push(...groupedEvents.flatMap(g => g.events));
        }
        
        // Re-group to handle any transitive merges
        const newGroupedEvents: { id: string, events: TimelineEvent[] }[] = [];
        const newProcessedIds = new Set<string>();
        
        timelineEvents.forEach(event => {
            if (newProcessedIds.has(event.id)) return;
            
            const groupEvents = [event];
            newProcessedIds.add(event.id);
            
            let gAdded = true;
            while (gAdded) {
                gAdded = false;
                timelineEvents.forEach(e => {
                    if (!newProcessedIds.has(e.id)) {
                        if (groupEvents.some(ge => (ge.simultaneousIds || []).includes(e.id) || (e.simultaneousIds || []).includes(ge.id))) {
                            groupEvents.push(e);
                            newProcessedIds.add(e.id);
                            gAdded = true;
                        }
                    }
                });
            }
            newGroupedEvents.push({ id: groupEvents[0].id, events: groupEvents });
        });
        
        const flatEvents = newGroupedEvents.flatMap(g => g.events);
        const updatedEvents = flatEvents.map((e, i) => ({ ...e, order: i }));
        const updatedPoolEvents = poolEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                if (e.id === sourceId) return { ...removed, order: updatedEvents.find(ue => ue.id === e.id)?.order || 0 };
                if (e.workId === workId && (e.status || 'timeline') === 'timeline') {
                    return updatedEvents.find(ue => ue.id === e.id) || e;
                }
                if (e.workId === workId && e.status === 'pool') {
                    return updatedPoolEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    if (sourceStatus === 'timeline' && destinationStatus === 'pool') {
        const groupIndex = groupedEvents.findIndex(g => g.events.some(e => e.id === sourceId));
        if (groupIndex === -1) return state;
        
        const removedGroup = groupedEvents[groupIndex];
        groupedEvents.splice(groupIndex, 1);
        
        const flatEvents = groupedEvents.flatMap(g => g.events);
        const updatedTimelineEvents = flatEvents.map((e, i) => ({ ...e, order: i }));
        
        const poolEvents = workEvents
            .filter(e => e.status === 'pool')
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
        const removedEvents = removedGroup.events.map(e => ({ ...e, status: 'pool' as const }));
        poolEvents.splice(destinationIndex, 0, ...removedEvents);
        const updatedPoolEvents = poolEvents.map((e, i) => ({ ...e, order: i }));
        
        return {
            timelineEvents: state.timelineEvents.map(e => {
                const removedEvent = removedEvents.find(re => re.id === e.id);
                if (removedEvent) {
                    return { ...removedEvent, order: updatedPoolEvents.find(ue => ue.id === e.id)?.order || 0 };
                }
                if (e.workId === workId && (e.status || 'timeline') === 'timeline') {
                    return updatedTimelineEvents.find(ue => ue.id === e.id) || e;
                }
                if (e.workId === workId && e.status === 'pool') {
                    return updatedPoolEvents.find(ue => ue.id === e.id) || e;
                }
                return e;
            })
        };
    }

    return state;
  }),
});
