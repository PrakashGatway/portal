import { useEffect, useState } from "react";
import {
  Ticket, Clock3, Send, CheckCircle2, XCircle, Plus, Search,
  CalendarDays, ChevronDown, RotateCcw, Eye, MoreVertical,
  Minus, ArrowUpRight, ChevronRight, ChevronLeft, MessageSquare,
  Headphones, ArrowLeft, Smile, Mic, Paperclip, AlertCircle,
  Clock, CheckCircle, User, Loader2, Shield,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import api from "../../axiosInstance";
import { toast } from "react-toastify";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router";

export default function SupportTickets() {
  // ================= STATE =================
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
const [search, setSearch] = useState("");
const [dateSort, setDateSort] = useState("newest");
const [showDateSort, setShowDateSort] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalTickets, setTotalTickets] = useState(0);

const navigate = useNavigate()
  // Unified filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    category: "All",
    priority: ""
  });

  // ================= CONSTANTS =================
  const quickReplies = [
    "I'm looking into this issue and will get back to you shortly.",
    "Thank you for your patience. We're working on resolving this.",
    "Could you please provide more details about this issue?",
    "This has been resolved. Please let us know if you need further assistance.",
    "We've escalated this to our technical team for review."
  ];

  const statusStyles = {
    Open: "bg-[#FFF0E9] text-[#F26738]",
    "In Progress": "bg-[#EDF4FF] text-[#2874D8]",
    Resolved: "bg-[#EAFBF3] text-[#16A66A]",
    Closed: "bg-[#F0F1F4] text-[#59616D]",
  };

  const priorityStyles = {
    High: { text: "text-[#4A4A4A]", icon: "text-[#F15B5B]" },
    Medium: { text: "text-[#4A4A4A]", icon: "text-[#E9B52C]" },
    Low: { text: "text-[#4A4A4A]", icon: "text-[#42B88A]" },
  };

  // ================= HELPERS =================
  const getStatusConfig = (status) => {
    const configs = {
      open: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Open' },
      in_progress: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'In Progress' },
      resolved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Resolved' },
      closed: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', label: 'Closed' }
    };
    // Handle both "In Progress" and "in_progress" formats
    const key = status?.toLowerCase().replace(" ", "_");
    return configs[key] || configs.open;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Urgent' },
      high: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'High' },
      medium: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Medium' },
      low: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Low' }
    };
    const key = priority?.toLowerCase();
    return configs[key] || configs.medium;
  };

  const getCategoryColor = (category) => {
    const colors = {
      account: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      payment: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      technical: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      content: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      billing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      feature_request: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      general: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[category?.toLowerCase()] || colors.general;
  };

  const formatFullDate = (dateString) => moment(dateString).format("MMM D, YYYY [at] h:mm A");

  // ================= API HANDLERS =================
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'All') params.append('status', filters.status.toLowerCase());
      if (filters.category !== 'All') params.append('category', filters.category.toLowerCase());
      if (filters.priority) params.append('priority', filters.priority.toLowerCase());

      // Pass params to the API call so filtering actually works
      const response = await api.get(`/support?${params.toString()}`);
      setTickets(response.data.tickets || []);
       setTotalTickets(response?.data.total || 0);
    setTotalPages(response?.data.totalPages || 1);
    setCurrentPage(response?.data.currentPage || 1);
    } catch (error) {
      toast.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
  const timer = setTimeout(() => {
    setFilters((prev) => ({
      ...prev,
      search: search,
    }));
  }, 500);

  return () => clearTimeout(timer);
}, [search]);

  useEffect(() => {
    fetchTickets();
  }, [filters,currentPage]); // Re-fetch when filters change

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      await api.put(`/support/${selectedTicket._id}/reply`, { message: replyMessage });
      toast.success("Reply sent!");
      setReplyMessage("");

      // Refresh the selected ticket details
      const response = await api.get(`/support/${selectedTicket._id}`);
      setSelectedTicket(response.data.ticket);
      
      // Also refresh the list to update "Last Updated"
      fetchTickets();
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };


  const sortedTickets = [...tickets].sort((a, b) => {
  const dateA = new Date(a.updatedAt);
  const dateB = new Date(b.updatedAt);

  if (dateSort === "newest") {
    return dateB - dateA;
  }

  return dateA - dateB;
});



const handleBack = () => {
  navigate(-1);
};


  const clearFilters = () => {
    setFilters({ search: "", status: "All", category: "All",priority: "" });
  };

  // ================= RENDER =================
  return (
    <>
      {/* HEADER SECTION */}
      <section className="w-full px-4 py-2 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[21px] font-bold leading-7 tracking-[-0.4px] text-[#171717] sm:text-[22px]">
              My Support Tickets
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-[#777777] sm:text-[13px]">
              Track and manage all your support requests in one place.
            </p>

           
          </div>

        
            <div className="flex items-center justify-center gap-3git s">
               <button
  type="button"
  onClick={handleBack}
  className="flex items-center gap-2 mt-4"
>
  <ChevronLeft size={18} />
  Back
</button>
           

             <button type="button" className="group flex h-[38px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#F45B2A] px-5 text-[12px] font-semibold text-white shadow-[0_4px_10px_rgba(244,91,42,0.16)] transition-all duration-300 hover:bg-[#E94F20] hover:shadow-[0_6px_16px_rgba(244,91,42,0.22)] sm:w-auto">
            <Plus size={17} strokeWidth={2} className="transition-transform duration-300 group-hover:rotate-90" />
            <span>Create New Ticket</span>
          </button>
 </div>
       


         
        </div>
      </section>

      {/* MAIN TABLE SECTION */}
      <section className="w-full px-3 py-5 sm:px-5 lg:px-7">
        
        <div className="mx-auto w-full max-w-[1400px]">
          
          <div className="overflow-hidden rounded-[10px] border border-[#E8E7E5] bg-white">
            
            
            {/* FILTER BAR */}
            <div className="flex flex-col gap-3 border-b border-[#EDEBE9] p-3 sm:p-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:max-w-[373px]">
                <Search size={17} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747B84]" />
                <input
                  type="text"
                 value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets by subject or ID..."
                  className="h-[38px] w-full rounded-[7px] border border-[#DFE1E4] bg-white pl-10 pr-3 text-sm text-[#333333] outline-none placeholder:text-[#8A8F96] focus:border-[#F45B2A] focus:ring-2 focus:ring-[#F45B2A]/10"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto">
                  <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="h-[38px] w-full rounded-[7px] border border-[#DFE1E4] bg-white px-3 text-sm text-[#333333] outline-none focus:border-[#F45B2A] focus:ring-1 focus:ring-[#F45B2A]/20 sm:w-[150px]"
                >
                 
                  <option value="low">Priority: Low</option>
                  <option  value="medium">Priority: Medium</option>
                  <option value="High">Priority: High</option>
                  <option value="urgent">Priority: Urgent</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="h-[38px] w-full rounded-[7px] border border-[#DFE1E4] bg-white px-3 text-sm text-[#333333] outline-none focus:border-[#F45B2A] focus:ring-1 focus:ring-[#F45B2A]/20 sm:w-[150px]"
                >
                 
                  <option value="Open">Status: Open</option>
                  <option value="in_progress">Status: In Progress</option>
                  <option value="resolved">Status: Resolved</option>
                  <option value="closed">Status: Closed</option>
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="h-[38px] w-full rounded-[7px] border border-[#DFE1E4] bg-white px-3 text-sm text-[#333333] outline-none focus:border-[#F45B2A] focus:ring-1 focus:ring-[#F45B2A]/20 sm:w-[180px]"
                >
                  <option value="All">Category: All</option>
                  <option value="content">Category: Content</option>
                  <option value="payment">Category: Payments</option>
                  <option value="technical">Category: Technical</option>
                  <option value="account">Category: Account</option>
                  <option value="billing">Billing</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="general">General</option>
                </select>

              <div className="relative w-full sm:w-[198px]">
  <button
    type="button"
    onClick={() => setShowDateSort((prev) => !prev)}
    className="
      flex h-[38px] w-full items-center justify-between
      rounded-[7px] border border-[#DFE1E4] bg-white
      px-3 text-[11px] text-[#333333]
      transition hover:border-[#D4D6D9]
    "
  >
    <span className="flex items-center gap-2">
      <CalendarDays
        size={14}
        strokeWidth={1.8}
        className="text-[#69717A]"
      />

      <span className="text-sm">
        <span className="font-medium">Date:</span>{" "}
        {dateSort === "newest" ? "Newest First" : "Oldest First"}
      </span>
    </span>

    <ChevronDown
      size={14}
      className={`text-[#69717A] transition-transform ${
        showDateSort ? "rotate-180" : ""
      }`}
    />
  </button>

  {showDateSort && (
    <div
      className="
        absolute left-0 top-[42px] z-50 w-full
        overflow-hidden rounded-[7px]
        border border-[#DFE1E4]
        bg-white p-1
        shadow-[0_6px_20px_rgba(0,0,0,0.08)]
      "
    >
      <button
        type="button"
        onClick={() => {
          setDateSort("newest");
          setShowDateSort(false);
        }}
        className={`
          w-full rounded-[5px] px-3 py-2
          text-left text-[11px]
          transition hover:bg-[#FFF3EE]
          ${
            dateSort === "newest"
              ? "bg-[#FFF3EE] font-semibold text-[#F26738]"
              : "text-[#333333]"
          }
        `}
      >
        Newest First
      </button>

      <button
        type="button"
        onClick={() => {
          setDateSort("oldest");
          setShowDateSort(false);
        }}
        className={`
          w-full rounded-[5px] px-3 py-2
          text-left text-[11px]
          transition hover:bg-[#FFF3EE]
          ${
            dateSort === "oldest"
              ? "bg-[#FFF3EE] font-semibold text-[#F26738]"
              : "text-[#333333]"
          }
        `}
      >
        Oldest First
      </button>
    </div>
  )}
</div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-[38px] shrink-0 items-center justify-center gap-1.5 px-2 text-[11px] font-medium text-[#F26738] transition hover:text-[#D94F20]"
                >
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Clear
                </button>
              </div>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                  <tr className="border-b border-[#ECEAE8] bg-[#FCFCFC]">
                    {['Ticket Id', 'Subject', 'Category', 'Status', 'Priority', 'Last Updated', 'Actions'].map((head, i) => (
                      <th key={i} className={`px-4 py-3 text-left text-sm font-bold text-orange-500 ${i === 6 ? 'text-center' : ''}`}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-500">Loading tickets...</td></tr>
                  ) : sortedTickets.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-gray-500">No tickets found</td></tr>
                  ) : (
                    sortedTickets.map((ticket) => {
                      const pStyle = priorityStyles[ticket.priority] || priorityStyles.Medium;
                      return (
                        <tr key={ticket._id} className="border-b border-[#ECEAE8] transition hover:bg-[#FFFCFA]">
                          <td className="px-4 py-4">
                            <p className="text-sm font-bold text-[#25292E]">{ticket.ticketId}</p>
                            <p className="mt-1 whitespace-nowrap text-sm text-[#858A91]">{ticket.created}</p>
                          </td>
                          <td className="max-w-[245px] px-4 py-4">
                            <p className="truncate text-sm font-semibold text-[#30343A]">{ticket.subject}</p>
                            <p className="mt-1 truncate text-sm text-[#777D84]">{ticket.description}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-[#676D74]">{ticket.category}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-sm font-medium ${statusStyles[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                              <span className="h-[4px] w-[4px] rounded-full bg-current" />
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`flex items-center gap-2 text-sm ${pStyle.text}`}>
                              {ticket.priority === "High" && <ArrowUpRight size={15} strokeWidth={2} className={pStyle.icon} />}
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="whitespace-nowrap text-sm font-semibold text-[#30343A]">
                              {new Date(ticket.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                            </p>
                            <p className="mt-1 text-sm text-[#777D84]">
                              {new Date(ticket.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-center">
                              <button
                                onClick={() => setSelectedTicket(ticket)}
                                className="flex h-[32px] w-[32px] items-center justify-center rounded-[7px] border border-[#E1E3E5] bg-white text-[#69717A] transition-all duration-200 hover:border-[#F45B2A] hover:bg-[#FFF7F3] hover:text-[#F45B2A]"
                              >
                                <Eye size={15} strokeWidth={1.8} />
                              </button>
                              {

                              }
                         
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="divide-y divide-[#ECEAE8] lg:hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No tickets found</div>
              ) : (
                tickets.map((ticket) => {
                  const pStyle = priorityStyles[ticket.priority] || priorityStyles.Medium;
                  return (
                    <div key={ticket._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#25292E]">{ticket.ticketId || ticket.id}</p>
                          <p className="mt-1 text-[10px] text-[#858A91]">{ticket.created}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[10px] font-medium ${statusStyles[ticket.status]}`}>
                          <span className="h-[4px] w-[4px] rounded-full bg-current" />
                          {ticket.status}
                        </span>
                      </div>
                      <div className="mt-4">
                        <p className="text-[12px] font-semibold text-[#30343A]">{ticket.subject}</p>
                        <p className="mt-1 text-[10px] leading-5 text-[#777D84]">{ticket.description}</p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-medium uppercase text-[#999EA4]">Category</p>
                          <p className="mt-1 text-[11px] text-[#676D74]">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium uppercase text-[#999EA4]">Priority</p>
                          <span className={`mt-1 flex items-center gap-2 text-[11px] ${pStyle.text}`}>
                            {ticket.priority === "High" && <ArrowUpRight size={14} className={pStyle.icon} />}
                            {ticket.priority}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium uppercase text-[#999EA4]">Last Updated</p>
                          <p className="mt-1 text-[11px] font-medium text-[#30343A]">{ticket.updatedDate}</p>
                          <p className="text-[10px] text-[#777D84]">{ticket.updatedTime}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setSelectedTicket(ticket)} className="flex h-[32px] w-[32px] items-center justify-center rounded-[7px] border border-[#E1E3E5] bg-white text-[#69717A] hover:border-[#F45B2A] hover:bg-[#FFF7F3] hover:text-[#F45B2A]">
                          <Eye size={15} />
                        </button>
                        <button className="flex h-[32px] w-[32px] items-center justify-center rounded-[7px] border border-[#E1E3E5] bg-white text-[#69717A] hover:border-[#F45B2A] hover:bg-[#FFF7F3] hover:text-[#F45B2A]">
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION FOOTER */}
          <div className="flex flex-col gap-4 border-t border-[#ECEAE8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

  {/* Showing */}
  <p className="text-[11px] text-[#747982]">
    Showing{" "}
    {tickets.length === 0
      ? 0
      : (currentPage - 1) * 10 + 1}{" "}
    to{" "}
    {Math.min(currentPage * 10, totalTickets)}{" "}
    of {totalTickets} tickets
  </p>

  <div className="flex items-center justify-between gap-2 sm:justify-end">

    {/* Previous */}
    <button
      type="button"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((prev) => prev - 1)}
      className="
        flex h-[32px] min-w-[32px] items-center justify-center
        rounded-[7px] border border-[#E1E3E5]
        bg-white text-[#59616A]
        transition-all
        hover:border-[#F45B2A]
        hover:text-[#F26738]
        disabled:cursor-not-allowed
        disabled:opacity-40
      "
    >
      <ChevronLeft size={15} />
    </button>

    {/* Page Numbers */}
    {Array.from(
      { length: totalPages },
      (_, index) => index + 1
    ).map((page) => (
      <button
        key={page}
        type="button"
        onClick={() => setCurrentPage(page)}
        className={`
          flex h-[32px] min-w-[32px] items-center justify-center
          rounded-[7px] border text-[11px]
          transition-all
          ${
            currentPage === page
              ? "border-[#F45B2A] bg-[#FFF7F3] text-[#F26738]"
              : "border-[#E1E3E5] bg-white text-[#59616A] hover:border-[#F45B2A] hover:text-[#F26738]"
          }
        `}
      >
        {page}
      </button>
    ))}

    {/* Next */}
    <button
      type="button"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((prev) => prev + 1)}
      className="
        flex h-[32px] min-w-[32px] items-center justify-center
        rounded-[7px] border border-[#E1E3E5]
        bg-white text-[#59616A]
        transition-all
        hover:border-[#F45B2A]
        hover:text-[#F26738]
        disabled:cursor-not-allowed
        disabled:opacity-40
      "
    >
      <ChevronRight size={15} />
    </button>

  

  </div>
</div>
          </div>
        </div>
      </section>

      {/* HELP BANNER */}
      <section className="w-full px-3 py-2 sm:px-5 lg:px-7">
        <div className="relative mx-auto flex w-full max-w-[1400px] flex-col overflow-hidden rounded-[12px] border border-[#F3E5DE] bg-gradient-to-r from-[#FFF5F0] via-[#FFF9F7] to-[#FFF5F1] px-5 py-5 sm:px-7 md:flex-row md:items-center md:justify-between lg:px-10 lg:py-4">
          <div className="pointer-events-none absolute -left-7 top-1/2 h-[95px] w-[95px] -translate-y-1/2 rounded-full border border-[#F5D8CC]" />
          <div className="pointer-events-none absolute -left-1 top-1/2 h-[70px] w-[70px] -translate-y-1/2 rounded-full border border-[#F2CFC2]" />
          
          <div className="relative z-10 flex items-center gap-5 sm:gap-7">
            <div className="relative flex h-[65px] w-[65px] shrink-0 items-center justify-center sm:h-[72px] sm:w-[72px]">
              <Headphones size={58} strokeWidth={1.5} className="text-[#292929]" />
              <span className="absolute left-[7px] top-[30px] h-[17px] w-[7px] rounded-full bg-[#F36A3D]" />
              <span className="absolute right-[7px] top-[30px] h-[17px] w-[7px] rounded-full bg-[#F36A3D]" />
              <div className="absolute left-1/2 top-1/2 flex h-[28px] w-[36px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[7px] bg-[#F36A3D] shadow-[0_3px_8px_rgba(243,106,61,0.18)]">
                <MessageSquare size={17} strokeWidth={2.2} className="fill-white text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-[15px] font-bold leading-5 tracking-[-0.2px] text-[#282828] sm:text-[16px]">Need more help?</h2>
              <p className="mt-1 text-[11px] leading-5 text-[#777777] sm:text-[12px]">Can’t find what you’re looking for? Our support team is here for you.</p>
            </div>
          </div>

          <a href="tel:8302092630"  className="group relative z-10 mt-5 flex h-[36px] w-full items-center justify-center gap-3 rounded-[7px] border border-[#F0835F] bg-white/60 px-5 text-[11px] font-semibold text-[#E9673D] transition-all duration-300 hover:bg-[#FFF0E9] hover:shadow-[0_4px_12px_rgba(233,103,61,0.12)] md:mt-0 md:w-auto md:min-w-[199px]">
            <span>Contact Support Team</span>
            <ArrowUpRight size={16} strokeWidth={1.8} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      {/* TICKET DETAIL MODAL */}
      <AnimatePresence>
  {selectedTicket && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={() => setSelectedTicket(null)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col w-full max-w-3xl h-[calc(90vh-2rem)] bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedTicket.subject}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const cfg = getStatusConfig(selectedTicket.status);
                  const Icon = cfg.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-3 w-3" /> {cfg.label}
                    </span>
                  );
                })()}
                {(() => {
                  const cfg = getPriorityConfig(selectedTicket.priority);
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedTicket.category)}`}>
                  {selectedTicket.category}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/25">
                {selectedTicket.user?.name?.charAt(0) || 'U'}
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Created: {formatFullDate(selectedTicket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              <span>Updated: {formatFullDate(selectedTicket.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {/* Initial Message */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">You</span>
                <span className="text-xs text-gray-400">{formatFullDate(selectedTicket.createdAt)}</span>
              </div>
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/50 p-3">
                <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">{selectedTicket.description}</p>
              </div>
            </div>
          </div>

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
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${reply.isSupport ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {reply.isSupport ? <Shield className="h-3.5 w-3.5 text-white" /> : <User className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />}
                </div>
                <div className={`flex-1 space-y-1 ${reply.isSupport ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${reply.isSupport ? 'justify-end' : ''}`}>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {reply.isSupport ? "Support Team" : "You"}
                    </span>
                    <span className="text-xs text-gray-400">{formatFullDate(reply.createdAt)}</span>
                  </div>
                  <div className={`rounded-2xl p-3 ${reply.isSupport ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                    <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">{reply.message}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Reply Area */}
        {selectedTicket.status !== 'closed' ? (
          <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => setReplyMessage(reply)}
                  className="text-xs px-2.5 py-1.5 bg-white dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-full border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  {reply.length > 40 ? reply.substring(0, 40) + '...' : reply}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-center items-center">
              <div className="flex-1 relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={2}
                  placeholder="Type your reply..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <Smile className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <Mic className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
              <Button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || isSending}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl px-4 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-full"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">Send</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 rounded-xl p-3">
              <XCircle className="h-4 w-4" />
              This ticket is closed. Please create a new ticket if you need further assistance.
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </>
  );
}