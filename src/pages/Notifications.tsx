
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  CreditCard,
  Megaphone,
  X,
  Calendar,
  Clock,
  Info,
  Layers,
  Hash,
  Circle,
} from "lucide-react";
import { useTheme, type FilterType } from "../context/ThemeContext";
import { listenForMessages } from "../firebase/messaging";

// --- Type Definitions ---

interface NotificationData {
  courseId?: string;
  contentId?: string;
  testId?: string;
  url?: string;
  actionText?: string;
}

interface Notification {
  _id: string;
  isGlobal: boolean;
  notificationScope: "personal" | "global";
  title: string;
  message: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  isActive: boolean;
  data?: NotificationData;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt?: string;
}

// --- Detail Modal Component ---
const NotificationDetailModal = ({
  notification,
  onClose,
  onMarkAsRead,
  onDelete,
  formatDate,
  getIconConfig,
  isActing,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (notification: Notification) => void;
  formatDate: (date: string) => string;
  getIconConfig: (notification: Notification) => { Icon: any; bg: string; text: string };
  isActing: boolean;
}) => {
  const { Icon, bg, text } = getIconConfig(notification);
  const isGlobal = notification.isGlobal || notification.notificationScope === "global";

  // Helper to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Helper to get status color
  const getStatusColor = (isRead: boolean) => {
    return isRead ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-start justify-between z-10">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${bg} ${text}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notification Details</h2>
                <p className="text-xs text-gray-500">ID: {notification._id.slice(0, 12)}...</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Title & Status */}
            <div>
              <div className="flex items-start gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900 flex-1">{notification.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(notification.isRead)}`}>
                    <Circle className={`h-2 w-2 ${notification.isRead ? "fill-green-500" : "fill-orange-500"}`} />
                    {notification.isRead ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Type */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Type</span>
                </div>
                <p className="text-sm font-medium text-gray-800 capitalize">{notification.type || "General"}</p>
              </div>

              {/* Priority */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Priority</span>
                </div>
                <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                  {notification.priority || "Normal"}
                </span>
              </div>

              {/* Scope */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  {isGlobal ? <Globe className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  <span>Scope</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${isGlobal ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                  {isGlobal ? <Globe className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {isGlobal ? "Global" : "Personal"}
                </span>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Info className="h-3.5 w-3.5" />
                  <span>Status</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${notification.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  <Circle className={`h-2 w-2 ${notification.isActive ? "fill-green-500" : "fill-gray-400"}`} />
                  {notification.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created</span>
                </div>
                <p className="text-sm text-gray-800">{formatDate(notification.createdAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated</span>
                </div>
                <p className="text-sm text-gray-800">{formatDate(notification.updatedAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(notification.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Read At (if read) */}
            {notification.readAt && (
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Read At</span>
                </div>
                <p className="text-sm text-gray-800">{formatDate(notification.readAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(notification.readAt).toLocaleString()}</p>
              </div>
            )}

            {/* Action Data */}
            {notification.data && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Hash className="h-3.5 w-3.5" />
                  <span>Associated Data</span>
                </div>
                <div className="space-y-1.5 text-sm text-gray-700">
                  {notification.data.courseId && (
                    <p><span className="text-gray-500">Course ID:</span> {notification.data.courseId}</p>
                  )}
                  {notification.data.contentId && (
                    <p><span className="text-gray-500">Content ID:</span> {notification.data.contentId}</p>
                  )}
                  {notification.data.testId && (
                    <p><span className="text-gray-500">Test ID:</span> {notification.data.testId}</p>
                  )}
                  {notification.data.actionText && (
                    <p><span className="text-gray-500">Action:</span> {notification.data.actionText}</p>
                  )}
                  {notification.data.url && (
                    <p className="truncate"><span className="text-gray-500">URL:</span> <span className="text-blue-600">{notification.data.url}</span></p>
                  )}
                  {!notification.data.courseId && !notification.data.contentId && !notification.data.testId && !notification.data.actionText && !notification.data.url && (
                    <p className="text-gray-400 italic">No additional data</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  if (!notification.isRead) {
                    onMarkAsRead(notification._id);
                  }
                  if (notification.data?.url) {
                    window.location.href = notification.data.url;
                  }
                }}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  notification.isRead
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {notification.isRead ? (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Go to Content
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Mark as Read & Continue
                  </>
                )}
              </button>

              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification._id)}
                  disabled={isActing}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Read"}
                </button>
              )}

              <button
                onClick={() => onDelete(notification)}
                disabled={isActing}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom-4 {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation-duration: 0.2s;
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
      `}</style>
    </>
  );
};

const Notifications = () => {
  const {
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
  } = useTheme();

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

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

  // --- Handlers (thin wrappers around context actions) ---

  const handleFilterChange = useCallback(
    (newFilter: FilterType) => {
      setFilter(newFilter);
    },
    [setFilter],
  );

  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      loadMoreNotifications();
    }
  }, [page, totalPages, loadingMore, loadMoreNotifications]);

  const handleRefresh = useCallback(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // Open the detail modal instead of just navigating
      setSelectedNotification(notification);
      
      // Mark as read if unread
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);
        // Update the notification in the selected state to reflect it's now read
        setSelectedNotification({ ...notification, isRead: true });
      }
    },
    [markNotificationAsRead],
  );

  const handleDelete = useCallback(
    (notification: Notification) => {
      const confirmMessage = notification.isGlobal
        ? "This will remove the notification from your list only. Continue?"
        : "Are you sure you want to delete this notification? This cannot be undone.";

      if (!window.confirm(confirmMessage)) return;
      deleteNotification(notification._id);
      setSelectedNotification(null);
    },
    [deleteNotification],
  );

  const handleModalMarkAsRead = useCallback(
    async (id: string) => {
      await markNotificationAsRead(id);
      if (selectedNotification) {
        setSelectedNotification({ ...selectedNotification, isRead: true });
      }
    },
    [markNotificationAsRead, selectedNotification],
  );

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Tab counts derived from currently loaded notifications + server totals
  const tabCounts = useMemo(() => {
    const all = totalCount;
    const unread = personalUnread + globalUnread;
    const read = notifications.filter((n) => n.isRead).length;
    const course = notifications.filter((n) => n.type?.toLowerCase().includes("course")).length;
    const offer = notifications.filter((n) => n.type?.toLowerCase().includes("offer")).length;
    const reminder = notifications.filter((n) => n.type?.toLowerCase().includes("reminder")).length;
    const announcement = notifications.filter((n) => n.type?.toLowerCase().includes("announcement")).length;
    const payment = notifications.filter((n) => n.type?.toLowerCase().includes("payment")).length;
    const system = notifications.filter((n) => n.type?.toLowerCase().includes("system")).length;

    return { all, unread, read, course, offer, reminder, announcement, payment, system };
  }, [notifications, totalCount, personalUnread, globalUnread]);

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
    <div className="min-h-screen p-4">
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
              onClick={markAllNotificationsAsRead}
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

        {/* Error Message (context-level) */}
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
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                  filter === item.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
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
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : notifications.length === 0 ? (
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
                {notifications.map((notification: Notification) => {
                  const { Icon, bg, text } = getIconConfig(notification);
                  const isUnread = !notification.isRead;
                  const isGlobal = notification.isGlobal || notification.notificationScope === "global";
                  const isActing = actionLoadingId === notification._id;

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
                              {isUnread && (
                                <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                              )}
                              <h3 className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                                {notification.title}
                              </h3>
                              {isGlobal ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100">
                                  <Globe className="h-3 w-3" /> Global
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 border border-green-100">
                                  <User className="h-3 w-3" /> Personal
                                </span>
                              )}
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

                          {/* Click to view details indicator */}
                          <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
                            <Info className="h-3 w-3" />
                            <span>Click to view full details</span>
                          </div>
                        </div>

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
                                markNotificationAsRead(notification._id);
                              }}
                              disabled={isActing}
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
                              title="Mark as read"
                            >
                              {isActing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification);
                            }}
                            disabled={isActing}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title={isGlobal ? "Remove" : "Delete"}
                          >
                            {isActing ? (
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
                  Showing {notifications.length} of {totalCount} notifications
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkAsRead={handleModalMarkAsRead}
          onDelete={handleDelete}
          formatDate={formatDate}
          getIconConfig={getIconConfig}
          isActing={actionLoadingId === selectedNotification._id}
        />
      )}
    </div>
  );
};

export default Notifications;



// "use client";

// import React, { useCallback, useEffect, useMemo } from "react";
// import {
//   Bell,
//   Trash2,
//   Check,
//   Loader2,
//   ArrowRight,
//   FileText,
//   Video,
//   Trophy,
//   Tag,
//   ChevronDown,
//   Globe,
//   User,
//   AlertCircle,
//   RefreshCw,
//   Settings,
//   BookOpen,
//   CreditCard,
//   Megaphone,
// } from "lucide-react";
// import { useTheme, type FilterType } from "../context/ThemeContext";
// import { listenForMessages } from "../firebase/messaging";

// // --- Type Definitions ---

// interface NotificationData {
//   courseId?: string;
//   contentId?: string;
//   testId?: string;
//   url?: string;
//   actionText?: string;
// }

// interface Notification {
//   _id: string;
//   isGlobal: boolean;
//   notificationScope: "personal" | "global";
//   title: string;
//   message: string;
//   type: string;
//   priority: "low" | "medium" | "high" | "urgent";
//   isActive: boolean;
//   data?: NotificationData;
//   createdAt: string;
//   updatedAt: string;
//   isRead: boolean;
//   readAt?: string;
// }

// const Notifications = () => {
//   const {
//     notifications,
//     unreadCount,
//     personalUnread,
//     globalUnread,
//     loading,
//     loadingMore,
//     actionLoadingId,
//     error,
//     page,
//     totalPages,
//     totalCount,
//     filter,
//     setFilter,
//     fetchNotifications,
//     fetchUnreadCounts,
//     refreshNotifications,
//     loadMoreNotifications,
//     markNotificationAsRead,
//     markAllNotificationsAsRead,
//     deleteNotification,
//   } = useTheme();

//   const formatDate = useCallback((date: string) => {
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
//   }, []);

//   // Helper to get icon based on notification type
//   const getIconConfig = useCallback((notification: Notification) => {
//     const title = notification.title?.toLowerCase() || "";
//     const type = notification.type?.toLowerCase() || "";

//     if (type.includes("course") || title.includes("course") || title.includes("lesson")) {
//       return { Icon: BookOpen, bg: "bg-blue-50", text: "text-blue-500" };
//     }
//     if (type.includes("test") || title.includes("mock") || title.includes("quiz") || title.includes("exam")) {
//       return { Icon: FileText, bg: "bg-orange-100", text: "text-orange-500" };
//     }
//     if (type.includes("class") || title.includes("live") || type.includes("reminder")) {
//       return { Icon: Video, bg: "bg-green-100", text: "text-green-500" };
//     }
//     if (title.includes("congratulations") || type.includes("result") || title.includes("score")) {
//       return { Icon: Trophy, bg: "bg-purple-100", text: "text-purple-500" };
//     }
//     if (type.includes("offer") || title.includes("discount") || title.includes("sale") || type.includes("promotion")) {
//       return { Icon: Tag, bg: "bg-pink-100", text: "text-pink-500" };
//     }
//     if (type.includes("payment") || title.includes("payment") || title.includes("subscription") || title.includes("expiring")) {
//       return { Icon: CreditCard, bg: "bg-red-100", text: "text-red-500" };
//     }
//     if (type.includes("system") || title.includes("update") || title.includes("maintenance")) {
//       return { Icon: Settings, bg: "bg-gray-100", text: "text-gray-500" };
//     }
//     if (type.includes("announcement") || title.includes("announcement")) {
//       return { Icon: Megaphone, bg: "bg-yellow-100", text: "text-yellow-500" };
//     }

//     return { Icon: Bell, bg: "bg-gray-100", text: "text-gray-500" };
//   }, []);

//   // --- Handlers (thin wrappers around context actions) ---

//   const handleFilterChange = useCallback(
//     (newFilter: FilterType) => {
//       setFilter(newFilter);
//     },
//     [setFilter],
//   );

//   const handleLoadMore = useCallback(() => {
//     if (page < totalPages && !loadingMore) {
//       loadMoreNotifications();
//     }
//   }, [page, totalPages, loadingMore, loadMoreNotifications]);

//   const handleRefresh = useCallback(() => {
//     refreshNotifications();
//   }, [refreshNotifications]);

//   const handleNotificationClick = useCallback(
//     async (notification: Notification) => {
//       if (!notification.isRead) {
//         await markNotificationAsRead(notification._id);
//       }
//       if (notification.data?.url) {
//         window.location.href = notification.data.url;
//       }
//     },
//     [markNotificationAsRead],
//   );

//   const handleDelete = useCallback(
//     (notification: Notification) => {
//       const confirmMessage = notification.isGlobal
//         ? "This will remove the notification from your list only. Continue?"
//         : "Are you sure you want to delete this notification? This cannot be undone.";

//       if (!window.confirm(confirmMessage)) return;
//       deleteNotification(notification._id);
//     },
//     [deleteNotification],
//   );

  
//   useEffect(() => {
//     fetchUnreadCounts();
//   }, [fetchUnreadCounts]);



//   // Tab counts derived from currently loaded notifications + server totals
//   const tabCounts = useMemo(() => {
//     const all = totalCount;
//     const unread = personalUnread + globalUnread;
//     const read = notifications.filter((n) => n.isRead).length;
//     const course = notifications.filter((n) => n.type?.toLowerCase().includes("course")).length;
//     const offer = notifications.filter((n) => n.type?.toLowerCase().includes("offer")).length;
//     const reminder = notifications.filter((n) => n.type?.toLowerCase().includes("reminder")).length;
//     const announcement = notifications.filter((n) => n.type?.toLowerCase().includes("announcement")).length;
//     const payment = notifications.filter((n) => n.type?.toLowerCase().includes("payment")).length;
//     const system = notifications.filter((n) => n.type?.toLowerCase().includes("system")).length;

//     return { all, unread, read, course, offer, reminder, announcement, payment, system };
//   }, [notifications, totalCount, personalUnread, globalUnread]);

//   const tabs: Array<{ id: FilterType; label: string }> = [
//     { id: "all", label: "All" },
//     { id: "unread", label: "Unread" },
//     { id: "read", label: "Read" },
//     { id: "course", label: "Course" },
//     { id: "offer", label: "Offer" },
//     { id: "reminder", label: "Reminder" },
//     { id: "announcement", label: "Announcement" },
//     { id: "payment", label: "Payment" },
//     { id: "system", label: "System" },
//   ];

//   return (
//     <div className="min-h-screen p-4 ">
//       <div className="mx-auto max-w-7xl">
//         {/* Header Section */}
//         <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Stay updated with the latest alerts and important updates.
//               {unreadCount > 0 && (
//                 <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
//                   {unreadCount} unread
//                 </span>
//               )}
//             </p>
//           </div>

//           {/* Mark all as read */}
//           {unreadCount > 0 && (
//             <button
//               onClick={markAllNotificationsAsRead}
//               disabled={loading}
//               className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition disabled:opacity-50 self-start md:self-auto"
//             >
//               {loading ? (
//                 <Loader2 className="h-4 w-4 animate-spin" />
//               ) : (
//                 <Check className="h-4 w-4" strokeWidth={3} />
//               )}
//               Mark all as read
//             </button>
//           )}
//         </div>

//         {/* Error Message (context-level) */}
//         {error && (
//           <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center gap-2">
//             <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
//           </div>
//         )}

//         {/* Filters Row */}
//         <div className="mb-6 flex flex-wrap items-center gap-2 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
//           {tabs.map((item) => (
//             <button
//               key={item.id}
//               onClick={() => handleFilterChange(item.id)}
//               className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all border ${
//                 filter === item.id
//                   ? "bg-orange-500 text-white border-orange-500 shadow-sm"
//                   : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
//               }`}
//             >
//               {item.label}
//               <span
//                 className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
//                   filter === item.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
//                 }`}
//               >
//                 {tabCounts[item.id as keyof typeof tabCounts] || 0}
//               </span>
//             </button>
//           ))}

//           <button
//             onClick={handleRefresh}
//             disabled={loading}
//             className="ml-auto rounded-full bg-white p-2 text-gray-400 border border-gray-200 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50"
//             title="Refresh"
//           >
//             <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//           </button>
//         </div>

//         {/* Notifications List */}
//         <div className="space-y-4">
//           {loading && notifications.length === 0 ? (
//             <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
//               <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
//             </div>
//           ) : notifications.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
//               <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
//                 <Bell className="h-8 w-8 text-gray-300" />
//               </div>
//               <p className="text-sm font-medium text-gray-700">No notifications</p>
//               <p className="mt-1 text-xs text-gray-400">
//                 {filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
//                 {notifications.map((notification: Notification) => {
//                   const { Icon, bg, text } = getIconConfig(notification);
//                   const isUnread = !notification.isRead;
//                   const isGlobal = notification.isGlobal || notification.notificationScope === "global";
//                   const isActing = actionLoadingId === notification._id;

//                   return (
//                     <div
//                       key={notification._id}
//                       onClick={() => handleNotificationClick(notification)}
//                       className={`p-5 transition-colors hover:bg-gray-50/50 relative group cursor-pointer ${
//                         isUnread ? "bg-orange-50/30" : ""
//                       }`}
//                     >
//                       <div className="flex gap-4">
//                         {/* Icon Box */}
//                         <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl ${bg} ${text}`}>
//                           <Icon className="h-5 w-5" strokeWidth={2} />
//                         </div>

//                         {/* Content */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between gap-4">
//                             <div className="flex items-center gap-2 flex-wrap">
//                               {isUnread && (
//                                 <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
//                               )}
//                               <h3 className={`text-sm ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
//                                 {notification.title}
//                               </h3>
//                               {isGlobal ? (
//                                 <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100">
//                                   <Globe className="h-3 w-3" /> Global
//                                 </span>
//                               ) : (
//                                 <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 border border-green-100">
//                                   <User className="h-3 w-3" /> Personal
//                                 </span>
//                               )}
//                               {notification.priority === "urgent" && (
//                                 <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 border border-red-200">
//                                   Urgent
//                                 </span>
//                               )}
//                               {notification.priority === "high" && (
//                                 <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600 border border-orange-200">
//                                   High
//                                 </span>
//                               )}
//                             </div>
//                             <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
//                               {formatDate(notification.createdAt)}
//                             </span>
//                           </div>

//                           <p className={`mt-1 text-sm leading-relaxed ${isUnread ? "text-gray-600" : "text-gray-500"}`}>
//                             {notification.message}
//                           </p>

//                           {notification.data?.actionText && (
//                             <button
//                               className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 if (notification.data?.url) {
//                                   window.location.href = notification.data.url;
//                                 }
//                               }}
//                             >
//                               {notification.data.actionText}
//                               <ArrowRight className="h-3 w-3" />
//                             </button>
//                           )}
//                         </div>

//                         {isUnread && (
//                           <div className="flex-shrink-0 pt-1.5">
//                             <div className="h-2 w-2 rounded-full bg-orange-500"></div>
//                           </div>
//                         )}

//                         {/* Hover Actions */}
//                         <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm pl-2 rounded-md">
//                           {isUnread && (
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 markNotificationAsRead(notification._id);
//                               }}
//                               disabled={isActing}
//                               className="rounded-md p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
//                               title="Mark as read"
//                             >
//                               {isActing ? (
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                               ) : (
//                                 <Check className="h-4 w-4" />
//                               )}
//                             </button>
//                           )}
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDelete(notification);
//                             }}
//                             disabled={isActing}
//                             className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//                             title={isGlobal ? "Remove" : "Delete"}
//                           >
//                             {isActing ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Trash2 className="h-4 w-4" />
//                             )}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Load More Button */}
//               {totalPages > 1 && page < totalPages && (
//                 <div className="flex justify-center pt-2">
//                   <button
//                     disabled={loadingMore}
//                     onClick={handleLoadMore}
//                     className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/50 px-6 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     {loadingMore ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <ChevronDown className="h-4 w-4" />
//                     )}
//                     {loadingMore ? "Loading..." : "Load More"}
//                   </button>
//                 </div>
//               )}

//               {/* Pagination Info */}
//               {totalCount > 0 && (
//                 <div className="text-center text-xs text-gray-400 pt-2">
//                   Showing {notifications.length} of {totalCount} notifications
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










