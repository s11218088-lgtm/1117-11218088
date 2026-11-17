import { useState } from 'react';
import { ArrowRight, CheckSquare, FolderKanban, ShieldCheck, UserCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export function AuthGate() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登入過程發生錯誤';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMessage('您已取消 Google 登入視窗，請再試一次。');
      } else {
        setErrorMessage(`登入失敗：${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-6 py-8 md:px-12">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between gap-8">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          CraftDesk 接案工作台
        </span>
        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          自由接案工作者專屬儀表板
        </span>
      </header>

      <main className="max-w-5xl w-full mx-auto my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium text-blue-700 tracking-wide">
              Cloud Firestore 即時工作區
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
              專注交付每一個接案專案，掌握客戶與任務節奏
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              整合專案進度、客戶工作紀錄、每日待辦任務與個人接案設定。所有資料透過 Google 帳號安全隔離並即時同步至您的雲端資料庫。
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
            >
              <span>{loading ? '正在連接 Google 驗證...' : '使用 Google 帳號登入工作台'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {errorMessage && (
              <p className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="font-display text-base font-semibold text-slate-900">
            工作台核心模組
          </h2>
          <div className="divide-y divide-slate-100">
            <div className="py-3.5 first:pt-0 flex items-start gap-3.5">
              <FolderKanban className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">專案與客戶管理</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  追蹤進行中與已完成專案、合作客戶數與交付截止日期。
                </p>
              </div>
            </div>
            <div className="py-3.5 flex items-start gap-3.5">
              <CheckSquare className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">待辦任務與工作紀錄</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  快速建立任務與工時工作項，掌握最近活動與到期提醒。
                </p>
              </div>
            </div>
            <div className="py-3.5 last:pb-0 flex items-start gap-3.5">
              <UserCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">個人接案資料設定</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  自訂專業頭銜、聯絡方式與標準計費費率。
                </p>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <span>資料僅限本人登入帳號讀取與編輯</span>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <span>CraftDesk 自由接案工作台</span>
        <span>繁體中文介面 · Firestore 即時同步</span>
      </footer>
    </div>
  );
}
