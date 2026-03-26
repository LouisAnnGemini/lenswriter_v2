import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { StoreState } from '../../types';
import { initialState } from '../../constants';
import { createCharacterSlice } from './characterSlice';

describe('characterSlice', () => {
  let useTestStore: any;
  const mockWorkId = 'work-1';

  beforeEach(() => {
    useTestStore = create<StoreState>()((set, get, api) => ({
      ...initialState,
      characters: [
        { id: 'char-1', workId: mockWorkId, name: 'Character 1', description: '', order: 0 },
        { id: 'char-2', workId: mockWorkId, name: 'Character 2', description: '', order: 1 },
      ],
      ...createCharacterSlice(set, get, api as any),
    } as StoreState));
  });

  it('should add a new character', () => {
    const { addCharacter } = useTestStore.getState();
    addCharacter(mockWorkId, 'New Character');
    
    const state = useTestStore.getState();
    expect(state.characters.length).toBe(3);
    const newChar = state.characters[state.characters.length - 1];
    expect(newChar.name).toBe('New Character');
    expect(newChar.workId).toBe(mockWorkId);
    expect(newChar.order).toBe(2);
  });

  it('should update a character', () => {
    const { updateCharacter } = useTestStore.getState();
    updateCharacter({ id: 'char-1', name: 'Updated Character' });
    
    const state = useTestStore.getState();
    const updatedChar = state.characters.find((c: any) => c.id === 'char-1');
    expect(updatedChar?.name).toBe('Updated Character');
  });

  it('should delete a character', () => {
    const { deleteCharacter } = useTestStore.getState();
    deleteCharacter('char-1');
    
    const state = useTestStore.getState();
    expect(state.characters.length).toBe(1);
    expect(state.characters.some((c: any) => c.id === 'char-1')).toBe(false);
  });

  it('should reorder characters', () => {
    const { reorderCharacters } = useTestStore.getState();
    reorderCharacters(mockWorkId, 0, 1);
    
    const state = useTestStore.getState();
    const char1 = state.characters.find((c: any) => c.id === 'char-1');
    const char2 = state.characters.find((c: any) => c.id === 'char-2');
    
    expect(char1?.order).toBe(1);
    expect(char2?.order).toBe(0);
  });

  it('should update character custom field', () => {
    const { updateCharacterCustomField } = useTestStore.getState();
    updateCharacterCustomField('char-1', 'age', 30);
    
    const state = useTestStore.getState();
    const char1 = state.characters.find((c: any) => c.id === 'char-1');
    expect(char1?.customFields?.age).toBe(30);
  });
});
