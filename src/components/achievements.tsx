import { Trophy, Timer, Brain, CheckCircle2, Target, Zap, Star, Award } from 'lucide-react';
import { useStatsStore } from '../lib/stores/stats-store';
import { useTaskStore } from '../lib/stores/task-store';
import { cn } from '../lib/utils';

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

const achievements = [
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
    getValue: (stats: any) => stats.focusTime,
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
    getValue: (stats: any) => stats.completedTasks,
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
    getValue: (stats: any) => stats.totalPomodoros,
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
    getValue: (stats: any) => stats.currentStreak,
  },
  {
    id: 'organization-expert',
    title: 'Organization Expert',
    description: 'Master task organization',
    icon: Target,
    levels: [
      { count: 3, reward: 'Folder Beginner', type: 'bronze' },
      { count: 5, reward: 'Folder Pro', type: 'silver' },
      { count: 10, reward: 'Folder Master', type: 'gold' }
    ],
    getValue: (_stats: any, folders: any[]) => folders.length,
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
    getValue: (_stats: any, _folders: any[], tasks: any[]) => 
      tasks.filter(t => t.completed && t.pomodoros <= t.estimatedPomodoros).length,
  }
];

function Medal({ type, isCompleted }: { type: 'bronze' | 'silver' | 'gold', isCompleted: boolean }) {
  const colors = medalColors[type];
  
  return (
    <div className={cn(
      "relative w-12 h-12 rounded-full transition-transform duration-300",
      isCompleted ? "scale-100" : "scale-90 opacity-50"
    )}>
      <div className="absolute inset-0 rounded-full" style={{
        background: isCompleted 
          ? `linear-gradient(135deg, ${colors.from}, ${colors.to})`
          : `linear-gradient(135deg, ${colors.from}40, ${colors.to}40)`,
        boxShadow: isCompleted ? `0 0 15px ${colors.shadow}` : 'none'
      }} />
      <div className="absolute inset-2 rounded-full bg-white/10" style={{
        background: isCompleted
          ? `linear-gradient(135deg, ${colors.from}88, ${colors.to}88)`
          : `linear-gradient(135deg, ${colors.from}20, ${colors.to}20)`,
      }} />
      <Trophy className={cn(
        "absolute inset-0 w-6 h-6 m-auto",
        isCompleted ? "text-white" : "text-white/30"
      )} />
    </div>
  );
}

export function Achievements() {
  const stats = useStatsStore();
  const { folders, tasks } = useTaskStore();

  const getProgress = (achievement: typeof achievements[0]) => {
    const value = achievement.getValue(stats, folders, tasks);
    const maxLevel = achievement.levels[achievement.levels.length - 1];
    const currentLevel = achievement.levels.findLast(
      level => value >= (level.count || level.minutes || level.days)
    );
    const nextLevel = achievement.levels.find(
      level => value < (level.count || level.minutes || level.days)
    );

    if (!nextLevel) {
      return { progress: 100, level: currentLevel?.reward || 'Not Started' };
    }

    const prevLevel = achievement.levels[achievement.levels.indexOf(nextLevel) - 1];
    const prevValue = prevLevel ? (prevLevel.count || prevLevel.minutes || prevLevel.days) : 0;
    const nextValue = nextLevel.count || nextLevel.minutes || nextLevel.days;
    const progress = ((value - prevValue) / (nextValue - prevValue)) * 100;

    return {
      progress: Math.min(100, Math.max(0, progress)),
      level: currentLevel?.reward || 'Not Started',
    };
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-8 h-8 text-[#9F353A]" />
        <h2 className="text-2xl font-semibold text-gray-900">Achievements</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement) => {
          const { progress } = getProgress(achievement);
          const value = achievement.getValue(stats, folders, tasks);
          
          return (
            <div
              key={achievement.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <achievement.icon className="w-6 h-6 text-[#9F353A]" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  {achievement.levels.map((level) => {
                    const threshold = level.count || level.minutes || level.days;
                    const isCompleted = value >= threshold;
                    
                    return (
                      <div key={level.reward} className="text-center">
                        <Medal
                          type={level.type as 'bronze' | 'silver' | 'gold'}
                          isCompleted={isCompleted}
                        />
                        <div className="mt-2 text-xs font-medium text-gray-600">
                          {level.reward}
                        </div>
                        <div className={cn(
                          "text-xs",
                          isCompleted ? "text-[#9F353A]" : "text-gray-400"
                        )}>
                          {value}/{threshold}
                          {achievement.id === 'focus-master' ? ' min' : 
                           achievement.id === 'consistency-king' ? ' days' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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