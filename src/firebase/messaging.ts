import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

import app from "./firebase";
import { toast } from "react-toastify";

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const supported = await isSupported();

    if (!supported) {
      console.log("Firebase messaging is not supported.");
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied.");
      return null;
    }

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    if (!token) {
      console.log("FCM token not generated.");
      return null;
    }

    return token;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
};





// export const listenForMessages = (
//   callback: (payload: any) => void
// ) => {
//   try {
//     const messaging = getMessaging(app);

//     return onMessage(messaging, (payload) => {
//       console.log("Foreground notification:", payload);
//       alert(payload?.notification?.title || "new notification.");
//       callback(payload);
//     });
//   } catch (error) {
//     console.error("FCM listener error:", error);
//   }
// };


// export const listenForMessages = (callback?: (payload: any) => void) => {
//   try {
//     const messaging = getMessaging(app);

//     return onMessage(messaging, (payload) => {
//        const audio = new Audio("/notify.mp3");

//       audio.play().catch((error) => {
//         console.warn("Notification sound blocked:", error);
//       });

//       toast(
//         payload?.notification?.title || "New notification"
//       );

//       window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }));

//       if (callback) callback(payload);
//     });
//   } catch (error) {
//     console.error("FCM listener error:", error); 
//     return undefined;
//   }
// };

export const listenForMessages = (callback?: (payload: any) => void) => {
  try {
    const messaging = getMessaging(app);

    return onMessage(messaging, (payload) => {
      const audio = new Audio("/notify.mp3");

      audio.play().catch((error) => {
        console.warn("Notification sound blocked:", error);
      });

      toast(payload?.notification?.title || "New notification");
      
      window.dispatchEvent(
        new CustomEvent("fcm-message", {
          detail: payload,
        })
      );

      if (callback) callback(payload);
    });
  } catch (error) {
    console.error("FCM listener error:", error);
    return undefined;
  }
};