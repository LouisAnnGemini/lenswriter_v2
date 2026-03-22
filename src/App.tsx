import React from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OutlinePanel } from './components/OutlinePanel';
import { EditorPanel } from './components/EditorPanel';
import { BoardTab } from './components/BoardTab';
import { WorldTab } from './components/WorldTab';
import { DeadlineTab } from './components/DeadlineTab';
import { CompileTab } from './components/CompileTab';
import { Minimize2, MessageSquare, MessageSquareOff, EyeOff, Eye } from 'lucide-react';
import { cn } from './lib/utils';

function MainContent({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const { state, dispatch } = useStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.disguiseMode) {
          e.preventDefault();
          dispatch({ type: 'TOGGLE_DISGUISE_MODE' });
        } else if (state.focusMode) {
          e.preventDefault();
          dispatch({ type: 'TOGGLE_FOCUS_MODE' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.disguiseMode, state.focusMode, dispatch]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
      {!state.disguiseMode && <TopNav setMobileOpen={setMobileOpen} />}
      <div className="flex-1 flex overflow-hidden relative">
        {state.activeTab === 'writing' && (
          <>
            {!state.disguiseMode && <OutlinePanel setMobileOpen={setMobileOpen} />}
            <EditorPanel />
          </>
        )}
        {state.activeTab === 'board' && <BoardTab />}
        {state.activeTab === 'world' && <WorldTab />}
        {state.activeTab === 'deadline' && (
          <DeadlineTab workId={state.deadlineViewMode === 'local' ? (state.activeWorkId || undefined) : undefined} />
        )}
        {state.activeTab === 'compile' && <CompileTab />}
      </div>
      
      {state.disguiseMode && (
        <div className="fixed top-6 right-6 flex items-center space-x-2 z-50 transition-opacity duration-300 opacity-0 hover:opacity-100">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DISGUISE_MODE' })}
            className="p-2 bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md shadow-sm border border-stone-200 transition-colors"
            title="Exit Disguise Mode"
          >
            <EyeOff size={20} />
          </button>
        </div>
      )}

      {state.focusMode && !state.disguiseMode && (
        <div className="fixed top-0 right-0 w-32 h-32 z-50 flex items-start justify-end p-6 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
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
  const { state } = useStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-stone-900 bg-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
      {!state.disguiseMode && <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}
      <MainContent mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    </div>
  );
}

import { BackupProvider } from './context/BackupContext';

export default function App() {
  return (
    <StoreProvider>
      <BackupProvider>
        <Layout />
      </BackupProvider>
    </StoreProvider>
  );
}

