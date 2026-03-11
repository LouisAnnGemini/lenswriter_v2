import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Book, Plus, ChevronLeft, ChevronRight, Download, Upload, Trash2, Edit2, GripVertical, Check, X, Menu, Network, Save, Clock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '../lib/utils';
import { WorkIcon } from './WorkIcon';
import { WorkIconPicker } from './WorkIconPicker';
import { BackupManager } from './BackupManager';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (open: boolean) => void }) {
  const { state, dispatch } = useStore();
  const [collapsed, setCollapsed] = useState(true);
  const isExpanded = !collapsed || !!mobileOpen;
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null);
  const [showBackupManager, setShowBackupManager] = useState(false);

  if (state.focusMode) return null;

  const handleAddWork = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newWorkTitle.trim()) {
      dispatch({ type: 'ADD_WORK', payload: { title: newWorkTitle.trim() } });
      setNewWorkTitle('');
    }
  };

  const handleRenameWork = (id: string) => {
    if (editTitle.trim()) {
      dispatch({ type: 'UPDATE_WORK', payload: { id, title: editTitle.trim() } });
      setEditingWorkId(null);
    }
  };

  const confirmDeleteWork = (id: string) => {
    dispatch({ type: 'DELETE_WORK', payload: id });
    setDeletingWorkId(null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    dispatch({
      type: 'REORDER_WORKS',
      payload: { startIndex: result.source.index, endIndex: result.destination.index }
    });
  };

  const handleExport = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { past, future, ...stateToExport } = state;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stateToExport));
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
          dispatch({ type: 'IMPORT_DATA', payload: json });
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
        "h-screen bg-stone-900 text-stone-300 flex flex-col transition-all duration-300 border-r border-stone-800 z-50",
        collapsed ? "md:w-16 w-64" : "w-64",
        "fixed md:relative", // Fixed on mobile, relative on desktop
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0" // Slide in on mobile
      )}>
        <div className="p-4 flex items-center justify-between border-b border-stone-800">
          {isExpanded && <span className="font-semibold text-stone-100 tracking-wide uppercase text-sm">Works</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-stone-800 rounded-md text-stone-400 hover:text-stone-100 transition-colors hidden md:block"
          >
            {!isExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button 
            onClick={() => setMobileOpen?.(false)}
            className="p-1 hover:bg-stone-800 rounded-md text-stone-400 hover:text-stone-100 transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="mb-4 px-2">
          <button
            onClick={() => {
              dispatch({ type: 'SET_ACTIVE_TAB', payload: 'deadline' });
              setMobileOpen?.(false);
            }}
            className={cn(
              "w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              state.activeTab === 'deadline'
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
            )}
          >
            <Clock size={16} className={cn("shrink-0", !isExpanded ? "mx-auto" : "mr-3")} />
            {isExpanded && <span>Deadline</span>}
          </button>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="works" type="work">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                {[...state.works].sort((a, b) => a.order - b.order).map((work, index) => (
                  // @ts-expect-error React 19 key prop issue
                  <Draggable key={work.id} draggableId={work.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "group relative flex items-center px-4 py-2 text-sm transition-colors",
                          state.activeWorkId === work.id 
                            ? "bg-stone-800 text-stone-100 border-r-2 border-emerald-500" 
                            : "hover:bg-stone-800/50 hover:text-stone-200",
                          snapshot.isDragging && "bg-stone-800 shadow-xl z-50"
                        )}
                      >
                        <div 
                          {...provided.dragHandleProps} 
                          className={cn(
                            "mr-2 text-stone-600 opacity-0 group-hover:opacity-100 cursor-grab",
                            !isExpanded && "hidden"
                          )}
                        >
                          <GripVertical size={14} />
                        </div>
                        
                        <div 
                          className="flex-1 flex items-center min-w-0 cursor-pointer"
                          onClick={() => {
                            dispatch({ type: 'SET_ACTIVE_WORK', payload: work.id });
                            setMobileOpen?.(false);
                          }}
                        >
                          <div 
                            onClick={(e) => isExpanded && e.stopPropagation()} 
                            className={cn("shrink-0", !isExpanded ? "mx-auto" : "mr-3")}
                          >
                            {!isExpanded ? (
                              <div className="hover:opacity-80 transition-opacity">
                                <WorkIcon icon={work.icon} size={16} />
                              </div>
                            ) : (
                              <WorkIconPicker 
                                currentIcon={work.icon} 
                                onSelect={(icon) => dispatch({ type: 'UPDATE_WORK', payload: { id: work.id, icon } })}
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
                                className="flex-1 bg-stone-700 text-stone-100 px-2 py-0.5 rounded outline-none ring-1 ring-emerald-500"
                              />
                            ) : deletingWorkId === work.id ? (
                              <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                                <span className="text-red-400 font-bold text-xs uppercase">Delete?</span>
                                <button 
                                  onClick={() => confirmDeleteWork(work.id)}
                                  className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded"
                                >
                                  <Check size={12} />
                                </button>
                                <button 
                                  onClick={() => setDeletingWorkId(null)}
                                  className="p-1 bg-stone-700 text-stone-400 hover:bg-stone-600 hover:text-stone-200 rounded"
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
                              className="p-1 hover:text-stone-100 rounded"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingWorkId(work.id);
                              }}
                              className="p-1 hover:text-red-400 rounded"
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

      {isExpanded && (
        <div className="p-4 border-t border-stone-800 space-y-4">
          <div className="relative">
            <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="New Work..."
              value={newWorkTitle}
              onChange={e => setNewWorkTitle(e.target.value)}
              onKeyDown={handleAddWork}
              className="w-full bg-stone-800 text-stone-200 text-sm rounded-md pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-stone-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md text-xs font-medium transition-colors"
              title="Export Data"
            >
              <Upload size={14} className="mr-2" />
              Export
            </button>
            <label className="flex-1 flex items-center justify-center py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md text-xs font-medium transition-colors cursor-pointer" title="Import Data">
              <Download size={14} className="mr-2" />
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={() => setShowBackupManager(true)}
              className="flex items-center justify-center p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md text-xs font-medium transition-colors"
              title="Local Backups"
            >
              <Save size={14} />
            </button>
          </div>
        </div>
      )}
      
      {showBackupManager && (
        <BackupManager onClose={() => setShowBackupManager(false)} />
      )}
    </div>
    </>
  );
}
