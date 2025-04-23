import { create } from 'zustand';
import { useStatsStore } from './stats-store';
import { useTaskStore } from './task-store';

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  currentTaskId: string | null;
  workDuration: number;
  breakDuration: number;
  isBreak: boolean;
  selectTask: (taskId: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  finish: () => void;
  tick: () => void;
  setWorkDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
}

const DEFAULT_WORK_DURATION = 25 * 60; // 25 minutes in seconds
const DEFAULT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  timeLeft: DEFAULT_WORK_DURATION,
  currentTaskId: null,
  workDuration: DEFAULT_WORK_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
  isBreak: false,

  selectTask: (taskId: string) => {
    if (!taskId) {
      set({
        currentTaskId: null,
        timeLeft: DEFAULT_WORK_DURATION,
        workDuration: DEFAULT_WORK_DURATION,
        isRunning: false,
        isPaused: false,
        isBreak: false,
      });
      return;
    }

    const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
    if (!task) return;

    const duration = task.duration * 60; // Convert minutes to seconds
    set({
      currentTaskId: taskId,
      timeLeft: duration,
      workDuration: duration,
      isRunning: false,
      isPaused: false,
      isBreak: false,
    });
  },

  start: () => {
    const { currentTaskId } = get();
    if (currentTaskId) {
      useTaskStore.getState().startTask(currentTaskId);
    }
    set({
      isRunning: true,
      isPaused: false,
      isBreak: false,
    });
  },

  pause: () => set({ isPaused: true }),
  
  resume: () => set({ isPaused: false }),

  reset: () => {
    const { currentTaskId } = get();
    if (currentTaskId) {
      useTaskStore.getState().finishTask(currentTaskId);
    }
    set({
      isRunning: false,
      isPaused: false,
      timeLeft: DEFAULT_WORK_DURATION,
      workDuration: DEFAULT_WORK_DURATION,
      currentTaskId: null,
      isBreak: false,
    });
  },

  finish: () => {
    const { currentTaskId, timeLeft } = get();
    if (currentTaskId) {
      useTaskStore.getState().finishTask(currentTaskId);
      set({
        isRunning: false,
        isPaused: false,
        timeLeft: DEFAULT_WORK_DURATION,
        workDuration: DEFAULT_WORK_DURATION,
        currentTaskId: null,
        isBreak: false,
      });
    }
  },

  skip: () => {
    const { isBreak, workDuration, breakDuration, currentTaskId } = get();
    if (isBreak) {
      set({
        isBreak: false,
        timeLeft: workDuration,
      });
    } else {
      if (currentTaskId) {
        useTaskStore.getState().finishTask(currentTaskId);
        useTaskStore.getState().incrementPomodoro(currentTaskId);
      }
      set({
        isBreak: true,
        timeLeft: breakDuration,
      });
    }
  },

  tick: () => {
    const { timeLeft, isRunning, isPaused, currentTaskId, isBreak, workDuration, breakDuration } = get();
    if (!isRunning || isPaused || timeLeft <= 0) return;

    if (timeLeft === 1) { // Last tick
      if (!isBreak) {
        useStatsStore.getState().incrementFocusTime(workDuration / 60);
        useStatsStore.getState().incrementPomodoros();
        if (currentTaskId) {
          useTaskStore.getState().incrementPomodoro(currentTaskId);
          useTaskStore.getState().updateTimeSpent(currentTaskId, workDuration);
        }
        set({
          isBreak: true,
          timeLeft: breakDuration,
        });
      } else {
        set({
          isBreak: false,
          timeLeft: workDuration,
        });
      }
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  setWorkDuration: (minutes: number) => {
    const seconds = minutes * 60;
    set({ 
      workDuration: seconds,
      timeLeft: seconds,
    });
  },

  setBreakDuration: (minutes: number) =>
    set({ breakDuration: minutes * 60 }),
}));