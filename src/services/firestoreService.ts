import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  SCHEMA_LIMITS,
  type Project,
  type ProjectInput,
  type ProjectStatus,
  type TaskInput,
  type TaskItem,
  type TaskStatus,
  type UserProfile,
  type UserProfileInput,
  type WorkEntry,
  type WorkInput,
} from '../types/workspace';

function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (SCHEMA_LIMITS.DATE_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return new Date().toISOString().slice(0, 10);
}

function toMillis(ts: { toMillis?: () => number } | null | undefined): number {
  if (ts && typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  return 0;
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const data = snapshot.data();
      onData({
        uid: String(data.uid ?? uid),
        displayName: String(data.displayName ?? ''),
        title: String(data.title ?? ''),
        email: String(data.email ?? ''),
        phone: String(data.phone ?? ''),
        location: String(data.location ?? ''),
        hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : 0,
        currency: (data.currency as UserProfile['currency']) ?? 'TWD',
        bio: String(data.bio ?? ''),
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    },
  );
}

export async function saveUserProfile(
  uid: string,
  input: UserProfileInput,
  isNew: boolean,
): Promise<void> {
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);
  const safeRate = Number.isFinite(input.hourlyRate)
    ? Math.max(0, Math.min(SCHEMA_LIMITS.USER_RATE_MAX, Math.round(input.hourlyRate)))
    : 0;

  const basePayload = {
    displayName: clampString(input.displayName || '自由接案者', SCHEMA_LIMITS.USER_DISPLAY_NAME_MAX),
    title: clampString(input.title, SCHEMA_LIMITS.USER_TITLE_MAX),
    email: clampString(input.email || 'user@example.com', SCHEMA_LIMITS.USER_EMAIL_MAX),
    phone: clampString(input.phone, SCHEMA_LIMITS.USER_PHONE_MAX),
    location: clampString(input.location, SCHEMA_LIMITS.USER_LOCATION_MAX),
    hourlyRate: safeRate,
    currency: input.currency,
    bio: clampString(input.bio, SCHEMA_LIMITS.USER_BIO_MAX),
    updatedAt: serverTimestamp(),
  };

  try {
    if (isNew) {
      await setDoc(docRef, {
        uid,
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, basePayload);
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export function subscribeProjects(
  uid: string,
  onData: (projects: Project[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'projects';
  const q = query(collection(db, path), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Project[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId ?? uid),
          name: String(data.name ?? ''),
          clientName: String(data.clientName ?? ''),
          status: data.status === 'completed' ? 'completed' : 'in_progress',
          dueDate: String(data.dueDate ?? ''),
          notes: String(data.notes ?? ''),
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });
      items.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    },
  );
}

export async function createProject(uid: string, input: ProjectInput): Promise<void> {
  const path = 'projects';
  try {
    await addDoc(collection(db, path), {
      ownerId: uid,
      name: clampString(input.name, SCHEMA_LIMITS.PROJECT_NAME_MAX),
      clientName: clampString(input.clientName, SCHEMA_LIMITS.CLIENT_NAME_MAX),
      status: input.status,
      dueDate: normalizeDate(input.dueDate),
      notes: clampString(input.notes, SCHEMA_LIMITS.PROJECT_NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProject(projectId: string, input: ProjectInput): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      name: clampString(input.name, SCHEMA_LIMITS.PROJECT_NAME_MAX),
      clientName: clampString(input.clientName, SCHEMA_LIMITS.CLIENT_NAME_MAX),
      status: input.status,
      dueDate: normalizeDate(input.dueDate),
      notes: clampString(input.notes, SCHEMA_LIMITS.PROJECT_NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleProjectStatus(
  projectId: string,
  nextStatus: ProjectStatus,
): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeTasks(
  uid: string,
  onData: (tasks: TaskItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'tasks';
  const q = query(collection(db, path), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: TaskItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId ?? uid),
          title: String(data.title ?? ''),
          projectName: String(data.projectName ?? ''),
          status: data.status === 'completed' ? 'completed' : 'todo',
          dueDate: String(data.dueDate ?? ''),
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });
      items.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    },
  );
}

export async function createTask(uid: string, input: TaskInput): Promise<void> {
  const path = 'tasks';
  try {
    await addDoc(collection(db, path), {
      ownerId: uid,
      title: clampString(input.title, SCHEMA_LIMITS.TASK_TITLE_MAX),
      projectName: clampString(input.projectName, SCHEMA_LIMITS.PROJECT_NAME_MAX),
      status: input.status,
      dueDate: normalizeDate(input.dueDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTask(taskId: string, input: TaskInput): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      title: clampString(input.title, SCHEMA_LIMITS.TASK_TITLE_MAX),
      projectName: clampString(input.projectName, SCHEMA_LIMITS.PROJECT_NAME_MAX),
      status: input.status,
      dueDate: normalizeDate(input.dueDate),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleTaskStatus(taskId: string, nextStatus: TaskStatus): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const path = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeWorks(
  uid: string,
  onData: (works: WorkEntry[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const path = 'works';
  const q = query(collection(db, path), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: WorkEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerId: String(data.ownerId ?? uid),
          title: String(data.title ?? ''),
          clientName: String(data.clientName ?? ''),
          category: String(data.category ?? ''),
          hours: typeof data.hours === 'number' ? data.hours : 0,
          workDate: String(data.workDate ?? ''),
          notes: String(data.notes ?? ''),
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        };
      });
      items.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    },
  );
}

export async function createWork(uid: string, input: WorkInput): Promise<void> {
  const path = 'works';
  const safeHours = Number.isFinite(input.hours)
    ? Math.max(0, Math.min(SCHEMA_LIMITS.WORK_HOURS_MAX, Number(input.hours)))
    : 0;
  try {
    await addDoc(collection(db, path), {
      ownerId: uid,
      title: clampString(input.title, SCHEMA_LIMITS.WORK_TITLE_MAX),
      clientName: clampString(input.clientName, SCHEMA_LIMITS.CLIENT_NAME_MAX),
      category: clampString(input.category || '設計開發', SCHEMA_LIMITS.WORK_CATEGORY_MAX),
      hours: safeHours,
      workDate: normalizeDate(input.workDate),
      notes: clampString(input.notes, SCHEMA_LIMITS.WORK_NOTES_MAX),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWork(workId: string, input: WorkInput): Promise<void> {
  const path = `works/${workId}`;
  const safeHours = Number.isFinite(input.hours)
    ? Math.max(0, Math.min(SCHEMA_LIMITS.WORK_HOURS_MAX, Number(input.hours)))
    : 0;
  try {
    await updateDoc(doc(db, 'works', workId), {
      title: clampString(input.title, SCHEMA_LIMITS.WORK_TITLE_MAX),
      clientName: clampString(input.clientName, SCHEMA_LIMITS.CLIENT_NAME_MAX),
      category: clampString(input.category || '設計開發', SCHEMA_LIMITS.WORK_CATEGORY_MAX),
      hours: safeHours,
      workDate: normalizeDate(input.workDate),
      notes: clampString(input.notes, SCHEMA_LIMITS.WORK_NOTES_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteWork(workId: string): Promise<void> {
  const path = `works/${workId}`;
  try {
    await deleteDoc(doc(db, 'works', workId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedStarterWorkspace(uid: string): Promise<void> {
  const batch = writeBatch(db);
  const today = new Date();
  const formatOffsetDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  const sampleProjects = [
    {
      name: '品牌官網視覺改版與開發',
      clientName: '晨曦生活選物',
      status: 'in_progress' as const,
      dueDate: formatOffsetDate(7),
      notes: '完成首頁設計稿、商品列表與響應式切版優化',
    },
    {
      name: 'SaaS 後台設計系統規範',
      clientName: '雲端數據科技',
      status: 'in_progress' as const,
      dueDate: formatOffsetDate(14),
      notes: '建立 Figma Component Tokens 與圖表元件規範',
    },
    {
      name: '電商結帳流程體驗顧問案',
      clientName: '森語咖啡烘焙',
      status: 'completed' as const,
      dueDate: formatOffsetDate(-5),
      notes: '已完成結帳動線測試並交付優化報告',
    },
  ];

  const sampleTasks = [
    {
      title: '交付首頁桌面版與手機版設計稿',
      projectName: '品牌官網視覺改版與開發',
      status: 'todo' as const,
      dueDate: formatOffsetDate(2),
    },
    {
      title: '整理設計 Token 色彩對比檢查表',
      projectName: 'SaaS 後台設計系統規範',
      status: 'todo' as const,
      dueDate: formatOffsetDate(4),
    },
    {
      title: '核對客戶第二階段驗收清單',
      projectName: '電商結帳流程體驗顧問案',
      status: 'completed' as const,
      dueDate: formatOffsetDate(-3),
    },
  ];

  const sampleWorks = [
    {
      title: '響應式導覽列與元件切版開發',
      clientName: '晨曦生活選物',
      category: '前端開發',
      hours: 4.5,
      workDate: formatOffsetDate(0),
      notes: '完成 RWD 選單與首頁結構實作',
    },
    {
      title: '設計系統元件審查會議',
      clientName: '雲端數據科技',
      category: 'UI/UX 顧問',
      hours: 2,
      workDate: formatOffsetDate(-1),
      notes: '與產品團隊對齊表格與表單間距規範',
    },
  ];

  try {
    for (const p of sampleProjects) {
      const ref = doc(collection(db, 'projects'));
      batch.set(ref, {
        ownerId: uid,
        ...p,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const t of sampleTasks) {
      const ref = doc(collection(db, 'tasks'));
      batch.set(ref, {
        ownerId: uid,
        ...t,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const w of sampleWorks) {
      const ref = doc(collection(db, 'works'));
      batch.set(ref, {
        ownerId: uid,
        ...w,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'projects/tasks/works');
  }
}
