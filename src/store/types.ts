export type Work = { id: string; title: string; createdAt: number; order: number; characterFields?: CharacterFieldDef[]; lensesDescription?: string; icon?: string };
export type Character = { id: string; workId: string; name: string; description: string; order: number; customFields?: Record<string, any> };
export type Chapter = { id: string; workId: string; title: string; order: number; goalWordCount?: number; deadline?: string; completed?: boolean; archived?: boolean };
export type Scene = { id: string; chapterId: string; title: string; order: number; characterIds: string[]; statusColor?: string; linkedEventIds?: string[]; goalWordCount?: number; deadline?: string };
export type Block = { id: string; documentId: string; type: 'text'; isLens?: boolean; lensColor?: string; content: string; order: number; notes?: string; linkedLensIds?: string[]; description?: string; completed?: boolean; pinned?: boolean };

export type Location = { id: string; workId: string; name: string; description: string; order: number };

export type Tag = {
  id: string;
  workId: string;
  name: string;
  color?: string;
};

export type TimelineEvent = {
  id: string;
  workId: string;
  title: string;
  timestamp: string;
  locationId?: string;
  description?: string;
  characterActions: Record<string, string>;
  linkedEventIds?: string[];
  tagIds?: string[];
  color?: string;
  order: number;
  status?: 'pool' | 'timeline';
  beforeIds?: string[];
  afterIds?: string[];
  simultaneousIds?: string[];
};

export type CharacterFieldType = 'text' | 'number' | 'select' | 'multiselect';
export type CharacterFieldDef = { id: string; name: string; type: CharacterFieldType; options: string[] };

export type Deadline = {
  id: string;
  workId: string;
  title: string;
  date: string;
  completed: boolean;
};


export type InboxTag = {
  id: string;
  name: string;
  color?: string;
};

export type InboxItem = {
  id: string;
  content: string;
  createdAt: number;
  tagIds?: string[];
};

export type SceneSnapshot = {
  id: string;
  sceneId: string;
  name: string;
  createdAt: number;
  blocks: Block[];
};

export type HistoryAction = 
  | { type: 'DELETE_BLOCK'; block: Block; index: number }
  | { type: 'ADD_BLOCK'; block: Block; index: number }
  | { type: 'MERGE_BLOCK'; blockId: string; prevBlockId: string; originalPrevContent: string; deletedBlock: Block; index: number }
  | { type: 'REMOVE_LENS'; blockId: string; originalLensColor?: string }
  | { type: 'RESTORE_SNAPSHOT'; sceneId: string; previousBlocks: Block[]; restoredBlocks: Block[] };

export type State = {
  works: Work[];
  characters: Character[];
  locations: Location[];
  tags: Tag[];
  timelineEvents: TimelineEvent[];
  chapters: Chapter[];
  scenes: Scene[];
  blocks: Block[];
  deadlines: Deadline[];
  inbox: InboxItem[];
  inboxTags: InboxTag[];
  snapshots: SceneSnapshot[];
  activeWorkId: string | null;
  activeDocumentId: string | null;
  activeTab: 'writing' | 'world' | 'deadline' | 'compile' | 'inbox' | 'blockDescriptions' | 'lenses' | 'timelineEvents';
  appMode: 'writing' | 'management';
  deadlineViewMode: 'global' | 'local';
  activeLensId: string | null;
  selectedEventId: string | null;
  focusMode: boolean;
  disguiseMode: boolean;
  rightSidebarMode: 'closed' | 'micro' | 'meso' | 'macro' | 'info';
  lastInspectorTab: 'micro' | 'meso' | 'macro' | 'info';
  showDescriptions: boolean;
  letterSpacing: number;
  editorMargin: number;
  supabaseSyncEnabled?: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  lastModified: number;
  lastDevice?: 'Desktop' | 'Mobile';
  pastActions?: HistoryAction[];
  futureActions?: HistoryAction[];
};

export type StoreState = State & UISlice & BlockSlice & ChapterSlice & CharacterSlice & SceneSlice & TagSlice & DeadlineSlice & InboxSlice & TimelineSlice & WorkSlice & LocationSlice & SnapshotSlice & {
  importData: (data: Partial<State>) => void;
  syncFromCloud: (data: Partial<State>) => void;
  undo: () => void;
  redo: () => void;
};

export interface UISlice {
  setActiveDocument: (documentId: string | null) => void;
  setActiveTab: (tab: 'writing' | 'world' | 'deadline' | 'compile' | 'inbox' | 'blockDescriptions' | 'lenses' | 'timelineEvents') => void;
  setAppMode: (mode: 'writing' | 'management') => void;
  toggleAppMode: () => void;
  setDeadlineViewMode: (mode: 'global' | 'local') => void;
  setActiveLens: (lensId: string | null) => void;
  setSelectedEventId: (eventId: string | null) => void;
  toggleFocusMode: () => void;
  toggleDisguiseMode: () => void;
  setRightSidebarMode: (mode: 'closed' | 'micro' | 'meso' | 'macro' | 'info') => void;
  toggleShowDescriptions: () => void;
  setLetterSpacing: (spacing: number) => void;
  setEditorMargin: (margin: number) => void;
  toggleSupabaseSync: () => void;
  saveHistoryVersion: (name: string) => Promise<void>;
}

export interface BlockSlice {
  addBlock: (params: { documentId: string, type: 'text', isLens?: boolean, lensColor?: string, afterBlockId?: string, notes?: string }) => void;
  updateBlock: (block: Partial<Block> & { id: string }) => void;
  deleteBlock: (blockId: string) => void;
  removeLens: (blockId: string) => void;
  mergeBlockUp: (blockId: string) => void;
  bulkUpdateBlocks: (updates: { id: string; content: string }[]) => void;
}

export interface ChapterSlice {
  addChapter: (workId: string, title: string) => void;
  updateChapter: (chapter: Partial<Chapter> & { id: string }) => void;
  deleteChapter: (chapterId: string) => void;
  toggleChapterArchive: (chapterId: string) => void;
  reorderChapters: (workId: string, startIndex: number, endIndex: number) => void;
}

export interface CharacterSlice {
  addCharacter: (workId: string, name: string) => void;
  updateCharacter: (character: Partial<Character> & { id: string }) => void;
  deleteCharacter: (characterId: string) => void;
  reorderCharacters: (workId: string, startIndex: number, endIndex: number) => void;
  updateCharacterCustomField: (characterId: string, fieldId: string, value: any) => void;
}

export interface SceneSlice {
  addScene: (params: { chapterId: string, title?: string }) => void;
  updateScene: (scene: Partial<Scene> & { id: string }) => void;
  deleteScene: (sceneId: string) => void;
  reorderScenes: (chapterId: string, startIndex: number, endIndex: number) => void;
  moveScene: (sceneId: string, newChapterId: string, newIndex: number) => void;
  toggleSceneCharacter: (sceneId: string, characterId: string) => void;
  toggleSceneEvent: (sceneId: string, eventId: string) => void;
  reorderSceneEvents: (sceneId: string, startIndex: number, endIndex: number) => void;
  toggleLensPin: (sceneId: string) => void;
  splitSceneAtBlock: (sceneId: string, blockId: string) => void;
}

export interface TagSlice {
  addTag: (tag: { workId: string; name: string; color?: string }) => string;
  updateTag: (tag: Partial<Tag> & { id: string }) => void;
  deleteTag: (tagId: string) => void;
}

export interface DeadlineSlice {
  addDeadline: (deadline: { workId: string; title: string; date: string }) => void;
  updateDeadline: (deadline: Partial<Deadline> & { id: string }) => void;
  deleteDeadline: (deadlineId: string) => void;
}

export interface InboxSlice {
  addInboxItem: (params: { content: string; tagIds?: string[] }) => void;
  updateInboxItem: (item: Partial<InboxItem> & { id: string }) => void;
  deleteInboxItem: (params: { id: string }) => void;
  addInboxTag: (tag: Omit<InboxTag, 'id'>) => string;
  updateInboxTag: (tag: Partial<InboxTag> & { id: string }) => void;
  deleteInboxTag: (tagId: string) => void;
}

export interface SnapshotSlice {
  addSnapshot: (sceneId: string, name: string) => void;
  renameSnapshot: (id: string, name: string) => void;
  deleteSnapshot: (id: string) => void;
  restoreSnapshot: (id: string) => void;
}

export interface TimelineSlice {
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'order' | 'status' | 'beforeIds' | 'afterIds' | 'simultaneousIds'> & { id?: string }) => void;
  updateTimelineEvent: (event: Partial<TimelineEvent> & { id: string }) => void;
  updateTimelineEventRelations: (eventId: string, beforeIds: string[], afterIds: string[], simultaneousIds: string[]) => void;
  updateTimelineEventCharacterAction: (eventId: string, characterId: string, action: string) => void;
  toggleTimelineEventLink: (eventId: string, targetEventId: string) => void;
  deleteTimelineEvent: (eventId: string) => void;
  reorderTimelineEvents: (workId: string, sourceId: string, destinationIndex: number, sourceStatus: 'pool' | 'timeline', destinationStatus: 'pool' | 'timeline') => void;
}

export interface WorkSlice {
  addWork: (title: string) => void;
  updateWork: (work: Partial<Work> & { id: string }) => void;
  deleteWork: (workId: string) => void;
  reorderWorks: (startIndex: number, endIndex: number) => void;
  setActiveWork: (workId: string) => void;
  addCharacterField: (workId: string, field: CharacterFieldDef) => void;
  updateCharacterField: (workId: string, fieldId: string, updates: Partial<CharacterFieldDef>) => void;
  deleteCharacterField: (workId: string, fieldId: string) => void;
  reorderCharacterFields: (workId: string, startIndex: number, endIndex: number) => void;
}

export interface LocationSlice {
  addLocation: (workId: string, name: string) => void;
  updateLocation: (location: Partial<Location> & { id: string }) => void;
  deleteLocation: (locationId: string) => void;
  reorderLocations: (workId: string, startIndex: number, endIndex: number) => void;
}

