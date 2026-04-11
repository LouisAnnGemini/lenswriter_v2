import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/stores/useStore';
import { SIDEBAR_ITEMS_REGISTRY, DEFAULT_SIDEBAR_CONFIG } from '../store/constants';
import { SidebarGroupConfig, SidebarItemConfig } from '../store/types';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface SortableItemProps {
  key?: React.Key;
  item: SidebarItemConfig;
  containerId: string;
}

function SortableItem({ item, containerId }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'item', containerId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const registryItem = SIDEBAR_ITEMS_REGISTRY[item.id];
  if (!registryItem) return null;
  const Icon = registryItem.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 mb-2 bg-white border border-stone-200 rounded-md shadow-sm",
        isDragging && "z-50 shadow-md border-emerald-500"
      )}
    >
      <div className="flex items-center space-x-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex items-center space-x-2 text-stone-700">
          <Icon size={16} />
          <span className="text-sm font-medium">{registryItem.label}</span>
        </div>
      </div>
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('toggle-item-visibility', { detail: { id: item.id } }));
        }}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          item.visible ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:bg-stone-100"
        )}
        title={item.visible ? "Hide Item" : "Show Item"}
      >
        {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}

export function PrimarySidebarSettingsModal({ onClose }: { onClose: () => void }) {
  const storeConfig = useStore(state => state.sidebarConfig) || DEFAULT_SIDEBAR_CONFIG;
  const updateSidebarConfig = useStore(state => state.updateSidebarConfig);
  
  const [groups, setGroups] = useState<SidebarGroupConfig[]>(JSON.parse(JSON.stringify(storeConfig)));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const handleToggleVisibility = (e: CustomEvent) => {
      const { id } = e.detail;
      setGroups(prev => prev.map(group => ({
        ...group,
        items: group.items.map(item => item.id === id ? { ...item, visible: !item.visible } : item)
      })));
    };

    window.addEventListener('toggle-item-visibility', handleToggleVisibility as EventListener);
    return () => window.removeEventListener('toggle-item-visibility', handleToggleVisibility as EventListener);
  }, []);

  const findContainer = (id: string) => {
    if (groups.some(g => g.id === id)) return id;
    const group = groups.find(g => g.items.some(item => item.id === id));
    return group?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setGroups((prev) => {
      const activeGroupIndex = prev.findIndex(g => g.id === activeContainer);
      const overGroupIndex = prev.findIndex(g => g.id === overContainer);
      const activeGroup = prev[activeGroupIndex];
      const overGroup = prev[overGroupIndex];
      const activeItemIndex = activeGroup.items.findIndex(i => i.id === active.id);
      const overItemIndex = overGroup.items.findIndex(i => i.id === overId);

      let newIndex;
      if (overId === overContainer) {
        newIndex = overGroup.items.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overItemIndex >= 0 ? overItemIndex + modifier : overGroup.items.length + 1;
      }

      const newGroups = [...prev];
      newGroups[activeGroupIndex] = {
        ...activeGroup,
        items: activeGroup.items.filter(i => i.id !== active.id)
      };
      newGroups[overGroupIndex] = {
        ...overGroup,
        items: [
          ...overGroup.items.slice(0, newIndex),
          activeGroup.items[activeItemIndex],
          ...overGroup.items.slice(newIndex)
        ]
      };
      return newGroups;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over?.id as string);

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      setActiveId(null);
      return;
    }

    const activeIndex = groups.find(g => g.id === activeContainer)!.items.findIndex(i => i.id === active.id);
    const overIndex = groups.find(g => g.id === overContainer)!.items.findIndex(i => i.id === over?.id);

    if (activeIndex !== overIndex) {
      setGroups((prev) => {
        const groupIndex = prev.findIndex(g => g.id === activeContainer);
        const newGroups = [...prev];
        newGroups[groupIndex] = {
          ...newGroups[groupIndex],
          items: arrayMove(newGroups[groupIndex].items, activeIndex, overIndex)
        };
        return newGroups;
      });
    }
    setActiveId(null);
  };

  const handleSave = () => {
    updateSidebarConfig(groups);
    onClose();
  };

  const handleReset = () => {
    setGroups(JSON.parse(JSON.stringify(DEFAULT_SIDEBAR_CONFIG)));
  };

  const handleGroupNameChange = (groupId: string, newTitle: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, title: newTitle } : g));
  };

  const activeItem = activeId ? groups.flatMap(g => g.items).find(i => i.id === activeId) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-50 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Customize Primary Sidebar</h2>
            <p className="text-sm text-stone-500 mt-1">Drag and drop to reorder items. Rename groups or hide items you don't need.</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-stone-100 p-4 rounded-lg border border-stone-200">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={group.title}
                      onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                      className="text-sm font-bold text-stone-700 uppercase tracking-wider bg-transparent border-none focus:ring-0 p-0 w-full"
                      placeholder="Group Name"
                    />
                  </div>
                  
                  <SortableContext
                    id={group.id}
                    items={group.items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="min-h-[40px]">
                      {group.items.map((item) => (
                        <SortableItem key={item.id} item={item} containerId={group.id} />
                      ))}
                      {group.items.length === 0 && (
                        <div className="text-sm text-stone-400 italic p-2 text-center border-2 border-dashed border-stone-300 rounded-md">
                          Empty Group
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </div>

            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
              {activeItem ? (
                <SortableItem item={activeItem} containerId="overlay" />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="p-6 border-t border-stone-200 bg-white rounded-b-xl flex justify-between items-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
          >
            Reset to Default
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
