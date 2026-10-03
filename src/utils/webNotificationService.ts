// Web Notifications and Service Worker Service for Bunyan Construction Management

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Initializes Service Worker and listens for notifications
 */
export async function initWebNotifications(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      swRegistration = registration;
      console.log('Bunyan Service Worker registered successfully', registration.scope);
      return registration;
    } catch (error) {
      console.warn('Failed to register Service Worker for notifications:', error);
      return null;
    }
  }
  return null;
}

/**
 * Check if Web Notifications are supported in this browser
 */
export function isWebNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets the current notification permission state
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests browser permission to display notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isWebNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Send a confirmation test notification
      sendWebNotification('🔔 تم تفعيل تنبيهات المتصفح بنجاح', {
        body: 'ستصلك الآن تنبيهات تعيين المهام وتغيير الخطوات الفرعية فوراً حتى عند تصغير المتصفح.',
        tag: 'welcome-notification',
      });
    }
    return permission;
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Plays a subtle notification chime using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Friendly 2-tone chime (E5 -> G#5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.12); // G#5
    gain2.gain.setValueAtTime(0.14, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export interface WebNotificationOptions {
  body?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
}

/**
 * Sends a real Web Notification through Service Worker (or fallback to Notification API)
 */
export async function sendWebNotification(
  title: string,
  options?: WebNotificationOptions
): Promise<boolean> {
  if (!isWebNotificationSupported()) {
    return false;
  }

  // Play auditory feedback
  playNotificationSound();

  if (Notification.permission !== 'granted') {
    // If not granted, we cannot show a native notification
    return false;
  }

  const notificationOptions = {
    body: options?.body || '',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: options?.tag || `bunyan-${Date.now()}`,
    data: {
      url: options?.url || '/',
    },
    requireInteraction: options?.requireInteraction ?? false,
  };

  try {
    // Try sending through Service Worker first (enables background and closed tab delivery)
    if ('serviceWorker' in navigator) {
      const reg = swRegistration || await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Standard Notification API fallback
    new Notification(title, notificationOptions);
    return true;
  } catch (error) {
    console.warn('Could not display Web Notification:', error);
    try {
      new Notification(title, notificationOptions);
      return true;
    } catch {
      return false;
    }
  }
}
