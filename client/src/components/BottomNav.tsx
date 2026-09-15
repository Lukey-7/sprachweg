import React from 'react';
import { Brain, Compass, Layers, Mic, Search } from 'lucide-react';

export type TabId = 'today' | 'review' | 'learn' | 'explore' | 'speak' | 'progress';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  dueCardCount: number;
}

const TABS = [
  { id: 'today' as const, label: 'Today', icon: Compass },
  { id: 'review' as const, label: 'Review', icon: Brain },
  { id: 'learn' as const, label: 'Learn', icon: Layers },
  { id: 'explore' as const, label: 'Explore', icon: Search },
  { id: 'speak' as const, label: 'Speak', icon: Mic },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, dueCardCount }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
    <div className="max-w-xl mx-auto grid grid-cols-5">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'review' ? dueCardCount : 0;

        return (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center min-h-[56px] py-2 transition-colors ${
              isActive ? 'text-emerald-400' : 'text-slate-400 active:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-3 px-1.5 bg-emerald-500 text-slate-950 font-black text-[10px] leading-4 rounded-full min-w-[18px] text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span className={`text-[11px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);
