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
  const [support,setsupport] = useState([])

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const res = await fetch("https://www.ooshasprep.com/api/article-category");
        console.log(res);
      }
      catch (error) {
        console.error("Error fetching support categories:", error);
      }
    };
    fetchSupport();
  }, []);


  useEffect(() => {
    fetchTickets();
  }, [filters]);

  useEffect(()=>{
    const fetchSupport = async ()=>{
      const res = await api.get("/support")

    }
    fetchSupport()
  },[])



  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.category !== 'all') params.append('category', filters.category);

      const response = await api.get(`/support`);
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
    <div className="relative z-10 py-8 sm:py-10 lg:pb-0">

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
    -mt-15
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
    onClick={()=>setShowCreateForm(true)}
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
        src="/images/support.png"
        alt="Support Center"
        className="w-full h-auto object-contain"
      />
    </div>

  </div>
</div>

        <div className="font-semibold text-xl mt-4">How can i we help you?</div>

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
          <h2 className="text-lg font-semibold tracking-[-0.2px] text-[#171717] sm:text-xl">
            Browse Help Topics
          </h2>

          <Link
            to="/all-articles"
            className="group flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#E87545] transition-colors hover:text-[#D95F32] sm:text-base"
          >
            <span>View All Articles</span>

            <ArrowRight
              size={15}
              strokeWidth={1.8}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Cards */}
        <div
          className="
            grid grid-cols-1 gap-3
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
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
                        text-base
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
                        text-sm
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
                <div className="mt-2 pl-[55px]">
                  <span className="text-sm font-medium text-[#666666]">
                    {topic.articles}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>



     <section className="w-full px-4 py-6 sm:px-6 lg:px-0">
      <div className="mx-auto w-full  space-y-6">

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
                      text-base
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
                      text-sm
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

        

          {/* Ticket Detail / Create Form - Right Panel */}
          
         
              {showCreateForm && (
                // Create Ticket Form
                 <div
    className="
      fixed inset-0 z-[9999]
      flex items-center justify-center
      bg-black/40
      px-4 py-6
      
       mx-auto
    "
   
  >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 p-6 w-3xl shadow-sm"
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
                </motion.div></div>
              ) }
         
       
        </div>
      </div>
    </div>
  );
};

export default SupportPage;