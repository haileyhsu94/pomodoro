import { Brain, CheckCircle2, Timer, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { useStatsStore } from '../lib/stores/stats-store';
import { useTaskStore } from '../lib/stores/task-store';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '../lib/utils';

export function StatsGrid() {
  const stats = useStatsStore();
  const tasks = useTaskStore((state) => state.tasks);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return formatFocusTime(minutes);
  };

  const getTasksByType = (type: string) => {
    switch (type) {
      case 'Focus Time':
        return tasks
          .filter((task) => task.timeSpent > 0)
          .sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0))
          .slice(0, 5);
      case 'Completed Tasks':
        return tasks
          .filter((task) => task.completed)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      case 'Pomodoros':
        return tasks
          .filter((task) => task.pomodoros > 0)
          .sort((a, b) => b.pomodoros - a.pomodoros)
          .slice(0, 5);
      default:
        return [];
    }
  };

  const statItems = [
    { name: 'Focus Time', value: formatFocusTime(stats.focusTime), icon: Brain },
    { name: 'Completed Tasks', value: stats.completedTasks.toString(), icon: CheckCircle2 },
    { name: 'Pomodoros', value: stats.totalPomodoros.toString(), icon: Timer },
    { name: 'Current Streak', value: `${stats.currentStreak} days`, icon: Zap },
  ];

  // Prepare data for charts
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyFocusTime = last7Days.map(day => {
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear()
      );
    });

    return {
      date: format(day, 'MMM d'),
      minutes: dayTasks.reduce((acc, task) => acc + (task.timeSpent || 0) / 60, 0),
    };
  });

  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.completed).length },
    { name: 'In Progress', value: tasks.filter(t => !t.completed).length },
  ];

  const COLORS = ['#9F353A', '#525252'];

  const folderDistribution = tasks.reduce((acc, task) => {
    const folder = task.folderId ? useTaskStore.getState().folders.find(f => f.id === task.folderId)?.name || 'Other' : 'Uncategorized';
    acc[folder] = (acc[folder] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const folderData = Object.entries(folderDistribution).map(([name, count]) => ({
    name,
    tasks: count,
  }));

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statItems.map((stat) => (
          <button
            key={stat.name}
            onClick={() => setSelectedStat(selectedStat === stat.name ? null : stat.name)}
            className={cn(
              "bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border transition-all duration-200 text-left",
              selectedStat === stat.name 
                ? "border-[#9F353A] ring-1 ring-[#9F353A] transform scale-[1.02]" 
                : "border-gray-200 dark:border-gray-800 hover:border-[#9F353A]/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {stat.name}
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={cn(
                "h-6 w-6",
                selectedStat === stat.name ? "text-[#9F353A]" : "text-gray-400 dark:text-gray-500"
              )} />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Focus Time Chart */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily Focus Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyFocusTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="date" stroke="#6B7280" className="dark:stroke-gray-400" />
                <YAxis stroke="#6B7280" className="dark:stroke-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: 'var(--tooltip-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--tooltip-color)',
                    '--tooltip-bg': 'white',
                    '--tooltip-border': '1px solid #E5E7EB',
                    '--tooltip-color': '#111827',
                    '.dark &': {
                      '--tooltip-bg': '#18181B',
                      '--tooltip-border': '1px solid #27272A',
                      '--tooltip-color': '#F4F4F5',
                    },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#9F353A"
                  fill="#9F353A"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Chart */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Task Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: 'var(--tooltip-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--tooltip-color)',
                    '--tooltip-bg': 'white',
                    '--tooltip-border': '1px solid #E5E7EB',
                    '--tooltip-color': '#111827',
                    '.dark &': {
                      '--tooltip-bg': '#18181B',
                      '--tooltip-border': '1px solid #27272A',
                      '--tooltip-color': '#F4F4F5',
                    },
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Folder Distribution */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Tasks by Folder</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={folderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#6B7280" className="dark:stroke-gray-400" />
                <YAxis stroke="#6B7280" className="dark:stroke-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    border: 'var(--tooltip-border)',
                    borderRadius: '0.5rem',
                    color: 'var(--tooltip-color)',
                    '--tooltip-bg': 'white',
                    '--tooltip-border': '1px solid #E5E7EB',
                    '--tooltip-color': '#111827',
                    '.dark &': {
                      '--tooltip-bg': '#18181B',
                      '--tooltip-border': '1px solid #27272A',
                      '--tooltip-color': '#F4F4F5',
                    },
                  }}
                />
                <Bar dataKey="tasks" fill="#9F353A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {selectedStat && selectedStat !== 'Current Streak' && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {selectedStat} Details
            </h3>
            <button
              onClick={() => setSelectedStat(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {getTasksByType(selectedStat).map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedStat === 'Focus Time' && formatTimeSpent(task.timeSpent)}
                    {selectedStat === 'Pomodoros' && `${task.pomodoros} pomodoros`}
                    {selectedStat === 'Completed Tasks' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {getTasksByType(selectedStat).length === 0 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No tasks to display
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}