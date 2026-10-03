import React, { useState, useMemo, useRef } from 'react';
import { Task, Project, TeamMember, SubTask } from '../types';
import { 
  getDeadlineInfo, 
  calculateTaskProgress, 
  getActiveWaitingSubtask, 
  createWhatsAppAlertLink,
  getDaysSinceLastAction
} from '../utils/dateUtils';
import { 
  Eye,
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  FileSpreadsheet, 
  FolderGit2, 
  Phone, 
  MessageSquare, 
  Plus, 
  Search, 
  Check, 
  Link2,
  Trash2,
  RotateCcw,
  Square,
  CheckSquare,
  Image as ImageIcon,
  Camera,
  Layers,
  Building2,
  User,
  X,
  Download,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { EditExternalLinkModal } from './EditExternalLinkModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { TransitionBridge } from './TransitionBridge';
import { downloadTasksJSON } from '../utils/backupUtils';

interface CompactGlanceViewProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onOpenCreateTask: (projectId?: string) => void;
  onSelectProject?: (projectId: string) => void;
  onExportBackup?: () => void;
  onOpenGoogleSheets?: () => void;
}

export const CompactGlanceView: React.FC<CompactGlanceViewProps> = ({
  tasks,
  projects,
  teamMembers,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onSelectProject,
  onExportBackup,
  onOpenGoogleSheets,
}) => {
  // Expansion state
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Status Filter: 'all' | 'ongoing' | 'overdue' | 'completed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'overdue' | 'completed'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [editingLinkTask, setEditingLinkTask] = useState<Task | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const [editingDateTaskId, setEditingDateTaskId] = useState<string | null>(null);
  const [tempClosingDate, setTempClosingDate] = useState<string>('');

  // Handle Export Tasks JSON
  const handleExportBackup = () => {
    if (onExportBackup) {
      onExportBackup();
    } else {
      const result = downloadTasksJSON(tasks, projects, teamMembers);
      setDownloadSuccessToast(`تم تنزيل النسخة الاحتياطية (${result.tasksCount} مهمة)`);
      setTimeout(() => setDownloadSuccessToast(null), 3500);
    }
  };

  // Statistics calculation for the 3 circles
  const stats = useMemo(() => {
    let ongoingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    tasks.forEach(t => {
      const isCompleted = t.status === 'completed' || calculateTaskProgress(t) === 100;
      if (isCompleted) {
        completedCount++;
      } else {
        const d = getDeadlineInfo(t.expectedClosingDate, false);
        if (d.isOverdue) {
          overdueCount++;
        } else {
          ongoingCount++;
        }
      }
    });

    return {
      ongoingCount,
      overdueCount,
      completedCount,
      total: tasks.length,
    };
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const isCompleted = task.status === 'completed' || calculateTaskProgress(task) === 100;
      const deadline = getDeadlineInfo(task.expectedClosingDate, isCompleted);

      // Filter by circle status
      if (statusFilter === 'ongoing') {
        if (isCompleted || deadline.isOverdue) return false;
      } else if (statusFilter === 'overdue') {
        if (isCompleted || !deadline.isOverdue) return false;
      } else if (statusFilter === 'completed') {
        if (!isCompleted) return false;
      }

      // Filter by project
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) {
        return false;
      }

      // Filter by team member (person) - لإظهار مهامه فقط
      if (selectedMemberId !== 'all') {
        const isDirectAssignee = task.assignedMemberId === selectedMemberId;
        const isSubtaskAssignee = task.subtasks?.some(st => st.assignedMemberId === selectedMemberId);
        const waitingInfo = getActiveWaitingSubtask(task, teamMembers);
        const isWaitingAssignee = waitingInfo.responsibleMember?.id === selectedMemberId;
        if (!isDirectAssignee && !isSubtaskAssignee && !isWaitingAssignee) {
          return false;
        }
      }

      // Filter by priority
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const project = projects.find(p => p.id === task.projectId);
        const assignedMember = teamMembers.find(m => m.id === task.assignedMemberId);
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchProject = project?.name.toLowerCase().includes(query);
        const matchCategory = task.category?.toLowerCase().includes(query);
        const matchMember = assignedMember?.name.toLowerCase().includes(query);
        const matchSubtask = task.subtasks?.some(st => 
          st.title.toLowerCase().includes(query) || 
          teamMembers.find(m => m.id === st.assignedMemberId)?.name.toLowerCase().includes(query)
        );
        if (!matchTitle && !matchProject && !matchCategory && !matchMember && !matchSubtask) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, selectedProjectId, selectedMemberId, searchQuery, projects, teamMembers]);

  // Subtask updater
  const handleUpdateSubtask = (task: Task, subtaskId: string, updates: Partial<SubTask>) => {
    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, ...updates };
      }
      return st;
    });

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.status === 'completed');
    const newStatus = allDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status;

    onUpdateTask(task.id, {
      subtasks: updatedSubtasks,
      status: newStatus,
    });
  };

  // Cycle status for a subtask: pending ➔ in_progress ➔ completed ➔ pending
  const handleCycleSubtaskStatus = (e: React.MouseEvent, task: Task, subtask: SubTask) => {
    e.stopPropagation();
    let nextStatus: SubTaskStatus = 'in_progress';
    if (subtask.status === 'pending') {
      nextStatus = 'in_progress';
    } else if (subtask.status === 'in_progress') {
      nextStatus = 'completed';
    } else {
      nextStatus = 'pending';
    }

    handleUpdateSubtask(task, subtask.id, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  // Toggle full task completed
  const handleToggleTaskCompleted = (task: Task) => {
    const isCompleted = task.status === 'completed' || calculateTaskProgress(task) === 100;
    if (isCompleted) {
      onUpdateTask(task.id, { status: 'in_progress' });
    } else {
      const completedSubtasks = task.subtasks.map(s => ({ 
        ...s, 
        status: 'completed' as const,
        completedAt: s.completedAt || new Date().toISOString()
      }));
      onUpdateTask(task.id, { 
        status: 'completed',
        subtasks: completedSubtasks 
      });
    }
  };

  return (
    <div className="space-y-2">
      
      {/* 
        ========================================================================
        1. FIRST ROW: Title ("ملخص المهام") + 3 Circular Status Filters
        ========================================================================
      */}
      <div className="bg-white rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto scrollbar-none flex-nowrap min-h-[40px]">
        
        {/* Title and 3 Circles strictly on the same row */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
          
          {/* Title: ملخص المهام */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-black text-stone-900 tracking-tight whitespace-nowrap">
              ملخص المهام
            </h2>
          </div>

          <div className="h-4 w-[1px] bg-stone-200 shrink-0" />

          {/* 
            3 CIRCLES:
            - Green Circle: المهام الجارية
            - Red Circle: المهام المتأخرة
            - Gray Circle: المهام المكتملة
            لا تظهر الكلمات (الجارية / المتأخرة / المكتملة) إطلاقاً في الحالة الافتراضية
            وفقط في حالة الضغط/التفعيل تظهر الكلمة بجانب الدائرة وتظل في نفس السطر تماماً
          */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            
            {/* Green Circle: المهام الجارية */}
            <button
              type="button"
              onClick={() => setStatusFilter(prev => prev === 'ongoing' ? 'all' : 'ongoing')}
              title={statusFilter === 'ongoing' ? 'إلغاء التصفية' : 'تصفية: المهام الجارية'}
              className={`flex items-center gap-1 p-0.5 rounded-full transition cursor-pointer shrink-0 ${
                statusFilter === 'ongoing' 
                  ? 'bg-emerald-50 ring-2 ring-emerald-500 shadow-2xs pr-0.5 pl-2' 
                  : 'hover:bg-stone-50'
              }`}
            >
              <span className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center font-black text-xs text-white shadow-2xs transition-transform active:scale-90 ${
                statusFilter === 'ongoing' ? 'bg-emerald-600 scale-105' : 'bg-emerald-500'
              }`}>
                {stats.ongoingCount}
              </span>
              {/* تظهر الكلمة فقط في حالة الضغط عليها */}
              {statusFilter === 'ongoing' && (
                <span className="text-[11px] font-bold text-emerald-950 whitespace-nowrap px-1">
                  الجارية
                </span>
              )}
            </button>

            {/* Red Circle: المهام المتأخرة */}
            <button
              type="button"
              onClick={() => setStatusFilter(prev => prev === 'overdue' ? 'all' : 'overdue')}
              title={statusFilter === 'overdue' ? 'إلغاء التصفية' : 'تصفية: المهام المتأخرة'}
              className={`flex items-center gap-1 p-0.5 rounded-full transition cursor-pointer shrink-0 ${
                statusFilter === 'overdue' 
                  ? 'bg-red-50 ring-2 ring-red-500 shadow-2xs pr-0.5 pl-2' 
                  : 'hover:bg-stone-50'
              }`}
            >
              <span className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center font-black text-xs text-white shadow-2xs transition-transform active:scale-90 ${
                statusFilter === 'overdue' ? 'bg-red-600 scale-105' : 'bg-red-500'
              }`}>
                {stats.overdueCount}
              </span>
              {/* تظهر الكلمة فقط في حالة الضغط عليها */}
              {statusFilter === 'overdue' && (
                <span className="text-[11px] font-bold text-red-950 whitespace-nowrap px-1">
                  المتأخرة
                </span>
              )}
            </button>

            {/* Gray Circle: المهام المكتملة */}
            <button
              type="button"
              onClick={() => setStatusFilter(prev => prev === 'completed' ? 'all' : 'completed')}
              title={statusFilter === 'completed' ? 'إلغاء التصفية' : 'تصفية: المهام المكتملة'}
              className={`flex items-center gap-1 p-0.5 rounded-full transition cursor-pointer shrink-0 ${
                statusFilter === 'completed' 
                  ? 'bg-stone-100 ring-2 ring-stone-400 shadow-2xs pr-0.5 pl-2' 
                  : 'hover:bg-stone-50'
              }`}
            >
              <span className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center font-black text-xs text-white shadow-2xs transition-transform active:scale-90 ${
                statusFilter === 'completed' ? 'bg-stone-500 scale-105' : 'bg-stone-400'
              }`}>
                {stats.completedCount}
              </span>
              {/* تظهر الكلمة فقط في حالة الضغط عليها */}
              {statusFilter === 'completed' && (
                <span className="text-[11px] font-bold text-stone-800 whitespace-nowrap px-1">
                  المكتملة
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Counter & quick reset if active + JSON Backup Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {downloadSuccessToast && (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md animate-fadeIn">
              {downloadSuccessToast}
            </span>
          )}

          {statusFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer"
            >
              عرض الكل ({stats.total})
            </button>
          ) : (
            <span className="text-[11px] font-bold text-stone-400">
              إجمالي: <strong className="text-stone-700 font-mono">{stats.total}</strong>
            </span>
          )}

          {/* Backup Button for Project Manager */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-amber-50 hover:border-amber-300 border border-stone-200 px-2 py-1 rounded-lg transition cursor-pointer shadow-2xs"
            title="تحميل بيانات المهام الحالية كملف JSON لتسهيل النسخ الاحتياطي اليدوي من قبل مدير المشروع"
          >
            <Download className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">نسخ احتياطي JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>

          {/* Google Sheets Integration Button */}
          {onOpenGoogleSheets && (
            <button
              type="button"
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-lg transition cursor-pointer shadow-2xs"
              title="تصدير ومزامنة جداول المقاولات مع Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Google Sheets 📊</span>
              <span className="sm:hidden">Sheets</span>
            </button>
          )}
        </div>

      </div>

      {/* 
        ========================================================================
        2. DEDICATED SECOND ROW: فلتر المشروعات والأشخاص والبحث في سطر منفصل
        ========================================================================
      */}
      <div className="bg-white rounded-xl px-2.5 py-1.5 border border-stone-200/80 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto scrollbar-none flex-nowrap min-h-[38px]">
        
        {/* Right side (in RTL): Projects filter + Persons filter */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          
          {/* Projects Filter */}
          {projects.length > 0 && (
            <div className="relative shrink-0">
              <div className={`flex items-center gap-1 border rounded-lg px-2 py-1 h-7.5 text-[11px] font-bold transition ${
                selectedProjectId !== 'all' 
                  ? 'bg-amber-50 border-amber-300 text-amber-950' 
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}>
                <Building2 className={`w-3.5 h-3.5 shrink-0 ${selectedProjectId !== 'all' ? 'text-amber-600' : 'text-stone-500'}`} />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer max-w-[110px] sm:max-w-[140px] truncate text-[11px] font-bold"
                >
                  <option value="all">كل المشاريع ({projects.length})</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Persons / Team Members Filter ("بأسماء الأشخاص لإظهار مهامه فقط") */}
          {teamMembers.length > 0 && (
            <div className="relative shrink-0">
              <div className={`flex items-center gap-1 border rounded-lg px-2 py-1 h-7.5 text-[11px] font-bold transition ${
                selectedMemberId !== 'all' 
                  ? 'bg-blue-50 border-blue-300 text-blue-950' 
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}>
                <User className={`w-3.5 h-3.5 shrink-0 ${selectedMemberId !== 'all' ? 'text-blue-600' : 'text-stone-500'}`} />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer max-w-[95px] sm:max-w-[130px] truncate text-[11px] font-bold"
                >
                  <option value="all">كل الأشخاص ({teamMembers.length})</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Priority Filter */}
          <div className="relative shrink-0">
            <div className={`flex items-center gap-1 border rounded-lg px-2 py-1 h-7.5 text-[11px] font-bold transition ${
              selectedPriority !== 'all' 
                ? 'bg-amber-50 border-amber-300 text-amber-950' 
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                selectedPriority === 'urgent' 
                  ? 'bg-red-500' 
                  : selectedPriority === 'high' 
                  ? 'bg-amber-500' 
                  : selectedPriority === 'medium' 
                  ? 'bg-yellow-500' 
                  : selectedPriority === 'low' 
                  ? 'bg-emerald-500' 
                  : 'bg-stone-400'
              }`} />
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent outline-none cursor-pointer max-w-[85px] sm:max-w-[110px] truncate text-[11px] font-bold"
              >
                <option value="all">الأولوية (الكل)</option>
                <option value="urgent">🔴 عاجلة</option>
                <option value="high">🟠 مرتفعة</option>
                <option value="medium">🟡 متوسطة</option>
                <option value="low">🟢 منخفضة</option>
              </select>
            </div>
          </div>

          {/* Quick Clear filters badge if any active */}
          {(selectedProjectId !== 'all' || selectedMemberId !== 'all' || selectedPriority !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedProjectId('all');
                setSelectedMemberId('all');
                setSelectedPriority('all');
              }}
              title="إلغاء فلاتر المشاريع والأشخاص والأولوية"
              className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-md transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>إلغاء الفلترة</span>
            </button>
          )}

        </div>

        {/* Left side (in RTL): Search Input */}
        <div className="relative flex-1 max-w-[180px] sm:max-w-[260px] shrink-0">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المهام..."
            className="w-full pl-6 pr-7 py-1 h-7.5 bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-200 focus:border-amber-500 rounded-lg text-[11px] text-stone-800 placeholder:text-stone-400 outline-none transition font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>

      {/* 
        ========================================================================
        TASKS LIST: 2-COLUMN BALANCED DESKTOP GRID & SPACIOUS CARDS
        "وفي حالة تبديل العرض للكومبيوتر من الموبايل او التابلت يفضل تكبير وعرض المهام بشكل اكبر في الملخص بحيث لاتكون معظم الشاشه فارغة علي اليسار واليمين مكدس"
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
        {filteredTasks.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-xs font-bold text-stone-700">
              لا توجد مهام مطابقة للفلتر المحدد
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isExpanded = expandedTaskId === task.id;
            const project = projects.find(p => p.id === task.projectId);
            const progress = calculateTaskProgress(task);
            const isCompleted = task.status === 'completed' || progress === 100;
            const deadline = getDeadlineInfo(task.expectedClosingDate, isCompleted);
            const waitingInfo = getActiveWaitingSubtask(task, teamMembers);
            const mainAssignee = teamMembers.find(m => m.id === task.assignedMemberId);
            const responsible = waitingInfo.responsibleMember || mainAssignee;
            const daysSinceAction = getDaysSinceLastAction(task);
            const displayImageUrl = task.imageUrl || task.subtasks.find(st => !!st.imageUrl)?.imageUrl;

            // Status color indicator: Green (ongoing), Red (overdue), Gray (completed)
            const statusDotColor = isCompleted
              ? 'bg-stone-400 ring-stone-200'
              : deadline.isOverdue
              ? 'bg-red-500 ring-red-200 animate-pulse'
              : 'bg-emerald-500 ring-emerald-200';

            const statusDotTitle = isCompleted
              ? 'مكتملة'
              : deadline.isOverdue
              ? 'متأخرة عن الموعد'
              : 'قيد التنفيذ / جارية';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded 
                    ? 'lg:col-span-2 border-amber-500 ring-2 ring-amber-400/40 shadow-md' 
                    : 'border-stone-200/90 hover:border-amber-300 hover:shadow-xs'
                }`}
              >
                
                {/* 
                  ================================================================
                  حالة الانضغاط (Collapsed State): السطر الأول + السطر الثاني
                  ================================================================
                */}
                <div
                  onClick={() => setExpandedTaskId(prev => prev === task.id ? null : task.id)}
                  className="p-2.5 sm:p-3 lg:p-3.5 cursor-pointer select-none space-y-2 hover:bg-stone-50/70 transition"
                >
                  
                  {/* 
                    السطر الأول: عنوان المهمة + المشروع + المسؤول + عدد الأيام منذ آخر إجراء في دائرة
                    (متوازن وموسع على شاشات الكمبيوتر ليملأ العرض دون تكدس في اليمين وفراغ في اليسار)
                  */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
                    
                    {/* Right side (RTL): Status Dot + Title + Category */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      
                      {/* Color Status Indicator Dot */}
                      <span 
                        className={`w-3 h-3 rounded-full shrink-0 ring-2 shadow-2xs ${statusDotColor}`} 
                        title={`الحالة: ${statusDotTitle}`}
                      />

                      {/* Task Title */}
                      <span 
                        className={`text-xs sm:text-sm lg:text-[15px] font-black truncate leading-snug ${
                          isCompleted ? 'text-stone-400 line-through' : 'text-stone-900'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </span>

                      {/* Category Tag */}
                      {task.category && (
                        <span className="hidden sm:inline-block text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-md shrink-0">
                          {task.category}
                        </span>
                      )}

                    </div>

                    {/* Middle Section: Project Tag + Assignee + Deadline Badge (يملأ منتصف الشاشة في شاشات الكومبيوتر) */}
                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* Project Tag */}
                      {project && (
                        <span 
                          onClick={(e) => {
                            if (onSelectProject) {
                              e.stopPropagation();
                              onSelectProject(project.id);
                            }
                          }}
                          className="text-[11px] font-bold bg-amber-50 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-200/80 hover:bg-amber-100 transition shrink-0 max-w-[110px] sm:max-w-[160px] truncate"
                        >
                          {project.name}
                        </span>
                      )}

                      {/* Responsible Person */}
                      {responsible && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                          <span className={`w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center shrink-0 ${responsible.avatarColor || 'bg-amber-600'}`}>
                            {responsible.name.split(' ')[0]?.[0]}
                          </span>
                          <span className="truncate max-w-[85px]">{responsible.name.split(' ')[0]}</span>
                        </div>
                      )}

                      {/* Overdue text pill if overdue */}
                      {deadline.isOverdue && !isCompleted ? (
                        <span className="bg-red-100 text-red-900 border border-red-200 text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 animate-pulse">
                          متأخرة ({deadline.daysOverdue}ي)
                        </span>
                      ) : !isCompleted && deadline.daysRemaining !== null && deadline.daysRemaining <= 5 ? (
                        <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                          باقي {deadline.daysRemaining}ي
                        </span>
                      ) : null}

                    </div>

                    {/* Left side: Days Since Last Action in a Circle + Image Thumbnail + Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* دائرة عدد الأيام منذ آخر إجراء */}
                      <div 
                        className="w-6.5 h-6.5 rounded-full bg-stone-100 border border-stone-300 text-stone-800 flex items-center justify-center text-[10.5px] font-mono font-bold shrink-0 shadow-2xs"
                        title={`عدد الأيام منذ آخر إجراء: ${daysSinceAction} ${daysSinceAction === 1 ? 'يوم' : 'أيام'}`}
                      >
                        {daysSinceAction}ي
                      </div>

                      {/* Field Photo Thumbnail */}
                      {displayImageUrl && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage({ url: displayImageUrl, caption: task.imageCaption || task.title });
                          }}
                          className="relative w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-lg overflow-hidden border border-stone-200 shadow-2xs group cursor-pointer shrink-0 bg-stone-100"
                          title="معاينة صورة الموقع وتكبيرها"
                        >
                          <img 
                            src={displayImageUrl} 
                            alt={task.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200" 
                          />
                        </div>
                      )}

                      {/* Progress percentage pill */}
                      <span className="text-[11px] font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-md shrink-0" dir="ltr">
                        {progress}%
                      </span>

                      {/* Chevron Toggle */}
                      <div className="p-0.5 text-stone-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4.5 h-4.5 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4.5 h-4.5" />
                        )}
                      </div>

                    </div>

                  </div>

                  {/* 
                    ================================================================
                    السطر الثاني: دوائر المهام الفرعية + شكل مسار الانتقال + دائرة (+)
                    (مكبرة بنسبة 15% في حجم الشاشة على الهاتف مع كتابة بيان المهمة فقط)
                    ================================================================
                  */}
                  <div className="pt-2 border-t border-stone-100/90 flex items-center overflow-x-auto scrollbar-none whitespace-nowrap pb-1">
                    
                    {task.subtasks.map((step, idx) => {
                      const isStepDone = step.status === 'completed';
                      const isStepActive = step.status === 'in_progress';
                      const isStepBlocked = step.status === 'blocked';
                      const isLast = idx === task.subtasks.length - 1;

                      // Step circle style matching blueprint blue / status
                      const stepCircleBorder = isStepDone
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs'
                        : isStepActive
                        ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400/40 animate-pulse'
                        : isStepBlocked
                        ? 'border-red-500 bg-red-50 text-red-950'
                        : 'border-sky-600 bg-white text-stone-900 hover:border-sky-700 shadow-2xs';

                      return (
                        <React.Fragment key={step.id}>
                          {/* Subtask Circle enlarged +15% on mobile (w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-22 lg:h-22), showing ONLY task statement */}
                          <div 
                            onClick={(e) => handleCycleSubtaskStatus(e, task, step)}
                            title={`بيان الخطوة: ${step.title}\nالحالة الحالية: ${isStepDone ? 'تم الإنجاز ✅' : isStepActive ? 'جاري الإنجاز ⚙️' : 'بانتظار البدء ⏳'}\n(انقر للتبديل السريع بين: جاري الإنجاز / تم الإنجاز / انتظار)`}
                            className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-22 lg:h-22 rounded-full border-2 flex flex-col items-center justify-center p-1.5 text-center shrink-0 cursor-pointer select-none transition-all hover:scale-105 active:scale-95 z-10 relative overflow-hidden ${stepCircleBorder}`}
                          >
                            {/* ONLY Task Statement (بيان المهمة فقط) without 'مهمة 1' or 'مهمة 2' - on two lines max, never overflows */}
                            <div className="w-full flex items-center justify-center px-1 overflow-hidden">
                              <span 
                                className={`text-[9px] sm:text-[10px] md:text-[11px] lg:text-[12px] font-black leading-tight line-clamp-2 break-words max-w-[94%] text-center select-none ${
                                  isStepDone ? 'line-through text-emerald-950 font-bold' : isStepActive ? 'text-amber-950 font-black' : 'text-stone-900'
                                }`}
                                title={step.title}
                              >
                                {step.title}
                              </span>
                            </div>

                            {/* Status badge inside circle: تم الإنجاز / جاري الإنجاز / انتظار */}
                            {isStepDone ? (
                              <span className="text-[7.5px] sm:text-[8.5px] font-black text-emerald-800 flex items-center gap-0.5 leading-none mt-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3] text-emerald-600 shrink-0" />
                                <span>تم الإنجاز</span>
                              </span>
                            ) : isStepActive ? (
                              <span className="text-[7px] sm:text-[8px] font-black text-amber-950 bg-amber-200/90 px-1 py-0.2 rounded-full leading-none mt-0.5 animate-pulse">
                                جاري الإنجاز
                              </span>
                            ) : (
                              <span className="text-[7px] sm:text-[8px] font-bold text-sky-800 leading-none mt-0.5 opacity-80">
                                بانتظار
                              </span>
                            )}
                          </div>

                          {/* Intermediate quasi-square Transition Bridge: height is clearly less than circle, hugs with border-width gap */}
                          {!isLast && (
                            <TransitionBridge
                              note={step.transitionNote}
                              isCompleted={isStepDone}
                              isActive={isStepActive}
                              onClick={(e) => {
                                e?.stopPropagation();
                                const notePrompt = prompt('تعديل ملاحظة أو شرط مسار الانتقال بين الخطوتين:', step.transitionNote || '');
                                if (notePrompt !== null) {
                                  const updatedSubtasks = task.subtasks.map(st => 
                                    st.id === step.id ? { ...st, transitionNote: notePrompt } : st
                                  );
                                  onUpdateTask(task.id, { subtasks: updatedSubtasks });
                                }
                              }}
                              size="compact"
                            />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Connecting line to the (+) circle as in user diagram */}
                    {task.subtasks.length > 0 && (
                      <div className="w-3 sm:w-4 h-0.5 bg-sky-500 rounded-full shrink-0 -mr-0.5 z-0" />
                    )}

                    {/* Circle with (+) inside to add next subtask - Enlarged +15% */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSubtask(task.id);
                      }}
                      title="إضافة مهمة فرعية جديدة لهذه المهمة"
                      className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-full border-2 border-sky-600 hover:border-sky-700 bg-white hover:bg-sky-50 text-sky-600 hover:text-sky-700 flex items-center justify-center shrink-0 cursor-pointer transition shadow-2xs font-bold z-10"
                    >
                      <Plus className="w-4.5 h-4.5 stroke-[3]" />
                    </button>

                  </div>

                </div>

                {/* 
                  ================================================================
                  حالة التوضيح عند الضغط عليها (Expanded State - بطاقة موسعة غنية)
                  "قم بتعديل طريقة عرض المهمة الواحدة لتكون قابلة للتوسيع (Expandable Card)
                   بحيث تعرض تفاصيل إضافية عن المشروع والموعد النهائي عند الضغط عليها،
                   دون الحاجة للذهاب لصفحة أخرى"
                  ================================================================
                */}
                {isExpanded && (
                  <div className="p-3.5 bg-stone-50/70 border-t border-stone-200 space-y-3 animate-fadeIn">
                    
                    {/* 
                      ============================================================
                      بطاقتان متكاملتان: تفاصيل المشروع + الموعد النهائي والجدول
                      ============================================================
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      
                      {/* بطاقة معلومات المشروع التابع له */}
                      <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-black text-stone-900">
                              بيانات المشروع: {project ? project.name : 'غير محدد'}
                            </span>
                          </div>
                          {project && (
                            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded">
                              {project.code}
                            </span>
                          )}
                        </div>

                        {project ? (
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-stone-400 block text-[10px]">العميل:</span>
                              <span className="font-bold text-stone-800 truncate block">{project.client || 'غير محدد'}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">الموقع:</span>
                              <span className="font-bold text-stone-800 truncate block">{project.location || 'الموقع الرئيسي'}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">مدير المشروع:</span>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-stone-800 truncate">
                                  {teamMembers.find(m => m.id === project.projectManagerId)?.name || 'غير محدد'}
                                </span>
                                {teamMembers.find(m => m.id === project.projectManagerId)?.phone && (
                                  <a
                                    href={`tel:${teamMembers.find(m => m.id === project.projectManagerId)?.phone}`}
                                    className="text-stone-400 hover:text-stone-700"
                                    title="اتصال هاتفي"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px]">حالة المشروع:</span>
                              <span className="font-bold text-emerald-700">
                                {project.status === 'active' ? '🟢 جاري التنفيذ' : project.status === 'completed' ? '⚪ مكتمل' : '⏸️ متوقف'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-400 italic">هذه المهمة غير مرتبطة بمشروع محدد</p>
                        )}

                        {task.description && (
                          <div className="pt-1.5 border-t border-stone-100 text-[11px]">
                            <span className="text-stone-400 text-[10px] block">وصف المهمة:</span>
                            <p className="text-stone-700 font-medium leading-relaxed">{task.description}</p>
                          </div>
                        )}
                      </div>

                      {/* بطاقة الموعد النهائي والتاريخ والتحكم الفوري دون مغادرة الصفحة */}
                      <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-black text-stone-900">
                              الموعد النهائي والجدول الزمني
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            deadline.isOverdue && !isCompleted
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {deadline.badgeText}
                          </span>
                        </div>

                        {/* تعديل تاريخ الإغلاق المتوقع مباشرة في نفس المكان */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <div className="space-y-0.5">
                            <span className="text-stone-400 block text-[10px]">تاريخ الإغلاق المتوقع:</span>
                            {editingDateTaskId === task.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={tempClosingDate || task.expectedClosingDate || ''}
                                  onChange={(e) => setTempClosingDate(e.target.value)}
                                  className="border border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold text-stone-800 outline-none bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateTask(task.id, { expectedClosingDate: tempClosingDate || undefined });
                                    setEditingDateTaskId(null);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDateTaskId(null)}
                                  className="text-stone-400 hover:text-stone-700 text-[10px] cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900 text-xs">
                                  {deadline.formattedDate}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempClosingDate(task.expectedClosingDate || '');
                                    setEditingDateTaskId(task.id);
                                  }}
                                  className="text-[10px] text-amber-700 hover:underline font-bold cursor-pointer"
                                >
                                  (تغيير الموعد)
                                </button>
                              </div>
                            )}
                          </div>

                          {/* تاريخ البدء / الإنشاء + زر تنبيه واتساب */}
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-stone-400 block text-[10px]">تاريخ البدء:</span>
                              <span className="font-medium text-stone-700 text-[10.5px]">
                                {new Date(task.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            {responsible?.phone && (
                              <a
                                href={createWhatsAppAlertLink(responsible, task, project, waitingInfo.subtask)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                                title="إرسال تنبيه بالمهمة والموعد عبر واتساب"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>تنبيه واتساب</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* إجمالي نسبة الإنجاز والمسؤول */}
                        <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1">
                            <span className="text-stone-400 text-[10px]">المسؤول الحالي:</span>
                            <span className="font-bold text-stone-800">{responsible?.name || 'غير محدد'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-stone-400 text-[10px]">الإنجاز الكلي:</span>
                            <span className="font-mono font-bold text-emerald-700" dir="ltr">{progress}%</span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Header bar of subtasks list */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800">
                          تفاصيل الخطوات ({task.subtasks.length}):
                        </span>
                        <span className="text-[11px] text-stone-500 hidden sm:inline">
                          يمكنك تعديل الخطوات أو التراجع عن أي خطوة مكتملة
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAddSubtask(task.id)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>+ خطوة</span>
                        </button>
                      </div>
                    </div>

                    {/* Subtasks Detail List */}
                    <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden text-xs">
                      {task.subtasks.map((step, idx) => {
                        const isStepDone = step.status === 'completed';
                        const assigned = teamMembers.find(m => m.id === step.assignedMemberId);

                        return (
                          <div 
                            key={step.id} 
                            className="p-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/80 transition"
                          >
                            {/* Checkbox + Title */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextStatus = isStepDone ? 'pending' : 'completed';
                                  handleUpdateSubtask(task, step.id, {
                                    status: nextStatus,
                                    completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
                                  });
                                }}
                                className={`cursor-pointer transition shrink-0 ${
                                  isStepDone ? 'text-emerald-600' : 'text-stone-300 hover:text-amber-600'
                                }`}
                              >
                                {isStepDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>

                              <span className="text-[10px] font-bold text-stone-400 w-4 shrink-0">#{idx + 1}</span>

                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => handleUpdateSubtask(task, step.id, { title: e.target.value })}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-amber-400 rounded px-1 py-0.5 font-bold outline-none text-xs ${
                                  isStepDone ? 'line-through text-stone-400' : 'text-stone-800'
                                }`}
                              />
                            </div>

                            {/* Assignee & Status */}
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                value={step.assignedMemberId}
                                onChange={(e) => handleUpdateSubtask(task, step.id, { assignedMemberId: e.target.value })}
                                className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-[11px] text-stone-700 outline-none"
                              >
                                {teamMembers.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>

                              {assigned && (
                                <a
                                  href={`tel:${assigned.phone}`}
                                  className="p-1 text-stone-400 hover:text-stone-700"
                                  title={`اتصال: ${assigned.phone}`}
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}

                              {/* Undo button if completed */}
                              {isStepDone && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubtask(task, step.id, { status: 'pending', completedAt: undefined })}
                                  className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                                  title="تراجع عن الإكمال"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>تراجع</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Action Row in Expanded State */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                      
                      <div className="flex items-center gap-2">
                        {/* Task Completion Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleTaskCompleted(task)}
                          className={`font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer text-xs ${
                            isCompleted
                              ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'إعادة فتح المهمة' : 'تعليم كمكتملة بالكامل'}</span>
                        </button>

                        {/* Edit External Link */}
                        <button
                          type="button"
                          onClick={() => setEditingLinkTask(task)}
                          className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer text-xs"
                        >
                          <Link2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{task.externalLink ? 'تعديل الرابط' : 'إرفاق رابط'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Delete Task */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف مهمة "${task.title}"؟`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="text-stone-400 hover:text-red-600 p-1 text-xs font-bold transition cursor-pointer"
                          title="حذف المهمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Close Accordion */}
                        <button
                          type="button"
                          onClick={() => setExpandedTaskId(null)}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold px-2.5 py-1 rounded-lg text-[11px] transition"
                        >
                          طي
                        </button>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* External Link Edit Modal */}
      <EditExternalLinkModal
        isOpen={!!editingLinkTask}
        onClose={() => setEditingLinkTask(null)}
        task={editingLinkTask}
        onSaveLink={(taskId, link, label) => {
          onUpdateTask(taskId, { externalLink: link, externalLinkLabel: label });
          setEditingLinkTask(null);
        }}
      />

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || null}
        caption={lightboxImage?.caption}
      />

    </div>
  );
};
