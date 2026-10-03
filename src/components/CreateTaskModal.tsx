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
  ArrowLeft,
  Sparkles,
  Link2,
  FileSpreadsheet,
  FolderGit2,
  Image as ImageIcon,
  Upload,
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
  const [category, setCategory] = useState('أعمال خرسانية وهيكلية');
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
      title: 'استلام الموقع وتجهيز الشدات والنجارة',
      description: '',
      assignedMemberId: teamMembers[1]?.id || teamMembers[0]?.id || '',
      transitionNote: 'فحص المناسيب وتسليم الموقع للمهندس الميكانيكي',
      estimatedDays: 2,
    },
    {
      title: 'تمديدات مواسير الكهرباء والسباكة',
      description: '',
      assignedMemberId: teamMembers[2]?.id || teamMembers[0]?.id || '',
      transitionNote: 'مراجعة المخططات واعتماد استشاري الجودة',
      estimatedDays: 2,
    },
    {
      title: 'استلام حديد التسليح وتصريح الصب النهائي',
      description: '',
      assignedMemberId: teamMembers[3]?.id || teamMembers[0]?.id || '',
      transitionNote: 'إغلاق المهمة بالكامل',
      estimatedDays: 1,
    }
  ]);

  if (!isOpen) return null;

  const handleAddSubtaskRow = () => {
    setSubtasks([
      ...subtasks,
      {
        title: `الخطوة الفرعية رقم ${subtasks.length + 1}`,
        description: '',
        assignedMemberId: teamMembers[0]?.id || '',
        transitionNote: 'الانتقال للخطوة التالية بعد الاعتماد',
        estimatedDays: 2,
      },
    ]);
  };

  const handleRemoveSubtaskRow = (index: number) => {
    if (subtasks.length <= 1) return;
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (index: number, field: string, value: any) => {
    setSubtasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-amber-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>إنشاء مهمة جديدة مع سلسلة الخطوات الفرعية</span>
            </h2>
            <p className="text-xs text-amber-200/80 mt-1">
              حدد المشروع والمسؤول وتاريخ الإغلاق، مع المرونة الكاملة في عدد وتفاصيل الخطوات
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-300 hover:text-white rounded-full hover:bg-amber-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Project Picker */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">المشروع التابع له المهمة *</label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:border-amber-600 outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            {/* Task Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">تصنيف الأعمال</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
              >
                <option value="أعمال خرسانية وهيكلية">أعمال خرسانية وهيكلية</option>
                <option value="أعمال كهروميكانيكية (MEP)">أعمال كهروميكانيكية (MEP)</option>
                <option value="عزل وحماية وأساسات">عزل وحماية وأساسات</option>
                <option value="تشطيبات معمارية ولياسة">تشطيبات معمارية ولياسة</option>
                <option value="أعمال تكسية وواجهات">أعمال تكسية وواجهات</option>
                <option value="استلامات استشاري وجودة">استلامات استشاري وجودة</option>
              </select>
            </div>

            {/* Task Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">اسم المهمة الرئيسية *</label>
              <input
                type="text"
                required
                placeholder="مثال: صب خرسانة أعمدة الدور الأرضي"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:border-amber-600 outline-none"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">وصف وملاحظات المهمة</label>
              <textarea
                rows={2}
                placeholder="تفاصيل التنفيذ واشتراطات الكود والمواصفات الفنية..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>

            {/* Main Supervisor */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">المشرف العام عن المهمة *</label>
              <select
                required
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:border-amber-600 outline-none"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} - {m.role}</option>
                ))}
              </select>
            </div>

            {/* Schedule: Start Date and Expected Closing Date */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50/80 p-3 rounded-2xl border border-stone-200">
              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>تاريخ بدء المهمة</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">اختياري</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs font-bold focus:border-amber-600 outline-none"
                />
              </div>

              {/* Expected Closing Date */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>تاريخ الانتهاء / الإغلاق المتوقع</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">اختياري</span>
                </label>
                <input
                  type="date"
                  value={expectedClosingDate}
                  onChange={(e) => setExpectedClosingDate(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs font-bold focus:border-amber-600 outline-none"
                />
              </div>

              {/* Calculated Duration Hint */}
              {startDate && expectedClosingDate && (
                <div className="sm:col-span-2 flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px] font-bold">
                  {(() => {
                    const start = new Date(startDate);
                    const end = new Date(expectedClosingDate);
                    const diffTime = end.getTime() - start.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      return (
                        <span className="text-red-600 flex items-center gap-1">
                          ⚠️ تنبيه: تاريخ الانتهاء يسبق تاريخ البدء!
                        </span>
                      );
                    }
                    return (
                      <span className="text-emerald-800 flex items-center gap-1">
                        ⏱️ إجمالي فترة التنفيذ المحددة: <span className="font-mono text-emerald-950 font-black">{diffDays + 1}</span> {diffDays + 1 === 1 ? 'يوم' : 'أيام'}
                      </span>
                    );
                  })()}
                  <span className="text-stone-400 text-[10px]">تظهر في التقويم ومسار الإنجاز</span>
                </div>
              )}
            </div>

            {/* External Web Link: Google Sheets / Drive */}
            <div className="sm:col-span-2 bg-amber-50/50 border border-amber-200/70 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-amber-700" />
                  <span>رابط مستند خارجي (مثل Google Sheets أو Google Drive أو مخططات)</span>
                </label>
                <span className="text-[10px] text-amber-800 font-semibold">اختياري</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-mono focus:border-amber-600 outline-none"
                />
                <input
                  type="text"
                  placeholder="وصف الرابط (مثال: شيت حصر الكميات والتكاليف)"
                  value={externalLinkLabel}
                  onChange={(e) => setExternalLinkLabel(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:border-amber-600 outline-none font-semibold"
                />
              </div>
            </div>

            {/* Task Image (Photo / Site inspection) */}
            <div className="sm:col-span-2 bg-blue-50/50 border border-blue-200/70 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>صورة توضيحية أو مخطط أو صورة موقع للمهمة</span>
                </label>
                <span className="text-[10px] text-blue-800 font-semibold">اختياري</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="رابط الصورة المباشر (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-mono focus:border-blue-600 outline-none"
                />
                <input
                  type="text"
                  placeholder="وصف الصورة (مثال: صورة استلام الموقع قبل الصب)"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:border-blue-600 outline-none font-semibold"
                />
              </div>
            </div>

          </div>

          {/* Dynamic Flexible Subtasks Pipeline Builder */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <span>سلسلة الخطوات الفرعية المتتالية (المسار البصري)</span>
                  <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.2 rounded-full font-bold">
                    {subtasks.length} خطوات
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  يمكنك إضافة أي عدد تريده من الخطوات وتحديد المسؤول والتعليق المكتوب على الخط الواصل
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSubtaskRow}
                className="bg-stone-100 hover:bg-amber-100 text-amber-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition"
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
                  className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">
                        {index + 1}
                      </span>
                      الخطوة الفرعية {index + 1}
                    </span>

                    {subtasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtaskRow(index)}
                        className="text-stone-400 hover:text-red-600 p-1 transition"
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
                        placeholder="اسم الخطوة (مثال: صب الخرسانة واختبار المكعبات)"
                        value={st.title}
                        onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-semibold focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <select
                        value={st.assignedMemberId}
                        onChange={(e) => handleSubtaskChange(index, 'assignedMemberId', e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900"
                      >
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Transition note on the connecting line */}
                  <div>
                    <label className="block text-[10px] text-stone-500 font-semibold mb-0.5">
                      الكتابة والشرط على الخط الواصل للخطوة التالية:
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: فترة معالجة بالمياه ٧ أيام / استلام المهندس الاستشاري..."
                      value={st.transitionNote}
                      onChange={(e) => handleSubtaskChange(index, 'transitionNote', e.target.value)}
                      className="w-full bg-white/80 border border-dashed border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-700"
                    />
                  </div>

                  {/* Subtask Attachments Toggle (Links & Photos) */}
                  <div className="pt-1 border-t border-stone-200/60">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSubtaskChange(index, 'showAttachments', !st.showAttachments)}
                        className={`text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          (st.externalLink || st.imageUrl)
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-amber-400 hover:text-amber-800'
                        }`}
                      >
                        <Link2 className="w-3 h-3 text-amber-600" />
                        <span>مرفقات خاصة بالخطوة الفرعية (رابط شيت/درايف أو صورة)</span>
                        {(st.externalLink || st.imageUrl) && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                        {st.showAttachments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <div className="flex items-center gap-2">
                        {st.externalLink && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            {st.externalLinkLabel || 'رابط مضاف'}
                          </span>
                        )}
                        {st.imageUrl && (
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            صورة مرفقة
                          </span>
                        )}
                      </div>
                    </div>

                    {st.showAttachments && (
                      <div className="mt-2.5 bg-white p-3 rounded-xl border border-stone-200 space-y-3">
                        {/* Subtask Link */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                              <Link2 className="w-3 h-3 text-amber-600" />
                              <span>رابط مستند خارجي للخطوة (Google Sheets / Drive):</span>
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSubtaskChange(index, 'externalLink', 'https://docs.google.com/spreadsheets/d/');
                                  handleSubtaskChange(index, 'externalLinkLabel', 'شيت كميات الخطوة');
                                }}
                                className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                + Google Sheets
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSubtaskChange(index, 'externalLink', 'https://drive.google.com/drive/folders/');
                                  handleSubtaskChange(index, 'externalLinkLabel', 'مجلد مخططات الخطوة');
                                }}
                                className="text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                + Google Drive
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="url"
                              dir="ltr"
                              placeholder="https://docs.google.com/..."
                              value={st.externalLink || ''}
                              onChange={(e) => handleSubtaskChange(index, 'externalLink', e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 font-mono focus:border-amber-600 outline-none"
                            />
                            <input
                              type="text"
                              placeholder="عنوان الرابط (مثال: شيت الحصر)"
                              value={st.externalLinkLabel || ''}
                              onChange={(e) => handleSubtaskChange(index, 'externalLinkLabel', e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 focus:border-amber-600 outline-none"
                            />
                          </div>
                        </div>

                        {/* Subtask Photo */}
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1 mb-1">
                            <ImageIcon className="w-3 h-3 text-blue-600" />
                            <span>صورة موقع أو استلام خاصة بهذه الخطوة:</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                dir="ltr"
                                placeholder="رابط صورة مباشر أو اضغط رفع..."
                                value={st.imageUrl || ''}
                                onChange={(e) => handleSubtaskChange(index, 'imageUrl', e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 font-mono focus:border-blue-600 outline-none"
                              />
                              <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition">
                                <Upload className="w-3 h-3" />
                                <span>رفع</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        if (re.target?.result) {
                                          handleSubtaskChange(index, 'imageUrl', re.target.result as string);
                                          if (!st.imageCaption) {
                                            handleSubtaskChange(index, 'imageCaption', file.name.replace(/\.[^/.]+$/, ''));
                                          }
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="وصف الصورة (مثال: صورة استلام النجارة)"
                                value={st.imageCaption || ''}
                                onChange={(e) => handleSubtaskChange(index, 'imageCaption', e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-900 focus:border-blue-600 outline-none"
                              />
                              {st.imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSubtaskChange(index, 'imageUrl', '');
                                    handleSubtaskChange(index, 'imageCaption', '');
                                  }}
                                  className="text-stone-400 hover:text-red-600 p-1"
                                  title="إزالة الصورة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {st.imageUrl && (
                            <div className="mt-2 flex items-center gap-2.5 p-1.5 bg-stone-50 rounded-lg border border-stone-200">
                              <img
                                src={st.imageUrl}
                                alt="معاينة"
                                className="w-12 h-12 object-cover rounded-md border border-stone-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-stone-700 truncate block">
                                  {st.imageCaption || 'صورة مرفقة بالخطوة'}
                                </span>
                                <span className="text-[10px] text-stone-400 block">
                                  جاهزة للحفظ والعرض في المسار البصري
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-6 py-2 rounded-xl text-xs sm:text-sm shadow-md transition"
            >
              حفظ وإنشاء سلسلة المهمة
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
