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
    <div className="min-h-screen bg-white rounded-3xl">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Content
        </button>

        <div className="overflow-hidden rounded-2xl border">
          <div className="grid lg:grid-cols-[360px_1fr]">
            {/* THUMBNAIL */}
            <div className="relative h-64 overflow-hidden bg-gray-100 lg:h-full lg:min-h-[310px]">
              {content.thumbnailPic ? (
                <img
                  src={`${ImageBaseUrl}/${content.thumbnailPic}`}
                  alt={content.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
                  <Video className="h-16 w-16 text-white/80" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Session badge */}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${sessionStatus.className}`}
                >
                  {sessionStatus.label}
                </span>

                {content.isFree && (
                  <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                    FREE
                  </span>
                )}
              </div>

              {/* Session number */}
              <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                Session #{content.order || 1}
              </div>
            </div>

            {/* HERO CONTENT */}
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-blue-600">
                <Video className="h-4 w-4" />
                1:1 Live Session
              </div>

              <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
                {content.title}
              </h1>

              {content.description && (
                <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
                  {content.description}
                </p>
              )}

              {/* Instructor */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Instructor</p>

                  <p className="font-semibold text-gray-900">
                    {instructor?.name || "Instructor"}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-7 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {formatDuration(content.duration)}
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {formatDate(scheduledStart)}
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <Layers className="h-4 w-4 text-blue-600" />
                  {moduleInfo?.title || "Session"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* LIVE SESSION */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* Header */}
              <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Live Session
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Join your instructor through Google Meet
                    </p>
                  </div>

                  <div className="hidden rounded-full bg-blue-50 p-3 sm:flex">
                    <Video className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="px-5 py-8 text-center sm:px-7">
                <div className="mb-5 flex items-center justify-center gap-2">
                  <Timer className="h-5 w-5 text-gray-400" />

                  <span className="text-sm font-medium text-gray-500">
                    {timeRemaining?.type === "live"
                      ? "Session is currently in progress"
                      : timeRemaining?.type === "ended"
                        ? "This session has ended"
                        : "Session starts in"}
                  </span>
                </div>

                {formatTime(timeRemaining)}

                {/* Join Button */}
                {canJoin && meetingUrl && (
                  <button
                    onClick={handleJoinMeeting}
                    className="mx-auto mt-7 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 hover:shadow-xl sm:w-auto"
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
                  <div className="mx-auto mt-6 max-w-md rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    This live session has already ended.
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Date</p>

                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(scheduledStart)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Time</p>

                      <p className="text-sm font-semibold text-gray-900">
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
              <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>

                  <h2 className="text-lg font-bold text-gray-900">
                    About This Session
                  </h2>
                </div>

                <p className="text-sm leading-7 text-gray-600">
                  {content.description}
                </p>
              </div>
            )}
          </div>

          {/* ==================================================
              RIGHT SIDEBAR
          ================================================== */}
          <div className="space-y-6">
            {/* COURSE */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {course?.thumbnail?.url && (
                <img
                  src={course.thumbnail.url}
                  alt={course.title}
                  className="h-40 w-full object-cover"
                />
              )}

              <div className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <BookOpen className="h-4 w-4" />
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
              </div>
            </div>

            {/* SESSION INFO */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-5 font-bold text-gray-900">
                Session Information
              </h3>

              <div className="space-y-4">
                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Instructor</p>

                    <p className="text-sm font-semibold text-gray-800">
                      {instructor?.name || "Not assigned"}
                    </p>
                  </div>
                </div>

                {/* Module */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                    <Layers className="h-4 w-4 text-gray-600" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Module</p>

                    <p className="text-sm font-semibold text-gray-800">
                      {moduleInfo?.title || "Not assigned"}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                    <Clock className="h-4 w-4 text-gray-600" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Duration</p>

                    <p className="text-sm font-semibold text-gray-800">
                      {formatDuration(content.duration)}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                    <CheckCircle className="h-4 w-4 text-gray-600" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Progress</p>

                    <p className="text-sm font-semibold text-gray-800">
                      {content.progressCount || 0} completed
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
                    <Tag className="h-4 w-4 text-gray-600" />
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Session Type</p>

                    <p className="text-sm font-semibold text-gray-800">
                      {content.contentType || "Session"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* INSTRUCTOR CARD */}
            {instructor && (
              <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
                    <GraduationCap className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-xs text-blue-100">Your Instructor</p>

                    <p className="font-bold">{instructor.name}</p>
                  </div>
                </div>

                {instructor.email && (
                  <p className="mt-4 break-all text-xs text-blue-100">
                    {instructor.email}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentViewPage;