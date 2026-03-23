import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { X, Plus, Tag as TagIcon, Users, MapPin, Link as LinkIcon } from 'lucide-react';
import { TagManagerModal } from './TagManagerModal';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { cn } from '../lib/utils';

interface AddEventModalProps {
  onClose: () => void;
  initialSequenceNumber?: number;
}

export function AddEventModal({ onClose, initialSequenceNumber }: AddEventModalProps) {
  const { state, dispatch } = useStore();
  const [title, setTitle] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [description, setDescription] = useState('');
  const [sequenceNumber, setSequenceNumber] = useState(initialSequenceNumber ?? 0);
  const [locationId, setLocationId] = useState('');
  const [characterActions, setCharacterActions] = useState<Record<string, string>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const activeWorkId = state.activeWorkId;
  const locations = state.locations.filter(l => l.workId === activeWorkId);
  const characters = state.characters.filter(c => c.workId === activeWorkId);
  const tags = state.tags.filter(t => t.workId === activeWorkId);
  const allEvents = state.timelineEvents.filter(e => e.workId === activeWorkId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && timestamp.trim() && activeWorkId) {
      dispatch({
        type: 'ADD_TIMELINE_EVENT',
        payload: { 
          workId: activeWorkId, 
          title: title.trim(), 
          timestamp: timestamp.trim(),
          description: description.trim(),
          sequenceNumber,
          locationId: locationId || undefined,
          characterActions,
          tagIds: selectedTagIds,
          linkedEventIds
        }
      });
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-stone-100 bg-white z-10 shrink-0">
            <h3 className="text-xl font-bold text-stone-800">Add New Event</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Row 1: Sequence Number and Timestamp */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Sequence Number</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSequenceNumber(s => s - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 transition-colors font-bold"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 text-sm font-bold text-center text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setSequenceNumber(s => s + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-stone-100 hover:bg-stone-200 rounded-md text-stone-600 transition-colors font-bold"
                  >
                    +1
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Timestamp *</label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="text-sm bg-stone-50 border border-stone-200 rounded-md px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g., Day 1, 08:00 AM"
                  autoFocus
                />
              </div>
            </div>

            {/* Row 2: Event Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="What happened?"
              />
            </div>

            {/* Row 3: Event Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Event Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm bg-stone-50 border border-stone-200 rounded-md px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                placeholder="Describe the event..."
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
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
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
                  options={characters.map(c => ({ id: c.id, title: c.name }))}
                  selectedIds={Object.keys(characterActions)}
                  onChange={(newIds) => {
                    const newActions: Record<string, string> = {};
                    newIds.forEach(id => {
                      newActions[id] = characterActions[id] || '';
                    });
                    setCharacterActions(newActions);
                  }}
                  placeholder="Select characters..."
                />
              </div>
            </div>

            {/* Row 5: Character Descriptions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Character Descriptions</label>
              <div className="space-y-2">
                {Object.keys(characterActions).length === 0 ? (
                  <div className="text-sm text-stone-500 italic p-3 bg-stone-50 rounded-lg border border-stone-100">
                    No characters selected. Select characters above to add their descriptions.
                  </div>
                ) : (
                  Object.entries(characterActions).map(([charId, action]) => {
                    const character = characters.find(c => c.id === charId);
                    return (
                      <div key={charId} className="flex flex-col gap-1 p-3 bg-stone-50 rounded-lg border border-stone-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-stone-700 truncate">{character?.name || 'Unknown'}</span>
                        </div>
                        <textarea
                          value={action}
                          onChange={(e) => {
                            setCharacterActions(prev => ({ ...prev, [charId]: e.target.value }));
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
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center">
                  <TagIcon size={12} className="mr-1" /> Tags
                </label>
                <button type="button" onClick={() => setIsTagManagerOpen(true)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center">
                  <TagIcon size={12} className="mr-1" /> Manage
                </button>
              </div>
              <MultiSelectDropdown
                options={tags.map(t => ({ id: t.id, title: t.name, color: t.color }))}
                selectedIds={selectedTagIds}
                onChange={setSelectedTagIds}
                placeholder="Select tags..."
              />
            </div>

            {/* Row 7: Linked Events */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block flex items-center">
                <LinkIcon size={12} className="mr-1" /> Linked Events
              </label>
              <MultiSelectDropdown
                options={allEvents.map(e => ({ id: e.id, title: e.title }))}
                selectedIds={linkedEventIds}
                onChange={setLinkedEventIds}
                placeholder="+ Link another event..."
              />
            </div>

          </form>
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
      {isTagManagerOpen && <TagManagerModal onClose={() => setIsTagManagerOpen(false)} />}
    </>
  );
}
