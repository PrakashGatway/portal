

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Globe,
  Loader2,
  Mail,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
  User as UserIcon,
  Users,
  X,
  AlertCircle,
  Clock,
  Megaphone,
  CreditCard,
  Gift,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import Select from "react-select";
import api from "../axiosInstance";

interface User {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

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
  notificationKey?: string;
  sender?: User | string;
  title: string;
  message: string;
  from?: string;
  to?: string;
  Category?: {
    _id: string;
    name?: string;
  } | string;
  type:
    | "course"
    | "offer"
    | "reminder"
    | "announcement"
    | "payment"
    | "system";
  priority: "low" | "medium" | "high" | "urgent";
  isActive: boolean;
  data?: NotificationData;
  proceedStatus?: boolean;
  scheduledFor?: string;
  metaInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationResponse {
  success: boolean;
  message?: string;
  data: Notification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UsersResponse {
  success?: boolean;
  users: User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateNotificationData {
  isGlobal: boolean;
  recipients?: string[];
  notificationKey?: string;
  title: string;
  message: string;
  type:
    | "course"
    | "offer"
    | "reminder"
    | "announcement"
    | "payment"
    | "system";
  priority: "low" | "medium" | "high" | "urgent";
  Category?: string;
  from?: string;
  to?: string;
  courseId?: string;
  contentId?: string;
  testId?: string;
  url?: string;
  actionText?: string;
  proceedStatus?: boolean;
  isActive?: boolean;
  scheduledFor?: string;
  sendPush?: boolean;
  metaInfo?: Record<string, any>;
}

interface SelectOption {
  value: string;
  label: string;
}

type FilterState = {
  type: string;
  scope: string;
  status: string;
  priority: string;
};

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filter, setFilter] = useState<FilterState>({
    type: "all",
    scope: "all",
    status: "all",
    priority: "all",
  });

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState<CreateNotificationData>({
    isGlobal: true,
    recipients: [],
    notificationKey: "",
    title: "",
    message: "",
    type: "announcement",
    priority: "medium",
    Category: "",
    from: "",
    to: "",
    courseId: "",
    contentId: "",
    testId: "",
    url: "",
    actionText: "",
    proceedStatus: false,
    isActive: true,
    scheduledFor: "",
    sendPush: true,
    metaInfo: {},
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);

    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, any> = {
        page: currentPage,
        limit: 20,
      };

      if (filter.type !== "all") {
        params.type = filter.type;
      }

      if (filter.scope !== "all") {
        params.isGlobal = filter.scope === "global";
      }

      if (filter.status !== "all") {
        params.isActive = filter.status === "active";
      }

      if (filter.priority !== "all") {
        params.priority = filter.priority;
      }

      const response = await api.get<NotificationResponse>(
        "/notification/all",
        {
          params,
        }
      );

      if (response.data.success) {
        setNotifications(response.data.data || []);
        setTotalCount(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || "Failed to fetch notifications");
      }
    } catch (err: any) {
      console.error("Fetch notifications error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  const fetchUsers = useCallback(async (role = "all") => {
    try {
      setLoadingUsers(true);

      const params: Record<string, any> = {
        page: 1,
        limit: 1000,
      };

      if (role !== "all") {
        params.role = role;
      }

      const response = await api.get<UsersResponse>("/users", {
        params,
      });

      const responseData: any = response.data;

      const userList =
        responseData?.users ||
        responseData?.data?.users ||
        responseData?.data ||
        [];

      setUsers(Array.isArray(userList) ? userList : []);
    } catch (err: any) {
      console.error("Fetch users error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch users"
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (showCreateModal && !formData.isGlobal) {
      fetchUsers(selectedRole);
    }
  }, [showCreateModal, formData.isGlobal, selectedRole, fetchUsers]);
  
  
  const [Category, setCategory] = useState([]);
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


  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
    fetchCategory();
  }, []);

  const resetForm = () => {
    setFormData({
      isGlobal: true,
      recipients: [],
      notificationKey: "",
      title: "",
      message: "",
      type: "announcement",
      priority: "medium",
      Category: "",
      from: "",
      to: "",
      courseId: "",
      contentId: "",
      testId: "",
      url: "",
      actionText: "",
      proceedStatus: false,
      isActive: true,
      scheduledFor: "",
      sendPush: true,
      metaInfo: {},
    });

    setSelectedRole("all");
    setUsers([]);
  };

  const createNotification = async () => {
    try {
      setCreating(true);
      setError("");

      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      if (!formData.message.trim()) {
        throw new Error("Message is required");
      }

      if (
        !formData.isGlobal &&
        (!formData.recipients || formData.recipients.length === 0)
      ) {
        throw new Error(
          "Please select at least one user for personal notification"
        );
      }

      const payload: any = {
        isGlobal: formData.isGlobal,
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        priority: formData.priority,
        isActive: formData.isActive ?? true,
        sendPush: formData.sendPush ?? false,
      };

      if (!formData.isGlobal) {
        payload.recipients = formData.recipients;
      }

      if (formData.notificationKey?.trim()) {
        payload.notificationKey = formData.notificationKey.trim();
      }

      if (formData.from?.trim()) {
        payload.from = formData.from.trim();
      }

      if (formData.to?.trim()) {
        payload.to = formData.to.trim();
      }

      if (formData.Category?.trim()) {
        payload.Category = formData.Category.trim();
      }

      if (formData.proceedStatus !== undefined) {
        payload.proceedStatus = formData.proceedStatus;
      }

      if (formData.scheduledFor) {
        payload.scheduledFor = new Date(
          formData.scheduledFor
        ).toISOString();
      }

      const data: NotificationData = {};

      if (formData.courseId?.trim()) {
        data.courseId = formData.courseId.trim();
      }

      if (formData.contentId?.trim()) {
        data.contentId = formData.contentId.trim();
      }

      if (formData.testId?.trim()) {
        data.testId = formData.testId.trim();
      }

      if (formData.url?.trim()) {
        data.url = formData.url.trim();
      }

      if (formData.actionText?.trim()) {
        data.actionText = formData.actionText.trim();
      }

      if (Object.keys(data).length > 0) {
        payload.data = data;
      }

      if (
        formData.metaInfo &&
        Object.keys(formData.metaInfo).length > 0
      ) {
        payload.metaInfo = formData.metaInfo;
      }

      console.log("Notification payload:", payload);

      const response = await api.post("/notification", payload);

      if (response.data?.success) {
        showSuccess(
          formData.isGlobal
            ? "Global notification created successfully"
            : "Personal notification sent successfully"
        );

        setShowCreateModal(false);
        resetForm();
        setCurrentPage(1);

        await fetchNotifications();
      } else {
        throw new Error(
          response.data?.message || "Failed to create notification"
        );
      }
    } catch (err: any) {
      console.error("Create notification error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create notification"
      );
    } finally {
      setCreating(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(notificationId);
      setError("");

      const response = await api.delete(
        `/notification/admin/${notificationId}`
      );

      if (response.data?.success) {
        showSuccess("Notification deleted successfully");
        await fetchNotifications();
      } else {
        throw new Error(
          response.data?.message || "Failed to delete notification"
        );
      }
    } catch (err: any) {
      console.error("Delete notification error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete notification"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const viewNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);

    setFormData((prev) => ({
      ...prev,
      recipients: [],
    }));

    fetchUsers(role);
  };

  const handleGlobalChange = (isGlobal: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isGlobal,
      recipients: isGlobal ? [] : prev.recipients || [],
    }));

    if (!isGlobal) {
      fetchUsers(selectedRole);
    }
  };

  const userOptions = useMemo<SelectOption[]>(() => {
    return users.map((user) => ({
      value: user._id,
      label:
        user.name ||
        user.email ||
        `User ${user._id.slice(-6)}`,
    }));
  }, [users]);

  const selectedUserOptions = useMemo(() => {
    return userOptions.filter((option) =>
      formData.recipients?.includes(option.value)
    );
  }, [userOptions, formData.recipients]);

  const filteredNotifications = useMemo(() => {
    if (!search.trim()) {
      return notifications;
    }

    const searchValue = search.toLowerCase();

    return notifications.filter((notification) => {
      return (
        notification.title?.toLowerCase().includes(searchValue) ||
        notification.message?.toLowerCase().includes(searchValue) ||
        notification.notificationKey
          ?.toLowerCase()
          .includes(searchValue) ||
        notification.type?.toLowerCase().includes(searchValue)
      );
    });
  }, [notifications, search]);

  const formatDate = (date?: string) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="h-4 w-4" />;
      case "offer":
        return <Gift className="h-4 w-4" />;
      case "reminder":
        return <Clock className="h-4 w-4" />;
      case "announcement":
        return <Megaphone className="h-4 w-4" />;
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "course":
        return "bg-blue-100 text-blue-700";
      case "offer":
        return "bg-purple-100 text-purple-700";
      case "reminder":
        return "bg-yellow-100 text-yellow-700";
      case "announcement":
        return "bg-orange-100 text-orange-700";
      case "payment":
        return "bg-green-100 text-green-700";
      case "system":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getScopeBadge = (isGlobal: boolean) => {
    if (isGlobal) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
          <Globe className="h-3 w-3" />
          Global
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
        <UserIcon className="h-3 w-3" />
        Personal
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        <X className="h-3 w-3" />
        Inactive
      </span>
    );
  };

  const handleFilterChange = (
    key: keyof FilterState,
    value: string
  ) => {
    setCurrentPage(1);

    setFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const closeCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    resetForm();
    setError("");
  };



  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Bell className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
                  Notification Management
                </h1>
                <p className="text-sm text-gray-500">
                  Manage global and personal notifications
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Create Notification
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={filter.type}
              onChange={(e) =>
                handleFilterChange("type", e.target.value)
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
            >
              <option value="all">All Types</option>
              <option value="course">Course</option>
              <option value="offer">Offer</option>
              <option value="reminder">Reminder</option>
              <option value="announcement">Announcement</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
            </select>

            <select
              value={filter.scope}
              onChange={(e) =>
                handleFilterChange("scope", e.target.value)
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
            >
              <option value="all">All Scope</option>
              <option value="global">Global</option>
              <option value="personal">Personal</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) =>
                handleFilterChange("status", e.target.value)
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={filter.priority}
              onChange={(e) =>
                handleFilterChange("priority", e.target.value)
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {totalCount} notification{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Notification
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Scope
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-500" />
                      <p className="mt-2 text-sm text-gray-500">
                        Loading notifications...
                      </p>
                    </td>
                  </tr>
                ) : filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Bell className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 text-sm font-medium text-gray-600">
                        No notifications found
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notification) => (
                    <tr
                      key={notification._id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[320px]">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {notification.message}
                          </p>

                          {notification.notificationKey && (
                            <p className="mt-1 text-[11px] text-gray-400">
                              Key: {notification.notificationKey}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {getScopeBadge(notification.isGlobal)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(
                            notification.type
                          )}`}
                        >
                          {getTypeIcon(notification.type)}
                          {notification.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(notification.isActive)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              viewNotificationDetails(notification)
                            }
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteNotification(notification._id)
                            }
                            disabled={
                              actionLoading === notification._id
                            }
                            className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-500" />
              <p className="mt-2 text-sm text-gray-500">
                Loading notifications...
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-16 text-center shadow-sm">
              <Bell className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-600">
                No notifications found
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {notification.title}
                    </p>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {notification.message}
                    </p>
                  </div>

                  {getStatusBadge(notification.isActive)}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {getScopeBadge(notification.isGlobal)}

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(
                      notification.type
                    )}`}
                  >
                    {getTypeIcon(notification.type)}
                    {notification.type}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getPriorityColor(
                      notification.priority
                    )}`}
                  >
                    {notification.priority}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">
                    {formatDate(notification.createdAt)}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        viewNotificationDetails(notification)
                      }
                      className="rounded-lg border border-gray-200 p-2 text-gray-500"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteNotification(notification._id)
                      }
                      disabled={
                        actionLoading === notification._id
                      }
                      className="rounded-lg border border-red-100 p-2 text-red-500"
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
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1)
                )
              }
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 md:p-6">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 md:px-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 md:text-xl">
                  Create Notification
                </h2>

                <p className="text-xs text-gray-500 md:text-sm">
                  Send a global or personal notification
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 md:p-6">
              <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                    formData.isGlobal
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="notificationScope"
                    checked={formData.isGlobal}
                    onChange={() => handleGlobalChange(true)}
                    className="sr-only"
                  />

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        formData.isGlobal
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Globe className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        Global Notification
                      </p>
                      <p className="text-xs text-gray-500">
                        Send to all users
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                    !formData.isGlobal
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="notificationScope"
                    checked={!formData.isGlobal}
                    onChange={() => handleGlobalChange(false)}
                    className="sr-only"
                  />

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        !formData.isGlobal
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <UserIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        Personal Notification
                      </p>
                      <p className="text-xs text-gray-500">
                        Send to selected users
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {!formData.isGlobal && (
                <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />

                    <div>
                      <p className="font-semibold text-gray-900">
                        Select Recipients
                      </p>

                      <p className="text-xs text-gray-500">
                        Select one or more users
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      User Role
                    </label>

                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        handleRoleChange(e.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="all">All Users</option>
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                      <option value="admin">Admins</option>
                      <option value="counsellor">Counsellors</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Recipients
                    </label>

                    <Select
                      isMulti
                      isSearchable
                      isLoading={loadingUsers}
                      options={userOptions}
                      value={selectedUserOptions}
                      placeholder={
                        loadingUsers
                          ? "Loading users..."
                          : "Select users..."
                      }
                      noOptionsMessage={() =>
                        "No users found"
                      }
                      onChange={(selectedOptions) => {
                        const values = (
                          selectedOptions as SelectOption[]
                        ).map((option) => option.value);

                        setFormData((prev) => ({
                          ...prev,
                          recipients: values,
                        }));
                      }}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: 44,
                          borderRadius: 12,
                          borderColor: state.isFocused
                            ? "#f97316"
                            : "#e5e7eb",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(249,115,22,0.1)"
                            : "none",
                        }),
                        multiValue: (base) => ({
                          ...base,
                          borderRadius: 6,
                        }),
                      }}
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formData.recipients?.length || 0} user
                        {(formData.recipients?.length || 0) !== 1
                          ? "s"
                          : ""}{" "}
                        selected
                      </p>

                      {!formData.recipients?.length && (
                        <p className="text-xs font-medium text-red-500">
                          At least one user is required
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Title *
                  </label>

                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter notification title"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notification Key
                  </label>

                  <input
                    type="text"
                    value={formData.notificationKey}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notificationKey: e.target.value,
                      }))
                    }
                    placeholder="e.g. Global_Class"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Message *
                  </label>

                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Enter notification message"
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Type
                  </label>

                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as CreateNotificationData["type"],
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  >
                    <option value="course">Course</option>
                    <option value="offer">Offer</option>
                    <option value="reminder">Reminder</option>
                    <option value="announcement">
                      Announcement
                    </option>
                    <option value="payment">Payment</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Priority
                  </label>

                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority:
                          e.target.value as CreateNotificationData["priority"],
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Category ID
                  </label>

                  {/* <input
                    type="text"
                    value={formData.Category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        Category: e.target.value,
                      }))
                    }
                    placeholder="Category ObjectId"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  /> */}

                  
                   <select
                   value={
                      formData.Category ||
                      ""
                    }
                    onChange={(e) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          Category:
                            e.target.value,
                        }),
                      )}
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                    <option value="" hidden>Select an option</option>
                    {Category.map(ele => (
                      <option value={ele?._id}>{ele?.name}</option>
                    ))}
                  </select>

                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Scheduled For
                  </label>

                  <input
                    type="datetime-local"
                    value={formData.scheduledFor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduledFor: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    From
                  </label>

                  <input
                    type="text"
                    value={formData.from}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                    placeholder="Sender/source"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    To
                  </label>

                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        to: e.target.value,
                      }))
                    }
                    placeholder="Target/source"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Course ID
                  </label>

                  <input
                    type="text"
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        courseId: e.target.value,
                      }))
                    }
                    placeholder="Course ObjectId"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Content ID
                  </label>

                  <input
                    type="text"
                    value={formData.contentId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contentId: e.target.value,
                      }))
                    }
                    placeholder="Content ObjectId"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Test ID
                  </label>

                  <input
                    type="text"
                    value={formData.testId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        testId: e.target.value,
                      }))
                    }
                    placeholder="Test ObjectId"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Action URL
                  </label>

                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    placeholder="/courses/ielts"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Action Text
                  </label>

                  <input
                    type="text"
                    value={formData.actionText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        actionText: e.target.value,
                      }))
                    }
                    placeholder="View Course"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-orange-500"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    Active notification
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <input
                    type="checkbox"
                    checked={formData.sendPush}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sendPush: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-orange-500"
                  />

                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Send className="h-4 w-4 text-orange-500" />
                    Send Push
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <input
                    type="checkbox"
                    checked={formData.proceedStatus}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        proceedStatus: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-orange-500"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    Proceed Status
                  </span>
                </label>
              </div>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end md:px-6">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createNotification}
                disabled={
                  creating ||
                  !formData.title.trim() ||
                  !formData.message.trim() ||
                  (!formData.isGlobal &&
                    !formData.recipients?.length)
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {formData.isGlobal
                      ? "Create Notification"
                      : "Send Personal Notification"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 md:p-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Notification Details
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedNotification._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedNotification(null);
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Title
                </p>

                <p className="text-base font-semibold text-gray-900">
                  {selectedNotification.title}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  Message
                </p>

                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-xs text-gray-400">Scope</p>
                  {getScopeBadge(selectedNotification.isGlobal)}
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">Type</p>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getTypeColor(
                      selectedNotification.type
                    )}`}
                  >
                    {getTypeIcon(selectedNotification.type)}
                    {selectedNotification.type}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">
                    Priority
                  </p>

                  <span
                    className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getPriorityColor(
                      selectedNotification.priority
                    )}`}
                  >
                    {selectedNotification.priority}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">Status</p>
                  {getStatusBadge(selectedNotification.isActive)}
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">
                    Notification Key
                  </p>

                  <p className="break-all text-sm text-gray-700">
                    {selectedNotification.notificationKey || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-gray-400">
                    Created At
                  </p>

                  <p className="text-sm text-gray-700">
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
              </div>

              {selectedNotification.data &&
                Object.keys(selectedNotification.data).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Data
                    </p>

                    <div className="rounded-xl bg-gray-50 p-4">
                      {Object.entries(
                        selectedNotification.data
                      ).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex flex-col border-b border-gray-200 py-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4"
                        >
                          <span className="text-xs font-medium text-gray-500">
                            {key}
                          </span>

                          <span className="break-all text-sm text-gray-800">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedNotification.metaInfo &&
                Object.keys(selectedNotification.metaInfo).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Meta Info
                    </p>

                    <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100">
                      {JSON.stringify(
                        selectedNotification.metaInfo,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;







// "use client";

// import React, { useEffect, useState, useRef, useCallback } from "react";
// import {
//   Bell,
//   Plus,
//   Trash2,
//   Check,
//   Loader2,
//   X,
//   Send,
//   Globe,
//   User as UserIcon,
//   AlertCircle,
//   Eye,
//   Tag,
//   Filter,
//   BookOpen,
//   CreditCard,
//   Megaphone,
//   Settings,
// } from "lucide-react";
// import api from "../axiosInstance";
// import Select from "react-select";

// interface UserData {
//   _id: string;
//   name?: string;
//   email?: string;
//   profileImage?: string;
//   role?: string;
// }

// interface NotificationData {
//   courseId?: string | { _id: string; title?: string };
//   contentId?: string | { _id: string; title?: string };
//   testId?: string | { _id: string; title?: string };
//   url?: string;
//   actionText?: string;
// }

// interface Notification {
//   _id: string;
//   isGlobal: boolean;
//   notificationKey?: string;
//   sender?: {
//     _id: string;
//     name?: string;
//     email?: string;
//     profileImage?: string;
//   };
//   title: string;
//   message: string;
//   from?: string;
//   to?: string;
//   Category?: string | { _id: string; name?: string };
//   type:
//     | "course"
//     | "offer"
//     | "reminder"
//     | "announcement"
//     | "payment"
//     | "system";
//   priority: "low" | "medium" | "high" | "urgent";
//   isActive: boolean;
//   data?: NotificationData;
//   proceedStatus?: boolean;
//   scheduledFor?: string | null;
//   metaInfo?: Record<string, any>;
//   createdAt: string;
//   updatedAt: string;
// }

// interface NotificationResponse {
//   success: boolean;
//   message?: string;
//   data: Notification[];
//   pagination?: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

// interface CreateNotificationData {
//   isGlobal: boolean;
//   recipients?: string[];
//   notificationKey?: string;
//   title: string;
//   message: string;
//   type:
//     | "course"
//     | "offer"
//     | "reminder"
//     | "announcement"
//     | "payment"
//     | "system";
//   priority: "low" | "medium" | "high" | "urgent";
//   Category?: string;
//   from?: string;
//   to?: string;
//   courseId?: string;
//   contentId?: string;
//   testId?: string;
//   url?: string;
//   actionText?: string;
//   proceedStatus?: boolean;
//   isActive?: boolean;
//   scheduledFor?: string;
//   sendPush?: boolean;
//   metaInfo?: Record<string, any>;
// }

// interface UsersResponse {
//   users?: UserData[];
//   data?: UserData[];
//   pagination?: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

// const NOTIFICATION_TYPES = [
//   { value: "course", label: "Course" },
//   { value: "offer", label: "Offer" },
//   { value: "reminder", label: "Reminder" },
//   { value: "announcement", label: "Announcement" },
//   { value: "payment", label: "Payment" },
//   { value: "system", label: "System" },
// ];

// const PRIORITY_LEVELS = [
//   { value: "low", label: "Low" },
//   { value: "medium", label: "Medium" },
//   { value: "high", label: "High" },
//   { value: "urgent", label: "Urgent" },
// ];

// const ROLES = [
//   { value: "user", label: "USER" },
//   { value: "teacher", label: "TEACHER" },
//   { value: "admin", label: "ADMIN" },
//   { value: "super_admin", label: "SUPER ADMIN" },
//   { value: "editor", label: "EDITOR" },
//   { value: "manager", label: "MANAGER" },
//   { value: "counselor", label: "COUNSELOR" },
//   { value: "leader", label: "LEADER" },
// ];

// const NotificationManagement = () => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState<string | null>(null);

//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);

//   const [filter, setFilter] = useState({
//     type: "all",
//     scope: "all",
//     status: "all",
//     priority: "all",
//   });

//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   const [users, setUsers] = useState<UserData[]>([]);
//   const [selectedRole, setSelectedRole] = useState("user");
//   const [loadingUsers, setLoadingUsers] = useState(false);

//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [creating, setCreating] = useState(false);

//   const [formData, setFormData] = useState<CreateNotificationData>({
//     isGlobal: true,
//     recipients: [],
//     title: "",
//     message: "",
//     type: "announcement",
//     priority: "medium",
//     isActive: true,
//     sendPush: false,
//   });

//   const [showDetailModal, setShowDetailModal] = useState(false);
//   const [selectedNotification, setSelectedNotification] =
//     useState<Notification | null>(null);

//   const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const showSuccess = (message: string) => {
//     setSuccessMessage(message);

//     if (successTimeoutRef.current) {
//       clearTimeout(successTimeoutRef.current);
//     }

//     successTimeoutRef.current = setTimeout(() => {
//       setSuccessMessage(null);
//     }, 3000);
//   };

//   const fetchNotifications = useCallback(
//     async (currentPage = 1) => {
//       try {
//         setLoading(true);
//         setError(null);

//         const params: Record<string, string | number> = {
//           page: currentPage,
//           limit: 20,
//         };

//         if (filter.type !== "all") {
//           params.type = filter.type;
//         }

//         if (filter.scope !== "all") {
//           params.isGlobal = filter.scope === "global" ? "true" : "false";
//         }

//         if (filter.status !== "all") {
//           params.isActive =
//             filter.status === "active" ? "true" : "false";
//         }

//         if (filter.priority !== "all") {
//           params.priority = filter.priority;
//         }

//         const response = await api.get<NotificationResponse>(
//           "/notification/all",
//           {
//             params,
//           },
//         );

//         const result = response.data;

//         if (!result.success) {
//           throw new Error(
//             result.message || "Failed to fetch notifications",
//           );
//         }

//         setNotifications(result.data || []);
//         setTotalPages(result.pagination?.totalPages || 1);
//         setTotalCount(result.pagination?.total || 0);
//         setPage(result.pagination?.page || currentPage);
//       } catch (error: any) {
//         console.error("Fetch notifications error:", error);

//         setError(
//           error.response?.data?.message ||
//             error.message ||
//             "Failed to load notifications",
//         );
//       } finally {
//         setLoading(false);
//       }
//     },
//     [filter],
//   );

//   const fetchUsers = useCallback(async (role = "user") => {
//     try {
//       setLoadingUsers(true);

//       const response = await api.get<UsersResponse>("/users", {
//         params: {
//           page: 1,
//           limit: 100,
//           sortBy: "-createdAt",
//           role,
//           isActive: true,
//         },
//       });

//       const result = response.data;

//       setUsers(result.users || result.data || []);
//     } catch (error) {
//       console.error("Fetch users error:", error);
//       setUsers([]);
//     } finally {
//       setLoadingUsers(false);
//     }
//   }, []);

//   const createNotification = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       setCreating(true);
//       setError(null);

//       const title = formData.title.trim();
//       const message = formData.message.trim();

//       if (!title || !message) {
//         throw new Error("Title and message are required");
//       }

//       if (
//         !formData.isGlobal &&
//         (!formData.recipients || formData.recipients.length === 0)
//       ) {
//         throw new Error(
//           "Please select at least one recipient",
//         );
//       }

//       const payload: any = {
//         isGlobal: formData.isGlobal,
//         title,
//         message,
//         type: formData.type,
//         priority: formData.priority,
//         isActive: formData.isActive ?? true,
//         sendPush: formData.sendPush ?? false,
//       };

//       if (
//         !formData.isGlobal &&
//         formData.recipients &&
//         formData.recipients.length > 0
//       ) {
//         payload.recipients = formData.recipients;
//       }

//       if (formData.notificationKey?.trim()) {
//         payload.notificationKey =
//           formData.notificationKey.trim();
//       }

//       if (formData.from) {
//         payload.from = formData.from;
//       }

//       if (formData.to) {
//         payload.to = formData.to;
//       }

//       if (formData.Category?.trim()) {
//         payload.Category = formData.Category.trim();
//       }

//       if (formData.proceedStatus !== undefined) {
//         payload.proceedStatus = formData.proceedStatus;
//       }

//       if (formData.scheduledFor) {
//         payload.scheduledFor = new Date(
//           formData.scheduledFor,
//         ).toISOString();
//       }

//       if (formData.metaInfo) {
//         payload.metaInfo = formData.metaInfo;
//       }

//       const data: Record<string, string> = {};

//       if (formData.courseId?.trim()) {
//         data.courseId = formData.courseId.trim();
//       }

//       if (formData.contentId?.trim()) {
//         data.contentId = formData.contentId.trim();
//       }

//       if (formData.testId?.trim()) {
//         data.testId = formData.testId.trim();
//       }

//       if (formData.url?.trim()) {
//         data.url = formData.url.trim();
//       }

//       if (formData.actionText?.trim()) {
//         data.actionText = formData.actionText.trim();
//       }

//       if (Object.keys(data).length > 0) {
//         payload.data = data;
//       }

//       const response = await api.post(
//         "/notification",
//         payload,
//       );

//       const result = response.data;

//       if (!result.success) {
//         throw new Error(
//           result.message || "Failed to create notification",
//         );
//       }

//       showSuccess("Notification created successfully!");

//       setShowCreateModal(false);

//       setFormData({
//         isGlobal: true,
//         recipients: [],
//         title: "",
//         message: "",
//         type: "announcement",
//         priority: "medium",
//         isActive: true,
//         sendPush: false,
//       });

//       await fetchNotifications(page);
//     } catch (error: any) {
//       console.error("Create notification error:", error);

//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to create notification",
//       );
//     } finally {
//       setCreating(false);
//     }
//   };

//   const deleteNotification = async (
//     notificationId: string,
//   ) => {
//     const confirmed = window.confirm(
//       "Are you sure you want to delete this notification? This action cannot be undone.",
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setActionLoading(notificationId);
//       setError(null);

//       const response = await api.delete(
//         `/notification/${notificationId}`,
//       );

//       const result = response.data;

//       if (!result.success) {
//         throw new Error(
//           result.message || "Failed to delete notification",
//         );
//       }

//       setNotifications((prev) =>
//         prev.filter(
//           (notification) =>
//             notification._id !== notificationId,
//         ),
//       );

//       setTotalCount((prev) => Math.max(0, prev - 1));

//       showSuccess("Notification deleted successfully");

//       if (
//         selectedNotification?._id === notificationId
//       ) {
//         setSelectedNotification(null);
//         setShowDetailModal(false);
//       }
//     } catch (error: any) {
//       console.error("Delete notification error:", error);

//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to delete notification",
//       );
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const viewNotificationDetails = (
//     notification: Notification,
//   ) => {
//     setSelectedNotification(notification);
//     setShowDetailModal(true);
//   };

//   const formatDate = (date?: string | null) => {
//     if (!date) {
//       return "N/A";
//     }

//     const parsedDate = new Date(date);

//     if (Number.isNaN(parsedDate.getTime())) {
//       return date;
//     }

//     return parsedDate.toLocaleDateString() + " " +
//       parsedDate.toLocaleTimeString();
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case "urgent":
//         return "text-red-600 bg-red-50 border-red-200";
//       case "high":
//         return "text-orange-600 bg-orange-50 border-orange-200";
//       case "medium":
//         return "text-blue-600 bg-blue-50 border-blue-200";
//       case "low":
//         return "text-gray-600 bg-gray-50 border-gray-200";
//       default:
//         return "text-gray-600 bg-gray-50 border-gray-200";
//     }
//   };

//   const getTypeIcon = (type: string) => {
//     switch (type) {
//       case "course":
//         return BookOpen;
//       case "offer":
//         return Tag;
//       case "reminder":
//         return Bell;
//       case "announcement":
//         return Megaphone;
//       case "payment":
//         return CreditCard;
//       case "system":
//         return Settings;
//       default:
//         return Bell;
//     }
//   };

//   const getTypeColor = (type: string) => {
//     switch (type) {
//       case "course":
//         return "bg-blue-100 text-blue-700";
//       case "offer":
//         return "bg-pink-100 text-pink-700";
//       case "reminder":
//         return "bg-yellow-100 text-yellow-700";
//       case "announcement":
//         return "bg-purple-100 text-purple-700";
//       case "payment":
//         return "bg-green-100 text-green-700";
//       case "system":
//         return "bg-gray-100 text-gray-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   const getScopeBadge = (isGlobal: boolean) => {
//     if (isGlobal) {
//       return {
//         label: "Global",
//         icon: Globe,
//         className: "bg-purple-100 text-purple-700",
//       };
//     }

//     return {
//       label: "Personal",
//       icon: UserIcon,
//       className: "bg-blue-100 text-blue-700",
//     };
//   };

//   const getStatusBadge = (isActive: boolean) => {
//     if (isActive) {
//       return {
//         label: "Active",
//         className: "bg-green-100 text-green-700",
//       };
//     }

//     return {
//       label: "Inactive",
//       className: "bg-red-100 text-red-700",
//     };
//   };

//   const handleFilterChange = (
//     key: keyof typeof filter,
//     value: string,
//   ) => {
//     setFilter((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     setPage(1);
//   };

//   const handleRoleChange = (role: string) => {
//     setSelectedRole(role);
//     setFormData((prev) => ({
//       ...prev,
//       recipients: [],
//     }));

//     fetchUsers(role);
//   };

//   const userOptions = users.map((user) => ({
//     value: user._id,
//     label:
//       user.name ||
//       user.email ||
//       user._id,
//   }));

//   const [Category, setCategory] = useState([]);
//   const fetchCategory = async () => {
//     try {
//       setLoadingUsers(true);
//       const response = await api.get("/categories", {
//         params: {
//           page: 1,
//           limit: 100
//         },
//       });

//       const data: any = response.data;

//       setCategory(data.data || []);
//     } catch (error: any) {
//       console.error("Error fetching users:", error);
//       setCategory([]);
//     } finally {
//       setLoadingUsers(false);
//     }
//   };

//   useEffect(() => {
//     fetchNotifications(page);
//     fetchCategory()
//   }, [page, filter, fetchNotifications]);

//   useEffect(() => {
//     fetchUsers("user");
//   }, [fetchUsers]);

//   useEffect(() => {
//     return () => {
//       if (successTimeoutRef.current) {
//         clearTimeout(successTimeoutRef.current);
//       }
//     };
//   }, []);

//   const closeCreateModal = () => {
//     if (creating) {
//       return;
//     }

//     setShowCreateModal(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-4 md:p-6">
//       <div className="mx-auto max-w-7xl">
//         <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Notification Management
//             </h1>

//             <p className="mt-1 text-sm text-gray-500">
//               Create and manage notifications for your users
//             </p>
//           </div>

//           <button
//             onClick={() => {
//               setError(null);
//               setShowCreateModal(true);
//             }}
//             className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 md:w-auto"
//           >
//             <Plus className="h-4 w-4" />
//             Create Notification
//           </button>
//         </div>

//         {successMessage && (
//           <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
//             <Check className="h-4 w-4 shrink-0" />
//             <span>{successMessage}</span>
//           </div>
//         )}

//         {error && (
//           <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//             <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
//             <span>{error}</span>
//           </div>
//         )}

//         <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
//           <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
//             <div className="flex items-center gap-2">
//               <Filter className="h-4 w-4 text-gray-400" />

//               <span className="text-sm font-medium text-gray-700">
//                 Filters
//               </span>
//             </div>

//             <select
//               value={filter.type}
//               onChange={(e) =>
//                 handleFilterChange(
//                   "type",
//                   e.target.value,
//                 )
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-auto"
//             >
//               <option value="all">All Types</option>

//               {NOTIFICATION_TYPES.map((type) => (
//                 <option
//                   key={type.value}
//                   value={type.value}
//                 >
//                   {type.label}
//                 </option>
//               ))}
//             </select>

//             <select
//               value={filter.scope}
//               onChange={(e) =>
//                 handleFilterChange(
//                   "scope",
//                   e.target.value,
//                 )
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-auto"
//             >
//               <option value="all">All Scopes</option>
//               <option value="global">Global</option>
//               <option value="personal">Personal</option>
//             </select>

//             <select
//               value={filter.status}
//               onChange={(e) =>
//                 handleFilterChange(
//                   "status",
//                   e.target.value,
//                 )
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-auto"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>

//             <select
//               value={filter.priority}
//               onChange={(e) =>
//                 handleFilterChange(
//                   "priority",
//                   e.target.value,
//                 )
//               }
//               className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:w-auto"
//             >
//               <option value="all">
//                 All Priorities
//               </option>

//               {PRIORITY_LEVELS.map((priority) => (
//                 <option
//                   key={priority.value}
//                   value={priority.value}
//                 >
//                   {priority.label}
//                 </option>
//               ))}
//             </select>

//             <button
//               onClick={() => {
//                 setFilter({
//                   type: "all",
//                   scope: "all",
//                   status: "all",
//                   priority: "all",
//                 });

//                 setPage(1);
//               }}
//               className="text-left text-sm font-medium text-blue-600 hover:text-blue-700 lg:ml-auto"
//             >
//               Clear Filters
//             </button>
//           </div>
//         </div>

//         <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
//           {loading ? (
//             <div className="flex min-h-[300px] items-center justify-center">
//               <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//             </div>
//           ) : notifications.length === 0 ? (
//             <div className="flex min-h-[300px] flex-col items-center justify-center px-4 text-center">
//               <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
//                 <Bell className="h-8 w-8 text-gray-400" />
//               </div>

//               <p className="text-sm font-medium text-gray-700">
//                 No notifications
//               </p>

//               <p className="mt-1 text-xs text-gray-400">
//                 {Object.values(filter).every(
//                   (value) => value === "all",
//                 )
//                   ? "Create your first notification"
//                   : "No notifications match the current filters"}
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="hidden overflow-x-auto md:block">
//                 <table className="min-w-full divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Notification
//                       </th>

//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Type
//                       </th>

//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Priority
//                       </th>

//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Scope
//                       </th>

//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Status
//                       </th>

//                       <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Created
//                       </th>

//                       <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-gray-200 bg-white">
//                     {notifications.map(
//                       (notification) => {
//                         const TypeIcon =
//                           getTypeIcon(
//                             notification.type,
//                           );

//                         const scope =
//                           getScopeBadge(
//                             notification.isGlobal,
//                           );

//                         const status =
//                           getStatusBadge(
//                             notification.isActive,
//                           );

//                         const ScopeIcon =
//                           scope.icon;

//                         return (
//                           <tr
//                             key={
//                               notification._id
//                             }
//                             className="transition hover:bg-gray-50"
//                           >
//                             <td className="px-4 py-3">
//                               <div className="flex items-start gap-3">
//                                 <div
//                                   className={`rounded-md p-1.5 ${getTypeColor(
//                                     notification.type,
//                                   )}`}
//                                 >
//                                   <TypeIcon className="h-4 w-4" />
//                                 </div>

//                                 <div className="min-w-0">
//                                   <p className="line-clamp-1 text-sm font-medium text-gray-900">
//                                     {
//                                       notification.title
//                                     }
//                                   </p>

//                                   <p className="line-clamp-1 text-xs text-gray-500">
//                                     {
//                                       notification.message
//                                     }
//                                   </p>
//                                 </div>
//                               </div>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span
//                                 className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(
//                                   notification.type,
//                                 )}`}
//                               >
//                                 {
//                                   notification.type
//                                 }
//                               </span>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span
//                                 className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(
//                                   notification.priority,
//                                 )}`}
//                               >
//                                 {
//                                   notification.priority
//                                 }
//                               </span>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span
//                                 className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${scope.className}`}
//                               >
//                                 <ScopeIcon className="h-3 w-3" />
//                                 {scope.label}
//                               </span>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span
//                                 className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
//                               >
//                                 {status.label}
//                               </span>
//                             </td>

//                             <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
//                               {formatDate(
//                                 notification.createdAt,
//                               )}
//                             </td>

//                             <td className="px-4 py-3 text-right">
//                               <div className="flex items-center justify-end gap-1">
//                                 <button
//                                   onClick={() =>
//                                     viewNotificationDetails(
//                                       notification,
//                                     )
//                                   }
//                                   className="rounded-md p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
//                                   title="View Details"
//                                 >
//                                   <Eye className="h-4 w-4" />
//                                 </button>

//                                 <button
//                                   onClick={() =>
//                                     deleteNotification(
//                                       notification._id,
//                                     )
//                                   }
//                                   disabled={
//                                     actionLoading ===
//                                     notification._id
//                                   }
//                                   className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//                                   title="Delete"
//                                 >
//                                   {actionLoading ===
//                                   notification._id ? (
//                                     <Loader2 className="h-4 w-4 animate-spin" />
//                                   ) : (
//                                     <Trash2 className="h-4 w-4" />
//                                   )}
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         );
//                       },
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="divide-y divide-gray-200 md:hidden">
//                 {notifications.map(
//                   (notification) => {
//                     const TypeIcon =
//                       getTypeIcon(
//                         notification.type,
//                       );

//                     const scope =
//                       getScopeBadge(
//                         notification.isGlobal,
//                       );

//                     const status =
//                       getStatusBadge(
//                         notification.isActive,
//                       );

//                     const ScopeIcon =
//                       scope.icon;

//                     return (
//                       <div
//                         key={
//                           notification._id
//                         }
//                         className="p-4 transition hover:bg-gray-50"
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div className="min-w-0 flex-1">
//                             <div className="mb-1 flex items-center gap-2">
//                               <div
//                                 className={`rounded-md p-1.5 ${getTypeColor(
//                                   notification.type,
//                                 )}`}
//                               >
//                                 <TypeIcon className="h-3.5 w-3.5" />
//                               </div>

//                               <p className="truncate text-sm font-medium text-gray-900">
//                                 {
//                                   notification.title
//                                 }
//                               </p>
//                             </div>

//                             <p className="mb-2 line-clamp-2 text-xs text-gray-500">
//                               {
//                                 notification.message
//                               }
//                             </p>

//                             <div className="flex flex-wrap items-center gap-2">
//                               <span
//                                 className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(
//                                   notification.type,
//                                 )}`}
//                               >
//                                 {
//                                   notification.type
//                                 }
//                               </span>

//                               <span
//                                 className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getPriorityColor(
//                                   notification.priority,
//                                 )}`}
//                               >
//                                 {
//                                   notification.priority
//                                 }
//                               </span>

//                               <span
//                                 className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${scope.className}`}
//                               >
//                                 <ScopeIcon className="h-3 w-3" />
//                                 {scope.label}
//                               </span>

//                               <span
//                                 className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
//                               >
//                                 {status.label}
//                               </span>
//                             </div>

//                             <p className="mt-2 text-xs text-gray-400">
//                               {formatDate(
//                                 notification.createdAt,
//                               )}
//                             </p>
//                           </div>

//                           <div className="flex shrink-0 items-center gap-1">
//                             <button
//                               onClick={() =>
//                                 viewNotificationDetails(
//                                   notification,
//                                 )
//                               }
//                               className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
//                             >
//                               <Eye className="h-4 w-4" />
//                             </button>

//                             <button
//                               onClick={() =>
//                                 deleteNotification(
//                                   notification._id,
//                                 )
//                               }
//                               disabled={
//                                 actionLoading ===
//                                 notification._id
//                               }
//                               className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//                             >
//                               {actionLoading ===
//                               notification._id ? (
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                               ) : (
//                                 <Trash2 className="h-4 w-4" />
//                               )}
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   },
//                 )}
//               </div>

//               <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="text-sm text-gray-500">
//                   Showing{" "}
//                   {notifications.length}{" "}
//                   of {totalCount} notifications
//                 </div>

//                 <div className="flex items-center justify-between gap-2 sm:justify-end">
//                   <button
//                     disabled={
//                       page <= 1 || loading
//                     }
//                     onClick={() =>
//                       setPage(
//                         (prev) =>
//                           prev - 1,
//                       )
//                     }
//                     className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Previous
//                   </button>

//                   <span className="whitespace-nowrap text-sm text-gray-600">
//                     Page {page} of{" "}
//                     {totalPages}
//                   </span>

//                   <button
//                     disabled={
//                       page >=
//                         totalPages ||
//                       loading
//                     }
//                     onClick={() =>
//                       setPage(
//                         (prev) =>
//                           prev + 1,
//                       )
//                     }
//                     className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Next
//                   </button>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {showCreateModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
//           <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
//             <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
//               <div>
//                 <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
//                   Create New Notification
//                 </h2>

//                 <p className="mt-0.5 text-xs text-gray-500">
//                   Send a notification to all users or selected users
//                 </p>
//               </div>

//               <button
//                 onClick={closeCreateModal}
//                 className="rounded-full p-1.5 transition hover:bg-gray-100"
//               >
//                 <X className="h-5 w-5 text-gray-500" />
//               </button>
//             </div>

//             <form
//               onSubmit={createNotification}
//               className="flex-1 overflow-y-auto p-4 sm:p-6"
//             >
//               <div className="space-y-5">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     Notification Scope
//                   </label>

//                   <div className="mt-2 flex gap-5">
//                     <label className="flex cursor-pointer items-center gap-2">
//                       <input
//                         type="radio"
//                         checked={
//                           formData.isGlobal
//                         }
//                         onChange={() =>
//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               isGlobal: true,
//                               recipients: [],
//                             }),
//                           )
//                         }
//                         className="h-4 w-4 text-blue-600"
//                       />

//                       <span className="text-sm text-gray-700">
//                         Global
//                       </span>
//                     </label>

//                     <label className="flex cursor-pointer items-center gap-2">
//                       <input
//                         type="radio"
//                         checked={
//                           !formData.isGlobal
//                         }
//                         onChange={() =>
//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               isGlobal: false,
//                             }),
//                           )
//                         }
//                         className="h-4 w-4 text-blue-600"
//                       />

//                       <span className="text-sm text-gray-700">
//                         Personal
//                       </span>
//                     </label>
//                   </div>
//                 </div>

//                 {!formData.isGlobal && (
//                   <div className="grid grid-cols-1 gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 md:grid-cols-2">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Role
//                       </label>

//                       <Select
//                         value={
//                           ROLES.find(
//                             (option) =>
//                               option.value ===
//                               selectedRole,
//                           ) || null
//                         }
//                         onChange={(
//                           selectedOption,
//                         ) =>
//                           handleRoleChange(
//                             selectedOption?.value ||
//                               "user",
//                           )
//                         }
//                         options={ROLES}
//                         isSearchable={false}
//                         className="mt-1"
//                         classNamePrefix="react-select"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Recipients *
//                       </label>

//                       <Select
//                         isMulti
//                         value={userOptions.filter(
//                           (option) =>
//                             formData.recipients?.includes(
//                               option.value,
//                             ),
//                         )}
//                         onChange={(
//                           selectedOptions,
//                         ) => {
//                           const values =
//                             selectedOptions.map(
//                               (option) =>
//                                 option.value,
//                             );

//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               recipients:
//                                 values,
//                             }),
//                           );
//                         }}
//                         options={userOptions}
//                         isLoading={loadingUsers}
//                         placeholder={
//                           loadingUsers
//                             ? "Loading users..."
//                             : "Select users"
//                         }
//                         noOptionsMessage={() =>
//                           "No users found"
//                         }
//                         className="mt-1"
//                         classNamePrefix="recipient-select"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     Notification Key
//                   </label>

//                   <input
//                     type="text"
//                     value={
//                       formData.notificationKey ||
//                       ""
//                     }
//                     onChange={(e) =>
//                       setFormData(
//                         (prev) => ({
//                           ...prev,
//                           notificationKey:
//                             e.target.value,
//                         }),
//                       )
//                     }
//                     placeholder="e.g. GLOBAL_CLASS_UPDATE"
//                     className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     Title *
//                   </label>

//                   <input
//                     type="text"
//                     value={formData.title}
//                     onChange={(e) =>
//                       setFormData(
//                         (prev) => ({
//                           ...prev,
//                           title: e.target.value,
//                         }),
//                       )
//                     }
//                     placeholder="Notification title"
//                     required
//                     className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     Message *
//                   </label>

//                   <textarea
//                     value={formData.message}
//                     onChange={(e) =>
//                       setFormData(
//                         (prev) => ({
//                           ...prev,
//                           message:
//                             e.target.value,
//                         }),
//                       )
//                     }
//                     placeholder="Notification message"
//                     rows={4}
//                     required
//                     className="mt-1 block w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Type *
//                     </label>

//                     <select
//                       value={formData.type}
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             type: e.target
//                               .value as CreateNotificationData["type"],
//                           }),
//                         )
//                       }
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     >
//                       {NOTIFICATION_TYPES.map(
//                         (type) => (
//                           <option
//                             key={
//                               type.value
//                             }
//                             value={
//                               type.value
//                             }
//                           >
//                             {type.label}
//                           </option>
//                         ),
//                       )}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Priority *
//                     </label>

//                     <select
//                       value={
//                         formData.priority
//                       }
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             priority:
//                               e.target
//                                 .value as CreateNotificationData["priority"],
//                           }),
//                         )
//                       }
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     >
//                       {PRIORITY_LEVELS.map(
//                         (priority) => (
//                           <option
//                             key={
//                               priority.value
//                             }
//                             value={
//                               priority.value
//                             }
//                           >
//                             {priority.label}
//                           </option>
//                         ),
//                       )}
//                     </select>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     Category 
//                   </label>

//                   {/* <input
//                     type="text"
//                     value={
//                       formData.Category ||
//                       ""
//                     }
//                     onChange={(e) =>
//                       setFormData(
//                         (prev) => ({
//                           ...prev,
//                           Category:
//                             e.target.value,
//                         }),
//                       )
//                     }
//                     placeholder="Category ObjectId"
//                     className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   /> */}

//                   <select
//                    value={
//                       formData.Category ||
//                       ""
//                     }
//                     onChange={(e) =>
//                       setFormData(
//                         (prev) => ({
//                           ...prev,
//                           Category:
//                             e.target.value,
//                         }),
//                       )}
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                       >
//                     <option value="" hidden>Select an option</option>
//                     {Category.map(ele => (
//                       <option value={ele?._id}>{ele?.name}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 md:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       From Date
//                     </label>

//                     <input
//                       type="date"
//                       value={
//                         formData.from || ""
//                       }
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             from: e.target
//                               .value,
//                           }),
//                         )
//                       }
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       To Date
//                     </label>

//                     <input
//                       type="date"
//                       value={
//                         formData.to || ""
//                       }
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             to: e.target
//                               .value,
//                           }),
//                         )
//                       }
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="border-t border-gray-200 pt-5">
//                   <div className="mb-3">
//                     <h4 className="text-sm font-semibold text-gray-800">
//                       Additional Data
//                     </h4>

//                     <p className="mt-1 text-xs text-gray-500">
//                       These values are stored inside the notification data object.
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Course ID
//                       </label>

//                       <input
//                         type="text"
//                         value={
//                           formData.courseId ||
//                           ""
//                         }
//                         onChange={(e) =>
//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               courseId:
//                                 e.target
//                                   .value,
//                             }),
//                           )
//                         }
//                         placeholder="Course ObjectId"
//                         className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Content ID
//                       </label>

//                       <input
//                         type="text"
//                         value={
//                           formData.contentId ||
//                           ""
//                         }
//                         onChange={(e) =>
//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               contentId:
//                                 e.target
//                                   .value,
//                             }),
//                           )
//                         }
//                         placeholder="Content ObjectId"
//                         className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Test ID
//                       </label>

//                       <input
//                         type="text"
//                         value={
//                           formData.testId ||
//                           ""
//                         }
//                         onChange={(e) =>
//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               testId:
//                                 e.target
//                                   .value,
//                             }),
//                           )
//                         }
//                         placeholder="Test ObjectId"
//                         className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         URL
//                       </label>

//                       <input
//                         type="text"
//                         value={
//                           formData.url || ""
//                         }
//                         onChange={(e) =>
//                           setFormData(
//                             (prev) => ({
//                               ...prev,
//                               url: e.target
//                                 .value,
//                             }),
//                           )
//                         }
//                         placeholder="https://example.com"
//                         className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                       />
//                     </div>
//                   </div>

//                   <div className="mt-4">
//                     <label className="block text-sm font-medium text-gray-700">
//                       Action Text
//                     </label>

//                     <input
//                       type="text"
//                       value={
//                         formData.actionText ||
//                         ""
//                       }
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             actionText:
//                               e.target
//                                 .value,
//                           }),
//                         )
//                       }
//                       placeholder="View Details"
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 md:grid-cols-2">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Scheduled For
//                     </label>

//                     <input
//                       type="datetime-local"
//                       value={
//                         formData.scheduledFor ||
//                         ""
//                       }
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             scheduledFor:
//                               e.target
//                                 .value,
//                           }),
//                         )
//                       }
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Status
//                     </label>

//                     <div className="mt-3 flex items-center gap-5">
//                       <label className="flex items-center gap-2">
//                         <input
//                           type="radio"
//                           checked={
//                             formData.isActive !==
//                             false
//                           }
//                           onChange={() =>
//                             setFormData(
//                               (prev) => ({
//                                 ...prev,
//                                 isActive:
//                                   true,
//                               }),
//                             )
//                           }
//                           className="h-4 w-4 text-blue-600"
//                         />

//                         <span className="text-sm">
//                           Active
//                         </span>
//                       </label>

//                       <label className="flex items-center gap-2">
//                         <input
//                           type="radio"
//                           checked={
//                             formData.isActive ===
//                             false
//                           }
//                           onChange={() =>
//                             setFormData(
//                               (prev) => ({
//                                 ...prev,
//                                 isActive:
//                                   false,
//                               }),
//                             )
//                           }
//                           className="h-4 w-4 text-blue-600"
//                         />

//                         <span className="text-sm">
//                           Inactive
//                         </span>
//                       </label>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
//                   <label className="flex cursor-pointer items-center gap-3">
//                     <input
//                       type="checkbox"
//                       checked={
//                         formData.sendPush ||
//                         false
//                       }
//                       onChange={(e) =>
//                         setFormData(
//                           (prev) => ({
//                             ...prev,
//                             sendPush:
//                               e.target
//                                 .checked,
//                           }),
//                         )
//                       }
//                       className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                     />

//                     <div>
//                       <span className="text-sm font-medium text-gray-700">
//                         Send Push Notification
//                       </span>

//                       <p className="text-xs text-gray-500">
//                         Send the notification through Firebase FCM.
//                       </p>
//                     </div>
//                   </label>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">
//                     Proceed Status
//                   </label>

//                   <select
//                     value={
//                       formData.proceedStatus !==
//                       undefined
//                         ? String(
//                             formData.proceedStatus,
//                           )
//                         : ""
//                     }
//                     onChange={(e) =>
//                       setFormData(
//                         (prev) => ({
//                           ...prev,
//                           proceedStatus:
//                             e.target.value
//                               ? e.target
//                                   .value ===
//                                 "true"
//                                 ? true
//                                 : false
//                               : undefined,
//                         }),
//                       )
//                     }
//                     className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//                   >
//                     <option value="">
//                       Not Set
//                     </option>
//                     <option value="true">
//                       Yes
//                     </option>
//                     <option value="false">
//                       No
//                     </option>
//                   </select>
//                 </div>
//               </div>

//               <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
//                 <button
//                   type="button"
//                   onClick={closeCreateModal}
//                   disabled={creating}
//                   className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   disabled={creating}
//                   className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {creating ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Creating...
//                     </>
//                   ) : (
//                     <>
//                       <Send className="h-4 w-4" />
//                       Send Notification
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {showDetailModal &&
//         selectedNotification && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
//             <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
//               <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
//                 <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
//                   Notification Details
//                 </h2>

//                 <button
//                   onClick={() => {
//                     setShowDetailModal(false);
//                     setSelectedNotification(
//                       null,
//                     );
//                   }}
//                   className="rounded-full p-1.5 transition hover:bg-gray-100"
//                 >
//                   <X className="h-5 w-5 text-gray-500" />
//                 </button>
//               </div>

//               <div className="flex-1 overflow-y-auto p-4 sm:p-6">
//                 <div className="space-y-5">
//                   <div className="flex items-start gap-3">
//                     <div
//                       className={`rounded-lg p-2.5 ${getTypeColor(
//                         selectedNotification.type,
//                       )}`}
//                     >
//                       {React.createElement(
//                         getTypeIcon(
//                           selectedNotification.type,
//                         ),
//                         {
//                           className:
//                             "h-5 w-5",
//                         },
//                       )}
//                     </div>

//                     <div className="min-w-0 flex-1">
//                       <h3 className="text-lg font-semibold text-gray-900">
//                         {
//                           selectedNotification.title
//                         }
//                       </h3>

//                       <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
//                         {
//                           selectedNotification.message
//                         }
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Notification ID
//                       </label>

//                       <p className="mt-1 break-all text-sm text-gray-900">
//                         {
//                           selectedNotification._id
//                         }
//                       </p>
//                     </div>

//                     {selectedNotification.notificationKey && (
//                       <div>
//                         <label className="text-xs font-medium text-gray-500">
//                           Notification Key
//                         </label>

//                         <p className="mt-1 break-all text-sm text-gray-900">
//                           {
//                             selectedNotification.notificationKey
//                           }
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Type
//                       </label>

//                       <p className="mt-1 capitalize text-sm text-gray-900">
//                         {
//                           selectedNotification.type
//                         }
//                       </p>
//                     </div>

//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Priority
//                       </label>

//                       <p className="mt-1 capitalize text-sm text-gray-900">
//                         {
//                           selectedNotification.priority
//                         }
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Scope
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {selectedNotification.isGlobal
//                           ? "Global"
//                           : "Personal"}
//                       </p>
//                     </div>

//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Status
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {selectedNotification.isActive
//                           ? "Active"
//                           : "Inactive"}
//                       </p>
//                     </div>
//                   </div>

//                   {selectedNotification.Category && (
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Category
//                       </label>

//                       <p className="mt-1 break-all text-sm text-gray-900">
//                         {typeof selectedNotification.Category ===
//                         "object"
//                           ? selectedNotification.Category
//                               .name ||
//                             selectedNotification.Category
//                               ._id
//                           : selectedNotification.Category}
//                       </p>
//                     </div>
//                   )}

//                   {(selectedNotification.from ||
//                     selectedNotification.to) && (
//                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                       {selectedNotification.from && (
//                         <div>
//                           <label className="text-xs font-medium text-gray-500">
//                             From
//                           </label>

//                           <p className="mt-1 text-sm text-gray-900">
//                             {
//                               selectedNotification.from
//                             }
//                           </p>
//                         </div>
//                       )}

//                       {selectedNotification.to && (
//                         <div>
//                           <label className="text-xs font-medium text-gray-500">
//                             To
//                           </label>

//                           <p className="mt-1 text-sm text-gray-900">
//                             {
//                               selectedNotification.to
//                             }
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   {selectedNotification.data &&
//                     Object.keys(
//                       selectedNotification.data,
//                     ).length > 0 && (
//                       <div className="border-t border-gray-200 pt-4">
//                         <label className="text-xs font-medium text-gray-500">
//                           Notification Data
//                         </label>

//                         <div className="mt-3 space-y-2">
//                           {selectedNotification.data
//                             .courseId && (
//                             <div className="rounded-md bg-gray-50 p-3">
//                               <span className="text-xs text-gray-500">
//                                 Course ID
//                               </span>

//                               <p className="mt-1 break-all text-sm text-gray-900">
//                                 {typeof selectedNotification
//                                   .data
//                                   .courseId ===
//                                 "object"
//                                   ? selectedNotification
//                                       .data
//                                       .courseId
//                                       .title ||
//                                     selectedNotification
//                                       .data
//                                       .courseId
//                                       ._id
//                                   : selectedNotification
//                                       .data
//                                       .courseId}
//                               </p>
//                             </div>
//                           )}

//                           {selectedNotification.data
//                             .contentId && (
//                             <div className="rounded-md bg-gray-50 p-3">
//                               <span className="text-xs text-gray-500">
//                                 Content ID
//                               </span>

//                               <p className="mt-1 break-all text-sm text-gray-900">
//                                 {typeof selectedNotification
//                                   .data
//                                   .contentId ===
//                                 "object"
//                                   ? selectedNotification
//                                       .data
//                                       .contentId
//                                       .title ||
//                                     selectedNotification
//                                       .data
//                                       .contentId
//                                       ._id
//                                   : selectedNotification
//                                       .data
//                                       .contentId}
//                               </p>
//                             </div>
//                           )}

//                           {selectedNotification.data
//                             .testId && (
//                             <div className="rounded-md bg-gray-50 p-3">
//                               <span className="text-xs text-gray-500">
//                                 Test ID
//                               </span>

//                               <p className="mt-1 break-all text-sm text-gray-900">
//                                 {typeof selectedNotification
//                                   .data
//                                   .testId ===
//                                 "object"
//                                   ? selectedNotification
//                                       .data
//                                       .testId
//                                       .title ||
//                                     selectedNotification
//                                       .data
//                                       .testId
//                                       ._id
//                                   : selectedNotification
//                                       .data
//                                       .testId}
//                               </p>
//                             </div>
//                           )}

//                           {selectedNotification.data
//                             .url && (
//                             <div className="rounded-md bg-gray-50 p-3">
//                               <span className="text-xs text-gray-500">
//                                 URL
//                               </span>

//                               <a
//                                 href={
//                                   selectedNotification
//                                     .data.url
//                                 }
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="mt-1 block break-all text-sm text-blue-600 hover:underline"
//                               >
//                                 {
//                                   selectedNotification
//                                     .data.url
//                                 }
//                               </a>
//                             </div>
//                           )}

//                           {selectedNotification.data
//                             .actionText && (
//                             <div className="rounded-md bg-gray-50 p-3">
//                               <span className="text-xs text-gray-500">
//                                 Action Text
//                               </span>

//                               <p className="mt-1 text-sm text-gray-900">
//                                 {
//                                   selectedNotification
//                                     .data
//                                     .actionText
//                                 }
//                               </p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     )}

//                   {selectedNotification.proceedStatus !==
//                     undefined && (
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Proceed Status
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {selectedNotification.proceedStatus
//                           ? "Yes"
//                           : "No"}
//                       </p>
//                     </div>
//                   )}

//                   {selectedNotification.scheduledFor && (
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Scheduled For
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {formatDate(
//                           selectedNotification.scheduledFor,
//                         )}
//                       </p>
//                     </div>
//                   )}

//                   {selectedNotification.metaInfo &&
//                     Object.keys(
//                       selectedNotification.metaInfo,
//                     ).length > 0 && (
//                       <div>
//                         <label className="text-xs font-medium text-gray-500">
//                           Meta Info
//                         </label>

//                         <pre className="mt-2 max-h-60 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-600">
//                           {JSON.stringify(
//                             selectedNotification.metaInfo,
//                             null,
//                             2,
//                           )}
//                         </pre>
//                       </div>
//                     )}

//                   <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2">
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Created At
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {formatDate(
//                           selectedNotification.createdAt,
//                         )}
//                       </p>
//                     </div>

//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Updated At
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {formatDate(
//                           selectedNotification.updatedAt,
//                         )}
//                       </p>
//                     </div>
//                   </div>

//                   {selectedNotification.sender && (
//                     <div>
//                       <label className="text-xs font-medium text-gray-500">
//                         Sender
//                       </label>

//                       <p className="mt-1 text-sm text-gray-900">
//                         {selectedNotification.sender
//                           .name ||
//                           selectedNotification.sender
//                             .email ||
//                           selectedNotification.sender
//                             ._id}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
//                 <button
//                   onClick={() => {
//                     setShowDetailModal(false);
//                     setSelectedNotification(
//                       null,
//                     );
//                   }}
//                   className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
//                 >
//                   Close
//                 </button>

//                 <button
//                   onClick={() => {
//                     setShowDetailModal(false);
//                     deleteNotification(
//                       selectedNotification._id,
//                     );
//                   }}
//                   disabled={
//                     actionLoading ===
//                     selectedNotification._id
//                   }
//                   className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
//                 >
//                   {actionLoading ===
//                   selectedNotification._id ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Trash2 className="h-4 w-4" />
//                   )}

//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//     </div>
//   );
// };

// export default NotificationManagement;


















// "use client";

// import React, { useEffect, useState, useRef } from "react";
// import {
//   Bell,
//   Plus,
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
// } from "lucide-react";
// import api from "../axiosInstance";
// import Select from "react-select";

// // ==================== Type Definitions ====================
// interface User {
//   _id: string;
//   name?: string;
//   email?: string;
//   profileImage?: string;
//   role?: string;
// }

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

// interface CreateNotificationData {
//   recipient?: string;
//   isGlobal: boolean;
//   title: string;
//   message: string;
//   Category? : null | string;
//   Courses ?: null | string;
//   to : string;
//   from : string;
//   type: string;
//   priority: "low" | "medium" | "high" | "urgent";
//   channels: {
//     inApp: boolean;
//     email: boolean;
//     push: boolean;
//     sms: boolean;
//   };
//   data?: NotificationData;
// }

// interface UsersResponse {
//   users: User[];
//   pagination?: {
//     total: number;
//     page: number;
//     limit: number;
//     totalPages: number;
//   };
// }

// // ==================== Constants ====================
// const NOTIFICATION_TYPES = [
  
//         "course_enrollment",
//         "lesson_completion",
//         "test_assigned",
//         "test_graded",
//         "live_class_reminder",
//         "live_class_started",
//         "assignment_due",
//         "certificate_earned",
//         "announcement",
//         "message",
//         "payment",
//         "system",
      
// ];

// const ROLES = [
//   { value: "user", label: "USER" },
//   { value: "teacher", label: "TEACHER" },
//   { value: "admin", label: "ADMIN" },
//   { value: "super_admin", label: "SUPER ADMIN" },
//   { value: "editor", label: "EDITOR" },
//   { value: "manager", label: "MANAGER" },
//   { value: "counselor", label: "COUNSELOR" },
//   { value: "leader", label: "LEADER" },
// ];

// // ==================== Main Component ====================
// const NotificationManagement = () => {
//   // ===== State for notifications =====
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [filter, setFilter] = useState<"all" | "unread" | "archived" | string>("all");
//   const [error, setError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   // ===== State for users =====
//   const [users, setUsers] = useState<User[]>([]);
//   const [Courses, setCourses] = useState<any>([]);
//   const [Category, setCategory] = useState<any>([]);
//   const [selectedRole, setSelectedRole] = useState<string>("user");
//   const [loadingUsers, setLoadingUsers] = useState(false);

//   // ===== State for create modal =====
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [formData, setFormData] = useState<CreateNotificationData>({
//     isGlobal: true,
//     title: "",
//     message: "",
//     type: "announcement",
//     Category :null,
//     to : "",
//     from : "",
//     Courses : null,
//     priority: "medium",
//     channels: {
//       inApp: true,
//       email: false,
//       push: false,
//       sms: false,
//     },
//   });

//   const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const fetchNotifications = async (
//     currentPage = 1,
//     currentFilter = filter,
//   ) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const params = new URLSearchParams({
//         page: currentPage.toString(),
//         limit: "10",
//       });

//       if (currentFilter === "unread") {
//         params.append("status", "unread");
//       } else if (currentFilter === "archived") {
//         params.append("status", "archived");
//       }

//       const response = await api.get(`/notification/all?${params.toString()}`);
//       const result: NotificationResponse = response.data;

//       if (result.success) {
//         setNotifications(result.data || []);
//         setTotalPages(result.pagination?.totalPages || 1);
//         setPage(result.pagination?.page || currentPage);
//       } else {
//         throw new Error("Failed to fetch notifications");
//       }
//     } catch (error: any) {
//       console.error("Fetch notifications error:", error);
//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to load notifications",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch users by role
//   const fetchUsers = async (role: string = "user") => {
//     try {
//       setLoadingUsers(true);
//       const response = await api.get("/users", {
//         params: {
//           page: 1,
//           limit: 100,
//           sortBy: "-createdAt",
//           role: role,
//           isActive: true,
//         },
//       });

//       const data: any = response.data;

//       setUsers(data.users || []);
//     } catch (error: any) {
//       console.error("Error fetching users:", error);
//       setUsers([]);
//     } finally {
//       setLoadingUsers(false);
//     }
//   };

  
  // const fetchCategory = async () => {
  //   try {
  //     setLoadingUsers(true);
  //     const response = await api.get("/categories", {
  //       params: {
  //         page: 1,
  //         limit: 100
  //       },
  //     });

  //     const data: any = response.data;

  //     setCategory(data.data || []);
  //   } catch (error: any) {
  //     console.error("Error fetching users:", error);
  //     setCategory([]);
  //   } finally {
  //     setLoadingUsers(false);
  //   }
  // };
  
//   const fetchCourses = async () => {
//     try {
//       setLoadingUsers(true);
//       const response = await api.get("/courses", {
//         params: {
//           page: 1,
//           limit: 100,
//         },
//       });

//       const data: any = response.data;

//       setCourses(data.data || []);
//     } catch (error: any) {
//       console.error("Error fetching users:", error);
//       setCourses([]);
//     } finally {
//       setLoadingUsers(false);
//     }
//   };

//   const userOptions = users.map((user) => ({
//     value: user._id,
//     label: user?.name || user?.email || "N/A",
//   }));
  
  
//   const categoryOptions = Category.map((user) => ({
//     value: user._id,
//     label: user?.name || user?.email || "N/A",
//   }));
  
//   const coursesOptions = Courses.map((user) => ({
//     value: user._id,
//     label: user?.title || user?.email || "N/A",
//   }));

//   // Create notification
//   const createNotification = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       setCreating(true);
//       setError(null);

//       // Validate
//       if (!formData.title.trim() || !formData.message.trim()) {
//         throw new Error("Title and message are required");
//       }

//       if (!formData.isGlobal && !formData.recipient) {
//         throw new Error("Recipient is required for non-global notifications");
//       }

//       const response = await api.post("/notification", formData);
//       const result = response.data;

//       if (result.success) {
//         setSuccessMessage("Notification created successfully!");
          
//         // Reset form
//         setFormData({
//           isGlobal: true,
//           title: "",
//           message: "",
//           type: "announcement",
//           priority: "medium",      
//           from : "",
//           to : "",
//           Category : "",
//           Courses : "",
//           channels: {
//             inApp: true,
//             email: false,
//             push: false,
//             sms: false,
//           },
//         });
        
//         if (successTimeoutRef.current) {
//           clearTimeout(successTimeoutRef.current);
//         }

//         successTimeoutRef.current = setTimeout(() => {
//           setShowCreateModal(false);
//           setSuccessMessage(null);
//           fetchNotifications(1, filter);
//         }, 1500);
//       } else {
//         throw new Error(result?.message || "Failed to create notification");
//       }
//     } catch (error: any) {
//       console.error("Create notification error:", error);
//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to create notification",
//       );
//     } finally {
//       setCreating(false);
//     }
//   };

//   // Archive notification
//   const archiveNotification = async (notificationId: string) => {
//     try {
//       setActionLoading(notificationId);
//       setError(null);

//       const response = await api.put(`/notification/${notificationId}/archive`);
//       const result = response.data;

//       if (result.success) {
//         setNotifications((prev) =>
//           prev.filter((notification) => notification._id !== notificationId),
//         );
//         setSuccessMessage("Notification archived");

//         if (successTimeoutRef.current) {
//           clearTimeout(successTimeoutRef.current);
//         }
//         successTimeoutRef.current = setTimeout(
//           () => setSuccessMessage(null),
//           3000,
//         );
//       } else {
//         throw new Error(result?.message || "Failed to archive notification");
//       }
//     } catch (error: any) {
//       console.error("Archive notification error:", error);
//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to archive notification",
//       );
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
//           prev.filter((notification) => notification._id !== notificationId),
//         );
//         setSuccessMessage("Notification deleted");

//         if (successTimeoutRef.current) {
//           clearTimeout(successTimeoutRef.current);
//         }
//         successTimeoutRef.current = setTimeout(
//           () => setSuccessMessage(null),
//           3000,
//         );
//       } else {
//         throw new Error(result?.message || "Failed to delete notification");
//       }
//     } catch (error: any) {
//       console.error("Delete notification error:", error);
//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to delete notification",
//       );
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
//               ? {
//                   ...notification,
//                   status: "read",
//                   readAt: new Date().toISOString(),
//                 }
//               : notification,
//           ),
//         );
//       } else {
//         throw new Error(result?.message || "Failed to mark as read");
//       }
//     } catch (error: any) {
//       console.error("Mark as read error:", error);
//       setError(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to mark as read",
//       );
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   // Handle filter change
//   const handleFilterChange = (newFilter: "all" | "unread" | "archived") => {
//     setFilter(newFilter);
//     setPage(1);
//     fetchNotifications(1, newFilter);
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

//   // Handle role change in create modal
//   const handleRoleChange = (role: string) => {
//     setSelectedRole(role);

//     setFormData({ ...formData, recipient: undefined });
//   };

//   // ===== Utility Functions =====

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
//       case "urgent":
//         return "text-red-600 bg-red-50";
//       case "high":
//         return "text-orange-600 bg-orange-50";
//       case "medium":
//         return "text-blue-600 bg-blue-50";
//       case "low":
//         return "text-gray-600 bg-gray-50";
//       default:
//         return "text-gray-600 bg-gray-50";
//     }
//   };

//   // Get status badge
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "unread":
//         return "bg-blue-100 text-blue-700";
//       case "read":
//         return "bg-gray-100 text-gray-700";
//       case "archived":
//         return "bg-yellow-100 text-yellow-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   // Get user display name
//   const getUserDisplayName = (user: User) => {
//     return user.name || user.email || user._id;
//   };

//   // ===== Effects =====

//   // Initial load
//   useEffect(() => {
//     fetchNotifications();
//     fetchUsers("user");
//   }, []);

//   // Fetch users when role changes
//   useEffect(() => {
//     if (selectedRole) {
//       fetchUsers(selectedRole);
//     }
//     fetchCategory();
//     fetchCourses();
//   }, [selectedRole]);

//   // Cleanup timeouts
//   useEffect(() => {
//     return () => {
//       if (successTimeoutRef.current) {
//         clearTimeout(successTimeoutRef.current);
//       }
//     };
//   }, []);

//   // ===== Render =====

//   return (
//     <div className="p-6">
//       <div className="mx-auto max-w-7xl">
        
//         <div className="mb-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Notification Management
//             </h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Create and manage notifications for your users
//             </p>
//           </div>

//           <button
//             onClick={() => setShowCreateModal(true)}
//             className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium 
//             text-white transition hover:bg-blue-700"
//           >
//             <Plus className="h-4 w-4" />
//             Create Notification
//           </button>
//         </div>
        
//         {successMessage && (
//           <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
//             {successMessage}
//           </div>
//         )}

//         {error && (
//           <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         {/* Filters */}
//         <div className="mb-6 flex items-center gap-4">
//           <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
//             {["all", "unread"
//             // , "archived"
//             ].map((option) => (
//               <button
//                 key={option}
//                 onClick={() => handleFilterChange(option as any)}
//                 className={`rounded-md px-4 py-2 text-sm font-medium transition capitalize ${
//                   filter === option
//                     ? "bg-blue-600 text-white"
//                     : "text-gray-600 hover:bg-gray-100"
//                 }`}
//               >
//                 {option}
//               </button>
//             ))}

            
//           </div>
//         </div>

//         {/* Notifications List */}
//         <div className="rounded-lg bg-gray-50 shadow-sm">
//           {loading ? (
//             <div className="flex items-center justify-center py-12">
//               <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//             </div>
//           ) : notifications.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-12">
//               <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
//                 <Bell className="h-8 w-8 text-gray-400" />
//               </div>
//               <p className="text-sm font-medium text-gray-700">
//                 No notifications
//               </p>
//               <p className="mt-1 text-xs text-gray-400">
//                 {filter === "all"
//                   ? "Create your first notification"
//                   : `No ${filter} notifications`}
//               </p>
//             </div>
//           ) : (
//             <>
//               <div className="divide-y divide-gray-200">
//                 {notifications.map((notification) => (
//                   <div
//                     key={notification._id}
//                     className={`p-4 transition hover:bg-gray-50 ${
//                       notification.status === "unread" ? "bg-blue-50/30" : ""
//                     }`}
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1 space-y-1">
//                         <div className="flex items-center gap-2">
//                           <h3 className="text-sm font-medium text-gray-900">
//                             {notification.title}
//                           </h3>
//                           <span
//                             className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(
//                               notification.status,
//                             )}`}
//                           >
//                             {notification.status}
//                           </span>
//                           <span
//                             className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(
//                               notification.priority,
//                             )}`}
//                           >
//                             {notification.priority}
//                           </span>
//                           {notification.isGlobal ? (
//                             <Globe className="h-3.5 w-3.5 text-purple-500" />
//                           ) : (
//                             <User className="h-3.5 w-3.5 text-blue-500" />
//                           )}
//                         </div>

//                         <p className="text-sm text-gray-600">
//                           {notification.message}
//                         </p>

//                         <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
//                           <span>{formatDate(notification.createdAt)}</span>
//                           <span>•</span>
//                           <span>Type: {notification.type}</span>

//                           {notification.channels && (
//                             <>
//                               <span>•</span>
//                               <div className="flex items-center gap-1">
//                                 {notification.channels.inApp && (
//                                   <BellIcon
//                                     className="h-3 w-3"
//                                     title="In-app"
//                                   />
//                                 )}
//                                 {notification.channels.email && (
//                                   <Mail className="h-3 w-3" title="Email" />
//                                 )}
//                                 {notification.channels.push && (
//                                   <Smartphone
//                                     className="h-3 w-3"
//                                     title="Push"
//                                   />
//                                 )}
//                                 {notification.channels.sms && (
//                                   <AlertCircle
//                                     className="h-3 w-3"
//                                     title="SMS"
//                                   />
//                                 )}
//                               </div>
//                             </>
//                           )}
//                         </div>

//                         {notification.data?.actionText && (
//                           <div className="mt-1 flex items-center gap-1 text-xs font-medium text-blue-600">
//                             {notification.data.actionText}
//                           </div>
//                         )}
//                       </div>

//                       <div className="flex items-center gap-1 pl-4">
//                         {/* {notification.status === "unread" && (
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
//                         )} */}

//                         {/* {notification.status !== "archived" && (
//                           <button
//                             onClick={() =>
//                               archiveNotification(notification._id)
//                             }
//                             disabled={actionLoading === notification._id}
//                             className="rounded-md p-1.5 text-gray-400 transition hover:bg-yellow-50 hover:text-yellow-600 disabled:opacity-50"
//                             title="Archive"
//                           >
//                             <Archive className="h-4 w-4" />
//                           </button>
//                         )} */}

//                         <button
//                           onClick={() => deleteNotification(notification._id)}
//                           disabled={actionLoading === notification._id}
//                           className="rounded-md p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
//                           title="Delete"
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Pagination */}
//               <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
//                 <button
//                   disabled={page <= 1 || loading}
//                   onClick={handlePreviousPage}
//                   className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                 >
//                   Previous
//                 </button>

//                 <span className="text-sm text-gray-400">
//                   Page {page} of {totalPages}
//                 </span>

//                 <button
//                   disabled={page >= totalPages || loading}
//                   onClick={handleNextPage}
//                   className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                 >
//                   Next
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Create Notification Modal */}
//       {showCreateModal && (
//         <div className="fixed inset-0 z-50 bg-black/50">
//           <div className="flex min-h-full items-center justify-center p-4">
//             <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
//               <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
//                 <h2 className="text-xl font-semibold text-gray-900">
//                   Create New Notification
//                 </h2>
//                 <button
//                   onClick={() => setShowCreateModal(false)}
//                   className="rounded-full p-1 hover:bg-gray-100"
//                 >
//                   <X className="h-5 w-5 text-gray-500" />
//                 </button>
//               </div>

//               <form
//                 onSubmit={createNotification}
//                 className="p-6 overflow-y-auto max-h-[80vh]"
//               >
//                 <div className="space-y-4">
//                   {/* Global/Recipient */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Notification Type
//                     </label>
//                     <div className="mt-1 flex gap-4">
//                       <label className="flex items-center gap-2">
//                         <input
//                           type="radio"
//                           checked={formData.isGlobal}
//                           onChange={() =>
//                             setFormData({
//                               ...formData,
//                               isGlobal: true,
//                               recipient: undefined,
//                             })
//                           }
//                           className="h-4 w-4 text-blue-600"
//                         />
//                         <span className="text-sm">Global</span>
//                       </label>
//                       <label className="flex items-center gap-2">
//                         <input
//                           type="radio"
//                           checked={!formData.isGlobal}
//                           onChange={() =>
//                             setFormData({ ...formData, isGlobal: false })
//                           }
//                           className="h-4 w-4 text-blue-600"
//                         />
//                         <span className="text-sm">Specific User</span>
//                       </label>
//                     </div>
//                   </div>

//                   {!formData.isGlobal && (
//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Role
//                         </label>
//                         <Select
//                           value={ROLES.find(
//                             (option) => option.value === selectedRole,
//                           )}
//                           onChange={(selectedOption) =>
//                             handleRoleChange(selectedOption?.value || "")
//                           }
//                           options={ROLES}
//                           className="mt-1"
//                           classNamePrefix="react-select"
//                           isSearchable={false}
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Recipient *
//                         </label>
//                         <Select
//                           name="recipient"
//                           value={
//                             userOptions.find(
//                               (option) => option.value === formData.recipient,
//                             ) || null
//                           }
//                           onChange={(selectedOption) =>
//                             setFormData({
//                               ...formData,
//                               recipient: selectedOption?.value || "",
//                             })
//                           }
//                           options={userOptions}
//                           isLoading={loadingUsers}
//                           isDisabled={loadingUsers || formData.isGlobal}
//                           isClearable
//                           placeholder={
//                             loadingUsers ? "Loading users..." : "Select a user"
//                           }
//                           noOptionsMessage={() => "No users found"}
//                           className="mt-1"
//                           classNamePrefix="recipient-select"
//                           required={!formData.isGlobal}
//                         />
//                       </div>
//                     </div>
//                   )}

                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Active From*
//                       </label>
//                        <input type="date"  
//                         value={formData.from}                  
//                         onChange={(e) => {
//                           setFormData({...formData, from : e.target.value})
//                         }}
//                         max={new Date().toISOString().split('T')[0]}
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Active To *
//                       </label>
//                       <input type="date"    
//                       value={formData.to}
//                       // max={new Date().toISOString().split('T')[0]}                   
//                         onChange={(e) => {
//                           setFormData({...formData, to : e.target.value})
//                         }}
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                       />
//                     </div>
//                   </div>

//                       {/* {formData.isGlobal && (
//                         <div>
//                         <label className="block text-sm font-medium text-gray-700">
//                           Courses
//                         </label>
//                         <Select
//                           value={
//                             coursesOptions.find(
//                               (option) => option.value === formData.Courses,
//                             ) || null
//                           }
//                           onChange={(selectedOption) =>
//                             setFormData({
//                               ...formData,
//                               Courses: selectedOption?.value || "",
//                             })
//                           }
//                           options={coursesOptions}
//                           isClearable
//                           className="mt-1"
//                           classNamePrefix="react-select"
//                           isSearchable={true}
//                         />
//                       </div>
//                       )} */}
                      
//                       {formData.isGlobal && (
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700">
//                             Category
//                           </label>
                          
//                           <Select
//                             value={
//                               categoryOptions.find(
//                                 (option) => option.value === formData.Category,
//                               ) || null
//                             }
//                             onChange={(selectedOption) =>
//                               setFormData({
//                                 ...formData,
//                                 Category: selectedOption?.value || "",
//                               })
//                             }
//                             options={categoryOptions}
//                             isClearable
//                             className="mt-1"
//                             classNamePrefix="react-select"
//                             isSearchable={true}
//                           />
//                         </div>                  
//                       )}

//                   {/* Title */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Title *
//                     </label>
//                     <input
//                       type="text"
//                       value={formData.title}
//                       onChange={(e) =>
//                         setFormData({ ...formData, title: e.target.value })
//                       }
//                       placeholder="Notification title"
//                       required
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>

//                   {/* Message */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Message *
//                     </label>
//                     <textarea
//                       value={formData.message}
//                       onChange={(e) =>
//                         setFormData({ ...formData, message: e.target.value })
//                       }
//                       placeholder="Notification message"
//                       rows={3}
//                       required
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>

//                   {/* Type and Priority */}
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Type
//                       </label>
//                       <select
//                         value={formData.type}
//                         onChange={(e) =>
//                           setFormData({ ...formData, type: e.target.value })
//                         }
//                         className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                       >
//                         {NOTIFICATION_TYPES.map((type) => (
//                           <option key={type} value={type}>
//                             {type.replace(/_/g, " ").toUpperCase()}
//                           </option>
//                         ))}
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700">
//                         Priority
//                       </label>
//                       <select
//                         value={formData.priority}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             priority: e.target.value as any,
//                           })
//                         }
//                         className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                       >
//                         <option value="low">Low</option>
//                         <option value="medium">Medium</option>
//                         <option value="high">High</option>
//                         <option value="urgent">Urgent</option>
//                       </select>
//                     </div>
//                   </div>

//                   {/* Channels */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Delivery Channels
//                     </label>

//                     <div className="mt-2 flex flex-wrap gap-4">
//                       {[
//                         { key: "inApp", label: "In-App" },
//                         { key: "email", label: "Email" },
//                         { key: "push", label: "Push" },
//                         { key: "sms", label: "SMS" },
//                       ].map(({ key, label }) => (
//                         <label key={key} className="flex items-center gap-2">
//                           <input
//                             type="checkbox"
//                             checked={
//                               formData.channels[
//                                 key as keyof typeof formData.channels
//                               ]
//                             }
//                             onChange={(e) =>
//                               setFormData({
//                                 ...formData,
//                                 channels: {
//                                   ...formData.channels,
//                                   [key]: e.target.checked,
//                                 },
//                               })
//                             }
//                             className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                           />
//                           <span className="text-sm">{label}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Action Data (Optional) */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Action URL (Optional)
//                     </label>
//                     <input
//                       type="text"
//                       value={formData.data?.url || ""}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           data: { ...formData.data, url: e.target.value },
//                         })
//                       }
//                       placeholder="https://example.com/action"
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       Action Text (Optional)
//                     </label>
//                     <input
//                       type="text"
//                       value={formData.data?.actionText || ""}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           data: {
//                             ...formData.data,
//                             actionText: e.target.value,
//                           },
//                         })
//                       }
//                       placeholder="View Details"
//                       className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                     />
//                   </div>
//                 </div>

//                 <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => setShowCreateModal(false)}
//                     className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={creating}
//                     className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
//                   >
//                     {creating ? (
//                       <>
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                         Creating...
//                       </>
//                     ) : (
//                       <>
//                         <Send className="h-4 w-4" />
//                         Send Notification
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default NotificationManagement;







