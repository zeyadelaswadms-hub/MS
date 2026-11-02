import React from 'react';
import { Task, SubTask, SubTaskStatus, TeamMember, Project } from '../types';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Link2, 
  Image as ImageIcon, 
  ExternalLink,
  Edit3,
  Trash2,
  Plus,
  ArrowRight
} from 'lucide-react';
import { createWhatsAppAlertLink } from '../utils/dateUtils';

interface SubtaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  subtask: SubTask | null;
  project?: Project | null;
  teamMembers: TeamMember[];
  onUpdateStatus: (taskId: string, subtaskId: string, status: SubTaskStatus) => void;
  onOpenEditModal: (task: Task, subtask: SubTask) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onAddNextSubtask?: (taskId: string, currentIndex: number) => void;
  onViewImage?: (url: string, caption?: string) => void;
}

export const SubtaskDetailsDialog: React.FC<SubtaskDetailsDialogProps> = ({
  isOpen,
  onClose,
  task,
  subtask,
  project,
  teamMembers,
  onUpdateStatus,
  onOpenEditModal,
  onDeleteSubtask,
  onAddNextSubtask,
  onViewImage,
}) => {
  if (!isOpen || !task || !subtask) return null;

  const currentIndex = task.subtasks.findIndex(s => s.id === subtask.id);
  const assigned = teamMembers.find(m => m.id === subtask.assignedMemberId);
  const isCompleted = subtask.status === 'completed';
  const isInProgress = subtask.status === 'in_progress';
  const isBlocked = subtask.status === 'blocked';
  const isPending = subtask.status === 'pending';

  const handleStatusChange = (newStatus: SubTaskStatus) => {
    onUpdateStatus(task.id, subtask.id, newStatus);
  };

  const handleDelete = () => {
    if (task.subtasks.length <= 1) {
      alert('لا يمكن حذف الخطوة الوحيدة للمهمة');
      return;
    }
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف خطوة "${subtask.title}"؟`)) {
      if (onDeleteSubtask) {
        onDeleteSubtask(task.id, subtask.id);
      }
      onClose();
    }
  };

  const handleAddNext = () => {
    if (onAddNextSubtask) {
      onAddNextSubtask(task.id, currentIndex);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#132229] w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#1c3542] overflow-hidden animate-slideUp sm:animate-scaleUp text-white max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0c1920] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#162a34] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#088395]/20 border border-cyan-400/40 text-[#22d3ee] flex items-center justify-center font-bold text-xs shrink-0">
              #{currentIndex + 1}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] font-bold bg-[#0e3b43] text-[#22d3ee] px-2 py-0.5 rounded-md">
                  {project?.name || 'مشروع عام'}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {task.title}
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-white truncate mt-0.5" title={subtask.title}>
                {subtask.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#182c35] transition cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs flex-1">
          
          {/* Quick Status Bar */}
          <div className="bg-[#101c22] rounded-2xl p-3 border border-[#1b3440] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">حالة الخطوة الحالية:</span>
              <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                isCompleted 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50' 
                  : isInProgress 
                  ? 'bg-[#0e3b43] text-cyan-200 border border-cyan-400/50 animate-pulse' 
                  : isBlocked 
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50' 
                  : 'bg-[#182c35] text-slate-300 border border-[#22404e]'
              }`}>
                {isCompleted ? '✅ مكتملة' : isInProgress ? '⚙️ جارية الآن' : isBlocked ? '⛔ معطلة' : '⏳ في الانتظار'}
              </span>
            </div>

            {/* 4 Status Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleStatusChange('pending')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  isPending
                    ? 'bg-[#182c35] text-white border-cyan-400 ring-2 ring-cyan-400/20'
                    : 'bg-[#0b141a] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ⏳ انتظار
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('in_progress')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  isInProgress
                    ? 'bg-[#0e3b43] text-cyan-200 border-cyan-400 ring-2 ring-cyan-400/30'
                    : 'bg-[#0b141a] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ⚙️ جارية
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  isCompleted
                    ? 'bg-[#0f2e24] text-emerald-300 border-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-[#0b141a] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ✅ مكتملة
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('blocked')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  isBlocked
                    ? 'bg-[#3b151b] text-rose-300 border-rose-400 ring-2 ring-rose-400/30'
                    : 'bg-[#0b141a] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ⛔ معطلة
              </button>
            </div>
          </div>

          {/* Responsible Member & Estimated Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Responsible Supervisor */}
            <div className="bg-[#182c35] rounded-2xl p-3 border border-[#22404e] space-y-1.5">
              <span className="text-[10px] text-slate-400 block font-bold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>المسؤول المكلّف:</span>
              </span>
              
              {assigned ? (
                <div>
                  <p className="font-black text-white text-xs">{assigned.name}</p>
                  <p className="text-[11px] text-slate-400">{assigned.role}</p>

                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-[#22404e]">
                    {/* Call */}
                    {assigned.phone && (
                      <a
                        href={`tel:${assigned.phone}`}
                        className="px-2.5 py-1 bg-[#10242e] hover:bg-[#16303d] border border-cyan-500/30 text-cyan-200 rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                      >
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span>اتصال</span>
                      </a>
                    )}

                    {/* WhatsApp */}
                    {assigned.phone && (
                      <a
                        href={createWhatsAppAlertLink(assigned, task, project, subtask)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-[#0f2e24] hover:bg-[#153d30] border border-emerald-500/30 text-emerald-300 rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>واتساب</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-xs">غير محدد</p>
              )}
            </div>

            {/* Estimated Days & Timeline */}
            <div className="bg-[#182c35] rounded-2xl p-3 border border-[#22404e] space-y-1.5">
              <span className="text-[10px] text-slate-400 block font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>المدة والتوقيت:</span>
              </span>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-white">
                  المدة التقديرية: <span className="text-[#fbbf24] font-mono">{subtask.estimatedDays || 1}</span> {subtask.estimatedDays === 1 ? 'يوم' : 'أيام'}
                </p>
                {subtask.completedAt ? (
                  <p className="text-[11px] text-emerald-400">
                    تاريخ الإنجاز: {subtask.completedAt.slice(0, 10)}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    الترتيب في المسار: الخطوة رقم {currentIndex + 1} من {task.subtasks.length}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Transition Note (مسار الانتقال) */}
          <div className="bg-[#101c22] rounded-2xl p-3 border border-[#1b3440] space-y-1.5">
            <span className="text-[10px] font-bold text-cyan-300 block flex items-center gap-1">
              <span>مسار الانتقال والاعتماد للخطوة التالية:</span>
            </span>
            <p className="text-xs text-slate-200 font-medium bg-[#182c35] p-2.5 rounded-xl border border-[#22404e]">
              {subtask.transitionNote || 'المسار التتابعي الطبيعي للاعتماد والتنفيذ'}
            </p>
          </div>

          {/* Attachments (Links & Photos) */}
          {(subtask.externalLink || subtask.imageUrl) && (
            <div className="bg-[#101c22] rounded-2xl p-3 border border-[#1b3440] space-y-2">
              <span className="text-[10px] font-bold text-cyan-300 block">
                المرفقات الميدانية للخطوة:
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* External Link */}
                {subtask.externalLink && (
                  <a
                    href={subtask.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#182c35] hover:bg-[#203a46] border border-[#22404e] text-cyan-300 hover:text-white rounded-xl text-xs font-bold transition"
                  >
                    <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{subtask.externalLinkLabel || 'فتح رابط المخططات أو الشيت'}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}

                {/* Photo Preview Thumbnail */}
                {subtask.imageUrl && (
                  <div
                    onClick={() => {
                      if (onViewImage) {
                        onViewImage(subtask.imageUrl!, subtask.imageCaption || subtask.title);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#182c35] hover:bg-[#203a46] border border-[#22404e] rounded-xl text-xs font-bold text-slate-200 cursor-pointer transition"
                    title="تكبير ومعاينة الصورة"
                  >
                    <img src={subtask.imageUrl} alt="" className="w-6 h-6 rounded-md object-cover border border-[#22404e]" />
                    <span>{subtask.imageCaption || 'معاينة الصورة الميدانية'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-[#0c1920] border-t border-[#162a34] flex flex-wrap items-center justify-between gap-2 shrink-0">
          
          {/* Secondary Actions: Delete / Add Next */}
          <div className="flex items-center gap-1.5">
            {task.subtasks.length > 1 && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                title="حذف هذه الخطوة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حذف</span>
              </button>
            )}

            {onAddNextSubtask && (
              <button
                type="button"
                onClick={handleAddNext}
                className="px-2.5 py-2 text-cyan-300 hover:text-white bg-[#102933] hover:bg-[#163847] border border-[#1d5266] rounded-xl transition cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                title="إدراج خطوة بعدها"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة خطوة تالية</span>
              </button>
            )}
          </div>

          {/* Primary Action: Edit Full Details & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEditModal(task, subtask);
              }}
              className="px-3 py-2 bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل البيانات بالكامل</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-[#182c35] hover:bg-[#203a46] text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
            >
              إغلاق
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
