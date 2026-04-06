import React from 'react';
import { useStore } from './store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { TabConfigItem } from './store/types';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OutlinePanel } from './components/OutlinePanel';
import { EditorPanel } from './components/EditorPanel';
import { LensesTab } from './components/LensesTab';
import { TimelineTab } from './components/TimelineTab';
import { MetroTab } from './components/MetroTab';
import { MontageTab } from './components/MontageTab';
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
import { ShortcutModal } from './components/ShortcutModal';
import { Toaster, toast } from 'sonner';

function MainContent({ setMobileOpen }: { setMobileOpen: (open: boolean) => void }) {
  const { 
    disguiseMode, 
    focusMode, 
    activeTab, 
    activeDocumentId, 
    rightSidebarMode, 
    lastInspectorTab, 
    scenes, 
    activeWorkId, 
    deadlineViewMode,
    toggleDisguiseMode,
    toggleFocusMode,
    setRightSidebarMode,
    supabaseSyncEnabled,
    saveHistoryVersion,
    tabConfig,
    updateTabConfig
  } = useStore(useShallow(state => ({
    disguiseMode: state.disguiseMode,
    focusMode: state.focusMode,
    activeTab: state.activeTab,
    activeDocumentId: state.activeDocumentId,
    rightSidebarMode: state.rightSidebarMode,
    lastInspectorTab: state.lastInspectorTab,
    scenes: state.scenes,
    activeWorkId: state.activeWorkId,
    deadlineViewMode: state.deadlineViewMode,
    toggleDisguiseMode: state.toggleDisguiseMode,
    toggleFocusMode: state.toggleFocusMode,
    setRightSidebarMode: state.setRightSidebarMode,
    supabaseSyncEnabled: state.supabaseSyncEnabled,
    saveHistoryVersion: state.saveHistoryVersion,
    tabConfig: state.tabConfig,
    updateTabConfig: state.updateTabConfig
  })));

  // Migration for existing users to add 'dataManagement' tab if missing or rename 'archive'
  React.useEffect(() => {
    if (tabConfig) {
      (['design', 'review', 'management'] as const).forEach(mode => {
        if (tabConfig[mode]) {
          const hasArchive = tabConfig[mode].some(t => t.id === 'archive' as any);
          const hasDataManagement = tabConfig[mode].some(t => t.id === 'dataManagement');
          
          if (hasArchive || !hasDataManagement) {
            const newModeConfig: TabConfigItem[] = tabConfig[mode].map(t => {
              if (t.id === 'archive' as any) {
                return { ...t, id: 'dataManagement', label: 'Data Management' } as TabConfigItem;
              }
              return t;
            });
            
            if (!newModeConfig.some(t => t.id === 'dataManagement')) {
              newModeConfig.push({ id: 'dataManagement', label: 'Data Management', visible: mode === 'management' });
            }

            if (!newModeConfig.some(t => t.id === 'publish')) {
              newModeConfig.push({ id: 'publish', label: 'Publishing', visible: mode === 'management' });
            }
            
            if (!newModeConfig.some(t => t.id === 'script')) {
              newModeConfig.push({ id: 'script', label: 'Script', visible: mode === 'design' });
            }
            
            updateTabConfig(mode, newModeConfig);
          } else {
            let needsUpdate = false;
            const newModeConfig = [...tabConfig[mode]];
            
            if (!newModeConfig.some(t => t.id === 'publish')) {
               newModeConfig.push({ id: 'publish' as any, label: 'Publishing', visible: mode === 'management' });
               needsUpdate = true;
            }
            
            if (!newModeConfig.some(t => t.id === 'script')) {
               newModeConfig.push({ id: 'script' as any, label: 'Script', visible: mode === 'design' });
               needsUpdate = true;
            }
            
            if (needsUpdate) {
               updateTabConfig(mode, newModeConfig);
            }
          }
        }
      });
    }
  }, [tabConfig, updateTabConfig]);

  const [showShortcutModal, setShowShortcutModal] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (disguiseMode) {
          e.preventDefault();
          toggleDisguiseMode();
        } else if (focusMode) {
          e.preventDefault();
          toggleFocusMode();
        }
      }

      // Ctrl+S Manual Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (supabaseSyncEnabled) {
          e.preventDefault();
          saveHistoryVersion('Manual Save (Shortcut)').then(success => {
            if (success) {
              toast.success('Version saved successfully');
            } else {
              toast.error('Failed to save version. Please check your connection.');
            }
          });
        }
      }

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
  }, [disguiseMode, focusMode, activeTab, activeDocumentId, rightSidebarMode, lastInspectorTab, scenes, toggleDisguiseMode, toggleFocusMode, setRightSidebarMode, supabaseSyncEnabled, saveHistoryVersion]);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-white relative">
      {showShortcutModal && <ShortcutModal onClose={() => setShowShortcutModal(false)} />}
      {!disguiseMode && <TopNav setMobileOpen={setMobileOpen} />}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'design' && (
          <>
            {!disguiseMode && !focusMode && <OutlinePanel setMobileOpen={setMobileOpen} />}
            <EditorPanel focusMode={focusMode} />
          </>
        )}
        {activeTab === 'blockDescriptions' && <BlockManagementTab />}
        {activeTab === 'lenses' && <LensesTab />}
        {activeTab === 'timelineEvents' && <TimelineTab />}
        {activeTab === 'montage' && <MontageTab />}
        {activeTab === 'metro' && <MetroTab />}
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

      {/* Focus mode exit button removed as TopNav now handles focus mode exit */}
    </div>
  );
}

function Layout() {
  const disguiseMode = useStore(state => state.disguiseMode);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans text-stone-900 bg-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      <Toaster position="top-right" richColors />
      {!disguiseMode && <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
      <MainContent setMobileOpen={setMobileOpen} />
      <QuickCapture />
      <SyncManager />
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

