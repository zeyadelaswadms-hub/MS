import React, { useState, useEffect } from 'react';
import { AppNotification, TeamMember } from '../types';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Phone, 
  Check,
  Radio,
  Send,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendWebNotification,
  isWebNotificationSupported 
} from '../utils/webNotificationService';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  teamMembers: TeamMember[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  teamMembers,
  onMarkAllAsRead,
  onMarkAsRead,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    await sendWebNotification('🔔 تجربة تنبيه المتصفح (Web Notification)', {
      body: 'هذا إشعار تجريبي من منظومة بُنيان للتأكد من وصول التنبيهات الميدانية لهاتفك أو جهازك بنجاح!',
      tag: 'test-notification',
      url: '/',
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-amber-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-900 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">مركز التنبيهات الآلية واللحظية</h2>
              <p className="text-xs text-amber-200/80">إشعارات تأخير المهام واستلام المراحل بالمواقع</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[11px] text-amber-300 hover:text-white bg-amber-900/80 hover:bg-amber-900 px-2.5 py-1 rounded-lg transition"
            >
              تعليم الكل كمقروء
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-amber-300 hover:text-white rounded-full hover:bg-amber-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Web Notifications (Browser Alerts) Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-stone-900 block sm:inline ml-1">
                تنبيهات المتصفح الفورية (Web Notifications):
              </span>
              <span className="text-stone-600 text-[11px]">
                {permission === 'granted'
                  ? 'مفعّلة ونشطة - تصلك التنبيهات حتى عند إغلاق التطبيق عبر المتصفح'
                  : permission === 'denied'
                  ? 'محظورة في إعدادات المتصفح - يرجى السماح بها من رمز القفل بجانب الرابط'
                  : 'مطلوبة لوصول الإشعارات حتى عند إغلاق أو تصغير التطبيق'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission === 'granted' ? (
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testSent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{testSent ? 'تم إرسال التنبيه!' : 'تجربة تنبيه حي'}</span>
              </button>
            ) : permission === 'denied' ? (
              <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                محظورة بالمتصفح
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1 rounded-lg text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>تفعيل التنبيهات الآن</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 sm:p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs font-semibold">لا توجد تنبيهات حالية</p>
            </div>
          ) : (
            notifications.map(notif => {
              const target = teamMembers.find(m => m.id === notif.targetMemberId);

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-2 cursor-pointer ${
                    notif.read 
                      ? 'bg-stone-50 border-stone-200/70 text-stone-700' 
                      : notif.type === 'delay_alert'
                      ? 'bg-red-50/80 border-red-200 text-red-950 ring-1 ring-red-300/50'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {notif.type === 'delay_alert' ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : notif.type === 'step_completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      <span>{notif.title}</span>
                    </span>

                    <span className="text-[10px] text-stone-400">
                      {notif.createdAt}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed">
                    {notif.message}
                  </p>

                  {target && (
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/50 text-[11px]">
                      <span className="text-stone-500">
                        المعني بالتنبيه: <strong>{target.name}</strong> ({target.phone})
                      </span>

                      <a
                        href={`https://api.whatsapp.com/send?phone=${target.phone.replace(/[\s\+\-\(\)]/g, '')}&text=${encodeURIComponent(`تنبيه من إدارة المشاريع:\n${notif.message}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>إرسال واتساب</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-5 py-2 rounded-xl"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
