# Project Map (AI Context)

This file serves as a directory and mapping guide for the AI agent to quickly locate the relevant code for specific features. It does not describe the business logic, but rather *where* the code for each feature lives.

## 🗺️ Core Features & Modules

### 1. 🎨 Design & Editor (设计与编辑器)
- **Main Editor:** `src/components/EditorPanel.tsx`
- **Block Compare & Edit:** `src/components/BlockCompareModal.tsx`
- **Sidebar (Navigation/Outline):** `src/components/Sidebar.tsx`
- **Outline Panel:** `src/components/OutlinePanel.tsx`
- **Find & Replace:** `src/components/FindReplaceBar.tsx`
- **Chapter Overview:** `src/components/ChapterScenesList.tsx`, `src/components/CharacterAppearanceMatrix.tsx`
- **State Management:** `src/store/stores/slices/sceneSlice.ts`, `src/store/stores/slices/chapterSlice.ts`, `src/store/stores/slices/workSlice.ts`, `src/store/stores/slices/blockSlice.ts`

### 2. 📥 Inbox (收件箱 / 快速记录)
- **Main Tab View:** `src/components/InboxTab.tsx`
- **Side Panel View:** `src/components/InboxPanel.tsx`
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
  - `src/components/timeline/TimelineChronologyView.tsx` (Chronology View)
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
- **Board Tab:** `src/components/BoardTab.tsx`

### 9. 📦 Compile & Export (编译与导出)
- **Main View:** `src/components/CompileTab.tsx`

### 10. 💾 Data, Backup & Sync (数据、备份与同步)
- **Backup Manager:** `src/components/BackupManager.tsx`
- **Sync Manager:** `src/components/SyncManager.tsx`
- **Snapshots:** `src/components/SnapshotDialog.tsx`
- **State Management:** `src/store/stores/slices/snapshotSlice.ts`
- **Context:** `src/context/BackupContext.tsx`
- **Supabase Client:** `src/lib/supabase.ts`

### 12. 🛠️ Common & Utility UI (通用组件)
- **Work Icons:** `src/components/WorkIcon.tsx`, `src/components/WorkIconPicker.tsx`
- **Inputs & Selects:** `src/components/AutoResizeTextarea.tsx`, `src/components/MultiSelectDropdown.tsx`, `src/components/SearchableSelect.tsx`
- **Actions:** `src/components/ConfirmDeleteButton.tsx`
- **Error Handling:** `src/components/ErrorBoundary.tsx`

### 13. 🚇 Metro (故事地铁线)
- **Main View:** `src/components/MetroTab.tsx`
- **Board:** `src/components/MetroBoard.tsx`
- **State Management:** `src/store/stores/slices/metroSlice.ts`

---

## 🏗️ Architecture & State Management

- **Global State (Zustand):** The main store is combined in `src/store/stores/useStore.ts`. It is split into multiple slices located in `src/store/stores/slices/`.
- **Top Navigation:** `src/components/TopNav.tsx` (Controls which tab/mode is currently active, e.g., Writing (Design mode), Inbox, Timeline).
- **UI State:** Managed via `src/store/stores/slices/uiSlice.ts`.
- **Types & Constants:** `src/store/types.ts`, `src/store/constants.ts`.
- **Styling:** Tailwind CSS (`src/index.css`) with utility functions in `src/lib/utils.ts`.
