import React, { useState } from 'react';
import { SubTask, SubTaskStatus, TeamMember } from '../types';
import { TransitionBridge } from './TransitionBridge';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Link2,
  FileSpreadsheet,
  FolderGit2,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface TaskPipelineProps {
  subtasks: SubTask[];
  teamMembers: TeamMember[];
  onUpdateSubtask: (subtaskId: string, updates: Partial<SubTask>) => void;
  onAddSubtask: () => void;
  onInsertSubtask?: (index: number) => void;
  onMoveSubtask?: (currentIndex: number, direction: 'earlier' | 'later') => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onOpenAttachment?: (subtask: SubTask, initialTab?: 'link' | 'image') => void;
  onViewImage?: (imageUrl: string, caption?: string) => void;
  readOnly?: boolean;
}

export const TaskPipeline: React.FC<TaskPipelineProps> = ({
  subtasks,
  teamMembers,
  onUpdateSubtask,
  onAddSubtask,
  onInsertSubtask,
  onMoveSubtask,
  onDeleteSubtask,
  onOpenAttachment,
  onViewImage,
  readOnly = false,
}) => {
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null);
  const [transitionInput, setTransitionInput] = useState('');
  const [activeSubtaskDetailsId, setActiveSubtaskDetailsId] = useState<string | null>(null);

  const getStatusIcon = (status: SubTaskStatus, index: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-white" />;
      case 'in_progress':
        return (
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex font-bold text-xs text-amber-900">{index + 1}</span>
          </span>
        );
      case 'blocked':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'pending':
      default:
        return <span className="text-xs font-bold text-stone-600">{index + 1}</span>;
    }
  };

  const getCircleClasses = (status: SubTaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-950 border-[3px] border-emerald-600 shadow-sm ring-2 ring-emerald-500/20';
      case 'in_progress':
        return 'bg-amber-50 text-amber-950 border-[3px] border-amber-500 shadow-md ring-4 ring-amber-400/30 animate-pulse';
      case 'blocked':
        return 'bg-red-50 text-red-900 border-[3px] border-red-500 shadow-sm ring-2 ring-red-400/20';
      case 'pending':
      default:
        return 'bg-white text-stone-900 border-[3px] border-sky-600 hover:border-sky-700 shadow-xs';
    }
  };

  const getLineClasses = (status: SubTaskStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'in_progress':
        return 'bg-gradient-to-l from-amber-400 to-emerald-500';
      case 'blocked':
        return 'bg-red-400 border-b border-dashed border-red-500';
      case 'pending':
      default:
        return 'bg-stone-200 border-b-2 border-dashed border-stone-300';
    }
  };

  const handleStatusCycle = (subtask: SubTask) => {
    if (readOnly) return;
    // Cycling allows direct toggle and undo from completed!
    const nextStatusMap: Record<SubTaskStatus, SubTaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending', // Reverts directly back to pending!
      blocked: 'pending',
    };
    const nextStatus = nextStatusMap[subtask.status];
    onUpdateSubtask(subtask.id, { 
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined 
    });
  };

  const handleUndoComplete = (subtask: SubTask) => {
    onUpdateSubtask(subtask.id, {
      status: 'pending',
      completedAt: undefined
    });
  };

  const handleSaveTransitionNote = (subtaskId: string) => {
    onUpdateSubtask(subtaskId, { transitionNote: transitionInput });
    setEditingTransitionId(null);
  };

  return (
    <div className="w-full">
      {/* Scrollable Container for Steps with horizontal flow */}
      <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100">
        <div className="flex items-start min-w-max px-2 py-3 gap-0">
          {subtasks.map((step, index) => {
            const assignedMember = teamMembers.find(m => m.id === step.assignedMemberId);
            const isLast = index === subtasks.length - 1;
            const isDetailsOpen = activeSubtaskDetailsId === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Step Node (Circle + Details Box) - Enlarged +15% on mobile to fit text perfectly */}
                <div className="flex flex-col items-center w-46 sm:w-54 shrink-0 relative group">
                  
                  {/* Step Order Header & Reorder Controls - NO "مهمة 1" or "الخطوة 1" prefix */}
                  <div className="flex items-center justify-between w-full px-2 mb-1.5">
                    {/* Move earlier in sequence (Right in RTL) */}
                    {!readOnly && onMoveSubtask ? (
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => onMoveSubtask(index, 'earlier')}
                        title="تقديم الخطوة للأمام في التسلسل"
                        className="p-1 text-stone-400 hover:text-amber-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-stone-100 rounded transition cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : <span className="w-5" />}

                    {/* Step number badge & status (اختصار في الكلام بدون كلمة مهمة 1 مهمة 2) */}
                    <div className="flex items-center gap-1">
                      <span className="w-4.5 h-4.5 rounded-full bg-stone-100 border border-stone-300 text-stone-700 text-[10px] font-mono font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      {step.status === 'in_progress' && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                          جاري الإنجاز
                        </span>
                      )}
                      {step.status === 'completed' && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                          تم الإنجاز
                        </span>
                      )}
                      {step.status === 'blocked' && (
                        <span className="bg-red-100 text-red-800 border border-red-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          متوقفة
                        </span>
                      )}
                    </div>

                    {/* Move later in sequence (Left in RTL) */}
                    {!readOnly && onMoveSubtask ? (
                      <button
                        type="button"
                        disabled={index === subtasks.length - 1}
                        onClick={() => onMoveSubtask(index, 'later')}
                        title="تأخير الخطوة للخلف في التسلسل"
                        className="p-1 text-stone-400 hover:text-amber-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-stone-100 rounded transition cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    ) : <span className="w-5" />}
                  </div>

                  {/* Interactive Circle Node - Enlarged +15% on mobile (w-[138px] h-[138px] sm:w-[155px] sm:h-[155px]) */}
                  {/* Displays ONLY task statement on 2 rows, text strictly inside without spilling */}
                  <button
                    id={`step-circle-${step.id}`}
                    type="button"
                    onClick={() => handleStatusCycle(step)}
                    title={`انقر لتعديل الحالة (جاري الإنجاز ➔ تم الإنجاز ➔ انتظار): الحالة الحالية ${step.status === 'completed' ? 'تم الإنجاز' : step.status === 'in_progress' ? 'جاري الإنجاز' : 'قيد الانتظار'}`}
                    disabled={readOnly}
                    className={`w-[138px] h-[138px] sm:w-[155px] sm:h-[155px] rounded-full flex flex-col items-center justify-center p-2 text-center transition-all duration-200 cursor-pointer transform group-hover:scale-105 active:scale-95 relative select-none shadow-xs z-10 overflow-hidden ${getCircleClasses(
                      step.status
                    )}`}
                  >
                    {/* ONLY Task Statement (بيان المهمة فقط) without 'مهمة 1' or 'مهمة 2' - on two lines max, never overflows */}
                    <div className="w-full flex items-center justify-center px-2 overflow-hidden">
                      <span 
                        className={`text-[12.5px] sm:text-[14px] font-black leading-snug line-clamp-2 break-words max-w-[94%] text-center select-none text-balance ${
                          step.status === 'completed' 
                            ? 'line-through text-emerald-950 font-bold' 
                            : step.status === 'in_progress' 
                            ? 'text-amber-950 font-black' 
                            : 'text-stone-900'
                        }`}
                        title={step.title}
                      >
                        {step.title}
                      </span>
                    </div>

                    {/* Quick status badge inside the circle */}
                    <div className="mt-1 flex items-center justify-center">
                      {step.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>تم الإنجاز</span>
                        </span>
                      ) : step.status === 'in_progress' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-950 bg-amber-200/95 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                          <span>جاري الإنجاز</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[9.5px] font-bold text-sky-800 bg-sky-100/80 border border-sky-300 px-2 py-0.5 rounded-full">
                          <span>بانتظار البدء</span>
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Direct 1-Click Status Modifier: "تعديل حالة المسار التسلسلي كالـ مهمة في حالة إنجازة أو في حالة جاري الإنجاز" */}
                  {!readOnly && (
                    <div className="mt-2 flex items-center justify-center gap-1 w-full px-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSubtask(step.id, { 
                            status: 'in_progress', 
                            completedAt: undefined 
                          });
                        }}
                        title="تحديد الخطوة كـ: جاري الإنجاز"
                        className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md border transition cursor-pointer flex-1 truncate ${
                          step.status === 'in_progress'
                            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs ring-1 ring-amber-400'
                            : 'bg-white hover:bg-amber-50 text-stone-600 border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        جاري الإنجاز ⚙️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSubtask(step.id, { 
                            status: 'completed', 
                            completedAt: new Date().toISOString() 
                          });
                        }}
                        title="تحديد الخطوة كـ: تم الإنجاز"
                        className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md border transition cursor-pointer flex-1 truncate ${
                          step.status === 'completed'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 text-stone-600 border-stone-200 hover:border-emerald-300'
                        }`}
                      >
                        تم الإنجاز ✅
                      </button>
                    </div>
                  )}

                  {/* Step Title & Details Card */}
                  <div className="w-full mt-2 px-1 text-center">
                    <h4 
                      onClick={() => setActiveSubtaskDetailsId(isDetailsOpen ? null : step.id)}
                      className="text-sm font-bold text-stone-800 hover:text-stone-950 cursor-pointer line-clamp-2 transition-colors duration-150 leading-snug break-words"
                      title={step.title}
                    >
                      {step.title}
                    </h4>

                    {/* Assigned Person Pill */}
                    {assignedMember ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-stone-100/90 hover:bg-stone-200/80 border border-stone-200/80 rounded-full py-0.5 px-2.5 text-xs text-stone-700 transition">
                        <span className={`w-2 h-2 rounded-full ${assignedMember.avatarColor || 'bg-amber-500'}`}></span>
                        <span className="font-medium text-stone-800 truncate max-w-[110px]">
                          {assignedMember.name}
                        </span>
                        <a 
                          href={`tel:${assignedMember.phone}`}
                          title={`اتصال: ${assignedMember.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-stone-400 hover:text-stone-700 p-0.5 transition"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="mt-1.5 inline-block text-[11px] text-stone-400 italic">
                        لم يحدد مسؤول
                      </span>
                    )}

                    {/* Status Dropdown/Selector & Undo Button */}
                    <div className="mt-2 flex flex-col items-center gap-1.5 w-full">
                      <div className="flex items-center justify-center gap-1 w-full">
                        <select
                          id={`step-status-${step.id}`}
                          value={step.status}
                          onChange={(e) => onUpdateSubtask(step.id, { 
                            status: e.target.value as SubTaskStatus,
                            completedAt: e.target.value === 'completed' ? new Date().toISOString() : undefined
                          })}
                          disabled={readOnly}
                          className={`text-[11px] font-semibold py-0.5 px-2 rounded-lg border cursor-pointer outline-none transition ${
                            step.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black'
                              : step.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-900 border-amber-300 font-black'
                              : step.status === 'blocked'
                              ? 'bg-red-50 text-red-800 border-red-300 font-bold'
                              : 'bg-stone-50 text-stone-600 border-stone-200'
                          }`}
                        >
                          <option value="pending">⏳ قيد الانتظار</option>
                          <option value="in_progress">⚙️ جاري الإنجاز</option>
                          <option value="completed">✅ تم الإنجاز</option>
                          <option value="blocked">⛔ معطلة / متوقفة</option>
                        </select>

                        {/* Edit details toggle button */}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => setActiveSubtaskDetailsId(isDetailsOpen ? null : step.id)}
                            title="تعديل تفاصيل الخطوة وترتيبها"
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Subtask Button */}
                        {!readOnly && subtasks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onDeleteSubtask(step.id)}
                            title="حذف هذه الخطوة"
                            className="text-stone-400 hover:text-red-600 p-1 transition rounded-md hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Prominent Undo Button when step is completed */}
                      {step.status === 'completed' && !readOnly && (
                        <button
                          type="button"
                          onClick={() => handleUndoComplete(step)}
                          className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-0.5 px-2 rounded-md flex items-center gap-1 transition cursor-pointer"
                          title="التراجع عن إكمال هذه الخطوة وإعادتها للانتظار"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>تراجع عن الإكمال</span>
                        </button>
                      )}
                    </div>

                    {/* Step Attached Image Thumbnail if present */}
                    {step.imageUrl && (
                      <div className="relative group/photo mt-2 w-full rounded-xl overflow-hidden border border-stone-200 shadow-2xs bg-stone-50">
                        <img
                          src={step.imageUrl}
                          alt={step.imageCaption || step.title}
                          onClick={() => onViewImage && onViewImage(step.imageUrl!, step.imageCaption || step.title)}
                          className="w-full h-18 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                          <button
                            type="button"
                            onClick={() => onViewImage && onViewImage(step.imageUrl!, step.imageCaption || step.title)}
                            className="p-1 bg-white/95 hover:bg-white text-stone-800 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-sm"
                            title="تكبير الصورة"
                          >
                            <ImageIcon className="w-3 h-3 text-blue-600" />
                            <span>تكبير</span>
                          </button>
                          {!readOnly && onOpenAttachment && (
                            <button
                              type="button"
                              onClick={() => onOpenAttachment(step, 'image')}
                              className="p-1 bg-white/95 hover:bg-white text-stone-800 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-sm"
                              title="تعديل أو استبدال الصورة"
                            >
                              <Edit2 className="w-3 h-3 text-amber-600" />
                              <span>تعديل</span>
                            </button>
                          )}
                        </div>
                        {step.imageCaption && (
                          <div className="text-[10px] text-stone-600 px-1.5 py-0.5 truncate bg-white/90 border-t border-stone-100 text-center font-medium">
                            {step.imageCaption}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Attached External Link if present */}
                    {step.externalLink && (
                      <div className="mt-1.5 flex items-center justify-between gap-1 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg px-2 py-1 text-[10px] font-bold w-full shadow-2xs">
                        <a
                          href={step.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate hover:underline flex-1"
                          title={step.externalLink}
                        >
                          {step.externalLink.includes('sheet') ? (
                            <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <Link2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          )}
                          <span className="truncate">{step.externalLinkLabel || 'مستند الخطوة'}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                        </a>
                        {!readOnly && onOpenAttachment && (
                          <button
                            type="button"
                            onClick={() => onOpenAttachment(step, 'link')}
                            className="p-0.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100 rounded cursor-pointer shrink-0"
                            title="تعديل رابط الخطوة"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Add Link or Image Quick Buttons if missing */}
                    {!readOnly && onOpenAttachment && (!step.externalLink || !step.imageUrl) && (
                      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
                        {!step.externalLink && (
                          <button
                            type="button"
                            onClick={() => onOpenAttachment(step, 'link')}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 px-1.5 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            title="إضافة رابط Google Sheets أو Drive لهذه الخطوة الفرعية"
                          >
                            <Link2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>+ رابط</span>
                          </button>
                        )}
                        {!step.imageUrl && (
                          <button
                            type="button"
                            onClick={() => onOpenAttachment(step, 'image')}
                            className="text-[10px] font-bold text-blue-800 bg-blue-50/90 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 px-1.5 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                            title="رفع أو ربط صورة خاصة بهذه الخطوة الفرعية"
                          >
                            <ImageIcon className="w-2.5 h-2.5 text-blue-600" />
                            <span>+ صورة</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Subtask Description if present */}
                    {step.description && (
                      <p className="mt-1.5 text-[11px] text-stone-500 line-clamp-2 px-1 text-right bg-stone-50/60 p-1.5 rounded border border-stone-100">
                        {step.description}
                      </p>
                    )}

                    {/* Expand/Collapse extra step editor */}
                    {!readOnly && isDetailsOpen && (
                      <div className="mt-2 text-right bg-white p-2.5 rounded-lg border border-stone-200 shadow-sm text-xs space-y-2">
                        {/* Reorder actions inside drawer */}
                        {onMoveSubtask && (
                          <div className="flex items-center justify-between pb-1 border-b border-stone-100 text-[11px]">
                            <span className="font-bold text-stone-600">ترتيب الخطوة في المسار:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => onMoveSubtask(index, 'earlier')}
                                className="px-2 py-0.5 rounded bg-stone-100 hover:bg-amber-100 text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-[10px] cursor-pointer"
                              >
                                تقديم الخطوة
                              </button>
                              <button
                                type="button"
                                disabled={index === subtasks.length - 1}
                                onClick={() => onMoveSubtask(index, 'later')}
                                className="px-2 py-0.5 rounded bg-stone-100 hover:bg-amber-100 text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-[10px] cursor-pointer"
                              >
                                تأخير الخطوة
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] text-stone-500 font-semibold mb-1">
                            تعديل اسم الخطوة:
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => onUpdateSubtask(step.id, { title: e.target.value })}
                            className="w-full border border-stone-300 rounded px-2 py-1 text-xs text-stone-800 focus:border-amber-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-500 font-semibold mb-1">
                            المسؤول المباشر:
                          </label>
                          <select
                            value={step.assignedMemberId}
                            onChange={(e) => onUpdateSubtask(step.id, { assignedMemberId: e.target.value })}
                            className="w-full border border-stone-300 rounded px-2 py-1 text-xs text-stone-800 bg-white"
                          >
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.role})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-500 font-semibold mb-1">
                            تفاصيل وملاحظات إضافية:
                          </label>
                          <textarea
                            rows={2}
                            value={step.description || ''}
                            onChange={(e) => onUpdateSubtask(step.id, { description: e.target.value })}
                            placeholder="ملاحظات الموقع ومواصفات الكود..."
                            className="w-full border border-stone-300 rounded px-2 py-1 text-xs text-stone-800"
                          />
                        </div>

                        {onOpenAttachment && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubtaskDetailsId(null);
                              onOpenAttachment(step);
                            }}
                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded py-1 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>إدارة الروابط والصور للخطوة</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveSubtaskDetailsId(null)}
                          className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded py-1 text-xs font-medium cursor-pointer"
                        >
                          حفظ وإغلاق التفاصيل
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transition Path Bridge ("مسار الانتقال") hugging adjacent circles as in user diagram */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center shrink-0 self-start pt-14 sm:pt-16 -mx-3 sm:-mx-4 z-0">
                    {editingTransitionId === step.id ? (
                      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border-2 border-sky-400 shadow-lg z-20">
                        <input
                          type="text"
                          value={transitionInput}
                          onChange={(e) => setTransitionInput(e.target.value)}
                          placeholder="ملاحظة أو شرط مسار الانتقال..."
                          className="text-xs w-28 sm:w-36 px-2 py-1 border border-stone-200 rounded-lg outline-none font-bold text-stone-800"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTransitionNote(step.id)}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveTransitionNote(step.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-lg cursor-pointer"
                          title="حفظ"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center group/trans">
                        <TransitionBridge
                          note={step.transitionNote}
                          isCompleted={step.status === 'completed'}
                          isActive={step.status === 'in_progress'}
                          onClick={() => {
                            if (readOnly) return;
                            setTransitionInput(step.transitionNote || '');
                            setEditingTransitionId(step.id);
                          }}
                          size="normal"
                        />
                        {!readOnly && onInsertSubtask && (
                          <button
                            type="button"
                            onClick={() => onInsertSubtask(index + 1)}
                            title="إدراج خطوة فرعية جديدة في هذا الموضع"
                            className="mt-1 text-[9.5px] font-bold text-sky-700 hover:text-sky-950 flex items-center gap-0.5 cursor-pointer opacity-40 group-hover/trans:opacity-100 transition"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>إدراج خطوة</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Add Another Subtask Node: Horizontal Line connecting to (+) circle as in user diagram */}
          {!readOnly && (
            <div className="flex items-center shrink-0 self-start pt-13 sm:pt-15 z-10 -mr-2.5 sm:-mr-3.5">
              {/* Horizontal Line connecting to (+) circle */}
              <div className="w-5 sm:w-7 h-1 bg-sky-500 rounded-full shrink-0 -ml-0.5" />

              {/* The Circle with (+) inside - Enlarged +15% */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <button
                  id="btn-add-subtask-pipeline"
                  type="button"
                  onClick={onAddSubtask}
                  title="إضافة مهمة فرعية جديدة للسلسلة"
                  className="w-21 h-21 sm:w-24 sm:h-24 rounded-full border-[3px] border-sky-600 hover:border-sky-700 bg-white hover:bg-sky-50 text-sky-600 hover:text-sky-700 flex items-center justify-center transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-xs cursor-pointer group"
                >
                  <Plus className="w-8 h-8 stroke-[3] text-sky-600 group-hover:rotate-90 transition-transform duration-200" />
                </button>
                <span className="mt-1.5 text-[11px] font-black text-sky-900 text-center">
                  إضافة خطوة
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend & Quick Hint */}
      <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 mt-2 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            مكتملة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            قيد العمل
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            معطلة / متوقفة
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
            معلقة
          </span>
        </div>
        <span className="text-[11px] text-stone-400">
          💡 يمكنك النقر على الدائرة لتغيير حالتها، أو النقر على الخط لكتابة الملاحظة الفاصلة
        </span>
      </div>
    </div>
  );
};
