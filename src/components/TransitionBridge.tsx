import React, { useRef, useState } from 'react';
import { SubTaskStatus } from '../types';

interface TransitionBridgeProps {
  note?: string;
  status?: SubTaskStatus;
  isCompleted?: boolean;
  isActive?: boolean;
  onCycleStatus?: () => void;
  onOpenDetails?: () => void;
  onClick?: () => void; // fallback
  size?: 'normal' | 'compact';
}

export const TransitionBridge: React.FC<TransitionBridgeProps> = ({
  note,
  status,
  isCompleted = false,
  isActive = false,
  onCycleStatus,
  onOpenDetails,
  onClick,
  size = 'compact',
}) => {
  const isCompact = size === 'compact';
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const isMovedOrScrollingRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchActiveRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  // Derive effective status
  const effectiveStatus: SubTaskStatus = status 
    ? status 
    : isCompleted 
    ? 'completed' 
    : isActive 
    ? 'in_progress' 
    : 'pending';

  const isDone = effectiveStatus === 'completed';
  const isOngoing = effectiveStatus === 'in_progress';
  const isBlocked = effectiveStatus === 'blocked';

  // Mobile Touch Handlers: strictly distinguishes between scrolling and tapping
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchActiveRef.current = true;
    isLongPressRef.current = false;
    isMovedOrScrollingRef.current = false;

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    setIsPressing(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Fire long press ONLY if finger has not moved/scrolled
      if (!isMovedOrScrollingRef.current) {
        isLongPressRef.current = true;
        setIsPressing(false);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(50);
          } catch (_) {}
        }
        if (onOpenDetails) {
          onOpenDetails();
        } else if (onClick) {
          onClick();
        }
      }
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // If movement exceeds 6px, it is a scroll/swipe gesture: cancel all tap actions!
    if (dx > 6 || dy > 6) {
      isMovedOrScrollingRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPressing(false);
    }
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);

    // If finger moved or scrolled across steps, IGNORE completely!
    if (isMovedOrScrollingRef.current) {
      touchStartPosRef.current = null;
      return;
    }

    // If long-press details dialog already opened, do not cycle status
    if (isLongPressRef.current) {
      touchStartPosRef.current = null;
      return;
    }

    // Genuine stationary single tap in place: cycle status
    touchStartPosRef.current = null;
    if (onCycleStatus) {
      onCycleStatus();
    } else if (onClick) {
      onClick();
    }
  };

  const handleTouchCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isMovedOrScrollingRef.current = true;
    setIsPressing(false);
    touchStartPosRef.current = null;
  };

  // Mouse Handlers for Desktop Only
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTouchActiveRef.current) return;
    if (e.button !== 0) return;
    isLongPressRef.current = false;
    isMovedOrScrollingRef.current = false;
    setIsPressing(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressing(false);
      if (onOpenDetails) {
        onOpenDetails();
      } else if (onClick) {
        onClick();
      }
    }, 450);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isTouchActiveRef.current) {
      setTimeout(() => { isTouchActiveRef.current = false; }, 400);
      return;
    }
    if (e.button !== 0) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);

    if (!isLongPressRef.current && !isMovedOrScrollingRef.current) {
      if (onCycleStatus) {
        onCycleStatus();
      } else if (onClick) {
        onClick();
      }
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
    isMovedOrScrollingRef.current = true;
  };

  // Dimensions: comfortable width & height
  const width = isCompact ? 64 : 96;
  const height = isCompact ? 46 : 68;

  // Colors matching dark teal theme
  const strokeColor = isDone
    ? '#059669' // emerald-600
    : isOngoing
    ? '#0891b2' // cyan-600
    : isBlocked
    ? '#e11d48' // rose-600
    : '#1e4352'; // slate-teal

  const fillColor = isDone
    ? '#0c2e23' // dark emerald
    : isOngoing
    ? '#0d2d38' // dark cyan
    : isBlocked
    ? '#3b151b' // dark rose
    : '#13232b'; // dark slate-teal

  const textColor = isDone
    ? 'text-emerald-300'
    : isOngoing
    ? 'text-cyan-200'
    : isBlocked
    ? 'text-rose-300'
    : 'text-slate-200';

  // Helper to split custom note into 1 or 2 short lines so it stays inside
  const formatNote = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const words = trimmed.split(/\s+/);
    if (words.length === 1) {
      if (trimmed.length > 7) {
        return { line1: trimmed.slice(0, 6) + '..', line2: '' };
      }
      return { line1: trimmed, line2: '' };
    }
    const mid = Math.ceil(words.length / 2);
    return {
      line1: words.slice(0, mid).join(' '),
      line2: words.slice(mid).join(' '),
    };
  };

  const parsedNote = note ? formatNote(note) : null;
  const statusLabel = isDone 
    ? 'مكتمل ✅' 
    : isOngoing 
    ? 'قيد التنفيذ ⚙️' 
    : isBlocked 
    ? 'معطل ⛔' 
    : 'في الانتظار ⏳';

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onOpenDetails) onOpenDetails();
      }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none group cursor-pointer transition-transform duration-150 z-0 ${
        isCompact ? '-mx-2 sm:-mx-2.5' : '-mx-3 sm:-mx-3.5'
      } ${isPressing ? 'scale-90' : 'hover:scale-105 active:scale-95'}`}
      title={`مسار الانتقال: ${note || 'المسار التتابعي للاعتماد'}\nالحالة: ${statusLabel}\n(نقرة واحدة لتغيير الحالة • اضغط مطولاً للتعديل والتفاصيل)`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Concave Waist SVG hugging adjacent circle edges */}
      <svg
        viewBox="0 0 80 50"
        className={`w-full h-full drop-shadow-2xs overflow-visible ${isOngoing ? 'animate-pulse' : ''}`}
        preserveAspectRatio="none"
      >
        <path
          d="M 17 3 
             Q 40 1 63 3 
             Q 66 4 66 7 
             A 23 23 0 0 0 66 43 
             Q 66 46 63 47 
             Q 40 49 17 47 
             Q 14 46 14 43 
             A 23 23 0 0 0 14 7 
             Q 14 4 17 3 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isOngoing ? 3 : isCompact ? 2.5 : 2.8}
          strokeLinejoin="round"
          className="transition-colors duration-200"
        />
      </svg>

      {/* Text strictly contained inside the inner waist zone - NEVER spills outside */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${textColor}`}>
        <div className="w-[52%] max-w-[54%] max-h-[72%] flex flex-col items-center justify-center text-center overflow-hidden px-0.5">
          {parsedNote ? (
            <div className="flex flex-col items-center justify-center leading-tight select-none w-full overflow-hidden">
              <span
                className={`font-black truncate w-full block text-center leading-none ${
                  isCompact ? 'text-[7.5px]' : 'text-[9.5px]'
                }`}
              >
                {parsedNote.line1}
              </span>
              {parsedNote.line2 && (
                <span
                  className={`font-black truncate w-full block text-center leading-none mt-0.5 ${
                    isCompact ? 'text-[7px]' : 'text-[9px]'
                  }`}
                >
                  {parsedNote.line2}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center leading-none select-none w-full">
              <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-black tracking-tight leading-none text-center block`}>
                مسار
              </span>
              <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} font-black tracking-tight leading-none mt-0.5 text-center block`}>
                الانتقال
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
