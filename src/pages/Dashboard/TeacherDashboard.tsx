import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  PlayCircle,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Video,
  WalletCards,
  Zap,
  ExternalLink,
  CircleAlert,
  CircleCheck,
  Timer,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

import api from "../../axiosInstance";

/* ============================================================
   HELPERS
============================================================ */

const n = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const arr = (value) => {
  return Array.isArray(value) ? value : [];
};

const pct = (value) => {
  return `${n(value).toFixed(1)}%`;
};

const compact = (value) => {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n(value));
};

const currency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n(value));
};

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return "—";
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";

  try {
    return format(new Date(value), "dd MMM, hh:mm a");
  } catch {
    return "—";
  }
};

const timeAgo = (value) => {
  if (!value) return "Never";

  try {
    return formatDistanceToNow(new Date(value), {
      addSuffix: true,
    });
  } catch {
    return "—";
  }
};

const initials = (name = "Teacher") => {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const prettify = (value) => {
  if (!value) return "Content";

  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/* ============================================================
   COLORS
============================================================ */

const COLORS = {
  blue: "#2563eb",
  indigo: "#4f46e5",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
  violet: "#7c3aed",
  cyan: "#0891b2",
  slate: "#64748b",
};

const PROGRESS_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#16a34a",
];

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function TeacherDashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [period, setPeriod] = useState("30d");
  const [selectedCourse, setSelectedCourse] = useState("all");

  const [activeTab, setActiveTab] = useState("overview");

  /* ==========================================================
     API
  ========================================================== */

  const fetchDashboard = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const params = {
          period,
        };

        if (selectedCourse !== "all") {
          params.courseId = selectedCourse;
        }

        const response = await api.get("/teacher/dashboard", {
          params,
        });

        if (!response?.data?.success) {
          throw new Error(
            response?.data?.message ||
              "Unable to load teacher dashboard"
          );
        }

        setDashboard(response.data.data);
      } catch (err) {
        console.error("Teacher dashboard error:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load teacher dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, selectedCourse]
  );

  useEffect(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  /* ==========================================================
     DATA
  ========================================================== */

  const teacher = dashboard?.teacher || {};
  const summary = dashboard?.summary || {};

  const courses = arr(dashboard?.courses);

  const content = dashboard?.content || {};
  const contentOverview =
    arr(content?.overview)[0] || {};

  const contentByType = arr(content?.byType);

  const liveClasses = dashboard?.liveClasses || {};
  const liveSummary = liveClasses?.summary || {};

  const recordedClasses =
    dashboard?.recordedClasses || {};

  const recordedSummary =
    recordedClasses?.summary || {};

  const topVideos = arr(
    recordedClasses?.topVideos
  );

  const modules = arr(dashboard?.modules);

  const feedback = dashboard?.feedback || {};

  const feedbackSummary =
    feedback?.summary || {};

  const ratingDistribution = arr(
    feedback?.ratingDistribution
  );

  const recentFeedback = arr(
    feedback?.recent
  );

  const recentActivity =
    dashboard?.recentActivity || {};

  const recentEnrollments = arr(
    recentActivity?.enrollments
  );

  const recentContent = arr(
    recentActivity?.content
  );

  const upcomingClasses = arr(
    recentActivity?.upcomingClasses
  );

  const insights = arr(dashboard?.insights);

  /*
   * The current controller does not expose studentAnalytics,
   * enrollmentTrend or revenueTrend in the final response.
   *
   * Keep these optional so the UI automatically starts using
   * them if you expose them later.
   */

  const studentAnalytics =
    dashboard?.studentAnalytics ||
    dashboard?.students ||
    {};

  const studentOverview =
    studentAnalytics?.overview || {};

  const activityTrend = arr(
    studentAnalytics?.activityTrend
  );

  const progressDistribution = arr(
    studentAnalytics?.progressDistribution
  );

  const enrollmentTrend = arr(
    dashboard?.enrollmentTrend ||
      dashboard?.trends?.enrollment
  );

  const revenueTrend = arr(
    dashboard?.revenueTrend ||
      dashboard?.trends?.revenue
  );

  /* ==========================================================
     DERIVED DATA
  ========================================================== */

  const totalContent =
    n(summary.totalContent) ||
    n(contentOverview.total);

  const publishedContent =
    n(summary.publishedContent) ||
    n(contentOverview.published);

  const draftContent =
    n(contentOverview.draft);

  const activeStudentRate =
    n(summary.totalStudents) > 0
      ? (n(summary.activeStudents) /
          n(summary.totalStudents)) *
        100
      : 0;

  const publishingRate =
    totalContent > 0
      ? (publishedContent / totalContent) * 100
      : 0;

  const topCourse = courses[0];

  const upcomingClass = upcomingClasses[0];

  /* ==========================================================
     CHART DATA
  ========================================================== */

  const contentChartData = useMemo(() => {
    return contentByType.map((item) => ({
      name: prettify(item?._id),
      total: n(item?.count),
      published: n(item?.published),
    }));
  }, [contentByType]);

  const progressChartData = useMemo(() => {
    return progressDistribution.map(
      (item, index) => ({
        name: progressBucketName(item?._id),
        students: n(item?.students),
        fill:
          PROGRESS_COLORS[index] ||
          COLORS.blue,
      })
    );
  }, [progressDistribution]);

  const activityChartData = useMemo(() => {
    return activityTrend.map((item) => ({
      date: formatChartDate(item?._id),
      students: n(item?.activeStudents),
    }));
  }, [activityTrend]);

  const enrollmentChartData = useMemo(() => {
    return enrollmentTrend.map((item) => ({
      date: formatChartDate(
        item?.date || item?._id
      ),
      enrollments: n(item?.enrollments),
      completed: n(item?.completed),
    }));
  }, [enrollmentTrend]);

  const revenueChartData = useMemo(() => {
    return revenueTrend.map((item) => ({
      date: formatChartDate(
        item?.date || item?._id
      ),
      revenue: n(item?.revenue),
      transactions: n(item?.transactions),
    }));
  }, [revenueTrend]);

  const ratingChartData = useMemo(() => {
    return ratingDistribution.map((item) => ({
      name: `${item?._id || 0} Star`,
      value: n(item?.count),
    }));
  }, [ratingDistribution]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return <DashboardSkeleton />;
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error && !dashboard) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] px-4 py-8 sm:px-6">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/40">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              Dashboard unavailable
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="min-h-screen text-slate-900">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-40 ">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Teacher */}

            <div className="flex items-center gap-3">
            
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-950">
                   Dashboard
                  </h1>

                  {teacher?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                      <CheckCircle2 size={11} />
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-0.5 text-sm text-slate-500">
                  Welcome back,{" "}
                  <span className="font-semibold text-slate-700">
                    {teacher?.name || "Teacher"}
                  </span>
                </p>
              </div>
            </div>

            {/* Controls */}

            <div className="flex flex-wrap items-center gap-2">
              <SelectControl
                value={selectedCourse}
                onChange={setSelectedCourse}
                icon={BookOpen}
                className="min-w-[210px]"
              >
                <option value="all">
                  All courses
                </option>

                {courses.map((course) => (
                  <option
                    key={course?._id}
                    value={course?._id}
                  >
                    {course?.title || "Untitled course"}
                  </option>
                ))}
              </SelectControl>

              <SelectControl
                value={period}
                onChange={setPeriod}
                icon={Calendar}
                className="min-w-[145px]"
              >
                <option value="7d">
                  Last 7 days
                </option>

                <option value="30d">
                  Last 30 days
                </option>

                <option value="90d">
                  Last 90 days
                </option>

                <option value="6m">
                  Last 6 months
                </option>

                <option value="1y">
                  Last year
                </option>
              </SelectControl>

              <button
                type="button"
                onClick={() =>
                  fetchDashboard(false)
                }
                disabled={refreshing}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                title="Refresh dashboard"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4">
        {/* Error */}

        {error && dashboard && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={17} />

            <span className="flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                fetchDashboard(false)
              }
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ====================================================
            HERO
        ==================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative mb-6 overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/30 sm:p-8"
        >
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-200">
                  Teaching Overview
                </span>

                <span className="text-xs text-slate-400">
                  {dashboard?.meta?.dateRange?.from
                    ? `${formatDate(
                        dashboard.meta.dateRange.from
                      )} — ${formatDate(
                        dashboard.meta.dateRange.to
                      )}`
                    : `Last ${period}`}
                </span>
              </div>

              <h2 className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
                Your teaching performance at a glance.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Track students, course performance,
                content quality, live classes and
                learner satisfaction from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
              <HeroStat
                label="Students"
                value={compact(summary.totalStudents)}
              />

              <HeroStat
                label="Courses"
                value={compact(summary.totalCourses)}
              />

              <HeroStat
                label="Rating"
                value={`${n(
                  summary.averageRating
                ).toFixed(1)} / 5`}
              />

              <HeroStat
                label="Content"
                value={compact(totalContent)}
              />
            </div>
          </div>
        </motion.section>

        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <div className="mb-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:min-w-0">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: BarChart3,
              },
              {
                id: "students",
                label: "Students",
                icon: Users,
              },
              {
                id: "content",
                label: "Content",
                icon: Layers3,
              },
              {
                id: "classes",
                label: "Classes",
                icon: Video,
              },
              {
                id: "feedback",
                label: "Feedback",
                icon: Star,
              },
            ].map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                    activeTab === tab.id
                      ? "bg-slate-950 text-white shadow-md"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ====================================================
            OVERVIEW
        ==================================================== */}

        {activeTab === "overview" && (
          <OverviewTab
            summary={summary}
            courses={courses}
            topCourse={topCourse}
            totalContent={totalContent}
            publishedContent={publishedContent}
            publishingRate={publishingRate}
            activeStudentRate={activeStudentRate}
            liveSummary={liveSummary}
            recordedSummary={recordedSummary}
            contentChartData={contentChartData}
            progressChartData={progressChartData}
            activityChartData={activityChartData}
            enrollmentChartData={enrollmentChartData}
            revenueChartData={revenueChartData}
            topVideos={topVideos}
            upcomingClass={upcomingClass}
            recentEnrollments={recentEnrollments}
            recentContent={recentContent}
            insights={insights}
            studentOverview={studentOverview}
          />
        )}

        {/* ====================================================
            STUDENTS
        ==================================================== */}

        {activeTab === "students" && (
          <StudentsTab
            summary={summary}
            studentOverview={studentOverview}
            activeStudentRate={activeStudentRate}
            progressChartData={progressChartData}
            activityChartData={activityChartData}
          />
        )}

        {/* ====================================================
            CONTENT
        ==================================================== */}

        {activeTab === "content" && (
          <ContentTab
            summary={summary}
            totalContent={totalContent}
            publishedContent={publishedContent}
            draftContent={draftContent}
            publishingRate={publishingRate}
            contentOverview={contentOverview}
            contentByType={contentByType}
            contentChartData={contentChartData}
            recordedSummary={recordedSummary}
            topVideos={topVideos}
            modules={modules}
            recentContent={recentContent}
          />
        )}

        {/* ====================================================
            CLASSES
        ==================================================== */}

        {activeTab === "classes" && (
          <ClassesTab
            liveSummary={liveSummary}
            liveClasses={liveClasses}
            upcomingClasses={upcomingClasses}
          />
        )}

        {/* ====================================================
            FEEDBACK
        ==================================================== */}

        {activeTab === "feedback" && (
          <FeedbackTab
            feedbackSummary={feedbackSummary}
            ratingChartData={ratingChartData}
            recentFeedback={recentFeedback}
          />
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="mt-10 border-t border-slate-200 py-6">
          <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Dashboard updated{" "}
              {timeAgo(
                dashboard?.meta?.generatedAt
              )}
            </span>

            <span>
              {dashboard?.meta?.totalCoursesIncluded ||
                summary.totalCourses ||
                0}{" "}
              course
              {(dashboard?.meta
                ?.totalCoursesIncluded ||
                summary.totalCourses ||
                0) !== 1
                ? "s"
                : ""}{" "}
              included
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ============================================================
   OVERVIEW TAB
============================================================ */

function OverviewTab({
  summary,
  courses,
  topCourse,
  totalContent,
  publishedContent,
  publishingRate,
  activeStudentRate,
  liveSummary,
  recordedSummary,
  contentChartData,
  progressChartData,
  activityChartData,
  enrollmentChartData,
  revenueChartData,
  topVideos,
  upcomingClass,
  recentEnrollments,
  recentContent,
  insights,
  studentOverview,
}:any) {
  return (
    <>
      {/* KPI */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={compact(summary.totalStudents)}
          subtitle={`${compact(
            summary.newStudentsInPeriod
          )} new in selected period`}
          trend={`${activeStudentRate.toFixed(
            0
          )}% active`}
          positive={activeStudentRate >= 50}
        />

        <MetricCard
          title="Total Content"
          value={currency(summary.totalContent)}
          subtitle={``}
          trend={`${publishingRate.toFixed(
            0
          )}% published`}
          positive={publishingRate >= 50}
        />

        <MetricCard
          title="Total Feedback"
          value={compact(
            studentOverview.totalFeedback
          )}
          subtitle={`${compact(
            studentOverview.totalFeedback
          )} learner responses`}
          trend={
            n(studentOverview.averageProgress) >= 50
              ? "Good"
              : "Needs attention"
          }
          positive={
            n(studentOverview.averageProgress) >= 50
          }
        />

        <MetricCard
          title="Learner Rating"
          value={`${n(
            summary.averageRating
          ).toFixed(1)} / 5`}
          subtitle={`${compact(
            summary.totalReviews
          )} learner reviews`}
          icon={Star}
          tone="amber"
          trend={
            n(summary.averageRating) >= 4.5
              ? "Excellent"
              : n(summary.averageRating) >= 3.5
                ? "Good"
                : "Needs attention"
          }
          positive={
            n(summary.averageRating) >= 4
          }
        />
      </section>

      {/* Mini stats */}

      <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MiniStat
          icon={BookOpen}
          label="Courses"
          value={summary.totalCourses}
        />

        <MiniStat
          icon={Users}
          label="Active"
          value={summary.activeStudents}
        />

        <MiniStat
          icon={CheckCircle2}
          label="Completed"
          value={summary.completedStudents}
        />

        <MiniStat
          icon={FileText}
          label="Content"
          value={totalContent}
        />

        <MiniStat
          icon={Video}
          label="Videos"
          value={recordedSummary.totalVideos}
        />

        <MiniStat
          icon={Calendar}
          label="Upcoming"
          value={liveSummary.upcoming}
        />
      </section>

      {/* Main analytics */}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
         <AnalyticsCard
          title="Course Performance"
          description="Compare students, progress, revenue and ratings"
          icon={BarChart3}
          className="xl:col-span-2"
        >
          <CoursePerformance courses={courses} />
        </AnalyticsCard>

        <AnalyticsCard
          title="Teaching Snapshot"
          description="Current health of your teaching operation"
          icon={Activity}
        >
          <TeachingHealth
            summary={summary}
            publishingRate={publishingRate}
            activeStudentRate={activeStudentRate}
            liveSummary={liveSummary}
            recordedSummary={recordedSummary}
          />
        </AnalyticsCard>
      </section>

      {/* Content + videos */}

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnalyticsCard
          title="Content Distribution"
          description="Content inventory across your courses"
          icon={Layers3}
        >
          {contentChartData.length ? (
            <ContentChart data={contentChartData} />
          ) : (
            <EmptyState
              title="No content data"
              description="Create content to see your distribution."
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Top Recorded Classes"
          description="Your most viewed recorded lessons"
          icon={PlayCircle}
        >
          <VideoList videos={topVideos} />
        </AnalyticsCard>
      </section>

      {/* Upcoming + recent */}

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AnalyticsCard
          title="Next Class"
          description="Your nearest upcoming teaching session"
          icon={Calendar}
        >
          {upcomingClass ? (
            <NextClass classData={upcomingClass} />
          ) : (
            <EmptyState
              title="No upcoming class"
              description="You don't have a scheduled class coming up."
              success
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Recent Enrollments"
          description="Latest learners joining your courses"
          icon={Users}
          className="xl:col-span-2"
        >
          <EnrollmentList
            enrollments={recentEnrollments}
          />
        </AnalyticsCard>
      </section>

      {/* Recent content */}

      <section className="mt-6">
        <AnalyticsCard
          title="Recently Added Content"
          description="Latest content created across your courses"
          icon={FileText}
        >
          <RecentContentList
            content={recentContent}
          />
        </AnalyticsCard>
      </section>
    </>
  );
}

/* ============================================================
   STUDENTS TAB
============================================================ */

function StudentsTab({
  summary,
  studentOverview,
  activeStudentRate,
  progressChartData,
  activityChartData,
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Learners"
          value={compact(
            studentOverview.totalStudents ||
              summary.totalStudents
          )}
          subtitle="Across assigned courses"
          icon={Users}
          tone="blue"
        />

        <MetricCard
          title="Active Learners"
          value={compact(
            studentOverview.activeStudents ||
              summary.activeStudents
          )}
          subtitle={`${activeStudentRate.toFixed(
            0
          )}% of total learners`}
          icon={Activity}
          tone="emerald"
        />

        <MetricCard
          title="Completed"
          value={compact(
            studentOverview.completedStudents ||
              summary.completedStudents
          )}
          subtitle="Finished their course"
          icon={CheckCircle2}
          tone="violet"
        />

        <MetricCard
          title="Above 80%"
          value={compact(
            studentOverview.studentsAbove80
          )}
          subtitle="High-performing learners"
          icon={Trophy}
          tone="amber"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsCard
          title="Learner Progress"
          description="Distribution of learners by progress"
          icon={Target}
        >
          {progressChartData.length ? (
            <ProgressChart
              data={progressChartData}
            />
          ) : (
            <ChartUnavailable
              title="Student analytics unavailable"
              message="Your current controller calculates student analytics internally but does not return it in data."
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Student Activity"
          description="Learner activity during the selected period"
          icon={Activity}
        >
          {activityChartData.length ? (
            <AreaAnalytics
              data={activityChartData}
              dataKey="students"
              firstName="Active Students"
              color={COLORS.violet}
              gradientId="teacherActivity"
            />
          ) : (
            <ChartUnavailable
              title="Activity trend unavailable"
              message="Expose studentAnalytics.activityTrend to render this chart."
            />
          )}
        </AnalyticsCard>
      </section>

      <section className="mt-6">
        <AnalyticsCard
          title="Student Health"
          description="Quick learner engagement indicators"
          icon={GraduationCap}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HealthCard
              label="Average Progress"
              value={pct(
                studentOverview.averageProgress
              )}
              icon={Target}
              tone="blue"
            />

            <HealthCard
              label="Above 80%"
              value={compact(
                studentOverview.studentsAbove80
              )}
              icon={Trophy}
              tone="emerald"
            />

            <HealthCard
              label="Below 20%"
              value={compact(
                studentOverview.studentsBelow20
              )}
              icon={CircleAlert}
              tone="rose"
            />

            <HealthCard
              label="Recently Active"
              value={compact(
                studentOverview.recentlyActive
              )}
              icon={Activity}
              tone="violet"
            />
          </div>
        </AnalyticsCard>
      </section>
    </>
  );
}

/* ============================================================
   CONTENT TAB
============================================================ */

function ContentTab({
  summary,
  totalContent,
  publishedContent,
  draftContent,
  publishingRate,
  contentOverview,
  contentByType,
  contentChartData,
  recordedSummary,
  topVideos,
  modules,
  recentContent,
}) {
  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat
          icon={FileText}
          label="Total Content"
          value={totalContent}
        />

        <MiniStat
          icon={CheckCircle2}
          label="Published"
          value={publishedContent}
        />

        <MiniStat
          icon={FileText}
          label="Draft"
          value={draftContent}
        />

        <MiniStat
          icon={Video}
          label="Videos"
          value={recordedSummary.totalVideos}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsCard
          title="Content Type Breakdown"
          description="Your complete content inventory"
          icon={Layers3}
        >
          <div className="space-y-3">
            {contentByType.length ? (
              contentByType.map((item) => {
                const count = n(item?.count);

                const width =
                  totalContent > 0
                    ? Math.min(
                        (count / totalContent) *
                          100,
                        100
                      )
                    : 0;

                return (
                  <div
                    key={item?._id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        {prettify(item?._id)}
                      </span>

                      <span className="text-sm font-bold text-slate-950">
                        {count}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${width}%`,
                        }}
                        transition={{
                          duration: 0.8,
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-xs text-slate-400">
                      <span>
                        {n(item?.published)} published
                      </span>

                      <span>
                        {width.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No content found"
                description="Create course content to see analytics."
              />
            )}
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title="Content Status"
          description="Publishing health of your course content"
          icon={CheckCircle2}
        >
          <PublishingHealth
            total={totalContent}
            published={publishedContent}
            draft={draftContent}
            scheduled={n(
              contentOverview.scheduled
            )}
            archived={n(
              contentOverview.archived
            )}
          />
        </AnalyticsCard>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnalyticsCard
          title="Content Chart"
          description="Total versus published content"
          icon={BarChart3}
        >
          {contentChartData.length ? (
            <ContentChart data={contentChartData} />
          ) : (
            <EmptyState
              title="No chart data"
              description="Content analytics will appear here."
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Recorded Classes"
          description="Video consumption overview"
          icon={PlayCircle}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox
              label="Videos"
              value={recordedSummary.totalVideos}
            />

            <StatBox
              label="Views"
              value={compact(
                recordedSummary.totalViews
              )}
            />

            <StatBox
              label="Likes"
              value={compact(
                recordedSummary.totalLikes
              )}
            />

            <StatBox
              label="Avg Watch"
              value={formatDuration(
                recordedSummary.averageWatchTime
              )}
            />
          </div>

          <div className="mt-5">
            <VideoList videos={topVideos} />
          </div>
        </AnalyticsCard>
      </section>

      <section className="mt-6">
        <AnalyticsCard
          title="Module Overview"
          description="Module structure across your courses"
          icon={Layers3}
        >
          <ModuleTable modules={modules} />
        </AnalyticsCard>
      </section>

      <section className="mt-6">
        <AnalyticsCard
          title="Recently Added Content"
          description="Latest content activity"
          icon={FileText}
        >
          <RecentContentList
            content={recentContent}
          />
        </AnalyticsCard>
      </section>
    </>
  );
}

/* ============================================================
   CLASSES TAB
============================================================ */

function ClassesTab({
  liveSummary,
  liveClasses,
  upcomingClasses,
}) {
  const classTrend = arr(
    liveClasses?.trend
  ).map((item) => ({
    date: formatChartDate(item?._id),
    classes: n(item?.classes),
  }));

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Total Live Classes"
          value={compact(
            liveSummary.totalClasses
          )}
          subtitle="Scheduled classes"
          icon={Video}
          tone="blue"
        />

        <MetricCard
          title="Completed"
          value={compact(
            liveSummary.completed
          )}
          subtitle={`${formatHours(
            liveSummary.totalActualMinutes
          )} actual teaching`}
          icon={CheckCircle2}
          tone="emerald"
        />

        <MetricCard
          title="Upcoming"
          value={compact(
            liveSummary.upcoming
          )}
          subtitle="Future sessions"
          icon={Calendar}
          tone="violet"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsCard
          title="Upcoming Classes"
          description="Your next teaching sessions"
          icon={Calendar}
        >
          <UpcomingClasses
            classes={upcomingClasses}
          />
        </AnalyticsCard>

        <AnalyticsCard
          title="Class Activity"
          description="Classes scheduled in selected period"
          icon={Clock3}
        >
          {classTrend.length ? (
            <BarAnalytics
              data={classTrend}
              dataKey="classes"
              name="Classes"
              color={COLORS.blue}
            />
          ) : (
            <EmptyState
              title="No class activity"
              description="Scheduled classes will appear here."
            />
          )}
        </AnalyticsCard>
      </section>

      <section className="mt-6">
        <AnalyticsCard
          title="Teaching Hours"
          description="Scheduled versus actual teaching time"
          icon={Timer}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <HealthCard
              label="Scheduled Hours"
              value={formatHours(
                liveSummary.totalScheduledMinutes
              )}
              icon={Calendar}
              tone="blue"
            />

            <HealthCard
              label="Actual Hours"
              value={formatHours(
                liveSummary.totalActualMinutes
              )}
              icon={Clock3}
              tone="emerald"
            />
          </div>
        </AnalyticsCard>
      </section>
    </>
  );
}

/* ============================================================
   FEEDBACK TAB
============================================================ */

function FeedbackTab({
  feedbackSummary,
  ratingChartData,
  recentFeedback,
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Feedback"
          value={compact(
            feedbackSummary.totalFeedback
          )}
          subtitle="Learner responses"
          icon={Activity}
          tone="blue"
        />

        <MetricCard
          title="Average Rating"
          value={`${n(
            feedbackSummary.averageRating
          ).toFixed(1)} / 5`}
          subtitle={`${compact(
            feedbackSummary.totalRatings
          )} ratings`}
          icon={Star}
          tone="amber"
        />

        <MetricCard
          title="Reported Issues"
          value={compact(
            feedbackSummary.issues
          )}
          subtitle="Learner-reported issues"
          icon={CircleAlert}
          tone="rose"
        />

        <MetricCard
          title="High Severity"
          value={compact(
            feedbackSummary.highSeverityIssues
          )}
          subtitle="Issues needing attention"
          icon={AlertCircle}
          tone="violet"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsCard
          title="Rating Distribution"
          description="How learners rate your content"
          icon={Star}
        >
          {ratingChartData.length ? (
            <RatingChart
              data={ratingChartData}
            />
          ) : (
            <EmptyState
              title="No ratings yet"
              description="Learner ratings will appear here."
            />
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Feedback Health"
          description="Current learner satisfaction"
          icon={Target}
        >
          <FeedbackHealth
            rating={
              feedbackSummary.averageRating
            }
            total={
              feedbackSummary.totalRatings
            }
            issues={
              feedbackSummary.issues
            }
          />
        </AnalyticsCard>
      </section>

      <section className="mt-6">
        <AnalyticsCard
          title="Recent Feedback"
          description="Latest learner feedback"
          icon={Star}
        >
          <FeedbackList
            feedback={recentFeedback}
          />
        </AnalyticsCard>
      </section>
    </>
  );
}

/* ============================================================
   TEACHING HEALTH
============================================================ */

function TeachingHealth({
  summary,
  publishingRate,
  activeStudentRate,
  liveSummary,
  recordedSummary,
}) {
  const items = [
    {
      label: "Student engagement",
      value: activeStudentRate,
      display: `${activeStudentRate.toFixed(0)}%`,
      color: COLORS.blue,
    },
    {
      label: "Content published",
      value: publishingRate,
      display: `${publishingRate.toFixed(0)}%`,
      color: COLORS.emerald,
    },
    {
      label: "Learner rating",
      value:
        n(summary.averageRating) * 20,
      display: `${n(
        summary.averageRating
      ).toFixed(1)} / 5`,
      color: COLORS.amber,
    },
    {
      label: "Upcoming classes",
      value:
        liveSummary.totalClasses > 0
          ? Math.min(
              (n(liveSummary.upcoming) /
                n(liveSummary.totalClasses)) *
                100,
              100
            )
          : 0,
      display: compact(
        liveSummary.upcoming
      ),
      color: COLORS.violet,
    },
  ];

  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              {item.label}
            </span>

            <span className="text-sm font-bold text-slate-900">
              {item.display}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(
                  item.value,
                  100
                )}%`,
              }}
              transition={{
                duration: 0.8,
              }}
              className="h-full rounded-full"
              style={{
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Video size={18} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Recorded classes
            </p>

            <p className="text-xs text-slate-400">
              {compact(
                recordedSummary.totalViews
              )}{" "}
              total views
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COURSE PERFORMANCE
============================================================ */

function CoursePerformance({ courses }) {
  if (!courses.length) {
    return (
      <EmptyState
        title="No courses available"
        description="Courses assigned to you will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <th className="pb-3">
              Course
            </th>

            <th className="pb-3 text-right">
              Students
            </th>
            <th className="pb-3 text-right">
              Rating
            </th>
          </tr>
        </thead>

        <tbody>
          {courses.map((course, index) => {
            const progress = n(
              course?.enrollment
                ?.averageProgress
            );

            const students = n(
              course?.enrollment
                ?.totalStudents
            );


            const rating = n(
              course?.feedback
                ?.averageRating
            );

            return (
              <tr
                key={course?._id}
                className="group border-b border-slate-50 transition hover:bg-slate-50/70 last:border-0"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-xs font-bold text-blue-600">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="min-w-0">
                      <p className="max-w-[280px] truncate text-sm font-semibold text-slate-800">
                        {course?.title ||
                          "Untitled course"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {course?.code ||
                          course?.mode ||
                          course?.level ||
                          "Course"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-4 text-right text-sm font-bold text-slate-700">
                  {compact(students)}
                </td>             

                <td className="py-4 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
                    <Star
                      size={12}
                      fill="currentColor"
                    />
                    {rating.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   TOP COURSE
============================================================ */

function TopCourseCard({ course }) {
  const students = n(
    course?.enrollment?.totalStudents
  );

  const progress = n(
    course?.enrollment?.averageProgress
  );

  const rating = n(
    course?.feedback?.averageRating
  );

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5">
      <div className="flex items-start gap-4">
        {course?.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course?.title}
            className="h-16 w-16 rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <BookOpen size={25} />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Top Performing
          </p>

          <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-900">
            {course?.title ||
              "Untitled course"}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            {course?.code ||
              course?.mode ||
              "Course"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <SmallMetric
          label="Students"
          value={compact(students)}
        />

        <SmallMetric
          label="Progress"
          value={`${progress.toFixed(0)}%`}
        />

        <SmallMetric
          label="Rating"
          value={rating.toFixed(1)}
        />
      </div>
    </div>
  );
}

/* ============================================================
   PROGRESS CHART
============================================================ */

function ProgressChart({ data }) {
  return (
    <div className="h-[330px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            left: 5,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e2e8f0"
          />

          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#94a3b8",
            }}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={70}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#64748b",
            }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 15px 40px rgba(15,23,42,.10)",
            }}
          />

          <Bar
            dataKey="students"
            name="Students"
            radius={[0, 8, 8, 0]}
            barSize={25}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.fill}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================
   CONTENT CHART
============================================================ */

function ContentChart({ data }) {
  return (
    <div className="h-[320px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#64748b",
            }}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#64748b",
            }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
            }}
          />

          <Legend />

          <Bar
            dataKey="total"
            name="Total"
            fill={COLORS.indigo}
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="published"
            name="Published"
            fill={COLORS.emerald}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================
   AREA CHART
============================================================ */

function AreaAnalytics({
  data,
  dataKey,
  secondKey,
  firstName,
  secondName,
  color,
  secondColor,
  gradientId,
  currencyMode = false,
}) {
  return (
    <div className="h-[330px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={color}
                stopOpacity={0.24}
              />

              <stop
                offset="100%"
                stopColor={color}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            minTickGap={25}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            tickFormatter={
              currencyMode
                ? (value) =>
                    `₹${compact(value)}`
                : undefined
            }
          />

          <Tooltip
            formatter={(value, name) => {
              if (currencyMode) {
                return [
                  currency(value),
                  name,
                ];
              }

              return [value, name];
            }}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 15px 40px rgba(15,23,42,.10)",
            }}
          />

          {secondKey && (
            <Legend />
          )}

          <Area
            type="monotone"
            dataKey={dataKey}
            name={firstName}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
          />

          {secondKey && (
            <Area
              type="monotone"
              dataKey={secondKey}
              name={secondName}
              stroke={
                secondColor || COLORS.emerald
              }
              strokeWidth={2}
              fill="transparent"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================
   BAR CHART
============================================================ */

function BarAnalytics({
  data,
  dataKey,
  name,
  color,
}) {
  return (
    <div className="h-[330px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: "#64748b",
            }}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
            }}
          />

          <Bar
            dataKey={dataKey}
            name={name}
            fill={color}
            radius={[7, 7, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================
   RATING CHART
============================================================ */

function RatingChart({ data }) {
  return (
    <div className="h-[330px]">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  [
                    COLORS.rose,
                    COLORS.amber,
                    "#eab308",
                    COLORS.emerald,
                    COLORS.blue,
                  ][index] ||
                  COLORS.blue
                }
              />
            ))}
          </Pie>

          <Tooltip />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================
   VIDEO LIST
============================================================ */

function VideoList({ videos }) {
  if (!videos.length) {
    return (
      <EmptyState
        title="No recorded classes"
        description="Your recorded class analytics will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {videos.slice(0, 8).map(
        (video, index) => (
          <div
            key={video?._id || index}
            className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {video?.title ||
                  "Untitled video"}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {video?.course?.title ||
                  "Course"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">
                {compact(video?.views)}
              </p>

              <p className="text-[10px] text-slate-400">
                views
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   NEXT CLASS
============================================================ */

function NextClass({ classData }) {
  const start = classData?.scheduledStart;
  const end = classData?.scheduledEnd;

  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Video size={19} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {classData?.title ||
                "Live Class"}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {classData?.course?.title ||
                "Course"}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-blue-600 shadow-sm">
          Upcoming
        </span>
      </div>

      <div className="mt-5 space-y-2 rounded-xl bg-white/80 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar size={14} />
          {formatDateTime(start)}
        </div>

        {end && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={14} />
            Ends {formatDateTime(end)}
          </div>
        )}
      </div>

      {classData?.meetingUrl && (
        <a
          href={classData.meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Join Class
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}

/* ============================================================
   UPCOMING CLASSES
============================================================ */

function UpcomingClasses({ classes }) {
  if (!classes.length) {
    return (
      <EmptyState
        title="No upcoming classes"
        description="Your future live sessions will appear here."
        success
      />
    );
  }

  return (
    <div className="space-y-3">
      {classes.slice(0, 8).map((item) => (
        <div
          key={item?._id}
          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-blue-100 hover:bg-blue-50/30"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Video size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {item?.title ||
                  "Live Class"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {item?.course?.title ||
                  "Course"}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={13} />
                {formatDateTime(
                  item?.scheduledStart
                )}
              </div>
            </div>

            {item?.meetingUrl && (
              <a
                href={item.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Join
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ENROLLMENTS
============================================================ */

function EnrollmentList({ enrollments }) {
  if (!enrollments.length) {
    return (
      <EmptyState
        title="No recent enrollments"
        description="New learners will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {enrollments
        .slice(0, 10)
        .map((item) => {
          const student =
            item?.student || {};

          return (
            <div
              key={item?._id}
              className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"
            >
              {student?.profilePic ? (
                <img
                  src={student.profilePic}
                  alt={student.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                  {initials(student?.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {student?.name ||
                    "Student"}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {item?.course?.title ||
                    "Course"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold text-slate-600">
                  {timeAgo(
                    item?.enrolledAt
                  )}
                </p>

                <p className="mt-1 text-[10px] font-semibold text-blue-600">
                  {n(
                    item?.percentage
                  ).toFixed(0)}
                  % progress
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
}

/* ============================================================
   RECENT CONTENT
============================================================ */

function RecentContentList({ content }) {
  if (!content.length) {
    return (
      <EmptyState
        title="No recent content"
        description="Recently created content will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {content.slice(0, 10).map((item) => (
        <div
          key={item?._id}
          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-slate-200 hover:bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {item?.title ||
                  "Untitled content"}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {prettify(item?.__t)}
              </p>
            </div>

            <StatusBadge
              status={item?.status}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">
              {item?.course?.title ||
                "Course"}
            </span>

            <span className="shrink-0">
              {formatDate(
                item?.createdAt
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MODULE TABLE
============================================================ */

function ModuleTable({ modules }) {
  if (!modules.length) {
    return (
      <EmptyState
        title="No modules available"
        description="Module analytics will appear when courses contain modules."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px]">
        <thead>
          <tr className="border-b border-slate-100 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <th className="pb-3">
              Course
            </th>

            <th className="pb-3 text-right">
              Modules
            </th>

            <th className="pb-3 text-right">
              Published
            </th>

            <th className="pb-3 text-right">
              Content
            </th>

            <th className="pb-3 text-right">
              Duration
            </th>
          </tr>
        </thead>

        <tbody>
          {modules.map((item) => (
            <tr
              key={item?.courseId}
              className="border-b border-slate-50 last:border-0"
            >
              <td className="py-4 text-sm font-semibold text-slate-800">
                {item?.courseTitle ||
                  "Course"}
              </td>

              <td className="py-4 text-right text-sm font-bold text-slate-700">
                {compact(item?.modules)}
              </td>

              <td className="py-4 text-right text-sm font-semibold text-emerald-600">
                {compact(
                  item?.publishedModules
                )}
              </td>

              <td className="py-4 text-right text-sm text-slate-600">
                {compact(
                  item?.contentCount
                )}
              </td>

              <td className="py-4 text-right text-sm text-slate-500">
                {formatHours(
                  item?.totalDuration
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   PUBLISHING HEALTH
============================================================ */

function PublishingHealth({
  total,
  published,
  draft,
  scheduled,
  archived,
}) {
  const rows = [
    {
      label: "Published",
      value: published,
      color: COLORS.emerald,
    },
    {
      label: "Draft",
      value: draft,
      color: COLORS.slate,
    },
    {
      label: "Scheduled",
      value: scheduled,
      color: COLORS.blue,
    },
    {
      label: "Archived",
      value: archived,
      color: COLORS.rose,
    },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const percentage =
          total > 0
            ? (row.value / total) * 100
            : 0;

        return (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                {row.label}
              </span>

              <span className="text-sm font-bold text-slate-900">
                {row.value}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(
                    percentage,
                    100
                  )}%`,
                  backgroundColor:
                    row.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   FEEDBACK
============================================================ */

function FeedbackHealth({
  rating,
  total,
  issues,
}) {
  const score = n(rating);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Overall Satisfaction
          </p>

          <p className="mt-2 text-4xl font-black text-slate-950">
            {score.toFixed(1)}
            <span className="text-lg text-slate-400">
              /5
            </span>
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
          <Star
            size={30}
            fill="currentColor"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <SmallMetric
          label="Ratings"
          value={compact(total)}
        />

        <SmallMetric
          label="Issues"
          value={compact(issues)}
        />
      </div>
    </div>
  );
}

function FeedbackList({ feedback }) {
  if (!feedback.length) {
    return (
      <EmptyState
        title="No recent feedback"
        description="Learner feedback will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {feedback.slice(0, 10).map(
        (item, index) => (
          <div
            key={item?._id || index}
            className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {item?.student?.name ||
                    item?.user?.name ||
                    "Learner"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {item?.content?.title ||
                    item?.video?.title ||
                    "Course content"}
                </p>
              </div>

              {item?.rating != null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <Star
                    size={12}
                    fill="currentColor"
                  />
                  {n(item.rating).toFixed(1)}
                </span>
              )}
            </div>

            {(item?.message ||
              item?.comment ||
              item?.feedback) && (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.message ||
                  item.comment ||
                  item.feedback}
              </p>
            )}

            {item?.createdAt && (
              <p className="mt-3 text-[10px] text-slate-400">
                {timeAgo(item.createdAt)}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}

/* ============================================================
   INSIGHTS
============================================================ */

function Insights({ insights }) {
  if (!insights.length) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CircleCheck size={21} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-emerald-800">
              Everything looks healthy
            </h3>

            <p className="mt-1 text-xs text-emerald-600">
              No major teaching insights require
              your attention right now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Zap size={18} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Teaching Insights
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Recommendations generated from your
              teaching analytics
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-2">
        {insights.map((insight, index) => {
          const type =
            insight?.type || "info";

          const styles =
            type === "warning"
              ? {
                  wrapper:
                    "border-amber-100 bg-amber-50/60",
                  icon:
                    "bg-amber-100 text-amber-600",
                }
              : type === "success"
                ? {
                    wrapper:
                      "border-emerald-100 bg-emerald-50/60",
                    icon:
                      "bg-emerald-100 text-emerald-600",
                  }
                : {
                    wrapper:
                      "border-blue-100 bg-blue-50/60",
                    icon:
                      "bg-blue-100 text-blue-600",
                  };

          return (
            <motion.div
              key={`${insight?.title}-${index}`}
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              className={`rounded-2xl border p-4 ${styles.wrapper}`}
            >
              <div className="flex gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                >
                  {type ===
                  "warning" ? (
                    <AlertCircle
                      size={18}
                    />
                  ) : type ===
                    "success" ? (
                    <CheckCircle2
                      size={18}
                    />
                  ) : (
                    <Zap size={18} />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">
                      {insight?.title ||
                        "Insight"}
                    </h3>

                    {insight?.priority && (
                      <span className="rounded-full bg-white/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {insight.priority}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {insight?.message}
                  </p>

                  {insight?.action && (
                    <p className="mt-3 text-xs font-semibold text-slate-700">
                      Recommended:{" "}
                      <span className="font-medium text-slate-500">
                        {insight.action}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   REVENUE FALLBACK
============================================================ */

function RevenueSummary({ summary }) {
  const revenue = n(
    summary?.periodRevenue
  );

  const transactions = n(
    summary?.periodTransactions
  );

  const average =
    transactions > 0
      ? revenue / transactions
      : 0;

  return (
    <div className="flex h-[330px] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <WalletCards size={22} />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-emerald-600">
          Selected Period Revenue
        </p>

        <p className="mt-1 text-4xl font-black tracking-tight text-slate-950">
          {currency(revenue)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <SmallMetric
            label="Transactions"
            value={compact(
              transactions
            )}
          />

          <SmallMetric
            label="Average Order"
            value={currency(average)}
          />
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Revenue trend is not exposed by the
          current dashboard response. The summary
          remains available above.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTS
============================================================ */

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  positive,
}) {
  const toneClasses = {
    blue: "bg-blue-200 text-blue-600",
    emerald:
      "bg-emerald-100 text-emerald-600",
    violet:
      "bg-violet-100 text-violet-600",
    amber:
      "bg-amber-50 text-amber-600",
    rose:
      "bg-rose-50 text-rose-600",
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="group rounded-2xl border-3 border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
    >
      <div className="flex items-start justify-between gap-3">
       
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              positive
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-100 text-slate-800"
            }`}
          >
            {positive ? (
              <ArrowUpRight size={11} />
            ) : (
              <ArrowDownRight
                size={11}
              />
            )}

            {trend}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 font-medium text-xs text-slate-500">
        {subtitle}
      </p>
    </motion.div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-3 border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-md">
      

      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {label}
        </p>

        <p className="mt-0.5 text-xl font-bold text-slate-900">
          {compact(value)}
        </p>
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className={`overflow-hidden rounded-3xl border-3 border-slate-200 bg-white ${className}`}
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-amber-50 to-slate-100 px-5 py-3 pb-2">
        <div className="flex items-start gap-3">
         
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">
              {title}
            </h2>

            <p className="mt-px text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </motion.section>
  );
}

function SelectControl({
  value,
  onChange,
  children,
  icon: Icon,
  className = "",
}) {
  return (
    <div
      className={`relative ${className}`}
    >
      {Icon && (
        <Icon
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
        />
      )}

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${
          !Icon ? "pl-3" : ""
        }`}
      >
        {children}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function HealthCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
}) {
  const classes = {
    blue: "bg-blue-50 text-blue-600",
    emerald:
      "bg-emerald-50 text-emerald-600",
    violet:
      "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    amber:
      "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${classes[tone]}`}
      >
        <Icon size={17} />
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-900">
        {typeof value === "string"
          ? value
          : compact(value)}
      </p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    published:
      "bg-emerald-50 text-emerald-600",
    draft:
      "bg-slate-100 text-slate-500",
    scheduled:
      "bg-blue-50 text-blue-600",
    live:
      "bg-red-50 text-red-600",
    archived:
      "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
        styles[status] ||
        "bg-slate-100 text-slate-500"
      }`}
    >
      {status || "unknown"}
    </span>
  );
}

function ChartUnavailable({
  title,
  message,
}) {
  return (
    <div className="flex h-[330px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <BarChart3 size={21} />
        </div>

        <h3 className="mt-4 text-sm font-bold text-slate-700">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  success = false,
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          success
            ? "bg-emerald-50 text-emerald-500"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {success ? (
          <CheckCircle2 size={21} />
        ) : (
          <BarChart3 size={21} />
        )}
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-700">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] animate-pulse">
        <div className="h-20 rounded-2xl bg-white" />

        <div className="mt-6 h-56 rounded-3xl bg-slate-200" />

        <div className="mt-6 h-14 rounded-2xl bg-white" />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl bg-white"
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-[400px] rounded-3xl bg-white xl:col-span-2" />
          <div className="h-[400px] rounded-3xl bg-white" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="h-[400px] rounded-3xl bg-white" />
          <div className="h-[400px] rounded-3xl bg-white" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORMATTERS
============================================================ */

function formatChartDate(value) {
  if (!value) return "";

  try {
    return format(
      new Date(value),
      "dd MMM"
    );
  } catch {
    return String(value);
  }
}

function formatDuration(seconds) {
  const value = n(seconds);

  if (!value) return "0m";

  const minutes = Math.round(
    value / 60
  );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remaining = minutes % 60;

  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
}

function formatHours(minutes) {
  const value = n(minutes);

  if (!value) return "0h";

  const hours = value / 60;

  return `${hours.toFixed(
    hours >= 10 ? 0 : 1
  )}h`;
}

function progressBucketName(value) {
  if (value === 0) return "0–20%";
  if (value === 20) return "20–40%";
  if (value === 40) return "40–60%";
  if (value === 60) return "60–80%";
  if (value === 80) return "80–100%";

  return String(value);
}