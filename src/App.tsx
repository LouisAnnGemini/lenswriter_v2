import React from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OutlinePanel } from './components/OutlinePanel';
import { EditorPanel } from './components/EditorPanel';
import { LensesTab } from './components/LensesTab';
import { WorldTab } from './components/WorldTab';
import { DeadlineTab } from './components/DeadlineTab';
import { CompileTab } from './components/CompileTab';
import { TimelineTab } from './components/TimelineTab';
import { Minimize2, MessageSquare, MessageSquareOff, EyeOff, Eye } from 'lucide-react';
import { cn } from './lib/utils';

function MainContent({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const { state, dispatch } = useStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.disguiseMode) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_DISGUISE_MODE' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.disguiseMode, dispatch]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
      {!state.disguiseMode && <TopNav setMobileOpen={setMobileOpen} />}
      <div className="flex-1 flex overflow-hidden">
        {state.activeTab === 'writing' && (
          <>
            {!state.disguiseMode && <OutlinePanel setMobileOpen={setMobileOpen} />}
            <EditorPanel />
          </>
        )}
        {state.activeTab === 'lenses' && <LensesTab />}
        {state.activeTab === 'timeline' && <TimelineTab />}
        {state.activeTab === 'world' && <WorldTab />}
        {state.activeTab === 'deadline' && <DeadlineTab />}
        {state.activeTab === 'compile' && <CompileTab />}
      </div>
      
      {(state.focusMode || state.disguiseMode) && (
        <div className={cn(
          "fixed top-6 right-6 flex items-center space-x-2 z-50 transition-opacity duration-300",
          state.disguiseMode ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}>
          {state.disguiseMode ? (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DISGUISE_MODE' })}
              className="p-2 bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md shadow-sm border border-stone-200 transition-colors"
              title="Exit Disguise Mode"
            >
              <EyeOff size={20} />
            </button>
          ) : (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DISGUISE_MODE' })}
              className="p-2 bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md shadow-sm border border-stone-200 transition-colors"
              title="Enter Disguise Mode"
            >
              <Eye size={20} />
            </button>
          )}
          
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SHOW_DESCRIPTIONS' })}
            className={cn(
              "p-2 bg-white rounded-md shadow-sm border border-stone-200 transition-colors",
              state.showDescriptions ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
            )}
            title={state.showDescriptions ? "Hide Descriptions" : "Show Descriptions"}
          >
            {state.showDescriptions ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
            className="p-2 bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md shadow-sm border border-stone-200 transition-colors"
            title="Exit Focus Mode"
          >
            <Minimize2 size={20} />
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

