import React from 'react';
import { useStore } from './store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OutlinePanel } from './components/OutlinePanel';
import { EditorPanel } from './components/EditorPanel';
import { LensesTab } from './components/LensesTab';
import { TimelineTab } from './components/TimelineTab';
import { BlockManagementTab } from './components/BlockManagementTab';
import { WorldTab } from './components/WorldTab';
import { DeadlineTab } from './components/DeadlineTab';
import { CompileTab } from './components/CompileTab';
import { InboxTab } from './components/InboxTab';
import { Minimize2 } from 'lucide-react';
import { QuickCapture } from './components/QuickCapture';
import { BackupProvider } from './context/BackupContext';
import { SyncManager } from './components/SyncManager';
import { Toaster } from 'sonner';

function MainContent({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
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
    setRightSidebarMode
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
    setRightSidebarMode: state.setRightSidebarMode
  })));

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

      // Ctrl+I toggle Inspector
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        if (activeTab === 'writing' && activeDocumentId && !disguiseMode) {
          e.preventDefault();
          if (rightSidebarMode === 'closed') {
            const isScene = scenes.some(s => s.id === activeDocumentId);
            const canShowLastTab = isScene || (lastInspectorTab !== 'info' && lastInspectorTab !== 'macro');
            setRightSidebarMode(canShowLastTab ? lastInspectorTab : 'micro');
          } else {
            setRightSidebarMode('closed');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disguiseMode, focusMode, activeTab, activeDocumentId, rightSidebarMode, lastInspectorTab, scenes, toggleDisguiseMode, toggleFocusMode, setRightSidebarMode]);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-white relative">
      {!disguiseMode && <TopNav setMobileOpen={setMobileOpen} />}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'writing' && (
          <>
            {!disguiseMode && <OutlinePanel setMobileOpen={setMobileOpen} />}
            <EditorPanel />
          </>
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
      </div>

      {focusMode && !disguiseMode && (
        <div className="fixed top-0 right-0 w-32 h-32 z-50 flex items-start justify-end p-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => toggleFocusMode()}
            className="p-3 bg-stone-900/80 text-white rounded-full shadow-lg backdrop-blur-sm hover:bg-stone-900 transition-colors"
            title="Exit Focus Mode (Esc)"
          >
            <Minimize2 size={24} />
          </button>
        </div>
      )}
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
      <MainContent mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
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

