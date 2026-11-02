import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Task, Project, TeamMember } from '../types';
import { exportDatabaseToExcel, parseDatabaseFromWorkbook } from '../utils/excelDatabaseUtils';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileText, 
  Table, 
  Copy, 
  ExternalLink,
  Database,
  RefreshCw,
  FolderKanban,
  Users,
  Check
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  teamMembers: TeamMember[];
  tasks: Task[];
  onImportDatabase: (data: {
    projects: Project[];
    teamMembers: TeamMember[];
    tasks: Task[];
    mode: 'merge' | 'replace';
  }) => void;
  onOpenGoogleSheets?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  projects,
  teamMembers,
  tasks,
  onImportDatabase,
  onOpenGoogleSheets,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'google-sheets' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');
  const [pastedText, setPastedText] = useState('');
  const [copiedLinkFeedback, setCopiedLinkFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    projects: Project[];
    teamMembers: TeamMember[];
    tasks: Task[];
    stats: { projectsCount: number; membersCount: number; tasksCount: number };
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentWorkbookRef = useRef<XLSX.WorkBook | null>(null);

  if (!isOpen) return null;

  // Handle Export live database into 3-sheet Excel
  const handleExportFullDatabase = () => {
    exportDatabaseToExcel(projects, teamMembers, tasks);
  };

  // Re-parse when user toggles importMode
  const handleSwitchMode = (newMode: 'merge' | 'replace') => {
    setImportMode(newMode);
    if (currentWorkbookRef.current) {
      try {
        const result = parseDatabaseFromWorkbook(currentWorkbookRef.current, projects, teamMembers, newMode);
        setParsedData(result);
      } catch (e) {
        console.error('Failed to reparse with new mode', e);
      }
    }
  };

  // Handle file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setParseError(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        currentWorkbookRef.current = wb;
        const result = parseDatabaseFromWorkbook(wb, projects, teamMembers, importMode);
        
        if (result.tasks.length === 0 && result.projects.length === 0 && result.teamMembers.length === 0) {
          setParseError('لم يتم العثور على أي بيانات صالحة في ملف الإكسيل. تأكد من وجود شيت للمشاريع أو الفريق أو المهام.');
        } else {
          setParsedData(result);
          setParseError(null);
        }
      } catch (err: any) {
        setParseError(`حدث خطأ أثناء قراءة ملف الإكسيل: ${err?.message || 'تأكد من صيغة الملف'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setParseError('حدث خطأ أثناء قراءة الملف من الجهاز');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Handle copy TSV template to clipboard for Google Sheets
  const handleCopyToClipboardForSheets = () => {
    const headers = [
      'عنوان المهمة',
      'اسم المشروع',
      'كود المشروع',
      'المشرف الرئيسي',
      'الأولوية',
      'موعد التسليم',
      'الوصف',
      'خطوة 1 - العنوان',
      'خطوة 1 - مسار الانتقال',
      'خطوة 2 - العنوان',
      'خطوة 2 - مسار الانتقال',
      'خطوة 3 - العنوان',
      'خطوة 3 - مسار الانتقال',
      'رابط خارجي أو شيت',
    ].join('\t');

    const sampleRow = [
      'صب خرسانة القواعد المسلحة',
      'مشروع فيلا الياسمين',
      'PRJ-01',
      teamMembers[0]?.name || 'مهندس الموقع',
      'عاجلة',
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      'استلام حديد التسليح ثم الصب ومتابعة المعالجة بالمياه',
      'استلام حدادة القواعد',
      'اعتماد الاستشاري',
      'صب الخرسانة الجاهزة',
      'أخذ مكعبات الاختبار',
      'المعالجة بالرش بالمياه',
      'جفاف تام 48 ساعة',
      'https://docs.google.com/spreadsheets',
    ].join('\t');

    const fullContent = `${headers}\n${sampleRow}`;

    navigator.clipboard.writeText(fullContent).then(() => {
      setCopiedLinkFeedback(true);
      setTimeout(() => setCopiedLinkFeedback(false), 2500);
    });
  };

  // Handle parsing pasted tabular text from Google Sheets
  const handleParsePastedData = () => {
    if (!pastedText.trim()) {
      setParseError('يرجى لصق البيانات أولاً من جدول Google Sheets');
      return;
    }

    setIsProcessing(true);
    setParseError(null);

    try {
      // Create a virtual workbook from TSV/CSV string
      const wb = XLSX.read(pastedText.trim(), { type: 'string' });
      currentWorkbookRef.current = wb;
      const result = parseDatabaseFromWorkbook(wb, projects, teamMembers, importMode);

      if (result.tasks.length === 0) {
        setParseError('لم يتم العثور على أي مهام صالحة في النص المنسوخ. تأكد من احتواء الجدول على عمود "عنوان المهمة".');
      } else {
        setParsedData(result);
        setParseError(null);
      }
    } catch (err: any) {
      setParseError(`تعذر تحليل البيانات المنسوخة: ${err?.message || 'صيغة غير صالحة'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Commit imported database to app
  const handleCommitImport = () => {
    if (!parsedData) return;

    onImportDatabase({
      projects: parsedData.projects,
      teamMembers: parsedData.teamMembers,
      tasks: parsedData.tasks,
      mode: importMode,
    });

    setSuccessToast(
      importMode === 'replace'
        ? 'تم استبدال وتحديث قاعدة البيانات بالكامل بنجاح!'
        : `تم بنجاح دمج وتحديث (${parsedData.tasks.length} مهمة، ${parsedData.projects.length} مشروع، ${parsedData.teamMembers.length} عضو فريق)`
    );

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#132229] w-full max-w-4xl rounded-3xl shadow-2xl border border-[#1c3542] overflow-hidden animate-scaleUp text-white max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0c1920] p-4 sm:p-5 border-b border-[#162a34] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>قاعدة بيانات Excel و Google Sheets (3 شيتات متكاملة)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تنزيل الشيت الكامل (المشاريع + الفريق + المهام ومساراتها) والتعديل عليه وإعادة رفعه في أي وقت
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#182c35] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* BANNER 1: Download Complete 3-Sheet Live Database */}
          <div className="bg-[#0f242c] rounded-2xl p-4 sm:p-5 border border-[#184654] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-black text-[#22d3ee]">
                <Download className="w-4 h-4 text-[#22d3ee]" />
                <span>الخطوة 1: تنزيل ملف الإكسيل الكامل كقاعدة بيانات</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed max-w-xl">
                يحتوي الملف المنزّل على <strong>3 شيتات منفصلة ومنظمة</strong>:
                <br />
                📑 <strong>شيت المشاريع</strong> (كود، اسم، عميل، مواعيد، ميزانية)
                <br />
                👷 <strong>شيت فريق العمل</strong> (أسماء المشرفين، أرقام الهواتف، التخصصات)
                <br />
                🎯 <strong>شيت المهام والمسارات</strong> (عنوان المهمة، خطوات التنفيذ، مسارات الانتقال، والمرفقات)
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportFullDatabase}
              className="px-4 py-3 bg-[#0891b2] hover:bg-[#06b6d4] text-white font-black rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 shrink-0 text-xs active:scale-95 border border-cyan-300/40"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل الشيت الشامل (.xlsx)</span>
            </button>
          </div>

          {/* BANNER 2: Input Tabs (Upload vs Google Sheets vs Paste) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>الخطوة 2: رفع الشيت بعد التعديل أو المزامنة</span>
              </span>

              {/* Tabs */}
              <div className="bg-[#0c181f] p-1 rounded-xl border border-[#1b3440] flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'upload'
                      ? 'bg-[#182c35] text-[#22d3ee] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع ملف الإكسيل (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('google-sheets')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'google-sheets'
                      ? 'bg-[#182c35] text-emerald-400 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ربط Google Sheets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'paste'
                      ? 'bg-[#182c35] text-[#22d3ee] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>لصق مباشر</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Upload File (.xlsx / .csv) */}
            {activeTab === 'upload' && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#1f4353] hover:border-[#22d3ee] bg-[#0c171e] hover:bg-[#0f1f28] rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition group space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#132c37] group-hover:bg-[#1a3b4a] text-cyan-400 flex items-center justify-center mx-auto transition">
                  <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">
                    اضغط لاختيار ملف الإكسيل المعدل أو اسحبه هنا
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يدعم قراءة الشيتات الثلاثة دفعة واحدة (<strong className="text-cyan-300">المشاريع</strong>، <strong className="text-cyan-300">فريق العمل</strong>، و<strong className="text-cyan-300">المهام والمسارات</strong>)
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Google Sheets Live Sync */}
            {activeTab === 'google-sheets' && (
              <div className="bg-[#0c171e] rounded-2xl p-4 sm:p-5 border border-[#1b3440] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>الربط مع Google Sheets للتعديل السحابي الفوري</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      يمكنك فتح جدول Google Sheets، ومشاركة الفريق في التعديل المباشر، ثم استيراد البيانات للتطبيق بنقرة زر واحدة.
                    </p>
                  </div>

                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-[#0e2a21] hover:bg-[#153f31] border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                  >
                    <span>فتح Google Sheets جديد</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyToClipboardForSheets}
                    className="p-3 bg-[#132229] hover:bg-[#182c35] border border-[#234250] hover:border-cyan-400 rounded-xl text-right transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">1. نسخ الأعمدة الجاهزة للجدول</span>
                      {copiedLinkFeedback ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> تم النسخ!
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      انسخ رؤوس الأعمدة باللغة العربية والصفوف التوضيحية والصقها فوراً في Google Sheets.
                    </p>
                  </button>

                  {onOpenGoogleSheets && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGoogleSheets();
                      }}
                      className="p-3 bg-[#0f2e24] hover:bg-[#153d30] border border-emerald-500/40 rounded-xl text-right transition cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-200 text-xs">2. فتح مركز مزامنة جداول المقاولات</span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-[10px] text-emerald-400/80">
                        مزامنة حية وتصدير تلقائي مع جداول Google Sheets وتخصيص الروابط.
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Direct Paste */}
            {activeTab === 'paste' && (
              <div className="bg-[#0c171e] rounded-2xl p-4 border border-[#1b3440] space-y-3">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  💡 <strong>طريقة النسخ المباشر:</strong> من Google Sheets أو Excel، حدد الصفوف والأعمدة واضغط <strong className="text-cyan-300 font-mono">Ctrl+C</strong>، ثم الصقها هنا واضغط "تحليل البيانات".
                </p>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="الصق بيانات الجدول هنا مباشرة..."
                  className="w-full p-3 bg-[#132229] border border-[#22404e] focus:border-[#22d3ee] rounded-xl text-white text-xs font-mono outline-none placeholder:text-slate-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParsePastedData}
                    disabled={!pastedText.trim() || isProcessing}
                    className="px-4 py-2 bg-[#0891b2] hover:bg-[#0aa0b6] disabled:opacity-50 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>تحليل البيانات المنسوخة</span>
                  </button>
                </div>
              </div>
            )}

            {/* Parse Error Alert */}
            {parseError && (
              <div className="bg-rose-950/70 border border-rose-600/70 text-rose-200 p-3.5 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold">تنبيه أثناء معالجة الشيت:</p>
                  <p>{parseError}</p>
                </div>
              </div>
            )}

            {/* Success Toast */}
            {successToast && (
              <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-200 p-4 rounded-2xl flex items-center gap-2.5 animate-fadeIn font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{successToast}</span>
              </div>
            )}

            {/* PARSED DATA PREVIEW & MODE SELECTION */}
            {parsedData && (
              <div className="bg-[#0c171e] rounded-2xl p-4 sm:p-5 border border-[#1b3440] space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b3440] pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-black text-white text-sm">
                        تم فحص وقراءة بيانات الشيت بنجاح
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-[#22d3ee]">
                          <FolderKanban className="w-3.5 h-3.5" />
                          <span>{parsedData.projects.length} مشاريع</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-amber-300">
                          <Users className="w-3.5 h-3.5" />
                          <span>{parsedData.teamMembers.length} أعضاء فريق</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{parsedData.tasks.length} مهمة بمساراتها</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1.5 bg-[#132229] p-1 rounded-xl border border-[#22404e]">
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('replace')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        importMode === 'replace'
                          ? 'bg-[#088395] text-white shadow-xs font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="اعتماد بيانات الشيت كقاعدة بيانات رئيسية وحذف البيانات التجريبية السابقة"
                    >
                      <span>استبدال كامل (موصى به)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('merge')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        importMode === 'merge'
                          ? 'bg-[#182c35] text-cyan-300 shadow-xs border border-cyan-400/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="إضافة المشاريع والمهام الجديدة دون حذف المشاريع القديمة"
                    >
                      <span>دمج مع الحالي</span>
                    </button>
                  </div>
                </div>

                {/* Detected Projects Tag Cloud */}
                {parsedData.projects.length > 0 && (
                  <div className="bg-[#132229] p-3 rounded-xl border border-[#1e3a47] space-y-1.5">
                    <div className="text-[11.5px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                      <span>المشاريع المكتشفة في هذا الملف ({parsedData.projects.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {parsedData.projects.map((p) => (
                        <span 
                          key={p.id} 
                          className="px-2.5 py-1 rounded-lg bg-[#182c35] border border-cyan-400/30 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="text-cyan-400 font-mono text-[10px]">[{p.code}]</span>
                          <span>{p.name}</span>
                          <span className="text-[9.5px] text-slate-400">({p.client || 'عام'})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks Table Preview */}
                <div className="max-h-56 overflow-y-auto border border-[#1c3542] rounded-xl overflow-x-auto">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-[#132229] text-slate-400 font-bold border-b border-[#1c3542] sticky top-0">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">عنوان المهمة</th>
                        <th className="p-2">المشروع</th>
                        <th className="p-2">المسؤول</th>
                        <th className="p-2">الحالة</th>
                        <th className="p-2">موعد التسليم</th>
                        <th className="p-2">عدد الخطوات ومسارات الانتقال</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182c35]">
                      {parsedData.tasks.map((task, idx) => {
                        const proj = parsedData.projects.find(p => p.id === task.projectId);
                        const member = parsedData.teamMembers.find(m => m.id === task.assignedMemberId);
                        return (
                          <tr key={idx} className="hover:bg-[#132229]/60">
                            <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-black text-white">{task.title}</td>
                            <td className="p-2 text-[#22d3ee] font-bold">{proj?.name || 'عام'}</td>
                            <td className="p-2 text-slate-300">{member?.name || 'مشرف'}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#182c35] text-slate-300">
                                {task.status}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-amber-300">{task.expectedClosingDate || '-'}</td>
                            <td className="p-2 font-bold text-emerald-400">
                              {task.subtasks.length} خطوات متسلسلة
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0c1920] border-t border-[#162a34] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            {parsedData ? (
              <span className="text-emerald-300 font-bold">
                جاهز لتنفيذ الاستيراد بنظام: {importMode === 'merge' ? 'الدمج مع البيانات الحالية' : 'الاستبدال الكامل لقاعدة البيانات'}
              </span>
            ) : (
              <span>قم بتنزيل الشيت والتعديل عليه ثم إعادة رفعه هنا في أي وقت</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#182c35] hover:bg-[#203a46] text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleCommitImport}
              disabled={!parsedData || isProcessing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 text-xs active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تطبيق التحديثات على قاعدة البيانات ({parsedData?.tasks.length || 0})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
