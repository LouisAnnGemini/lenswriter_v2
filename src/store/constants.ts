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
  isCheckingCloud: false,
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
  metroLines: [],
  metroNodes: [],
  scriptDrafts: [],
  dailyWordCounts: {},
  lastSceneCounts: {},
  chapterSnapshots: [],
  platformTrackings: [],
  activeWorkId: initialWorkId,
  activeDocumentId: initialSceneId,
  activeTab: 'design',
  appMode: 'design',
  tabConfig: {
    design: [
      { id: 'design', label: 'Writing', visible: true },
      { id: 'timelineEvents', label: 'Timeline Events', visible: true },
      { id: 'metro', label: 'Metro', visible: true },
      { id: 'world', label: 'World', visible: true },
      { id: 'montage', label: 'Montage', visible: true },
      { id: 'script', label: 'Script', visible: true },
      { id: 'inbox', label: 'Notes', visible: false },
      { id: 'blockDescriptions', label: 'Block Descriptions', visible: false },
      { id: 'lenses', label: 'Lenses', visible: false },
      { id: 'deadline', label: 'Deadline', visible: false },
      { id: 'compile', label: 'Compile', visible: false },
      { id: 'dataManagement', label: 'Data Management', visible: false },
      { id: 'publish', label: 'Publishing', visible: false },
    ],
    review: [
      { id: 'design', label: 'Writing', visible: true },
      { id: 'inbox', label: 'Notes', visible: true },
      { id: 'blockDescriptions', label: 'Block Descriptions', visible: true },
      { id: 'lenses', label: 'Lenses', visible: true },
      { id: 'deadline', label: 'Deadline', visible: true },
      { id: 'timelineEvents', label: 'Timeline Events', visible: false },
      { id: 'montage', label: 'Montage', visible: false },
      { id: 'metro', label: 'Metro', visible: false },
      { id: 'world', label: 'World', visible: false },
      { id: 'script', label: 'Script', visible: false },
      { id: 'compile', label: 'Compile', visible: false },
      { id: 'dataManagement', label: 'Data Management', visible: false },
      { id: 'publish', label: 'Publishing', visible: false },
    ],
    management: [
      { id: 'design', label: 'Writing', visible: true },
      { id: 'compile', label: 'Compile', visible: true },
      { id: 'dataManagement', label: 'Data Management', visible: true },
      { id: 'publish', label: 'Publishing', visible: true },
      { id: 'inbox', label: 'Notes', visible: false },
      { id: 'deadline', label: 'Deadline', visible: false },
      { id: 'blockDescriptions', label: 'Block Descriptions', visible: false },
      { id: 'lenses', label: 'Lenses', visible: false },
      { id: 'timelineEvents', label: 'Timeline Events', visible: false },
      { id: 'montage', label: 'Montage', visible: false },
      { id: 'metro', label: 'Metro', visible: false },
      { id: 'world', label: 'World', visible: false },
      { id: 'script', label: 'Script', visible: false },
    ]
  },
  timelineViewMode: 'list',
  deadlineViewMode: 'local',
  activeLensId: null,
  selectedEventId: null,
  fullscreenMode: false,
  scrollMode: false,
  writingFocusMode: false,
  disguiseMode: false,
  disguiseBackgroundText: "Q3 Financial Performance Overview\n\nExecutive Summary\nThis quarter has demonstrated robust growth across all core verticals, driven by strategic realignments and optimized operational efficiencies. Our synergistic approach to market penetration has yielded a 14% increase in year-over-year revenue, outperforming initial projections.\n\nKey Metrics\n- Revenue: $42.5M (+14% YoY)\n- Operating Margin: 22.4% (+210 bps)\n- Customer Acquisition Cost (CAC): Decreased by 8%\n- Net Retention Rate (NRR): 112%\n\nStrategic Initiatives\n1. Infrastructure Modernization: The migration to cloud-native architectures is 80% complete, expected to reduce server overhead by $1.2M annually.\n2. Market Expansion: Preliminary research into the EMEA region indicates strong product-market fit. A dedicated task force has been assembled to evaluate entry strategies.\n3. Talent Acquisition: We have successfully onboarded 45 key personnel in engineering and product management to accelerate our Q4 roadmap.\n\nRisk Factors\nSupply chain volatility remains a concern, particularly regarding semiconductor availability. We are actively diversifying our vendor base to mitigate potential disruptions. Additionally, shifting regulatory landscapes in data privacy require continuous monitoring and compliance adjustments.\n\nConclusion\nThe current trajectory positions us favorably for a strong year-end finish. Continued focus on execution and cost management will be critical to achieving our revised EBITDA targets.",
  rightSidebarMode: 'closed',
  lastInspectorTab: 'macro',
  showDescriptions: true,
  letterSpacing: 0,
  editorMargin: 0,
  timelineTableColumns: [],
  supabaseSyncEnabled: false,
  syncStatus: 'idle',
  syncError: null,
  lastModified: Date.now(),
  lastDevice: 'Desktop'
};
