import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Link as LinkIcon, Archive, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { EditorPanel } from './EditorPanel';

const EVENT_COLORS = {
  stone: 'bg-stone-100 border-stone-200 text-stone-800',
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
};

export function MontageBoard() {
  const { state, dispatch } = useStore();
  const [showArchived, setShowArchived] = useState(false);
  const [isEventPoolOpen, setIsEventPoolOpen] = useState(true);
  const [editorWidth, setEditorWidth] = useState(40);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const activeWorkId = state.activeWorkId;
  const events = state.timelineEvents.filter(e => e.workId === activeWorkId).sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
  const tags = state.tags.filter(t => t.workId === activeWorkId);
  const chapters = state.chapters.filter(c => c.workId === activeWorkId && (showArchived || !c.archived)).sort((a, b) => a.order - b.order);
  const scenes = state.scenes.filter(s => chapters.some(c => c.id === s.chapterId)).sort((a, b) => a.order - b.order);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === 'event-pool' && destination.droppableId.startsWith('scene-')) {
      const sceneId = destination.droppableId.replace('scene-', '');
      const eventId = draggableId;
      
      const scene = state.scenes.find(s => s.id === sceneId);
      if (scene && !scene.linkedEventIds?.includes(eventId)) {
        dispatch({
          type: 'TOGGLE_SCENE_EVENT',
          payload: { sceneId, eventId }
        });
      }
    } else if (source.droppableId.startsWith('scene-') && destination.droppableId === source.droppableId) {
      const sceneId = source.droppableId.replace('scene-', '');
      dispatch({
        type: 'REORDER_SCENE_EVENTS',
        payload: {
          sceneId,
          startIndex: source.index,
          endIndex: destination.index
        }
      });
    } else if (source.droppableId.startsWith('scene-') && destination.droppableId.startsWith('scene-') && source.droppableId !== destination.droppableId) {
      const sourceSceneId = source.droppableId.replace('scene-', '');
      const destSceneId = destination.droppableId.replace('scene-', '');
      // draggableId is `${scene.id}-${eventId}`, so we extract eventId
      const eventId = draggableId.replace(`${sourceSceneId}-`, '');
      
      const destScene = state.scenes.find(s => s.id === destSceneId);
      
      // Remove from source
      dispatch({ type: 'TOGGLE_SCENE_EVENT', payload: { sceneId: sourceSceneId, eventId } });
      
      // Add to destination if not already there
      if (destScene && !destScene.linkedEventIds?.includes(eventId)) {
        dispatch({ type: 'TOGGLE_SCENE_EVENT', payload: { sceneId: destSceneId, eventId } });
      }
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setEditorWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div ref={containerRef} className="flex h-full overflow-hidden">
        {/* Left Track (Editor) */}
        <div 
          style={{ width: `${editorWidth}%` }}
          className="shrink-0 flex flex-col bg-white overflow-hidden"
        >
          <EditorPanel compact={true} />
        </div>

        {/* Resizer Handle */}
        <div 
          onMouseDown={handleMouseDown}
          className="w-1.5 shrink-0 cursor-col-resize bg-stone-200 hover:bg-emerald-400 active:bg-emerald-500 transition-colors z-10"
        />

        {/* Main Track (Narrative Flow) */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-stone-200 bg-stone-50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Narrative Flow (Scenes)</h3>
            <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer hover:text-stone-700">
              <input 
                type="checkbox" 
                checked={showArchived} 
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Archive size={14} />
              Show Archived
            </label>
          </div>
          <div className="space-y-8">
            {chapters.map(chapter => {
              const chapterScenes = scenes.filter(s => s.chapterId === chapter.id);
              return (
                <div key={chapter.id} className={cn("space-y-4", chapter.archived && "opacity-60")}>
                  <h4 
                    className="font-bold text-stone-700 border-b border-stone-200 pb-2 flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: chapter.id })}
                  >
                    {chapter.title}
                    {chapter.archived && <span className="text-[10px] uppercase bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded font-bold">Archived</span>}
                  </h4>
                  <div className="space-y-4 pl-4 border-l-2 border-stone-200">
                    {chapterScenes.map(scene => (
                      <div 
                        key={scene.id} 
                        className={cn(
                          "bg-white rounded-lg shadow-sm border p-4 transition-colors cursor-pointer",
                          state.activeDocumentId === scene.id ? "border-emerald-400 ring-1 ring-emerald-400" : "border-stone-200 hover:border-stone-300"
                        )}
                        onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: scene.id })}
                      >
                        <h5 className="font-medium text-stone-800 mb-3">{scene.title}</h5>
                        <Droppable droppableId={`scene-${scene.id}`} direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "min-h-[60px] rounded-md border-2 border-dashed p-2 flex flex-wrap gap-2 transition-colors",
                                snapshot.isDraggingOver ? "border-emerald-400 bg-emerald-50" : "border-stone-200 bg-stone-50"
                              )}
                            >
                              {scene.linkedEventIds?.map((eventId, index) => {
                                const event = events.find(e => e.id === eventId);
                                if (!event) return null;
                                return (
                                  // @ts-expect-error React 19 key prop issue
                                  <Draggable key={`${scene.id}-${eventId}`} draggableId={`${scene.id}-${eventId}`} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={cn(
                                          "px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-2",
                                          EVENT_COLORS[(event.color as keyof typeof EVENT_COLORS) || 'stone'],
                                          snapshot.isDragging && "shadow-xl scale-105 z-50"
                                        )}
                                      >
                                        <span className="truncate max-w-[150px]">{event.title}</span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch({ type: 'TOGGLE_SCENE_EVENT', payload: { sceneId: scene.id, eventId } });
                                          }}
                                          className="text-stone-400 hover:text-red-500"
                                        >
                                          &times;
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              {(!scene.linkedEventIds || scene.linkedEventIds.length === 0) && !snapshot.isDraggingOver && (
                                <span className="text-stone-400 text-xs flex items-center h-full w-full justify-center opacity-50 pointer-events-none">
                                  Drag events here
                                </span>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Track (Event Pool) */}
        <div className={cn(
          "shrink-0 bg-white border-l border-stone-200 transition-all duration-300 flex flex-col",
          isEventPoolOpen ? "w-80" : "w-12"
        )}>
          <div className={cn(
            "p-4 border-b border-stone-200 flex items-center",
            isEventPoolOpen ? "justify-between" : "justify-center"
          )}>
            {isEventPoolOpen && <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Event Pool</h3>}
            <button
              onClick={() => setIsEventPoolOpen(!isEventPoolOpen)}
              className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
              title={isEventPoolOpen ? "Collapse Event Pool" : "Expand Event Pool"}
            >
              {isEventPoolOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </div>
          
          <div className={cn("flex-1 overflow-y-auto p-6", !isEventPoolOpen && "hidden")}>
            <Droppable droppableId="event-pool" isDropDisabled={true}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-3"
                >
                  {events.map((event, index) => (
                    // @ts-expect-error React 19 key prop issue
                    <Draggable key={event.id} draggableId={event.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing",
                            EVENT_COLORS[(event.color as keyof typeof EVENT_COLORS) || 'stone'],
                            snapshot.isDragging && "shadow-xl scale-105 z-50"
                          )}
                        >
                          <div className="text-[10px] font-bold uppercase opacity-60 mb-1">{event.timestamp}</div>
                          <div className="font-medium text-sm">{event.title}</div>
                          {event.tagIds && event.tagIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.tagIds.map(tagId => {
                                const tag = tags.find(t => t.id === tagId);
                                if (!tag) return null;
                                return (
                                  <span key={tagId} className={cn("text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded border", tag.color || 'bg-stone-100 text-stone-700 border-stone-200')}>
                                    {tag.name}
                                  </span>
                                );
                              })}
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
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
