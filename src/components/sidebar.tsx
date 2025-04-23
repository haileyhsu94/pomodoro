import { Home, ListTodo, Timer, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProfileMenu } from './profile-menu';

type Tab = 'home' | 'tasks' | 'timer' | 'achievements';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  showProfile: boolean;
}

const navigation = [
  { name: 'Home', icon: Home, tab: 'home' as const },
  { name: 'Tasks', icon: ListTodo, tab: 'tasks' as const },
  { name: 'Timer', icon: Timer, tab: 'timer' as const },
  { name: 'Achievements', icon: Trophy, tab: 'achievements' as const },
];

export function Sidebar({ activeTab, onTabChange, showProfile }: SidebarProps) {
  return (
    <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center flex-shrink-0 px-4">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#9F353A] to-rose-600">
            Pomodoro
          </span>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Focus Timer</span>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => onTabChange(item.tab)}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full transition-colors',
                  activeTab === item.tab
                    ? 'bg-[#9F353A]/10 text-[#9F353A] dark:bg-[#9F353A]/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-6 w-6',
                    activeTab === item.tab
                      ? 'text-[#9F353A]'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </button>
            ))}
          </nav>
          <div className="px-2 pb-4 mt-auto">
            <ProfileMenu />
          </div>
        </div>
      </div>
    </div>
  );
}