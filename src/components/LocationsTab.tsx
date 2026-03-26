import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, MapPin, AlignLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

export function LocationsTab({ isSubTab }: { isSubTab?: boolean }) {
  const { 
    activeWorkId, 
    locations: allLocations, 
    addLocation, 
    updateLocation, 
    deleteLocation, 
    reorderLocations 
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    locations: state.locations,
    addLocation: state.addLocation,
    updateLocation: state.updateLocation,
    deleteLocation: state.deleteLocation,
    reorderLocations: state.reorderLocations
  })));

  const [newLocationName, setNewLocationName] = useState('');

  const locations = allLocations.filter(l => l.workId === activeWorkId).sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!activeWorkId) return null;

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocationName.trim()) {
      addLocation(activeWorkId, newLocationName.trim());
      setNewLocationName('');
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderLocations(activeWorkId, result.source.index, result.destination.index);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
      {!isSubTab && (
        <div className="p-6 border-b border-stone-200 bg-white shrink-0">
          <h2 className="text-2xl font-bold text-stone-800">Locations</h2>
          <p className="text-stone-500 mt-1">Manage places in your story world.</p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Add Location Form */}
          <form onSubmit={handleAddLocation} className="bg-white p-4 rounded-lg shadow-sm border border-stone-200 flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-500 mb-1">Location Name</label>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g., The Prancing Pony, Neo-Veridia, Mars Base Alpha"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={!newLocationName.trim()}
              className="px-4 py-2 bg-stone-800 text-white rounded-md hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Add Location
            </button>
          </form>

          {/* Locations List */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="locations">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locations.map((location, index) => (
                    // @ts-expect-error React 19 key prop issue
                    <Draggable key={location.id} draggableId={location.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "group bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-all",
                            snapshot.isDragging && "shadow-xl scale-[1.02] z-50 ring-2 ring-emerald-500 ring-offset-2"
                          )}
                        >
                          <div className="flex items-center p-3 border-b border-stone-100 bg-stone-50/50">
                            <div 
                              {...provided.dragHandleProps}
                              className="text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing mr-2"
                            >
                              <GripVertical size={16} />
                            </div>
                            <div className="flex-1 flex items-center">
                              <MapPin size={16} className="text-emerald-600 mr-2 shrink-0" />
                              <input
                                type="text"
                                value={location.name || ''}
                                onChange={(e) => updateLocation({ id: location.id, name: e.target.value })}
                                className="font-semibold text-stone-800 bg-transparent border-none p-0 focus:ring-0 w-full"
                                placeholder="Location Name"
                              />
                            </div>
                            <ConfirmDeleteButton
                              onConfirm={() => deleteLocation(location.id)}
                              className="p-1.5 opacity-0 group-hover:opacity-100"
                              title="Delete Location"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-start space-x-2">
                              <AlignLeft size={14} className="text-stone-400 shrink-0 mt-1.5" />
                              <textarea
                                value={location.description || ''}
                                onChange={(e) => updateLocation({ id: location.id, description: e.target.value })}
                                placeholder="Describe this location..."
                                rows={4}
                                className="text-sm bg-stone-50 border border-stone-200/50 rounded-md px-3 py-2 w-full resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {locations.length === 0 && (
            <div className="text-center py-12 text-stone-500 bg-white rounded-lg border border-stone-200 border-dashed">
              <MapPin size={48} className="mx-auto mb-4 opacity-20" />
              <p>No locations added yet.</p>
              <p className="text-sm mt-1">Add your first location above to start building your world.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
