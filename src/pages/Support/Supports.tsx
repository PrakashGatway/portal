// pages/SupportPage.jsx
import { useState, useEffect } from "react";
import moment from "moment";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import {
    MessageSquare,
    Plus,
    Search,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Send
} from "lucide-react";

export default function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
        priority: "all",
        category: "all"
    });
    const [replyMessage, setReplyMessage] = useState("");
    const [newTicket, setNewTicket] = useState({
        subject: "",
        description: "",
        category: "general",
        priority: "medium"
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchTickets();
    }, [filters]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = {
                search: filters.search || undefined,
                status: filters.status === "all" ? undefined : filters.status,
                priority: filters.priority === "all" ? undefined : filters.priority,
                category: filters.category === "all" ? undefined : filters.category
            };
            const response = await api.get("/support/tickets", { params });
            setTickets(response.data?.tickets || []);
        } catch (error) {
            toast.error("Failed to load support tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        const newErrors = {};
        if (!newTicket.subject.trim()) newErrors.subject = "Subject is required";
        if (!newTicket.description.trim()) newErrors.description = "Description is required";
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        try {
            const res = await api.post("/support/tickets", newTicket);
            toast.success("Support ticket created successfully!");
            fetchTickets();
            setShowCreateForm(false);
            setSelectedTicket(res.data); // Auto-open new ticket
            setNewTicket({ subject: "", description: "", category: "general", priority: "medium" });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create ticket");
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim()) return;
        try {
            await api.post(`/support/tickets/${selectedTicket._id}/reply`, {
                message: replyMessage,
                isSupport: false
            });
            toast.success("Reply sent!");
            setReplyMessage("");
            fetchTickets(); // Refresh to show new reply
            // Re-select ticket to update view
            const updated = tickets.find(t => t._id === selectedTicket._id);
            setSelectedTicket(updated);
        } catch (error) {
            toast.error("Failed to send reply");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "open": return <AlertCircle className="h-4 w-4" />;
            case "in_progress": return <Clock className="h-4 w-4" />;
            case "resolved": return <CheckCircle className="h-4 w-4" />;
            case "closed": return <XCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "open": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "resolved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString) => {
        return moment(dateString).fromNow();
    };

    const filteredTickets = tickets; // Filtering is done server-side

    return (
        <div className="w-full">
            {/* Header */}
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Support Center
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Get help with your account, payments, or technical issues
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {tickets.length} tickets
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <Plus className="h-4 w-4" />
                            New Support Ticket
                        </button>
                    </div>
                </div>
            </div>

            <div className="min-h-[70vh] rounded-2xl bg-white dark:bg-white/[0.03]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
                    {/* Tickets List */}
                    <div className={`lg:col-span-5 xl:col-span-4 space-y-4 transition-all duration-200 ${selectedTicket || showCreateForm ? 'hidden lg:block' : ''}`}>
                        {/* Search & Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search tickets..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-10"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>

                                <select
                                    value={filters.priority}
                                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                    className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>

                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="all">All</option>
                                    <option value="account">Account</option>
                                    <option value="payment">Payment</option>
                                    <option value="technical">Technical</option>
                                    <option value="content">Content</option>
                                    <option value="general">General</option>
                                </select>
                            </div>
                        </div>

                        {/* Tickets */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center h-full flex items-center justify-center flex-col">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
                                </div>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket._id}
                                        className={`bg-white dark:bg-gray-800 rounded-lg border cursor-pointer transition-all ${selectedTicket?._id === ticket._id
                                                ? 'border-indigo-500 ring-1 ring-indigo-500'
                                                : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                                            } p-4`}
                                        onClick={() => { setSelectedTicket(ticket); setShowCreateForm(false); }}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {ticket.subject}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {ticket.description}
                                            </p>
                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                                        {getStatusIcon(ticket.status)}
                                                        <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                                                    </span>
                                                    <span className="text-xs text-gray-500 capitalize">{ticket.category}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{formatDate(ticket.updatedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Ticket Detail / Create Form */}
                    <div className={`lg:col-span-7 xl:col-span-8 transition-all duration-200 ${!selectedTicket && !showCreateForm ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}>
                        {showCreateForm ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="lg:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </button>
                                        <h2 className="text-xl font-semibold">Create New Ticket</h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label>Subject *</Label>
                                        <Input
                                            type="text"
                                            value={newTicket.subject}
                                            onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                                            placeholder="Brief summary of your issue"
                                        />
                                        {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Category *</Label>
                                            <select
                                                value={newTicket.category}
                                                onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="account">Account</option>
                                                <option value="payment">Payment</option>
                                                <option value="technical">Technical</option>
                                                <option value="content">Content</option>
                                                <option value="general">General</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Priority *</Label>
                                            <select
                                                value={newTicket.priority}
                                                onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Description *</Label>
                                        <textarea
                                            value={newTicket.description}
                                            onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                                            rows={5}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                            placeholder="Please provide as much detail as possible..."
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowCreateForm(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleCreateTicket}>
                                            Create Ticket
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : selectedTicket ? (
                            <div className="space-y-4 w-full">
                                {/* Ticket Header */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <button
                                                onClick={() => setSelectedTicket(null)}
                                                className="lg:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-xl font-semibold mb-2">{selectedTicket.subject}</h2>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                                                        {getStatusIcon(selectedTicket.status)}
                                                        <span className="ml-1">{selectedTicket.status.replace('_', ' ')}</span>
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                                                        {selectedTicket.priority} priority
                                                    </span>
                                                    <span className="text-xs text-gray-500 capitalize">{selectedTicket.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created</p>
                                            <p className="text-sm font-medium">{moment(selectedTicket.createdAt).format("MMM D, YYYY h:mm A")}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                                            <p className="text-sm font-medium">{moment(selectedTicket.updatedAt).format("MMM D, YYYY h:mm A")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Conversation */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="font-semibold mb-4">Conversation</h3>
                                    <div className="space-y-4">
                                        {/* Initial Message */}
                                        <div className="flex gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                                                <span className="text-xs font-medium">ME</span>
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">You</span>
                                                    <span className="text-xs text-gray-500">
                                                        {moment(selectedTicket.createdAt).format("MMM D, YYYY h:mm A")}
                                                    </span>
                                                </div>
                                                <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-4">
                                                    <p className="text-sm whitespace-pre-line">{selectedTicket.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Replies */}
                                        {selectedTicket.replies?.map((reply, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${reply.isSupport ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}>
                                                    <span className="text-xs font-medium">{reply.isSupport ? 'SP' : 'ME'}</span>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {reply.isSupport ? "Support Team" : "You"}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {moment(reply.createdAt).format("MMM D, YYYY h:mm A")}
                                                        </span>
                                                    </div>
                                                    <div className={`rounded-lg p-4 ${reply.isSupport ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-700'
                                                        }`}>
                                                        <p className="text-sm whitespace-pre-line">{reply.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Reply Input */}
                                    {selectedTicket.status !== 'closed' && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <div className="space-y-3">
                                                <textarea
                                                    value={replyMessage}
                                                    onChange={(e) => setReplyMessage(e.target.value)}
                                                    rows={4}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                    placeholder="Type your reply..."
                                                />
                                                <div className="flex justify-end">
                                                    <Button onClick={handleSendReply} className="gap-2">
                                                        <Send className="h-4 w-4" />
                                                        Send Reply
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-semibold mb-2">Select a ticket</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Choose a ticket from the list to view details and conversation
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}