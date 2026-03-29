import React from 'react';
import { Character, Scene } from '../store/types';

interface ChapterCharacterSummaryProps {
  isScene: boolean;
  disguiseMode: boolean;
  chapterCharacters: string[];
  characters: Character[];
  scenes: Scene[];
  activeDocId: string;
  activeDocumentOrder: number;
}

export function ChapterCharacterSummary({
  isScene,
  disguiseMode,
  chapterCharacters,
  characters,
  scenes,
  activeDocId,
  activeDocumentOrder
}: ChapterCharacterSummaryProps) {
  if (isScene || disguiseMode || chapterCharacters.length === 0) return null;

  return (
    <div className="mb-12 space-y-6">
      <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Character Appearances</h3>
      {chapterCharacters.map(charId => {
        const char = characters.find(c => c.id === charId);
        if (!char) return null;
        
        const scenesWithChar = scenes.filter(s => s.chapterId === activeDocId && s.characterIds.includes(charId)).sort((a, b) => a.order - b.order);
        
        return (
          <div key={charId} className="bg-stone-50 rounded-lg p-4 border border-stone-100">
            <div className="font-semibold text-stone-900 mb-3">{char.name} appears in:</div>
            <div className="space-y-2 pl-2 border-l-2 border-stone-200">
              {scenesWithChar.map(scene => {
                const sceneIndex = `${activeDocumentOrder + 1}-${scene.order + 1}`;
                return (
                  <div key={scene.id} className="flex items-start space-x-3">
                    <span className="text-xs font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{sceneIndex}</span>
                    <span className="text-sm text-stone-700">{scene.title || 'Untitled Scene'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
