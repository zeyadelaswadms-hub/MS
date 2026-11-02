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
  Radio
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendWebNotification
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

  const uniqueNotifications = React.useMemo(() => {
    const seen = new Set<string>();
    return notifications.filter(n => {
      if (!n.id || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [notifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#132229] rounded-3xl shadow-2xl border border-[#1e3845] overflow-hidden my-8 text-white">
        
        {/* Header */}
        <div className="bg-[#0c1920] border-b border-[#162a34] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#088395]/20 border border-cyan-400/30 flex items-center justify-center text-[#22d3ee]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">مركز التنبيهات اللحظية</h2>
              <p className="text-xs text-slate-400">إشعارات تأخير المهام واستلام المراحل بالمواقع</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[11px] text-[#22d3ee] hover:text-white bg-[#0f3440] hover:bg-[#144757] px-2.5 py-1 rounded-lg transition cursor-pointer border border-[#1a576b]"
            >
              تعليم الكل كمقروء
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Web Notifications Banner */}
        <div className="bg-[#0e2733] border-b border-[#174457] px-4 py-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#22d3ee] animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-white block sm:inline ml-1">
                تنبيهات المتصفح الفورية:
              </span>
              <span className="text-slate-300 text-[11px]">
                {permission === 'granted'
                  ? 'مفعّلة - تصلك التنبيهات الميدانية حتى عند إغلاق التطبيق'
                  : permission === 'denied'
                  ? 'محظورة بالمتصفح - يرجى السماح بها من رمز القفل'
                  : 'مطلوبة لوصول الإشعارات على الهاتف'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permission === 'granted' ? (
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testSent}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{testSent ? 'تم إرسال التنبيه!' : 'تجربة تنبيه حي'}</span>
              </button>
            ) : permission === 'denied' ? (
              <span className="text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                محظورة بالمتصفح
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="bg-[#088395] hover:bg-[#0aa0b6] text-white font-bold px-3 py-1 rounded-lg text-xs shadow-2xs transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>تفعيل التنبيهات الآن</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 sm:p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          {uniqueNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-semibold">لا توجد تنبيهات حالية</p>
            </div>
          ) : (
            uniqueNotifications.map(notif => {
              const target = teamMembers.find(m => m.id === notif.targetMemberId);

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-2 cursor-pointer ${
                    notif.read 
                      ? 'bg-[#101c22] border-[#1b3440] text-slate-400' 
                      : notif.type === 'delay_alert' || notif.type === 'warning'
                      ? 'bg-[#311116] border-[#551c24] text-rose-200 ring-1 ring-rose-500/30'
                      : 'bg-[#0f2e3b] border-[#175266] text-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {notif.type === 'delay_alert' || notif.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : notif.type === 'step_completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-[#22d3ee]" />
                      )}
                      <span className="text-white">{notif.title}</span>
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {notif.createdAt || 'الآن'}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-300">
                    {notif.message}
                  </p>

                  {target && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                      <span className="text-slate-400">
                        المسؤول: <strong className="text-white">{target.name}</strong>
                      </span>
                      {target.phone && (
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://api.whatsapp.com/send?phone=${target.phone.replace(/[\s\-\(\)]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                            title="واتساب"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${target.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-300 hover:text-white"
                            title="اتصال"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
