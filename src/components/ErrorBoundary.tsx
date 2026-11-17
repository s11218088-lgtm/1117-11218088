import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { firebaseConfig } from '../lib/firebase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
    isQuotaError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    const raw = error.message || '發生未知錯誤';
    const isQuotaError = raw.includes('Quota exceeded');
    let readable = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: string; operationType?: string; path?: string };
      if (parsed.error) {
        readable = `${parsed.error}（操作：${parsed.operationType ?? 'unknown'}，路徑：${parsed.path ?? '-'}）`;
      }
    } catch {
      // Keep raw error message
    }
    return {
      hasError: true,
      message: readable,
      isQuotaError,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-red-50 text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">系統資料連線異常</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {this.state.isQuotaError
                    ? 'Firestore 免費方案每日讀取額度已達上限，額度將於明日重置。'
                    : '存取 Firestore 資料庫時發生錯誤，請檢查權限或重新載入頁面。'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 break-all">
              {this.state.message}
            </div>

            {this.state.isQuotaError && (
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-medium text-blue-700 hover:underline"
              >
                前往 Firebase 主控台檢視資料庫配額
              </a>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重新整理頁面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
