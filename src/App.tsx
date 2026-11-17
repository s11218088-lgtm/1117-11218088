import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Briefcase,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { DashboardHome } from './components/DashboardHome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProjectModal, TaskModal, WorkModal } from './components/Modals';
import { ProfileView } from './components/ProfileView';
import { ProjectsView } from './components/ProjectsView';
import { TasksView } from './components/TasksView';
import { WorksView } from './components/WorksView';
import { auth, signOutUser } from './lib/firebase';
import {
  createProject,
  createTask,
  createWork,
  deleteProject,
  deleteTask,
  deleteWork,
  saveUserProfile,
  seedStarterWorkspace,
  subscribeProjects,
  subscribeTasks,
  subscribeUserProfile,
  subscribeWorks,
  toggleProjectStatus,
  toggleTaskStatus,
  updateProject,
  updateTask,
  updateWork,
} from './services/firestoreService';
import type {
  Project,
  ProjectInput,
  TaskInput,
  TaskItem,
  UserProfile,
  UserProfileInput,
  ViewTab,
  WorkEntry,
  WorkInput,
} from './types/workspace';

const DEFAULT_AVATAR_URL = '/src/assets/images/freelancer_avatar_1794908438632.jpg';

const NAV_ITEMS: { id: ViewTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '儀表板首頁', icon: LayoutDashboard },
  { id: 'projects', label: '專案管理', icon: FolderKanban },
  { id: 'tasks', label: '任務管理', icon: CheckSquare },
  { id: 'works', label: '工作與客戶', icon: Briefcase },
  { id: 'profile', label: '個人資料設定', icon: UserIcon },
];

const VIEW_TITLES: Record<ViewTab, { title: string; subtitle: string }> = {
  dashboard: { title: '儀表板首頁', subtitle: '掌握專案數、客戶數、待辦任務與最新活動' },
  projects: { title: '專案管理', subtitle: '管理接案專案名稱、合作客戶、狀態與截止日期' },
  tasks: { title: '任務管理', subtitle: '追蹤待辦任務標題、執行狀態與到期排程' },
  works: { title: '工作與客戶', subtitle: '記錄客戶工作項目與累計投入時數' },
  profile: { title: '個人資料設定', subtitle: '檢視並編輯您的自由接案個人資料與費率' },
};

function WorkspaceApp() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [works, setWorks] = useState<WorkEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  // Modal states
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkEntry | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (asyncError) {
    throw asyncError;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setProfile(null);
        setProjects([]);
        setTasks([]);
        setWorks([]);
        setDataLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    setDataLoading(true);

    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 4) {
        setDataLoading(false);
      }
    };

    const unsubProfile = subscribeUserProfile(
      user.uid,
      (data) => {
        setProfile(data);
        markLoaded();
      },
      (err) => setAsyncError(err),
    );

    const unsubProjects = subscribeProjects(
      user.uid,
      (data) => {
        setProjects(data);
        markLoaded();
      },
      (err) => setAsyncError(err),
    );

    const unsubTasks = subscribeTasks(
      user.uid,
      (data) => {
        setTasks(data);
        markLoaded();
      },
      (err) => setAsyncError(err),
    );

    const unsubWorks = subscribeWorks(
      user.uid,
      (data) => {
        setWorks(data);
        markLoaded();
      },
      (err) => setAsyncError(err),
    );

    return () => {
      unsubProfile();
      unsubProjects();
      unsubTasks();
      unsubWorks();
    };
  }, [authReady, user]);

  const projectNames = useMemo(
    () => Array.from(new Set(projects.map((p) => p.name).filter(Boolean))),
    [projects],
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">正在初始化工作台...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  const displayName = profile?.displayName || user.displayName || '自由接案工作者';
  const displaySubtitle = profile?.title || user.email || '';
  const avatarSrc = user.photoURL || DEFAULT_AVATAR_URL;

  const handleSaveProject = async (input: ProjectInput) => {
    if (editingProject) {
      await updateProject(editingProject.id, input);
    } else {
      await createProject(user.uid, input);
    }
  };

  const handleSaveTask = async (input: TaskInput) => {
    if (editingTask) {
      await updateTask(editingTask.id, input);
    } else {
      await createTask(user.uid, input);
    }
  };

  const handleSaveWork = async (input: WorkInput) => {
    if (editingWork) {
      await updateWork(editingWork.id, input);
    } else {
      await createWork(user.uid, input);
    }
  };

  const handleSaveProfile = async (input: UserProfileInput, isNew: boolean) => {
    await saveUserProfile(user.uid, input, isNew);
  };

  const handleSeedStarterData = async () => {
    setSeeding(true);
    try {
      await seedStarterWorkspace(user.uid);
    } finally {
      setSeeding(false);
    }
  };

  const handlePrimaryHeaderAction = () => {
    if (activeTab === 'tasks') {
      setEditingTask(null);
      setTaskModalOpen(true);
    } else if (activeTab === 'works') {
      setEditingWork(null);
      setWorkModalOpen(true);
    } else {
      setEditingProject(null);
      setProjectModalOpen(true);
    }
  };

  const primaryHeaderActionLabel =
    activeTab === 'tasks' ? '新增任務' : activeTab === 'works' ? '新增工作' : '新增專案';

  const navigateTo = (tab: ViewTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            CraftDesk 接案工作台
          </button>
        </div>

        <nav aria-label="主要導覽" className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
              {!avatarFailed ? (
                <img
                  src={avatarSrc}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{displaySubtitle}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => signOutUser()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出帳號</span>
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="h-14 px-5 flex items-center justify-between border-b border-slate-100">
              <span className="font-display text-base font-bold text-slate-900 whitespace-nowrap">
                CraftDesk 接案工作台
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="關閉選單"
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="行動版導覽" className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                  {!avatarFailed ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{displaySubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>登出帳號</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar (strictly single-row, compact on mobile <= 56px) */}
        <header className="sticky top-0 z-20 h-14 lg:h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="開啟導覽選單"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 whitespace-nowrap">工作台</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-slate-900 truncate">
                {VIEW_TITLES[activeTab].title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'profile' && (
              <button
                type="button"
                onClick={handlePrimaryHeaderAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{primaryHeaderActionLabel}</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {VIEW_TITLES[activeTab].title}
            </h2>
            <p className="text-sm text-slate-500">{VIEW_TITLES[activeTab].subtitle}</p>
          </div>

          {activeTab === 'dashboard' && (
            <DashboardHome
              loading={dataLoading}
              projects={projects}
              tasks={tasks}
              works={works}
              onNavigate={navigateTo}
              onOpenNewProject={() => {
                setEditingProject(null);
                setProjectModalOpen(true);
              }}
              onOpenNewWork={() => {
                setEditingWork(null);
                setWorkModalOpen(true);
              }}
              onOpenNewTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onToggleTaskStatus={(task) =>
                toggleTaskStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')
              }
              onSeedStarterData={handleSeedStarterData}
              seeding={seeding}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              loading={dataLoading}
              projects={projects}
              onAddProject={() => {
                setEditingProject(null);
                setProjectModalOpen(true);
              }}
              onEditProject={(project) => {
                setEditingProject(project);
                setProjectModalOpen(true);
              }}
              onToggleStatus={(project) =>
                toggleProjectStatus(
                  project.id,
                  project.status === 'completed' ? 'in_progress' : 'completed',
                )
              }
              onDeleteProject={(project) => deleteProject(project.id)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              loading={dataLoading}
              tasks={tasks}
              onAddTask={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              onEditTask={(task) => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              onToggleStatus={(task) =>
                toggleTaskStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')
              }
              onDeleteTask={(task) => deleteTask(task.id)}
            />
          )}

          {activeTab === 'works' && (
            <WorksView
              loading={dataLoading}
              works={works}
              projects={projects}
              onAddWork={() => {
                setEditingWork(null);
                setWorkModalOpen(true);
              }}
              onEditWork={(work) => {
                setEditingWork(work);
                setWorkModalOpen(true);
              }}
              onDeleteWork={(work) => deleteWork(work.id)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              loading={dataLoading}
              profile={profile}
              authDisplayName={user.displayName || ''}
              authEmail={user.email || ''}
              authPhotoUrl={user.photoURL}
              onSaveProfile={handleSaveProfile}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        initialProject={editingProject}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSaveProject}
      />

      <TaskModal
        open={taskModalOpen}
        initialTask={editingTask}
        projectNames={projectNames}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
      />

      <WorkModal
        open={workModalOpen}
        initialWork={editingWork}
        onClose={() => {
          setWorkModalOpen(false);
          setEditingWork(null);
        }}
        onSubmit={handleSaveWork}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <WorkspaceApp />
    </ErrorBoundary>
  );
}
