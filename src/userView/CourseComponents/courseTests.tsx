import React from "react";
import {
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Lock,
  Star,
  Target,
} from "lucide-react";
import Button from "../../components/ui/button/Button";

interface CourseTestsProps {
  curriculum: any;
  loading?: boolean;
  onItemClick: (item: any, sectionId: string) => void;
}

export function CourseTests({
  curriculum,
  loading = false,
  onItemClick,
}: CourseTestsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const sectionsWithTests = curriculum
    ?.map((section) => ({
      ...section,
      items: section.items?.filter((item: any) => item.type === "Tests") || [],
    }))
    .filter((section) => section.items.length > 0);

  if (!sectionsWithTests?.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1EB] text-[#F36E45]">
          <ClipboardCheck className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[#172033]">
          No tests available
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Tests will appear here when they are added to the course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionsWithTests.map((section, sectionIndex) => (
        <div
          key={section._id}
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            transition-all
            hover:border-[#FFD5C8]
            hover:shadow-[0_8px_25px_rgba(243,110,69,0.08)]
          "
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3 bg-[#FDE8D8] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border-r
                  border-[#EAB9A5]
                  text-sm
                  font-bold
                  text-[#F04F23]
                "
              >
                {String(sectionIndex + 1).padStart(2, "0")}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-[#172033] sm:text-base">
                  {section.title}
                </h3>

                <p className="mt-0.5 text-xs text-[#8B6F61]">
                  {section.items.length}{" "}
                  {section.items.length === 1 ? "Test" : "Tests"}
                </p>
              </div>
            </div>

            <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#F04F23] sm:block">
              {section.items.length}
            </span>
          </div>

          {/* Tests */}
          <div className="divide-y divide-gray-100">
            {section.items.map((item: any, index: number) => {
              const test = item.test;

              return (
                <div
                  key={item._id}
                  className={`
                    group flex items-center gap-3 px-4 py-3
                    transition-colors
                    ${
                      item.isLocked
                        ? "opacity-60"
                        : "cursor-pointer hover:bg-[#FFFCFA]"
                    }
                  `}
                  onClick={() => {
                    if (!item.isLocked) {
                      onItemClick(item, section._id);
                    }
                  }}
                >
                  {/* Test Icon - NO THUMBNAIL */}
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#FFE0D6]
                      bg-[#FFF7F3]
                      text-[#F36E45]
                      transition-transform
                      group-hover:scale-105
                    "
                  >
                    <ClipboardCheck className="h-5 w-5" />
                  </div>

                  {/* Test Content */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`
                        truncate
                        text-sm
                        font-semibold
                        sm:text-[15px]
                        ${
                          item.isLocked
                            ? "text-gray-400"
                            : "text-[#172033] group-hover:text-[#F36E45]"
                        }
                      `}
                    >
                      {item.test.title || test?.title || `Test ${index + 1}`}
                    </h4>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
                      {/* Test Type */}
                      <span className="rounded-md bg-[#FFF5F1] px-2 py-0.5 text-[#F36E45]">
                        Test
                      </span>

                      {/* Duration */}
                      {test?.duration || item.duration ? (
                        <>
                          <span className="text-gray-300">•</span>

                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {test?.totalDurationMinutes  || item.duration} Minutes
                          </span>
                        </>
                      ) : null}

                      {test?.difficultyLabel && (
                        <>
                          <span className="text-gray-300">•</span>

                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {test?.difficultyLabel}
                          </span>
                        </>
                          
                      )}

 
                    </div>
                  </div>

                  {/* Action */}
                  {item.isLocked ? (
                    <Button
                      type="button"
                      disabled
                      size="sm"
                      variant="outline"
                      className="rounded-full border-gray-200 bg-gray-50 px-3 text-gray-400"
                    >
                      <Lock className="mr-1 h-3.5 w-3.5" />

                      <span className="hidden sm:inline">Locked</span>
                    </Button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item, section._id);
                      }}
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-gray-50
                        text-gray-400
                        transition-all
                        hover:bg-[#FFF1EB]
                        hover:text-[#F4511E]
                      "
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

import { File, LinkIcon, ImageIcon, Headphones } from "lucide-react";

interface CourseMaterialsProps {
  curriculum: any;
  loading?: boolean;
  onItemClick: (item: any, sectionId: string) => void;
}

const getMaterialIcon = (materialType?: string) => {
  switch (materialType?.toLowerCase()) {
    case "link":
      return <LinkIcon className="h-5 w-5" />;

    case "image":
      return <ImageIcon className="h-5 w-5" />;

    case "audio":
      return <Headphones className="h-5 w-5" />;

    case "pdf":
    case "document":
    default:
      return <File className="h-5 w-5" />;
  }
};

const getMaterialLabel = (materialType?: string) => {
  if (!materialType) return "Study Material";

  return materialType.charAt(0).toUpperCase() + materialType.slice(1);
};

export function CourseMaterials({
  curriculum,
  loading = false,
  onItemClick,
}: CourseMaterialsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const sectionsWithMaterials = curriculum
    ?.map((section) => ({
      ...section,
      items:
        section.items?.filter((item: any) => item.type === "StudyMaterials") ||
        [],
    }))
    .filter((section) => section.items.length > 0);

  if (!sectionsWithMaterials?.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1EB] text-[#F36E45]">
          <File className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-[#172033]">
          No study materials available
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Study materials will appear here when they are added to the course.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionsWithMaterials.map((section, sectionIndex) => (
        <div
          key={section._id}
          className="
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            transition-all
            hover:border-[#FFD5C8]
            hover:shadow-[0_8px_25px_rgba(243,110,69,0.08)]
          "
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3 bg-[#FDE8D8] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border-r
                  border-[#EAB9A5]
                  text-sm
                  font-bold
                  text-[#F04F23]
                "
              >
                {String(sectionIndex + 1).padStart(2, "0")}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-[#172033] sm:text-base">
                  {section.title}
                </h3>

                <p className="mt-0.5 text-xs text-[#8B6F61]">
                  {section.items.length}{" "}
                  {section.items.length === 1 ? "Material" : "Materials"}
                </p>
              </div>
            </div>

            <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#F04F23] sm:block">
              {section.items.length}
            </span>
          </div>

          {/* Materials */}
          <div className="divide-y divide-gray-100">
            {section.items.map((item: any) => (
              <div
                key={item._id}
                className={`
                  group flex items-center gap-3 px-4 py-3
                  transition-colors
                  ${
                    item.isLocked
                      ? "opacity-60"
                      : "cursor-pointer hover:bg-[#FFFCFA]"
                  }
                `}
                onClick={() => {
                  if (!item.isLocked) {
                    onItemClick(item, section._id);
                  }
                }}
              >
                {/* Icon - NO THUMBNAIL */}
                <div
                  className="
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#FFE0D6]
                    bg-[#FFF7F3]
                    text-[#F36E45]
                    transition-transform
                    group-hover:scale-105
                  "
                >
                  {getMaterialIcon(item.materialType)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h4
                    className={`
                      truncate
                      text-sm
                      font-semibold
                      sm:text-[15px]
                      ${
                        item.isLocked
                          ? "text-gray-400"
                          : "text-[#172033] group-hover:text-[#F36E45]"
                      }
                    `}
                  >
                    {item.title}
                  </h4>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 sm:text-sm">
                    <span className="rounded-md bg-[#FFF5F1] px-2 py-0.5 text-[#F36E45]">
                      {getMaterialLabel(item.materialType)}
                    </span>

                    {item.description && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="truncate max-w-[250px]">
                          {item.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action */}
                {item.isLocked ? (
                  <Button
                    type="button"
                    disabled
                    size="sm"
                    variant="outline"
                    className="rounded-full border-gray-200 bg-gray-50 px-3 text-gray-400"
                  >
                    <Lock className="mr-1 h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Locked</span>
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item, section._id);
                    }}
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-gray-50
                      text-gray-400
                      transition-all
                      hover:bg-[#FFF1EB]
                      hover:text-[#F4511E]
                    "
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}



import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  Video,
} from "lucide-react";

interface Session {
  _id: string;
  title: string;
  type: "Sessions";
  scheduledStart: string;
  scheduledEnd: string;
  duration?: string;
  slug?: string;
  thumbnailPic?: string | null;
  isLocked?: boolean;
}

interface TodaySessionsBannerProps {
  sessions: Session[];
  onJoin?: (session: Session) => void;
  onCalendar?: (session: Session) => void;
}

export const TodaySessionsBanner: React.FC<TodaySessionsBannerProps> = ({
  sessions = [],
  onJoin,
  onCalendar,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());


  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const todaySessions = useMemo(() => {
    const today = new Date();

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    return sessions
      .filter((session) => {
        if (!session?.scheduledStart) return false;

        const start = new Date(session.scheduledStart);

        return (
          start.getFullYear() === todayYear &&
          start.getMonth() === todayMonth &&
          start.getDate() === todayDate
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledStart).getTime() -
          new Date(b.scheduledStart).getTime(),
      );
  }, [sessions, now]);

  useEffect(() => {
    if (currentIndex >= todaySessions.length) {
      setCurrentIndex(0);
    }
  }, [todaySessions.length, currentIndex]);


  useEffect(() => {
    if (todaySessions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % todaySessions.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [todaySessions.length]);


  if (!todaySessions.length) {
    return null;
  }

  const session = todaySessions[currentIndex];

  const startTime = new Date(session.scheduledStart);
  const endTime = new Date(session.scheduledEnd);

  const startTimestamp = startTime.getTime();
  const endTimestamp = endTime.getTime();
  const nowTimestamp = now.getTime();

  const isUpcoming = nowTimestamp < startTimestamp;
  const isLive =
    nowTimestamp >= startTimestamp && nowTimestamp < endTimestamp;
  const isCompleted = nowTimestamp >= endTimestamp;


  const timerTarget = isUpcoming ? startTimestamp : endTimestamp;

  const remainingSeconds = Math.max(
    0,
    Math.floor((timerTarget - nowTimestamp) / 1000),
  );

  const days = Math.floor(remainingSeconds / 86400);

  const hours = Math.floor((remainingSeconds % 86400) / 3600);

  const minutes = Math.floor((remainingSeconds % 3600) / 60);

  const seconds = remainingSeconds % 60;

  const formatNumber = (value: number) =>
    String(value).padStart(2, "0");

  /*
   * -------------------------------------------------------
   * FORMAT DATE
   * -------------------------------------------------------
   */

  const formattedDate = startTime.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  /*
   * -------------------------------------------------------
   * FORMAT TIME
   * -------------------------------------------------------
   */

  const formattedStartTime = startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const formattedEndTime = endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  /*
   * -------------------------------------------------------
   * NAVIGATION
   * -------------------------------------------------------
   */

  const goPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? todaySessions.length - 1 : prev - 1,
    );
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % todaySessions.length);
  };

  /*
   * -------------------------------------------------------
   * JOIN HANDLER
   * -------------------------------------------------------
   */

  const handleJoin = () => {
    if (session.isLocked) return;

    onJoin?.(session);
  };

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-xl border border-[#F6DED2] bg-[#FFF7F1]">


        <div className="relative z-10 flex min-h-[255px] flex-col lg:flex-row">
          {/* ===================================================
              LEFT CONTENT
          =================================================== */}

          <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 sm:px-8 lg:px-10 lg:py-7">
            {/* Status */}
            <div className="mb-2">
              <span
                className={`
                  inline-flex
                  items-center
                  rounded-md
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wide
                  ${
                    isLive
                      ? "bg-[#FFE1D6] text-[#F4511E]"
                      : isCompleted
                        ? "bg-gray-100 text-gray-500"
                        : "bg-[#FFE7D8] text-[#F4511E]"
                  }
                `}
              >
                {isLive
                  ? "Live Now"
                  : isCompleted
                    ? "Session Completed"
                    : "Upcoming Session"}
              </span>
            </div>

            {/* Title */}
            <h2 className="max-w-[620px] text-2xl font-semibold leading-tight tracking-[-0.5px] text-[#171717] sm:text-3xl lg:text-[28px]">
              {session.title}
            </h2>

            {/* Subtitle */}
            <p className="mt-1 max-w-[600px] line-clamp-2 text-base text-[#333333] sm:text-[17px]">
              {session.description}
            </p>

            {/* Details */}
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#333333]">
              {/* Date */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">

                <CalendarDays
                  className="h-[18px] w-[18px] text-[#F4511E]"
                  strokeWidth={1.8}
                />

                <span>{formattedDate}</span>
                </div>
                 <div className="flex items-center gap-2">
                <Clock3
                  className="h-[18px] w-[18px] text-[#F4511E]"
                  strokeWidth={1.8}
                />

                <span>
                  {formattedStartTime} - {formattedEndTime}
                  {session.duration && (
                    <span className="ml-1">
                      ({session.duration})
                    </span>
                  )}
                </span>
              </div>
              </div>         
            </div>

            {/* Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                disabled={session.isLocked || isCompleted}
                onClick={handleJoin}
                className={`
                  inline-flex
                  h-[43px]
                  items-center
                  justify-center
                  gap-2
                  rounded-md
                  px-6
                  text-sm
                  font-semibold
                  text-white
                  transition-all
                  ${
                    session.isLocked || isCompleted
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-[#F36E45] shadow-sm hover:bg-[#e85b35] hover:shadow-md active:scale-[0.98]"
                  }
                `}
              >
                <Video className="h-4 w-4" />

                {isLive ? "Join Class" : "Join Class"}
              </button>
            </div>
          </div>

          {/* ===================================================
              TIMER
          =================================================== */}

          <div className="flex items-center justify-center px-5 py-5 lg:w-[285px] lg:px-4">
            <div
              className="
                w-full
                max-w-[225px]
                rounded-xl
                border
                border-[#F5E1D8]
                bg-white/70
                px-5
                py-5
                text-center
                shadow-[0_2px_10px_rgba(0,0,0,0.02)]
                backdrop-blur-sm
              "
            >
              <p className="text-sm font-medium text-[#222222]">
                {isLive ? "Class is live" : "Class starts in"}
              </p>

              {/* Timer */}
              <div className="mt-2 flex items-center justify-center gap-1">
                {days > 0 && (
                  <>
                    <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                      {formatNumber(days)}
                    </span>

                    <span className="mx-1 text-[24px] text-[#F36E45]">
                      :
                    </span>
                  </>
                )}

                <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                  {formatNumber(hours)}
                </span>

                <span className="text-[24px] text-[#F36E45]">
                  :
                </span>

                <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                  {formatNumber(minutes)}
                </span>

                <span className="text-[24px] text-[#F36E45]">
                  :
                </span>

                <span className="text-[30px] font-semibold tracking-wide text-[#F36E45]">
                  {formatNumber(seconds)}
                </span>
              </div>

              {/* Timer Labels */}
              <div className="mt-1 flex justify-center gap-[17px] text-[10px] font-medium uppercase text-gray-500">
                {days > 0 && <span>Days</span>}
                <span>Hrs</span>
                <span>Mins</span>
                <span>Secs</span>
              </div>

              {isLive && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-[#F36E45]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#F36E45]" />
                  Session in progress
                </div>
              )}
            </div>
          </div>

          {/* ===================================================
              RIGHT IMAGE
          =================================================== */}

          <div className="relative hidden w-[34%] min-w-[300px] overflow-hidden lg:block">
            {/* Background */}

              <img
                src={"https://orientelectric.com/cdn/shop/files/study_desk_lamp.png?v=1728973392"}
                alt=""
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-contain
                "
              />
          </div>
        </div>

        {todaySessions.length > 1 && (
          <>
            {/* Previous */}
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous session"
              className="
                absolute
                left-1
                top-1/2
                z-20
                hidden
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#F3D5C7]
                bg-white/90
                text-gray-600
                shadow-sm
                backdrop-blur
                transition-all
                hover:bg-white
                hover:text-[#F36E45]
                lg:flex
              "
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={goNext}
              aria-label="Next session"
              className="
                absolute
                right-1
                top-1/2
                z-20
                hidden
                h-9
                w-9
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-[#F3D5C7]
                bg-white/90
                text-gray-600
                shadow-sm
                backdrop-blur
                transition-all
                hover:bg-white
                hover:text-[#F36E45]
                lg:flex
              "
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
              {todaySessions.map((item, index) => (
                <button
                  key={item._id}
                  type="button"
                  aria-label={`Go to session ${index + 1}`}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    h-1.5
                    rounded-full
                    transition-all
                    duration-300
                    ${
                      index === currentIndex
                        ? "w-6 bg-[#F36E45]"
                        : "w-1.5 bg-[#E5B8A7] hover:bg-[#F36E45]"
                    }
                  `}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
