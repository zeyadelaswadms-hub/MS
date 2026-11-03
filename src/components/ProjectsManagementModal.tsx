import React, { useState, useMemo } from 'react';
import { Project, Task, TeamMember } from '../types';
import { calculateTaskProgress, getDeadlineInfo } from '../utils/dateUtils';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Calendar, 
  MapPin, 
  UserCheck, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';

interface ProjectsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  onOpenCreateProject: () => void;
  onOpenEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectProjectAndFilter: (projectId: string) => void;
}

export const ProjectsManagementModal: React.FC<ProjectsManagementModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  teamMembers,
  onOpenCreateProject,
  onOpenEditProject,
  onDeleteProject,
  onSelectProjectAndFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchCode = p.code?.toLowerCase().includes(q);
        const matchClient = p.client?.toLowerCase().includes(q);
        const matchLocation = p.location?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchClient && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  if (!isOpen) return null;

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-6 text-white flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#088395]/20 border border-[#22d3ee]/30 flex items-center justify-center text-[#22d3ee]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>قائمة وإدارة المشاريع</span>
                <span className="text-xs bg-[#088395] text-white px-2 py-0.5 rounded-md font-bold">
                  {projects.length} مشاريع
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل بيانات المشاريع، متابعة نسب الإنجاز، إضافة مشاريع جديدة أو حذفها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateProject();
              }}
              className="bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-cyan-400/30 shadow-xs"
              title="إضافة مشروع جديد"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">+ إضافة مشروع جديد</span>
              <span className="sm:hidden">+ مشروع</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Status Filters */}
        <div className="p-3 sm:p-4 bg-[#101c22] border-b border-[#1b3442] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم المشروع، الكود، العميل، أو الموقع..."
              className="w-full bg-[#182c35] border border-[#22404e] rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#22d3ee] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#088395] text-white shadow-xs'
                  : 'bg-[#182c35] text-slate-300 hover:text-white'
              }`}
            >
              الكل ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#182c35] text-slate-300 hover:text-white'
              }`}
            >
              جاري التنفيذ ({projects.filter(p => (p.status || 'active') === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#182c35] text-slate-300 hover:text-white'
              }`}
            >
              مكتملة ({projects.filter(p => p.status === 'completed').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paused')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'paused'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#182c35] text-slate-300 hover:text-white'
              }`}
            >
              متوقفة ({projects.filter(p => p.status === 'paused').length})
            </button>
          </div>

        </div>

        {/* Delete Confirmation Banner (if an item is marked for deletion) */}
        {projectToDelete && (
          <div className="p-4 bg-[#231216] border-b border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  هل أنت متأكد من حذف مشروع "{projectToDelete.name}" ({projectToDelete.code})؟
                </span>
                <span className="text-rose-300 text-[11px]">
                  سيتم حذف المشروع والمهام التابعة له نهائياً من قاعدة البيانات.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3 py-1 bg-[#182c35] hover:bg-[#203a46] text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد الحذف</span>
              </button>
            </div>
          </div>
        )}

        {/* Projects List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-[#1e3845] rounded-2xl space-y-3">
              <Building2 className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="font-bold text-sm text-slate-300">
                {searchQuery ? 'لم يتم العثور على مشاريع تطابق البحث' : 'لا توجد مشاريع مسجلة حالياً'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                يمكنك إضافة أول مشروع مقاولات الآن لتنظيم المهام وتوزيع الخطوات الميدانية.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateProject();
                }}
                className="bg-[#088395] hover:bg-[#0aa0b6] text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                + إنشاء أول مشروع
              </button>
            </div>
          ) : (
            filteredProjects.map(proj => {
              const projectTasks = tasks.filter(t => t.projectId === proj.id);
              const progress = projectTasks.length === 0 ? 0 : Math.round(
                projectTasks.reduce((acc, t) => acc + calculateTaskProgress(t), 0) / projectTasks.length
              );
              const delayedCount = projectTasks.filter(t => {
                const isDone = t.status === 'completed';
                return getDeadlineInfo(t.expectedClosingDate, isDone).isOverdue && !isDone;
              }).length;
              const manager = teamMembers.find(m => m.id === proj.projectManagerId);
              const isCompleted = proj.status === 'completed';
              const isPaused = proj.status === 'paused';

              return (
                <div
                  key={proj.id}
                  className="bg-[#182c35] hover:bg-[#1a313c] border border-[#22404e] hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 shadow-sm space-y-3"
                >
                  {/* Row 1: Code, Status, Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#22404e]/70">
                    
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-[#0c1920] text-[#22d3ee] px-2.5 py-0.5 rounded-lg border border-[#1b3442]">
                        {proj.code}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isCompleted
                          ? 'bg-blue-900/60 text-blue-200 border border-blue-700/50'
                          : isPaused
                          ? 'bg-amber-900/60 text-amber-200 border border-amber-700/50'
                          : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/50'
                      }`}>
                        {isCompleted ? '✅ مكتمل' : isPaused ? '⏸️ متوقف' : '🟢 جاري التنفيذ'}
                      </span>
                    </div>

                    {/* Action buttons: Edit, Delete, View Tasks */}
                    <div className="flex items-center gap-1.5">
                      {/* View tasks button */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProjectAndFilter(proj.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#0e3b43] hover:bg-[#134e5a] text-cyan-200 hover:text-white border border-cyan-500/40 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="عرض مهام هذا المشروع"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>عرض المهام ({projectTasks.length})</span>
                      </button>

                      {/* Edit project button */}
                      <button
                        type="button"
                        onClick={() => {
                          onOpenEditProject(proj);
                        }}
                        className="px-2.5 py-1 bg-[#132229] hover:bg-[#1d3542] text-slate-200 hover:text-white border border-[#22404e] rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        title="تعديل بيانات المشروع"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#22d3ee]" />
                        <span>تعديل</span>
                      </button>

                      {/* Delete project button */}
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(proj)}
                        className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-900/40 border border-rose-900/40 rounded-lg transition cursor-pointer"
                        title="حذف هذا المشروع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Row 2: Name & Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-base font-black text-white hover:text-[#22d3ee] transition">
                        {proj.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="font-semibold text-slate-300">
                          العميل: {proj.client || 'غير محدد'}
                        </span>
                        {proj.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#22d3ee]" />
                            {proj.location}
                          </span>
                        )}
                        {proj.budget && (
                          <span className="flex items-center gap-1 text-amber-300 font-semibold">
                            <Wallet className="w-3 h-3" />
                            {proj.budget}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 text-xs">
                      {manager && (
                        <div className="flex items-center gap-2 bg-[#101c22] border border-[#22404e] px-2.5 py-1 rounded-xl">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${manager.avatarColor || 'bg-[#088395]'}`}>
                            {manager.name.split(' ')[1]?.[0] || 'م'}
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block leading-tight">مدير المشروع</span>
                            <span className="font-bold text-white text-[11px] block leading-tight">{manager.name}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-300 bg-[#101c22] border border-[#22404e] px-2.5 py-1 rounded-xl">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px]" dir="ltr">
                          {proj.startDate || '—'} ➔ {proj.expectedEndDate || '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Progress & Task Counters */}
                  <div className="bg-[#101c22] rounded-xl p-2.5 border border-[#1b3442] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-bold">نسبة الإنجاز:</span>
                        <strong className="text-[#22d3ee] font-black">{progress}%</strong>
                        <span className="text-[11px] text-slate-500">
                          ({projectTasks.filter(t => t.status === 'completed').length} من {projectTasks.length} مكتملة)
                        </span>
                      </div>

                      {delayedCount > 0 && (
                        <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-700/60 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>{delayedCount} مهام متأخرة</span>
                        </span>
                      )}
                    </div>

                    <div className="h-1.5 bg-[#182c35] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#088395] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0c1920] border-t border-[#162a34] p-3 sm:p-4 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <span>
            إجمالي المشاريع المتاحة: <strong className="text-white font-mono">{projects.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#182c35] hover:bg-[#203a46] text-white font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
