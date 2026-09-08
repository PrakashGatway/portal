

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

useEffect(() => {
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
      console.log(data.data || [],'alkjoijoijoijoijiojiojoijoi');
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setCategory([]);
    } finally {
      setLoadingUsers(false);
    }
  };
    fetchCategory();
  
},[]);

  useEffect(() => {
    

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
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
                    type="date"
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
                    type="date"
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







