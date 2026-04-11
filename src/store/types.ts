export type Work = { id: string; title: string; createdAt: number; order: number; characterFields?: CharacterFieldDef[]; lensesDescription?: string; icon?: string };
export type Character = { id: string; workId: string; name: string; description: string; order: number; customFields?: Record<string, any> };
export type Chapter = { id: string; workId: string; title: string; order: number; goalWordCount?: number; deadline?: string; completed?: boolean; archived?: boolean };
export type Scene = { id: string; chapterId: string; title: string; order: number; characterIds: string[]; characterPresence?: Record<string, { note?: string }>; statusColor?: string; linkedEventIds?: string[]; goalWordCount?: number; deadline?: string };
export type Block = { id: string; documentId: string; type: 'text'; isLens?: boolean; lensColor?: string; content: string; order: number; notes?: string; linkedLensIds?: string[]; description?: string; completed?: boolean; pinned?: boolean; draftContent?: string; isComparing?: boolean; isStashed?: boolean };

export type ScriptDraft = {
  id: string;
  workId: string;
  title: string;
  characterIds: string[];
  content: string;
  createdAt: number;
};

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
  duration?: number; // Abstract duration units
  importance?: number; // 1-5
  startTime?: number; // Start time on the timeline (determines if in pool)
  horizontalIds?: string[];
  verticalIds?: string[];
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

export type Note = {
  id: string;
  content: string;
  createdAt: number;
  workId: string | null;
  sceneId: string | null;
  tagIds?: string[];
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

export type MetroBranchDirection = 1 | -1;

export type MetroNode = {
  id: string;
  lineId: string;
  eventId: string;
  nextId: string | null;
  branches: {
    nodeId: string;
    direction: MetroBranchDirection;
  }[];
};

export type MetroLine = {
  id: string;
  workId: string;
  title: string;
  rootNodeId: string | null;
  color?: string;
};

export type ChapterSnapshot = {
  id: string;
  chapterId: string;
  versionName: string;
  data: {
    chapter: Chapter;
    scenes: Scene[];
    blocks: Block[];
  };
  timestamp: number;
  note?: string;
};

export type PlatformChapterStatus = {
  chapterId: string;
  lastPublishedSnapshotId: string | null;
  status: 'published' | 'to_update' | 'not_published';
};

export type PlatformTracking = {
  id: string;
  workId: string;
  platformName: string;
  chapterStatuses: Record<string, PlatformChapterStatus>; // chapterId -> status
};

export type TabConfigItem = {
  id: 'design' | 'world' | 'deadline' | 'compile' | 'inbox' | 'blockDescriptions' | 'lenses' | 'timelineEvents' | 'dataManagement' | 'publish' | 'script';
  label: string;
  visible: boolean;
};

export type TabConfig = {
  design: TabConfigItem[];
  review: TabConfigItem[];
  management: TabConfigItem[];
};

export type DailyStats = {
  total: number;
  netChange: number;
  sceneCounts: Record<string, number>;
  isManual?: boolean;
};

export interface SidebarItemConfig {
  id: string;
  visible: boolean;
}

export interface SidebarGroupConfig {
  id: string;
  title: string;
  items: SidebarItemConfig[];
}

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
  notes: Note[];
  inboxTags: InboxTag[];
  snapshots: SceneSnapshot[];
  metroLines: MetroLine[];
  metroNodes: MetroNode[];
  scriptDrafts: ScriptDraft[];
  dailyWordCounts: Record<string, DailyStats>; // Date string -> Stats
  lastSceneCounts: Record<string, number>; // SceneId -> last total word count
  activeWorkId: string | null;
  activeDocumentId: string | null;
  activeTab: 'design' | 'world' | 'deadline' | 'compile' | 'inbox' | 'blockDescriptions' | 'lenses' | 'timelineEvents' | 'dataManagement' | 'publish' | 'script';
  timelineViewMode: 'list' | 'table' | 'chronology' | 'tags' | 'metro' | 'montage';
  timelineSearchQuery: string;
  worldViewMode: 'characters' | 'locations';
  deadlineViewMode: 'global' | 'local';
  activeLensId: string | null;
  selectedEventId: string | null;
  sidebarPinned: boolean;
  fullscreenMode: boolean;
  scrollMode: boolean;
  writingFocusMode: boolean;
  disguiseMode: boolean;
  disguiseBackgroundText: string;
  rightSidebarMode: 'closed' | 'micro' | 'meso' | 'macro' | 'info' | 'notes' | 'snapshots';
  lastInspectorTab: 'micro' | 'meso' | 'macro' | 'info' | 'notes' | 'snapshots';
  showDescriptions: boolean;
  letterSpacing: number;
  editorMargin: number;
  timelineTableColumns?: any[];
  supabaseSyncEnabled?: boolean;
  sidebarConfig?: SidebarGroupConfig[];
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  lastModified: number;
  lastSynced?: number;
  cloudLastModified?: number;
  isCheckingCloud: boolean;
  lastDevice?: 'Desktop' | 'Mobile';
  pastActions?: HistoryAction[];
  futureActions?: HistoryAction[];
  chapterSnapshots: ChapterSnapshot[];
  platformTrackings: PlatformTracking[];
};

export type StoreState = State & UISlice & BlockSlice & ChapterSlice & CharacterSlice & SceneSlice & TagSlice & DeadlineSlice & NoteSlice & TimelineSlice & WorkSlice & LocationSlice & SnapshotSlice & MetroSlice & PublishSlice & ScriptSlice & StatsSlice & {
  importData: (data: Partial<State>) => void;
  mergeData: (data: Partial<State>) => void;
  syncFromCloud: (data: Partial<State>) => void;
  undo: () => void;
  redo: () => void;
};

export interface StatsSlice {
  updateDailyWordCount: (sceneId: string, newWordCount: number) => void;
  removeSceneFromDailyCount: (sceneId: string) => void;
  resetDailyWordCount: (date: string) => void;
  updateDailyWordCountManual: (date: string, wordCount: number) => void;
}

export interface PublishSlice {
  createChapterSnapshot: (chapterId: string, versionName: string, note?: string) => void;
  deleteChapterSnapshot: (snapshotId: string) => void;
  addPlatformTracking: (workId: string, platformName: string) => void;
  deletePlatformTracking: (id: string) => void;
  publishChapterToPlatform: (platformId: string, chapterId: string, snapshotId: string) => void;
  syncPlatformStatus: (workId: string) => void;
}

export interface MetroSlice {
  addMetroLine: (workId: string, title: string) => void;
  updateMetroLine: (id: string, updates: Partial<MetroLine>) => void;
  deleteMetroLine: (id: string) => void;
  addMetroNodeBefore: (nodeId: string) => void;
  addMetroNodeAfter: (nodeId: string) => void;
  addMetroBranch: (nodeId: string, direction: MetroBranchDirection) => void;
  replaceMetroNodeEvent: (nodeId: string, eventId: string) => void;
  deleteMetroNode: (nodeId: string) => void;
}

export interface UISlice {
  setActiveDocument: (documentId: string | null) => void;
  setActiveTab: (tab: 'design' | 'world' | 'deadline' | 'compile' | 'inbox' | 'blockDescriptions' | 'lenses' | 'timelineEvents' | 'dataManagement' | 'publish') => void;
  setTimelineViewMode: (mode: 'list' | 'table' | 'chronology' | 'tags' | 'metro' | 'montage') => void;
  setWorldViewMode: (mode: 'characters' | 'locations') => void;
  setDeadlineViewMode: (mode: 'global' | 'local') => void;
  setActiveLens: (lensId: string | null) => void;
  setSelectedEventId: (eventId: string | null) => void;
  toggleSidebarPinned: () => void;
  toggleFullscreenMode: () => void;
  toggleScrollMode: () => void;
  toggleWritingFocusMode: () => void;
  toggleDisguiseMode: () => void;
  setDisguiseBackgroundText: (text: string) => void;
  setRightSidebarMode: (mode: 'closed' | 'micro' | 'meso' | 'macro' | 'info' | 'notes' | 'snapshots') => void;
  toggleShowDescriptions: () => void;
  setLetterSpacing: (spacing: number) => void;
  setEditorMargin: (margin: number) => void;
  setTimelineTableColumns: (columns: any[]) => void;
  toggleSupabaseSync: () => void;
  updateSidebarConfig: (config: SidebarGroupConfig[]) => void;
  saveHistoryVersion: (name: string) => Promise<boolean>;
  pushToCloud: () => Promise<boolean>;
  pullFromCloud: () => Promise<boolean>;
  undoPull: () => boolean;
  fetchHistory: () => Promise<any[]>;
  restoreFromSnapshot: (snapshotId: string) => Promise<boolean>;
  checkCloudVersion: () => Promise<void>;
}

export interface BlockSlice {
  addBlock: (params: { id?: string, documentId: string, type: 'text', isLens?: boolean, lensColor?: string, afterBlockId?: string, notes?: string, isStashed?: boolean }) => void;
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
  updateSceneCharacterNote: (sceneId: string, characterId: string, note: string) => void;
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

export interface NoteSlice {
  addNote: (params: { content: string; workId?: string | null; sceneId?: string | null; tagIds?: string[] }) => void;
  updateNote: (note: Partial<Note> & { id: string }) => void;
  deleteNote: (noteId: string) => void;
  reassignNote: (noteId: string, workId: string | null, sceneId: string | null) => void;
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
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'order'> & { id?: string }) => void;
  updateTimelineEvent: (event: Partial<TimelineEvent> & { id: string }) => void;
  updateTimelineEvents: (events: (Partial<TimelineEvent> & { id: string })[]) => void;
  updateTimelineEventCharacterAction: (eventId: string, characterId: string, action: string) => void;
  toggleTimelineEventLink: (eventId: string, targetEventId: string) => void;
  toggleTimelineEventHorizontal: (eventId: string, targetEventId: string) => void;
  toggleTimelineEventVertical: (eventId: string, targetEventId: string) => void;
  deleteTimelineEvent: (eventId: string) => void;
  reorderTimelineEvents: (workId: string, sourceId: string, destinationIndex: number, isSourcePool: boolean, isDestPool: boolean) => void;
  setTimelineSearchQuery: (query: string) => void;
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

export interface ScriptSlice {
  addScriptDraft: (draft: Omit<ScriptDraft, 'id' | 'createdAt'>) => string;
  updateScriptDraft: (draft: Partial<ScriptDraft> & { id: string }) => void;
  deleteScriptDraft: (draftId: string) => void;
}

export interface LocationSlice {
  addLocation: (workId: string, name: string) => void;
  updateLocation: (location: Partial<Location> & { id: string }) => void;
  deleteLocation: (locationId: string) => void;
  reorderLocations: (workId: string, startIndex: number, endIndex: number) => void;
}

