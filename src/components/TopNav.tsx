import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { Edit3, Layers, Users, Menu, ChevronLeft, FileText, Clock, Maximize2, AlignLeft, LayoutGrid, ChevronDown, PanelRightOpen, PanelRightClose, Inbox, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { MobileInboxDrawer } from './MobileInboxDrawer';
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
    saveHistoryVersion
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
    saveHistoryVersion: state.saveHistoryVersion
  })));
  const [isMobileInboxOpen, setIsMobileInboxOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Remove the early return for focusMode
  // if (focusMode) return null;

  const allTabs = [
    { id: 'design', label: 'Writing', icon: Edit3 },
    { id: 'inbox', label: 'Notes', icon: Inbox },
    { id: 'blockDescriptions', label: 'Block Descriptions', icon: AlignLeft },
    { id: 'lenses', label: 'Lenses', icon: LayoutGrid },
    { id: 'timelineEvents', label: 'Timeline Events', icon: Clock },
    { id: 'world', label: 'World', icon: Users },
    { id: 'deadline', label: 'Deadline', icon: Clock },
    { id: 'compile', label: 'Compile', icon: FileText },
  ] as const;

  const currentConfig = tabConfig?.[appMode] || [];
  
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

        <div className="flex items-center space-x-2">
          {supabaseSyncEnabled && (
            <button
              onClick={async () => {
                const success = await saveHistoryVersion('Manual Save');
                if (success) {
                  toast.success('Version saved successfully');
                } else {
                  toast.error('Failed to save version. Please check your connection.');
                }
              }}
              className="p-2 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Save Version Now"
            >
              <Save size={20} />
            </button>
          )}
          {activeTab === 'design' && activeDocumentId && !disguiseMode && (
            <button
              onClick={() => {
                if (rightSidebarMode === 'closed') {
                  const canShowLastTab = isScene || (lastInspectorTab !== 'info' && lastInspectorTab !== 'macro');
                  setRightSidebarMode(canShowLastTab ? lastInspectorTab : 'micro');
                } else {
                  setRightSidebarMode('closed');
                }
              }}
              className={cn(
                "p-2 rounded-md transition-colors",
                rightSidebarMode !== 'closed' ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
              )}
              title="Toggle Inspector (Ctrl+I)"
            >
              {rightSidebarMode !== 'closed' ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
          )}
          
          <button
            onClick={() => setIsMobileInboxOpen(true)}
            className="md:hidden p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Notes"
          >
            <Inbox size={20} />
          </button>

          <button
            onClick={() => toggleFocusMode()}
            className="p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Enter Focus Mode"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <MobileInboxDrawer 
        isOpen={isMobileInboxOpen} 
        onClose={() => setIsMobileInboxOpen(false)} 
      />

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex items-center justify-around z-30 pb-safe">
          {tabs.map((tab, index) => (
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
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
