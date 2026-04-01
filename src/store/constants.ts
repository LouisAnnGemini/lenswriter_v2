import { v4 as uuidv4 } from 'uuid';
import { State } from './types';

export const SCENE_STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  none: { bg: 'bg-white', border: 'border-stone-200', text: 'text-stone-900', dot: 'bg-stone-200', label: 'Draft' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'First Draft' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Finished' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Revised' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', label: 'Discarded' },
};

const initialWorkId = uuidv4();
const initialChapterId = uuidv4();
const initialSceneId = uuidv4();
const initialCharId = uuidv4();
const initialBlockId1 = uuidv4();
const initialBlockId2 = uuidv4();

export const initialState: State = {
  works: [{ id: initialWorkId, title: 'The Silent Echo', createdAt: Date.now(), order: 0 }],
  characters: [
    { id: initialCharId, workId: initialWorkId, name: 'Elias Thorne', description: 'A detective with a troubled past.', order: 0 },
    { id: uuidv4(), workId: initialWorkId, name: 'Sarah Vance', description: 'An investigative journalist.', order: 1 }
  ],
  locations: [],
  tags: [],
  timelineEvents: [],
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
    { id: initialBlockId2, documentId: initialSceneId, type: 'text', isLens: true, lensColor: 'red', content: 'The victim held a small, silver locket tightly in their left hand. It bore the insignia of the old regime.', order: 1, notes: 'Crucial evidence. Connects to the mayor.', linkedLensIds: [] },
    { id: uuidv4(), documentId: initialSceneId, type: 'text', content: 'He sighed, knowing this case would be unlike any other.', order: 2 }
  ],
  deadlines: [
    { id: uuidv4(), workId: initialWorkId, title: 'First Draft', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: false }
  ],
  notes: [],
  inboxTags: [],
  snapshots: [],
  activeWorkId: initialWorkId,
  activeDocumentId: initialSceneId,
  activeTab: 'design',
  appMode: 'design',
  tabConfig: {
    design: [
      { id: 'design', label: 'Writing', visible: true },
      { id: 'inbox', label: 'Notes', visible: true },
      { id: 'blockDescriptions', label: 'Block Descriptions', visible: true },
      { id: 'lenses', label: 'Lenses', visible: true },
      { id: 'timelineEvents', label: 'Timeline Events', visible: true },
      { id: 'world', label: 'World', visible: true },
      { id: 'deadline', label: 'Deadline', visible: false },
      { id: 'compile', label: 'Compile', visible: false },
    ],
    management: [
      { id: 'design', label: 'Writing', visible: true },
      { id: 'inbox', label: 'Notes', visible: true },
      { id: 'deadline', label: 'Deadline', visible: true },
      { id: 'compile', label: 'Compile', visible: true },
      { id: 'blockDescriptions', label: 'Block Descriptions', visible: false },
      { id: 'lenses', label: 'Lenses', visible: false },
      { id: 'timelineEvents', label: 'Timeline Events', visible: false },
      { id: 'world', label: 'World', visible: false },
    ]
  },
  timelineViewMode: 'list',
  deadlineViewMode: 'local',
  activeLensId: null,
  selectedEventId: null,
  focusMode: false,
  disguiseMode: false,
  rightSidebarMode: 'closed',
  lastInspectorTab: 'micro',
  showDescriptions: true,
  letterSpacing: 0,
  editorMargin: 0,
  user: null,
  supabaseSyncEnabled: false,
  syncStatus: 'idle',
  syncError: null,
  lastModified: Date.now(),
  lastDevice: 'Desktop'
};
