import type { Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'in_progress' | 'completed';
export type TaskStatus = 'todo' | 'completed';
export type CurrencyCode = 'TWD' | 'USD' | 'JPY' | 'EUR';
export type ViewTab = 'dashboard' | 'projects' | 'tasks' | 'works' | 'profile';

// Synchronized verbatim with firebase-blueprint.json boundary constraints
export const SCHEMA_LIMITS = {
  USER_DISPLAY_NAME_MAX: 80,
  USER_TITLE_MAX: 100,
  USER_EMAIL_MAX: 160,
  USER_PHONE_MAX: 40,
  USER_LOCATION_MAX: 100,
  USER_BIO_MAX: 600,
  USER_RATE_MAX: 1000000,
  PROJECT_NAME_MAX: 120,
  CLIENT_NAME_MAX: 100,
  PROJECT_NOTES_MAX: 500,
  TASK_TITLE_MAX: 140,
  WORK_TITLE_MAX: 120,
  WORK_CATEGORY_MAX: 60,
  WORK_NOTES_MAX: 400,
  WORK_HOURS_MAX: 1000,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  hourlyRate: number;
  currency: CurrencyCode;
  bio: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  dueDate: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface TaskItem {
  id: string;
  ownerId: string;
  title: string;
  projectName: string;
  status: TaskStatus;
  dueDate: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface WorkEntry {
  id: string;
  ownerId: string;
  title: string;
  clientName: string;
  category: string;
  hours: number;
  workDate: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ProjectInput {
  name: string;
  clientName: string;
  status: ProjectStatus;
  dueDate: string;
  notes: string;
}

export interface TaskInput {
  title: string;
  projectName: string;
  status: TaskStatus;
  dueDate: string;
}

export interface WorkInput {
  title: string;
  clientName: string;
  category: string;
  hours: number;
  workDate: string;
  notes: string;
}

export interface UserProfileInput {
  displayName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  hourlyRate: number;
  currency: CurrencyCode;
  bio: string;
}
