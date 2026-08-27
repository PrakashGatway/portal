"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Trash2,
  Archive,
  Check,
  Loader2,
  Send,
  Globe,
  User,
  Mail,
  Bell as BellIcon,
  Smartphone,
  AlertCircle,
  RefreshCw,
  Settings,
  ArrowRight,
  FileText,
  Video,
  Trophy,
  Tag,
  ChevronDown,
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
  // Expanded filter type to match the UI tabs, though backend might only use all/unread/archived
  const [filter, setFilter] = useState<string>("all"); 
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { user, fetchUserProfile } = useAuth() as any;

  // --- UI Specific State for Reference Design ---
  const [settings, setSettings] = useState({
    courseUpdates: true,
    liveClassReminders: true,
    testResults: true,
    promotions: true,
    systemUpdates: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to get icon and colors based on notification type/title to match the design
  const getIconConfig = (notification: Notification) => {
    const title = notification.title.toLowerCase();
    const type = notification.type.toLowerCase();
    
    if (type.includes("test") || title.includes("mock") || title.includes("new")) return { Icon: FileText, bg: "bg-orange-100", text: "text-orange-500" };
    if (type.includes("class") || title.includes("live")) return { Icon: Video, bg: "bg-green-100", text: "text-green-500" };
    if (title.includes("congratulations") || type.includes("result")) return { Icon: Trophy, bg: "bg-purple-100", text: "text-purple-500" };
    if (type.includes("promotion") || title.includes("discount") || title.includes("offer")) return { Icon: Tag, bg: "bg-orange-100", text: "text-orange-500" };
    if (title.includes("expiring") || title.includes("subscription")) return { Icon: Bell, bg: "bg-red-100", text: "text-red-500" };
    if (type.includes("system") || title.includes("update")) return { Icon: Settings, bg: "bg-gray-100", text: "text-gray-500" };
    
    return { Icon: Bell, bg: "bg-gray-100", text: "text-gray-500" };
  };

  // Format date to match reference ("10 min ago", "2 hours ago")
  const formatDate = (date: string) => {
    const created = new Date(date);
    const now = new Date();
    const diff = now.getTime() - created.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return created.toLocaleDateString();
  };

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
        
        // Map UI filters to backend status filters
        let statusParam = currentFilter;
        if (currentFilter === "updates" || currentFilter === "promotions" || currentFilter === "system") {
          // If your backend supports filtering by type, you'd append it here. 
          // For now, we just fetch 'all' or 'unread' and let the UI handle it, 
          // or we assume backend handles 'status' for unread/archived.
          if(currentFilter !== "all" && currentFilter !== "unread") {
             // Fallback to all if backend doesn't support these specific status names
             statusParam = "all"; 
          }
        }

        if (statusParam !== "all") {
          params.append("status", statusParam);
        }

        const response = await api.get(`/notification?isActive=${user.lastActive.split("T")[0]}`);
        const result: NotificationResponse = response.data;
        console.log("Fetched Notifications:", response);

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
  const handleFilterChange = (newFilter: string) => {
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

  // Get filtered notifications (Client side safety net)
  const getFilteredNotifications = () => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter(n => n.status === "unread");
    if (filter === "archived") return notifications.filter(n => n.status === "archived");
    
    // Simple client-side filtering for the new UI tabs if backend doesn't support them yet
    if (filter === "updates") return notifications.filter(n => n.type.includes("course") || n.type.includes("class") || n.type.includes("test"));
    if (filter === "promotions") return notifications.filter(n => n.type.includes("promotion") || n.title.toLowerCase().includes("discount"));
    if (filter === "system") return notifications.filter(n => n.type.includes("system"));
    
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();
  console.log(notifications, "Filtered Notifications");

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reload when filter changes
  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter, fetchNotifications]);

  // Calculate counts for UI badges
  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  
  // Mocking counts for the UI tabs based on current loaded data to match reference design
  const tabCounts = {
    all: totalCount,
    unread: unreadCount,
    updates: notifications.filter(n => n.type.includes("course") || n.type.includes("class") || n.type.includes("test")).length,
    promotions: notifications.filter(n => n.type.includes("promotion") || n.title.toLowerCase().includes("discount")).length,
    system: notifications.filter(n => n.type.includes("system")).length,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">Stay updated with the latest alerts and important updates.</p>
          </div>
          
          {/* Mark all as read - styled as text button with orange check */}
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
            <Check className="h-4 w-4" /> {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Filters Row */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {[
            { id: "all", label: "All" },
            { id: "unread", label: "Unread" },
            { id: "updates", label: "Updates" },
            { id: "promotions", label: "Promotions" },
            { id: "system", label: "System" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleFilterChange(item.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all border ${
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
          
          {/* Hidden refresh button to keep logic, styled subtly */}
          <button
            onClick={() => fetchNotifications(page, filter)}
            disabled={loading}
            className="ml-auto rounded-full bg-white p-2 text-gray-400 border border-gray-200 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Notifications List */}
          <div className="lg:col-span-2 space-y-4">
            {loading && filteredNotifications.length === 0 ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : filteredNotifications.length === 0 ? (
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
                  {filteredNotifications.map((notification) => {
                    const { Icon, bg, text } = getIconConfig(notification);
                    const isUnread = notification.status === "unread";

                    return (
                      <div
                        key={notification._id}
                        className="p-5 transition-colors hover:bg-gray-50/50 relative group bg-white"
                      >
                        <div className="flex gap-4">
                          {/* Icon Box */}
                          <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl ${bg} ${text}`}>
                            <Icon className="h-5 w-5" strokeWidth={2} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2">
                                {/* Unread Dot Indicator (Inline) */}
                                {isUnread && <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0"></div>}
                                <h3 className={`text-sm truncate ${isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                                  {notification.title}
                                </h3>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                            
                            <p className={`mt-1 text-sm leading-relaxed ${isUnread ? "text-gray-600" : "text-gray-500"}`}>
                              {notification.message}
                            </p>

                            {/* Action Button (if exists) */}
                            {notification.data?.actionText && (
                              <button
                                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                                onClick={() => {
                                  if (notification.data?.url) window.location.href = notification.data.url;
                                }}
                              >
                                {notification.data.actionText}
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Far Right Unread Dot (as seen in reference) */}
                          {isUnread && (
                            <div className="flex-shrink-0 pt-1.5">
                              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                            </div>
                          )}

                          {/* Hover Actions (Archive/Delete/Mark Read) - Kept from original logic but hidden until hover for clean UI */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/80 backdrop-blur-sm pl-2">
                            {isUnread && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                disabled={actionLoading === notification._id}
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
                                title="Mark as read"
                              >
                                {actionLoading === notification._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </button>
                            )}
                            {notification.status !== "archived" && (
                              <button
                                onClick={() => archiveNotification(notification._id)}
                                disabled={actionLoading === notification._id}
                                className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                                title="Archive"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              disabled={actionLoading === notification._id}
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title={notification.isGlobal ? "Remove" : "Delete"}
                            >
                              {actionLoading === notification._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More Button (Replaces Pagination) */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-2">
                    <button
                      disabled={page >= totalPages || loading}
                      onClick={handleNextPage}
                      className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/50 px-6 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading && page < totalPages ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Settings & Promo */}
          {/* <div className="space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Notification Settings</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Choose what you want to be notified about.</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: "courseUpdates", label: "Course Updates" },
                  { key: "liveClassReminders", label: "Live Class Reminders" },
                  { key: "testResults", label: "Test Results" },
                  { key: "promotions", label: "Promotions & Offers" },
                  { key: "systemUpdates", label: "System Updates" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <button
                      onClick={() => toggleSetting(item.key as keyof typeof settings)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        settings[item.key as keyof typeof settings] ? "bg-orange-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform`}
                        style={{ transform: settings[item.key as keyof typeof settings] ? 'translateX(18px)' : 'translateX(4px)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <button className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">
                Manage Settings <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl shadow-sm border border-orange-100 p-6 text-center relative overflow-hidden">
              <div className="absolute top-4 left-4 flex gap-1 opacity-30">
                <div className="h-1 w-1 rounded-full bg-orange-400"></div>
                <div className="h-1 w-1 rounded-full bg-orange-400"></div>
                <div className="h-1 w-1 rounded-full bg-orange-400"></div>
              </div>
              <div className="absolute bottom-4 right-4 flex gap-1 opacity-30">
                <div className="h-1 w-1 rounded-full bg-orange-400"></div>
                <div className="h-1 w-1 rounded-full bg-orange-400"></div>
                <div className="h-1 w-1 rounded-full bg-orange-400"></div>
              </div>

              <div className="relative inline-block mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mx-auto shadow-inner">
                  <Bell className="h-8 w-8 text-orange-500 fill-orange-500" />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-orange-50">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              
              <h3 className="text-base font-bold text-gray-900 mb-2">Never Miss an Update!</h3>
              <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                Enable all notifications to stay ahead in your preparation and achieve your goals.
              </p>
              
              <button 
                onClick={() => setSettings({ courseUpdates: true, liveClassReminders: true, testResults: true, promotions: true, systemUpdates: true })}
                className="w-full rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
              >
                Enable All
              </button>
            </div>

          </div> */}
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