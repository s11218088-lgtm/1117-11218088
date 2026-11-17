import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  SCHEMA_LIMITS,
  type Project,
  type ProjectInput,
  type ProjectStatus,
  type TaskInput,
  type TaskItem,
  type TaskStatus,
  type WorkEntry,
  type WorkInput,
} from '../types/workspace';

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

interface ProjectModalProps {
  open: boolean;
  initialProject?: Project | null;
  onClose: () => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
}

export function ProjectModal({ open, initialProject, onClose, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialProject?.name ?? '');
      setClientName(initialProject?.clientName ?? '');
      setStatus(initialProject?.status ?? 'in_progress');
      setDueDate(initialProject?.dueDate ?? getTodayDateString());
      setNotes(initialProject?.notes ?? '');
      setError(null);
    }
  }, [open, initialProject]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('請輸入專案名稱');
      return;
    }
    if (!clientName.trim()) {
      setError('請輸入客戶名稱');
      return;
    }
    if (!SCHEMA_LIMITS.DATE_PATTERN.test(dueDate)) {
      setError('請選擇有效的截止日期');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        clientName: clientName.trim(),
        status,
        dueDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 id="project-modal-title" className="font-display text-base font-semibold text-slate-900">
            {initialProject ? '編輯專案' : '新增專案'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-700">
              專案名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              maxLength={SCHEMA_LIMITS.PROJECT_NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：品牌官網設計與前端開發"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="project-client" className="block text-sm font-medium text-slate-700">
                客戶名稱 <span className="text-red-500">*</span>
              </label>
              <input
                id="project-client"
                type="text"
                value={clientName}
                maxLength={SCHEMA_LIMITS.CLIENT_NAME_MAX}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="例如：晨曦生活選物"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="project-due" className="block text-sm font-medium text-slate-700">
                截止日期 <span className="text-red-500">*</span>
              </label>
              <input
                id="project-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-status" className="block text-sm font-medium text-slate-700">
              專案狀態
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            >
              <option value="in_progress">進行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project-notes" className="block text-sm font-medium text-slate-700">
              專案備註
            </label>
            <textarea
              id="project-notes"
              rows={3}
              value={notes}
              maxLength={SCHEMA_LIMITS.PROJECT_NOTES_MAX}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="交付範圍、里程碑或聯絡窗口備忘..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? '儲存中...' : initialProject ? '儲存變更' : '建立專案'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface TaskModalProps {
  open: boolean;
  initialTask?: TaskItem | null;
  projectNames: string[];
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}

export function TaskModal({
  open,
  initialTask,
  projectNames,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTask?.title ?? '');
      setProjectName(initialTask?.projectName ?? '');
      setStatus(initialTask?.status ?? 'todo');
      setDueDate(initialTask?.dueDate ?? getTodayDateString());
      setError(null);
    }
  }, [open, initialTask]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('請輸入任務標題');
      return;
    }
    if (!SCHEMA_LIMITS.DATE_PATTERN.test(dueDate)) {
      setError('請選擇有效的到期日');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        projectName: projectName.trim(),
        status,
        dueDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 id="task-modal-title" className="font-display text-base font-semibold text-slate-900">
            {initialTask ? '編輯任務' : '新增任務'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700">
              任務標題 <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              maxLength={SCHEMA_LIMITS.TASK_TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：交付首頁響應式切版原型"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="task-project" className="block text-sm font-medium text-slate-700">
              所屬專案（選填）
            </label>
            <input
              id="task-project"
              type="text"
              list="existing-project-options"
              value={projectName}
              maxLength={SCHEMA_LIMITS.PROJECT_NAME_MAX}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="輸入或選擇關聯專案名稱"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
            <datalist id="existing-project-options">
              {projectNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="task-status" className="block text-sm font-medium text-slate-700">
                任務狀態
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="todo">待辦</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-due" className="block text-sm font-medium text-slate-700">
                到期日 <span className="text-red-500">*</span>
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? '儲存中...' : initialTask ? '儲存變更' : '建立任務'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WorkModalProps {
  open: boolean;
  initialWork?: WorkEntry | null;
  onClose: () => void;
  onSubmit: (input: WorkInput) => Promise<void>;
}

const WORK_CATEGORIES = ['UI/UX 設計', '前端開發', '後端與系統', '品牌視覺', '技術顧問', '其他工作'];

export function WorkModal({ open, initialWork, onClose, onSubmit }: WorkModalProps) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('UI/UX 設計');
  const [hours, setHours] = useState('2');
  const [workDate, setWorkDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialWork?.title ?? '');
      setClientName(initialWork?.clientName ?? '');
      setCategory(initialWork?.category || 'UI/UX 設計');
      setHours(initialWork ? String(initialWork.hours) : '2');
      setWorkDate(initialWork?.workDate ?? getTodayDateString());
      setNotes(initialWork?.notes ?? '');
      setError(null);
    }
  }, [open, initialWork]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('請輸入工作項目名稱');
      return;
    }
    if (!clientName.trim()) {
      setError('請輸入客戶名稱');
      return;
    }
    const parsedHours = Number(hours);
    if (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > SCHEMA_LIMITS.WORK_HOURS_MAX) {
      setError('請輸入有效的工作時數（0–1000）');
      return;
    }
    if (!SCHEMA_LIMITS.DATE_PATTERN.test(workDate)) {
      setError('請選擇有效的工作日期');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        clientName: clientName.trim(),
        category: category.trim(),
        hours: parsedHours,
        workDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 id="work-modal-title" className="font-display text-base font-semibold text-slate-900">
            {initialWork ? '編輯工作紀錄' : '新增工作'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="work-title" className="block text-sm font-medium text-slate-700">
              工作項目 <span className="text-red-500">*</span>
            </label>
            <input
              id="work-title"
              type="text"
              value={title}
              maxLength={SCHEMA_LIMITS.WORK_TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：客戶品牌設計提案與原型調整"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="work-client" className="block text-sm font-medium text-slate-700">
                合作客戶 <span className="text-red-500">*</span>
              </label>
              <input
                id="work-client"
                type="text"
                value={clientName}
                maxLength={SCHEMA_LIMITS.CLIENT_NAME_MAX}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="例如：雲端數據科技"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="work-category" className="block text-sm font-medium text-slate-700">
                工作類別
              </label>
              <select
                id="work-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              >
                {WORK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="work-hours" className="block text-sm font-medium text-slate-700">
                投入工時（小時）
              </label>
              <input
                id="work-hours"
                type="number"
                step="0.5"
                min="0"
                max={SCHEMA_LIMITS.WORK_HOURS_MAX}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="work-date" className="block text-sm font-medium text-slate-700">
                工作日期 <span className="text-red-500">*</span>
              </label>
              <input
                id="work-date"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="work-notes" className="block text-sm font-medium text-slate-700">
              工作摘要備註
            </label>
            <textarea
              id="work-notes"
              rows={2}
              value={notes}
              maxLength={SCHEMA_LIMITS.WORK_NOTES_MAX}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="記錄交付進度或會議重點..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? '儲存中...' : initialWork ? '儲存變更' : '新增工作'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
