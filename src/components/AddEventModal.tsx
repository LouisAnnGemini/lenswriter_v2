import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { TagManagerModal } from './TagManagerModal';
import { cn } from '../lib/utils';

interface AddEventModalProps {
  onClose: () => void;
}

export function AddEventModal({ onClose }: AddEventModalProps) {
  const { state, dispatch } = useStore();
  const [title, setTitle] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [locationId, setLocationId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const activeWorkId = state.activeWorkId;
  const locations = state.locations.filter(l => l.workId === activeWorkId);
  const tags = state.tags.filter(t => t.workId === activeWorkId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && timestamp.trim() && activeWorkId) {
      dispatch({
        type: 'ADD_TIMELINE_EVENT',
        payload: { 
          workId: activeWorkId, 
          title: title.trim(), 
          timestamp: timestamp.trim(),
          locationId: locationId || undefined,
          tagIds: selectedTagIds
        }
      });
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
          <div className="flex justify-between items-center p-6 border-b border-stone-100">
            <h3 className="text-xl font-bold text-stone-800">Add New Event</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Timestamp / Date *</label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder="e.g., Year 1, Day 3, 1999-12-31"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What happened?"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select a location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Tags</label>
                  <button type="button" onClick={() => setIsTagManagerOpen(true)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center">
                    <TagIcon size={12} className="mr-1" /> Manage
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-stone-50 border border-stone-200 rounded-md min-h-[40px]">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTagIds(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium border transition-colors",
                        selectedTagIds.includes(tag.id) 
                          ? (tag.color || 'bg-emerald-100 text-emerald-800 border-emerald-200')
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!title.trim() || !timestamp.trim()} 
                className="px-4 py-2 text-sm font-medium bg-stone-800 text-white rounded-md hover:bg-stone-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <Plus size={16} className="mr-1.5" />
                Add Event
              </button>
            </div>
          </form>
        </div>
      </div>
      {isTagManagerOpen && <TagManagerModal onClose={() => setIsTagManagerOpen(false)} />}
    </>
  );
}
