import React, { useState, useMemo, useCallback } from 'react';
import { Maximize2, ArrowRightToLine, X, Settings2, GripVertical, Eye, EyeOff, Network, AlertCircle, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';
import { EditableInput, InlineMultiSelect, getRandomColor } from './TimelineShared';
import { MultiSelectDropdown } from '../MultiSelectDropdown';
import { ConfirmDeleteButton } from '../ConfirmDeleteButton';
import { TimelineEvent, Character, Tag, Location } from '../../store/types';

interface TimelineTableViewProps {
  allEvents: TimelineEvent[];
  characters: Character[];
  locations: Location[];
  tags: Tag[];
  activeWorkId: string;
  highlightedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  updateTimelineEvent: (updates: Partial<TimelineEvent> & { id: string }) => void;
  deleteTimelineEvent: (id: string) => void;
  addTag: (tag: Omit<Tag, 'id'>) => string;
}

type ColumnId = 'timestamp' | 'event' | 'characters' | 'tags' | 'startTime' | 'duration';

interface ColumnConfig {
  id: ColumnId;
  label: string;
  visible: boolean;
  width: string;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'timestamp', label: 'Timestamp', visible: true, width: 'w-32' },
  { id: 'event', label: 'Event', visible: true, width: 'w-64' },
  { id: 'characters', label: 'Characters', visible: true, width: 'w-48' },
  { id: 'tags', label: 'Tags', visible: true, width: 'w-48' },
  { id: 'startTime', label: 'Start Time', visible: true, width: 'w-24' },
  { id: 'duration', label: 'Duration', visible: true, width: 'w-24' },
];

interface SortableColumnItemProps {
  column: ColumnConfig;
  onToggle: (id: ColumnId) => void;
  key?: React.Key;
}

const SortableColumnItem = ({ 
  column, 
  onToggle 
}: SortableColumnItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 hover:bg-stone-50 rounded-md group bg-white border border-transparent",
        isDragging && "border-stone-200 shadow-sm"
      )}
    >
      <button 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600"
      >
        <GripVertical size={14} />
      </button>
      <button 
        onClick={() => onToggle(column.id)}
        className={cn(
          "p-1 rounded transition-colors",
          column.visible ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:bg-stone-100"
        )}
      >
        {column.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <span className={cn("text-xs font-medium", !column.visible && "text-stone-400 line-through")}>
        {column.label}
      </span>
    </div>
  );
};

export const TimelineTableView = React.memo(({
  allEvents,
  characters,
  locations,
  tags,
  activeWorkId,
  highlightedEventId,
  setSelectedEventId,
  updateTimelineEvent,
  deleteTimelineEvent,
  addTag
}: TimelineTableViewProps) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem('timeline_table_columns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter((col: ColumnConfig) => 
          !['before', 'simultaneous', 'after'].includes(col.id.toLowerCase())
        );
        // 如果有过滤，更新 localStorage
        if (filtered.length !== parsed.length) {
          localStorage.setItem('timeline_table_columns', JSON.stringify(filtered));
        }
        return filtered;
      } catch (e) {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [invalidInputs, setInvalidInputs] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ field: ColumnId | null, direction: 'asc' | 'desc' }>({ field: null, direction: 'asc' });

  // 筛选状态
  const [filters, setFilters] = useState({
    text: '',
    startTimeMin: '',
    startTimeMax: '',
    durationMin: '',
    durationMax: '',
    characters: [] as string[],
    locations: [] as string[],
    tags: [] as string[],
    poolStatus: 'all' as 'all' | 'timeline' | 'pool',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchesText = !appliedFilters.text || 
        event.title?.toLowerCase().includes(appliedFilters.text.toLowerCase()) ||
        event.description?.toLowerCase().includes(appliedFilters.text.toLowerCase());
      
      const startTime = event.startTime;
      
      // Pool Status Filter
      if (appliedFilters.poolStatus === 'timeline' && startTime === undefined) return false;
      if (appliedFilters.poolStatus === 'pool' && startTime !== undefined) return false;

      const matchesStartTime = 
        startTime === undefined || (
          (!appliedFilters.startTimeMin || startTime >= Number(appliedFilters.startTimeMin)) &&
          (!appliedFilters.startTimeMax || startTime <= Number(appliedFilters.startTimeMax))
        );
      
      const duration = event.duration ?? 1;
      const matchesDuration = 
        (!appliedFilters.durationMin || duration >= Number(appliedFilters.durationMin)) &&
        (!appliedFilters.durationMax || duration <= Number(appliedFilters.durationMax));
      
      const matchesCharacters = appliedFilters.characters.length === 0 || 
        appliedFilters.characters.some(charId => Object.keys(event.characterActions || {}).includes(charId));
      
      const matchesLocations = appliedFilters.locations.length === 0 ||
        (event.locationId && appliedFilters.locations.includes(event.locationId));
      
      const matchesTags = appliedFilters.tags.length === 0 ||
        (event.tagIds && appliedFilters.tags.some(tagId => event.tagIds!.includes(tagId)));
      
      return matchesText && matchesStartTime && matchesDuration && matchesCharacters && matchesLocations && matchesTags;
    });
  }, [allEvents, appliedFilters]);

  const sortedEvents = useMemo(() => {
    if (!sortConfig.field) return filteredEvents;
    return [...filteredEvents].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortConfig.field) {
        case 'startTime':
          valA = a.startTime ?? 0;
          valB = b.startTime ?? 0;
          break;
        case 'duration':
          valA = a.duration ?? 0;
          valB = b.duration ?? 0;
          break;
        case 'event':
          valA = a.title?.toLowerCase() || '';
          valB = b.title?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEvents, sortConfig]);

  const validateEventUpdate = (eventId: string, newStartTime?: number, newDuration?: number): { isValid: boolean, error?: string } => {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return { isValid: true };

    const startTime = newStartTime ?? event.startTime ?? 0;
    const duration = newDuration ?? event.duration ?? 1;

    // Check horizontal relations
    if (event.horizontalIds) {
      for (const relId of event.horizontalIds) {
        const relEvent = allEvents.find(e => e.id === relId);
        if (!relEvent) continue;

        const relStartTime = relEvent.startTime ?? 0;
        const relDuration = relEvent.duration ?? 1;

        // Overlap check:
        // A.startTime < B.startTime + B.duration AND B.startTime < A.startTime + A.duration
        if (startTime < relStartTime + relDuration && relStartTime < startTime + duration) {
          return { 
            isValid: false, 
            error: `This change overlaps with related event: "${relEvent.title || 'Untitled Event'}"` 
          };
        }
      }
    }
    return { isValid: true };
  };

  const handleSort = (field: ColumnId) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        if (prev.direction === 'asc') return { field, direction: 'desc' };
        return { field: null, direction: 'asc' }; // Cycle: asc -> desc -> null
      }
      return { field, direction: 'asc' };
    });
  };

  const getCluster = useCallback((id: string, events: TimelineEvent[]): Set<string> => {
    const cluster = new Set<string>([id]);
    const queue = [id];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const ev = events.find(e => e.id === currentId);
      if (!ev) continue;
      const relations = [...(ev.horizontalIds || []), ...(ev.verticalIds || [])];
      relations.forEach(relId => {
        if (!cluster.has(relId)) {
          cluster.add(relId);
          queue.push(relId);
        }
      });
    }
    return cluster;
  }, []);

  const handleHighlight = (eventId: string) => {
    if (highlightedIds.has(eventId)) {
      setHighlightedIds(new Set());
    } else {
      setHighlightedIds(getCluster(eventId, allEvents));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('timeline_table_columns', JSON.stringify(newItems));
        return newItems;
      });
    }
  };

  const toggleColumn = (id: ColumnId) => {
    setColumns(items => {
      const newItems = items.map(col => 
        col.id === id ? { ...col, visible: !col.visible } : col
      );
      localStorage.setItem('timeline_table_columns', JSON.stringify(newItems));
      return newItems;
    });
  };

  const scrollToCenter = () => {
    const tableElement = document.querySelector('.custom-scrollbar');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  };

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const renderCell = (columnId: ColumnId, event: TimelineEvent, idx: number) => {
    switch (columnId) {
      case 'timestamp':
        return (
          <div className="flex items-center">
            <EditableInput
              type="text"
              value={event.timestamp || ''}
              onSave={(val) => updateTimelineEvent({ id: event.id, timestamp: val })}
              className="w-full bg-transparent border-none p-0 text-xs font-medium text-stone-500 focus:ring-0"
              placeholder="Time..."
            />
          </div>
        );
      case 'event':
        const isHighlighted = highlightedIds.has(event.id);
        const hasRelations = (event.horizontalIds?.length || 0) > 0 || (event.verticalIds?.length || 0) > 0;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <EditableInput
                type="text"
                value={event.title || ''}
                onSave={(val) => updateTimelineEvent({ id: event.id, title: val })}
                className="flex-1 bg-transparent border-none p-0 text-sm font-semibold text-stone-800 focus:ring-0"
                placeholder="Event title..."
              />
              {hasRelations && (
                <button 
                  onClick={() => handleHighlight(event.id)}
                  className={cn(
                    "p-1 rounded transition-colors",
                    isHighlighted ? "text-emerald-600 bg-emerald-100" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                  )}
                  title="Highlight related events"
                >
                  <Network size={14} />
                </button>
              )}
            </div>
            <EditableInput
              type="text"
              value={event.description || ''}
              onSave={(val) => updateTimelineEvent({ id: event.id, description: val })}
              className="w-full bg-transparent border-none p-0 text-xs text-stone-500 mt-0.5 focus:ring-0"
              placeholder="Add description..."
            />
          </div>
        );
      case 'characters':
        return (
          <InlineMultiSelect
            options={characters.filter(c => c.workId === activeWorkId).map(c => ({ id: c.id, title: c.name }))}
            selectedIds={Object.keys(event.characterActions || {})}
            onChange={(newIds) => {
              const currentActions = event.characterActions || {};
              const newActions: Record<string, string> = {};
              newIds.forEach(id => {
                newActions[id] = currentActions[id] || '';
              });
              updateTimelineEvent({ id: event.id, characterActions: newActions });
            }}
            placeholder="Add char..."
            className="z-50"
          />
        );
      case 'tags':
        return (
          <InlineMultiSelect
            options={tags.map(t => ({ id: t.id, title: t.name, color: t.color }))}
            selectedIds={event.tagIds || []}
            onChange={(newIds) => updateTimelineEvent({ id: event.id, tagIds: newIds })}
            placeholder="Add tag..."
            className="z-50"
            onCreateOption={(title) => {
              const newTagId = addTag({
                workId: activeWorkId,
                name: title,
                color: getRandomColor()
              });
              updateTimelineEvent({ id: event.id, tagIds: [...(event.tagIds || []), newTagId] });
            }}
            renderTag={(option, onRemove) => (
              <span key={option.id} className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 border", option.color || 'bg-stone-50 text-stone-600 border-stone-200')}>
                {option.title}
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="hover:text-red-500 opacity-60 hover:opacity-100"><X size={10} /></button>
              </span>
            )}
          />
        );
      case 'startTime':
        const isStartTimeInvalid = invalidInputs[`${event.id}-startTime`];
        return (
          <div className="relative group">
            <EditableInput
              type="number"
              value={event.startTime ?? ''}
              onSave={(val) => {
                const numVal = val === '' ? undefined : Number(val);
                const validation = validateEventUpdate(event.id, numVal, event.duration);
                if (validation.isValid) {
                  updateTimelineEvent({ id: event.id, startTime: numVal });
                } else {
                  toast.error(validation.error);
                }
              }}
              validate={(val) => validateEventUpdate(event.id, Number(val), event.duration).isValid}
              onValidationChange={(isValid) => setInvalidInputs(prev => ({ ...prev, [`${event.id}-startTime`]: !isValid }))}
              className={cn(
                "w-full bg-transparent border-none p-0 text-xs font-medium text-stone-500 focus:ring-0",
                isStartTimeInvalid && "text-red-600 border-red-500"
              )}
              placeholder="Pool"
            />
            {isStartTimeInvalid && (
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 text-red-500" title={validateEventUpdate(event.id, event.startTime, event.duration).error}>
                <AlertCircle size={14} />
              </div>
            )}
          </div>
        );
      case 'duration':
        const isDurationInvalid = invalidInputs[`${event.id}-duration`];
        return (
          <div className="relative group">
            <EditableInput
              type="number"
              value={event.duration || 1}
              onSave={(val) => {
                const numVal = Math.max(1, Number(val));
                const validation = validateEventUpdate(event.id, event.startTime, numVal);
                if (validation.isValid) {
                  updateTimelineEvent({ id: event.id, duration: numVal });
                } else {
                  toast.error(validation.error);
                }
              }}
              validate={(val) => validateEventUpdate(event.id, event.startTime, Math.max(1, Number(val))).isValid}
              onValidationChange={(isValid) => setInvalidInputs(prev => ({ ...prev, [`${event.id}-duration`]: !isValid }))}
              className={cn(
                "w-full bg-transparent border-none p-0 text-xs font-medium text-stone-500 focus:ring-0",
                isDurationInvalid && "text-red-600 border-red-500"
              )}
            />
            {isDurationInvalid && (
              <div className="absolute -right-5 top-1/2 -translate-y-1/2 text-red-500" title={validateEventUpdate(event.id, event.startTime, event.duration).error}>
                <AlertCircle size={14} />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 pt-4 md:pt-6 pb-[50vh] flex flex-col gap-4 custom-scrollbar">
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm w-full max-w-7xl mx-auto shrink-0 overflow-hidden">
        {/* Top Row: Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 border-b border-stone-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full pl-10 pr-4 py-2 bg-stone-50/50 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={filters.text}
              onChange={(e) => setFilters(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              isFilterExpanded ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
            )}
          >
            <Filter size={16} />
            Filters
            {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Collapsible Filter Section */}
        {isFilterExpanded && (
          <div className="p-4 bg-stone-50/30 border-b border-stone-100 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Characters, Locations, Tags */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Characters</label>
                  <MultiSelectDropdown
                    options={characters.filter(c => c.workId === activeWorkId).map(c => ({ id: c.id, title: c.name }))}
                    selectedIds={filters.characters}
                    onChange={(ids) => setFilters(prev => ({ ...prev, characters: ids }))}
                    placeholder="Select characters..."
                    className="w-full bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Locations</label>
                  <MultiSelectDropdown
                    options={locations.filter(l => l.workId === activeWorkId).map(l => ({ id: l.id, title: l.name }))}
                    selectedIds={filters.locations}
                    onChange={(ids) => setFilters(prev => ({ ...prev, locations: ids }))}
                    placeholder="Select locations..."
                    className="w-full bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tags</label>
                  <MultiSelectDropdown
                    options={tags.map(t => ({ id: t.id, title: t.name }))}
                    selectedIds={filters.tags}
                    onChange={(ids) => setFilters(prev => ({ ...prev, tags: ids }))}
                    placeholder="Select tags..."
                    className="w-full bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Event Type</label>
                  <div className="flex flex-wrap gap-1 p-1 bg-stone-100 rounded-lg">
                    {(['all', 'timeline', 'pool'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilters(prev => ({ ...prev, poolStatus: status }))}
                        className={cn(
                          "flex-1 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
                          filters.poolStatus === status 
                            ? "bg-white text-emerald-700 shadow-sm" 
                            : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Time & Duration */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Start Time Range</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white min-w-0" value={filters.startTimeMin} onChange={(e) => setFilters(prev => ({ ...prev, startTimeMin: e.target.value }))} />
                    <input type="number" placeholder="Max" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white min-w-0" value={filters.startTimeMax} onChange={(e) => setFilters(prev => ({ ...prev, startTimeMax: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Duration Range</label>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white min-w-0" value={filters.durationMin} onChange={(e) => setFilters(prev => ({ ...prev, durationMin: e.target.value }))} />
                    <input type="number" placeholder="Max" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white min-w-0" value={filters.durationMax} onChange={(e) => setFilters(prev => ({ ...prev, durationMax: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-200/60">
              <button 
                onClick={() => {
                  const resetFilters: typeof filters = { 
                    text: '', 
                    startTimeMin: '', 
                    startTimeMax: '', 
                    durationMin: '', 
                    durationMax: '', 
                    characters: [], 
                    locations: [], 
                    tags: [],
                    poolStatus: 'all'
                  };
                  setFilters(resetFilters);
                  setAppliedFilters(resetFilters);
                }}
                className="w-full sm:w-auto px-4 py-2 text-stone-500 hover:text-stone-700 text-sm font-medium transition-colors"
              >
                Reset All
              </button>
              <button 
                onClick={() => setAppliedFilters(filters)}
                className="w-full sm:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 relative w-full max-w-7xl mx-auto shrink-0">
        <button 
          onClick={scrollToCenter}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 text-xs font-medium hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm"
        >
          <Maximize2 size={14} />
          <span className="hidden sm:inline">Scroll to Center</span>
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm",
            showSettings ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
          )}
        >
          <Settings2 size={14} />
          <span className="hidden sm:inline">Column Settings</span>
          <span className="sm:hidden">Columns</span>
        </button>

        {showSettings && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-stone-200/80 rounded-xl shadow-xl z-[60] p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Manage Columns</span>
              <button onClick={() => setShowSettings(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors"><X size={14} /></button>
            </div>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={columns.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  {columns.map((col) => (
                    <SortableColumnItem 
                      key={col.id} 
                      column={col} 
                      onToggle={toggleColumn} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="mt-3 pt-3 border-t border-stone-100 flex justify-center">
              <button 
                onClick={() => {
                  setColumns(DEFAULT_COLUMNS);
                  localStorage.setItem('timeline_table_columns', JSON.stringify(DEFAULT_COLUMNS));
                }}
                className="text-[10px] text-stone-400 hover:text-stone-600 underline decoration-stone-300 underline-offset-2 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden w-full max-w-7xl mx-auto shrink-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {visibleColumns.map(col => (
                  <th 
                    key={col.id} 
                    className={cn("px-4 sm:px-5 py-3 sm:py-3.5 cursor-pointer hover:bg-stone-100 transition-colors whitespace-nowrap", col.width)}
                    onClick={() => handleSort(col.id)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.field === col.id && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 sm:px-5 py-3 sm:py-3.5 w-16 text-right sticky right-0 bg-stone-50/80 backdrop-blur-sm shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/80">
              {sortedEvents.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-5 py-16 text-center text-stone-400 italic bg-stone-50/30">
                    No events found matching your filters.
                  </td>
                </tr>
              ) : (
                sortedEvents.map((event, idx) => (
                      <tr 
                        key={event.id} 
                        id={`event-${event.id}`}
                        onDoubleClick={() => setSelectedEventId(event.id)}
                        className={cn(
                          "group transition-colors duration-150",
                          "bg-white",
                          (highlightedEventId === event.id || highlightedIds.has(event.id)) ? "bg-emerald-50/80" : "hover:bg-stone-50/80",
                          event.startTime === undefined && "opacity-60 grayscale-[0.5]"
                        )}
                      >
                        {visibleColumns.map(col => (
                          <td key={`${event.id}-${col.id}`} className="px-4 sm:px-5 py-3 sm:py-4 align-top">
                            {renderCell(col.id, event, idx)}
                          </td>
                        ))}
                        <td className="px-4 sm:px-5 py-3 sm:py-4 align-top text-right sticky right-0 bg-white group-hover:bg-stone-50/80 transition-colors duration-200 shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => setSelectedEventId(event.id)} className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors" title="View Details"><Maximize2 size={14} /></button>
                            <ConfirmDeleteButton onConfirm={() => deleteTimelineEvent(event.id)} className="p-1.5 hover:bg-red-50 rounded-md transition-colors" />
                          </div>
                        </td>
                      </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
