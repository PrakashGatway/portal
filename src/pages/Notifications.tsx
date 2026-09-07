"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  Trash2,
  Check,
  Loader2,
  ArrowRight,
  FileText,
  Video,
  Trophy,
  Tag,
  ChevronDown,
  Globe,
  User,
  AlertCircle,
  RefreshCw,
  Settings,
  BookOpen,
  Calendar,
  CreditCard,
  Megaphone,
} from "lucide-react";
import api from "../axiosInstance";
import { useAuth } from "../context/UserContext";

// --- Type Definitions ---

interface NotificationData {
  courseId?: string;
  contentId?: string;
  testId?: string;
  url?: string;
  actionText?: string;
}

interface NotificationMeta {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

interface Notification {
  _id: string;
  isGlobal: boolean;
  notificationScope: "personal" | "global";
  notificationKey?: string;
  sender?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
  title: string;
  message: string;
  from?: string;
  to?: string;
  Category?: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  isActive: boolean;
  data?: NotificationData;
  proceedStatus?: string;
  scheduledFor?: string;
  metaInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt?: string;
  meta?: NotificationMeta;
}

interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  data: {
    personalUnread: number;
    globalUnread: number;
    totalUnread: number;
  };
}

type FilterType = 
  | "all" 
  | "unread" 
  | "read" 
  | "course" 
  | "offer" 
  | "reminder" 
  | "announcement" 
  | "payment" 
  | "system";

// Map UI filter to API query parameters
const getFilterParams = (filter: FilterType): Record<string, string> => {
  const params: Record<string, string> = {};
  
  switch (filter) {
    case "unread":
      params.isRead = "false";
      break;
    case "read":
      params.isRead = "true";
      break;
    case "course":
      params.type = "course";
      break;
    case "offer":
      params.type = "offer";
      break;
    case "reminder":
      params.type = "reminder";
      break;
    case "announcement":
      params.type = "announcement";
      break;
    case "payment":
      params.type = "payment";
      break;
    case "system":
      params.type = "system";
      break;
    default:
      break;
  }
  
  return params;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [personalUnread, setPersonalUnread] = useState(0);
  const [globalUnread, setGlobalUnread] = useState(0);

  const { user } = useAuth() as any;
  const isMounted = useRef(true);

  // --- Helper Functions ---

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const formatDate = useCallback((date: string) => {
    const created = new Date(date);
    const now = new Date();
    const diff = now.getTime() - created.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return created.toLocaleDateString();
  }, []);

  // Helper to get icon based on notification type
  const getIconConfig = useCallback((notification: Notification) => {
    const title = notification.title?.toLowerCase() || "";
    const type = notification.type?.toLowerCase() || "";
    
    if (type.includes("course") || title.includes("course") || title.includes("lesson")) {
      return { Icon: BookOpen, bg: "bg-blue-50", text: "text-blue-500" };
    }
    if (type.includes("test") || title.includes("mock") || title.includes("quiz") || title.includes("exam")) {
      return { Icon: FileText, bg: "bg-orange-100", text: "text-orange-500" };
    }
    if (type.includes("class") || title.includes("live") || type.includes("reminder")) {
      return { Icon: Video, bg: "bg-green-100", text: "text-green-500" };
    }
    if (title.includes("congratulations") || type.includes("result") || title.includes("score")) {
      return { Icon: Trophy, bg: "bg-purple-100", text: "text-purple-500" };
    }
    if (type.includes("offer") || title.includes("discount") || title.includes("sale") || type.includes("promotion")) {
      return { Icon: Tag, bg: "bg-pink-100", text: "text-pink-500" };
    }
    if (type.includes("payment") || title.includes("payment") || title.includes("subscription") || title.includes("expiring")) {
      return { Icon: CreditCard, bg: "bg-red-100", text: "text-red-500" };
    }
    if (type.includes("system") || title.includes("update") || title.includes("maintenance")) {
      return { Icon: Settings, bg: "bg-gray-100", text: "text-gray-500" };
    }
    if (type.includes("announcement") || title.includes("announcement")) {
      return { Icon: Megaphone, bg: "bg-yellow-100", text: "text-yellow-500" };
    }
    
    return { Icon: Bell, bg: "bg-gray-100", text: "text-gray-500" };
  }, []);

  // --- API Calls ---

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<UnreadCountResponse>("/notification/unread-count");
      if (response.data.success) {
        const { personalUnread, globalUnread, totalUnread } = response.data.data;
        setPersonalUnread(personalUnread);
        setGlobalUnread(globalUnread);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (pageNum: number = 1, filterType: FilterType = filter, append: boolean = false) => {
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

        // Apply filter parameters
        const filterParams = getFilterParams(filterType);
        Object.entries(filterParams).forEach(([key, value]) => {
          params.append(key, value);
        });

        const response = await api.get<NotificationResponse>(`/notification/my?${params.toString()}`);
        const result = response.data;

        if (result.success) {
          const newNotifications = result.data || [];
          
          if (append) {
            setNotifications((prev) => [...prev, ...newNotifications]);
          } else {
            setNotifications(newNotifications);
          }
          
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalCount(result.pagination?.total || 0);
          setPage(result.pagination?.page || pageNum);
        } else {
          throw new Error("Failed to fetch notifications");
        }
      } catch (error: any) {
        console.error("Fetch notifications error:", error);
        showError(
          error.response?.data?.message || error.message || "Failed to load notifications"
        );
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [filter, showError]
  );

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setActionLoading(notificationId);
      setError(null);

      const response = await api.put(`/notification/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        
        // Update unread counts
        const target = notifications.find(n => n._id === notificationId);
        if (target) {
          if (target.notificationScope === "personal") {
            setPersonalUnread((prev) => Math.max(0, prev - 1));
          } else {
            setGlobalUnread((prev) => Math.max(0, prev - 1));
          }
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        
        showSuccess("Marked as read");
      } else {
        throw new Error(response.data?.message || "Failed to mark as read");
      }
    } catch (error: any) {
      console.error("Mark as read error:", error);
      showError(error.response?.data?.message || error.message || "Failed to mark as read");
    } finally {
      setActionLoading(null);
    }
  }, [notifications, showSuccess, showError]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) {
      showSuccess("No unread notifications");
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.put("/notification/read-all");
      
      if (response.data.success) {
        // Update all notifications to read
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: notification.isRead ? notification.readAt : new Date().toISOString(),
          }))
        );
        
        // Reset unread counts
        setPersonalUnread(0);
        setGlobalUnread(0);
        setUnreadCount(0);
        
        showSuccess(`Marked all as read`);
      } else {
        throw new Error(response.data?.message || "Failed to mark all as read");
      }
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      showError(error.response?.data?.message || "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  }, [notifications, showSuccess, showError]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    const target = notifications.find((n) => n._id === notificationId);
    if (!target) return;

    const confirmMessage = target.isGlobal
      ? "This will remove the notification from your list only. Continue?"
      : "Are you sure you want to delete this notification? This cannot be undone.";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(notificationId);
      setError(null);

      const response = await api.delete(`/notification/${notificationId}`);
      
      if (response.data.success) {
        // Remove from state
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );
        
        // Update counts if it was unread
        if (!target.isRead) {
          if (target.notificationScope === "personal") {
            setPersonalUnread((prev) => Math.max(0, prev - 1));
          } else {
            setGlobalUnread((prev) => Math.max(0, prev - 1));
          }
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        
        setTotalCount((prev) => Math.max(0, prev - 1));
        showSuccess("Notification deleted");
      } else {
        throw new Error(response.data?.message || "Failed to delete notification");
      }
    } catch (error: any) {
      console.error("Delete notification error:", error);
      showError(error.response?.data?.message || error.message || "Failed to delete notification");
    } finally {
      setActionLoading(null);
    }
  }, [notifications, showSuccess, showError]);

  // Handle notification click - mark as read and navigate
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate if url exists
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
  }, [markAsRead]);

  // --- Handlers ---

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
    // Reset notifications when filter changes
    setNotifications([]);
    fetchNotifications(1, newFilter, false);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      const nextPage = page + 1;
      fetchNotifications(nextPage, filter, true);
    }
  }, [page, totalPages, loadingMore, filter, fetchNotifications]);

  const handleRefresh = useCallback(() => {
    setNotifications([]);
    fetchNotifications(1, filter, false);
    fetchUnreadCount();
  }, [filter, fetchNotifications, fetchUnreadCount]);

  // --- Effects ---

  // Initial load
  useEffect(() => {
    isMounted.current = true;
    fetchNotifications(1, filter, false);
    fetchUnreadCount();

    return () => {
      isMounted.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get filtered notifications for display (client-side safety net)
  const filteredNotifications = useCallback(() => {
    // If filter is not a status filter, return all (API already filtered)
    if (filter !== "unread" && filter !== "read") {
      return notifications;
    }
    // For read/unread, ensure consistency
    if (filter === "unread") {
      return notifications.filter(n => !n.isRead);
    }
    if (filter === "read") {
      return notifications.filter(n => n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const displayNotifications = filteredNotifications();

  // Calculate tab counts
  const getTabCounts = useCallback(() => {
    const all = totalCount;
    const unread = notifications.filter(n => !n.isRead).length;
    const read = notifications.filter(n => n.isRead).length;
    const course = notifications.filter(n => n.type?.toLowerCase().includes("course")).length;
    const offer = notifications.filter(n => n.type?.toLowerCase().includes("offer")).length;
    const reminder = notifications.filter(n => n.type?.toLowerCase().includes("reminder")).length;
    const announcement = notifications.filter(n => n.type?.toLowerCase().includes("announcement")).length;
    const payment = notifications.filter(n => n.type?.toLowerCase().includes("payment")).length;
    const system = notifications.filter(n => n.type?.toLowerCase().includes("system")).length;

    return { all, unread, read, course, offer, reminder, announcement, payment, system };
  }, [notifications, totalCount]);

  const tabCounts = getTabCounts();

  // Tab definitions
  const tabs: Array<{ id: FilterType; label: string }> = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "read", label: "Read" },
    { id: "course", label: "Course" },
    { id: "offer", label: "Offer" },
    { id: "reminder", label: "Reminder" },
    { id: "announcement", label: "Announcement" },
    { id: "payment", label: "Payment" },
    { id: "system", label: "System" },
  ];

  return (
    <div className="min-h-screen p-4 ">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Stay updated with the latest alerts and important updates.
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition disabled:opacity-50 self-start md:self-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" strokeWidth={3} />
              )}
              Mark all as read
            </button>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200 flex items-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0" /> {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Filters Row */}
        <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => handleFilterChange(item.id)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all border ${
                filter === item.id
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {item.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                filter === item.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {tabCounts[item.id as keyof typeof tabCounts] || 0}
              </span>
            </button>
          ))}
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="ml-auto rounded-full bg-white p-2 text-gray-400 border border-gray-200 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && displayNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Bell className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700">No notifications</p>
              <p className="mt-1 text-xs text-gray-400">
                {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                {displayNotifications.map((notification) => {
                  const { Icon, bg, text } = getIconConfig(notification);
                  const isUnread = !notification.isRead;
                  const isGlobal = notification.isGlobal || notification.notificationScope === "global";

                  return (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-5 transition-colors hover:bg-gray-50/50 relative group cursor-pointer ${
                        isUnread ? "bg-orange-50/30" : ""
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Icon Box */}
                        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl ${bg} ${text}`}>
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Unread Dot */}
                              {isUnread && (
                                <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                              )}
                              <h3 className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                                {notification.title}
                              </h3>
                              {/* Global/Pill Badge */}
                              {isGlobal ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100">
                                  <Globe className="h-3 w-3" /> Global
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 border border-green-100">
                                  <User className="h-3 w-3" /> Personal
                                </span>
                              )}
                              {/* Priority Badge */}
                              {notification.priority === "urgent" && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 border border-red-200">
                                  Urgent
                                </span>
                              )}
                              {notification.priority === "high" && (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600 border border-orange-200">
                                  High
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                          
                          <p className={`mt-1 text-sm leading-relaxed ${isUnread ? "text-gray-600" : "text-gray-500"}`}>
                            {notification.message}
                          </p>

                          {/* Action Button */}
                          {notification.data?.actionText && (
                            <button
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notification.data?.url) {
                                  window.location.href = notification.data.url;
                                }
                              }}
                            >
                              {notification.data.actionText}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* Far Right Unread Dot */}
                        {isUnread && (
                          <div className="flex-shrink-0 pt-1.5">
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                          </div>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm pl-2 rounded-md">
                          {isUnread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              disabled={actionLoading === notification._id}
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
                              title="Mark as read"
                            >
                              {actionLoading === notification._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            disabled={actionLoading === notification._id}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title={isGlobal ? "Remove" : "Delete"}
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {totalPages > 1 && page < totalPages && (
                <div className="flex justify-center pt-2">
                  <button
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/50 px-6 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}

              {/* Pagination Info */}
              {totalCount > 0 && (
                <div className="text-center text-xs text-gray-400 pt-2">
                  Showing {displayNotifications.length} of {totalCount} notifications
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

