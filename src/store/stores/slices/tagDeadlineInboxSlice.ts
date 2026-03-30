import { StateCreator } from 'zustand';
import { StoreState, Tag, Deadline, InboxItem, TagSlice, DeadlineSlice, InboxSlice } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const createTagSlice: StateCreator<StoreState, [], [], TagSlice> = (set) => ({
  addTag: (tag) => {
    const id = uuidv4();
    set((state) => ({
      tags: [...state.tags, { id, ...tag }]
    }));
    return id;
  },
  updateTag: (tag) => set((state) => ({
    tags: state.tags.map(t => t.id === tag.id ? { ...t, ...tag } : t)
  })),
  deleteTag: (tagId) => set((state) => ({
    tags: state.tags.filter(t => t.id !== tagId)
  })),
});

export const createDeadlineSlice: StateCreator<StoreState, [], [], DeadlineSlice> = (set) => ({
  addDeadline: (deadline) => set((state) => ({
    deadlines: [...state.deadlines, { id: uuidv4(), ...deadline, completed: false }]
  })),
  updateDeadline: (deadline) => set((state) => ({
    deadlines: state.deadlines.map(d => d.id === deadline.id ? { ...d, ...deadline } : d)
  })),
  deleteDeadline: (deadlineId) => set((state) => ({
    deadlines: state.deadlines.filter(d => d.id !== deadlineId)
  })),
});

export const createInboxSlice: StateCreator<StoreState, [], [], InboxSlice> = (set) => ({
  addInboxItem: ({ content, tagIds }) => set((state) => ({
    inbox: [...state.inbox, { id: uuidv4(), content, createdAt: Date.now(), tagIds }]
  })),
  updateInboxItem: (item) => set((state) => ({
    inbox: state.inbox.map(i => i.id === item.id ? { ...i, ...item } : i)
  })),
  deleteInboxItem: ({ id }) => set((state) => ({
    inbox: state.inbox.filter(i => i.id !== id)
  })),
  addInboxTag: (tag) => {
    const id = uuidv4();
    set((state) => ({
      inboxTags: [...state.inboxTags, { id, ...tag }]
    }));
    return id;
  },
  updateInboxTag: (tag) => set((state) => ({
    inboxTags: state.inboxTags.map(t => t.id === tag.id ? { ...t, ...tag } : t)
  })),
  deleteInboxTag: (tagId) => set((state) => ({
    inboxTags: state.inboxTags.filter(t => t.id !== tagId),
    inbox: state.inbox.map(i => ({ ...i, tagIds: i.tagIds?.filter(id => id !== tagId) }))
  })),
});
