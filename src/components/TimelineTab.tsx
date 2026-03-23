import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Clock, Maximize2, Link as LinkIcon, ExternalLink, List, LayoutGrid, Search, Filter, Tag as TagIcon, X, AlignLeft, Check } from 'lucide-react';
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

const EditableInput = ({ 
  value, 
  onSave, 
  className, 
  type = "text",
  placeholder
}: { 
  value: string | number, 
  onSave: (val: any) => void, 
  className?: string,
  type?: string,
  placeholder?: string
}) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        const val = type === 'number' ? (parseInt(localValue) || 0) : localValue;
        if (val !== value) onSave(val);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const val = type === 'number' ? (parseInt(localValue) || 0) : localValue;
          if (val !== value) onSave(val);
          (e.target as HTMLInputElement).blur();
        }
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={className}
      placeholder={placeholder}
    />
  );
};

const EditableTextarea = ({ 
  value, 
  onSave, 
  className, 
  placeholder,
  rows = 2
}: { 
  value: string, 
  onSave: (val: string) => void, 
  className?: string,
  placeholder?: string,
  rows?: number
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) onSave(localValue);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={className}
      placeholder={placeholder}
      rows={rows}
    />
  );
};

const InlineMultiSelect = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select...',
  renderTag
}: {
  options: { id: string; title: string; color?: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  renderTag?: (option: any, onRemove: () => void) => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => 
    options.filter(opt => (opt.title || '').toLowerCase().includes((search || '').toLowerCase())),
    [options, search]
  );

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(sId => sId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className="min-h-[24px] flex flex-wrap gap-1 items-center cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {selectedIds.length === 0 && <span className="text-stone-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">{placeholder}</span>}
        {selectedIds.map(id => {
          const option = options.find(o => o.id === id);
          if (!option) return null;
          if (renderTag) return renderTag(option, () => toggleOption(id));
          return (
            <span key={id} className="bg-stone-100 text-stone-600 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
              {option.title}
              <button onClick={(e) => { e.stopPropagation(); toggleOption(id); }} className="hover:text-red-500"><X size={10} /></button>
            </span>
          );
        })}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-48 mt-1 bg-white border border-stone-200 rounded-md shadow-lg left-0 top-full">
          <div className="p-2 border-b border-stone-100">
            <div className="flex items-center gap-2 bg-stone-50 px-2 py-1 rounded">
              <Search size={12} className="text-stone-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none"
                placeholder="Search..."
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-stone-500 italic">No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  className="px-3 py-1.5 text-xs hover:bg-stone-50 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleOption(opt.id)}
                >
                  {opt.color ? (
                    <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", opt.color)}>
                      {opt.title}
                    </span>
                  ) : (
                    <span className="truncate">{opt.title}</span>
                  )}
                  {selectedIds.includes(opt.id) && <Check size={12} className="text-emerald-600 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function TimelineTab({ isSubTab, overrideViewMode }: { isSubTab?: boolean, overrideViewMode?: 'chronology' | 'montage' }) {
  const { state, dispatch } = useStore();
  const [viewMode, setViewMode] = useState<'chronology' | 'montage' | 'tags'>(overrideViewMode || 'chronology');
  const [chronologyMode, setChronologyMode] = useState<'stream' | 'compact'>('stream');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledSequenceNumber, setPrefilledSequenceNumber] = useState<number | undefined>(undefined);
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

  const [activeCharTabs, setActiveCharTabs] = useState<Record<string, string | null>>({});

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

  // Group events by sequence number for parallel tracks
  const groupedEvents: { sequence: number; events: typeof events }[] = [];
  filteredEvents.forEach(event => {
    const seq = event.sequenceNumber || 0;
    const group = groupedEvents.find(g => g.sequence === seq);
    if (group) {
      group.events.push(event);
    } else {
      groupedEvents.push({ sequence: seq, events: [event] });
    }
  });
  // Sort groups by sequence
  groupedEvents.sort((a, b) => a.sequence - b.sequence);

  const handleAddParallel = (sequence: number) => {
    setPrefilledSequenceNumber(sequence);
    setIsAddModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      <div className={cn("p-4 border-b border-stone-200 bg-white shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4", isSubTab ? "border-t-0" : "")}>
        <div className="flex flex-wrap items-center gap-4 min-w-0 w-full md:w-auto">
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

          {viewMode === 'chronology' && (
            <div className="flex bg-stone-50 p-1 rounded-lg border border-stone-200 shrink-0">
              <button
                onClick={() => setChronologyMode('stream')}
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium flex items-center transition-colors",
                  chronologyMode === 'stream' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
                title="Stream View"
              >
                <AlignLeft size={14} className="mr-1.5" />
                Stream
              </button>
              <button
                onClick={() => setChronologyMode('compact')}
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium flex items-center transition-colors",
                  chronologyMode === 'compact' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
                title="Compact View"
              >
                <List size={14} className="mr-1.5" />
                Compact
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setPrefilledSequenceNumber(undefined);
            setIsAddModalOpen(true);
          }}
          className="bg-stone-800 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center hover:bg-stone-700 transition-colors shadow-sm w-full md:w-auto justify-center"
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
                        color: t.color
                      }))}
                    value=""
                    onChange={(value) => {
                      if (value && !selectedTags.includes(value)) {
                        setSelectedTags([...selectedTags, value]);
                      }
                    }}
                    placeholder="+ Tag"
                    renderOption={(opt) => (
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", opt.color || 'bg-stone-100 text-stone-700 border-stone-200')}>
                        {opt.title}
                      </span>
                    )}
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
            {chronologyMode === 'stream' ? (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-stone-200">
                {groupedEvents.length === 0 ? (
                  <div className="text-center py-12 text-stone-500 italic bg-white rounded-xl border border-stone-200 shadow-sm relative z-10 ml-8">
                    No events found matching your filters.
                  </div>
                ) : (
                  groupedEvents.map((group) => (
                    <div key={group.sequence} className="relative pl-12">
                      {/* Timeline Node */}
                      <div className="absolute left-4 top-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white bg-stone-800 shadow-sm z-10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      
                      <div className={cn(
                        "grid gap-4",
                        group.events.length > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                      )}>
                        {group.events.map((event) => (
                          <div
                            key={event.id}
                            id={`event-${event.id}`}
                            onDoubleClick={() => setSelectedEventId(event.id)}
                            className={cn(
                              "group p-5 rounded-xl border shadow-sm transition-all relative bg-white",
                              EVENT_COLORS[(event.color as keyof typeof EVENT_COLORS) || 'stone'],
                              highlightedEventId === event.id && "ring-2 ring-emerald-500 ring-offset-2"
                            )}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <EditableInput
                                    type="text"
                                    value={event.timestamp || ''}
                                    onSave={(val) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, timestamp: val } })}
                                    className="text-xs font-bold uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0 w-full opacity-60 hover:opacity-100 transition-opacity"
                                    placeholder="Timestamp"
                                  />
                                </div>
                                <EditableInput
                                  type="text"
                                  value={event.title || ''}
                                  onSave={(val) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, title: val } })}
                                  className="text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 w-full"
                                  placeholder="Event Title"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {Object.keys(event.characterActions || {}).map(charId => {
                                    const character = state.characters.find(c => c.id === charId);
                                    if (!character) return null;
                                    const isActive = activeCharTabs[event.id] === charId;
                                    return (
                                      <button
                                        key={charId}
                                        onClick={() => setActiveCharTabs(prev => ({
                                          ...prev,
                                          [event.id]: isActive ? null : charId
                                        }))}
                                        className={cn(
                                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-all",
                                          isActive 
                                            ? "bg-stone-800 text-white border-stone-800" 
                                            : "bg-stone-100 text-stone-600 border-stone-200/50 hover:bg-stone-200"
                                        )}
                                      >
                                        {character.name}
                                      </button>
                                    );
                                  })}
                                  {event.tagIds?.map(tagId => {
                                    const tag = tags.find(t => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span key={tagId} className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", tag.color || 'bg-stone-50 text-stone-600 border-stone-200')}>
                                        {tag.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleAddParallel(group.sequence)}
                                  className="p-1.5 hover:bg-white/50 rounded-md text-stone-500"
                                  title="Add Parallel Event"
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  onClick={() => setSelectedEventId(event.id)}
                                  className="p-1.5 hover:bg-white/50 rounded-md text-stone-500"
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

                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                {activeCharTabs[event.id] 
                                  ? `${state.characters.find(c => c.id === activeCharTabs[event.id])?.name}'s Action` 
                                  : 'Event Description'}
                              </label>
                              <EditableTextarea
                                value={activeCharTabs[event.id] 
                                  ? (event.characterActions?.[activeCharTabs[event.id]!] || '') 
                                  : (event.description || '')}
                                onSave={(val) => {
                                  if (activeCharTabs[event.id]) {
                                    dispatch({
                                      type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION',
                                      payload: {
                                        eventId: event.id,
                                        characterId: activeCharTabs[event.id]!,
                                        action: val
                                      }
                                    });
                                  } else {
                                    dispatch({
                                      type: 'UPDATE_TIMELINE_EVENT',
                                      payload: { id: event.id, description: val }
                                    });
                                  }
                                }}
                                placeholder={activeCharTabs[event.id] ? "What is this character doing?" : "Event description..."}
                                rows={2}
                                className="text-sm bg-stone-50/30 border border-stone-200/30 rounded-lg px-3 py-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                              />
                            </div>

                            {event.linkedEventIds && event.linkedEventIds.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-black/5">
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
                                      <span className="truncate max-w-[120px]">{linkedEvent.title}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-16">Seq</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-24">Time</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Event</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-40">Characters</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-32">Tags</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-stone-500 italic">No events found.</td>
                      </tr>
                    ) : (
                      groupedEvents.map((group) => (
                        <React.Fragment key={group.sequence}>
                          {group.events.map((event, idx) => (
                            <tr 
                              key={event.id} 
                              id={`event-${event.id}`}
                              onDoubleClick={() => setSelectedEventId(event.id)}
                              className={cn(
                                "border-b border-stone-100 hover:bg-stone-50 transition-colors group",
                                idx === 0 && group.events.length > 1 ? "bg-stone-50/30" : "",
                                highlightedEventId === event.id && "bg-emerald-50"
                              )}
                            >
                              <td className="px-4 py-3 align-top">
                                <div className="flex items-center">
                                  {idx > 0 && <span className="text-stone-300 text-[10px] mr-1">↳</span>}
                                  <EditableInput
                                    type="number"
                                    value={event.sequenceNumber || 0}
                                    onSave={(val) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, sequenceNumber: val } })}
                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-stone-800 focus:ring-0"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <EditableInput
                                  type="text"
                                  value={event.timestamp || ''}
                                  onSave={(val) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, timestamp: val } })}
                                  className="w-full bg-transparent border-none p-0 text-xs font-medium text-stone-500 focus:ring-0"
                                  placeholder="Time..."
                                />
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col">
                                  <EditableInput
                                    type="text"
                                    value={event.title || ''}
                                    onSave={(val) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, title: val } })}
                                    className="w-full bg-transparent border-none p-0 text-sm font-semibold text-stone-800 focus:ring-0"
                                    placeholder="Event title..."
                                  />
                                  <EditableInput
                                    type="text"
                                    value={event.description || ''}
                                    onSave={(val) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, description: val } })}
                                    className="w-full bg-transparent border-none p-0 text-xs text-stone-500 mt-0.5 focus:ring-0"
                                    placeholder="Add description..."
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <InlineMultiSelect
                                  options={state.characters.filter(c => c.workId === activeWorkId).map(c => ({ id: c.id, title: c.name }))}
                                  selectedIds={Object.keys(event.characterActions || {})}
                                  onChange={(newIds) => {
                                    const currentActions = event.characterActions || {};
                                    
                                    // Handle removals
                                    Object.keys(currentActions).forEach(id => {
                                      if (!newIds.includes(id)) {
                                        dispatch({ type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION', payload: { eventId: event.id, characterId: id, action: 'DELETE_ACTION' } });
                                      }
                                    });
                                    
                                    // Handle additions
                                    newIds.forEach(id => {
                                      if (!(id in currentActions)) {
                                        dispatch({ type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION', payload: { eventId: event.id, characterId: id, action: '' } });
                                      }
                                    });
                                  }}
                                  placeholder="Add char..."
                                />
                              </td>
                              <td className="px-4 py-3 align-top">
                                <InlineMultiSelect
                                  options={tags.map(t => ({ id: t.id, title: t.name, color: t.color }))}
                                  selectedIds={event.tagIds || []}
                                  onChange={(newIds) => {
                                    dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, tagIds: newIds } });
                                  }}
                                  placeholder="Add tag..."
                                  renderTag={(option, onRemove) => (
                                    <span key={option.id} className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 border", option.color || 'bg-stone-50 text-stone-600 border-stone-200')}>
                                      {option.title}
                                      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:text-red-500 opacity-60 hover:opacity-100"><X size={10} /></button>
                                    </span>
                                  )}
                                />
                              </td>
                              <td className="px-4 py-3 align-top text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleAddParallel(group.sequence)} className="p-1 text-stone-400 hover:text-stone-600" title="Add Parallel"><Plus size={14} /></button>
                                  <button onClick={() => setSelectedEventId(event.id)} className="p-1 text-stone-400 hover:text-stone-600"><Maximize2 size={14} /></button>
                                  <ConfirmDeleteButton onConfirm={() => dispatch({ type: 'DELETE_TIMELINE_EVENT', payload: event.id })} className="p-1" />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

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
          initialSequenceNumber={prefilledSequenceNumber}
        />
      )}
    </div>
  );
}
