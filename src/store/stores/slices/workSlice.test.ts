import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createWorkSlice } from './workSlice';

describe('workSlice', () => {
  let useTestStore: any;

  beforeEach(() => {
    // Create a fresh store for each test
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      ...createWorkSlice(set, get, api as any),
    } as StoreState));
  });

  it('should add a new work', () => {
    const { addWork } = useTestStore.getState();
    const initialWorksCount = useTestStore.getState().works.length;
    
    addWork('New Masterpiece');
    
    const state = useTestStore.getState();
    expect(state.works.length).toBe(initialWorksCount + 1);
    
    const newWork = state.works[state.works.length - 1];
    expect(newWork.title).toBe('New Masterpiece');
    expect(state.activeWorkId).toBe(newWork.id);
    expect(state.activeDocumentId).toBeNull();
  });

  it('should update an existing work', () => {
    const { works, updateWork } = useTestStore.getState();
    const workToUpdate = works[0];
    
    updateWork({ id: workToUpdate.id, title: 'Updated Title' });
    
    const state = useTestStore.getState();
    const updatedWork = state.works.find((w: any) => w.id === workToUpdate.id);
    expect(updatedWork?.title).toBe('Updated Title');
  });

  it('should delete a work and clean up associated data', () => {
    const state = useTestStore.getState();
    const workToDelete = state.works[0].id;
    
    // Ensure we have some data associated with this work
    expect(state.chapters.some((c: any) => c.workId === workToDelete)).toBe(true);
    expect(state.characters.some((c: any) => c.workId === workToDelete)).toBe(true);
    
    // Perform delete
    state.deleteWork(workToDelete);
    
    const newState = useTestStore.getState();
    
    // Verify work is deleted
    expect(newState.works.some((w: any) => w.id === workToDelete)).toBe(false);
    
    // Verify associated data is cleaned up
    expect(newState.chapters.some((c: any) => c.workId === workToDelete)).toBe(false);
    expect(newState.characters.some((c: any) => c.workId === workToDelete)).toBe(false);
    expect(newState.locations.some((l: any) => l.workId === workToDelete)).toBe(false);
    expect(newState.tags.some((t: any) => t.workId === workToDelete)).toBe(false);
    expect(newState.timelineEvents.some((e: any) => e.workId === workToDelete)).toBe(false);
    
    // The activeWorkId should be null if it was the deleted work
    if (state.activeWorkId === workToDelete) {
      expect(newState.activeWorkId).toBeNull();
    }
  });

  it('should set active work and select its first chapter', () => {
    const state = useTestStore.getState();
    const workId = state.works[0].id;
    
    state.setActiveWork(workId);
    
    const newState = useTestStore.getState();
    expect(newState.activeWorkId).toBe(workId);
    
    // Should select the first chapter of that work
    const firstChapter = newState.chapters
      .filter((c: any) => c.workId === workId && !c.archived)
      .sort((a: any, b: any) => a.order - b.order)[0];
      
    if (firstChapter) {
      expect(newState.activeDocumentId).toBe(firstChapter.id);
    }
  });

  describe('character fields', () => {
    it('should add a character field', () => {
      const { addCharacterField, works } = useTestStore.getState();
      const workId = works[0].id;
      
      addCharacterField(workId, { id: 'field-1', name: 'Age', type: 'text' });
      
      const state = useTestStore.getState();
      const work = state.works.find((w: any) => w.id === workId);
      expect(work?.characterFields?.length).toBe(1);
      expect(work?.characterFields?.[0].name).toBe('Age');
    });

    it('should update a character field', () => {
      const { addCharacterField, updateCharacterField, works } = useTestStore.getState();
      const workId = works[0].id;
      
      addCharacterField(workId, { id: 'field-1', name: 'Age', type: 'text' });
      updateCharacterField(workId, 'field-1', { name: 'Age (Years)' });
      
      const state = useTestStore.getState();
      const work = state.works.find((w: any) => w.id === workId);
      expect(work?.characterFields?.[0].name).toBe('Age (Years)');
    });

    it('should delete a character field', () => {
      const { addCharacterField, deleteCharacterField, works } = useTestStore.getState();
      const workId = works[0].id;
      
      addCharacterField(workId, { id: 'field-1', name: 'Age', type: 'text' });
      deleteCharacterField(workId, 'field-1');
      
      const state = useTestStore.getState();
      const work = state.works.find((w: any) => w.id === workId);
      expect(work?.characterFields?.length).toBe(0);
    });

    it('should reorder character fields', () => {
      const { addCharacterField, reorderCharacterFields, works } = useTestStore.getState();
      const workId = works[0].id;
      
      addCharacterField(workId, { id: 'field-1', name: 'Age', type: 'text' });
      addCharacterField(workId, { id: 'field-2', name: 'Height', type: 'text' });
      
      reorderCharacterFields(workId, 0, 1);
      
      const state = useTestStore.getState();
      const work = state.works.find((w: any) => w.id === workId);
      expect(work?.characterFields?.[0].id).toBe('field-2');
      expect(work?.characterFields?.[1].id).toBe('field-1');
    });
  });
});
