import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { Edit3, Layers, Users, Menu, ChevronLeft, FileText, Clock, Maximize2, AlignLeft, LayoutGrid, ChevronDown, PanelRightOpen, PanelRightClose, Inbox } from 'lucide-react';
import { cn } from '../lib/utils';
import { useShallow } from 'zustand/react/shallow';
import { MobileInboxDrawer } from './MobileInboxDrawer';

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
    boardViewMode,
    setActiveDocument, 
    setActiveTab, 
    setBoardViewMode, 
    setDeadlineViewMode, 
    toggleFocusMode, 
    setRightSidebarMode,
    appMode
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
    boardViewMode: state.boardViewMode,
    setActiveDocument: state.setActiveDocument,
    setActiveTab: state.setActiveTab,
    setBoardViewMode: state.setBoardViewMode,
    setDeadlineViewMode: state.setDeadlineViewMode,
    toggleFocusMode: state.toggleFocusMode,
    setRightSidebarMode: state.setRightSidebarMode,
    appMode: state.appMode
  })));
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isMobileInboxOpen, setIsMobileInboxOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBoardDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (focusMode) return null;

  const allTabs = [
    { id: 'writing', label: 'Writing', icon: Edit3 },
    { id: 'blockDescriptions', label: 'Block Descriptions', icon: AlignLeft },
    { id: 'lenses', label: 'Lenses', icon: LayoutGrid },
    { id: 'timelineEvents', label: 'Timeline Events', icon: Clock },
    { id: 'world', label: 'World', icon: Users },
    { id: 'deadline', label: 'Deadline', icon: Clock },
    { id: 'compile', label: 'Compile', icon: FileText },
  ] as const;

  const tabs = appMode === 'writing' 
    ? allTabs.filter(t => ['writing', 'blockDescriptions', 'lenses', 'timelineEvents', 'world'].includes(t.id))
    : allTabs.filter(t => ['writing', 'deadline', 'compile'].includes(t.id));
  
  const isScene = scenes.some(s => s.id === activeDocumentId);

  return (
    <>
      {/* Desktop Top Nav */}
      <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center">
          {activeTab === 'writing' && activeDocumentId ? (
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
            {tabs.map(tab => (
              <button
                key={tab.id}
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
          {activeTab === 'writing' && activeDocumentId && !disguiseMode && (
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
            title="Inbox"
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
          {tabs.map(tab => (
            <button
              key={tab.id}
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
