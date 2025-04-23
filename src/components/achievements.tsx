import { Trophy, Timer, Brain, CheckCircle2, Target, Zap, Star, Award } from 'lucide-react';
import { useStatsStore } from '../lib/stores/stats-store';
import { useTaskStore } from '../lib/stores/task-store';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { Stats, Folder, Task } from '../lib/types';

export interface AchievementLevel {
  reward: string;
  type: 'bronze' | 'silver' | 'gold';
  minutes?: number;
  count?: number;
  days?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  levels: AchievementLevel[];
  getValue: (stats: Stats, folders: Folder[], tasks: Task[]) => number;
}

const medalColors = {
  bronze: {
    from: '#CD7F32',
    to: '#8B4513',
    shadow: '#A0522D'
  },
  silver: {
    from: '#C0C0C0',
    to: '#808080',
    shadow: '#A9A9A9'
  },
  gold: {
    from: '#FFD700',
    to: '#DAA520',
    shadow: '#B8860B'
  }
};

const achievements: Achievement[] = [
  {
    id: 'focus-master',
    title: 'Focus Master',
    description: 'Master the art of deep focus',
    icon: Brain,
    levels: [
      { minutes: 600, reward: 'Bronze Focus Master', type: 'bronze' },
      { minutes: 1800, reward: 'Silver Focus Master', type: 'silver' },
      { minutes: 3600, reward: 'Gold Focus Master', type: 'gold' }
    ],
    getValue: (stats) => stats.focusTime,
  },
  {
    id: 'task-champion',
    title: 'Task Champion',
    description: 'Complete tasks like a champion',
    icon: CheckCircle2,
    levels: [
      { count: 10, reward: 'Bronze Task Champion', type: 'bronze' },
      { count: 50, reward: 'Silver Task Champion', type: 'silver' },
      { count: 100, reward: 'Gold Task Champion', type: 'gold' }
    ],
    getValue: (stats) => stats.completedTasks,
  },
  {
    id: 'pomodoro-master',
    title: 'Pomodoro Master',
    description: 'Master the Pomodoro technique',
    icon: Timer,
    levels: [
      { count: 25, reward: 'Bronze Pomodoro Master', type: 'bronze' },
      { count: 100, reward: 'Silver Pomodoro Master', type: 'silver' },
      { count: 250, reward: 'Gold Pomodoro Master', type: 'gold' }
    ],
    getValue: (stats) => stats.totalPomodoros,
  },
  {
    id: 'consistency-king',
    title: 'Consistency King',
    description: 'Rule with consistent daily practice',
    icon: Zap,
    levels: [
      { days: 7, reward: 'Weekly Warrior', type: 'bronze' },
      { days: 30, reward: 'Monthly Master', type: 'silver' },
      { days: 100, reward: 'Legendary Streak', type: 'gold' }
    ],
    getValue: (stats) => stats.currentStreak,
  },
  {
    id: 'organization-expert',
    title: 'Organization Expert',
    description: 'Master task organization',
    icon: Target,
    levels: [
      { count: 3, reward: 'Bronze Organizer', type: 'bronze' },
      { count: 5, reward: 'Silver Organizer', type: 'silver' },
      { count: 10, reward: 'Gold Organizer', type: 'gold' }
    ],
    getValue: (_stats: Stats, folders: Folder[], _tasks: Task[]) => folders.length,
  },
  {
    id: 'efficiency-expert',
    title: 'Efficiency Expert',
    description: 'Complete tasks efficiently',
    icon: Star,
    levels: [
      { count: 5, reward: 'Bronze Efficiency', type: 'bronze' },
      { count: 15, reward: 'Silver Efficiency', type: 'silver' },
      { count: 30, reward: 'Gold Efficiency', type: 'gold' }
    ],
    getValue: (_, __, tasks) => tasks.filter(task => task.completed && task.time_spent < task.duration * 60).length,
  }
];

const getProgress = (levels: AchievementLevel[], value: number) => {
  const currentLevel = levels.findLast((level: AchievementLevel) => {
    const threshold = level.minutes || level.count || level.days || 0;
    return value >= threshold;
  });
  
  const nextLevel = levels.find(
    level => value < (level.minutes || level.count || level.days || 0)
  );

  if (!nextLevel) {
    return { progress: 100, level: currentLevel?.reward || 'Not Started' };
  }

  const prevLevel = levels[levels.indexOf(nextLevel) - 1];
  const prevValue = prevLevel ? (prevLevel.minutes || prevLevel.count || prevLevel.days || 0) : 0;
  const nextValue = nextLevel.minutes || nextLevel.count || nextLevel.days || 0;
  const progress = ((value - prevValue) / (nextValue - prevValue)) * 100;

  return {
    progress: Math.min(100, Math.max(0, progress)),
    level: currentLevel?.reward || 'Not Started',
  };
};

const MedalIcon = ({ type, className }: { type: AchievementLevel['type']; className?: string }) => {
  const colors = medalColors[type];
  
  return (
    <div className={cn(
      "relative w-12 h-12 rounded-full transition-transform duration-300",
      className
    )}>
      <div className="absolute inset-0 rounded-full" style={{
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
      }} />
      <div className="absolute inset-2 rounded-full bg-white/10" style={{
        background: `linear-gradient(135deg, ${colors.from}88, ${colors.to}88)`,
      }} />
      <Trophy className="absolute inset-0 w-6 h-6 m-auto text-white" />
    </div>
  );
};

export function Achievements() {
  const { focusTime, completedTasks, totalPomodoros, currentStreak } = useStatsStore();
  const { folders, tasks } = useTaskStore();

  const getAchievementProgress = (achievement: Achievement) => {
    const stats = { focusTime, completedTasks, totalPomodoros, currentStreak };
    const value = achievement.getValue(stats, folders, tasks);
    const levels = achievement.levels;
    
    return getProgress(levels, value);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-8 h-8 text-[#9F353A]" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Achievements</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement) => {
          const stats = { focusTime, completedTasks, totalPomodoros, currentStreak };
          const { progress } = getAchievementProgress(achievement);
          const value = achievement.getValue(stats, folders, tasks);
          
          return (
            <div
              key={achievement.id}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <achievement.icon className="w-6 h-6 text-[#9F353A]" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  {achievement.levels.map((level) => {
                    const threshold = level.minutes || level.count || level.days || 0;
                    const isCompleted = value >= threshold;
                    
                    return (
                      <div key={level.reward} className="text-center">
                        <MedalIcon
                          type={level.type}
                          className={isCompleted ? "" : "opacity-50"}
                        />
                        <div className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {level.reward}
                        </div>
                        <div className={cn(
                          "text-xs",
                          isCompleted ? "text-[#9F353A]" : "text-gray-400 dark:text-gray-500"
                        )}>
                          {value}/{threshold}
                          {achievement.id === 'focus-master' ? ' min' : 
                           achievement.id === 'consistency-king' ? ' days' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #9F353A, #FF6B6B)'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}