import React, { useState, useEffect } from 'react';
import { Task, SubTask, SubTaskStatus, TeamMember } from '../types';
import { 
  X, 
  Check, 
  Trash2, 
  Plus, 
  User, 
  Clock, 
  Link2, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface SubtaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  subtask: SubTask | null;
  teamMembers: TeamMember[];
  onSave: (taskId: string, subtaskId: string, updates: Partial<SubTask>) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onAddNextSubtask?: (taskId: string, currentIndex: number) => void;
}

export const SubtaskEditModal: React.FC<SubtaskEditModalProps> = ({
  isOpen,
  onClose,
  task,
  subtask,
  teamMembers,
  onSave,
  onDeleteSubtask,
  onAddNextSubtask,
}) => {
  const [title, setTitle] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [status, setStatus] = useState<SubTaskStatus>('pending');
  const [transitionNote, setTransitionNote] = useState('');
  const [estimatedDays, setEstimatedDays] = useState<number>(1);
  const [externalLink, setExternalLink] = useState('');
  const [externalLinkLabel, setExternalLinkLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Sync state whenever subtask changes
  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title || '');
      setAssignedMemberId(subtask.assignedMemberId || '');
      setStatus(subtask.status || 'pending');
      setTransitionNote(subtask.transitionNote || '');
      setEstimatedDays(subtask.estimatedDays || 1);
      setExternalLink(subtask.externalLink || '');
      setExternalLinkLabel(subtask.externalLinkLabel || '');
      setImageUrl(subtask.imageUrl || '');
      setImageCaption(subtask.imageCaption || '');
    }
  }, [subtask]);

  if (!isOpen || !task || !subtask) return null;

  const currentIndex = task.subtasks.findIndex(s => s.id === subtask.id);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(task.id, subtask.id, {
      title: title.trim(),
      assignedMemberId,
      status,
      transitionNote: transitionNote.trim() || undefined,
      estimatedDays: Number(estimatedDays) || 1,
      completedAt: status === 'completed' ? (subtask.completedAt || new Date().toISOString()) : undefined,
      externalLink: externalLink.trim() || undefined,
      externalLinkLabel: externalLinkLabel.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
    });

    onClose();
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-[#132229] w-full max-w-lg rounded-3xl shadow-2xl border border-[#1c3542] overflow-hidden animate-scaleUp text-white my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0c1920] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#162a34]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#088395]/20 border border-cyan-400/40 text-[#22d3ee] flex items-center justify-center font-bold text-xs">
              #{currentIndex + 1}
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                تعديل بيانات الخطوة في المسار
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-xs">
                المهمة: {task.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#182c35] transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          
          {/* 1. Step Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <span>مسمى الخطوة وبيانها الميداني:</span>
              <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: استلام حدادة القواعد، صب خرسانة النظافة..."
              className="w-full bg-[#182c35] border border-[#22404e] focus:border-[#22d3ee] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none transition"
            />
          </div>

          {/* 2. Step Status Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300">
              حالة إنجاز الخطوة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  status === 'pending'
                    ? 'bg-[#182c35] text-slate-200 border-cyan-400 ring-2 ring-cyan-400/20'
                    : 'bg-[#101c22] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ⏳ انتظار
              </button>

              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  status === 'in_progress'
                    ? 'bg-[#0e3b43] text-cyan-200 border-cyan-400 ring-2 ring-cyan-400/30'
                    : 'bg-[#101c22] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ⚙️ جارية
              </button>

              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  status === 'completed'
                    ? 'bg-[#0f2e24] text-emerald-300 border-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-[#101c22] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ✅ مكتملة
              </button>

              <button
                type="button"
                onClick={() => setStatus('blocked')}
                className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] transition border cursor-pointer ${
                  status === 'blocked'
                    ? 'bg-[#3b151b] text-rose-300 border-rose-400 ring-2 ring-rose-400/30'
                    : 'bg-[#101c22] text-slate-400 border-[#1c3542] hover:bg-[#182c35]'
                }`}
              >
                ⛔ معطلة
              </button>
            </div>
          </div>

          {/* 3. Assignee and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Responsible Person */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>المسؤول الميداني المكلّف:</span>
              </label>
              <select
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] focus:border-[#22d3ee] rounded-xl px-2.5 py-2 text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="" className="bg-[#132229]">اختر المشرف المسؤول</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#132229]">
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Days */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>المدة التقديرية (بالأيام):</span>
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
                className="w-full bg-[#182c35] border border-[#22404e] focus:border-[#22d3ee] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
              />
            </div>

          </div>

          {/* 4. Transition Note */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <span>ملاحظة الانتقال والاعتماد للخطوة التالية:</span>
              <span className="text-[10px] text-slate-400">(تظهر على الخط التتابعي)</span>
            </label>
            <input
              type="text"
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="مثال: بعد جفاف العزل، تقرير فحص التربة، اعتماد الاستشاري..."
              className="w-full bg-[#182c35] border border-[#22404e] focus:border-[#22d3ee] rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
            />
          </div>

          {/* 5. External Link and Label */}
          <div className="bg-[#101c22] rounded-2xl p-3 border border-[#1b3440] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Link2 className="w-3.5 h-3.5" />
              <span>رابط ملف خارجي (Google Sheets / Drive):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
                dir="ltr"
              />
              <input
                type="text"
                value={externalLinkLabel}
                onChange={(e) => setExternalLinkLabel(e.target.value)}
                placeholder="عنوان الرابط (مثال: شيت الكميات)"
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          {/* 6. Photo URL and Caption */}
          <div className="bg-[#101c22] rounded-2xl p-3 border border-[#1b3440] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صورة ميدانية للخطوة:</span>
              </div>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-400 hover:text-rose-300 text-[10px] cursor-pointer"
                >
                  إزالة الصورة
                </button>
              )}
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="رابط الصورة الميدانية (URL)..."
              className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
              dir="ltr"
            />

            {imageUrl && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="وصف مختصر للصورة الميدانية..."
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
                />
                <div className="w-full h-24 rounded-xl overflow-hidden border border-[#22404e] bg-[#182c35]">
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#1b3440]">
            
            {/* Delete / Add Next Step */}
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
                  <span>خطوة جديدة تالية</span>
                </button>
              )}
            </div>

            {/* Save & Cancel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-[#182c35] hover:bg-[#203a46] text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>حفظ التعديلات</span>
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
