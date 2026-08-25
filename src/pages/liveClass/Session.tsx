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
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="grid lg:grid-cols-[340px_1fr]">
        {/* THUMBNAIL */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500 lg:h-full lg:min-h-[320px]">
          {content.thumbnailPic ? (
            <img
              src={`${ImageBaseUrl}/${content.thumbnailPic}`}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              {/* Decorative circles */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -left-10 top-10 h-40 w-40 rounded-full border border-white/40" />
                <div className="absolute -right-10 bottom-10 h-60 w-60 rounded-full border border-white/30" />
              </div>

              {/* Video icon circle */}
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-lg">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500">
                  <Video className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Session badges */}
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm ${sessionStatus.className}`}
            >
              <CheckCircle className="h-3.5 w-3.5 text-orange-500" />
              {sessionStatus.label}
            </span>

            {content.isFree && (
              <span className="rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-white">
                FREE
              </span>
            )}
          </div>

          {/* Session number */}
          <div className="absolute bottom-4 left-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-orange-600 shadow-sm">
            Session #{content.order || 1}
          </div>
        </div>

        {/* HERO CONTENT */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-600">
            <Video className="h-4 w-4" />
            1:1 Live Session
          </div>

          <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
            {content.title}
          </h1>

          {content.description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500 sm:text-base">
              {content.description}
            </p>
          )}

          {/* Instructor */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
              <GraduationCap className="h-5 w-5 text-orange-600" />
            </div>

            <div>
              <p className="text-xs text-gray-500">Instructor</p>
              <p className="font-bold text-orange-600">
                {instructor?.name || "Instructor"}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-6 grid grid-cols-1 divide-y divide-gray-200 rounded-xl border border-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDuration(content.duration)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDate(scheduledStart)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <Layers className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Modules</p>
                <p className="text-sm font-bold text-gray-900">
                  {moduleInfo?.title || "Session"}
                </p>
              </div>
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

export default ContentViewPage;