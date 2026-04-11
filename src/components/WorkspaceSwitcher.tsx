import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDown, Plus, Edit2, Trash2, GripVertical, Check, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '../lib/utils';
import { WorkIcon } from './WorkIcon';
import { WorkIconPicker } from './WorkIconPicker';

interface WorkspaceSwitcherProps {
  isExpanded: boolean;
  onCloseMobile?: () => void;
}

export function WorkspaceSwitcher({ isExpanded, onCloseMobile }: WorkspaceSwitcherProps) {
  const { 
    works, 
    activeWorkId, 
    activeTab, 
    deadlineViewMode, 
    addWork,
    updateWork,
    deleteWork,
    reorderWorks,
    setActiveWork,
    setDeadlineViewMode
  } = useStore(useShallow(state => ({
    works: state.works,
    activeWorkId: state.activeWorkId,
    activeTab: state.activeTab,
    deadlineViewMode: state.deadlineViewMode,
    addWork: state.addWork,
    updateWork: state.updateWork,
    deleteWork: state.deleteWork,
    reorderWorks: state.reorderWorks,
    setActiveWork: state.setActiveWork,
    setDeadlineViewMode: state.setDeadlineViewMode
  })));

  const [isOpen, setIsOpen] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWork = works.find(w => w.id === activeWorkId) || works[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingWorkId(null);
        setDeletingWorkId(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  if (!activeWork) return null;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center px-5 py-4 transition-colors hover:bg-stone-800",
          isExpanded ? "justify-between" : "justify-center"
        )}
      >
        <div className="flex items-center min-w-0">
          <div className="shrink-0">
            <WorkIcon icon={activeWork.icon} size={18} />
          </div>
          {isExpanded && (
            <span className="ml-3 font-semibold text-stone-100 truncate">
              {activeWork.title}
            </span>
          )}
        </div>
        {isExpanded && (
          <ChevronDown size={16} className="text-stone-400 shrink-0 ml-2" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-1 bg-stone-800 border border-stone-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden",
          isExpanded ? "w-64 ml-2" : "w-64 ml-2"
        )}>
          <div className="p-2 border-b border-stone-700 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Switch Workspace
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="works-dropdown" type="work">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5">
                    {[...works].sort((a, b) => a.order - b.order).map((work, index) => (
                      <Draggable key={work.id} draggableId={work.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group relative flex items-center px-2 py-1.5 text-sm rounded-md transition-colors",
                              activeWorkId === work.id 
                                ? "bg-stone-700 text-stone-100" 
                                : "text-stone-300 hover:bg-stone-700/50 hover:text-stone-200",
                              snapshot.isDragging && "bg-stone-700 shadow-xl z-50"
                            )}
                          >
                            <div 
                              {...provided.dragHandleProps} 
                              className="mr-2 text-stone-500 opacity-0 group-hover:opacity-100 cursor-grab shrink-0"
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
                                setIsOpen(false);
                                onCloseMobile?.();
                              }}
                            >
                              <div 
                                className="shrink-0 mr-2"
                                onClick={(e) => e.stopPropagation()} 
                              >
                                <WorkIconPicker 
                                  currentIcon={work.icon} 
                                  onSelect={(icon) => updateWork({ id: work.id, icon })}
                                >
                                  <div className="hover:opacity-80 transition-opacity">
                                    <WorkIcon icon={work.icon} size={16} />
                                  </div>
                                </WorkIconPicker>
                              </div>
                              
                              {editingWorkId === work.id ? (
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
                                  className="flex-1 bg-stone-600 text-stone-100 px-2 py-0.5 rounded outline-none ring-1 ring-emerald-500 min-w-0"
                                />
                              ) : deletingWorkId === work.id ? (
                                <div className="flex items-center space-x-2 min-w-0" onClick={e => e.stopPropagation()}>
                                  <span className="text-red-400 font-bold text-xs uppercase shrink-0">Delete?</span>
                                  <button 
                                    onClick={() => confirmDeleteWork(work.id)}
                                    className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded shrink-0"
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button 
                                    onClick={() => setDeletingWorkId(null)}
                                    className="p-1 bg-stone-600 text-stone-400 hover:bg-stone-500 hover:text-stone-200 rounded shrink-0"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <span className="truncate">{work.title}</span>
                              )}
                            </div>

                            {!editingWorkId && !deletingWorkId && (
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWorkId(work.id);
                                    setEditTitle(work.title);
                                  }}
                                  className="p-1 text-stone-400 hover:text-stone-100 rounded"
                                  title="Rename"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingWorkId(work.id);
                                  }}
                                  className="p-1 text-stone-400 hover:text-red-400 rounded"
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

          <div className="p-2 border-t border-stone-700 bg-stone-800/50">
            <div className="relative">
              <Plus size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="New Workspace..."
                value={newWorkTitle}
                onChange={e => setNewWorkTitle(e.target.value)}
                onKeyDown={handleAddWork}
                className="w-full bg-stone-900 text-stone-200 text-sm rounded-md pl-7 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-stone-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
