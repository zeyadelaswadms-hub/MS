import { Task, Project, TeamMember } from '../types';

export interface BackupExportResult {
  filename: string;
  tasksCount: number;
  exportedAt: string;
}

/**
 * Downloads current tasks data as a formatted JSON file for manual backup by project managers.
 */
export function downloadTasksJSON(
  tasks: Task[], 
  projects: Project[] = [], 
  teamMembers: TeamMember[] = []
): BackupExportResult {
  const now = new Date();
  const dateFormatted = now.toISOString().split('T')[0];
  
  const backupPayload = {
    backupMetadata: {
      appName: 'بُنيان - نظام إدارة المشاريع والمهام للمقاولات',
      description: 'نسخة احتياطية يدوية لبيانات المهام والمشاريع وفريق العمل',
      version: '1.0',
      exportedAt: now.toISOString(),
      exportedAtArabic: new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(now),
      totalTasksCount: tasks.length,
      totalProjectsCount: projects.length,
      totalTeamMembersCount: teamMembers.length,
      role: 'Project Manager Backup (نسخ احتياطي يدوي لمدير المشروع)',
    },
    tasks,
    projects,
    teamMembers,
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `bunyan_tasks_backup_${dateFormatted}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    filename: `bunyan_tasks_backup_${dateFormatted}.json`,
    tasksCount: tasks.length,
    exportedAt: now.toISOString(),
  };
}
