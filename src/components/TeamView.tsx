import React, { useState } from 'react';
import { TeamMember, Task, Project, MemberType } from '../types';
import { 
  getDeadlineInfo, 
  getActiveWaitingSubtask, 
  createWhatsAppAlertLink,
  createMemberAllPendingTasksWhatsAppLink,
  cleanPhoneNumberForWhatsApp
} from '../utils/dateUtils';
import { 
  Users, 
  Phone, 
  MessageCircle, 
  Plus, 
  Mail, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  Check,
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Building2,
  Briefcase,
  Send,
  Filter
} from 'lucide-react';

interface TeamViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  projects: Project[];
  onAddTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  onUpdateTeamMember: (memberId: string, updates: Partial<TeamMember>) => void;
  onDeleteTeamMember: (memberId: string) => void;
  onSelectMemberFilter?: (memberId: string) => void;
  customWhatsAppTemplate?: string;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  tasks,
  projects,
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  customWhatsAppTemplate,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'internal' | 'collaborator'>('all');
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // Add Member State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMemberType, setNewMemberType] = useState<MemberType>('internal');
  const [newOrganization, setNewOrganization] = useState('');

  // Member tasks inspection modal state
  const [selectedMemberForTasks, setSelectedMemberForTasks] = useState<{
    member: TeamMember;
    filter: 'waiting' | 'delayed' | 'all';
  } | null>(null);

  // Edit member modal state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editMemberType, setEditMemberType] = useState<MemberType>('internal');
  const [editOrganization, setEditOrganization] = useState('');

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditPhone(member.phone);
    setEditRole(member.role);
    setEditEmail(member.email || '');
    setEditColor(member.avatarColor || 'bg-[#088395]');
    setEditMemberType(member.memberType || 'internal');
    setEditOrganization(member.organization || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editPhone.trim()) return;

    onUpdateTeamMember(editingMember.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      role: editRole.trim() || 'مهندس موقع',
      email: editEmail.trim() || undefined,
      avatarColor: editColor,
      memberType: editMemberType,
      organization: editOrganization.trim() || undefined,
    });

    setEditingMember(null);
  };

  const handleDeleteClick = (member: TeamMember) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف "${member.name}" من فريق العمل؟`)) {
      onDeleteTeamMember(member.id);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const colors = ['bg-[#088395]', 'bg-[#65a30d]', 'bg-amber-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    onAddTeamMember({
      name: newName.trim(),
      phone: newPhone.trim(),
      role: newRole.trim() || (newMemberType === 'collaborator' ? 'استشاري / جهة متعاونة' : 'مهندس موقع'),
      email: newEmail.trim() || undefined,
      avatarColor: randomColor,
      memberType: newMemberType,
      organization: newOrganization.trim() || undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewRole('');
    setNewEmail('');
    setNewMemberType('internal');
    setNewOrganization('');
    setIsAddingMember(false);
  };

  // Filtered members list
  const filteredMembers = teamMembers.filter(m => {
    if (filterType === 'internal') return m.memberType !== 'collaborator';
    if (filterType === 'collaborator') return m.memberType === 'collaborator';
    return true;
  });

  const internalCount = teamMembers.filter(m => m.memberType !== 'collaborator').length;
  const collaboratorCount = teamMembers.filter(m => m.memberType === 'collaborator').length;

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      
      {/* Header with Title and Add Member Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#132229] p-4 sm:p-5 rounded-2xl border border-[#1c3542] shadow-md">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#22d3ee]" />
            <span>فريق العمل والجهات المتعاونة والاستشارية</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل المهندسين، المكاتب الاستشارية، أجهزة المدن، ومقاولي الباطن لمتابعة المهام وإرسال التنبيهات المباشرة
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingMember(!isAddingMember)}
          className="bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition border border-cyan-400/30 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ إضافة عضو أو جهة متعاونة</span>
        </button>
      </div>

      {/* Filter Tabs: All vs Internal Team vs External Collaborators */}
      <div className="flex items-center gap-2 bg-[#101c22] p-1.5 rounded-2xl border border-[#1b3440] text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            filterType === 'all'
              ? 'bg-[#088395] text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#152731]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>الكل ({teamMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('internal')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            filterType === 'internal'
              ? 'bg-[#088395] text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#152731]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-cyan-300" />
          <span>فريق العمل الداخلي ({internalCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('collaborator')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            filterType === 'collaborator'
              ? 'bg-[#088395] text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#152731]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <span>جهات وهيئات متعاونة / استشاري ({collaboratorCount})</span>
        </button>
      </div>

      {/* Add Member Form Drawer */}
      {isAddingMember && (
        <form onSubmit={handleAddSubmit} className="bg-[#101e25] border border-[#1e4354] p-4 sm:p-5 rounded-2xl space-y-4 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#22d3ee] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              تسجيل عضو جديد (فريق داخلي أو جهة متعاونة)
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Member Type Selection */}
          <div className="bg-[#0b161c] p-3 rounded-xl border border-[#1c3846] space-y-2">
            <label className="block text-xs font-bold text-slate-200">نوع الانتماء والتصنيف *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                newMemberType === 'internal' 
                  ? 'bg-[#0e2c38] border-[#22d3ee] text-white' 
                  : 'bg-[#132229] border-[#1f3743] text-slate-300 hover:bg-[#182b34]'
              }`}>
                <input
                  type="radio"
                  name="newMemberType"
                  value="internal"
                  checked={newMemberType === 'internal'}
                  onChange={() => setNewMemberType('internal')}
                  className="accent-[#22d3ee]"
                />
                <div className="text-xs">
                  <span className="font-bold block">فريق العمل الداخلي 👷</span>
                  <span className="text-[11px] text-slate-400">مهندسو وموظفو شركة محمد سعد</span>
                </div>
              </label>

              <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                newMemberType === 'collaborator' 
                  ? 'bg-[#291e0f] border-amber-400 text-amber-200' 
                  : 'bg-[#132229] border-[#1f3743] text-slate-300 hover:bg-[#182b34]'
              }`}>
                <input
                  type="radio"
                  name="newMemberType"
                  value="collaborator"
                  checked={newMemberType === 'collaborator'}
                  onChange={() => setNewMemberType('collaborator')}
                  className="accent-amber-400"
                />
                <div className="text-xs">
                  <span className="font-bold block text-amber-300">جهة أو فريق متعاون خارجي 🏛️</span>
                  <span className="text-[11px] text-slate-400">مكتب استشاري، جهاز المدينة، مقاول باطن...</span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                placeholder="مثال: م. فهد القرني أو أ. محمد رضوان"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-xs text-white focus:border-[#22d3ee] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {newMemberType === 'collaborator' ? 'الجهة أو المكتب التابع له *' : 'القسم أو الإدارة (اختياري)'}
              </label>
              <input
                type="text"
                placeholder={newMemberType === 'collaborator' ? 'مثال: مكتب دار الاستشارات، جهاز 6 أكتوبر' : 'مثال: إدارة المشروعات والمرافق'}
                value={newOrganization}
                onChange={(e) => setNewOrganization(e.target.value)}
                className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-xs text-white focus:border-[#22d3ee] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف (للتنبيهات والواتساب) *</label>
              <input
                type="tel"
                required
                placeholder="010xxxxxxxx أو 05xxxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-xs text-white focus:border-[#22d3ee] outline-none font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">المسمى الوظيفي / الدور</label>
              <input
                type="text"
                placeholder="استشاري الموقع، مشرف شبكات، مقاول أعمال ترابية..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-xs text-white focus:border-[#22d3ee] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-xs text-white focus:border-[#22d3ee] outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1c3846]">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-xs cursor-pointer"
            >
              حفظ العضو
            </button>
          </div>
        </form>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => {
          const isCollaborator = member.memberType === 'collaborator';
          
          const waitingSubtasks = tasks.flatMap(t => {
            const waiting = getActiveWaitingSubtask(t, teamMembers);
            if (waiting.responsibleMember?.id === member.id && !waiting.isAllCompleted) {
              return [{ task: t, subtask: waiting.subtask, project: projects.find(p => p.id === t.projectId) }];
            }
            return [];
          });

          const memberDelayedTasks = tasks.filter(t => {
            const isDone = t.status === 'completed';
            const dl = getDeadlineInfo(t.expectedClosingDate, isDone);
            const isAssigned = t.assignedMemberId === member.id || t.subtasks.some(s => s.assignedMemberId === member.id && s.status !== 'completed');
            return isAssigned && dl.isOverdue && !isDone;
          });

          // WhatsApp link with ALL pending tasks grouped by project
          const whatsappAllTasksUrl = createMemberAllPendingTasksWhatsAppLink(
            member, 
            tasks, 
            projects, 
            customWhatsAppTemplate
          );

          // General chat WhatsApp URL
          const cleanPhone = cleanPhoneNumberForWhatsApp(member.phone);
          const whatsappGeneralUrl = cleanPhone
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(`السلام عليكم م. ${member.name}، تحية طيبة من شركة محمد سعد لأعمال المرافق والإنشاءات.`)}`
            : `https://api.whatsapp.com/send?text=${encodeURIComponent(`السلام عليكم م. ${member.name}، تحية طيبة من شركة محمد سعد لأعمال المرافق والإنشاءات.`)}`;

          return (
            <div
              key={member.id}
              className={`rounded-2xl border p-4 sm:p-5 shadow-md hover:border-[#254657] transition space-y-3.5 text-white ${
                isCollaborator 
                  ? 'bg-[#151f26] border-[#383120]' 
                  : 'bg-[#132229] border-[#1c3542]'
              }`}
            >
              {/* Member Profile Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-xs shrink-0 ${member.avatarColor || 'bg-[#088395]'}`}>
                    {member.name.split(' ')[1]?.[0] || member.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate">
                        {member.name}
                      </h3>
                      {isCollaborator ? (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" />
                          <span>جهة متعاونة</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-[#0e3b43] text-cyan-300 border border-[#144f5f] px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Briefcase className="w-2.5 h-2.5" />
                          <span>فريق داخلي</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {member.role}
                    </p>
                  </div>
                </div>

                {/* Direct Action Icons (Edit, Delete, WhatsApp, Phone) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(member)}
                    title="تعديل بيانات العضو"
                    className="p-1.5 bg-[#182c35] hover:bg-[#1f3743] text-cyan-300 rounded-xl transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(member)}
                    title="حذف العضو من الفريق"
                    className="p-1.5 bg-[#311116] hover:bg-[#40161d] text-rose-400 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={whatsappGeneralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="محادثة عامة عبر واتساب"
                    className="p-1.5 bg-[#0e2a21] hover:bg-[#133a2f] text-emerald-400 rounded-xl transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`tel:${member.phone}`}
                    title={`اتصال هاتفي: ${member.phone}`}
                    className="p-1.5 bg-[#182c35] hover:bg-[#1f3743] text-slate-300 rounded-xl transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Organization and Details Badge */}
              {member.organization && (
                <div className="text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0c161c] border border-[#1b3440] text-amber-300 font-semibold">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span className="text-slate-400">الجهة / المكتب:</span>
                  <span className="truncate">{member.organization}</span>
                </div>
              )}

              {/* Phone & Details */}
              <div className="text-xs space-y-1 bg-[#101c22] p-2.5 rounded-xl border border-[#1b3440]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold">رقم الهاتف:</span>
                  <span className="font-mono text-white font-bold" dir="ltr">{member.phone}</span>
                </div>
                {member.email && (
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>البريد:</span>
                    <span className="truncate max-w-[170px]" dir="ltr">{member.email}</span>
                  </div>
                )}
              </div>

              {/* Workload Stats - Clickable to open detailed tasks dialog */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForTasks({ member, filter: 'waiting' })}
                  className="bg-[#101c22] hover:bg-[#142d38] p-2 rounded-xl border border-[#1b3440] hover:border-[#22d3ee] transition cursor-pointer active:scale-95 text-center group"
                  title="عرض المهام والخطوات التي بانتظار هذا العضو"
                >
                  <span className="text-[10px] text-slate-400 group-hover:text-cyan-300 block font-bold">مهام بانتظاره ⏳</span>
                  <span className={`text-base font-black ${waitingSubtasks.length > 0 ? 'text-[#22d3ee]' : 'text-slate-500'}`}>
                    {waitingSubtasks.length}
                  </span>
                  <span className="text-[9px] text-cyan-400/80 block mt-0.5 group-hover:underline">عرض المهام ➔</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMemberForTasks({ member, filter: 'delayed' })}
                  className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 text-center group ${
                    memberDelayedTasks.length > 0 
                      ? 'bg-[#311116] hover:bg-[#42171f] border-[#521b24] hover:border-rose-400 text-rose-300' 
                      : 'bg-[#101c22] hover:bg-[#182c35] border-[#1b3440] text-slate-400'
                  }`}
                  title="عرض المهام المتأخرة المسندة لهذا العضو"
                >
                  <span className="text-[10px] block font-bold">مهام متأخرة 🚨</span>
                  <span className={`text-base font-black ${memberDelayedTasks.length > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {memberDelayedTasks.length}
                  </span>
                  <span className="text-[9px] text-rose-400/80 block mt-0.5 group-hover:underline">عرض المهام ➔</span>
                </button>
              </div>

              {/* PROMINENT DIRECT WHATSAPP ALERT BUTTON FOR ALL PENDING TASKS */}
              <a
                href={whatsappAllTasksUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#0d3429] hover:bg-[#124536] border border-emerald-500/40 text-emerald-200 hover:text-white p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
                title="إرسال رسالة واتساب منسقة ومختصرة بجميع المهام المتوقفة على هذا المهندس مرتبة حسب المشاريع"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تنبيه شامل بكل المهام المتوقفة عبر واتساب 📲</span>
              </a>

              {/* Current waiting subtasks snippets */}
              {waitingSubtasks.length > 0 && (
                <div 
                  onClick={() => setSelectedMemberForTasks({ member, filter: 'waiting' })}
                  className="space-y-1.5 pt-1 cursor-pointer group"
                  title="انقر لعرض قائمة المهام بالتفصيل"
                >
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-[#22d3ee] transition block flex items-center justify-between">
                    <span>الخطوات الجارية بانتظاره:</span>
                    <span className="text-[10px] text-cyan-400 font-bold">عرض الكل ➔</span>
                  </span>
                  {waitingSubtasks.slice(0, 2).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-[#0e2832] group-hover:bg-[#123340] border border-[#144757] group-hover:border-[#22d3ee]/60 transition rounded-lg p-2 text-[11px] space-y-0.5"
                    >
                      <span className="text-[10px] text-[#22d3ee] font-semibold block truncate">
                        {item.project?.name}
                      </span>
                      <p className="font-bold text-white truncate">
                        {item.subtask ? item.subtask.title : item.task.title}
                      </p>
                    </div>
                  ))}
                  {waitingSubtasks.length > 2 && (
                    <span className="text-[10px] text-cyan-400 block text-left font-bold">
                      + {waitingSubtasks.length - 2} مهام أخرى (انقر للعرض)
                    </span>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-6 text-white">
            
            {/* Header */}
            <div className="bg-[#0c1920] border-b border-[#162a34] p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#088395]/20 border border-cyan-400/30 flex items-center justify-center text-[#22d3ee]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">تعديل بيانات عضو الفريق أو الجهة</h3>
                  <p className="text-[11px] text-slate-400">تحديث الاسم، الهاتف، التصنيف والجهة</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
              
              {/* Member Type Selection */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">نوع الانتماء والتصنيف *</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    editMemberType === 'internal' 
                      ? 'bg-[#0e2c38] border-[#22d3ee] text-white font-bold' 
                      : 'bg-[#182c35] border-[#234250] text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="editMemberType"
                      value="internal"
                      checked={editMemberType === 'internal'}
                      onChange={() => setEditMemberType('internal')}
                      className="accent-[#22d3ee]"
                    />
                    <span>فريق داخلي 👷</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition ${
                    editMemberType === 'collaborator' 
                      ? 'bg-[#291e0f] border-amber-400 text-amber-300 font-bold' 
                      : 'bg-[#182c35] border-[#234250] text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="editMemberType"
                      value="collaborator"
                      checked={editMemberType === 'collaborator'}
                      onChange={() => setEditMemberType('collaborator')}
                      className="accent-amber-400"
                    />
                    <span>جهة متعاونة 🏛️</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 font-bold text-white outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الجهة أو المكتب التابع له</label>
                <input
                  type="text"
                  value={editOrganization}
                  onChange={(e) => setEditOrganization(e.target.value)}
                  placeholder="مثال: مكتب دار الاستشارات، جهاز 6 أكتوبر"
                  className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-white outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">رقم الهاتف (للتنبيهات والواتساب) *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 font-mono font-bold text-white outline-none focus:border-[#22d3ee]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">الدور / التخصص</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="مهندس موقع، استشاري ضبط جودة..."
                  className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-white outline-none focus:border-[#22d3ee]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#182c35] border border-[#234250] rounded-xl px-3 py-2 text-white outline-none focus:border-[#22d3ee]"
                  dir="ltr"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">لون الأيقونة</label>
                <div className="flex items-center gap-2">
                  {['bg-[#088395]', 'bg-[#65a30d]', 'bg-amber-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-7 h-7 rounded-xl ${color} cursor-pointer transition flex items-center justify-center text-white ${
                        editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#132229] scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {editColor === color && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1c3846]">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#088395] hover:bg-[#0aa0b6] text-white font-black rounded-xl transition shadow-xs cursor-pointer border border-cyan-400/30"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MEMBER TASKS & OVERDUE DRILL-DOWN MODAL
        (Triggered when clicking "مهام بانتظاره" or "مهام متأخرة")
        ========================================================================
      */}
      {selectedMemberForTasks && (() => {
        const member = selectedMemberForTasks.member;
        const currentFilter = selectedMemberForTasks.filter;

        // Waiting tasks
        const waitingList = tasks.flatMap(t => {
          const waiting = getActiveWaitingSubtask(t, teamMembers);
          if (waiting.responsibleMember?.id === member.id && !waiting.isAllCompleted) {
            return [{
              task: t,
              subtask: waiting.subtask,
              project: projects.find(p => p.id === t.projectId),
              deadline: getDeadlineInfo(t.expectedClosingDate, false),
            }];
          }
          return [];
        });

        // Overdue tasks
        const overdueList = tasks.flatMap(t => {
          const isDone = t.status === 'completed';
          const dl = getDeadlineInfo(t.expectedClosingDate, isDone);
          const isAssigned = t.assignedMemberId === member.id || t.subtasks.some(s => s.assignedMemberId === member.id && s.status !== 'completed');
          if (isAssigned && dl.isOverdue && !isDone) {
            const waiting = getActiveWaitingSubtask(t, teamMembers);
            return [{
              task: t,
              subtask: waiting.subtask,
              project: projects.find(p => p.id === t.projectId),
              deadline: dl,
            }];
          }
          return [];
        });

        // All tasks linked
        const allList = tasks.flatMap(t => {
          const isAssigned = t.assignedMemberId === member.id || t.subtasks.some(s => s.assignedMemberId === member.id);
          if (isAssigned) {
            const isDone = t.status === 'completed';
            const dl = getDeadlineInfo(t.expectedClosingDate, isDone);
            const waiting = getActiveWaitingSubtask(t, teamMembers);
            return [{
              task: t,
              subtask: waiting.subtask,
              project: projects.find(p => p.id === t.projectId),
              deadline: dl,
            }];
          }
          return [];
        });

        // Items to display based on current tab filter
        const displayedItems = currentFilter === 'waiting'
          ? waitingList
          : currentFilter === 'delayed'
          ? overdueList
          : allList;

        const whatsappAllTasksUrl = createMemberAllPendingTasksWhatsAppLink(
          member,
          tasks,
          projects,
          customWhatsAppTemplate
        );

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto"
            onClick={() => setSelectedMemberForTasks(null)}
          >
            <div 
              className="bg-[#132229] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-6 text-white flex flex-col max-h-[90vh] animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#0c1920] border-b border-[#162a34] p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-xs shrink-0 ${member.avatarColor || 'bg-[#088395]'}`}>
                    {member.name.split(' ')[1]?.[0] || member.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white">
                      مهام العضو: {member.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {member.role} {member.organization ? `• ${member.organization}` : ''} • <span dir="ltr" className="font-mono">{member.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${member.phone}`}
                    className="p-2 bg-[#182c35] hover:bg-[#1f3743] text-cyan-300 rounded-xl transition"
                    title={`اتصال هاتفي: ${member.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedMemberForTasks(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Direct WhatsApp Alert Bar */}
              <div className="bg-[#0c241c] p-3 border-b border-[#164334] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                <div className="text-xs text-emerald-200">
                  <span className="font-bold block">إرسال تنبيه شامل بكل المهام المتوقفة:</span>
                  <span className="text-[11px] text-emerald-400">يرسل رسالة منظمة وواضحة عبر واتساب تذكر كل المهام والمشاريع التابعة له</span>
                </div>
                <a
                  href={whatsappAllTasksUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال تنبيه واتساب شامل 📲</span>
                </a>
              </div>

              {/* Filter Tabs */}
              <div className="bg-[#0e1a20] px-4 py-2 border-b border-[#162a34] flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForTasks(prev => prev ? { ...prev, filter: 'waiting' } : null)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    currentFilter === 'waiting'
                      ? 'bg-[#088395] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-[#132229]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>مهام بانتظاره ({waitingList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMemberForTasks(prev => prev ? { ...prev, filter: 'delayed' } : null)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    currentFilter === 'delayed'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-[#132229]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>مهام متأخرة ({overdueList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMemberForTasks(prev => prev ? { ...prev, filter: 'all' } : null)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    currentFilter === 'all'
                      ? 'bg-[#1e4354] text-[#22d3ee] shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-[#132229]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>كل المهام ({allList.length})</span>
                </button>
              </div>

              {/* Tasks List */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
                {displayedItems.length === 0 ? (
                  <div className="bg-[#101c22] rounded-2xl p-8 text-center border border-[#1b3440] text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="font-bold text-white text-sm">
                      لا توجد مهام في هذا التصنيف حالياً
                    </p>
                    <p className="text-xs text-slate-500">
                      {currentFilter === 'delayed' ? 'لا توجد مهام متأخرة على هذا العضو، عمل ممتاز! 🎉' : 'العضو لا ينتظر أي مهام في الوقت الحالي.'}
                    </p>
                  </div>
                ) : (
                  displayedItems.map(({ task, subtask, project, deadline }, idx) => {
                    const whatsappTaskUrl = createWhatsAppAlertLink(member, task, project, subtask);
                    return (
                      <div
                        key={idx}
                        className="bg-[#101c22] rounded-2xl p-3.5 border border-[#1b3440] hover:border-[#22d3ee]/40 transition space-y-2.5 shadow-sm"
                      >
                        {/* Row 1: Task Title & Project */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black bg-[#0e3b43] text-[#22d3ee] border border-[#144f5f] px-2 py-0.5 rounded-md shrink-0">
                              {project?.name || 'مشروع عام'}
                            </span>
                            <h4 className="font-bold text-white text-xs truncate">
                              {task.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              task.status === 'completed'
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                                : task.status === 'in_progress'
                                ? 'bg-blue-950/70 text-blue-300 border border-blue-800/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {task.status === 'completed' ? 'مكتملة' : task.status === 'in_progress' ? 'قيد التنفيذ' : 'في الانتظار'}
                            </span>
                          </div>
                        </div>

                        {/* Row 2: Subtask waiting info */}
                        {subtask && (
                          <div className="bg-[#0b161b] p-2.5 rounded-xl border border-[#163544] flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] text-cyan-400 font-bold block">
                                المرحلة / الخطوة المتوقفة عليه:
                              </span>
                              <span className="text-white font-bold truncate block">
                                • {subtask.title}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              subtask.status === 'in_progress'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                                : subtask.status === 'blocked'
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {subtask.status === 'in_progress' ? 'قيد العمل' : subtask.status === 'blocked' ? 'معطلة' : 'في الانتظار'}
                            </span>
                          </div>
                        )}

                        {/* Row 3: Deadline & Action to Alert */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#162e3a]">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-400">تاريخ الإغلاق:</span>
                            <span className={`font-mono font-bold ${deadline.isOverdue ? 'text-rose-400' : 'text-slate-200'}`} dir="ltr">
                              {task.expectedClosingDate || 'غير محدد'}
                            </span>
                            {deadline.isOverdue && (
                              <span className="text-[10px] text-rose-400 font-black bg-rose-950/60 px-1.5 py-0.2 rounded">
                                ({deadline.text})
                              </span>
                            )}
                          </div>

                          <a
                            href={whatsappTaskUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0e2a21] hover:bg-[#133a2f] text-emerald-300 hover:text-white px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-emerald-500/30 transition"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                            <span>واتساب لهذه المهمة</span>
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
