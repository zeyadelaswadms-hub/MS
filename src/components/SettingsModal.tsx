import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Sparkles, 
  KeyRound, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  MessageCircle,
  Smartphone,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdvice: () => void;
  onResetData: () => void;
  onClearData?: () => void;
  onExportBackup?: () => void;
  customWhatsAppTemplate: string;
  onSaveWhatsAppTemplate: (template: string) => void;
}

export const DEFAULT_WHATSAPP_TEMPLATE = `سلام عليكم م. {name}
بالنسبة للمهام والخطوات المتوقفة وبانتظاركم:
{tasks_list}
شاكرين لكم ومقدرين سرعة الإنجاز والمتابعة.
شركة محمد سعد لأعمال المرافق والإنشاءات`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAdvice,
  onResetData,
  onClearData,
  customWhatsAppTemplate,
  onSaveWhatsAppTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'android' | 'security' | 'advice'>('whatsapp');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState<string>(() => {
    return localStorage.getItem('bunyan_reset_password') || '1234';
  });
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

  // Reset confirmation state
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [resetActionType, setResetActionType] = useState<'restore_demo' | 'clear_fresh'>('clear_fresh');
  const [enteredResetPassword, setEnteredResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);

  // WhatsApp template local state
  const [tempWhatsAppTemplate, setTempWhatsAppTemplate] = useState(customWhatsAppTemplate);
  const [templateSavedToast, setTemplateSavedToast] = useState(false);

  // PWA install prompt support
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedPw = localStorage.getItem('bunyan_reset_password') || '1234';
      setCurrentPassword(savedPw);
      setIsResetConfirming(false);
      setEnteredResetPassword('');
      setResetError(null);
      setShowPasswordSuccess(false);
      setTempWhatsAppTemplate(customWhatsAppTemplate);
    }
  }, [isOpen, customWhatsAppTemplate]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) return;

    const trimmed = newPasswordInput.trim();
    localStorage.setItem('bunyan_reset_password', trimmed);
    setCurrentPassword(trimmed);
    setNewPasswordInput('');
    setShowPasswordSuccess(true);
    setTimeout(() => setShowPasswordSuccess(false), 3000);
  };

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (enteredResetPassword !== currentPassword) {
      setResetError('كلمة المرور غير صحيحة، يرجى إدخال كلمة المرور المحددة بالإعدادات.');
      return;
    }

    if (resetActionType === 'clear_fresh') {
      if (onClearData) {
        onClearData();
      } else {
        onResetData();
      }
    } else {
      onResetData();
    }
    setIsResetConfirming(false);
    setEnteredResetPassword('');
    onClose();
  };

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWhatsAppTemplate(tempWhatsAppTemplate);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  const handleResetTemplate = () => {
    setTempWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    onSaveWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    setTemplateSavedToast(true);
    setTimeout(() => setTemplateSavedToast(false), 3000);
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('لتثبيت التطبيق على الموبايل:\n1. افتح متصفح Chrome على هاتفك.\n2. اضغط على أيقونة الثلاث نقاط (⁝) أعلى الشاشة.\n3. اضغط على "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".\nسيعمل التطبيق بكامل الشاشة وبشعار شركة محمد سعد كبرنامج حقيقي!');
    }
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Preview rendering
  const previewMessage = tempWhatsAppTemplate
    .replace('{name}', 'أحمد محمود')
    .replace('{tasks_list}', '• بالنسبة لمشروع محطة صرف التجمع:\n  - مهمة: حفر خط الطرد (خطوة: اعتماد مقايسة الدفان)\n• بالنسبة لمشروع شبكات مياه الشروق:\n  - مهمة: توريد محابس القفل (خطوة: فحص العينات الميدانية)');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-6 text-white flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#088395]/20 border border-cyan-400/30 flex items-center justify-center text-[#22d3ee]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">إعدادات المنظومة والربط</h2>
              <p className="text-xs text-slate-400">تخصيص رسائل الواتساب، نسخة الموبايل وAPK، والأمان</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-[#0d181e] border-b border-[#182c35] text-xs font-bold overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'whatsapp' 
                ? 'bg-[#088395] text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-[#152731]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>رسائل الواتساب والتنبيهات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'android' 
                ? 'bg-[#088395] text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-[#152731]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-300" />
            <span>تطبيق الأندرويد ونسخة APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'security' 
                ? 'bg-[#088395] text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-[#152731]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>الأمان وإدارة البيانات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advice')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'advice' 
                ? 'bg-[#088395] text-white shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-[#152731]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>دليل المنصات</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* TAB 1: WhatsApp Message Customizer */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-[#101c22] border border-[#1b3440] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">
                      تعديل صيغة رسالة الواتساب وتنبيه المهام المتوقفة
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    استعادة الصيغة الافتراضية
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تُستخدم هذه الصيغة عند الضغط على زر <strong className="text-white">"تنبيه شامل بكل المهام المتوقفة عبر واتساب"</strong> لأي مهندس أو عضو فريق. يقوم النظام تلقائياً بتجميع كافة المهام والخطوات المتوقفة عليه وتنسيقها تحت كل مشروع.
                </p>

                <div className="bg-[#0b1419] p-2.5 rounded-xl border border-[#1c3542] text-[11px] text-slate-400 space-y-1">
                  <span className="font-bold text-cyan-300 block">الرموز التلقائية المدعومة:</span>
                  <div><code className="bg-[#182c35] text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[10px]" dir="ltr">{'{name}'}</code>: يتم استبدالها باسم المهندس أو عضو الفريق.</div>
                  <div><code className="bg-[#182c35] text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[10px]" dir="ltr">{'{tasks_list}'}</code>: يتم استبدالها بقائمة المهام والخطوات مفصلة حسب كل مشروع.</div>
                </div>

                <form onSubmit={handleSaveTemplateSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      صيغة نص الرسالة:
                    </label>
                    <textarea
                      rows={5}
                      value={tempWhatsAppTemplate}
                      onChange={(e) => setTempWhatsAppTemplate(e.target.value)}
                      className="w-full bg-[#182c35] border border-[#234250] rounded-xl p-3 text-xs text-white focus:border-[#22d3ee] outline-none leading-relaxed font-sans"
                      placeholder="اكتب صيغة الرسالة..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حفظ صيغة الرسالة</span>
                    </button>

                    {templateSavedToast && (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        تم حفظ الصيغة بنجاح!
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Message Live Preview */}
              <div className="bg-[#0c1a17] border border-[#134336] rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 block flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  معاينة حية لشكل الرسالة عند إرسالها للمهندس:
                </span>
                <div className="bg-[#0f2820] p-3 rounded-xl border border-emerald-900/50 text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {previewMessage}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android App & APK Guide */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="bg-[#101c22] border border-[#1b3440] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      استخدام التطبيق على الأندرويد والحصول على APK
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      التطبيق مهيأ بالكامل للعمل كتطبيق هاتف رسمي بأيقونة شركة محمد سعد
                    </p>
                  </div>
                </div>

                {/* Option 1: Direct PWA Install on Mobile */}
                <div className="bg-[#0e2a36] border border-[#175468] rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#22d3ee] text-[#0b141a] text-[10px] font-black px-2 py-0.5 rounded-full">
                          الخيار الأسرع والأنسب
                        </span>
                        <h4 className="font-bold text-white text-xs sm:text-sm">
                          1. تثبيت التطبيق مباشرة على شاشة الهاتف (PWA)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        يعمل التطبيق كبرنامج مثبت تماماً وبدون شريط عنوان المتصفح (Standalone)، بأيقونة المنظومة واسم "محمد سعد".
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleInstallApp}
                      className="px-4 py-2 bg-[#22d3ee] hover:bg-[#06b6d4] active:scale-95 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>تثبيت الآن</span>
                    </button>
                  </div>

                  <div className="bg-[#0b171d] p-3 rounded-xl border border-[#1c3846] text-[11px] text-slate-300 space-y-1.5">
                    <div className="font-bold text-cyan-300">خطوات التثبيت من الهاتف عبر Google Chrome:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>افتح رابط التطبيق في متصفح <strong className="text-white">Chrome</strong> على هاتفك الأندرويد.</li>
                      <li>اضغط على قائمة الثلاث نقاط (<strong className="text-white">⁝</strong>) بأعلى زاوية المتصفح.</li>
                      <li>اختر <strong className="text-emerald-400">"تثبيت التطبيق" (Install app)</strong> أو <strong className="text-emerald-400">"إضافة إلى الشاشة الرئيسية"</strong>.</li>
                      <li>سيظهر التطبيق فوراً في قائمة تطبيقات هاتفك وشاشتك الرئيسية كأي برنامج أصلي.</li>
                    </ol>
                  </div>
                </div>

                {/* Option 2: Generating APK */}
                <div className="bg-[#18232c] border border-[#253947] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      لملف APK منفصل
                    </span>
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      2. تحويل الرابط واستخراج ملف APK للأندرويد
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    نظراً لأن التطبيق مبني كـ Progressive Web App متكامل ومجهز بـ <code className="bg-[#0f1920] px-1 py-0.5 text-cyan-300 rounded font-mono">manifest.json</code> وشعار المنظومة، يمكنك استخراج ملف <strong className="text-white">APK رسمي قابل للتثبيت</strong> خلال دقيقتين عبر أداة مايكروسوفت الرسمية المعتمدة <strong>PWABuilder</strong>:
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <div className="w-full sm:flex-1 bg-[#0f1920] border border-[#233845] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate" dir="ltr">
                      {window.location.origin}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAppUrl}
                      className="w-full sm:w-auto px-3 py-2 bg-[#1c323f] hover:bg-[#254252] text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'تم نسخ الرابط!' : 'نسخ رابط المنظومة'}</span>
                    </button>
                    <a
                      href="https://www.pwabuilder.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <span>فتح أداة PWABuilder</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    * تقوم PWABuilder بتحويل رابط التطبيق مباشرة إلى حزمة Android Package (APK / AAB) جاهزة للتحميل والتثبيت المباشر على أي هاتف أندرويد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Database Management */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Admin Security Password Settings */}
              <div className="bg-[#101c22] border border-[#1b3440] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#22d3ee]" />
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    إعداد كلمة مرور استعادة وتصفير البيانات
                  </h3>
                </div>
                
                <p className="text-[11px] text-slate-400">
                  تُستخدم كلمة المرور لحماية بيانات الشركة ومنع تصفير أو استعادة البيانات بالخطأ. (كلمة المرور الحالية: <span className="font-mono font-bold text-[#22d3ee] bg-[#182c35] px-1.5 py-0.5 rounded border border-[#22404e]" dir="ltr">{currentPassword}</span>)
                </p>

                <form onSubmit={handleSavePassword} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="أدخل كلمة مرور جديدة..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="flex-1 bg-[#182c35] border border-[#234250] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-white outline-none focus:border-[#22d3ee]"
                  />
                  <button
                    type="submit"
                    disabled={!newPasswordInput.trim()}
                    className="px-3 py-1.5 bg-[#088395] hover:bg-[#0aa0b6] disabled:opacity-40 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                  >
                    حفظ
                  </button>
                </form>

                {showPasswordSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-bold bg-[#0c2a20] border border-emerald-500/40 px-2.5 py-1 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم تحديث كلمة المرور بنجاح!</span>
                  </div>
                )}
              </div>

              {/* Data Reset & Start Fresh (Danger Zone) */}
              <div className="bg-[#241014] border border-[#481a21] rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-rose-300 text-xs sm:text-sm">
                      إدارة البيانات والبدء الفعلي بالشركة
                    </h3>
                    <p className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">
                      يمكنك تصفير البيانات التجريبية لبدء استخدام المنظومة شخصياً بمشاريعك الحقيقية، أو استعادة النماذج التوضيحية الافتراضية. (كلمة المرور الافتراضية: 1234).
                    </p>
                  </div>
                </div>

                {!isResetConfirming ? (
                  <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetActionType('clear_fresh');
                        setIsResetConfirming(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 border border-cyan-400/30"
                      title="مسح المشاريع والمهام التوضيحية لتسجيل بياناتك الخاصة من الصفر"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تصفير البيانات والبدء الفعلي (Start Fresh)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResetActionType('restore_demo');
                        setIsResetConfirming(true);
                      }}
                      className="px-3 py-1.5 bg-rose-700/80 hover:bg-rose-600 active:scale-95 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                      title="إعادة شحن البيانات التجريبية الافتراضية"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة البيانات الافتراضية</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmReset} className="mt-2 pt-3 border-t border-[#481a21] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-300 text-[11px]">
                        لتأكيد الإجراء، يرجى إدخال كلمة المرور:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetConfirming(false);
                          setResetError(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        إلغاء
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showResetPasswordText ? 'text' : 'password'}
                        required
                        placeholder="كلمة مرور الإدارة..."
                        value={enteredResetPassword}
                        onChange={(e) => setEnteredResetPassword(e.target.value)}
                        className="w-full bg-[#182c35] border border-[#3b1c22] rounded-xl px-3 py-2 pl-9 text-xs font-mono font-bold text-white outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showResetPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {resetError && (
                      <div className="flex items-center gap-1.5 text-rose-300 text-[11px] font-bold bg-[#311116] border border-rose-500/40 p-2 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        <span>{resetError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsResetConfirming(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                      >
                        تأكيد الإجراء
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>
          )}

          {/* TAB 4: Advice Guide */}
          {activeTab === 'advice' && (
            <div className="bg-[#0e2a36] border border-[#164d5e] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#088395] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">استشارة أفضل منصة تقنية للمقاولات</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    دليل شامل ومفصل يوضح أفضل المنصات وقواعد البيانات (Firebase, Supabase, PostgreSQL) والتقنيات لتنفيذ هذه الفكرة وتوسيع نطاقها في قطاع المقاولات.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdvice();
                  }}
                  className="px-4 py-2 bg-[#088395] hover:bg-[#0aa0b6] active:scale-95 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 border border-cyan-400/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>فتح الدليل الاستشاري الكامل</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
