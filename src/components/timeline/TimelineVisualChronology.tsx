import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useStore } from '../../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Users, Clock, Info, Layers, Edit2, Move, Filter, X, MapPin, Tag as TagIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TimelineEvent, Character } from '../../store/types';

interface TimelineVisualChronologyProps {
  events: TimelineEvent[];
  characters: Character[];
  onEventClick: (id: string, initialTab?: 'general' | 'characters' | 'relations', characterId?: string) => void;
}

export const TimelineVisualChronology = ({ events, characters, onEventClick }: TimelineVisualChronologyProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateTimelineEvent, locations, tags } = useStore(useShallow(state => ({
    updateTimelineEvent: state.updateTimelineEvent,
    locations: state.locations,
    tags: state.tags
  })));

  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  // Minimap state
  const [scrollRatio, setScrollRatio] = useState(0);
  const [viewportRatio, setViewportRatio] = useState(1);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);

  // Dragging an event card
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [resizingEventId, setResizingEventId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<{ includedIds: string[]; excludedIds: string[]; mode: 'AND' | 'OR' }>({
    includedIds: [],
    excludedIds: [],
    mode: 'OR'
  });

  // Filter events that have a duration or are part of the timeline
  const timelineEvents = useMemo(() => {
    const baseEvents = events.filter(e => e.startTime !== undefined).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return baseEvents.filter(event => {
      // Location filter
      if (selectedLocationIds.length > 0) {
        if (!event.locationId || !selectedLocationIds.includes(event.locationId)) {
          return false;
        }
      }

      // Tag filter
      if (tagFilter.includedIds.length > 0 || tagFilter.excludedIds.length > 0) {
        const eventTagIds = event.tagIds || [];
        
        // Excluded tags (NOT)
        if (tagFilter.excludedIds.some(id => eventTagIds.includes(id))) {
          return false;
        }

        // Included tags (AND / OR)
        if (tagFilter.includedIds.length > 0) {
          if (tagFilter.mode === 'AND') {
            if (!tagFilter.includedIds.every(id => eventTagIds.includes(id))) {
              return false;
            }
          } else {
            if (!tagFilter.includedIds.some(id => eventTagIds.includes(id))) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [events, selectedLocationIds, tagFilter]);

  // Calculate time range and positions based on duration and dependencies
  const processedEvents = useMemo(() => {
    if (timelineEvents.length === 0) return [];

    // 1. Initialize data with minimum duration 1
    const eventsWithDur = timelineEvents.map(e => ({
      ...e,
      calcDuration: Math.max(1, e.duration || 1),
      startTime: e.startTime || 0,
      endTime: 0,
      level: 0 // For stacking in All Events track
    }));

    // 2. Simple constraint solver for Before/After
    // We'll run a few passes to propagate start times
    type ProcessedEvent = typeof eventsWithDur[0];
    const idMap = new Map<string, ProcessedEvent>(eventsWithDur.map(e => [e.id, e]));
    
    // Initialize start times based on 'order' as a baseline if no dependencies exist
    // but we'll let dependencies override it.
    
    for (let i = 0; i < 5; i++) { // 5 passes should be enough for most chains
      eventsWithDur.forEach(e => {
        // Dependencies removed
      });
    }

    // Update end times
    eventsWithDur.forEach(e => {
      e.endTime = e.startTime + e.calcDuration;
    });

    // 3. Calculate Stacking Levels for "All Events" track
    // Sort by start time then duration
    const sorted = [...eventsWithDur].sort((a, b) => a.startTime - b.startTime || b.calcDuration - a.calcDuration);
    const levels: number[] = []; // Stores the end time of the last event in each level

    sorted.forEach(e => {
      let levelFound = false;
      for (let i = 0; i < levels.length; i++) {
        if (e.startTime >= levels[i]) {
          e.level = i;
          levels[i] = e.endTime;
          levelFound = true;
          break;
        }
      }
      if (!levelFound) {
        e.level = levels.length;
        levels.push(e.endTime);
      }
    });

    return eventsWithDur;
  }, [timelineEvents]);

  const maxLevel = useMemo(() => {
    if (processedEvents.length === 0) return 0;
    return Math.max(...processedEvents.map(e => e.level)) + 1;
  }, [processedEvents]);

  const timeRange = useMemo(() => {
    if (processedEvents.length === 0) return [0, 10];
    const min = Math.min(...processedEvents.map(e => e.startTime));
    const max = Math.max(...processedEvents.map(e => e.endTime));
    const padding = 2;
    return [Math.max(0, min), max + padding];
  }, [processedEvents]);

  // D3 Scale for X-axis: 1 duration unit = 40px (base)
  const xScale = useMemo(() => {
    const unitWidth = 40 * zoomLevel;
    const width = (timeRange[1] - timeRange[0]) * unitWidth;

    return d3.scaleLinear()
      .domain(timeRange)
      .range([0, width]);
  }, [timeRange, zoomLevel]);

  // Drag to scroll logic
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (resizingEventId) {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const xInContainer = e.clientX - containerRect.left + containerRef.current.scrollLeft - 160;
        const event = processedEvents.find(ev => ev.id === resizingEventId);
        if (event) {
          const startX = xScale(event.startTime);
          const newDuration = Math.max(1, Math.round(xScale.invert(xInContainer - startX)));
          if (newDuration !== event.duration) {
            updateTimelineEvent({ id: resizingEventId, duration: newDuration });
          }
        }
        return;
      }

      if (draggingEventId) {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const xInContainer = e.clientX - containerRect.left + containerRef.current.scrollLeft - 160 - dragOffset;
        const newStartTime = Math.max(0, Math.round(xScale.invert(xInContainer)));
        const event = processedEvents.find(ev => ev.id === draggingEventId);
        if (event && newStartTime !== event.startTime) {
          const delta = newStartTime - event.startTime;
          
          // Find cluster
          const getCluster = (id: string, events: TimelineEvent[]): Set<string> => {
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
          };
          
          const clusterIds = getCluster(draggingEventId, processedEvents);
          
          clusterIds.forEach(id => {
            const ev = processedEvents.find(e => e.id === id);
            if (ev) {
              updateTimelineEvent({ id, startTime: Math.max(0, (ev.startTime || 0) + delta) });
            }
          });
        }
        return;
      }

      if (!isDragging || !containerRef.current) return;
      
      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      containerRef.current.scrollLeft = scrollLeftStart - walk;
      setDragDistance(Math.abs(x - startX));
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      setResizingEventId(null);
      setDraggingEventId(null);
      setIsDragging(false);
    };

    if (isDragging || draggingEventId || resizingEventId) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, draggingEventId, resizingEventId, dragOffset, startX, scrollLeftStart, xScale, updateTimelineEvent, processedEvents]);

  // Update minimap state on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      
      if (maxScroll > 0) {
        setScrollRatio(scrollLeft / maxScroll);
      } else {
        setScrollRatio(0);
      }
      
      setViewportRatio(Math.min(1, clientWidth / scrollWidth));
    };

    // Initial calculation
    handleScroll();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [processedEvents, zoomLevel, showFilters]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Only allow left click
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    const isResizeHandle = target.closest('.resize-handle');
    const isCard = target.closest('.event-card');

    if (isEditMode && isResizeHandle) {
      const handle = isResizeHandle as HTMLElement;
      const eventId = handle.getAttribute('data-event-id');
      if (eventId) {
        setResizingEventId(eventId);
        e.stopPropagation();
        return;
      }
    }

    if (isEditMode && isCard) {
      const card = isCard as HTMLElement;
      const eventId = card.getAttribute('data-event-id');
      if (eventId) {
        setDraggingEventId(eventId);
        const rect = card.getBoundingClientRect();
        setDragOffset(e.clientX - rect.left);
        return;
      }
    }
    
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftStart(containerRef.current.scrollLeft);
    setDragDistance(0);
  };

  // Minimap interaction
  const handleMinimapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingMinimap(true);
    updateScrollFromMinimap(e);
  };

  const updateScrollFromMinimap = (e: MouseEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Find the minimap container
    const minimapTrack = document.getElementById('minimap-track');
    if (!minimapTrack) return;

    const rect = minimapTrack.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    
    // Calculate the center of the viewport on the minimap
    const viewportWidthOnMinimap = rect.width * viewportRatio;
    
    // Adjust x so that the click represents the center of the viewport, not the left edge
    let targetRatio = (x - viewportWidthOnMinimap / 2) / (rect.width - viewportWidthOnMinimap);
    
    // Clamp ratio between 0 and 1
    targetRatio = Math.max(0, Math.min(1, targetRatio));
    
    // Apply to container
    const { scrollWidth, clientWidth } = containerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    if (maxScroll > 0) {
      containerRef.current.scrollLeft = targetRatio * maxScroll;
    }
  };

  useEffect(() => {
    const handleMinimapMouseMove = (e: MouseEvent) => {
      if (isDraggingMinimap) {
        updateScrollFromMinimap(e);
      }
    };

    const handleMinimapMouseUp = () => {
      setIsDraggingMinimap(false);
    };

    if (isDraggingMinimap) {
      window.addEventListener('mousemove', handleMinimapMouseMove);
      window.addEventListener('mouseup', handleMinimapMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMinimapMouseMove);
      window.removeEventListener('mouseup', handleMinimapMouseUp);
    };
  }, [isDraggingMinimap, viewportRatio]);

  // Character tracks
  const activeCharacters = useMemo(() => {
    const charIds = new Set<string>();
    processedEvents.forEach(e => {
      Object.keys(e.characterActions || {}).forEach(id => charIds.add(id));
    });
    return characters.filter(c => charIds.has(c.id));
  }, [processedEvents, characters]);

  const trackHeight = 80;
  const headerHeight = 40;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-white text-stone-800">
      {/* Toolbar */}
      <div className="p-3 border-b border-stone-200 bg-white/80 backdrop-blur flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
            <Clock size={14} /> Visual Chronology
          </h3>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.2))}
              className="p-1.5 hover:bg-stone-100 rounded-md transition-colors text-stone-500"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono w-12 text-center text-stone-600">{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.2))}
              className="p-1.5 hover:bg-stone-100 rounded-md transition-colors text-stone-500"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
          </div>
          <div className="h-4 w-px bg-stone-200" />
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
              isEditMode 
                ? "bg-emerald-600 text-white shadow-inner" 
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            {isEditMode ? <Move size={14} /> : <Edit2 size={14} />}
            {isEditMode ? 'Edit Mode' : 'Scroll Mode'}
          </button>
          <div className="h-4 w-px bg-stone-200" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
              showFilters || selectedLocationIds.length > 0 || tagFilter.includedIds.length > 0 || tagFilter.excludedIds.length > 0
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-transparent"
            )}
          >
            <Filter size={14} />
            Filters
            {(selectedLocationIds.length > 0 || tagFilter.includedIds.length > 0 || tagFilter.excludedIds.length > 0) && (
              <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                {selectedLocationIds.length + tagFilter.includedIds.length + tagFilter.excludedIds.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400 italic">
          <Info size={12} />
          {isEditMode ? 'Drag cards to reposition' : 'Drag or scroll horizontally to navigate time'}
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-stone-200 bg-stone-50 overflow-hidden shrink-0"
          >
            <div className="p-4 flex flex-col gap-4">
              {/* Location Filter */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin size={12} /> Locations
                </label>
                <div className="flex flex-wrap gap-2">
                  {locations.map(loc => {
                    const isSelected = selectedLocationIds.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocationIds(prev => 
                            isSelected ? prev.filter(id => id !== loc.id) : [...prev, loc.id]
                          );
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                          isSelected 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                        )}
                      >
                        {loc.name}
                      </button>
                    );
                  })}
                  {locations.length === 0 && <span className="text-xs text-stone-400 italic">No locations available</span>}
                </div>
              </div>

              {/* Tag Filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TagIcon size={12} /> Tags
                  </label>
                  <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-md p-0.5">
                    <button
                      onClick={() => setTagFilter(prev => ({ ...prev, mode: 'OR' }))}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded transition-colors",
                        tagFilter.mode === 'OR' ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"
                      )}
                      title="Match ANY included tag"
                    >
                      OR
                    </button>
                    <button
                      onClick={() => setTagFilter(prev => ({ ...prev, mode: 'AND' }))}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded transition-colors",
                        tagFilter.mode === 'AND' ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"
                      )}
                      title="Match ALL included tags"
                    >
                      AND
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isIncluded = tagFilter.includedIds.includes(tag.id);
                    const isExcluded = tagFilter.excludedIds.includes(tag.id);
                    
                    return (
                      <div 
                        key={tag.id}
                        className={cn(
                          "flex items-center rounded-md border text-xs font-medium overflow-hidden transition-colors",
                          isIncluded ? "border-emerald-300 bg-emerald-50" : 
                          isExcluded ? "border-red-300 bg-red-50" : 
                          "border-stone-200 bg-white"
                        )}
                      >
                        <button
                          onClick={() => {
                            setTagFilter(prev => {
                              if (isIncluded) {
                                return { ...prev, includedIds: prev.includedIds.filter(id => id !== tag.id) };
                              } else {
                                return { 
                                  ...prev, 
                                  includedIds: [...prev.includedIds, tag.id],
                                  excludedIds: prev.excludedIds.filter(id => id !== tag.id)
                                };
                              }
                            });
                          }}
                          className={cn(
                            "px-2.5 py-1 hover:bg-stone-100 transition-colors border-r",
                            isIncluded ? "text-emerald-800 hover:bg-emerald-100 border-emerald-200" : 
                            isExcluded ? "text-stone-400 border-stone-200" : 
                            "text-stone-600 border-stone-200"
                          )}
                        >
                          {tag.name}
                        </button>
                        <button
                          onClick={() => {
                            setTagFilter(prev => {
                              if (isExcluded) {
                                return { ...prev, excludedIds: prev.excludedIds.filter(id => id !== tag.id) };
                              } else {
                                return { 
                                  ...prev, 
                                  excludedIds: [...prev.excludedIds, tag.id],
                                  includedIds: prev.includedIds.filter(id => id !== tag.id)
                                };
                              }
                            });
                          }}
                          className={cn(
                            "px-1.5 py-1 hover:bg-stone-100 transition-colors",
                            isExcluded ? "text-red-700 hover:bg-red-100" : "text-stone-400 hover:text-red-600"
                          )}
                          title={isExcluded ? "Remove exclusion" : "Exclude this tag (NOT)"}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {tags.length === 0 && <span className="text-xs text-stone-400 italic">No tags available</span>}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedLocationIds.length > 0 || tagFilter.includedIds.length > 0 || tagFilter.excludedIds.length > 0) && (
                <div className="flex justify-end pt-2 border-t border-stone-200/60">
                  <button
                    onClick={() => {
                      setSelectedLocationIds([]);
                      setTagFilter({ includedIds: [], excludedIds: [], mode: 'OR' });
                    }}
                    className="text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      <div 
        className={cn(
          "flex-1 overflow-auto custom-scrollbar select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )} 
        ref={containerRef}
        onMouseDown={handleMouseDown}
      >
        <div 
          style={{ 
            width: xScale.range()[1] + 160, 
            minHeight: '100%',
            position: 'relative',
          }}
          className="bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px]"
        >
          {/* Time Axis Header */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 h-10 flex items-center">
            <div className="sticky left-0 z-50 bg-white w-40 h-full border-r border-stone-200 shrink-0" />
            {xScale.ticks(timeRange[1] - timeRange[0]).map(tick => (
              <div 
                key={`tick-${tick}`}
                className="absolute border-l border-stone-200 h-full flex items-end pb-1 pl-1"
                style={{ left: xScale(tick) + 160 }}
              >
                <span className="text-[9px] font-mono text-stone-400">{tick}</span>
              </div>
            ))}
          </div>

          {/* All Events Track (Master Track) */}
          <div 
            className="relative border-b-2 border-stone-300 bg-stone-50/30 flex"
            style={{ height: Math.max(120, maxLevel * 45 + 40) }}
          >
            {/* Track Label */}
            <div className="sticky left-0 z-20 h-full w-40 bg-stone-100/95 backdrop-blur border-r border-stone-200 flex items-center px-4 gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center shrink-0">
                <Layers size={14} className="text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-stone-800 truncate">All Events</span>
                <span className="text-[9px] text-stone-400 uppercase tracking-tighter truncate">Master Track</span>
              </div>
            </div>

            {/* Grid Lines */}
            {xScale.ticks(timeRange[1] - timeRange[0]).map(tick => (
              <div 
                key={`grid-${tick}`}
                className="absolute top-0 bottom-0 border-l border-stone-200/50 pointer-events-none"
                style={{ left: xScale(tick) + 160 }}
              />
            ))}

            {/* All Events Stacking */}
            {processedEvents.map(event => {
              const start = xScale(event.startTime);
              const width = xScale(event.endTime) - start;
              const isHovered = hoveredEventId === event.id;

              return (
                <motion.div
                  key={`all-${event.id}`}
                  data-event-id={event.id}
                  className={cn(
                    "event-card absolute h-9 rounded border shadow-sm transition-all z-10 overflow-hidden group",
                    isHovered ? "ring-2 ring-emerald-500 z-40" : "z-10",
                    isEditMode ? "hover:border-emerald-400 cursor-move" : "cursor-pointer"
                  )}
                  style={{ 
                    left: xScale(event.startTime) + 160, 
                    width: width,
                    top: 20 + (event.level * 45),
                    backgroundColor: isHovered ? '#10b981' : '#ffffff',
                    borderColor: isHovered ? '#34d399' : '#e5e7eb'
                  }}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  onClick={() => {
                    if (!isEditMode && dragDistance < 5 && !draggingEventId) {
                      onEventClick(event.id, 'general');
                    }
                  }}
                >
                  <div className="px-2 py-1 h-full flex items-center">
                    <span className={cn(
                      "text-[10px] font-bold truncate",
                      isHovered ? "text-white" : "text-stone-800"
                    )}>
                      {event.title}
                    </span>
                  </div>
                  {isEditMode && (
                    <div 
                      className="resize-handle absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-emerald-400/30 transition-colors z-50 flex items-center justify-center group/handle"
                      data-event-id={event.id}
                    >
                      <div className="w-1 h-4 bg-emerald-500/50 rounded-full opacity-0 group-hover/handle:opacity-100" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Character Tracks */}
          <div className="relative">
            {activeCharacters.map((char, charIdx) => (
              <div 
                key={char.id} 
                className="relative border-b border-stone-100 group flex"
                style={{ height: trackHeight }}
              >
                {/* Track Label */}
                <div className="sticky left-0 z-20 h-full w-40 bg-white/95 backdrop-blur border-r border-stone-200 flex items-center px-4 gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center border border-stone-200 shrink-0">
                    <span className="text-xs font-bold text-stone-400">{char.name.charAt(0)}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-stone-800 truncate">{char.name}</span>
                    <span className="text-[9px] text-stone-400 uppercase tracking-tighter truncate">Track</span>
                  </div>
                </div>

                {/* Grid Lines */}
                {xScale.ticks(timeRange[1] - timeRange[0]).map(tick => (
                  <div 
                    key={`char-grid-${tick}`}
                    className="absolute top-0 bottom-0 border-l border-stone-100 pointer-events-none"
                    style={{ left: xScale(tick) + 160 }}
                  />
                ))}

                {/* Events for this character */}
                {processedEvents
                  .filter(e => e.characterActions && char.id in e.characterActions)
                  .map(event => {
                    const start = xScale(event.startTime);
                    const width = xScale(event.endTime) - start;
                    const isHovered = hoveredEventId === event.id;

                    return (
                      <motion.div
                        key={`${char.id}-${event.id}`}
                        data-event-id={event.id}
                        className={cn(
                          "event-card absolute top-4 h-10 rounded-lg border shadow-md transition-all z-10 overflow-hidden group",
                          isHovered ? "ring-2 ring-emerald-500 z-40" : "z-10",
                          isEditMode ? "hover:border-emerald-400 cursor-move" : "cursor-pointer"
                        )}
                        style={{ 
                          left: xScale(event.startTime) + 160, 
                          width: width,
                          backgroundColor: isHovered ? '#10b981' : '#f5f5f4',
                          borderColor: isHovered ? '#34d399' : '#e5e7eb'
                        }}
                        onMouseEnter={() => setHoveredEventId(event.id)}
                        onMouseLeave={() => setHoveredEventId(null)}
                        onClick={() => {
                          if (!isEditMode && dragDistance < 5 && !draggingEventId) {
                            onEventClick(event.id, 'characters', char.id);
                          }
                        }}
                      >
                        <div className="px-3 py-1 h-full flex flex-col justify-center">
                          <span className={cn(
                            "text-[10px] font-bold truncate",
                            isHovered ? "text-white" : "text-stone-800"
                          )}>
                            {event.title}
                          </span>
                          {width > 60 && (
                            <span className={cn(
                              "text-[8px] truncate opacity-60",
                              isHovered ? "text-emerald-100" : "text-stone-500"
                            )}>
                              {event.characterActions[char.id]}
                            </span>
                          )}
                        </div>
                        {isEditMode && (
                          <div 
                            className="resize-handle absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-emerald-400/30 transition-colors z-50 flex items-center justify-center group/handle"
                            data-event-id={event.id}
                          >
                            <div className="w-1 h-4 bg-emerald-500/50 rounded-full opacity-0 group-hover/handle:opacity-100" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            ))}

            {/* Global Events Track */}
            <div 
              className="relative border-b border-stone-100 h-20 flex"
            >
              <div className="sticky left-0 z-20 h-full w-40 bg-white/95 backdrop-blur border-r border-stone-200 flex items-center px-4 gap-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center border border-stone-200 shrink-0">
                  <Maximize2 size={14} className="text-stone-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-stone-800 truncate">Global</span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-tighter truncate">World</span>
                </div>
              </div>

              {processedEvents
                .filter(e => !e.characterActions || Object.keys(e.characterActions).length === 0)
                .map(event => {
                  const start = xScale(event.startTime);
                  const width = xScale(event.endTime) - start;
                  const isHovered = hoveredEventId === event.id;

                  return (
                    <div
                      key={`global-${event.id}`}
                      data-event-id={event.id}
                      className={cn(
                        "event-card absolute top-4 h-10 rounded-lg border border-dashed shadow-sm transition-all z-10 overflow-hidden group",
                        isHovered ? "bg-stone-100 border-stone-400 z-40" : "bg-stone-50/50 border-stone-200",
                        isEditMode ? "hover:border-emerald-400 cursor-move" : "cursor-pointer"
                      )}
                      style={{ 
                        left: xScale(event.startTime) + 160, 
                        width: width,
                      }}
                      onMouseEnter={() => setHoveredEventId(event.id)}
                      onMouseLeave={() => setHoveredEventId(null)}
                      onClick={() => {
                        if (!isEditMode && dragDistance < 5 && !draggingEventId) {
                          onEventClick(event.id, 'general');
                        }
                      }}
                    >
                      <div className="px-3 py-1 h-full flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-stone-400 truncate">{event.title}</span>
                      </div>
                      {isEditMode && (
                        <div 
                          className="resize-handle absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-emerald-400/30 transition-colors z-50 flex items-center justify-center group/handle"
                          data-event-id={event.id}
                        >
                          <div className="w-1 h-4 bg-emerald-500/50 rounded-full opacity-0 group-hover/handle:opacity-100" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Activity Curves (Background) */}
          <div className="absolute inset-0 pointer-events-none opacity-10 z-0 overflow-hidden">
            {activeCharacters.map((char, i) => {
              const charEvents = processedEvents.filter(e => e.characterActions && e.characterActions[char.id]);
              if (charEvents.length < 2) return null;

              const allEventsTrackHeight = Math.max(120, maxLevel * 45 + 40);
              const headerHeight = 40;
              const yOffset = headerHeight + allEventsTrackHeight;

              const line = d3.line<any>()
                .x(d => xScale(d.startTime) + 160)
                .y(d => yOffset + (i * trackHeight) + trackHeight - (d.importance * 10))
                .curve(d3.curveMonotoneX);

              return (
                <svg key={`curve-${char.id}`} className="absolute inset-0 w-full h-full">
                  <path 
                    d={line(charEvents) || ''} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="text-emerald-500"
                  />
                </svg>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover Preview Overlay */}
      <AnimatePresence>
        {hoveredEventId && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-96 bg-white/95 backdrop-blur-md border border-stone-200/80 rounded-2xl shadow-2xl p-5 pointer-events-none"
            >
              {(() => {
                const event = processedEvents.find(e => e.id === hoveredEventId);
                if (!event) return null;
                return (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-stone-900 text-sm tracking-tight pr-4">{event.title}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-stone-100/80 px-2 py-1 rounded-md text-stone-500 shrink-0">
                        {event.timestamp}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-stone-500 line-clamp-3 mb-4 leading-relaxed">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(event.characterActions || {}).map(id => {
                        const char = characters.find(c => c.id === id);
                        return char ? (
                          <span key={id} className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded-md shadow-sm">
                            {char.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </>
                );
              })()}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Minimap */}
      <div className="absolute bottom-6 right-6 z-50 w-64 h-16 bg-white/90 backdrop-blur-md border border-stone-200 rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/80 px-2 py-1 border-b border-stone-200 flex justify-between items-center">
          <span>Minimap</span>
          <span className="font-mono">{Math.round(scrollRatio * 100)}%</span>
        </div>
        <div 
          id="minimap-track"
          className="flex-1 relative cursor-pointer group"
          onMouseDown={handleMinimapMouseDown}
        >
          {/* Minimap Background/Events */}
          <div className="absolute inset-x-2 inset-y-1 opacity-40 pointer-events-none">
            {processedEvents.map(event => {
              const totalDuration = timeRange[1] - timeRange[0];
              if (totalDuration <= 0) return null;
              
              const leftPercent = ((event.startTime - timeRange[0]) / totalDuration) * 100;
              const widthPercent = Math.max(0.5, (event.duration / totalDuration) * 100);
              const topPercent = (event.level / 10) * 100; // Rough estimation
              
              return (
                <div
                  key={`mini-${event.id}`}
                  className="absolute bg-emerald-500 rounded-sm"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    top: `${Math.min(80, topPercent)}%`,
                    height: '20%',
                  }}
                />
              );
            })}
          </div>
          
          {/* Viewport Indicator */}
          <div 
            className="absolute top-0 bottom-0 bg-emerald-500/10 border-x border-emerald-500/50 transition-all duration-75 pointer-events-none group-hover:bg-emerald-500/20"
            style={{
              left: `${scrollRatio * (1 - viewportRatio) * 100}%`,
              width: `${viewportRatio * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};
