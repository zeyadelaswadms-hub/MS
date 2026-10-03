export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
  avatarColor: string;
}

export type SubTaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  order: number;
  assignedMemberId: string;
  status: SubTaskStatus;
  transitionNote?: string; // Text written on the connecting line to the next step
  estimatedDays?: number;
  completedAt?: string;
  notes?: string;
  externalLink?: string;
  externalLinkLabel?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedMemberId: string; // Main task supervisor / manager
  subtasks: SubTask[];
  startDate?: string; // YYYY-MM-DD تاريخ بدء المهمة
  expectedClosingDate?: string; // YYYY-MM-DD تاريخ إغلاق / تسليم المهمة
  createdAt: string;
  priority: TaskPriority;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  category?: string; // e.g. أعمال خرسانية، تشطيبات، تمديدات، استلامات
  externalLink?: string; // Google Sheets, Google Drive, drawings or document URL
  externalLinkLabel?: string; // Descriptive title e.g. "شيت الكميات والتكاليف" or "مجلد درايف للمخططات"
  imageUrl?: string; // Attached image URL or base64 data
  imageCaption?: string; // Caption or description for image
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  location: string;
  projectManagerId: string;
  startDate: string;
  expectedEndDate: string;
  status: 'active' | 'completed' | 'paused';
  budget?: string;
  color: string;
}

export interface AppNotification {
  id: string;
  taskId?: string;
  projectId?: string;
  subtaskId?: string;
  title: string;
  message: string;
  type: 'deadline_warning' | 'delay_alert' | 'step_completed' | 'assigned_to_you' | 'system';
  targetMemberId?: string;
  createdAt: string;
  read: boolean;
}

export interface DeadlineCalculation {
  hasDate: boolean;
  formattedDate: string;
  isOverdue: boolean;
  daysDiff: number; // positive = days remaining, negative = days overdue
  badgeText: string;
  statusColor: 'green' | 'amber' | 'red' | 'gray';
}
