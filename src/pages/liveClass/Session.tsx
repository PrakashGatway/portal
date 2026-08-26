import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
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
    <div className="overflow-hidden rounded-2xl ">
      <UpcomingSessionCard
    session={session}
  
/>
      <div className="w-full px-3 sm:px-4 lg:px-0">

    {/* ================= PAGE TITLE ================= */}
    <div className="mb-3 sm:mb-4">
        <h1
            className="
                text-xl
                sm:text-2xl
                font-semibold
                leading-tight
                text-[#111827]
            "
        >
            <span className="text-[#FF5A3C]">
                Live Session
            </span>{" "}
            Detail
        </h1>
    </div>

    {/* ================= MAIN CARD ================= */}
    <div
        className="
            relative
            w-full
            overflow-hidden
            rounded-[22px]
            sm:rounded-[26px]
            border
            border-[#E5E5E5]
            bg-gradient-to-r
            from-[#FFF8F4]
            via-white
            to-[#FAFAFA]
            shadow-sm
        "
    >

        <div
            className="
                flex
                flex-col
                lg:flex-row
                justify-center
                items-center
                gap-0
                p-2
                sm:p-3
                lg:p-2
                bg-gradient-to-r from-gray-200 via-white to-white
            "
        >

            {/* ================================================= */}
            {/* LEFT : SESSION IMAGE */}
            {/* ================================================= */}
          

            {/* ================================================= */}
{/* LEFT : SESSION IMAGE */}
{/* ================================================= */}

<div
    className="
        relative
        w-full
        lg:w-[46%]
        xl:w-[44%]
        h-[220px]
        sm:h-[260px]
        md:h-[280px]
        lg:h-[220px]
        xl:h-[230px]
        shrink-0
        overflow-hidden
        rounded-[18px]
    "
>
    <img
        src={`${ImageBaseUrl}/${content.thumbnailPic}`}
        alt={content?.title || "Live Session"}
        className="
            absolute
            inset-0
            w-full
            h-full
            object-cover
            object-center
            rounded-[18px]
        "
    />
</div>

            {/* ================================================= */}
            {/* RIGHT : SESSION INFORMATION */}
            {/* ================================================= */}

            <div
                className="
                    flex
                    min-w-0
                    flex-1
                    flex-col
                    justify-center
                    px-3
                    py-4
                    sm:px-5
                    sm:py-5
                    lg:px-8
                    lg:py-4
                    xl:px-10
                "
            >

                {/* TITLE */}
                <div>
                    <h2
                        className="
                            text-xl
                            sm:text-2xl
                            lg:text-xl
                            xl:text-[22px]
                            font-bold
                            leading-tight
                            text-[#111827]
                        "
                    >
                        <span className="text-[#FF5A3C]">
                           {content.title.split(" ")[0]}
                        </span>
                     {" "}
                        {content.title.split(" ").slice(1).join(" ")}
                    </h2>
                </div>

                {/* ================= INSTRUCTOR ================= */}
                <div
                    className="
                        mt-3
                        flex
                        items-center
                        gap-2.5
                        sm:gap-3
                    "
                >
                    <div
                        className="
                            h-10
                            w-10
                            shrink-0
                            flex items-center
                            justify-center
                            overflow-hidden
                            rounded-full
                            border-2
                            border-[#FF5A3C]
                            bg-[#FFF1EB]
                        "
                    >
                      <User/>
                    </div>

                    <div className="min-w-0">
                        <p
                            className="
                                text-sm
                                sm:text-lg
                                font-bold
                                leading-tight
                                text-[#111827]
                            "
                        >
                            Instructor:{" "}
                            <span className="text-[#FF5A3C]">
                                {content?.instructorInfo?.name}
                            </span>
                        </p>

                        <p
                            className="
                                mt-0.5
                                text-[10px]
                                sm:text-base
                                text-[#6B7280]
                            "
                        >
                            PTE Expert & English Language Trainer
                        </p>
                    </div>
                </div>

                {/* ================= META ================= */}
                <div
                    className="
                        mt-3
                        flex
                        flex-wrap
                        items-center
                        gap-x-3
                        gap-y-1.5
                        text-[10px]
                        sm:text-base
                        text-[#737373]
                    "
                >
                    <span>
                        Session #11:1
                    </span>

                    <span>
                        Live Session
                    </span>

                    <span>
                        {content?.duration/60} Minutes Completed
                    </span>
                </div>

                {/* DESCRIPTION */}
                <p
                    className="
                        mt-2
                        max-w-[700px]
                        text-sm
                        sm:text-base
                        leading-relaxed
                        text-[#6B7280]
                        line-clamp-2
                    "
                >
                    {content?.description}
                </p>

              

            </div>
        </div>
    </div>
</div>
    </div>

    {/* ==================================================
        MAIN CONTENT
    ================================================== */}
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* LEFT */}
      <div className="space-y-6">
        {/* LIVE SESSION */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {/* Header */}
          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
                  <Video className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Live Session
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Join your instructor through Google Meet
                  </p>
                </div>
              </div>

              <div className="hidden rounded-xl border border-gray-200 bg-white p-2.5 sm:flex">
                <img
                  src="https://www.gstatic.com/meet/google_meet_marketing_24x24.png"
                  alt="Google Meet"
                  className="h-6 w-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Timer / Status */}
          <div className="px-5 py-8 text-center sm:px-7">
            <div className="mb-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {/* Calendar illustration */}
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-16 rounded-t-md bg-orange-400" />
                    <div className="grid grid-cols-4 gap-1.5 p-2">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="h-3 w-3 rounded-sm bg-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white shadow-md">
                  <Clock className="h-5 w-5 text-gray-700" />
                </div>
              </div>

              <div className="text-left">
                <p className="text-sm font-medium text-gray-500">
                  {timeRemaining?.type === "live"
                    ? "Session is currently in progress"
                    : timeRemaining?.type === "ended"
                      ? "This session has ended"
                      : "Session starts in"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <span className="text-xl font-bold text-gray-900">
                    Session Ended
                  </span>
                </div>
              </div>
            </div>

            {formatTime(timeRemaining)}

            {/* Join Button */}
            {canJoin && meetingUrl && (
              <button
                onClick={handleJoinMeeting}
                className="mx-auto mt-6 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 hover:shadow-xl sm:w-auto"
              >
                <Video className="h-5 w-5" />
                Join Meeting
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            {/* Waiting message */}
            {!canJoin && timeRemaining?.type === "waiting" && (
              <div className="mx-auto mt-6 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    The join button will be available 10 minutes before the
                    session starts.
                  </span>
                </div>
              </div>
            )}

            {/* Ended */}
            {timeRemaining?.type === "ended" && (
              <div className="mx-auto mt-4 max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-gray-700">
                This live session has already ended.
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="border-t border-gray-100 bg-white px-5 py-5 sm:px-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Calendar className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatDate(scheduledStart)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatTimeOnly(scheduledStart)}
                    {" - "}
                    {formatTimeOnly(scheduledEnd)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        {content.description && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <BookOpen className="h-5 w-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                About This Session
              </h2>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-gray-600">
              {content.description}
            </p>

            {/* Book illustration */}
            <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block">
              <div className="relative">
                <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-orange-50">
                  <div className="flex items-center gap-1">
                    <div className="h-16 w-14 rounded-sm border-2 border-gray-300 bg-white" />
                    <div className="h-16 w-14 rounded-sm border-2 border-gray-300 bg-white" />
                  </div>
                  <div className="absolute -right-2 -top-2 h-8 w-3 rotate-12 rounded-sm bg-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          RIGHT SIDEBAR
      ================================================== */}
      <div className="space-y-6">
        {/* COURSE */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="relative">
            {course?.thumbnail?.url ? (
              <img
                src={`${ImageBaseUrl}/${course.thumbnail.url}`}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-400">
                    <span className="text-lg font-bold text-orange-400">
                      AI
                    </span>
                  </div>
                  <div className="flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-1 w-1 rounded-full bg-orange-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bookmark */}
            <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-md">
              <Bookmark className="h-4 w-4 text-orange-500" />
            </button>
          </div>

          <div className="p-5">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-orange-500">
              Course
            </div>
            <h3 className="font-bold leading-6 text-gray-900">
              {course?.title || "Course"}
            </h3>
            {course?.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
                {course.description}
              </p>
            )}
            <button className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-orange-500 transition hover:text-orange-600">
              Explore Course
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SESSION INFO */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-bold text-gray-900">
            Session Information
          </h3>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {/* Instructor */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Users className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Instructor</p>
                <p className="truncate text-sm font-bold text-gray-900">
                  {instructor?.name || "Not assigned"}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="truncate text-sm font-bold text-gray-900">
                  {formatDuration(content.duration)}
                </p>
              </div>
            </div>

            {/* Module */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Layers className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Module</p>
                <p className="truncate text-sm font-bold text-gray-900">
                  {moduleInfo?.title || "Not assigned"}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <CheckCircle className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Progress</p>
                <p className="truncate text-sm font-bold text-gray-900">
                  {content.progressCount || 0} completed
                </p>
              </div>
            </div>

            {/* Session Type */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Tag className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Session Type</p>
                <p className="truncate text-sm font-bold text-gray-900">
                  {content.contentType || "Session"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* INSTRUCTOR CARD */}
        {instructor && (
          <div className="rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <GraduationCap className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-white/80">Your Instructor</p>
                <p className="font-bold">{instructor.name}</p>
              </div>
            </div>

            {instructor.email && (
              <div className="mt-4 flex items-center justify-between">
                <p className="break-all text-xs text-white/90">
                  {instructor.email}
                </p>
                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 transition hover:bg-white/30">
                  <Mail className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

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