import { Home, ListTodo, Timer, Trophy, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../lib/stores/auth-store';
import { ProfileMenu } from './profile-menu';
import { useState } from 'react';

type Tab = 'home' | 'tasks' | 'timer' | 'achievements';

interface MobileNavProps {
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

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { user } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <>
      {showProfileMenu && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40" onClick={() => setShowProfileMenu(false)} />
      )}
      
      {showProfileMenu && (
        <div className="fixed z-50 bottom-16 left-0 right-0 px-4 pb-4">
          <ProfileMenu />
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="grid grid-cols-5 h-16 mx-auto">
          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                onTabChange(item.tab);
                setShowProfileMenu(false);
              }}
              className={cn(
                'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700',
                activeTab === item.tab && 'bg-gray-50 dark:bg-gray-700'
              )}
            >
              <item.icon className={cn(
                'w-6 h-6 mb-1',
                activeTab === item.tab ? 'text-[#9F353A]' : 'text-gray-500 dark:text-gray-400'
              )} />
              <span className={cn(
                'text-xs',
                activeTab === item.tab ? 'text-[#9F353A]' : 'text-gray-500 dark:text-gray-400'
              )}>{item.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={cn(
              'inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-700',
              showProfileMenu && 'bg-gray-50 dark:bg-gray-700'
            )}
          >
            <div className="relative">
              <User className={cn(
                'w-6 h-6 mb-1',
                showProfileMenu ? 'text-[#9F353A]' : 'text-gray-500 dark:text-gray-400'
              )} />
              {user?.user_metadata?.avatar_id && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#9F353A] rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </div>
            <span className={cn(
              'text-xs',
              showProfileMenu ? 'text-[#9F353A]' : 'text-gray-500 dark:text-gray-400'
            )}>Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}