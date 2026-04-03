import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TabConfigItem } from '../store/types';

interface SortableTabItemProps {
  item: TabConfigItem;
  onChange: (id: string, updates: Partial<TabConfigItem>) => void;
  isFirst: boolean;
}

const SortableTabItem: React.FC<SortableTabItemProps> = ({ item, onChange, isFirst }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isFirst });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-white border rounded-lg mb-2",
        isDragging ? "border-emerald-500 shadow-md opacity-90" : "border-stone-200",
        isFirst && "bg-stone-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "p-1 text-stone-400 rounded cursor-grab active:cursor-grabbing",
          isFirst && "opacity-30 cursor-not-allowed"
        )}
      >
        <GripVertical size={18} />
      </div>
      
      <div className="flex-1">
        <input
          type="text"
          value={item.label}
          onChange={(e) => onChange(item.id, { label: e.target.value })}
          disabled={isFirst}
          className={cn(
            "w-full bg-transparent border-none outline-none text-sm font-medium focus:ring-0 p-0",
            isFirst ? "text-stone-500 cursor-not-allowed" : "text-stone-700"
          )}
          placeholder={item.id.charAt(0).toUpperCase() + item.id.slice(1)}
        />
      </div>

      <button
        onClick={() => !isFirst && onChange(item.id, { visible: !item.visible })}
        disabled={isFirst}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isFirst ? "opacity-30 cursor-not-allowed text-stone-400" :
          item.visible ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:bg-stone-100"
        )}
        title={item.visible ? "Hide Tab" : "Show Tab"}
      >
        {item.visible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}

export function TabSettingsModal({ onClose }: { onClose: () => void }) {
  const { tabConfig, updateTabConfig } = useStore(useShallow(state => ({
    tabConfig: state.tabConfig,
    updateTabConfig: state.updateTabConfig,
  })));

  const [activeMode, setActiveMode] = useState<'design' | 'review' | 'management'>('design');
  const [items, setItems] = useState<TabConfigItem[]>(tabConfig[activeMode] || []);

  // Sync items when mode changes
  React.useEffect(() => {
    setItems(tabConfig[activeMode] || []);
  }, [activeMode, tabConfig]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      // Prevent moving the first item or moving anything to the first position
      if (oldIndex === 0 || newIndex === 0) return;

      const newItems = arrayMove(items, oldIndex, newIndex) as TabConfigItem[];
      setItems(newItems);
      updateTabConfig(activeMode, newItems);
    }
  };

  const handleItemChange = (id: string, updates: Partial<TabConfigItem>) => {
    const newItems = items.map(item => item.id === id ? { ...item, ...updates } : item);
    setItems(newItems);
    updateTabConfig(activeMode, newItems);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-stone-900">Customize Tabs</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 shrink-0">
          <div className="flex bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setActiveMode('design')}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                activeMode === 'design' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Design
            </button>
            <button
              onClick={() => setActiveMode('review')}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                activeMode === 'review' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Review
            </button>
            <button
              onClick={() => setActiveMode('management')}
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                activeMode === 'management' ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Management
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0">
          <p className="text-xs text-stone-500 mb-4">
            Drag to reorder. The first tab is locked to ensure core functionality.
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableTabItem
                  key={item.id || `tab-${index}`}
                  item={item}
                  onChange={handleItemChange}
                  isFirst={index === 0}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
