import React from 'react';
import { useStore } from '../store/StoreContext';
import { MapPin, X, Link as LinkIcon, Plus, Tag as TagIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface EventDetailsModalProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailsModal({ eventId, onClose }: EventDetailsModalProps) {
  const { state, dispatch } = useStore();
  const event = state.timelineEvents.find(e => e.id === eventId);
  const locations = state.locations.filter(l => l.workId === state.activeWorkId);
  const allEvents = state.timelineEvents.filter(e => e.workId === state.activeWorkId);
  const tags = state.tags.filter(t => t.workId === state.activeWorkId);

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-stone-800">Event Details: {event.title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Sequence Number</label>
              <input
                type="number"
                value={event.sequenceNumber || 0}
                onChange={(e) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, sequenceNumber: parseInt(e.target.value) || 0 } })}
                className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Location</label>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-stone-400 shrink-0" />
                <select
                  value={event.locationId || ''}
                  onChange={(e) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, locationId: e.target.value || undefined } })}
                  className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">No Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center">
              <TagIcon size={12} className="mr-1" /> Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {event.tagIds?.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <div key={tagId} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border", tag.color || 'bg-stone-100 text-stone-800 border-stone-200')}>
                      <span className="truncate max-w-[150px]">{tag.name}</span>
                      <button
                        onClick={() => {
                          const newTagIds = event.tagIds?.filter(id => id !== tagId) || [];
                          dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, tagIds: newTagIds } });
                        }}
                        className="opacity-60 hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="relative">
                <select
                  className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const newTagIds = [...(event.tagIds || []), e.target.value];
                      dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, tagIds: newTagIds } });
                    }
                  }}
                >
                  <option value="">+ Add tag...</option>
                  {tags
                    .filter(t => !event.tagIds?.includes(t.id))
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                <Plus size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Linked Events */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center">
              <LinkIcon size={12} className="mr-1" /> Linked Events
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {event.linkedEventIds?.map(linkedId => {
                  const linkedEvent = allEvents.find(e => e.id === linkedId);
                  if (!linkedEvent) return null;
                  return (
                    <div key={linkedId} className="flex items-center gap-1 bg-stone-100 border border-stone-200 px-2 py-1 rounded-md text-xs">
                      <span className="font-medium text-stone-700 truncate max-w-[150px]">{linkedEvent.title}</span>
                      <button
                        onClick={() => dispatch({ type: 'TOGGLE_TIMELINE_EVENT_LINK', payload: { eventId: event.id, targetEventId: linkedId } })}
                        className="text-stone-400 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="relative">
                <select
                  className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      dispatch({ type: 'TOGGLE_TIMELINE_EVENT_LINK', payload: { eventId: event.id, targetEventId: e.target.value } });
                    }
                  }}
                >
                  <option value="">+ Link another event...</option>
                  {allEvents
                    .filter(e => e.id !== event.id && !event.linkedEventIds?.includes(e.id))
                    .map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                </select>
                <Plus size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Character Descriptions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Character Descriptions</label>
            <div className="space-y-2">
              {Object.entries(event.characterActions || {}).map(([charId, action]) => {
                const character = state.characters.find(c => c.id === charId);
                return (
                  <div key={charId} className="flex flex-col gap-1 p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-stone-700 truncate">{character?.name || 'Unknown'}</span>
                      <button
                        onClick={() => {
                          dispatch({ type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION', payload: { eventId: event.id, characterId: charId, action: 'DELETE_ACTION' } });
                        }}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <textarea
                      value={action || ''}
                      onChange={(e) => {
                        dispatch({ type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION', payload: { eventId: event.id, characterId: charId, action: e.target.value } });
                      }}
                      className="text-sm bg-white border border-stone-200 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                      placeholder={`What is ${character?.name || 'this character'} doing?`}
                      rows={2}
                    />
                  </div>
                );
              })}
              <select
                className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    dispatch({ type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION', payload: { eventId: event.id, characterId: e.target.value, action: '' } });
                  }
                }}
              >
                <option value="">Add Character...</option>
                {state.characters
                  .filter(c => c.workId === state.activeWorkId && !event.characterActions?.[c.id])
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
