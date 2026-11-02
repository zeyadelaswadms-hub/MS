import React, { useState } from 'react';
import { Project, TeamMember } from '../types';
import { X, Building2, Calendar, MapPin, Wallet, UserCheck } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onCreateProject: (project: Omit<Project, 'id'>) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [projectManagerId, setProjectManagerId] = useState(teamMembers[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [budget, setBudget] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateProject({
      name: name.trim(),
      code: code.trim() || `PRJ-${Date.now().toString().slice(-4)}`,
      client: client.trim() || 'شركة خاصة',
      location: location.trim() || 'الموقع العام',
      projectManagerId,
      startDate,
      expectedEndDate: expectedEndDate || '2026-12-31',
      status: 'active',
      budget: budget.trim() || undefined,
      color: 'from-cyan-600 to-teal-700',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-8 text-white">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#22d3ee]" />
              <span>إضافة مشروع مقاولات جديد</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              سجل بيانات الموقع والعميل وتواريخ التسليم المتوقعة
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">اسم المشروع *</label>
            <input
              type="text"
              required
              placeholder="مثال: برج الياسمين السكني"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white font-bold focus:border-[#22d3ee] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">كود المشروع</label>
              <input
                type="text"
                placeholder="PRJ-2026-05"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم العميل أو الجهة</label>
              <input
                type="text"
                placeholder="الشركة العقارية..."
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#22d3ee]" />
              <span>موقع المشروع والمدينة</span>
            </label>
            <input
              type="text"
              placeholder="الرياض - حي النرجس..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                  <option key={m.id} value={m.id} className="bg-[#132229] text-white">{m.name} ({m.role})</option>
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
                placeholder="مثال: 5,000,000 ر.س"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>تاريخ البدء الفعلي</span>
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
                <span>تاريخ التسليم النهائي</span>
              </label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-[#182c35] border border-[#22404e] rounded-xl px-3 py-2 text-white focus:border-[#22d3ee] outline-none"
              />
            </div>
          </div>

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
              حفظ وإنشاء المشروع
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
