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
  MoveRight,
  Volume2,
  ImageIcon,
  LinkIcon,
  FileText,
  ChevronLeft,
  Star,
  Eye,
  Info,
} from "lucide-react";
import api, { ImageBaseUrl } from "../../axiosInstance";

const ContentViewPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState<any>(null);
  const [allcontent, setAllContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<any>(null);
  const [canJoin, setCanJoin] = useState(false);
  const [selectUpcomingSession, setSelectUpcomingSession] = useState<any>(null);
  const [hoveredSessionIndex, setHoveredSessionIndex] = useState<number | null>(
    null,
  );

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [showSessionButton, setShowSessionButton] = useState(false);

  useEffect(() => {
    if (!content?.scheduledStart || !content?.scheduledEnd) {
      setShowSessionButton(false);
      return;
    }

    const checkSessionTime = () => {
      const now = Date.now();

      const startTime = new Date(content.scheduledStart).getTime();
      const endTime = new Date(content.scheduledEnd).getTime();

      // 10 minutes before scheduled start
      const buttonStartTime = startTime - 10 * 60 * 1000;

      setShowSessionButton(now >= buttonStartTime && now <= endTime);
    };

    // Check immediately
    checkSessionTime();

    // Check every second
    const timer = setInterval(checkSessionTime, 1000);

    return () => clearInterval(timer);
  }, [content?.scheduledStart, content?.scheduledEnd]);

  useEffect(() => {
    if (allcontent?.relatedSessions?.length) {
      setSelectUpcomingSession(allcontent.relatedSessions[0]);
    }
  }, [allcontent]);

  useEffect(() => {
    if (!selectUpcomingSession?.scheduledStart) {
      return;
    }

    const calculateTimeLeft = () => {
      const startTime = new Date(
        selectUpcomingSession.scheduledStart,
      ).getTime();

      const now = new Date().getTime();

      const difference = startTime - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
      });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [selectUpcomingSession?.scheduledStart]);

  const [timeLeft2, setTimeLeft2] = useState(0);

  useEffect(() => {
    if (!content?.scheduledStart) return;

    const targetTime = new Date(content.scheduledStart).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));

      setTimeLeft2(remaining);
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [content?.scheduledStart]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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

  const tabs = ["Overview", "Material", "Schedule", "Trainer"];
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(
          `/content/slug/${slug}?isModule=${true}`,
        );

        const data = response?.data?.data;

        if (!data) {
          throw new Error("Content not found");
        }

        setContent(data);
        setAllContent(response?.data);
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

 const materialIconImages = {
  pdf: "/images/pdf.webp",
  video: "/images/video.webp",
  audio: "/images/audio.webp",
  document: "/images/document.webp",
  image: "/images/image.webp",
  link: "/images/link.webp",
};

const MaterialIcon = ({ type }: { type: string }) => {
  const iconSrc =
    materialIconImages[type?.toLowerCase() as keyof typeof materialIconImages] ||
    materialIconImages.document;

  return (
    <img
      src={iconSrc}
      alt={type || "Material"}
      className="w-full h-full object-contain"
    />
  );
};
  const formatTime2 = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, "0")}h ${String(
        minutes,
      ).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
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
      <div className="min-h-screen bg-[#FFF7F2] p-4 md:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 md:gap-6">
          {/* ================= MAIN CONTENT ================= */}
          <div className="min-w-0 space-y-4 md:space-y-6">
            {/* HERO SECTION */}
            <div className="rounded-[28px] border border-[#FFD6C7] bg-gradient-to-r from-[#FFF0E7] to-[#FFE4D1] p-5 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.8fr_1fr] gap-4">
                {/* Session Info */}
                <div className="min-w-0">
                  <div className="h-10 w-52 rounded-full bg-[#FFD0BE] animate-pulse mb-5" />

                  <div className="h-4 w-64 rounded bg-[#F5CFC0] animate-pulse mb-4" />

                  <div className="space-y-2 mb-5">
                    <div className="h-7 w-full max-w-[440px] rounded-lg bg-[#F4C7B6] animate-pulse" />
                    <div className="h-7 w-3/4 max-w-[330px] rounded-lg bg-[#F4C7B6] animate-pulse" />
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-6 w-6 rounded bg-[#F7B89F] animate-pulse" />
                    <div className="h-5 w-48 rounded bg-[#F3C8B8] animate-pulse" />
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-6 w-6 rounded-full bg-[#F7B89F] animate-pulse" />
                    <div className="h-5 w-28 rounded bg-[#F3C8B8] animate-pulse" />
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <div className="h-12 w-40 rounded-xl bg-[#F8A486] animate-pulse" />
                    <div className="h-12 w-44 rounded-xl bg-[#FFD0BE] animate-pulse" />
                  </div>
                </div>

                {/* Instructor Card */}
                <div className="rounded-[24px] border border-[#FFD6C7] bg-[#FFF9F6] p-6 flex flex-col items-center justify-center min-h-[280px]">
                  <div className="h-20 w-20 rounded-full bg-[#F5C7B7] animate-pulse mb-5" />

                  <div className="h-4 w-28 rounded bg-[#F2CFC3] animate-pulse mb-3" />
                  <div className="h-6 w-24 rounded bg-[#EFC0B0] animate-pulse mb-2" />
                  <div className="h-4 w-28 rounded bg-[#F2CFC3] animate-pulse" />
                </div>

                {/* Countdown Card */}
                <div className="rounded-[24px] bg-white p-6 flex flex-col items-center justify-center min-h-[280px]">
                  <div className="h-6 w-48 rounded bg-[#EBCDC2] animate-pulse mb-8" />

                  <div className="flex items-center gap-2 mb-5">
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-[#FF8B68] animate-pulse" />
                    <div className="h-10 w-3 rounded bg-[#FFD2C5] animate-pulse" />
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-[#FF8B68] animate-pulse" />
                    <div className="h-10 w-3 rounded bg-[#FFD2C5] animate-pulse" />
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-[#FF8B68] animate-pulse" />
                  </div>

                  <div className="flex gap-10 mb-7">
                    <div className="h-3 w-10 rounded bg-[#EACFC5] animate-pulse" />
                    <div className="h-3 w-10 rounded bg-[#EACFC5] animate-pulse" />
                    <div className="h-3 w-12 rounded bg-[#EACFC5] animate-pulse" />
                  </div>

                  <div className="h-5 w-36 rounded bg-[#EACFC5] animate-pulse" />
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="h-[68px] rounded-[20px] border border-[#FFD6C7] bg-white flex items-center px-5 md:px-8 gap-8 md:gap-12 overflow-hidden">
              <div className="h-5 w-24 rounded bg-[#FFD1C2] animate-pulse" />
              <div className="h-5 w-20 rounded bg-[#F1DDD6] animate-pulse" />
              <div className="h-5 w-24 rounded bg-[#F1DDD6] animate-pulse" />
              <div className="h-5 w-20 rounded bg-[#F1DDD6] animate-pulse" />
            </div>

            {/* OVERVIEW CONTENT */}
            <div className="rounded-[20px] border border-[#FFD6C7] bg-white p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
                {/* Image Skeleton */}
                <div className="space-y-5">
                  <div className="h-8 w-32 rounded-lg bg-[#F7C5B4] animate-pulse" />

                  <div className="w-full h-[260px] rounded-xl bg-[#F5DED6] animate-pulse" />
                </div>

                {/* Text Skeleton */}
                <div className="space-y-5 pt-1">
                  <div className="space-y-3">
                    <div className="h-8 w-full max-w-[500px] rounded-lg bg-[#EFCBC0] animate-pulse" />
                    <div className="h-8 w-4/5 max-w-[400px] rounded-lg bg-[#EFCBC0] animate-pulse" />
                  </div>

                  {/* Instructor */}
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-[#F3CEC2] animate-pulse" />

                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-[#EACFC5] animate-pulse" />
                      <div className="h-4 w-52 rounded bg-[#F0DDD7] animate-pulse" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <div className="h-4 w-full rounded bg-[#F0DDD7] animate-pulse" />
                    <div className="h-4 w-11/12 rounded bg-[#F0DDD7] animate-pulse" />
                    <div className="h-4 w-4/5 rounded bg-[#F0DDD7] animate-pulse" />
                    <div className="h-4 w-2/3 rounded bg-[#F0DDD7] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDEBAR ================= */}
          <aside className="space-y-4">
            {/* Upcoming Sessions */}
            <div className="rounded-[26px] border border-[#FF8A5B] bg-white p-5">
              <div className="h-7 w-56 rounded-lg bg-[#EFCBC0] animate-pulse mb-5" />

              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`rounded-[20px] border p-4 ${
                      item === 1
                        ? "border-[#FF9569] bg-[#FFF0E7]"
                        : "border-[#EEEEEE] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#F1DDD7] animate-pulse shrink-0" />

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="h-4 w-24 rounded bg-[#EBCDC2] animate-pulse" />
                          <div className="h-3 w-16 rounded bg-[#EEDDD7] animate-pulse" />
                        </div>

                        <div className="h-4 w-full rounded bg-[#EBDDD8] animate-pulse" />
                        <div className="h-4 w-3/4 rounded bg-[#EBDDD8] animate-pulse" />

                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-[#EBC5B8] animate-pulse" />
                          <div className="h-3 w-28 rounded bg-[#EBDDD8] animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course */}
            <div className="rounded-[20px] border border-[#FFD6C7] bg-white p-4">
              <div className="h-6 w-20 rounded bg-[#EBCDC2] animate-pulse mb-4" />

              <div className="h-40 w-full rounded-xl bg-[#F3DDD6] animate-pulse mb-4" />

              <div className="h-5 w-4/5 rounded bg-[#EBCDC2] animate-pulse mb-3" />
              <div className="h-4 w-full rounded bg-[#EFDFD9] animate-pulse mb-2" />
              <div className="h-4 w-3/4 rounded bg-[#EFDFD9] animate-pulse" />
            </div>
          </aside>
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

        <div className="p-4 md:p-6 lg:p-0 mb-2 xl:mb-6">
          <div className="">
            {/* Main Content Grid */}
            <div className="h-full">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)] xl:grid-cols-[1.5fr_0.5fr] gap-4 lg:gap-3 xl:gap-2 h-full">
                {/* Main Session Card */}

                <div className="flex flex-col gap-6 h-full">
                  {selectUpcomingSession && (
                    <div className="bg-gradient-to-b from-white via-gray-50 to-gray-300 p-[1.5px] rounded-[24px]">
                      <div
                        className="
      grid
      grid-cols-1
      gap-4
      md:gap-2
      lg:gap-2
      xl:grid-cols-[1.35fr_0.85fr_1fr]
      xl:gap-3
      p-4
      sm:p-5
      md:p-4
      xl:p-4
      rounded-[24px]
      border
      border-orange-200/60
      bg-gradient-to-r
      from-orange-100/70
      via-[#fff1e8]
      to-orange-100
      h-full
      xl:h-full
    
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
            bg-[#f36d45]
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
                              <span className="text-orange-500">•</span> SESSION
                              08
                            </p>

                            {/* Title */}
                            <h1
                              className="
            text-xl
            sm:text-2xl
            md:text-3xl
            lg:text-3xl
            xl:text-2xl
            font-bold
            text-gray-900
            leading-[1.15]
            mb-1
            line-clamp-2
          "
                            >
                              {selectUpcomingSession?.title}
                            </h1>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-gray-700 mb-3">
                              <Calendar className="w-5 h-5 shrink-0 text-orange-500" />
                              <span className="font-medium text-sm md:text-base">
                                {new Date(
                                  selectUpcomingSession?.scheduledStart,
                                ).toLocaleDateString("en-GB", {
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
                                {selectUpcomingSession?.scheduledStart
                                  ? new Date(
                                      selectUpcomingSession?.scheduledStart,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                          </div>

                          {/* Buttons */}
                          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            <Link
                              to={`/sessions/${selectUpcomingSession?.slug}`}
                            >
                              <button
                                className="
            inline-flex
            items-center
            justify-center
            gap-2
            bg-[#f36d45]
            hover:bg-orange-600
            text-white
            w-full sm:w-auto
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
                              </button>
                            </Link>

                            <Link
                              to={`/calendar`}
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
            w-full sm:w-auto
            px-4
            py-2.5
            rounded-xl
            text-sm
            font-semibold
            transition-all
            duration-200
          "
                            >
                              <Eye className="w-4 h-4" />
                              View Calendar
                            </Link>
                          </div>
                        </div>

                        {/* ================= TRAINER SECTION ================= */}
                        <div className=" bg-white/60 rounded-[20px] p-4 sm:p-5 md:p-6 border border-orange-200 flex justify-center items-center h-full">
                          <div className="text-center flex flex-col justify-center items-center">
                            {/* Profile Image */}
                            <div className="relative mb-3">
                              <div className=" w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] md:w-[60px] md:h-[60px] rounded-full border-2 border-orange-400 overflow-hidden">
                                <img
                                  src="https://cdn-icons-png.flaticon.com/512/709/709699.png"
                                  alt="Trainer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-gray-500 text-sm mb-1">
                                Your Instructor
                              </p>

                              <h3 className="text-base sm:text-lg md:text-lg xl:text-lg font-bold text-gray-900 text-left">
                                {selectUpcomingSession?.instructor?.name}
                              </h3>

                              <p className="text-gray-600 font-medium text-sm xl:text-base -mt-1">
                                Pte expert
                              </p>

                              <p className="text-gray-500 text-xs line-clamp-2 ">
                                {
                                  selectUpcomingSession?.instructor?.profile
                                    ?.bio
                                }
                              </p>
                            </div>{" "}
                          </div>
                        </div>

                        {/* ================= COUNTDOWN SECTION ================= */}
                        <div
                          className="
        bg-white
        rounded-[20px]
        p-4
        sm:p-5
        md:p-4
        border
        border-orange-100
        flex
        items-center justify-center
      "
                        >
                          <div className="w-full  text-center">
                            <h3
                              className="
            text-sm
            sm:text-base
            md:text-lg
            font-bold
            text-gray-900
            mb-6
          "
                            >
                              CLASS STARTS IN
                            </h3>

                            {/* Timer */}
                            <div className="flex items-start justify-center gap-1.5 sm:gap-2 w-full mb-5">
                              {/* Days */}
                              <div className="flex flex-col items-center">
                                <div className="flex gap-1">
                                  {String(timeLeft.days)
                                    .padStart(2, "0")
                                    .split("")
                                    .map((digit, index) => (
                                      <div
                                        key={index}
                                        className="
              flex items-center justify-center
              bg-[#ff7148]
              text-white
              rounded-[5px]
              w-[28px]
              h-[38px]
              sm:w-[32px]
              sm:h-[42px]
              md:w-[30px]
              md:h-[40px]
            "
                                      >
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold leading-none">
                                          {digit}
                                        </span>
                                      </div>
                                    ))}
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
                                <div className="flex gap-1">
                                  {String(timeLeft.hours)
                                    .padStart(2, "0")
                                    .split("")
                                    .map((digit, index) => (
                                      <div
                                        key={index}
                                        className="
              flex items-center justify-center
              bg-[#ff7148]
              text-white
              rounded-[5px]
              w-[28px]
              h-[38px]
              sm:w-[32px]
              sm:h-[42px]
              md:w-[30px]
              md:h-[40px]
            "
                                      >
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold leading-none">
                                          {digit}
                                        </span>
                                      </div>
                                    ))}
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
                                <div className="flex gap-1">
                                  {String(timeLeft.minutes)
                                    .padStart(2, "0")
                                    .split("")
                                    .map((digit, index) => (
                                      <div
                                        key={index}
                                        className="
              flex items-center justify-center
              bg-[#ff7148]
              text-white
              rounded-[5px]
              w-[28px]
              h-[38px]
              sm:w-[32px]
              sm:h-[42px]
              md:w-[30px]
              md:h-[40px]
            "
                                      >
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold leading-none">
                                          {digit}
                                        </span>
                                      </div>
                                    ))}
                                </div>

                                <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-1">
                                  MINUTE
                                </span>
                              </div>
                            </div>

                            {/* Date */}
                            <p className="text-gray-600 text-sm font-medium">
                              {selectUpcomingSession?.scheduledStart
                                ? new Date(
                                    selectUpcomingSession.scheduledStart,
                                  ).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Bottom Navigation Tabs */}
                  <div className="mt-4 sm:mt-0 bg-white rounded-2xl border border-orange-100 overflow-hidden">
                    <div className="flex overflow-x-auto scrollbar-hide ">
                      {tabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex min-w-[100px] sm:min-w-[110px] px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
                            activeTab === tab
                              ? "text-orange-600 border-orange-500 bg-orange-50/50"
                              : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Section - Upcoming Sessions */}
                {selectUpcomingSession && (
                  <div className="">
                    <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-lg border border-orange-500 h-full lg:h-100 xl:h-full ">
                      <h2 className="text-lg font-bold text-gray-900 mb-2">
                        Upcoming Sessions
                      </h2>

                      <div className="space-y-3">
                        {allcontent?.relatedSessions
                          ?.slice(0, 3)
                          ?.map((session, i) => (
                            <div
                              onClick={() => setSelectUpcomingSession(session)}
                              key={session.id}
                              className={`rounded-2xl p-2 cursor-pointer transition-all duration-200 ${
                                selectUpcomingSession?.id === session.id
                                  ? "bg-gradient-to-br from-orange-100 to-peach-100 border-2 border-orange-300 shadow-md"
                                  : "bg-gray-50 border-2 border-gray-100 hover:border-orange-200 hover:shadow-md"
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Session Number */}
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    session.active
                                      ? "bg-orange-500 text-white"
                                      : "bg-white text-gray-600 border-2 border-gray-200"
                                  }`}
                                >
                                  {i + 1}
                                </div>

                                {/* Session Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
                                    <h3
                                      className={`font-bold text-sm ${
                                        session.active
                                          ? "text-gray-900"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      session {i + 1}
                                    </h3>
                                    {
                                      <span
                                        className={`text-[10px] font-semibold  whitespace-nowrap ${session.active ? "text-orange-600" : "text-gray-600"}`}
                                      >
                                        {new Date(
                                          session.scheduledStart,
                                        ).toLocaleDateString("en-GB", {
                                          weekday: "short",
                                          day: "2-digit",
                                          month: "short",
                                        })}
                                      </span>
                                    }
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {session.description}
                                  </p>
                                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {new Date(
                                        session.scheduledStart,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                    </span>{" "}
                                    -{" "}
                                    <span>
                                      {new Date(
                                        session.scheduledEnd,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 lg:px-0 ">
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.5fr] items-start gap-4">
            <div>
              {activeTab === "Overview" ? (
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    {sessionStatus2 === "expired" ? (
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
                          This session has already ended and is no longer
                          available to join.
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
                              <span className="text-[#ff613f]">Session</span>
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
                              <span>{content?.title.split(" ")[0]}</span>{" "}
                              <span className="text-[#ff613f]">
                                {content?.title.split(" ").slice(1).join(" ")}
                              </span>
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

                            <div className="flex flex-wrap items-center gap-3">
                              {/* Countdown Timer */}
                              <div className="relative inline-flex items-center gap-2">
                                <div
                                  className="
      inline-flex
      items-center
      justify-center
      min-h-[34px]
      px-4
      sm:px-5
      rounded-[9px]
      bg-[#fff1eb]
      border
      border-[#ff7148]
      text-[#ff7148]
      text-[14px]
      sm:text-[15px]
      font-medium
    "
                                >
                                  Starts in {formatTime2(timeLeft2)}
                                </div>

                                {/* i Icon */}
                                <div className="relative group">
                                  <Info
                                    size={17}
                                    strokeWidth={2.5}
                                    className="text-[#ff7148] cursor-help"
                                  />

                                  {/* Tooltip */}
                                  <div
                                    className="
        absolute
        left-1/2
        bottom-full
        z-50
        mb-2
        hidden
        w-[240px]
        -translate-x-1/2
        rounded-lg
        bg-[#2D2D2D]
        px-3
        py-2
        text-center
        text-[11px]
        font-medium
        text-white
        shadow-lg
        group-hover:block
      "
                                  >
                                    You can join this session 10 minutes before
                                    the scheduled start time.
                                  </div>
                                </div>
                              </div>

                              {/* View Session */}
                              {showSessionButton && (
                                <Link to={content?.meetingId || "#"}>
                                  <button
                                    className="
          w-full
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
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    {allcontent?.relatedMaterials?.length > 0 ? (
                      <div className="bg-gradient-to-b from-white via-gray-50 to-gray-300 p-[1.5px] rounded-[20px]">
                        <div
                          className="
            w-full
            rounded-[20px]
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
                              onClick={() => setActiveTab("Material")}
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

                          {/* Material List */}
                          <div className="space-y-3">
                            {allcontent?.relatedMaterials
                              ?.slice(0, 4)
                              ?.map((material, index) => (
                                <div
                                  key={material?.id || index}
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
                      bg-[#d91b0b]
                      flex
                      items-center
                      justify-center
                      overflow-hidden
                    "
                                  >
                                    <img
                                      src="/images/pdf.webp"
                                      alt="PDF"
                                      className="w-full h-full object-contain"
                                    />
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
                                      {material.title}
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

                                  {/* Arrow */}
                                  <Link
                                    to={`/resources/${material.slug}`}
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
                                  >
                                    <MoveRight className="w-4 h-4" />
                                  </Link>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-b from-white via-gray-50 to-gray-300 p-[1.5px] rounded-[20px]">
                        <div
                          className="
            w-full
            min-h-[220px]
            rounded-[20px]
            bg-white
            px-5
            py-8
            sm:px-6
            md:px-7
            flex
            flex-col
            items-center
            justify-center
            text-center
          "
                        >
                          {/* Icon */}
                          <div
                            className="
              w-[58px]
              h-[58px]
              sm:w-[64px]
              sm:h-[64px]
              rounded-full
              bg-[#fff1eb]
              border
              border-[#ffd8ca]
              flex
              items-center
              justify-center
              mb-4
            "
                          >
                            <FileText
                              className="w-7 h-7 sm:w-8 sm:h-8 text-[#ff7148]"
                              strokeWidth={1.8}
                            />
                          </div>

                          {/* Title */}
                          <h2
                            className="
              text-[17px]
              sm:text-[18px]
              font-semibold
              text-[#202020]
              mb-1.5
            "
                          >
                            No Study Material
                          </h2>

                          {/* Description */}
                          <p
                            className="
              max-w-[420px]
              text-[13px]
              sm:text-[14px]
              leading-relaxed
              text-[#888888]
            "
                          >
                            Study materials for this session will appear here
                            when they are available.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-b from-white via-gray-50 to-gray-300 p-[1.5px] rounded-[20px]">
                      {/* Your existing About This Session code */}
                    </div>
                  </div>
                </div>
              ) : activeTab === "Material" ? (
                <>
                  {allcontent?.relatedMaterials?.length > 0 ? (
                    <div className="p-4 bg-white rounded-lg border border-orange-500/40">
                      {allcontent?.relatedMaterials?.map(
                        (pdf: any, index: number) => (
                          <div
                            key={pdf?.id || index}
                            className="
            w-full
            rounded-[20px]
            bg-[#fff9e6]
            p-3
            sm:p-4
            md:p-4
            my-4
          "
                          >
                            <div
                              className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:gap-5
            "
                            >
                              {/* ================= PDF ICON ================= */}
                              <div
                                className="
                flex
                h-[72px]
                w-[72px]
                shrink-0
                items-center
                justify-center
                rounded-[15px]
                bg-white
                p-2
                shadow-sm
                sm:h-[80px]
                sm:w-[80px]
                md:h-[70px]
                md:w-[70px]
              "
                              >
                                <div
                                  className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  rounded-[13px]
                "
                                >
                                  <div
                                    className={`
                    w-[42px]
                    h-[42px]
                    sm:w-[44px]
                    sm:h-[44px]
                    shrink-0
                    rounded-[10px]
                    flex
                    items-center
                    justify-center
                    overflow-hidden

                    ${
                      pdf?.materialType === "pdf"
                        ? "bg-transparent"
                        : pdf?.materialType === "document"
                          ? "bg-[#EA580C]"
                          : pdf?.materialType === "link"
                            ? "bg-[#2563EB]"
                            : pdf?.materialType === "image"
                              ? "bg-[#16A34A]"
                              : pdf?.materialType === "audio"
                                ? "bg-[#9333EA]"
                                : "bg-[#6B7280]"
                    }
                  `}
                                  >
                                    <MaterialIcon type={pdf?.materialType} />
                                  </div>
                                </div>
                              </div>

                              {/* ================= CONTENT ================= */}
                              <div className="w-full min-w-0 flex-1">
                                <h3
                                  className="
                  text-base
                  font-medium
                  leading-tight
                  text-gray-900
                  sm:text-lg
                  md:text-base
                  line-clamp-2
                "
                                >
                                  {pdf?.title ||
                                    "IELTS Academic Writing Task 2 Practice Set"}
                                </h3>

                                <p
                                  className="
                  mt-1
                  w-full
                  lg:w-[280px]
                  text-sm
                  leading-5
                  text-gray-500
                  sm:text-sm
                  line-clamp-2
                "
                                >
                                  {pdf?.description ||
                                    "50+ practice questions with model answers for band 7+"}
                                </p>
                              </div>

                              {/* ================= BUTTONS ================= */}
                              <div
                                className="
                flex
                w-full
                shrink-0
                flex-col
                gap-2
                sm:w-auto
                sm:flex-row
                sm:items-center
                sm:gap-3
                sm:mr-0
              "
                              >
                                {/* View */}
                                <Link
                                  to={`/resources/${pdf?.slug || "#"}`}
                                  className="
                  inline-flex
                  h-[38px]
                  w-full
                  items-center
                  justify-center
                  rounded-[8px]
                  border
                  border-[#FF7148]
                  bg-white
                  px-5
                  text-sm
                  font-medium
                  text-black
                  transition-all
                  duration-200
                  hover:bg-[#f36d45]
                  hover:text-white
                  active:scale-[0.98]
                  sm:w-[120px]
                "
                                >
                                  View
                                </Link>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-b from-white via-gray-50 to-gray-300 p-[1.5px] rounded-[20px]">
                      <div
                        className="
            w-full
            min-h-[220px]
            rounded-[20px]
            bg-white
            px-5
            py-8
            sm:px-6
            md:px-7
            flex
            flex-col
            items-center
            justify-center
            text-center
          "
                      >
                        {/* Icon */}
                        <div
                          className="
              w-[58px]
              h-[58px]
              sm:w-[64px]
              sm:h-[64px]
              rounded-full
              bg-[#fff1eb]
              border
              border-[#ffd8ca]
              flex
              items-center
              justify-center
              mb-4
            "
                        >
                          <FileText
                            className="w-7 h-7 sm:w-8 sm:h-8 text-[#ff7148]"
                            strokeWidth={1.8}
                          />
                        </div>

                        {/* Title */}
                        <h2
                          className="
              text-[17px]
              sm:text-[18px]
              font-semibold
              text-[#202020]
              mb-1.5
            "
                        >
                          No Study Material
                        </h2>

                        {/* Description */}
                        <p
                          className="
              max-w-[420px]
              text-[13px]
              sm:text-[14px]
              leading-relaxed
              text-[#888888]
            "
                        >
                          Study materials for this session will appear here when
                          they are available.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : activeTab === "Trainer" ? (
                <>
                  <section className="w-full px-4 py-8 md:px-8">
                    <div className="mx-auto max-w-6xl">
                      <div className="relative min-h-[260px] overflow-hidden rounded-[24px] border border-[#f4d6c9] bg-[#fffdfb] shadow-sm">
                        {/* Orange Left Panel */}
                        <div className="absolute left-0 top-0 h-full w-[102px] bg-[#ff711f] md:w-[112px]" />

                        {/* Trainer Image */}
                        <div className="absolute left-[20px] top-1/2 z-10 h-[170px] w-[170px] -translate-y-1/2 md:left-[38px] md:h-[150px] md:w-[150px]">
                          <div className="absolute -inset-2 rounded-full border-[7px] border-[#fce6d7] bg-white" />

                          <div className="absolute inset-0 overflow-hidden rounded-full">
                            <img
                              src={`https://res.cloudinary.com/dd5s7qpsc/image/upload/${instructor?.profilePic}`}
                              alt={instructor?.name || "Trainer"}
                              className="absolute left-1/2 top-[-40px] h-[220px] w-[170px] -translate-x-1/2 object-cover object-top"
                            />
                          </div>

                          <img
                            src={`https://res.cloudinary.com/dd5s7qpsc/image/upload/${instructor?.profilePic}`}
                            alt=""
                            className="absolute left-1/2 top-[-40px] z-10 h-[220px] w-[170px] -translate-x-1/2 object-cover object-top"
                            style={{
                              clipPath: "inset(0 0 166px 0)",
                            }}
                          />
                        </div>

                        {/* Counter */}
                        <div className="absolute right-6 top-4 z-20 text-[12px] font-medium text-[#d99a7a]">
                          {/*of*/}
                        </div>

                        {/* Content */}
                        <div className="relative z-10 ml-[130px] min-h-[260px] px-5 py-7 pr-16 md:ml-[200px] md:px-8 md:py-6 md:pr-20">
                          {/* Name */}
                          <h2 className="text-[22px] font-bold leading-tight text-[#303030] md:text-[25px]">
                            {instructor?.name}
                          </h2>

                          {/* Designation */}
                          <div className="mt-1">
                            <span className="inline-block rounded-sm bg-[#fff0e8] px-2 py-[3px] text-[11px] font-semibold text-[#f47735]">
                              {instructor?.role || "Sinner trainer"}
                            </span>
                          </div>

                          {/* Info Row */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-1 text-[12px] text-[#555]">
                            <div className="flex items-center gap-1.5">
                              <Star
                                size={12}
                                className="fill-[#f6b900] text-[#f6b900]"
                              />
                              <span>{instructor?.experience || "4 years"}</span>
                            </div>
                            {/* <div className="flex items-center gap-1.5">
                <span className="text-[#e58a52]">▤</span>
                <span>{instructor?.certification || "--"}</span>
              </div> */}
                          </div>

                          {/* Specialization */}
                          <div className="mt-2">
                            <p className="text-[12px] font-medium text-[#f47735]">
                              Specialization
                            </p>
                            <p className="mt-0.5 text-[12px] text-[#555]">
                              {instructor?.skills?.join(" ,")}
                            </p>
                          </div>

                          {/* About */}
                          <div className="mt-2 max-w-[720px]">
                            <h3 className="text-[16px] font-semibold text-[#f47735]">
                              About the Trainer
                            </h3>
                            <p className="mt-0.5 text-[12px] leading-[1.65] text-[#3f3f3f] md:text-[13px]">
                              {instructor?.profile?.bio}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  {/* <TrainerSection /> */}
                </>
              ) : (
                <div
                  className="
      w-full
      rounded-[14px]
      border
      border-[#ffcfbf]
      bg-white
      px-4
      py-4
      sm:px-5
      sm:py-5
    "
                >
                  {/* ================= MONTH HEADER ================= */}

                  {/* ================= TIMELINE ================= */}
                  <div className="relative">
                    {/* Vertical line */}
                    <div
                      className="
          absolute
          left-[21px]
          sm:left-0
          top-0
          bottom-0
          w-[1px]
          bg-[#d8d8d8]
        "
                    />

                    <div className="space-y-3 sm:space-y-4">
                      {allcontent?.relatedSessions?.map(
                        (session: any, index: number) => {
                          const startDate = session?.scheduledStart
                            ? new Date(session.scheduledStart)
                            : null;

                          const endDate = session?.scheduledEnd
                            ? new Date(session.scheduledEnd)
                            : null;

                          const date = startDate
                            ? startDate
                                .toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  weekday: "short",
                                })
                                .toUpperCase()
                            : "";

                          const time =
                            startDate && endDate
                              ? `${startDate.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} to ${endDate.toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "";

                          return (
                            <div
                              key={session?.id || index}
                              className="
    relative
    grid
    grid-cols-[125px_minmax(0,1fr)]
    sm:grid-cols-[0.4fr_1.6fr]
    gap-3
    sm:gap-4
    items-center
  "
                            >
                              {/* ================= TIMELINE DOT ================= */}
                              <div
                                className="
      absolute
      left-[16px]
      sm:left-0
      top-1/2
      -translate-y-1/2
      z-10
      w-[10px]
      h-[10px]
      rounded-full
      border-2
      border-white
      bg-[#ffe3d7]
    "
                              />

                              {/* 
     2. UPDATED ACTIVE DOT LOGIC 
     Shows if it's the first item (index === 0) OR if it's the currently hovered item 
  */}
                              {(index === 0 ||
                                hoveredSessionIndex === index) && (
                                <div
                                  className="
        absolute
        left-[16px]
        sm:left-0
        top-1/2
        -translate-y-1/2
        z-20
        w-[10px]
        h-[10px]
        rounded-full
        bg-[#ff7148]
        border-2
        border-white
        transition-all duration-200
      "
                                />
                              )}

                              {/* ================= DATE CARD ================= */}
                              <div
                                className="
      relative
      ml-[29px]
      sm:ml-[22px]
      rounded-[10px]
      bg-white
      border
      border-[#f0f0f0]
      shadow-[0_2px_8px_rgba(0,0,0,0.06)]
      overflow-hidden
    "
                              >
                                {/* Date */}
                                <div
                                  className="
        mx-1
        mt-1
        rounded-[8px]
        bg-[#fff4ef]
        px-2
        py-2
        text-center
      "
                                >
                                  <p
                                    className="
          text-[11px]
          sm:text-[12px]
          font-semibold
          text-[#ff7148]
          uppercase
        "
                                  >
                                    {date}
                                  </p>
                                </div>

                                {/* Time */}
                                <p
                                  className="
        px-2
        py-2
        text-center
        text-[10px]
        sm:text-[11px]
        text-gray-800
        whitespace-nowrap
      "
                                >
                                  {time}
                                </p>
                              </div>

                              {/* ================= SESSION CARD ================= */}
                              <div
                                // 3. ADDED onMouseEnter and onMouseLeave handlers
                                onMouseEnter={() =>
                                  setHoveredSessionIndex(index)
                                }
                                onMouseLeave={() =>
                                  setHoveredSessionIndex(null)
                                }
                                className={`
      relative
      min-w-0
      rounded-[13px]
      px-3
      py-3
      sm:px-4
      sm:py-3
      shadow-[0_2px_8px_rgba(0,0,0,0.06)]
      transition-all
      duration-200
      cursor-pointer

      ${
        index === 0 || hoveredSessionIndex === index
          ? "bg-gradient-to-r from-[#ffeee2] to-[#fff4ef]"
          : "border-[#eeeeee] hover:bg-gradient-to-r from-[#ffeee2] to-[#fff4ef] hover:border-[#ffd3c4] hover:shadow-[0_3px_10px_rgba(255,113,72,0.10)]"
      }
    `}
                              >
                                <div
                                  className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
                                >
                                  {/* ================= SESSION INFO ================= */}
                                  <div className="min-w-0 flex-1">
                                    {/* Session number */}
                                    <p
                                      className="
            text-[9px]
            sm:text-[10px]
            uppercase
            font-medium
            text-[#888888]
            leading-none
            mb-0.5
          "
                                    >
                                      SESSION {String(index).padStart(1, "1")}
                                    </p>

                                    {/* Title */}
                                    <h3
                                      className="
            text-[13px]
            sm:text-base
            font-semibold
            text-[#252525]
            leading-tight
            line-clamp-2
            sm:w-90
          "
                                    >
                                      {session?.title}
                                    </h3>

                                    {/* Category */}
                                    <p
                                      className="
            text-[10px]
            sm:text-sm
            font-medium
            text-[#ff7148]
            leading-tight
            mt-0.5
          "
                                    >
                                      IELTS English
                                    </p>

                                    {/* Instructor */}
                                    <div
                                      className="
            flex
            items-center
            gap-1
            mt-1
          "
                                    >
                                      <User
                                        className="w-[14px] h-[14px] text-[#ff7148]"
                                        strokeWidth={2.5}
                                        fill="#f36d45"
                                      />

                                      <span
                                        className="
              text-[10px]
              sm:text-sm
              text-[#4f4f4f]
            "
                                      >
                                        {session?.instructor?.name || "Rashmi"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* ================= RIGHT SIDE ================= */}
                                  <div
                                    className="
          flex
          items-center
          justify-between
          sm:flex-row
          sm:items-end
          sm:justify-center
          gap-2
          shrink-0
        "
                                  >
                                    {/* Status */}
                                    <span
                                      className="
            inline-flex
            items-center
            justify-center
            min-w-[96px]
            sm:min-w-[116px]
            h-[28px]
            sm:h-[30px]
            rounded-[7px]
            bg-[#ffe3d6]
            px-3
            py-1
            text-[9px]
            sm:text-xs
            font-medium
            text-[#ff7148]
          "
                                    >
                                      Upcoming
                                    </span>

                                    {/* Join button */}
                                    <Link
                                      to={`/sessions/${session?.slug}`}
                                      onClick={() => {
                                        setActiveTab("Overview");
                                      }}
                                      className="
            inline-flex
            items-center
            justify-center
            min-w-[96px]
            sm:min-w-[116px]
            h-[28px]
            sm:h-[30px]
            rounded-[7px]
            bg-[#ff7148]
            hover:bg-[#ff6338]
            text-white
            text-[10px]
            sm:text-sm
            font-medium
            transition-colors
          "
                                    >
                                      Join Class
                                      <span className="ml-1">›</span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="
            w-full
            
        
            bg-white
            border
            border-[#ffd3c4]
            rounded-[12px]
            p-4
            sm:px-3
            sm:py-3
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
                Course
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
                    src={`${ImageBaseUrl}/${course?.thumbnail.url}`}
                    alt="Previous recording"
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
                  {course?.title}
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
                  <span className=" items-center gap-1 line-clamp-2">
                    {course?.description}
                  </span>
                </div>
              </div>

              {/* ===================================================== */}
              {/* WATCH BUTTON */}
              {/* ===================================================== */}

              <Link
                to={`/course/${course?.slug || "#"}`}
                className="
              w-full
              mt-3
              min-h-[42px]
              rounded-[10px]
              bg-[#f36d45]
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
                Explore
              </Link>
            </div>
          </div>
        </div>

        {timeRemaining?.type === "ended" && content.progressCount > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Great Job!</p>
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
                  <MessageSquare size={20} strokeWidth={1.8} />
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
                  <MoreVertical size={21} strokeWidth={2} />
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
                  src={session?.instructorImage || "/images/avatar.png"}
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
              <CountdownBlock value={countdown.days} label="DAYS" />

              <CountdownBlock value={countdown.hours} label="HOURS" />

              <CountdownBlock value={countdown.minutes} label="MINUTE" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
