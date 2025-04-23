import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { Play, Pause, SkipForward, RefreshCw, Check, Clock, ChevronDown } from 'lucide-react';
import { useTimerStore } from '../lib/stores/timer-store';
import { useTaskStore } from '../lib/stores/task-store';
import { useStatsStore } from '../lib/stores/stats-store';
import { cn } from '../lib/utils';
import { Task } from '../lib/types';
import type { TaskState } from '../lib/stores/task-store';

export function Timer() {
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const {
    isRunning,
    isPaused,
    timeLeft,
    currentTaskId,
    isBreak,
    start,
    pause,
    resume,
    reset,
    skip,
    finish,
    tick,
    selectTask,
    setWorkDuration,
    workDuration,
  } = useTimerStore();

  const { tasks, toggleTask, updateTask } = useTaskStore((state: TaskState) => ({
    tasks: state.tasks,
    toggleTask: state.toggleTask,
    updateTask: state.updateTask,
  }));

  const incrementPomodoros = useStatsStore(state => state.incrementPomodoros);
  const incrementFocusTime = useStatsStore(state => state.incrementFocusTime);
  
  const currentTask = useMemo(
    () => tasks.find((task: Task) => task.id === currentTaskId),
    [tasks, currentTaskId]
  );

  const formattedTimeSpent = useMemo(() => {
    if (!currentTask) return '0h 0m';
    const minutes = currentTask.time_spent;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }, [currentTask?.time_spent]);

  useEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  // Handle pomodoro completion for both tasked and untasked timer
  useEffect(() => {
    const handlePomodoroCompletion = async () => {
      if (!isBreak && timeLeft === 0 && isRunning) {
        // Increment local counter for untasked pomodoros
        if (!currentTaskId) {
          setPomodoroCount(prev => prev + 1);
        }
        // Increment global stats for both tasked and untasked pomodoros
        await incrementPomodoros();
        await incrementFocusTime(workDuration / 60);
      }
    };

    handlePomodoroCompletion();
  }, [timeLeft, isBreak, currentTaskId, isRunning, incrementPomodoros, incrementFocusTime, workDuration]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const totalSeconds = currentTask ? currentTask.duration * 60 : workDuration;
  const progress = ((isBreak ? 300 : totalSeconds) - timeLeft) / (isBreak ? 300 : totalSeconds) * 100;

  const handleComplete = () => {
    if (currentTask) {
      toggleTask(currentTask.id);
      updateTask(currentTask.id, {
        time_spent: currentTask.time_spent + (totalSeconds - timeLeft),
        completed: true,
      });
      finish();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 md:space-y-12 mt-8 md:mt-12">
      <div 
        className={cn(
          "relative w-[16rem] h-[16rem] md:w-[22rem] md:h-[22rem] rounded-full transition-all duration-1000",
          "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800",
          "shadow-[20px_20px_60px_rgba(148,163,184,0.5),-20px_-20px_60px_rgba(255,255,255,0.8)] dark:shadow-[20px_20px_40px_#0f0f0f,-20px_-20px_40px_#252525]",
          isRunning && !isPaused && "animate-[breathe_8s_ease-in-out_infinite]"
        )}
      >
        {/* Progress ring */}
        <div 
          className={cn(
            "absolute inset-4 rounded-full",
            "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800",
            "shadow-[inset_6px_6px_12px_rgba(148,163,184,0.4),inset_-6px_-6px_12px_rgba(255,255,255,0.8)] dark:shadow-[inset_15px_15px_30px_#0f0f0f,inset_-15px_-15px_30px_#252525]"
          )}
        >
          <div
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, ${
                isBreak ? 'rgba(34, 197, 94, 0.95)' : 'rgba(138, 46, 51, 0.9)'
              } ${progress}%, ${
                isBreak ? 'rgba(34, 197, 94, 0.05)' : 'rgba(138, 46, 51, 0.05)'
              } ${progress}%)`,
            }}
          />
        </div>

        {/* Inner circle */}
        <div 
          className={cn(
            "absolute inset-8 rounded-full transition-all duration-1000",
            "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800",
            "shadow-[inset_8px_8px_16px_rgba(148,163,184,0.4),inset_-8px_-8px_16px_rgba(255,255,255,0.8)] dark:shadow-[inset_15px_15px_30px_#0f0f0f,inset_-15px_-15px_30px_#252525]",
            isRunning && !isPaused && "animate-[glow_4s_ease-in-out_infinite]"
          )}
        />

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-mono font-bold text-slate-800 dark:text-slate-300 tracking-tight mb-2">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            {isBreak ? 'Break Time' : currentTask?.title || 'Focus Time'}
          </span>
          {currentTask?.time_spent && currentTask.time_spent > 0 ? (
            <span className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Time spent: {formattedTimeSpent}
            </span>
          ) : (!currentTaskId && pomodoroCount > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Pomodoros completed: {pomodoroCount}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4 md:space-x-8">
        {!isRunning ? (
          <div className="flex flex-col items-center gap-4 md:gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative w-full md:w-64">
                <select
                  className="w-full appearance-none px-3 md:px-4 py-2 md:py-3 pr-10 text-base md:text-lg rounded-xl bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-300 transition-all duration-300"
                  style={{
                    boxShadow: 'var(--select-shadow)',
                    '--select-shadow': 'inset 2px 2px 5px rgba(148, 163, 184, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',
                    '.dark &': {
                      '--select-shadow': 'inset 5px 5px 10px #0f0f0f, inset -5px -5px 10px #252525',
                    },
                  } as CSSProperties}
                  value={currentTaskId || ''}
                  onChange={(e) => selectTask(e.target.value)}
                >
                  <option value="" className="text-slate-900 dark:text-slate-100">No task (standalone timer)</option>
                  {tasks
                    .filter((task: Task) => !task.completed)
                    .map((task: Task) => (
                      <option key={task.id} value={task.id} className="text-slate-900 dark:text-slate-100">
                        {task.title} ({task.duration} min)
                      </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              {!currentTaskId && (
                <div className="flex items-center gap-2">
                  <Clock className="text-slate-400 dark:text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    value={Math.floor(workDuration / 60)}
                    onChange={(e) => setWorkDuration(parseInt(e.target.value))}
                    className="w-16 md:w-20 px-2 md:px-3 py-2 text-base md:text-lg rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300"
                    style={{
                      boxShadow: 'inset 2px 2px 5px var(--input-shadow-1), inset -2px -2px 5px var(--input-shadow-2)',
                      '--input-shadow-1': 'rgba(148, 163, 184, 0.4)',
                      '--input-shadow-2': 'rgba(255, 255, 255, 0.8)',
                      '.dark &': {
                        '--input-shadow-1': 'rgba(0, 0, 0, 0.4)',
                        '--input-shadow-2': 'rgba(30, 41, 59, 0.4)',
                      },
                    } as CSSProperties}
                  />
                  <span className="text-slate-500 dark:text-slate-400">min</span>
                </div>
              )}
            </div>
            <button
              onClick={start}
              className="px-8 py-3 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(159, 53, 58, 0.9), rgba(138, 46, 51, 0.9))',
                boxShadow: '3px 3px 6px var(--btn-shadow-1), -3px -3px 6px var(--btn-shadow-2)',
                '--btn-shadow-1': 'rgba(148, 163, 184, 0.4)',
                '--btn-shadow-2': 'rgba(255, 255, 255, 0.8)',
                '.dark &': {
                  '--btn-shadow-1': 'rgba(0, 0, 0, 0.4)',
                  '--btn-shadow-2': 'rgba(30, 41, 59, 0.4)',
                },
              } as CSSProperties}
            >
              Start Timer
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 md:gap-8">
            <button
              onClick={isPaused ? resume : pause}
              className="p-6 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, rgba(159, 53, 58, 0.9), rgba(138, 46, 51, 0.9))',
                boxShadow: '3px 3px 6px var(--btn-shadow-1), -3px -3px 6px var(--btn-shadow-2)',
                '--btn-shadow-1': 'rgba(148, 163, 184, 0.4)',
                '--btn-shadow-2': 'rgba(255, 255, 255, 0.8)',
                '.dark &': {
                  '--btn-shadow-1': 'rgba(0, 0, 0, 0.4)',
                  '--btn-shadow-2': 'rgba(30, 41, 59, 0.4)',
                },
              } as CSSProperties}
            >
              {isPaused ? (
                <Play className="w-8 h-8" />
              ) : (
                <Pause className="w-8 h-8" />
              )}
            </button>
            <button
              onClick={skip}
              className={cn(
                "p-6 rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
                "text-slate-600 dark:text-slate-300",
                "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900",
                "shadow-[3px_3px_6px_rgba(148,163,184,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(30,41,59,0.4)]"
              )}
            >
              <SkipForward className="w-8 h-8" />
            </button>
            <button
              onClick={reset}
              className={cn(
                "p-6 rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
                "text-slate-600 dark:text-slate-300",
                "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-900",
                "shadow-[3px_3px_6px_rgba(148,163,184,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(30,41,59,0.4)]"
              )}
            >
              <RefreshCw className="w-8 h-8" />
            </button>
            {currentTaskId && (
              <button
                onClick={handleComplete}
                className="p-6 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, rgba(15, 76, 58, 0.9), rgba(13, 64, 51, 0.9))',
                  boxShadow: '3px 3px 6px var(--btn-shadow-1), -3px -3px 6px var(--btn-shadow-2)',
                  '--btn-shadow-1': 'rgba(148, 163, 184, 0.4)',
                  '--btn-shadow-2': 'rgba(255, 255, 255, 0.8)',
                  '.dark &': {
                    '--btn-shadow-1': 'rgba(0, 0, 0, 0.4)',
                    '--btn-shadow-2': 'rgba(30, 41, 59, 0.4)',
                  },
                } as CSSProperties}
              >
                <Check className="w-8 h-8" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}