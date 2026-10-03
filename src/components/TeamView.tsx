import React, { useState } from 'react';
import { TeamMember, Task, Project } from '../types';
import { getDeadlineInfo, getActiveWaitingSubtask } from '../utils/dateUtils';
import { 
  Users, 
  Phone, 
  MessageCircle, 
  Plus, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Mail, 
  UserPlus,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface TeamViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  projects: Project[];
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  onSelectMemberFilter?: (memberId: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  tasks,
  projects,
  onAddTeamMember,
  onSelectMemberFilter,
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const colors = ['bg-amber-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-purple-600', 'bg-cyan-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onAddTeamMember({
      name: newName.trim(),
      phone: newPhone.trim(),
      role: newRole.trim() || 'مهندس موقع',
      email: newEmail.trim() || undefined,
      avatarColor: randomColor,
    });

    setNewName('');
    setNewPhone('');
    setNewRole('');
    setNewEmail('');
    setIsAddingMember(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Add Member Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            <span>فريق العمل والمهندسين الميدانيين</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            سجل أعضاء الفريق مع أرقام الهواتف لإسناد المهام وإرسال التنبيهات الآلية اللحظية عبر الواتساب والاتصال
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingMember(!isAddingMember)}
          className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة عضو فريق جديد</span>
        </button>
      </div>

      {/* Add Member Form Drawer */}
      {isAddingMember && (
        <form onSubmit={handleAddSubmit} className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-amber-700" />
            تسجيل مهندس أو فني جديد في الفريق
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                placeholder="مثال: م. فهد العتيبي"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">رقم الهاتف (للتنبيهات) *</label>
              <input
                type="tel"
                required
                placeholder="+9665xxxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">الدور / التخصص</label>
              <input
                type="text"
                placeholder="مهندس موقع، مشرف كهرباء..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:border-amber-600 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="px-4 py-1.5 text-xs text-stone-600 hover:text-stone-900"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-xs"
            >
              حفظ العضو
            </button>
          </div>
        </form>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(member => {
          // Calculate active tasks and subtasks for this member
          const mainTasks = tasks.filter(t => t.assignedMemberId === member.id && t.status !== 'completed');
          
          // Subtasks currently waiting or assigned to this member
          const waitingSubtasks = tasks.flatMap(t => {
            const waiting = getActiveWaitingSubtask(t, teamMembers);
            if (waiting.responsibleMember?.id === member.id && !waiting.isAllCompleted) {
              return [{ task: t, subtask: waiting.subtask, project: projects.find(p => p.id === t.projectId) }];
            }
            return [];
          });

          // Delayed tasks for this member
          const memberDelayedTasks = tasks.filter(t => {
            const isDone = t.status === 'completed';
            const dl = getDeadlineInfo(t.expectedClosingDate, isDone);
            const isAssigned = t.assignedMemberId === member.id || t.subtasks.some(s => s.assignedMemberId === member.id && s.status !== 'completed');
            return isAssigned && dl.isOverdue && !isDone;
          });

          // WhatsApp clean link
          let cleanPhone = member.phone.replace(/[\s\-\(\)]/g, '');
          if (cleanPhone.startsWith('05') && cleanPhone.length === 10) cleanPhone = '966' + cleanPhone.substring(1);
          if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
          const whatsappGeneralUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(`السلام عليكم م. ${member.name}، تحية طيبة من إدارة مشاريع المقاولات.`)}`;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition space-y-4"
            >
              {/* Member Profile Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-xs ${member.avatarColor || 'bg-amber-600'}`}>
                    {member.name.split(' ')[1]?.[0] || member.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                      {member.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      {member.role}
                    </p>
                  </div>
                </div>

                {/* Direct Action Icons */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={whatsappGeneralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="محادثة وتنبيه واتساب"
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={`tel:${member.phone}`}
                    title={`اتصال هاتفي: ${member.phone}`}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Phone & Details */}
              <div className="text-xs space-y-1 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="font-semibold">رقم الهاتف المعتمد:</span>
                  <span className="font-mono text-stone-900 font-bold" dir="ltr">{member.phone}</span>
                </div>
                {member.email && (
                  <div className="flex items-center justify-between text-stone-500 text-[11px]">
                    <span>البريد:</span>
                    <span className="truncate max-w-[170px]" dir="ltr">{member.email}</span>
                  </div>
                )}
              </div>

              {/* Workload Stats */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-400 block">مهام متوقفة عليه الآن</span>
                  <span className={`text-lg font-black ${waitingSubtasks.length > 0 ? 'text-amber-600' : 'text-stone-500'}`}>
                    {waitingSubtasks.length}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border ${
                  memberDelayedTasks.length > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-stone-50 border-stone-200/70 text-stone-500'
                }`}>
                  <span className="text-[10px] block">مهام متأخرة</span>
                  <span className={`text-lg font-black ${memberDelayedTasks.length > 0 ? 'text-red-600' : 'text-stone-400'}`}>
                    {memberDelayedTasks.length}
                  </span>
                </div>
              </div>

              {/* Current waiting subtasks snippets */}
              {waitingSubtasks.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-stone-700 block">
                    الخطوات الجارية بانتظاره بالموقع:
                  </span>
                  {waitingSubtasks.slice(0, 2).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-2 text-[11px] space-y-0.5"
                    >
                      <span className="text-[10px] text-amber-900 font-semibold block truncate">
                        {item.project?.name}
                      </span>
                      <p className="font-bold text-stone-900 truncate">
                        {item.subtask ? item.subtask.title : item.task.title}
                      </p>
                    </div>
                  ))}
                  {waitingSubtasks.length > 2 && (
                    <span className="text-[10px] text-stone-400 block text-left">
                      + {waitingSubtasks.length - 2} خطوات أخرى
                    </span>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
