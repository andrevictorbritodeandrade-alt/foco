import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, getToken, onMessage, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCJ9K6sovkNzeO_fuQbSPD9LnIUG0p8Da4",
  authDomain: "chaveunica-225e0.firebaseapp.com",
  projectId: "chaveunica-225e0",
  storageBucket: "chaveunica-225e0.firebasestorage.app",
  messagingSenderId: "324211037832",
  appId: "1:324211037832:web:362a46e6446ea37b85b13d",
  measurementId: "G-MRBDJC3QXZ"
};

// Singleton pattern for Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let analyticsInstance: any = null;
let messagingInstance: any = null;

/**
 * Safely initialize Analytics
 */
export const getSafeAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  if (analyticsInstance) return analyticsInstance;
  
  try {
    const supported = await isAnalyticsSupported();
    if (supported) {
      analyticsInstance = getAnalytics(app);
      return analyticsInstance;
    }
  } catch (err) {
    console.error("Analytics init error:", err);
  }
  return null;
};

/**
 * Safely initialize Messaging
 */
export const getSafeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  
  try {
    const supported = await isMessagingSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      
      // Setup foreground messaging immediately upon safe acquisition
      onMessage(messagingInstance, (payload) => {
        console.log('Message received in foreground: ', payload);
        if (Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'FOCO', {
            body: payload.notification?.body,
            icon: 'https://cdn-icons-png.flaticon.com/512/3593/3593505.png'
          });
        }
      });
      
      return messagingInstance;
    }
  } catch (err) {
    console.warn("Messaging service not available in this environment:", err);
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const messaging = await getSafeMessaging();
    if (messaging) {
      try {
        const token = await getToken(messaging, {
          vapidKey: 'BLe-R-p-Lh-8mK3_yQ-uP-B6_tY-Y-Y-Y-Y-Y-Y-Y'
        });
        console.log('FCM Token:', token);
        return true;
      } catch (err) {
        console.error('Error obtaining FCM token:', err);
        return true; // Still return true if permission granted even if token fails
      }
    }
  }
  return permission === 'granted';
};

export { app };