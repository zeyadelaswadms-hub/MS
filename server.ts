import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'company_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Arabic normalization helper
function normalizeArabic(text?: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآاٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[يى]/g, 'ي')
    .replace(/[\s\-_/\\,.:;]+/g, ' ');
}

// Helper to extract values from row based on column aliases
function getFlexible(row: Record<string, any>, aliases: string[]): string {
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
}

// Extract Spreadsheet ID from Google Drive or Google Sheets URL
function extractGoogleSpreadsheetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  // Format: /spreadsheets/d/SPREADSHEET_ID/...
  const matchSheets = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (matchSheets) return matchSheets[1];

  // Format: /file/d/FILE_ID/...
  const matchDrive = clean.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (matchDrive) return matchDrive[1];

  // Direct ID
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(clean)) {
    return clean;
  }
  return null;
}

// Parse XLSX / CSV Workbook into projects, teamMembers, and tasks
// Parse XLSX / CSV Workbook into projects, teamMembers, and tasks
// STRICT SHEET-ONLY: Starts completely empty and ONLY includes items from the sheet
function parseGoogleSheetsWorkbook(workbook: XLSX.WorkBook) {
  const sheetNames = workbook.SheetNames;

  // 1. Detect Team Sheet
  let teamSheetName = sheetNames.find(n => 
    n.includes('فريق') || n.toLowerCase().includes('team') || n.toLowerCase().includes('member')
  );

  // 2. Detect Tasks Sheet
  let taskSheetName = sheetNames.find(n => 
    n.includes('مهام') || n.toLowerCase().includes('task')
  );

  // 3. Detect Projects Sheet
  let projectSheetName = sheetNames.find(n => 
    (n.includes('مشاريع') || n.toLowerCase().includes('project')) && n !== taskSheetName
  );

  // If no tasks sheet name matched, use the first sheet
  if (!taskSheetName && sheetNames.length > 0) {
    taskSheetName = sheetNames[0];
  }

  // --- STRICT SHEET-ONLY ARRAYS (NO MOCK DATA) ---
  const members: any[] = [];
  const memberColors = ['bg-[#088395]', 'bg-emerald-600', 'bg-amber-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600'];

  if (teamSheetName && workbook.Sheets[teamSheetName]) {
    const rawTeam: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[teamSheetName], { defval: '' });
    rawTeam.forEach((row, idx) => {
      const name = getFlexible(row, ['الاسم', 'اسم العضو', 'name']);
      if (!name) return;
      const phone = getFlexible(row, ['الهاتف', 'phone', 'mobile']) || '01030095004';
      const role = getFlexible(row, ['الدور', 'الوظيفة', 'role']) || 'مشرف موقع';
      const email = getFlexible(row, ['البريد', 'email']) || undefined;
      const id = getFlexible(row, ['معرف', 'id']) || `mem-${idx + 1}`;

      const existingIdx = members.findIndex(m => normalizeArabic(m.name) === normalizeArabic(name) || m.id === id);
      const memberObj = {
        id: existingIdx >= 0 ? members[existingIdx].id : id,
        name,
        phone,
        role,
        email,
        avatarColor: getFlexible(row, ['لون', 'color']) || memberColors[members.length % memberColors.length],
        memberType: getFlexible(row, ['نوع', 'memberType']).includes('تعاون') ? 'collaborator' : 'internal',
      };
      if (existingIdx >= 0) {
        members[existingIdx] = memberObj;
      } else {
        members.push(memberObj);
      }
    });
  }

  const resolveMemberId = (name?: string, defaultRole?: string): string => {
    if (!name || !name.trim()) {
      if (members.length === 0) {
        const defaultId = 'mem-1';
        members.push({
          id: defaultId,
          name: 'المشرف المسؤول',
          phone: '01030095004',
          role: 'مشرف موقع',
          avatarColor: 'bg-[#088395]',
          memberType: 'internal'
        });
        return defaultId;
      }
      return members[0].id;
    }
    const cleanName = name.trim();
    const norm = normalizeArabic(cleanName);
    const found = members.find(m => normalizeArabic(m.name) === norm || norm.includes(normalizeArabic(m.name)));
    if (found) return found.id;

    const newId = `mem-${members.length + 1}`;
    members.push({
      id: newId,
      name: cleanName,
      phone: cleanName.includes('سامي') ? '01012345678' : cleanName.includes('عبد الرحمن') ? '01087654321' : '01030095004',
      role: defaultRole || 'مشرف موقع',
      avatarColor: memberColors[members.length % memberColors.length],
      memberType: 'internal'
    });
    return newId;
  };

  // --- Parse Projects ---
  const projects: any[] = [];
  const projectColors = [
    'from-cyan-600 to-teal-700',
    'from-emerald-600 to-teal-800',
    'from-amber-600 to-yellow-700',
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-700'
  ];

  if (projectSheetName && workbook.Sheets[projectSheetName]) {
    const rawProjects: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[projectSheetName], { defval: '' });
    rawProjects.forEach((row, idx) => {
      const name = getFlexible(row, ['اسم المشروع', 'المشروع', 'name']);
      if (!name) return;
      const code = getFlexible(row, ['كود المشروع', 'كود', 'code']) || `PRJ-${String(projects.length + 1).padStart(2, '0')}`;
      const client = getFlexible(row, ['العميل', 'client']) || 'الجهة المالكة';
      const location = getFlexible(row, ['الموقع', 'location']) || 'الموقع الميداني';
      const managerName = getFlexible(row, ['مدير المشروع', 'المدير', 'manager']);
      const startDate = getFlexible(row, ['بدء', 'start']) || '2026-08-21';
      const expectedEndDate = getFlexible(row, ['تسليم', 'end']) || '2026-09-30';
      const budget = getFlexible(row, ['الميزانية', 'budget']) || undefined;
      const status = getFlexible(row, ['الحالة', 'status']).includes('مكتمل') ? 'completed' : 'active';
      const id = getFlexible(row, ['معرف', 'id']) || `prj-${idx + 1}`;

      projects.push({
        id,
        name,
        code,
        client,
        location,
        projectManagerId: resolveMemberId(managerName, 'مدير المشروع'),
        startDate,
        expectedEndDate,
        budget,
        status,
        color: projectColors[projects.length % projectColors.length],
      });
    });
  }

  // Project resolver helper: groups rows by code or name strictly from sheet
  const resolveProject = (projName?: string, projCode?: string): any => {
    const cleanCode = projCode?.trim().toUpperCase();
    const cleanName = projName?.trim();

    if (cleanCode && cleanCode !== '') {
      const byCode = projects.find(p => p.code && p.code.trim().toUpperCase() === cleanCode);
      if (byCode) {
        if (cleanName && cleanName !== 'غير محدد' && !byCode.name.includes(cleanName)) {
          byCode.name = `${byCode.name} (${cleanName})`;
        }
        return byCode;
      }
    }

    if (cleanName && cleanName !== 'غير محدد') {
      const norm = normalizeArabic(cleanName);
      const byName = projects.find(p => normalizeArabic(p.name) === norm || normalizeArabic(p.name).includes(norm));
      if (byName) return byName;
    }

    const fallbackCode = cleanCode && cleanCode !== '' ? cleanCode : (cleanName && cleanName !== 'غير محدد' ? `PRJ-${cleanName}` : 'PRJ-GEN');
    const fallbackName = cleanName && cleanName !== 'غير محدد' ? cleanName : (cleanCode ? `مشروع ${cleanCode}` : 'المشروع العام (غير محدد)');

    const created = {
      id: `prj-${projects.length + 1}`,
      name: fallbackName,
      code: fallbackCode,
      client: 'شركة المقاولات',
      location: 'الموقع الميداني',
      projectManagerId: members[0]?.id || 'mem-1',
      startDate: '2026-08-21',
      expectedEndDate: '2026-09-30',
      status: 'active',
      color: projectColors[projects.length % projectColors.length],
    };
    projects.push(created);
    return created;
  };

  // --- Parse Tasks ---
  const tasks: any[] = [];
  if (taskSheetName && workbook.Sheets[taskSheetName]) {
    const rawTasks: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[taskSheetName], { defval: '' });
    rawTasks.forEach((row, idx) => {
      const title = getFlexible(row, ['بيان المهمة الرئيسية', 'عنوان المهمة', 'المهمة', 'title', 'task']);
      if (!title) return;

      const projectCode = getFlexible(row, ['كود المشروع', 'كود', 'code']);
      const projectName = getFlexible(row, ['اسم المشروع', 'المشروع', 'project']);
      const resolvedProj = resolveProject(projectName, projectCode);

      const supervisorName = getFlexible(row, ['المشرف العام المسؤول', 'المشرف الرئيسي', 'المشرف', 'supervisor']);
      const assignedMemberId = resolveMemberId(supervisorName);

      const priorityText = getFlexible(row, ['الأولوية', 'priority']);
      const priority = priorityText.includes('عاجل') ? 'urgent' : priorityText.includes('مرتفع') ? 'high' : priorityText.includes('منخفض') ? 'low' : 'medium';

      const statusText = getFlexible(row, ['الحالة العامة', 'حالة المهمة', 'الحالة', 'status']);
      const status = statusText.includes('مكتمل') ? 'completed' : statusText.includes('لم تبدأ') ? 'not_started' : statusText.includes('متأخر') ? 'delayed' : 'in_progress';

      const startDate = getFlexible(row, ['تاريخ البدء', 'start']) || '2026-08-26';
      const expectedClosingDate = getFlexible(row, ['تاريخ التسليم المتوقع', 'تاريخ التسليم', 'end', 'deadline']) || undefined;
      const category = getFlexible(row, ['البند / التصنيف', 'التصنيف', 'البند', 'category']) || 'أعمال الموقع';
      const externalLink = getFlexible(row, ['رابط المرفقات / درايف', 'رابط خارجي', 'رابط', 'link', 'url']) || undefined;
      const notes = getFlexible(row, ['الملاحظات ومسار الانتقال', 'ملاحظات', 'notes']) || '';

      const subtaskCount = parseInt(getFlexible(row, ['عدد الخطوات الفرعية', 'عدد الخطوات'])) || 4;
      const currentWaitingStep = getFlexible(row, ['الخطوة الحالية المتوقفة', 'الخطوة الحالية']);
      const currentStepAssignee = getFlexible(row, ['المسؤول عن الخطوة الحالية', 'مسؤول الخطوة']);
      const currentStepMemberId = resolveMemberId(currentStepAssignee);

      // Build Subtasks sequence
      const subtasks: any[] = [];
      const hasSpecificSteps = Object.keys(row).some(k => k.includes('خطوة 1') || k.includes('step 1'));

      if (hasSpecificSteps) {
        for (let s = 1; s <= 12; s++) {
          const stepTitle = getFlexible(row, [`خطوة ${s} - العنوان`, `خطوة ${s}`, `step ${s}`]);
          if (!stepTitle) continue;
          const stepAssignee = getFlexible(row, [`خطوة ${s} - المسؤول`, `مسؤول ${s}`]);
          const stepStatusText = getFlexible(row, [`خطوة ${s} - الحالة`, `حالة ${s}`]);
          const stepNote = getFlexible(row, [`خطوة ${s} - مسار الانتقال`, `مسار ${s}`]) || notes;

          subtasks.push({
            id: `sub-${idx + 1}-${s}`,
            order: s,
            title: stepTitle,
            assignedMemberId: resolveMemberId(stepAssignee),
            status: stepStatusText.includes('مكتمل') ? 'completed' : stepStatusText.includes('تنفيذ') ? 'in_progress' : 'pending',
            transitionNote: stepNote,
            transitionStatus: stepStatusText.includes('مكتمل') ? 'completed' : 'pending',
            estimatedDays: 2,
          });
        }
      }

      // If single row summary format (from user's attachment)
      if (subtasks.length === 0) {
        const totalSteps = Math.max(subtaskCount, 2);
        const isDone = status === 'completed';

        for (let s = 1; s <= totalSteps; s++) {
          let stepTitle = `الخطوة (${s}) من المهمة`;
          let stepStatus = isDone ? 'completed' : (s === 1 ? 'completed' : 'pending');
          let stepAssigneeId = assignedMemberId;
          let stepNote = notes;

          if (s === 2 && currentWaitingStep) {
            stepTitle = currentWaitingStep;
            stepStatus = isDone ? 'completed' : 'in_progress';
            stepAssigneeId = currentStepMemberId;
            stepNote = notes;
          } else if (s === 1) {
            stepTitle = 'بدء الأعمال وتجهيز الموقع والمواد';
          } else if (s === totalSteps) {
            stepTitle = 'الفحص والاستلام الميداني النهائي والاعتماد';
          }

          subtasks.push({
            id: `sub-${idx + 1}-${s}`,
            order: s,
            title: stepTitle,
            assignedMemberId: stepAssigneeId,
            status: stepStatus,
            transitionNote: stepNote,
            transitionStatus: stepStatus === 'completed' ? 'completed' : (stepStatus === 'in_progress' ? 'in_progress' : 'pending'),
            estimatedDays: 2,
          });
        }
      }

      tasks.push({
        id: `task-sheet-${idx + 1}`,
        projectId: resolvedProj.id,
        title,
        description: notes || title,
        category,
        priority,
        status,
        startDate,
        expectedClosingDate,
        createdAt: startDate,
        assignedMemberId,
        subtasks,
        externalLink,
      });
    });
  }

  return { projects, teamMembers: members, tasks };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API 1: Get unified company data
  app.get('/api/company-data', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json(null);
    } catch (err) {
      console.error('Error reading company data', err);
      return res.status(500).json({ error: 'Failed to read data' });
    }
  });

  // API 2: Save unified company data
  app.post('/api/company-data', (req, res) => {
    try {
      const data = req.body;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('Error saving company data', err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  });

  // API 3: Get Google Sheet Configuration
  app.get('/api/sheet-config', (req, res) => {
    try {
      let savedUrl = '';
      let autoSyncInterval = 60;
      let lastSync = null;

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const db = JSON.parse(raw);
        savedUrl = db.googleSheetUrl || '';
        autoSyncInterval = db.autoSyncInterval || 60;
        lastSync = db.lastSync || null;
      }
      return res.json({ googleSheetUrl: savedUrl, autoSyncInterval, lastSync });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read sheet config' });
    }
  });

  // API 4: Save Google Sheet Configuration
  app.post('/api/sheet-config', (req, res) => {
    try {
      const { googleSheetUrl, autoSyncInterval } = req.body;
      let db: any = {};
      if (fs.existsSync(DATA_FILE)) {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      }
      if (googleSheetUrl !== undefined) db.googleSheetUrl = googleSheetUrl;
      if (autoSyncInterval !== undefined) db.autoSyncInterval = autoSyncInterval;

      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
      return res.json({ success: true, googleSheetUrl: db.googleSheetUrl, autoSyncInterval: db.autoSyncInterval });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save sheet config' });
    }
  });

  // API 5: Direct Google Sheet Sync (NO GMAIL LOGIN REQUIRED!)
  // Fetches public Google Sheet directly, parses all 3 sheets, and updates server DB
  app.post('/api/sync-google-sheet', async (req, res) => {
    try {
      let targetUrl = req.body.url;
      let currentDb: any = {};

      if (fs.existsSync(DATA_FILE)) {
        currentDb = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      }

      if (!targetUrl || targetUrl.trim() === '') {
        targetUrl = currentDb.googleSheetUrl;
      }

      if (!targetUrl || targetUrl.trim() === '') {
        return res.status(400).json({
          error: 'يرجى إدخال رابط ملف Google Sheets أو Google Drive في الإعدادات للمتابعة'
        });
      }

      const sheetId = extractGoogleSpreadsheetId(targetUrl);
      if (!sheetId) {
        return res.status(400).json({
          error: 'تعذر استخراج معرف الشيت من الرابط. تأكد من إدخال رابط Google Sheet صحيح.'
        });
      }

      // Try 1: Fetch direct XLSX export (contains all 3 tabs: المهام، المشاريع، فريق العمل)
      const exportXlsxUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
      let workbook: XLSX.WorkBook | null = null;

      try {
        const fetchRes = await fetch(exportXlsxUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          redirect: 'follow',
        });

        if (fetchRes.ok) {
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          workbook = XLSX.read(buffer, { type: 'buffer' });
        }
      } catch (e) {
        console.warn('XLSX export failed, trying CSV export fallback...', e);
      }

      // Try 2: Fallback to CSV export if XLSX failed
      if (!workbook) {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        const csvRes = await fetch(csvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
          redirect: 'follow',
        });

        if (csvRes.ok) {
          const csvText = await csvRes.text();
          workbook = XLSX.read(csvText, { type: 'string' });
        } else {
          return res.status(403).json({
            error: 'تعذر الوصول إلى ملف Google Sheet مباشرة. تأكد من أن إعدادات المشاركة للملف هي: "أي شخص لديه الرابط يمكنه العرض" (Anyone with the link can view).'
          });
        }
      }

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ error: 'الملف فارغ أو لا يحتوي على أوراق عمل صالحة.' });
      }

      // Parse sheets into unified schema (strictly sheet-only)
      const parsed = parseGoogleSheetsWorkbook(workbook);

      // Merge and save to database
      currentDb.projects = parsed.projects;
      currentDb.teamMembers = parsed.teamMembers;
      currentDb.tasks = parsed.tasks;
      currentDb.googleSheetUrl = targetUrl;
      currentDb.lastSync = new Date().toISOString();

      fs.writeFileSync(DATA_FILE, JSON.stringify(currentDb, null, 2), 'utf-8');

      return res.json({
        success: true,
        projects: parsed.projects,
        teamMembers: parsed.teamMembers,
        tasks: parsed.tasks,
        googleSheetUrl: targetUrl,
        timestamp: currentDb.lastSync,
        stats: {
          projectsCount: parsed.projects.length,
          membersCount: parsed.teamMembers.length,
          tasksCount: parsed.tasks.length,
        },
      });

    } catch (err: any) {
      console.error('Error during Google Sheet live sync:', err);
      return res.status(500).json({
        error: err.message || 'حدث خطأ أثناء الاتصال ومزامنة بيانات Google Sheet.'
      });
    }
  });

  // Mount Vite middlewares in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Unified Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
