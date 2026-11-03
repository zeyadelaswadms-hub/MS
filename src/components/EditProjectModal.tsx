import React, { useState, useEffect } from 'react';
import { Project, TeamMember } from '../types';
import { 
  X, 
  Building2, 
  Calendar, 
  MapPin, 
  Wallet, 
  UserCheck, 
  Trash2, 
  Save, 
  AlertTriangle,
  Palette,
  Check
} from 'lucide-react';

interface EditProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  teamMembers: TeamMember[];
  tasksCount?: number;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string, deleteTasks?: boolean) => void;
}

const COLOR_PRESETS = [
  { label: 'سماوي / فيروزي', value: 'from-cyan-600 to-teal-700', bg: 'bg-cyan-500' },
  { label: 'أزرق ملكي', value: 'from-blue-600 to-indigo-700', bg: 'bg-blue-500' },
  { label: 'زمردي / أخضر', value: 'from-emerald-600 to-teal-800', bg: 'bg-emerald-500' },
  { label: 'عنبري / ذهبي', value: 'from-amber-600 to-yellow-700', bg: 'bg-amber-500' },
  { label: 'برتقالي مشرق', value: 'from-orange-600 to-amber-700', bg: 'bg-orange-500' },
  { label: 'بنفسجي داكن', value: 'from-purple-600 to-indigo-800', bg: 'bg-purple-500' },
  { label: 'وردي / ياقوتي', value: 'from-rose-600 to-pink-700', bg: 'bg-rose-500' },
  { label: 'فحمي أنيق', value: 'from-slate-700 to-slate-900', bg: 'bg-slate-500' },
];

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  project,
  onClose,
  teamMembers,
  tasksCount = 0,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'paused'>('active');
  const [color, setColor] = useState('');

  // Delete confirmation mode state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteAssociatedTasks, setDeleteAssociatedTasks] = useState(true);

  // Populate form when modal opens or project changes
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setCode(project.code || '');
      setClient(project.client || '');
      setLocation(project.location || '');
      setProjectManagerId(project.projectManagerId || teamMembers[0]?.id || '');
      setStartDate(project.startDate || '');
      setExpectedEndDate(project.expectedEndDate || '');
      setBudget(project.budget || '');
      setStatus(project.status || 'active');
      setColor(project.color || 'from-cyan-600 to-teal-700');
      setIsConfirmingDelete(false);
    }
  }, [project, teamMembers, isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateProject(project.id, {
      name: name.trim(),
      code: code.trim() || project.code,
      client: client.trim() || project.client,
      location: location.trim() || project.location,
      projectManagerId,
      startDate,
      expectedEndDate,
      budget: budget.trim() || undefined,
      status,
      color,
    });

    onClose();
  };

  const handleConfirmDelete = () => {
    onDeleteProject(project.id, deleteAssociatedTasks);
    setIsConfirmingDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-6 text-white animate-fadeIn">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#088395]/20 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>تعديل بيانات المشروع</span>
                <span className="text-xs bg-[#088395] text-white px-2 py-0.5 rounded-md font-mono">
                  {project.code}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديث بيانات العميل والموقع والمواعيد أو حذف المشروع
              </p>
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

        {/* Delete Confirmation Overlay */}
        {isConfirmingDelete ? (
          <div className="p-6 space-y-4 bg-[#231216] border-b border-rose-500/30 text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-300">
                  تأكيد حذف المشروع نهائياً
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  أنت على وشك حذف مشروع <strong className="text-white">"{project.name}" ({project.code})</strong>. هذا الإجراء لا يمكن التراجع عنه.
                </p>
                {tasksCount > 0 && (
                  <div className="mt-3 p-3 bg-[#180e12] rounded-xl border border-rose-900/60 text-xs space-y-2">
                    <span className="font-bold text-amber-300 block">
                      ⚠️ تنبيه: يرتبط بهذا المشروع عدد ({tasksCount}) مهام!
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={deleteAssociatedTasks}
                        onChange={(e) => setDeleteAssociatedTasks(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
                      />
                      <span>حذف كافة المهام والخطوات المرتبطة بهذا المشروع أيضاً ({tasksCount} مهمة)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-rose-900/40">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 text-slate-300 hover:text-white text-xs font-bold rounded-xl hover:bg-white/5 transition cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف المشروع الآن</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Edit Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
            
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم المشروع *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسم المشروع..."
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white font-bold focus:border-[#22d3ee] outline-none"
              />
            </div>

            {/* Code & Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كود المشروع</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PRJ-01"
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white font-mono focus:border-[#22d3ee] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الجهة المالكة أو العميل</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="اسم العميل أو الجهة..."
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                />
              </div>
            </div>

            {/* Location & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#22d3ee]" />
                  <span>الموقع الميداني والمدينة</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="المدينة - الحي..."
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">حالة المشروع</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'paused')}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                >
                  <option value="active" className="bg-[#132229] text-white">🟢 جاري التنفيذ (نشط)</option>
                  <option value="completed" className="bg-[#132229] text-white">✅ مكتمل ومسلم</option>
                  <option value="paused" className="bg-[#132229] text-white">⏸️ متوقف مؤقتاً</option>
                </select>
              </div>
            </div>

            {/* Manager & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مدير المشروع المسؤول</span>
                </label>
                <select
                  value={projectManagerId}
                  onChange={(e) => setProjectManagerId(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                >
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id} className="bg-[#132229] text-white">
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>الميزانية التقديرية</span>
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="مثال: 5,000,000 ر.س"
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تاريخ البدء</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>تاريخ التسليم المتوقع</span>
                </label>
                <input
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
                />
              </div>
            </div>

            {/* Theme / Color Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>لون وتمييز المشروع</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((p) => {
                  const isSelected = color === p.value || color === p.bg;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setColor(p.value)}
                      title={p.label}
                      className={`h-7 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                        isSelected 
                          ? 'border-white text-white ring-2 ring-cyan-400/50 bg-[#1f3743]' 
                          : 'border-[#22404e] text-slate-400 hover:text-white bg-[#182c35]'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${p.bg} shrink-0`}></span>
                      <span>{p.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#22d3ee]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1c3846]">
              {/* Delete button triggering confirmation */}
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3.5 py-2 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="حذف هذا المشروع"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف المشروع</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer rounded-xl hover:bg-white/5 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer border border-cyan-400/30 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
