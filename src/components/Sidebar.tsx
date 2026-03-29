import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Book, Plus, ChevronLeft, ChevronRight, Download, Upload, Trash2, Edit2, GripVertical, Check, X, Menu, Network, Save, Clock, MapPin, Calendar } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '../lib/utils';
import { WorkIcon } from './WorkIcon';
import { WorkIconPicker } from './WorkIconPicker';
import { BackupManager } from './BackupManager';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (open: boolean) => void }) {
  const { 
    works, 
    activeWorkId, 
    activeTab, 
    deadlineViewMode, 
    focusMode,
    addWork,
    updateWork,
    deleteWork,
    reorderWorks,
    setActiveWork,
    setActiveTab,
    setDeadlineViewMode,
    importData
  } = useStore(useShallow(state => ({
    works: state.works,
    activeWorkId: state.activeWorkId,
    activeTab: state.activeTab,
    deadlineViewMode: state.deadlineViewMode,
    focusMode: state.focusMode,
    addWork: state.addWork,
    updateWork: state.updateWork,
    deleteWork: state.deleteWork,
    reorderWorks: state.reorderWorks,
    setActiveWork: state.setActiveWork,
    setActiveTab: state.setActiveTab,
    setDeadlineViewMode: state.setDeadlineViewMode,
    importData: state.importData
  })));
  const [collapsed, setCollapsed] = useState(true);
  const isExpanded = !collapsed || !!mobileOpen;
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null);
  const [showBackupManager, setShowBackupManager] = useState(false);

  if (focusMode) return null;

  const handleAddWork = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newWorkTitle.trim()) {
      addWork(newWorkTitle.trim());
      setNewWorkTitle('');
    }
  };

  const handleRenameWork = (id: string) => {
    if (editTitle.trim()) {
      updateWork({ id, title: editTitle.trim() });
      setEditingWorkId(null);
    }
  };

  const confirmDeleteWork = (id: string) => {
    deleteWork(id);
    setDeletingWorkId(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderWorks(result.source.index, result.destination.index);
  };

  const handleExport = () => {
    // Get current state from store
    const state = useStore.getState();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pastActions, futureActions, ...stateToExport } = state;
    // Filter out functions from stateToExport
    const dataToExport = Object.fromEntries(
      Object.entries(stateToExport).filter(([_, v]) => typeof v !== 'function')
    );
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "story-weaver-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object' && 'works' in json) {
          // Preserve current sync state when importing a file
          const currentState = useStore.getState();
          importData({ ...json, supabaseSyncEnabled: currentState.supabaseSyncEnabled });
        } else {
          alert('Invalid data format');
        }
      } catch (error) {
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <div className={cn(
        "h-[100dvh] bg-stone-50/95 backdrop-blur-md text-stone-600 flex flex-col transition-all duration-300 border-r border-stone-200/60 z-50",
        collapsed ? "md:w-16 w-64" : "w-64",
        "fixed md:relative", // Fixed on mobile, relative on desktop
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0" // Slide in on mobile
      )}>
        <div className="p-4 flex items-center justify-between border-b border-stone-200/60">
          {isExpanded && <span className="font-semibold text-stone-800 tracking-wide uppercase text-xs">Works</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-stone-200/50 rounded-md text-stone-400 hover:text-stone-700 transition-colors hidden md:block"
          >
            {!isExpanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button 
            onClick={() => setMobileOpen?.(false)}
            className="p-1.5 hover:bg-stone-200/50 rounded-md text-stone-400 hover:text-stone-700 transition-colors md:hidden"
          >
            <X size={16} />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="mb-4 px-2 space-y-1">
          <button
            onClick={() => {
              setActiveTab('deadline');
              setDeadlineViewMode('global');
              setMobileOpen?.(false);
            }}
            className={cn(
              "w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              activeTab === 'deadline'
                ? "bg-stone-200/50 text-stone-900"
                : "text-stone-500 hover:bg-stone-200/30 hover:text-stone-800"
            )}
          >
            <Calendar size={16} className={cn("shrink-0", !isExpanded ? "mx-auto" : "mr-3")} />
            {isExpanded && <span>Deadline</span>}
          </button>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="works" type="work">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5 px-2">
                {[...works].sort((a, b) => a.order - b.order).map((work, index) => (
                  // @ts-expect-error React 19 key prop issue
                  <Draggable key={work.id} draggableId={work.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "group relative flex items-center px-2 py-1.5 text-sm transition-colors rounded-lg",
                          activeWorkId === work.id 
                            ? "bg-stone-200/60 text-stone-900 font-medium" 
                            : "hover:bg-stone-200/30 text-stone-600 hover:text-stone-900",
                          snapshot.isDragging && "bg-white shadow-lg border border-stone-200 z-50"
                        )}
                      >
                        <div 
                          {...provided.dragHandleProps} 
                          className={cn(
                            "mr-1.5 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab hover:text-stone-600 transition-opacity",
                            !isExpanded && "hidden"
                          )}
                        >
                          <GripVertical size={14} />
                        </div>
                        
                        <div 
                          className="flex-1 flex items-center min-w-0 cursor-pointer"
                          onClick={() => {
                            setActiveWork(work.id);
                            if (activeTab === 'deadline' && deadlineViewMode === 'global') {
                              setDeadlineViewMode('local');
                            }
                            setMobileOpen?.(false);
                          }}
                        >
                          <div 
                            className={cn("shrink-0", !isExpanded ? "mx-auto" : "mr-3")}
                            onClick={(e) => isExpanded && e.stopPropagation()} 
                          >
                            {!isExpanded ? (
                              <div className="hover:opacity-80 transition-opacity">
                                <WorkIcon icon={work.icon} size={16} />
                              </div>
                            ) : (
                              <WorkIconPicker 
                                currentIcon={work.icon} 
                                onSelect={(icon) => updateWork({ id: work.id, icon })}
                              >
                                <div className="hover:opacity-80 transition-opacity">
                                  <WorkIcon icon={work.icon} size={16} />
                                </div>
                              </WorkIconPicker>
                            )}
                          </div>
                          {isExpanded && (
                            editingWorkId === work.id ? (
                              <input
                                autoFocus
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameWork(work.id);
                                  if (e.key === 'Escape') setEditingWorkId(null);
                                }}
                                onBlur={() => handleRenameWork(work.id)}
                                onClick={e => e.stopPropagation()}
                                className="flex-1 bg-white text-stone-900 px-2 py-0.5 rounded outline-none ring-1 ring-stone-300 focus:ring-stone-400"
                              />
                            ) : deletingWorkId === work.id ? (
                              <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                                <span className="text-red-500 font-bold text-xs uppercase">Delete?</span>
                                <button 
                                  onClick={() => confirmDeleteWork(work.id)}
                                  className="p-1 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded"
                                >
                                  <Check size={12} />
                                </button>
                                <button 
                                  onClick={() => setDeletingWorkId(null)}
                                  className="p-1 bg-stone-200 text-stone-600 hover:bg-stone-300 hover:text-stone-800 rounded"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="truncate">{work.title}</span>
                            )
                          )}
                        </div>

                        {isExpanded && !editingWorkId && !deletingWorkId && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingWorkId(work.id);
                                setEditTitle(work.title);
                              }}
                              className="p-1 hover:text-stone-800 hover:bg-stone-200/50 rounded"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingWorkId(work.id);
                              }}
                              className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete Work"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className={cn("p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-stone-200/60 space-y-4", !isExpanded && "p-2")}>
        {isExpanded && (
          <div className="relative">
            <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="New Work..."
              value={newWorkTitle}
              onChange={e => setNewWorkTitle(e.target.value)}
              onKeyDown={handleAddWork}
              className="w-full bg-stone-200/30 text-stone-800 text-sm rounded-lg pl-9 pr-3 py-2 outline-none border border-stone-200/60 focus:border-stone-400 focus:bg-white placeholder:text-stone-400 transition-colors"
            />
          </div>
        )}
        
        <div className={cn("flex space-x-2", !isExpanded && "flex-col space-x-0")}>
          {isExpanded && (
            <>
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center py-1.5 bg-stone-200/50 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-lg text-xs font-medium transition-colors"
                title="Export Data"
              >
                <Upload size={12} className="mr-1.5" />
                Export
              </button>
              <label className="flex-1 flex items-center justify-center py-1.5 bg-stone-200/50 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-lg text-xs font-medium transition-colors cursor-pointer" title="Import Data">
                <Download size={12} className="mr-1.5" />
                Import
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </>
          )}
          <button
            onClick={() => setShowBackupManager(true)}
            className={cn("flex items-center justify-center bg-stone-200/50 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-lg text-xs font-medium transition-colors", isExpanded ? "flex-1 py-1.5" : "p-2 w-full")}
            title="Data & Backup Settings"
          >
            <Save size={12} className={cn(isExpanded && "mr-1.5")} />
            {isExpanded && "Sync"}
          </button>
        </div>
      </div>
    </div>
      
    {showBackupManager && (
      <BackupManager onClose={() => setShowBackupManager(false)} />
    )}
    </>
  );
}
