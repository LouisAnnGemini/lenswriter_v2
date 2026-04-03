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

export function TimelineTab({ isSubTab, overrideViewMode }: { isSubTab?: boolean, overrideViewMode?: 'chronology' }) {
  const { 
    timelineEvents, 
    locations, 
    characters, 
    tags, 
    activeWorkId, 
    selectedEventId,
    timelineViewMode,
    focusMode,
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
    focusMode: state.focusMode,
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
      {!focusMode && (
        <div className={cn("px-4 md:px-6 py-3 md:py-4 border-b border-stone-200 bg-white/80 backdrop-blur-sm shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 z-10", isSubTab ? "border-t-0" : "")}>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 min-w-0 w-full md:w-auto">
            {!isSubTab && <h2 className="text-xl md:text-2xl font-bold text-stone-800 tracking-tight truncate">Timeline</h2>}
            <div className="flex bg-stone-100/80 p-1 rounded-lg border border-stone-200/60 shrink-0 overflow-x-auto max-w-full shadow-sm hide-scrollbar">
              <button
                onClick={() => setTimelineViewMode('table')}
                className={cn(
                  "px-3 py-1.5 md:px-3.5 md:py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center transition-all duration-200 whitespace-nowrap",
                  timelineViewMode === 'table' ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/5" : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                )}
              >
                <List size={14} className={cn("mr-1.5 md:mr-2", timelineViewMode === 'table' ? "text-emerald-600" : "")} />
                Table
              </button>
              <button
                onClick={() => setTimelineViewMode('chronology')}
                className={cn(
                  "px-3 py-1.5 md:px-3.5 md:py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center transition-all duration-200 whitespace-nowrap",
                  timelineViewMode === 'chronology' ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/5" : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                )}
              >
                <LayoutGrid size={14} className={cn("mr-1.5 md:mr-2", timelineViewMode === 'chronology' ? "text-emerald-600" : "")} />
                Chronology
              </button>
              <button
                onClick={() => setTimelineViewMode('tags')}
                className={cn(
                  "px-3 py-1.5 md:px-3.5 md:py-1.5 rounded-md text-xs md:text-sm font-medium flex items-center transition-all duration-200 whitespace-nowrap",
                  timelineViewMode === 'tags' ? "bg-white text-stone-900 shadow-sm ring-1 ring-black/5" : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                )}
              >
                <TagIcon size={14} className={cn("mr-1.5 md:mr-2", timelineViewMode === 'tags' ? "text-emerald-600" : "")} />
                Tags
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
            }}
            className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-stone-800 transition-all shadow-sm hover:shadow w-full md:w-auto justify-center active:scale-95 shrink-0"
          >
            <Plus size={16} className="mr-2" />
            New Event
          </button>
        </div>
      )}
      
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
