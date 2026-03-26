import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Clock, Maximize2, ArrowRightToLine, Link as LinkIcon, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EditableInput, EditableTextarea, EVENT_COLORS } from './TimelineShared';
import { ConfirmDeleteButton } from '../ConfirmDeleteButton';
import { TimelineEvent, Character, Tag } from '../../store/types';

interface TimelineChronologyViewProps {
  groupedEvents: { sequence: number; events: TimelineEvent[] }[];
  filteredPoolEvents: TimelineEvent[];
  events: TimelineEvent[];
  characters: Character[];
  tags: Tag[];
  activeWorkId: string;
  highlightedEventId: string | null;
  isFilterActive: boolean;
  onDragEnd: (result: DropResult) => void;
  setSelectedEventId: (id: string | null) => void;
  updateTimelineEvent: (updates: Partial<TimelineEvent> & { id: string }) => void;
  updateTimelineEventCharacterAction: (eventId: string, characterId: string, action: string) => void;
  deleteTimelineEvent: (id: string) => void;
  handleNavigateToEvent: (eventId: string) => void;
}

export const TimelineChronologyView = React.memo(({
  groupedEvents,
  filteredPoolEvents,
  events,
  characters,
  tags,
  activeWorkId,
  highlightedEventId,
  isFilterActive,
  onDragEnd,
  setSelectedEventId,
  updateTimelineEvent,
  updateTimelineEventCharacterAction,
  deleteTimelineEvent,
  handleNavigateToEvent
}: TimelineChronologyViewProps) => {
  const [activeCharTabs, setActiveCharTabs] = useState<Record<string, string | null>>({});

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Droppable droppableId="timeline-list">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-stone-200 min-h-[200px]"
              >
                {groupedEvents.length === 0 ? (
                  <div className="text-center py-12 text-stone-500 italic bg-white rounded-xl border border-stone-200 shadow-sm relative z-10 ml-8">
                    No events found matching your filters.
                  </div>
                ) : (
                  groupedEvents.map((group, index) => (
                    // @ts-expect-error - React 19 type issue with Draggable key
                    <Draggable key={`group-${group.events[0].id}`} draggableId={group.events[0].id} index={index} isDragDisabled={isFilterActive}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn("relative pl-12", snapshot.isDragging && "opacity-80 z-50")}
                        >
                          {/* Timeline Node */}
                          <div {...provided.dragHandleProps} className="absolute left-4 top-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white bg-stone-800 shadow-sm z-10 flex items-center justify-center cursor-grab active:cursor-grabbing">
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
                                        onSave={(val) => updateTimelineEvent({ id: event.id, timestamp: val })}
                                        className="text-xs font-bold uppercase tracking-wider bg-transparent border-none p-0 focus:ring-0 w-full opacity-60 hover:opacity-100 transition-opacity"
                                        placeholder="Timestamp"
                                      />
                                    </div>
                                    <EditableInput
                                      type="text"
                                      value={event.title || ''}
                                      onSave={(val) => updateTimelineEvent({ id: event.id, title: val })}
                                      className="text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 w-full"
                                      placeholder="Event Title"
                                    />
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {Object.keys(event.characterActions || {}).map(charId => {
                                        const character = characters.find(c => c.id === charId);
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
                                      onClick={() => setSelectedEventId(event.id)}
                                      className="p-1.5 hover:bg-white/50 rounded-md text-stone-500"
                                      title="Edit Details"
                                    >
                                      <Maximize2 size={16} />
                                    </button>
                                    <button
                                      onClick={() => updateTimelineEvent({ id: event.id, status: 'pool' })}
                                      className="p-1.5 hover:bg-white/50 text-stone-400 hover:text-emerald-600 rounded-md transition-colors"
                                      title="Move to Pool"
                                    >
                                      <ArrowRightToLine size={16} />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                    {activeCharTabs[event.id] 
                                      ? `${characters.find(c => c.id === activeCharTabs[event.id])?.name}'s Action` 
                                      : 'Event Description'}
                                  </label>
                                  <EditableTextarea
                                    value={activeCharTabs[event.id] 
                                      ? (event.characterActions?.[activeCharTabs[event.id]!] || '') 
                                      : (event.description || '')}
                                    onSave={(val) => {
                                      if (activeCharTabs[event.id]) {
                                        updateTimelineEventCharacterAction(event.id, activeCharTabs[event.id]!, val);
                                      } else {
                                        updateTimelineEvent({ id: event.id, description: val });
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
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {events.length === 0 && (
            <div className="text-center py-12 text-stone-500 bg-white rounded-lg border border-stone-200 border-dashed">
              <Clock size={48} className="mx-auto mb-4 opacity-20" />
              <p>No events in the timeline yet.</p>
              <p className="text-sm mt-1">Add your first event above to start building your story's chronology.</p>
            </div>
          )}
        </div>

        {/* Event Pool Sidebar */}
        <div className="w-full md:w-80 bg-stone-50 border-t md:border-l border-stone-200 flex flex-col h-full shrink-0">
          <div className="p-4 border-b border-stone-200 bg-white flex justify-between items-center shrink-0">
            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
              <Layers size={16} className="text-stone-400" />
              Event Pool
            </h3>
            <span className="text-xs font-medium bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
              {filteredPoolEvents.length}
            </span>
          </div>
          <Droppable droppableId="pool-list">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
              >
                {filteredPoolEvents.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-sm italic">
                    Pool is empty.
                  </div>
                ) : (
                  filteredPoolEvents.map((event, index) => (
                    // @ts-expect-error - React 19 type issue with Draggable key
                    <Draggable key={event.id} draggableId={event.id} index={index} isDragDisabled={isFilterActive}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "bg-white p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing group",
                            snapshot.isDragging ? "border-emerald-500 shadow-md opacity-90 z-50" : "border-stone-200 hover:border-stone-300"
                          )}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-bold text-stone-800 truncate pr-2">{event.title || 'Untitled Event'}</h4>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setSelectedEventId(event.id)} className="p-1 text-stone-400 hover:text-stone-600"><Maximize2 size={12} /></button>
                              <ConfirmDeleteButton onConfirm={() => deleteTimelineEvent(event.id)} className="p-1" />
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-xs text-stone-500 line-clamp-2 mb-2">{event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(event.characterActions || {}).slice(0, 3).map(id => {
                              const char = characters.find(c => c.id === id);
                              return char ? (
                                <span key={id} className="text-[9px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                  {char.name}
                                </span>
                              ) : null;
                            })}
                            {(Object.keys(event.characterActions || {}).length) > 3 && (
                              <span className="text-[9px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                +{(Object.keys(event.characterActions || {}).length) - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
});
