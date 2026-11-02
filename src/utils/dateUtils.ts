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
 * Clean phone number for WhatsApp: converts Arabic numerals, supports Egypt (+20), Saudi (+966), and international
 */
export function cleanPhoneNumberForWhatsApp(rawPhone?: string): string {
  if (!rawPhone) return '';
  let phone = String(rawPhone).trim();

  // Convert Arabic-Indic numerals (٠-٩) to standard numerals (0-9)
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    phone = phone.replace(new RegExp(arabicNumerals[i], 'g'), String(i));
  }

  // Remove spaces, dashes, brackets, periods
  let clean = phone.replace(/[^0-9+]/g, '');

  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  } else if (clean.startsWith('00')) {
    clean = clean.substring(2);
  }

  // Egyptian mobile numbers (010, 011, 012, 015 - 11 digits: e.g. 01030095004 -> 201030095004)
  if (/^01[0125]\d{8}$/.test(clean)) {
    clean = '20' + clean.substring(1);
  } else if (/^1[0125]\d{8}$/.test(clean)) {
    clean = '20' + clean;
  }
  // Saudi mobile numbers (05... 10 digits: e.g. 0551234567 -> 966551234567)
  else if (/^05\d{8}$/.test(clean)) {
    clean = '966' + clean.substring(1);
  } else if (/^5\d{8}$/.test(clean)) {
    clean = '966' + clean;
  }

  return clean;
}

/**
 * Builds WhatsApp link with automated pre-filled alert message
 */
export function createWhatsAppAlertLink(
  member?: TeamMember | null,
  task?: Task | null,
  project?: Project | null,
  subtask?: SubTask | null,
  deadlineInfo?: DeadlineCalculation
): string {
  if (!member) return '#';
  const cleanPhone = cleanPhoneNumberForWhatsApp(member.phone);
  const projectName = project ? project.name : 'مشروع المقاولات';
  const stepName = subtask ? subtask.title : task ? task.title : 'متابعة العمل';
  const taskTitle = task ? task.title : 'المهمة';
  const deadlineText = deadlineInfo?.hasDate ? deadlineInfo.badgeText : 'غير محدد';
  const closingDate = task?.expectedClosingDate || 'قيد المتابعة';

  const message = `سلام عليكم م. ${member.name}
بخصوص مشروع ${projectName}:
- مهمة: ${taskTitle} (خطوة: ${stepName})
موعد التسليم: ${closingDate} (${deadlineText})
يرجى إفادتنا بحالة الإنجاز والاعتماد بالموقع. شاكرين جهودكم.
شركة محمد سعد`;

  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Builds concise WhatsApp Digest message alerting the member about ALL pending tasks waiting on him across projects
 */
export function createMemberAllPendingTasksWhatsAppDigest(
  member: TeamMember,
  allTasks: Task[],
  projects: Project[],
  customTemplate?: string
): { link: string; pendingCount: number; message: string; cleanPhone: string } {
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
      status: 'active' as const,
      color: '#0891b2'
    };

    // Subtasks assigned to this member that are not completed
    const memberSubtasks = task.subtasks?.filter(s => 
      s.status !== 'completed' && s.assignedMemberId === member.id
    ) || [];

    if (memberSubtasks.length > 0) {
      memberSubtasks.forEach(sub => {
        pendingItems.push({
          project: proj,
          task,
          stepTitle: sub.title,
        });
      });
    } else if (task.assignedMemberId === member.id) {
      // Member is responsible for the overall task
      const waiting = getActiveWaitingSubtask(task, [member]);
      pendingItems.push({
        project: proj,
        task,
        stepTitle: waiting.subtask?.title || 'متابعة المهمة والإشراف',
      });
    }
  });

  // Group items by project
  const byProject = new Map<string, Array<{ taskTitle: string; stepTitle: string }>>();
  pendingItems.forEach(item => {
    const pName = item.project.name || 'مشروع عام';
    if (!byProject.has(pName)) {
      byProject.set(pName, []);
    }
    byProject.get(pName)!.push({
      taskTitle: item.task.title,
      stepTitle: item.stepTitle,
    });
  });

  // Build task lines
  const taskLines: string[] = [];
  let pIdx = 0;
  byProject.forEach((items, projectName) => {
    taskLines.push(`${pIdx === 0 ? 'بالنسبة لمشروع' : 'ومشروع'} ${projectName}:`);
    items.forEach(it => {
      taskLines.push(`- مهمة: ${it.taskTitle} (خطوة: ${it.stepTitle})`);
    });
    taskLines.push('');
    pIdx++;
  });

  let tasksListStr = taskLines.join('\n').trim();
  if (!tasksListStr) {
    tasksListStr = '• لا توجد مهام متوقفة حالياً مسندة إليكم.';
  }

  let fullMessage = '';
  if (customTemplate && customTemplate.includes('{tasks_list}')) {
    fullMessage = customTemplate
      .replace(/\{name\}/g, member.name)
      .replace(/\{tasks_list\}/g, tasksListStr);
  } else {
    fullMessage = `سلام عليكم م. ${member.name}
نرجو التكرم بمتابعة المهام والمتطلبات الميدانية المتوقفة عليكم:

${tasksListStr}

شاكرين لكم حسن تعاونكم ومقدرين سرعة الإنجاز.
شركة محمد سعد لأعمال المرافق والإنشاءات`;
  }

  let link = '';
  if (cleanPhone) {
    link = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(fullMessage)}`;
  } else {
    link = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
  }

  return {
    link,
    pendingCount: pendingItems.length,
    message: fullMessage,
    cleanPhone,
  };
}

/**
 * Returns the exact string URL for WhatsApp
 */
export function createMemberAllPendingTasksWhatsAppLink(
  member: TeamMember,
  allTasks: Task[],
  projects: Project[],
  customTemplate?: string
): string {
  return createMemberAllPendingTasksWhatsAppDigest(member, allTasks, projects, customTemplate).link;
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
