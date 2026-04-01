import { StateCreator } from 'zustand';
import { StoreState, Tag, Deadline, TagSlice, DeadlineSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createTagSlice: StateCreator<StoreState, [], [], TagSlice> = (set) => ({
  addTag: (tag) => {
    const id = uuidv4();
    set((state) => ({
      tags: [...state.tags, { id, ...tag }],
      lastModified: Date.now()
    }));
    return id;
  },
  updateTag: (tag) => set((state) => ({
    tags: state.tags.map(t => t.id === tag.id ? { ...t, ...tag } : t),
    lastModified: Date.now()
  })),
  deleteTag: (tagId) => set((state) => ({
    tags: state.tags.filter(t => t.id !== tagId),
    lastModified: Date.now()
  })),
});

export const createDeadlineSlice: StateCreator<StoreState, [], [], DeadlineSlice> = (set) => ({
  addDeadline: (deadline) => set((state) => ({
    deadlines: [...state.deadlines, { id: uuidv4(), ...deadline, completed: false }],
    lastModified: Date.now()
  })),
  updateDeadline: (deadline) => set((state) => ({
    deadlines: state.deadlines.map(d => d.id === deadline.id ? { ...d, ...deadline } : d),
    lastModified: Date.now()
  })),
  deleteDeadline: (deadlineId) => set((state) => ({
    deadlines: state.deadlines.filter(d => d.id !== deadlineId),
    lastModified: Date.now()
  })),
});
