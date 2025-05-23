import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronRight, Calendar, Edit2, Copy, Settings, Clock, Timer } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore } from '../lib/stores/task-store';
import { useAuthStore } from '../lib/stores/auth-store';
import { useTimerStore } from '../lib/stores/timer-store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Task } from '../lib/types';

const defaultColors = [
  '#9F353A', // Primary color
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9B786F', // Brown
  '#A8E6CF', // Mint
  '#DCEDC1', // Light Green
  '#FFD3B6', // Peach
];

interface FormData {
  title: string;
  estimated_pomodoros: number;
  duration: number;
  scheduled_for?: Date;
  folder_id?: string;
  reminder_enabled: boolean;
  reminder_time?: number;
}

export function TaskList() {
  const { tasks = [], folders = [], addTask, toggleTask, removeTask, addFolder, removeFolder, updateFolder, updateTask, setActiveTab } = useTaskStore();
  const { user } = useAuthStore();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(defaultColors[0]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['uncategorized']));
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentTaskId = useTimerStore((state) => state.currentTaskId);
  const isRunning = useTimerStore((state) => state.isRunning);

  // Define getFolderTasks function
  const getFolderTasks = (folderId: string) => {
    return tasks.filter(task => task.folder_id === folderId);
  };

  // Define uncategorizedTasks
  const uncategorizedTasks = tasks.filter(task => !task.folder_id);

  const handleSubmit = (formData: FormData) => {
    addTask(
      formData.title,
      formData.estimated_pomodoros,
      formData.duration,
      formData.scheduled_for,
      formData.folder_id,
      formData.reminder_enabled,
      formData.reminder_time
    );
    setShowTaskForm(false);
    toast.success('Task added successfully!');
  };

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setNewFolderColor(defaultColors[0]);
      setShowNewFolder(false);
      toast.success('Folder added successfully!');
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    removeFolder(folderId);
    toast.success('Folder deleted successfully!');
  };

  const handleUpdateFolder = (folderId: string, name: string, color: string) => {
    updateFolder(folderId, name, color);
    setEditingFolder(null);
    toast.success('Folder updated successfully!');
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="text-sm px-4 py-2 bg-[#9F353A] text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            {showTaskForm ? 'Cancel' : 'Add Task'}
          </button>
          <button
            onClick={() => setShowNewFolder(true)}
            className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            New Folder
          </button>
        </div>
      </div>

      {showNewFolder && (
        <form onSubmit={handleAddFolder} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: newFolderColor }}
                />
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#9F353A] text-white rounded-md hover:bg-opacity-90"
              >
                Add
              </button>
            </div>
            
            {showColorPicker && (
              <div className="grid grid-cols-5 gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setNewFolderColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newFolderColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                    } hover:scale-110 transition-transform`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </form>
      )}

      {showTaskForm && (
        <TaskForm
          onSubmit={handleSubmit}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      <div className="space-y-4">
        {folders.map((folder) => {
          const folderTasks = getFolderTasks(folder.id);
          return (
            <div
              key={folder.id}
              className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
            >
              <div className="px-4 py-3 flex items-center justify-between">
                {editingFolder === folder.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue={folder.name}
                      onBlur={(e) => handleUpdateFolder(folder.id, e.target.value, folder.color)}
                      className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
                      autoFocus
                    />
                    <div className="relative">
                      <input
                        type="color"
                        defaultValue={folder.color}
                        onChange={(e) => handleUpdateFolder(folder.id, folder.name, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-2 flex-1"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                      {folder.name}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({folderTasks.length})
                    </span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingFolder(folder.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-[#9F353A]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
              </div>
              {expandedFolders.has(folder.id) && folderTasks.length > 0 && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {folderTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onRemove={removeTask}
                      onUpdate={updateTask}
                      isSelected={task.id === currentTaskId}
                      isTimerRunning={isRunning}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {uncategorizedTasks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleFolder('uncategorized')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Uncategorized
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({uncategorizedTasks.length})
                </span>
              </div>
              {expandedFolders.has('uncategorized') ? (
                <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
            {expandedFolders.has('uncategorized') && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {uncategorizedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onRemove={removeTask}
                    onUpdate={updateTask}
                    isSelected={task.id === currentTaskId}
                    isTimerRunning={isRunning}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  isSelected: boolean;
  isTimerRunning: boolean;
}

function TaskItem({ task, onToggle, onRemove, onUpdate, isSelected, isTimerRunning }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [scheduledFor, setScheduledFor] = useState(
    task.scheduled_for ? format(new Date(task.scheduled_for), "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task.estimated_pomodoros);
  const [duration, setDuration] = useState(task.duration);
  const [selectedFolderId, setSelectedFolderId] = useState(task.folder_id || '');
  const folders = useTaskStore((state) => state.folders);
  const selectTask = useTimerStore((state) => state.selectTask);
  const setActiveTab = useTaskStore((state) => state.setActiveTab);

  const handleTaskClick = () => {
    if (!task.completed) {
      selectTask(task.id);
      setActiveTab('timer');
    }
  };

  const handleUpdate = () => {
    onUpdate(task.id, {
      title,
      scheduled_for: scheduledFor ? scheduledFor : undefined,
      estimated_pomodoros: estimatedPomodoros,
      duration,
      folder_id: selectedFolderId || undefined,
    });
    setIsEditing(false);
    toast.success('Task updated successfully!');
  };

  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#9F353A] dark:text-white"
              autoFocus
            />
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-[#9F353A] text-white rounded-md hover:bg-opacity-90"
            >
              Save
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#9F353A] dark:text-white"
              />
            </div>

            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#9F353A] dark:text-white"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Clock className="text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value)))}
                min="1"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#9F353A] dark:text-white"
                placeholder="Duration (minutes)"
              />
            </div>

            <div className="flex items-center gap-2">
              <Timer className="text-gray-400 dark:text-gray-500" />
              <input
                type="number"
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(Math.max(1, parseInt(e.target.value)))}
                min="1"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#9F353A] dark:text-white"
                placeholder="Estimated pomodoros"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const folder = folders.find((f) => f.id === task.folder_id);

  return (
    <div
      className={cn(
        'px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        isSelected && 'bg-gray-50 dark:bg-gray-700/50'
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => onToggle(task.id)}
          className={cn(
            'p-1 rounded-full transition-colors',
            task.completed
              ? 'text-green-500 hover:text-green-600'
              : 'text-gray-400 hover:text-gray-500'
          )}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-sm font-medium text-gray-900 dark:text-white truncate',
              task.completed && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {task.scheduled_for && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(task.scheduled_for), 'MMM d, yyyy HH:mm')}
              </span>
            )}
            {folder && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: `${folder.color}20`,
                  color: folder.color,
                }}
              >
                {folder.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              {task.pomodoros}/{task.estimated_pomodoros}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTimeSpent(task.time_spent)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRemove(task.id)}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-[#9F353A]"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface TaskFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  initialValues?: Partial<Task>;
}

function TaskForm({ onSubmit, onCancel, initialValues = {} }: TaskFormProps) {
  const [title, setTitle] = useState(initialValues.title || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(initialValues.estimated_pomodoros || 1);
  const [duration, setDuration] = useState(initialValues.duration || 25);
  const [selectedDate, setSelectedDate] = useState(initialValues.scheduled_for || '');
  const [selectedFolderId, setSelectedFolderId] = useState(initialValues.folder_id || '');
  const [reminderEnabled, setReminderEnabled] = useState(initialValues.reminder_enabled || false);
  const [reminderTime, setReminderTime] = useState(initialValues.reminder_time || 15);
  const folders = useTaskStore((state) => state.folders);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({
        title: title.trim(),
        estimated_pomodoros: estimatedPomodoros,
        duration,
        scheduled_for: selectedDate ? new Date(selectedDate) : undefined,
        folder_id: selectedFolderId || undefined,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderEnabled ? reminderTime : undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#9F353A] text-white rounded-md hover:bg-opacity-90"
          >
            Add Task
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estimated Pomodoros
            </label>
            <input
              type="number"
              value={estimatedPomodoros}
              onChange={(e) => setEstimatedPomodoros(Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule For
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="datetime-local"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Folder
          </label>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
          >
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {selectedDate && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reminder"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-[#9F353A] focus:ring-[#9F353A] dark:bg-gray-700"
              />
              <label htmlFor="reminder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable reminder
              </label>
            </div>

            {reminderEnabled && (
              <div className="flex items-center gap-2 pl-6">
                <input
                  type="number"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#9F353A] dark:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">minutes before</span>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}