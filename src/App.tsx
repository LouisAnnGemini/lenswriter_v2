import React from 'react';
import { useStore } from './store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { TabConfigItem } from './store/types';
import { PrimarySidebar } from './components/PrimarySidebar';
import { SecondarySidebar } from './components/SecondarySidebar';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { LensesTab } from './components/LensesTab';
import { TimelineTab } from './components/TimelineTab';
import { BlockManagementTab } from './components/BlockManagementTab';
import { WorldTab } from './components/WorldTab';
import { DeadlineTab } from './components/DeadlineTab';
import { CompileTab } from './components/CompileTab';
import { InboxTab } from './components/InboxTab';
import { ScriptTab } from './components/ScriptTab';
import { DataManager } from './components/DataManager';
import { PublishManager } from './components/PublishManager';
import { QuickCapture } from './components/QuickCapture';
import { BackupProvider } from './context/BackupContext';
import { SyncManager } from './components/SyncManager';
import { PrimarySidebarSettingsModal } from './components/PrimarySidebarSettingsModal';
import { ShortcutModal } from './components/ShortcutModal';
import { Toaster, toast } from 'sonner';

function MainContent({ setMobileOpen }: { setMobileOpen: (open: boolean) => void }) {
  const { 
    disguiseMode, 
    fullscreenMode, 
    activeTab, 
    activeDocumentId, 
    rightSidebarMode, 
    lastInspectorTab, 
    scenes, 
    activeWorkId, 
    deadlineViewMode,
    toggleDisguiseMode,
    toggleFullscreenMode,
    setRightSidebarMode,
    supabaseSyncEnabled,
    saveHistoryVersion
  } = useStore(useShallow(state => ({
    disguiseMode: state.disguiseMode,
    fullscreenMode: state.fullscreenMode,
    activeTab: state.activeTab,
    activeDocumentId: state.activeDocumentId,
    rightSidebarMode: state.rightSidebarMode,
    lastInspectorTab: state.lastInspectorTab,
    scenes: state.scenes,
    activeWorkId: state.activeWorkId,
    deadlineViewMode: state.deadlineViewMode,
    toggleDisguiseMode: state.toggleDisguiseMode,
    toggleFullscreenMode: state.toggleFullscreenMode,
    setRightSidebarMode: state.setRightSidebarMode,
    supabaseSyncEnabled: state.supabaseSyncEnabled,
    saveHistoryVersion: state.saveHistoryVersion
  })));

  const [showShortcutModal, setShowShortcutModal] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (disguiseMode) {
          e.preventDefault();
          toggleDisguiseMode();
        } else if (fullscreenMode) {
          e.preventDefault();
          toggleFullscreenMode();
        }
      }

      // Ctrl+S is now handled in Header.tsx

      // Ctrl+I toggle Inspector
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        if (activeTab === 'design' && activeDocumentId && !disguiseMode) {
          e.preventDefault();
          if (rightSidebarMode === 'closed') {
            // Default to 'micro' (Directory) as requested by user
            setRightSidebarMode('micro');
          } else {
            setRightSidebarMode('closed');
          }
        }
      }

      // Ctrl + Shift + K (Shortcut Modal)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcutModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    const handleToggleShortcutModal = () => {
      setShowShortcutModal(prev => !prev);
    };
    window.addEventListener('toggle-shortcut-modal', handleToggleShortcutModal);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-shortcut-modal', handleToggleShortcutModal);
    };
  }, [disguiseMode, fullscreenMode, activeTab, activeDocumentId, rightSidebarMode, lastInspectorTab, scenes, toggleDisguiseMode, toggleFullscreenMode, setRightSidebarMode, supabaseSyncEnabled, saveHistoryVersion]);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-white relative">
      {showShortcutModal && <ShortcutModal onClose={() => setShowShortcutModal(false)} />}
      {!disguiseMode && <Header setMobileOpen={setMobileOpen} />}
      <div className="flex-1 flex overflow-hidden relative">
        {!disguiseMode && !fullscreenMode && ['design', 'timelineEvents', 'world'].includes(activeTab) && (
          <SecondarySidebar setMobileOpen={setMobileOpen} />
        )}
        
        {activeTab === 'design' && (
          <EditorPanel fullscreenMode={fullscreenMode} />
        )}
        {activeTab === 'blockDescriptions' && <BlockManagementTab />}
        {activeTab === 'lenses' && <LensesTab />}
        {activeTab === 'timelineEvents' && <TimelineTab />}
        {activeTab === 'world' && <WorldTab />}
        {activeTab === 'deadline' && (
          <DeadlineTab workId={deadlineViewMode === 'local' ? (activeWorkId || undefined) : undefined} />
        )}
        {activeTab === 'compile' && <CompileTab />}
        {activeTab === 'inbox' && <InboxTab />}
        {activeTab === 'script' && <ScriptTab />}
        {activeTab === 'dataManagement' && <DataManager isTab />}
        {activeTab === 'publish' && <PublishManager isTab />}
      </div>

      {/* Focus mode exit button removed as Header now handles focus mode exit */}
    </div>
  );
}

function Layout() {
  const disguiseMode = useStore(state => state.disguiseMode);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [showSidebarSettings, setShowSidebarSettings] = React.useState(false);

  React.useEffect(() => {
    const handleToggleSidebarSettings = () => setShowSidebarSettings(true);
    window.addEventListener('toggle-sidebar-settings', handleToggleSidebarSettings);
    return () => window.removeEventListener('toggle-sidebar-settings', handleToggleSidebarSettings);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans text-stone-900 bg-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      <Toaster position="top-right" richColors />
      {!disguiseMode && <PrimarySidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
      <MainContent setMobileOpen={setMobileOpen} />
      <QuickCapture />
      <SyncManager />
      {showSidebarSettings && <PrimarySidebarSettingsModal onClose={() => setShowSidebarSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BackupProvider>
      <Layout />
    </BackupProvider>
  );
}

