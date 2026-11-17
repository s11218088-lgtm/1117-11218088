import { useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { TaskItem } from '../types/workspace';

interface TasksViewProps {
  loading: boolean;
  tasks: TaskItem[];
  onAddTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onToggleStatus: (task: TaskItem) => Promise<void>;
  onDeleteTask: (task: TaskItem) => Promise<void>;
}

type TaskFilter = 'all' | 'todo' | 'completed';

export function TasksView({
  loading,
  tasks,
  onAddTask,
  onEditTask,
  onToggleStatus,
  onDeleteTask,
}: TasksViewProps) {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = tasks.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.projectName.toLowerCase().includes(q)
    );
  });

  const handleToggle = async (task: TaskItem) => {
    setBusyId(task.id);
    try {
      await onToggleStatus(task);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (task: TaskItem) => {
    setBusyId(task.id);
    try {
      await onDeleteTask(task);
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: `全部 (${tasks.length})` },
                {
                  id: 'todo',
                  label: `待辦 (${tasks.filter((t) => t.status === 'todo').length})`,
                },
                {
                  id: 'completed',
                  label: `已完成 (${tasks.filter((t) => t.status === 'completed').length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋任務標題或所屬專案..."
              aria-label="搜尋任務"
              className="pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 w-full sm:w-64"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onAddTask}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          新增任務
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-3">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">
                {tasks.length === 0 ? '目前尚無任何任務' : '找不到符合條件的任務'}
              </p>
              <p className="text-xs text-slate-500">
                {tasks.length === 0
                  ? '建立第一筆接案任務，設定到期日並即時追蹤進度。'
                  : '請嘗試調整搜尋關鍵字或狀態篩選。'}
              </p>
            </div>
            {tasks.length === 0 && (
              <button
                type="button"
                onClick={onAddTask}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新增第一個任務
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((task) => {
              const todayStr = new Date().toISOString().slice(0, 10);
              const isOverdue = task.status === 'todo' && task.dueDate < todayStr;
              return (
                <li
                  key={task.id}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      disabled={busyId === task.id}
                      onChange={() => handleToggle(task)}
                      aria-label={`切換任務狀態 ${task.title}`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium break-words ${
                          task.status === 'completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{task.projectName || '獨立任務'}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            task.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {task.status === 'completed' ? '已完成' : '待辦'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-mono tabular-nums ${
                            isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                          }`}
                        >
                          到期日 {task.dueDate}
                          {isOverdue ? '（已逾期）' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 shrink-0">
                    {confirmDeleteId === task.id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === task.id}
                          onClick={() => handleDelete(task)}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors cursor-pointer"
                        >
                          確認刪除
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          aria-label={`修改 ${task.title}`}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(task.id)}
                          aria-label={`刪除 ${task.title}`}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
