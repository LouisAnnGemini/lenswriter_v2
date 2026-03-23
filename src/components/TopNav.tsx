import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Edit3, Layers, Users, Menu, ChevronLeft, FileText, Clock, Maximize2, AlignLeft, LayoutGrid, ChevronDown, Eye, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { cn } from '../lib/utils';

export function TopNav({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const { state, dispatch } = useStore();
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
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

  if (state.focusMode) return null;

  const tabs = [
    { id: 'writing', label: 'Writing', icon: Edit3 },
    { id: 'board', label: 'Board', icon: Layers },
    { id: 'world', label: 'World', icon: Users },
    { id: 'deadline', label: 'Deadline', icon: Clock },
    { id: 'compile', label: 'Compile', icon: FileText },
  ] as const;

  const boardViewOptions = [
    { id: 'micro', label: 'Block Descriptions', icon: AlignLeft },
    { id: 'meso', label: 'Lenses', icon: LayoutGrid },
    { id: 'macro', label: 'Timeline Events', icon: Clock },
  ] as const;
  
  const isScene = state.scenes.some(s => s.id === state.activeDocumentId);

  return (
    <>
      {/* Desktop Top Nav */}
      <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center">
          {state.activeTab === 'writing' && state.activeDocumentId ? (
            <button 
              className="md:hidden mr-4 p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-md"
              onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: null })}
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
            {tabs.map(tab => {
              if (tab.id === 'board') {
                return (
                  <div key={tab.id} className="relative flex items-center h-full" ref={dropdownRef}>
                    <button
                      onClick={() => {
                        if (state.activeTab === 'board') {
                          setIsBoardDropdownOpen(!isBoardDropdownOpen);
                        } else {
                          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'board' });
                        }
                      }}
                      className={cn(
                        "flex items-center space-x-2 h-full px-1 border-b-2 text-sm font-medium transition-colors",
                        state.activeTab === 'board'
                          ? "border-emerald-500 text-stone-900"
                          : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                      )}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                      {state.activeTab === 'board' && (
                        <ChevronDown size={14} className="ml-1 text-stone-500" />
                      )}
                    </button>
                    
                    {isBoardDropdownOpen && state.activeTab === 'board' && (
                      <div className="absolute top-full left-0 mt-0 w-48 bg-white border border-stone-200 rounded-b-md shadow-lg z-50 py-1">
                        {boardViewOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                dispatch({ type: 'SET_BOARD_VIEW_MODE', payload: option.id });
                                setIsBoardDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center space-x-2 px-3 py-2 text-sm text-left transition-colors",
                                state.boardViewMode === option.id ? "bg-stone-100 text-stone-900 font-medium" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                              )}
                            >
                              <Icon size={16} className={state.boardViewMode === option.id ? "text-stone-700" : "text-stone-400"} />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id });
                    if (tab.id === 'deadline') {
                      dispatch({ type: 'SET_DEADLINE_VIEW_MODE', payload: 'local' });
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-2 h-full px-1 border-b-2 text-sm font-medium transition-colors",
                    state.activeTab === tab.id
                      ? "border-emerald-500 text-stone-900"
                      : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                  )}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="md:hidden font-semibold text-stone-900">
            {state.works.find(w => w.id === state.activeWorkId)?.title || 'LensWriter'}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {state.activeTab === 'writing' && state.activeDocumentId && !state.disguiseMode && (
            <button
              onClick={() => {
                if (state.rightSidebarMode === 'closed') {
                  const canShowLastTab = isScene || (state.lastInspectorTab !== 'info' && state.lastInspectorTab !== 'macro');
                  dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: canShowLastTab ? state.lastInspectorTab : 'micro' });
                } else {
                  dispatch({ type: 'SET_RIGHT_SIDEBAR_MODE', payload: 'closed' });
                }
              }}
              className={cn(
                "p-2 rounded-md transition-colors",
                state.rightSidebarMode !== 'closed' ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
              )}
              title="Toggle Inspector"
            >
              {state.rightSidebarMode !== 'closed' ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DISGUISE_MODE' })}
            className={cn(
              "p-2 rounded-md transition-colors",
              state.disguiseMode ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
            )}
            title="Toggle Disguise Mode"
          >
            <Eye size={20} />
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
            className="p-2 rounded-md text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Enter Focus Mode"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        {state.activeTab === 'board' && (
          <div className="fixed bottom-16 left-0 right-0 h-12 bg-white border-t border-stone-200 flex items-center justify-around z-30 px-2 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
            {boardViewOptions.map((option) => {
              const Icon = option.icon;
              const shortLabel = option.id === 'micro' ? 'Blocks' : option.id === 'meso' ? 'Lenses' : 'Events';
              return (
                <button
                  key={option.id}
                  onClick={() => dispatch({ type: 'SET_BOARD_VIEW_MODE', payload: option.id })}
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all",
                    state.boardViewMode === option.id 
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                      : "text-stone-500 hover:bg-stone-50"
                  )}
                >
                  <Icon size={14} />
                  <span>{shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex items-center justify-around z-30 pb-safe">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id });
                if (tab.id === 'deadline') {
                  dispatch({ type: 'SET_DEADLINE_VIEW_MODE', payload: 'local' });
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                state.activeTab === tab.id
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
