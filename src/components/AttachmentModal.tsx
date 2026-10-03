import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Link2, 
  FileSpreadsheet, 
  FolderGit2, 
  ExternalLink, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  FileText,
  Check,
  Eye
} from 'lucide-react';
import { Task, SubTask } from '../types';

export interface AttachmentTarget {
  type: 'task' | 'subtask';
  taskId: string;
  subtaskId?: string;
  title: string;
  externalLink?: string;
  externalLinkLabel?: string;
  imageUrl?: string;
  imageCaption?: string;
  initialTab?: 'link' | 'image';
}

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: AttachmentTarget | null;
  onSave: (target: AttachmentTarget, data: {
    externalLink?: string;
    externalLinkLabel?: string;
    imageUrl?: string;
    imageCaption?: string;
  }) => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  isOpen,
  onClose,
  target,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'image'>('link');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (target) {
      setUrl(target.externalLink || '');
      setLabel(target.externalLinkLabel || '');
      setImageUrl(target.imageUrl || '');
      setImageCaption(target.imageCaption || '');
      if (target.initialTab) {
        setActiveTab(target.initialTab);
      } else if (!target.externalLink && target.imageUrl) {
        setActiveTab('image');
      } else {
        setActiveTab('link');
      }
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const handleApplyPreset = (type: 'sheets' | 'drive' | 'custom') => {
    if (type === 'sheets') {
      if (!url) setUrl('https://docs.google.com/spreadsheets/d/');
      setLabel('شيت كميات وتكاليف (Google Sheets)');
    } else if (type === 'drive') {
      if (!url) setUrl('https://drive.google.com/drive/folders/');
      setLabel('مجلد المخططات الإنشائية (Google Drive)');
    } else if (type === 'custom') {
      setLabel('مستند أو صفحة الويب للمهمة');
    }
  };

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageUrl(e.target.result as string);
          if (!imageCaption) {
            setImageCaption(file.name.replace(/\.[^/.]+$/, ''));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    let formattedUrl = cleanUrl ? cleanUrl : undefined;
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const formattedLabel = formattedUrl ? (label.trim() || 'رابط المستند') : undefined;
    const cleanImageUrl = imageUrl.trim() || undefined;
    const cleanImageCaption = cleanImageUrl ? (imageCaption.trim() || 'صورة مرفقة') : undefined;

    onSave(target, {
      externalLink: formattedUrl,
      externalLinkLabel: formattedLabel,
      imageUrl: cleanImageUrl,
      imageCaption: cleanImageCaption,
    });
    onClose();
  };

  const handleRemoveLink = () => {
    setUrl('');
    setLabel('');
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageCaption('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              {activeTab === 'link' ? <Link2 className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                إدارة المرفقات (روابط وصور)
              </h3>
              <p className="text-[11px] text-stone-400 line-clamp-1">
                {target.type === 'subtask' ? 'خطوة فرعية: ' : 'مهمة رئيسية: '}
                <strong className="text-white">{target.title}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Link vs Image */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'link'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>رابط خارجي (Google Sheets / Drive)</span>
            {url && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`pb-2.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'image'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>صورة أو مخطط للموقع</span>
            {imageUrl && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSaveAll} className="p-5 space-y-4">
          
          {/* TAB 1: EXTERNAL LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  نوع الرابط النموذجي السريع:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('sheets')}
                    className="p-2 border rounded-xl flex flex-col items-center gap-1 text-center transition cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 bg-stone-50 border-stone-200"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span className="text-[11px] font-bold text-stone-800">Google Sheets</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('drive')}
                    className="p-2 border rounded-xl flex flex-col items-center gap-1 text-center transition cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 bg-stone-50 border-stone-200"
                  >
                    <FolderGit2 className="w-5 h-5 text-blue-600" />
                    <span className="text-[11px] font-bold text-stone-800">Google Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('custom')}
                    className="p-2 border rounded-xl flex flex-col items-center gap-1 text-center transition cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 bg-stone-50 border-stone-200"
                  >
                    <Link2 className="w-5 h-5 text-amber-600" />
                    <span className="text-[11px] font-bold text-stone-800">رابط ويب آخر</span>
                  </button>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  رابط الصفحة أو المستند (URL):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-mono focus:border-amber-500 focus:bg-white outline-none"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={handleRemoveLink}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-600 p-1"
                      title="مسح الرابط"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Label Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  اسم أو وصف الرابط (يظهر للفريق):
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="مثال: شيت الكميات، مخطط التسليح، موافقة الاستشاري"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold focus:border-amber-500 focus:bg-white outline-none"
                />
              </div>

              {url && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-amber-900 truncate">الرابط جاهز للحفظ</span>
                  </div>
                  <a
                    href={url.startsWith('http') ? url : `https://${url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 hover:underline flex items-center gap-1 font-bold shrink-0"
                  >
                    <span>تجربة الفتح</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMAGE ATTACHMENT */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رفع صورة من الجهاز أو الجوال:
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    dragActive 
                      ? 'border-amber-500 bg-amber-50' 
                      : imageUrl 
                      ? 'border-emerald-300 bg-emerald-50/40' 
                      : 'border-stone-300 hover:border-amber-500 hover:bg-stone-50'
                  }`}
                >
                  <Upload className="w-6 h-6 text-stone-400" />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">
                      انقر لاختيار صورة من جهازك، أو اسحب الصورة هنا
                    </span>
                    <span className="text-[10px] text-stone-400">
                      يدعم صور الموقع، صور المخططات، فواتير الاستلام (PNG, JPG, WebP)
                    </span>
                  </div>
                </div>
              </div>

              {/* Or paste Image URL */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  أو أدخل رابط الصورة المباشر:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={imageUrl.startsWith('data:') ? 'تم تحميل ملف محلي' : imageUrl}
                  disabled={imageUrl.startsWith('data:')}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-mono focus:border-amber-500 focus:bg-white outline-none"
                />
              </div>

              {/* Image Preview & Caption */}
              {imageUrl && (
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                  <div className="relative rounded-xl overflow-hidden max-h-48 flex items-center justify-center bg-stone-900 border border-stone-300">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-48 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow transition"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      وصف / تعليق على الصورة:
                    </label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      placeholder="مثال: فحص جودة الخرسانة بالموقع، كروكي التعديل"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-semibold focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ المرفقات</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
