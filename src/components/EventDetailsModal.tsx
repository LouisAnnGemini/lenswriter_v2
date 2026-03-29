import React, { useState, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { MapPin, X, Link as LinkIcon, Tag as TagIcon, Clock, Users, FileText, Network, MoreHorizontal, Trash2, ArrowRightToLine } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { cn } from '../lib/utils';

interface EventDetailsModalProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailsModal({ eventId, onClose }: EventDetailsModalProps) {
  const { 
    timelineEvents, 
    locations, 
    tags, 
    characters, 
    activeWorkId, 
    updateTimelineEvent, 
    updateTimelineEventRelations, 
    updateTimelineEventCharacterAction, 
    toggleTimelineEventLink,
    deleteTimelineEvent
  } = useStore(useShallow(state => ({
    timelineEvents: state.timelineEvents,
    locations: state.locations,
    tags: state.tags,
    characters: state.characters,
    activeWorkId: state.activeWorkId,
    updateTimelineEvent: state.updateTimelineEvent,
    updateTimelineEventRelations: state.updateTimelineEventRelations,
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction,
    toggleTimelineEventLink: state.toggleTimelineEventLink,
    deleteTimelineEvent: state.deleteTimelineEvent
  })));

  const event = timelineEvents.find(e => e.id === eventId);
  const workLocations = locations.filter(l => l.workId === activeWorkId);
  const allEvents = timelineEvents.filter(e => e.workId === activeWorkId);
  const workTags = tags.filter(t => t.workId === activeWorkId);

  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [localTimestamp, setLocalTimestamp] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'characters' | 'relations'>('general');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (event) {
      setLocalTitle(event.title || '');
      setLocalDescription(event.description || '');
      setLocalTimestamp(event.timestamp || '');
    }
  }, [event]);

  if (!event) return null;

  const relationCount = (event.beforeIds?.length || 0) + (event.afterIds?.length || 0) + (event.simultaneousIds?.length || 0) + (event.linkedEventIds?.length || 0);
  const characterCount = Object.keys(event.characterActions || {}).length;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className="p-6 pb-0 border-b border-stone-100 relative bg-white z-20">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-8">
               <input
                 type="text"
                 value={localTitle}
                 onChange={(e) => setLocalTitle(e.target.value)}
                 onBlur={() => {
                   if (localTitle !== event.title) updateTimelineEvent({ id: event.id, title: localTitle });
                 }}
                 className="text-2xl font-bold text-stone-800 bg-transparent border-none p-0 focus:ring-0 w-full placeholder-stone-300 focus:outline-none"
                 placeholder="Untitled Event"
               />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)} 
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-20">
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2 transition-colors"
                        onClick={() => { updateTimelineEvent({ id: event.id, status: 'pool' }); onClose(); }}
                      >
                        <ArrowRightToLine size={16} /> Move to Pool
                      </button>
                      <button 
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        onClick={() => { deleteTimelineEvent(event.id); onClose(); }}
                      >
                        <Trash2 size={16} /> Delete Event
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Timestamp Badge */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/50 transition-colors focus-within:ring-2 focus-within:ring-stone-500/20">
              <Clock size={14} className="text-stone-500" />
              <input
                type="text"
                value={localTimestamp}
                onChange={(e) => setLocalTimestamp(e.target.value)}
                onBlur={() => {
                  if (localTimestamp !== event.timestamp) updateTimelineEvent({ id: event.id, timestamp: localTimestamp });
                }}
                className="bg-transparent border-none p-0 w-28 focus:ring-0 text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none"
                placeholder="Add time..."
              />
            </div>

            {/* Location Badge */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/50 transition-colors focus-within:ring-2 focus-within:ring-stone-500/20">
              <MapPin size={14} className="text-stone-500" />
              <select
                value={event.locationId || ''}
                onChange={(e) => updateTimelineEvent({ id: event.id, locationId: e.target.value || undefined })}
                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-stone-700 focus:outline-none appearance-none cursor-pointer pr-4"
                style={{ backgroundImage: 'none' }}
              >
                <option value="">No Location</option>
                {workLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Tags Badge */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/50 transition-colors min-w-[140px]">
              <TagIcon size={14} className="text-stone-500 shrink-0" />
              <div className="flex-1 -my-1.5 [&>div>div:first-child]:border-none [&>div>div:first-child]:bg-transparent [&>div>div:first-child]:min-h-0 [&>div>div:first-child]:p-0 [&>div>div:first-child]:gap-1.5">
                <MultiSelectDropdown
                  options={workTags.map(t => ({ id: t.id, title: t.name, color: t.color }))}
                  selectedIds={event.tagIds || []}
                  onChange={(newIds) => updateTimelineEvent({ id: event.id, tagIds: newIds })}
                  placeholder="Add tags..."
                />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-6 border-b border-stone-200">
            <button 
              className={cn("pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", activeTab === 'general' ? "border-stone-800 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300")}
              onClick={() => setActiveTab('general')}
            >
              <FileText size={16} /> Details
            </button>
            <button 
              className={cn("pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", activeTab === 'characters' ? "border-stone-800 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300")}
              onClick={() => setActiveTab('characters')}
            >
              <Users size={16} /> Characters
              {characterCount > 0 && (
                <span className={cn("py-0.5 px-2 rounded-full text-[10px]", activeTab === 'characters' ? "bg-stone-200 text-stone-800" : "bg-stone-100 text-stone-600")}>
                  {characterCount}
                </span>
              )}
            </button>
            <button 
              className={cn("pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", activeTab === 'relations' ? "border-stone-800 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300")}
              onClick={() => setActiveTab('relations')}
            >
              <Network size={16} /> Relations
              {relationCount > 0 && (
                <span className={cn("py-0.5 px-2 rounded-full text-[10px]", activeTab === 'relations' ? "bg-stone-200 text-stone-800" : "bg-stone-100 text-stone-600")}>
                  {relationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/50">
          {activeTab === 'general' && (
            <div className="h-full flex flex-col">
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                onBlur={() => {
                  if (localDescription !== event.description) {
                    updateTimelineEvent({ id: event.id, description: localDescription });
                  }
                }}
                className="flex-1 min-h-[300px] text-base leading-relaxed bg-transparent border-none p-0 w-full focus:ring-0 resize-none text-stone-700 placeholder-stone-400 focus:outline-none"
                placeholder="Write the event description here..."
              />
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Involved Characters</label>
                <MultiSelectDropdown
                  options={characters.filter(c => c.workId === activeWorkId).map(c => ({ id: c.id, title: c.name }))}
                  selectedIds={Object.keys(event.characterActions || {})}
                  onChange={(newIds) => {
                    const currentActions = event.characterActions || {};
                    Object.keys(currentActions).forEach(id => {
                      if (!newIds.includes(id)) updateTimelineEventCharacterAction(event.id, id, 'DELETE_ACTION');
                    });
                    newIds.forEach(id => {
                      if (!(id in currentActions)) updateTimelineEventCharacterAction(event.id, id, '');
                    });
                  }}
                  placeholder="Select characters to add their actions..."
                />
              </div>

              <div className="space-y-4">
                {characterCount === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <Users size={32} className="mx-auto text-stone-300 mb-3" />
                    <h4 className="text-sm font-medium text-stone-600 mb-1">No characters involved</h4>
                    <p className="text-xs text-stone-400">Select characters above to describe what they are doing in this event.</p>
                  </div>
                ) : (
                  Object.entries(event.characterActions || {}).map(([charId, action]) => {
                    const character = characters.find(c => c.id === charId);
                    return (
                      <div key={charId} className="flex gap-4 p-5 bg-white rounded-xl border border-stone-200 shadow-sm group transition-all hover:shadow-md">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                          <span className="text-sm font-bold text-stone-500">{character?.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-stone-800">{character?.name || 'Unknown'}</span>
                            <button 
                              onClick={() => updateTimelineEventCharacterAction(event.id, charId, 'DELETE_ACTION')}
                              className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove character"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <textarea
                            value={action || ''}
                            onChange={(e) => updateTimelineEventCharacterAction(event.id, charId, e.target.value)}
                            className="text-sm bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-transparent hover:border-stone-200 focus:border-stone-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-stone-500/20 resize-none transition-all"
                            placeholder={`What is ${character?.name || 'this character'} doing?`}
                            rows={2}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'relations' && (
            <div className="space-y-8">
              {/* Logical Sequence */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Network size={16} className="text-stone-600" /> Logical Sequence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Before This Event</label>
                    <MultiSelectDropdown
                      options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                      selectedIds={event.beforeIds || []}
                      onChange={(newIds) => updateTimelineEventRelations(event.id, newIds, event.afterIds || [], event.simultaneousIds || [])}
                      placeholder="Select events..."
                    />
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Simultaneous</label>
                    <MultiSelectDropdown
                      options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                      selectedIds={event.simultaneousIds || []}
                      onChange={(newIds) => updateTimelineEventRelations(event.id, event.beforeIds || [], event.afterIds || [], newIds)}
                      placeholder="Select events..."
                    />
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">After This Event</label>
                    <MultiSelectDropdown
                      options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                      selectedIds={event.afterIds || []}
                      onChange={(newIds) => updateTimelineEventRelations(event.id, event.beforeIds || [], newIds, event.simultaneousIds || [])}
                      placeholder="Select events..."
                    />
                  </div>
                </div>
              </div>

              {/* Linked Events */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <LinkIcon size={16} className="text-stone-600" /> Linked Events
                </h4>
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <p className="text-xs text-stone-500 mb-4">Link this event to other related events (e.g., cause and effect, thematic connection).</p>
                  <MultiSelectDropdown
                    options={allEvents.filter(e => e.id !== event.id).map(e => ({ id: e.id, title: e.title }))}
                    selectedIds={event.linkedEventIds || []}
                    onChange={(newIds) => {
                      const oldIds = event.linkedEventIds || [];
                      const addedIds = newIds.filter(id => !oldIds.includes(id));
                      const removedIds = oldIds.filter(id => !newIds.includes(id));
                      addedIds.forEach(id => toggleTimelineEventLink(event.id, id));
                      removedIds.forEach(id => toggleTimelineEventLink(event.id, id));
                    }}
                    placeholder="+ Link another event..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
