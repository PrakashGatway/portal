import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  GraduationCap,
  IndianRupee,
  Layers3,
  Languages,
  MonitorPlay,
  Target,
  Users,
  UserRound,
  XCircle,
  Star,
  Tag,
  ListChecks,
  Loader2,
  Sparkles,
  TrendingUp,
  Award,
  Globe,
  BadgeCheck,
  ChevronRight,
  ChevronDown,
  FileText,
  Settings,
  Eye,
  LayoutGrid,
  BarChart3,
  Videotape,
  Tv,
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

import api from "../../axiosInstance";
import ModuleManagement from "./Modules";
import ContentManagement from "../Content/Contents";

// Enhanced Tab Configuration
const COURSE_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Course information & analytics",
    icon: LayoutGrid,
    badge: "Summary",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "modules",
    label: "Modules",
    description: "Structure & organization",
    icon: Layers3,
    badge: "Structure",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "recorded",
    label: "Recorded Classes",
    description: "Manage learning materials",
    icon: Videotape,
    badge: "Curriculum",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "live",
    label: "live Classes",
    description: "Manage learning materials",
    icon: Tv,
    badge: "Curriculum",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "session",
    label: "1:1 Sessions",
    description: "Manage learning materials",
    icon: BookOpen,
    badge: "Curriculum",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "material",
    label: "Study Material",
    description: "Manage learning materials",
    icon: BookOpen,
    badge: "Curriculum",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
  {
    id: "tests",
    label: "Tests",
    description: "Manage learning materials",
    icon: BookOpen,
    badge: "Curriculum",
    gradient: "from-emerald-500 to-teal-600",
    activeGradient: "from-emerald-600 to-teal-700",
  },
];

export default function CourseManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const fetchCourseInfo = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoadingCourse(true);
      const response = await api.get(`/courses/${courseId}`);
      setCourseInfo(response.data?.data || response.data);
    } catch (error) {
      console.error("Failed to fetch course details:", error);
    } finally {
      setLoadingCourse(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseInfo();
  }, [fetchCourseInfo]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: courseInfo?.pricing?.currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusConfig = (status?: string) => {
    const configs = {
      ongoing: {
        wrapper:
          "bg-emerald-50/80 border-emerald-200/60 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
        dot: "bg-emerald-500 animate-pulse",
        icon: TrendingUp,
        label: "Ongoing",
      },
      completed: {
        wrapper:
          "bg-blue-50/80 border-blue-200/60 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
        dot: "bg-blue-500",
        icon: BadgeCheck,
        label: "Completed",
      },
      upcoming: {
        wrapper:
          "bg-amber-50/80 border-amber-200/60 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
        dot: "bg-amber-500",
        icon: Clock3,
        label: "Upcoming",
      },
      draft: {
        wrapper:
          "bg-gray-50/80 border-gray-200/60 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400",
        dot: "bg-gray-400",
        icon: FileText,
        label: "Draft",
      },
    };
    return (
      configs[status?.toLowerCase() as keyof typeof configs] || configs.draft
    );
  };

  if (loadingCourse) {
    return (
      <div className="min-h-screen ">
        <LoadingScreen />
      </div>
    );
  }

  const statusConfig = getStatusConfig(courseInfo?.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen w-full max-w-7xl">
      <header className={`transition-all duration-300`}>
        <div className="mx-auto flex min-h-[76px] max-w-[1800px] items-center justify-between gap-4 px-4">
          {/* Left Section */}
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:scale-105 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                Go Back
              </span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="max-w-[300px] truncate text-lg font-bold text-slate-900 dark:text-white sm:max-w-[500px] sm:text-xl">
                  {courseInfo?.title || "Course Management"}
                </h1>

                <motion.span
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold capitalize backdrop-blur-sm sm:inline-flex ${statusConfig.wrapper}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${statusConfig.dot}`}
                  />
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </motion.span>
              </div>

              <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">Course Management</span>
                {courseInfo?.code && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">
                      •
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Code2 className="h-3 w-3" />
                      {courseInfo.code}
                    </span>
                  </>
                )}
                {courseInfo?.categoryInfo?.name && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">
                      •
                    </span>
                    <span>{courseInfo.categoryInfo.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-4">
        <aside className="sticky top-20 hidden w-[240px] shrink-0 lg:block">
          <div className="space-y-6">
            {/* Navigation with enhanced styling */}
            <nav className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 px-5 py-4 dark:border-slate-800 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-800/10">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  <Settings className="h-4 w-4" />
                  Management
                </p>
              </div>

              <div className="p-3">
                {COURSE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;

                  return (
                    <motion.button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative mb-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-all duration-300 ${
                        active
                          ? `bg-gradient-to-r ${tab.activeGradient}`
                          : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white"
                        />
                      )}

                      <span
                        className={`flex p-1.5 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          active
                            ? "text-white"
                            : "text-slate-500 group-hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-semibold transition-colors ${
                            active
                              ? "text-white"
                              : "text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </span>
                      </span>

                      {active ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20"
                        >
                          <ChevronRight className="h-4 w-4 text-white" />
                        </motion.span>
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>

        <div className="fixed bottom-2 left-2 right-2 z-40 lg:hidden">
          <div className="rounded-4xl border border-slate-200 bg-white/95 p-1 shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
            <div className="flex overflow-x-auto no-scrollbar  justify-between gap-1">
              {COURSE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
    group
    flex h-[58px] w-[72px] shrink-0
    flex-col items-center justify-center
    gap-1 rounded-4xl px-2
    transition-all duration-200
    ${
      active
        ? `bg-gradient-to-br ${tab.activeGradient} text-white shadow-md`
        : `
          text-slate-500
          hover:bg-slate-100 hover:text-slate-900
          dark:text-slate-400
          dark:hover:bg-slate-800 dark:hover:text-slate-100
        `
    }
  `}
                  >
                    <Icon
                      className={`
      h-[18px] w-[18px] shrink-0
      transition-transform duration-200
      ${active ? "scale-105" : "group-hover:scale-105"}
    `}
                    />

                    <span
                      className="
      w-full truncate
      text-center text-[10px]
      font-medium leading-tight
    "
                      title={tab.label}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === "overview" && (
                <CourseOverview course={courseInfo} />
              )}
              {activeTab === "modules" && (
                <ModuleManagement course={courseInfo} from={"content"} />
              )}
              {activeTab === "recorded" && (
                <ContentManagement
                  type="RecordedClasses"
                  from={"content"}
                  course={courseInfo}
                />
              )}
              {activeTab === "live" && (
                <ContentManagement
                  type="LiveClasses"
                  from={"content"}
                  course={courseInfo}
                />
              )}
              {activeTab === "session" && (
                <ContentManagement
                  type="Sessions"
                  from={"content"}
                  course={courseInfo}
                />
              )}
              {activeTab === "tests" && (
                <ContentManagement
                  type="Tests"
                  from={"content"}
                  course={courseInfo}
                />
              )}
              {activeTab === "material" && (
                <ContentManagement
                  type="StudyMaterials"
                  from={"content"}
                  course={courseInfo}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* Enhanced Loading Screen */
function LoadingScreen() {
  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full">
            <Loader2 className="h-14 w-14 animate-spin text-black" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            Loading your course
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="h-2 w-2 rounded-full bg-indigo-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Enhanced Course Overview */
function CourseOverview({ course }: { course: any }) {
  if (!course) return null;

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return moment(date).format("MMM D, YYYY");
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: course?.pricing?.currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Animated Background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-indigo-50/50 p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 dark:shadow-none sm:p-8"
      >
        {/* Animated Background Elements */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl"
          />
        </div>

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {course.title}
              </h2>

              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {course.status || "N/A"}
              </motion.span>

              {course.featured && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-amber-500/30">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Featured
                </span>
              )}
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              {course.shortDescription || course.description}
            </p>

            {/* Animated Tags */}
            {course.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {course.tags.slice(0, 6).map((tag: string, index: number) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="cursor-pointer rounded-lg bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 backdrop-blur-sm transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700"
                  >
                    #{tag}
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid with Animation */}
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
            {[
              {
                icon: Code2,
                label: "Course Code",
                value: course.code || "N/A",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: Award,
                label: "Level",
                value: course.level || "N/A",
                gradient: "from-indigo-500 to-indigo-600",
              },
              {
                icon: Globe,
                label: "Language",
                value: course.language?.toUpperCase() || "N/A",
                gradient: "from-emerald-500 to-emerald-600",
              },
              {
                icon: MonitorPlay,
                label: "Mode",
                value: course.mode || "N/A",
                gradient: "from-amber-500 to-orange-600",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group min-w-[110px] rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all dark:border-slate-700 dark:bg-slate-800"
              >
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-md transition-transform duration-300 group-hover:rotate-12`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Description Card */}
      <SectionCard
        icon={BookOpen}
        title="Course Description"
        description="Detailed overview of this course"
        accent="from-blue-500 to-indigo-600"
      >
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
          {course.description || "No description available."}
        </p>
      </SectionCard>

      {/* Schedule & Pricing Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          icon={CalendarDays}
          title="Course Schedule"
          description="Important dates and timing"
          accent="from-emerald-500 to-teal-600"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              icon={CalendarDays}
              label="Start Date"
              value={formatDate(course.schedule?.startDate)}
              highlight
            />
            <InfoItem
              icon={CalendarDays}
              label="End Date"
              value={formatDate(course.schedule?.endDate)}
              highlight
            />
            <InfoItem
              icon={Clock3}
              label="Enrollment Deadline"
              value={formatDate(course.schedule?.enrollmentDeadline)}
            />
            <InfoItem
              icon={Globe}
              label="Timezone"
              value={course.schedule?.timezone || "N/A"}
            />
          </div>

          {course.schedule_pattern && (
            <div className="mt-6 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 dark:border-slate-800 dark:from-slate-800/50 dark:to-slate-800/20">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                Class Schedule Pattern
              </p>

              <div className="flex flex-wrap gap-2">
                {course.schedule_pattern.days?.map((day: string) => (
                  <motion.span
                    key={day}
                    whileHover={{ scale: 1.1 }}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold capitalize text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                  >
                    {day}
                  </motion.span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                <div className="rounded-lg bg-white/60 p-3 text-center dark:bg-slate-900/60">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {course.schedule_pattern.time?.start || "N/A"} -{" "}
                    {course.schedule_pattern.time?.end || "N/A"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">Time</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center dark:bg-slate-900/60">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {course.schedule_pattern.duration || 0} min
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">Duration</p>
                </div>
                <div className="rounded-lg bg-white/60 p-3 text-center dark:bg-slate-900/60">
                  <p className="font-bold text-slate-900 dark:text-white capitalize">
                    {course.schedule_pattern.frequency || "N/A"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">Frequency</p>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={IndianRupee}
          title="Pricing Details"
          description="Course cost and discounts"
          accent="from-amber-500 to-orange-600"
        >
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 dark:from-slate-800 dark:to-slate-800/50">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Course Price
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(course.pricing?.amount)}
            </p>
            {course.pricing?.discount > 0 && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {course.pricing.discount}% discount applied
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-200 hover:shadow-md dark:border-slate-700 dark:hover:border-amber-500/30">
              <p className="text-[11px] font-medium text-slate-400">Discount</p>
              <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
                {course.pricing?.discount ?? 0}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-200 hover:shadow-md dark:border-slate-700 dark:hover:border-amber-500/30">
              <p className="text-[11px] font-medium text-slate-400">
                Early Bird
              </p>
              <p className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-200">
                {course.pricing?.earlyBird?.discount ?? 0}%
              </p>
            </div>
          </div>

          {course.pricing?.earlyBird?.deadline && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock3 className="h-4 w-4 shrink-0" />
              <span>
                Early bird deadline:{" "}
                <strong>{formatDate(course.pricing.earlyBird.deadline)}</strong>
              </span>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Instructors with Enhanced Cards */}
      <SectionCard
        icon={Users}
        title="Course Instructors"
        description={`${course.instructorNames?.length || 0} instructor(s) assigned`}
        accent="from-purple-500 to-pink-600"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {course.instructorNames?.map((instructor: any, index: number) => (
            <motion.div
              key={instructor._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-200 p-4 transition-all hover:border-purple-200 hover:bg-purple-50/30 hover:shadow-lg dark:border-slate-700 dark:hover:border-purple-500/30 dark:hover:bg-slate-800/50"
            >
              {/* Gradient background on hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30">
                  <UserRound className="h-6 w-6" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900">
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {instructor.name || "Unknown Instructor"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {instructor.email || "No email provided"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= 4
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400">4.9</span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600" />
            </motion.div>
          ))}
        </div>
      </SectionCard>

      {/* Objectives & Requirements */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ListSection
          icon={Target}
          title="Learning Objectives"
          items={course.objectives}
          accent="from-emerald-500 to-teal-600"
        />
        <ListSection
          icon={ListChecks}
          title="Requirements"
          items={course.requirements}
          accent="from-orange-500 to-red-600"
        />
      </div>

      {/* Target Audience & Features */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ListSection
          icon={Users}
          title="Target Audience"
          items={course.targetAudience}
          accent="from-blue-500 to-indigo-600"
        />
        <ListSection
          icon={Sparkles}
          title="Course Features"
          items={course.features}
          accent="from-purple-500 to-pink-600"
        />
      </div>

      {/* SEO Info */}
      {course.extraFields && (
        <SectionCard
          icon={Globe}
          title="SEO Information"
          description="Search engine optimization"
          accent="from-slate-500 to-slate-700"
        >
          <div className="space-y-4">
            <InfoItem
              icon={Tag}
              label="SEO Title"
              value={course.extraFields?.seoTitle || "N/A"}
              highlight
            />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                SEO Description
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {course.extraFields?.seoDescription || "N/A"}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Meta Information */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetaCard
          label="Created At"
          value={formatDate(course.createdAt)}
          icon={CalendarDays}
          gradient="from-blue-500 to-blue-600"
        />
        <MetaCard
          label="Last Updated"
          value={formatDate(course.updatedAt)}
          icon={Clock3}
          gradient="from-purple-500 to-purple-600"
        />
        <MetaCard
          label="Enrollment Status"
          value={course.isPurchased ? "Purchased" : "Available"}
          icon={course.isPurchased ? BadgeCheck : Eye}
          gradient="from-emerald-500 to-emerald-600"
        />
      </div>
    </div>
  );
}

/* Enhanced Reusable Components */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  accent = "from-blue-500 to-indigo-600",
}: {
  icon: any;
  title: string;
  description?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent p-4 dark:border-slate-800 dark:from-slate-800/30">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className=" text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: any;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 rounded-xl p-3 transition-all duration-200 ${
        highlight
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function ListSection({
  icon: Icon,
  title,
  items,
  accent = "from-blue-500 to-indigo-600",
}: {
  icon: any;
  title: string;
  items?: string[];
  accent?: string;
}) {
  return (
    <SectionCard icon={Icon} title={title} accent={accent}>
      {items?.length ? (
        <div className="space-y-px">
          {items.map((item, index) => (
            <motion.div
              key={`${item}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              className="group/item flex items-start gap-3 rounded-xl p-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <p className="text-sm leading-6 text-slate-600 transition-colors group-hover/item:text-slate-900 dark:text-slate-300 dark:group-hover/item:text-white">
                {item}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 dark:border-slate-700">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No information available
          </p>
        </div>
      )}
    </SectionCard>
  );
}

function MetaCard({
  label,
  value,
  icon: Icon,
  gradient,
}: {
  label: string;
  value: string;
  icon: any;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
