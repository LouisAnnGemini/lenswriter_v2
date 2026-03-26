import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createLocationSlice } from './locationSlice';

describe('locationSlice', () => {
  let useTestStore: any;
  const mockWorkId = 'work-1';

  beforeEach(() => {
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      locations: [
        { id: 'loc-1', workId: mockWorkId, name: 'Location 1', description: '', order: 0 },
        { id: 'loc-2', workId: mockWorkId, name: 'Location 2', description: '', order: 1 },
      ],
      ...createLocationSlice(set, get, api as any),
    } as StoreState));
  });

  it('should add a new location', () => {
    const { addLocation } = useTestStore.getState();
    addLocation(mockWorkId, 'New Location');
    
    const state = useTestStore.getState();
    expect(state.locations.length).toBe(3);
    const newLoc = state.locations[state.locations.length - 1];
    expect(newLoc.name).toBe('New Location');
    expect(newLoc.workId).toBe(mockWorkId);
    expect(newLoc.order).toBe(2);
  });

  it('should update a location', () => {
    const { updateLocation } = useTestStore.getState();
    updateLocation({ id: 'loc-1', name: 'Updated Location' });
    
    const state = useTestStore.getState();
    const updatedLoc = state.locations.find((l: any) => l.id === 'loc-1');
    expect(updatedLoc?.name).toBe('Updated Location');
  });

  it('should delete a location', () => {
    const { deleteLocation } = useTestStore.getState();
    deleteLocation('loc-1');
    
    const state = useTestStore.getState();
    expect(state.locations.length).toBe(1);
    expect(state.locations.some((l: any) => l.id === 'loc-1')).toBe(false);
  });

  it('should reorder locations', () => {
    const { reorderLocations } = useTestStore.getState();
    reorderLocations(mockWorkId, 0, 1);
    
    const state = useTestStore.getState();
    const loc1 = state.locations.find((l: any) => l.id === 'loc-1');
    const loc2 = state.locations.find((l: any) => l.id === 'loc-2');
    
    expect(loc1?.order).toBe(1);
    expect(loc2?.order).toBe(0);
  });
});
