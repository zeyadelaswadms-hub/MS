import React, { useState } from 'react';
import { Project, Task, TeamMember } from '../types';
import { TaskCard } from './TaskCard';
import { calculateTaskProgress, getDeadlineInfo } from '../utils/dateUtils';
import { 
  Building2, 
  MapPin, 
  UserCheck, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Phone, 
  Briefcase, 
  Wallet,
  Sparkles,
  Layers
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onOpenCreateTask: (projectId?: string) => void;
  onOpenCreateProject: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  teamMembers,
  selectedProjectId,
  onSelectProject,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onOpenCreateTask,
  onOpenCreateProject,
}) => {
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter(t => t.projectId === currentProject?.id);
  const manager = teamMembers.find(m => m.id === currentProject?.projectManagerId);

  // Calculate project overall completion rate (%)
  const overallProgress = projectTasks.length === 0 ? 0 : Math.round(
    projectTasks.reduce((acc, t) => acc + calculateTaskProgress(t), 0) / projectTasks.length
  );

  const delayedTasks = projectTasks.filter(t => {
    const isDone = t.status === 'completed';
    const dl = getDeadlineInfo(t.expectedClosingDate, isDone);
    return dl.isOverdue && !isDone;
  });

  const inProgressTasks = projectTasks.filter(t => t.status !== 'completed');

  return (
    <div className="space-y-6">
      
      {/* Project Selector Horizontal Tabs / Cards */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {projects.map(proj => {
          const isSelected = proj.id === currentProject?.id;
          const pTasks = tasks.filter(t => t.projectId === proj.id);
          const pProg = pTasks.length === 0 ? 0 : Math.round(
            pTasks.reduce((acc, t) => acc + calculateTaskProgress(t), 0) / pTasks.length
          );
          const pDelayed = pTasks.filter(t => {
            const isDone = t.status === 'completed';
            return getDeadlineInfo(t.expectedClosingDate, isDone).isOverdue && !isDone;
          }).length;

          return (
            <button
              key={proj.id}
              type="button"
              onClick={() => onSelectProject(proj.id)}
              className={`shrink-0 text-right p-4 rounded-2xl border transition-all duration-200 min-w-[240px] max-w-[280px] cursor-pointer ${
                isSelected
                  ? 'bg-amber-950 text-white border-amber-900 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-amber-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isSelected ? 'bg-amber-800 text-amber-100' : 'bg-stone-100 text-stone-600'
                }`}>
                  {proj.code}
                </span>
                {pDelayed > 0 && (
                  <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {pDelayed} متأخرة
                  </span>
                )}
              </div>

              <h4 className="font-bold text-sm line-clamp-1 mb-1">
                {proj.name}
              </h4>
              <p className={`text-xs truncate mb-3 ${isSelected ? 'text-amber-200/80' : 'text-stone-500'}`}>
                {proj.location}
              </p>

              {/* Mini progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className={isSelected ? 'text-amber-200/70' : 'text-stone-400'}>الإنجاز العام</span>
                  <span className={isSelected ? 'text-amber-300' : 'text-stone-700'}>{pProg}%</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-amber-900' : 'bg-stone-200'}`}>
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${pProg}%` }}
                  ></div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Add New Project Card */}
        <button
          type="button"
          onClick={onOpenCreateProject}
          className="shrink-0 p-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 bg-white/60 hover:bg-amber-50/50 text-stone-600 hover:text-amber-900 min-w-[180px] h-[134px] flex flex-col items-center justify-center gap-2 transition cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-amber-100">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">+ مشروع جديد</span>
        </button>
      </div>

      {/* Selected Project Main Profile & Metrics Header */}
      {currentProject && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-md font-bold font-mono">
                  {currentProject.code}
                </span>
                <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-md font-medium">
                  {currentProject.client}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                {currentProject.name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {currentProject.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  التسليم: {currentProject.expectedEndDate}
                </span>
                {currentProject.budget && (
                  <span className="flex items-center gap-1 text-stone-700 font-semibold">
                    <Wallet className="w-3.5 h-3.5 text-amber-600" />
                    الميزانية: {currentProject.budget}
                  </span>
                )}
              </div>
            </div>

            {/* Manager Contact & Add Task Action */}
            <div className="flex flex-wrap items-center gap-3">
              {manager && (
                <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${manager.avatarColor || 'bg-amber-600'}`}>
                    {manager.name.split(' ')[1]?.[0] || 'م'}
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">مدير المشروع</span>
                    <span className="font-bold text-stone-800 block">{manager.name}</span>
                  </div>
                  <a
                    href={`tel:${manager.phone}`}
                    className="p-1.5 bg-white hover:bg-stone-200 border border-stone-200 rounded-lg text-stone-700 transition"
                    title={`اتصال: ${manager.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={() => onOpenCreateTask(currentProject.id)}
                className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مهمة لهذا المشروع</span>
              </button>
            </div>
          </div>

          {/* Project Progress & Statistics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 text-center">
            
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70">
              <span className="text-[11px] text-stone-500 font-semibold block mb-1">
                نسبة إنجاز المشروع
              </span>
              <span className="text-2xl font-black text-amber-600">
                {overallProgress}%
              </span>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: `${overallProgress}%` }}></div>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70">
              <span className="text-[11px] text-stone-500 font-semibold block mb-1">
                إجمالي المهام المدرجة
              </span>
              <span className="text-2xl font-black text-stone-900">
                {projectTasks.length}
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">مهام رئيسية</span>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/70">
              <span className="text-[11px] text-stone-500 font-semibold block mb-1">
                قيد العمل بالموقع
              </span>
              <span className="text-2xl font-black text-amber-700">
                {inProgressTasks.length}
              </span>
              <span className="text-[10px] text-stone-400 block mt-1">خطوات متتالية</span>
            </div>

            <div className={`p-3 rounded-xl border ${
              delayedTasks.length > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-stone-50 border-stone-200/70'
            }`}>
              <span className="text-[11px] font-semibold block mb-1">
                مهام متأخرة عن الإغلاق
              </span>
              <span className={`text-2xl font-black ${delayedTasks.length > 0 ? 'text-red-600' : 'text-stone-400'}`}>
                {delayedTasks.length}
              </span>
              <span className="text-[10px] block mt-1">
                {delayedTasks.length > 0 ? 'تحتاج تدخل فوري ⚠️' : 'لا يوجد تأخير 👍'}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Tasks Under this Project */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>المهام وسلاسل الخطوات التابعة للمشروع</span>
            <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              {projectTasks.length} مهام
            </span>
          </h3>
          <span className="text-xs text-stone-500">
            توضح كل مهمة نسبة الإنجاز والمسؤول والموعد المتوقع وأيام التأخير
          </span>
        </div>

        {projectTasks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-stone-300 text-center space-y-3">
            <Layers className="w-8 h-8 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-800">لا توجد مهام مسجلة في هذا المشروع حتى الآن</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              ابدأ بإضافة أول مهمة مع تقسيمها لخطوات متسلسلة وحدد المسؤولين والمواعيد المتوقعة.
            </p>
            <button
              type="button"
              onClick={() => onOpenCreateTask(currentProject?.id)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              + إضافة مهمة أولى لهذا المشروع
            </button>
          </div>
        ) : (
          projectTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              project={currentProject}
              teamMembers={teamMembers}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onAddSubtask={onAddSubtask}
              onSelectProject={onSelectProject}
            />
          ))
        )}
      </div>

    </div>
  );
};
