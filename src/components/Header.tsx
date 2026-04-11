import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { Menu, ChevronLeft, Maximize2, PanelRightOpen, PanelRightClose, CloudUpload, CloudDownload, Check, Loader2, RotateCcw, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { VersionHistoryModal } from './ui/VersionHistoryModal';

export function Header({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const { 
    fullscreenMode,
    scenes,
    chapters,
    activeDocumentId,
    activeTab,
    timelineViewMode,
    worldViewMode,
    works,
    activeWorkId,
    rightSidebarMode,
    lastInspectorTab,
    setActiveTab,
    setActiveDocument, 
    toggleFullscreenMode, 
    setRightSidebarMode,
    supabaseSyncEnabled,
    pushToCloud,
    pullFromCloud,
    undoPull,
    checkCloudVersion,
    lastSynced,
    lastModified,
    cloudLastModified,
  } = useStore(useShallow(state => ({
    fullscreenMode: state.fullscreenMode,
    scenes: state.scenes,
    chapters: state.chapters,
    activeDocumentId: state.activeDocumentId,
    activeTab: state.activeTab,
    timelineViewMode: state.timelineViewMode,
    worldViewMode: state.worldViewMode,
    works: state.works,
    activeWorkId: state.activeWorkId,
    rightSidebarMode: state.rightSidebarMode,
    lastInspectorTab: state.lastInspectorTab,
    setActiveTab: state.setActiveTab,
    setActiveDocument: state.setActiveDocument,
    toggleFullscreenMode: state.toggleFullscreenMode,
    setRightSidebarMode: state.setRightSidebarMode,
    supabaseSyncEnabled: state.supabaseSyncEnabled,
    pushToCloud: state.pushToCloud,
    pullFromCloud: state.pullFromCloud,
    undoPull: state.undoPull,
    checkCloudVersion: state.checkCloudVersion,
    lastSynced: state.lastSynced,
    lastModified: state.lastModified,
    cloudLastModified: state.cloudLastModified,
  })));
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [isSyncingPull, setIsSyncingPull] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [showPullConfirm, setShowPullConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasSnapshot, setHasSnapshot] = useState(!!localStorage.getItem('prePullSnapshot'));

  // Update snapshot status
  useEffect(() => {
    const checkSnapshot = () => setHasSnapshot(!!localStorage.getItem('prePullSnapshot'));
    window.addEventListener('storage', checkSnapshot);
    return () => window.removeEventListener('storage', checkSnapshot);
  }, []);

  const handleUndoPull = () => {
    if (undoPull()) {
      setHasSnapshot(false);
      toast.success('Pull undone');
    } else {
      toast.error('No snapshot found');
    }
  };

  // Periodically check cloud version
  useEffect(() => {
    if (!supabaseSyncEnabled) return;
    
    checkCloudVersion();
    const interval = setInterval(checkCloudVersion, 60000); // Every 1 minute
    return () => clearInterval(interval);
  }, [supabaseSyncEnabled, checkCloudVersion]);

  const isScene = scenes.some(s => s.id === activeDocumentId);

  const hasUnsyncedChanges = lastModified > (lastSynced || 0);
  const hasCloudUpdates = (cloudLastModified || 0) > (lastSynced || 0);

  const handlePush = React.useCallback(async () => {
    setIsSyncingPush(true);
    const success = await pushToCloud();
    setIsSyncingPush(false);
    if (success) {
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 2000);
      toast.success('Saved to cloud');
      checkCloudVersion(); // Refresh version after push
    } else {
      toast.error('Failed to save to cloud');
    }
  }, [pushToCloud, checkCloudVersion]);

  const handlePull = React.useCallback(async () => {
    setIsSyncingPull(true);
    const success = await pullFromCloud();
    setIsSyncingPull(false);
    if (success) {
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 2000);
      toast.success('Pulled latest from cloud');
      checkCloudVersion(); // Refresh version after pull
    } else {
      toast.error('Failed to pull from cloud');
    }
  }, [pullFromCloud, checkCloudVersion]);

  // Shortcut for Save to Cloud
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (supabaseSyncEnabled) {
          handlePush();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [supabaseSyncEnabled, handlePush]);

  return (
    <>
      <ConfirmationModal
        isOpen={showPullConfirm}
        onClose={() => setShowPullConfirm(false)}
        onConfirm={handlePull}
        title="Confirm Pull"
        message="You have unsaved local changes. Pulling from the cloud will overwrite them. Are you sure you want to continue?"
        confirmText="Pull and Overwrite"
      />
      <VersionHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      {/* Desktop Header */}
      <div className={cn(
        "h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0 transition-all duration-300 z-[60]",
        fullscreenMode 
          ? "fixed top-0 left-0 right-0 opacity-0 hover:opacity-100 shadow-md" 
          : "relative"
      )}>
        {fullscreenMode && (
          <div className="absolute top-full left-0 right-0 h-4 bg-transparent" />
        )}
        <div className="flex items-center">
          {activeTab === 'design' && activeDocumentId ? (
            <button 
              className="md:hidden mr-4 p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-md"
              onClick={() => setActiveDocument(null)}
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button 
              className="md:hidden mr-4 p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-md"
              onClick={() => setMobileOpen?.(true)}
            >
              <Menu size={20} />
            </button>
          )}
          
          <div className="font-semibold text-stone-900 capitalize flex items-center space-x-2 overflow-hidden">
            <button 
              onClick={() => {
                setActiveTab('design');
                setActiveDocument(null);
              }}
              className="text-stone-400 hover:text-stone-600 transition-colors shrink-0"
            >
              {works.find(w => w.id === activeWorkId)?.title || 'LensWriter'}
            </button>
            
            {(activeTab !== 'design' || !activeDocumentId) && (
              <>
                <span className="text-stone-300 shrink-0">/</span>
                <button
                  onClick={() => setActiveDocument(null)}
                  className={cn(
                    "transition-colors shrink-0",
                    activeTab === 'design' && !activeDocumentId ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  {activeTab === 'timelineEvents' ? 'Timeline' : activeTab === 'world' ? 'World' : activeTab.replace(/([A-Z])/g, ' $1').trim()}
                </button>
              </>
            )}
            
            {activeTab === 'timelineEvents' && (
              <>
                <span className="text-stone-300 shrink-0">/</span>
                <span className="text-stone-900 capitalize shrink-0">{timelineViewMode}</span>
              </>
            )}
            
            {activeTab === 'world' && (
              <>
                <span className="text-stone-300 shrink-0">/</span>
                <span className="text-stone-900 capitalize shrink-0">{worldViewMode}</span>
              </>
            )}

            {activeTab === 'design' && activeDocumentId && (
              <>
                {(() => {
                  const scene = scenes.find(s => s.id === activeDocumentId);
                  const chapter = scene ? chapters.find(c => c.id === scene.chapterId) : chapters.find(c => c.id === activeDocumentId);
                  
                  if (scene && chapter) {
                    return (
                      <>
                        <span className="text-stone-300 shrink-0">/</span>
                        <button 
                          onClick={() => setActiveDocument(chapter.id)}
                          className="text-stone-400 hover:text-stone-600 transition-colors truncate max-w-[80px] md:max-w-[150px]"
                        >
                          {chapter.title}
                        </button>
                        <span className="text-stone-300 shrink-0">/</span>
                        <span className="text-stone-900 truncate max-w-[80px] md:max-w-[150px]">
                          {scene.title}
                        </span>
                      </>
                    );
                  } else if (chapter) {
                    return (
                      <>
                        <span className="text-stone-300 shrink-0">/</span>
                        <span className="text-stone-900 truncate max-w-[100px] md:max-w-[200px]">
                          {chapter.title}
                        </span>
                      </>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          {supabaseSyncEnabled && (
            <div className="flex items-center bg-stone-100 rounded-full p-0.5 mr-2 border border-stone-200">
              {hasSnapshot && (
                <button
                  onClick={handleUndoPull}
                  className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-white hover:shadow-sm rounded-full transition-all"
                  title="Undo Pull (Restore Snapshot)"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                onClick={() => setShowHistory(true)}
                className="p-1.5 text-stone-500 hover:text-stone-700 hover:bg-white hover:shadow-sm rounded-full transition-all"
                title="Version History"
              >
                <History size={16} />
              </button>
              <div className="w-px h-4 bg-stone-300 mx-0.5"></div>
              <button
                onClick={handlePush}
                disabled={isSyncingPush || isSyncingPull}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center justify-center relative",
                  isSyncingPush ? "text-emerald-600 bg-white shadow-sm" : 
                  hasUnsyncedChanges ? "text-emerald-600 hover:bg-white hover:shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-white hover:shadow-sm"
                )}
                title={`Save to Cloud (Cmd/Ctrl+S)\nLast saved: ${lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'Never'}`}
              >
                {isSyncingPush ? <Loader2 size={16} className="animate-spin" /> : 
                 showSyncSuccess && !isSyncingPull ? <Check size={16} className="text-emerald-500" /> : 
                 <CloudUpload size={16} />}
                {hasUnsyncedChanges && !isSyncingPush && !showSyncSuccess && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></span>
                )}
              </button>
              <div className="w-px h-4 bg-stone-300 mx-0.5"></div>
              <button
                onClick={() => hasCloudUpdates ? setShowPullConfirm(true) : handlePull()}
                disabled={isSyncingPush || isSyncingPull}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center justify-center relative",
                  isSyncingPull ? "text-blue-600 bg-white shadow-sm" : 
                  hasCloudUpdates ? "text-blue-600 hover:bg-white hover:shadow-sm animate-pulse" : "text-stone-500 hover:text-stone-700 hover:bg-white hover:shadow-sm"
                )}
                title="Pull Latest from Cloud"
              >
                {isSyncingPull ? <Loader2 size={16} className="animate-spin" /> : 
                 showSyncSuccess && !isSyncingPush ? <Check size={16} className="text-blue-500" /> : 
                 <CloudDownload size={16} />}
                {hasCloudUpdates && !isSyncingPull && !showSyncSuccess && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white"></span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={toggleFullscreenMode}
            className={cn(
              "p-2 rounded-md transition-colors",
              fullscreenMode ? "text-emerald-600 bg-emerald-50" : "text-stone-500 hover:bg-stone-100"
            )}
            title={fullscreenMode ? "Exit Fullscreen Mode" : "Enter Fullscreen Mode"}
          >
            <Maximize2 size={20} />
          </button>

          <button
            onClick={() => setRightSidebarMode(rightSidebarMode === 'closed' ? (lastInspectorTab || 'inspector' as any) : 'closed')}
            className={cn(
              "p-2 rounded-md transition-colors",
              rightSidebarMode !== 'closed' ? "text-emerald-600 bg-emerald-50" : "text-stone-500 hover:bg-stone-100"
            )}
            title={rightSidebarMode !== 'closed' ? "Close Inspector" : "Open Inspector"}
          >
            {rightSidebarMode !== 'closed' ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        </div>
      </div>
    </>
  );
}
