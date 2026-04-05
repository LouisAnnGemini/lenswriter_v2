import { StateCreator } from 'zustand';
import { StoreState, ScriptSlice, ScriptDraft } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createScriptSlice: StateCreator<StoreState, [], [], ScriptSlice> = (set) => ({
  scriptDrafts: [],
  addScriptDraft: (draft) => set((state) => ({
    scriptDrafts: [...state.scriptDrafts, { ...draft, id: uuidv4(), createdAt: Date.now() }]
  })),
  updateScriptDraft: (draft) => set((state) => ({
    scriptDrafts: state.scriptDrafts.map(d => d.id === draft.id ? { ...d, ...draft } : d)
  })),
  deleteScriptDraft: (draftId) => set((state) => ({
    scriptDrafts: state.scriptDrafts.filter(d => d.id !== draftId)
  })),
});
