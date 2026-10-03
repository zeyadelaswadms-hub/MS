import React from 'react';

interface TransitionBridgeProps {
  note?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  size?: 'normal' | 'compact';
}

export const TransitionBridge: React.FC<TransitionBridgeProps> = ({
  note,
  isCompleted = false,
  isActive = false,
  onClick,
  size = 'normal',
}) => {
  const isCompact = size === 'compact';

  // Dimensions: Height is strictly less than circle diameter (approx 58-60% of circle height)
  // Enlarge by 15% on mobile and responsive to fit text comfortably
  // Compact: Height 42px (up from 36px), Width 60px (up from 52px)
  // Normal: Height 75px (up from 65px), Width 98px (up from 84px)
  const width = isCompact ? 60 : 98;
  const height = isCompact ? 42 : 75;

  // Colors matching blueprint diagram
  const strokeColor = isCompleted
    ? '#059669' // emerald-600
    : isActive
    ? '#d97706' // amber-600
    : '#0284c7'; // sky-600

  const fillColor = isCompleted
    ? '#ecfdf5' // emerald-50
    : isActive
    ? '#fffbeb' // amber-50
    : '#f0f9ff'; // sky-50

  const textColor = isCompleted
    ? 'text-emerald-900'
    : isActive
    ? 'text-amber-950'
    : 'text-sky-900';

  // Helper to split any custom note into exactly two lines
  const splitNoteIntoTwoLines = (text: string) => {
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/);
    if (words.length <= 1) {
      if (trimmed.length > 7) {
        return { line1: trimmed.slice(0, 6), line2: trimmed.slice(6) };
      }
      return { line1: trimmed, line2: '' };
    }
    const mid = Math.ceil(words.length / 2);
    return {
      line1: words.slice(0, mid).join(' '),
      line2: words.slice(mid).join(' '),
    };
  };

  const parsedNote = note ? splitNoteIntoTwoLines(note) : null;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none group cursor-pointer transition-transform duration-150 z-0 ${
        isCompact ? '-mx-2 sm:-mx-2.5' : '-mx-3 sm:-mx-4 hover:scale-105'
      }`}
      title={note ? `مسار الانتقال: ${note}` : 'مسار الانتقال (انقر لتعديل الملاحظة أو الشرط)'}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Concave Waist SVG hugging adjacent circle edges with border-thickness clearance */}
      <svg
        viewBox="0 0 80 50"
        className="w-full h-full drop-shadow-2xs"
        preserveAspectRatio="none"
      >
        <path
          d="M 17 3 
             Q 40 0.5 63 3 
             Q 66 4 66 7 
             A 23 23 0 0 0 66 43 
             Q 66 46 63 47 
             Q 40 49.5 17 47 
             Q 14 46 14 43 
             A 23 23 0 0 0 14 7 
             Q 14 4 17 3 Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={isCompact ? 2.25 : 2.75}
          strokeLinejoin="round"
          className="transition-colors duration-200"
        />
      </svg>

      {/* Text Inside: STRICTLY on 2 separate rows so it never spills outside the shape */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1 text-center font-bold overflow-hidden ${textColor}`}>
        {parsedNote ? (
          <div className="flex flex-col items-center justify-center leading-none select-none max-w-[82%] overflow-hidden">
            <span
              className={`font-black truncate max-w-full leading-none ${
                isCompact ? 'text-[7.5px]' : 'text-[10px]'
              }`}
            >
              {parsedNote.line1}
            </span>
            {parsedNote.line2 && (
              <span
                className={`font-black truncate max-w-full leading-none mt-0.5 ${
                  isCompact ? 'text-[7px]' : 'text-[9.5px]'
                }`}
              >
                {parsedNote.line2}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center leading-none select-none">
            <span className={`${isCompact ? 'text-[8.5px]' : 'text-[11.5px]'} font-black tracking-tight leading-none`}>
              مسار
            </span>
            <span className={`${isCompact ? 'text-[8.5px]' : 'text-[11.5px]'} font-black tracking-tight leading-none mt-0.5`}>
              الانتقال
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

