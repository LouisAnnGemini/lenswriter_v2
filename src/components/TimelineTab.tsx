import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { DropResult } from '@hello-pangea/dnd';
import { Plus, Clock, List, LayoutGrid, Tag as TagIcon, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

import { EventDetailsModal } from './EventDetailsModal';
import { TagManagerModal } from './TagManagerModal';
import { TagManagerTab } from './TagManagerTab';
import { AddEventModal } from './AddEventModal';
import { TimelineTableView } from './timeline/TimelineTableView';
import { TimelineVisualChronology } from './timeline/TimelineVisualChronology';
import { EVENT_COLORS } from './timeline/TimelineShared';

import { MetroTab } from './MetroTab';
import { MontageTab } from './MontageTab';

export function TimelineTab({ isSubTab, overrideViewMode }: { isSubTab?: boolean, overrideViewMode?: 'chronology' }) {
  const { 
    timelineEvents, 
    locations, 
    characters, 
    tags, 
    activeWorkId, 
    selectedEventId,
    timelineViewMode,
    fullscreenMode,
    setActiveTab,
    setSelectedEventId,
    setTimelineViewMode,
    updateTimelineEvent,
    updateTimelineEvents,
    updateTimelineEventCharacterAction,
    addTimelineEvent,
    addTag,
    reorderTimelineEvents,
    toggleTimelineEventLink,
    deleteTimelineEvent,
    timelineTableColumns,
    setTimelineTableColumns
  } = useStore(useShallow(state => ({
    timelineEvents: state.timelineEvents,
    locations: state.locations,
    characters: state.characters,
    tags: state.tags,
    activeWorkId: state.activeWorkId,
    selectedEventId: state.selectedEventId,
    timelineViewMode: state.timelineViewMode,
    fullscreenMode: state.fullscreenMode,
    setActiveTab: state.setActiveTab,
    setSelectedEventId: state.setSelectedEventId,
    setTimelineViewMode: state.setTimelineViewMode,
    updateTimelineEvent: state.updateTimelineEvent,
    updateTimelineEvents: state.updateTimelineEvents,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction,
    addTimelineEvent: state.addTimelineEvent,
    addTag: state.addTag,
    reorderTimelineEvents: state.reorderTimelineEvents,
    toggleTimelineEventLink: state.toggleTimelineEventLink,
    deleteTimelineEvent: state.deleteTimelineEvent,
    timelineTableColumns: state.timelineTableColumns,
    setTimelineTableColumns: state.setTimelineTableColumns
  })));
  
  useEffect(() => {
    if (overrideViewMode) {
      setTimelineViewMode(overrideViewMode);
    }
  }, [overrideViewMode, setTimelineViewMode]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    window.addEventListener('open-add-event-modal', handleOpenAddModal);
    return () => window.removeEventListener('open-add-event-modal', handleOpenAddModal);
  }, []);

  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'general' | 'characters' | 'relations' | undefined>(undefined);
  const [initialCharacterId, setInitialCharacterId] = useState<string | undefined>(undefined);

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
      setActiveTab('timelineEvents');
      scrollToEvent(selectedEventId);
    }
  }, [selectedEventId, setActiveTab, scrollToEvent]);

  const events = useMemo(() => timelineEvents.filter(e => e.workId === activeWorkId).sort((a, b) => (a.order || 0) - (b.order || 0)), [timelineEvents, activeWorkId]);
  const allEvents = events;

  const handleNavigateToEvent = useCallback((eventId: string) => {
    scrollToEvent(eventId);
  }, [scrollToEvent]);

  const handleEventClick = useCallback((id: string, tab?: 'general' | 'characters' | 'relations', charId?: string) => {
    setInitialTab(tab);
    setInitialCharacterId(charId);
    setSelectedEventId(id);
  }, [setSelectedEventId]);

  if (!activeWorkId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/50 overflow-hidden">
      {/* Search and Filter UI - Visible for table */}
      {timelineViewMode === 'table' ? (
        <TimelineTableView
          allEvents={allEvents}
          characters={characters}
          locations={locations}
          tags={tags}
          activeWorkId={activeWorkId}
          highlightedEventId={highlightedEventId}
          setSelectedEventId={handleEventClick}
          updateTimelineEvent={updateTimelineEvent}
          updateTimelineEvents={updateTimelineEvents}
          deleteTimelineEvent={deleteTimelineEvent}
          addTag={addTag}
          columns={timelineTableColumns}
          setColumns={setTimelineTableColumns}
        />
      ) : timelineViewMode === 'chronology' ? (
        <TimelineVisualChronology
          events={events}
          characters={characters}
          onEventClick={handleEventClick}
        />
      ) : timelineViewMode === 'metro' ? (
        <MetroTab />
      ) : timelineViewMode === 'montage' ? (
        <MontageTab />
      ) : (
        <TagManagerTab />
      )}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          initialTab={initialTab}
          initialCharacterId={initialCharacterId}
          onClose={() => {
            setSelectedEventId(null);
            setInitialTab(undefined);
            setInitialCharacterId(undefined);
          }}
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
