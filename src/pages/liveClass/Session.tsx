import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Clock,
  Video,
  Calendar,
  Users,
  BookOpen,
  Loader,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Timer,
  ExternalLink,
  Tag,
  Layers,
  ArrowRight,
  Trophy,
  Mail,
  Bookmark,
  User,
  Plus,
  ChevronRight,
} from "lucide-react";
import api, { ImageBaseUrl } from "../../axiosInstance";

const ContentViewPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<any>(null);
  const [canJoin, setCanJoin] = useState(false);

  const session = {
    time: "10:00 AM",
    date: "June 12",
    description: "Follow-up Pte Exam and prescription review",
    instructorName: "Sidney Yates",
    instructorRole: "Pte expert",
    instructorImage: "/images/sidney.png",
};


  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 56,
    minutes: 17
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const upcomingSessions = [
    {
      id: '08',
      title: 'Session 08',
      topic: 'Advanced Algebra & Problem Solving',
      date: '26 Aug, Tue',
      time: '4:00 PM - 5:00 PM',
      active: true
    },
    {
      id: '09',
      title: 'Session 09',
      topic: 'Problem Solving Techniques',
      date: '28 Aug, Thu',
      time: '4:00 PM - 5:00 PM',
      active: false
    },
    {
      id: '10',
      title: 'Session 10',
      topic: 'Full Mathematics Review',
      date: '30 Aug, Sat',
      time: '4:00 PM - 5:00 PM',
      active: false
    }
  ];

  const tabs = ['Overview', 'Material', 'Schedule', 'Trainer', 'Recordings'];
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/content/slug/${slug}`);

        const data = response?.data?.data;

        if (!data) {
          throw new Error("Content not found");
        }

        setContent(data);
      } catch (err) {
        console.error("Error fetching content:", err);
        setError("Failed to load session. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    }
  }, [slug]);


  // Check session date against today's date
const getSessionDateStatus = (scheduledStart?: string) => {
  if (!scheduledStart) return "upcoming";

  const sessionDate = new Date(scheduledStart);
  const today = new Date();

  sessionDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (sessionDate.getTime() < today.getTime()) {
    return "expired";
  }

  if (sessionDate.getTime() === today.getTime()) {
    return "today";
  }

  return "upcoming";
};

const sessionStatus2 = getSessionDateStatus(content?.scheduledStart);


  const meetingUrl = content?.meetingId || null;

  const scheduledStartValue = content?.scheduledStart || null;
  const scheduledEndValue = content?.scheduledEnd || null;

  const scheduledStart = scheduledStartValue
    ? new Date(scheduledStartValue)
    : null;

  const scheduledEnd = scheduledEndValue ? new Date(scheduledEndValue) : null;

  const instructor = content?.instructorInfo;
  const course = content?.courseInfo;
  const moduleInfo = content?.moduleInfo;


  const calculateTimeUntilMeeting = useCallback(() => {
    if (!scheduledStartValue || !scheduledEndValue) {
      setTimeRemaining(null);
      setCanJoin(false);
      return;
    }

    const now = Date.now();

    const startTime = new Date(scheduledStartValue).getTime();
    const endTime = new Date(scheduledEndValue).getTime();

    const timeDiff = startTime - now;

    const tenMinutes = 10 * 60 * 1000;

    // Meeting currently live
    if (now >= startTime && now <= endTime) {
      setCanJoin(true);

      setTimeRemaining({
        type: "live",
        hours: 0,
        minutes: 0,
        seconds: 0,
      });

      return;
    }

    // Meeting starts within next 10 minutes
    if (timeDiff > 0 && timeDiff <= tenMinutes) {
      setCanJoin(true);

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));

      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeRemaining({
        type: "upcoming",
        hours,
        minutes,
        seconds,
      });

      return;
    }

    // Meeting starts later
    if (timeDiff > tenMinutes) {
      setCanJoin(false);

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));

      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeRemaining({
        type: "waiting",
        hours,
        minutes,
        seconds,
      });

      return;
    }

    // Meeting ended
    setCanJoin(false);

    setTimeRemaining({
      type: "ended",
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  }, [scheduledStartValue, scheduledEndValue]);

  useEffect(() => {
    if (!scheduledStartValue || !scheduledEndValue) {
      setTimeRemaining(null);
      setCanJoin(false);
      return;
    }

    calculateTimeUntilMeeting();

    const timer = setInterval(() => {
      calculateTimeUntilMeeting();
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [scheduledStartValue, scheduledEndValue, calculateTimeUntilMeeting]);

  const formatTime = (time: any) => {
    if (!time) return null;

    if (time.type === "live") {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
          </span>

          <span className="text-lg font-bold text-red-600">LIVE NOW</span>
        </div>
      );
    }

    if (time.type === "ended") {
      return (
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Clock className="h-5 w-5" />
          <span className="font-semibold">Session Ended</span>
        </div>
      );
    }

    const pad = (num: number) => String(num).padStart(2, "0");

    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <div className="min-w-[60px] rounded-xl bg-gray-50 px-3 py-3 text-center sm:min-w-[75px]">
          <div className="text-xl font-bold text-gray-900 sm:text-2xl">
            {pad(time.hours)}
          </div>

          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Hours
          </div>
        </div>

        <span className="text-xl font-bold text-gray-400">:</span>

        <div className="min-w-[60px] rounded-xl bg-gray-50 px-3 py-3 text-center sm:min-w-[75px]">
          <div className="text-xl font-bold text-gray-900 sm:text-2xl">
            {pad(time.minutes)}
          </div>

          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Minutes
          </div>
        </div>

        <span className="text-xl font-bold text-gray-400">:</span>

        <div className="min-w-[60px] rounded-xl bg-gray-50 px-3 py-3 text-center sm:min-w-[75px]">
          <div className="text-xl font-bold text-gray-900 sm:text-2xl">
            {pad(time.seconds)}
          </div>

          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Seconds
          </div>
        </div>
      </div>
    );
  };

  const handleJoinMeeting = () => {
    if (!canJoin || !meetingUrl) return;

    window.open(meetingUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Not scheduled";

    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimeOnly = (date: Date | null) => {
    if (!date) return "--";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0 min";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return `${minutes} min`;
  };

  const getSessionStatus = () => {
    if (!scheduledStart || !scheduledEnd) {
      return {
        label: "Scheduled",
        className: "bg-gray-100 text-gray-700",
      };
    }

    const now = Date.now();

    if (now >= scheduledStart.getTime() && now <= scheduledEnd.getTime()) {
      return {
        label: "Live Now",
        className: "bg-red-100 text-red-700",
      };
    }

    if (now < scheduledStart.getTime()) {
      return {
        label: "Upcoming",
        className: "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "Completed",
      className: "bg-gray-100 text-gray-600",
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-gray-600">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Unable to load session
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {error || "Session information was not found."}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sessionStatus = getSessionStatus();

  return (
  <div className="min-h-screen">
  <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6 lg:px-8">
    {/* BACK BUTTON */}
    <button
      onClick={() => navigate(-1)}
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Content
    </button>

    {/* ==================================================
        HERO SECTION
    ================================================== */}
    <div className="p-4 md:p-6 lg:p-0">
      <div className="">
        {/* Main Content Grid */}
        <div className="h-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.5fr] gap-2 h-full">
          
     {/* Main Session Card */}

     <div className="flex flex-col h-full">
      <div className="bg-gradient-to-b from-white via-gray-50 to-gray-200 p-[2px] rounded-[24px]">
<div
  className="
    grid
    grid-cols-1
    lg:grid-cols-[1.35fr_0.85fr_1fr]
    gap-5
    lg:gap-3
    p-5
    md:p-4
    rounded-[24px]
    border
    border-orange-200/60
    bg-gradient-to-r
    from-orange-100/70
    via-[#fff1e8]
    to-orange-100
    h-70
   
  "
>
  {/* ================= LEFT SECTION ================= */}
  <div className="flex h-full flex-col min-w-0">
    
    {/* Badge */}
    <div>
      <div
        className="
          inline-flex
          items-center
          gap-2
          bg-orange-500
          text-white
          px-4
          py-2
          rounded-full
          text-sm
          font-semibold
          mb-3
        "
      >
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Upcoming Session
      </div>

      {/* Category */}
      <p className="text-gray-700 text-sm font-semibold mb-2">
        SAT MATHEMATICS{" "}
        <span className="text-orange-500">•</span>{" "}
        SESSION 08
      </p>

      {/* Title */}
      <h1
        className="
          text-2xl
          md:text-3xl
          lg:text-[27px]
          xl:text-lg
          font-bold
          text-gray-900
          leading-[1.15]
          mb-5
        "
      >
      {content?.title}
      </h1>

      {/* Date */}
      <div className="flex items-center gap-2 text-gray-700 mb-3">
        <Calendar className="w-5 h-5 shrink-0 text-orange-500" />
       <span className="font-medium text-sm md:text-base">
  {new Date(content?.scheduledStart).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}
</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-gray-700 mb-3">
        <Clock className="w-5 h-5 shrink-0 text-orange-500" />
    <span className="font-medium text-sm md:text-base">
  {content?.scheduledStart
    ? new Date(content.scheduledStart).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : ""}
</span>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex flex-wrap gap-3">
    <Link to={content?.meetingId}>
      <button
      
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          bg-orange-500
          hover:bg-orange-600
          text-white
          px-4
          py-2.5
          rounded-xl
          text-sm
          font-semibold
          transition-all
          duration-200
          shadow-lg
          shadow-orange-500/30
        "
      >
        <Video className="w-4 h-4" />
        Join Class
      </button></Link>

      <button
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          bg-white
          hover:bg-gray-50
          text-gray-700
          border
          border-orange-200
          px-4
          py-2.5
          rounded-xl
          text-sm
          font-semibold
          transition-all
          duration-200
        "
      >
        <Plus className="w-4 h-4" />
        Add to Calendar
      </button>
    </div>
  </div>


  {/* ================= TRAINER SECTION ================= */}
  <div
    className="
      bg-white/60
      rounded-[20px]
      p-5
      md:p-6
      border
      border-orange-200
      flex
      justify-center
      items-center
    "
  >
    <div className="text-center flex flex-col justify-center items-center">
      
      {/* Profile Image */}
      <div className="relative mb-4">
        <div
          className="
            w-[76px]
            h-[76px]
            md:w-[82px]
            md:h-[82px]
            rounded-full
            border-2
            border-orange-400
            overflow-hidden
          "
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
            alt="Trainer"
            className="w-full h-full object-cover"
          />
        </div>

    
      </div>

      <p className="text-gray-500 text-sm mb-1">
        Your Instructor
      </p>

      <h3 className="text-lg md:text-sm font-bold text-gray-900 leading-tight">
        {instructor?.name}
      </h3>

      <p className="text-orange-600 font-medium text-sm mt-1">
        Pte expert
      </p>

      <p className="text-gray-500 text-xs mt-1">
        8+ years Experience
      </p>
    </div>
  </div>


  {/* ================= COUNTDOWN SECTION ================= */}
  <div
    className="
  
     
      bg-white
      rounded-[20px]
      p-5
      md:p-6
      border
      border-orange-100
      flex
      items-center justify-center
     
    "
  >
    <div className="w-full  text-center">
      
      <h3
        className="
          text-base
          md:text-lg
          font-bold
          text-gray-900
          mb-6
        "
      >
        CLASS STARTS IN
      </h3>

      {/* Timer */}
      <div className="flex items-start justify-center gap-1.5 w-full mb-5">
        
        {/* Days */}
        <div className="flex flex-col items-center">
          <div
            className="
              bg-orange-500
              text-white
              rounded-md
              w-[45px]
              md:w-[48px]
              py-2
            "
          >
            <div className="text-2xl md:text-3xl font-bold leading-none">
              {String(timeLeft.days).padStart(2, "0")}
            </div>
          </div>

          <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-1">
            DAYS
          </span>
        </div>

        {/* Separator */}
        <span className="text-orange-500 text-2xl font-bold mt-1">
          :
        </span>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div
            className="
              bg-orange-500
              text-white
              rounded-md
              w-[45px]
              md:w-[48px]
              py-2
            "
          >
            <div className="text-2xl md:text-3xl font-bold leading-none">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
          </div>

          <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-1">
            HOURS
          </span>
        </div>

        {/* Separator */}
        <span className="text-orange-500 text-2xl font-bold mt-1">
          :
        </span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div
            className="
              bg-orange-500
              text-white
              rounded-md
              w-[45px]
              md:w-[48px]
              py-2
            "
          >
            <div className="text-2xl md:text-3xl font-bold leading-none">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
          </div>

          <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-1">
            MINUTE
          </span>
        </div>
      </div>

      {/* Date */}
      <p className="text-gray-600 text-sm font-medium">
        Tuesday, 26 Aug 2026
      </p>
    </div>
  </div>
</div></div>
   {/* Bottom Navigation Tabs */}
        <div className="mt-6  bg-white rounded-2xl border border-orange-100 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide ">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex min-w-[100px] px-6 py-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === tab
                    ? 'text-orange-600 border-orange-500 bg-orange-50/50'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
</div>

          {/* Right Section - Upcoming Sessions */}
          <div className="">
            <div className="bg-white rounded-3xl p-4 shadow-lg border border-orange-500 h-full">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
              
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-2xl p-2 cursor-pointer transition-all duration-200 ${
                      session.active
                        ? 'bg-gradient-to-br from-orange-100 to-peach-100 border-2 border-orange-300 shadow-md'
                        : 'bg-gray-50 border-2 border-gray-100 hover:border-orange-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Session Number */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        session.active
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-600 border-2 border-gray-200'
                      }`}>
                        {session.id}
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-bold text-sm ${
                            session.active ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {session.title}
                          </h3>
                          { (
                            <span className={`text-[10px] font-semibold  whitespace-nowrap ${session.active ? "text-orange-600" : "text-gray-600"}`}>
                              {session.date}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{session.topic}</p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{session.time}</span>
                        </div>
                    
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        </div>

     

      </div>
    </div>

    <div className="">
  <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 lg:px-0 my-3">

    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.5fr] gap-4">
      
      {/* ======================================================= */}
      {/* LEFT - CURRENT SESSION */}
      {/* ======================================================= */}

    <div className="w-full">
  {sessionStatus2 === "expired" ? (
    /* ========================================================= */
    /* EXPIRED SESSION CARD */
    /* ========================================================= */

   <div
  className="
    w-full
   
    bg-gradient-to-br
    from-white
    via-[#fffaf7]
    to-[#f8f8f8]
    border
    border-[#ffd3c4]
    rounded-[16px]
    p-6
    sm:p-8
    flex
    flex-col
    items-center
    justify-center
    text-center
    shadow-sm
  "
>
  {/* Expired Icon */}
  <div
    className="
      w-16
      h-16
      sm:w-20
      sm:h-20
      rounded-full
      bg-[#fff0eb]
      border
      border-[#ffd6ca]
      flex
      items-center
      justify-center
      mb-5
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="
        w-7
        h-7
        sm:w-8
        sm:h-8
        text-[#ff7148]
      "
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  </div>

  {/* Title */}
  <h2
    className="
      text-xl
      sm:text-2xl
      font-semibold
      text-[#10152f]
      mb-2
    "
  >
    Session Ended
  </h2>

  {/* Description */}
  <p
    className="
      max-w-[420px]
      text-sm
      sm:text-[15px]
      leading-relaxed
      text-[#777777]
      mb-6
    "
  >
    This session has already ended and is no longer available to join.
  </p>

  {/* Status Badge */}
  <span
    className="
      inline-flex
      items-center
      gap-2
      px-4
      py-2
      rounded-full
      bg-[#f1f1f1]
      border
      border-[#e3e3e3]
      text-[#656565]
      text-sm
      font-medium
    "
  >
    <span className="w-2 h-2 rounded-full bg-[#9b9b9b]" />
    Expired Session
  </span>
</div>
  ) : (
    /* ========================================================= */
    /* TODAY / UPCOMING SESSION CARD */
    /* ========================================================= */

    <div
      className="
        w-full
        min-w-0
        bg-white
        border
        border-[#ffd3c4]
        rounded-[12px]
        p-5
        sm:p-6
        lg:p-5
      "
    >
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-[300px_minmax(0,1fr)]
          lg:grid-cols-[325px_minmax(0,1fr)]
          gap-6
          lg:gap-8
          items-start
        "
      >

        {/* =================================================== */}
        {/* SESSION THUMBNAIL */}
        {/* =================================================== */}

        <div className="w-full min-w-0">

          <h2
            className="
              text-[24px]
              sm:text-[25px]
              lg:text-[26px]
              leading-tight
              font-semibold
              text-[#111827]
              mb-5
            "
          >
            <span className="text-[#ff613f]">
              Session
            </span>
          </h2>

          {/* Thumbnail */}
          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[11px]
              border
              border-[#ff633f]
              bg-[#fff7f2]
              aspect-[1.5/1]
            "
          >
            <img
              src={`${ImageBaseUrl}/${content?.thumbnailPic}`}
              alt={content?.title || "Session"}
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />
          </div>
        </div>


        {/* =================================================== */}
        {/* SESSION INFORMATION */}
        {/* =================================================== */}

        <div className="w-full min-w-0">

          {/* Title */}
          <h1
            className="
              text-[25px]
              sm:text-[28px]
              lg:text-[29px]
              xl:text-[30px]
              leading-[1.08]
              font-semibold
              tracking-[-0.4px]
              text-[#10152f]
              mb-5
            "
          >
            {content?.title}
          </h1>


          {/* ================================================= */}
          {/* INSTRUCTOR */}
          {/* ================================================= */}

          <div className="flex items-center gap-3 mb-3">

            {/* Instructor Image */}
            <div
              className="
                w-[52px]
                h-[52px]
                shrink-0
                rounded-full
                border-2
                border-[#ff704c]
                overflow-hidden
                bg-[#fff3ed]
              "
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/709/709699.png"
                alt={instructor?.name || "Instructor"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Instructor Details */}
            <div className="min-w-0">

              <p
                className="
                  text-[15px]
                  sm:text-[16px]
                  leading-tight
                  font-semibold
                  text-[#15182d]
                "
              >
                Instructor:{" "}
                <span className="text-[#ff613f]">
                  {instructor?.name}
                </span>
              </p>

              <p
                className="
                  text-[13px]
                  sm:text-[14px]
                  text-[#777777]
                  mt-1
                "
              >
                PTE Expert & English Language Trainer
              </p>

            </div>
          </div>


          {/* ================================================= */}
          {/* DESCRIPTION */}
          {/* ================================================= */}

          <p
            className="
              max-w-[620px]
              text-[14px]
              sm:text-[15px]
              leading-[1.45]
              text-[#606060]
              mb-5
              line-clamp-3
            "
          >
            {course?.description}
          </p>


          {/* ================================================= */}
          {/* ACTION */}
          {/* ================================================= */}

          <div className="flex flex-wrap items-center gap-3">

            {/* View Session */}
            <Link to={content?.meetingId || "#"}>
              <button
                className="
                  inline-flex
                  items-center
                  justify-center
                  min-h-[34px]
                  px-4
                  sm:px-5
                  rounded-[9px]
                  bg-[#ff7148]
                  hover:bg-[#ff6338]
                  text-white
                  text-[14px]
                  sm:text-[15px]
                  font-medium
                  transition-colors
                  duration-200
                "
              >
                View Session
              </button>
            </Link>

          </div>

        </div>
      </div>
    </div>
  )}
</div>


      {/* ======================================================= */}
      {/* RIGHT - PREVIOUS RECORDING */}
      {/* ======================================================= */}

      <div
        className="
          w-full
          min-w-0
          bg-white
          border
          border-[#ffd3c4]
          rounded-[12px]
          p-4
          sm:px-3
          sm:py-1
        "
      >
        
        {/* Heading */}
        <h2
          className="
            text-[15px]
            sm:text-[16px]
            font-semibold
            text-[#111827]
            
            border-b
            border-[#eeeeee]
          "
        >
          Previous Recording
        </h2>


        {/* ===================================================== */}
        {/* VIDEO THUMBNAIL */}
        {/* ===================================================== */}

        <div className="mt-2">
          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[10px]
              bg-[#111111]
              aspect-[1.9/1]
            "
          >
            <img
              src="/images/previous-recording.png"
              alt="Previous recording"
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Play Button */}
            <button
              className="
                absolute
                left-1/2
                top-1/2
                -translate-x-1/2
                -translate-y-1/2
                w-[48px]
                h-[48px]
                rounded-full
                bg-white
                flex
                items-center
                justify-center
                shadow-md
                hover:scale-105
                transition-transform
                duration-200
              "
              aria-label="Play recording"
            >
              <span className="ml-1 text-[#ff6b3d] text-xl">
                ▶
              </span>
            </button>

            {/* Bottom Overlay */}
            <div
              className="
                absolute
                bottom-0
                left-0
                right-0
                px-2.5
                py-2
                flex
                items-center
                justify-between
                gap-2
                bg-gradient-to-t
                from-black/70
                to-transparent
              "
            >
              <span
                className="
                  text-white
                  text-[11px]
                  sm:text-xs
                  font-semibold
                  truncate
                "
              >
                Session 07 · Number Systems
              </span>

              <span
                className="
                  shrink-0
                  text-white
                  text-[10px]
                  font-semibold
                  bg-black/40
                  px-1.5
                  py-0.5
                  rounded
                "
              >
                1:28:42
              </span>
            </div>
          </div>
        </div>


        {/* ===================================================== */}
        {/* RECORDING INFORMATION */}
        {/* ===================================================== */}

        <div className="mt-3">
          <h3
            className="
              text-[13px]
              sm:text-[14px]
              font-semibold
              leading-snug
              text-[#202020]
            "
          >
            Session 07 – Number Systems & Ratios
          </h3>

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
              mt-1
              text-[11px]
              sm:text-xs
              text-[#8a8a8a]
            "
          >
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px]">
                □
              </span>
              Sep 11, 2025
            </span>

            <span>
              ·
            </span>

            <span>
              1h 28min
            </span>
          </div>
        </div>


        {/* ===================================================== */}
        {/* WATCH BUTTON */}
        {/* ===================================================== */}

        <button
          className="
            w-full
            mt-3
            min-h-[42px]
            rounded-[10px]
            bg-[#ff711d]
            hover:bg-[#f76512]
            text-white
            text-[14px]
            font-semibold
            flex
            items-center
            justify-center
            gap-2
            transition-colors
            duration-200
          "
        >
          <span className="text-sm">
            ▷
          </span>

          Watch Recording
        </button>
      </div>
    </div>
  </div>
  </div>

  <div className="w-full">
  <div
    className="
      grid
      grid-cols-1
      lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]
      gap-4
      items-start
    "
  >
    {/* ========================================================= */}
    {/* TEACHING PLAN */}
    {/* ========================================================= */}

    <div
      className="
        w-full
        min-w-0
        overflow-hidden
        rounded-[14px]
        border
        border-[#ffd4c7]
        bg-white
      "
    >
      {/* Header */}
      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-2
          px-4
          sm:px-5
          py-4
          border-b
          border-[#eeeeee]
        "
      >
        <h2
          className="
            text-[15px]
            sm:text-[16px]
            font-semibold
            text-[#10182f]
          "
        >
          Teaching Plan
        </h2>

        <p
          className="
            text-[11px]
            sm:text-xs
            font-medium
            text-[#63718a]
          "
        >
          4 topics · 110 min
        </p>
      </div>

      {/* ======================================================= */}
      {/* TOPIC LIST */}
      {/* ======================================================= */}

      <div className="w-full">

        {/* ------------------------------------------------------- */}
        {/* TOPIC 01 */}
        {/* ------------------------------------------------------- */}

        <div
          className="
            grid
            grid-cols-[38px_minmax(0,1fr)_auto]
            sm:grid-cols-[38px_minmax(0,1fr)_auto]
            items-center
            gap-3
            px-3
            sm:px-4
            py-3
            sm:py-3.5
            bg-[#fff8f3]
            border-b
            border-[#f0e0da]
          "
        >
          {/* Number */}
          <div
            className="
              w-[34px]
              h-[34px]
              rounded-[10px]
              bg-[#ff6b25]
              text-white
              flex
              items-center
              justify-center
              text-[13px]
              font-semibold
            "
          >
            01
          </div>

          {/* Content */}
          <div className="min-w-0">
            <h3
              className="
                text-[13px]
                sm:text-[14px]
                font-semibold
                text-[#10203b]
                truncate
              "
            >
              Introduction to Algebraic Expressions
            </h3>

            <p
              className="
                text-[11px]
                sm:text-xs
                text-[#71809a]
                mt-0.5
              "
            >
              25 min
            </p>
          </div>

          {/* Status */}
          <span
            className="
              shrink-0
              inline-flex
              items-center
              justify-center
              px-2.5
              py-1
              rounded-full
              border
              border-[#ffb58f]
              bg-[#fffaf7]
              text-[#ff6b25]
              text-[10px]
              sm:text-[11px]
              font-medium
              whitespace-nowrap
            "
          >
            In Progress
          </span>
        </div>


        {/* ------------------------------------------------------- */}
        {/* TOPIC 02 */}
        {/* ------------------------------------------------------- */}

        <div
          className="
            grid
            grid-cols-[38px_minmax(0,1fr)_auto]
            items-center
            gap-3
            px-3
            sm:px-4
            py-3
            sm:py-3.5
            bg-white
            border-b
            border-[#eeeeee]
          "
        >
          {/* Number */}
          <div
            className="
              w-[34px]
              h-[34px]
              rounded-[10px]
              bg-[#fff8f3]
              border
              border-[#ffb58f]
              text-[#ff6b25]
              flex
              items-center
              justify-center
              text-[13px]
              font-semibold
            "
          >
            02
          </div>

          {/* Content */}
          <div className="min-w-0">
            <h3
              className="
                text-[13px]
                sm:text-[14px]
                font-semibold
                text-[#10203b]
                truncate
              "
            >
              Linear Equations & Inequalities
            </h3>

            <p
              className="
                text-[11px]
                sm:text-xs
                text-[#71809a]
                mt-0.5
              "
            >
              30 min
            </p>
          </div>

          {/* Status */}
          <span
            className="
              shrink-0
              inline-flex
              items-center
              justify-center
              px-2.5
              py-1
              rounded-full
              border
              border-[#c9ddff]
              bg-[#f5f9ff]
              text-[#4b8df8]
              text-[10px]
              sm:text-[11px]
              font-medium
              whitespace-nowrap
            "
          >
            Next
          </span>
        </div>


        {/* ------------------------------------------------------- */}
        {/* TOPIC 03 */}
        {/* ------------------------------------------------------- */}

        <div
          className="
            grid
            grid-cols-[38px_minmax(0,1fr)_auto]
            items-center
            gap-3
            px-3
            sm:px-4
            py-3
            sm:py-3.5
            bg-white
            border-b
            border-[#eeeeee]
          "
        >
          {/* Number */}
          <div
            className="
              w-[34px]
              h-[34px]
              rounded-[10px]
              bg-[#f4f6fa]
              text-[#63718a]
              flex
              items-center
              justify-center
              text-[13px]
              font-semibold
            "
          >
            03
          </div>

          {/* Content */}
          <div className="min-w-0">
            <h3
              className="
                text-[13px]
                sm:text-[14px]
                font-semibold
                text-[#10203b]
                truncate
              "
            >
              Quadratic Functions & Parabolas
            </h3>

            <p
              className="
                text-[11px]
                sm:text-xs
                text-[#71809a]
                mt-0.5
              "
            >
              35 min
            </p>
          </div>

          {/* Status */}
          <span
            className="
              shrink-0
              inline-flex
              items-center
              justify-center
              px-2.5
              py-1
              rounded-full
              border
              border-[#e1e6ee]
              bg-[#f7f8fa]
              text-[#71809a]
              text-[10px]
              sm:text-[11px]
              font-medium
              whitespace-nowrap
            "
          >
            Upcoming
          </span>
        </div>


        {/* ------------------------------------------------------- */}
        {/* TOPIC 04 */}
        {/* ------------------------------------------------------- */}

        <div
          className="
            grid
            grid-cols-[38px_minmax(0,1fr)_auto]
            items-center
            gap-3
            px-3
            sm:px-4
            py-3
            sm:py-3.5
            bg-white
          "
        >
          {/* Number */}
          <div
            className="
              w-[34px]
              h-[34px]
              rounded-[10px]
              bg-[#f4f6fa]
              text-[#63718a]
              flex
              items-center
              justify-center
              text-[13px]
              font-semibold
            "
          >
            04
          </div>

          {/* Content */}
          <div className="min-w-0">
            <h3
              className="
                text-[13px]
                sm:text-[14px]
                font-semibold
                text-[#10203b]
                truncate
              "
            >
              Word Problems & Applied Algebra
            </h3>

            <p
              className="
                text-[11px]
                sm:text-xs
                text-[#71809a]
                mt-0.5
              "
            >
              20 min
            </p>
          </div>

          {/* Status */}
          <span
            className="
              shrink-0
              inline-flex
              items-center
              justify-center
              px-2.5
              py-1
              rounded-full
              border
              border-[#e1e6ee]
              bg-[#f7f8fa]
              text-[#71809a]
              text-[10px]
              sm:text-[11px]
              font-medium
              whitespace-nowrap
            "
          >
            Upcoming
          </span>
        </div>
      </div>
    </div>


    {/* ========================================================= */}
    {/* COURSE PROGRESS */}
    {/* ========================================================= */}

    <div
      className="
        w-full
        min-w-0
        rounded-[14px]
        border
        border-[#ffd4c7]
        bg-white
        p-4
        sm:p-5
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2
          className="
            text-[15px]
            sm:text-[16px]
            font-semibold
            text-[#10182f]
          "
        >
          Course Progress
        </h2>

        <span
          className="
            text-[15px]
            sm:text-[16px]
            font-bold
            text-[#ff642f]
          "
        >
          33%
        </span>
      </div>

      {/* ======================================================= */}
      {/* PROGRESS BAR */}
      {/* ======================================================= */}

      <div
        className="
          w-full
          h-[7px]
          mt-3
          rounded-full
          bg-[#f0f2f7]
          overflow-hidden
        "
      >
        <div
          className="
            h-full
            w-[33%]
            rounded-full
            bg-gradient-to-r
            from-[#ff6b25]
            to-[#ffb45d]
          "
        />
      </div>

      {/* ======================================================= */}
      {/* STAT CARDS */}
      {/* ======================================================= */}

      <div
        className="
          grid
          grid-cols-3
          gap-2
          mt-3
        "
      >
        {/* Done */}
        <div
          className="
            min-w-0
            rounded-[12px]
            bg-[#f4f6fb]
            px-2
            py-2.5
            text-center
          "
        >
          <p
            className="
              text-[14px]
              sm:text-[15px]
              font-semibold
              text-[#16213b]
            "
          >
            8
          </p>

          <p
            className="
              text-[9px]
              sm:text-[10px]
              text-[#77849a]
              mt-0.5
            "
          >
            Done
          </p>
        </div>

        {/* Left */}
        <div
          className="
            min-w-0
            rounded-[12px]
            bg-[#f4f6fb]
            px-2
            py-2.5
            text-center
          "
        >
          <p
            className="
              text-[14px]
              sm:text-[15px]
              font-semibold
              text-[#16213b]
            "
          >
            16
          </p>

          <p
            className="
              text-[9px]
              sm:text-[10px]
              text-[#77849a]
              mt-0.5
            "
          >
            Left
          </p>
        </div>

        {/* Total */}
        <div
          className="
            min-w-0
            rounded-[12px]
            bg-[#f4f6fb]
            px-2
            py-2.5
            text-center
          "
        >
          <p
            className="
              text-[14px]
              sm:text-[15px]
              font-semibold
              text-[#16213b]
            "
          >
            24
          </p>

          <p
            className="
              text-[9px]
              sm:text-[10px]
              text-[#77849a]
              mt-0.5
            "
          >
            Total
          </p>
        </div>
      </div>
    </div>
  </div>
</div>


<div className="w-full space-y-3 my-4 grid grid-cols-1 xl:grid-cols-[1.5fr_0.5fr] gap-4">

  {/* ========================================================= */}
  {/* SESSION MATERIAL */}
  {/* ========================================================= */}
  <div className="flex flex-col gap-4">

  <div
    className="
      w-full
      rounded-[20px]
      border
      border-[#dedede]
      bg-white
      px-4
      py-5
      sm:px-5
      md:px-7
      md:py-6
    "
  >
    {/* Header */}
    <div className="flex items-center justify-between gap-4 mb-5">
      <h2
        className="
          text-[16px]
          sm:text-[17px]
          font-semibold
          text-[#1c1c1c]
        "
      >
        Session Material
      </h2>

      <button
        className="
          shrink-0
          text-[12px]
          sm:text-[13px]
          font-medium
          text-[#ff6b3d]
          hover:text-[#f45128]
          transition-colors
        "
      >
        View All &gt;
      </button>
    </div>


    {/* ======================================================= */}
    {/* MATERIAL LIST */}
    {/* ======================================================= */}

    <div className="space-y-3">

      {/* ------------------------------------------------------- */}
      {/* MATERIAL 01 */}
      {/* ------------------------------------------------------- */}

      <div
        className="
          w-full
          flex
          items-center
          gap-3
          sm:gap-4
          rounded-[13px]
          border
          border-[#f2dfd5]
          bg-[#fff8f2]
          px-3
          sm:px-4
          py-3
          sm:py-3.5
        "
      >
        {/* PDF Icon */}
        <div
          className="
            w-[38px]
            h-[38px]
            sm:w-[40px]
            sm:h-[40px]
            shrink-0
            rounded-[9px]
            bg-[#ffe9dd]
            flex
            items-center
            justify-center
          "
        >
          <div
            className="
              w-[27px]
              h-[30px]
              rounded-[4px]
              bg-[#d91b0b]
              flex
              items-center
              justify-center
              text-white
              text-[15px]
            "
          >
            <span>PDF</span>
          </div>
        </div>

        {/* Material Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="
              text-[13px]
              sm:text-[14px]
              font-medium
              text-[#202020]
              truncate
            "
          >
            Advanced Algebra Notes
          </h3>

          <p
            className="
              text-[11px]
              sm:text-[12px]
              text-[#858585]
              mt-0.5
            "
          >
            PDF · 2.4 MB
          </p>
        </div>

        {/* Download */}
        <button
          className="
            w-[34px]
            h-[34px]
            shrink-0
            rounded-[9px]
            border
            border-[#efdfd5]
            bg-[#fffaf6]
            flex
            items-center
            justify-center
            text-[#9b918b]
            hover:text-[#ff6b3d]
            hover:border-[#ffc8b5]
            transition-all
          "
          aria-label="Download Advanced Algebra Notes"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </div>


      {/* ------------------------------------------------------- */}
      {/* MATERIAL 02 */}
      {/* ------------------------------------------------------- */}

      <div
        className="
          w-full
          flex
          items-center
          gap-3
          sm:gap-4
          rounded-[13px]
          border
          border-[#f2dfd5]
          bg-[#fff8f2]
          px-3
          sm:px-4
          py-3
          sm:py-3.5
        "
      >
        {/* PDF Icon */}
        <div
          className="
            w-[38px]
            h-[38px]
            sm:w-[40px]
            sm:h-[40px]
            shrink-0
            rounded-[9px]
            bg-[#ffe9dd]
            flex
            items-center
            justify-center
          "
        >
          <div
            className="
              w-[27px]
              h-[30px]
              rounded-[4px]
              bg-[#d91b0b]
              flex
              items-center
              justify-center
              text-white
              text-[10px]
              font-bold
            "
          >
            PDF
          </div>
        </div>

        {/* Material Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="
              text-[13px]
              sm:text-[14px]
              font-medium
              text-[#202020]
              truncate
            "
          >
            Practice Worksheet
          </h3>

          <p
            className="
              text-[11px]
              sm:text-[12px]
              text-[#858585]
              mt-0.5
            "
          >
            Questions · 20 Questions
          </p>
        </div>

        {/* Download */}
        <button
          className="
            w-[34px]
            h-[34px]
            shrink-0
            rounded-[9px]
            border
            border-[#efdfd5]
            bg-[#fffaf6]
            flex
            items-center
            justify-center
            text-[#9b918b]
            hover:text-[#ff6b3d]
            hover:border-[#ffc8b5]
            transition-all
          "
          aria-label="Download Practice Worksheet"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </div>


      {/* ------------------------------------------------------- */}
      {/* MATERIAL 03 */}
      {/* ------------------------------------------------------- */}

      <div
        className="
          w-full
          flex
          items-center
          gap-3
          sm:gap-4
          rounded-[13px]
          border
          border-[#f2dfd5]
          bg-[#fff8f2]
          px-3
          sm:px-4
          py-3
          sm:py-3.5
        "
      >
        {/* PDF Icon */}
        <div
          className="
            w-[38px]
            h-[38px]
            sm:w-[40px]
            sm:h-[40px]
            shrink-0
            rounded-[9px]
            bg-[#ffe9dd]
            flex
            items-center
            justify-center
          "
        >
          <div
            className="
              w-[27px]
              h-[30px]
              rounded-[4px]
              bg-[#d91b0b]
              flex
              items-center
              justify-center
              text-white
              text-[10px]
              font-bold
            "
          >
            PDF
          </div>
        </div>

        {/* Material Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="
              text-[13px]
              sm:text-[14px]
              font-medium
              text-[#202020]
              truncate
            "
          >
            SAT Mathematics Formula Sheet
          </h3>

          <p
            className="
              text-[11px]
              sm:text-[12px]
              text-[#858585]
              mt-0.5
            "
          >
            PDF · 1.1 MB
          </p>
        </div>

        {/* Download */}
        <button
          className="
            w-[34px]
            h-[34px]
            shrink-0
            rounded-[9px]
            border
            border-[#efdfd5]
            bg-[#fffaf6]
            flex
            items-center
            justify-center
            text-[#9b918b]
            hover:text-[#ff6b3d]
            hover:border-[#ffc8b5]
            transition-all
          "
          aria-label="Download SAT Mathematics Formula Sheet"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
      </div>

    </div>
  </div>


  {/* ========================================================= */}
  {/* ABOUT THIS SESSION */}
  {/* ========================================================= */}

  <div
    className="
      w-full
      rounded-[20px]
      border
      border-[#dedede]
      bg-white
      px-5
      py-6
      sm:px-6
      md:px-7
      md:py-7
    "
  >
    {/* Heading */}
    <h2
      className="
        text-[16px]
        sm:text-[17px]
        font-semibold
        text-[#4b4b4b]
        mb-3
      "
    >
      About This Session
    </h2>

    {/* Description */}
    <p
      className="
        max-w-[900px]
        text-[14px]
        sm:text-[15px]
        md:text-[16px]
        leading-[1.5]
        text-[#777777]
        mb-5
      "
    >
      "In this session, we will cover advanced algebra concepts including
      equations, expressions, and problem-solving strategies to help you
      improve accuracy and speed."
    </p>

    {/* Session Details */}
    <div className="space-y-2">
      
      {/* Session Type */}
      <div className="grid grid-cols-[125px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)] items-center">
        <span
          className="
            text-[13px]
            sm:text-[14px]
            text-[#ff6b3d]
            font-medium
          "
        >
          Session Type:
        </span>

        <span
          className="
            text-[13px]
            sm:text-[14px]
            text-[#242424]
            font-medium
          "
        >
          Live One-on-One Class
        </span>
      </div>

      {/* Duration */}
      <div className="grid grid-cols-[125px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)] items-center">
        <span
          className="
            text-[13px]
            sm:text-[14px]
            text-[#ff6b3d]
            font-medium
          "
        >
          Duration:
        </span>

        <span
          className="
            text-[13px]
            sm:text-[14px]
            text-[#242424]
            font-medium
          "
        >
          60 Minutes
        </span>
      </div>

    </div>
  </div>
  </div>

</div>

    {/* ==================================================
        MAIN CONTENT
    ================================================== */}
   

    {/* ==================================================
        BOTTOM SUCCESS BANNER
    ================================================== */}
    {timeRemaining?.type === "ended" && content.progressCount > 0 && (
      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">
              Great Job! 
            </p>
            <p className="text-sm text-gray-600">
              You have successfully completed this live session.
            </p>
          </div>
        </div>

        <button className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-50">
          View Course Content
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )}
  </div>
</div>
  );
};




import { MessageSquare, MoreVertical } from "lucide-react";

export const UpcomingSessionCard = ({
    session,
    countdown = {
        days: "04",
        hours: "56",
        minutes: "17",
    },
}) => {
    return (
        <div className="w-full px-2 sm:px-0 mb-4">
            <div
                className="
                    relative
                    w-full
                    overflow-hidden
                    rounded-[22px]
                    sm:rounded-[24px]
                    bg-gradient-to-br
                    from-[#FF754F]
                    via-[#FF633F]
                    to-[#FF7048]
                    shadow-[0_5px_15px_rgba(255,99,63,0.20)]
                    min-h-[250px]
                    sm:min-h-[220px]
                    md:min-h-[205px]
                    xl:min-h-[122px]
                "
            >

                {/* ================= TOP SOFT HIGHLIGHT ================= */}
                <div
                    className="
                        pointer-events-none
                        absolute
                        left-0
                        top-0
                        h-4
                        w-full
                        bg-white/10
                    "
                />

                {/* ================= BOTTOM WAVE ================= */}
                <div
                    className="
                        pointer-events-none
                        absolute
                        bottom-[-45px]
                        left-[20%]
                        h-[80px]
                        w-[70%]
                        rounded-[50%]
                        bg-[#FF8A68]/60
                        blur-[1px]
                    "
                />

                <div
                    className="
                        pointer-events-none
                        absolute
                        bottom-[-65px]
                        left-[45%]
                        h-[100px]
                        w-[65%]
                        rounded-[50%]
                        bg-[#FF9678]/40
                    "
                />

                {/* ================= CONTENT ================= */}
                <div
                    className="
                        relative
                        z-10
                        flex
                        h-full
                        min-h-[250px]
                        flex-col
                        p-4
                        sm:p-5
                        md:p-6
                        xl:min-h-[122px]
                        xl:flex-row
                        xl:items-center
                        xl:px-10
                        xl:py-4
                    "
                >

                    {/* ================= TOP / SESSION INFO ================= */}
                    <div
                        className="
                            flex
                            min-w-0
                            flex-1
                            flex-col
                        "
                    >

                        {/* Title + Actions */}
                        <div
                            className="
                                flex
                                items-start
                                justify-between
                                gap-3
                                xl:block
                            "
                        >
                            <div className="min-w-0">

                                <h2
                                    className="
                                        text-[20px]
                                        font-bold
                                        leading-tight
                                        text-white
                                        sm:text-[22px]
                                        md:text-[24px]
                                        xl:text-[19px]
                                    "
                                >
                                    {session?.time || "10:00 AM"}, {session?.date || "June 12"}
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        max-w-[430px]
                                        truncate
                                        text-xs
                                        font-medium
                                        text-white/95
                                        sm:text-[13px]
                                        md:text-sm
                                        xl:text-[12px]
                                    "
                                >
                                    {session?.description ||
                                        "Follow-up Pte Exam and prescription review"}
                                </p>

                            </div>

                            {/* MOBILE ACTIONS */}
                            <div
                                className="
                                    flex
                                    shrink-0
                                    items-center
                                    gap-2
                                    xl:absolute
                                    xl:right-7
                                    xl:top-1/2
                                    xl:-translate-y-1/2
                                "
                            >
                                {/* Chat */}
                                <button
                                    type="button"
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-white
                                        text-[#1F2937]
                                        shadow-sm
                                        transition
                                        hover:bg-gray-50
                                        hover:scale-105
                                        active:scale-95
                                        sm:h-11
                                        sm:w-11
                                    "
                                >
                                    <MessageSquare
                                        size={20}
                                        strokeWidth={1.8}
                                    />
                                </button>

                                {/* More */}
                                <button
                                    type="button"
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-white
                                        text-[#1F2937]
                                        shadow-sm
                                        transition
                                        hover:bg-gray-50
                                        hover:scale-105
                                        active:scale-95
                                        sm:h-11
                                        sm:w-11
                                    "
                                >
                                    <MoreVertical
                                        size={21}
                                        strokeWidth={2}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* ================= INSTRUCTOR ================= */}
                        <div
                            className="
                                mt-5
                                flex
                                items-center
                                gap-3
                                sm:mt-6
                                md:mt-5
                                xl:mt-3
                            "
                        >

                            {/* Avatar */}
                            <div
                                className="
                                    h-12
                                    w-12
                                    shrink-0
                                    overflow-hidden
                                    rounded-full
                                    border-2
                                    border-white/80
                                    bg-white/30
                                    sm:h-14
                                    sm:w-14
                                    xl:h-10
                                    xl:w-10
                                "
                            >
                                <img
                                    src={
                                        session?.instructorImage ||
                                        "/images/avatar.png"
                                    }
                                    alt={session?.instructorName || "Instructor"}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="min-w-0">
                                <h3
                                    className="
                                        truncate
                                        text-base
                                        font-bold
                                        leading-tight
                                        text-white
                                        sm:text-lg
                                        xl:text-[16px]
                                    "
                                >
                                    {session?.instructorName || "Sidney Yates"}
                                </h3>

                                <p
                                    className="
                                        mt-0.5
                                        text-xs
                                        font-medium
                                        text-white/90
                                        sm:text-sm
                                        xl:text-[12px]
                                    "
                                >
                                    {session?.instructorRole || "Pte expert"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ================= STATUS + COUNTDOWN ================= */}
                    <div
                        className="
                            mt-6
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-5
                            sm:flex-row
                            sm:gap-8
                            md:mt-5
                            xl:mt-0
                            xl:mr-32
                            xl:flex-row
                            xl:gap-8
                        "
                    >

                        {/* Status */}
                        <div
                            className="
                                rounded-xl
                                bg-[#202B2D]
                                px-4
                                py-2.5
                                text-center
                                text-sm
                                font-bold
                                text-white
                                shadow-md
                                sm:px-5
                                sm:py-3
                                sm:text-base
                                xl:px-3
                                xl:py-2
                                xl:text-[15px]
                            "
                        >
                            Upcoming Session
                        </div>

                        {/* ================= COUNTDOWN ================= */}
                        <div
                            className="
                                flex
                                items-start
                                justify-center
                                gap-3
                                sm:gap-4
                                xl:gap-2
                            "
                        >
                            <CountdownBlock
                                value={countdown.days}
                                label="DAYS"
                            />

                            <CountdownBlock
                                value={countdown.hours}
                                label="HOURS"
                            />

                            <CountdownBlock
                                value={countdown.minutes}
                                label="MINUTE"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};


/* ================= COUNTDOWN BLOCK ================= */

const CountdownBlock = ({ value, label }) => {
    const digits = String(value).padStart(2, "0").split("");

    return (
        <div className="flex flex-col items-center">

            <div className="flex gap-1">
                {digits.map((digit, index) => (
                    <div
                        key={`${digit}-${index}`}
                        className="
                            flex
                            h-8
                            w-6
                            items-center
                            justify-center
                            rounded-[6px]
                            bg-gradient-to-b
                            from-[#303030]
                            to-[#050505]
                            text-lg
                            font-bold
                            leading-none
                            text-white
                            shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]
                            sm:h-9
                            sm:w-7
                            sm:text-xl
                            xl:h-8
                            xl:w-6
                            xl:text-lg
                        "
                    >
                        {digit}
                    </div>
                ))}
            </div>

            <span
                className="
                    mt-1
                    text-[8px]
                    font-bold
                    tracking-wide
                    text-white
                    sm:text-[9px]
                "
            >
                {label}
            </span>

        </div>
    );
};



export default ContentViewPage;