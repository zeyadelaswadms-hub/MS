import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Smartphone, 
  Globe, 
  Server, 
  Bell, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Database, 
  Send,
  HelpCircle
} from 'lucide-react';
import { TeamMember, Task, Project } from '../types';

interface PlatformAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  projects: Project[];
  tasks: Task[];
}

export const PlatformAdviceModal: React.FC<PlatformAdviceModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  projects,
  tasks,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(teamMembers[0]?.id || '');
  const [testMessageSuccess, setTestMessageSuccess] = useState(false);

  if (!isOpen) return null;

  const targetMember = teamMembers.find(m => m.id === selectedMemberId) || teamMembers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-amber-950 text-white p-6 sm:p-7 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-1.5 max-w-2xl">
            <span className="bg-amber-800 text-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold inline-block">
              استشارة معمارية وتقنية متخصصة
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              أفضل المنصات والتقنيات لتنفيذ تطبيق متابعة مهام المقاولات
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              إجابة دقيقة وشاملة على سؤالك: ما هي المنصة الأفضل لتنفيذ هذا النظام التفاعلي مع التنبيهات اللحظية وسلاسل الخطوات؟
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-amber-200 hover:text-white rounded-full hover:bg-amber-900/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto text-stone-800">
          
          {/* Comparison Cards: 2 Main Approaches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Recommendation 1: Web App + PWA (Best for 90% of Contractors) */}
            <div className="bg-emerald-50/60 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> الخيار الأفضل والموصى به
                </span>
                <Globe className="w-5 h-5 text-emerald-700" />
              </div>

              <h3 className="text-lg font-bold text-emerald-950">
                Next.js / React + Supabase (Web & PWA)
              </h3>

              <p className="text-xs text-stone-600 leading-relaxed">
                تطبيق ويب تقدمي (PWA) يعمل على الهواتف الذكية (آيفون وأندرويد) والأجهزة اللوحية (iPad بالموقع) والكمبيوتر المكتبي للإدارة، بدون الحاجة لدفع رسوم أو انتظار موافقة متجر أبل أو جوجل.
              </p>

              <div className="space-y-1.5 text-xs text-stone-700 pt-2 border-t border-emerald-200/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>قاعدة بيانات Supabase (PostgreSQL):</strong> أداء خارق وسرعة عالية في ربط المشاريع والمهام وسلاسل الخطوات.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>مزامنة لحظية (Realtime):</strong> عندما يغير مهندس الموقع خطوة، تظهر فوراً في شاشة مدير المشروع دون إعادة تحميل.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>تكلفة إطلاق سريعة واقتصادية:</strong> كود واحد يخدم الجميع مع سهولة التحديث المستمر.</span>
                </div>
              </div>
            </div>

            {/* Recommendation 2: Flutter (If heavy offline site operations needed) */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-stone-200 text-stone-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  الخيار للمواقع النائية (Offline)
                </span>
                <Smartphone className="w-5 h-5 text-stone-700" />
              </div>

              <h3 className="text-lg font-bold text-stone-900">
                Flutter + Firebase (تطبيق هاتف أصلي Native)
              </h3>

              <p className="text-xs text-stone-600 leading-relaxed">
                تطبيق موبايل متكامل مصمم خصيصاً إذا كان مهندسو شركتك يعملون في مواقع صحراوية أو أدوار تحت الأرض (قبو) تنقطع فيها شبكة الهاتف بشكل متكرر.
              </p>

              <div className="space-y-1.5 text-xs text-stone-700 pt-2 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>العمل بدون إنترنت (Offline-First):</strong> يخزن المهام محلياً على هاتف المهندس ويقوم بالمزامنة بمجرد توفر الشبكة.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>وصول مباشر لكاميرا الهاتف:</strong> لالتقاط صور الاستلامات وعيوب الخرسانة وربطها بالخطوة الفرعية.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>يتطلب رفع التطبيق لمتجر Apple Store و Google Play.</strong></span>
                </div>
              </div>
            </div>

          </div>

          {/* Automated Notification Engine Details */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-700" />
              كيفية بناء نظام التنبيهات الآلي اللحظي (Automated Notifications):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>واتساب (WhatsApp API)</span>
                </div>
                <p className="text-stone-600 leading-normal">
                  ربط WhatsApp Cloud API عبر Meta أو Twilio لإرسال رسالة آلية فورية لرقم هاتف المهندس بمجرد أن تتوقف خطوة عنده أو يقترب موعد الإغلاق.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>إشعارات الموبايل (FCM)</span>
                </div>
                <p className="text-stone-600 leading-normal">
                  Firebase Cloud Messaging لإرسال إشعارات فورية تظهر أعلى شاشة الجوال (Push Notifications) مع نغمة تنبيه حتى لو كان التطبيق مقفلاً.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>رسائل SMS للإنذارات الحرجة</span>
                </div>
                <p className="text-stone-600 leading-normal">
                  استخدام بوابات الرسائل القصيرة (مثل Unifonic أو Twilio) للتنبيهات العاجلة جداً عند تجاوز تاريخ الإغلاق بأكثر من يومين.
                </p>
              </div>

            </div>
          </div>

          {/* Interactive WhatsApp Dispatch Sandbox */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                تجربة إرسال تنبيه آلي فوري لأحد المهندسين عبر واتساب الآن:
              </h4>
              <span className="text-[11px] text-stone-500">جاهز للتجربة الحية</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full sm:w-auto bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.role} ({m.phone})
                  </option>
                ))}
              </select>

              {targetMember && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${targetMember.phone.replace(/[\s\+\-\(\)]/g, '')}&text=${encodeURIComponent(`السلام عليكم م. ${targetMember.name} 🏗️\nهذا نموذج لتنبيه آلي من تطبيق متابعة مهام المقاولات: لديك خطوة متوقفة بانتظار استلامك بالموقع.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>فتح تطبيق واتساب وإرسال التنبيه الآن</span>
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 p-4 sm:p-5 flex items-center justify-between border-t border-stone-200 text-xs">
          <span className="text-stone-500">
            تم إعداد هذه التوصية وفق أفضل معايير أنظمة شركات التشييد والمقاولات الحديثة
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-amber-900 hover:bg-amber-950 text-white font-bold px-5 py-2 rounded-xl transition"
          >
            فهمت، العودة للتطبيق
          </button>
        </div>

      </div>
    </div>
  );
};
