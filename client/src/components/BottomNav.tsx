import React from 'react';
import { Compass, Search, BookOpen, Layers, Mic, BarChart3, Brain } from 'lucide-react';

export type TabId = 'today' | 'miner' | 'dictionary' | 'grammar' | 'srs' | 'voice' | 'progress';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  dueCardCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, dueCardCount }) => {
  const tabs = [
    { id: 'today' as TabId, label: 'Today', icon: Compass },
    { id: 'miner' as TabId, label: 'Miner', icon: Search },
    { id: 'dictionary' as TabId, label: 'Dictionary', icon: BookOpen },
    { id: 'grammar' as TabId, label: 'Grammar', icon: Layers },
    { id: 'srs' as TabId, label: 'FSRS Cards', icon: Brain, badge: dueCardCount },
    { id: 'voice' as TabId, label: 'Voice Studio', icon: Mic },
    { id: 'progress' as TabId, label: 'Immersion', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 safe-area-pb">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full min-w-[16px] text-center shadow">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
