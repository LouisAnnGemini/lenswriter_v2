import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { CharacterFieldType } from '../store/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Users, Plus, GripVertical, User, MapPin, ChevronLeft, Settings, X, Trash2, Type, Hash, List, CheckSquare, Activity, FileText, Maximize2, Network } from 'lucide-react';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { EventDetailsModal } from './EventDetailsModal';

import { useShallow } from 'zustand/react/shallow';

function FieldOptionInput({ field, workId }: { field: any, workId: string }) {
  const [localValue, setLocalValue] = useState(field.options.join(', '));
  const updateCharacterField = useStore(state => state.updateCharacterField);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const newOptions = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
    updateCharacterField(workId, field.id, { options: newOptions });
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
  const { 
    activeWorkId,
    works,
    characters: allCharacters,
    scenes,
    chapters,
    timelineEvents,
    selectedEventId,
    addCharacter, 
    updateCharacter, 
    deleteCharacter, 
    reorderCharacters, 
    updateCharacterCustomField, 
    addCharacterField, 
    updateCharacterField, 
    deleteCharacterField, 
    reorderCharacterFields, 
    addTimelineEvent, 
    updateTimelineEvent, 
    updateTimelineEventCharacterAction, 
    setActiveTab, 
    setActiveDocument, 
    setSelectedEventId 
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    works: state.works,
    characters: state.characters,
    scenes: state.scenes,
    chapters: state.chapters,
    timelineEvents: state.timelineEvents,
    selectedEventId: state.selectedEventId,
    addCharacter: state.addCharacter, 
    updateCharacter: state.updateCharacter, 
    deleteCharacter: state.deleteCharacter, 
    reorderCharacters: state.reorderCharacters, 
    updateCharacterCustomField: state.updateCharacterCustomField, 
    addCharacterField: state.addCharacterField, 
    updateCharacterField: state.updateCharacterField, 
    deleteCharacterField: state.deleteCharacterField, 
    reorderCharacterFields: state.reorderCharacterFields, 
    addTimelineEvent: state.addTimelineEvent, 
    updateTimelineEvent: state.updateTimelineEvent, 
    updateTimelineEventCharacterAction: state.updateTimelineEventCharacterAction, 
    setActiveTab: state.setActiveTab, 
    setActiveDocument: state.setActiveDocument, 
    setSelectedEventId: state.setSelectedEventId 
  })));

  const activeWork = works.find(w => w.id === activeWorkId);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [showFieldManager, setShowFieldManager] = useState(false);

  if (!activeWorkId) return <div className="flex-1 flex items-center justify-center text-stone-400">Select a work</div>;

  const characters = allCharacters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const activeChar = characters.find(c => c.id === activeCharId);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    reorderCharacters(activeWorkId, source.index, destination.index);
  };

  const handleAddCharacter = () => {
    addCharacter(activeWorkId, 'New Character');
  };

  const handleUpdateCharacter = (id: string, updates: any) => {
    updateCharacter({ id, ...updates });
  };

  const handleMultiSelectToggle = (charId: string, fieldId: string, option: string, currentValues: string[]) => {
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    updateCharacterCustomField(charId, fieldId, newValues);
  };

  // Calculate appearances
  const getAppearances = (charId: string) => {
    const appearances: { chapterTitle: string; sceneTitle: string; sceneId: string; sceneIndexStr: string }[] = [];
    scenes.forEach(scene => {
      if (scene.characterIds.includes(charId)) {
        const chapter = chapters.find(c => c.id === scene.chapterId);
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
    timelineEvents.forEach(event => {
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
    <div className="flex-1 flex overflow-hidden bg-stone-50/50 relative">
      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-stone-900 flex items-center">
                <Users className="mr-3 text-stone-400" size={24} />
                Characters
              </h2>
              <p className="text-sm text-stone-500 mt-1">Manage your story's cast and their attributes.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFieldManager(true)} 
                className="flex items-center px-3 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors shadow-sm"
              >
                <Settings size={16} className="mr-2" />
                Configure Fields
              </button>
              <button 
                onClick={handleAddCharacter}
                className="flex items-center px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Add Character
              </button>
            </div>
          </div>

          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-200 border-dashed">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">No Characters Yet</h3>
              <p className="text-sm text-stone-500 mb-6 max-w-sm">Create your first character to start building your cast and tracking their appearances.</p>
              <button 
                onClick={handleAddCharacter}
                className="flex items-center px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Add First Character
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="characters-grid" direction="horizontal" type="character">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
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
                              {...provided.dragHandleProps}
                              onClick={() => setActiveCharId(char.id)}
                              className={cn(
                                "bg-white border border-stone-200 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col h-48",
                                snapshot.isDragging ? "shadow-xl ring-2 ring-emerald-500 rotate-2" : "hover:shadow-md hover:border-emerald-200",
                                activeChar?.id === char.id && "ring-2 ring-emerald-500 border-emerald-500"
                              )}
                            >
                              <div className="flex items-center gap-3 mb-3 group/header">
                                <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 font-semibold shrink-0 shadow-sm">
                                  {char.name ? char.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-stone-900 text-lg truncate pr-2">{char.name || 'Unnamed Character'}</h3>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0">
                                  <ConfirmDeleteButton
                                    onConfirm={() => {
                                      deleteCharacter(char.id);
                                      if (activeCharId === char.id) setActiveCharId(null);
                                    }}
                                    title="Delete Character"
                                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  />
                                </div>
                              </div>
                              
                              <div className="text-sm text-stone-500 line-clamp-2 mb-3">
                                {char.description || <span className="italic opacity-50">No description...</span>}
                              </div>

                              {/* Custom Fields Preview */}
                              {activeWork?.characterFields && activeWork.characterFields.length > 0 && (
                                <div className="flex flex-col gap-1.5 mb-auto">
                                  {activeWork.characterFields.slice(0, 2).map(field => {
                                    const value = char.customFields?.[field.id];
                                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                    
                                    return (
                                      <div key={field.id} className="flex items-start text-xs">
                                        <span className="text-stone-400 font-medium mr-1.5 shrink-0">{field.name}:</span>
                                        <span className="text-stone-600 truncate">
                                          {Array.isArray(value) ? value.join(', ') : String(value)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100 mt-auto">
                                {sceneAppearanceCount > 0 && (
                                  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md flex items-center">
                                    <FileText size={12} className="mr-1" />
                                    {sceneAppearanceCount}
                                  </span>
                                )}
                                {timelineAppearanceCount > 0 && (
                                  <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-md flex items-center">
                                    <Activity size={12} className="mr-1" />
                                    {timelineAppearanceCount}
                                  </span>
                                )}
                                {sceneAppearanceCount === 0 && timelineAppearanceCount === 0 && (
                                  <span className="text-xs text-stone-400 italic">No appearances</span>
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
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {activeChar && (
        <>
          <div 
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[60] transition-opacity" 
            onClick={() => setActiveCharId(null)} 
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0 border-l border-stone-200">
            <div className="p-6 pb-0 border-b border-stone-100 relative bg-white z-20 shrink-0">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4 flex-1 mr-8">
                  <div className="w-16 h-16 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 font-semibold text-2xl shrink-0 shadow-sm">
                    {activeChar.name ? activeChar.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <input
                    type="text"
                    value={activeChar.name || ''}
                    onChange={(e) => handleUpdateCharacter(activeChar.id, { name: e.target.value })}
                    className="w-full text-3xl font-serif font-semibold text-stone-900 outline-none placeholder:text-stone-300 bg-transparent"
                    placeholder="Character Name..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ConfirmDeleteButton
                    onConfirm={() => {
                      deleteCharacter(activeChar.id);
                      setActiveCharId(null);
                    }}
                    title="Delete Character"
                  />
                  <button 
                    onClick={() => setActiveCharId(null)}
                    className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-8">
                {/* Custom Fields */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center">
                      <Activity size={14} className="mr-2" />
                      Attributes
                    </label>
                  </div>
                  
                  {(!activeWork?.characterFields || activeWork.characterFields.length === 0) ? (
                    <div className="text-sm text-stone-400 italic bg-stone-50 p-6 rounded-xl border border-stone-200 border-dashed text-center">
                      <p>No custom fields defined.</p>
                      <button onClick={() => setShowFieldManager(true)} className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium">
                        Configure Fields
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
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
                              <textarea value={value || ''} onChange={e => updateCharacterCustomField(activeChar.id, field.id, e.target.value)} className="w-full text-sm p-2 rounded border border-stone-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-stone-50 resize-y min-h-[42px] whitespace-normal break-words transition-all" rows={1} placeholder={`Enter ${(field.name || '').toLowerCase()}...`} />
                            )}
                            {field.type === 'number' && (
                              <input type="number" value={value || ''} onChange={e => updateCharacterCustomField(activeChar.id, field.id, e.target.value ? Number(e.target.value) : '')} className="w-full text-sm p-2 rounded border border-stone-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-stone-50 transition-all" placeholder={`Enter ${(field.name || '').toLowerCase()}...`} />
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
                                        updateCharacterCustomField(activeChar.id, field.id, newValue);
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
                    className="w-full h-48 p-4 rounded-xl border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-700 leading-relaxed transition-all"
                  />
                </div>

                {/* Appearances */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center">
                      <MapPin size={14} className="mr-2" />
                      Appearances Tracker
                    </label>
                    <button 
                      onClick={() => {
                        const newEventId = uuidv4();
                        const newEventTitle = `Event for ${activeChar.name}`;
                        addTimelineEvent({ 
                          id: newEventId,
                          workId: activeWorkId, 
                          title: newEventTitle, 
                          timestamp: new Date().toISOString().split('T')[0],
                          characterActions: { [activeChar.id]: '' }
                        });
                        setSelectedEventId(newEventId);
                      }}
                      className="text-xs flex items-center text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
                    >
                      <Plus size={12} className="mr-1" /> Add Event
                    </button>
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
                                <div key={i} className="p-3 flex items-center justify-between hover:bg-white transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">{app.sceneIndexStr}</span>
                                    <span className="text-sm font-semibold text-stone-900">{app.sceneTitle}</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setActiveTab('design');
                                      setActiveDocument(app.sceneId);
                                    }}
                                    className="px-2 py-1 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-700 rounded-md text-xs font-medium text-stone-600 transition-all shadow-sm"
                                  >
                                    Go
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
                                    <div className="flex items-center space-x-3 flex-1">
                                      <input
                                        type="text"
                                        value={event.timestamp}
                                        onChange={(e) => {
                                          updateTimelineEvent({ id: event.eventId, timestamp: e.target.value });
                                        }}
                                        className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md w-24 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      />
                                      <input
                                        type="text"
                                        value={event.eventTitle}
                                        onChange={(e) => {
                                          updateTimelineEvent({ id: event.eventId, title: e.target.value });
                                        }}
                                        className="text-sm font-semibold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 outline-none w-full"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => setSelectedEventId(event.eventId)}
                                        className="p-1.5 bg-white border border-stone-200 hover:border-amber-500 hover:text-amber-700 rounded-lg text-stone-500 transition-all shadow-sm"
                                        title="Expand Details"
                                      >
                                        <Maximize2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <textarea
                                    value={event.action || ''}
                                    onChange={(e) => {
                                      updateTimelineEventCharacterAction(event.eventId, activeChar.id, e.target.value);
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

                {/* Future Extensions Placeholders */}
                <div className="pt-4 border-t border-stone-100 space-y-4">
                  <div className="p-4 rounded-xl border border-stone-200 border-dashed bg-stone-50 flex items-center justify-between opacity-60">
                    <div className="flex items-center text-stone-500">
                      <Network size={16} className="mr-3" />
                      <span className="text-sm font-medium">Relationship Graph</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-500 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-stone-200 border-dashed bg-stone-50 flex items-center justify-between opacity-60">
                    <div className="flex items-center text-stone-500">
                      <FileText size={16} className="mr-3" />
                      <span className="text-sm font-medium">Character Notes</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 text-stone-500 px-2 py-1 rounded">Coming Soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Field Manager Modal */}
      {showFieldManager && activeWorkId && (
        <div className="fixed inset-0 bg-stone-900/50 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-stone-900">Configure Character Fields</h2>
              <button onClick={() => setShowFieldManager(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-stone-50/50">
              <p className="text-sm text-stone-500 mb-4">Define custom attributes (like Age, Gender, Role) for all characters in this work.</p>
              
              <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;
                reorderCharacterFields(activeWorkId, result.source.index, result.destination.index);
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
                                      onChange={e => updateCharacterField(activeWorkId, field.id, {name: e.target.value})} 
                                      className="w-full border border-stone-200 p-2 rounded-md text-sm outline-none focus:border-emerald-500" 
                                      placeholder="e.g. Age, Gender, Faction" 
                                    />
                                  </div>
                                  <div className="w-40">
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Field Type</label>
                                    <select 
                                      value={field.type || ''} 
                                      onChange={e => updateCharacterField(activeWorkId, field.id, {type: e.target.value as CharacterFieldType})} 
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
                                    <FieldOptionInput field={field} workId={activeWorkId} />
                                  </div>
                                )}
                              </div>
                              <ConfirmDeleteButton
                                onConfirm={() => deleteCharacterField(activeWorkId, field.id)}
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
                onClick={() => addCharacterField(activeWorkId, {id: uuidv4(), name: 'New Field', type: 'text', options: []})} 
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
