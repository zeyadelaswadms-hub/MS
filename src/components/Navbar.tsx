import React from 'react';
import { 
  Building2, 
  Users, 
  Bell, 
  Plus, 
  LayoutGrid,
  Download,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Menu
} from 'lucide-react';
import { AppNotification } from '../types';

export type ActiveTab = 'unified' | 'glance' | 'team' | 'all_tasks' | 'projects' | 'calendar';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreateTask: () => void;
  onOpenNotifications: () => void;
  onOpenAdvice: () => void;
  onOpenSettings: () => void;
  onExportBackup?: () => void;
  onOpenGoogleSheets?: () => void;
  notifications: AppNotification[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateTask,
  onOpenNotifications,
  onOpenAdvice,
  onOpenSettings,
  onExportBackup,
  onOpenGoogleSheets,
  notifications,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0c1920] text-white border-b border-[#162a34] shadow-md w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-15 gap-1.5 sm:gap-3">
            
            {/* Brand Logo & Title (شركة محمد سعد مع الشعار الجديد) */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <img 
                src="/assets/aistudio/Gemini_Generated_Image_ce6yamce6yamce6y_52c06c09.jfif"
                alt="شعار شركة محمد سعد"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-1 ring-cyan-400/40 shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-black text-xs sm:text-sm md:text-base tracking-tight text-white select-none truncate max-w-[125px] xs:max-w-[160px] sm:max-w-[220px] md:max-w-none" title="شركة محمد سعد">
                  شركة محمد سعد
                </h1>
              </div>
            </div>

            {/* Desktop Navigation Switcher (Displayed on lg+ to prevent tablet crowding) */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#101f27] p-1 rounded-xl border border-[#1b3442] shrink-0">
              
              {/* 1. Summary View (ملخص) */}
              <button
                id="tab-glance"
                type="button"
                onClick={() => setActiveTab('glance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'glance'
                    ? 'bg-[#13323c] text-[#22d3ee] border border-[#1e505f] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#162c37]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>الملخص</span>
              </button>

              {/* 2. Unified Projects & Tasks View */}
              <button
                id="tab-unified"
                type="button"
                onClick={() => setActiveTab('unified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'unified'
                    ? 'bg-[#13323c] text-[#22d3ee] border border-[#1e505f] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#162c37]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>المشاريع</span>
              </button>

              {/* 3. Calendar View */}
              <button
                id="tab-calendar"
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-[#13323c] text-[#22d3ee] border border-[#1e505f] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#162c37]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>التقويم</span>
              </button>

              {/* 4. Team */}
              <button
                id="tab-team"
                type="button"
                onClick={() => setActiveTab('team')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-[#13323c] text-[#22d3ee] border border-[#1e505f] shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#162c37]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>الفريق</span>
              </button>
            </nav>

            {/* Right Action Icons & Buttons (Always fits smoothly on mobile & tablet) */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* Google Sheets Button - displayed on xl only to keep mobile & tablet clean */}
              {onOpenGoogleSheets && (
                <button
                  type="button"
                  id="btn-google-sheets-navbar"
                  onClick={onOpenGoogleSheets}
                  className="hidden xl:flex bg-[#0e2a22] hover:bg-[#133a2f] text-emerald-300 border border-[#1c5543] px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="تصدير ومزامنة جداول المقاولات مع Google Sheets"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Google Sheets 📊</span>
                </button>
              )}

              {/* Backup Tasks JSON Button - displayed on xl only */}
              {onExportBackup && (
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="hidden xl:flex bg-[#12222a] hover:bg-[#182d37] hover:text-white text-slate-300 border border-[#1e3845] px-2.5 py-1.5 rounded-xl text-xs font-bold items-center gap-1.5 transition cursor-pointer"
                  title="تحميل نسخة احتياطية لبيانات المهام كملف JSON لمدير المشروع"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>نسخ احتياطي (JSON)</span>
                </button>
              )}

              {/* Notification Bell */}
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-[#142833] rounded-xl transition cursor-pointer shrink-0"
                title="التنبيهات اللحظية"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Create Task Button: Compact icon on mobile, full on sm+ */}
              <button
                id="btn-header-new-task"
                type="button"
                onClick={onOpenCreateTask}
                className="bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1 shadow-sm transition cursor-pointer shrink-0 border border-cyan-400/30"
                title="مهمة جديدة"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">مهمة جديدة</span>
              </button>

              {/* 3-Lines Settings & Reset Menu Icon */}
              <button
                id="btn-header-settings-menu"
                type="button"
                onClick={onOpenSettings}
                className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-[#142833] rounded-xl transition cursor-pointer shrink-0"
                title="القائمة والإعدادات واستعادة البيانات"
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* User Avatar Circle (matching screenshot green circle with "Z") */}
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#65a30d] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-xs shrink-0 select-none border border-lime-400/30"
                title="حساب المستخدم"
              >
                Z
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* 
        Mobile & Tablet Dock Navigation Bar
        Contains 4 tabs with active rounded capsule around active icon & label
      */}
      <nav 
        aria-label="التنقل الرئيسي"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#091318]/95 backdrop-blur-md border-t border-[#162a34] px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        {/* 1. الملخص */}
        <button
          type="button"
          onClick={() => setActiveTab('glance')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'glance'
              ? 'bg-[#13323c] text-[#22d3ee] px-5 py-1.5 rounded-2xl shadow-inner border border-[#1b4b59]'
              : 'text-slate-400 hover:text-slate-200 px-3'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[11px] font-bold mt-0.5">الملخص</span>
        </button>

        {/* 2. المشاريع */}
        <button
          type="button"
          onClick={() => setActiveTab('unified')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'unified'
              ? 'bg-[#13323c] text-[#22d3ee] px-5 py-1.5 rounded-2xl shadow-inner border border-[#1b4b59]'
              : 'text-slate-400 hover:text-slate-200 px-3'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[11px] font-bold mt-0.5">المشاريع</span>
        </button>

        {/* 3. التقويم */}
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-[#13323c] text-[#22d3ee] px-5 py-1.5 rounded-2xl shadow-inner border border-[#1b4b59]'
              : 'text-slate-400 hover:text-slate-200 px-3'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[11px] font-bold mt-0.5">التقويم</span>
        </button>

        {/* 4. الفريق */}
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'bg-[#13323c] text-[#22d3ee] px-5 py-1.5 rounded-2xl shadow-inner border border-[#1b4b59]'
              : 'text-slate-400 hover:text-slate-200 px-3'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] font-bold mt-0.5">الفريق</span>
        </button>
      </nav>
    </>
  );
};
