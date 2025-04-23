import { getGreeting } from './lib/utils';
import { MobileNav } from './components/mobile-nav';
import { Sidebar } from './components/sidebar';
import { StatsGrid } from './components/stats-grid';
import { TaskList } from './components/task-list';
import { Timer } from './components/timer';
import { Achievements } from './components/achievements';
import { AuthForm } from './components/auth-form';
import { useAuthStore } from './lib/stores/auth-store';
import { useTaskStore } from './lib/stores/task-store';
import { useThemeStore } from './lib/stores/theme-store';
import { useEffect } from 'react';

export default function App() {
  const { user, loading } = useAuthStore();
  const { activeTab, setActiveTab } = useTaskStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <AuthForm />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {getGreeting()}, {user.user_metadata?.full_name || 'there'}!
            </h1>
            <div className="mt-6">
              <StatsGrid />
            </div>
          </>
        );
      case 'tasks':
        return <TaskList />;
      case 'timer':
        return <Timer />;
      case 'achievements':
        return <Achievements />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} showProfile={true} />
      <div className="md:pl-64">
        <main className="max-w-4xl mx-auto px-4 pb-20 md:pb-8">
          <div className="py-6">{renderContent()}</div>
        </main>
      </div>
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} showProfile={true} />
    </div>
  );
}