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
  Mic,
  MessageCircle,
  GraduationCap,
  CreditCard,
  ClipboardList,
  UserRound,
  Settings,
  ArrowRight,
  Headphones,
  Zap,
  ShieldCheck,
  ThumbsUp
} from 'lucide-react';
import { toast } from "react-toastify";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import api from "../../axiosInstance";
import { Link } from "react-router";

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


  const helpTopics = [
  {
    title: "Courses & Enrollments",
    description:
      "Find answers related to course content, enrollment and access.",
    articles: "12 Articles",
    icon: GraduationCap,
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#2563EB]",
  },
  {
    title: "Payments & Refunds",
    description:
      "Payment methods, failed transactions, refunds and invoices.",
    articles: "8 Articles",
    icon: CreditCard,
    iconBg: "bg-[#FFF3E8]",
    iconColor: "text-[#F97316]",
  },
  {
    title: "Mock Tests",
    description:
      "How to take tests, test settings, results and performance.",
    articles: "15 Articles",
    icon: ClipboardList,
    iconBg: "bg-[#FFF3E8]",
    iconColor: "text-[#F97316]",
  },
  {
    title: "Account & Profile",
    description:
      "Manage your account, profile, password and preferences.",
    articles: "10 Articles",
    icon: UserRound,
    iconBg: "bg-[#FFF0F2]",
    iconColor: "text-[#F43F5E]",
  },
  {
    title: "Technical Help",
    description:
      "App issues, login problems, video playback and other technical queries.",
    articles: "9 Articles",
    icon: Settings,
    iconBg: "bg-[#FFF3E8]",
    iconColor: "text-[#F97316]",
  },
];


const supportBenefits = [
  {
    title: "Fast Response Time",
    description: "We reply within 24 hours",
    icon: Zap,
  },
  {
    title: "Expert Support",
    description: "Trained professionals to help you",
    icon: ShieldCheck,
  },
  {
    title: "100% Satisfaction",
    description: "Your success is our priority",
    icon: ThumbsUp,
  },
];

  return (
    <div className="min-h-screen  dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-0">

        {/* Header Section */}
      <div className="w-full  rounded-3xl overflow-hidden">
  <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-0">

    {/* Content */}
    <div className="relative z-10 py-8 sm:py-10 lg:pb-5">

      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
       <div>
         <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717]">
          Support Center
        </h1>

        <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
          We're here to help you succeed. Find answers or get in touch with our
          team.
        </p>
       </div>

       <div>
        <div
  className="
    flex flex-col gap-3
    sm:flex-row sm:items-center
  "
>
  {/* All Support Tickets */}
  <Link to="/all-tickets"
    type="button"
    className="
      flex h-[38px]
      w-full sm:w-auto
      items-center justify-center
      rounded-[8px]
      border border-[#E5E3E1]
      bg-white
      px-5
      text-[12px]
      font-semibold
      text-[#444444]
      transition-all duration-300
      hover:border-[#F45B2A]
      hover:bg-[#FFF7F3]
      hover:text-[#F45B2A]
    "
  >
    All Support Tickets
  </Link>

  {/* Create New Ticket */}
  <button
    type="button"
    className="
      group
      flex h-[38px]
      w-full sm:w-auto
      items-center justify-center
      gap-2
      rounded-[8px]
      bg-[#F45B2A]
      px-5
      text-[12px]
      font-semibold
      text-white
      shadow-[0_4px_10px_rgba(244,91,42,0.16)]
      transition-all duration-300
      hover:bg-[#E94F20]
      hover:shadow-[0_6px_16px_rgba(244,91,42,0.22)]
    "
  >
    <Plus
      size={17}
      strokeWidth={2}
      className="
        transition-transform duration-300
        group-hover:rotate-90
      "
    />

    <span>Create New Ticket</span>
  </button>
</div>

       </div>
      </div>

      {/* Search Card */}
      <div className="mt-7 sm:mt-8 w-full lg:w-[700px] rounded-2xl border border-[#E8E8E8] bg-white p-3 sm:p-4 shadow-sm">

        {/* Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />

            <input
              type="text"
              placeholder="Search for help articles, guides or topics..."
              className="
                w-full
                h-12
                rounded-xl
                border border-[#E5E7EB]
                bg-white
                pl-11
                pr-4
                text-sm
                text-[#333]
                outline-none
                placeholder:text-[#9CA3AF]
                focus:border-[#FF6B35]
                focus:ring-1
                focus:ring-[#FF6B35]
              "
            />
          </div>

          <button
            className="
              h-12
              px-7
              rounded-xl
              bg-[#FF6B35]
              hover:bg-[#F15A24]
              text-white
              text-sm
              font-semibold
              shadow-sm
              transition
              duration-200
            "
          >
            Search
          </button>
        </div>

        {/* Popular Searches */}
        <div className="mt-3 flex flex-wrap items-center gap-2">

          <span className="text-xs sm:text-sm font-bold text-[#222]">
            Popular Searches:
          </span>

          {[
            "How to Enroll",
            "Payment Issues",
            "Refund Policy",
            "Mock Test Help",
            "Certificate",
          ].map((item) => (
            <button
              key={item}
              className="
                rounded-full
                bg-[#FFF8F5]
                border border-[#F8EDE7]
                px-3
                py-1.5
                text-[11px] sm:text-xs
                text-[#666]
                whitespace-nowrap
                hover:bg-[#FFF0EA]
                hover:text-[#FF6B35]
                transition
              "
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Right Illustration */}
    <div
      className="
        hidden
        lg:block
        absolute
        right-8
        bottom-0
        w-[310px]
        xl:w-[350px]
        pointer-events-none
      "
    >
      <img
        src="/images/support/support-center.png"
        alt="Support Center"
        className="w-full h-auto object-contain"
      />
    </div>

  </div>
</div>

        <div className="font-semibold text-xl">How can i we help you?</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">

  {/* Live Chat */}
  <div className="bg-white shadow-lg flex gap-4 p-4 rounded-2xl justify-center items-center min-h-[150px]">
    
    <div className="h-16 w-16 shrink-0 bg-orange-50 flex justify-center items-center rounded-full">
      <MessageCircle className="text-orange-500" size={32} />
    </div>

    <div className="flex flex-col gap-4 min-w-0">
      <div className="space-y-1 flex flex-col">
        <span className="font-bold text-black text-base">
          Live Chat
        </span>

        <span className="text-sm text-gray-500 whitespace-nowrap">
          Chat with our support team
        </span>
      </div>

      <div className="bg-green-100/50 rounded-xl py-2 px-3 w-fit flex justify-center items-center font-bold text-sm text-green-600">
        Online Now
      </div>
    </div>

  </div>


  {/* Email Support */}
  <div className="bg-white shadow-lg flex gap-4 p-4 rounded-2xl justify-center items-center min-h-[150px]">

    <div className="h-16 w-16 shrink-0 bg-orange-50 flex justify-center items-center rounded-full">
      <Mail className="text-orange-500" size={32} />
    </div>

    <div className="flex flex-col gap-4 min-w-0">
      <div className="space-y-1 flex flex-col">
        <span className="font-bold text-black text-base">
          Email Support
        </span>

        <span className="text-sm text-gray-500">
          We usually reply in 24 hrs
        </span>
      </div>

      <div className="bg-orange-50 rounded-xl py-2 px-3 w-fit flex justify-center items-center font-bold text-sm text-orange-500">
        Send Email
      </div>
    </div>

  </div>


  {/* Call Support */}
  <div className="bg-white shadow-lg flex gap-4 p-4 rounded-2xl justify-center items-center min-h-[150px]">

    <div className="h-16 w-16 shrink-0 bg-orange-50 flex justify-center items-center rounded-full">
      <Phone className="text-orange-500" size={32} />
    </div>

    <div className="flex flex-col gap-4 min-w-0">
      <div className="space-y-1 flex flex-col">
        <span className="font-bold text-black text-base">
          Call Support
        </span>

        <span className="text-sm text-gray-500 whitespace-nowrap">
          Mon – Sat, 10AM – 7PM
        </span>
      </div>

      <div className="bg-orange-50 rounded-xl py-2 px-3 w-fit flex justify-center items-center font-bold text-sm text-orange-500 whitespace-nowrap">
        +91 98765 43210
      </div>
    </div>

  </div>


  {/* Raise a Ticket */}
  <div className="bg-white shadow-lg flex gap-4 p-4 rounded-2xl justify-center items-center min-h-[150px]">

    <div className="h-16 w-16 shrink-0 bg-orange-50 flex justify-center items-center rounded-full">
      <FileText className="text-orange-500" size={32} />
    </div>

    <div className="flex flex-col gap-4 min-w-0">
      <div className="space-y-1 flex flex-col">
        <span className="font-bold text-black text-base">
          Raise a Ticket
        </span>

        <span className="text-sm text-gray-500">
          Submit your issue
        </span>
      </div>

      <div onClick={() => setShowCreateForm(true)} className="bg-orange-50 rounded-xl py-2 px-3 w-fit flex justify-center items-center font-bold text-sm text-orange-500 ">
        Create Ticket
      </div>
    </div>

  </div>

</div>


 <section className="w-full px-4 py-6 sm:px-6 lg:px-0">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[17px] font-bold tracking-[-0.2px] text-[#171717] sm:text-[18px]">
            Browse Help Topics
          </h2>

          <button
            type="button"
            className="group flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#E87545] transition-colors hover:text-[#D95F32] sm:text-[13px]"
          >
            <span>View All Articles</span>

            <ArrowRight
              size={15}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Cards */}
        <div
          className="
            grid grid-cols-1 gap-3
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-5
          "
        >
          {helpTopics.map((topic, index) => {
            const Icon = topic.icon;

            return (
              <div
                key={topic.title}
                className="
                  group relative min-h-[158px]
                  rounded-[15px]
                  border border-[#E9E7E5]
                  bg-white
                  p-4
                  shadow-[0_1px_3px_rgba(0,0,0,0.02)]
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:border-[#E4DCD7]
                  hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]
                  sm:p-[17px]
                "
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`
                      flex h-[43px] w-[43px] shrink-0
                      items-center justify-center
                      rounded-full
                      ${topic.iconBg}
                      transition-transform duration-300
                      group-hover:scale-105
                    `}
                  >
                    <Icon
                      size={22}
                      strokeWidth={2}
                      className={topic.iconColor}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3
                      className="
                        pt-[1px]
                        text-[13px]
                        font-semibold
                        leading-[18px]
                        text-[#242424]
                      "
                    >
                      {topic.title}
                    </h3>

                    <p
                      className="
                        mt-2
                        text-[11px]
                        font-normal
                        leading-[18px]
                        text-[#777777]
                      "
                    >
                      {topic.description}
                    </p>
                  </div>
                </div>

                {/* Article count */}
                <div className="mt-4 pl-[55px]">
                  <span className="text-[11px] font-medium text-[#666666]">
                    {topic.articles}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>



     <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">

        {/* ================= SUPPORT CTA ================= */}
        <div
          className="
            relative overflow-hidden
            flex flex-col
            gap-6
            rounded-[14px]
            border border-[#F3E7E1]
            bg-gradient-to-r from-[#FFF4EE] to-[#FFF8F5]
            px-6 py-6
            sm:px-8 sm:py-7
            md:flex-row
            md:items-center
            md:justify-between
            lg:px-10
          "
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -left-5 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border border-[#F7D9CB]" />
          <div className="pointer-events-none absolute -left-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-[#F4CDBD]" />

          {/* Left Content */}
          <div className="relative z-10 flex items-center gap-5 sm:gap-7">
            {/* Headphone Icon */}
            <div
              className="
                relative flex h-[68px] w-[68px]
                shrink-0 items-center justify-center
                rounded-full
                bg-[#FFF0E8]
                sm:h-[76px] sm:w-[76px]
              "
            >
              <Headphones
                size={42}
                strokeWidth={1.8}
                className="text-[#262626]"
              />

              {/* Small orange ear pads */}
              <span className="absolute left-[15px] top-[31px] h-[14px] w-[6px] rounded-full bg-[#F15B2A]" />
              <span className="absolute right-[15px] top-[31px] h-[14px] w-[6px] rounded-full bg-[#F15B2A]" />
            </div>

            {/* Text */}
            <div>
              <h2
                className="
                  text-[17px]
                  font-bold
                  leading-6
                  tracking-[-0.2px]
                  text-[#242424]
                  sm:text-[18px]
                "
              >
                Can’t find what you’re looking for?
              </h2>

              <p
                className="
                  mt-2
                  text-[12px]
                  leading-5
                  text-[#777777]
                  sm:text-[13px]
                "
              >
                Our support team is ready to help you with any issue.
              </p>
            </div>
          </div>

          {/* Button */}
          <button
            type="button"
            className="
              group relative z-10
              flex h-[44px]
              w-full
              items-center justify-center
              gap-3
              rounded-[10px]
              bg-[#F45B2A]
              px-6
              text-[13px]
              font-semibold
              text-white
              shadow-[0_5px_14px_rgba(244,91,42,0.18)]
              transition-all duration-300
              hover:bg-[#E94E20]
              hover:shadow-[0_7px_18px_rgba(244,91,42,0.25)]
              sm:w-auto
              sm:min-w-[222px]
            "
          >
            <span>Contact Support Team</span>

            <ArrowRight
              size={18}
              strokeWidth={2}
              className="
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />
          </button>
        </div>

        {/* ================= BENEFITS ================= */}
        <div
          className="
            grid
            grid-cols-1
            overflow-hidden
            rounded-[14px]
            border border-[#ECE9E7]
            bg-white
            sm:grid-cols-3
          "
        >
          {supportBenefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`
                  flex
                  items-center
                  gap-4
                  px-6
                  py-5
                  sm:px-7
                  lg:px-10
                  ${
                    index !== supportBenefits.length - 1
                      ? "border-b border-[#ECE9E7] sm:border-b-0 sm:border-r"
                      : ""
                  }
                `}
              >
                {/* Icon */}
                <div
                  className="
                    flex
                    h-[36px]
                    w-[36px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#FFF1E9]
                  "
                >
                  <Icon
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#F45B2A]"
                  />
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <h3
                    className="
                      text-[13px]
                      font-semibold
                      leading-[18px]
                      text-[#353535]
                    "
                  >
                    {item.title}
                  </h3>

                  <p
                    className="
                      mt-0.5
                      text-[11px]
                      leading-[17px]
                      text-[#858585]
                    "
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>

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