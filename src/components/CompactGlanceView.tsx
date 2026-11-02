import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Project, TeamMember, SubTask, SubTaskStatus } from '../types';
import { 
  getDeadlineInfo, 
  calculateTaskProgress, 
  getActiveWaitingSubtask, 
  createWhatsAppAlertLink,
  getDaysSinceLastAction
} from '../utils/dateUtils';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Phone, 
  MessageSquare, 
  Plus, 
  Search, 
  Check, 
  Link2, 
  Trash2, 
  Edit3,
  RotateCcw, 
  Building2, 
  User, 
  X, 
  Download, 
  LayoutGrid
} from 'lucide-react';
import { EditExternalLinkModal } from './EditExternalLinkModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { SubtaskEditModal } from './SubtaskEditModal';
import { TransitionBridge } from './TransitionBridge';
import { SubtaskDetailsDialog } from './SubtaskDetailsDialog';
import { ExcelImportModal } from './ExcelImportModal';
import { downloadTasksJSON } from '../utils/backupUtils';
import { 
  computePipelineStatusOnSubtaskChange, 
  getTransitionEffectiveStatus, 
  cycleTransitionStatus, 
  enforceTransitionRuleOnSubtasks 
} from '../utils/pipelineUtils';

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
  onOpenEditTask?: (task: Task) => void;
  onImportTasks?: (newTasks: Task[], newProjects: Project[]) => void;
  onImportDatabase?: (data: {
    projects: Project[];
    teamMembers: TeamMember[];
    tasks: Task[];
    mode: 'merge' | 'replace';
  }) => void;
}

/**
 * Circular Pipeline Step Node matching the requested diagram:
 * - Perfect circular node showing ONLY the short step title
 * - Single Click / Tap: Toggles / Cycles status (انتظار ➔ جارية ➔ مكتملة)
 * - Long-Press (>= 450ms) / Right-Click: Opens full details & editing popup dialog
 */
interface PipelineCircleNodeProps {
  task: Task;
  step: SubTask;
  index: number;
  total: number;
  onCycleStatus: (task: Task, step: SubTask) => void;
  onOpenDetails: (task: Task, step: SubTask) => void;
}

const PipelineCircleNode: React.FC<PipelineCircleNodeProps> = ({
  task,
  step,
  index,
  total,
  onCycleStatus,
  onOpenDetails,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const isMovedOrScrollingRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchActiveRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  // Mobile Touch Handlers: strictly distinguishes between scrolling and tapping
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchActiveRef.current = true;
    isLongPressRef.current = false;
    isMovedOrScrollingRef.current = false;

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    setIsPressing(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Fire long press ONLY if finger has not moved/scrolled
      if (!isMovedOrScrollingRef.current) {
        isLongPressRef.current = true;
        setIsPressing(false);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch (_) {}
        }
        onOpenDetails(task, step);
      }
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // If moved more than 6px, it is a scroll/swipe gesture: cancel all tap actions!
    if (dx > 6 || dy > 6) {
      isMovedOrScrollingRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPressing(false);
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);

    // If finger moved or scrolled across steps, IGNORE completely!
    if (isMovedOrScrollingRef.current) {
      touchStartPosRef.current = null;
      return;
    }

    // If long-press details dialog already opened, do not cycle status
    if (isLongPressRef.current) {
      touchStartPosRef.current = null;
      return;
    }

    // Genuine stationary single tap in place: cycle status
    touchStartPosRef.current = null;
    onCycleStatus(task, step);
  };

  const handleTouchCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isMovedOrScrollingRef.current = true;
    setIsPressing(false);
    touchStartPosRef.current = null;
  };

  // Mouse Handlers for Desktop Only
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTouchActiveRef.current) return; // Ignore synthetic mouse events on touch devices
    if (e.button !== 0) return; // Only left click
    isLongPressRef.current = false;
    isMovedOrScrollingRef.current = false;
    setIsPressing(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressing(false);
      onOpenDetails(task, step);
    }, 450);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isTouchActiveRef.current) {
      setTimeout(() => { isTouchActiveRef.current = false; }, 400);
      return;
    }
    if (e.button !== 0) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);

    if (!isLongPressRef.current && !isMovedOrScrollingRef.current) {
      onCycleStatus(task, step);
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
    isMovedOrScrollingRef.current = true;
  };

  const isStepDone = step.status === 'completed';
  const isStepActive = step.status === 'in_progress';
  const isStepBlocked = step.status === 'blocked';

  let circleStyles = 'border-[#22404e] bg-[#101c22] text-slate-300 hover:border-cyan-400/70 hover:text-white';

  if (isStepDone) {
    circleStyles = 'border-emerald-500 bg-[#0c2a21] text-emerald-200 shadow-2xs hover:border-emerald-400';
  } else if (isStepActive) {
    circleStyles = 'border-[#22d3ee] bg-[#0c2b36] text-white shadow-[0_0_12px_rgba(34,211,238,0.3)] ring-2 ring-cyan-400/40 animate-pulse';
  } else if (isStepBlocked) {
    circleStyles = 'border-rose-500 bg-[#351419] text-rose-200 hover:border-rose-400';
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenDetails(task, step);
      }}
      title={`الخطوة: ${step.title}\nالحالة: ${isStepDone ? 'مكتملة ✅' : isStepActive ? 'جارية ⚙️' : isStepBlocked ? 'معطلة ⛔' : 'انتظار ⏳'}\n(نقرة واحدة لتغيير الحالة • اضغط مطولاً للتعديل والتفاصيل)`}
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center p-1.5 text-center transition-all select-none cursor-pointer shrink-0 z-10 ${circleStyles} ${
        isPressing ? 'scale-90 ring-2 ring-cyan-400/60' : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* ONLY the short step title is rendered inside the circle */}
      <span className="text-[10px] sm:text-[11px] font-black leading-tight line-clamp-2 max-w-full break-words text-center pointer-events-none">
        {step.title}
      </span>
    </div>
  );
};

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
  onOpenEditTask,
  onImportTasks,
  onImportDatabase,
}) => {
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Status Filter: 'all' | 'ongoing' | 'overdue' | 'completed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'overdue' | 'completed'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Self-heal project selection if project list updates (e.g. from Excel upload)
  useEffect(() => {
    if (selectedProjectId !== 'all' && !projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId('all');
    }
  }, [projects, selectedProjectId]);

  // Modals state
  const [editingLinkTask, setEditingLinkTask] = useState<Task | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const [editingSubtaskTarget, setEditingSubtaskTarget] = useState<{ task: Task; subtask: SubTask } | null>(null);
  const [selectedSubtaskDetails, setSelectedSubtaskDetails] = useState<{ task: Task; subtask: SubTask } | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

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

      // Filter by team member
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

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const project = projects.find(p => p.id === task.projectId);
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchProject = project?.name.toLowerCase().includes(q) || project?.code.toLowerCase().includes(q);
        const matchCategory = task.category?.toLowerCase().includes(q);
        const matchAssignee = teamMembers.find(m => m.id === task.assignedMemberId)?.name.toLowerCase().includes(q);
        const matchSubtasks = task.subtasks?.some(st => st.title.toLowerCase().includes(q));

        if (!matchTitle && !matchDesc && !matchProject && !matchCategory && !matchAssignee && !matchSubtasks) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, statusFilter, selectedProjectId, selectedMemberId, selectedPriority, searchQuery, projects, teamMembers]);

  // Subtask updater with sequential pipeline logic & transition status enforcement
  const handleUpdateSubtask = (taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, ...updates };
      }
      return st;
    });

    // Enforce core rule: transitionStatus must NEVER lag behind the next subtask!
    const finalizedSubtasks = enforceTransitionRuleOnSubtasks(updatedSubtasks);

    const newPipelineStatus = updates.status
      ? computePipelineStatusOnSubtaskChange(task, subtaskId, updates.status, finalizedSubtasks)
      : task.status;

    onUpdateTask(task.id, {
      subtasks: finalizedSubtasks,
      status: newPipelineStatus,
    });
  };

  // Cycle status for a transition bridge (single tap) with strict constraint
  const handleCycleTransitionStatus = (task: Task, step: SubTask, nextStep?: SubTask | null) => {
    const newTransStatus = cycleTransitionStatus(step, nextStep);

    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === step.id) {
        return {
          ...st,
          transitionStatus: newTransStatus,
        };
      }
      return st;
    });

    // Enforce rule across all steps
    const finalizedSubtasks = enforceTransitionRuleOnSubtasks(updatedSubtasks);

    onUpdateTask(task.id, {
      subtasks: finalizedSubtasks,
    });
  };

  // Cycle status for a subtask: pending ➔ in_progress ➔ completed ➔ pending
  const handleCycleSubtaskStatus = (task: Task, subtask: SubTask) => {
    let nextStatus: SubTaskStatus = 'in_progress';
    if (subtask.status === 'pending') {
      nextStatus = 'in_progress';
    } else if (subtask.status === 'in_progress') {
      nextStatus = 'completed';
    } else {
      nextStatus = 'pending';
    }

    handleUpdateSubtask(task.id, subtask.id, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
    });
  };

  // Delete a subtask
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const remaining = task.subtasks.filter(s => s.id !== subtaskId).map((st, i) => ({
      ...st,
      order: i + 1,
    }));
    onUpdateTask(taskId, { subtasks: remaining });
  };

  // Add next subtask immediately after index
  const handleAddNextSubtask = (taskId: string, currentIndex: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSubtask: SubTask = {
      id: `sub-${Date.now()}-${task.subtasks.length + 1}`,
      order: currentIndex + 2,
      title: `خطوة جديدة (${currentIndex + 2})`,
      assignedMemberId: task.assignedMemberId,
      status: 'pending',
      transitionNote: '',
      estimatedDays: 1,
    };
    const updated = [...task.subtasks];
    updated.splice(currentIndex + 1, 0, newSubtask);
    const reordered = updated.map((st, i) => ({ ...st, order: i + 1 }));
    onUpdateTask(taskId, { subtasks: reordered });
  };

  return (
    <div className="space-y-2.5 pb-24 md:pb-8">
      
      {/* 
        ========================================================================
        1. FIRST ROW: Title ("ملخص المهام") + 3 Circular Status Filters
        ========================================================================
      */}
      <div className="bg-[#132229] rounded-2xl px-3 py-2 border border-[#1b3440] shadow-md flex items-center justify-between gap-2 overflow-x-auto scrollbar-none flex-nowrap min-h-[42px]">
        
        {/* Title and 3 Circles strictly on the same row */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          
          {/* Title: ملخص المهام */}
          <div className="flex items-center gap-1.5 shrink-0">
            <LayoutGrid className="w-4 h-4 text-[#22d3ee] shrink-0" />
            <h2 className="text-xs sm:text-sm font-black text-white tracking-tight whitespace-nowrap">
              ملخص المهام
            </h2>
          </div>

          <div className="h-4 w-[1px] bg-[#224050] shrink-0" />

          {/* 3 Circles */}
          <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
            
            {/* Cyan Circle: المهام الجارية */}
            <button
              type="button"
              onClick={() => setStatusFilter(prev => prev === 'ongoing' ? 'all' : 'ongoing')}
              title={statusFilter === 'ongoing' ? 'إلغاء التصفية' : 'تصفية: المهام الجارية'}
              className={`flex items-center gap-1 p-0.5 rounded-full transition cursor-pointer shrink-0 ${
                statusFilter === 'ongoing' 
                  ? 'bg-[#0d3442] ring-2 ring-[#22d3ee] shadow-2xs pr-0.5 pl-2' 
                  : 'hover:bg-[#182b34]'
              }`}
            >
              <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white shadow-2xs transition-transform active:scale-90 ${
                statusFilter === 'ongoing' ? 'bg-[#0891b2] scale-105' : 'bg-[#0e7490]'
              }`}>
                {stats.ongoingCount}
              </span>
              {statusFilter === 'ongoing' && (
                <span className="text-[10px] font-bold text-[#22d3ee] whitespace-nowrap px-1">
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
                  ? 'bg-[#3b151b] ring-2 ring-rose-500 shadow-2xs pr-0.5 pl-2' 
                  : 'hover:bg-[#182b34]'
              }`}
            >
              <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white shadow-2xs transition-transform active:scale-90 ${
                statusFilter === 'overdue' ? 'bg-rose-600 scale-105' : 'bg-rose-500'
              }`}>
                {stats.overdueCount}
              </span>
              {statusFilter === 'overdue' && (
                <span className="text-[10px] font-bold text-rose-300 whitespace-nowrap px-1">
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
                  ? 'bg-[#0f2e24] ring-2 ring-emerald-400 shadow-2xs pr-0.5 pl-2' 
                  : 'hover:bg-[#182b34]'
              }`}
            >
              <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white shadow-2xs transition-transform active:scale-90 ${
                statusFilter === 'completed' ? 'bg-emerald-600 scale-105' : 'bg-emerald-700'
              }`}>
                {stats.completedCount}
              </span>
              {statusFilter === 'completed' && (
                <span className="text-[10px] font-bold text-emerald-300 whitespace-nowrap px-1">
                  المكتملة
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Counter & quick reset if active + JSON Backup Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {downloadSuccessToast && (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-md animate-fadeIn">
              {downloadSuccessToast}
            </span>
          )}

          {statusFilter !== 'all' ? (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-[10px] font-bold text-[#22d3ee] bg-[#11323f] hover:bg-[#174455] border border-[#1b5062] px-2 py-0.5 rounded-md transition cursor-pointer"
            >
              عرض الكل ({stats.total})
            </button>
          ) : (
            <span className="text-[11px] font-bold text-slate-400">
              إجمالي: <strong className="text-white font-mono">{stats.total}</strong>
            </span>
          )}

          {/* Excel & Sheets Template & Bulk Import Button */}
          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-emerald-300 hover:text-white bg-[#0e2a21] hover:bg-[#143d30] border border-emerald-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
            title="تحميل نموذج Excel أو استيراد البيانات دفعة واحدة من Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">نموذج Excel / شيت 📥</span>
            <span className="sm:hidden">إكسيل 📥</span>
          </button>

          {/* Backup Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-[#182c35] hover:bg-[#1f3743] border border-[#234250] px-2 py-1 rounded-lg transition cursor-pointer shadow-2xs"
            title="تحميل بيانات المهام كملف JSON للنسخ الاحتياطي"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">نسخ احتياطي JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>

          {/* Google Sheets Integration Button */}
          {onOpenGoogleSheets && (
            <button
              type="button"
              onClick={onOpenGoogleSheets}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 hover:text-white bg-[#0e2a21] hover:bg-[#13392d] border border-[#1a5542] px-2 py-1 rounded-lg transition cursor-pointer shadow-2xs"
              title="تصدير ومزامنة جداول المقاولات مع Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Google Sheets 📊</span>
              <span className="sm:hidden">Sheets</span>
            </button>
          )}
        </div>

      </div>

      {/* 
        ========================================================================
        2. DEDICATED SECOND ROW: Filters & Search (Ultra-compact)
        ========================================================================
      */}
      <div className="bg-[#132229] rounded-2xl px-2.5 py-1.5 border border-[#1b3440] shadow-md flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none flex-nowrap min-h-[38px]">
        
        {/* Right side (in RTL): Projects filter + Persons filter */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          
          {/* Projects Filter */}
          {projects.length > 0 && (
            <div className="relative shrink-0">
              <div className={`flex items-center gap-1 border rounded-lg px-2 py-0.5 h-7 text-[11px] font-bold transition ${
                selectedProjectId !== 'all' 
                  ? 'bg-[#0f3b47] border-[#1d6375] text-[#22d3ee]' 
                  : 'bg-[#182c35] hover:bg-[#1f3743] border-[#22404e] text-slate-300'
              }`}>
                <Building2 className={`w-3 h-3 shrink-0 ${selectedProjectId !== 'all' ? 'text-[#22d3ee]' : 'text-slate-400'}`} />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer max-w-[100px] sm:max-w-[130px] truncate text-[11px] font-bold text-white"
                >
                  <option value="all" className="bg-[#132229] text-white">كل المشاريع ({projects.length})</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#132229] text-white">[{p.code}] {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Persons / Team Members Filter */}
          {teamMembers.length > 0 && (
            <div className="relative shrink-0">
              <div className={`flex items-center gap-1 border rounded-lg px-2 py-0.5 h-7 text-[11px] font-bold transition ${
                selectedMemberId !== 'all' 
                  ? 'bg-[#0f3b47] border-[#1d6375] text-[#22d3ee]' 
                  : 'bg-[#182c35] hover:bg-[#1f3743] border-[#22404e] text-slate-300'
              }`}>
                <User className={`w-3 h-3 shrink-0 ${selectedMemberId !== 'all' ? 'text-[#22d3ee]' : 'text-slate-400'}`} />
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer max-w-[90px] sm:max-w-[120px] truncate text-[11px] font-bold text-white"
                >
                  <option value="all" className="bg-[#132229] text-white">كل الأشخاص ({teamMembers.length})</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#132229] text-white">{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Priority Filter */}
          <div className="relative shrink-0">
            <div className={`flex items-center gap-1 border rounded-lg px-2 py-0.5 h-7 text-[11px] font-bold transition ${
              selectedPriority !== 'all' 
                ? 'bg-[#0f3b47] border-[#1d6375] text-[#22d3ee]' 
                : 'bg-[#182c35] hover:bg-[#1f3743] border-[#22404e] text-slate-300'
            }`}>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-[11px] font-bold text-white"
              >
                <option value="all" className="bg-[#132229] text-white">كل الأولويات</option>
                <option value="urgent" className="bg-[#132229] text-white">🔴 عاجلة</option>
                <option value="high" className="bg-[#132229] text-white">🟠 مرتفعة</option>
                <option value="medium" className="bg-[#132229] text-white">🟡 متوسطة</option>
                <option value="low" className="bg-[#132229] text-white">🟢 منخفضة</option>
              </select>
            </div>
          </div>

        </div>

        {/* Left side (in RTL): Search Input */}
        <div className="relative w-28 sm:w-44 shrink-0">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            className="w-full pl-6 pr-6 py-0.5 h-7 bg-[#182c35] border border-[#22404e] focus:border-[#22d3ee] rounded-lg text-[11px] text-white placeholder:text-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>

      {/* 
        ========================================================================
        HIGH-DENSITY COMPACT TASKS LIST (ضغط الشاشة لإظهار أكبر عدد من المهام)
        Shows ONLY Project Code + Task Title + Sequential Subtask Pipeline
        ========================================================================
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
        {filteredTasks.length === 0 ? (
          <div className="md:col-span-2 bg-[#132229] rounded-2xl p-6 text-center border border-[#1b3440] text-slate-400 space-y-1.5">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
            <p className="text-xs font-bold text-slate-200">
              لا توجد مهام مطابقة للفلتر المحدد
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            const progress = calculateTaskProgress(task);
            const isCompleted = task.status === 'completed' || progress === 100;
            const deadline = getDeadlineInfo(task.expectedClosingDate, isCompleted);
            const waitingInfo = getActiveWaitingSubtask(task, teamMembers);
            const mainAssignee = teamMembers.find(m => m.id === task.assignedMemberId);
            const responsible = waitingInfo.responsibleMember || mainAssignee;
            const projectCode = project?.code || 'عام';

            return (
              <div
                key={task.id}
                className="bg-[#132229] rounded-xl border border-[#1c3542] hover:border-[#22d3ee]/50 transition-all p-2 sm:p-2.5 shadow-sm space-y-1.5"
              >
                
                {/* 
                  ROW 1: Project Code Badge + Task Title + Quick Actions (Edit/Delete/Status)
                */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  
                  {/* Right side (RTL): Task Title FIRST, then Project Name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* 1. Task Title FIRST */}
                    <h3 
                      className={`text-xs sm:text-[13px] font-black truncate leading-tight ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-white'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </h3>

                    {/* 2. Project Name Badge AFTER task title */}
                    <span 
                      onClick={() => {
                        if (project && onSelectProject) {
                          onSelectProject(project.id);
                        }
                      }}
                      className="text-[9.5px] sm:text-[10px] font-bold bg-[#0e3b43] text-[#22d3ee] border border-[#144f5f] px-2 py-0.5 rounded-md shrink-0 tracking-tight cursor-pointer hover:bg-[#124953] transition max-w-[110px] sm:max-w-[150px] truncate"
                      title={`المشروع: ${project?.name || 'مشروع عام'}`}
                    >
                      {project?.name || 'مشروع عام'}
                    </span>
                  </div>

                  {/* Left side (RTL): Status label + Edit & Delete icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    
                    {/* Status Pill */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      isCompleted 
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800' 
                        : deadline.isOverdue 
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800 animate-pulse' 
                        : 'bg-[#0e3b43] text-cyan-200 border border-[#144f5f]'
                    }`}>
                      {isCompleted ? 'مكتملة' : deadline.isOverdue ? 'متأخرة' : `${progress}%`}
                    </span>

                    {/* Edit Task icon */}
                    {onOpenEditTask && (
                      <button
                        type="button"
                        onClick={() => onOpenEditTask(task)}
                        className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-[#182c35] active:scale-95 rounded-md transition cursor-pointer"
                        title="تعديل تفاصيل المهمة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Task icon */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف مهمة "${task.title}"؟`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 active:scale-95 rounded-md transition cursor-pointer"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* 
                  ROW 2: THE SEQUENTIAL PIPELINE MATCHING SKETCH
                  - Circles showing ONLY the short step title
                  - Transition bridges in between
                  - Connected line `---` to (+) circle button
                  - Tap circle opens SubtaskDetailsDialog
                */}
                <div className="bg-[#0b161c] rounded-xl p-2 sm:p-2.5 border border-[#162c37] flex items-center overflow-x-auto scrollbar-none py-2 px-2.5 min-h-[68px] touch-pan-x overscroll-x-contain">
                  {task.subtasks.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-bold">لا توجد خطوات مضافة</span>
                      <div className="w-3 sm:w-5 h-[2px] bg-[#1e4657] shrink-0" />
                      <button
                        type="button"
                        onClick={() => onAddSubtask(task.id)}
                        className="w-10 h-10 rounded-full border-2 border-[#0284c7] hover:border-[#22d3ee] bg-[#0c232d] hover:bg-[#113545] text-[#22d3ee] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 group active:scale-95"
                        title="إضافة خطوة جديدة للمسار (+)"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center shrink-0">
                      {task.subtasks.map((step, idx) => {
                        const isLast = idx === task.subtasks.length - 1;
                        const nextStep = !isLast ? task.subtasks[idx + 1] : null;
                        const isStepDone = step.status === 'completed';

                        return (
                          <React.Fragment key={step.id}>
                            {/* Subtask Circle (shows ONLY step title) */}
                            <PipelineCircleNode
                              task={task}
                              step={step}
                              index={idx}
                              total={task.subtasks.length}
                              onCycleStatus={handleCycleSubtaskStatus}
                              onOpenDetails={(t, s) => setSelectedSubtaskDetails({ task: t, subtask: s })}
                            />

                            {/* Transition Bridge between circles */}
                            {!isLast && (
                              <TransitionBridge
                                note={step.transitionNote}
                                status={getTransitionEffectiveStatus(step, nextStep)}
                                size="compact"
                                onCycleStatus={() => handleCycleTransitionStatus(task, step, nextStep)}
                                onOpenDetails={() => setSelectedSubtaskDetails({ task, subtask: step })}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* Connecting line to the (+) button */}
                      <div className="w-3 sm:w-5 h-[2px] bg-[#0284c7]/70 shrink-0 mx-1" />

                      {/* Circular (+) Button at the end of the chain */}
                      <button
                        type="button"
                        onClick={() => onAddSubtask(task.id)}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[#0284c7] hover:border-[#22d3ee] bg-[#0c232d] hover:bg-[#113545] text-[#22d3ee] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 group active:scale-95"
                        title="إضافة مهمة فرعية جديدة للمسار (+)"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 
                  ROW 3: HAIRLINE COMPACT FOOTER (Closing Date ⏳ & Assignee 👷)
                */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-2">
                    {task.expectedClosingDate ? (
                      <span className={`font-mono font-bold flex items-center gap-1 ${
                        deadline.isOverdue && !isCompleted ? 'text-rose-400' : 'text-[#fbbf24]'
                      }`} dir="ltr">
                        <span>⏳</span>
                        <span>{task.expectedClosingDate}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">بدون موعد تسليم</span>
                    )}

                    {task.externalLink && (
                      <a
                        href={task.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-0.5"
                        title={task.externalLinkLabel || 'فتح الرابط'}
                      >
                        <Link2 className="w-2.5 h-2.5" />
                        <span>رابط</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1 truncate max-w-[150px]">
                    <span className="text-slate-500">👷</span>
                    <span className="truncate text-slate-300 font-medium">
                      {responsible?.name || 'غير محدد'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 
        ========================================================================
        SUBTASK DETAILS DIALOG (Popup dialog upon clicking a circle)
        ========================================================================
      */}
      <SubtaskDetailsDialog
        isOpen={!!selectedSubtaskDetails}
        onClose={() => setSelectedSubtaskDetails(null)}
        task={selectedSubtaskDetails?.task || null}
        subtask={selectedSubtaskDetails?.subtask || null}
        project={projects.find(p => p.id === selectedSubtaskDetails?.task.projectId) || null}
        teamMembers={teamMembers}
        onUpdateStatus={(taskId, subtaskId, status) => {
          handleUpdateSubtask(taskId, subtaskId, {
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
          });
          setSelectedSubtaskDetails(prev => {
            if (!prev || prev.subtask.id !== subtaskId) return prev;
            return {
              ...prev,
              subtask: {
                ...prev.subtask,
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : undefined,
              }
            };
          });
        }}
        onOpenEditModal={(task, subtask) => {
          setSelectedSubtaskDetails(null);
          setEditingSubtaskTarget({ task, subtask });
        }}
        onDeleteSubtask={handleDeleteSubtask}
        onAddNextSubtask={handleAddNextSubtask}
        onViewImage={(url, caption) => setLightboxImage({ url, caption })}
      />

      {/* 
        ========================================================================
        SUBTASK EDIT MODAL (Triggered on Long-Press or Right-Click on step)
        ========================================================================
      */}
      <SubtaskEditModal
        isOpen={!!editingSubtaskTarget}
        onClose={() => setEditingSubtaskTarget(null)}
        task={editingSubtaskTarget?.task || null}
        subtask={editingSubtaskTarget?.subtask || null}
        teamMembers={teamMembers}
        onSave={(taskId, subtaskId, updates) => {
          handleUpdateSubtask(taskId, subtaskId, updates);
        }}
        onDeleteSubtask={handleDeleteSubtask}
        onAddNextSubtask={handleAddNextSubtask}
      />

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

      {/* Excel & Google Sheets Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        projects={projects}
        teamMembers={teamMembers}
        tasks={tasks}
        onImportDatabase={(data) => {
          if (onImportDatabase) {
            onImportDatabase(data);
          } else if (onImportTasks) {
            onImportTasks(data.tasks, data.projects);
          }
        }}
        onOpenGoogleSheets={onOpenGoogleSheets}
      />

    </div>
  );
};
