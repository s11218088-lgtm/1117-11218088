import { useEffect, useState, type FormEvent } from 'react';
import { Check, Pencil, User } from 'lucide-react';
import {
  SCHEMA_LIMITS,
  type CurrencyCode,
  type UserProfile,
  type UserProfileInput,
} from '../types/workspace';

interface ProfileViewProps {
  loading: boolean;
  profile: UserProfile | null;
  authDisplayName: string;
  authEmail: string;
  authPhotoUrl: string | null;
  onSaveProfile: (input: UserProfileInput, isNew: boolean) => Promise<void>;
}

const DEFAULT_AVATAR_URL = '/src/assets/images/freelancer_avatar_1794908438632.jpg';

export function ProfileView({
  loading,
  profile,
  authDisplayName,
  authEmail,
  authPhotoUrl,
  onSaveProfile,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [hourlyRate, setHourlyRate] = useState('1500');
  const [currency, setCurrency] = useState<CurrencyCode>('TWD');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName || authDisplayName || '自由接案工作者');
    setTitle(profile?.title || '獨立設計師 / 全端開發者');
    setEmail(profile?.email || authEmail || '');
    setPhone(profile?.phone || '');
    setLocation(profile?.location || '台北 · GMT+8');
    setHourlyRate(profile ? String(profile.hourlyRate) : '1500');
    setCurrency(profile?.currency || 'TWD');
    setBio(profile?.bio || '');
  }, [profile, authDisplayName, authEmail]);

  const avatarSrc = authPhotoUrl || DEFAULT_AVATAR_URL;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('請輸入顯示名稱');
      return;
    }
    if (!email.trim()) {
      setError('請輸入聯絡電子郵件');
      return;
    }
    const parsedRate = Number(hourlyRate);
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > SCHEMA_LIMITS.USER_RATE_MAX) {
      setError('請輸入有效的標準時薪（0–1,000,000）');
      return;
    }

    setSaving(true);
    setError(null);
    setSavedNotice(false);
    try {
      await onSaveProfile(
        {
          displayName: displayName.trim(),
          title: title.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim(),
          hourlyRate: parsedRate,
          currency,
          bio: bio.trim(),
        },
        profile === null,
      );
      setIsEditing(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存個人資料失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header Row */}
        <div className="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
              {!imgFailed ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-slate-900 truncate">
                {displayName}
              </h2>
              <p className="text-sm text-slate-500 truncate">{title || '尚未設定專業頭銜'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                已儲存至 Firestore
              </span>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                編輯個人資料
              </button>
            )}
          </div>
        </div>

        {/* View or Edit Mode */}
        {!isEditing ? (
          <div className="p-6 space-y-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">顯示名稱</dt>
                <dd className="mt-1 font-medium text-slate-900">{displayName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">專業頭銜</dt>
                <dd className="mt-1 font-medium text-slate-900">{title || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">聯絡電子郵件</dt>
                <dd className="mt-1 font-mono text-slate-900 break-all">{email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">聯絡電話</dt>
                <dd className="mt-1 font-mono text-slate-900">{phone || '尚未填寫'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">所在城市 / 時區</dt>
                <dd className="mt-1 text-slate-900">{location || '尚未填寫'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">標準計費費率</dt>
                <dd className="mt-1 font-mono tabular-nums text-slate-900">
                  {currency} {Number(hourlyRate || 0).toLocaleString()} / 小時
                </dd>
              </div>
            </dl>

            <div className="pt-5 border-t border-slate-100">
              <dt className="text-xs font-medium text-slate-500">個人簡介與服務項目</dt>
              <dd className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {bio || '尚未填寫個人簡介，點擊右上角「編輯個人資料」補充您的接案專長與背景介紹。'}
              </dd>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700">
                  顯示名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={displayName}
                  maxLength={SCHEMA_LIMITS.USER_DISPLAY_NAME_MAX}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-title" className="block text-sm font-medium text-slate-700">
                  專業頭銜
                </label>
                <input
                  id="profile-title"
                  type="text"
                  value={title}
                  maxLength={SCHEMA_LIMITS.USER_TITLE_MAX}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：資深 UI/UX 設計師"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700">
                  聯絡電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  maxLength={SCHEMA_LIMITS.USER_EMAIL_MAX}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-700">
                  聯絡電話
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  value={phone}
                  maxLength={SCHEMA_LIMITS.USER_PHONE_MAX}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="例如：0912-345-678"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="profile-location"
                  className="block text-sm font-medium text-slate-700"
                >
                  所在城市 / 時區
                </label>
                <input
                  id="profile-location"
                  type="text"
                  value={location}
                  maxLength={SCHEMA_LIMITS.USER_LOCATION_MAX}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例如：台北 · GMT+8"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1.5">
                  <label
                    htmlFor="profile-currency"
                    className="block text-sm font-medium text-slate-700"
                  >
                    幣別
                  </label>
                  <select
                    id="profile-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-2.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  >
                    <option value="TWD">TWD</option>
                    <option value="USD">USD</option>
                    <option value="JPY">JPY</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="profile-rate" className="block text-sm font-medium text-slate-700">
                    標準時薪
                  </label>
                  <input
                    id="profile-rate"
                    type="number"
                    min="0"
                    max={SCHEMA_LIMITS.USER_RATE_MAX}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-bio" className="block text-sm font-medium text-slate-700">
                個人簡介與服務項目
              </label>
              <textarea
                id="profile-bio"
                rows={4}
                value={bio}
                maxLength={SCHEMA_LIMITS.USER_BIO_MAX}
                onChange={(e) => setBio(e.target.value)}
                placeholder="介紹您的設計或開發經歷、擅長技術與合作方式..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {saving ? '儲存中...' : '儲存設定'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
