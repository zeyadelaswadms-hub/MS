import React, { useState, useEffect } from 'react';
import { Task, Project, TeamMember, TaskPriority, TaskStatus } from '../types';
import { 
  X, 
  Check, 
  Calendar, 
  Building2, 
  User, 
  Trash2, 
  Edit3, 
  Link2, 
  Image as ImageIcon,
  Flame,
  Layers
} from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projects: Project[];
  teamMembers: TeamMember[];
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projects,
  teamMembers,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('in_progress');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedClosingDate, setExpectedClosingDate] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [externalLinkLabel, setExternalLinkLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.projectId || projects[0]?.id || '');
      setAssignedMemberId(task.assignedMemberId || teamMembers[0]?.id || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'in_progress');
      setCategory(task.category || 'عام');
      setStartDate(task.startDate || task.createdAt?.slice(0, 10) || '');
      setExpectedClosingDate(task.expectedClosingDate || '');
      setExternalLink(task.externalLink || '');
      setExternalLinkLabel(task.externalLinkLabel || '');
      setImageUrl(task.imageUrl || '');
      setImageCaption(task.imageCaption || '');
    }
  }, [task, projects, teamMembers]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(task.id, {
      title: title.trim(),
      description: description.trim(),
      projectId,
      assignedMemberId,
      priority,
      status,
      category: category.trim() || 'عام',
      startDate: startDate || undefined,
      expectedClosingDate: expectedClosingDate || undefined,
      externalLink: externalLink.trim() || undefined,
      externalLinkLabel: externalLinkLabel.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف مهمة "${task.title}" نهائياً؟`)) {
      if (onDelete) {
        onDelete(task.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-6 text-white">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#088395]/20 border border-cyan-400/30 flex items-center justify-center text-[#22d3ee]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">تعديل بيانات المهمة</h2>
              <p className="text-xs text-slate-400">تحديث تفاصيل المهمة والجدول الزمني والمشرف</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              عنوان المهمة الرئيسي *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: صب خرسانة القواعد والرقاب"
              className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3.5 py-2 font-bold text-white focus:border-[#22d3ee] outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">
              وصف المهمة والملاحظات الميدانية
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="تفاصيل التنفيذ واستلام المهندس..."
              className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3.5 py-2 text-slate-200 focus:border-[#22d3ee] outline-none"
            />
          </div>

          {/* Project & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#22d3ee]" />
                <span>المشروع التابع له *</span>
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 font-bold text-white outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#132229] text-white">
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>تصنيف البند</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="حدادة ونجارة، أعمال خرسانية، تمديدات صحية..."
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 font-bold text-white outline-none"
              />
            </div>
          </div>

          {/* Supervisor & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#22d3ee]" />
                <span>المشرف المسؤول *</span>
              </label>
              <select
                required
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 font-bold text-white outline-none"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#132229] text-white">
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>الأولوية</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 font-bold text-white outline-none"
              >
                <option value="urgent" className="bg-[#132229]">🔴 عاجلة جداً</option>
                <option value="high" className="bg-[#132229]">🟠 مرتفعة</option>
                <option value="medium" className="bg-[#132229]">🟡 عادية / متوسطة</option>
                <option value="low" className="bg-[#132229]">🟢 منخفضة</option>
              </select>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="bg-[#101c22] p-3 rounded-2xl border border-[#1b3440] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>تاريخ البدء</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-lg px-2 py-1.5 font-bold text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>تاريخ التسليم</span>
              </label>
              <input
                type="date"
                value={expectedClosingDate}
                onChange={(e) => setExpectedClosingDate(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-lg px-2 py-1.5 font-bold text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                حالة المهمة العامة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-lg px-2 py-1.5 font-bold text-white outline-none"
              >
                <option value="in_progress" className="bg-[#132229]">⚙️ قيد التنفيذ (جارية)</option>
                <option value="completed" className="bg-[#132229]">✅ مكتملة</option>
                <option value="delayed" className="bg-[#132229]">⚠️ متأخرة</option>
                <option value="not_started" className="bg-[#132229]">⏳ لم تبدأ</option>
              </select>
            </div>
          </div>

          {/* External Link & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>رابط خارجي (Google Sheets / Drive)</span>
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-1.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>رابط صورة الموقع</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-1.5 text-white outline-none"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1c3846]">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-[#311116] hover:bg-[#40161d] text-rose-300 border border-[#521b24] px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>حذف المهمة</span>
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#182c35] hover:bg-[#203a46] text-slate-300 rounded-xl font-bold transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-cyan-400/30"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
