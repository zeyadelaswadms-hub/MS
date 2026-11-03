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
  Edit3,
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
import { 
  computePipelineStatusOnSubtaskChange, 
  canUpdatePipelineStatusManually 
} from '../utils/pipelineUtils';

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
  onOpenEditTask?: (task: Task) => void;
  onOpenProjectsManagement?: () => void;
  onOpenEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
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
  onOpenEditTask,
  onOpenProjectsManagement,
  onOpenEditProject,
  onDeleteProject,
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

  // Self-heal if projects array updates and selected IDs no longer exist
  useEffect(() => {
    if (!selectedProjectIds.includes('all')) {
      const valid = selectedProjectIds.filter(id => projects.some(p => p.id === id));
      if (valid.length === 0) {
        setSelectedProjectIds(['all']);
        onSelectProject('all');
      }
    }
  }, [projects]);
  
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

  // Subtask handlers with sequential pipeline logic
  const handleUpdateSubtask = (taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, ...updates };
      }
      return st;
    });

    const newPipelineStatus = updates.status
      ? computePipelineStatusOnSubtaskChange(task, subtaskId, updates.status, updatedSubtasks)
      : task.status;

    onUpdateTask(taskId, {
      subtasks: updatedSubtasks,
      status: newPipelineStatus,
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
      <div className="bg-[#132229] rounded-2xl p-4 border border-[#1c3542] shadow-md space-y-3 text-white">
        
        {/* السطر الأول: عنوان لوحة المشاريع والمهام في سطر مستقل */}
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-[#22d3ee] shrink-0" />
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            لوحة المشاريع والمهام
          </h2>
        </div>

        {/* السطر الثاني: خانات إضافة مهمة وإضافة مشروع وقائمة المشاريع */}
        <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
          <button
            type="button"
            id="quick-add-task-btn"
            onClick={() => onOpenCreateTask(singleSelectedProject?.id)}
            className="px-3.5 py-1.5 bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-cyan-400/30"
            title="إضافة مهمة جديدة"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ إضافة مهمة</span>
          </button>

          <button
            type="button"
            id="quick-add-project-btn"
            onClick={onOpenCreateProject}
            className="px-3.5 py-1.5 bg-[#182c35] hover:bg-[#203a46] active:scale-95 text-cyan-300 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-[#22404e] hover:border-cyan-400/50"
            title="إضافة مشروع جديد"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ إضافة مشروع</span>
          </button>

          {/* زر قائمة وإدارة المشاريع (عرض كامل للتعديل والحذف) */}
          {onOpenProjectsManagement && (
            <button
              type="button"
              id="quick-manage-projects-btn"
              onClick={onOpenProjectsManagement}
              className="px-3.5 py-1.5 bg-[#142833] hover:bg-[#1c3848] active:scale-95 text-[#22d3ee] text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-[#22404e] hover:border-cyan-400/60"
              title="عرض وتعديل وحذف قائمة المشاريع"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>قائمة وإدارة المشاريع ({projects.length})</span>
            </button>
          )}
        </div>

        {/* Project Selection Chips (Multi-select and Single-click) */}
        <div className="pt-2 border-t border-[#1b3440] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-400">المشاريع:</span>
            {onOpenProjectsManagement && (
              <button
                type="button"
                onClick={onOpenProjectsManagement}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 underline font-semibold cursor-pointer"
                title="فتح جدول وقائمة المشاريع"
              >
                (إدارة ⚙️)
              </button>
            )}
          </div>
          
          {/* 'All Projects' Chip */}
          <button
            type="button"
            onClick={(e) => handleToggleProject('all', e)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedProjectIds.includes('all')
                ? 'bg-[#088395] text-white shadow-xs'
                : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300'
            }`}
          >
            <span>كل المشاريع</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedProjectIds.includes('all') ? 'bg-[#0c3540] text-cyan-200' : 'bg-[#12222a] text-slate-400'
            }`}>
              {tasks.length}
            </span>
          </button>

          {/* Individual Project Chips */}
          {projects.map(project => {
            const isSelected = selectedProjectIds.includes(project.id);
            const projectTaskCount = tasks.filter(t => t.projectId === project.id).length;
            
            return (
              <div key={project.id} className="relative flex items-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleToggleProject(project.id, e)}
                  title="اضغط للاختيار، أو استخدم Ctrl/Shift للاختيار المتعدد"
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0e3b43] text-cyan-200 border-cyan-500/60 ring-1 ring-cyan-400/40 pl-1.5'
                      : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300 border-[#22404e]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${project.color || 'bg-cyan-500'}`}></span>
                  <span>{project.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-[#088395] text-white' : 'bg-[#101c22] text-slate-400'
                  }`}>
                    {projectTaskCount}
                  </span>
                  {isSelected && onOpenEditProject && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditProject(project);
                      }}
                      className="p-1 hover:bg-white/20 rounded text-cyan-200 hover:text-white transition cursor-pointer"
                      title="تعديل هذا المشروع"
                    >
                      <Edit3 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* If a single project is selected, show its clean summary banner with Edit & Delete */}
        {singleSelectedProject && (
          <div className="mt-2 p-3 bg-[#182c35] rounded-xl border border-[#22404e] text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block">كود المشروع والعميل:</span>
                <span className="font-bold text-white">{singleSelectedProject.code} • {singleSelectedProject.client}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">الموقع الميداني:</span>
                <span className="font-medium text-slate-300">{singleSelectedProject.location}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">الجدول الزمني:</span>
                <span className="font-medium text-slate-300" dir="ltr">{singleSelectedProject.startDate} ➔ {singleSelectedProject.expectedEndDate}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Edit Project Button */}
              {onOpenEditProject && (
                <button
                  type="button"
                  onClick={() => onOpenEditProject(singleSelectedProject)}
                  className="text-[11px] font-bold text-white bg-[#101c22] hover:bg-[#142833] border border-cyan-400/40 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="تعديل بيانات هذا المشروع"
                >
                  <Edit3 className="w-3 h-3 text-[#22d3ee]" />
                  <span>تعديل المشروع</span>
                </button>
              )}

              {/* Delete Project Button */}
              {onDeleteProject && (
                <button
                  type="button"
                  onClick={() => onDeleteProject(singleSelectedProject.id)}
                  className="text-[11px] font-bold text-rose-300 hover:text-white bg-[#261014] hover:bg-rose-900/60 border border-rose-900/40 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="حذف هذا المشروع"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>حذف المشروع</span>
                </button>
              )}

              {/* Add Task for this project */}
              <button
                type="button"
                onClick={() => onOpenCreateTask(singleSelectedProject.id)}
                className="text-[11px] font-bold text-cyan-200 hover:text-white bg-[#0e3b43] hover:bg-[#134e5a] border border-cyan-500/40 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>+ مهمة في {singleSelectedProject.code}</span>
              </button>
            </div>
          </div>
        )}

      </div>


          {/* 
            ========================================================================
            2. COMPACT SINGLE-ROW FILTER BAR (فلاتر مبسطة بارتفاع صف واحد فقط)
            ========================================================================
          */}
          <div className="bg-[#132229] rounded-xl px-2.5 py-1.5 border border-[#1c3542] flex items-center justify-between gap-2 overflow-x-auto scrollbar-none whitespace-nowrap min-h-[38px] text-white">
        
        {/* Quick Filter Buttons (Single Row with badge counts next to labels) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('unclosed')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'unclosed'
                ? 'bg-[#0e3b43] text-cyan-300 border border-cyan-500/50 shadow-2xs'
                : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300 border border-[#22404e]'
            }`}
          >
            <span>النشطة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'unclosed' ? 'bg-[#088395] text-white' : 'bg-[#101c22] text-slate-400'
            }`}>
              {stats.unclosed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'overdue'
                ? 'bg-red-950/60 text-red-300 border border-red-800 shadow-2xs'
                : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300 border border-[#22404e]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
            <span>المتأخرة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'overdue' ? 'bg-red-900 text-red-200' : 'bg-[#101c22] text-slate-400'
            }`}>
              {stats.overdue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 shadow-2xs'
                : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300 border border-[#22404e]'
            }`}
          >
            <span>المكتملة</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'completed' ? 'bg-emerald-900 text-emerald-200' : 'bg-[#101c22] text-slate-400'
            }`}>
              {stats.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#088395] text-white shadow-2xs'
                : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300 border border-[#22404e]'
            }`}
          >
            <span>الكل</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              statusFilter === 'all' ? 'bg-[#0c2f38] text-cyan-200' : 'bg-[#101c22] text-slate-400'
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
              className="bg-[#182c35] border border-[#22404e] rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-200 outline-none h-7"
            >
              <option value="all" className="bg-[#132229]">كل البنود</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-[#132229]">{cat}</option>
              ))}
            </select>
          )}

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
              showAdvancedFilters || activeAdvancedFiltersCount > 0
                ? 'bg-[#088395] text-white font-black shadow-2xs ring-1 ring-cyan-400'
                : 'bg-[#182c35] hover:bg-[#203a46] text-slate-300 border border-[#22404e]'
            }`}
            title="خيارات الفلترة والتصنيف المتقدمة (الأولوية، التاريخ، المسؤول)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">فلترة متقدمة</span>
            {activeAdvancedFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {activeAdvancedFiltersCount}
              </span>
            )}
          </button>

          {/* Search Box */}
          <div className="relative w-28 sm:w-40">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full pl-6 pr-6 py-0.5 h-7 bg-[#182c35] border border-[#22404e] rounded-lg text-[11px] text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
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
        <div className="bg-[#132229] rounded-xl p-3 sm:p-3.5 border border-[#1c3542] shadow-xs space-y-2.5 animate-fadeIn text-white">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b3440] pb-2">
            <div className="flex items-center gap-2 text-xs font-black text-white">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>خيارات الفلترة والتصنيف المتقدمة للمهام</span>
              <span className="text-[11px] font-medium text-slate-400">
                (عرض {filteredTasks.length} من أصل {tasks.length} مهمة)
              </span>
            </div>
            
            {activeAdvancedFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetAdvancedFilters}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition"
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
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>تصنيف الأولوية:</span>
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className={`w-full bg-[#182c35] border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer text-slate-200 ${
                  selectedPriority !== 'all' 
                    ? 'border-cyan-500 bg-[#0e3b43] text-cyan-200 font-black ring-1 ring-cyan-400/40' 
                    : 'border-[#22404e] hover:border-cyan-500/50'
                }`}
              >
                <option value="all" className="bg-[#132229]">كل الأولويات</option>
                <option value="urgent" className="bg-[#132229]">🔴 عاجلة جداً (Urgent)</option>
                <option value="high" className="bg-[#132229]">🟠 مرتفعة (High)</option>
                <option value="medium" className="bg-[#132229]">🟡 متوسطة (Medium)</option>
                <option value="low" className="bg-[#132229]">🟢 منخفضة (Low)</option>
              </select>
            </div>

            {/* 2. Assignee / Responsible Member */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" />
                <span>المسؤول المكلّف:</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={`w-full bg-[#182c35] border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer text-slate-200 ${
                  selectedMemberId !== 'all' 
                    ? 'border-cyan-500 bg-[#0e3b43] text-cyan-200 font-black ring-1 ring-cyan-400/40' 
                    : 'border-[#22404e] hover:border-cyan-500/50'
                }`}
              >
                <option value="all" className="bg-[#132229]">كل المسؤولين والمشرفين ({teamMembers.length})</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#132229]">
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date / Deadline Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>تصفية التاريخ والموعد:</span>
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`w-full bg-[#182c35] border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer text-slate-200 ${
                  dateFilter !== 'all' 
                    ? 'border-cyan-500 bg-[#0e3b43] text-cyan-200 font-black ring-1 ring-cyan-400/40' 
                    : 'border-[#22404e] hover:border-cyan-500/50'
                }`}
              >
                <option value="all" className="bg-[#132229]">كل المواعيد الزمنية</option>
                <option value="today" className="bg-[#132229]">⚡ تاريخ الإغلاق اليوم</option>
                <option value="this_week" className="bg-[#132229]">📅 خلال هذا الأسبوع (7 أيام)</option>
                <option value="overdue" className="bg-[#132229]">⚠️ متأخرة عن الموعد</option>
                <option value="has_date" className="bg-[#132229]">📌 محدد لها موعد إغلاق</option>
                <option value="no_date" className="bg-[#132229]">⚪ بدون تاريخ محدد</option>
              </select>
            </div>

            {/* 4. Sorting Classification */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span>ترتيب المهام حسب:</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full bg-[#182c35] border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none transition cursor-pointer text-slate-200 ${
                  sortBy !== 'default' 
                    ? 'border-cyan-500 bg-[#0e3b43] text-cyan-200 font-black ring-1 ring-cyan-400/40' 
                    : 'border-[#22404e] hover:border-cyan-500/50'
                }`}
              >
                <option value="default" className="bg-[#132229]">الترتيب الافتراضي</option>
                <option value="priority_desc" className="bg-[#132229]">الأعلى أولوية أولاً (عاجلة ⬅ منخفضة)</option>
                <option value="deadline_asc" className="bg-[#132229]">الأقرب موعداً أولاً (حسب تاريخ التسليم)</option>
                <option value="deadline_desc" className="bg-[#132229]">الأبعد موعداً أولاً</option>
                <option value="newest" className="bg-[#132229]">الأحدث إضافة أولاً</option>
                <option value="progress_desc" className="bg-[#132229]">الأعلى نسبة إنجاز أولاً</option>
              </select>
            </div>

          </div>

          {/* Active Filter Pills for quick one-click removal */}
          {activeAdvancedFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#1b3440]">
              <span className="text-[10px] font-bold text-slate-400">الفلاتر المطبقة:</span>
              
              {selectedPriority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0e3b43] text-cyan-200 text-[10px] font-bold border border-cyan-500/40">
                  <span>أولوية: {selectedPriority === 'urgent' ? 'عاجلة' : selectedPriority === 'high' ? 'مرتفعة' : selectedPriority === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                  <button type="button" onClick={() => setSelectedPriority('all')} className="hover:text-white cursor-pointer">×</button>
                </span>
              )}

              {selectedMemberId !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#182c35] text-cyan-200 text-[10px] font-bold border border-[#22404e]">
                  <span>المسؤول: {teamMembers.find(m => m.id === selectedMemberId)?.name}</span>
                  <button type="button" onClick={() => setSelectedMemberId('all')} className="hover:text-white cursor-pointer">×</button>
                </span>
              )}

              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#182c35] text-cyan-200 text-[10px] font-bold border border-[#22404e]">
                  <span>التاريخ: {dateFilter === 'today' ? 'اليوم' : dateFilter === 'this_week' ? 'هذا الأسبوع' : dateFilter === 'overdue' ? 'المتأخرة' : dateFilter === 'has_date' ? 'لها تاريخ' : 'بدون تاريخ'}</span>
                  <button type="button" onClick={() => setDateFilter('all')} className="hover:text-white cursor-pointer">×</button>
                </span>
              )}

              {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#182c35] text-cyan-200 text-[10px] font-bold border border-[#22404e]">
                  <span>الترتيب: {sortBy === 'priority_desc' ? 'الأعلى أولوية' : sortBy === 'deadline_asc' ? 'الأقرب موعداً' : sortBy === 'newest' ? 'الأحدث' : sortBy === 'progress_desc' ? 'الأعلى إنجازاً' : 'الأبعد موعداً'}</span>
                  <button type="button" onClick={() => setSortBy('default')} className="hover:text-white cursor-pointer">×</button>
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
      <div className="bg-[#132229] rounded-2xl border border-[#1c3542] overflow-hidden shadow-xs text-white">
        
        {/* Table/List Header */}
        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-[#101c22] text-slate-400 font-bold text-[11px] border-b border-[#1b3440]">
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
          <div className="p-8 text-center text-slate-400 text-xs">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-200">لا توجد مهام مطابقة لخيارات الفلترة الحالية</p>
            <p className="mt-1 text-slate-400">يمكنك تغيير فلتر المشروع أو إنشاء مهمة أو مشروع جديد</p>
            <div className="flex items-center justify-center gap-2.5 mt-3">
              <button
                type="button"
                onClick={() => onOpenCreateTask(singleSelectedProject?.id)}
                className="px-3 py-1.5 bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ إضافة مهمة</span>
              </button>
              <button
                type="button"
                onClick={onOpenCreateProject}
                className="px-3 py-1.5 bg-[#182c35] hover:bg-[#203a46] text-cyan-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-[#22404e] cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ إضافة مشروع</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#1b3440]">
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
                    isExpanded ? 'bg-[#101c22]/90 ring-1 ring-cyan-500/40' : 'hover:bg-[#182c35]/50'
                  }`}
                >
                  
                  {/* 
                    MOBILE COMPACT VIEW (lg:hidden) - اختصار الكلام تماماً لصالح الصور
                  */}
                  <div 
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="lg:hidden p-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#182c35]/40 transition"
                  >
                    {/* Checkbox + Compressed Title & Subline */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTaskCompleted(task, e)}
                        title={isCompleted ? 'إلغاء الإكمال والتراجع عن إغلاق المهمة' : 'تعليم المهمة كمكتملة'}
                        className={`p-0.5 rounded transition shrink-0 cursor-pointer ${
                          isCompleted ? 'text-emerald-400' : 'text-slate-500 hover:text-cyan-400'
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
                                ? 'bg-slate-500 ring-slate-700' 
                                : deadline.isOverdue 
                                ? 'bg-red-500 ring-red-900/60 animate-pulse' 
                                : 'bg-emerald-500 ring-emerald-900/60'
                            }`}
                            title={isCompleted ? 'مكتملة' : deadline.isOverdue ? 'متأخرة عن الموعد' : 'قيد التنفيذ / جارية'}
                          />
                          <span 
                            className={`text-xs font-bold truncate ${
                              isCompleted ? 'line-through text-slate-500' : 'text-white'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </span>
                          {deadline.isOverdue && !isCompleted && (
                            <span className="bg-red-950/80 text-red-300 border border-red-800 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                              متأخرة
                            </span>
                          )}
                          {task.priority === 'urgent' && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                              عاجلة
                            </span>
                          )}
                          {task.priority === 'high' && (
                            <span className="bg-[#0e3b43] text-cyan-300 border border-cyan-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                              مرتفعة
                            </span>
                          )}
                        </div>

                        {/* Minimal 2nd line: Project • Assignee • Progress */}
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          {project && (
                            <span className="font-semibold text-slate-300 truncate max-w-[95px] flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${project.color || 'bg-cyan-500'}`}></span>
                              <span className="truncate">{project.name}</span>
                            </span>
                          )}
                          {waitingInfo.responsibleMember && (
                            <span className="font-medium text-slate-400 truncate max-w-[75px]">
                              {waitingInfo.responsibleMember.name.split(' ')[0]}
                            </span>
                          )}
                          <span className="font-mono font-bold text-cyan-300 bg-[#182c35] px-1 rounded border border-[#22404e]" dir="ltr">
                            {progress}%
                          </span>
                          {task.externalLink && (
                            <a
                              href={task.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-cyan-400 hover:text-cyan-300 p-0.5"
                              title="فتح الرابط"
                            >
                              <Link2 className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (Edit & Delete) clearly visible on mobile + PROMINENT FIELD IMAGE + Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      
                      {/* Mobile Edit and Delete Buttons */}
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenEditTask && onOpenEditTask(task)}
                          className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-[#182c35] active:scale-95 rounded-lg transition cursor-pointer"
                          title="تعديل المهمة"
                        >
                          <Edit3 className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رغبتك في حذف مهمة "${task.title}"؟`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 active:scale-95 rounded-lg transition cursor-pointer"
                          title="حذف المهمة"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>

                      {displayImageUrl ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxImage({ url: displayImageUrl, caption: task.imageCaption || task.title });
                          }}
                          className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#22404e] shadow-2xs group cursor-pointer shrink-0 bg-[#182c35]"
                          title="معاينة صورة الموقع وتكبيرها"
                        >
                          <img 
                            src={displayImageUrl} 
                            alt={task.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200" 
                          />
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-transparent transition" />
                          <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white rounded p-0.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenTaskAttachment(task, e)}
                          className="w-10 h-10 rounded-xl border border-dashed border-[#22404e] hover:border-cyan-400/60 bg-[#182c35] hover:bg-[#203a46] flex flex-col items-center justify-center text-slate-400 hover:text-cyan-300 transition cursor-pointer shrink-0"
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
                        className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
                        title={isExpanded ? 'طي' : 'عرض الخطوات'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cyan-400" />
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
                        className="p-1 text-slate-400 hover:text-white rounded transition shrink-0"
                        title={isExpanded ? 'طي التفاصيل' : 'عرض الخطوات والمرفقات'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-cyan-400" />
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
                          isCompleted ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-cyan-400'
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
                              ? 'bg-slate-500 ring-slate-700' 
                              : deadline.isOverdue 
                              ? 'bg-red-500 ring-red-900/60 animate-pulse' 
                              : 'bg-emerald-500 ring-emerald-900/60'
                          }`}
                          title={isCompleted ? 'مكتملة' : deadline.isOverdue ? 'متأخرة عن الموعد' : 'قيد التنفيذ / جارية'}
                        />
                        <span 
                          className={`text-xs font-bold truncate ${
                            isCompleted ? 'line-through text-slate-500' : 'text-white'
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
                          <span className="text-[9px] font-bold bg-[#0e3b43] text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded shrink-0">
                            مرتفعة
                          </span>
                        )}

                        {task.category && (
                          <span className="hidden xl:inline-block text-[10px] font-medium bg-[#182c35] text-slate-300 border border-[#22404e] px-1.5 py-0.2 rounded shrink-0">
                            {task.category}
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Project Tag */}
                    <div className="col-span-2 w-full flex items-center gap-1.5 shrink-0">
                      {project && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${project.color || 'bg-cyan-500'}`}></span>
                          <span className="truncate">{project.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Current Step / Responsible Member */}
                    <div className="col-span-2 w-full flex items-center gap-2 min-w-0">
                      {waitingInfo.responsibleMember ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ${waitingInfo.responsibleMember.avatarColor || 'bg-cyan-700'}`}>
                            {waitingInfo.responsibleMember.name.split(' ')[1]?.[0] || waitingInfo.responsibleMember.name[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {waitingInfo.responsibleMember.name.split(' ')[0]} {waitingInfo.responsibleMember.name.split(' ')[1] || ''}
                          </span>
                          
                          {/* Quick WhatsApp icon */}
                          <a
                            href={createWhatsAppAlertLink(waitingInfo.responsibleMember, task, project, waitingInfo.subtask, deadline)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-400 hover:text-emerald-300 p-0.5 rounded transition shrink-0"
                            title={`مراسلة واتساب: ${waitingInfo.responsibleMember.name}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> مكتملة
                        </span>
                      )}
                    </div>

                    {/* Progress Bar & % */}
                    <div className="col-span-2 w-full flex items-center gap-2">
                      <div className="flex-1 bg-[#182c35] h-1.5 rounded-full overflow-hidden border border-[#22404e]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-cyan-400' : 'bg-slate-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-cyan-300 w-8 text-left" dir="ltr">
                        {progress}%
                      </span>
                    </div>

                    {/* Closing Date & Delay Badge */}
                    <div className="col-span-1 w-full text-center">
                      {deadline.hasDate ? (
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          deadline.isOverdue && !isCompleted
                            ? 'bg-red-950/80 text-red-300 border border-red-800'
                            : deadline.daysDiff <= 3 && !isCompleted
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-[#182c35] text-slate-300 border border-[#22404e]'
                        }`}>
                          {deadline.badgeText}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">بدون تاريخ</span>
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
                            isGoogleSheet ? 'text-emerald-400 hover:bg-emerald-950/40' : 'text-cyan-400 hover:bg-cyan-950/40'
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
                          className="relative w-7 h-7 rounded-md overflow-hidden border border-[#22404e] hover:scale-110 transition cursor-pointer shadow-2xs"
                          title="معاينة الصورة المرفقة"
                        >
                          <img src={displayImageUrl} alt="" className="w-full h-full object-cover" />
                        </button>
                      )}

                      {/* Add/Edit Attachment button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenTaskAttachment(task, e)}
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded transition cursor-pointer"
                        title="إضافة أو تعديل الروابط والصور"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Task button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenEditTask) onOpenEditTask(task);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded transition cursor-pointer"
                        title="تعديل المهمة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Task button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`هل أنت متأكد من حذف مهمة "${task.title}"؟`)) {
                            onDeleteTask(task.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition cursor-pointer"
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
                    <div className="p-4 bg-[#101c22] border-t border-[#1c3542] space-y-4 animate-fadeIn">
                      
                      {/* Subtasks Bar Header with View Mode Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            الخطوات ({task.subtasks.length}):
                          </span>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            يمكن تعديل أي خطوة أو التراجع عن إكمالها في أي وقت
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Switch between Table View and Visual Pipeline */}
                          <div className="bg-[#182c35] p-0.5 rounded-lg flex items-center text-[10px] font-bold border border-[#22404e]">
                            <button
                              type="button"
                              onClick={() => setTaskViewMode(prev => ({ ...prev, [task.id]: 'table' }))}
                              className={`px-2 py-0.5 rounded-md transition ${
                                currentMode === 'table' ? 'bg-[#088395] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              قائمة سطرية
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskViewMode(prev => ({ ...prev, [task.id]: 'pipeline' }))}
                              className={`px-2 py-0.5 rounded-md transition ${
                                currentMode === 'pipeline' ? 'bg-[#088395] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              مسار تسلسلي
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => onAddSubtask(task.id)}
                            className="text-[11px] font-bold text-cyan-200 bg-[#0e3b43] hover:bg-[#134e5a] border border-cyan-500/40 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ إضافة خطوة</span>
                          </button>
                        </div>
                      </div>

                      {/* MODE 1: COMPACT SINGLE-LINE SUBTASK TABLE (مع إمكانية التراجع والتعديل الكامل) */}
                      {currentMode === 'table' ? (
                        <div className="bg-[#132229] rounded-xl border border-[#1c3542] overflow-hidden divide-y divide-[#1b3440]">
                          {task.subtasks.map((step, idx) => {
                            const isStepDone = step.status === 'completed';
                            const assigned = teamMembers.find(m => m.id === step.assignedMemberId);

                            return (
                              <div 
                                key={step.id} 
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 px-3 text-xs hover:bg-[#182c35]/40 transition"
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
                                      isStepDone ? 'text-emerald-400' : 'text-slate-500 hover:text-cyan-400'
                                    }`}
                                  >
                                    {isStepDone ? (
                                      <CheckSquare className="w-4 h-4" />
                                    ) : (
                                      <Square className="w-4 h-4" />
                                    )}
                                  </button>

                                  <span className="text-[11px] font-bold text-slate-500 w-5 shrink-0">
                                    #{idx + 1}
                                  </span>

                                  {/* Inline editable title */}
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => handleUpdateSubtask(task.id, step.id, { title: e.target.value })}
                                    className={`w-full bg-transparent border border-transparent hover:border-[#22404e] focus:border-cyan-400 rounded px-1 py-0.5 font-bold outline-none ${
                                      isStepDone ? 'line-through text-slate-500' : 'text-white'
                                    }`}
                                  />
                                </div>

                                {/* Step Assignee Selector */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={step.assignedMemberId}
                                    onChange={(e) => handleUpdateSubtask(task.id, step.id, { assignedMemberId: e.target.value })}
                                    className="bg-[#182c35] border border-[#22404e] rounded-lg px-2 py-0.5 text-[11px] text-slate-200 outline-none"
                                  >
                                    {teamMembers.map(m => (
                                      <option key={m.id} value={m.id} className="bg-[#132229]">
                                        {m.name} ({m.role})
                                      </option>
                                    ))}
                                  </select>

                                  {assigned && (
                                    <a
                                      href={`tel:${assigned.phone}`}
                                      className="p-1 text-slate-400 hover:text-cyan-300"
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
                                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                                        : step.status === 'in_progress'
                                        ? 'bg-[#0e3b43] text-cyan-200 border-cyan-500/50'
                                        : step.status === 'blocked'
                                        ? 'bg-red-950/70 text-red-300 border-red-800'
                                        : 'bg-[#182c35] text-slate-400 border-[#22404e]'
                                    }`}
                                  >
                                    <option value="pending" className="bg-[#132229]">⏳ انتظار</option>
                                    <option value="in_progress" className="bg-[#132229]">⚙️ قيد التنفيذ</option>
                                    <option value="completed" className="bg-[#132229]">✅ مكتملة</option>
                                    <option value="blocked" className="bg-[#132229]">⛔ معطلة</option>
                                  </select>

                                  {/* Prominent Undo Button if completed */}
                                  {isStepDone && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubtask(task.id, step.id, { status: 'pending', completedAt: undefined })}
                                      className="text-[10px] text-cyan-200 bg-[#0e3b43] hover:bg-[#134e5a] border border-cyan-500/40 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 cursor-pointer"
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
                                      className="p-1 text-cyan-400 hover:text-cyan-300"
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
                                      className="p-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                                      title="معاينة صورة الخطوة"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    </button>
                                  ) : null}

                                  {/* Attach Link or Image to this Subtask */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenSubtaskAttachment(task, step)}
                                    className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
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
                                      className="text-slate-400 hover:text-cyan-300 disabled:opacity-20 p-0.5 cursor-pointer"
                                      title="تقديم الخطوة للأمام في الترتيب"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === task.subtasks.length - 1}
                                      onClick={() => handleMoveSubtask(task.id, idx, 'later')}
                                      className="text-slate-400 hover:text-cyan-300 disabled:opacity-20 p-0.5 cursor-pointer"
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
                                      className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
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
                        <div className="bg-[#132229] p-3 rounded-xl border border-[#1c3542]">
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
                      <div className="bg-[#132229] p-3 rounded-xl border border-[#1c3542] flex flex-wrap items-center justify-between gap-3 text-xs text-white">
                        <div className="flex flex-wrap items-center gap-4">
                          
                          {/* Link info */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400">الرابط المرفق:</span>
                            {task.externalLink ? (
                              <a
                                href={task.externalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-cyan-300 hover:underline flex items-center gap-1"
                              >
                                {isGoogleSheet ? <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5 text-cyan-400" />}
                                <span>{task.externalLinkLabel || 'فتح الرابط'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-slate-500 text-[11px]">لا يوجد رابط لشيت أو درايف</span>
                            )}
                          </div>

                          {/* Image info */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400">الصورة المرفقة:</span>
                            {task.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => setLightboxImage({ url: task.imageUrl!, caption: task.imageCaption || task.title })}
                                className="font-bold text-cyan-300 hover:underline flex items-center gap-1.5 cursor-pointer"
                              >
                                <img src={task.imageUrl} alt="" className="w-6 h-6 rounded-md object-cover border border-[#22404e] shrink-0" />
                                <span>{task.imageCaption || 'معاينة الصورة'}</span>
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[11px]">لا توجد صورة موقع</span>
                            )}
                          </div>

                        </div>

                        {/* Button to attach / edit links & photos */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenEditTask && onOpenEditTask(task)}
                            className="px-2.5 py-1 bg-[#088395] hover:bg-[#0aa0b6] text-white rounded-lg font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                            title="تعديل المهمة بالكامل"
                          >
                            <Edit3 className="w-3 h-3 stroke-[2.5]" />
                            <span>تعديل المهمة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenTaskAttachment(task)}
                            className="px-2.5 py-1 bg-[#182c35] hover:bg-[#203a46] text-cyan-200 border border-[#22404e] rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>إدارة روابط وصور المهمة</span>
                          </button>

                          {/* Close Accordion */}
                          <button
                            type="button"
                            onClick={() => setExpandedTaskId(null)}
                            className="px-2.5 py-1 bg-[#182c35] hover:bg-[#203a46] text-slate-300 rounded-lg font-bold transition cursor-pointer border border-[#22404e]"
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
