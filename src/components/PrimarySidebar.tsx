import React, { useState } from 'react';
import { useStore } from '../store/stores/useStore';
import { useShallow } from 'zustand/react/shallow';
import { ChevronLeft, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { BackupManager } from './BackupManager';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SIDEBAR_ITEMS_REGISTRY, DEFAULT_SIDEBAR_CONFIG } from '../store/constants';

export function PrimarySidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (open: boolean) => void }) {
  const { 
    fullscreenMode,
    activeTab,
    setActiveTab,
    setDeadlineViewMode,
    sidebarConfig
  } = useStore(useShallow(state => ({
    fullscreenMode: state.fullscreenMode,
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    setDeadlineViewMode: state.setDeadlineViewMode,
    sidebarConfig: state.sidebarConfig || DEFAULT_SIDEBAR_CONFIG
  })));
  const [collapsed, setCollapsed] = useState(true);
  const isExpanded = !collapsed || !!mobileOpen;
  const [showBackupManager, setShowBackupManager] = useState(false);

  if (fullscreenMode) return null;

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <div className={cn(
        "h-[100dvh] bg-stone-900 text-stone-300 flex flex-col transition-all duration-300 border-r border-stone-800 z-50",
        collapsed ? "md:w-16 w-64" : "w-64",
        "fixed md:relative", // Fixed on mobile, relative on desktop
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0" // Slide in on mobile
      )}>
        <div className="pt-safe-top border-b border-stone-800 relative">
          <WorkspaceSwitcher isExpanded={isExpanded} onCloseMobile={() => setMobileOpen?.(false)} />
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-stone-800 border border-stone-700 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors hidden md:flex z-50 shadow-sm",
              !isExpanded && "rotate-180"
            )}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">
        {sidebarConfig.map((group) => {
          const visibleItems = group.items.filter(item => item.visible);
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={group.id} className="px-3">
              {isExpanded && (
                <div className="mb-2 px-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const registryItem = SIDEBAR_ITEMS_REGISTRY[item.id];
                  if (!registryItem) return null;
                  const Icon = registryItem.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        if (item.id === 'deadline') {
                          setDeadlineViewMode('local');
                        }
                        setMobileOpen?.(false);
                      }}
                      className={cn(
                        "w-full flex items-center px-2 py-2 rounded-md transition-colors",
                        activeTab === item.id
                          ? "bg-stone-800 text-emerald-400"
                          : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200",
                        !isExpanded && "justify-center"
                      )}
                      title={!isExpanded ? registryItem.label : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      {isExpanded && (
                        <span className="ml-3 text-sm font-medium truncate">
                          {registryItem.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-stone-800 space-y-4", !isExpanded && "p-2")}>
        <div className={cn("flex", !isExpanded && "flex-col")}>
          <button
            onClick={() => setShowBackupManager(true)}
            className={cn("flex items-center justify-center bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md text-xs font-medium transition-colors", isExpanded ? "flex-1 py-1.5" : "p-2 w-full")}
            title="Data & Backup Settings"
          >
            <Save size={12} className={cn(isExpanded && "mr-1.5")} />
            {isExpanded && "Sync"}
          </button>
        </div>
      </div>
    </div>
      
    {showBackupManager && (
      <BackupManager onClose={() => setShowBackupManager(false)} />
    )}
    </>
  );
}
