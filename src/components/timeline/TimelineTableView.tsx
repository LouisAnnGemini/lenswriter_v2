import React from 'react';
import { Maximize2, ArrowRightToLine, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EditableInput, InlineMultiSelect, EVENT_COLORS, getRandomColor } from './TimelineShared';
import { ConfirmDeleteButton } from '../ConfirmDeleteButton';
import { TimelineEvent, Character, Tag } from '../../store/types';

interface TimelineTableViewProps {
  groupedAllEvents: { sequence: number; events: TimelineEvent[] }[];
  allEvents: TimelineEvent[];
  characters: Character[];
  tags: Tag[];
  activeWorkId: string;
  highlightedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  updateTimelineEvent: (updates: Partial<TimelineEvent> & { id: string }) => void;
  updateTimelineEventRelations: (eventId: string, beforeIds: string[], afterIds: string[], simultaneousIds: string[]) => void;
  deleteTimelineEvent: (id: string) => void;
  addTag: (tag: Omit<Tag, 'id'>) => string;
}

export const TimelineTableView = React.memo(({
  groupedAllEvents,
  allEvents,
  characters,
  tags,
  activeWorkId,
  highlightedEventId,
  setSelectedEventId,
  updateTimelineEvent,
  updateTimelineEventRelations,
  deleteTimelineEvent,
  addTag
}: TimelineTableViewProps) => {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden min-w-[800px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-4 py-3 w-32">Timestamp</th>
              <th className="px-4 py-3 w-64">Event</th>
              <th className="px-4 py-3 w-48">Characters</th>
              <th className="px-4 py-3 w-48">Tags</th>
              <th className="px-4 py-3 w-32">Before</th>
              <th className="px-4 py-3 w-32">Simultaneous</th>
              <th className="px-4 py-3 w-32">After</th>
              <th className="px-4 py-3 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {groupedAllEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-stone-500 italic">
                  No events found matching your filters.
                </td>
              </tr>
            ) : (
              groupedAllEvents.map((group) => (
                <React.Fragment key={`group-${group.events[0].id}`}>
                  {group.events.map((event, idx) => (
                    <tr 
                      key={event.id} 
                      id={`event-${event.id}`}
                      onDoubleClick={() => setSelectedEventId(event.id)}
                      className={cn(
                        "border-b border-stone-100 hover:bg-stone-50 transition-colors group",
                        idx === 0 && group.events.length > 1 ? "bg-stone-50/30" : "",
                        highlightedEventId === event.id && "bg-emerald-50",
                        event.status === 'pool' && "opacity-60"
                      )}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center">
                          {idx > 0 && <span className="text-stone-300 text-[10px] mr-1">↳</span>}
                          <EditableInput
                            type="text"
                            value={event.timestamp || ''}
                            onSave={(val) => updateTimelineEvent({ id: event.id, timestamp: val })}
                            className="w-full bg-transparent border-none p-0 text-xs font-medium text-stone-500 focus:ring-0"
                            placeholder="Time..."
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col">
                          <EditableInput
                            type="text"
                            value={event.title || ''}
                            onSave={(val) => updateTimelineEvent({ id: event.id, title: val })}
                            className="w-full bg-transparent border-none p-0 text-sm font-semibold text-stone-800 focus:ring-0"
                            placeholder="Event title..."
                          />
                          <EditableInput
                            type="text"
                            value={event.description || ''}
                            onSave={(val) => updateTimelineEvent({ id: event.id, description: val })}
                            className="w-full bg-transparent border-none p-0 text-xs text-stone-500 mt-0.5 focus:ring-0"
                            placeholder="Add description..."
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top relative">
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
                      </td>
                      <td className="px-4 py-3 align-top">
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
                      </td>
                      <td className="px-4 py-3 align-top">
                        <InlineMultiSelect
                          options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                          selectedIds={event.beforeIds || []}
                          onChange={(newIds) => updateTimelineEventRelations(event.id, newIds, event.afterIds || [], event.simultaneousIds || [])}
                          placeholder="Add..."
                          className="z-50"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <InlineMultiSelect
                          options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                          selectedIds={event.simultaneousIds || []}
                          onChange={(newIds) => updateTimelineEventRelations(event.id, event.beforeIds || [], event.afterIds || [], newIds)}
                          placeholder="Add..."
                          className="z-50"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <InlineMultiSelect
                          options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                          selectedIds={event.afterIds || []}
                          onChange={(newIds) => updateTimelineEventRelations(event.id, event.beforeIds || [], newIds, event.simultaneousIds || [])}
                          placeholder="Add..."
                          className="z-50"
                        />
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedEventId(event.id)} className="p-1 text-stone-400 hover:text-stone-600"><Maximize2 size={14} /></button>
                          <button onClick={() => updateTimelineEvent({ id: event.id, status: event.status === 'pool' ? 'timeline' : 'pool' })} className="p-1 text-stone-400 hover:text-emerald-600" title={event.status === 'pool' ? "Move to Timeline" : "Move to Pool"}><ArrowRightToLine size={14} /></button>
                          <ConfirmDeleteButton onConfirm={() => deleteTimelineEvent(event.id)} className="p-1" />
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
    </div>
  );
});
