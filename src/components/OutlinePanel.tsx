import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, Folder, GripVertical, Plus, Trash2, Check, X, Archive, RotateCcw, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../lib/utils';

const SCENE_STATUS_DOTS: Record<string, string> = {
  yellow: 'bg-amber-400',
  green: 'bg-emerald-400',
  blue: 'bg-blue-400',
  red: 'bg-red-400',
};

export function OutlinePanel({ setMobileOpen }: { setMobileOpen?: (open: boolean) => void }) {
  const { state, dispatch } = useStore();
  const [viewMode, setViewMode] = useState<'outline' | 'default' | 'scenes'>('default');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (state.focusMode) return null;

  const activeWorkId = state.activeWorkId;
  if (!activeWorkId) return <div className="w-full md:w-64 border-r border-stone-200 bg-stone-50 p-4 text-stone-500 text-sm">Select a work</div>;

  const chapters = state.chapters.filter(c => c.workId === activeWorkId && (showArchived || !c.archived)).sort((a, b) => a.order - b.order);
  const scenes = state.scenes.filter(s => chapters.some(c => c.id === s.chapterId));
  const isExpanded = isHovered || !state.activeDocumentId;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === 'chapter' && viewMode === 'outline') {
      dispatch({
        type: 'REORDER_CHAPTERS',
        payload: { workId: activeWorkId, startIndex: source.index, endIndex: destination.index }
      });
    } else if (type === 'scene' && viewMode === 'scenes') {
      const sourceChapterId = source.droppableId.replace('chapter-', '');
      const destChapterId = destination.droppableId.replace('chapter-', '');
      
      const sourceScene = scenes.filter(s => s.chapterId === sourceChapterId).sort((a, b) => a.order - b.order)[source.index];
      if (!sourceScene) return;

      if (sourceChapterId === destChapterId) {
        dispatch({
          type: 'REORDER_SCENES',
          payload: { chapterId: sourceChapterId, startIndex: source.index, endIndex: destination.index }
        });
      } else {
        dispatch({
          type: 'MOVE_SCENE',
          payload: { sceneId: sourceScene.id, newChapterId: destChapterId, newIndex: destination.index }
        });
      }
    }
  };

  const addChapter = () => {
    dispatch({ type: 'ADD_CHAPTER', payload: { workId: activeWorkId, title: 'New Chapter' } });
  };

  const addScene = (chapterId: string) => {
    dispatch({ type: 'ADD_SCENE', payload: { chapterId, title: 'New Scene' } });
  };

  const renderDeleteButton = (id: string, onDelete: () => void, size = 12, className?: string) => {
    if (deletingId === id) {
      return (
        <div className="flex items-center bg-red-50 rounded ml-1 animate-in fade-in slide-in-from-right-2 duration-200" onClick={e => e.stopPropagation()}>
          <span className="text-[10px] font-bold text-red-600 mx-1">DELETE?</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setDeletingId(null); }}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
          >
            <Check size={size} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
            className="p-1 text-stone-400 hover:bg-stone-200 rounded"
          >
            <X size={size} />
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setDeletingId(id); }}
        className={cn(
          "md:opacity-0 md:group-hover:opacity-100 opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all relative z-10",
          className
        )}
      >
        <Trash2 size={size} />
      </button>
    );
  };

  return (
    <>
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 z-40 flex transition-transform duration-300 ease-in-out",
          state.activeDocumentId ? "hidden md:flex" : "w-full",
          isExpanded ? "translate-x-0" : "-translate-x-[calc(100%-12px)]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="w-full md:w-72 h-full border-r border-stone-200 bg-stone-50/95 backdrop-blur-sm flex flex-col shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-stone-300 rounded-l-md opacity-50" />
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <div className="flex bg-stone-200/50 p-1 rounded-lg flex-1 mr-2">
              {(['outline', 'default', 'scenes'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex-1 flex items-center justify-center text-xs py-1.5 rounded-md font-medium capitalize transition-all",
                    viewMode === mode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                  )}
                >
                  {mode === 'outline' && <Folder size={14} className="mr-1.5" />}
                  {mode === 'default' && <FileText size={14} className="mr-1.5" />}
                  {mode === 'scenes' && <GripVertical size={14} className="mr-1.5" />}
                  {mode}
                </button>
              ))}
            </div>
          </div>

      <div className="flex-1 overflow-y-auto p-3">
        <label className="flex items-center text-xs text-stone-500 mb-2 px-2 cursor-pointer hover:text-stone-700">
          <input type="checkbox" checked={showArchived} onChange={() => setShowArchived(!showArchived)} className="mr-2 accent-emerald-600" />
          Show Archived
        </label>
        <DragDropContext onDragEnd={handleDragEnd}>
          {viewMode === 'outline' && (
            <Droppable droppableId="chapters" type="chapter">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {chapters.map((chapter, index) => {
                    return (
                      // @ts-expect-error React 19 key prop issue
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "group flex items-center p-2 rounded-md text-sm transition-colors",
                            snapshot.isDragging ? "bg-white shadow-md" : "hover:bg-stone-100",
                            state.activeDocumentId === chapter.id ? "bg-emerald-50 text-emerald-900 font-medium shadow-sm border border-emerald-100" : "text-stone-700 border border-transparent"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="mr-2 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab">
                            <GripVertical size={14} />
                          </div>
                          <Folder size={14} className={cn("mr-2 text-stone-400", chapter.archived && "opacity-50")} />
                          <span 
                            className={cn("flex-1 cursor-pointer whitespace-normal break-words text-xs md:text-sm", chapter.archived && "text-stone-400 italic")}
                            onClick={() => {
                              dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: chapter.id });
                              setMobileOpen?.(false);
                            }}
                          >
                            {chapter.title}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: 'TOGGLE_CHAPTER_ARCHIVE', payload: chapter.id });
                              }}
                              className="md:opacity-0 md:group-hover:opacity-100 opacity-100 p-1 hover:bg-stone-200 rounded text-stone-400 transition-all"
                              title={chapter.archived ? "Unarchive Chapter" : "Archive Chapter"}
                            >
                              {chapter.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                            </button>
                            {renderDeleteButton(chapter.id, () => dispatch({ type: 'DELETE_CHAPTER', payload: chapter.id }))}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}

          {viewMode === 'default' && (
            <div className="space-y-4">
              {chapters.map(chapter => (
                <div key={chapter.id} className="space-y-1">
                  <div 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md text-sm font-medium group cursor-pointer transition-colors",
                      state.activeDocumentId === chapter.id ? "bg-emerald-50 text-emerald-900 shadow-sm border border-emerald-100" : "text-stone-900 hover:bg-stone-100 border border-transparent"
                    )}
                    onClick={() => {
                      dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: chapter.id });
                      setMobileOpen?.(false);
                    }}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {chapter.archived && <Archive size={14} className="md:opacity-0 md:group-hover:opacity-100 opacity-100 mr-2 text-stone-400 shrink-0 transition-all" />}
                      <Folder size={14} className={cn("mr-2 text-stone-400 shrink-0", chapter.archived && "opacity-50")} />
                      <span className={cn("whitespace-normal break-words text-xs md:text-sm", chapter.archived && "text-stone-400 italic")}>{chapter.title}</span>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'TOGGLE_CHAPTER_ARCHIVE', payload: chapter.id });
                        }}
                        className="md:opacity-0 md:group-hover:opacity-100 opacity-100 p-1 hover:bg-stone-200 rounded text-stone-400 transition-all"
                        title={chapter.archived ? "Unarchive Chapter" : "Archive Chapter"}
                      >
                        {chapter.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                      </button>
                      {deletingId !== chapter.id && !chapter.archived && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            addScene(chapter.id); 
                          }}
                          className="md:opacity-0 md:group-hover:opacity-100 opacity-100 p-1 hover:bg-emerald-100 hover:text-emerald-700 rounded text-stone-400 transition-all relative z-10"
                          title="Add Scene"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                      {renderDeleteButton(chapter.id, () => dispatch({ type: 'DELETE_CHAPTER', payload: chapter.id }), 14)}
                    </div>
                  </div>
                  <div className="pl-6 space-y-1 border-l border-stone-200 ml-3">
                    {scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order).map(scene => (
                      <div
                        key={scene.id}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: scene.id });
                          setMobileOpen?.(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded-md text-sm cursor-pointer transition-colors group/scene",
                          state.activeDocumentId === scene.id ? "bg-emerald-50 text-emerald-900 font-medium shadow-sm border border-emerald-100" : "text-stone-600 hover:bg-stone-100 border border-transparent"
                        )}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText size={12} className="mr-2 text-stone-400 shrink-0" />
                          {scene.statusColor && (
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-2 shrink-0", SCENE_STATUS_DOTS[scene.statusColor])} />
                          )}
                          <span className="whitespace-normal break-words text-xs md:text-sm">{scene.title}</span>
                        </div>
                        {renderDeleteButton(scene.id, () => dispatch({ type: 'DELETE_SCENE', payload: scene.id }), 12, "md:group-hover/scene:opacity-100")}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'scenes' && (
            <div className="space-y-4">
              {chapters.map((chapter, chapIndex) => (
                <div key={chapter.id}>
                  {chapIndex > 0 && (
                    <div className="flex items-center my-3">
                      <div className="flex-1 h-px bg-stone-200"></div>
                      <div className="mx-2 text-[10px] font-bold text-stone-300 uppercase tracking-widest">{chapter.title}</div>
                      <div className="flex-1 h-px bg-stone-200"></div>
                    </div>
                  )}
                  {chapIndex === 0 && (
                    <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-2 px-2 text-center">{chapter.title}</div>
                  )}
                  <Droppable droppableId={`chapter-${chapter.id}`} type="scene">
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef} 
                        className={cn(
                          "space-y-1 min-h-[24px] rounded-lg transition-colors",
                          snapshot.isDraggingOver ? "bg-stone-100/80 ring-1 ring-stone-200" : ""
                        )}
                      >
                        {scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order).map((scene, index) => {
                          const chapIndexNum = chapter.order + 1;
                          const sceneIndexNum = scene.order + 1;
                          
                          return (
                            // @ts-expect-error React 19 key prop issue
                            <Draggable key={scene.id} draggableId={scene.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    "group flex items-center p-2 rounded-md text-sm transition-colors",
                                    snapshot.isDragging ? "bg-white shadow-md ring-1 ring-stone-200" : "hover:bg-stone-100",
                                    state.activeDocumentId === scene.id ? "bg-emerald-50 text-emerald-900 font-medium shadow-sm border border-emerald-100" : "text-stone-700 border border-transparent"
                                  )}
                                >
                                  <div {...provided.dragHandleProps} className="mr-2 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab">
                                    <GripVertical size={14} />
                                  </div>
                                  <span className="text-xs font-mono text-stone-400 mr-2 bg-stone-200 px-1.5 py-0.5 rounded">
                                    {chapIndexNum}-{sceneIndexNum}
                                  </span>
                                  {scene.statusColor && (
                                    <div className={cn("w-1.5 h-1.5 rounded-full mr-2 shrink-0", SCENE_STATUS_DOTS[scene.statusColor])} />
                                  )}
                                  <span 
                                    className="flex-1 cursor-pointer whitespace-normal break-words text-xs md:text-sm"
                                    onClick={() => {
                                      dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: scene.id });
                                      setMobileOpen?.(false);
                                    }}
                                  >
                                    {scene.title}
                                  </span>
                                  {renderDeleteButton(scene.id, () => dispatch({ type: 'DELETE_SCENE', payload: scene.id }))}
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          )}
        </DragDropContext>
      </div>
      
      <div className="p-4 border-t border-stone-200 bg-white">
        <button 
          onClick={addChapter}
          className="w-full flex items-center justify-center py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          Add Chapter
        </button>
      </div>
        </div>
      </div>
    </>
  );
}
