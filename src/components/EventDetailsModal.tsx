import React from 'react';
import { useStore } from '../store/StoreContext';
import { MapPin, X, Link as LinkIcon, Plus, Tag as TagIcon } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { SearchableSelect } from './SearchableSelect';
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

  const [localTitle, setLocalTitle] = React.useState('');
  const [localDescription, setLocalDescription] = React.useState('');
  const [localSequenceNumber, setLocalSequenceNumber] = React.useState('');
  const [localTimestamp, setLocalTimestamp] = React.useState('');

  React.useEffect(() => {
    if (event) {
      setLocalTitle(event.title || '');
      setLocalDescription(event.description || '');
      setLocalSequenceNumber((event.sequenceNumber || 0).toString());
      setLocalTimestamp(event.timestamp || '');
    }
  }, [event]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-stone-800">Event Details: {event.title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Row 1: Sequence Number and Timestamp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Sequence Number</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, sequenceNumber: (event.sequenceNumber || 0) - 1 } })}
                  className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 transition-colors font-bold"
                >
                  -1
                </button>
                <input
                  type="number"
                  value={localSequenceNumber}
                  onChange={(e) => setLocalSequenceNumber(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(localSequenceNumber) || 0;
                    if (val !== event.sequenceNumber) {
                      dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, sequenceNumber: val } });
                    }
                  }}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 text-sm font-bold text-center text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={() => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, sequenceNumber: (event.sequenceNumber || 0) + 1 } })}
                  className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 transition-colors font-bold"
                >
                  +1
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Timestamp</label>
              <input
                type="text"
                value={localTimestamp}
                onChange={(e) => setLocalTimestamp(e.target.value)}
                onBlur={() => {
                  if (localTimestamp !== event.timestamp) {
                    dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, timestamp: localTimestamp } });
                  }
                }}
                className="text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g., Day 1, 08:00 AM"
              />
            </div>
          </div>

          {/* Row 2: Event Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Event Title</label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                if (localTitle !== event.title) {
                  dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, title: localTitle } });
                }
              }}
              className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Row 3: Event Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Event Description</label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              onBlur={() => {
                if (localDescription !== event.description) {
                  dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, description: localDescription } });
                }
              }}
              className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              rows={3}
            />
          </div>

          {/* Row 4: Location and Characters */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Characters</label>
              <MultiSelectDropdown
                options={state.characters.filter(c => c.workId === state.activeWorkId).map(c => ({ id: c.id, title: c.name }))}
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
                placeholder="Select characters..."
              />
            </div>
          </div>

          {/* Row 5: Character Descriptions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Character Descriptions</label>
            <div className="space-y-2">
              {Object.keys(event.characterActions || {}).length === 0 ? (
                <div className="text-sm text-stone-500 italic p-3 bg-stone-50 rounded-lg border border-stone-100">
                  No characters selected. Select characters above to add their descriptions.
                </div>
              ) : (
                Object.entries(event.characterActions || {}).map(([charId, action]) => {
                  const character = state.characters.find(c => c.id === charId);
                  return (
                    <div key={charId} className="flex flex-col gap-1 p-3 bg-stone-50 rounded-lg border border-stone-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-stone-700 truncate">{character?.name || 'Unknown'}</span>
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
                })
              )}
            </div>
          </div>

          {/* Row 6: Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center">
              <TagIcon size={12} className="mr-1" /> Tags
            </label>
            <MultiSelectDropdown
              options={tags.map(t => ({ id: t.id, title: t.name, color: t.color }))}
              selectedIds={event.tagIds || []}
              onChange={(newIds) => dispatch({ type: 'UPDATE_TIMELINE_EVENT', payload: { id: event.id, tagIds: newIds } })}
              placeholder="Select tags..."
            />
          </div>

          {/* Row 7: Linked Events */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center">
              <LinkIcon size={12} className="mr-1" /> Linked Events
            </label>
            <MultiSelectDropdown
              options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
              selectedIds={event.linkedEventIds || []}
              onChange={(newIds) => {
                const oldIds = event.linkedEventIds || [];
                const addedIds = newIds.filter(id => !oldIds.includes(id));
                const removedIds = oldIds.filter(id => !newIds.includes(id));
                addedIds.forEach(id => dispatch({ type: 'TOGGLE_TIMELINE_EVENT_LINK', payload: { eventId: event.id, targetEventId: id } }));
                removedIds.forEach(id => dispatch({ type: 'TOGGLE_TIMELINE_EVENT_LINK', payload: { eventId: event.id, targetEventId: id } }));
              }}
              placeholder="+ Link another event..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
