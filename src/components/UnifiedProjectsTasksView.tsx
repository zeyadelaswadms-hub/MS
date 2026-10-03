import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project, TeamMember, SubTask } from '../types';
import { 
  calculateTaskProgress, 
  getDeadlineInfo, 
  getActiveWaitingSubtask, 
  createWhatsAppAlertLink 
} from '../utils/dateUtils';
import { TaskPipeline } from './TaskPipeline';
import { AttachmentModal, AttachmentTarget } from './AttachmentModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { CalendarView } from './CalendarView';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet, 
  FolderGit2, 
  Link2, 
  Image as ImageIcon, 
  MessageSquare, 
  Phone, 
  Trash2, 
  Edit2, 
  Layers, 
  ExternalLink, 
  RotateCcw,
  Check,
  Calendar,
  User,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Camera,
  X,
  ArrowUpDown
} from 'lucide-react';

interface UnifiedProjectsTasksViewProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  selectedProjectId: string; // 'all' or specific project id
  onSelectProject: (projectId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onOpenCreateTask: (projectId?: string) => void;
  onOpenCreateProject: () => void;
}

export const UnifiedProjectsTasksView: React.FC<UnifiedProjectsTasksViewProps> = ({
  tasks,
  projects,
  teamMembers,
  selectedProjectId,
  onSelectProject,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onOpenCreateTask,
  onOpenCreateProject,
}) => {
  // Multi-project selection state (allows selecting multiple projects at once or 'all')
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    selectedProjectId === 'all' ? ['all'] : [selectedProjectId]
  );

  // Sync when selectedProjectId prop changes from outside (e.g. from Glance view or new project)
  useEffect(() => {
    if (selectedProjectId) {
      setSelectedProjectIds(selectedProjectId === 'all' ? ['all'] : [selectedProjectId]);
    }
  }, [selectedProjectId]);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unclosed' | 'overdue' | 'completed'>('unclosed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Advanced Filter Options ("خيارات فلترة متقدمة حسب الأولوية، التاريخ، أو المسؤول")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('all'); // 'all' | 'urgent' | 'high' | 'medium' | 'low'
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all'); // 'all' | memberId
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all' | 'today' | 'this_week' | 'overdue' | 'next_7_days' | 'has_date' | 'no_date'
  const [sortBy, setSortBy] = useState<string>('default'); // 'default' | 'deadline_asc' | 'deadline_desc' | 'priority_desc' | 'newest' | 'progress_desc'

  const activeAdvancedFiltersCount = useMemo(() => {
    return [
      selectedPriority !== 'all',
      selectedMemberId !== 'all',
      dateFilter !== 'all',
      sortBy !== 'default',
    ].filter(Boolean).length;
  }, [selectedPriority, selectedMemberId, dateFilter, sortBy]);

  const handleResetAdvancedFilters = () => {
    setSelectedPriority('all');
    setSelectedMemberId('all');
    setDateFilter('all');
    setSortBy('default');
  };
  
  // Accordion state: keep track of opened task rows (multiple can be opened or just one)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  
  // View mode inside expanded task (compact step table vs visual pipeline)
  const [taskViewMode, setTaskViewMode] = useState<Record<string, 'table' | 'pipeline'>>({});

  // View mode for the entire tasks view: table list vs interactive calendar
  const [tasksViewMode, setTasksViewMode] = useState<'table' | 'calendar'>('table');

  // Attachment Modal State
  const [attachmentTarget, setAttachmentTarget] = useState<AttachmentTarget | null>(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  // Image Lightbox State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    tasks.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [tasks]);

  // Handle clicking a project chip
  const handleToggleProject = (id: string, e: React.MouseEvent) => {
    if (id === 'all') {
      setSelectedProjectIds(['all']);
      onSelectProject('all');
      return;
    }

    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      // Multi-select toggle: calculate new array synchronously to avoid calling parent setState in updater
      const withoutAll = selectedProjectIds.filter(p => p !== 'all');
      let next: string[];
      if (withoutAll.includes(id)) {
        const filtered = withoutAll.filter(p => p !== id);
        next = filtered.length === 0 ? ['all'] : filtered;
      } else {
        next = [...withoutAll, id];
      }
      setSelectedProjectIds(next);
      onSelectProject(next.length === 1 ? next[0] : 'all');
    } else {
      // Single select toggle: if already the only one, switch to 'all'; else select it
      if (selectedProjectIds.length === 1 && selectedProjectIds[0] === id) {
        setSelectedProjectIds(['all']);
        onSelectProject('all');
      } else {
        setSelectedProjectIds([id]);
        onSelectProject(id);
      }
    }
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const list = tasks.filter(task => {
      // 1. Project filter
      if (!selectedProjectIds.includes('all') && !selectedProjectIds.includes(task.projectId)) {
        return false;
      }

      // 2. Status filter
      const isDone = task.status === 'completed' || calculateTaskProgress(task) === 100;
      const deadline = getDeadlineInfo(task.expectedClosingDate, isDone);

      if (statusFilter === 'unclosed' && isDone) return false;
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'overdue' && (!deadline.isOverdue || isDone)) return false;

      // 3. Category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // 4. Advanced: Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // 5. Advanced: Responsible Member filter
      if (selectedMemberId !== 'all') {
        const isMainAssignee = task.assignedMemberId === selectedMemberId;
        const isSubtaskAssignee = task.subtasks.some(st => st.assignedMemberId === selectedMemberId);
        const waitingInfo = getActiveWaitingSubtask(task, teamMembers);
        const isWaitingAssignee = waitingInfo.responsibleMember?.id === selectedMemberId;
        if (!isMainAssignee && !isSubtaskAssignee && !isWaitingAssignee) {
          return false;
        }
      }

      // 6. Advanced: Date filter
      if (dateFilter !== 'all') {
        if (dateFilter === 'today') {
          if (!deadline.hasDate || deadline.daysDiff !== 0) return false;
        } else if (dateFilter === 'this_week') {
          if (!deadline.hasDate || deadline.daysDiff < 0 || deadline.daysDiff > 7) return false;
        } else if (dateFilter === 'overdue') {
          if (!deadline.isOverdue || isDone) return false;
        } else if (dateFilter === 'next_7_days') {
          if (!deadline.hasDate || deadline.daysDiff < 0 || deadline.daysDiff > 7) return false;
        } else if (dateFilter === 'has_date') {
          if (!deadline.hasDate) return false;
        } else if (dateFilter === 'no_date') {
          if (deadline.hasDate) return false;
        }
      }

      // 7. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const project = projects.find(p => p.id === task.projectId);
        const assignee = teamMembers.find(m => m.id === task.assignedMemberId);
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchProject = project?.name.toLowerCase().includes(q) || project?.code.toLowerCase().includes(q);
        const matchCategory = task.category?.toLowerCase().includes(q);
        const matchAssignee = assignee?.name.toLowerCase().includes(q);
        const matchSubtask = task.subtasks.some(st => st.title.toLowerCase().includes(q));
        if (!matchTitle && !matchProject && !matchCategory && !matchAssignee && !matchSubtask) {
          return false;
        }
      }

      return true;
    });

    // Sort list according to sortBy
    if (sortBy !== 'default') {
      const priorityWeight: Record<string, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      list.sort((a, b) => {
        const isDoneA = a.status === 'completed' || calculateTaskProgress(a) === 100;
        const isDoneB = b.status === 'completed' || calculateTaskProgress(b) === 100;
        const deadlineA = getDeadlineInfo(a.expectedClosingDate, isDoneA);
        const deadlineB = getDeadlineInfo(b.expectedClosingDate, isDoneB);

        if (sortBy === 'deadline_asc') {
          if (!deadlineA.hasDate && !deadlineB.hasDate) return 0;
          if (!deadlineA.hasDate) return 1;
          if (!deadlineB.hasDate) return -1;
          return deadlineA.daysDiff - deadlineB.daysDiff;
        }
        if (sortBy === 'deadline_desc') {
          if (!deadlineA.hasDate && !deadlineB.hasDate) return 0;
          if (!deadlineA.hasDate) return 1;
          if (!deadlineB.hasDate) return -1;
          return deadlineB.daysDiff - deadlineA.daysDiff;
        }
        if (sortBy === 'priority_desc') {
          const wA = priorityWeight[a.priority] || 0;
          const wB = priorityWeight[b.priority] || 0;
          return wB - wA;
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === 'progress_desc') {
          return calculateTaskProgress(b) - calculateTaskProgress(a);
        }
        return 0;
      });
    }

    return list;
  }, [
    tasks, 
    selectedProjectIds, 
    statusFilter, 
    selectedCategory, 
    selectedPriority, 
    selectedMemberId, 
    dateFilter, 
    sortBy, 
    searchQuery, 
    projects, 
    teamMembers
  ]);

  // Overall statistics
  const stats = useMemo(() => {
    const unclosedTasks = tasks.filter(t => t.status !== 'completed' && calculateTaskProgress(t) < 100);
    const overdueTasks = unclosedTasks.filter(t => {
      const d = getDeadlineInfo(t.expectedClosingDate, false);
      return d.isOverdue;
    });
    return {
      total: tasks.length,
      unclosed: unclosedTasks.length,
      overdue: overdueTasks.length,
      completed: tasks.length - unclosedTasks.length,
    };
  }, [tasks]);

  // Is a single project actively selected?
  const singleSelectedProject = useMemo(() => {
    if (selectedProjectIds.length === 1 && selectedProjectIds[0] !== 'all') {
      return projects.find(p => p.id === selectedProjectIds[0]) || null;
    }
    return null;
  }, [selectedProjectIds, projects]);

  // Subtask handlers
  const handleUpdateSubtask = (taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, ...updates };
      }
      return st;
    });

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.status === 'completed');
    const newStatus = allDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status;

    onUpdateTask(taskId, {
      subtasks: updatedSubtasks,
      status: newStatus,
    });
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const remaining = task.subtasks.filter(s => s.id !== subtaskId).map((st, i) => ({
      ...st,
      order: i + 1,
    }));
    onUpdateTask(taskId, { subtasks: remaining });
  };

  const handleInsertSubtask = (taskId: string, index: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: SubTask = {
      id: `sub-${Date.now()}-${task.subtasks.length + 1}`,
      order: index + 1,
      title: `خطوة إضافية (${index + 1})`,
      assignedMemberId: task.assignedMemberId,
      status: 'pending',
      transitionNote: 'ملاحظة الفحص والاعتماد',
      estimatedDays: 1,
    };

    const updated = [...task.subtasks];
    updated.splice(index, 0, newSubtask);

    const reordered = updated.map((st, i) => ({
      ...st,
      order: i + 1,
    }));

    onUpdateTask(taskId, {
      subtasks: reordered,
    });
  };

  const handleMoveSubtask = (taskId: string, currentIndex: number, direction: 'earlier' | 'later') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const targetIndex = direction === 'earlier' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= task.subtasks.length) return;

    const updated = [...task.subtasks];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((st, i) => ({
      ...st,
      order: i + 1,
    }));

    onUpdateTask(taskId, {
      subtasks: reordered,
    });
  };

  // Toggle main task completion with instant UNDO capability
  const handleToggleTaskCompleted = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCompleted = task.status === 'completed' || calculateTaskProgress(task) === 100;
    if (isCompleted) {
      // Revert / Undo: set task to in_progress and last subtask to in_progress or pending
      const resetSubtasks = task.subtasks.map((st, idx) => {
        if (idx === task.subtasks.length - 1) {
          return { ...st, status: 'in_progress' as const, completedAt: undefined };
        }
        return st;
      });
      onUpdateTask(task.id, { 
        status: 'in_progress',
        subtasks: resetSubtasks
      });
    } else {
      // Mark as completed
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

  // Open Attachment Modal for Task
  const handleOpenTaskAttachment = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAttachmentTarget({
      type: 'task',
      taskId: task.id,
      title: task.title,
      externalLink: task.externalLink,
      externalLinkLabel: task.externalLinkLabel,
      imageUrl: task.imageUrl,
      imageCaption: task.imageCaption,
    });
    setIsAttachmentModalOpen(true);
  };

  // Open Attachment Modal for SubTask
  const handleOpenSubtaskAttachment = (task: Task, subtask: SubTask, initialTab?: 'link' | 'image', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAttachmentTarget({
      type: 'subtask',
      taskId: task.id,
      subtaskId: subtask.id,
      title: `${task.title} - ${subtask.title}`,
      externalLink: subtask.externalLink,
      externalLinkLabel: subtask.externalLinkLabel,
      imageUrl: subtask.imageUrl,
      imageCaption: subtask.imageCaption,
      initialTab,
    });
    setIsAttachmentModalOpen(true);
  };

  // Save attachments (links & images)
  const handleSaveAttachment = (target: AttachmentTarget, data: {
    externalLink?: string;
    externalLinkLabel?: string;
    imageUrl?: string;
    imageCaption?: string;
  }) => {
    if (target.type === 'task') {
      onUpdateTask(target.taskId, {
        externalLink: data.externalLink,
        externalLinkLabel: data.externalLinkLabel,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
      });
    } else if (target.type === 'subtask' && target.subtaskId) {
      handleUpdateSubtask(target.taskId, target.subtaskId, {
        externalLink: data.externalLink,
        externalLinkLabel: data.externalLinkLabel,
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
      });
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 
        ========================================================================
        1. TOP UNIFIED PROJECTS SELECTOR & ACTIONS (دمج المشاريع والمهام في شاشة واحدة)
        ========================================================================
      */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              لوحة المشاريع والمهام
            </h2>

            {/* Quick + إضافة مهمة button right next to the title */}
            <button
              type="button"
              id="quick-add-task-btn"
              onClick={() => onOpenCreateTask(singleSelectedProject?.id)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="إضافة مهمة جديدة"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ إضافة مهمة</span>
            </button>

            {/* Quick + إضافة مشروع button directly next to + إضافة مهمة as requested by user */}
            <button
              type="button"
              id="quick-add-project-btn"
              onClick={onOpenCreateProject}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-stone-700 hover:border-amber-400"
              title="إضافة مشروع جديد"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ إضافة مشروع</span>
            </button>
          </div>

          {/* View Mode Switcher: Table/List vs Interactive Calendar */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              type="button"
              id="tasks-view-table-btn"
              onClick={() => setTasksViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                tasksViewMode === 'table'
                  ? 'bg-white text-stone-950 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>قائمة المهام والجدول</span>
            </button>

            <button
              type="button"
              id="tasks-view-calendar-btn"
              onClick={() => setTasksViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                tasksViewMode === 'calendar'
                  ? 'bg-amber-500 text-stone-950 shadow-2xs font-black ring-1 ring-amber-400'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>عرض التقويم والسحب والإفلات 📅</span>
            </button>
          </div>
        </div>

        {/* Project Selection Chips (Multi-select and Single-click) */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-stone-400 shrink-0">المشاريع:</span>
          
          {/* 'All Projects' Chip */}
          <button
            type="button"
            onClick={(e) => handleToggleProject('all', e)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedProjectIds.includes('all')
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <span>كل المشاريع</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedProjectIds.includes('all') ? 'bg-stone-800 text-amber-400' : 'bg-stone-200 text-stone-600'
            }`}>
              {tasks.length}
            </span>
          </button>

          {/* Individual Project Chips */}
          {projects.map(project => {
            const isSelected = selectedProjectIds.includes(project.id);
            const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
            
            return (
              <button
                key={project.id}
                type="button"
                onClick={(e) => handleToggleProject(project.id, e)}
                title="اضغط للاختيار، أو استخدم Ctrl/Shift للاختيار المتعدد"
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-950 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${project.color || 'bg-amber-500'}`}></span>
                <span>{project.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-amber-200 text-amber-900' : 'bg-stone-200 text-stone-600'
                }`}>
                  {projectTaskCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* If a single project is selected, show its clean summary banner */}
        {singleSelectedProject && (
          <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-stone-400 block">كود المشروع والعميل:</span>
                <span className="font-bold text-stone-800">{singleSelectedProject.code} • {singleSelectedProject.client}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">الموقع الميداني:</span>
                <span className="font-medium text-stone-700">{singleSelectedProject.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block">الجدول الزمني:</span>
                <span className="font-medium text-stone-700" dir="ltr">{singleSelectedProject.startDate} ➔ {singleSelectedProject.expectedEndDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenCreateTask(singleSelectedProject.id)}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100/70 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>+ مهمة في {singleSelectedProject.code}</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateProject}
                className="text-[11px] font-bold text-stone-800 hover:text-stone-950 bg-stone-200/80 hover:bg-stone-300 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="إضافة مشروع جديد"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>+ إضافة مشروع جديد</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {tasksViewMode === 'calendar' ? (
        <CalendarView
          tasks={tasks}
          projects={projects}
          teamMembers={teamMembers}
          defaultProjectId={selectedProjectIds.length === 1 && selectedProjectIds[0] !== 'all' ? selectedProjectIds[0] : 'all'}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddSubtask={onAddSubtask}
          onOpenCreateTask={(projId, initialDate) => {
            onOpenCreateTask(projId || (selectedProjectIds.length === 1 && selectedProjectIds[0] !== 'all' ? selectedProjectIds[0] : undefined));
          }}
          onSelectProject={(projId) => {
            setSelectedProjectIds([projId]);
            onSelectProject(projId);
          }}
        />
      ) : (
        <>
          {/* 
            ========================================================================
            2. COMPACT SINGLE-ROW FILTER BAR (فلاتر مبسطة بارتفاع صف واحد فقط)
            ========================================================================
          */}
          <div className="bg-white rounded-xl px-2.5 py-1.5 border border-stone-200/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none whitespace-nowrap min-h-[38px]">
        
        {/* Quick Filter Buttons (Single Row with badge counts next to labels) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('unclosed')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'unclosed'
                ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            <span>النشطة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'unclosed' ? 'bg-amber-300/80 text-amber-950' : 'bg-stone-200 text-stone-700'
            }`}>
              {stats.unclosed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'overdue'
                ? 'bg-red-100 text-red-950 border border-red-300 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
            <span>المتأخرة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'overdue' ? 'bg-red-300/80 text-red-950' : 'bg-stone-200 text-stone-700'
            }`}>
              {stats.overdue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            <span>المكتملة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'completed' ? 'bg-emerald-300/80 text-emerald-950' : 'bg-stone-200 text-stone-700'
            }`}>
              {stats.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            <span>الكل</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'all' ? 'bg-stone-700 text-amber-400' : 'bg-stone-200 text-stone-700'
            }`}>
              {stats.total}
            </span>
          </button>
        </div>

        {/* Compact Search, Category, and Advanced Filters in the same single row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-stone-700 outline-none h-7"
            >
              <option value="all">كل البنود</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Advanced Filters Button ("خيارات فلترة متقدمة حسب الأولوية، التاريخ، أو المسؤول") */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              showAdvancedFilters || activeAdvancedFiltersCount > 0
                ? 'bg-amber-500 text-stone-950 font-black shadow-2xs ring-1 ring-amber-400'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
            title="خيارات الفلترة والتصنيف المتقدمة (الأولوية، التاريخ، المسؤول)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">فلترة متقدمة</span>
            {activeAdvancedFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-stone-950 text-amber-300 text-[10px] font-bold flex items-center justify-center">
                {activeAdvancedFiltersCount}
              </span>
            )}
          </button>

          {/* Search Box */}
          <div className="relative w-28 sm:w-40">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full pl-6 pr-6 py-0.5 h-7 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-800 placeholder:text-stone-400 focus:bg-white focus:border-amber-500 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 
        ========================================================================
        ADVANCED FILTERS & SORTING PANEL (الأولوية، التاريخ، المسؤول، والترتيب)
        ========================================================================
      */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-stone-200 shadow-xs space-y-2.5 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-black text-stone-900">
              <SlidersHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
              <span>خيارات الفلترة والتصنيف المتقدمة للمهام</span>
              <span className="text-[11px] font-medium text-stone-400">
                (عرض {filteredTasks.length} من أصل {tasks.length} مهمة)
              </span>
            </div>
            
            {activeAdvancedFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetAdvancedFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط الفلاتر ({activeAdvancedFiltersCount})</span>
              </button>
            )}
          </div>

          {/* 4 Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* 1. Priority Classification */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>تصنيف الأولوية:</span>
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className={`w-full bg-stone-50 border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer ${
                  selectedPriority !== 'all' 
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-black ring-1 ring-amber-400/40' 
                    : 'border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <option value="all">كل الأولويات</option>
                <option value="urgent">🔴 عاجلة جداً (Urgent)</option>
                <option value="high">🟠 مرتفعة (High)</option>
                <option value="medium">🟡 متوسطة (Medium)</option>
                <option value="low">🟢 منخفضة (Low)</option>
              </select>
            </div>

            {/* 2. Assignee / Responsible Member */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-500" />
                <span>المسؤول المكلّف:</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={`w-full bg-stone-50 border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer ${
                  selectedMemberId !== 'all' 
                    ? 'border-blue-500 bg-blue-50/70 text-blue-950 font-black ring-1 ring-blue-400/40' 
                    : 'border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <option value="all">كل المسؤولين والمشرفين ({teamMembers.length})</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date / Deadline Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>تصفية التاريخ والموعد:</span>
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full bg-stone-50 border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer ${
                  dateFilter !== 'all' 
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-black ring-1 ring-emerald-400/40' 
                    : 'border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <option value="all">كل المواعيد الزمنية</option>
                <option value="today">⚡ تاريخ الإغلاق اليوم</option>
                <option value="this_week">📅 خلال هذا الأسبوع (7 أيام)</option>
                <option value="overdue">⚠️ متأخرة عن الموعد</option>
                <option value="has_date">📌 محدد لها موعد إغلاق</option>
                <option value="no_date">⚪ بدون تاريخ محدد</option>
              </select>
            </div>

            {/* 4. Sorting Classification */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-purple-500" />
                <span>ترتيب المهام حسب:</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full bg-stone-50 border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer ${
                  sortBy !== 'default' 
                    ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-black ring-1 ring-purple-400/40' 
                    : 'border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <option value="default">الترتيب الافتراضي</option>
                <option value="priority_desc">الأعلى أولوية أولاً (عاجلة ⬅ منخفضة)</option>
                <option value="deadline_asc">الأقرب موعداً أولاً (حسب تاريخ التسليم)</option>
                <option value="deadline_desc">الأبعد موعداً أولاً</option>
                <option value="newest">الأحدث إضافة أولاً</option>
                <option value="progress_desc">الأعلى نسبة إنجاز أولاً</option>
              </select>
            </div>

          </div>

          {/* Active Filter Pills for quick one-click removal */}
          {activeAdvancedFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
              <span className="text-[10px] font-bold text-stone-400">الفلاتر المطبقة:</span>
              
              {selectedPriority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  <span>أولوية: {selectedPriority === 'urgent' ? 'عاجلة' : selectedPriority === 'high' ? 'مرتفعة' : selectedPriority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                  <button type="button" onClick={() => setSelectedPriority('all')} className="hover:text-amber-950 cursor-pointer">×</button>
                </span>
              )}

              {selectedMemberId !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-300">
                  <span>المسؤول: {teamMembers.find(m => m.id === selectedMemberId)?.name}</span>
                  <button type="button" onClick={() => setSelectedMemberId('all')} className="hover:text-blue-950 cursor-pointer">×</button>
                </span>
              )}

              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                  <span>التاريخ: {dateFilter === 'today' ? 'اليوم' : dateFilter === 'this_week' ? 'هذا الأسبوع' : dateFilter === 'overdue' ? 'المتأخرة' : dateFilter === 'has_date' ? 'لها تاريخ' : 'بدون تاريخ'}</span>
                  <button type="button" onClick={() => setDateFilter('all')} className="hover:text-emerald-950 cursor-pointer">×</button>
                </span>
              )}

              {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold border border-purple-200">
                  <span>الترتيب: {sortBy === 'priority_desc' ? 'الأعلى أولوية' : sortBy === 'deadline_asc' ? 'الأقرب موعداً' : sortBy === 'newest' ? 'الأحدث' : sortBy === 'progress_desc' ? 'الأعلى إنجازاً' : 'الأبعد موعداً'}</span>
                  <button type="button" onClick={() => setSortBy('default')} className="hover:text-purple-950 cursor-pointer">×</button>
                </span>
              )}
            </div>
          )}

        </div>
      )}

      {/* 
        ========================================================================
        3. SINGLE-LINE COMPACT ROWS (مبدأ الكتابة في سطر واحد لتصغير الارتفاعات)
        ========================================================================
      */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
        
        {/* Table/List Header */}
        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-stone-100/90 text-stone-500 font-bold text-[11px] border-b border-stone-200">
          <div className="col-span-4 flex items-center gap-2">
            <span className="w-5"></span>
            <span className="w-5"></span>
            <span>المهمة الرئيسية والبند</span>
          </div>
          <div className="col-span-2">المشروع</div>
          <div className="col-span-2">الخطوة والمسؤول الحالي</div>
          <div className="col-span-2 text-center">نسبة الإنجاز</div>
          <div className="col-span-1 text-center">الموعد / التأخير</div>
          <div className="col-span-1 text-left">مرفقات وإجراءات</div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-bold text-stone-600">لا توجد مهام مطابقة لخيارات الفلترة الحالية</p>
            <p className="mt-1 text-stone-400">يمكنك تغيير فلتر المشروع أو إنشاء مهمة أو مشروع جديد</p>
            <div className="flex items-center justify-center gap-2.5 mt-3">
              <button
                type="button"
                onClick={() => onOpenCreateTask(singleSelectedProject?.id)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ إضافة مهمة</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateProject}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-stone-700 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ إضافة مشروع</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const progress = calculateTaskProgress(task);
              const isCompleted = task.status === 'completed' || progress === 100;
              const deadline = getDeadlineInfo(task.expectedClosingDate, isCompleted);
              const waitingInfo = getActiveWaitingSubtask(task, teamMembers);
              const isExpanded = expandedTaskId === task.id;
              const isGoogleSheet = task.externalLink?.includes('spreadsheets') || task.externalLink?.includes('sheet');
              const isGoogleDrive = task.externalLink?.includes('drive.google');
              const currentMode = taskViewMode[task.id] || 'table';
              const displayImageUrl = task.imageUrl || task.subtasks.find(st => !!st.imageUrl)?.imageUrl;

              return (
                <div 
                  key={task.id} 
                  className={`transition-colors ${
                    isExpanded ? 'bg-amber-50/25 ring-1 ring-amber-400/50' : 'hover:bg-stone-50/70'
                  }`}
                >
                  
                  {/* 
                    MOBILE COMPACT VIEW (lg:hidden) - اختصار الكلام تماماً لصالح الصور
                  */}
                  <div 
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="lg:hidden p-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-stone-50/80 transition"
                  >
                    {/* Checkbox + Compressed Title & Subline */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskCompleted(task, e)}
                        title={isCompleted ? 'إلغاء الإكمال والتراجع عن إغلاق المهمة' : 'تعليم المهمة كمكتملة'}
                        className={`p-0.5 rounded transition shrink-0 cursor-pointer ${
                          isCompleted ? 'text-emerald-600' : 'text-stone-300 hover:text-amber-600'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {/* Title & overdue pill with color status indicator */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          {/* Color status indicator: Green (ongoing), Red (overdue), Gray (completed) */}
                          <span 
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 shadow-2xs ${
                              isCompleted 
                                ? 'bg-stone-400 ring-stone-200' 
                                : deadline.isOverdue 
                                ? 'bg-red-500 ring-red-200 animate-pulse' 
                                : 'bg-emerald-500 ring-emerald-200'
                            }`}
                            title={isCompleted ? 'مكتملة' : deadline.isOverdue ? 'متأخرة عن الموعد' : 'قيد التنفيذ / جارية'}
                          />
                          <span 
                            className={`text-xs font-bold truncate ${
                              isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </span>
                          {deadline.isOverdue && !isCompleted && (
                            <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                              متأخرة
                            </span>
                          )}
                          {task.priority === 'urgent' && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                              عاجلة
                            </span>
                          )}
                          {task.priority === 'high' && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                              مرتفعة
                            </span>
                          )}
                        </div>

                        {/* Minimal 2nd line: Project • Assignee • Progress */}
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-500">
                          {project && (
                            <span className="font-semibold text-stone-700 truncate max-w-[95px] flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${project.color || 'bg-amber-500'}`}></span>
                              <span className="truncate">{project.name}</span>
                            </span>
                          )}
                          {waitingInfo.responsibleMember && (
                            <span className="font-medium text-stone-600 truncate max-w-[75px]">
                              {waitingInfo.responsibleMember.name.split(' ')[0]}
                            </span>
                          )}
                          <span className="font-mono font-bold text-stone-700 bg-stone-100 px-1 rounded" dir="ltr">
                            {progress}%
                          </span>
                          {task.externalLink && (
                            <a
                              href={task.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 p-0.5"
                              title="فتح الرابط"
                            >
                              <Link2 className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PROMINENT FIELD IMAGE (مضغوط لصالح الصور فقط) + Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {displayImageUrl ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage({ url: displayImageUrl, caption: task.imageCaption || task.title });
                          }}
                          className="relative w-11 h-11 rounded-xl overflow-hidden border border-stone-200 shadow-2xs group cursor-pointer shrink-0 bg-stone-100"
                          title="معاينة صورة الموقع وتكبيرها"
                        >
                          <img 
                            src={displayImageUrl} 
                            alt={task.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200" 
                          />
                          <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition" />
                          <div className="absolute bottom-0.5 right-0.5 bg-stone-900/80 text-white rounded p-0.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenTaskAttachment(task, e)}
                          className="w-10 h-10 rounded-xl border border-dashed border-stone-300 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/60 flex flex-col items-center justify-center text-stone-400 hover:text-amber-700 transition cursor-pointer shrink-0"
                          title="إرفاق صورة ميدانية للمهمة"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="text-[7.5px] font-bold mt-0.5">+ صورة</span>
                        </button>
                      )}

                      {/* Chevron Expand Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTaskId(isExpanded ? null : task.id);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-800 rounded-lg transition shrink-0"
                        title={isExpanded ? 'طي' : 'عرض الخطوات'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 
                    DESKTOP SINGLE-LINE ROW (hidden lg:grid)
                  */}
                  <div 
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="hidden lg:grid lg:grid-cols-12 gap-2 px-3 py-2 items-center cursor-pointer min-h-[44px]"
                  >
                    
                    {/* Left/Start: Chevron + Checkbox + Title in Single Line */}
                    <div className="col-span-4 w-full flex items-center gap-2 min-w-0">
                      
                      {/* Chevron Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTaskId(isExpanded ? null : task.id);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-800 rounded transition shrink-0"
                        title={isExpanded ? 'طي التفاصيل' : 'عرض الخطوات والمرفقات'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {/* Direct Completion Checkbox with UNDO */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskCompleted(task, e)}
                        title={isCompleted ? 'إلغاء الإكمال والتراجع عن إغلاق المهمة' : 'تعليم المهمة كمكتملة'}
                        className={`p-0.5 rounded transition shrink-0 cursor-pointer ${
                          isCompleted ? 'text-emerald-600 hover:text-emerald-700' : 'text-stone-400 hover:text-amber-600'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      {/* Task Title (Single Line with truncate and color status indicator) */}
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        {/* Color status indicator: Green (ongoing), Red (overdue), Gray (completed) */}
                        <span 
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 shadow-2xs ${
                            isCompleted 
                              ? 'bg-stone-400 ring-stone-200' 
                              : deadline.isOverdue 
                              ? 'bg-red-500 ring-red-200 animate-pulse' 
                              : 'bg-emerald-500 ring-emerald-200'
                          }`}
                          title={isCompleted ? 'مكتملة' : deadline.isOverdue ? 'متأخرة عن الموعد' : 'قيد التنفيذ / جارية'}
                        />
                        <span 
                          className={`text-xs font-bold truncate ${
                            isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </span>

                        {task.priority === 'urgent' && (
                          <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded shrink-0 shadow-2xs">
                            عاجلة
                          </span>
                        )}
                        {task.priority === 'high' && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded shrink-0">
                            مرتفعة
                          </span>
                        )}

                        {task.category && (
                          <span className="hidden xl:inline-block text-[10px] font-medium bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded shrink-0">
                            {task.category}
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Project Tag */}
                    <div className="col-span-2 w-full flex items-center gap-1.5 shrink-0">
                      {project && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${project.color || 'bg-amber-500'}`}></span>
                          <span className="truncate">{project.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Current Step / Responsible Member */}
                    <div className="col-span-2 w-full flex items-center gap-2 min-w-0">
                      {waitingInfo.responsibleMember ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${waitingInfo.responsibleMember.avatarColor || 'bg-amber-600'}`}>
                            {waitingInfo.responsibleMember.name.split(' ')[1]?.[0] || waitingInfo.responsibleMember.name[0]}
                          </div>
                          <span className="text-xs font-bold text-stone-800 truncate">
                            {waitingInfo.responsibleMember.name.split(' ')[0]} {waitingInfo.responsibleMember.name.split(' ')[1] || ''}
                          </span>
                          
                          {/* Quick WhatsApp icon */}
                          <a
                            href={createWhatsAppAlertLink(waitingInfo.responsibleMember, task, project, waitingInfo.subtask, deadline)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded transition shrink-0"
                            title={`مراسلة واتساب: ${waitingInfo.responsibleMember.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> مكتملة
                        </span>
                      )}
                    </div>

                    {/* Progress Bar & % */}
                    <div className="col-span-2 w-full flex items-center gap-2">
                      <div className="flex-1 bg-stone-100 h-1.5 rounded-full overflow-hidden border border-stone-200/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-amber-500' : 'bg-stone-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-stone-700 w-8 text-left" dir="ltr">
                        {progress}%
                      </span>
                    </div>

                    {/* Closing Date & Delay Badge */}
                    <div className="col-span-1 w-full text-center">
                      {deadline.hasDate ? (
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          deadline.isOverdue && !isCompleted
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : deadline.daysDiff <= 3 && !isCompleted
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {deadline.badgeText}
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">بدون تاريخ</span>
                      )}
                    </div>

                    {/* Attachments & Quick Actions */}
                    <div className="col-span-1 w-full flex items-center justify-end gap-1.5">
                      
                      {/* External Link Indicator */}
                      {task.externalLink && (
                        <a
                          href={task.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`p-1 rounded transition ${
                            isGoogleSheet ? 'text-emerald-700 hover:bg-emerald-50' : 'text-blue-700 hover:bg-blue-50'
                          }`}
                          title={task.externalLinkLabel || 'فتح الرابط في علامة تبويب جديدة'}
                        >
                          {isGoogleSheet ? (
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          ) : isGoogleDrive ? (
                            <FolderGit2 className="w-3.5 h-3.5" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5" />
                          )}
                        </a>
                      )}

                      {/* Image Thumbnail Button */}
                      {displayImageUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage({ url: displayImageUrl, caption: task.imageCaption || task.title });
                          }}
                          className="relative w-7 h-7 rounded-md overflow-hidden border border-stone-300 hover:scale-110 transition cursor-pointer shadow-2xs"
                          title="معاينة الصورة المرفقة"
                        >
                          <img src={displayImageUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      )}

                      {/* Add/Edit Attachment button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenTaskAttachment(task, e)}
                        className="p-1 text-stone-400 hover:text-amber-700 rounded transition cursor-pointer"
                        title="إضافة أو تعديل الروابط والصور"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Task button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`هل أنت متأكد من حذف مهمة "${task.title}"؟`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer"
                        title="حذف المهمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                  {/* 
                    ========================================================================
                    EXPANDED ACCORDION: Subtasks, Attachments, Visual Pipeline, and Undo
                    ========================================================================
                  */}
                  {isExpanded && (
                    <div className="p-4 bg-stone-50/60 border-t border-stone-200 space-y-4 animate-fadeIn">
                      
                      {/* Subtasks Bar Header with View Mode Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            الخطوات ({task.subtasks.length}):
                          </span>
                          <span className="text-[11px] text-stone-500 hidden sm:inline">
                            يمكن تعديل أي خطوة أو التراجع عن إكمالها في أي وقت
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Switch between Table View and Visual Pipeline */}
                          <div className="bg-stone-200 p-0.5 rounded-lg flex items-center text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => setTaskViewMode(prev => ({ ...prev, [task.id]: 'table' }))}
                              className={`px-2 py-0.5 rounded-md transition ${
                                currentMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                              }`}
                            >
                              قائمة سطرية
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskViewMode(prev => ({ ...prev, [task.id]: 'pipeline' }))}
                              className={`px-2 py-0.5 rounded-md transition ${
                                currentMode === 'pipeline' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                              }`}
                            >
                              مسار تسلسلي
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onAddSubtask(task.id)}
                            className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ إضافة خطوة</span>
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: COMPACT SINGLE-LINE SUBTASK TABLE (مع إمكانية التراجع والتعديل الكامل) */}
                      {currentMode === 'table' ? (
                        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                          {task.subtasks.map((step, idx) => {
                            const isStepDone = step.status === 'completed';
                            const assigned = teamMembers.find(m => m.id === step.assignedMemberId);

                            return (
                              <div 
                                key={step.id} 
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 px-3 text-xs hover:bg-stone-50 transition"
                              >
                                {/* Checkbox + Step Title */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {/* Direct Toggle Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextStatus = isStepDone ? 'pending' : 'completed';
                                      handleUpdateSubtask(task.id, step.id, {
                                        status: nextStatus,
                                        completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
                                      });
                                    }}
                                    title={isStepDone ? 'إلغاء الإكمال والتراجع عن إنهاء الخطوة' : 'تعليم الخطوة كمكتملة'}
                                    className={`cursor-pointer transition shrink-0 ${
                                      isStepDone ? 'text-emerald-600' : 'text-stone-300 hover:text-amber-600'
                                    }`}
                                  >
                                    {isStepDone ? (
                                      <CheckSquare className="w-4 h-4" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>

                                  <span className="text-[11px] font-bold text-stone-400 w-5 shrink-0">
                                    #{idx + 1}
                                  </span>

                                  {/* Inline editable title */}
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => handleUpdateSubtask(task.id, step.id, { title: e.target.value })}
                                    className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-amber-400 rounded px-1 py-0.5 font-bold outline-none ${
                                      isStepDone ? 'line-through text-stone-400' : 'text-stone-800'
                                    }`}
                                  />
                                </div>

                                {/* Step Assignee Selector */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={step.assignedMemberId}
                                    onChange={(e) => handleUpdateSubtask(task.id, step.id, { assignedMemberId: e.target.value })}
                                    className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-0.5 text-[11px] text-stone-700 outline-none"
                                  >
                                    {teamMembers.map(m => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} ({m.role})
                                      </option>
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
                                </div>

                                {/* Status Selector (Allows undoing or switching freely) */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <select
                                    value={step.status}
                                    onChange={(e) => {
                                      const st = e.target.value as any;
                                      handleUpdateSubtask(task.id, step.id, {
                                        status: st,
                                        completedAt: st === 'completed' ? new Date().toISOString() : undefined
                                      });
                                    }}
                                    className={`text-[11px] font-bold py-0.5 px-2 rounded-lg border outline-none ${
                                      step.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : step.status === 'in_progress'
                                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                                        : step.status === 'blocked'
                                        ? 'bg-red-50 text-red-800 border-red-300'
                                        : 'bg-stone-50 text-stone-600 border-stone-200'
                                    }`}
                                  >
                                    <option value="pending">⏳ انتظار</option>
                                    <option value="in_progress">⚙️ قيد التنفيذ</option>
                                    <option value="completed">✅ مكتملة</option>
                                    <option value="blocked">⛔ معطلة</option>
                                  </select>

                                  {/* Prominent Undo Button if completed */}
                                  {isStepDone && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubtask(task.id, step.id, { status: 'pending', completedAt: undefined })}
                                      className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                                      title="تراجع عن إكمال هذه الخطوة"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" />
                                      <span>تراجع</span>
                                    </button>
                                  )}

                                  {/* Step External Link */}
                                  {step.externalLink ? (
                                    <a
                                      href={step.externalLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 text-emerald-600 hover:text-emerald-800"
                                      title={step.externalLinkLabel || 'فتح رابط الخطوة'}
                                    >
                                      <Link2 className="w-3.5 h-3.5" />
                                    </a>
                                  ) : null}

                                  {/* Step Image */}
                                  {step.imageUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setLightboxImage({ url: step.imageUrl!, caption: step.imageCaption || step.title })}
                                      className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                                      title="معاينة صورة الخطوة"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}

                                  {/* Attach Link or Image to this Subtask */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSubtaskAttachment(task, step)}
                                    className="p-1 text-stone-400 hover:text-amber-700"
                                    title="إضافة أو تعديل رابط أو صورة لهذه الخطوة الفرعية"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>

                                  {/* Reorder subtask in list */}
                                  <div className="flex flex-col items-center">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveSubtask(task.id, idx, 'earlier')}
                                      className="text-stone-400 hover:text-amber-700 disabled:opacity-20 p-0.5 cursor-pointer"
                                      title="تقديم الخطوة للأمام في الترتيب"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === task.subtasks.length - 1}
                                      onClick={() => handleMoveSubtask(task.id, idx, 'later')}
                                      className="text-stone-400 hover:text-amber-700 disabled:opacity-20 p-0.5 cursor-pointer"
                                      title="تأخير الخطوة للخلف في الترتيب"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Delete Subtask */}
                                  {task.subtasks.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubtask(task.id, step.id)}
                                      className="p-1 text-stone-300 hover:text-red-600"
                                      title="حذف الخطوة"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* MODE 2: VISUAL PIPELINE */
                        <div className="bg-white p-3 rounded-xl border border-stone-200">
                          <TaskPipeline
                            subtasks={task.subtasks}
                            teamMembers={teamMembers}
                            onUpdateSubtask={(subtaskId, updates) => handleUpdateSubtask(task.id, subtaskId, updates)}
                            onAddSubtask={() => onAddSubtask(task.id)}
                            onInsertSubtask={(index) => handleInsertSubtask(task.id, index)}
                            onMoveSubtask={(currentIndex, direction) => handleMoveSubtask(task.id, currentIndex, direction)}
                            onDeleteSubtask={(subtaskId) => handleDeleteSubtask(task.id, subtaskId)}
                            onOpenAttachment={(subtask, initialTab) => handleOpenSubtaskAttachment(task, subtask, initialTab)}
                            onViewImage={(url, caption) => setLightboxImage({ url, caption })}
                          />
                        </div>
                      )}

                      {/* Main Task Attached Link & Image Bar */}
                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-4">
                          
                          {/* Link info */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-stone-400">الرابط المرفق:</span>
                            {task.externalLink ? (
                              <a
                                href={task.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-emerald-800 hover:underline flex items-center gap-1"
                              >
                                {isGoogleSheet ? <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-blue-600" />}
                                <span>{task.externalLinkLabel || 'فتح الرابط'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-stone-400 text-[11px]">لا يوجد رابط لشيت أو درايف</span>
                            )}
                          </div>

                          {/* Image info */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-stone-400">الصورة المرفقة:</span>
                            {task.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => setLightboxImage({ url: task.imageUrl!, caption: task.imageCaption || task.title })}
                                className="font-bold text-blue-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                              >
                                <img src={task.imageUrl} alt="" className="w-6 h-6 rounded-md object-cover border border-stone-200 shrink-0" />
                                <span>{task.imageCaption || 'معاينة الصورة'}</span>
                              </button>
                            ) : (
                              <span className="text-stone-400 text-[11px]">لا توجد صورة موقع</span>
                            )}
                          </div>

                        </div>

                        {/* Button to attach / edit links & photos */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenTaskAttachment(task)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1 transition"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>إدارة روابط وصور المهمة</span>
                          </button>

                          {/* Close Accordion */}
                          <button
                            type="button"
                            onClick={() => setExpandedTaskId(null)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold transition"
                          >
                            طي المهمة
                          </button>
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
      </>
      )}

      {/* 
        ========================================================================
        MODALS: Attachment Modal & Image Lightbox Modal
        ========================================================================
      */}
      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        target={attachmentTarget}
        onSave={handleSaveAttachment}
      />

      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || null}
        caption={lightboxImage?.caption}
      />

    </div>
  );
};
