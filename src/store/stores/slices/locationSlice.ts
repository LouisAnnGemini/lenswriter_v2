import { StateCreator } from 'zustand';
import { StoreState, Location, LocationSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createLocationSlice: StateCreator<StoreState, [], [], LocationSlice> = (set) => ({
  addLocation: (workId, name) => set((state) => ({
    locations: [...state.locations, { id: uuidv4(), workId, name, description: '', order: state.locations.length }]
  })),
  updateLocation: (location) => set((state) => ({
    locations: state.locations.map(l => l.id === location.id ? { ...l, ...location } : l)
  })),
  deleteLocation: (locationId) => set((state) => ({
    locations: state.locations.filter(l => l.id !== locationId)
  })),
  reorderLocations: (workId, startIndex, endIndex) => set((state) => {
    const locations = [...state.locations].filter(l => l.workId === workId).sort((a, b) => a.order - b.order);
    const [removed] = locations.splice(startIndex, 1);
    locations.splice(endIndex, 0, removed);
    const updatedLocations = locations.map((l, i) => ({ ...l, order: i }));
    return {
      locations: [
        ...state.locations.filter(l => l.workId !== workId),
        ...updatedLocations
      ]
    };
  }),
});
