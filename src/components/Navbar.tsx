import React from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  Bell, 
  Plus, 
  Lightbulb, 
  HardHat,
  Sparkles,
  LayoutGrid,
  Eye,
  Download,
  Calendar as CalendarIcon,
  FileSpreadsheet
} from 'lucide-react';
import { AppNotification } from '../types';

export type ActiveTab = 'unified' | 'glance' | 'team' | 'all_tasks' | 'projects' | 'calendar';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreateTask: () => void;
  onOpenNotifications: () => void;
  onOpenAdvice: () => void;
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
  onExportBackup,
  onOpenGoogleSheets,
  notifications,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-white border-b border-stone-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-2.5">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-md ring-2 ring-amber-400/30 shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-white">
                  بُنيان
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                  إدارة المقاولات
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Switcher */}
          <nav className="hidden md:flex items-center gap-0.5 bg-stone-800/90 p-0.5 rounded-xl border border-stone-700/60">
            
            {/* 1. Summary View (ملخص - First per user request) */}
            <button
              id="tab-glance"
              type="button"
              onClick={() => setActiveTab('glance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'glance'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ملخص</span>
            </button>

            {/* 2. Unified Projects & Tasks View */}
            <button
              id="tab-unified"
              type="button"
              onClick={() => setActiveTab('unified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unified'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>المشاريع والمهام</span>
            </button>

            {/* 3. Calendar View (عرض التقويم والسحب والإفلات) */}
            <button
              id="tab-calendar"
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
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
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>فريق العمل</span>
            </button>
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-2">
            
            {/* Google Sheets Official Integration Button */}
            {onOpenGoogleSheets && (
              <button
                type="button"
                id="btn-google-sheets-navbar"
                onClick={onOpenGoogleSheets}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="تصدير ومزامنة جداول المقاولات مع Google Sheets"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden lg:inline">Google Sheets 📊</span>
              </button>
            )}

            {/* Backup / Export Tasks JSON Button ("تحميل بيانات المهام كملف JSON للنسخ الاحتياطي") */}
            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="bg-stone-800/90 hover:bg-stone-700/80 hover:text-white text-stone-300 border border-stone-700/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="تحميل نسخة احتياطية لبيانات المهام كملف JSON لمدير المشروع"
              >
                <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">نسخ احتياطي (JSON)</span>
              </button>
            )}

            {/* Tech Platform Advisory Guide Button ("وتقولي أفضل منصة لعمل هذه الفكره") */}
            <button
              type="button"
              onClick={onOpenAdvice}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="دليل أفضل المنصات والتقنيات لتنفيذ هذه الفكرة"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">أفضل منصة للفكرة</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
              title="التنبيهات اللحظية"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Create Task Button */}
            <button
              id="btn-header-new-task"
              type="button"
              onClick={onOpenCreateTask}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>مهمة جديدة</span>
            </button>

          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around border-t border-stone-800 py-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('glance')}
            className={`px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
              activeTab === 'glance' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ملخص</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unified')}
            className={`px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
              activeTab === 'unified' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>المشاريع</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
              activeTab === 'calendar' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>التقويم</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
              activeTab === 'team' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الفريق</span>
          </button>
        </div>

      </div>
    </header>
  );
};
