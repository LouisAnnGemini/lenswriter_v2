import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Character } from '../store/StoreContext';
import { Clock, Link as LinkIcon, Unlink, Search, X, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { EventDetailsModal } from './EventDetailsModal';

export function EventPoolPanel({ documentId, onClose }: { documentId: string, onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const activeWorkId = state.activeWorkId;
  const events = state.timelineEvents.filter(e => e.workId === activeWorkId);
  const scene = state.scenes.find(s => s.id === documentId);

  const filteredEvents = events.filter(e => 
    (e.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes((searchTerm || '').toLowerCase()))
  );

  const linkedEvents = filteredEvents.filter(e => scene?.linkedEventIds?.includes(e.id));
  const unlinkedEvents = filteredEvents.filter(e => !scene?.linkedEventIds?.includes(e.id));

  const toggleEventLink = (eventId: string) => {
    if (!scene) return;
    dispatch({
      type: 'TOGGLE_SCENE_EVENT',
      payload: { sceneId: scene.id, eventId }
    });
  };

  if (!scene) {
    return (
      <div className="flex flex-col h-full p-4 items-center justify-center text-stone-500 text-sm text-center">
        Event Pool is only available when editing a scene.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {selectedEventId && (
        <EventDetailsModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
      )}
      <div className="p-4 border-b border-stone-200 bg-white">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Linked Events */}
        <div>
          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center">
            <LinkIcon size={12} className="mr-1.5" />
            Linked to Scene ({linkedEvents.length})
          </h4>
          <div className="space-y-2">
            {linkedEvents.map(event => {
              const eventCharacters = Object.keys(event.characterActions).map(charId => 
                state.characters.find(c => c.id === charId)
              ).filter(Boolean) as Character[];

              return (
                <div key={event.id} className="bg-white border border-emerald-200 rounded-lg p-3 shadow-sm relative group">
                  <div className="font-medium text-sm text-stone-900 mb-1 pr-12">{event.title}</div>
                  <div className="text-xs text-stone-500 line-clamp-2">{event.description}</div>
                  
                  {eventCharacters.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {eventCharacters.map(char => (
                        <div key={char.id} className="text-[10px] text-stone-600 bg-stone-50 p-1 rounded">
                          <span className="font-semibold">{char.name}:</span> {event.characterActions[char.id]}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedEventId(event.id)}
                      className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Edit event"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleEventLink(event.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="Unlink from scene"
                    >
                      <Unlink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {linkedEvents.length === 0 && (
              <div className="text-xs text-stone-400 italic">No events linked yet.</div>
            )}
          </div>
        </div>

        {/* Unlinked Events */}
        <div>
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center">
            <Unlink size={12} className="mr-1.5" />
            Available Events ({unlinkedEvents.length})
          </h4>
          <div className="space-y-2">
            {unlinkedEvents.map(event => (
              <div key={event.id} className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm relative group hover:border-emerald-200 transition-colors">
                <div className="font-medium text-sm text-stone-900 mb-1 pr-12">{event.title}</div>
                <div className="text-xs text-stone-500 line-clamp-2">{event.description}</div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedEventId(event.id)}
                    className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    title="Edit event"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleEventLink(event.id)}
                    className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    title="Link to scene"
                  >
                    <LinkIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
            {unlinkedEvents.length === 0 && (
              <div className="text-xs text-stone-400 italic">No available events.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
