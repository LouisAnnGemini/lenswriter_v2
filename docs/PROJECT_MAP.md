# Project Map (AI Context)

This file serves as a directory and mapping guide for the AI agent to quickly locate the relevant code for specific features. It does not describe the business logic, but rather *where* the code for each feature lives.

## 🗺️ Core Features & Modules

### 1. 🎨 Design & Editor (设计与编辑器)
- **Main Editor:** `src/components/EditorPanel.tsx` (Includes Scroll Mode, Disguise Mode, Focus Mode)
- **Editor Sub-components:**
  - `src/components/InspectorSidebar.tsx` (Right sidebar for timeline, outline, snapshots, and Stashed Notes)
  - `src/components/ViewSettingsMenu.tsx` (Floating view settings)
  - `src/components/DisguiseSettingsModal.tsx` (Disguise mode configuration)
  - `src/components/FloatingBackToTop.tsx` (Back to top button)
  - `src/components/BlockHoverMenu.tsx` (Left side block actions)
  - `src/components/BlockRightActions.tsx` (Right side block actions)
  - `src/components/SlashCommandMenu.tsx` (Slash command menu)
  - `src/components/AutoResizeTextarea.tsx` (Tiptap-based rich text editor wrapper)
  - `src/components/BlockCompareModal.tsx` (Block comparison modal)
  - `src/components/BatchActionModal.tsx` (Batch actions for blocks)
  - `src/components/WordDisguise.tsx` (Word disguise UI components)
- **Sidebar (Navigation):** `src/components/PrimarySidebar.tsx`
- **Outline & Scene Management:** `src/components/SecondarySidebar.tsx`
- **Find & Replace:** `src/components/FindReplaceBar.tsx`
- **Chapter Overview:** `src/components/ChapterScenesList.tsx`, `src/components/CharacterAppearanceMatrix.tsx`
- **Workspace:** `src/components/WorkspaceSwitcher.tsx`, `src/components/Header.tsx`
- **State Management:** `src/store/stores/slices/sceneSlice.ts`, `src/store/stores/slices/chapterSlice.ts`, `src/store/stores/slices/workSlice.ts`, `src/store/stores/slices/blockSlice.ts`

### 2. 📥 Inbox (收件箱 / 快速记录)
- **Main Tab View:** `src/components/InboxTab.tsx`
- **Mobile Drawer:** `src/components/MobileInboxDrawer.tsx`
- **Quick Capture:** `src/components/QuickCapture.tsx`
- **State Management:** `src/store/stores/slices/tagDeadlineInboxSlice.ts`

### 3. 🧩 Block Descriptions (区块描述)
- **Main View:** `src/components/BlockManagementTab.tsx`
- **State Management:** `src/store/stores/slices/blockSlice.ts`

### 4. 🔍 Lenses (透镜 / 视角)
- **Main Tab View:** `src/components/LensesTab.tsx`
- **Side Panel View:** `src/components/LensesPanel.tsx`

### 5. ⏱️ Timeline & Events (时间线与事件)
- **Main Tab View:** `src/components/TimelineTab.tsx`
- **Timeline Sub-components:** 
  - `src/components/timeline/TimelineVisualChronology.tsx` (Chronology View)
  - `src/components/timeline/TimelineTableView.tsx` (Table View with Column Management, Overscrolling & Filters)
  - `src/components/timeline/TimelineShared.tsx` (Shared UI)
- **Event Modals:** `src/components/AddEventModal.tsx`, `src/components/EventDetailsModal.tsx`
- **Event Pool:** `src/components/EventPoolPanel.tsx`
- **Utilities:** `src/lib/timelineUtils.ts`
- **State Management:** `src/store/stores/slices/timelineSlice.ts`

### 6. 👥 Characters & 🌍 Locations & World (角色、地点与世界观)
- **Characters View:** `src/components/CharactersTab.tsx`
- **Locations View:** `src/components/LocationsTab.tsx`
- **World View:** `src/components/WorldTab.tsx`
- **State Management:** `src/store/stores/slices/characterSlice.ts`, `src/store/stores/slices/locationSlice.ts`

### 7. 🏷️ Tags & Deadlines (标签与截止日期)
- **Tags View:** `src/components/TagManagerTab.tsx`, `src/components/TagManagerModal.tsx`
- **Deadline View:** `src/components/DeadlineTab.tsx`
- **State Management:** `src/store/stores/slices/tagDeadlineInboxSlice.ts`

### 8. 🎬 Montage Board (蒙太奇看板)
- **Main View:** `src/components/MontageBoard.tsx`
- **Board Tab:** `src/components/MontageTab.tsx`

### 9. 📦 Compile & Export (编译与导出)
- **Main View:** `src/components/CompileTab.tsx`

### 10. 💾 Data, Backup & Sync (数据、备份与同步)
- **Backup Manager:** `src/components/BackupManager.tsx`
- **Sync Manager:** `src/components/SyncManager.tsx`
- **Snapshots:** `src/components/SnapshotTab.tsx`
- **Data Manager:** `src/components/DataManager.tsx`
- **State Management:** `src/store/stores/slices/snapshotSlice.ts`
- **Context:** `src/context/BackupContext.tsx`
- **Supabase Client:** `src/lib/supabase.ts`

### 11. 📝 Notes & Stashed Blocks (笔记与暂存块)
- **Notes Tab:** `src/components/NotesTab.tsx` (Manages stashed blocks from `blockSlice`)
- **Quick Capture:** `src/components/QuickCapture.tsx` (Manages `Note` entities from `noteSlice`)
- **Inbox:** `src/components/InboxTab.tsx` (View for `Note` entities)
- **State Management:** `src/store/stores/slices/noteSlice.ts`

### 12. 🛠️ Common & Utility UI (通用组件)
- **Work Icons:** `src/components/WorkIcon.tsx`, `src/components/WorkIconPicker.tsx`
- **Inputs & Selects:** `src/components/AutoResizeTextarea.tsx`, `src/components/MultiSelectDropdown.tsx`, `src/components/SearchableSelect.tsx`
- **Actions:** `src/components/ConfirmDeleteButton.tsx`
- **Error Handling:** `src/components/ErrorBoundary.tsx`
- **Modals:** `src/components/ShortcutModal.tsx`, `src/components/PrimarySidebarSettingsModal.tsx`
- **UI Components:** `src/components/ui/ConfirmationModal.tsx`, `src/components/ui/VersionHistoryModal.tsx`

### 13. 🚇 Metro (故事地铁线)
- **Main View:** `src/components/MetroTab.tsx`
- **Board:** `src/components/MetroBoard.tsx`
- **State Management:** `src/store/stores/slices/metroSlice.ts`

### 14. 📢 Publish Management (发布管理)
- **Main View:** `src/components/PublishManager.tsx`
- **State Management:** `src/store/stores/slices/publishSlice.ts`

### 15. 🎭 Script (剧本)
- **Main View:** `src/components/ScriptTab.tsx`
- **State Management:** `src/store/stores/slices/scriptSlice.ts`

### 16. 📊 Word Count Statistics (字数统计)
- **Main View:** `src/components/DeadlineTab.tsx` (Calendar & Chart)
- **State Management:** `src/store/stores/slices/statsSlice.ts`
- **Types:** `src/store/types.ts` (DailyStats)

---

## 🏗️ Architecture & State Management

- **Global State (Zustand):** The main store is combined in `src/store/stores/useStore.ts`. It is split into multiple slices located in `src/store/stores/slices/`.
- **Top Navigation:** `src/components/TopNav.tsx` (Controls which tab/mode is currently active, e.g., Writing (Design mode), Inbox, Timeline).
- **UI State:** Managed via `src/store/stores/slices/uiSlice.ts`.
- **Types & Constants:** `src/store/types.ts`, `src/store/constants.ts`.
- **Styling:** Tailwind CSS (`src/index.css`) with utility functions in `src/lib/utils.ts`.
