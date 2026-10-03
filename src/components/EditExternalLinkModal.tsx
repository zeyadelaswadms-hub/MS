import React, { useState, useEffect } from 'react';
import { X, Link2, FileSpreadsheet, FolderGit2, ExternalLink, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface EditExternalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSaveLink: (taskId: string, link: string | undefined, label: string | undefined) => void;
}

export const EditExternalLinkModal: React.FC<EditExternalLinkModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveLink,
}) => {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [presetType, setPresetType] = useState<'sheets' | 'drive' | 'custom'>('sheets');

  useEffect(() => {
    if (task) {
      setUrl(task.externalLink || '');
      setLabel(task.externalLinkLabel || '');
      if (task.externalLink?.includes('spreadsheets') || task.externalLink?.includes('sheet')) {
        setPresetType('sheets');
      } else if (task.externalLink?.includes('drive.google')) {
        setPresetType('drive');
      } else {
        setPresetType('custom');
      }
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleApplyPreset = (type: 'sheets' | 'drive' | 'custom') => {
    setPresetType(type);
    if (type === 'sheets' && !label) {
      setLabel('شيت حصر الكميات والتكاليف (Google Sheets)');
    } else if (type === 'drive' && !label) {
      setLabel('مجلد المخططات الإنشائية والمعمارية (Google Drive)');
    } else if (type === 'custom' && !label) {
      setLabel('مستند أو صفحة الويب للمهمة');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      onSaveLink(task.id, undefined, undefined);
    } else {
      // Ensure URL has protocol
      const formattedUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') 
        ? cleanUrl 
        : `https://${cleanUrl}`;
      
      const formattedLabel = label.trim() || (
        formattedUrl.includes('spreadsheets') 
          ? 'جدول كميات Google Sheets' 
          : formattedUrl.includes('drive.google') 
          ? 'مجلد Google Drive' 
          : 'رابط صفحة الويب للمهمة'
      );

      onSaveLink(task.id, formattedUrl, formattedLabel);
    }
    onClose();
  };

  const handleRemove = () => {
    onSaveLink(task.id, undefined, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">إضافة أو تعديل رابط صفحة ويب</h3>
              <p className="text-[11px] text-stone-400 line-clamp-1">{task.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
          
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">نوع المستند أو الرابط الخارجي</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('sheets')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition text-center cursor-pointer ${
                  presetType === 'sheets'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span className="text-[11px]">Google Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('drive')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition text-center cursor-pointer ${
                  presetType === 'drive'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <FolderGit2 className="w-5 h-5 text-blue-600" />
                <span className="text-[11px]">Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('custom')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition text-center cursor-pointer ${
                  presetType === 'custom'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-500'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <ExternalLink className="w-5 h-5 text-amber-600" />
                <span className="text-[11px]">رابط مخصص</span>
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              رابط الويب (URL) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={
                  presetType === 'sheets' 
                    ? 'https://docs.google.com/spreadsheets/d/...' 
                    : presetType === 'drive'
                    ? 'https://drive.google.com/drive/folders/...'
                    : 'https://example.com/...'
                }
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                dir="ltr"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs font-mono focus:border-amber-600 focus:bg-white outline-none"
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              يمكنك لصق رابط شيت الإكسل، مجلد جوجل درايف، أو المخططات لمشاركتها مباشرة مع الفريق.
            </p>
          </div>

          {/* Label Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              عنوان أو وصف الرابط (يظهر بالزر)
            </label>
            <input
              type="text"
              placeholder="مثال: شيت حصر كميات الخرسانة، أو مخططات التسليح"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:border-amber-600 focus:bg-white outline-none font-semibold"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200">
            {task.externalLink ? (
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الرابط</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                حفظ الرابط
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
