import React, { useState } from 'react';
import { useStore, CharacterFieldType } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Users, Plus, GripVertical, User, MapPin, ChevronLeft, Settings, X, Trash2, Type, Hash, List, CheckSquare, Activity, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { EventDetailsModal } from './EventDetailsModal';

function FieldOptionInput({ field, workId, dispatch }: { field: any, workId: string, dispatch: any }) {
  const [localValue, setLocalValue] = useState(field.options.join(', '));
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const newOptions = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
    dispatch({
      type: 'UPDATE_CHARACTER_FIELD',
      payload: { workId, fieldId: field.id, updates: { options: newOptions } }
    });
  };

  return (
    <input 
      value={localValue} 
      onChange={handleChange} 
      className="w-full border border-stone-200 p-2 rounded-md text-sm outline-none focus:border-emerald-500" 
      placeholder="e.g. Male, Female, Other" 
    />
  );
}

export function CharactersTab() {
  const { state, dispatch } = useStore();
  const activeWorkId = state.activeWorkId;
  const activeWork = state.works.find(w => w.id === activeWorkId);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (!activeWorkId) return <div className="flex-1 flex items-center justify-center text-stone-400">Select a work</div>;

  const characters = state.characters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const activeChar = characters.find(c => c.id === activeCharId);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    dispatch({
      type: 'REORDER_CHARACTERS',
      payload: { workId: activeWorkId, startIndex: source.index, endIndex: destination.index }
    });
  };

  const handleAddCharacter = () => {
    dispatch({ type: 'ADD_CHARACTER', payload: { workId: activeWorkId, name: 'New Character' } });
  };

  const handleUpdateCharacter = (id: string, updates: any) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id, ...updates } });
  };

  const handleMultiSelectToggle = (charId: string, fieldId: string, option: string, currentValues: string[]) => {
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    dispatch({ type: 'UPDATE_CHARACTER_CUSTOM_FIELD', payload: { characterId: charId, fieldId, value: newValues } });
  };

  // Calculate appearances
  const getAppearances = (charId: string) => {
    const appearances: { chapterTitle: string; sceneTitle: string; sceneId: string; sceneIndexStr: string }[] = [];
    state.scenes.forEach(scene => {
      if (scene.characterIds.includes(charId)) {
        const chapter = state.chapters.find(c => c.id === scene.chapterId);
        if (chapter && chapter.workId === activeWorkId) {
          appearances.push({
            chapterTitle: chapter.title,
            sceneTitle: scene.title,
            sceneId: scene.id,
            sceneIndexStr: `${chapter.order + 1}-${scene.order + 1}`
          });
        }
      }
    });
    return appearances;
  };

  const getTimelineAppearances = (charId: string) => {
    const appearances: { eventTitle: string; eventId: string; timestamp: string; order: number; action: string }[] = [];
    state.timelineEvents.forEach(event => {
      if (event.characterActions && charId in event.characterActions) {
        appearances.push({
          eventTitle: event.title,
          eventId: event.id,
          timestamp: event.timestamp,
          order: event.order,
          action: event.characterActions[charId]
        });
      }
    });
    return appearances.sort((a, b) => a.order - b.order);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Sidebar List */}
      <div className={cn(
        "border-r border-stone-200 bg-stone-50/50 flex flex-col h-full transition-all duration-300",
        activeChar ? "hidden md:flex w-72" : "w-full md:w-72"
      )}>
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 flex items-center text-sm uppercase tracking-wider">
            <Users size={16} className="mr-2 text-stone-400" />
            Characters
          </h3>
          <button 
            onClick={handleAddCharacter}
            className="p-1.5 hover:bg-stone-200 rounded-md text-stone-500 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="characters" type="character">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {characters.map((char, index) => {
                    const sceneAppearanceCount = getAppearances(char.id).length;
                    const timelineAppearanceCount = getTimelineAppearances(char.id).length;
                    return (
                      // @ts-expect-error React 19 key prop issue
                      <Draggable key={char.id} draggableId={char.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "group flex items-center p-2 rounded-md text-sm transition-colors cursor-pointer",
                            snapshot.isDragging ? "bg-white shadow-md" : "hover:bg-stone-100",
                            activeChar?.id === char.id ? "bg-emerald-50 text-emerald-900 font-medium" : "text-stone-700"
                          )}
                          onClick={() => setActiveCharId(char.id)}
                        >
                          <div {...provided.dragHandleProps} className="mr-2 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab">
                            <GripVertical size={14} />
                          </div>
                          <User size={14} className={cn("mr-2", activeChar?.id === char.id ? "text-emerald-500" : "text-stone-400")} />
                          <span className="flex-1 truncate">{char.name}</span>
                          <div className="flex items-center gap-1">
                            {sceneAppearanceCount > 0 && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                activeChar?.id === char.id ? "bg-emerald-200/50 text-emerald-700" : "bg-emerald-100 text-emerald-600"
                              )}>
                                {sceneAppearanceCount}
                              </span>
                            )}
                            {timelineAppearanceCount > 0 && (
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                activeChar?.id === char.id ? "bg-amber-200/50 text-amber-700" : "bg-amber-100 text-amber-600"
                              )}>
                                {timelineAppearanceCount}
                              </span>
                            )}
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
          </DragDropContext>
        </div>
      </div>

      {/* Detail View */}
      {activeChar ? (
        <div className="flex-1 overflow-y-auto p-4 lg:p-12 xl:p-24 bg-white pb-24 md:pb-12">
          <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
            {/* Header */}
            <div>
              <button 
                className="md:hidden mb-4 flex items-center text-stone-500 hover:text-stone-900"
                onClick={() => setActiveCharId(null)}
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to List
              </button>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={activeChar.name || ''}
                  onChange={(e) => handleUpdateCharacter(activeChar.id, { name: e.target.value })}
                  className="flex-1 text-4xl font-serif font-semibold text-stone-900 outline-none placeholder:text-stone-300 bg-transparent"
                  placeholder="Character Name..."
                />
                <ConfirmDeleteButton
                  onConfirm={() => {
                    dispatch({ type: 'DELETE_CHARACTER', payload: activeChar.id });
                    setActiveCharId(null);
                  }}
                  className="ml-4"
                  title="Delete Character"
                />
              </div>
              <div className="h-1 w-12 bg-emerald-500 rounded-full" />
            </div>

            {/* Custom Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center">
                  <Activity size={14} className="mr-2" />
                  Attributes
                </label>
                <button onClick={() => setShowFieldManager(true)} className="text-xs flex items-center text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded transition-colors">
                  <Settings size={12} className="mr-1" /> Configure Fields
                </button>
              </div>
              
              {(!activeWork?.characterFields || activeWork.characterFields.length === 0) ? (
                <div className="text-sm text-stone-400 italic bg-stone-50 p-8 rounded-xl border border-stone-200 border-dashed text-center flex flex-col items-center justify-center">
                  <Settings size={24} className="mb-2 opacity-50" />
                  <p>No custom fields defined.</p>
                  <p className="mt-1 text-xs">Click "Configure Fields" to add age, gender, tags, etc.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  {activeWork.characterFields.map(field => {
                    const value = activeChar.customFields?.[field.id];
                    
                    const getFieldIcon = (type: string) => {
                      switch (type) {
                        case 'text': return <Type size={12} className="mr-1.5 text-stone-400" />;
                        case 'number': return <Hash size={12} className="mr-1.5 text-stone-400" />;
                        case 'select': return <List size={12} className="mr-1.5 text-stone-400" />;
                        case 'multiselect': return <CheckSquare size={12} className="mr-1.5 text-stone-400" />;
                        default: return null;
                      }
                    };

                    return (
                      <div key={field.id} className="space-y-1.5 bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
                        <label className="flex items-center text-xs font-medium text-stone-600 uppercase tracking-wide">
                          {getFieldIcon(field.type)}
                          {field.name}
                        </label>
                        {field.type === 'text' && (
                          <textarea value={value || ''} onChange={e => dispatch({type: 'UPDATE_CHARACTER_CUSTOM_FIELD', payload: {characterId: activeChar.id, fieldId: field.id, value: e.target.value}})} className="w-full text-sm p-2 rounded border border-stone-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-stone-50 resize-y min-h-[42px] whitespace-normal break-words transition-all" rows={1} placeholder={`Enter ${(field.name || '').toLowerCase()}...`} />
                        )}
                        {field.type === 'number' && (
                          <input type="number" value={value || ''} onChange={e => dispatch({type: 'UPDATE_CHARACTER_CUSTOM_FIELD', payload: {characterId: activeChar.id, fieldId: field.id, value: e.target.value ? Number(e.target.value) : ''}})} className="w-full text-sm p-2 rounded border border-stone-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-stone-50 transition-all" placeholder={`Enter ${(field.name || '').toLowerCase()}...`} />
                        )}
                        {field.type === 'select' && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {field.options.map(opt => {
                              const currentValue = Array.isArray(value) ? value[0] : value;
                              const isSelected = currentValue === opt;
                              return (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    const newValue = isSelected ? '' : opt;
                                    dispatch({type: 'UPDATE_CHARACTER_CUSTOM_FIELD', payload: {characterId: activeChar.id, fieldId: field.id, value: newValue}});
                                  }}
                                  className={cn("px-3 py-1.5 text-xs rounded-md border transition-all duration-200", isSelected ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-medium shadow-sm" : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-100")}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {field.type === 'multiselect' && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {field.options.map(opt => {
                              const isSelected = (value || []).includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => handleMultiSelectToggle(activeChar.id, field.id, opt, value || [])}
                                  className={cn("px-3 py-1.5 text-xs rounded-md border transition-all duration-200", isSelected ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-medium shadow-sm" : "bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-100")}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center">
                <FileText size={14} className="mr-2" />
                Background & Description
              </label>
              <textarea
                value={activeChar.description || ''}
                onChange={(e) => handleUpdateCharacter(activeChar.id, { description: e.target.value })}
                placeholder="Enter character background, personality, physical traits..."
                className="w-full h-64 p-4 rounded-xl border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-700 leading-relaxed transition-all"
              />
            </div>

            {/* Appearances */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center">
                  <MapPin size={14} className="mr-2" />
                  Appearances Tracker
                </label>
              </div>
              
              <div className="space-y-6">
                {/* Scene Appearances */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Scene Appearances</h4>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    {(() => {
                      const appearances = getAppearances(activeChar.id);
                      if (appearances.length === 0) {
                        return <div className="p-4 text-center text-stone-400 text-sm italic">No scene appearances.</div>;
                      }
                      return (
                        <div className="divide-y divide-stone-200">
                          {appearances.map((app, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-white transition-colors">
                              <div className="flex items-center space-x-3">
                                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">{app.sceneIndexStr}</span>
                                <span className="text-sm font-semibold text-stone-900">{app.sceneTitle}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  dispatch({ type: 'SET_ACTIVE_TAB', payload: 'writing' });
                                  dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: app.sceneId });
                                }}
                                className="px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-700 rounded-lg text-xs font-medium text-stone-600 transition-all shadow-sm"
                              >
                                Go to Scene
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Timeline Appearances */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Timeline Appearances</h4>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    {(() => {
                      const appearances = getTimelineAppearances(activeChar.id);
                      if (appearances.length === 0) {
                        return <div className="p-4 text-center text-stone-400 text-sm italic">No timeline appearances.</div>;
                      }
                      return (
                        <div className="divide-y divide-stone-200">
                          {appearances.map((event) => (
                            <div key={event.eventId} className="p-4 flex flex-col gap-3 hover:bg-white transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">{event.timestamp}</span>
                                  <span className="text-sm font-semibold text-stone-900">{event.eventTitle}</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'timeline' });
                                    setSelectedEventId(event.eventId);
                                  }}
                                  className="px-3 py-1.5 bg-white border border-stone-200 hover:border-amber-500 hover:text-amber-700 rounded-lg text-xs font-medium text-stone-600 transition-all shadow-sm"
                                >
                                  Go to Event
                                </button>
                              </div>
                              <textarea
                                value={event.action || ''}
                                onChange={(e) => {
                                  dispatch({
                                    type: 'UPDATE_TIMELINE_EVENT_CHARACTER_ACTION',
                                    payload: {
                                      eventId: event.eventId,
                                      characterId: activeChar.id,
                                      action: e.target.value
                                    }
                                  });
                                }}
                                className="text-sm text-stone-600 bg-white/50 p-3 rounded-lg border border-stone-100 italic leading-relaxed w-full resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-200 transition-all"
                                placeholder="Add character action..."
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-stone-400 bg-stone-50/30">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center max-w-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Users size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Character Profiles</h3>
            <p className="text-sm text-stone-500 mb-6">Select a character from the sidebar to view their details, or create a new one to start building your cast.</p>
            <button 
              onClick={handleAddCharacter}
              className="flex items-center px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Plus size={16} className="mr-2" />
              {characters.length === 0 ? 'Add First Character' : 'Add Character'}
            </button>
          </div>
        </div>
      )}

      {/* Field Manager Modal */}
      {showFieldManager && activeWorkId && (
        <div className="fixed inset-0 bg-stone-900/50 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-900">Configure Character Fields</h2>
              <button onClick={() => setShowFieldManager(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-stone-50/50">
              <p className="text-sm text-stone-500 mb-4">Define custom attributes (like Age, Gender, Role) for all characters in this work.</p>
              
              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                dispatch({
                  type: 'REORDER_CHARACTER_FIELDS',
                  payload: { workId: activeWorkId, startIndex: result.source.index, endIndex: result.destination.index }
                });
              }}>
                <Droppable droppableId="character-fields" type="field">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {activeWork?.characterFields?.map((field, index) => (
                        // @ts-expect-error React 19 key prop issue
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn("bg-white border border-stone-200 p-4 rounded-xl flex gap-4 items-start shadow-sm", snapshot.isDragging && "shadow-md")}
                            >
                              <div {...provided.dragHandleProps} className="mt-6 text-stone-400 cursor-grab hover:text-stone-600">
                                <GripVertical size={20} />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Field Name</label>
                                    <input 
                                      value={field.name || ''} 
                                      onChange={e => dispatch({type: 'UPDATE_CHARACTER_FIELD', payload: {workId: activeWorkId, fieldId: field.id, updates: {name: e.target.value}}})} 
                                      className="w-full border border-stone-200 p-2 rounded-md text-sm outline-none focus:border-emerald-500" 
                                      placeholder="e.g. Age, Gender, Faction" 
                                    />
                                  </div>
                                  <div className="w-40">
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Field Type</label>
                                    <select 
                                      value={field.type || ''} 
                                      onChange={e => dispatch({type: 'UPDATE_CHARACTER_FIELD', payload: {workId: activeWorkId, fieldId: field.id, updates: {type: e.target.value as CharacterFieldType}}})} 
                                      className="w-full border border-stone-200 p-2 rounded-md text-sm outline-none focus:border-emerald-500 bg-white"
                                    >
                                      <option value="text">Text</option>
                                      <option value="number">Number</option>
                                      <option value="select">Single Select</option>
                                      <option value="multiselect">Multi Select</option>
                                    </select>
                                  </div>
                                </div>
                                {(field.type === 'select' || field.type === 'multiselect') && (
                                  <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Options (comma separated)</label>
                                    <FieldOptionInput field={field} workId={activeWorkId} dispatch={dispatch} />
                                  </div>
                                )}
                              </div>
                              <ConfirmDeleteButton
                                onConfirm={() => dispatch({type: 'DELETE_CHARACTER_FIELD', payload: {workId: activeWorkId, fieldId: field.id}})}
                                className="p-2 mt-5"
                                title="Delete Field"
                                iconSize={18}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <button 
                onClick={() => dispatch({type: 'ADD_CHARACTER_FIELD', payload: {workId: activeWorkId, field: {id: uuidv4(), name: 'New Field', type: 'text', options: []}}})} 
                className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-700 hover:border-stone-400 flex justify-center items-center font-medium transition-colors"
              >
                <Plus size={18} className="mr-2"/> Add Custom Field
              </button>
            </div>
            <div className="p-4 border-t border-stone-200 flex justify-end">
              <button onClick={() => setShowFieldManager(false)} className="px-4 py-2 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedEventId && (
        <EventDetailsModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
}
