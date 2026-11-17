import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  CheckSquare,
  Clock,
  FolderKanban,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Project, TaskItem, ViewTab, WorkEntry } from '../types/workspace';

interface DashboardHomeProps {
  loading: boolean;
  projects: Project[];
  tasks: TaskItem[];
  works: WorkEntry[];
  onNavigate: (tab: ViewTab) => void;
  onOpenNewProject: () => void;
  onOpenNewWork: () => void;
  onOpenNewTask: () => void;
  onToggleTaskStatus: (task: TaskItem) => Promise<void>;
  onSeedStarterData: () => Promise<void>;
  seeding: boolean;
}

function getTimestampMillis(ts: { toMillis?: () => number } | null | undefined): number {
  if (ts && typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  return 0;
}

export function DashboardHome({
  loading,
  projects,
  tasks,
  works,
  onNavigate,
  onOpenNewProject,
  onOpenNewWork,
  onOpenNewTask,
  onToggleTaskStatus,
  onSeedStarterData,
  seeding,
}: DashboardHomeProps) {
  const uniqueClients = new Set(
    [
      ...projects.map((p) => p.clientName.trim()),
      ...works.map((w) => w.clientName.trim()),
    ].filter(Boolean),
  );

  const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalWorkHours = works.reduce((acc, w) => acc + (w.hours || 0), 0);

  // Combine latest projects, tasks, and works into recent activity feed
  const recentActivities = [
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      kind: '專案' as const,
      title: p.name,
      subtitle: `${p.clientName} · 截止 ${p.dueDate}`,
      statusText: p.status === 'completed' ? '已完成' : '進行中',
      isDone: p.status === 'completed',
      sortTime: getTimestampMillis(p.updatedAt) || getTimestampMillis(p.createdAt),
      targetTab: 'projects' as ViewTab,
      taskRef: null as TaskItem | null,
    })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      kind: '任務' as const,
      title: t.title,
      subtitle: `${t.projectName || '一般任務'} · 到期 ${t.dueDate}`,
      statusText: t.status === 'completed' ? '已完成' : '待辦',
      isDone: t.status === 'completed',
      sortTime: getTimestampMillis(t.updatedAt) || getTimestampMillis(t.createdAt),
      targetTab: 'tasks' as ViewTab,
      taskRef: t,
    })),
    ...works.map((w) => ({
      id: `work-${w.id}`,
      kind: '工作' as const,
      title: w.title,
      subtitle: `${w.clientName} · ${w.category} · ${w.hours} 小時`,
      statusText: w.workDate,
      isDone: true,
      sortTime: getTimestampMillis(w.updatedAt) || getTimestampMillis(w.createdAt),
      targetTab: 'works' as ViewTab,
      taskRef: null as TaskItem | null,
    })),
  ]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 8);

  const upcomingTasks = tasks
    .filter((t) => t.status === 'todo')
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const isWorkspaceEmpty =
    !loading && projects.length === 0 && tasks.length === 0 && works.length === 0;

  return (
    <div className="space-y-8">
      {/* 關鍵資訊卡片 (KPI Grid) */}
      <section aria-label="關鍵數據指標">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">專案數</span>
              <FolderKanban className="w-5 h-5 text-slate-400 group-hover:text-blue-700 transition-colors" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              {loading ? (
                <div className="h-9 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                  {projects.length}
                </span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>進行中 {inProgressProjects}</span>
              <span aria-hidden="true">·</span>
              <span>已完成 {completedProjects}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('works')}
            className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">客戶數</span>
              <Users className="w-5 h-5 text-slate-400 group-hover:text-blue-700 transition-colors" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              {loading ? (
                <div className="h-9 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                  {uniqueClients.size}
                </span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>工作紀錄 {works.length} 筆</span>
              <span aria-hidden="true">·</span>
              <span>累計 {totalWorkHours} 小時</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-6 transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">任務數</span>
              <CheckSquare className="w-5 h-5 text-slate-400 group-hover:text-blue-700 transition-colors" />
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              {loading ? (
                <div className="h-9 w-16 bg-slate-100 rounded animate-pulse" />
              ) : (
                <span className="font-display text-3xl font-bold text-slate-900 tabular-nums">
                  {tasks.length}
                </span>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span>待辦 {todoTasks}</span>
              <span aria-hidden="true">·</span>
              <span>已完成 {completedTasks}</span>
            </div>
          </button>
        </div>
      </section>

      {/* 快速操作區 */}
      <section
        aria-label="快速操作區"
        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">快速操作</h2>
          <p className="text-xs text-slate-500 mt-1">
            立即建立新專案、記錄工作時數或安排待辦任務
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            新增專案
          </button>
          <button
            type="button"
            onClick={onOpenNewWork}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            新增工作
          </button>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-slate-500" />
            新增任務
          </button>
        </div>
      </section>

      {isWorkspaceEmpty && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-slate-900">
              歡迎來到接案工作台
            </h3>
            <p className="text-sm text-slate-600">
              您的雲端工作區目前尚未建立任何紀錄，您可以立即新增第一筆資料，或匯入一組範例接案資料體驗操作流程。
            </p>
          </div>
          <button
            type="button"
            onClick={onSeedStarterData}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? '匯入範例中...' : '匯入範例接案資料'}
          </button>
        </section>
      )}

      {/* 最近活動與近期待辦雙欄 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 最近活動區塊 */}
        <section
          aria-label="最近活動"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">最近活動</h2>
              <p className="text-xs text-slate-500 mt-0.5">顯示最新的專案、任務與工作動態</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              檢視全部任務
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">尚無最近活動</p>
              <p className="text-xs text-slate-500">
                點擊上方「新增專案」、「新增工作」或「新增任務」開始記錄您的接案進度。
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentActivities.map((item) => (
                <li
                  key={item.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    {item.taskRef ? (
                      <button
                        type="button"
                        onClick={() => onToggleTaskStatus(item.taskRef!)}
                        aria-label={item.isDone ? '標記為待辦' : '標記為已完成'}
                        className="mt-0.5 text-slate-400 hover:text-blue-700 transition-colors shrink-0 cursor-pointer"
                      >
                        {item.isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600" />
                        )}
                      </button>
                    ) : (
                      <span className="mt-0.5 shrink-0 text-slate-400">
                        {item.kind === '專案' ? (
                          <FolderKanban className="w-4 h-4" />
                        ) : (
                          <Briefcase className="w-4 h-4" />
                        )}
                      </span>
                    )}
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onNavigate(item.targetTab)}
                        className={`text-sm font-medium text-left truncate block max-w-full hover:text-blue-700 transition-colors cursor-pointer ${
                          item.isDone && item.kind === '任務'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </button>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 truncate">
                        <span>{item.kind}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium whitespace-nowrap shrink-0 tabular-nums ${
                      item.statusText === '已完成'
                        ? 'text-emerald-700'
                        : item.statusText === '進行中'
                          ? 'text-blue-700'
                          : item.statusText === '待辦'
                            ? 'text-amber-700'
                            : 'text-slate-500 font-mono'
                    }`}
                  >
                    {item.statusText}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 即將到期任務 */}
        <section
          aria-label="即將到期任務"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">待辦任務排程</h2>
              <p className="text-xs text-slate-500 mt-0.5">依到期日優先排序</p>
            </div>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              + 新增任務
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700">目前沒有待辦任務</p>
              <p className="text-xs text-slate-500">所有排定任務皆已完成，或尚未建立新任務。</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingTasks.map((task) => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const isOverdue = task.dueDate < todayStr;
                return (
                  <li
                    key={task.id}
                    className="px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() => onToggleTaskStatus(task)}
                        aria-label={`完成任務 ${task.title}`}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {task.projectName || '獨立任務'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono tabular-nums whitespace-nowrap shrink-0 ${
                        isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {isOverdue ? `已逾期 · ${task.dueDate}` : task.dueDate}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
