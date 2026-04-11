import React, { useState, useEffect } from 'react';
import { Settings2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DisguiseSettingsModalProps {
  showDisguiseSettings: boolean;
  setShowDisguiseSettings: (show: boolean) => void;
  disguiseBackgroundText: string;
  setDisguiseBackgroundText: (text: string) => void;
}

export function DisguiseSettingsModal({
  showDisguiseSettings,
  setShowDisguiseSettings,
  disguiseBackgroundText,
  setDisguiseBackgroundText
}: DisguiseSettingsModalProps) {
  const [tempDisguiseText, setTempDisguiseText] = useState(disguiseBackgroundText);

  useEffect(() => {
    if (showDisguiseSettings) {
      setTempDisguiseText(disguiseBackgroundText);
    }
  }, [showDisguiseSettings, disguiseBackgroundText]);

  if (!showDisguiseSettings) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-stone-500" />
            <h3 className="font-semibold text-stone-900">Edit Disguise Background Text</h3>
          </div>
          <button 
            onClick={() => setShowDisguiseSettings(false)}
            className="p-1 hover:bg-stone-200 rounded-full transition-colors"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-stone-500 mb-4">
            This text will be displayed behind your actual content when Disguise Mode is active. 
            Use it to make your screen look like a legitimate document or report.
          </p>
          <textarea
            value={tempDisguiseText}
            onChange={(e) => setTempDisguiseText(e.target.value)}
            className="w-full h-96 p-4 rounded-lg border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm resize-none bg-stone-50"
            placeholder="Paste your disguise text here..."
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50/50 border-t border-stone-100">
          <button
            onClick={() => setShowDisguiseSettings(false)}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setDisguiseBackgroundText(tempDisguiseText);
              setShowDisguiseSettings(false);
              toast.success('Disguise text updated');
            }}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
