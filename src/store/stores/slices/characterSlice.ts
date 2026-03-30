import { StateCreator } from 'zustand';
import { StoreState, Character, CharacterSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createCharacterSlice: StateCreator<StoreState, [], [], CharacterSlice> = (set) => ({
  addCharacter: (workId, name) => set((state) => ({
    characters: [...state.characters, { id: uuidv4(), workId, name, description: '', order: state.characters.length }],
    lastModified: Date.now()
  })),
  updateCharacter: (character) => set((state) => ({
    characters: state.characters.map(c => c.id === character.id ? { ...c, ...character } : c),
    lastModified: Date.now()
  })),
  deleteCharacter: (characterId) => set((state) => ({
    characters: state.characters.filter(c => c.id !== characterId),
    lastModified: Date.now()
  })),
  reorderCharacters: (workId, startIndex, endIndex) => set((state) => {
    const characters = [...state.characters].filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
    const [removed] = characters.splice(startIndex, 1);
    characters.splice(endIndex, 0, removed);
    const updatedCharacters = characters.map((c, i) => ({ ...c, order: i }));
    return {
      characters: [
        ...state.characters.filter(c => c.workId !== workId),
        ...updatedCharacters
      ],
      lastModified: Date.now()
    };
  }),
  updateCharacterCustomField: (characterId, fieldId, value) => set((state) => ({
    characters: state.characters.map(c => c.id === characterId ? { ...c, customFields: { ...c.customFields, [fieldId]: value } } : c),
    lastModified: Date.now()
  })),
});
