import React, { useState, useMemo } from 'react';
import { Task, Project, TeamMember, SubTask } from '../types';
import { TaskCard } from './TaskCard';
import { getDeadlineInfo } from '../utils/dateUtils';
import { 
  Search, 
  Filter, 
  Building2, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  SortAsc, 
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';

interface AllTasksViewProps {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onOpenCreateTask: (projectId?: string) => void;
  onSelectProject: (projectId: string) => void;
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  tasks,
  projects,
  teamMembers,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onOpenCreateTask,
  onSelectProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'progress' | 'recent'>('deadline');

  // Compute summary stats
  const stats = useMemo(() => {
    let overdueCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    tasks.forEach(t => {
      const isDone = t.status === 'completed';
      const deadline = getDeadlineInfo(t.expectedClosingDate, isDone);
      if (deadline.isOverdue && !isDone) {
        overdueCount++;
      } else if (isDone) {
        completedCount++;
      } else {
        inProgressCount++;
      }
    });

    return {
      total: tasks.length,
      overdue: overdueCount,
      inProgress: inProgressCount,
      completed: completedCount,
    };
  }, [tasks]);

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        const project = projects.find(p => p.id === task.projectId);
        const assignee = teamMembers.find(m => m.id === task.assignedMemberId);

        // Search text
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(term);
          const matchDesc = task.description.toLowerCase().includes(term);
          const matchProject = project?.name.toLowerCase().includes(term);
          const matchMember = assignee?.name.toLowerCase().includes(term);
          const matchSubtask = task.subtasks.some(s => s.title.toLowerCase().includes(term));
          if (!matchTitle && !matchDesc && !matchProject && !matchMember && !matchSubtask) {
            return false;
          }
        }

        // Project filter
        if (selectedProjectId !== 'all' && task.projectId !== selectedProjectId) {
          return false;
        }

        // Member filter (main assignee OR subtask assignee)
        if (selectedMemberId !== 'all') {
          const isMain = task.assignedMemberId === selectedMemberId;
          const isSub = task.subtasks.some(s => s.assignedMemberId === selectedMemberId);
          if (!isMain && !isSub) return false;
        }

        // Status filter
        const isDone = task.status === 'completed';
        const deadline = getDeadlineInfo(task.expectedClosingDate, isDone);

        if (selectedStatus === 'overdue') {
          return deadline.isOverdue && !isDone;
        }
        if (selectedStatus === 'in_progress') {
          return !isDone && !deadline.isOverdue;
        }
        if (selectedStatus === 'completed') {
          return isDone;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          if (!a.expectedClosingDate) return 1;
          if (!b.expectedClosingDate) return -1;
          return new Date(a.expectedClosingDate).getTime() - new Date(b.expectedClosingDate).getTime();
        }
        if (sortBy === 'progress') {
          const progA = a.subtasks.length > 0 
            ? a.subtasks.filter(s => s.status === 'completed').length / a.subtasks.length 
            : 0;
          const progB = b.subtasks.length > 0 
            ? b.subtasks.filter(s => s.status === 'completed').length / b.subtasks.length 
            : 0;
          return progB - progA;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, projects, teamMembers, searchTerm, selectedProjectId, selectedMemberId, selectedStatus, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div 
          onClick={() => setSelectedStatus('all')}
          className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-stone-600 mb-1">
            <span className="text-xs font-bold">إجمالي المهام المسجلة</span>
            <Layers className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900">
            {stats.total}
          </div>
          <span className="text-[11px] text-stone-400">عبر جميع مشاريع المقاولات</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('overdue')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
            selectedStatus === 'overdue' 
              ? 'bg-red-50 border-red-400 ring-2 ring-red-400/30' 
              : 'bg-white border-stone-200/90 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              مهام متأخرة عن الإغلاق
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600">
            {stats.overdue}
          </div>
          <span className="text-[11px] text-red-500 font-medium">تجاوزت التاريخ المتوقع</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('in_progress')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
            selectedStatus === 'in_progress' 
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30' 
              : 'bg-white border-stone-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-900 mb-1">
            <span className="text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              قيد العمل والتنفيذ
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {stats.inProgress}
          </div>
          <span className="text-[11px] text-stone-500">جاري متابعة خطواتها</span>
        </div>

        <div 
          onClick={() => setSelectedStatus('completed')}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
            selectedStatus === 'completed' 
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30' 
              : 'bg-white border-stone-200/90 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مهام مكتملة
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {stats.completed}
          </div>
          <span className="text-[11px] text-stone-500">تم إغلاق كافة خطواتها</span>
        </div>

      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم المهمة، المشروع، الخطوة الفرعية، أو اسم المهندس المسؤول..."
              className="w-full pl-3 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
            />
          </div>

          {/* New Task Button */}
          <button
            type="button"
            onClick={() => onOpenCreateTask()}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة جديدة</span>
          </button>
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-semibold">المشروع:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-stone-800 font-bold outline-none cursor-pointer"
            >
              <option value="all">كافة المشاريع</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Member Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
            <User className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-semibold">المسؤول:</span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-transparent text-stone-800 font-bold outline-none cursor-pointer"
            >
              <option value="all">كافة فريق العمل</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-semibold">الحالة:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-stone-800 font-bold outline-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="overdue">⚠️ متأخرة عن الإغلاق فقط</option>
              <option value="in_progress">⚙️ قيد التنفيذ فقط</option>
              <option value="completed">✅ مكتملة فقط</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 mr-auto">
            <SortAsc className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-stone-500 font-semibold">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-stone-800 font-bold outline-none cursor-pointer"
            >
              <option value="deadline">تاريخ الإغلاق (الأقرب / الأكثر تأخيراً)</option>
              <option value="progress">نسبة الإنجاز الأكثر</option>
              <option value="recent">الأحدث تسجيلاً</option>
            </select>
          </div>

          {(searchTerm || selectedProjectId !== 'all' || selectedMemberId !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedProjectId('all');
                setSelectedMemberId('all');
                setSelectedStatus('all');
              }}
              className="text-amber-800 hover:underline font-bold px-2 py-1"
            >
              إعادة تعيين الفلاتر
            </button>
          )}

        </div>
      </div>

      {/* Main Tasks List Under Each Other ("في صفحة رئيسية أخرى يتم توضيح جميع المهام من كل المشاريع تحت بعضها") */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-stone-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-800">لا توجد مهام مطابقة لخيارات البحث</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر، أو قم بإضافة مهمة جديدة لمشروعك.
            </p>
            <button
              type="button"
              onClick={() => onOpenCreateTask()}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              + إضافة مهمة جديدة
            </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            return (
              <TaskCard
                key={task.id}
                task={task}
                project={project}
                teamMembers={teamMembers}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onAddSubtask={onAddSubtask}
                onSelectProject={onSelectProject}
              />
            );
          })
        )}
      </div>

    </div>
  );
};
