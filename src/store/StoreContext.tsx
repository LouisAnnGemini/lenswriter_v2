import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type Work = { id: string; title: string; createdAt: number; order: number; characterFields?: CharacterFieldDef[]; lensesDescription?: string; icon?: string };
export type Character = { id: string; workId: string; name: string; description: string; order: number; customFields?: Record<string, any> };
export type Chapter = { id: string; workId: string; title: string; order: number; goalWordCount?: number; deadline?: string; completed?: boolean; archived?: boolean };
export type Scene = { id: string; chapterId: string; title: string; order: number; characterIds: string[]; characterNotes?: Record<string, string>; statusColor?: string };
export type Block = { id: string; documentId: string; type: 'text' | 'lens'; content: string; color?: string; order: number; notes?: string; linkedLensIds?: string[]; description?: string; completed?: boolean; pinned?: boolean };

export type CharacterFieldType = 'text' | 'number' | 'select' | 'multiselect';
export type CharacterFieldDef = { id: string; name: string; type: CharacterFieldType; options: string[] };

export type Deadline = {
  id: string;
  workId: string;
  title: string;
  date: string;
  completed: boolean;
};

export type StoreState = {
  works: Work[];
  characters: Character[];
  chapters: Chapter[];
  scenes: Scene[];
  blocks: Block[];
  deadlines: Deadline[];
  activeWorkId: string | null;
  activeDocumentId: string | null;
  activeTab: 'writing' | 'lenses' | 'characters' | 'deadline' | 'compile';
  activeLensId: string | null;
  focusMode: boolean;
  disguiseMode: boolean;
  showDescriptions: boolean;
  past?: StoreState[];
  future?: StoreState[];
};

type Action =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'ADD_WORK'; payload: { title: string } }
  | { type: 'UPDATE_WORK'; payload: { id: string; title?: string; lensesDescription?: string; icon?: string } }
  | { type: 'DELETE_WORK'; payload: string }
  | { type: 'REORDER_WORKS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'SET_ACTIVE_WORK'; payload: string }
  | { type: 'SET_ACTIVE_DOCUMENT'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: 'writing' | 'lenses' | 'characters' | 'deadline' | 'compile' }
  | { type: 'SET_ACTIVE_LENS'; payload: string | null }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'TOGGLE_DISGUISE_MODE' }
  | { type: 'TOGGLE_SHOW_DESCRIPTIONS' }
  | { type: 'ADD_CHAPTER'; payload: { workId: string; title: string } }
  | { type: 'UPDATE_CHAPTER'; payload: { id: string; title: string } }
  | { type: 'UPDATE_CHAPTER_GOAL'; payload: { id: string; goalWordCount?: number; deadline?: string; completed?: boolean } }
  | { type: 'TOGGLE_CHAPTER_ARCHIVE'; payload: string }
  | { type: 'TOGGLE_LENS_PIN'; payload: string }
  | { type: 'REORDER_CHAPTERS'; payload: { workId: string; startIndex: number; endIndex: number } }
  | { type: 'ADD_SCENE'; payload: { chapterId: string; title: string } }
  | { type: 'UPDATE_SCENE'; payload: { id: string; title?: string; statusColor?: string } }
  | { type: 'REORDER_SCENES'; payload: { chapterId: string; startIndex: number; endIndex: number } }
  | { type: 'MOVE_SCENE'; payload: { sceneId: string; newChapterId: string; newIndex: number } }
  | { type: 'TOGGLE_SCENE_CHARACTER'; payload: { sceneId: string; characterId: string } }
  | { type: 'UPDATE_SCENE_CHARACTER_NOTE'; payload: { sceneId: string; characterId: string; note: string } }
  | { type: 'ADD_BLOCK'; payload: { documentId: string; type: 'text' | 'lens'; afterBlockId?: string } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; content?: string; type?: 'text' | 'lens'; color?: string; notes?: string; linkedLensIds?: string[]; description?: string; completed?: boolean } }
  | { type: 'REMOVE_LENS'; payload: string }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'ADD_CHARACTER'; payload: { workId: string; name: string } }
  | { type: 'UPDATE_CHARACTER'; payload: { id: string; name?: string; description?: string } }
  | { type: 'REORDER_CHARACTERS'; payload: { workId: string; startIndex: number; endIndex: number } }
  | { type: 'REORDER_CHARACTER_FIELDS'; payload: { workId: string; startIndex: number; endIndex: number } }
  | { type: 'MERGE_BLOCK_UP'; payload: string }
  | { type: 'DELETE_CHAPTER'; payload: string }
  | { type: 'DELETE_SCENE'; payload: string }
  | { type: 'IMPORT_DATA'; payload: StoreState }
  | { type: 'ADD_CHARACTER_FIELD'; payload: { workId: string; field: CharacterFieldDef } }
  | { type: 'UPDATE_CHARACTER_FIELD'; payload: { workId: string; fieldId: string; updates: Partial<CharacterFieldDef> } }
  | { type: 'DELETE_CHARACTER_FIELD'; payload: { workId: string; fieldId: string } }
  | { type: 'UPDATE_CHARACTER_CUSTOM_FIELD'; payload: { characterId: string; fieldId: string; value: any } }
  | { type: 'ADD_DEADLINE'; payload: { workId: string; title: string; date: string } }
  | { type: 'UPDATE_DEADLINE'; payload: { id: string; title?: string; date?: string; completed?: boolean } }
  | { type: 'DELETE_DEADLINE'; payload: string }
  | { type: 'BULK_UPDATE_BLOCKS'; payload: { id: string; content: string }[] };

const initialWorkId = uuidv4();
const initialChapterId = uuidv4();
const initialSceneId = uuidv4();
const initialCharId = uuidv4();
const initialBlockId1 = uuidv4();
const initialBlockId2 = uuidv4();

const initialState: StoreState = {
  works: [{ id: initialWorkId, title: 'The Silent Echo', createdAt: Date.now(), order: 0 }],
  characters: [
    { id: initialCharId, workId: initialWorkId, name: 'Elias Thorne', description: 'A detective with a troubled past.', order: 0 },
    { id: uuidv4(), workId: initialWorkId, name: 'Sarah Vance', description: 'An investigative journalist.', order: 1 }
  ],
  chapters: [
    { id: initialChapterId, workId: initialWorkId, title: 'Chapter 1: The Awakening', order: 0 },
    { id: uuidv4(), workId: initialWorkId, title: 'Chapter 2: Shadows', order: 1 }
  ],
  scenes: [
    { id: initialSceneId, chapterId: initialChapterId, title: 'Scene 1: The Crime Scene', order: 0, characterIds: [initialCharId] },
    { id: uuidv4(), chapterId: initialChapterId, title: 'Scene 2: Interrogation', order: 1, characterIds: [] }
  ],
  blocks: [
    { id: initialBlockId1, documentId: initialSceneId, type: 'text', content: 'The rain poured relentlessly over the neon-lit streets of Neo-Veridia. Elias stood over the body, his coat heavy with water.', order: 0 },
    { id: initialBlockId2, documentId: initialSceneId, type: 'lens', content: 'The victim held a small, silver locket tightly in their left hand. It bore the insignia of the old regime.', color: 'red', order: 1, notes: 'Crucial evidence. Connects to the mayor.', linkedLensIds: [] },
    { id: uuidv4(), documentId: initialSceneId, type: 'text', content: 'He sighed, knowing this case would be unlike any other.', order: 2 }
  ],
  deadlines: [
    { id: uuidv4(), workId: initialWorkId, title: 'First Draft', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false }
  ],
  activeWorkId: initialWorkId,
  activeDocumentId: initialSceneId,
  activeTab: 'writing',
  activeLensId: null,
  focusMode: false,
  disguiseMode: false,
  showDescriptions: true,
};

function innerReducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'ADD_WORK': {
      const newWork: Work = { id: uuidv4(), title: action.payload.title, createdAt: Date.now(), order: state.works.length };
      return { ...state, works: [...state.works, newWork], activeWorkId: newWork.id, activeDocumentId: null };
    }
    case 'UPDATE_WORK': {
      return {
        ...state,
        works: state.works.map(w => w.id === action.payload.id ? { ...w, ...action.payload } : w)
      };
    }
    case 'DELETE_WORK': {
      const workId = action.payload;
      const chaptersToDelete = state.chapters.filter(c => c.workId === workId).map(c => c.id);
      const scenesToDelete = state.scenes.filter(s => chaptersToDelete.includes(s.chapterId)).map(s => s.id);
      const docsToDelete = [...chaptersToDelete, ...scenesToDelete];
      const blocksToDelete = state.blocks.filter(b => docsToDelete.includes(b.documentId)).map(b => b.id);
      const deadlinesToDelete = (state.deadlines || []).filter(d => d.workId === workId).map(d => d.id);

      return {
        ...state,
        works: state.works.filter(w => w.id !== workId),
        chapters: state.chapters.filter(c => c.workId !== workId),
        scenes: state.scenes.filter(s => !chaptersToDelete.includes(s.chapterId)),
        characters: state.characters.filter(c => c.workId !== workId),
        blocks: state.blocks.filter(b => !docsToDelete.includes(b.documentId)).map(b => {
          if (b.linkedLensIds && b.linkedLensIds.some(id => blocksToDelete.includes(id))) {
            return { ...b, linkedLensIds: b.linkedLensIds.filter(id => !blocksToDelete.includes(id)) };
          }
          return b;
        }),
        deadlines: (state.deadlines || []).filter(d => d.workId !== workId),
        activeWorkId: state.activeWorkId === workId ? null : state.activeWorkId,
        activeDocumentId: docsToDelete.includes(state.activeDocumentId!) ? null : state.activeDocumentId
      };
    }
    case 'REORDER_WORKS': {
      const { startIndex, endIndex } = action.payload;
      const works = [...state.works].sort((a, b) => a.order - b.order);
      const [removed] = works.splice(startIndex, 1);
      works.splice(endIndex, 0, removed);
      const updatedWorks = works.map((w, i) => ({ ...w, order: i }));
      return {
        ...state,
        works: updatedWorks
      };
    }
    case 'SET_ACTIVE_WORK': {
      const workId = action.payload;
      // Find the first chapter of this work
      const firstChapter = state.chapters
        .filter(c => c.workId === workId)
        .sort((a, b) => a.order - b.order)[0];
      
      let firstDocId = null;
      if (firstChapter) {
        // Find the first scene of this chapter
        const firstScene = state.scenes
          .filter(s => s.chapterId === firstChapter.id)
          .sort((a, b) => a.order - b.order)[0];
        
        firstDocId = firstScene ? firstScene.id : firstChapter.id;
      }
      
      return { ...state, activeWorkId: workId, activeDocumentId: firstDocId };
    }
    case 'SET_ACTIVE_DOCUMENT':
      return { ...state, activeDocumentId: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_ACTIVE_LENS':
      return { ...state, activeLensId: action.payload };
    case 'TOGGLE_FOCUS_MODE':
      return { ...state, focusMode: !state.focusMode };
    case 'TOGGLE_DISGUISE_MODE':
      const newDisguiseMode = !state.disguiseMode;
      return { 
        ...state, 
        disguiseMode: newDisguiseMode,
        // When entering disguise mode, enable focus mode and hide descriptions
        focusMode: newDisguiseMode ? true : state.focusMode,
        showDescriptions: newDisguiseMode ? false : state.showDescriptions
      };
    case 'TOGGLE_SHOW_DESCRIPTIONS':
      return { ...state, showDescriptions: !state.showDescriptions };
    case 'ADD_CHAPTER': {
      const chapters = state.chapters.filter(c => c.workId === action.payload.workId);
      const newChapterId = uuidv4();
      const newSceneId = uuidv4();
      const newBlockId = uuidv4();

      const newChapter: Chapter = { 
        id: newChapterId, 
        workId: action.payload.workId, 
        title: action.payload.title, 
        order: chapters.length 
      };

      const newScene: Scene = {
        id: newSceneId,
        chapterId: newChapterId,
        title: 'New Scene',
        order: 0,
        characterIds: []
      };

      const newBlock: Block = {
        id: newBlockId,
        documentId: newSceneId,
        type: 'text',
        content: '',
        order: 0
      };

      return { 
        ...state, 
        chapters: [...state.chapters, newChapter], 
        scenes: [...state.scenes, newScene],
        blocks: [...state.blocks, newBlock],
        activeDocumentId: newSceneId 
      };
    }
    case 'UPDATE_CHAPTER':
      return { ...state, chapters: state.chapters.map(c => c.id === action.payload.id ? { ...c, title: action.payload.title } : c) };
    case 'UPDATE_CHAPTER_GOAL':
      return { 
        ...state, 
        chapters: state.chapters.map(c => c.id === action.payload.id ? { 
          ...c, 
          goalWordCount: 'goalWordCount' in action.payload ? action.payload.goalWordCount : c.goalWordCount,
          deadline: 'deadline' in action.payload ? action.payload.deadline : c.deadline,
          completed: 'completed' in action.payload ? action.payload.completed : c.completed
        } : c) 
      };
    case 'TOGGLE_CHAPTER_ARCHIVE':
      return {
        ...state,
        chapters: state.chapters.map(c => c.id === action.payload ? { ...c, archived: !c.archived } : c)
      };
    case 'TOGGLE_LENS_PIN':
      return {
        ...state,
        blocks: state.blocks.map(b => b.id === action.payload ? { ...b, pinned: !b.pinned } : b)
      };
    case 'MERGE_BLOCK_UP': {
      const blockId = action.payload;
      const block = state.blocks.find(b => b.id === blockId);
      if (!block || block.type !== 'text') return state;

      const docBlocks = state.blocks
        .filter(b => b.documentId === block.documentId)
        .sort((a, b) => a.order - b.order);
      
      const blockIndex = docBlocks.findIndex(b => b.id === blockId);
      if (blockIndex <= 0) return state; // Cannot merge first block
      
      const prevBlock = docBlocks[blockIndex - 1];
      if (prevBlock.type !== 'text') return state; // Only merge text with text

      const newContent = prevBlock.content + '\n' + block.content;

      return {
        ...state,
        blocks: state.blocks
          .map(b => b.id === prevBlock.id ? { ...b, content: newContent } : b)
          .filter(b => b.id !== blockId)
      };
    }
    case 'DELETE_CHAPTER': {
      const chapterId = action.payload;
      const scenesToDelete = state.scenes.filter(s => s.chapterId === chapterId).map(s => s.id);
      const docsToDelete = [chapterId, ...scenesToDelete];
      const blocksToDelete = state.blocks.filter(b => docsToDelete.includes(b.documentId)).map(b => b.id);
      
      return {
        ...state,
        chapters: state.chapters.filter(c => c.id !== chapterId),
        scenes: state.scenes.filter(s => s.chapterId !== chapterId),
        blocks: state.blocks.filter(b => !docsToDelete.includes(b.documentId)).map(b => {
          if (b.linkedLensIds && b.linkedLensIds.some(id => blocksToDelete.includes(id))) {
            return { ...b, linkedLensIds: b.linkedLensIds.filter(id => !blocksToDelete.includes(id)) };
          }
          return b;
        }),
        activeDocumentId: state.activeDocumentId === chapterId || scenesToDelete.includes(state.activeDocumentId!) ? null : state.activeDocumentId
      };
    }
    case 'REORDER_CHAPTERS': {
      const { workId, startIndex, endIndex } = action.payload;
      const workChapters = state.chapters.filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
      const [removed] = workChapters.splice(startIndex, 1);
      workChapters.splice(endIndex, 0, removed);
      const updatedChapters = workChapters.map((c, i) => ({ ...c, order: i }));
      return {
        ...state,
        chapters: state.chapters.map(c => c.workId === workId ? updatedChapters.find(uc => uc.id === c.id)! : c)
      };
    }
    case 'ADD_SCENE': {
      const scenes = state.scenes.filter(s => s.chapterId === action.payload.chapterId);
      const newSceneId = uuidv4();
      const newBlockId = uuidv4();
      
      const newScene: Scene = { 
        id: newSceneId, 
        chapterId: action.payload.chapterId, 
        title: action.payload.title, 
        order: scenes.length, 
        characterIds: [] 
      };

      const newBlock: Block = {
        id: newBlockId,
        documentId: newSceneId,
        type: 'text',
        content: '',
        order: 0
      };

      return { 
        ...state, 
        scenes: [...state.scenes, newScene], 
        blocks: [...state.blocks, newBlock],
        activeDocumentId: newSceneId 
      };
    }
    case 'UPDATE_SCENE':
      return { ...state, scenes: state.scenes.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'DELETE_SCENE': {
      const sceneId = action.payload;
      const blocksToDelete = state.blocks.filter(b => b.documentId === sceneId).map(b => b.id);
      return {
        ...state,
        scenes: state.scenes.filter(s => s.id !== sceneId),
        blocks: state.blocks.filter(b => b.documentId !== sceneId).map(b => {
          if (b.linkedLensIds && b.linkedLensIds.some(id => blocksToDelete.includes(id))) {
            return { ...b, linkedLensIds: b.linkedLensIds.filter(id => !blocksToDelete.includes(id)) };
          }
          return b;
        }),
        activeDocumentId: state.activeDocumentId === sceneId ? null : state.activeDocumentId
      };
    }
    case 'REORDER_SCENES': {
      const { chapterId, startIndex, endIndex } = action.payload;
      const chapterScenes = state.scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
      const [removed] = chapterScenes.splice(startIndex, 1);
      chapterScenes.splice(endIndex, 0, removed);
      const updatedScenes = chapterScenes.map((s, i) => ({ ...s, order: i }));
      return {
        ...state,
        scenes: state.scenes.map(s => s.chapterId === chapterId ? updatedScenes.find(us => us.id === s.id)! : s)
      };
    }
    case 'MOVE_SCENE': {
      const { sceneId, newChapterId, newIndex } = action.payload;
      const scene = state.scenes.find(s => s.id === sceneId);
      if (!scene) return state;
      
      const oldChapterId = scene.chapterId;
      let newScenes = [...state.scenes];
      
      // Remove from old chapter and reorder
      const oldChapterScenes = newScenes.filter(s => s.chapterId === oldChapterId && s.id !== sceneId).sort((a, b) => a.order - b.order);
      oldChapterScenes.forEach((s, i) => s.order = i);
      
      // Add to new chapter and reorder
      const newChapterScenes = newScenes.filter(s => s.chapterId === newChapterId && s.id !== sceneId).sort((a, b) => a.order - b.order);
      const updatedScene = { ...scene, chapterId: newChapterId };
      newChapterScenes.splice(newIndex, 0, updatedScene);
      newChapterScenes.forEach((s, i) => s.order = i);
      
      return {
        ...state,
        scenes: newScenes.map(s => {
          if (s.id === sceneId) return updatedScene;
          if (s.chapterId === oldChapterId) return oldChapterScenes.find(os => os.id === s.id) || s;
          if (s.chapterId === newChapterId) return newChapterScenes.find(ns => ns.id === s.id) || s;
          return s;
        })
      };
    }
    case 'TOGGLE_SCENE_CHARACTER': {
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id === action.payload.sceneId) {
            const hasChar = s.characterIds.includes(action.payload.characterId);
            return {
              ...s,
              characterIds: hasChar 
                ? s.characterIds.filter(id => id !== action.payload.characterId)
                : [...s.characterIds, action.payload.characterId]
            };
          }
          return s;
        })
      };
    }
    case 'UPDATE_SCENE_CHARACTER_NOTE': {
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id === action.payload.sceneId) {
            return {
              ...s,
              characterNotes: {
                ...(s.characterNotes || {}),
                [action.payload.characterId]: action.payload.note
              }
            };
          }
          return s;
        })
      };
    }
    case 'ADD_BLOCK': {
      const { documentId, type, afterBlockId } = action.payload;
      const docBlocks = state.blocks.filter(b => b.documentId === documentId).sort((a, b) => a.order - b.order);
      const newBlock: Block = {
        id: uuidv4(),
        documentId,
        type,
        content: '',
        color: type === 'lens' ? 'red' : undefined,
        order: 0
      };
      
      if (afterBlockId) {
        const index = docBlocks.findIndex(b => b.id === afterBlockId);
        docBlocks.splice(index + 1, 0, newBlock);
      } else {
        docBlocks.push(newBlock);
      }
      
      const updatedBlocks = docBlocks.map((b, i) => ({ ...b, order: i }));
      
      return {
        ...state,
        blocks: [
          ...state.blocks.filter(b => b.documentId !== documentId),
          ...updatedBlocks
        ]
      };
    }
    case 'UPDATE_BLOCK': {
      const { id, ...updates } = action.payload;
      
      const applyUpdates = (block: Block) => {
        const newBlock = { ...block, ...updates };
        if (updates.type === 'lens' && block.type === 'text' && !updates.color && !block.color) {
            newBlock.color = 'red';
        }
        return newBlock;
      };

      if ('linkedLensIds' in updates) {
        const oldBlock = state.blocks.find(b => b.id === id);
        if (oldBlock) {
          const oldLinks = oldBlock.linkedLensIds || [];
          const newLinks = updates.linkedLensIds || [];
          
          const addedLinks = newLinks.filter(lId => !oldLinks.includes(lId));
          const removedLinks = oldLinks.filter(lId => !newLinks.includes(lId));

          return {
            ...state,
            blocks: state.blocks.map(b => {
              if (b.id === id) {
                return applyUpdates(b);
              }
              if (addedLinks.includes(b.id)) {
                const currentLinks = b.linkedLensIds || [];
                if (!currentLinks.includes(id)) {
                  return { ...b, linkedLensIds: [...currentLinks, id] };
                }
              }
              if (removedLinks.includes(b.id)) {
                const currentLinks = b.linkedLensIds || [];
                if (currentLinks.includes(id)) {
                  return { ...b, linkedLensIds: currentLinks.filter(lId => lId !== id) };
                }
              }
              return b;
            })
          };
        }
      }

      return {
        ...state,
        blocks: state.blocks.map(b => b.id === id ? applyUpdates(b) : b)
      };
    }
    case 'BULK_UPDATE_BLOCKS': {
      const updates = action.payload;
      const updateMap = new Map(updates.map(u => [u.id, u.content]));
      
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (updateMap.has(b.id)) {
            return { ...b, content: updateMap.get(b.id)! };
          }
          return b;
        })
      };
    }
    case 'REMOVE_LENS': {
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.id === action.payload) {
            return { ...b, type: 'text', color: undefined, notes: undefined, linkedLensIds: undefined };
          }
          if (b.linkedLensIds?.includes(action.payload)) {
            return { ...b, linkedLensIds: b.linkedLensIds.filter(id => id !== action.payload) };
          }
          return b;
        })
      };
    }
    case 'DELETE_BLOCK': {
      const blockToDelete = state.blocks.find(b => b.id === action.payload);
      if (!blockToDelete) return state;
      
      const docBlocks = state.blocks.filter(b => b.documentId === blockToDelete.documentId && b.id !== action.payload).sort((a, b) => a.order - b.order);
      const updatedBlocks = docBlocks.map((b, i) => ({ ...b, order: i }));
      
      return {
        ...state,
        blocks: [
          ...state.blocks.filter(b => b.documentId !== blockToDelete.documentId).map(b => {
            if (b.linkedLensIds?.includes(action.payload)) {
              return { ...b, linkedLensIds: b.linkedLensIds.filter(id => id !== action.payload) };
            }
            return b;
          }),
          ...updatedBlocks.map(b => {
            if (b.linkedLensIds?.includes(action.payload)) {
              return { ...b, linkedLensIds: b.linkedLensIds.filter(id => id !== action.payload) };
            }
            return b;
          })
        ]
      };
    }
    case 'ADD_CHARACTER': {
      const chars = state.characters.filter(c => c.workId === action.payload.workId);
      const newChar: Character = { id: uuidv4(), workId: action.payload.workId, name: action.payload.name, description: '', order: chars.length };
      return { ...state, characters: [...state.characters, newChar] };
    }
    case 'UPDATE_CHARACTER': {
      return {
        ...state,
        characters: state.characters.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c)
      };
    }
    case 'REORDER_CHARACTERS': {
      const { workId, startIndex, endIndex } = action.payload;
      const workChars = state.characters.filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
      const [removed] = workChars.splice(startIndex, 1);
      workChars.splice(endIndex, 0, removed);
      const updatedChars = workChars.map((c, i) => ({ ...c, order: i }));
      return {
        ...state,
        characters: state.characters.map(c => c.workId === workId ? updatedChars.find(uc => uc.id === c.id)! : c)
      };
    }
    case 'IMPORT_DATA': {
      return action.payload;
    }
    case 'ADD_CHARACTER_FIELD': {
      return {
        ...state,
        works: state.works.map(w => w.id === action.payload.workId ? {
          ...w,
          characterFields: [...(w.characterFields || []), action.payload.field]
        } : w)
      };
    }
    case 'UPDATE_CHARACTER_FIELD': {
      return {
        ...state,
        works: state.works.map(w => w.id === action.payload.workId ? {
          ...w,
          characterFields: (w.characterFields || []).map(f => f.id === action.payload.fieldId ? { ...f, ...action.payload.updates } : f)
        } : w)
      };
    }
    case 'DELETE_CHARACTER_FIELD': {
      return {
        ...state,
        works: state.works.map(w => w.id === action.payload.workId ? {
          ...w,
          characterFields: (w.characterFields || []).filter(f => f.id !== action.payload.fieldId)
        } : w)
      };
    }
    case 'REORDER_CHARACTER_FIELDS': {
      return {
        ...state,
        works: state.works.map(w => {
          if (w.id !== action.payload.workId) return w;
          const newFields = Array.from(w.characterFields || []);
          const [removed] = newFields.splice(action.payload.startIndex, 1);
          newFields.splice(action.payload.endIndex, 0, removed);
          return { ...w, characterFields: newFields };
        })
      };
    }
    case 'UPDATE_CHARACTER_CUSTOM_FIELD': {
      return {
        ...state,
        characters: state.characters.map(c => c.id === action.payload.characterId ? {
          ...c,
          customFields: { ...(c.customFields || {}), [action.payload.fieldId]: action.payload.value }
        } : c)
      };
    }
    case 'ADD_DEADLINE': {
      const newDeadline: Deadline = { id: uuidv4(), workId: action.payload.workId, title: action.payload.title, date: action.payload.date, completed: false };
      return { ...state, deadlines: [...(state.deadlines || []), newDeadline] };
    }
    case 'UPDATE_DEADLINE': {
      return {
        ...state,
        deadlines: (state.deadlines || []).map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d)
      };
    }
    case 'DELETE_DEADLINE': {
      return {
        ...state,
        deadlines: (state.deadlines || []).filter(d => d.id !== action.payload)
      };
    }
    default:
      return state;
  }
}

function storeReducer(state: StoreState, action: Action): StoreState {
  if (action.type === 'UNDO') {
    const past = state.past || [];
    if (past.length === 0) return state;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    return {
      ...previous,
      past: newPast,
      future: [state, ...(state.future || [])],
    };
  }

  if (action.type === 'REDO') {
    const future = state.future || [];
    if (future.length === 0) return state;

    const next = future[0];
    const newFuture = future.slice(1);

    return {
      ...next,
      past: [...(state.past || []), state],
      future: newFuture,
    };
  }

  const newState = innerReducer(state, action);

  if (newState === state) return state;

  const isEphemeralAction = 
    action.type === 'SET_ACTIVE_TAB' || 
    action.type === 'SET_ACTIVE_DOCUMENT' ||
    action.type === 'SET_ACTIVE_WORK' ||
    action.type === 'SET_ACTIVE_LENS' ||
    action.type === 'TOGGLE_FOCUS_MODE' ||
    action.type === 'TOGGLE_DISGUISE_MODE' ||
    action.type === 'TOGGLE_SHOW_DESCRIPTIONS';

  if (isEphemeralAction) {
    return {
      ...newState,
      past: state.past,
      future: state.future
    };
  }

  const { past, future, ...stateWithoutHistory } = state;

  const MAX_HISTORY = 50;
  let newPast = [...(past || []), stateWithoutHistory as StoreState];
  if (newPast.length > MAX_HISTORY) {
    newPast = newPast.slice(newPast.length - MAX_HISTORY);
  }

  return {
    ...newState,
    past: newPast,
    future: []
  };
}

const StoreContext = createContext<{ state: StoreState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'lenswriter_data';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initializer = (initial: StoreState): StoreState => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...initial,
          ...parsed,
          deadlines: parsed.deadlines || initial.deadlines || []
        };
      }
    } catch (e) {
      console.error("Failed to load from local storage", e);
    }
    return initial;
  };

  const [state, dispatch] = useReducer(storeReducer, initialState, initializer);

  React.useEffect(() => {
    try {
      const { past, future, ...stateToSave } = state;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
