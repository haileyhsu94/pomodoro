import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { Play, Pause, SkipForward, RefreshCw, Check, Clock, ChevronDown } from 'lucide-react';
import { useTimerStore } from '../lib/stores/timer-store';
import { useTaskStore } from '../lib/stores/task-store';
import { useStatsStore } from '../lib/stores/stats-store';
import { cn } from '../lib/utils';
import { Task } from '../lib/types';

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

  const tasks = useTaskStore((state: { tasks: Task[] }) => state.tasks);
  const incrementPomodoros = useStatsStore(state => state.incrementPomodoros);
  const incrementFocusTime = useStatsStore(state => state.incrementFocusTime);
  
  const currentTask = useMemo(
    () => tasks.find((task) => task.id === currentTaskId),
    [tasks, currentTaskId]
  );

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

  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const totalSeconds = currentTask ? currentTask.duration * 60 : workDuration;
  const progress = ((isBreak ? 300 : totalSeconds) - timeLeft) / (isBreak ? 300 : totalSeconds) * 100;

  return (
    <div className="flex flex-col items-center justify-center space-y-12 mt-12">
      <div 
        className={cn(
          "relative w-[22rem] h-[22rem] rounded-full transition-all duration-1000",
          isRunning && !isPaused && "animate-[breathe_8s_ease-in-out_infinite]"
        )}
        style={{
          background: 'linear-gradient(145deg, var(--timer-bg-1), var(--timer-bg-2))',
          boxShadow: 'var(--timer-shadow)',
          '--timer-bg-1': 'rgb(248, 250, 252)',
          '--timer-bg-2': 'rgb(241, 245, 249)',
          '--timer-shadow': '20px 20px 60px rgba(148, 163, 184, 0.5), -20px -20px 60px rgba(255, 255, 255, 0.8)',
          '.dark &': {
            '--timer-bg-1': '#1a1a1a',
            '--timer-bg-2': '#1a1a1a',
            '--timer-shadow': '20px 20px 40px #0f0f0f, -20px -20px 40px #252525',
          },
        } as CSSProperties}
      >
        {/* Progress ring */}
        <div 
          className="absolute inset-4 rounded-full"
          style={{
            background: 'linear-gradient(145deg, var(--inner-bg-1), var(--inner-bg-2))',
            boxShadow: 'var(--inner-shadow)',
            '--inner-bg-1': 'rgb(248, 250, 252)',
            '--inner-bg-2': 'rgb(241, 245, 249)',
            '--inner-shadow': 'inset 6px 6px 12px rgba(148, 163, 184, 0.4), inset -6px -6px 12px rgba(255, 255, 255, 0.8)',
            '.dark &': {
              '--inner-bg-1': '#1a1a1a',
              '--inner-bg-2': '#1a1a1a',
              '--inner-shadow': 'inset 15px 15px 30px #0f0f0f, inset -15px -15px 30px #252525',
            },
          } as CSSProperties}
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
            isRunning && !isPaused && "animate-[glow_4s_ease-in-out_infinite]"
          )}
          style={{
            background: 'linear-gradient(145deg, var(--inner-bg-1), var(--inner-bg-2))',
            boxShadow: 'var(--inner-shadow)',
            '--inner-bg-1': 'rgb(248, 250, 252)',
            '--inner-bg-2': 'rgb(241, 245, 249)',
            '--inner-shadow': 'inset 8px 8px 16px rgba(148, 163, 184, 0.4), inset -8px -8px 16px rgba(255, 255, 255, 0.8)',
            '.dark &': {
              '--inner-bg-1': '#1a1a1a',
              '--inner-bg-2': '#1a1a1a',
              '--inner-shadow': 'inset 15px 15px 30px #0f0f0f, inset -15px -15px 30px #252525',
            },
          } as CSSProperties}
        />

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-mono font-bold text-slate-800 dark:text-slate-300 tracking-tight mb-2">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            {isBreak ? 'Break Time' : currentTask?.title || 'Focus Time'}
          </span>
          {currentTask?.timeSpent && currentTask.timeSpent > 0 ? (
            <span className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Time spent: {formatTimeSpent(currentTask.timeSpent)}
            </span>
          ) : (!currentTaskId && pomodoroCount > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Pomodoros completed: {pomodoroCount}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-8">
        {!isRunning ? (
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  className="w-64 appearance-none px-4 py-3 pr-10 text-lg rounded-xl bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-300 transition-all duration-300"
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
                    className="w-20 px-3 py-2 text-lg rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-300"
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
          <>
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
              className="p-6 text-slate-600 dark:text-slate-300 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, var(--btn-bg-1), var(--btn-bg-2))',
                boxShadow: '3px 3px 6px var(--btn-shadow-1), -3px -3px 6px var(--btn-shadow-2)',
                '--btn-bg-1': 'rgb(248, 250, 252)',
                '--btn-bg-2': 'rgb(241, 245, 249)',
                '--btn-shadow-1': 'rgba(148, 163, 184, 0.4)',
                '--btn-shadow-2': 'rgba(255, 255, 255, 0.8)',
                '.dark &': {
                  '--btn-bg-1': 'rgb(30, 41, 59)',
                  '--btn-bg-2': 'rgb(15, 23, 42)',
                  '--btn-shadow-1': 'rgba(0, 0, 0, 0.4)',
                  '--btn-shadow-2': 'rgba(30, 41, 59, 0.4)',
                },
              } as CSSProperties}
            >
              <SkipForward className="w-8 h-8" />
            </button>
            <button
              onClick={reset}
              className="p-6 text-slate-600 dark:text-slate-300 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
              style={{
                background: 'linear-gradient(145deg, var(--btn-bg-1), var(--btn-bg-2))',
                boxShadow: '3px 3px 6px var(--btn-shadow-1), -3px -3px 6px var(--btn-shadow-2)',
                '--btn-bg-1': 'rgb(248, 250, 252)',
                '--btn-bg-2': 'rgb(241, 245, 249)',
                '--btn-shadow-1': 'rgba(148, 163, 184, 0.4)',
                '--btn-shadow-2': 'rgba(255, 255, 255, 0.8)',
                '.dark &': {
                  '--btn-bg-1': 'rgb(30, 41, 59)',
                  '--btn-bg-2': 'rgb(15, 23, 42)',
                  '--btn-shadow-1': 'rgba(0, 0, 0, 0.4)',
                  '--btn-shadow-2': 'rgba(30, 41, 59, 0.4)',
                },
              } as CSSProperties}
            >
              <RefreshCw className="w-8 h-8" />
            </button>
            {currentTaskId && (
              <button
                onClick={finish}
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
          </>
        )}
      </div>
    </div>
  );
}