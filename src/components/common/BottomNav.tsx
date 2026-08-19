import React from 'react';
import { Home, Utensils, Dumbbell, TrendingUp, Sparkles } from 'lucide-react';

export type TabType = 'home' | 'food' | 'workout' | 'progress' | 'aicoach';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'food' as TabType, label: 'Food', icon: Utensils },
    { id: 'workout' as TabType, label: 'Workout', icon: Dumbbell },
    { id: 'progress' as TabType, label: 'Progress', icon: TrendingUp },
    { id: 'aicoach' as TabType, label: 'AI Coach', icon: Sparkles, highlight: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 pb-safe transition-colors">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-transform ${
                  isActive ? 'scale-110' : 'scale-100'
                } ${tab.highlight && !isActive ? 'text-indigo-500 dark:text-indigo-400' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {tab.highlight && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping opacity-75" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
