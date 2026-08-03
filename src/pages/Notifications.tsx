"use client";

import React, { useEffect, useState } from "react";
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
  
    const { user, fetchUserProfile } = useAuth() as any;

    console.log( user ," user, fetchUserProfile ")

  // Fetch notifications
  const fetchNotifications = async (currentPage = 1, currentFilter = filter) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        isActive : user?.lastActive?.split('T')[0],
        category : user?.category?._id
        // course : user?.
      });

      // if (currentFilter === "unread") {
      //   params.append("status", "unread");
      // } else if (currentFilter === "archived") {
      //   params.append("status", "archived");
      // }

      const response = await api.get(`/notification?${params.toString()}`);
      // const response = await api.get(`/notification`);
      const result: NotificationResponse = response.data;

      if (result.success) {
        setNotifications(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setPage(result.pagination?.page || currentPage);
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch (error: any) {
      console.error("Fetch notifications error:", error);
      setError(error.response?.data?.message || error.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

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
        setSuccessMessage("Notification archived");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result?.message || "Failed to archive notification");
      }
    } catch (error: any) {
      console.error("Archive notification error:", error);
      setError(error.response?.data?.message || error.message || "Failed to archive notification");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
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
        setSuccessMessage("Notification deleted");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(result?.message || "Failed to delete notification");
      }
    } catch (error: any) {
      console.error("Delete notification error:", error);
      setError(error.response?.data?.message || error.message || "Failed to delete notification");
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

  // Handle filter change
  const handleFilterChange = (newFilter: "all" | "unread" | "archived") => {
    setFilter(newFilter);
    setPage(1);
    fetchNotifications(1, newFilter);
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
      case "urgent": return "text-red-600 bg-red-50";
      case "high": return "text-orange-600 bg-orange-50";
      case "medium": return "text-blue-600 bg-blue-50";
      case "low": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread": return "bg-blue-100 text-blue-700";
      case "read": return "bg-gray-100 text-gray-700";
      case "archived": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
            <p className="mt-1 text-sm text-gray-500">
               {notifications.length}
            </p>
          </div>
          
          
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
            {["all", "unread", "archived"].map((option) => (
              <button
                key={option}
                onClick={() => handleFilterChange(option as any)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition capitalize ${
                  filter === option
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">No notifications</p>
              <p className="mt-1 text-xs text-gray-400">
                {filter === "all" ? "Create your first notification" : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 transition hover:bg-gray-50 ${
                      notification.status === "unread" ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(
                              notification.status
                            )}`}
                          >
                            {notification.status}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority}
                          </span>
                          {notification.isGlobal ? (
                            <Globe className="h-3.5 w-3.5 text-purple-500" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-blue-500" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600">{notification.message}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                          <span>{formatDate(notification.createdAt)}</span>
                          <span>•</span>
                          <span>Type: {notification.type}</span>
                          
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
                          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-blue-600">
                            {notification.data.actionText}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 pl-4">
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
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
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
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Notifications;