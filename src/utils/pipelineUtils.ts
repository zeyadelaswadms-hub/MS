import { Task, SubTask, SubTaskStatus } from '../types';

/**
 * Rank mapping for subtasks
 * 0: pending / blocked
 * 1: in_progress
 * 2: completed
 */
export const getSubtaskRank = (status: SubTaskStatus): number => {
  switch (status) {
    case 'pending':
    case 'blocked':
      return 0;
    case 'in_progress':
      return 1;
    case 'completed':
      return 2;
    default:
      return 0;
  }
};

/**
 * Rank mapping for overall task status
 * 0: not_started / delayed
 * 1: in_progress
 * 2: completed
 */
export const getTaskRank = (status: Task['status']): number => {
  switch (status) {
    case 'not_started':
    case 'delayed':
      return 0;
    case 'in_progress':
      return 1;
    case 'completed':
      return 2;
    default:
      return 0;
  }
};

/**
 * Get the next forward/active step in a sequential pipeline
 */
export const getNextActiveStep = (subtasks: SubTask[]): SubTask | undefined => {
  if (!subtasks || subtasks.length === 0) return undefined;
  const sorted = [...subtasks].sort((a, b) => a.order - b.order);
  return sorted.find(s => s.status !== 'completed') || sorted[sorted.length - 1];
};

/**
 * Calculate the new pipeline status when a subtask is updated according to user rules:
 * - Changing Step 1 does not affect the pipeline status.
 * - Modifying Step 2 or forward updates pipeline status if it has higher progression.
 * - If all steps are completed, pipeline becomes completed.
 */
export const computePipelineStatusOnSubtaskChange = (
  task: Task,
  subtaskId: string,
  newSubtaskStatus: SubTaskStatus,
  updatedSubtasks: SubTask[]
): Task['status'] => {
  const sorted = [...task.subtasks].sort((a, b) => a.order - b.order);
  const stepIndex = sorted.findIndex(s => s.id === subtaskId);

  // If all steps completed, task is completed
  const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.status === 'completed');
  if (allCompleted) {
    return 'completed';
  }

  // Rule 1: Step 1 does not change pipeline status
  if (stepIndex === 0) {
    // If was completed and now not all completed, preserve current or return in_progress
    if (task.status === 'completed') {
      return 'in_progress';
    }
    return task.status;
  }

  // Rule 2: Step 2 or later modifies pipeline status if its progression is higher
  const subRank = getSubtaskRank(newSubtaskStatus);
  const currentTaskRank = getTaskRank(task.status);

  if (subRank > currentTaskRank) {
    if (newSubtaskStatus === 'in_progress') {
      return 'in_progress';
    }
    if (newSubtaskStatus === 'completed') {
      return allCompleted ? 'completed' : 'in_progress';
    }
  }

  if (task.status === 'completed' && !allCompleted) {
    return 'in_progress';
  }

  return task.status;
};

/**
 * Validate manual pipeline status edit:
 * "بحيث لا تقل عن حالة المهمة التالية لها"
 */
export const canUpdatePipelineStatusManually = (
  task: Task,
  newStatus: Task['status']
): { allowed: boolean; reason?: string } => {
  const nextStep = getNextActiveStep(task.subtasks);
  if (!nextStep) {
    return { allowed: true };
  }

  const minRank = getSubtaskRank(nextStep.status);
  const selectedRank = getTaskRank(newStatus);

  if (selectedRank < minRank) {
    const stepStatusArabic = nextStep.status === 'completed' 
      ? 'مكتملة' 
      : nextStep.status === 'in_progress' 
      ? 'قيد التنفيذ' 
      : 'قيد الانتظار';
    return {
      allowed: false,
      reason: `لا يمكن خفض حالة المسار التسلسلي عن حالة الخطوة التالية "${nextStep.title}" (${stepStatusArabic})`,
    };
  }

  return { allowed: true };
};

/**
 * Get effective status of the intermediate transition bridge:
 * Enforces the core rule:
 * "مينفعش المسار الانتقالي أو المهمة الوسيطة تكون حالتها متأخرة عن حالة المهمة الفرعية في المسار المتسلسل الذي يليها"
 */
export const getTransitionEffectiveStatus = (
  step: SubTask,
  nextStep?: SubTask | null
): SubTaskStatus => {
  if (!nextStep) {
    return step.transitionStatus || (step.status === 'completed' ? 'completed' : 'pending');
  }

  const nextRank = getSubtaskRank(nextStep.status);
  
  // Default inferred status if not explicitly saved
  let currentStatus = step.transitionStatus;
  if (!currentStatus) {
    if (step.status === 'completed' && nextStep.status === 'completed') {
      currentStatus = 'completed';
    } else if (step.status === 'completed' || nextStep.status === 'in_progress') {
      currentStatus = 'in_progress';
    } else {
      currentStatus = 'pending';
    }
  }

  const currentRank = getSubtaskRank(currentStatus);

  // If transition status is less than next subtask status, elevate it!
  if (currentRank < nextRank) {
    return nextStep.status;
  }

  return currentStatus;
};

/**
 * Cycle transition status on tap/click with constraint:
 * Cannot drop below nextStep's status!
 */
export const cycleTransitionStatus = (
  step: SubTask,
  nextStep?: SubTask | null
): SubTaskStatus => {
  const current = getTransitionEffectiveStatus(step, nextStep);
  const nextMinRank = nextStep ? getSubtaskRank(nextStep.status) : 0;

  if (nextMinRank >= 2) {
    // Next step is completed, transition must stay completed
    return 'completed';
  }

  if (nextMinRank === 1) {
    // Next step is in_progress, can toggle between in_progress and completed
    return current === 'in_progress' ? 'completed' : 'in_progress';
  }

  // Next step is pending or blocked (rank 0), can cycle through pending -> in_progress -> completed -> pending
  if (current === 'pending' || current === 'blocked') {
    return 'in_progress';
  } else if (current === 'in_progress') {
    return 'completed';
  } else {
    return 'pending';
  }
};

/**
 * Enforce transition rule across all subtasks in a list:
 * Guarantees transitionStatus >= nextStep.status
 */
export const enforceTransitionRuleOnSubtasks = (subtasks: SubTask[]): SubTask[] => {
  const sorted = [...subtasks].sort((a, b) => a.order - b.order);
  return sorted.map((st, idx) => {
    if (idx === sorted.length - 1) return st;
    const nextSt = sorted[idx + 1];
    const effectiveTransStatus = getTransitionEffectiveStatus(st, nextSt);
    if (st.transitionStatus !== effectiveTransStatus) {
      return {
        ...st,
        transitionStatus: effectiveTransStatus,
      };
    }
    return st;
  });
};
