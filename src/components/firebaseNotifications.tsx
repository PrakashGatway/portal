import { useEffect, useState } from "react";
import { getFCMToken, listenForMessages } from "../firebase/messaging";
import { useAuth } from "../context/UserContext";
import api from "../axiosInstance";
import { X } from "lucide-react";

interface NotificationPopupProps {
  payload: any;
  onClose: () => void;
}

const NotificationPopup = ({ payload, onClose }: NotificationPopupProps) => {
  const notification = payload?.notification;

  const image =
    notification?.image || payload?.data?.image || payload?.data?.offerImage;

  const title = notification?.title || payload?.data?.title || "Special Offer";

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 15000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[700px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="
            absolute right-3 top-3 z-20
            flex h-8 w-8 items-center justify-center
            rounded-full bg-black/50 text-white
            backdrop-blur-sm
            transition hover:bg-black/70
          "
        >
          <X size={18} />
        </button>

        {image ? (
          <img
            src={image}
            alt={title}
            className="
              block h-auto w-full
              max-h-[80vh]
              object-contain
            "
          />
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>

            {notification?.body && (
              <p className="mt-2 text-gray-600">{notification.body}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FirebaseNotifications = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (!user?._id) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const handleFCMMessage = (event: Event) => {
      const customEvent = event as CustomEvent;

      setNotification(customEvent.detail);
    };

    window.addEventListener("fcm-message", handleFCMMessage);

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
      window.removeEventListener("fcm-message", handleFCMMessage);
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user?._id]);

  if (!notification) {
    return null;
  }

  // return (
  //   <NotificationPopup
  //     payload={notification}
  //     onClose={() => setNotification(null)}
  //   />
  // );

  return null;
};

const saveTokenToBackend = async (token: string, id: string) => {
  try {
    await api.post("/notification/fcm-token", { token, id });
  } catch (error) {
    console.error("Failed to save FCM token:", error);
  }
};

export default FirebaseNotifications;
