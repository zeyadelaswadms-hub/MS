import React, { useState, useMemo } from 'react';
import { Task, Project, TeamMember, SubTask } from '../types';
import { getDeadlineInfo, calculateTaskProgress, getActiveWaitingSubtask } from '../utils/dateUtils';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  User, 
  SlidersHorizontal,
  X,
  Phone,
  ExternalLink,
  MoveRight,
  Layers,
  Sparkles,
  RotateCcw,
  GripVertical,
  Flag,
  CalendarRange,
  ArrowRight,
  Check,
  Tag
} from 'lucide-react';
import { EditExternalLinkModal } from './EditExternalLinkModal';
import { ImageLightboxModal } from './ImageLightboxModal';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddSubtask?: (taskId: string) => void;
  onOpenCreateTask: (projectId?: string, initialDate?: string) => void;
  onSelectProject?: (projectId: string) => void;
  defaultProjectId?: string;
}

const WEEKDAYS = [
  { id: 'sat', label: 'السبت', short: 'سبت' },
  { id: 'sun', label: 'الأحد', short: 'أحد' },
  { id: 'mon', label: 'الإثنين', short: 'إثنين' },
  { id: 'tue', label: 'الثلاثاء', short: 'ثلاثاء' },
  { id: 'wed', label: 'الأربعاء', short: 'أربعاء' },
  { id: 'thu', label: 'الخميس', short: 'خميس' },
  { id: 'fri', label: 'الجمعة', short: 'جمعة' },
];

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

interface DragPayload {
  taskId: string;
  sourceDate?: string;
  dragMode: 'closing' | 'start' | 'shift';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  projects,
  teamMembers,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onOpenCreateTask,
  onSelectProject,
  defaultProjectId,
}) => {
  // Current viewed month date (1st of month)
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || 'all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unclosed' | 'overdue' | 'completed'>('all');
  
  // Date Display Mode: All (Start & End), Deadlines only, or Start dates only
  const [dateDisplayMode, setDateDisplayMode] = useState<'all' | 'deadlines' | 'starts'>('all');

  // Drag and drop state
  const [draggedPayload, setDraggedPayload] = useState<DragPayload | null>(null);
  const [dragOverDateStr, setDragOverDateStr] = useState<string | null>(null);
  
  // Toast notification on date changes with Undo
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    subtext?: string;
    undoAction?: () => void;
  } | null>(null);

  // Selected task for detailed modal preview
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);

  // Update selectedProjectId if defaultProjectId changes
  React.useEffect(() => {
    if (defaultProjectId) {
      setSelectedProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const previewTask = useMemo(() => {
    return tasks.find(t => t.id === previewTaskId) || null;
  }, [tasks, previewTaskId]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper to format date YYYY-MM-DD
  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  // Filter tasks based on selected controls
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) {
        return false;
      }
      if (selectedMemberId !== 'all') {
        const isMain = task.assignedMemberId === selectedMemberId;
        const isSub = task.subtasks.some(st => st.assignedMemberId === selectedMemberId);
        if (!isMain && !isSub) return false;
      }
      if (statusFilter !== 'all') {
        const isDone = task.status === 'completed' || calculateTaskProgress(task) === 100;
        const deadline = getDeadlineInfo(task.expectedClosingDate, isDone);
        if (statusFilter === 'completed' && !isDone) return false;
        if (statusFilter === 'unclosed' && isDone) return false;
        if (statusFilter === 'overdue' && (!deadline.isOverdue || isDone)) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, selectedMemberId, statusFilter]);

  // Helper to parse dates safely
  const getTaskDates = (task: Task) => {
    const start = task.startDate || task.createdAt.slice(0, 10);
    const end = task.expectedClosingDate || '';
    let durationDays: number | null = null;
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      durationDays = diff >= 0 ? diff + 1 : 1;
    }
    return { start, end, durationDays };
  };

  // Group tasks by date for the calendar
  // Each date can have:
  // - tasks starting on this date (role: 'start')
  // - tasks ending on this date (role: 'end')
  // - tasks ongoing through this date (role: 'ongoing')
  interface CalendarTaskEntry {
    task: Task;
    role: 'start' | 'end' | 'both' | 'ongoing';
    startStr: string;
    endStr: string;
    durationDays: number | null;
  }

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTaskEntry[]>();

    const addEntry = (dateStr: string, entry: CalendarTaskEntry) => {
      const existing = map.get(dateStr) || [];
      // Prevent duplicate task on same day
      if (!existing.some(e => e.task.id === entry.task.id && e.role === entry.role)) {
        existing.push(entry);
        map.set(dateStr, existing);
      }
    };

    filteredTasks.forEach(task => {
      const { start, end, durationDays } = getTaskDates(task);

      // Single day task or same start & end
      if (start && end && start === end) {
        addEntry(start, { task, role: 'both', startStr: start, endStr: end, durationDays: 1 });
        return;
      }

      // Start date
      if (start && (dateDisplayMode === 'all' || dateDisplayMode === 'starts')) {
        addEntry(start, { task, role: 'start', startStr: start, endStr: end, durationDays });
      }

      // End date (Closing / Deadline)
      if (end && (dateDisplayMode === 'all' || dateDisplayMode === 'deadlines')) {
        addEntry(end, { task, role: 'end', startStr: start, endStr: end, durationDays });
      }
    });

    return map;
  }, [filteredTasks, dateDisplayMode]);

  // Tasks without date
  const unscheduledTasks = useMemo(() => {
    return filteredTasks.filter(t => !t.expectedClosingDate && !t.startDate);
  }, [filteredTasks]);

  // Monthly calendar grid calculation (Starts on Saturday = 0)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // In JS: Sunday is 0, Monday is 1, ..., Saturday is 6.
    // For Saturday start: Saturday = 0, Sunday = 1, ..., Friday = 6
    const jsDay = firstDay.getDay();
    const startOffset = (jsDay + 1) % 7;

    const days: {
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Preceding days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d,
        dateStr: formatDateStr(d),
        isCurrentMonth: false,
        isToday: formatDateStr(d) === todayStr,
      });
    }

    // Days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: formatDateStr(d),
        isCurrentMonth: true,
        isToday: formatDateStr(d) === todayStr,
      });
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: formatDateStr(d),
        isCurrentMonth: false,
        isToday: formatDateStr(d) === todayStr,
      });
    }

    return days;
  }, [year, month, todayStr]);

  // Drag & drop drop handler
  const handleDropOnDate = (targetDateStr: string) => {
    if (!draggedPayload) return;

    const task = tasks.find(t => t.id === draggedPayload.taskId);
    if (!task) return;

    const oldStart = task.startDate;
    const oldEnd = task.expectedClosingDate;
    const { start: currentStart, end: currentEnd, durationDays } = getTaskDates(task);

    let updates: Partial<Task> = {};
    let messageText = '';
    let subtext = '';

    if (draggedPayload.dragMode === 'start') {
      // User dragged the START handle
      updates = { startDate: targetDateStr };
      messageText = `تم تعديل تاريخ بدء مهمة "${task.title}" إلى ${targetDateStr}`;
      if (task.expectedClosingDate && targetDateStr > task.expectedClosingDate) {
        updates.expectedClosingDate = targetDateStr;
        subtext = 'تم تعديل موعد الانتهاء تلقائياً ليتوافق مع موعد البدء الجديد';
      }
    } else if (draggedPayload.dragMode === 'shift' && durationDays && durationDays > 1 && currentStart) {
      // User wants to shift the entire period
      const newStart = targetDateStr;
      const d = new Date(targetDateStr);
      d.setDate(d.getDate() + (durationDays - 1));
      const newEnd = formatDateStr(d);
      updates = { startDate: newStart, expectedClosingDate: newEnd };
      messageText = `تم ترحيل فترة تنفيذ مهمة "${task.title}" كاملة`;
      subtext = `من ${newStart} إلى ${newEnd} (${durationDays} أيام)`;
    } else {
      // Default: dragged the task to set its closing / due date
      updates = { expectedClosingDate: targetDateStr };
      messageText = `تم تغيير موعد تسليم مهمة "${task.title}" إلى ${targetDateStr}`;
      
      // If start date is after target date, adjust start date as well
      if (task.startDate && task.startDate > targetDateStr) {
        updates.startDate = targetDateStr;
        subtext = 'تم ضبط تاريخ البدء ليتطابق مع موعد التسليم الجديد';
      }
    }

    // Apply update
    onUpdateTask(task.id, updates);

    // Toast with Undo
    setToastNotification({
      message: messageText,
      subtext: subtext || 'تم التحديث بنجاح عبر السحب والإفلات التفاعلي',
      undoAction: () => {
        onUpdateTask(task.id, { startDate: oldStart, expectedClosingDate: oldEnd });
        setToastNotification(null);
      },
    });

    setTimeout(() => {
      setToastNotification(prev => (prev?.message === messageText ? null : prev));
    }, 6000);

    setDraggedPayload(null);
    setDragOverDateStr(null);
  };

  // Month summary stats
  const monthStats = useMemo(() => {
    let overdue = 0;
    let completed = 0;
    let startingThisMonth = 0;
    let endingThisMonth = 0;
    let monthTotal = 0;

    filteredTasks.forEach(t => {
      const { start, end } = getTaskDates(t);
      const isDone = t.status === 'completed' || calculateTaskProgress(t) === 100;
      const deadline = getDeadlineInfo(t.expectedClosingDate, isDone);

      let inThisMonth = false;
      if (end) {
        const d = new Date(end);
        if (d.getFullYear() === year && d.getMonth() === month) {
          endingThisMonth++;
          inThisMonth = true;
        }
      }
      if (start) {
        const d = new Date(start);
        if (d.getFullYear() === year && d.getMonth() === month) {
          startingThisMonth++;
          inThisMonth = true;
        }
      }

      if (inThisMonth) {
        monthTotal++;
        if (isDone) completed++;
        else if (deadline.isOverdue) overdue++;
      }
    });

    return { monthTotal, overdue, completed, startingThisMonth, endingThisMonth };
  }, [filteredTasks, year, month]);

  return (
    <div className="space-y-3 font-sans">
      
      {/* Toast notification on Drag and Drop date change with Undo button */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/50 flex items-center gap-3 animate-slideUp max-w-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{toastNotification.message}</p>
            {toastNotification.subtext && (
              <p className="text-[10px] text-stone-300 mt-0.5">{toastNotification.subtext}</p>
            )}
          </div>
          {toastNotification.undoAction && (
            <button
              type="button"
              onClick={toastNotification.undoAction}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 hover:text-amber-300 text-[11px] font-bold rounded-lg border border-stone-700 transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>تراجع</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card: Controls & Navigation */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/90 shadow-xs space-y-3">
        
        {/* Row 1: Month Title & Nav Buttons & View Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Month & Year Title with Navigation */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-amber-700" />
            </div>
            
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                {MONTH_NAMES_AR[month]} {year}
              </h2>
              
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="الشهر التالي"
                  className="p-1 text-stone-600 hover:text-stone-900 hover:bg-white rounded transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-0.5 text-[11px] font-bold text-stone-700 hover:text-stone-950 hover:bg-white rounded transition cursor-pointer"
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="الشهر السابق"
                  className="p-1 text-stone-600 hover:text-stone-900 hover:bg-white rounded transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Summary Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200/80 flex items-center gap-1.5" title="المهام التي تبدأ أو تنتهي هذا الشهر">
              <CalendarRange className="w-3.5 h-3.5 text-stone-500" />
              <span>مهام الشهر:</span>
              <span className="font-mono text-stone-900">{monthStats.monthTotal}</span>
            </span>

            <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1" title="مواعيد بدء المهام هذا الشهر">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>بدء:</span>
              <span className="font-mono font-bold text-emerald-950">{monthStats.startingThisMonth}</span>
            </span>

            <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1" title="مواعيد تسليم المهام هذا الشهر">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>تسليم:</span>
              <span className="font-mono font-bold text-amber-950">{monthStats.endingThisMonth}</span>
            </span>

            {monthStats.overdue > 0 && (
              <span className="bg-red-50 text-red-800 px-2 py-1 rounded-lg border border-red-200 flex items-center gap-1 animate-pulse" title="مهام متأخرة عن موعدها">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span>متأخرة:</span>
                <span className="font-mono font-bold text-red-950">{monthStats.overdue}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => onOpenCreateTask(selectedProjectId !== 'all' ? selectedProjectId : undefined)}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 transition shadow-2xs cursor-pointer text-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ مهمة جديدة</span>
            </button>
          </div>

        </div>

        {/* Row 2: Filters & Date Display Mode & Drag Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-stone-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter by Project */}
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  if (onSelectProject) onSelectProject(e.target.value);
                }}
                className="bg-transparent text-[11px] font-bold text-stone-700 outline-none cursor-pointer"
              >
                <option value="all">كل المشاريع ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Assignee */}
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-stone-700 outline-none cursor-pointer"
              >
                <option value="all">كل المسؤولين ({teamMembers.length})</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Date Display Mode Toggle (مواعيد البدء والانتهاء) */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px] font-bold">
              <span className="text-stone-400 px-1 text-[10px]">العرض:</span>
              <button
                type="button"
                onClick={() => setDateDisplayMode('all')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  dateDisplayMode === 'all'
                    ? 'bg-white text-stone-900 shadow-2xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="عرض مواعيد البدء والانتهاء معاً"
              >
                البدء والانتهاء معاً 🟢🏁
              </button>
              <button
                type="button"
                onClick={() => setDateDisplayMode('deadlines')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  dateDisplayMode === 'deadlines'
                    ? 'bg-white text-stone-900 shadow-2xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="عرض مواعيد التسليم والإغلاق فقط"
              >
                مواعيد التسليم 🏁
              </button>
              <button
                type="button"
                onClick={() => setDateDisplayMode('starts')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  dateDisplayMode === 'starts'
                    ? 'bg-white text-stone-900 shadow-2xs font-black'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="عرض مواعيد البدء فقط"
              >
                مواعيد البدء 🟢
              </button>
            </div>

            {(selectedProjectId !== 'all' || selectedMemberId !== 'all' || statusFilter !== 'all' || dateDisplayMode !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId('all');
                  setSelectedMemberId('all');
                  setStatusFilter('all');
                  setDateDisplayMode('all');
                }}
                className="text-[10px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          {/* Interactive Drag & Drop Visual Guide */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>اسحب أي بطاقة مهمة وأفلتها فوق أي يوم لتغيير تاريخها فوراً</span>
          </div>

        </div>

      </div>

      {/* 
        ========================================================================
        CALENDAR GRID (7 COLUMNS: SATURDAY TO FRIDAY)
        ========================================================================
      */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
        
        {/* Days of Week Header (Saturday to Friday) */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-100/90 text-stone-700 text-xs font-black divide-x divide-x-reverse divide-stone-200 text-center">
          {WEEKDAYS.map(day => (
            <div key={day.id} className="py-2.5 px-1 flex flex-col items-center">
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.short}</span>
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-x-reverse divide-y divide-stone-200/80 text-xs bg-stone-50">
          {calendarDays.map((cell, index) => {
            const dayEntries = tasksByDate.get(cell.dateStr) || [];
            const isTarget = dragOverDateStr === cell.dateStr;

            return (
              <div
                key={cell.dateStr + index}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverDateStr !== cell.dateStr) {
                    setDragOverDateStr(cell.dateStr);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverDateStr === cell.dateStr) {
                    setDragOverDateStr(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnDate(cell.dateStr);
                }}
                className={`min-h-[120px] sm:min-h-[145px] p-1.5 sm:p-2 flex flex-col justify-between transition-all duration-150 relative group ${
                  !cell.isCurrentMonth
                    ? 'bg-stone-100/50 text-stone-400'
                    : cell.isToday
                    ? 'bg-amber-50/40 text-stone-900 font-bold'
                    : 'bg-white text-stone-800'
                } ${
                  isTarget 
                    ? 'ring-2 ring-amber-500 bg-amber-100/90 shadow-md scale-[1.01] z-20' 
                    : ''
                }`}
              >
                {/* Day Header: Date Number + Badges + Quick Add */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        cell.isToday
                          ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400/40'
                          : cell.isCurrentMonth
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {/* Small count pill if many tasks on this day */}
                    {dayEntries.length > 0 && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200 font-bold">
                        {dayEntries.length}
                      </span>
                    )}
                  </div>

                  {/* Quick Add Button for this specific day */}
                  <button
                    type="button"
                    onClick={() => onOpenCreateTask(selectedProjectId !== 'all' ? selectedProjectId : undefined, cell.dateStr)}
                    title={`إضافة مهمة تبدأ في يوم ${cell.dateStr}`}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-amber-800 rounded transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Tasks List (Scrollable) */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[100px] sm:max-h-[125px] scrollbar-none pr-0.5">
                  {dayEntries.map(({ task, role, startStr, endStr, durationDays }) => {
                    const project = projects.find(p => p.id === task.projectId);
                    const progress = calculateTaskProgress(task);
                    const isCompleted = task.status === 'completed' || progress === 100;
                    const deadline = getDeadlineInfo(task.expectedClosingDate, isCompleted);
                    const isDragging = draggedPayload?.taskId === task.id;

                    // Role-based badge styling
                    const isStart = role === 'start';
                    const isEnd = role === 'end';
                    const isBoth = role === 'both';

                    let cardBorder = 'border-stone-200';
                    let cardBg = 'bg-stone-50 hover:bg-stone-100';

                    if (isCompleted) {
                      cardBorder = 'border-emerald-300';
                      cardBg = 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950';
                    } else if (isEnd && deadline.isOverdue) {
                      cardBorder = 'border-red-300';
                      cardBg = 'bg-red-50/90 hover:bg-red-100 text-red-950';
                    } else if (isStart) {
                      cardBorder = 'border-emerald-300';
                      cardBg = 'bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-950';
                    } else if (isEnd) {
                      cardBorder = 'border-amber-300';
                      cardBg = 'bg-amber-50/80 hover:bg-amber-100 text-amber-950';
                    }

                    return (
                      <div
                        key={`${task.id}-${role}`}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', task.id);
                          setDraggedPayload({
                            taskId: task.id,
                            sourceDate: cell.dateStr,
                            dragMode: isStart ? 'start' : isEnd ? 'closing' : 'shift',
                          });
                        }}
                        onDragEnd={() => {
                          setDraggedPayload(null);
                          setDragOverDateStr(null);
                        }}
                        onClick={() => setPreviewTaskId(task.id)}
                        className={`p-1 sm:p-1.5 rounded-lg border text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all cursor-grab active:cursor-grabbing select-none group/card ${cardBg} ${cardBorder} ${
                          isDragging ? 'opacity-30 scale-95' : 'hover:scale-[1.01]'
                        }`}
                        title={`مهمة: ${task.title}\nالمشروع: ${project?.name || ''}\nالبدء: ${startStr || 'غير محدد'}\nالتسليم: ${endStr || 'غير محدد'}\n(اسحب لتغيير التاريخ أو انقر للتفاصيل)`}
                      >
                        {/* Header: Role Badge + Task Title */}
                        <div className="flex items-center gap-1 leading-tight">
                          {/* Role Tag (بدء / تسليم) */}
                          {isStart && (
                            <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-600 text-white font-black shrink-0 flex items-center gap-0.5">
                              <span>🟢 بدء</span>
                            </span>
                          )}
                          {isEnd && (
                            <span className={`px-1 py-0.2 rounded text-[8px] font-black shrink-0 flex items-center gap-0.5 ${
                              deadline.isOverdue && !isCompleted ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white'
                            }`}>
                              <span>🏁 تسليم</span>
                            </span>
                          )}
                          {isBoth && (
                            <span className="px-1 py-0.2 rounded text-[8px] bg-purple-600 text-white font-black shrink-0">
                              <span>📅 يوم واحد</span>
                            </span>
                          )}

                          <span className={`truncate flex-1 font-bold ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Dates info row (Start ➔ End) */}
                        <div className="flex items-center justify-between gap-1 mt-0.5 text-[8.5px] opacity-80 font-normal">
                          <span className="truncate max-w-[70px]">
                            {project?.name || 'مشروع'}
                          </span>
                          
                          {durationDays && (
                            <span className="font-mono text-stone-600 shrink-0 font-bold">
                              {durationDays} {durationDays === 1 ? 'يوم' : 'أيام'}
                            </span>
                          )}
                        </div>

                        {/* Progress and status hint */}
                        <div className="flex items-center justify-between gap-1 mt-0.5 text-[8px]">
                          <span className="font-mono opacity-75" dir="ltr">
                            {progress}%
                          </span>
                          {isEnd && deadline.isOverdue && !isCompleted && (
                            <span className="text-red-700 font-bold">
                              تأخير {Math.abs(deadline.daysDiff)} يوم!
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Drop zone indicator when dragging over */}
                  {isTarget && (
                    <div className="border-2 border-dashed border-amber-500 rounded-lg p-1.5 text-center text-[10px] font-black text-amber-950 bg-amber-100 animate-pulse">
                      إفلات لنقل موعد المهمة هنا 📌
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Unscheduled Tasks Tray at the bottom */}
      {unscheduledTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-stone-900">
                مهام غير محدد لها مواعيد بدء أو إغلاق ({unscheduledTasks.length}):
              </h3>
            </div>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              اسحب أي مهمة من هذه القائمة وأفلتها فوق اليوم المطلوب في التقويم لجدولتها فوراً
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {unscheduledTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              return (
                <div
                  key={task.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    setDraggedPayload({
                      taskId: task.id,
                      dragMode: 'closing',
                    });
                  }}
                  onDragEnd={() => {
                    setDraggedPayload(null);
                    setDragOverDateStr(null);
                  }}
                  onClick={() => setPreviewTaskId(task.id)}
                  className="bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-400 p-2 rounded-xl text-xs font-bold shrink-0 w-52 sm:w-60 cursor-grab active:cursor-grabbing transition shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-stone-900">{task.title}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded font-black shrink-0">
                      جدولة 📅
                    </span>
                  </div>
                  {project && (
                    <span className="text-[10px] text-stone-500 truncate block">
                      {project.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        TASK DETAILS QUICK MODAL / DRAWER (عند الضغط على المهمة في التقويم)
        ========================================================================
      */}
      {previewTask && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-scaleUp space-y-0">
            
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-400/30" />
                <div>
                  <h3 className="font-black text-sm sm:text-base truncate max-w-md">
                    {previewTask.title}
                  </h3>
                  <span className="text-[10px] text-amber-300 font-bold">
                    معاينة وتعديل مواعيد المهمة والخطوات
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTaskId(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Project & Schedule Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Project Info */}
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-stone-900 border-b border-stone-200/60 pb-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>المشروع التابع:</span>
                  </div>
                  {(() => {
                    const proj = projects.find(p => p.id === previewTask.projectId);
                    return proj ? (
                      <div className="space-y-1 text-[11px]">
                        <p className="font-bold text-stone-900">{proj.name} ({proj.code})</p>
                        <p className="text-stone-600">العميل: <span className="font-medium text-stone-800">{proj.client}</span></p>
                        <p className="text-stone-600">الموقع: <span className="font-medium text-stone-800">{proj.location}</span></p>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic">بدون مشروع محدد</p>
                    );
                  })()}
                </div>

                {/* Supervisor Info */}
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-stone-900 border-b border-stone-200/60 pb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>المشرف العام المسؤول:</span>
                  </div>
                  {(() => {
                    const member = teamMembers.find(m => m.id === previewTask.assignedMemberId);
                    return member ? (
                      <div className="space-y-1 text-[11px]">
                        <p className="font-bold text-stone-900">{member.name}</p>
                        <p className="text-stone-600">الوظيفة: <span className="font-medium text-stone-800">{member.role}</span></p>
                        <a 
                          href={`tel:${member.phone}`}
                          className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                          dir="ltr"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </a>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic">غير محدد</p>
                    );
                  })()}
                </div>

              </div>

              {/* Start & End Date Dual Editor Box */}
              <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                    <CalendarRange className="w-4 h-4 text-amber-700" />
                    <span>مواعيد بدء وانتهاء المهمة:</span>
                  </div>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-200/70 px-2 py-0.5 rounded-full">
                    حفظ فوري تلقائي
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Start Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>تاريخ البدء:</span>
                    </label>
                    <input
                      type="date"
                      value={previewTask.startDate || previewTask.createdAt.slice(0, 10)}
                      onChange={(e) => onUpdateTask(previewTask.id, { startDate: e.target.value || undefined })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>تاريخ الانتهاء / التسليم:</span>
                    </label>
                    <input
                      type="date"
                      value={previewTask.expectedClosingDate || ''}
                      onChange={(e) => onUpdateTask(previewTask.id, { expectedClosingDate: e.target.value || undefined })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Duration & Status calculation */}
                {(() => {
                  const { start, end, durationDays } = getTaskDates(previewTask);
                  const isDone = previewTask.status === 'completed' || calculateTaskProgress(previewTask) === 100;
                  const deadline = getDeadlineInfo(previewTask.expectedClosingDate, isDone);

                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-bold text-stone-700">
                      <div className="flex items-center gap-2">
                        {durationDays && (
                          <span className="bg-white border border-amber-200 px-2 py-0.5 rounded-lg text-amber-950 font-black">
                            ⏱️ المدة الإجمالية: {durationDays} {durationDays === 1 ? 'يوم' : 'أيام'}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg border ${
                          isDone 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                            : deadline.isOverdue 
                            ? 'bg-red-100 text-red-900 border-red-300' 
                            : 'bg-stone-100 text-stone-800 border-stone-200'
                        }`}>
                          {deadline.badgeText}
                        </span>
                      </div>

                      {/* Quick extension shortcuts */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-500">تمديد سريع:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const base = previewTask.expectedClosingDate ? new Date(previewTask.expectedClosingDate) : new Date();
                            base.setDate(base.getDate() + 3);
                            onUpdateTask(previewTask.id, { expectedClosingDate: formatDateStr(base) });
                          }}
                          className="px-1.5 py-0.5 bg-white hover:bg-stone-100 border border-stone-300 rounded text-[10px] font-bold text-stone-800"
                        >
                          +3 أيام
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const base = previewTask.expectedClosingDate ? new Date(previewTask.expectedClosingDate) : new Date();
                            base.setDate(base.getDate() + 7);
                            onUpdateTask(previewTask.id, { expectedClosingDate: formatDateStr(base) });
                          }}
                          className="px-1.5 py-0.5 bg-white hover:bg-stone-100 border border-stone-300 rounded text-[10px] font-bold text-stone-800"
                        >
                          + أسبوع
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Subtasks Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                  <span>سلسلة الخطوات الفرعية ({previewTask.subtasks.length}):</span>
                  {onAddSubtask && (
                    <button
                      type="button"
                      onClick={() => onAddSubtask(previewTask.id)}
                      className="text-amber-800 hover:text-amber-950 font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة خطوة</span>
                    </button>
                  )}
                </div>

                <div className="bg-stone-50 rounded-2xl border border-stone-200 divide-y divide-stone-100 text-xs">
                  {previewTask.subtasks.map((step) => {
                    const isDone = step.status === 'completed';
                    const assigned = teamMembers.find(m => m.id === step.assignedMemberId);

                    return (
                      <div key={step.id} className="p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = previewTask.subtasks.map(s => 
                                s.id === step.id ? { ...s, status: isDone ? 'pending' : 'completed' as any } : s
                              );
                              onUpdateTask(previewTask.id, { subtasks: updated });
                            }}
                            className={`p-0.5 rounded cursor-pointer transition ${isDone ? 'text-emerald-600' : 'text-stone-300 hover:text-amber-600'}`}
                            title={isDone ? 'تغيير إلى غير مكتمل' : 'تعليم كمكتمل'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <span className={`truncate font-bold ${isDone ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                            {step.title}
                          </span>
                        </div>

                        {assigned && (
                          <span className="text-[10px] text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded-lg shrink-0">
                            {assigned.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewTaskId(null)}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-black px-5 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  إغلاق النافذة
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Lightbox for preview images */}
      {lightboxImage && (
        <ImageLightboxModal
          isOpen={true}
          imageUrl={lightboxImage.url}
          imageCaption={lightboxImage.caption}
          onClose={() => setLightboxImage(null)}
        />
      )}

    </div>
  );
};
