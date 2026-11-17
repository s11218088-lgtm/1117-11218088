import { useState } from 'react';
import { Briefcase, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import type { Project, WorkEntry } from '../types/workspace';

interface WorksViewProps {
  loading: boolean;
  works: WorkEntry[];
  projects: Project[];
  onAddWork: () => void;
  onEditWork: (work: WorkEntry) => void;
  onDeleteWork: (work: WorkEntry) => Promise<void>;
}

export function WorksView({
  loading,
  works,
  projects,
  onAddWork,
  onEditWork,
  onDeleteWork,
}: WorksViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const clientSummary = Array.from(
    new Set([
      ...projects.map((p) => p.clientName.trim()),
      ...works.map((w) => w.clientName.trim()),
    ].filter(Boolean)),
  ).map((clientName) => {
    const projectCount = projects.filter((p) => p.clientName.trim() === clientName).length;
    const clientWorks = works.filter((w) => w.clientName.trim() === clientName);
    const hours = clientWorks.reduce((sum, w) => sum + (w.hours || 0), 0);
    return {
      clientName,
      projectCount,
      workCount: clientWorks.length,
      hours,
    };
  });

  const filteredWorks = works.filter((w) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      w.title.toLowerCase().includes(q) ||
      w.clientName.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (work: WorkEntry) => {
    setBusyId(work.id);
    try {
      await onDeleteWork(work);
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 合作客戶總覽 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            合作客戶總覽（{clientSummary.length}）
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : clientSummary.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl px-6 py-8 text-center">
            <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              新增專案或工作紀錄後，合作客戶名單會自動彙整顯示於此。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientSummary.map((c) => (
              <div
                key={c.clientName}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-2"
              >
                <p className="font-medium text-slate-900 truncate">{c.clientName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                  <span>專案 {c.projectCount} 件</span>
                  <span aria-hidden="true">·</span>
                  <span>工作 {c.workCount} 筆</span>
                  <span aria-hidden="true">·</span>
                  <span>{c.hours} 小時</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 工作紀錄列表 */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋工作項目、客戶或類別..."
              aria-label="搜尋工作紀錄"
              className="pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 w-full sm:w-72"
            />
          </div>

          <button
            type="button"
            onClick={onAddWork}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            新增工作
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredWorks.length === 0 ? (
            <div className="px-6 py-14 text-center space-y-3">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800">
                  {works.length === 0 ? '尚無工作紀錄' : '找不到符合條件的工作紀錄'}
                </p>
                <p className="text-xs text-slate-500">
                  記錄每日為客戶執行的工作內容與工時，方便統計客戶貢獻與交付進度。
                </p>
              </div>
              {works.length === 0 && (
                <button
                  type="button"
                  onClick={onAddWork}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增第一筆工作
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredWorks.map((work) => (
                <li
                  key={work.id}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{work.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>{work.clientName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{work.hours} 小時</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{work.workDate}</span>
                    </div>
                    {work.notes && (
                      <p className="text-xs text-slate-500 truncate max-w-2xl">{work.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 shrink-0">
                    {confirmDeleteId === work.id ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === work.id}
                          onClick={() => handleDelete(work)}
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
                          onClick={() => onEditWork(work)}
                          aria-label={`編輯 ${work.title}`}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(work.id)}
                          aria-label={`刪除 ${work.title}`}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
