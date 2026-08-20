import React from 'react';
import { Home, Utensils, Dumbbell, TrendingUp, Sparkles, User } from 'lucide-react';

export type TabType = 'dashboard' | 'food' | 'workout' | 'coach' | 'progress' | 'profile';

interface BottomNavProps {
  activeTab?: TabType | string;
  currentTab?: TabType | string;
  onTabChange?: (tab: TabType) => void;
  onChangeTab?: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  currentTab,
  onTabChange,
  onChangeTab,
}) => {
  const current = (activeTab || currentTab || 'dashboard') as TabType;
  const handleSelect = (tab: TabType) => {
    if (onTabChange) onTabChange(tab);
    if (onChangeTab) onChangeTab(tab);
  };

  const tabs: Array<{ id: TabType; label: string; icon: any; highlight?: boolean }> = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'food', label: 'Food', icon: Utensils },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'coach', label: 'AI Coach', icon: Sparkles, highlight: true },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 pb-safe transition-colors">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = current === tab.id || (tab.id === 'dashboard' && current === ('home' as any)) || (tab.id === 'coach' && current === ('aicoach' as any));

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => handleSelect(tab.id)}
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
