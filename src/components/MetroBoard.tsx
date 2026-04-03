import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Plus, Trash2, ArrowLeft, ArrowRight, RefreshCw, GitBranch, X, Search, Edit2, Check, ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';
import { cn } from '../lib/utils';
import { MetroNode, MetroBranchDirection } from '../store/types';
import { EventDetailsModal } from './EventDetailsModal';

const X_UNIT = 180;
const Y_UNIT = 120;
const NODE_RADIUS = 12;

interface MetroBoardProps {}

export function MetroBoard({}: MetroBoardProps = {}) {
  const { 
    activeWorkId,
    metroLines,
    metroNodes,
    timelineEvents,
    addMetroLine,
    updateMetroLine,
    deleteMetroLine,
    addMetroNodeBefore,
    addMetroNodeAfter,
    addMetroBranch,
    replaceMetroNodeEvent,
    deleteMetroNode
  } = useStore(useShallow(state => ({
    activeWorkId: state.activeWorkId,
    metroLines: state.metroLines,
    metroNodes: state.metroNodes,
    timelineEvents: state.timelineEvents,
    addMetroLine: state.addMetroLine,
    updateMetroLine: state.updateMetroLine,
    deleteMetroLine: state.deleteMetroLine,
    addMetroNodeBefore: state.addMetroNodeBefore,
    addMetroNodeAfter: state.addMetroNodeAfter,
    addMetroBranch: state.addMetroBranch,
    replaceMetroNodeEvent: state.replaceMetroNodeEvent,
    deleteMetroNode: state.deleteMetroNode
  })));

  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showReplaceMenu, setShowReplaceMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [spacingScale, setSpacingScale] = useState(0.5);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  const workLines = useMemo(() => metroLines.filter(l => l.workId === activeWorkId), [metroLines, activeWorkId]);
  
  useEffect(() => {
    if (workLines.length > 0 && !activeLineId) {
      setActiveLineId(workLines[0].id);
    } else if (workLines.length === 0 && activeLineId) {
      setActiveLineId(null);
    }
  }, [workLines, activeLineId]);

  const activeLine = workLines.find(l => l.id === activeLineId);
  const lineNodes = useMemo(() => metroNodes.filter(n => n.lineId === activeLineId), [metroNodes, activeLineId]);

  const coords = useMemo(() => {
    const c: Record<string, { x: number; y: number }> = {};
    if (!activeLine?.rootNodeId) return c;

    const traverse = (nodeId: string, x: number, y: number) => {
      const node = lineNodes.find(n => n.id === nodeId);
      if (!node) return;

      c[nodeId] = { x, y };

      const event = timelineEvents.find(e => e.id === node.eventId);
      const duration = Math.max(0.5, event?.duration || 1);

      if (node.nextId) {
        traverse(node.nextId, x + duration, y);
      }

      for (const branch of node.branches) {
        traverse(branch.nodeId, x + duration * 0.5, y + branch.direction * 0.5);
      }
    };

    traverse(activeLine.rootNodeId, 0, 0);
    return c;
  }, [activeLine, lineNodes, timelineEvents]);

  const handleAddLine = () => {
    if (!activeWorkId) return;
    const title = `Line ${workLines.length + 1}`;
    addMetroLine(activeWorkId, title);
  };

  const currentLineColor = activeLine?.color || '#818cf8';

  const renderLines = () => {
    const paths: React.ReactNode[] = [];

    const drawLine = (x1: number, y1: number, x2: number, y2: number, isBranch: boolean) => {
      const px1 = x1 * X_UNIT * spacingScale;
      const py1 = y1 * Y_UNIT;
      const px2 = x2 * X_UNIT * spacingScale;
      const py2 = y2 * Y_UNIT;

      if (!isBranch) {
        // Straight horizontal line
        return `M ${px1} ${py1} L ${px2} ${py2}`;
      } else {
        // Curved branch line
        const dx = px2 - px1;
        return `M ${px1} ${py1} C ${px1 + dx / 2} ${py1}, ${px2 - dx / 2} ${py2}, ${px2} ${py2}`;
      }
    };

    lineNodes.forEach(node => {
      const start = coords[node.id];
      if (!start) return;

      if (node.nextId && coords[node.nextId]) {
        const end = coords[node.nextId];
        paths.push(
          <path
            key={`${node.id}-next`}
            d={drawLine(start.x, start.y, end.x, end.y, false)}
            fill="none"
            stroke={currentLineColor}
            strokeWidth="8"
            strokeLinecap="round"
          />
        );
      }

      node.branches.forEach(branch => {
        if (coords[branch.nodeId]) {
          const end = coords[branch.nodeId];
          paths.push(
            <path
              key={`${node.id}-branch-${branch.nodeId}`}
              d={drawLine(start.x, start.y, end.x, end.y, true)}
              fill="none"
              stroke={currentLineColor}
              strokeWidth="8"
              strokeLinecap="round"
            />
          );
        }
      });
    });

    return paths;
  };

  const renderNodes = () => {
    return lineNodes.map(node => {
      const pos = coords[node.id];
      if (!pos) return null;

      const event = timelineEvents.find(e => e.id === node.eventId);
      const isSelected = selectedNodeId === node.id;

      return (
        <div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{
            left: pos.x * X_UNIT * spacingScale,
            top: pos.y * Y_UNIT,
            zIndex: isSelected ? 50 : 10
          }}
        >
          {/* Node Popover */}
          {isSelected && (
            <div className="absolute bottom-full mb-4 bg-white rounded-lg shadow-xl border border-stone-200 p-1.5 flex items-center gap-1 z-50">
              <button onClick={() => addMetroNodeBefore(node.id)} className="flex flex-col items-center p-2 hover:bg-stone-100 rounded text-stone-600 min-w-[48px]">
                <ArrowLeft size={16} className="mb-1" />
                <span className="text-[10px] font-medium">前置</span>
              </button>
              <button onClick={() => addMetroNodeAfter(node.id)} className="flex flex-col items-center p-2 hover:bg-stone-100 rounded text-stone-600 min-w-[48px]">
                <ArrowRight size={16} className="mb-1" />
                <span className="text-[10px] font-medium">后置</span>
              </button>
              <div className="w-px h-8 bg-stone-200 mx-1" />
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowReplaceMenu(!showReplaceMenu); }} className="flex flex-col items-center p-2 hover:bg-stone-100 rounded text-stone-600 min-w-[48px]">
                  <RefreshCw size={16} className="mb-1" />
                  <span className="text-[10px] font-medium">替换</span>
                </button>
                {showReplaceMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="p-2 border-b border-stone-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search events..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-stone-200 rounded outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {timelineEvents
                        .filter(e => e.workId === activeWorkId && e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(e => (
                          <button
                            key={e.id}
                            onClick={() => {
                              replaceMetroNodeEvent(node.id, e.id);
                              setShowReplaceMenu(false);
                              setSelectedNodeId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 border-b border-stone-50 last:border-0 truncate"
                          >
                            {e.title || 'Untitled Event'}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  const hasUp = node.branches.some(b => b.direction === -1);
                  addMetroBranch(node.id, hasUp ? 1 : -1);
                }} 
                className="flex flex-col items-center p-2 hover:bg-stone-100 rounded text-stone-600 min-w-[48px]"
              >
                <GitBranch size={16} className="mb-1" />
                <span className="text-[10px] font-medium">支线</span>
              </button>
              <div className="w-px h-8 bg-stone-200 mx-1" />
              <button onClick={() => { deleteMetroNode(node.id); setSelectedNodeId(null); }} className="flex flex-col items-center p-2 hover:bg-red-50 rounded text-red-600 min-w-[48px]">
                <Trash2 size={16} className="mb-1" />
                <span className="text-[10px] font-medium">删除</span>
              </button>
            </div>
          )}

          {/* Node Circle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNodeId(isSelected ? null : node.id);
              setShowReplaceMenu(false);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingEventId(node.eventId);
            }}
            className={cn(
              "w-6 h-6 rounded-full bg-white border-4 transition-all shadow-sm",
              isSelected ? "scale-125" : "hover:scale-110",
              pos.y === 0 ? "w-8 h-8 border-[5px]" : "" // Make main line nodes slightly larger
            )}
            style={{
              borderColor: currentLineColor
            }}
          />

          {/* Node Label */}
          <div className={cn(
            "absolute whitespace-nowrap font-bold text-stone-800 transition-all",
            pos.y === 0 ? "top-10 text-sm" : "bottom-8 text-xs text-stone-600"
          )}>
            {event?.title || 'Untitled Event'}
          </div>
        </div>
      );
    });
  };

  if (!activeWorkId) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-50/50 overflow-hidden" onClick={() => { setSelectedNodeId(null); setShowReplaceMenu(false); }}>
      {/* Header / Line Manager */}
      <div className="h-14 border-b border-stone-200 bg-white flex items-center px-4 shrink-0 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar flex-1">
          {workLines.map(line => (
            <div key={line.id} className="flex items-center">
              {editingLineId === line.id ? (
                <input
                  type="text"
                  autoFocus
                  defaultValue={line.title}
                  onBlur={(e) => {
                    updateMetroLine(line.id, { title: e.target.value || 'Untitled Line' });
                    setEditingLineId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateMetroLine(line.id, { title: e.currentTarget.value || 'Untitled Line' });
                      setEditingLineId(null);
                    } else if (e.key === 'Escape') {
                      setEditingLineId(null);
                    }
                  }}
                  className="px-3 py-1 text-sm border border-indigo-300 rounded-full outline-none focus:ring-2 focus:ring-indigo-200 w-32"
                />
              ) : (
                <div
                  onClick={() => setActiveLineId(line.id)}
                  onDoubleClick={() => setEditingLineId(line.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 border cursor-pointer",
                    activeLineId === line.id 
                      ? "bg-white shadow-sm" 
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200 border-transparent"
                  )}
                  style={activeLineId === line.id ? { borderColor: line.color || '#818cf8', color: line.color || '#818cf8' } : {}}
                >
                  {activeLineId === line.id ? (
                    <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 shadow-sm border border-black/10" style={{ backgroundColor: line.color || '#818cf8' }}>
                      <input 
                        type="color" 
                        value={line.color || '#818cf8'} 
                        onChange={(e) => updateMetroLine(line.id, { color: e.target.value })}
                        className="absolute inset-0 w-8 h-8 -top-2 -left-2 cursor-pointer opacity-0"
                        title="Change line color"
                      />
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: line.color || '#818cf8' }} />
                  )}
                  {line.title}
                  {activeLineId === line.id && (
                    <Edit2 size={12} className="opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setEditingLineId(line.id); }} />
                  )}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={handleAddLine}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors shrink-0"
            title="Add new line"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500">间距</span>
            <input 
              type="range" 
              min="0.1" 
              max="2" 
              step="0.05" 
              value={spacingScale} 
              onChange={(e) => setSpacingScale(parseFloat(e.target.value))}
              className="w-24 accent-indigo-500"
            />
          </div>
          
          {activeLine && (
            deletingLineId === activeLine.id ? (
              <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                <span className="text-xs text-red-600 font-medium mr-1">删除?</span>
                <button onClick={() => { deleteMetroLine(activeLine.id); setDeletingLineId(null); }} className="p-1 hover:bg-red-200 rounded text-red-700 transition-colors"><Check size={14} /></button>
                <button onClick={() => setDeletingLineId(null)} className="p-1 hover:bg-red-200 rounded text-red-700 transition-colors"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingLineId(activeLine.id)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete current line"
              >
                <Trash2 size={16} />
              </button>
            )
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#f8fafc]">
        {/* Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {activeLine ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={4}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            limitToBounds={false}
            panning={{ velocityDisabled: false }}
          >
            {({ zoomIn, zoomOut, centerView }) => (
              <React.Fragment>
                <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-2 bg-white p-1.5 rounded-xl shadow-lg border border-stone-200">
                  <button onClick={() => centerView(1, 500)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" title="Locate Root Node">
                    <LocateFixed size={20} />
                  </button>
                  <div className="w-full h-px bg-stone-100 my-0.5" />
                  <button onClick={() => zoomIn(0.2, 300)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" title="Zoom In">
                    <ZoomIn size={20} />
                  </button>
                  <button onClick={() => zoomOut(0.2, 300)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors" title="Zoom Out">
                    <ZoomOut size={20} />
                  </button>
                </div>
                <TransformComponent wrapperClass="!w-full !h-full">
                  <div 
                    className="relative"
                    style={{
                      width: '8000px',
                      height: '6000px',
                    }}
                  >
                    <div className="absolute inset-0" style={{ transform: `translate(4000px, 3000px)` }}>
                      <svg className="absolute inset-0 overflow-visible pointer-events-none">
                        {renderLines()}
                      </svg>
                      {renderNodes()}
                    </div>
                  </div>
                </TransformComponent>
              </React.Fragment>
            )}
          </TransformWrapper>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400">
            Create or select a line to begin
          </div>
        )}
      </div>

      {editingEventId && (
        <EventDetailsModal
          eventId={editingEventId}
          onClose={() => setEditingEventId(null)}
        />
      )}
    </div>
  );
}
