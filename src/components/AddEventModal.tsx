import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, Plus, Tag as TagIcon, Users, MapPin, Link as LinkIcon, Clock, FileText, Network } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface AddEventModalProps {
  onClose: () => void;
}

export function AddEventModal({ onClose }: AddEventModalProps) {
  const { 
    activeWorkId, 
    locations: allLocations, 
    characters: allCharacters, 
    tags: allTags, 
    timelineEvents: allTimelineEvents,
    addTimelineEvent,
    toggleTimelineEventLink,
    toggleTimelineEventHorizontal,
    toggleTimelineEventVertical
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    locations: state.locations,
    characters: state.characters,
    tags: state.tags,
    timelineEvents: state.timelineEvents,
    addTimelineEvent: state.addTimelineEvent,
    toggleTimelineEventLink: state.toggleTimelineEventLink,
    toggleTimelineEventHorizontal: state.toggleTimelineEventHorizontal,
    toggleTimelineEventVertical: state.toggleTimelineEventVertical
  })));

  const [title, setTitle] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startTime, setStartTime] = useState<number | ''>('');
  const [duration, setDuration] = useState(1);
  const [importance, setImportance] = useState(3);
  const [characterActions, setCharacterActions] = useState<Record<string, string>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>([]);
  const [horizontalIds, setHorizontalIds] = useState<string[]>([]);
  const [verticalIds, setVerticalIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'general' | 'characters' | 'relations'>('general');

  const locations = allLocations.filter(l => l.workId === activeWorkId);
  const characters = allCharacters.filter(c => c.workId === activeWorkId);
  const tags = allTags.filter(t => t.workId === activeWorkId);
  const allEvents = allTimelineEvents.filter(e => e.workId === activeWorkId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && timestamp.trim() && activeWorkId) {
      const newEventId = uuidv4();
      
      addTimelineEvent({ 
        id: newEventId,
        workId: activeWorkId, 
        title: title.trim(), 
        timestamp: timestamp.trim(),
        description: description.trim(),
        locationId: locationId || undefined,
        startTime: startTime === '' ? undefined : startTime,
        duration,
        importance,
        characterActions,
        tagIds: selectedTagIds,
        horizontalIds: [],
        verticalIds: [],
        linkedEventIds: []
      });

      linkedEventIds.forEach(targetId => {
        toggleTimelineEventLink(newEventId, targetId);
      });
      horizontalIds.forEach(targetId => {
        toggleTimelineEventHorizontal(newEventId, targetId);
      });
      verticalIds.forEach(targetId => {
        toggleTimelineEventVertical(newEventId, targetId);
      });

      onClose();
    }
  };

  const relationCount = linkedEventIds.length + horizontalIds.length + verticalIds.length;
  const characterCount = Object.keys(characterActions).length;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className="p-6 pb-0 border-b border-stone-100 relative bg-white z-20">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 mr-8">
               <input
                 type="text"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="text-2xl font-bold text-stone-800 bg-transparent border-none p-0 focus:ring-0 w-full placeholder-stone-300 focus:outline-none"
                 placeholder="Event Title *"
                 autoFocus
               />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Timestamp Badge */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/50 transition-colors focus-within:ring-2 focus-within:ring-emerald-500/20">
              <Clock size={14} className="text-stone-500" />
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="bg-transparent border-none p-0 w-28 focus:ring-0 text-sm font-medium text-stone-700 placeholder-stone-400 focus:outline-none"
                placeholder="Timestamp *"
              />
            </div>

            {/* Location Badge */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/50 transition-colors focus-within:ring-2 focus-within:ring-emerald-500/20">
              <MapPin size={14} className="text-stone-500" />
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-stone-700 focus:outline-none appearance-none cursor-pointer pr-4"
                style={{ backgroundImage: 'none' }}
              >
                <option value="">No Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Tags Badge */}
            <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/50 transition-colors min-w-[140px]">
              <TagIcon size={14} className="text-stone-500 shrink-0" />
              <div className="flex-1 -my-1.5 [&>div>div:first-child]:border-none [&>div>div:first-child]:bg-transparent [&>div>div:first-child]:min-h-0 [&>div>div:first-child]:p-0 [&>div>div:first-child]:gap-1.5">
                <MultiSelectDropdown
                  options={tags.map(t => ({ id: t.id, title: t.name, color: t.color }))}
                  selectedIds={selectedTagIds}
                  onChange={setSelectedTagIds}
                  placeholder="Add tags..."
                />
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-6 border-b border-stone-200">
            <button 
              className={cn("pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", activeTab === 'general' ? "border-emerald-500 text-emerald-700" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300")}
              onClick={() => setActiveTab('general')}
            >
              <FileText size={16} /> Details
            </button>
            <button 
              className={cn("pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", activeTab === 'characters' ? "border-emerald-500 text-emerald-700" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300")}
              onClick={() => setActiveTab('characters')}
            >
              <Users size={16} /> Characters
              {characterCount > 0 && (
                <span className={cn("py-0.5 px-2 rounded-full text-[10px]", activeTab === 'characters' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600")}>
                  {characterCount}
                </span>
              )}
            </button>
            <button 
              className={cn("pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors", activeTab === 'relations' ? "border-emerald-500 text-emerald-700" : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300")}
              onClick={() => setActiveTab('relations')}
            >
              <Network size={16} /> Relations
              {relationCount > 0 && (
                <span className={cn("py-0.5 px-2 rounded-full text-[10px]", activeTab === 'relations' ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600")}>
                  {relationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-50/50">
          {activeTab === 'general' && (
            <div className="h-full flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Start Time</label>
                  <input
                    type="number"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="Pool"
                  />
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Duration</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    min="1"
                  />
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-2">Importance (1-5)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setImportance(val)}
                        className={cn(
                          "w-8 h-8 rounded-full text-xs font-bold transition-all",
                          importance === val 
                            ? "bg-emerald-500 text-white shadow-md scale-110" 
                            : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 min-h-[200px] text-base leading-relaxed bg-transparent border-none p-0 w-full focus:ring-0 resize-none text-stone-700 placeholder-stone-400 focus:outline-none"
                placeholder="Write the event description here..."
              />
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Involved Characters</label>
                <MultiSelectDropdown
                  options={characters.map(c => ({ id: c.id, title: c.name }))}
                  selectedIds={Object.keys(characterActions)}
                  onChange={(newIds) => {
                    const newActions: Record<string, string> = {};
                    newIds.forEach(id => {
                      newActions[id] = characterActions[id] || '';
                    });
                    setCharacterActions(newActions);
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
                  Object.entries(characterActions).map(([charId, action]) => {
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
                              onClick={() => {
                                const newActions = { ...characterActions };
                                delete newActions[charId];
                                setCharacterActions(newActions);
                              }}
                              className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove character"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <textarea
                            value={action}
                            onChange={(e) => {
                              setCharacterActions(prev => ({ ...prev, [charId]: e.target.value }));
                            }}
                            className="text-sm bg-stone-50/50 hover:bg-stone-50 focus:bg-white border border-transparent hover:border-stone-200 focus:border-stone-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
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
              {/* Linked Events */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <LinkIcon size={16} className="text-emerald-600" /> Linked Events
                </h4>
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <p className="text-xs text-stone-500 mb-4">Link this event to other related events (e.g., cause and effect, thematic connection).</p>
                  <MultiSelectDropdown
                    options={allEvents.map(e => ({ id: e.id, title: e.title }))}
                    selectedIds={linkedEventIds}
                    onChange={setLinkedEventIds}
                    placeholder="+ Link another event..."
                  />
                </div>
              </div>

              {/* Horizontal Relations */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Network size={16} className="text-emerald-600" /> Horizontal (Fixed Interval)
                </h4>
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <p className="text-xs text-stone-500 mb-4">Fix events horizontally to maintain a fixed interval.</p>
                  <MultiSelectDropdown
                    options={allEvents.map(e => ({ id: e.id, title: e.title }))}
                    selectedIds={horizontalIds}
                    onChange={setHorizontalIds}
                    placeholder="+ Fix horizontal interval..."
                  />
                </div>
              </div>

              {/* Vertical Relations */}
              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <Network size={16} className="text-emerald-600" /> Vertical (Sync/Stack)
                </h4>
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <p className="text-xs text-stone-500 mb-4">Sync events vertically to stack them.</p>
                  <MultiSelectDropdown
                    options={allEvents.map(e => ({ id: e.id, title: e.title }))}
                    selectedIds={verticalIds}
                    onChange={setVerticalIds}
                    placeholder="+ Sync vertically..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-100 bg-white z-10 flex justify-end gap-2 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || !timestamp.trim()} 
            className="px-4 py-2 text-sm font-medium bg-stone-800 text-white rounded-md hover:bg-stone-700 disabled:opacity-50 transition-colors flex items-center"
          >
            <Plus size={16} className="mr-1.5" />
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}

