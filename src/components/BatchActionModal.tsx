import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { Character, Tag } from '../store/types';

interface BatchActionModalProps {
  onClose: () => void;
  onApply: (updates: { characterIds: string[], tagIds: string[] }) => void;
  characters: Character[];
  tags: Tag[];
  activeWorkId: string;
}

export const BatchActionModal = ({ onClose, onApply, characters, tags, activeWorkId }: BatchActionModalProps) => {
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]">
      <div className="bg-white rounded-xl shadow-xl w-96 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-800">Batch Assign</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Characters</label>
            <MultiSelectDropdown
              options={characters.filter(c => c.workId === activeWorkId).map(c => ({ id: c.id, title: c.name }))}
              selectedIds={selectedCharacterIds}
              onChange={setSelectedCharacterIds}
              placeholder="Select characters..."
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1 block">Tags</label>
            <MultiSelectDropdown
              options={tags.map(t => ({ id: t.id, title: t.name }))}
              selectedIds={selectedTagIds}
              onChange={setSelectedTagIds}
              placeholder="Select tags..."
              className="w-full"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-stone-600 hover:text-stone-800 text-sm font-medium">Cancel</button>
          <button 
            onClick={() => {
              onApply({ characterIds: selectedCharacterIds, tagIds: selectedTagIds });
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
