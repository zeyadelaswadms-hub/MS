import * as XLSX from 'xlsx';
import { Project, TeamMember, Task, SubTask, SubTaskStatus, TaskPriority, TaskStatus } from '../types';
import { enforceTransitionRuleOnSubtasks } from './pipelineUtils';

// Helper to translate status to Arabic
const taskStatusToArabic = (s: TaskStatus): string => {
  switch (s) {
    case 'completed': return 'مكتملة';
    case 'in_progress': return 'قيد التنفيذ';
    case 'delayed': return 'متأخرة';
    default: return 'لم تبدأ';
  }
};

const subtaskStatusToArabic = (s: SubTaskStatus): string => {
  switch (s) {
    case 'completed': return 'مكتملة';
    case 'in_progress': return 'قيد التنفيذ';
    case 'blocked': return 'معطلة';
    default: return 'في الانتظار';
  }
};

const priorityToArabic = (p: TaskPriority): string => {
  switch (p) {
    case 'urgent': return 'عاجلة';
    case 'high': return 'مرتفعة';
    case 'low': return 'منخفضة';
    default: return 'متوسطة';
  }
};

const arabicToTaskStatus = (text?: string): TaskStatus => {
  if (!text) return 'not_started';
  const t = text.trim().toLowerCase();
  if (t.includes('مكتمل') || t.includes('completed')) return 'completed';
  if (t.includes('تنفيذ') || t.includes('جار') || t.includes('progress')) return 'in_progress';
  if (t.includes('متأخر') || t.includes('متاخر') || t.includes('delayed')) return 'delayed';
  return 'not_started';
};

const arabicToSubtaskStatus = (text?: string): SubTaskStatus => {
  if (!text) return 'pending';
  const t = text.trim().toLowerCase();
  if (t.includes('مكتمل') || t.includes('completed') || t === 'done') return 'completed';
  if (t.includes('تنفيذ') || t.includes('جار') || t.includes('progress')) return 'in_progress';
  if (t.includes('معطل') || t.includes('موقف') || t.includes('blocked')) return 'blocked';
  return 'pending';
};

const arabicToPriority = (text?: string): TaskPriority => {
  if (!text) return 'medium';
  const t = text.trim().toLowerCase();
  if (t.includes('عاجل') || t.includes('urgent')) return 'urgent';
  if (t.includes('مرتفع') || t.includes('high')) return 'high';
  if (t.includes('منخفض') || t.includes('low')) return 'low';
  return 'medium';
};

/**
 * Robust Arabic text normalization:
 * - Unifies Alef forms (أ, إ, آ, ا, ٱ) -> ا
 * - Unifies Taa Marbuta (ة) -> ه
 * - Unifies Yaa & Alef Maqsura (ي, ى) -> ي
 * - Removes all Tashkeel / diacritics
 * - Normalizes multiple spaces and punctuation
 */
export const normalizeArabic = (text?: string): string => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel
    .replace(/[إأآاٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/[\s\-_/\\,.:;]+/g, ' ');
};

/**
 * Strips common project prefixes like 'مشروع ' to match flexibly
 */
export const normalizeProjectLookup = (text?: string): string => {
  if (!text) return '';
  let norm = normalizeArabic(text);
  norm = norm.replace(/^مشروع\s+/, '');
  norm = norm.replace(/^project\s+/i, '');
  return norm.trim();
};

/**
 * Export complete 3-sheet database to Excel (.xlsx):
 * Sheet 1: المشاريع (Projects)
 * Sheet 2: فريق العمل (Team Members)
 * Sheet 3: المهام والمسارات التسلسلية (Tasks & Pipelines)
 */
export const exportDatabaseToExcel = (
  projects: Project[],
  teamMembers: TeamMember[],
  tasks: Task[],
  fileName?: string
) => {
  const wb = XLSX.utils.book_new();

  // 1. Projects Sheet
  const projectsData = projects.map(p => {
    const manager = teamMembers.find(m => m.id === p.projectManagerId);
    return {
      'معرف المشروع': p.id,
      'اسم المشروع': p.name,
      'كود المشروع': p.code,
      'العميل': p.client || '',
      'الموقع الميداني': p.location || '',
      'مدير المشروع': manager?.name || p.projectManagerId || '',
      'تاريخ البدء': p.startDate || '',
      'تاريخ التسليم المتوقع': p.expectedEndDate || '',
      'الميزانية': p.budget || '',
      'حالة المشروع': p.status === 'completed' ? 'مكتمل' : p.status === 'paused' ? 'متوقف' : 'نشط',
      'لون المشروع': p.color || '#0891b2',
    };
  });

  const wsProjects = XLSX.utils.json_to_sheet(projectsData);
  wsProjects['!cols'] = [
    { wch: 16 }, // ID
    { wch: 25 }, // Name
    { wch: 14 }, // Code
    { wch: 18 }, // Client
    { wch: 22 }, // Location
    { wch: 18 }, // Manager
    { wch: 14 }, // Start
    { wch: 14 }, // End
    { wch: 14 }, // Budget
    { wch: 12 }, // Status
    { wch: 10 }, // Color
  ];
  XLSX.utils.book_append_sheet(wb, wsProjects, 'المشاريع');

  // 2. Team Members Sheet
  const teamData = teamMembers.map(m => ({
    'معرف العضو': m.id,
    'الاسم الكامل': m.name,
    'نوع العضو': m.memberType === 'collaborator' ? 'متعاون / خارجي' : 'داخلي',
    'الجهة أو المكتب': m.organization || (m.memberType === 'collaborator' ? 'جهة خارجية' : 'شركة محمد سعد'),
    'رقم الهاتف': m.phone,
    'الدور / المسمى الوظيفي': m.role,
    'البريد الإلكتروني': m.email || '',
    'لون الصورة الرمزية': m.avatarColor || 'bg-[#088395]',
  }));

  const wsTeam = XLSX.utils.json_to_sheet(teamData);
  wsTeam['!cols'] = [
    { wch: 16 }, // ID
    { wch: 22 }, // Name
    { wch: 18 }, // Type
    { wch: 25 }, // Org
    { wch: 16 }, // Phone
    { wch: 20 }, // Role
    { wch: 24 }, // Email
    { wch: 16 }, // Color
  ];
  XLSX.utils.book_append_sheet(wb, wsTeam, 'فريق العمل');

  // 3. Tasks & Pipelines Sheet
  const tasksData = tasks.map(t => {
    const proj = projects.find(p => p.id === t.projectId);
    const mainAssignee = teamMembers.find(m => m.id === t.assignedMemberId);

    const row: Record<string, any> = {
      'معرف المهمة': t.id,
      'اسم المشروع': proj?.name || t.projectId,
      'كود المشروع': proj?.code || '',
      'عنوان المهمة': t.title,
      'الوصف والتفاصيل': t.description || '',
      'المشرف الرئيسي': mainAssignee?.name || t.assignedMemberId,
      'الأولوية': priorityToArabic(t.priority),
      'حالة المهمة': taskStatusToArabic(t.status),
      'تاريخ البدء': t.startDate || '',
      'موعد التسليم': t.expectedClosingDate || '',
      'رابط خارجي أو شيت': t.externalLink || '',
      'اسم الرابط': t.externalLinkLabel || '',
      'رابط الصورة': t.imageUrl || '',
      'وصف الصورة': t.imageCaption || '',
    };

    // Sort subtasks by order
    const sortedSubtasks = [...(t.subtasks || [])].sort((a, b) => a.order - b.order);

    // Dynamic up to 8 subtasks
    for (let i = 1; i <= 8; i++) {
      const st = sortedSubtasks[i - 1];
      const stepAssignee = st ? teamMembers.find(m => m.id === st.assignedMemberId) : undefined;
      row[`خطوة ${i} - العنوان`] = st?.title || '';
      row[`خطوة ${i} - المسؤول`] = stepAssignee?.name || st?.assignedMemberId || '';
      row[`خطوة ${i} - الحالة`] = st ? subtaskStatusToArabic(st.status) : '';
      row[`خطوة ${i} - مسار الانتقال`] = st?.transitionNote || '';
      row[`خطوة ${i} - حالة مسار الانتقال`] = st?.transitionStatus ? subtaskStatusToArabic(st.transitionStatus) : '';
      row[`خطوة ${i} - الأيام التقديرية`] = st?.estimatedDays ?? (st ? 1 : '');
    }

    return row;
  });

  const wsTasks = XLSX.utils.json_to_sheet(tasksData);
  // Give task columns good widths
  wsTasks['!cols'] = [
    { wch: 16 }, // معرف المهمة
    { wch: 22 }, // اسم المشروع
    { wch: 12 }, // كود المشروع
    { wch: 28 }, // عنوان المهمة
    { wch: 32 }, // الوصف
    { wch: 18 }, // المشرف
    { wch: 12 }, // الأولوية
    { wch: 12 }, // الحالة
    { wch: 14 }, // تاريخ البدء
    { wch: 14 }, // موعد التسليم
    { wch: 28 }, // رابط
    { wch: 18 }, // اسم الرابط
    { wch: 20 }, // رابط صورة
    { wch: 18 }, // وصف صورة
    // 8 steps x 6 columns
    ...Array(8).fill([
      { wch: 22 }, // عنوان
      { wch: 16 }, // مسؤول
      { wch: 12 }, // حالة
      { wch: 20 }, // مسار انتقال
      { wch: 14 }, // حالة مسار انتقال
      { wch: 10 }, // أيام
    ]).flat(),
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'المهام والمسارات');

  const defaultName = `قاعدة_بيانات_المشاريع_والمهام_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName || defaultName);
};

/**
 * Flexible column extractor helper
 */
const getFlexibleVal = (row: Record<string, any>, aliases: string[]): string => {
  if (!row || typeof row !== 'object') return '';
  for (const key of Object.keys(row)) {
    const cleanKey = key.trim().toLowerCase();
    for (const alias of aliases) {
      if (cleanKey.includes(alias.toLowerCase())) {
        const val = row[key];
        return val !== undefined && val !== null ? String(val).trim() : '';
      }
    }
  }
  return '';
};

/**
 * Parse complete 3-sheet database from an Excel workbook (.xlsx / .xls)
 * Supports 'merge' and 'replace' modes with robust multi-layered Arabic normalization,
 * project code matching (PRJ-01), ID matching, and prefix-free matching.
 */
export const parseDatabaseFromWorkbook = (
  workbook: XLSX.WorkBook,
  existingProjects: Project[],
  existingMembers: TeamMember[],
  mode: 'merge' | 'replace' = 'replace'
): {
  projects: Project[];
  teamMembers: TeamMember[];
  tasks: Task[];
  stats: { projectsCount: number; membersCount: number; tasksCount: number };
} => {
  const sheetNames = workbook.SheetNames;

  // Helper to read header row of any sheet for content-based detection
  const getSheetHeaders = (sName: string): string[] => {
    try {
      const s = workbook.Sheets[sName];
      if (!s) return [];
      const rows: any[] = XLSX.utils.sheet_to_json(s, { header: 1 });
      if (rows && rows.length > 0 && Array.isArray(rows[0])) {
        return rows[0].map(c => String(c || '').trim().toLowerCase());
      }
      return [];
    } catch {
      return [];
    }
  };

  // 1. Detect Team Sheet (by name or content)
  let teamSheetName = sheetNames.find(n => 
    n.includes('فريق') || n.toLowerCase().includes('team') || n.toLowerCase().includes('member')
  );
  if (!teamSheetName) {
    teamSheetName = sheetNames.find(n => {
      const h = getSheetHeaders(n);
      return h.some(k => k.includes('هاتف') || k.includes('phone') || k.includes('الدور') || k.includes('وظيفة'));
    });
  }

  // 2. Detect Tasks Sheet (by name or content)
  let taskSheetName = sheetNames.find(n => 
    n.includes('مهام') || n.toLowerCase().includes('task')
  );
  if (!taskSheetName) {
    taskSheetName = sheetNames.find(n => {
      const h = getSheetHeaders(n);
      return h.some(k => k.includes('عنوان المهمة') || k.includes('المهمة') || k.includes('خطوة') || k.includes('مسار'));
    });
  }

  // 3. Detect Projects Sheet (by name or content)
  let projectSheetName = sheetNames.find(n => 
    (n.includes('مشاريع') || n.toLowerCase().includes('project')) && n !== taskSheetName
  );
  if (!projectSheetName) {
    projectSheetName = sheetNames.find(n => {
      if (n === taskSheetName || n === teamSheetName) return false;
      const h = getSheetHeaders(n);
      return h.some(k => k.includes('كود المشروع') || k.includes('الميزانية') || (k.includes('المشروع') && !k.includes('عنوان')));
    });
  }

  // Fallback if tasks sheet still not detected
  if (!taskSheetName && sheetNames.length > 0) {
    taskSheetName = sheetNames.find(n => n !== teamSheetName && n !== projectSheetName) || sheetNames[0];
  }
  
  const parsedMembers: TeamMember[] = mode === 'replace' && teamSheetName ? [] : [...existingMembers];

  if (teamSheetName) {
    const rawTeam: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[teamSheetName], { defval: '' });
    rawTeam.forEach((row, idx) => {
      const name = getFlexibleVal(row, ['الاسم', 'اسم العضو', 'name', 'عضو']);
      if (!name) return;
      const phone = getFlexibleVal(row, ['الهاتف', 'رقم الهاتف', 'phone', 'mobile']) || '0500000000';
      const role = getFlexibleVal(row, ['الدور', 'الوظيفة', 'المسمى', 'role']) || 'مشرف موقع';
      const email = getFlexibleVal(row, ['البريد', 'email']) || undefined;
      const avatarColor = getFlexibleVal(row, ['لون', 'color']) || 'bg-[#088395]';
      const id = getFlexibleVal(row, ['معرف', 'معرف العضو', 'id']) || `mem-import-${Date.now()}-${idx + 1}`;
      
      const typeText = getFlexibleVal(row, ['نوع العضو', 'النوع', 'فريق', 'memberType']);
      const isCollaborator = typeText.includes('تعاون') || typeText.includes('خارج') || typeText.includes('استشار') || typeText.toLowerCase().includes('collaborator');
      const memberType: 'internal' | 'collaborator' = isCollaborator ? 'collaborator' : 'internal';
      const organization = getFlexibleVal(row, ['الجهة أو المكتب', 'الجهة', 'المكتب', 'الشركة', 'الجهة التابع لها', 'organization']) || undefined;

      const normName = normalizeArabic(name);
      const existingIdx = parsedMembers.findIndex(m => normalizeArabic(m.name) === normName || m.id === id);

      const memberObj: TeamMember = {
        id: existingIdx >= 0 ? parsedMembers[existingIdx].id : id,
        name,
        phone,
        role,
        email,
        avatarColor,
        memberType,
        organization,
      };

      if (existingIdx >= 0) {
        parsedMembers[existingIdx] = memberObj;
      } else {
        parsedMembers.push(memberObj);
      }
    });
  }

  // Ensure at least one fallback member exists
  if (parsedMembers.length === 0) {
    parsedMembers.push(existingMembers[0] || {
      id: 'admin',
      name: 'م. محمد سعد',
      role: 'المدير التنفيذي',
      phone: '0500000000',
      avatarColor: 'bg-[#088395]'
    });
  }

  // Member resolver
  const resolveMemberId = (query?: string): string => {
    if (!query) return parsedMembers[0].id;
    const cleanQuery = query.trim();
    const normQuery = normalizeArabic(cleanQuery);

    // 1. By ID
    const byId = parsedMembers.find(m => m.id === cleanQuery);
    if (byId) return byId.id;

    // 2. By Normalized Name
    const byNorm = parsedMembers.find(m => normalizeArabic(m.name) === normQuery);
    if (byNorm) return byNorm.id;

    // 3. By Substring
    const bySub = parsedMembers.find(m => 
      normQuery.includes(normalizeArabic(m.name)) || normalizeArabic(m.name).includes(normQuery)
    );
    if (bySub) return bySub.id;

    return parsedMembers[0].id;
  };

  // 2. Parse Projects

  // In replace mode, if projects sheet exists, start clean without previous mock projects!
  const parsedProjects: Project[] = (mode === 'replace' && projectSheetName) ? [] : [...existingProjects];

  if (projectSheetName) {
    const rawProjects: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[projectSheetName], { defval: '' });
    rawProjects.forEach((row, idx) => {
      const name = getFlexibleVal(row, ['اسم المشروع', 'المشروع', 'name', 'project']);
      if (!name) return;
      const code = getFlexibleVal(row, ['كود المشروع', 'كود', 'code']) || `PRJ-${String(parsedProjects.length + 1).padStart(2, '0')}`;
      const client = getFlexibleVal(row, ['العميل', 'client']) || 'عميل عام';
      const location = getFlexibleVal(row, ['الموقع الميداني', 'الموقع', 'location']) || 'الموقع الميداني';
      const managerName = getFlexibleVal(row, ['مدير المشروع', 'المدير', 'manager']);
      const managerId = resolveMemberId(managerName);
      const startDate = getFlexibleVal(row, ['تاريخ البدء', 'بدء', 'start']) || new Date().toISOString().slice(0, 10);
      const expectedEndDate = getFlexibleVal(row, ['تاريخ التسليم', 'تسليم', 'end']) || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
      const budget = getFlexibleVal(row, ['الميزانية', 'budget']) || undefined;
      const statusText = getFlexibleVal(row, ['حالة المشروع', 'الحالة', 'status']);
      const color = getFlexibleVal(row, ['لون', 'color']) || '#0891b2';
      const id = getFlexibleVal(row, ['معرف المشروع', 'معرف', 'id']) || `prj-import-${Date.now()}-${idx + 1}`;

      const normName = normalizeArabic(name);
      const cleanCode = code.trim().toUpperCase();

      // Check existing project by ID, exact Code, or Normalized Name
      const existingIdx = parsedProjects.findIndex(p => 
        p.id === id || 
        (p.code && p.code.trim().toUpperCase() === cleanCode) || 
        normalizeArabic(p.name) === normName
      );

      const projectObj: Project = {
        id: existingIdx >= 0 ? parsedProjects[existingIdx].id : id,
        name,
        code,
        client,
        location,
        projectManagerId: managerId,
        startDate,
        expectedEndDate,
        budget,
        status: statusText.includes('مكتمل') ? 'completed' : statusText.includes('متوقف') ? 'paused' : 'active',
        color,
      };

      if (existingIdx >= 0) {
        parsedProjects[existingIdx] = projectObj;
      } else {
        parsedProjects.push(projectObj);
      }
    });
  }

  // Multi-layered Project Resolver for linking tasks to projects
  const resolveProject = (
    taskProjectName?: string, 
    taskProjectCode?: string, 
    taskProjectId?: string
  ): Project => {
    // 1. By direct ID
    if (taskProjectId) {
      const byId = parsedProjects.find(p => p.id === taskProjectId.trim());
      if (byId) return byId;
    }

    // 2. By Project Code (PRJ-01, etc.)
    if (taskProjectCode) {
      const cleanCode = taskProjectCode.trim().toUpperCase();
      const byCode = parsedProjects.find(p => p.code && p.code.trim().toUpperCase() === cleanCode);
      if (byCode) return byCode;
    }

    // 3. By Exact Project Name
    if (taskProjectName) {
      const cleanName = taskProjectName.trim().toLowerCase();
      const byExact = parsedProjects.find(p => p.name.trim().toLowerCase() === cleanName);
      if (byExact) return byExact;

      // 4. By Normalized Arabic Name (removing hamzas, taa-marbuta, etc.)
      const normName = normalizeArabic(taskProjectName);
      const byNorm = parsedProjects.find(p => normalizeArabic(p.name) === normName);
      if (byNorm) return byNorm;

      // 5. By Stripped Project Name (without prefix 'مشروع ')
      const stripped = normalizeProjectLookup(taskProjectName);
      const byStripped = parsedProjects.find(p => normalizeProjectLookup(p.name) === stripped);
      if (byStripped) return byStripped;

      // 6. By Substring Inclusion
      const bySub = parsedProjects.find(p => {
        const pNorm = normalizeProjectLookup(p.name);
        return (stripped.length >= 3 && pNorm.includes(stripped)) || (pNorm.length >= 3 && stripped.includes(pNorm));
      });
      if (bySub) return bySub;
    }

    // 7. If there's only 1 project in the whole database, link to it
    if (parsedProjects.length === 1) {
      return parsedProjects[0];
    }

    // 8. Auto-create project if name is specified and not matched
    const validName = taskProjectName?.trim() || 'مشروع عام';
    const newProjId = `prj-auto-${Date.now()}-${parsedProjects.length + 1}`;
    const newProj: Project = {
      id: newProjId,
      name: validName,
      code: taskProjectCode?.trim() || `PRJ-${String(parsedProjects.length + 1).padStart(2, '0')}`,
      client: 'عميل عام',
      location: 'ميداني',
      projectManagerId: parsedMembers[0].id,
      startDate: new Date().toISOString().slice(0, 10),
      expectedEndDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      status: 'active',
      color: '#0891b2',
    };
    parsedProjects.push(newProj);
    return newProj;
  };

  // 3. Parse Tasks & Pipelines

  const parsedTasks: Task[] = [];

  if (taskSheetName) {
    const rawTasks: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[taskSheetName], { defval: '' });
    rawTasks.forEach((row, idx) => {
      const title = getFlexibleVal(row, ['عنوان المهمة', 'المهمة', 'task title', 'task', 'title']);
      if (!title) return;

      const projectName = getFlexibleVal(row, ['اسم المشروع', 'المشروع', 'project name', 'project']);
      const projectCode = getFlexibleVal(row, ['كود المشروع', 'كود', 'project code', 'code']);
      const projectIdRaw = getFlexibleVal(row, ['معرف المشروع', 'project id']);

      // Resolve the project cleanly
      const resolvedProject = resolveProject(projectName, projectCode, projectIdRaw);
      const projectId = resolvedProject.id;

      const supervisorName = getFlexibleVal(row, ['المشرف الرئيسي', 'المشرف', 'المسؤول', 'supervisor', 'assignee']);
      const assignedMemberId = resolveMemberId(supervisorName);

      const priority = arabicToPriority(getFlexibleVal(row, ['الأولوية', 'priority']));
      const status = arabicToTaskStatus(getFlexibleVal(row, ['حالة المهمة', 'الحالة', 'status']));
      const description = getFlexibleVal(row, ['الوصف والتفاصيل', 'الوصف', 'تفاصيل', 'description']) || '';
      const startDate = getFlexibleVal(row, ['تاريخ البدء', 'start']) || undefined;
      const expectedClosingDate = getFlexibleVal(row, ['موعد التسليم', 'تاريخ التسليم', 'deadline', 'date']) || undefined;
      const externalLink = getFlexibleVal(row, ['رابط خارجي أو شيت', 'رابط خارجي', 'شيت', 'رابط', 'link', 'url']) || undefined;
      const externalLinkLabel = getFlexibleVal(row, ['اسم الرابط', 'عنوان الرابط', 'label']) || undefined;
      const imageUrl = getFlexibleVal(row, ['رابط الصورة', 'image', 'photo']) || undefined;
      const imageCaption = getFlexibleVal(row, ['وصف الصورة', 'caption']) || undefined;
      const taskId = getFlexibleVal(row, ['معرف المهمة', 'معرف', 'id']) || `tsk-import-${Date.now()}-${idx + 1}`;

      // Extract subtasks up to 12 steps
      const subtasks: SubTask[] = [];
      for (let s = 1; s <= 12; s++) {
        const stepTitle = getFlexibleVal(row, [`خطوة ${s} - العنوان`, `خطوة ${s}`, `خطوة${s}`, `step ${s}`]);
        if (!stepTitle) continue;

        const stepAssigneeName = getFlexibleVal(row, [`خطوة ${s} - المسؤول`, `مسؤول ${s}`]);
        const stepMemberId = resolveMemberId(stepAssigneeName) || assignedMemberId;
        const stepStatus = arabicToSubtaskStatus(getFlexibleVal(row, [`خطوة ${s} - الحالة`, `حالة ${s}`]));
        const stepTransitionNote = getFlexibleVal(row, [`خطوة ${s} - مسار الانتقال`, `مسار انتقال ${s}`, `مسار ${s}`]) || 'مسار الانتقال';
        const stepTransitionStatus = arabicToSubtaskStatus(getFlexibleVal(row, [`خطوة ${s} - حالة مسار الانتقال`, `حالة مسار ${s}`]));
        const stepDays = parseInt(getFlexibleVal(row, [`خطوة ${s} - الأيام التقديرية`, `خطوة ${s} - الأيام`, `أيام ${s}`, `days`])) || 1;

        subtasks.push({
          id: `sub-import-${Date.now()}-${idx}-${s}`,
          order: s,
          title: stepTitle,
          assignedMemberId: stepMemberId,
          status: stepStatus,
          transitionNote: stepTransitionNote,
          transitionStatus: stepTransitionStatus,
          estimatedDays: stepDays,
        });
      }

      // Default subtasks if none specified
      if (subtasks.length === 0) {
        subtasks.push({
          id: `sub-import-${Date.now()}-${idx}-1`,
          order: 1,
          title: 'بدء التنفيذ والتحضير',
          assignedMemberId,
          status: 'pending',
          transitionNote: 'مسار الانتقال والاعتماد',
          estimatedDays: 1,
        });
        subtasks.push({
          id: `sub-import-${Date.now()}-${idx}-2`,
          order: 2,
          title: 'الفحص والتسليم النهائي',
          assignedMemberId,
          status: 'pending',
          transitionNote: '',
          estimatedDays: 2,
        });
      }

      // Enforce sequential transition rule
      const finalizedSubtasks = enforceTransitionRuleOnSubtasks(subtasks);

      parsedTasks.push({
        id: taskId,
        projectId,
        title,
        description,
        assignedMemberId,
        priority,
        status,
        startDate,
        expectedClosingDate,
        createdAt: new Date().toISOString(),
        subtasks: finalizedSubtasks,
        externalLink,
        externalLinkLabel,
        imageUrl,
        imageCaption,
      });
    });
  }

  return {
    projects: parsedProjects,
    teamMembers: parsedMembers,
    tasks: parsedTasks,
    stats: {
      projectsCount: parsedProjects.length,
      membersCount: parsedMembers.length,
      tasksCount: parsedTasks.length,
    },
  };
};
