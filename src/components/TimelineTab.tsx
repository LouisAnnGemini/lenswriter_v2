import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Clock, Maximize2, Link as LinkIcon, ExternalLink, List, LayoutGrid, Search, Filter, Tag as TagIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';

const EVENT_COLORS = {
  stone: 'bg-stone-100 border-stone-200 text-stone-800',
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
};

import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { EventDetailsModal } from './EventDetailsModal';
import { MontageBoard } from './MontageBoard';
import { TagManagerModal } from './TagManagerModal';
import { TagManagerTab } from './TagManagerTab';
import { AddEventModal } from './AddEventModal';
import { SearchableSelect } from './SearchableSelect';

export function TimelineTab({ isSubTab, overrideViewMode }: { isSubTab?: boolean, overrideViewMode?: 'chronology' | 'montage' }) {
  const { state, dispatch } = useStore();
  const [viewMode, setViewMode] = useState<'chronology' | 'montage' | 'tags'>(overrideViewMode || 'chronology');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const activeWorkId = state.activeWorkId;
  const events = state.timelineEvents.filter(e => e.workId === activeWorkId).sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  const locations = state.locations.filter(l => l.workId === activeWorkId);
  const characters = state.characters.filter(c => c.workId === activeWorkId);
  const tags = state.tags.filter(t => t.workId === activeWorkId);

  if (!activeWorkId) return null;

  const filteredEvents = events.filter(e => {
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
  });

  const scrollToEvent = (eventId: string) => {
    const element = document.getElementById(`event-${eventId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedEventId(eventId);
      setTimeout(() => setHighlightedEventId(null), 2000);
    }
  };

  const handleNavigateToEvent = (eventId: string) => {
    scrollToEvent(eventId);
  };

  useEffect(() => {
    if (overrideViewMode) {
      setViewMode(overrideViewMode);
    }
  }, [overrideViewMode]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    dispatch({
      type: 'REORDER_TIMELINE_EVENTS',
      payload: { workId: activeWorkId, startIndex: result.source.index, endIndex: result.destination.index }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className={cn("p-4 border-b border-stone-200 bg-white shrink-0 flex justify-between items-center gap-4", isSubTab ? "border-t-0" : "")}>
        <div className="flex items-center gap-4 min-w-0">
          {!isSubTab && <h2 className="text-xl font-bold text-stone-800 truncate">Timeline</h2>}
          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 shrink-0">
            <button
              onClick={() => setViewMode('chronology')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors",
                viewMode === 'chronology' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              <List size={16} className="mr-2" />
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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-stone-800 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center hover:bg-stone-700 transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-1.5" />
            New Event
          </button>
        </div>
      
      {viewMode === 'chronology' ? (
        <div className="flex-1 overflow-y-auto p-6" ref={scrollContainerRef}>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search and Filter UI - Now integrated into the content area */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                <Search size={16} className="text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events by title or description..."
                  className="text-sm font-medium bg-transparent border-none outline-none text-stone-600 w-full placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600 p-1">
                    <X size={14} />
                  </button>
                )}
              </div>
                
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-stone-400" />
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Filters:</span>
                </div>
                
                {/* Characters Filter */}
                <div className="relative group">
                  <SearchableSelect
                    options={characters
                      .filter(c => !selectedCharacters.includes(c.id))
                      .map(c => ({
                        id: c.id,
                        title: c.name,
                      }))}
                    value=""
                    onChange={(value) => {
                      if (value && !selectedCharacters.includes(value)) {
                        setSelectedCharacters([...selectedCharacters, value]);
                      }
                    }}
                    placeholder="+ Character"
                  />
                </div>

                {/* Locations Filter */}
                <div className="relative group">
                  <SearchableSelect
                    options={locations
                      .filter(l => !selectedLocations.includes(l.id))
                      .map(l => ({
                        id: l.id,
                        title: l.name,
                      }))}
                    value=""
                    onChange={(value) => {
                      if (value && !selectedLocations.includes(value)) {
                        setSelectedLocations([...selectedLocations, value]);
                      }
                    }}
                    placeholder="+ Location"
                  />
                </div>

                {/* Colors Filter - Updated to show only color circles */}
                <div className="relative group">
                  <SearchableSelect
                    options={Object.keys(EVENT_COLORS)
                      .filter(color => !selectedColors.includes(color))
                      .map(color => ({
                        id: color,
                        title: color.charAt(0).toUpperCase() + color.slice(1),
                      }))}
                    value=""
                    onChange={(value) => {
                      if (value && !selectedColors.includes(value)) {
                        setSelectedColors([...selectedColors, value]);
                      }
                    }}
                    placeholder="+ Color"
                    renderOption={(opt) => (
                      <div className="flex items-center justify-center p-1">
                        <div className={cn(
                          "w-5 h-5 rounded-full border border-black/10 shadow-sm",
                          opt.id === 'stone' && "bg-stone-200",
                          opt.id === 'red' && "bg-red-400",
                          opt.id === 'blue' && "bg-blue-400",
                          opt.id === 'green' && "bg-emerald-400",
                          opt.id === 'yellow' && "bg-amber-400",
                          opt.id === 'purple' && "bg-purple-400"
                        )} title={opt.title} />
                      </div>
                    )}
                  />
                </div>

                {/* Tags Filter */}
                <div className="relative group">
                  <SearchableSelect
                    options={tags
                      .filter(t => !selectedTags.includes(t.id))
                      .map(t => ({
                        id: t.id,
                        title: t.name,
                      }))}
                    value=""
                    onChange={(value) => {
                      if (value && !selectedTags.includes(value)) {
                        setSelectedTags([...selectedTags, value]);
                      }
                    }}
                    placeholder="+ Tag"
                  />
                </div>
              </div>

              {/* Active Filters */}
              {(selectedCharacters.length > 0 || selectedLocations.length > 0 || selectedColors.length > 0 || selectedTags.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                  {selectedCharacters.map(id => (
                    <span key={`char-${id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-100 text-stone-700 text-xs font-medium">
                      {characters.find(c => c.id === id)?.name}
                      <button onClick={() => setSelectedCharacters(selectedCharacters.filter(c => c !== id))} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                  {selectedLocations.map(id => (
                    <span key={`loc-${id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-100 text-stone-700 text-xs font-medium">
                      {locations.find(l => l.id === id)?.name}
                      <button onClick={() => setSelectedLocations(selectedLocations.filter(l => l !== id))} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                  {selectedColors.map(color => (
                    <span key={`color-${color}`} className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200">
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full border border-black/10",
                        color === 'stone' && "bg-stone-200",
                        color === 'red' && "bg-red-400",
                        color === 'blue' && "bg-blue-400",
                        color === 'green' && "bg-emerald-400",
                        color === 'yellow' && "bg-amber-400",
                        color === 'purple' && "bg-purple-400"
                      )} title={color.charAt(0).toUpperCase() + color.slice(1)} />
                      <button onClick={() => setSelectedColors(selectedColors.filter(c => c !== color))} className="hover:text-red-500 ml-0.5"><X size={12} /></button>
                    </span>
                  ))}
                  {selectedTags.map(id => {
                    const tag = tags.find(t => t.id === id);
                    return tag ? (
                      <span key={`tag-${id}`} className={cn("inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border", tag.color || 'bg-stone-100 text-stone-700 border-stone-200')}>
                        {tag.name}
                        <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== id))} className="hover:text-red-500 opacity-60 hover:opacity-100"><X size={12} /></button>
                      </span>
                    ) : null;
                  })}
                  <button 
                    onClick={() => {
                      setSelectedCharacters([]);
                      setSelectedLocations([]);
                      setSelectedColors([]);
                      setSelectedTags([]);
                    }}
                    className="text-xs text-stone-500 hover:text-stone-800 underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
            
            {/* Events List */}
            <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-300 before:to-transparent">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-stone-500 italic bg-white rounded-xl border border-stone-200 shadow-sm relative z-10">
                      No events found matching your filters.
                    </div>
                  ) : (
                    filteredEvents.map((event, index) => (
                      // @ts-expect-error React 19 key prop issue
                      <Draggable key={event.id} draggableId={event.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          id={`event-${event.id}`}
                          className={cn(
                            "relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group",
                            snapshot.isDragging && "z-50"
                          )}
                        >
                          {/* Timeline Node */}
                          <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-stone-50 bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-ml-6 md:group-even:-mr-6 z-10">
                            <div 
                              {...provided.dragHandleProps}
                              className="w-full h-full flex items-center justify-center text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical size={16} />
                            </div>
                          </div>

                          {/* Event Card */}
                          <div className={cn(
                            "w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl border shadow-sm transition-all relative",
                            EVENT_COLORS[(event.color as keyof typeof EVENT_COLORS) || 'stone'],
                            snapshot.isDragging && "shadow-xl scale-[1.02]",
                            highlightedEventId === event.id && "ring-2 ring-emerald-500 ring-offset-2"
                          )}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={event.timestamp || ''}
                                  onChange={(e) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, timestamp: e.target.value } })}
                                  className="text-xs font-bold uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0 w-full opacity-60 hover:opacity-100 transition-opacity"
                                  placeholder="Timestamp"
                                />
                                <input
                                  type="text"
                                  value={event.title || ''}
                                  onChange={(e) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, title: e.target.value } })}
                                  className="text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 w-full mt-1"
                                  placeholder="Event Title"
                                />
                                {/* Character Tags */}
                                {Object.keys(event.characterActions || {}).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.keys(event.characterActions).map(charId => {
                                      const character = state.characters.find(c => c.id === charId);
                                      if (!character) return null;
                                      return (
                                        <span key={charId} className="text-[10px] font-bold uppercase tracking-wider bg-stone-200/50 text-stone-700 px-1.5 py-0.5 rounded">
                                          {character.name}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                {/* Tags */}
                                {event.tagIds && event.tagIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {event.tagIds.map(tagId => {
                                      const tag = tags.find(t => t.id === tagId);
                                      if (!tag) return null;
                                      return (
                                        <span key={tagId} className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", tag.color || 'bg-stone-100 text-stone-700 border-stone-200')}>
                                          {tag.name}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setSelectedEventId(event.id)}
                                  className="p-1.5 hover:bg-white/50 rounded-md"
                                  title="Edit Details"
                                >
                                  <Maximize2 size={16} />
                                </button>
                                <ConfirmDeleteButton
                                  onConfirm={() => dispatch({ type: 'DELETE_TIMELINE_EVENT', payload: event.id })}
                                  className="p-1.5 hover:bg-white/50"
                                  title="Delete Event"
                                />
                              </div>
                            </div>

                            <div className="space-y-3 mt-4">
                              <textarea
                                value={event.description || ''}
                                onChange={(e) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, description: e.target.value } })}
                                placeholder="Event description..."
                                rows={2}
                                className="text-sm bg-white/50 border border-stone-200/50 rounded-md px-2 py-1.5 w-full resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />

                              {/* Linked Events Display */}
                              {event.linkedEventIds && event.linkedEventIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-black/5">
                                  {event.linkedEventIds.map(linkedId => {
                                    const linkedEvent = events.find(e => e.id === linkedId);
                                    if (!linkedEvent) return null;
                                    return (
                                      <button
                                        key={linkedId}
                                        onClick={() => handleNavigateToEvent(linkedId)}
                                        className="flex items-center gap-1 px-2 py-1 bg-white/40 hover:bg-white/60 border border-black/5 rounded text-[10px] font-medium text-stone-600 transition-colors group/link"
                                      >
                                        <LinkIcon size={10} className="text-stone-400 group-hover/link:text-stone-600" />
                                        <span className="truncate max-w-[100px]">{linkedEvent.title}</span>
                                        <ExternalLink size={8} className="text-stone-400 opacity-0 group-hover/link:opacity-100" />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="flex items-center space-x-1 pt-2 border-t border-black/5">
                                {Object.keys(EVENT_COLORS).map(color => (
                                  <button
                                    key={color}
                                    onClick={() => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, color } })}
                                    className={cn(
                                      "w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-110",
                                      color === 'stone' && "bg-stone-200",
                                      color === 'red' && "bg-red-400",
                                      color === 'blue' && "bg-blue-400",
                                      color === 'green' && "bg-emerald-400",
                                      color === 'yellow' && "bg-amber-400",
                                      color === 'purple' && "bg-purple-400",
                                      (event.color || 'stone') === color && "ring-2 ring-offset-1 ring-stone-400"
                                    )}
                                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                                  />
                                ))}
                              </div>
                              
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  )))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {events.length === 0 && (
            <div className="text-center py-12 text-stone-500 bg-white rounded-lg border border-stone-200 border-dashed">
              <Clock size={48} className="mx-auto mb-4 opacity-20" />
              <p>No events in the timeline yet.</p>
              <p className="text-sm mt-1">Add your first event above to start building your story's chronology.</p>
            </div>
          )}
          </div>
        </div>
      ) : viewMode === 'montage' ? (
        <MontageBoard />
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
        <AddEventModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}
