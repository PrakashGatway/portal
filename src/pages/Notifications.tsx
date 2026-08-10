"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Trash2,
  Archive,
  Check,
  Loader2,
  X,
  Send,
  Globe,
  User,
  Mail,
  Bell as BellIcon,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import api from "../axiosInstance";
import { useAuth } from "../context/UserContext";

interface NotificationData {
  courseId?: string;
  lessonId?: string;
  testId?: string;
  classId?: string;
  url?: string;
  actionText?: string;
}

interface Notification {
  _id: string;
  recipient?: string;
  isGlobal: boolean;
  sender?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
  title: string;
  message: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  data?: NotificationData;
  channels?: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  status: "unread" | "read" | "archived";
  readAt?: string;
  createdAt: string;
  updatedAt: string;
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

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { user, fetchUserProfile } = useAuth() as any;

  // Fetch notifications with memoization
  const fetchNotifications = useCallback(
    async (currentPage = 1, currentFilter = filter) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
        });

        // Add filters only if they exist
        if (user?.lastActive) {
          params.append("isActive", user.lastActive.split("T")[0]);
        }
        if (user?.category?._id) {
          params.append("category", user.category._id);
        }
        if (currentFilter !== "all") {
          params.append("status", currentFilter);
        }

        const response = await api.get(`/notification?${params.toString()}`);
        const result: NotificationResponse = response.data;

        if (result.success) {
          setNotifications(result.data || []);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalCount(result.pagination?.total || 0);
          setPage(result.pagination?.page || currentPage);
        } else {
          throw new Error("Failed to fetch notifications");
        }
      } catch (error: any) {
        console.error("Fetch notifications error:", error);
        setError(
          error.response?.data?.message || error.message || "Failed to load notifications"
        );
      } finally {
        setLoading(false);
      }
    },
    [user, filter]
  );

  // Archive notification
  const archiveNotification = async (notificationId: string) => {
    try {
      setActionLoading(notificationId);
      setError(null);

      const response = await api.put(`/notification/${notificationId}/archive`);
      const result = response.data;

      if (result.success) {
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );
        showSuccess("Notification archived successfully");

        // Update total count
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(result?.message || "Failed to archive notification");
      }
    } catch (error: any) {
      console.error("Archive notification error:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to archive notification"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Delete notification
  // For global notifications this only hides the notification for THIS user
  // (backend records it in NotificationRec) — it won't remove it for anyone
  // else. For personal notifications it's a real, permanent delete.
  const deleteNotification = async (notificationId: string) => {
    const target = notifications.find((n) => n._id === notificationId);
    const confirmMessage = target?.isGlobal
      ? "This will remove the notification from your list only. Continue?"
      : "Are you sure you want to delete this notification? This cannot be undone.";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(notificationId);
      setError(null);

      const response = await api.delete(`/notification/${notificationId}`);
      const result = response.data;

      if (result.success) {
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );
        showSuccess("Notification deleted");

        // Update total count
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(result?.message || "Failed to delete notification");
      }
    } catch (error: any) {
      console.error("Delete notification error:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to delete notification"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      setActionLoading(notificationId);
      setError(null);

      const response = await api.put(`/notification/${notificationId}/read`);
      const result = response.data;

      if (result.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, status: "read", readAt: new Date().toISOString() }
              : notification
          )
        );
        showSuccess("Marked as read");
      } else {
        throw new Error(result?.message || "Failed to mark as read");
      }
    } catch (error: any) {
      console.error("Mark as read error:", error);
      setError(error.response?.data?.message || error.message || "Failed to mark as read");
    } finally {
      setActionLoading(null);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const unreadIds = notifications.filter((n) => n.status === "unread").map((n) => n._id);

      if (unreadIds.length === 0) {
        showSuccess("No unread notifications");
        return;
      }

      // Backend marks all of this user's unread notifications as read
      // (personal ones directly, global ones via NotificationRec upserts).
      // notificationIds isn't required, but harmless to send.
      const response = await api.put("/notification/mark-all-read", {
        notificationIds: unreadIds,
      });

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.status === "unread"
              ? { ...notification, status: "read", readAt: new Date().toISOString() }
              : notification
          )
        );
        showSuccess(`Marked ${unreadIds.length} notifications as read`);
      }
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      setError(error.response?.data?.message || "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter: "all" | "unread" | "archived") => {
    setFilter(newFilter);
    setPage(1);
  };

  // Handle page navigation
  const handleNextPage = () => {
    if (page < totalPages) {
      fetchNotifications(page + 1, filter);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      fetchNotifications(page - 1, filter);
    }
  };

  // Show success message with auto-dismiss
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Format date
  const formatDate = (date: string) => {
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
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "low":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "read":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "archived":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Get filtered notifications
  // NOTE: the backend already filters by `status` via the query params in
  // fetchNotifications, so this is just a client-side safety net (e.g. right
  // after an optimistic update) rather than the primary filtering mechanism.
  const getFilteredNotifications = () => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.status === filter);
  };

  const filteredNotifications = getFilteredNotifications();

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reload when filter changes
  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter, fetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{totalCount} total notifications</p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Mark all as read
              </button>
            )}
            <button
              onClick={() => fetchNotifications(page, filter)}
              disabled={loading}
              className="rounded-lg bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {successMessage}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
            {["all", "unread", "archived"].map((option) => (
              <button
                key={option}
                onClick={() => handleFilterChange(option as any)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition capitalize ${
                  filter === option
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option}
                {option === "unread" && unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-lg bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No notifications</p>
              <p className="mt-1 text-xs text-gray-400">
                {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 transition hover:bg-gray-50 ${
                      notification.status === "unread"
                        ? "bg-blue-50/50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadge(
                              notification.status
                            )}`}
                          >
                            {notification.status}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority}
                          </span>
                          {notification.isGlobal ? (
                            <Globe className="h-3.5 w-3.5 text-purple-500" title="Global" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-blue-500" title="Personal" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600">{notification.message}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                          <span>{formatDate(notification.createdAt)}</span>
                          <span>•</span>
                          <span className="capitalize">
                            Type: {notification.type.replace("-", " ")}
                          </span>

                          {notification.sender?.name && (
                            <>
                              <span>•</span>
                              <span>From: {notification.sender.name}</span>
                            </>
                          )}

                          {notification.channels && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {notification.channels.inApp && (
                                  <BellIcon className="h-3 w-3" title="In-app" />
                                )}
                                {notification.channels.email && (
                                  <Mail className="h-3 w-3" title="Email" />
                                )}
                                {notification.channels.push && (
                                  <Smartphone className="h-3 w-3" title="Push" />
                                )}
                                {notification.channels.sms && (
                                  <AlertCircle className="h-3 w-3" title="SMS" />
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {notification.data?.actionText && (
                          <button
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              if (notification.data?.url) {
                                window.location.href = notification.data.url;
                              }
                            }}
                          >
                            {notification.data.actionText}
                            <Send className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {notification.status === "unread" && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            disabled={actionLoading === notification._id}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                            title="Mark as read"
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {notification.status !== "archived" && (
                          <button
                            onClick={() => archiveNotification(notification._id)}
                            disabled={actionLoading === notification._id}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600 disabled:opacity-50"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteNotification(notification._id)}
                          disabled={actionLoading === notification._id}
                          className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title={
                            notification.isGlobal
                              ? "Remove from my notifications"
                              : "Delete"
                          }
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
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <button
                    disabled={page <= 1 || loading}
                    onClick={handlePreviousPage}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-400">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    disabled={page >= totalPages || loading}
                    onClick={handleNextPage}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
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















// "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   Bell,
//   Trash2,
//   Archive,
//   Check,
//   Loader2,
//   X,
//   Send,
//   Globe,
//   User,
//   Mail,
//   Bell as BellIcon,
//   Smartphone,
//   AlertCircle,
//   RefreshCw,
// } from "lucide-react";
// import api from "../axiosInstance";
// import { useAuth } from "../context/UserContext";

// interface NotificationData {
//   courseId?: string;
//   lessonId?: string;
//   testId?: string;
//   classId?: string;
//   url?: string;
//   actionText?: string;
// }

// interface Notification {
//   _id: string;
//   recipient?: string;
//   isGlobal: boolean;
//   sender?: {
//     _id: string;
//     name?: string;
//     email?: string;
//     profileImage?: string;
//   };
//   title: string;
//   message: string;
//   type: string;
//   priority: "low" | "medium" | "high" | "urgent";
//   data?: NotificationData;
//   channels?: {
//     inApp: boolean;
//     email: boolean;
//     push: boolean;
//     sms: boolean;
//   };
//   status: "unread" | "read" | "archived";
//   readAt?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface NotificationResponse {
//   success: boolean;
//   data: Notification[];
//   pagination: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

// const Notifications = () => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [filter, setFilter] = useState<"all" | "unread" | "archived">("all");
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);
//   const [totalCount, setTotalCount] = useState(0);
  
//   const { user, fetchUserProfile } = useAuth() as any;

//   // Fetch notifications with memoization
//   const fetchNotifications = useCallback(async (currentPage = 1, currentFilter = filter) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams({
//         page: currentPage.toString(),
//         limit: "10",
//       });

//       // Add filters only if they exist
//       if (user?.lastActive) {
//         params.append("isActive", user.lastActive.split('T')[0]);
//       }
//       // if (user?.category?._id) {
//       //   params.append("category", user.category._id);
//       // }
//       if (currentFilter !== "all") {
//         params.append("status", currentFilter);
//       }

//       const response = await api.get(`/notification?${params.toString()}`);
//       const result: NotificationResponse = response.data;

//       if (result.success) {
//         setNotifications(result.data || []);
//         setTotalPages(result.pagination?.totalPages || 1);
//         setTotalCount(result.pagination?.total || 0);
//         setPage(result.pagination?.page || currentPage);
//       } else {
//         throw new Error("Failed to fetch notifications");
//       }
//     } catch (error: any) {
//       console.error("Fetch notifications error:", error);
//       setError(error.response?.data?.message || error.message || "Failed to load notifications");
//     } finally {
//       setLoading(false);
//     }
//   }, [user, filter]);

//   // Archive notification
//   const archiveNotification = async (notificationId: string) => {
//     try {
//       setActionLoading(notificationId);
//       setError(null);

//       const response = await api.put(`/notification/${notificationId}/archive`);
//       const result = response.data;

//       if (result.success) {
//         setNotifications((prev) =>
//           prev.filter((notification) => notification._id !== notificationId)
//         );
//         showSuccess("Notification archived successfully");
        
//         // Update total count
//         setTotalCount(prev => Math.max(0, prev - 1));
//       } else {
//         throw new Error(result?.message || "Failed to archive notification");
//       }
//     } catch (error: any) {
//       console.error("Archive notification error:", error);
//       setError(error.response?.data?.message || error.message || "Failed to archive notification");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // Delete notification
//   const deleteNotification = async (notificationId: string) => {
//     if (!confirm("Are you sure you want to delete this notification?")) {
//       return;
//     }

//     try {
//       setActionLoading(notificationId);
//       setError(null);

//       const response = await api.delete(`/notification/${notificationId}`);
//       const result = response.data;

//       if (result.success) {
//         setNotifications((prev) =>
//           prev.filter((notification) => notification._id !== notificationId)
//         );
//         showSuccess("Notification deleted successfully");
        
//         // Update total count
//         setTotalCount(prev => Math.max(0, prev - 1));
//       } else {
//         throw new Error(result?.message || "Failed to delete notification");
//       }
//     } catch (error: any) {
//       console.error("Delete notification error:", error);
//       setError(error.response?.data?.message || error.message || "Failed to delete notification");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // Mark as read
//   const markAsRead = async (notificationId: string) => {
//     try {
//       setActionLoading(notificationId);
//       setError(null);

//       const response = await api.put(`/notification/${notificationId}/read`);
//       const result = response.data;

//       if (result.success) {
//         setNotifications((prev) =>
//           prev.map((notification) =>
//             notification._id === notificationId
//               ? { ...notification, status: "read", readAt: new Date().toISOString() }
//               : notification
//           )
//         );
//         showSuccess("Marked as read");
//       } else {
//         throw new Error(result?.message || "Failed to mark as read");
//       }
//     } catch (error: any) {
//       console.error("Mark as read error:", error);
//       setError(error.response?.data?.message || error.message || "Failed to mark as read");
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // Mark all as read
//   const markAllAsRead = async () => {
//     try {
//       setLoading(true);
//       const unreadIds = notifications
//         .filter(n => n.status === "unread")
//         .map(n => n._id);

//       if (unreadIds.length === 0) {
//         showSuccess("No unread notifications");
//         return;
//       }

//       const response = await api.put('/notification/mark-all-read', {
//         notificationIds: unreadIds
//       });

//       if (response.data.success) {
//         setNotifications(prev =>
//           prev.map(notification =>
//             notification.status === "unread"
//               ? { ...notification, status: "read", readAt: new Date().toISOString() }
//               : notification
//           )
//         );
//         showSuccess(`Marked ${unreadIds.length} notifications as read`);
//       }
//     } catch (error: any) {
//       console.error("Mark all as read error:", error);
//       setError(error.response?.data?.message || "Failed to mark all as read");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle filter change
//   const handleFilterChange = (newFilter: "all" | "unread" | "archived") => {
//     setFilter(newFilter);
//     setPage(1);
//   };

//   // Handle page navigation
//   const handleNextPage = () => {
//     if (page < totalPages) {
//       fetchNotifications(page + 1, filter);
//     }
//   };

//   const handlePreviousPage = () => {
//     if (page > 1) {
//       fetchNotifications(page - 1, filter);
//     }
//   };

//   // Show success message with auto-dismiss
//   const showSuccess = (message: string) => {
//     setSuccessMessage(message);
//     setTimeout(() => setSuccessMessage(null), 3000);
//   };

//   // Format date
//   const formatDate = (date: string) => {
//     const created = new Date(date);
//     const now = new Date();
//     const diff = now.getTime() - created.getTime();

//     const minutes = Math.floor(diff / 60000);
//     const hours = Math.floor(diff / 3600000);
//     const days = Math.floor(diff / 86400000);

//     if (minutes < 1) return "Just now";
//     if (minutes < 60) return `${minutes}m ago`;
//     if (hours < 24) return `${hours}h ago`;
//     if (days < 7) return `${days}d ago`;
//     return created.toLocaleDateString();
//   };

//   // Get priority color
//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case "urgent": return "text-red-600 bg-red-50 border-red-200";
//       case "high": return "text-orange-600 bg-orange-50 border-orange-200";
//       case "medium": return "text-blue-600 bg-blue-50 border-blue-200";
//       case "low": return "text-gray-600 bg-gray-50 border-gray-200";
//       default: return "text-gray-600 bg-gray-50 border-gray-200";
//     }
//   };

//   // Get status badge
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "unread": return "bg-blue-100 text-blue-700 border-blue-200";
//       case "read": return "bg-gray-100 text-gray-700 border-gray-200";
//       case "archived": return "bg-yellow-100 text-yellow-700 border-yellow-200";
//       default: return "bg-gray-100 text-gray-700 border-gray-200";
//     }
//   };

//   // Get filtered notifications
//   const getFilteredNotifications = () => {
//     if (filter === "all") return notifications;
//     return notifications.filter(n => n.status === filter);
//   };

//   const filteredNotifications = getFilteredNotifications();

//   // Initial load
//   useEffect(() => {
//     fetchNotifications();
//   }, [fetchNotifications]);

//   // Reload when filter changes
//   useEffect(() => {
//     fetchNotifications(1, filter);
//   }, [filter, fetchNotifications]);

//   // Calculate unread count
//   const unreadCount = notifications.filter(n => n.status === "unread").length;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
//       <div className="mx-auto max-w-7xl">
//         {/* Header */}
//         <div className="mb-8 flex items-center justify-between">
//           <div>
//             <div className="flex items-center gap-3">
//               <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
//               {unreadCount > 0 && (
//                 <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
//                   {unreadCount} unread
//                 </span>
//               )}
//             </div>
//             <p className="mt-1 text-sm text-gray-500">
//               {totalCount} total notifications
//             </p>
//           </div>
          
//           <div className="flex items-center gap-3">
//             {unreadCount > 0 && (
//               <button
//                 onClick={markAllAsRead}
//                 disabled={loading}
//                 className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {loading ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Check className="h-4 w-4" />
//                 )}
//                 Mark all as read
//               </button>
//             )}
//             <button
//               onClick={() => fetchNotifications(page, filter)}
//               disabled={loading}
//               className="rounded-lg bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
//               title="Refresh"
//             >
//               <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
//             </button>
//           </div>
//         </div>

//         {/* Success/Error Messages */}
//         {successMessage && (
//           <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
//             <div className="flex items-center gap-2">
//               <Check className="h-4 w-4" />
//               {successMessage}
//             </div>
//           </div>
//         )}
        
//         {error && (
//           <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
//             <div className="flex items-center gap-2">
//               <AlertCircle className="h-4 w-4" />
//               {error}
//             </div>
//           </div>
//         )}

//         {/* Filters */}
//         <div className="mb-6 flex flex-wrap items-center gap-4">
//           <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
//             {["all", "unread", "archived"].map((option) => (
//               <button
//                 key={option}
//                 onClick={() => handleFilterChange(option as any)}
//                 className={`rounded-md px-4 py-2 text-sm font-medium transition capitalize ${
//                   filter === option
//                     ? "bg-blue-600 text-white shadow-sm"
//                     : "text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 {option}
//                 {option === "unread" && unreadCount > 0 && (
//                   <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
//                     {unreadCount}
//                   </span>
//                 )}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Notifications List */}
//         <div className="rounded-lg bg-white shadow-sm overflow-hidden">
//           {loading ? (
//             <div className="flex items-center justify-center py-12">
//               <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//             </div>
//           ) : filteredNotifications.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-12">
//               <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
//                 <Bell className="h-8 w-8 text-gray-400" />
//               </div>
//               <p className="text-sm font-medium text-gray-700">No notifications</p>
//               <p className="mt-1 text-xs text-gray-400">
//                 {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="divide-y divide-gray-200">
//                 {filteredNotifications.map((notification) => (
//                   <div
//                     key={notification._id}
//                     className={`p-4 transition hover:bg-gray-50 ${
//                       notification.status === "unread" ? "bg-blue-50/50 border-l-4 border-blue-500" : ""
//                     }`}
//                   >
//                     <div className="flex items-start justify-between gap-4">
//                       <div className="flex-1 space-y-2">
//                         <div className="flex flex-wrap items-center gap-2">
//                           <h3 className="text-sm font-medium text-gray-900">
//                             {notification.title}
//                           </h3>
//                           <span
//                             className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadge(
//                               notification.status
//                             )}`}
//                           >
//                             {notification.status}
//                           </span>
//                           <span
//                             className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(
//                               notification.priority
//                             )}`}
//                           >
//                             {notification.priority}
//                           </span>
//                           {notification.isGlobal ? (
//                             <Globe className="h-3.5 w-3.5 text-purple-500" title="Global" />
//                           ) : (
//                             <User className="h-3.5 w-3.5 text-blue-500" title="Personal" />
//                           )}
//                         </div>

//                         <p className="text-sm text-gray-600">{notification.message}</p>

//                         <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
//                           <span>{formatDate(notification.createdAt)}</span>
//                           <span>•</span>
//                           <span className="capitalize">Type: {notification.type.replace('-', ' ')}</span>
                          
//                           {notification.sender?.name && (
//                             <>
//                               <span>•</span>
//                               <span>From: {notification.sender.name}</span>
//                             </>
//                           )}
                          
//                           {notification.channels && (
//                             <>
//                               <span>•</span>
//                               <div className="flex items-center gap-1">
//                                 {notification.channels.inApp && (
//                                   <BellIcon className="h-3 w-3" title="In-app" />
//                                 )}
//                                 {notification.channels.email && (
//                                   <Mail className="h-3 w-3" title="Email" />
//                                 )}
//                                 {notification.channels.push && (
//                                   <Smartphone className="h-3 w-3" title="Push" />
//                                 )}
//                                 {notification.channels.sms && (
//                                   <AlertCircle className="h-3 w-3" title="SMS" />
//                                 )}
//                               </div>
//                             </>
//                           )}
//                         </div>

//                         {notification.data?.actionText && (
//                           <button 
//                             className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
//                             onClick={() => {
//                               if (notification.data?.url) {
//                                 window.location.href = notification.data.url;
//                               }
//                             }}
//                           >
//                             {notification.data.actionText}
//                             <Send className="h-3 w-3" />
//                           </button>
//                         )}
//                       </div>

//                       <div className="flex items-center gap-1 flex-shrink-0">
//                         {notification.status === "unread" && (
//                           <button
//                             onClick={() => markAsRead(notification._id)}
//                             disabled={actionLoading === notification._id}
//                             className="rounded-md p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
//                             title="Mark as read"
//                           >
//                             {actionLoading === notification._id ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Check className="h-4 w-4" />
//                             )}
//                           </button>
//                         )}

//                         {notification.status !== "archived" && (
//                           <button
//                             onClick={() => archiveNotification(notification._id)}
//                             disabled={actionLoading === notification._id}
//                             className="rounded-md p-1.5 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600 disabled:opacity-50"
//                             title="Archive"
//                           >
//                             <Archive className="h-4 w-4" />
//                           </button>
//                         )}

//                         {/* <button
//                           onClick={() => deleteNotification(notification._id)}
//                           disabled={actionLoading === notification._id}
//                           className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//                           title="Delete"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </button> */}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Pagination */}
//               {totalPages > 1 && (
//                 <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
//                   <button
//                     disabled={page <= 1 || loading}
//                     onClick={handlePreviousPage}
//                     className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Previous
//                   </button>

//                   <span className="text-sm text-gray-400">
//                     Page {page} of {totalPages}
//                   </span>

//                   <button
//                     disabled={page >= totalPages || loading}
//                     onClick={handleNextPage}
//                     className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Next
//                   </button>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Notifications;