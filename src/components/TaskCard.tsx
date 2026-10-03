import React, { useState } from 'react';
import { Task, Project, TeamMember, SubTask } from '../types';
import { TaskPipeline } from './TaskPipeline';
import { 
  getDeadlineInfo, 
  calculateTaskProgress, 
  getActiveWaitingSubtask, 
  createWhatsAppAlertLink 
} from '../utils/dateUtils';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  Send, 
  User, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical, 
  Trash2, 
  Edit3,
  CalendarDays,
  Flame,
  MessageCircle,
  ExternalLink,
  FileSpreadsheet,
  FolderGit2,
  Link2
} from 'lucide-react';
import { EditExternalLinkModal } from './EditExternalLinkModal';

interface TaskCardProps {
  task: Task;
  project?: Project;
  teamMembers: TeamMember[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onSelectProject?: (projectId: string) => void;
  onSendAlertModal?: (task: Task, subtask: SubTask | null, member: TeamMember) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  project,
  teamMembers,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onSelectProject,
  onSendAlertModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(task.expectedClosingDate || '');
  const [isEditingLink, setIsEditingLink] = useState(false);

  const progress = calculateTaskProgress(task);
  const isCompleted = task.status === 'completed' || progress === 100;
  const deadline = getDeadlineInfo(task.expectedClosingDate, isCompleted);
  const waitingInfo = getActiveWaitingSubtask(task, teamMembers);
  const mainAssignee = teamMembers.find(m => m.id === task.assignedMemberId);

  const isGoogleSheet = task.externalLink?.includes('spreadsheets') || task.externalLink?.includes('sheet');
  const isGoogleDrive = task.externalLink?.includes('drive.google');

  const handleSaveExternalLink = (taskId: string, link: string | undefined, label: string | undefined) => {
    onUpdateTask(taskId, {
      externalLink: link,
      externalLinkLabel: label,
    });
  };

  // Subtask handlers
  const handleUpdateSubtask = (subtaskId: string, updates: Partial<SubTask>) => {
    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, ...updates };
      }
      return st;
    });

    // Check if all subtasks are completed
    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.status === 'completed');
    const newStatus = allDone ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status;

    onUpdateTask(task.id, {
      subtasks: updatedSubtasks,
      status: newStatus,
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    onUpdateTask(task.id, { subtasks: updatedSubtasks });
  };

  const handleSaveDate = () => {
    onUpdateTask(task.id, { expectedClosingDate: tempDate || undefined });
    setIsEditingDate(false);
  };

  const handleToggleComplete = () => {
    if (isCompleted) {
      onUpdateTask(task.id, { status: 'in_progress' });
    } else {
      // Mark all subtasks as completed
      const allCompletedSubtasks = task.subtasks.map(s => ({
        ...s,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
      }));
      onUpdateTask(task.id, { 
        status: 'completed',
        subtasks: allCompletedSubtasks
      });
    }
  };

  const getPriorityBadge = () => {
    switch (task.priority) {
      case 'urgent':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Flame className="w-3 h-3" /> عاجلة جداً</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full font-semibold">أولوية مرتفعة</span>;
      case 'medium':
        return <span className="bg-stone-100 text-stone-700 text-xs px-2 py-0.5 rounded-full">أولوية عادية</span>;
      case 'low':
        return <span className="bg-stone-100 text-stone-500 text-xs px-2 py-0.5 rounded-full">أولوية منخفضة</span>;
    }
  };

  return (
    <div 
      id={`task-card-${task.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
        deadline.isOverdue && !isCompleted 
          ? 'border-red-300 ring-1 ring-red-400/30' 
          : isCompleted 
          ? 'border-emerald-200 bg-emerald-50/20' 
          : 'border-stone-200'
      }`}
    >
      {/* Top Header Row */}
      <div className="p-4 sm:p-5 border-b border-stone-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          
          {/* Project & Category Badges */}
          <div className="space-y-1.5 flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-2">
              {project && (
                <button
                  type="button"
                  onClick={() => onSelectProject?.(project.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>{project.name}</span>
                  <span className="text-[10px] bg-amber-200/60 px-1 py-0.2 rounded text-amber-900">
                    {project.code}
                  </span>
                </button>
              )}
              {task.category && (
                <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-lg border border-stone-200 font-medium">
                  {task.category}
                </span>
              )}
              {getPriorityBadge()}
            </div>

            {/* Task Main Title */}
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug pt-1">
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl">
                {task.description}
              </p>
            )}

            {/* External Google Sheets / Drive Link Display */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              {task.externalLink ? (
                <div className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200/80 rounded-xl px-3 py-1 text-xs transition">
                  <a
                    href={task.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-bold text-stone-900 hover:text-amber-700"
                  >
                    {isGoogleSheet ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    ) : isGoogleDrive ? (
                      <FolderGit2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Link2 className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{task.externalLinkLabel || (isGoogleSheet ? 'Google Sheets' : isGoogleDrive ? 'Google Drive' : 'مستند الويب')}</span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsEditingLink(true)}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition"
                    title="تعديل الرابط"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingLink(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-amber-700 font-semibold transition cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>+ إضافة رابط جوجل شيت أو درايف</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Action & Status Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isCompleted 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'مكتملة' : 'إغلاق المهمة'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteTask(task.id)}
              className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              title="حذف المهمة"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
              title={isExpanded ? 'طي الخطوات' : 'عرض خطوات السلسلة'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Info Grid: Progress, Dates & Waiting On Person */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-stone-100 text-xs">
          
          {/* Progress Bar & Percentage */}
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70">
            <div className="flex items-center justify-between font-semibold text-stone-700 mb-1.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                نسبة إنجاز الخطوات:
              </span>
              <span className="text-stone-900 font-bold text-sm">{progress}%</span>
            </div>
            <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  progress === 100 
                    ? 'bg-emerald-500' 
                    : progress > 50 
                    ? 'bg-amber-500' 
                    : 'bg-stone-600'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-stone-500 mt-1">
              <span>{task.subtasks.filter(s => s.status === 'completed').length} من {task.subtasks.length} خطوة منجزة</span>
              <span>المشرف: {mainAssignee?.name || 'غير محدد'}</span>
            </div>
          </div>

          {/* Deadline / Remaining Days / Overdue Delay Days */}
          <div className={`rounded-xl p-2.5 border ${
            deadline.isOverdue && !isCompleted
              ? 'bg-red-50/80 border-red-200 text-red-900'
              : 'bg-stone-50 border-stone-200/70 text-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                تاريخ الإغلاق المتوقع:
              </span>
              <button
                type="button"
                onClick={() => setIsEditingDate(!isEditingDate)}
                className="text-[10px] text-amber-700 hover:underline font-bold"
              >
                {isEditingDate ? 'إلغاء' : 'تعديل'}
              </button>
            </div>

            {isEditingDate ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="bg-white border border-stone-300 rounded px-2 py-0.5 text-xs text-stone-800 outline-none w-full"
                />
                <button
                  type="button"
                  onClick={handleSaveDate}
                  className="bg-amber-600 text-white px-2 py-0.5 rounded text-xs font-bold"
                >
                  حفظ
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="font-bold text-stone-900">
                  {deadline.formattedDate}
                </span>

                {/* Remaining / Delay Badge */}
                {deadline.hasDate && (
                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs shadow-xs ${
                    deadline.isOverdue && !isCompleted
                      ? 'bg-red-600 text-white animate-pulse'
                      : deadline.statusColor === 'amber'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {deadline.badgeText}
                  </span>
                )}
              </div>
            )}

            <div className="text-[10px] text-stone-500 mt-1">
              {deadline.isOverdue && !isCompleted ? (
                <span className="text-red-700 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> تجاوز موعد الإغلاق بـ {Math.abs(deadline.daysDiff)} يوماً
                </span>
              ) : deadline.hasDate ? (
                <span>ينتهي خلال {deadline.daysDiff} يوم من تاريخ اليوم</span>
              ) : (
                <span className="italic text-stone-400">حدد موعداً لحساب أيام التأخير</span>
              )}
            </div>
          </div>

          {/* Who is it waiting on? (آخر مهمة فرعية متوقفة على مين) */}
          <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-700">
              <span className="font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                {waitingInfo.statusLabel}:
              </span>
              {waitingInfo.subtask && (
                <span className="text-[10px] bg-stone-200/70 text-stone-700 px-1.5 py-0.2 rounded font-mono">
                  خطوة {waitingInfo.subtask.order}
                </span>
              )}
            </div>

            {waitingInfo.responsibleMember ? (
              <div className="flex items-center justify-between mt-1 pt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${waitingInfo.responsibleMember.avatarColor || 'bg-amber-600'}`}>
                    {waitingInfo.responsibleMember.name.split(' ')[1]?.[0] || waitingInfo.responsibleMember.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900 truncate max-w-[130px]">
                      {waitingInfo.responsibleMember.name}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {waitingInfo.responsibleMember.role}
                    </p>
                  </div>
                </div>

                {/* Instant WhatsApp Alert & Call Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={createWhatsAppAlertLink(waitingInfo.responsibleMember, task, project, waitingInfo.subtask, deadline)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`إرسال تنبيه واتساب آلي إلى ${waitingInfo.responsibleMember.name}`}
                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                    <span>واتساب</span>
                  </a>

                  <a
                    href={`tel:${waitingInfo.responsibleMember.phone}`}
                    title={`اتصال: ${waitingInfo.responsibleMember.phone}`}
                    className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-stone-500 text-xs mt-1">
                {waitingInfo.isAllCompleted ? '✅ جميع الخطوات مكتملة' : 'لا يوجد مسؤول محدد'}
              </div>
            )}

            {waitingInfo.subtask && (
              <p className="text-[10px] text-stone-500 truncate mt-1 bg-white/70 px-1.5 py-0.5 rounded border border-stone-200/60">
                الخطوة: {waitingInfo.subtask.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Interactive Visual Pipeline Workflow */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-stone-50/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <span>مسار خطوات التنفيذ المتسلسلة (Pipeline)</span>
              <span className="text-[11px] bg-stone-200 text-stone-700 px-2 py-0.2 rounded-full font-medium">
                {task.subtasks.length} خطوات فرعية
              </span>
            </h4>
            <span className="text-[11px] text-stone-400">
              مرونة تامة في عدد وتسميات الخطوات
            </span>
          </div>

          <TaskPipeline
            subtasks={task.subtasks}
            teamMembers={teamMembers}
            onUpdateSubtask={handleUpdateSubtask}
            onAddSubtask={() => onAddSubtask(task.id)}
            onDeleteSubtask={handleDeleteSubtask}
          />
        </div>
      )}

      {/* Modal for editing Google Sheet / Drive link */}
      <EditExternalLinkModal
        isOpen={isEditingLink}
        onClose={() => setIsEditingLink(false)}
        task={task}
        onSaveLink={handleSaveExternalLink}
      />
    </div>
  );
};
