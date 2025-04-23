import { CheckCircle2, Timer, Zap, Clock } from 'lucide-react';
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

export function StatsGrid() {
  const stats = useStatsStore();
  const { tasks, folders } = useTaskStore();

  const statItems = [
    {
      name: 'Focus Time',
      value: `${stats.focusTime} min`,
      icon: Clock,
    },
    {
      name: 'Tasks Completed',
      value: stats.completedTasks,
      icon: CheckCircle2,
    },
    {
      name: 'Total Pomodoros',
      value: stats.totalPomodoros,
      icon: Timer,
    },
    {
      name: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: Zap,
    },
  ];

  // Prepare data for charts
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyFocusTime = last7Days.map(day => {
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear()
      );
    });

    return {
      date: format(day, 'MMM d'),
      minutes: dayTasks.reduce((acc, task) => acc + (task.time_spent || 0) / 60, 0),
    };
  });

  const taskStatusData = [
    { name: 'Completed', value: tasks.filter(t => t.completed).length },
    { name: 'In Progress', value: tasks.filter(t => !t.completed).length },
  ];

  const COLORS = ['#9F353A', '#525252'];

  const folderDistribution = tasks.reduce((acc, task) => {
    const folder = task.folder_id ? folders.find(f => f.id === task.folder_id)?.name || 'Other' : 'Uncategorized';
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
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800"
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
              <stat.icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
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
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    color: '#111827',
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
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    color: '#111827',
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
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    color: '#111827',
                  }}
                />
                <Bar dataKey="tasks" fill="#9F353A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}