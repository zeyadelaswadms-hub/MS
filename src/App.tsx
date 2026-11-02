import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Task, 
  TeamMember, 
  AppNotification, 
  SubTask 
} from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_MEMBERS, 
  INITIAL_NOTIFICATIONS 
} from './data/initialData';
import { Navbar, ActiveTab } from './components/Navbar';
import { UnifiedProjectsTasksView } from './components/UnifiedProjectsTasksView';
import { CompactGlanceView } from './components/CompactGlanceView';
import { CalendarView } from './components/CalendarView';
import { AllTasksView } from './components/AllTasksView';
import { ProjectsView } from './components/ProjectsView';
import { TeamView } from './components/TeamView';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { NotificationsModal } from './components/NotificationsModal';
import { PlatformAdviceModal } from './components/PlatformAdviceModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SettingsModal, DEFAULT_WHATSAPP_TEMPLATE } from './components/SettingsModal';
import { RotateCcw, Sparkles, CheckCircle2, X } from 'lucide-react';
import { 
  initWebNotifications, 
  sendWebNotification 
} from './utils/webNotificationService';
import { downloadTasksJSON } from './utils/backupUtils';
import { 
  computePipelineStatusOnSubtaskChange, 
  canUpdatePipelineStatusManually 
} from './utils/pipelineUtils';

export default function App() {
  // Local storage state initialization with fallbacks
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('bunyan_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('bunyan_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('bunyan_team');
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('bunyan_notifications');
      const raw: AppNotification[] = saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
      const seen = new Set<string>();
      const deduplicated: AppNotification[] = [];
      raw.forEach((n, idx) => {
        let id = n.id || `notif-${Date.now()}-${idx}`;
        if (seen.has(id)) {
          id = `${id}-${Math.random().toString(36).slice(2, 7)}`;
        }
        seen.add(id);
        deduplicated.push({ ...n, id });
      });
      return deduplicated;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Custom WhatsApp template state
  const [customWhatsAppTemplate, setCustomWhatsAppTemplate] = useState<string>(() => {
    return localStorage.getItem('bunyan_whatsapp_template') || DEFAULT_WHATSAPP_TEMPLATE;
  });

  // Server synchronization loaded flag
  const [isServerLoaded, setIsServerLoaded] = useState(false);

  // Navigation & Modals: default to 'glance' ('ملخص') view per user request
  const [activeTab, setActiveTab] = useState<ActiveTab>('glance');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetProjectForNewTask, setTargetProjectForNewTask] = useState<string | undefined>(undefined);
  const [targetDateForNewTask, setTargetDateForNewTask] = useState<string | undefined>(undefined);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);

  // Initialize Web Notifications & Service Worker on mount
  useEffect(() => {
    initWebNotifications();
  }, []);

  // Fetch unified server company database on mount (unifies Mobile & PC seamlessly)
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const res = await fetch('/api/company-data');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.projects)) {
            setProjects(data.projects);
            setTasks(data.tasks || []);
            setTeamMembers(data.teamMembers || INITIAL_MEMBERS);
            if (data.notifications && Array.isArray(data.notifications)) {
              setNotifications(data.notifications);
            }
            if (data.whatsappTemplate) {
              setCustomWhatsAppTemplate(data.whatsappTemplate);
              localStorage.setItem('bunyan_whatsapp_template', data.whatsappTemplate);
            }
          }
        }
      } catch (err) {
        console.warn('Working in local fallback mode:', err);
      } finally {
        setIsServerLoaded(true);
      }
    };

    fetchServerData();
  }, []);

  // Sync to localStorage and Server Database
  useEffect(() => {
    try {
      localStorage.setItem('bunyan_projects', JSON.stringify(projects));
      localStorage.setItem('bunyan_tasks', JSON.stringify(tasks));
      localStorage.setItem('bunyan_team', JSON.stringify(teamMembers));
      localStorage.setItem('bunyan_notifications', JSON.stringify(notifications));
      localStorage.setItem('bunyan_whatsapp_template', customWhatsAppTemplate);
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }

    if (!isServerLoaded) return;

    // Send persistent update to Express server file storage
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/company-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projects,
            tasks,
            teamMembers,
            notifications,
            whatsappTemplate: customWhatsAppTemplate,
          }),
        });
      } catch (e) {
        console.error('Failed to sync data to server', e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [projects, tasks, teamMembers, notifications, customWhatsAppTemplate, isServerLoaded]);

  const handleSaveWhatsAppTemplate = (template: string) => {
    setCustomWhatsAppTemplate(template);
    localStorage.setItem('bunyan_whatsapp_template', template);
    fetch('/api/company-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projects,
        tasks,
        teamMembers,
        notifications,
        whatsappTemplate: template,
      }),
    }).catch(() => {});
  };

  // Task Update Handler (with automatic Web Notifications & Sequential Pipeline logic)
  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        let computedStatus = updates.status !== undefined ? updates.status : task.status;

        // 1. Detect subtask status changes and trigger Web Notifications
        if (updates.subtasks) {
          const changedSubtask = updates.subtasks.find(step => {
            const oldStep = task.subtasks.find(os => os.id === step.id);
            return oldStep && oldStep.status !== step.status;
          });

          // Compute sequential pipeline status if status was not explicitly forced
          if (changedSubtask && updates.status === undefined) {
            computedStatus = computePipelineStatusOnSubtaskChange(
              task,
              changedSubtask.id,
              changedSubtask.status,
              updates.subtasks
            );
          }

          updates.subtasks.forEach(step => {
            const oldStep = task.subtasks.find(os => os.id === step.id);
            if (oldStep && oldStep.status !== step.status) {
              const assigned = teamMembers.find(m => m.id === step.assignedMemberId);
              let statusText = 'تم تغيير الحالة';
              if (step.status === 'completed') statusText = 'مكتملة بنجاح ✅';
              else if (step.status === 'in_progress') statusText = 'قيد التنفيذ والمتابعة ⚙️';
              else if (step.status === 'blocked') statusText = 'معطلة / متوقفة ⛔';
              else statusText = 'قيد الانتظار ⏳';

              // Send browser Web Notification
              sendWebNotification(`🔄 تحديث خطوة فرعية: ${step.title}`, {
                body: `الحالة: ${statusText} • المهمة: ${task.title} • المسؤول: ${assigned?.name || 'غير محدد'}`,
                tag: `subtask-${step.id}-${Date.now()}`,
                url: '/',
              });
            }
          });

          // Generate in-app handoff notification if completed
          const completedStep = updates.subtasks.find(s => s.status === 'completed' && (!task.subtasks.find(os => os.id === s.id)?.status || task.subtasks.find(os => os.id === s.id)?.status !== 'completed'));
          if (completedStep) {
            const nextPending = updates.subtasks.find(s => s.order > completedStep.order && s.status !== 'completed');
            const nextMember = nextPending ? teamMembers.find(m => m.id === nextPending.assignedMemberId) : null;
            
            const newNotif: AppNotification = {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              taskId: task.id,
              projectId: task.projectId,
              subtaskId: nextPending?.id,
              title: nextPending ? 'تم إنجاز خطوة وتحويل المهمة 🔄' : 'تم استكمال جميع الخطوات! 🎉',
              message: nextPending 
                ? `تم إنجاز خطوة "${completedStep.title}" بنجاح. الخطوة التالية "${nextPending.title}" أصبحت الآن بانتظار ${nextMember ? nextMember.name : 'المسؤول'}.`
                : `تم الانتهاء من جميع الخطوات الفرعية لمهمة "${task.title}".`,
              type: nextPending ? 'assigned_to_you' : 'step_completed',
              targetMemberId: nextPending?.assignedMemberId,
              createdAt: 'الآن',
              read: false,
            };
            setNotifications(n => [newNotif, ...n]);

            // Web notification for handoff
            if (nextPending) {
              sendWebNotification(`🔄 تحويل الخطوة التالية لـ ${nextMember ? nextMember.name : 'المسؤول'}`, {
                body: `تم إنجاز "${completedStep.title}". الدور الحالي على: "${nextPending.title}".`,
                tag: `handoff-${nextPending.id}`,
                url: '/',
              });
            }
          }
        }

        const updated = { ...task, ...updates, status: computedStatus };

        // 2. Whole task completed web notification
        if (updates.status === 'completed' && task.status !== 'completed') {
          sendWebNotification(`🎉 إنجاز المهمة بالكامل: ${task.title}`, {
            body: `تم إغلاق واعتماد كافة خطوات مهمة "${task.title}" بنجاح.`,
            tag: `task-done-${task.id}`,
            url: '/',
          });
        }

        return updated;
      }
      return task;
    }));
  };

  // Delete Task Handler
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة وجميع خطواتها الفرعية؟')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // Add Subtask Handler to existing task
  const handleAddSubtaskToTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newOrder = task.subtasks.length + 1;
        const newSubtask: SubTask = {
          id: `sub-${Date.now()}-${newOrder}`,
          order: newOrder,
          title: `خطوة فرعية جديدة (${newOrder})`,
          assignedMemberId: task.assignedMemberId,
          status: 'pending',
          transitionNote: 'ملاحظة الفحص والاعتماد',
          estimatedDays: 2,
        };

        // Browser Web Notification for added subtask
        sendWebNotification(`➕ إضافة خطوة فرعية: ${newSubtask.title}`, {
          body: `أضيفت خطوة جديدة لمهمة "${task.title}".`,
          tag: `subtask-add-${newSubtask.id}`,
          url: '/',
        });

        return {
          ...task,
          subtasks: [...task.subtasks, newSubtask],
        };
      }
      return task;
    }));
  };

  // Create Task Handler (with automatic Web Notification)
  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `tsk-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks(prev => [newTask, ...prev]);

    // Create initial in-app notification
    const project = projects.find(p => p.id === newTask.projectId);
    const firstSubtask = newTask.subtasks[0];
    const assignee = teamMembers.find(m => m.id === (firstSubtask?.assignedMemberId || newTask.assignedMemberId));

    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      taskId: newTask.id,
      projectId: newTask.projectId,
      subtaskId: firstSubtask?.id,
      title: 'مهمة عمل جديدة تم إنشاؤها 📋',
      message: `تم إضافة مهمة "${newTask.title}" بمشروع "${project?.name || ''}". المسؤول عن الخطوة الأولى: ${assignee?.name || 'غير محدد'}.`,
      type: 'assigned_to_you',
      targetMemberId: firstSubtask?.assignedMemberId || newTask.assignedMemberId,
      createdAt: 'الآن',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);

    // Send Web Notification (Browser Alert)
    sendWebNotification(`📋 تعيين مهمة جديدة: ${newTask.title}`, {
      body: `المشروع: ${project?.name || 'عام'} • المسؤول عن الخطوة الأولى: ${assignee?.name || 'غير محدد'}`,
      tag: `new-task-${newTask.id}`,
      url: '/',
      requireInteraction: true,
    });
  };

  // Create Project Handler
  const handleCreateProject = (newProjectData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...newProjectData,
      id: `prj-${Date.now()}`,
    };
    setProjects(prev => [...prev, newProj]);
    setSelectedProjectId(newProj.id);
    setActiveTab('unified');
  };

  // Add Team Member Handler
  const handleAddTeamMember = (newMemberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...newMemberData,
      id: `mem-${Date.now()}`,
    };
    setTeamMembers(prev => [...prev, newMember]);
  };

  // Update Team Member Handler
  const handleUpdateTeamMember = (memberId: string, updates: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
  };

  // Delete Team Member Handler
  const handleDeleteTeamMember = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));
  };

  // Bulk Import Tasks & Projects Handler (from Excel / Google Sheets)
  const handleImportTasksAndProjects = (newTasks: Task[], newProjects: Project[]) => {
    if (newProjects.length > 0) {
      setProjects(prev => [...prev, ...newProjects]);
    }
    if (newTasks.length > 0) {
      setTasks(prev => [...newTasks, ...prev]);
    }
  };

  // Complete 3-Sheet Database Import Handler (Projects + Team Members + Tasks)
  const handleImportDatabase = ({
    projects: newProjects,
    teamMembers: newMembers,
    tasks: newTasks,
    mode,
  }: {
    projects: Project[];
    teamMembers: TeamMember[];
    tasks: Task[];
    mode: 'merge' | 'replace';
  }) => {
    if (mode === 'replace') {
      if (newProjects.length > 0) setProjects(newProjects);
      if (newMembers.length > 0) setTeamMembers(newMembers);
      if (newTasks.length > 0) setTasks(newTasks);
      setSelectedProjectId('all');

      try {
        if (newProjects.length > 0) localStorage.setItem('bunyan_projects', JSON.stringify(newProjects));
        if (newMembers.length > 0) localStorage.setItem('bunyan_team', JSON.stringify(newMembers));
        if (newTasks.length > 0) localStorage.setItem('bunyan_tasks', JSON.stringify(newTasks));
      } catch (e) {
        console.error('Failed to sync to localStorage', e);
      }
    } else {
      // Merge mode
      if (newProjects.length > 0) {
        setProjects(prev => {
          const map = new Map(prev.map(p => [p.id, p]));
          newProjects.forEach(p => map.set(p.id, p));
          const res = Array.from(map.values());
          try { localStorage.setItem('bunyan_projects', JSON.stringify(res)); } catch {}
          return res;
        });
      }
      if (newMembers.length > 0) {
        setTeamMembers(prev => {
          const map = new Map(prev.map(m => [m.id, m]));
          newMembers.forEach(m => map.set(m.id, m));
          const res = Array.from(map.values());
          try { localStorage.setItem('bunyan_team', JSON.stringify(res)); } catch {}
          return res;
        });
      }
      if (newTasks.length > 0) {
        setTasks(prev => {
          const map = new Map(prev.map(t => [t.id, t]));
          newTasks.forEach(t => map.set(t.id, t));
          const res = Array.from(map.values());
          try { localStorage.setItem('bunyan_tasks', JSON.stringify(res)); } catch {}
          return res;
        });
      }
    }
  };

  // Reset to default mock data (clearing projects, tasks, team, notifications and restoring default)
  const handleResetData = () => {
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setTeamMembers(INITIAL_MEMBERS);
    setNotifications(INITIAL_NOTIFICATIONS);
    try {
      const pw = localStorage.getItem('bunyan_reset_password');
      localStorage.clear();
      if (pw) localStorage.setItem('bunyan_reset_password', pw);
    } catch (e) {
      console.error('Failed to clear localStorage', e);
    }

    fetch('/api/company-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projects: INITIAL_PROJECTS,
        tasks: INITIAL_TASKS,
        teamMembers: INITIAL_MEMBERS,
        notifications: INITIAL_NOTIFICATIONS,
        whatsappTemplate: customWhatsAppTemplate,
      }),
    }).catch(() => {});
  };

  // Clean fresh start: clears demo projects and tasks for personal real testing
  const handleClearDemoData = () => {
    setProjects([]);
    setTasks([]);
    setSelectedProjectId('all');
    try {
      localStorage.removeItem('bunyan_projects');
      localStorage.removeItem('bunyan_tasks');
    } catch (e) {
      console.error('Failed to clear demo data', e);
    }

    fetch('/api/company-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projects: [],
        tasks: [],
        teamMembers,
        notifications,
        whatsappTemplate: customWhatsAppTemplate,
      }),
    }).catch(() => {});
  };

  // Backup JSON Export Handler for Project Manager
  const [backupToast, setBackupToast] = useState<{ message: string; filename: string } | null>(null);

  const handleExportBackup = () => {
    const result = downloadTasksJSON(tasks, projects, teamMembers);
    setBackupToast({
      message: `تم تحميل النسخة الاحتياطية بنجاح (${result.tasksCount} مهمة)`,
      filename: result.filename,
    });
    setTimeout(() => {
      setBackupToast(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-slate-100 flex flex-col font-sans">
      
      {/* Top Main Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateTask={() => {
          setTargetProjectForNewTask(undefined);
          setIsCreateTaskOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAdvice={() => setIsAdviceOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportBackup={handleExportBackup}
        onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
        notifications={notifications}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3.5 space-y-2.5">
        
        {/* Dynamic View based on Active Tab */}
        {(activeTab === 'unified' || activeTab === 'all_tasks' || activeTab === 'projects') && (
          <UnifiedProjectsTasksView
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            selectedProjectId={selectedProjectId}
            onSelectProject={(projId) => setSelectedProjectId(projId)}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddSubtask={handleAddSubtaskToTask}
            onOpenCreateTask={(projId) => {
              setTargetProjectForNewTask(projId || (selectedProjectId !== 'all' ? selectedProjectId : undefined));
              setIsCreateTaskOpen(true);
            }}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
            onOpenEditTask={(task) => setEditingTask(task)}
          />
        )}

        {activeTab === 'glance' && (
          <CompactGlanceView
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddSubtask={handleAddSubtaskToTask}
            onOpenCreateTask={(projId) => {
              setTargetProjectForNewTask(projId);
              setIsCreateTaskOpen(true);
            }}
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setActiveTab('unified');
            }}
            onExportBackup={handleExportBackup}
            onOpenGoogleSheets={() => setIsGoogleSheetsOpen(true)}
            onOpenEditTask={(task) => setEditingTask(task)}
            onImportTasks={handleImportTasksAndProjects}
            onImportDatabase={handleImportDatabase}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onAddSubtask={handleAddSubtaskToTask}
            onOpenCreateTask={(projId, initialDate) => {
              setTargetProjectForNewTask(projId);
              setTargetDateForNewTask(initialDate);
              setIsCreateTaskOpen(true);
            }}
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setActiveTab('unified');
            }}
          />
        )}

        {activeTab === 'team' && (
          <TeamView
            teamMembers={teamMembers}
            tasks={tasks}
            projects={projects}
            onAddTeamMember={handleAddTeamMember}
            onUpdateTeamMember={handleUpdateTeamMember}
            onDeleteTeamMember={handleDeleteTeamMember}
            customWhatsAppTemplate={customWhatsAppTemplate}
          />
        )}

      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setTargetDateForNewTask(undefined);
        }}
        projects={projects}
        teamMembers={teamMembers}
        initialProjectId={targetProjectForNewTask || selectedProjectId}
        initialDate={targetDateForNewTask}
        onCreateTask={(newTask) => {
          handleCreateTask(newTask);
          setTargetDateForNewTask(undefined);
        }}
      />

      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        projects={projects}
        teamMembers={teamMembers}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        teamMembers={teamMembers}
        onCreateProject={handleCreateProject}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        teamMembers={teamMembers}
        onMarkAllAsRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
      />

      <PlatformAdviceModal
        isOpen={isAdviceOpen}
        onClose={() => setIsAdviceOpen(false)}
        teamMembers={teamMembers}
        projects={projects}
        tasks={tasks}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAdvice={() => setIsAdviceOpen(true)}
        onResetData={handleResetData}
        onClearData={handleClearDemoData}
        onExportBackup={handleExportBackup}
        customWhatsAppTemplate={customWhatsAppTemplate}
        onSaveWhatsAppTemplate={handleSaveWhatsAppTemplate}
      />

      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        tasks={tasks}
        projects={projects}
        teamMembers={teamMembers}
        onUpdateTask={handleUpdateTask}
      />

      {/* Clean Footer Info */}
      <footer className="bg-[#0c1920] border-t border-[#162a34] py-3 px-4 sm:px-8 text-xs text-slate-400 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-white">بنيان للمقاولات - برمجة م.زياد مرعي 01030095004</span>
            <span className="text-slate-600 hidden sm:inline">-</span>
            <span className="text-slate-400">نظام سلاسل الخطوات المرنة والتنبيهات الميدانية الفورية</span>
          </div>
          <div className="text-[11px] text-slate-500">
            جميع الحقوق محفوظة © {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* Floating Backup Toast Alert */}
      {backupToast && (
        <div className="fixed bottom-4 left-4 z-50 bg-stone-900/95 backdrop-blur-xs text-white border border-emerald-500/40 shadow-2xl px-4 py-3 rounded-2xl flex items-center gap-3 animate-slideUp">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{backupToast.message}</p>
            <p className="text-[10px] text-stone-400 font-mono mt-0.5" dir="ltr">{backupToast.filename}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setBackupToast(null)}
            className="text-stone-400 hover:text-white p-1 ml-1 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
