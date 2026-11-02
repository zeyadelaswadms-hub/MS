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
 * Clean phone number for WhatsApp: supports Saudi (+966), Egypt (+20), and international
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  let clean = phone.replace(/[\s\-\(\)\.]/g, '');
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  } else if (clean.startsWith('00')) {
    clean = clean.substring(2);
  } else if ((clean.startsWith('010') || clean.startsWith('011') || clean.startsWith('012') || clean.startsWith('015')) && clean.length === 11) {
    // Egyptian mobile number (e.g. 01030095004 -> 201030095004)
    clean = '20' + clean.substring(1);
  } else if (clean.startsWith('05') && clean.length === 10) {
    // Saudi mobile number (e.g. 0551234567 -> 966551234567)
    clean = '966' + clean.substring(1);
  }
  return clean;
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
  const cleanPhone = cleanPhoneNumberForWhatsApp(member.phone);
  const projectName = project ? project.name : 'مشروع المقاولات';
  const stepName = subtask ? subtask.title : task.title;
  const deadlineText = deadlineInfo?.hasDate ? deadlineInfo.badgeText : 'غير محدد';

  const message = `سلام عليكم م. ${member.name}
بخصوص مشروع ${projectName}:
- مهمة: ${task.title} (خطوة: ${stepName})
موعد التسليم: ${task.expectedClosingDate || 'قيد المتابعة'} (${deadlineText})
يرجى إفادتنا بحالة الإنجاز والاعتماد بالموقع. شاكرين جهودكم.
شركة محمد سعد`;

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Builds concise WhatsApp Digest message alerting the member about ALL pending tasks waiting on him across projects
 * Format requested:
 * سلام عليكم م.فلان
 * بالنسبة لمشروع كذا:
 * - مهمة كذا (خطوة: كذا)
 * ومشروع كذا:
 * - مهمة كذا
 */
export function createMemberAllPendingTasksWhatsAppLink(
  member: TeamMember,
  allTasks: Task[],
  projects: Project[],
  customHeader?: string
): { link: string; pendingCount: number; message: string } {
  const cleanPhone = cleanPhoneNumberForWhatsApp(member.phone);

  // Find all active uncompleted tasks/steps where this member is the active blocker or assignee
  const pendingItems: Array<{ project: Project; task: Task; stepTitle: string }> = [];

  allTasks.forEach(task => {
    // Skip completely closed tasks
    if (task.status === 'completed' || calculateTaskProgress(task) === 100) return;

    const proj = projects.find(p => p.id === task.projectId) || {
      id: task.projectId,
      name: 'مشروع عام',
      code: 'PRJ',
      client: '',
      location: '',
      projectManagerId: '',
      startDate: '',
      expectedEndDate: '',
      status: 'active',
      color: '#0891b2'
    };

    // Check if member is assigned to a pending/blocked subtask
    const waitingSubtask = task.subtasks?.find(s => 
      s.status !== 'completed' && s.assignedMemberId === member.id
    );

    if (waitingSubtask) {
      pendingItems.push({
        project: proj,
        task,
        stepTitle: waitingSubtask.title,
      });
    } else if (task.assignedMemberId === member.id) {
      // Member is main task manager and no specific subtask assigned
      const activeWaiting = getActiveWaitingSubtask(task, [member]);
      pendingItems.push({
        project: proj,
        task,
        stepTitle: activeWaiting.subtask?.title || 'متابعة المهمة والإشراف',
      });
    }
  });

  if (pendingItems.length === 0) {
    const emptyMsg = `سلام عليكم م. ${member.name}
نحيطكم علماً بأنه لا توجد مهام أو بنود متوقفة عليكم حالياً في المنظومة.
شركة محمد سعد`;
    return {
      link: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(emptyMsg)}`,
      pendingCount: 0,
      message: emptyMsg
    };
  }

  // Group items by project
  const byProject = new Map<string, Array<{ task: Task; stepTitle: string }>>();
  pendingItems.forEach(item => {
    const pName = item.project.name;
    if (!byProject.has(pName)) {
      byProject.set(pName, []);
    }
    byProject.get(pName)!.push({ task: item.task, stepTitle: item.stepTitle });
  });

  // Construct message lines
  const lines: string[] = [];
  lines.push(`سلام عليكم م. ${member.name}`);
  if (customHeader?.trim()) {
    lines.push(customHeader.trim());
  } else {
    lines.push('نرجو التكرم بمتابعة المهام والمتطلبات الميدانية المتوقفة عليكم:');
  }
  lines.push('');

  let isFirst = true;
  byProject.forEach((items, projectName) => {
    lines.push(`${isFirst ? 'بالنسبة لمشروع' : 'ومشروع'} ${projectName}:`);
    items.forEach(it => {
      lines.push(`- مهمة: ${it.task.title} (خطوة: ${it.stepTitle})`);
    });
    lines.push('');
    isFirst = false;
  });

  lines.push('شاكرين لكم حسن تعاونكم وسرعة الاستجابة.');
  lines.push('شركة محمد سعد');

  const fullMessage = lines.join('\n');
  const link = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`;

  return {
    link,
    pendingCount: pendingItems.length,
    message: fullMessage,
  };
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
