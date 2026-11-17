import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import type { Project } from '../types/workspace';

interface ProjectsViewProps {
  loading: boolean;
  projects: Project[];
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onToggleStatus: (project: Project) => Promise<void>;
  onDeleteProject: (project: Project) => Promise<void>;
}

type ProjectFilter = 'all' | 'in_progress' | 'completed';

export function ProjectsView({
  loading,
  projects,
  onAddProject,
  onEditProject,
  onToggleStatus,
  onDeleteProject,
}: ProjectsViewProps) {
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.notes.toLowerCase().includes(q)
    );
  });

  const handleToggle = async (project: Project) => {
    setBusyId(project.id);
    try {
      await onToggleStatus(project);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (project: Project) => {
    setBusyId(project.id);
    try {
      await onDeleteProject(project);
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive segmented filter */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'all', label: `全部 (${projects.length})` },
                {
                  id: 'in_progress',
                  label: `進行中 (${projects.filter((p) => p.status === 'in_progress').length})`,
                },
                {
                  id: 'completed',
                  label: `已完成 (${projects.filter((p) => p.status === 'completed').length})`,
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
              placeholder="搜尋專案名稱或客戶..."
              aria-label="搜尋專案"
              className="pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 w-full sm:w-64"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onAddProject}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          新增專案
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
            <FolderKanban className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">
                {projects.length === 0 ? '目前尚未建立任何專案' : '找不到符合條件的專案'}
              </p>
              <p className="text-xs text-slate-500">
                {projects.length === 0
                  ? '新增您的第一個接案專案，追蹤客戶與交付截止日期。'
                  : '請嘗試調整搜尋關鍵字或篩選條件。'}
              </p>
            </div>
            {projects.length === 0 && (
              <button
                type="button"
                onClick={onAddProject}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新增第一個專案
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-3 px-6">專案名稱</th>
                    <th className="py-3 px-4">客戶</th>
                    <th className="py-3 px-4">狀態</th>
                    <th className="py-3 px-4">截止日期</th>
                    <th className="py-3 px-6 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 max-w-xs">
                        <p className="font-medium text-slate-900 truncate">{project.name}</p>
                        {project.notes && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{project.notes}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {project.clientName}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={busyId === project.id}
                          onClick={() => handleToggle(project)}
                          title="點擊切換專案狀態"
                          className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                            project.status === 'completed'
                              ? 'text-emerald-700 hover:text-emerald-800'
                              : 'text-blue-700 hover:text-blue-800'
                          }`}
                        >
                          {project.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{project.status === 'completed' ? '已完成' : '進行中'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {project.dueDate}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        {confirmDeleteId === project.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={busyId === project.id}
                              onClick={() => handleDelete(project)}
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
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditProject(project)}
                              aria-label={`編輯 ${project.name}`}
                              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(project.id)}
                              aria-label={`刪除 ${project.name}`}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <ul className="md:hidden divide-y divide-slate-100">
              {filtered.map((project) => (
                <li key={project.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{project.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {project.clientName} · <span className="font-mono">{project.dueDate}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === project.id}
                      onClick={() => handleToggle(project)}
                      className={`inline-flex items-center gap-1 text-xs font-medium shrink-0 cursor-pointer ${
                        project.status === 'completed' ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {project.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>{project.status === 'completed' ? '已完成' : '進行中'}</span>
                    </button>
                  </div>
                  {project.notes && (
                    <p className="text-xs text-slate-600 line-clamp-2">{project.notes}</p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {confirmDeleteId === project.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === project.id}
                          onClick={() => handleDelete(project)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md"
                        >
                          確認刪除
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditProject(project)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md"
                        >
                          編輯
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(project.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
