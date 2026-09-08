"use client";

import type React from "react";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import api from "../axiosInstance";
import { listenForMessages } from "../firebase/messaging";

type Theme = "light" | "dark";

type NotificationResponse = {
  success: boolean;
  message?: string;
  data: any[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type UnreadCountResponse = {
  success: boolean;
  data: {
    personalUnread: number;
    globalUnread: number;
    totalUnread: number;
  };
};

export type FilterType =
  | "all"
  | "unread"
  | "read"
  | "course"
  | "offer"
  | "reminder"
  | "announcement"
  | "payment"
  | "system"
  | string;

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  notifications: Notification[];
  unreadCount: number;
  personalUnread: number;
  globalUnread: number;
  loading: boolean;
  loadingMore: boolean;
  actionLoadingId: string | null;
  error: string | null;
  page: number;
  totalPages: number;
  totalCount: number;
  filter: FilterType;
  setFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  fetchNotifications: (
    pageNum?: number,
    filterType?: FilterType,
    append?: boolean
  ) => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getFilterParams = (
  filterType: FilterType
): Record<string, string> => {
  switch (filterType) {
    case "unread":
      return {
        isRead: "false",
      };

    case "read":
      return {
        isRead: "true",
      };

    case "course":
      return {
        type: "course",
      };

    case "offer":
      return {
        type: "offer",
      };

    case "reminder":
      return {
        type: "reminder",
      };

    case "announcement":
      return {
        type: "announcement",
      };

    case "payment":
      return {
        type: "payment",
      };

    case "system":
      return {
        type: "system",
      };

    case "all":
    default:
      return {};
  }
};

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filter, setFilter] = useState<FilterType>("all");

  const [personalUnread, setPersonalUnread] = useState(0);
  const [globalUnread, setGlobalUnread] = useState(0);

  const notificationAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const filterRef = useRef<FilterType>("all");

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const unreadCount = useMemo(() => {
    const derivedUnread = notifications.filter(
      (notification) => notification.isRead === false
    ).length;

    const apiUnread = personalUnread + globalUnread;

    return apiUnread > 0 ? apiUnread : derivedUnread;
  }, [
    notifications,
    personalUnread,
    globalUnread,
  ]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | Theme
      | null;

    const initialTheme =
      savedTheme === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    localStorage.setItem("theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, isInitialized]);

  const toggleTheme = useCallback(() => {
    setTheme((previousTheme) =>
      previousTheme === "light" ? "dark" : "light"
    );
  }, []);

  const fetchNotifications = useCallback(
    async (
      pageNum: number = 1,
      filterType: FilterType = filterRef.current,
      append: boolean = false
    ) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "20",
        });

        const filterParams = getFilterParams(filterType);

        Object.entries(filterParams).forEach(
          ([key, value]) => {
            params.append(key, value);
          }
        );

        console.log(
          "Fetching notifications:",
          `/notification/my?${params.toString()}`
        );

        const response =
          await api.get<NotificationResponse>(
            `/notification/my?${params.toString()}`
          );

        const result = response.data;

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to fetch notifications"
          );
        }

        const newNotifications = result.data || [];

        if (append) {
          setNotifications((previous) => [
            ...previous,
            ...newNotifications,
          ]);
        } else {
          setNotifications(newNotifications);
        }

        setTotalPages(
          result.pagination?.totalPages || 1
        );

        setTotalCount(
          result.pagination?.total || 0
        );

        setPage(
          result.pagination?.page || pageNum
        );
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load notifications";

        console.error(
          "Fetch notifications error:",
          err
        );

        setError(message);
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  const fetchUnreadCounts = useCallback(async () => {
    try {
      console.log(
        "Fetching notification unread count..."
      );

      const response =
        await api.get<UnreadCountResponse>(
          "/notification/unread-count"
        );

      if (response.data.success) {
        const {
          personalUnread: personal,
          globalUnread: global,
        } = response.data.data;

        setPersonalUnread(personal);
        setGlobalUnread(global);
      }
    } catch (err) {
      console.error(
        "Failed to fetch unread count:",
        err
      );
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    console.log(
      "Refreshing notifications after FCM message..."
    );

    await Promise.all([
      fetchNotifications(
        1,
        filterRef.current,
        false
      ),
      fetchUnreadCounts(),
    ]);
  }, [
    fetchNotifications,
    fetchUnreadCounts,
  ]);

  const loadMoreNotifications = useCallback(async () => {
    if (loadingMore) {
      return;
    }

    if (page >= totalPages) {
      return;
    }

    await fetchNotifications(
      page + 1,
      filterRef.current,
      true
    );
  }, [
    loadingMore,
    page,
    totalPages,
    fetchNotifications,
  ]);

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      const target = notifications.find(
        (notification) =>
          notification._id === notificationId
      );

      if (target?.isRead) {
        return;
      }

      try {
        setActionLoadingId(notificationId);

        await api.patch(
          `/notification/${notificationId}/read`
        );

        setNotifications((previous) =>
          previous.map((notification) =>
            notification._id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : notification
          )
        );

        if (target) {
          if (
            target.notificationScope ===
            "personal"
          ) {
            setPersonalUnread((previous) =>
              Math.max(previous - 1, 0)
            );
          } else {
            setGlobalUnread((previous) =>
              Math.max(previous - 1, 0)
            );
          }
        }
      } catch (err) {
        console.error(
          "Mark notification as read error:",
          err
        );
      } finally {
        setActionLoadingId(null);
      }
    },
    [notifications]
  );

  const markAllNotificationsAsRead =
    useCallback(async () => {
      try {
        setLoading(true);

        await api.patch(
          "/notification/read-all"
        );

        setNotifications((previous) =>
          previous.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.isRead
              ? notification.readAt
              : new Date().toISOString(),
          }))
        );

        setPersonalUnread(0);
        setGlobalUnread(0);
      } catch (err) {
        console.error(
          "Mark all notifications as read error:",
          err
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const removeNotification = useCallback(
    (notificationId: string) => {
      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );

      setTotalCount((previous) =>
        Math.max(previous - 1, 0)
      );
    },
    []
  );

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const target = notifications.find(
        (notification) =>
          notification._id === notificationId
      );

      try {
        setActionLoadingId(notificationId);

        await api.delete(
          `/notification/${notificationId}`
        );

        removeNotification(notificationId);

        if (target && !target.isRead) {
          if (
            target.notificationScope ===
            "personal"
          ) {
            setPersonalUnread((previous) =>
              Math.max(previous - 1, 0)
            );
          } else {
            setGlobalUnread((previous) =>
              Math.max(previous - 1, 0)
            );
          }
        }
      } catch (err) {
        console.error(
          "Delete notification error:",
          err
        );
      } finally {
        setActionLoadingId(null);
      }
    },
    [
      notifications,
      removeNotification,
    ]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setTotalCount(0);
    setPage(1);
    setTotalPages(1);
    setPersonalUnread(0);
    setGlobalUnread(0);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    fetchNotifications(
      1,
      filter,
      false
    );
  }, [
    isInitialized,
    filter,
    fetchNotifications,
  ]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    fetchUnreadCounts();
  }, [
    isInitialized,
    fetchUnreadCounts,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = new Audio("/pop.mp3");

    audio.preload = "auto";

    notificationAudioRef.current = audio;

    return () => {
      notificationAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const unlockAudio = () => {
      const audio =
        notificationAudioRef.current;

      if (!audio) {
        return;
      }

      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});

      window.removeEventListener(
        "click",
        unlockAudio
      );

      window.removeEventListener(
        "touchstart",
        unlockAudio
      );
    };

    window.addEventListener(
      "click",
      unlockAudio
    );

    window.addEventListener(
      "touchstart",
      unlockAudio
    );

    return () => {
      window.removeEventListener(
        "click",
        unlockAudio
      );

      window.removeEventListener(
        "touchstart",
        unlockAudio
      );
    };
  }, []);

  // useEffect(() => {

  //   const unsubscribe = listenForMessages(
  //     async (payload) => {
  //       console.log(
  //         "FCM PAYLOAD RECEIVED IN THEME CONTEXT:",
  //         payload
  //       );

  //       try {
          

  //         await refreshNotifications();

  //       } catch (error) {
  //         console.error(
  //           "Failed to refresh notifications after FCM message:",
  //           error
  //         );
  //       }
  //     }
  //   );

  //   return () => {
  //     console.log(
  //       "Cleaning up Firebase foreground notification listener..."
  //     );

  //     unsubscribe?.();
  //   };
  // }, []);



  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      notifications,
      unreadCount,
      personalUnread,
      globalUnread,
      loading,
      loadingMore,
      actionLoadingId,
      error,
      page,
      totalPages,
      totalCount,
      filter,
      setFilter,
      fetchNotifications,
      fetchUnreadCounts,
      refreshNotifications,
      loadMoreNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      removeNotification,
      clearNotifications,
    }),
    [
      theme,
      toggleTheme,
      notifications,
      unreadCount,
      personalUnread,
      globalUnread,
      loading,
      loadingMore,
      actionLoadingId,
      error,
      page,
      totalPages,
      totalCount,
      filter,
      fetchNotifications,
      fetchUnreadCounts,
      refreshNotifications,
      loadMoreNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      removeNotification,
      clearNotifications,
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within a ThemeProvider"
    );
  }

  return context;
};