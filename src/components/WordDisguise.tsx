import React from 'react';
import { Save, Undo, Redo, ChevronDown, Search, Minus, Plus, Layout, FileText, Globe, Scissors, Copy, Settings2 } from 'lucide-react';

export function WordRibbon({ title, onClose, onEdit }: { title: string, onClose?: () => void, onEdit?: () => void }) {
  return (
    <div className="flex flex-col bg-white border-b border-[#E1DFDD] select-none font-sans text-sm z-50">
      {/* Title Bar */}
      <div className="flex items-center justify-between bg-[#2B579A] text-white px-2 py-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2">
            <Save size={16} className="opacity-90 hover:opacity-100 cursor-pointer" />
            <Undo size={16} className="opacity-90 hover:opacity-100 cursor-pointer" />
            <Redo size={16} className="opacity-50 cursor-not-allowed" />
            <ChevronDown size={14} className="opacity-90 hover:opacity-100 cursor-pointer" />
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-xs font-medium tracking-wide">{title || 'Document1'} - Word</div>
        </div>
        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center bg-[#1E3F6C] rounded px-2 py-0.5 text-xs text-white/80">
            <Search size={12} className="mr-1.5" />
            Search (Alt+Q)
          </div>
          <div className="flex items-center gap-3 opacity-90">
            {onEdit && (
              <Settings2 
                size={16} 
                className="cursor-pointer hover:opacity-100" 
                onClick={onEdit}
                title="Edit Disguise Text"
              />
            )}
            <div className="w-3 h-[1px] bg-white"></div>
            <div className="w-3 h-3 border border-white"></div>
            <div className="w-3 h-3 relative cursor-pointer hover:opacity-100" onClick={onClose}>
              <div className="absolute inset-0 flex items-center justify-center rotate-45 text-lg leading-none">+</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-2 pt-1 gap-1 text-[#323130] text-xs">
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer text-white bg-[#2B579A] hover:bg-[#2B579A]">File</div>
        <div className="px-3 py-1.5 bg-white border border-[#E1DFDD] border-b-0 relative z-10 text-[#2B579A] font-semibold cursor-pointer">Home</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">Insert</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">Design</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">Layout</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">References</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">Mailings</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">Review</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">View</div>
        <div className="px-3 py-1.5 hover:bg-[#F3F2F1] cursor-pointer">Help</div>
      </div>

      {/* Ribbon Toolbar (Home) */}
      <div className="flex items-stretch bg-white border-t border-[#E1DFDD] px-2 py-1.5 gap-4 h-24 overflow-hidden">
        {/* Clipboard */}
        <div className="flex items-center gap-1 pr-4 border-r border-[#E1DFDD]">
          <div className="flex flex-col items-center justify-center px-2 hover:bg-[#F3F2F1] cursor-pointer rounded">
            <FileText size={24} className="text-[#2B579A] mb-1" />
            <span className="text-[10px] text-[#605E5C]">Paste</span>
          </div>
          <div className="flex flex-col gap-1 justify-center">
            <div className="flex items-center gap-1 px-1 hover:bg-[#F3F2F1] cursor-pointer rounded text-[11px] text-[#323130]">
              <Scissors size={14} className="text-[#2B579A]" /> Cut
            </div>
            <div className="flex items-center gap-1 px-1 hover:bg-[#F3F2F1] cursor-pointer rounded text-[11px] text-[#323130]">
              <Copy size={14} className="text-[#2B579A]" /> Copy
            </div>
            <div className="flex items-center gap-1 px-1 hover:bg-[#F3F2F1] cursor-pointer rounded text-[11px] text-[#323130]">
              <div className="w-3.5 h-3.5 border border-[#2B579A] flex items-center justify-center text-[8px] font-bold text-[#2B579A]">F</div> Format Painter
            </div>
          </div>
        </div>

        {/* Font */}
        <div className="flex flex-col gap-1 pr-4 border-r border-[#E1DFDD] justify-center">
          <div className="flex items-center gap-1">
            <div className="flex items-center justify-between border border-[#8A8886] rounded px-2 py-0.5 w-32 hover:border-[#323130] cursor-pointer bg-white">
              <span className="text-[11px] truncate">Aptos (Body)</span>
              <ChevronDown size={12} />
            </div>
            <div className="flex items-center justify-between border border-[#8A8886] rounded px-2 py-0.5 w-12 hover:border-[#323130] cursor-pointer bg-white">
              <span className="text-[11px]">11</span>
              <ChevronDown size={12} />
            </div>
            <div className="flex items-center gap-0.5 ml-1">
              <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded text-sm font-bold">A<span className="text-[10px] align-top">^</span></div>
              <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded text-sm font-bold">A<span className="text-[10px] align-bottom">v</span></div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded font-bold text-[#323130]">B</div>
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded italic text-[#323130]">I</div>
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded underline text-[#323130]">U</div>
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded line-through text-[#323130]">ab</div>
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded text-[10px] text-[#323130]">x<sub className="text-[8px]">2</sub></div>
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded text-[10px] text-[#323130]">x<sup className="text-[8px]">2</sup></div>
            <div className="w-[1px] h-4 bg-[#E1DFDD] mx-1"></div>
            <div className="px-2 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded flex flex-col items-center">
              <span className="font-bold text-[#323130] leading-none">A</span>
              <div className="w-3 h-1 bg-red-500 mt-0.5"></div>
            </div>
          </div>
          <div className="text-center text-[10px] text-[#605E5C] mt-auto">Font</div>
        </div>

        {/* Paragraph */}
        <div className="flex flex-col gap-1 pr-4 border-r border-[#E1DFDD] justify-center">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded"><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-2 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130]"></div></div>
              <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded"><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130]"></div></div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="px-1.5 py-0.5 bg-[#E1DFDD] cursor-pointer rounded"><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-2 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130]"></div></div>
            <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded flex flex-col items-center"><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-2 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130]"></div></div>
            <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded flex flex-col items-end"><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-2 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130]"></div></div>
            <div className="px-1.5 py-0.5 hover:bg-[#F3F2F1] cursor-pointer rounded"><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130] mb-0.5"></div><div className="w-3 h-0.5 bg-[#323130]"></div></div>
          </div>
          <div className="text-center text-[10px] text-[#605E5C] mt-auto">Paragraph</div>
        </div>
        
        {/* Styles (Fake) */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden px-2">
            <div className="border border-[#2B579A] bg-[#F3F2F1] px-4 py-2 flex flex-col items-center justify-center min-w-[80px] cursor-pointer">
              <span className="text-sm font-serif">AaBbCcDd</span>
              <span className="text-[10px] text-[#323130]">Normal</span>
            </div>
            <div className="border border-transparent hover:border-[#E1DFDD] px-4 py-2 flex flex-col items-center justify-center min-w-[80px] cursor-pointer">
              <span className="text-sm font-serif">AaBbCcDd</span>
              <span className="text-[10px] text-[#323130]">No Spacing</span>
            </div>
            <div className="border border-transparent hover:border-[#E1DFDD] px-4 py-2 flex flex-col items-center justify-center min-w-[80px] cursor-pointer">
              <span className="text-sm font-serif font-bold text-[#2B579A]">AaBbCcDd</span>
              <span className="text-[10px] text-[#323130]">Heading 1</span>
            </div>
            <div className="border border-transparent hover:border-[#E1DFDD] px-4 py-2 flex flex-col items-center justify-center min-w-[80px] cursor-pointer">
              <span className="text-sm font-serif font-bold text-[#2B579A]">AaBbCcDd</span>
              <span className="text-[10px] text-[#323130]">Heading 2</span>
            </div>
          </div>
          <div className="text-center text-[10px] text-[#605E5C] mt-auto">Styles</div>
        </div>
      </div>
    </div>
  );
}

export function WordStatusBar({ words }: { words: number }) {
  return (
    <div className="flex items-center justify-between bg-[#F3F2F1] border-t border-[#E1DFDD] text-[#605E5C] px-3 py-1 text-[11px] select-none font-sans z-50">
      <div className="flex items-center gap-4">
        <div className="hover:bg-[#E1DFDD] px-1 cursor-pointer">Page 1 of 1</div>
        <div className="hover:bg-[#E1DFDD] px-1 cursor-pointer">{words} words</div>
        <div className="hover:bg-[#E1DFDD] px-1 cursor-pointer flex items-center gap-1">
          <FileText size={12} />
          Text Predictions: On
        </div>
        <div className="hover:bg-[#E1DFDD] px-1 cursor-pointer">English (United States)</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Layout size={14} className="hover:text-[#323130] cursor-pointer" />
          <FileText size={14} className="text-[#2B579A] cursor-pointer" />
          <Globe size={14} className="hover:text-[#323130] cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-right">100%</span>
          <Minus size={12} className="cursor-pointer hover:text-[#323130]" />
          <div className="w-24 h-1 bg-[#C8C6C4] rounded-full relative cursor-pointer">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-3 bg-[#605E5C] rounded-sm"></div>
          </div>
          <Plus size={12} className="cursor-pointer hover:text-[#323130]" />
        </div>
      </div>
    </div>
  );
}
