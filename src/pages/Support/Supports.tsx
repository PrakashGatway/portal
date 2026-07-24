// src/pages/SupportPage.jsx
import { useState, useEffect, useMemo } from "react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Send,
  ChevronDown,
  Filter,
  User,
  Shield,
  Calendar,
  Tag,
  Loader2,
  X,
  Phone,
  Mail,
  HelpCircle,
  FileText,
  Video,
  BookOpen,
  Award,
  Star,
  ChevronRight,
  UserCircle,
  ReplyAll,
  Paperclip,
  Smile,
  Mic
} from 'lucide-react';
import { toast } from "react-toastify";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import api from "../../axiosInstance";

// Types
interface Ticket {
  _id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  replies: {
    _id: string;
    message: string;
    isSupport: boolean;
    createdAt: string;
    user?: {
      name: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

interface NewTicket {
  subject: string;
  description: string;
  category: string;
  priority: string;
  attachments?: File[];
}

const SupportPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    category: "all"
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [newTicket, setNewTicket] = useState<NewTicket>({
    subject: "",
    description: "",
    category: "general",
    priority: "medium"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.category !== 'all') params.append('category', filters.category);

      const response = await api.get(`/support?${params.toString()}`);
      setTickets(response.data.tickets || []);
    } catch (error) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    const newErrors: Record<string, string> = {};
    if (!newTicket.subject.trim()) newErrors.subject = "Subject is required";
    if (!newTicket.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await api.post("/support", newTicket);
      toast.success("Support ticket created successfully!");
      await fetchTickets();
      setShowCreateForm(false);
      setSelectedTicket(res.data.ticket);
      setNewTicket({ subject: "", description: "", category: "general", priority: "medium" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    setIsSending(true);
    try {
      await api.put(`/support/${selectedTicket?._id}/reply`, {
        message: replyMessage
      });
      toast.success("Reply sent!");
      setReplyMessage("");

      const response = await api.get(`/support/${selectedTicket?._id}`);
      setSelectedTicket(response.data.ticket);
      await fetchTickets();
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      open: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', label: 'Open' },
      in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', label: 'In Progress' },
      resolved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', label: 'Resolved' },
      closed: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', label: 'Closed' }
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      urgent: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', label: 'Urgent' },
      high: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', label: 'High' },
      medium: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', label: 'Medium' },
      low: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', label: 'Low' }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      account: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      payment: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      technical: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      content: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      billing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      feature_request: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[category] || colors.general;
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).fromNow();
  };

  const formatFullDate = (dateString: string) => {
    return moment(dateString).format("MMM D, YYYY [at] h:mm A");
  };

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "account", label: "Account" },
    { value: "payment", label: "Payment" },
    { value: "technical", label: "Technical" },
    { value: "content", label: "Content" },
    { value: "billing", label: "Billing" },
    { value: "feature_request", label: "Feature Request" },
    { value: "general", label: "General" },
    { value: "other", label: "Other" }
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" }
  ];

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  const getTicketStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    return { total, open, inProgress, resolved };
  };

  const stats = getTicketStats();

  // Quick reply suggestions
  const quickReplies = [
    "I'm looking into this issue and will get back to you shortly.",
    "Thank you for your patience. We're working on resolving this.",
    "Could you please provide more details about this issue?",
    "This has been resolved. Please let us know if you need further assistance.",
    "We've escalated this to our technical team for review."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700 p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: -10, scale: 1.05 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25"
              >
                <MessageSquare className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Support Center
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get help with your account, payments, or technical issues
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                <div className="flex -space-x-1">
                  {['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-gray-400'].map((color, i) => (
                    <div key={i} className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 ${color.replace('bg-', 'bg-')}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {stats.total} Tickets
                </span>
              </div>

              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 rounded-full px-6 py-2.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: 'Open', value: stats.open, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { label: 'In Progress', value: stats.inProgress, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Resolved', value: stats.resolved, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Total', value: stats.total, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-700/50' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`px-4 py-2 rounded-xl ${stat.bg} text-center`}
              >
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Tickets List - Left Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key="tickets-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`lg:col-span-5 xl:col-span-4 space-y-4 ${selectedTicket || showCreateForm ? 'hidden lg:block' : ''}`}
            >
              {/* Search & Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700 p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  {(filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all') && (
                    <button
                      onClick={() => setFilters({ search: '', status: 'all', priority: 'all', category: 'all' })}
                      className="text-xs text-orange-500 hover:text-orange-600 px-2 py-1"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {priorityOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {categoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tickets List */}
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  </div>
                ) : tickets.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700 p-8 text-center"
                  >
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {tickets.map((ticket, idx) => {
                      const statusConfig = getStatusConfig(ticket.status);
                      const priorityConfig = getPriorityConfig(ticket.priority);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.div
                          key={ticket._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: idx * 0.03 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowCreateForm(false);
                          }}
                          className={`bg-white dark:bg-gray-800 rounded-2xl border-2 cursor-pointer transition-all p-4 ${selectedTicket?._id === ticket._id
                            ? 'border-orange-500 ring-4 ring-orange-500/10'
                            : 'border-gray-200/50 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                            }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">
                                {ticket.subject}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                                {priorityConfig.label}
                              </span>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {ticket.description}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                                  {ticket.category}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400">{formatDate(ticket.updatedAt)}</span>
                            </div>

                            {ticket.replies?.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <ReplyAll className="h-3 w-3" />
                                <span>{ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Ticket Detail / Create Form - Right Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={showCreateForm ? "create-form" : selectedTicket ? "ticket-detail" : "empty"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`lg:col-span-7 xl:col-span-8 ${!selectedTicket && !showCreateForm ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}
            >
              {showCreateForm ? (
                // Create Ticket Form
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 p-6 w-full shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Ticket</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">We'll get back to you as soon as possible</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Subject <span className="text-red-500">*</span></Label>
                      <input
                        type="text"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief summary of your issue"
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                      {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Category <span className="text-red-500">*</span></Label>
                        <select
                          value={newTicket.category}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          {categoryOptions.filter(opt => opt.value !== 'all').map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Priority <span className="text-red-500">*</span></Label>
                        <select
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          {priorityOptions.filter(opt => opt.value !== 'all').map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></Label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                        rows={5}
                        placeholder="Please provide as much detail as possible..."
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                      />
                      {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-xl transition-colors">
                        <Paperclip className="h-4 w-4" />
                        Attach files
                      </button>
                      <span className="text-xs text-gray-400">Max size 10MB</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateForm(false)}
                        className="rounded-xl px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTicket}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-8 shadow-lg shadow-orange-500/25"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : selectedTicket ? (
                // Ticket Detail View
                <div className="space-y-4 w-full">
                  {/* Ticket Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-2"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {selectedTicket.subject}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedTicket.status).bg} ${getStatusConfig(selectedTicket.status).color}`}>
                            {(() => {
                              const Icon = getStatusConfig(selectedTicket.status).icon;
                              return <Icon className="h-3.5 w-3.5" />;
                            })()}
                            {getStatusConfig(selectedTicket.status).label}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getPriorityConfig(selectedTicket.priority).bg} ${getPriorityConfig(selectedTicket.priority).color}`}>
                            {getPriorityConfig(selectedTicket.priority).label} Priority
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedTicket.category)}`}>
                            {selectedTicket.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/25">
                          {selectedTicket.user?.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Created</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatFullDate(selectedTicket.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Last Updated</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatFullDate(selectedTicket.updatedAt)}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Conversation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-orange-500" />
                        Conversation
                        {selectedTicket.replies?.length > 0 && (
                          <span className="text-xs text-gray-400 font-normal">
                            ({selectedTicket.replies.length} {selectedTicket.replies.length === 1 ? 'reply' : 'replies'})
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                      {/* Initial Message */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">You</span>
                            <span className="text-xs text-gray-400">{formatFullDate(selectedTicket.createdAt)}</span>
                          </div>
                          <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 p-4">
                            <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
                              {selectedTicket.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Replies */}
                      <AnimatePresence mode="popLayout">
                        {selectedTicket.replies?.map((reply, idx) => (
                          <motion.div
                            key={reply._id || idx}
                            layout
                            initial={{ opacity: 0, x: reply.isSupport ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: reply.isSupport ? 20 : -20 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex gap-3 ${reply.isSupport ? 'flex-row-reverse' : ''}`}
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${reply.isSupport
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25'
                              : 'bg-gray-200 dark:bg-gray-700'
                              }`}>
                              {reply.isSupport ? (
                                <Shield className="h-4 w-4 text-white" />
                              ) : (
                                <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              )}
                            </div>
                            <div className={`flex-1 space-y-1 ${reply.isSupport ? 'text-right' : ''}`}>
                              <div className={`flex items-center gap-2 ${reply.isSupport ? 'justify-end' : ''}`}>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {reply.isSupport ? "Support Team" : "You"}
                                </span>
                                <span className="text-xs text-gray-400">{formatFullDate(reply.createdAt)}</span>
                              </div>
                              <div className={`rounded-2xl p-4 ${reply.isSupport
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-gray-50 dark:bg-gray-700/50'
                                }`}>
                                <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
                                  {reply.message}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Quick Replies */}
                    {selectedTicket.status !== 'closed' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {quickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => setReplyMessage(reply)}
                              className="text-xs px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-full border border-gray-200 dark:border-gray-600 transition-colors"
                            >
                              {reply.length > 40 ? reply.substring(0, 40) + '...' : reply}
                            </button>
                          ))}
                        </div>

                        {/* Reply Input */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="relative">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={3}
                              placeholder="Type your reply..."
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendReply();
                                }
                              }}
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-1">
                              <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                                <Smile className="h-4 w-4 text-gray-400" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                                <Mic className="h-4 w-4 text-gray-400" />
                              </button>
                              <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                                <Paperclip className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              onClick={handleSendReply}
                              disabled={!replyMessage.trim() || isSending}
                              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-8 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Send className="h-4 w-4 mr-2" />
                              )}
                              Send Reply
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {selectedTicket.status === 'closed' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                          <XCircle className="h-4 w-4" />
                          This ticket is closed. Please create a new ticket if you need further assistance.
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              ) : (
                // Empty State
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 p-12 text-center w-full shadow-sm"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center"
                  >
                    <MessageSquare className="h-10 w-10 text-orange-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No ticket selected</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Choose a ticket from the list to view details and conversation, or create a new one.
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/25"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Ticket
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;