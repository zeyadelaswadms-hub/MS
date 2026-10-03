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
      color: 'from-amber-600 to-amber-700',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-amber-950 text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>إضافة مشروع مقاولات جديد</span>
            </h2>
            <p className="text-xs text-amber-200/80 mt-0.5">
              سجل بيانات الموقع والعميل وتواريخ التسليم المتوقعة
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">اسم المشروع *</label>
            <input
              type="text"
              required
              placeholder="مثال: مجمع عيادات الأمل التخصصي"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:border-amber-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">كود المشروع</label>
              <input
                type="text"
                placeholder="PRJ-2026-05"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">المالك / العميل</label>
              <input
                type="text"
                placeholder="الجهة المالكة"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">موقع المشروع</label>
              <input
                type="text"
                placeholder="المدينة والحي"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">مدير المشروع المسؤول</label>
              <select
                value={projectManagerId}
                onChange={(e) => setProjectManagerId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none font-semibold"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">تاريخ البدء</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">تاريخ التسليم النهائي</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">الميزانية التقديرية (اختياري)</label>
            <input
              type="text"
              placeholder="مثال: 6,500,000 ر.س"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:border-amber-600 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
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
              إضافة المشروع
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
