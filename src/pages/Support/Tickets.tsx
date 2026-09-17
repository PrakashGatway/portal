import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  Trash2,
  User,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import api from "../../axiosInstance";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../../context/UserContext";

const PAGE_LIMIT = 10;

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_OPTIONS = [
  { value: "account", label: "Account" },
  { value: "payment", label: "Payment" },
  { value: "technical", label: "Technical" },
  { value: "content", label: "Content" },
  { value: "billing", label: "Billing" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const STATUS_META = {
  open: {
    label: "Open",
    icon: AlertCircle,
    className:
      "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-300",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className:
      "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
};

const PRIORITY_META = {
  low: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  medium:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
  urgent: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const getRole = (user) => String(user?.role || "").toLowerCase();
const isStaffRole = (role) =>
  role === "admin" || role === "support" || role === "counselor";

const labelize = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getUserFromTicket = (ticket) => {
  if (!ticket) return null;
  return ticket.user || ticket.userId || null;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) =>
  value ? moment(value).format("MMM D, YYYY [at] h:mm A") : "-";

function StatusBadge({ status }) {
  const key = String(status || "open").toLowerCase();
  const meta = STATUS_META[key] || STATUS_META.open;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const key = String(priority || "medium").toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        PRIORITY_META[key] || PRIORITY_META.medium
      }`}
    >
      {key === "high" || key === "urgent" ? (
        <ArrowUpRight size={12} />
      ) : null}
      {labelize(key)}
    </span>
  );
}

function UserCard({ user }) {
  if (!user) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-orange-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex border border-orange-500 h-10 w-10 items-center justify-center rounded-full bg-white font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
          {user.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {user.name || "Unknown User"}
          </p>
          <p className="truncate text-xs text-gray-500">
            {user.email || "No email"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-xl bg-white p-2.5 dark:bg-gray-800">
          <p className="text-orange-500">User ID</p>
          <p className="mt-0.5 truncate font-medium text-gray-700 dark:text-gray-200">
            {user._id || "-"}
          </p>
        </div>
        {user.leader ? (
          <div className="rounded-xl bg-white p-2.5 dark:bg-gray-800">
            <p className="text-gray-400">Leader ID</p>
            <p className="mt-0.5 truncate font-medium text-gray-700 dark:text-gray-200">
              {String(user.leader)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SupportTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = getRole(user);
  const isAdmin = role === "admin";
  const isCounselor = role === "counselor";
  const isStaff = isStaffRole(role);
  const isCustomer = !isStaff;

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [updating, setUpdating] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const [replyMessage, setReplyMessage] = useState("");
  const [search, setSearch] = useState("");
  const [dateSort, setDateSort] = useState("newest");
  const [showDateSort, setShowDateSort] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  const [filters, setFilters] = useState({
    status: "All",
    category: "All",
    priority: "All",
    assignedTo: "",
  });

  const [stats, setStats] = useState({
    status: [],
    priority: [],
    category: [],
  });

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "general",
    priority: "medium",
    relatedModel: "None",
    relatedTo: "",
  });

  const quickReplies = useMemo(
    () => [
      "I'm looking into this issue and will get back to you shortly.",
      "Thank you for your patience. We're working on resolving this.",
      "Could you please provide more details about this issue?",
      "This has been resolved. Please let us know if you need further assistance.",
      "We've escalated this to our technical team for review.",
    ],
    []
  );

  const fetchTickets = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(PAGE_LIMIT));

      if (search.trim()) params.set("search", search.trim());
      if (filters.status !== "All") params.set("status", filters.status);
      if (filters.category !== "All") params.set("category", filters.category);
      if (filters.priority !== "All") params.set("priority", filters.priority);
      if (filters.assignedTo.trim())
        params.set("assignedTo", filters.assignedTo.trim());

      const response = await api.get(`/support?${params.toString()}`);
      const data = response?.data || {};

      setTickets(data.tickets || data.data || []);
      setTotalTickets(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load support tickets"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, search]);


  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);


  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt).getTime();
      return dateSort === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [tickets, dateSort]);

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setDetailLoading(true);

    try {
      const response = await api.get(`/support/${ticket._id}`);
      // Controller returns { success, data: ticket }
      setSelectedTicket(response?.data?.data || response?.data?.ticket || ticket);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load ticket details"));
    } finally {
      setDetailLoading(false);
    }
  };

  const updateSelectedTicket = (patch) => {
    setSelectedTicket((previous) =>
      previous ? { ...previous, ...patch } : previous
    );
  };

  const handleTicketUpdate = async (field, value) => {
    if (!selectedTicket?._id || !isStaff) return;

    setUpdating(field);

    try {
      const response = await api.put(`/support/admin/${selectedTicket._id}`, {
        [field]: value,
      });

      const updated =
        response?.data?.data || response?.data?.ticket || null;

      if (updated) {
        setSelectedTicket((previous) => ({
          ...previous,
          ...updated,
        }));
      } else {
        updateSelectedTicket({ [field]: value });
      }

      toast.success(`${labelize(field)} updated`);
      fetchTickets();
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to update ${field}`));
    } finally {
      setUpdating("");
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket?._id || !isStaff) return;

    setUpdating("close");

    try {
      const response = await api.put(`/support/admin/${selectedTicket._id}`, {
        status: "closed",
      });

      const updated =
        response?.data?.data || response?.data?.ticket || null;

      setSelectedTicket((previous) => ({
        ...previous,
        ...(updated || { status: "closed" }),
      }));

      toast.success("Ticket closed");
      fetchTickets();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to close ticket"));
    } finally {
      setUpdating("");
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket?._id || !isAdmin) return;

    const confirmed = window.confirm(
      `Delete ticket ${selectedTicket.ticketId || ""}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.delete(`/support/admin/${selectedTicket._id}`);
      toast.success("Ticket deleted");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete ticket"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket?._id) return;

    setIsSending(true);

    try {
      const response = await api.put(`/support/${selectedTicket._id}/reply`, {
        message: replyMessage.trim(),
      });

      const updated =
        response?.data?.data || response?.data?.ticket || null;

      if (updated) {
        setSelectedTicket(updated);
      } else {
        const detail = await api.get(`/support/${selectedTicket._id}`);
        setSelectedTicket(detail?.data?.data || detail?.data?.ticket);
      }

      setReplyMessage("");
      toast.success("Reply sent");
      fetchTickets();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reply"));
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error("Subject and description are required");
      return;
    }

    setCreating(true);

    try {
      const payload = {
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        category: newTicket.category,
        priority: newTicket.priority,
        relatedModel: newTicket.relatedModel,
        ...(newTicket.relatedTo.trim()
          ? { relatedTo: newTicket.relatedTo.trim() }
          : {}),
      };

      const response = await api.post("/support", payload);
      const created =
        response?.data?.data || response?.data?.ticket || null;

      toast.success("Support ticket created");
      setShowCreate(false);
      setNewTicket({
        subject: "",
        description: "",
        category: "general",
        priority: "medium",
        relatedModel: "None",
        relatedTo: "",
      });

      await fetchTickets();

      if (created?._id) {
        await openTicket(created);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create support ticket"));
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({
      status: "All",
      category: "All",
      priority: "All",
      assignedTo: "",
    });
    setCurrentPage(1);
  };


  return (
    <div className="min-h-full w-full sm:px-4">
      <div className="mx-auto max-w-[1450px] space-y-4">
        {/* HEADER */}
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:text-gray-300"
            >
              <ArrowLeft size={17} />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isAdmin
                    ? "Support Management"
                    : isCounselor
                    ? "Counselor Support Desk"
                    : "My Support Tickets"}
                </h1>

                {isAdmin ? (
                  <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    Admin
                  </span>
                ) : isCounselor ? (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Counselor
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    User
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {isAdmin
                  ? "Manage support requests, users, priorities and ticket status."
                  : isCounselor
                  ? "Handle tickets raised by users assigned to your counseling team."
                  : "Track your support requests and communicate with the support team."}
              </p>
            </div>
          </div>

          {isCustomer ? (
            <Button
              onClick={() => setShowCreate(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <Plus size={16} />
              Create Ticket
            </Button>
          ) : (
            <button
              onClick={() => {
                fetchTickets();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          )}
        </section>

        {/* FILTERS */}
        <section className="overflow-visible rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-[390px]">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isStaff
                    ? "Search subject, description or ticket ID..."
                    : "Search your tickets..."
                }
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:ml-auto lg:flex">
              <select
                value={filters.status}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilters((p) => ({ ...p, status: e.target.value }));
                }}
                className="h-10 min-w-[145px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="All">Status: All</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    Status: {item.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilters((p) => ({ ...p, priority: e.target.value }));
                }}
                className="h-10 min-w-[145px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="All">Priority: All</option>
                {PRIORITY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    Priority: {item.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.category}
                onChange={(e) => {
                  setCurrentPage(1);
                  setFilters((p) => ({ ...p, category: e.target.value }));
                }}
                className="h-10 min-w-[155px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="All">Category: All</option>
                {CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    Category: {item.label}
                  </option>
                ))}
              </select>

              {isStaff ? (
                <input
                  value={filters.assignedTo}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      assignedTo: e.target.value,
                    }))
                  }
                  placeholder="Assigned user ID"
                  className="h-10 min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              ) : null}

              {/* <div className="relative">
                <button
                  onClick={() => setShowDateSort((p) => !p)}
                  className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:min-w-[160px]"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    {dateSort === "newest" ? "Newest First" : "Oldest First"}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {showDateSort ? (
                  <div className="absolute right-0 top-11 z-30 w-full rounded-xl border border-gray-200 bg-white p-1 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    {["newest", "oldest"].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setDateSort(value);
                          setShowDateSort(false);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50 dark:hover:bg-gray-700"
                      >
                        {value === "newest" ? "Newest First" : "Oldest First"}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div> */}

              <button
                onClick={clearFilters}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* DESKTOP TABLE */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-orange-500 text-left text-xs font-semibold text-white">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Subject</th>
                  {isStaff ? <th className="px-4 py-3">User</th> : null}
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isStaff ? 8 : 7}
                      className="py-16 text-center text-sm text-gray-500"
                    >
                      <Loader2 className="mx-auto mb-2 animate-spin" />
                      Loading tickets...
                    </td>
                  </tr>
                ) : sortedTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isStaff ? 8 : 7}
                      className="py-16 text-center text-sm text-gray-500"
                    >
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  sortedTickets.map((ticket) => {
                    const ticketUser = getUserFromTicket(ticket);

                    return (
                      <tr
                        key={ticket._id}
                        className="border-t border-gray-100 hover:bg-orange-50/30 dark:border-gray-800 dark:hover:bg-gray-800/40"
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {ticket.ticketId || "—"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {moment(ticket.createdAt).format("DD MMM YYYY")}
                          </p>
                        </td>

                        <td className="max-w-[260px] px-4 py-4">
                          <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {ticket.subject}
                          </p>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {ticket.description}
                          </p>
                        </td>

                        {isStaff ? (
                          <td className="px-4 py-4">
                            <div className="flex max-w-[220px] items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900/30">
                                {ticketUser?.name?.charAt(0)?.toUpperCase() ||
                                  "U"}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                                  {ticketUser?.name || "Unknown"}
                                </p>
                                <p className="truncate text-[11px] text-gray-500">
                                  {ticketUser?.email || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                        ) : null}

                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">
                          {labelize(ticket.category)}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={ticket.status} />
                        </td>

                        <td className="px-4 py-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {moment(ticket.updatedAt).format("DD MMM YYYY")}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            {moment(ticket.updatedAt).format("hh:mm A")}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => openTicket(ticket)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-gray-700"
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE */}
          <div className="divide-y divide-gray-100 lg:hidden dark:divide-gray-800">
            {loading ? (
              <div className="p-12 text-center text-sm text-gray-500">
                <Loader2 className="mx-auto mb-2 animate-spin" />
                Loading...
              </div>
            ) : sortedTickets.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                No tickets found.
              </div>
            ) : (
              sortedTickets.map((ticket) => {
                const ticketUser = getUserFromTicket(ticket);

                return (
                  <div key={ticket._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          {ticket.ticketId}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {moment(ticket.createdAt).format("DD MMM YYYY")}
                        </p>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {ticket.subject}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                      {ticket.description}
                    </p>

                    {isStaff ? (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                        <UserRound size={15} className="text-orange-500" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold dark:text-white">
                            {ticketUser?.name || "Unknown user"}
                          </p>
                          <p className="truncate text-[11px] text-gray-500">
                            {ticketUser?.email || "-"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Category
                        </p>
                        <p className="mt-1 text-xs font-medium dark:text-gray-200">
                          {labelize(ticket.category)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">
                          Priority
                        </p>
                        <div className="mt-1">
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openTicket(ticket)}
                        className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:text-gray-300"
                      >
                        <Eye size={14} />
                        View Ticket
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Showing{" "}
              {totalTickets === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1} to{" "}
              {Math.min(currentPage * PAGE_LIMIT, totalTickets)} of{" "}
              {totalTickets} tickets
            </p>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 dark:border-gray-700"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-8 rounded-lg border px-2 text-xs ${
                      currentPage === page
                        ? "border-orange-500 bg-orange-50 font-semibold text-orange-600"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 dark:border-gray-700"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* CUSTOMER HELP */}
        {isCustomer ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-5 dark:border-orange-900/20 dark:from-orange-900/10 dark:to-gray-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/headphone.webp"
                alt="Support"
                className="h-14 w-14 object-contain"
              />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Need more help?
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Create a ticket and our support team will get back to you.
                </p>
              </div>
            </div>

            <a
              href="tel:9166146538"
              className="rounded-xl border border-orange-300 bg-white px-4 py-2.5 text-center text-xs font-semibold text-orange-600 hover:bg-orange-50 dark:bg-gray-900"
            >
              Contact Support Team
            </a>
          </section>
        ) : null}
      </div>

      {/* CREATE TICKET */}
      <AnimatePresence>
        {showCreate && isCustomer ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15 }}
              onSubmit={handleCreateTicket}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-gray-900 sm:p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Create Support Ticket
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Tell us what you need help with.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Subject
                  </label>
                  <input
                    required
                    value={newTicket.subject}
                    onChange={(e) =>
                      setNewTicket((p) => ({
                        ...p,
                        subject: e.target.value,
                      }))
                    }
                    maxLength={150}
                    placeholder="What can we help you with?"
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Category
                    </label>
                    <select
                      value={newTicket.category}
                      onChange={(e) =>
                        setNewTicket((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {CATEGORY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Priority
                    </label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) =>
                        setNewTicket((p) => ({
                          ...p,
                          priority: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {PRIORITY_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Description
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={newTicket.description}
                    onChange={(e) =>
                      setNewTicket((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the issue in detail..."
                    className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="rounded-xl border border-dashed border-gray-200 p-3 text-xs text-gray-500 dark:border-gray-700">
                  Related records are supported by the API. If you already have
                  a MongoDB ObjectId, you can optionally add it after selecting
                  a related model.
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select
                    value={newTicket.relatedModel}
                    onChange={(e) =>
                      setNewTicket((p) => ({
                        ...p,
                        relatedModel: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="None">Related: None</option>
                    {["Order", "Course", "TestSeries", "Question", "PromoCode"].map(
                      (model) => (
                        <option key={model} value={model}>
                          Related: {model}
                        </option>
                      )
                    )}
                  </select>

                  <input
                    value={newTicket.relatedTo}
                    onChange={(e) =>
                      setNewTicket((p) => ({
                        ...p,
                        relatedTo: e.target.value,
                      }))
                    }
                    placeholder="Related record ObjectId"
                    className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium dark:border-gray-700"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  disabled={creating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Create Ticket
                </Button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedTicket ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-5"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                {/* MODAL HEADER */}
                <div className="border-b-2 border-orange-500 p-4 dark:border-gray-800 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ArrowLeft size={17} />
                        </button>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
                            {selectedTicket.ticketId}
                          </p>
                          <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                            {selectedTicket.subject}
                          </h2>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
                        <StatusBadge status={selectedTicket.status} />
                        <PriorityBadge priority={selectedTicket.priority} />
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-500 dark:bg-gray-800 dark:text-gray-300">
                          {labelize(selectedTicket.category)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 pl-9 text-xs text-black">
                    <span>Created: {formatDate(selectedTicket.createdAt)}</span>
                    <span>Updated: {formatDate(selectedTicket.updatedAt)}</span>
                  </div>
                </div>

                {/* CONVERSATION */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  {detailLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="animate-spin text-orange-500" />
                    </div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-5">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                          <User size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold dark:text-white">
                              {isStaff
                                ? getUserFromTicket(selectedTicket)?.name ||
                                  "User"
                                : "You"}
                            </span>
                            <span className="text-[11px] text-black">
                              {formatDate(selectedTicket.createdAt)}
                            </span>
                          </div>
                          <div className="rounded-2xl rounded-tl-md bg-orange-50 p-4 dark:bg-gray-800 border border-orange-500">
                            <p className="whitespace-pre-line text-sm leading-6 text-orange-700 dark:text-gray-200">
                              {selectedTicket.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedTicket.replies?.map((reply, index) => {
                        const supportReply = Boolean(reply.isSupport);

                        return (
                          <div
                            key={reply._id || index}
                            className={`flex gap-3 ${
                              supportReply ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                supportReply
                                  ? "bg-orange-100 text-orange-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-orange-100 text-orange-700 dark:bg-gray-800"
                              }`}
                            >
                              {supportReply ? (
                                <Shield size={15} />
                              ) : (
                                <User size={15} />
                              )}
                            </div>

                            <div
                              className={`min-w-0 flex-1 ${
                                supportReply ? "text-right" : ""
                              }`}
                            >
                              <div
                                className={`mb-1 flex flex-wrap items-center gap-2 ${
                                  supportReply ? "justify-end" : ""
                                }`}
                              >
                                <span className="text-sm font-semibold dark:text-white">
                                  {supportReply
                                    ? reply.createdBy?.name || "Support Team"
                                    : reply.createdBy?.name || "User"}
                                </span>
                                <span className="text-[11px] text-black">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>

                              <div
                                className={`inline-block max-w-[90%] rounded-2xl p-4 text-left border border-orange-500 ${
                                  supportReply
                                    ? "rounded-tr-md bg-orange-50 dark:bg-blue-900/20"
                                    : "rounded-tl-md bg-orange-50 dark:bg-gray-800"
                                }`}
                              >
                                <p className="whitespace-pre-line text-sm leading-6 text-orange-700 dark:text-gray-200 ">
                                  {reply.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* REPLY */}
                {selectedTicket.status !== "closed" ? (
                  <div className="border-t border-gray-100 bg-orange-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40 sm:p-4">
                    <div className="mb-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => setReplyMessage(reply)}
                          className="shrink-0 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[11px] text-orange-600 hover:border-orange-300 hover:text-orange-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {reply.length > 45
                            ? `${reply.slice(0, 45)}...`
                            : reply}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-end gap-2">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        rows={2}
                        placeholder={
                          isStaff
                            ? "Reply to the user..."
                            : "Type your reply..."
                        }
                        className="min-h-[52px] flex-1 resize-none rounded-2xl border border-orange-500 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />

                      <button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || isSending}
                        className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSending ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800">
                      <XCircle size={16} />
                      This ticket is closed.
                    </div>
                  </div>
                )}
              </div>

              {/* STAFF SIDE PANEL */}
              {isStaff ? (
                <aside className="hidden w-[310px] shrink-0 border-l border-orange-500 bg-white p-4 dark:border-gray-800 dark:bg-gray-950/30 xl:block">
                  <div className="mb-4 flex items-center gap-2">
                    <UserRound size={16} className="text-orange-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      User Details
                    </h3>
                  </div>

                  <UserCard user={getUserFromTicket(selectedTicket)} />

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-black">
                      Ticket Controls
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-black dark:text-gray-300">
                          Status
                        </label>
                        <select
                          disabled={updating === "status"}
                          value={selectedTicket.status || "open"}
                          onChange={(e) =>
                            handleTicketUpdate("status", e.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-orange-500 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {STATUS_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-black dark:text-gray-300">
                          Priority
                        </label>
                        <select
                          disabled={updating === "priority"}
                          value={selectedTicket.priority || "medium"}
                          onChange={(e) =>
                            handleTicketUpdate("priority", e.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-orange-500 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {PRIORITY_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-black dark:text-gray-300">
                          Category
                        </label>
                        <select
                          disabled={updating === "category"}
                          value={selectedTicket.category || "general"}
                          onChange={(e) =>
                            handleTicketUpdate("category", e.target.value)
                          }
                          className="h-10 w-full rounded-xl border border-orange-500 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {CATEGORY_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-black">
                      Actions
                    </p>

                    {selectedTicket.status !== "closed" ? (
                      <button
                        disabled={updating === "close"}
                        onClick={handleCloseTicket}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      >
                        {updating === "close" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Close Ticket
                      </button>
                    ) : null}

                    {isAdmin ? (
                      <button
                        disabled={deleting}
                        onClick={handleDeleteTicket}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10"
                      >
                        {deleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete Ticket
                      </button>
                    ) : null}
                  </div>

                  {selectedTicket.assignedTo ? (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">
                        Assigned To
                      </p>
                      <p className="mt-1 break-all text-xs font-medium text-gray-700 dark:text-gray-200">
                        {String(
                          selectedTicket.assignedTo?._id ||
                            selectedTicket.assignedTo
                        )}
                      </p>
                    </div>
                  ) : null}
                </aside>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
