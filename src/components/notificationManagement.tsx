"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  Plus,
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
import Select from "react-select";

// ==================== Type Definitions ====================
interface User {
  _id: string;
  name?: string;
  email?: string;
  profileImage?: string;
  role?: string;
}

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

interface CreateNotificationData {
  recipient?: string;
  isGlobal: boolean;
  title: string;
  message: string;
  Category? : null | string;
  Courses ?: null | string;
  to : string;
  from : string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  data?: NotificationData;
}

interface UsersResponse {
  users: User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== Constants ====================
const NOTIFICATION_TYPES = [
  
        "course_enrollment",
        "lesson_completion",
        "test_assigned",
        "test_graded",
        "live_class_reminder",
        "live_class_started",
        "assignment_due",
        "certificate_earned",
        "announcement",
        "message",
        "payment",
        "system",
      
];

const ROLES = [
  { value: "user", label: "USER" },
  { value: "teacher", label: "TEACHER" },
  { value: "admin", label: "ADMIN" },
  { value: "super_admin", label: "SUPER ADMIN" },
  { value: "editor", label: "EDITOR" },
  { value: "manager", label: "MANAGER" },
  { value: "counselor", label: "COUNSELOR" },
  { value: "leader", label: "LEADER" },
];

// ==================== Main Component ====================
const NotificationManagement = () => {
  // ===== State for notifications =====
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "archived" | string>("all");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ===== State for users =====
  const [users, setUsers] = useState<User[]>([]);
  const [Courses, setCourses] = useState<any>([]);
  const [Category, setCategory] = useState<any>([]);
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ===== State for create modal =====
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateNotificationData>({
    isGlobal: true,
    title: "",
    message: "",
    type: "announcement",
    Category :null,
    to : "",
    from : "",
    Courses : null,
    priority: "medium",
    channels: {
      inApp: true,
      email: false,
      push: false,
      sms: false,
    },
  });

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async (
    currentPage = 1,
    currentFilter = filter,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (currentFilter === "unread") {
        params.append("status", "unread");
      } else if (currentFilter === "archived") {
        params.append("status", "archived");
      }

      const response = await api.get(`/notification/all?${params.toString()}`);
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
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load notifications",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch users by role
  const fetchUsers = async (role: string = "user") => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/users", {
        params: {
          page: 1,
          limit: 100,
          sortBy: "-createdAt",
          role: role,
          isActive: true,
        },
      });

      const data: any = response.data;

      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  
  const fetchCategory = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/categories", {
        params: {
          page: 1,
          limit: 100
        },
      });

      const data: any = response.data;

      setCategory(data.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setCategory([]);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const fetchCourses = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/courses", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      const data: any = response.data;

      setCourses(data.data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setCourses([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const userOptions = users.map((user) => ({
    value: user._id,
    label: user?.name || user?.email || "N/A",
  }));
  
  // fetchCategory
// fetchCourses
  const categoryOptions = Category.map((user) => ({
    value: user._id,
    label: user?.name || user?.email || "N/A",
  }));
  
  const coursesOptions = Courses.map((user) => ({
    value: user._id,
    label: user?.title || user?.email || "N/A",
  }));

  // Create notification
  const createNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError(null);

      // Validate
      if (!formData.title.trim() || !formData.message.trim()) {
        throw new Error("Title and message are required");
      }

      if (!formData.isGlobal && !formData.recipient) {
        throw new Error("Recipient is required for non-global notifications");
      }

      const response = await api.post("/notification", formData);
      const result = response.data;

      if (result.success) {
        setSuccessMessage("Notification created successfully!");

        // Reset form
        setFormData({
          isGlobal: true,
          title: "",
          message: "",
          type: "announcement",
          priority: "medium",      
          from : "",
          to : "",
          Category : "",
          Courses : "",
          channels: {
            inApp: true,
            email: false,
            push: false,
            sms: false,
          },
        });

        // Close modal and refresh list after delay
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }

        successTimeoutRef.current = setTimeout(() => {
          setShowCreateModal(false);
          setSuccessMessage(null);
          fetchNotifications(1, filter);
        }, 1500);
      } else {
        throw new Error(result?.message || "Failed to create notification");
      }
    } catch (error: any) {
      console.error("Create notification error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create notification",
      );
    } finally {
      setCreating(false);
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
          prev.filter((notification) => notification._id !== notificationId),
        );
        setSuccessMessage("Notification archived");

        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(
          () => setSuccessMessage(null),
          3000,
        );
      } else {
        throw new Error(result?.message || "Failed to archive notification");
      }
    } catch (error: any) {
      console.error("Archive notification error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to archive notification",
      );
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
          prev.filter((notification) => notification._id !== notificationId),
        );
        setSuccessMessage("Notification deleted");

        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(
          () => setSuccessMessage(null),
          3000,
        );
      } else {
        throw new Error(result?.message || "Failed to delete notification");
      }
    } catch (error: any) {
      console.error("Delete notification error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete notification",
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
              ? {
                  ...notification,
                  status: "read",
                  readAt: new Date().toISOString(),
                }
              : notification,
          ),
        );
      } else {
        throw new Error(result?.message || "Failed to mark as read");
      }
    } catch (error: any) {
      console.error("Mark as read error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to mark as read",
      );
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

  // Handle role change in create modal
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);

    setFormData({ ...formData, recipient: undefined });
  };

  // ===== Utility Functions =====

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
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-blue-600 bg-blue-50";
      case "low":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-blue-100 text-blue-700";
      case "read":
        return "bg-gray-100 text-gray-700";
      case "archived":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get user display name
  const getUserDisplayName = (user: User) => {
    return user.name || user.email || user._id;
  };

  // ===== Effects =====

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchUsers("user");
  }, []);

  // Fetch users when role changes
  useEffect(() => {
    if (selectedRole) {
      fetchUsers(selectedRole);
    }
    fetchCategory();
    fetchCourses();
  }, [selectedRole]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // ===== Render =====

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Notification Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage notifications for your users
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Notification
          </button>
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
            {["all", "unread"
            // , "archived"
            ].map((option) => (
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
        <div className="rounded-lg bg-gray-50 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                No notifications
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {filter === "all"
                  ? "Create your first notification"
                  : `No ${filter} notifications`}
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
                              notification.status,
                            )}`}
                          >
                            {notification.status}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(
                              notification.priority,
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

                        <p className="text-sm text-gray-600">
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                          <span>{formatDate(notification.createdAt)}</span>
                          <span>•</span>
                          <span>Type: {notification.type}</span>

                          {notification.channels && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {notification.channels.inApp && (
                                  <BellIcon
                                    className="h-3 w-3"
                                    title="In-app"
                                  />
                                )}
                                {notification.channels.email && (
                                  <Mail className="h-3 w-3" title="Email" />
                                )}
                                {notification.channels.push && (
                                  <Smartphone
                                    className="h-3 w-3"
                                    title="Push"
                                  />
                                )}
                                {notification.channels.sms && (
                                  <AlertCircle
                                    className="h-3 w-3"
                                    title="SMS"
                                  />
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
                        {/* {notification.status === "unread" && (
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
                        )} */}

                        {/* {notification.status !== "archived" && (
                          <button
                            onClick={() =>
                              archiveNotification(notification._id)
                            }
                            disabled={actionLoading === notification._id}
                            className="rounded-md p-1.5 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600 disabled:opacity-50"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )} */}

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

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Notification
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={createNotification}
                className="p-6 overflow-y-auto max-h-[80vh]"
              >
                <div className="space-y-4">
                  {/* Global/Recipient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notification Type
                    </label>
                    <div className="mt-1 flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formData.isGlobal}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              isGlobal: true,
                              recipient: undefined,
                            })
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">Global</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!formData.isGlobal}
                          onChange={() =>
                            setFormData({ ...formData, isGlobal: false })
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm">Specific User</span>
                      </label>
                    </div>
                  </div>

                  {!formData.isGlobal && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Role
                        </label>
                        <Select
                          value={ROLES.find(
                            (option) => option.value === selectedRole,
                          )}
                          onChange={(selectedOption) =>
                            handleRoleChange(selectedOption?.value || "")
                          }
                          options={ROLES}
                          className="mt-1"
                          classNamePrefix="react-select"
                          isSearchable={false}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Recipient *
                        </label>
                        <Select
                          name="recipient"
                          value={
                            userOptions.find(
                              (option) => option.value === formData.recipient,
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setFormData({
                              ...formData,
                              recipient: selectedOption?.value || "",
                            })
                          }
                          options={userOptions}
                          isLoading={loadingUsers}
                          isDisabled={loadingUsers || formData.isGlobal}
                          isClearable
                          placeholder={
                            loadingUsers ? "Loading users..." : "Select a user"
                          }
                          noOptionsMessage={() => "No users found"}
                          className="mt-1"
                          classNamePrefix="recipient-select"
                          required={!formData.isGlobal}
                        />
                      </div>
                    </div>
                  )}

                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Active From*
                      </label>
                       <input type="date"  
                        value={formData.from}                  
                        onChange={(e) => {
                          setFormData({...formData, from : e.target.value})
                        }}
                        max={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Active To *
                      </label>
                      <input type="date"    
                      value={formData.to}
                      // max={new Date().toISOString().split('T')[0]}                   
                        onChange={(e) => {
                          setFormData({...formData, to : e.target.value})
                        }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                      {formData.isGlobal && (
                        <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Courses
                        </label>
                        <Select
                          value={
                            coursesOptions.find(
                              (option) => option.value === formData.Courses,
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setFormData({
                              ...formData,
                              Courses: selectedOption?.value || "",
                            })
                          }
                          options={coursesOptions}
                          isClearable
                          className="mt-1"
                          classNamePrefix="react-select"
                          isSearchable={true}
                        />
                      </div>
                      )}
                      
                      {formData.isGlobal && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Category
                        </label>
                        
                        <Select
                          value={
                            categoryOptions.find(
                              (option) => option.value === formData.Category,
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setFormData({
                              ...formData,
                              Category: selectedOption?.value || "",
                            })
                          }
                          options={categoryOptions}
                          isClearable
                          className="mt-1"
                          classNamePrefix="react-select"
                          isSearchable={true}
                        />
                      </div>                  
                    )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Notification title"
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Notification message"
                      rows={3}
                      required
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Type and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {NOTIFICATION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, " ").toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priority: e.target.value as any,
                          })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Channels */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Channels
                    </label>

                    <div className="mt-2 flex flex-wrap gap-4">
                      {[
                        { key: "inApp", label: "In-App" },
                        { key: "email", label: "Email" },
                        { key: "push", label: "Push" },
                        { key: "sms", label: "SMS" },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              formData.channels[
                                key as keyof typeof formData.channels
                              ]
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                channels: {
                                  ...formData.channels,
                                  [key]: e.target.checked,
                                },
                              })
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Data (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Action URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.data?.url || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data: { ...formData.data, url: e.target.value },
                        })
                      }
                      placeholder="https://example.com/action"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Action Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.data?.actionText || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data: {
                            ...formData.data,
                            actionText: e.target.value,
                          },
                        })
                      }
                      placeholder="View Details"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;







