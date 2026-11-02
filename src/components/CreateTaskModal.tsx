import React, { useState } from 'react';
import { Project, Task, TeamMember, SubTask, TaskPriority } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Building2, 
  User, 
  Layers, 
  Link2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  teamMembers: TeamMember[];
  initialProjectId?: string;
  initialDate?: string;
  onCreateTask: (newTask: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projects,
  teamMembers,
  initialProjectId,
  initialDate,
  onCreateTask,
}) => {
  const [projectId, setProjectId] = useState(initialProjectId || projects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState(teamMembers[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('حدادة ونجارة');
  const [startDate, setStartDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [expectedClosingDate, setExpectedClosingDate] = useState(initialDate || '');

  React.useEffect(() => {
    if (isOpen) {
      if (initialProjectId) setProjectId(initialProjectId);
      if (initialDate) {
        setStartDate(initialDate);
        setExpectedClosingDate(initialDate);
      }
    }
  }, [isOpen, initialProjectId, initialDate]);

  const [externalLink, setExternalLink] = useState('');
  const [externalLinkLabel, setExternalLinkLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Dynamic Subtasks
  const [subtasks, setSubtasks] = useState<Array<{
    title: string;
    description: string;
    assignedMemberId: string;
    transitionNote: string;
    estimatedDays: number;
    externalLink?: string;
    externalLinkLabel?: string;
    imageUrl?: string;
    imageCaption?: string;
    showAttachments?: boolean;
  }>>([
    {
      title: 'استلام النجارة والتقويات والدعائم',
      description: '',
      assignedMemberId: teamMembers[0]?.id || '',
      transitionNote: 'تسليم الموقع لمهندس الكهرباء والميكانيك',
      estimatedDays: 2,
    },
    {
      title: 'تمديدات خراطيم الكهرباء والصرف',
      description: '',
      assignedMemberId: teamMembers[1]?.id || teamMembers[0]?.id || '',
      transitionNote: 'تجهيز حديد التسليح وبدء الفرش والغطاء',
      estimatedDays: 2,
    },
    {
      title: 'فحص أقطار التسليح والوصلات والكمرات',
      description: '',
      assignedMemberId: teamMembers[0]?.id || '',
      transitionNote: 'اعتماد الاستشاري وأخذ تصريح الصب',
      estimatedDays: 2,
    }
  ]);

  const handleAddSubtaskRow = () => {
    setSubtasks([
      ...subtasks,
      {
        title: '',
        description: '',
        assignedMemberId: assignedMemberId || teamMembers[0]?.id || '',
        transitionNote: 'استلام ومطابقة الكود والمواصفات',
        estimatedDays: 1,
      }
    ]);
  };

  const handleRemoveSubtaskRow = (index: number) => {
    if (subtasks.length <= 1) return;
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, field: string, value: any) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    const formattedSubtasks: SubTask[] = subtasks.map((st, idx) => ({
      id: `sub-${Date.now()}-${idx}`,
      order: idx + 1,
      title: st.title.trim() || `الخطوة ${idx + 1}`,
      description: st.description.trim() || undefined,
      assignedMemberId: st.assignedMemberId || assignedMemberId,
      status: 'pending',
      transitionNote: st.transitionNote.trim() || undefined,
      estimatedDays: st.estimatedDays || 1,
      externalLink: st.externalLink?.trim() || undefined,
      externalLinkLabel: st.externalLinkLabel?.trim() || undefined,
      imageUrl: st.imageUrl?.trim() || undefined,
      imageCaption: st.imageCaption?.trim() || undefined,
    }));

    onCreateTask({
      projectId,
      title: title.trim(),
      description: description.trim(),
      assignedMemberId,
      priority,
      category,
      startDate: startDate || undefined,
      expectedClosingDate: expectedClosingDate || undefined,
      externalLink: externalLink.trim() || undefined,
      externalLinkLabel: externalLinkLabel.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      status: 'not_started',
      subtasks: formattedSubtasks,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-8 text-white">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#22d3ee]" />
              <span>إنشاء مهمة جديدة مع سلسلة الخطوات الفرعية</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              حدد المشروع والمسؤول وتاريخ الإغلاق، مع المرونة الكاملة في عدد وتفاصيل الخطوات
            </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Project Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">المشروع التابع له المهمة *</label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white font-semibold focus:border-[#22d3ee] outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#132229] text-white">{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Task Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">تصنيف الأعمال</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
              >
                <option value="حدادة ونجارة" className="bg-[#132229]">حدادة ونجارة</option>
                <option value="أعمال خرسانية" className="bg-[#132229]">أعمال خرسانية</option>
                <option value="تمديدات صحية" className="bg-[#132229]">تمديدات صحية</option>
                <option value="عزل ومباني" className="bg-[#132229]">عزل ومباني</option>
                <option value="أعمال كهروميكانيكية" className="bg-[#132229]">أعمال كهروميكانيكية</option>
                <option value="تشطيبات معمارية" className="bg-[#132229]">تشطيبات معمارية</option>
              </select>
            </div>

            {/* Task Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المهمة الرئيسية *</label>
              <input
                type="text"
                required
                placeholder="مثال: استلام حدادة سقف الدور الأرضي"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white font-bold focus:border-[#22d3ee] outline-none"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">وصف وملاحظات المهمة</label>
              <textarea
                rows={2}
                placeholder="مراجعة أقطار التسليح والوصلات والمشابك مع الاستشاري قبل الصب..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
              />
            </div>

            {/* Main Supervisor */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">المشرف العام عن المهمة *</label>
              <select
                required
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white font-semibold focus:border-[#22d3ee] outline-none"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#132229] text-white">{m.name} - {m.role}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">مستوى الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
              >
                <option value="urgent" className="bg-[#132229]">🔴 عاجلة جداً</option>
                <option value="high" className="bg-[#132229]">🟠 مرتفعة</option>
                <option value="medium" className="bg-[#132229]">🟡 متوسطة</option>
                <option value="low" className="bg-[#132229]">🟢 منخفضة</option>
              </select>
            </div>

            {/* Schedule */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#101c22] p-3 rounded-2xl border border-[#1b3440]">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تاريخ بدء المهمة</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-[#22d3ee] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>تاريخ الانتهاء / الإغلاق المتوقع</span>
                </label>
                <input
                  type="date"
                  value={expectedClosingDate}
                  onChange={(e) => setExpectedClosingDate(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-[#22d3ee] outline-none"
                />
              </div>
            </div>

            {/* External Links & Media */}
            <div className="sm:col-span-2 bg-[#101c22] border border-[#1b3440] p-3.5 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-[#22d3ee] flex items-center gap-1.5">
                <Link2 className="w-4 h-4" />
                <span>رابط مستند خارجي (Google Sheets / Drive)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-[#22d3ee] outline-none"
                />
                <input
                  type="text"
                  placeholder="وصف الرابط (مثال: شيت حصر الكميات والتكاليف)"
                  value={externalLinkLabel}
                  onChange={(e) => setExternalLinkLabel(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#22d3ee] outline-none font-semibold"
                />
              </div>
            </div>

          </div>

          {/* Dynamic Flexible Subtasks Pipeline Builder */}
          <div className="pt-4 border-t border-[#1c3846] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>سلسلة الخطوات الفرعية المتتالية</span>
                  <span className="bg-[#0e3b43] text-[#22d3ee] border border-[#144f5f] text-xs px-2 py-0.2 rounded-full font-bold">
                    {subtasks.length} خطوات
                  </span>
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddSubtaskRow}
                className="bg-[#0e3b43] hover:bg-[#134e5b] text-[#22d3ee] border border-[#144f5f] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة خطوة فرعية</span>
              </button>
            </div>

            {/* Subtasks Rows */}
            <div className="space-y-3">
              {subtasks.map((st, index) => (
                <div 
                  key={index}
                  className="bg-[#101c22] p-3.5 rounded-2xl border border-[#1b3440] space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#088395] text-white flex items-center justify-center text-[10px] font-black">
                        {index + 1}
                      </span>
                      الخطوة الفرعية {index + 1}
                    </span>

                    {subtasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtaskRow(index)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="حذف هذه الخطوة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="اسم الخطوة (مثال: استلام وفحص أقطار التسليح)"
                        value={st.title}
                        onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                        className="w-full bg-[#182c35] border border-[#22404e] rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:border-[#22d3ee] outline-none"
                      />
                    </div>

                    <div>
                      <select
                        value={st.assignedMemberId}
                        onChange={(e) => handleSubtaskChange(index, 'assignedMemberId', e.target.value)}
                        className="w-full bg-[#182c35] border border-[#22404e] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id} className="bg-[#132229] text-white">{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Transition note on connecting line */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                      الملاحظة والشرط على الخط الواصل للخطوة التالية:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تسليم الموقع لمهندس الكهرباء / معالجة الملاحظات..."
                      value={st.transitionNote}
                      onChange={(e) => handleSubtaskChange(index, 'transitionNote', e.target.value)}
                      className="w-full bg-[#182c35] border border-dashed border-[#22404e] rounded-lg px-2 py-1 text-[11px] text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1c3846]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold px-6 py-2 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer border border-cyan-400/30"
            >
              حفظ وإنشاء سلسلة المهمة
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
