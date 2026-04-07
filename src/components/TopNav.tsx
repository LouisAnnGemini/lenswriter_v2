import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { Edit3, Layers, Users, Menu, ChevronLeft, FileText, Clock, Maximize2, AlignLeft, LayoutGrid, Layout, ChevronDown, PanelRightOpen, PanelRightClose, Inbox, Save, Network, Archive, Send, MessageSquare, CloudUpload, CloudDownload, Check, Loader2 } from 'lucide-react';
import { DataManager } from './DataManager';
import { cn } from '../lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';

import { initialState } from '../store/constants';

export function TopNav({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const { 
    focusMode,
    scenes,
    activeDocumentId,
    activeTab,
    works,
    activeWorkId,
    rightSidebarMode,
    disguiseMode,
    lastInspectorTab,
    setActiveDocument, 
    setActiveTab, 
    setDeadlineViewMode, 
    toggleFocusMode, 
    setRightSidebarMode,
    appMode,
    tabConfig,
    supabaseSyncEnabled,
    saveHistoryVersion,
    pushToCloud,
    pullFromCloud,
    syncStatus,
    lastSynced,
    lastModified
  } = useStore(useShallow(state => ({
    focusMode: state.focusMode,
    scenes: state.scenes,
    activeDocumentId: state.activeDocumentId,
    activeTab: state.activeTab,
    works: state.works,
    activeWorkId: state.activeWorkId,
    rightSidebarMode: state.rightSidebarMode,
    disguiseMode: state.disguiseMode,
    lastInspectorTab: state.lastInspectorTab,
    setActiveDocument: state.setActiveDocument,
    setActiveTab: state.setActiveTab,
    setDeadlineViewMode: state.setDeadlineViewMode,
    toggleFocusMode: state.toggleFocusMode,
    setRightSidebarMode: state.setRightSidebarMode,
    appMode: state.appMode,
    tabConfig: state.tabConfig || initialState.tabConfig, // Fallback for existing users
    supabaseSyncEnabled: state.supabaseSyncEnabled,
    saveHistoryVersion: state.saveHistoryVersion,
    pushToCloud: state.pushToCloud,
    pullFromCloud: state.pullFromCloud,
    syncStatus: state.syncStatus,
    lastSynced: state.lastSynced,
    lastModified: state.lastModified
  })));
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [isSyncingPull, setIsSyncingPull] = useState(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  const allTabs = [
    { id: 'design', label: 'Writing', icon: Edit3 },
    { id: 'inbox', label: 'Notes', icon: Inbox },
    { id: 'script', label: 'Script', icon: MessageSquare },
    { id: 'blockDescriptions', label: 'Block Descriptions', icon: AlignLeft },
    { id: 'lenses', label: 'Lenses', icon: LayoutGrid },
    { id: 'timelineEvents', label: 'Timeline Events', icon: Clock },
    { id: 'montage', label: 'Montage', icon: Layout },
    { id: 'metro', label: 'Metro', icon: Network },
    { id: 'world', label: 'World', icon: Users },
    { id: 'deadline', label: 'Deadline', icon: Clock },
    { id: 'compile', label: 'Compile', icon: FileText },
    { id: 'dataManagement', label: 'Data Management', icon: Archive },
    { id: 'publish', label: 'Publishing', icon: Send },
  ] as const;

  const currentConfigRaw = tabConfig?.[appMode] || [];
  
  // Ensure 'dataManagement' is in the config if missing (for existing users)
  const currentConfig = [...currentConfigRaw];
  if (!currentConfig.some(c => c.id === 'dataManagement')) {
    currentConfig.push({ id: 'dataManagement', label: 'Data Management', visible: appMode === 'management' });
  }
  if (!currentConfig.some(c => c.id === 'script')) {
    currentConfig.push({ id: 'script', label: 'Script', visible: appMode === 'design' });
  }
  
  // Combine config with icons and filter visible
  const tabs = currentConfig
    .filter(configItem => configItem.visible)
    .map(configItem => {
      const baseTab = allTabs.find(t => t.id === configItem.id);
      return {
        ...baseTab,
        id: configItem.id,
        label: configItem.label || baseTab?.label || 'Untitled',
        icon: baseTab?.icon || Edit3 // Fallback icon
      };
    });
  
  const tabIds = tabs.map(t => t.id).join(',');
  
  // Reset activeTab if it's no longer visible in the current mode
  useEffect(() => {
    if (!tabIds.split(',').includes(activeTab)) {
      setActiveTab('design');
    }
  }, [tabIds, activeTab, setActiveTab]);
  
  const isScene = scenes.some(s => s.id === activeDocumentId);

  const hasUnsyncedChanges = lastModified > (lastSynced || 0);

  const handlePush = React.useCallback(async () => {
    setIsSyncingPush(true);
    const success = await pushToCloud();
    setIsSyncingPush(false);
    if (success) {
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 2000);
      toast.success('Saved to cloud');
    } else {
      toast.error('Failed to save to cloud');
    }
  }, [pushToCloud]);

  const handlePull = React.useCallback(async () => {
    if (hasUnsyncedChanges) {
      if (!window.confirm('You have unsaved local changes. Pulling from the cloud will overwrite them. Are you sure you want to continue?')) {
        return;
      }
    }
    setIsSyncingPull(true);
    const success = await pullFromCloud();
    setIsSyncingPull(false);
    if (success) {
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 2000);
      toast.success('Pulled latest from cloud');
    } else {
      toast.error('Failed to pull from cloud');
    }
  }, [hasUnsyncedChanges, pullFromCloud]);

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
      {/* Desktop Top Nav */}
      <div className={cn(
        "h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0 transition-all duration-300 z-[60]",
        focusMode 
          ? "fixed top-0 left-0 right-0 opacity-0 hover:opacity-100 shadow-md" 
          : "relative"
      )}>
        {focusMode && (
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
          
          <div className="hidden md:flex space-x-8 h-full">
            {tabs.map((tab, index) => (
              <button
                key={tab.id || `tab-desktop-${index}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'deadline') {
                    setDeadlineViewMode('local');
                  }
                }}
                className={cn(
                  "flex items-center space-x-2 h-full px-1 border-b-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-emerald-500 text-stone-900"
                    : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center ml-8">
          </div>
          <div className="md:hidden font-semibold text-stone-900">
            {works.find(w => w.id === activeWorkId)?.title || 'LensWriter'}
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          {supabaseSyncEnabled && (
            <div className="flex items-center bg-stone-100 rounded-full p-0.5 mr-2 border border-stone-200">
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
                onClick={handlePull}
                disabled={isSyncingPush || isSyncingPull}
                className={cn(
                  "p-1.5 rounded-full transition-all flex items-center justify-center",
                  isSyncingPull ? "text-blue-600 bg-white shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-white hover:shadow-sm"
                )}
                title="Pull Latest from Cloud"
              >
                {isSyncingPull ? <Loader2 size={16} className="animate-spin" /> : 
                 showSyncSuccess && !isSyncingPush ? <Check size={16} className="text-blue-500" /> : 
                 <CloudDownload size={16} />}
              </button>
            </div>
          )}

          <button
            onClick={toggleFocusMode}
            className={cn(
              "p-2 rounded-md transition-colors",
              focusMode ? "text-emerald-600 bg-emerald-50" : "text-stone-500 hover:bg-stone-100"
            )}
            title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
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

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex items-center justify-around z-30 pb-safe">
          {tabs.slice(0, tabs.length > 5 ? 4 : 5).map((tab, index) => (
            <button
              key={tab.id || `tab-mobile-${index}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'deadline') {
                  setDeadlineViewMode('local');
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                activeTab === tab.id
                  ? "text-emerald-600"
                  : "text-stone-400"
              )}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium truncate w-full text-center px-1">{tab.label}</span>
            </button>
          ))}
          
          {tabs.length > 5 && (
            <div className="relative w-full h-full">
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1",
                  tabs.slice(4).some(t => t.id === activeTab) ? "text-emerald-600" : "text-stone-400"
                )}
              >
                <Menu size={20} />
                <span className="text-[10px] font-medium truncate w-full text-center px-1">More</span>
              </button>
              
              {isMoreMenuOpen && (
                <>
                  <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsMoreMenuOpen(false)} />
                  <div 
                    ref={moreMenuRef}
                    className="absolute bottom-full right-2 mb-2 w-48 bg-white border border-stone-200 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2"
                  >
                    {tabs.slice(4).map((tab, index) => (
                      <button
                        key={tab.id || `tab-more-${index}`}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          if (tab.id === 'deadline') {
                            setDeadlineViewMode('local');
                          }
                          setIsMoreMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center px-4 py-3 space-x-3 transition-colors",
                          activeTab === tab.id ? "bg-emerald-50 text-emerald-700" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <tab.icon size={18} />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
