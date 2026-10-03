import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Task, Project, TeamMember } from '../types';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with Google Sheets & Drive Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

// In-memory access token cache (CRITICAL: never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google to get user and OAuth Access Token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('لم يتم استلام رمز الوصول (Access Token) من حساب Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Creates a new Google Spreadsheet in the user's Google Drive and populates it with tasks
 */
export async function exportTasksToGoogleSheets(
  tasks: Task[],
  projects: Project[],
  teamMembers: TeamMember[],
  sheetTitle?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحساب Google أولاً للمتابعة');
  }

  const title = sheetTitle || `بُنيان - تقرير ومتابعة المهام والمشاريع (${new Date().toLocaleDateString('ar-EG')})`;

  // 1. Create a new Spreadsheet via Google Sheets API v4
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        locale: 'ar_SA',
        autoRecalc: 'ON_CHANGE',
      },
      sheets: [
        {
          properties: {
            title: 'قائمة المهام والخطوات',
            rightToLeft: true,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'فشل في إنشاء ملف Google Sheets جديد');
  }

  const spreadsheetData = await createRes.json();
  const spreadsheetId = spreadsheetData.spreadsheetId;
  const spreadsheetUrl = spreadsheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Rows Data
  const headers = [
    'كود المشروع',
    'اسم المشروع',
    'بيان المهمة الرئيسية',
    'البند / التصنيف',
    'الأولوية',
    'الحالة العامة',
    'تاريخ البدء',
    'تاريخ التسليم المتوقع',
    'نسبة الإنجاز',
    'المشرف العام المسؤول',
    'عدد الخطوات الفرعية',
    'الخطوة الحالية المتوقفة',
    'المسؤول عن الخطوة الحالية',
    'الملاحظات ومسار الانتقال',
    'رابط المرفقات / درايف',
  ];

  const rows: any[][] = [headers];

  tasks.forEach(task => {
    const proj = projects.find(p => p.id === task.projectId);
    const mainAssignee = teamMembers.find(m => m.id === task.assignedMemberId);
    
    // Find active / waiting step
    const completedSteps = task.subtasks.filter(s => s.status === 'completed').length;
    const progress = task.subtasks.length > 0 ? Math.round((completedSteps / task.subtasks.length) * 100) : 0;
    const pendingStep = task.subtasks.find(s => s.status !== 'completed');
    const stepAssignee = pendingStep ? teamMembers.find(m => m.id === pendingStep.assignedMemberId) : null;

    let priorityAr = 'متوسطة';
    if (task.priority === 'urgent') priorityAr = 'عاجلة جداً';
    else if (task.priority === 'high') priorityAr = 'مرتفعة';
    else if (task.priority === 'low') priorityAr = 'منخفضة';

    let statusAr = 'قيد التنفيذ';
    if (task.status === 'completed' || progress === 100) statusAr = 'مكتملة ✅';
    else if (task.status === 'delayed') statusAr = 'متأخرة ⚠️';
    else if (task.status === 'not_started') statusAr = 'لم تبدأ ⏳';

    rows.push([
      proj?.code || '',
      proj?.name || 'غير محدد',
      task.title,
      task.category || 'عام',
      priorityAr,
      statusAr,
      task.startDate || task.createdAt.slice(0, 10),
      task.expectedClosingDate || 'لم يحدد',
      `${progress}%`,
      mainAssignee?.name || 'غير محدد',
      task.subtasks.length,
      pendingStep?.title || (progress === 100 ? 'تم استكمال كافة الخطوات' : 'لا يوجد'),
      stepAssignee?.name || '',
      pendingStep?.transitionNote || task.description || '',
      task.externalLink || '',
    ]);
  });

  // 3. Write rows to spreadsheet
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'قائمة المهام والخطوات'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'قائمة المهام والخطوات'!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!writeRes.ok) {
    const errData = await writeRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'فشل في حفظ بيانات المهام داخل ملف Google Sheets');
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Reads data from an existing Google Sheet by ID or URL
 */
export async function readTasksFromGoogleSheets(sheetIdOrUrl: string): Promise<any[][]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحساب Google أولاً للمتابعة');
  }

  // Extract ID from URL if full URL is passed
  let spreadsheetId = sheetIdOrUrl.trim();
  const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    spreadsheetId = match[1];
  }

  // 1. Fetch metadata to get first sheet title
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    throw new Error('تعذر الوصول إلى ملف Google Sheet. تأكد من صحة الرابط أو صلاحية الحساب.');
  }

  const metaData = await metaRes.json();
  const firstSheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';

  // 2. Fetch sheet values
  const valRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(firstSheetName)}'!A1:Z500`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!valRes.ok) {
    throw new Error('فشل في قراءة محتويات ورقة العمل.');
  }

  const valData = await valRes.json();
  return valData.values || [];
}
