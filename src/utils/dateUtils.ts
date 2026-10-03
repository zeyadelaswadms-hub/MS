import { DeadlineCalculation, SubTask, Task, TeamMember, Project } from '../types';

/**
 * Calculates days remaining or days overdue compared to today
 */
export function getDeadlineInfo(closingDateStr?: string, isTaskCompleted?: boolean): DeadlineCalculation {
  if (!closingDateStr) {
    return {
      hasDate: false,
      formattedDate: 'غير محدد',
      isOverdue: false,
      daysDiff: 0,
      badgeText: 'بدون تاريخ إغلاق',
      statusColor: 'gray'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(closingDateStr);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = targetDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (isTaskCompleted) {
    return {
      hasDate: true,
      formattedDate,
      isOverdue: false,
      daysDiff: diffDays,
      badgeText: 'مكتملة بنجاح',
      statusColor: 'green'
    };
  }

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      hasDate: true,
      formattedDate,
      isOverdue: true,
      daysDiff: diffDays,
      badgeText: `متأخرة ${overdueDays} ${overdueDays === 1 ? 'يوم' : overdueDays === 2 ? 'يومين' : overdueDays <= 10 ? 'أيام' : 'يوماً'}`,
      statusColor: 'red'
    };
  } else if (diffDays === 0) {
    return {
      hasDate: true,
      formattedDate,
      isOverdue: false,
      daysDiff: 0,
      badgeText: 'تاريخ الإغلاق اليوم!',
      statusColor: 'amber'
    };
  } else if (diffDays <= 3) {
    return {
      hasDate: true,
      formattedDate,
      isOverdue: false,
      daysDiff: diffDays,
      badgeText: `متبقي ${diffDays} ${diffDays === 1 ? 'يوم' : diffDays === 2 ? 'يومان' : 'أيام'}`,
      statusColor: 'amber'
    };
  } else {
    return {
      hasDate: true,
      formattedDate,
      isOverdue: false,
      daysDiff: diffDays,
      badgeText: `متبقي ${diffDays} يوماً`,
      statusColor: 'green'
    };
  }
}

/**
 * Calculates completion percentage of a task based on subtasks
 */
export function calculateTaskProgress(task: Task): number {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status === 'completed' ? 100 : 0;
  }
  const completedCount = task.subtasks.filter(s => s.status === 'completed').length;
  return Math.round((completedCount / task.subtasks.length) * 100);
}

/**
 * Identifies the current subtask that is in progress, blocked, or pending
 * and who is responsible for it ("آخر مهمة فرعية بكل مهمة متوقفة على مين")
 */
export function getActiveWaitingSubtask(
  task: Task,
  teamMembers: TeamMember[]
): {
  subtask: SubTask | null;
  responsibleMember: TeamMember | null;
  isAllCompleted: boolean;
  statusLabel: string;
} {
  if (!task.subtasks || task.subtasks.length === 0) {
    const member = teamMembers.find(m => m.id === task.assignedMemberId) || null;
    return {
      subtask: null,
      responsibleMember: member,
      isAllCompleted: task.status === 'completed',
      statusLabel: task.status === 'completed' ? 'المهمة مكتملة' : 'قيد انتظار البدء'
    };
  }

  // Look for blocked step first, then in_progress, then first pending
  const blockedStep = task.subtasks.find(s => s.status === 'blocked');
  const inProgressStep = task.subtasks.find(s => s.status === 'in_progress');
  const pendingStep = task.subtasks.find(s => s.status === 'pending');

  const activeStep = blockedStep || inProgressStep || pendingStep;

  if (!activeStep) {
    // All completed
    return {
      subtask: null,
      responsibleMember: null,
      isAllCompleted: true,
      statusLabel: 'تم إنجاز جميع الخطوات الفرعية'
    };
  }

  // Find member assigned to this subtask or fallback to main task assignee
  const memberId = activeStep.assignedMemberId || task.assignedMemberId;
  const responsibleMember = teamMembers.find(m => m.id === memberId) || null;

  let statusLabel = 'متوقفة على البدء';
  if (activeStep.status === 'blocked') {
    statusLabel = 'معطلة / متوقفة حالياً عند';
  } else if (activeStep.status === 'in_progress') {
    statusLabel = 'قيد التنفيذ والمتابعة عند';
  } else {
    statusLabel = 'الخطوة التالية بانتظار';
  }

  return {
    subtask: activeStep,
    responsibleMember,
    isAllCompleted: false,
    statusLabel
  };
}

/**
 * Builds WhatsApp link with automated pre-filled alert message
 */
export function createWhatsAppAlertLink(
  member: TeamMember,
  task: Task,
  project?: Project,
  subtask?: SubTask | null,
  deadlineInfo?: DeadlineCalculation
): string {
  // Clean phone number: remove spaces, dashes, parentheses
  let cleanPhone = member.phone.replace(/[\s\-\(\)]/g, '');
  // If starts with 05 (Saudi), add +966
  if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
    cleanPhone = '966' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  }

  const projectName = project ? project.name : 'مشروع المقاولات';
  const stepName = subtask ? subtask.title : task.title;
  const deadlineText = deadlineInfo?.hasDate ? deadlineInfo.badgeText : 'غير محدد';

  const message = `السلام عليكم م. ${member.name} 🏗️
تنبيه متابعة أعمال من إدارة المشاريع:
📌 المشروع: ${projectName}
📋 المهمة: ${task.title}
⏳ الخطوة الحالية المتوقفة عليك: ${stepName}
📅 الموعد المتوقع للإغلاق: ${task.expectedClosingDate || 'لم يحدد'} (${deadlineText})
يرجى إفادتنا بحالة الإنجاز أو أي معوقات بالموقع لتحديث نظام المتابعة. شاكرين جهودكم.`;

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Calculates days elapsed since the last action (latest completed subtask or task creation)
 */
export function getDaysSinceLastAction(task: Task): number {
  const completedSubtasks = task.subtasks.filter(s => s.status === 'completed' && s.completedAt);
  let latestDate: Date;
  if (completedSubtasks.length > 0) {
    const dates = completedSubtasks.map(s => new Date(s.completedAt!).getTime()).filter(t => !isNaN(t));
    latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date(task.createdAt || Date.now());
  } else if (task.createdAt) {
    latestDate = new Date(task.createdAt);
  } else {
    return 0;
  }
  
  if (isNaN(latestDate.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  latestDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - latestDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  return diffDays;
}
