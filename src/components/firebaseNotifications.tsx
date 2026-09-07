import { useEffect } from "react";
import {
  getFCMToken,
  listenForMessages,
} from "../firebase/messaging";
import { useAuth } from "../context/UserContext";

const FirebaseNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) return; // wait until user is actually loaded

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const initializeNotifications = async () => {
      try {
        const token = await getFCMToken();

        if (token && !cancelled) {
          await saveTokenToBackend(token, user._id);
        }

        unsubscribe = listenForMessages((payload) => {
          const title = payload.notification?.title || "New Notification";
          const message = payload.notification?.body || "";

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification(title, {
              body: message,
              icon: "/ooshas-logo.png",
            });
          }
        });
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initializeNotifications();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user?._id]);

  return null;
};

const saveTokenToBackend = async (token: string, id: string) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/notification/fcm-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, id }),
      }
    );

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log("FCM token saved:", data);
  } catch (error) {
    console.error("Failed to save FCM token:", error);
  }
};

export default FirebaseNotifications;