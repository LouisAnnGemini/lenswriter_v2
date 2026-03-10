import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { countWords, cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Calendar as CalendarIcon, Target, BookOpen, ChevronDown, ChevronRight as ChevronRightIcon, X } from 'lucide-react';

export function DeadlineTab() {
  const { state, dispatch } = useStore();
  const [currentDate, setCurrentDate] = useState(() => {
    // Use the provided current local time: 2026-03-06T19:19:17-08:00
    return new Date('2026-03-06T19:19:17-08:00');
  });

  // State to track expanded works
  const [expandedWorks, setExpandedWorks] = useState<Record<string, boolean>>({});

  // Initialize expanded works (first work expanded by default)
  useEffect(() => {
    if (state.works.length > 0 && Object.keys(expandedWorks).length === 0) {
      const sortedWorks = [...state.works].sort((a, b) => a.order - b.order);
      setExpandedWorks({ [sortedWorks[0].id]: true });
    }
  }, [state.works]);

  const toggleWorkExpanded = (workId: string) => {
    setExpandedWorks(prev => ({ ...prev, [workId]: !prev[workId] }));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Word count calculations
  const getDocumentWordCount = (docId: string) => {
    const blocks = state.blocks.filter(b => b.documentId === docId && (b.type === 'text' || b.type === 'lens'));
    return blocks.reduce((sum, b) => sum + countWords(b.content), 0);
  };

  const getChapterWordCount = (chapterId: string) => {
    let count = getDocumentWordCount(chapterId);
    const scenes = state.scenes.filter(s => s.chapterId === chapterId);
    for (const scene of scenes) {
      count += getDocumentWordCount(scene.id);
    }
    return count;
  };

  const getWorkWordCount = (workId: string) => {
    const chapters = state.chapters.filter(c => c.workId === workId);
    let count = 0;
    for (const chapter of chapters) {
      count += getChapterWordCount(chapter.id);
    }
    return count;
  };

  // Get all chapters across all works that have a goal set and are not completed
  const todoTasks = useMemo(() => {
    return state.chapters
      .filter(c => c.goalWordCount && !c.completed && !c.deadline)
      .sort((a, b) => {
        const workA = state.works.find(w => w.id === a.workId);
        const workB = state.works.find(w => w.id === b.workId);
        if (workA && workB && workA.order !== workB.order) {
          return workA.order - workB.order;
        }
        return a.order - b.order;
      });
  }, [state.chapters, state.works]);

  const handleUpdateGoal = (chapterId: string, goalWordCount: number | undefined) => {
    dispatch({ type: 'UPDATE_CHAPTER_GOAL', payload: { id: chapterId, goalWordCount } });
  };

  const handleToggleComplete = (chapterId: string, completed: boolean) => {
    dispatch({ type: 'UPDATE_CHAPTER_GOAL', payload: { id: chapterId, completed } });
  };

  const handleDrop = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    const chapterId = e.dataTransfer.getData('text/plain');
    if (chapterId) {
      dispatch({ type: 'UPDATE_CHAPTER_GOAL', payload: { id: chapterId, deadline: dateString } });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex-1 flex overflow-hidden bg-stone-50">
      {/* Left Panel: Projects, Chapters, and To-Do */}
      <div className="w-1/3 min-w-[300px] border-r border-stone-200 bg-white flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-stone-200">
          <h2 className="text-lg font-serif font-semibold text-stone-800 flex items-center">
            <Target className="mr-2 text-emerald-600" size={20} />
            Goals & To-Do
          </h2>
        </div>

        <div className="p-4 space-y-6">
          {/* To-Do Area */}
          {todoTasks.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-800 mb-2 flex items-center">
                <CalendarIcon size={14} className="mr-1.5" />
                Unscheduled Tasks (Drag to Calendar)
              </h3>
              <div className="space-y-2">
                {todoTasks.map(task => {
                  const work = state.works.find(w => w.id === task.workId);
                  const currentWords = getChapterWordCount(task.id);
                  const percentage = task.goalWordCount ? Math.min(100, Math.round((currentWords / task.goalWordCount) * 100)) : 0;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', task.id);
                      }}
                      className="bg-white p-2 rounded border border-emerald-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-emerald-400 transition-colors relative group"
                    >
                      <button
                        onClick={() => handleUpdateGoal(task.id, undefined)}
                        className="absolute top-1 right-1 p-1 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove goal"
                      >
                        <X size={14} />
                      </button>
                      <div className="text-xs font-medium text-stone-500 mb-1 pr-5">{work?.title}</div>
                      <div className="text-sm font-medium text-stone-800 pr-5">{task.title}</div>
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-xs text-stone-500 mb-1">
                          <span>{currentWords} / {task.goalWordCount} words</span>
                          <span className="font-medium text-emerald-600">{percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects and Chapters */}
          <div className="space-y-6">
            {[...state.works].sort((a, b) => a.order - b.order).map(work => {
              const workTotalWords = getWorkWordCount(work.id);
              // Sort chapters: incomplete first, then by original order
              const chapters = state.chapters
                .filter(c => c.workId === work.id)
                .sort((a, b) => {
                  const aCompleted = !!a.completed;
                  const bCompleted = !!b.completed;
                  if (aCompleted === bCompleted) {
                    return a.order - b.order;
                  }
                  return aCompleted ? 1 : -1;
                });
              
              const isExpanded = expandedWorks[work.id];

              return (
                <div key={work.id} className="space-y-3">
                  <div 
                    className="flex items-center justify-between pb-2 border-b border-stone-100 cursor-pointer hover:bg-stone-50 p-1 -mx-1 rounded"
                    onClick={() => toggleWorkExpanded(work.id)}
                  >
                    <h3 className="font-semibold text-stone-800 flex items-center">
                      {isExpanded ? (
                        <ChevronDown size={16} className="mr-1 text-stone-400" />
                      ) : (
                        <ChevronRightIcon size={16} className="mr-1 text-stone-400" />
                      )}
                      <BookOpen size={16} className="mr-2 text-stone-400" />
                      {work.title}
                    </h3>
                    <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                      {workTotalWords} words
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 pl-2">
                      {chapters.map(chapter => {
                        const chapterWords = getChapterWordCount(chapter.id);
                        return (
                          <div key={chapter.id} className="bg-stone-50 p-2.5 rounded-md border border-stone-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center flex-1 min-w-0 pr-2">
                                <button
                                  onClick={() => handleToggleComplete(chapter.id, !chapter.completed)}
                                  className={cn(
                                    "mr-2 shrink-0 transition-colors",
                                    chapter.completed ? "text-emerald-500" : "text-stone-300 hover:text-stone-400"
                                  )}
                                >
                                  {chapter.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                </button>
                                <span className={cn(
                                  "text-sm font-medium truncate transition-colors",
                                  chapter.completed ? "text-stone-400 line-through" : "text-stone-700"
                                )}>
                                  {chapter.title}
                                </span>
                              </div>
                              <span className="text-xs text-stone-500 shrink-0">
                                {chapterWords} words
                              </span>
                            </div>
                            
                            <div className="flex items-center pl-6">
                              <label className="text-xs text-stone-500 mr-2">Goal:</label>
                              <input
                                type="number"
                                min="0"
                                value={chapter.goalWordCount || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                  handleUpdateGoal(chapter.id, val);
                                }}
                                placeholder="Set word count goal..."
                                className="flex-1 min-w-0 text-xs px-2 py-1 bg-white border border-stone-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                disabled={chapter.completed}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel: Calendar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-100 p-6">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 flex flex-col h-full overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-200">
            <h2 className="text-xl font-serif font-semibold text-stone-800">
              {monthNames[month]} {year}
            </h2>
            <div className="flex space-x-2">
              <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-600 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-600 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 shrink-0">
              {dayNames.map((day, i) => (
                <div key={day} className={cn(
                  "py-2 text-center text-xs font-semibold uppercase tracking-wider",
                  (i === 0 || i === 6) ? "text-stone-400" : "text-stone-600"
                )}>
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="border-b border-r border-stone-100 bg-stone-50/50" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = new Date().toISOString().split('T')[0] === dateString;
                const dayOfWeek = new Date(year, month, day).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                
                // Find tasks for this day
                const dayTasks = state.chapters
                  .filter(c => c.deadline === dateString)
                  .sort((a, b) => {
                    const workA = state.works.find(w => w.id === a.workId);
                    const workB = state.works.find(w => w.id === b.workId);
                    if (workA && workB && workA.order !== workB.order) {
                      return workA.order - workB.order;
                    }
                    return a.order - b.order;
                  });

                return (
                  <div 
                    key={day} 
                    onDrop={(e) => handleDrop(e, dateString)}
                    onDragOver={handleDragOver}
                    className={cn(
                      "border-b border-r border-stone-200 p-1.5 flex flex-col transition-colors min-h-[100px]",
                      isWeekend ? "bg-stone-50/80" : "bg-white",
                      isToday && "ring-2 ring-inset ring-emerald-500/50"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday ? "bg-emerald-500 text-white" : (isWeekend ? "text-stone-400" : "text-stone-700")
                      )}>
                        {day}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {dayTasks.map(task => {
                        const work = state.works.find(w => w.id === task.workId);
                        const currentWords = getChapterWordCount(task.id);
                        const percentage = task.goalWordCount ? Math.min(100, Math.round((currentWords / task.goalWordCount) * 100)) : 0;
                        return (
                          <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', task.id);
                            }}
                            className={cn(
                              "text-xs p-1.5 rounded border shadow-sm group relative cursor-grab active:cursor-grabbing",
                              task.completed 
                                ? "bg-stone-100 border-stone-200 text-stone-500" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-900"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="font-medium truncate pr-4" title={`${work?.title} - ${task.title}`}>
                                {task.title}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch({ type: 'UPDATE_CHAPTER_GOAL', payload: { id: task.id, deadline: undefined } });
                                }}
                                className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 text-stone-400 hover:text-red-500 transition-opacity"
                                title="Remove from calendar"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div className="mt-1.5">
                              <div className="text-[10px] opacity-80 flex justify-between items-center mb-1">
                                <span className="truncate max-w-[60px]">{work?.title}</span>
                                <span className="font-medium">{percentage}%</span>
                              </div>
                              <div className={cn(
                                "h-1 w-full rounded-full overflow-hidden",
                                task.completed ? "bg-stone-200" : "bg-emerald-200/50"
                              )}>
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    task.completed ? "bg-stone-400" : "bg-emerald-500"
                                  )}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
