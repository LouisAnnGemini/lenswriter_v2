import React from 'react';
import { Plus, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { Scene, Block } from '../store/types';
import { SCENE_STATUS_COLORS } from '../store/constants';

interface ChapterScenesListProps {
  isScene: boolean;
  disguiseMode: boolean;
  activeDocId: string;
  scenes: Scene[];
  allBlocks: Block[];
  addScene: (params: { chapterId: string }) => void;
  setActiveDocument: (id: string) => void;
  updateScene: (updates: Partial<Scene> & { id: string }) => void;
}

export function ChapterScenesList({
  isScene,
  disguiseMode,
  activeDocId,
  scenes,
  allBlocks,
  addScene,
  setActiveDocument,
  updateScene
}: ChapterScenesListProps) {
  if (isScene || disguiseMode) return null;

  const chapterScenes = scenes.filter(s => s.chapterId === activeDocId).sort((a, b) => a.order - b.order);

  return (
    <div className="mb-12 space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Scenes in this Chapter</h3>
        <button
          onClick={() => addScene({ chapterId: activeDocId })}
          className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
        >
          <Plus size={14} />
          Add Scene
        </button>
      </div>
      {chapterScenes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {chapterScenes.map(scene => {
            const status = SCENE_STATUS_COLORS[scene.statusColor || 'none'] || SCENE_STATUS_COLORS.none;
            return (
              <div
                key={scene.id}
                className={cn(
                  "group relative flex flex-col rounded-xl border transition-all duration-300 hover:shadow-md",
                  status.bg,
                  status.border
                )}
              >
                <button
                  onClick={() => setActiveDocument(scene.id)}
                  className="flex-1 p-4 text-left"
                >
                  <div className="flex items-center justify-end mb-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Scene {scene.order + 1}</span>
                  </div>
                  <div className={cn("text-sm font-semibold truncate mb-1 flex items-center", status.text)}>
                    <div className={cn("w-2 h-2 rounded-full mr-2 shrink-0", status.dot)} />
                    {scene.title || 'Untitled Scene'}
                  </div>
                  <div className="text-[10px] text-stone-500 flex items-center opacity-60">
                    <FileText size={10} className="mr-1" />
                    {allBlocks.filter(b => b.documentId === scene.id && !b.isLens).reduce((acc, b) => acc + b.content.length, 0)} chars
                  </div>
                </button>

                {/* Color Picker Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-stone-200">
                  {Object.keys(SCENE_STATUS_COLORS).map(colorKey => (
                    <button
                      key={colorKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateScene({ id: scene.id, statusColor: colorKey === 'none' ? undefined : colorKey });
                      }}
                      className={cn(
                        "w-3 h-3 rounded-full border border-black/5 transition-transform hover:scale-125",
                        SCENE_STATUS_COLORS[colorKey].dot,
                        (scene.statusColor || 'none') === colorKey && "ring-1 ring-offset-1 ring-stone-400"
                      )}
                      title={SCENE_STATUS_COLORS[colorKey].label}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-stone-500 italic p-4 bg-stone-50 rounded-lg border border-stone-100 text-center">
          No scenes in this chapter yet.
        </div>
      )}
    </div>
  );
}
