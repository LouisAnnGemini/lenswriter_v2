import React, { useState } from 'react';
import { Check, Info, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Character, Scene } from '../store/types';

interface CharacterAppearanceMatrixProps {
  scenes: Scene[];
  characters: Character[];
  selectedCharacterIds: string[];
  onTogglePresence: (sceneId: string, characterId: string) => void;
  onUpdateNote: (sceneId: string, characterId: string, note: string) => void;
}

export function CharacterAppearanceMatrix({
  scenes,
  characters,
  selectedCharacterIds,
  onTogglePresence,
  onUpdateNote
}: CharacterAppearanceMatrixProps) {
  const [noteModal, setNoteModal] = useState<{ sceneId: string; characterId: string; note: string; isOpen: boolean }>({
    sceneId: '',
    characterId: '',
    note: '',
    isOpen: false
  });

  const openNoteModal = (sceneId: string, characterId: string, note: string) => {
    setNoteModal({ sceneId, characterId, note, isOpen: true });
  };

  const closeNoteModal = () => {
    setNoteModal({ ...noteModal, isOpen: false });
  };

  const saveNote = () => {
    onUpdateNote(noteModal.sceneId, noteModal.characterId, noteModal.note);
    closeNoteModal();
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white border-b border-stone-200 p-2 text-left text-[10px] font-bold text-stone-400 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Scene</th>
            {selectedCharacterIds.map(charId => {
              const char = characters.find(c => c.id === charId);
              return (
                <th key={charId} className="border-b border-stone-200 p-2 text-center min-w-[80px] text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                  {char?.name}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {scenes.map(scene => (
            <tr key={scene.id} className="group/row">
              <td className="sticky left-0 z-10 bg-white border-b border-stone-100 p-2 text-xs font-medium text-stone-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                {scene.title || 'Untitled Scene'}
              </td>
              {selectedCharacterIds.map(charId => {
                const isPresent = scene.characterIds.includes(charId);
                const note = scene.characterPresence?.[charId]?.note || '';
                
                return (
                  <td key={charId} className="border-b border-stone-100 p-2 text-center">
                    <div className="relative flex items-center justify-center">
                      <button
                        onClick={() => onTogglePresence(scene.id, charId)}
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded transition-colors z-10",
                          isPresent ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-stone-100 text-stone-300 hover:bg-stone-200"
                        )}
                      >
                        <Check size={14} />
                      </button>
                      
                      <div className="absolute left-1/2 ml-4">
                        {isPresent && (
                          <button
                            onClick={() => openNoteModal(scene.id, charId, note)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded transition-colors",
                              note ? "text-emerald-600 hover:bg-emerald-100" : "text-stone-300 hover:bg-stone-100 hover:text-stone-500"
                            )}
                          >
                            {note ? <Info size={14} /> : <Plus size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {noteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">Edit Note</h3>
            <textarea
              className="w-full h-32 p-2 border border-stone-300 rounded mb-4"
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button onClick={closeNoteModal} className="px-4 py-2 bg-stone-200 rounded">Cancel</button>
              <button onClick={saveNote} className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
