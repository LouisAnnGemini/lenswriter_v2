import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Character } from '../store/types';
import { Link as LinkIcon, Unlink, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { EventDetailsModal } from './EventDetailsModal';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { AutoResizeTextarea } from './AutoResizeTextarea';

export function EventPoolPanel({ documentId, onClose }: { documentId: string, onClose: () => void }) {
  const { 
    activeWorkId, 
    timelineEvents, 
    scenes, 
    characters, 
    toggleSceneEvent,
    updateScene,
    updateTimelineEventCharacterAction
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    timelineEvents: state.timelineEvents,
    scenes: state.scenes,
    characters: state.characters,
    toggleSceneEvent: state.toggleSceneEvent,
    updateScene: state.updateScene,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction
  })));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const events = timelineEvents.filter(e => e.workId === activeWorkId);
  const scene = scenes.find(s => s.id === documentId);

  const linkedEvents = events.filter(e => scene?.linkedEventIds?.includes(e.id));

  const toggleEventLink = (eventId: string) => {
    if (!scene) return;
    toggleSceneEvent(scene.id, eventId);
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Quick Link Events */}
        <div>
          <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center">
            <LinkIcon size={12} className="mr-1.5" />
            Quick Link Events
          </h4>
          <MultiSelectDropdown
            options={events.map(e => ({ id: e.id, title: e.title }))}
            selectedIds={scene.linkedEventIds || []}
            onChange={(ids) => updateScene({ id: scene.id, linkedEventIds: ids })}
            placeholder="Select events..."
          />
        </div>

        {/* Character Actions */}
        {(scene.linkedEventIds?.length > 0) && (
          <div>
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center">
              Character Actions
            </h4>
            <div className="space-y-4 bg-white border border-stone-200 rounded-lg p-3 shadow-sm">
              {(() => {
                const sceneCharIds = scene.characterIds || [];
                const eventCharIds = Array.from(new Set(linkedEvents.flatMap(e => Object.keys(e.characterActions))));
                const allRelevantCharIds = Array.from(new Set([...sceneCharIds, ...eventCharIds]));
                
                return allRelevantCharIds.map(charId => {
                  const char = characters.find(c => c.id === charId);
                  if (!char) return null;
                  
                  const isInScene = sceneCharIds.includes(charId);
                  const hasAction = linkedEvents.some(e => charId in e.characterActions);
                  if (!isInScene && !hasAction) return null;

                  return (
                    <div key={charId} className="flex flex-col gap-2 text-xs border-b border-stone-100 last:border-0 pb-3 last:pb-0">
                      <span className={cn(
                        "font-semibold truncate",
                        isInScene ? "text-stone-900" : "text-stone-400 italic"
                      )} title={char.name}>
                        {char.name}
                      </span>
                      <div className="flex flex-col gap-2">
                        {linkedEvents.map((event) => (
                          <div key={event.id} className="flex flex-col gap-1 group/action">
                            <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded w-fit truncate max-w-full" title={event.title}>
                              {event.title}
                            </span>
                            <AutoResizeTextarea
                              value={event.characterActions[charId] || ''}
                              placeholder="Add action..."
                              onChange={(e: any) => {
                                updateTimelineEventCharacterAction(event.id, charId, e.target.value);
                              }}
                              className="w-full bg-white border border-stone-200 rounded p-1.5 text-stone-600 focus:ring-1 focus:ring-emerald-500 resize-none overflow-hidden min-h-[2rem] placeholder:text-stone-300 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Linked Events */}
        <div>
          <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center">
            <LinkIcon size={12} className="mr-1.5" />
            Edit Linked Events ({linkedEvents.length})
          </h4>
          <div className="space-y-2">
            {linkedEvents.map(event => {
              return (
                <div key={event.id} className="bg-white border border-emerald-200 rounded-lg p-3 shadow-sm relative group">
                  <div className="font-medium text-sm text-stone-900 mb-1 pr-12">{event.title}</div>
                  <div className="text-xs text-stone-500 line-clamp-2">{event.description}</div>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </div>
  );
}
