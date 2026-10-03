import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  LogOut, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Task, Project, TeamMember } from '../types';
import { 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  initAuth, 
  exportTasksToGoogleSheets, 
  readTasksFromGoogleSheets 
} from '../services/googleSheetsService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  onImportTasks?: (newTasks: Task[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  teamMembers,
  onImportTasks,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ id: string; url: string } | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Check initial auth state
      initAuth(
        (user) => {
          setCurrentUser(user);
        },
        () => {
          setCurrentUser(null);
        }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        setStatusMessage({ text: `تم الاتصال بحساب Google بنجاح: ${res.user.email}`, type: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'فشل الاتصال بحساب Google. تأكد من السماح بالصلاحيات.', type: 'error' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setExportResult(null);
      setStatusMessage({ text: 'تم تسجيل الخروج من Google بنجاح', type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    if (!getAccessToken()) {
      setStatusMessage({ text: 'يرجى تسجيل الدخول بحساب Google أولاً', type: 'error' });
      return;
    }

    setIsExporting(true);
    setStatusMessage(null);
    try {
      const result = await exportTasksToGoogleSheets(tasks, projects, teamMembers);
      setExportResult({ id: result.spreadsheetId, url: result.spreadsheetUrl });
      setStatusMessage({
        text: `تم تصدير ${tasks.length} مهمة بنجاح إلى ملف Google Sheets جديد!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'حدث خطأ أثناء تصدير البيانات إلى Google Sheets', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setStatusMessage({ text: 'يرجى إدخال رابط أو معرّف ملف Google Sheets', type: 'error' });
      return;
    }

    setIsImporting(true);
    setStatusMessage(null);
    try {
      const rows = await readTasksFromGoogleSheets(importUrl);
      if (rows.length <= 1) {
        throw new Error('ورقة العمل لا تحتوي على بيانات كافية للاستيراد');
      }

      setStatusMessage({
        text: `تمت قراءة ${rows.length - 1} سطر من ورقة العمل بنجاح.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: err.message || 'فشل استيراد البيانات من ورقة العمل', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyLink = () => {
    if (exportResult?.url) {
      navigator.clipboard.writeText(exportResult.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>التكامل مع Google Sheets</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  رسمي
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                تصدير ومزامنة جداول المقاولات والمهام والخطوات مباشرة مع Google Drive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-950 border-red-300'
                : 'bg-blue-50 text-blue-950 border-blue-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Google Account Connection Status */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>حالة الاتصال بحساب Google:</span>
              </span>

              {currentUser && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer transition"
                >
                  <LogOut className="w-3 h-3" />
                  <span>تسجيل خروج</span>
                </button>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-9 h-9 rounded-full ring-2 ring-emerald-500/30" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm">
                      {currentUser.displayName?.[0] || 'G'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-stone-900">{currentUser.displayName || 'مستخدم Google'}</p>
                    <p className="text-[11px] text-stone-500 font-mono" dir="ltr">{currentUser.email}</p>
                  </div>
                </div>

                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>متصل ومفوّض</span>
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-stone-600">
                  قم بتسجيل الدخول بحساب Google لمنح التطبيق الإذن بإنشاء وقراءة جداول البيانات في Google Drive الخاص بك.
                </p>

                {/* Official Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 active:scale-99 border border-stone-300 rounded-xl shadow-xs text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50"
                >
                  {isLoadingAuth ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  <span>تسجيل الدخول باستخدام Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Export All Tasks to Google Sheets */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                  تصدير كافة المهام والخطوات إلى شيت Google
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">
                {tasks.length} مهمة
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              سيتم إنشاء ملف Google Spreadsheet جديد في حسابك يحتوي على كافة أسماء المهام، الأكواد، مواعيد البدء والتسليم، نسب الإنجاز، والمهندسين المشرفين.
            </p>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إنشاء الشيت وتصدير البيانات...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>إنشاء وتصدير إلى Google Sheets الآن</span>
                </>
              )}
            </button>

            {/* Export Success Result Card */}
            {exportResult && (
              <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-2xs space-y-2 animate-scaleUp">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تم إنشاء الملف بنجاح!</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>
                </div>

                <a
                  href={exportResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>فتح الشيت في Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Section 3: Import / Link from Google Sheets */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/90 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-700" />
              <h3 className="text-xs sm:text-sm font-black text-stone-900">
                استيراد أو مزامنة شيت موجود
              </h3>
            </div>

            <p className="text-xs text-stone-600">
              ألصق رابط أي ملف Google Sheet أو معرّف الشيت لقراءة البنود والمشاريع وتحديث النظام:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1"
              >
                {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>استيراد</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100/80 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-medium">
            تكامل آمن مباشر عبر واجهات برمجة تطبيقات Google الرسمية
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
