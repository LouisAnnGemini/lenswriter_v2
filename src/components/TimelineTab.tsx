import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { DropResult } from '@hello-pangea/dnd';
import { Plus, Clock, List, LayoutGrid, Tag as TagIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { validateDrag } from '../lib/timelineUtils';

import { EventDetailsModal } from './EventDetailsModal';
import { MontageBoard } from './MontageBoard';
import { TagManagerModal } from './TagManagerModal';
import { TagManagerTab } from './TagManagerTab';
import { AddEventModal } from './AddEventModal';
import { TimelineFilterBar } from './timeline/TimelineFilterBar';
import { TimelineTableView } from './timeline/TimelineTableView';
import { TimelineChronologyView } from './timeline/TimelineChronologyView';
import { EVENT_COLORS } from './timeline/TimelineShared';

export function TimelineTab({ isSubTab, overrideViewMode }: { isSubTab?: boolean, overrideViewMode?: 'chronology' | 'montage' }) {
  const { 
    timelineEvents, 
    locations, 
    characters, 
    tags, 
    activeWorkId, 
    selectedEventId,
    setActiveTab,
    setSelectedEventId,
    updateTimelineEvent,
    updateTimelineEventCharacterAction,
    addTimelineEvent,
    addTag,
    reorderTimelineEvents,
    toggleTimelineEventLink,
    deleteTimelineEvent,
    updateTimelineEventRelations
  } = useStore(useShallow(state => ({
    timelineEvents: state.timelineEvents,
    locations: state.locations,
    characters: state.characters,
    tags: state.tags,
    activeWorkId: state.activeWorkId,
    selectedEventId: state.selectedEventId,
    setActiveTab: state.setActiveTab,
    setSelectedEventId: state.setSelectedEventId,
    updateTimelineEvent: state.updateTimelineEvent,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction,
    addTimelineEvent: state.addTimelineEvent,
    addTag: state.addTag,
    reorderTimelineEvents: state.reorderTimelineEvents,
    toggleTimelineEventLink: state.toggleTimelineEventLink,
    deleteTimelineEvent: state.deleteTimelineEvent,
    updateTimelineEventRelations: state.updateTimelineEventRelations
  })));
  
  const [viewMode, setViewMode] = useState<'allEvents' | 'chronology' | 'montage' | 'tags'>(overrideViewMode || 'allEvents');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const scrollToEvent = useCallback((eventId: string) => {
    const element = document.getElementById(`event-${eventId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedEventId(eventId);
      setTimeout(() => setHighlightedEventId(null), 2000);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      // If event is in pool, we might need to change view mode or show pool
      // For now, just ensure we are on the timeline tab
      setActiveTab('board');
      
      // If it's a montage event, switch to montage
      const event = timelineEvents.find(e => e.id === selectedEventId);
      if (event?.status === 'pool') {
        // Maybe open pool panel if closed?
      }

      // Scroll to the event so it's visible when modal closes
      setTimeout(() => {
        scrollToEvent(selectedEventId);
      }, 100);
    }
  }, [selectedEventId, setActiveTab, timelineEvents, scrollToEvent]);

  const events = useMemo(() => timelineEvents.filter(e => e.workId === activeWorkId).sort((a, b) => (a.order || 0) - (b.order || 0)), [timelineEvents, activeWorkId]);
  const allEvents = events;
  const poolEvents = useMemo(() => events.filter(e => e.status === 'pool'), [events]);

  const filterEvent = useCallback((e: typeof events[0]) => {
    if (searchQuery) {
      const query = (searchQuery || '').toLowerCase();
      if (!(e.title || '').toLowerCase().includes(query) && !(e.description || '').toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedCharacters.length > 0) {
      const eventChars = Object.keys(e.characterActions || {});
      if (!selectedCharacters.some(c => eventChars.includes(c))) return false;
    }
    if (selectedLocations.length > 0) {
      if (!e.locationId || !selectedLocations.includes(e.locationId)) return false;
    }
    if (selectedColors.length > 0) {
      const color = e.color || 'stone';
      if (!selectedColors.includes(color)) return false;
    }
    if (selectedTags.length > 0) {
      if (!e.tagIds || !selectedTags.some(t => e.tagIds!.includes(t))) return false;
    }
    return true;
  }, [searchQuery, selectedCharacters, selectedLocations, selectedColors, selectedTags]);

  const isFilterActive = searchQuery.length > 0 || selectedCharacters.length > 0 || selectedLocations.length > 0 || selectedColors.length > 0 || selectedTags.length > 0;

  const filteredTimelineEvents = useMemo(() => events.filter(e => (e.status || 'timeline') === 'timeline').filter(filterEvent), [events, filterEvent]);
  const filteredPoolEvents = useMemo(() => poolEvents.filter(filterEvent), [poolEvents, filterEvent]);

  const handleNavigateToEvent = useCallback((eventId: string) => {
    scrollToEvent(eventId);
  }, [scrollToEvent]);

  useEffect(() => {
    if (overrideViewMode) {
      setViewMode(overrideViewMode);
    }
  }, [overrideViewMode]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || isFilterActive) return;
    
    const sourceId = result.draggableId;
    const sourceDroppable = result.source.droppableId;
    const destDroppable = result.destination.droppableId;
    
    const sourceStatus = sourceDroppable === 'timeline-list' ? 'timeline' : 'pool';
    const destStatus = destDroppable === 'timeline-list' ? 'timeline' : 'pool';
    
    if (destStatus === 'timeline') {
      // Build full grouped events for validation
      const currentTimelineEvents = timelineEvents
        .filter(e => e.workId === activeWorkId && (e.status || 'timeline') === 'timeline')
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        
      const fullGroupedEvents: { id: string; events: typeof timelineEvents }[] = [];
      const processedIds = new Set<string>();
      
      currentTimelineEvents.forEach(event => {
        if (processedIds.has(event.id)) return;
        
        const groupEvents = [event];
        processedIds.add(event.id);
        
        let added = true;
        while (added) {
          added = false;
          currentTimelineEvents.forEach(e => {
            if (!processedIds.has(e.id)) {
              if (groupEvents.some(ge => (ge.simultaneousIds || []).includes(e.id) || (e.simultaneousIds || []).includes(ge.id))) {
                groupEvents.push(e);
                processedIds.add(e.id);
                added = true;
              }
            }
          });
        }
        fullGroupedEvents.push({ id: groupEvents[0].id, events: groupEvents });
      });

      let destIndex = result.destination.index;
      let groupsToValidate = fullGroupedEvents;
      if (sourceStatus === 'pool') {
        const sourceEvent = poolEvents.find(e => e.id === sourceId);
        if (sourceEvent) {
          const targetGroupIndex = fullGroupedEvents.findIndex(g => g.events.some(e => (e.simultaneousIds || []).includes(sourceEvent.id) || (sourceEvent.simultaneousIds || []).includes(e.id)));
          if (targetGroupIndex !== -1) {
            groupsToValidate = [...fullGroupedEvents];
            groupsToValidate[targetGroupIndex] = {
              ...groupsToValidate[targetGroupIndex],
              events: [...groupsToValidate[targetGroupIndex].events, sourceEvent]
            };
            destIndex = targetGroupIndex;
          } else {
            groupsToValidate = [...fullGroupedEvents, { id: sourceEvent.id, events: [sourceEvent] }];
          }
        }
      }

      // Validate constraints
      const isValid = validateDrag(groupsToValidate, sourceId, destIndex);
      if (!isValid) {
        alert("Action denied: This placement violates your Before/After constraints.");
        return;
      }
    }

    reorderTimelineEvents(
      activeWorkId!,
      sourceId,
      result.destination.index,
      sourceStatus,
      destStatus
    );
  }, [isFilterActive, timelineEvents, activeWorkId, poolEvents, reorderTimelineEvents]);

  // Group events by simultaneousIds for timeline view
  const groupedEvents = useMemo(() => {
    const groups: { sequence: number; events: typeof events }[] = [];
    const processedIds = new Set<string>();
    let seqCounter = 0;
    
    filteredTimelineEvents.forEach(event => {
      if (processedIds.has(event.id)) return;
      
      const groupEvents = [event];
      processedIds.add(event.id);
      
      let added = true;
      while (added) {
        added = false;
        filteredTimelineEvents.forEach(e => {
          if (!processedIds.has(e.id)) {
            if (groupEvents.some(ge => (ge.simultaneousIds || []).includes(e.id) || (e.simultaneousIds || []).includes(ge.id))) {
              groupEvents.push(e);
              processedIds.add(e.id);
              added = true;
            }
          }
        });
      }
      
      groups.push({ sequence: seqCounter++, events: groupEvents });
    });
    return groups;
  }, [filteredTimelineEvents]);

  const groupedAllEvents = useMemo(() => {
    const allEventsList = [...filteredTimelineEvents, ...filteredPoolEvents];
    const groups: { sequence: number; events: typeof events }[] = [];
    const processedAllIds = new Set<string>();
    let seqAllCounter = 0;
    
    allEventsList.forEach(event => {
      if (processedAllIds.has(event.id)) return;
      
      const groupEvents = [event];
      processedAllIds.add(event.id);
      
      let added = true;
      while (added) {
        added = false;
        allEventsList.forEach(e => {
          if (!processedAllIds.has(e.id)) {
            if (groupEvents.some(ge => (ge.simultaneousIds || []).includes(e.id) || (e.simultaneousIds || []).includes(ge.id))) {
              groupEvents.push(e);
              processedAllIds.add(e.id);
              added = true;
            }
          }
        });
      }
      
      groups.push({ sequence: seqAllCounter++, events: groupEvents });
    });
    return groups;
  }, [filteredTimelineEvents, filteredPoolEvents]);

  if (!activeWorkId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className={cn("p-4 border-b border-stone-200 bg-white shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4", isSubTab ? "border-t-0" : "")}>
        <div className="flex flex-wrap items-center gap-4 min-w-0 w-full md:w-auto">
          {!isSubTab && <h2 className="text-xl font-bold text-stone-800 truncate">Timeline</h2>}
          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 shrink-0">
            <button
              onClick={() => setViewMode('allEvents')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors",
                viewMode === 'allEvents' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <List size={16} className="mr-2" />
              All Events
            </button>
            <button
              onClick={() => setViewMode('chronology')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors",
                viewMode === 'chronology' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <Clock size={16} className="mr-2" />
              Chronology
            </button>
            <button
              onClick={() => setViewMode('montage')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors",
                viewMode === 'montage' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <LayoutGrid size={16} className="mr-2" />
              Montage Board
            </button>
            <button
              onClick={() => setViewMode('tags')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors",
                viewMode === 'tags' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <TagIcon size={16} className="mr-2" />
              Manage Tags
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
          }}
          className="bg-stone-800 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center hover:bg-stone-700 transition-colors shadow-sm w-full md:w-auto justify-center"
        >
          <Plus size={16} className="mr-1.5" />
          New Event
        </button>
      </div>
      
      {/* Search and Filter UI - Visible for allEvents and chronology */}
      {(viewMode === 'allEvents' || viewMode === 'chronology') && (
        <TimelineFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCharacters={selectedCharacters}
          setSelectedCharacters={setSelectedCharacters}
          selectedLocations={selectedLocations}
          setSelectedLocations={setSelectedLocations}
          selectedColors={selectedColors}
          setSelectedColors={setSelectedColors}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          characters={characters}
          locations={locations}
          tags={tags}
          activeWorkId={activeWorkId}
          EVENT_COLORS={EVENT_COLORS}
          isFilterActive={isFilterActive}
        />
      )}

      {viewMode === 'allEvents' ? (
        <TimelineTableView
          groupedAllEvents={groupedAllEvents}
          allEvents={allEvents}
          characters={characters}
          tags={tags}
          activeWorkId={activeWorkId}
          highlightedEventId={highlightedEventId}
          selectedEventId={selectedEventId}
          setSelectedEventId={setSelectedEventId}
          updateTimelineEvent={updateTimelineEvent}
          updateTimelineEventRelations={updateTimelineEventRelations}
          deleteTimelineEvent={deleteTimelineEvent}
          addTag={addTag}
        />
      ) : viewMode === 'chronology' ? (
        <TimelineChronologyView
          groupedEvents={groupedEvents}
          filteredPoolEvents={filteredPoolEvents}
          events={events}
          characters={characters}
          tags={tags}
          activeWorkId={activeWorkId}
          highlightedEventId={highlightedEventId}
          isFilterActive={isFilterActive}
          onDragEnd={onDragEnd}
          setSelectedEventId={setSelectedEventId}
          updateTimelineEvent={updateTimelineEvent}
          updateTimelineEventCharacterAction={updateTimelineEventCharacterAction}
          deleteTimelineEvent={deleteTimelineEvent}
          handleNavigateToEvent={handleNavigateToEvent}
        />
      ) : viewMode === 'montage' ? (
        <MontageBoard onEventDoubleClick={setSelectedEventId} />
      ) : (
        <TagManagerTab />
      )}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {isTagManagerOpen && (
        <TagManagerModal onClose={() => setIsTagManagerOpen(false)} />
      )}

      {isAddModalOpen && (
        <AddEventModal 
          onClose={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
}
