import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  caption?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="p-4 bg-stone-950/80 flex items-center justify-between text-white border-b border-stone-800">
          <span className="text-xs sm:text-sm font-bold text-stone-200 truncate max-w-md">
            {caption || 'معاينة الصورة المرفقة'}
          </span>
          <div className="flex items-center gap-2">
            {!imageUrl.startsWith('data:') && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition"
                title="فتح الرابط الأصلي"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image content */}
        <div className="p-2 sm:p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-100px)]">
          <img
            src={imageUrl}
            alt={caption || 'Attached image'}
            className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg"
          />
        </div>

        {caption && (
          <div className="p-3 bg-stone-950/90 text-center text-xs text-stone-300 border-t border-stone-800 font-semibold">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};
