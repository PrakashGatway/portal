import { useState, useEffect, useRef, useMemo } from "react";
import {
  Star,
  BookOpen,
  ChevronRight,
  BarChart3,
  FileText,
  Video,
  MessageCircle,
  Shield,
  Book,
  Target,
  Users2,
  Sparkles,
  Globe,
  PlayCircle,
  Zap,
  Home,
  PlayCircleIcon,
  Check,
  GraduationCap,
  ArrowUpRight,
  File,
  LinkIcon,
  ImageIcon,
  Headphones,
  Radio,
  ScreenShare,
  Lock,
  ChevronDown,
  Film,
  Play,
  Calendar,
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api, { ImageBaseUrl } from "../axiosInstance";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { SkeletonCard } from "../pages/Dashboard/userDashboard";
import CourseSupportFooter from "../components/SupportFooter";
import {
  CourseMaterials,
  CourseTests,
  TodaySessionsBanner,
} from "./CourseComponents/courseTests";
import NextLiveClassCard from "./CourseComponents/courseCard";

interface Instructor {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  rating: number;
  totalCourses: number;
}

interface CurriculumItem {
  _id: string;
  title: string;
  duration: string;
  type: "video" | "document" | "quiz" | "assignment";
  isPreview: boolean;
}

interface CurriculumSection {
  _id: string;
  title: string;
  items: CurriculumItem[];
}

interface Review {
  _id: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

interface Course {
  _id: string;
  title: string;
  subtitle: string;
  code: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string };
  rating: number;
  reviews: number;
  studentsEnrolled: number;
  duration: string;
  pricing: {
    amount: number;
    discount: number;
    originalAmount?: number;
    currency?: string;
    earlyBird?: {
      discount: number;
      deadline: string;
    };
  };
  instructorNames: string[];
  instructors: Instructor[];
  tags: string[];
  status: string;
  mode: string;
  categoryInfo: { name: string; slug: string };
  subcategoryInfo?: { name: string; slug: string };
  language: string;
  featured: boolean;
  hasInfinityPlan: boolean;
  level: string;
  schedule?: {
    startDate: string;
    endDate: string;
  };
  curriculum: CurriculumSection[];
  reviewsData: Review[];
  objectives: string[];
  requirements: string[];
  targetAudience: string[];
  faqs: { question: string; answer: string }[];
  highlights: string[];
  previewVideoUrl?: string;
}

const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
  className?: string;
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variants = {
    default:
      "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "text-foreground",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`p-[1.5px] rounded-2xl overflow-hidden w-full ${className} `}>
    <div className="relative rounded-2xl h-full  p-1.5 overflow-hidden">
      {/* Top Highlight */}
      <div className="absolute top-0 left-0 w-full h-[40%] " />
      <div className={``}>{children}</div>
    </div>
  </div>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`${className}`}>{children}</div>;

const CurriculumSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-5 bg-gray-50 dark:bg-gray-700/50">
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center p-5">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded-full mr-4 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-5/6"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");


  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isVideoCardFixed, setIsVideoCardFixed] = useState(false);
  const courseHeaderRef = useRef<HTMLDivElement>(null);
  const videoCardRef = useRef<HTMLDivElement>(null);


  const [curriculum, setCurriculum] = useState<
    { _id: string; title: string; items: any[] }[]
  >([]);
    const [openSections, setOpenSections] = useState(() => {
    return curriculum?.length ? [curriculum[0]?._id] : [];
  });
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const curriculumRef = useRef(false);

  const navigate = useNavigate();




  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${slug}`);
        setCourse(response.data.data);
      } catch (error) {
        console.error("Failed to fetch course:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);




  const [expandedLessons, setExpandedLessons] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const toggleLessons = (sectionId) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  useEffect(() => {
    if (curriculum?.length) {
      setOpenSections([curriculum[0]._id]);
    }
  }, [curriculum]);



  useEffect(() => {
    if (course && !curriculumRef.current) {
      const fetchCurriculum = async () => {
        setCurriculumLoading(true);
        try {
          const res = await api.get(`/courses/curriculum/${course._id}`);
          setCurriculum(res.data.curriculum || []);
          curriculumRef.current = true;
        } catch (err) {
          console.error("Failed to load curriculum:", err);
          setCurriculum([]);
        } finally {
          setCurriculumLoading(false);
        }
      };
      fetchCurriculum();
    }
  }, [activeTab, course]);

  useEffect(() => {
    const handleScroll = () => {
      if (!courseHeaderRef.current || !videoCardRef.current) return;

      const headerBottom =
        courseHeaderRef.current.getBoundingClientRect().bottom;
      if (headerBottom <= 0 && !isVideoCardFixed) {
        setIsVideoCardFixed(true);
      } else if (headerBottom > 0 && isVideoCardFixed) {
        setIsVideoCardFixed(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isVideoCardFixed]);

  const formatPrice = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const sessions = useMemo(() => {
    return (
      curriculum?.flatMap((section) =>
        (section.items || [])
          .filter((item: any) => {
            const type = String(item?.type || "")
              .trim()
              .toLowerCase();

            return (
              (type === "liveclasses" || type === "sessions") &&
              item?.scheduledStart
            );
          })
          .map((item: any) => ({
            ...item,
          })),
      ) || []
    );
  }, [curriculum]);

  const nextLiveClass = useMemo(() => {
    if (!sessions?.length) return null;

    const now = new Date();

    // Start and end of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Only valid upcoming/live classes
    const upcomingSessions = sessions
      .filter((session: any) => {
        const scheduledStart = new Date(session.scheduledStart);

        return !Number.isNaN(scheduledStart.getTime()) && scheduledStart >= now;
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.scheduledStart).getTime() -
          new Date(b.scheduledStart).getTime(),
      );

    if (!upcomingSessions.length) {
      return null;
    }
    const todaySession = upcomingSessions.find((session: any) => {
      const scheduledStart = new Date(session.scheduledStart);

      return scheduledStart >= startOfToday && scheduledStart <= endOfToday;
    });

    if (todaySession) {
      return todaySession;
    }
    return upcomingSessions[0];
  }, [sessions]);

  const handleItemNavigation = (item, sectionId) => {
    if (item.isLocked) return;

    const type = String(item?.type || "")
      .trim()
      .toLowerCase();

    if (type === "studymaterials") {
      if (!item?.slug) {
        console.error("Document slug is missing:", item);
        return;
      }

      navigate(`/resources/${item.slug}`);
      return;
    }
    if (type == "tests") {
      const examName = course.categoryInfo?.slug?.toLowerCase() || "";
      if (examName.includes("gmat")) navigate(`/gmat/tests/${item.test?._id}`);
      else if (examName.includes("pte"))
        navigate(`/pte/tests/${item.test?._id}`);
      else if (examName.includes("gre"))
        navigate(`/gre/tests/${item.test?._id}`);
      else navigate(`/mcq/tests/${item.test?._id}`);
      return;
    }
    if (type === "sessions") {
      if (!item?.slug) {
        console.error("Document slug is missing:", item);
        return;
      }

      navigate(`/sessions/${item.slug}`);
      return;
    }

    navigate(`/class/${item._id}/${course?._id}?module=${sectionId}`);
  };

  const getDaysRemaining = (date: string) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const realPrice = course?.pricing?.amount || 0;

  const earlyBird = course?.pricing?.earlyBird;

  const isEarlyBirdActive =
    !!earlyBird?.deadline &&
    new Date(earlyBird.deadline).getTime() > Date.now();

  let price = realPrice;

  // Apply early bird discount first
  if (isEarlyBirdActive) {
    price = price - (price * (earlyBird?.discount || 0)) / 100;
  }
  const earlyBirdDiscount = isEarlyBirdActive ? earlyBird?.discount || 0 : 0;
  // Then apply normal discount
  const normalDiscount = course?.pricing?.discount || 0;

  price = price - (price * normalDiscount) / 100;

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="p-4 space-y-6">
          <div className="flex justify-between gap-3">
            <div className="flex flex-col gap-3 w-[65%]">
              <div className="flex gap-2">
                <SkeletonCard className="w-30 h-10" />
                <SkeletonCard className="w-30 h-10" />
                <SkeletonCard className="w-30 h-10" />
                <SkeletonCard className="w-30 h-10" />
              </div>
              <SkeletonCard className="w-full h-20" />
              <SkeletonCard className="w-full h-50" />
            </div>
            <div className="flex flex-col gap-3 w-[33%]">
              <SkeletonCard className="w-full h-full" />
              <SkeletonCard className="w-full h-20" />
              <SkeletonCard className="w-full h-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <SkeletonCard className="w-30 h-10" />
            <SkeletonCard className="w-30 h-10" />
            <SkeletonCard className="w-30 h-10" />
            <SkeletonCard className="w-30 h-10" />
            <SkeletonCard className="w-30 h-10" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonCard className="h-64 lg:col-span-1" />
            <SkeletonCard className="h-64 lg:col-span-1" />
            <SkeletonCard className="h-64 lg:col-span-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Course not found
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The course you're looking for doesn't exist.
          </p>
          <Button className="mt-6" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white p-4 lg:p-6 max-w-7xl mx-auto rounded-2xl transition-colors duration-300">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-2 text-sm mb-5"
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-500 hover:text-[#FF6A3D] transition-colors"
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </button>

          <ChevronRight className="h-4 w-4 text-gray-400" />

          <button
            onClick={() => navigate("/course")}
            className="text-gray-500 hover:text-[#FF6A3D] transition-colors"
          >
            Courses
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />

          <span className="font-semibold text-[#FF6A3D] line-clamp-1">
            {course.title}
          </span>
        </nav>
        {course?.isPurchased && (
          <div className="pb-4">
            <TodaySessionsBanner
              sessions={sessions}
              onJoin={(session) => {
                handleItemNavigation(session, "");
              }}
              onCalendar={(session) => {
                console.log("Add to calendar:", session);
              }}
            />
          </div>
        )}

        <motion.div ref={courseHeaderRef} className="relative">
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Left: Course Info */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-shrink-0 w-full md:w-[310px] h-[210px] lg:h-[200px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={
                        course?.thumbnail?.url
                          ? `${ImageBaseUrl}/${course.thumbnail.url}`
                          : "https://dpcpa.com/app/uploads/2015/01/thumbnail-default.jpg"
                      }
                      className="w-full h-full object-cover"
                      alt={course?.title || "Course"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://dpcpa.com/app/uploads/2015/01/thumbnail-default.jpg";
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[#FF6A3D] mb-2 font-medium">
                      {course.categoryInfo?.name}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white leading-tight text-balance">
                      {course.title}
                    </h1>
                    <p className="text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed text-pretty">
                      {course.shortDescription}
                    </p>
                  </div>
                </div>

                {/* <div className="flex flex-wrap items-center gap-3 mb-2">
                                <Badge variant="outline" className=" px-4 py-1.5">
                                    {course.categoryInfo?.name}
                                </Badge>
                                {course.level && (
                                    <Badge variant="outline" className="px-4 py-1.5">
                                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                                    </Badge>
                                )}
                                {course.featured && (
                                    <Badge className=" border-0 px-4 py-1.5">
                                        Featured
                                    </Badge>
                                )}
                            </div> */}
                {/* Course Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                  <Card className="border  border-gray-200 bg-[#FFF7DD] dark:border-gray-700 dark:bg-gray-800/50">
                    <CardContent className="text-center p-1.5">
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        Start Date
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-px">
                        {formatDate(course.schedule?.startDate || "")}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 dark:border-gray-700 bg-[#FDF0EC]  dark:bg-gray-800/50">
                    <CardContent className="p-1.5 text-center">
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        Mode
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-px capitalize">
                        {course.mode}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 dark:border-gray-700  bg-[#FFF7DD] dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardContent className="p-1.5 text-center">
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        Language
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-px capitalize">
                        {course.language}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 dark:border-gray-700 bg-[#FDF0EC]  dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardContent className="p-1.5 text-center">
                      <p className="text-lg font-semibold text-gray-800 dark:text-white">
                        Validity
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-px">
                        24 Month
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mb-8">
                  <nav className="border-b border-gray-200 dark:border-gray-700">
                    <LayoutGroup>
                      <div className="flex items-center gap-3 scrollbar-hide no-scrollbar overflow-x-auto overflow-y-hidden">
                        {[
                          { id: "overview", label: "Overview" },
                          { id: "curriculum", label: "Curriculum" },
                          { id: "materials", label: "Materials" },
                          { id: "tests", label: "Tests" },
                          // { id: "instructors", label: "Instructors" },
                          // { id: "faq", label: "FAQ" },
                        ].map((tab) => {
                          const isActive = activeTab === tab.id;

                          return (
                            <motion.button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);

                                setSearchParams((prev) => {
                                  prev.set("tab", tab.id);
                                  return prev;
                                });
                              }}
                              className={`
                relative shrink-0
                px-2 pb-3 pt-1
                text-[16px] font-medium
                transition-colors duration-200
                ${isActive
                                  ? "text-orange-700 dark:text-orange-500"
                                  : "text-gray-800 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300"
                                }
              `}
                              whileHover={{ y: -1 }}
                              whileTap={{ y: 0 }}
                            >
                              {tab.label}

                              {isActive && (
                                <motion.div
                                  layoutId="activeTab"
                                  className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-t-full bg-orange-500"
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                  }}
                                />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </LayoutGroup>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="prose prose-blue dark:prose-invert max-w-none">
                  {activeTab === "overview" && (
                    <div className="space-y-4 font-medium">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                          Course Description
                        </h2>
                        <div
                          className="text-gray-800 dark:text-gray-300 whitespace-pre-line leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: course.description,
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                          What You'll Learn
                        </h3>
                        <ul className="space-y-3">
                          {course.objectives?.map((objective, index) => (
                            <li key={index} className="flex items-start">
                              <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 bg-white flex-shrink-0 border border-gray-500 rounded-full p-px" />
                              <span className="text-gray-800 dark:text-gray-300">
                                {objective}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                          Course Highlights
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {course.features?.map((highlight, index) => (
                            <div
                              key={index}
                              className="flex items-start p-3 bg-zinc-100 dark:bg-gray-800 rounded-2xl"
                            >
                              <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 bg-white flex-shrink-0 border border-gray-500 rounded-full p-px" />
                              <span className="text-gray-800 dark:text-gray-300">
                                {highlight}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            Requirements
                          </h3>
                          <ul className="space-y-3 text-gray-800 dark:text-gray-300 list-disc">
                            {course.requirements?.map((requirement, index) => (
                              <li key={index} className="flex items-center">
                                <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0 border border-gray-500 rounded-full p-px" />
                                <span className="text-gray-800 dark:text-gray-300">
                                  {requirement}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            Who This Course Is For
                          </h3>
                          <ul className="space-y-3">
                            {course.targetAudience?.map((audience, index) => (
                              <li key={index} className="flex items-start">
                                <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 bg-white flex-shrink-0 border border-gray-500 rounded-full p-px" />
                                <span className="text-gray-800 dark:text-gray-300">
                                  {audience}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "curriculum" && (
                    <div className="space-y-3">
                      {curriculumLoading ? (
                        <CurriculumSkeleton />
                      ) : (
                        <>
                          <div className="space-y-3">
                            {curriculum?.map((section, sectionIndex) => {
                              const isOpen = openSections.includes(section._id);

                              const lessons =
                                section.items?.filter(
                                  (item) =>
                                    item.type !== "StudyMaterials" &&
                                    item.type !== "Tests",
                                ) || [];

                              const isLessonsExpanded =
                                expandedLessons[section._id] || false;

                              const visibleLessons = isLessonsExpanded
                                ? lessons
                                : lessons.slice(0, 5);

                              return (
                                <div
                                  key={section._id}
                                  className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#ffded5]
                  transition-all
                  duration-300
                "
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleSection(section._id)}
                                    className="
                    group
                    relative
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-3
                    bg-[#fef7dd]
                    p-2
                    px-4
                    text-left
                    transition-all
                    duration-300
                    hover:bg-[#FCE3D2]
                  "
                                  >
                                    {/* LEFT SIDE */}
                                    <div className="flex min-w-0 items-center gap-4">
                                      {/* SECTION NUMBER */}
                                      <div
                                        className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        border-r
                        border-[#EAB9A5]
                        pr-4
                        text-base
                        font-medium
                        text-[#F04F23]
                        sm:h-12
                        sm:w-12
                      "
                                      >
                                        <span className="bg-[#FF7147] px-2 py-1 text-white rounded-lg">
                                          {String(sectionIndex + 1).padStart(
                                            2,
                                            "0",
                                          )}
                                        </span>
                                      </div>

                                      {/* TITLE */}
                                      <div className="min-w-0">
                                        <h3
                                          className="
                          truncate
                          text-base
                          font-semibold
                          text-[#111827]
                          sm:text-base
                        "
                                        >
                                          {section.title}
                                        </h3>

                                        <div
                                          className="
                          flex
                          items-center
                          gap-2
                          text-xs
                          font-medium
                          text-[#8B6F61]
                          sm:text-xs
                        "
                                        >
                                          <span>{lessons.length} Lessons</span>

                                          <span className="text-[#C5A99B]">
                                            •
                                          </span>

                                          <span>Course Section</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* RIGHT SIDE */}
                                    <div className="flex shrink-0 items-center gap-3">
                                      {/* LESSON COUNT */}
                                      <div
                                        className="
                        hidden
                        rounded-full
                        border
                        border-[#EBC5B3]
                        bg-[#FF7147] px-2 py-1 text-white
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        sm:block
                      "
                                      >
                                        {lessons.length} Lessons
                                      </div>

                                      {/* CHEVRON */}
                                      <div
                                        className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        transition-all
                        duration-300
                      "
                                      >
                                        <ChevronDown
                                          className={`
                          h-5
                          w-5
                          text-[#F04F23]
                          transition-transform
                          duration-300
                          ${isOpen ? "rotate-180" : ""}
                        `}
                                        />
                                      </div>
                                    </div>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {isOpen && (
                                      <motion.div
                                        initial={{
                                          height: 0,
                                          opacity: 0,
                                        }}
                                        animate={{
                                          height: "auto",
                                          opacity: 1,
                                        }}
                                        exit={{
                                          height: 0,
                                          opacity: 0,
                                        }}
                                        transition={{
                                          duration: 0.3,
                                          ease: "easeInOut",
                                        }}
                                        className="overflow-hidden"
                                      >
                                        <div className="bg-white px-4 pb-2">
                                          <div className="relative">
                                            <div className="relative">
                                              {visibleLessons.map(
                                                (item, itemIndex) => {
                                                  const isCompleted =
                                                    item.isCompleted === true;

                                                  const isCurrent =
                                                    item.isCurrent === true ||
                                                    (!isCompleted &&
                                                      itemIndex === 0);

                                                  return (
                                                    <div
                                                      key={item._id}
                                                      className="
                                      group/lesson
                                      relative
                                      flex
                                      items-center
                                      gap-3
                                      border-b
                                      border-[#ffded5]
                                      py-3
                                      last:border-b-0
                                      sm:gap-4
                                    "
                                                    >
                                                      <div
                                                        className="
                                relative
                                h-[58px]
                                w-[90px]
                                shrink-0
                                overflow-hidden
                                rounded-xl
                                bg-[#F5ECE7]
                                sm:h-[70px]
                                sm:w-[120px]
                              "
                                                      >
                                                        <img
                                                          src={`${ImageBaseUrl}/${item.thumbnailPic}`}
                                                          alt={item.title}
                                                          loading="lazy"
                                                          onError={(e) => {
                                                            e.currentTarget.src =
                                                              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzZItwLsuYvbDFTqu2u1MmCBR3dT1X0DAEWwXgo88c4FW8_WArEm7TQFFP&s=10";
                                                          }}
                                                          className="
    h-full
    w-full
    object-cover
    transition-transform
    duration-300
  "
                                                        />
                                                      </div>

                                                      <div
                                                        className={`
                                        min-w-0
                                        flex-1
                                        ${item.isLocked
                                                            ? "cursor-not-allowed opacity-50"
                                                            : "cursor-pointer"
                                                          }
                                      `}
                                                        onClick={() => {
                                                          if (!item.isLocked) {
                                                            handleItemNavigation(
                                                              item,
                                                              section._id,
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        <h4
                                                          className={`
                                          truncate
                                          text-sm
                                          font-semibold
                                          transition-colors
                                          sm:text-base
                                          hover:text-[#F04F23]
                                          ${item.isLocked
                                                              ? "text-[#B9B0AC]"
                                                              : isCurrent
                                                                ? "text-[#111827]"
                                                                : "text-[#111827] group-hover/lesson:text-[#F04F23]"
                                                            }
                                        `}
                                                        >
                                                          {item.title}
                                                        </h4>

                                                        {/* TYPE + DURATION */}

                                                        <div
                                                          className="
                                          mt-1
                                          flex
                                          flex-wrap
                                          items-center
                                          gap-2
                                          text-xs
                                          text-[#9B8277]
                                          sm:text-sm
                                        "
                                                        >
                                                          <span
                                                            className={
                                                              isCurrent
                                                                ? "font-medium text-[#F04F23]"
                                                                : ""
                                                            }
                                                          >
                                                            {item.type ===
                                                              "LiveClasses"
                                                              ? "Live Class"
                                                              : item.type ===
                                                                "RecordedClasses"
                                                                ? "Recorded Class"
                                                                : item.type ===
                                                                  "Sessions"
                                                                  ? "1:1 Session"
                                                                  : item.materialType ||
                                                                  item.type}
                                                          </span>

                                                          {item.duration && (
                                                            <>
                                                              <span className="text-[#D8C5BC]">
                                                                •
                                                              </span>

                                                              <span>
                                                                {item.duration}
                                                              </span>
                                                            </>
                                                          )}
                                                          {item.scheduledStart && (
                                                            <>
                                                              <span className="text-[#D8C5BC]">
                                                                •
                                                              </span>
                                                              <span>
                                                                {new Date(
                                                                  item.scheduledStart,
                                                                ).toLocaleDateString(
                                                                  "en-IN",
                                                                  {
                                                                    day: "2-digit",
                                                                    month:
                                                                      "short",
                                                                    year: "numeric",
                                                                  },
                                                                )}{" "}
                                                                <span className="ps-3">
                                                                  {new Date(
                                                                    item.scheduledStart,
                                                                  ).toLocaleTimeString(
                                                                    "en-IN",
                                                                    {
                                                                      hour: "2-digit",
                                                                      minute:
                                                                        "2-digit",
                                                                      hour12: true,
                                                                    },
                                                                  )}
                                                                </span>
                                                              </span>
                                                            </>
                                                          )}
                                                        </div>
                                                      </div>

                                                      {/* ================================= */}
                                                      {/* ACTION */}
                                                      {/* ================================= */}

                                                      <div className="shrink-0">
                                                        {item.isLocked ? (
                                                          <Button
                                                            type="button"
                                                            disabled
                                                            variant="outline"
                                                            size="sm"
                                                            className="
                                            hidden
                                            rounded-full
                                            border-[#E8E0DC]
                                            bg-[#FAF8F7]
                                            px-4
                                            text-[#B5AAA5]
                                            sm:inline-flex
                                          "
                                                          >
                                                            <Lock className="mr-1.5 h-3.5 w-3.5" />
                                                            Locked
                                                          </Button>
                                                        ) : (
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              handleItemNavigation(
                                                                item,
                                                                section._id,
                                                              )
                                                            }
                                                            className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-full
                                            bg-[#FAF7F5]
                                            text-[#9B8A82]
                                            transition-all
                                            hover:bg-[#FFF0E9]
                                            hover:text-[#F4511E]
                                          "
                                                          >
                                                            <ChevronRight className="h-4 w-4" />
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>

                                          {/* ======================================= */}
                                          {/* VIEW ALL LESSONS */}
                                          {/* ======================================= */}

                                          {lessons.length > 5 && (
                                            <div className="border-t border-[#F1E7E2]">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  toggleLessons(section._id)
                                                }
                                                className="
                                flex
                                w-full
                                items-center
                                justify-center
                                gap-2
                                py-4
                                text-sm
                                font-semibold
                                text-[#F4511E]
                                transition-colors
                                hover:text-[#D93F0D]
                              "
                                              >
                                                {isLessonsExpanded
                                                  ? "Show less"
                                                  : `View all ${lessons.length} lessons`}

                                                <ChevronDown
                                                  className={`
                                  h-4
                                  w-4
                                  transition-transform
                                  duration-200
                                  ${isLessonsExpanded ? "rotate-180" : ""}
                                `}
                                                />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>

                          {/* ============================================= */}
                          {/* BOTTOM MESSAGE */}
                          {/* ============================================= */}

                          <div
                            className="
            rounded-2xl
            border
            border-[#F2DDD4]
            bg-[#FFF9F6]
            px-5
            py-5
            text-center
            sm:px-6
          "
                          >
                            <div
                              className="
              mx-auto
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              bg-[#FFE9DF]
              text-[#F4511E]
            "
                            >
                              <PlayCircle className="h-5 w-5" />
                            </div>

                            <h3 className="mt-3 text-sm font-bold text-[#172033] sm:text-base">
                              Keep your learning journey going
                            </h3>

                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                              Choose any available lesson and continue learning.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "materials" && curriculum && (
                    <CourseMaterials
                      curriculum={ curriculum && curriculum}
                      loading={ curriculumLoading && curriculumLoading}
                      onItemClick={handleItemNavigation}
                    />
                  )}
                  {activeTab === "tests" && (
                    <CourseTests
                      course={course}
                      curriculum={curriculum}
                      loading={curriculumLoading}
                      onItemClick={handleItemNavigation}
                    />
                  )}

                  {activeTab === "instructors" && (
                    <div className="space-y-8">
                      {/* Section Header */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="h-1 w-8 rounded-full bg-[#F26738]" />
                            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F26738]">
                              Our Faculty
                            </span>
                          </div>

                          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
                            Meet Your Instructors
                          </h2>

                          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                            Learn from experienced educators and industry
                            professionals dedicated to helping you achieve your
                            academic goals.
                          </p>
                        </div>

                        {/* Instructor Count */}
                        <div className="flex w-fit items-center gap-2 rounded-full border border-[#F6D7CA] bg-[#FFF7F3] px-3 py-1.5">
                          <div className="flex -space-x-2">
                            {course.instructorNames
                              ?.slice(0, 3)
                              .map((instructor, index) => (
                                <div
                                  key={instructor._id || index}
                                  className="h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-orange-200"
                                >
                                  <img
                                    src={
                                      instructor.profilePic
                                        ? `https://res.cloudinary.com/dd5s7qpsc/image/upload/${instructor.profilePic}`
                                        : "https://cdn-icons-png.flaticon.com/512/10337/10337609.png"
                                    }
                                    alt={
                                      instructor.name ||
                                      instructor.email ||
                                      "Instructor"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                          </div>

                          <span className="text-xs font-semibold text-[#D95327]">
                            {course.instructorNames?.length || 0} Instructors
                          </span>
                        </div>
                      </div>

                      {/* Instructor Cards */}
                      <div className="grid grid-cols-1 gap-4">
                        {course.instructorNames?.map((instructor) => (
                          <div
                            key={instructor._id}
                            className="
        group relative overflow-hidden
        rounded-2xl
        border border-gray-800
        bg-white
        shadow-[0_3px_15px_rgba(0,0,0,0.04)]
        transition-all duration-300
      
        hover:shadow-[0_8px_25px_rgba(242,103,56,0.10)]
      "
                          >
                            {/* Orange Accent */}

                            <div className="flex items-center gap-4 p-4 sm:p-5">
                              {/* Profile Image */}
                              <div className="relative shrink-0">
                                <div
                                  className="
              h-[64px] w-[64px]
              overflow-hidden rounded-xl
              border-2 border-[#FFF1EB]
              bg-[#FFF1EB]
              shadow-[0_4px_12px_rgba(242,103,56,0.12)]
            "
                                >
                                  <img
                                    src={
                                      instructor.profilePic
                                        ? `https://res.cloudinary.com/dd5s7qpsc/image/upload/${instructor.profilePic}`
                                        : "https://cdn-icons-png.flaticon.com/512/10337/10337609.png"
                                    }
                                    alt={
                                      instructor.name ||
                                      instructor.email ||
                                      "Instructor"
                                    }
                                    className="
                h-full w-full object-cover
                
              "
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://cdn-icons-png.flaticon.com/512/10337/10337609.png";
                                    }}
                                  />
                                </div>

                                {/* Active Indicator */}
                                <span
                                  className="
              absolute -bottom-1 -right-1
              flex h-5 w-5 items-center justify-center
              rounded-full
              border-[3px] border-white
              bg-[#22C55E]
            "
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                </span>
                              </div>

                              {/* Instructor Info */}
                              <div className="min-w-0 flex-1">
                                <h3
                                  className="
              truncate
              text-base
              font-bold
              text-gray-900
              transition-colors
              group-hover:text-[#F26738]
            "
                                >
                                  {instructor.name || "Expert Instructor"}
                                </h3>

                                <p className="mt-0.5 truncate text-xs text-gray-500">
                                  {instructor.email ||
                                    "Education & Academic Expert"}
                                </p>

                                {/* Rating */}
                                <div className="mt-2 flex items-center gap-2">
                                  <div
                                    className="
                flex items-center gap-1
                rounded-full
                bg-[#FFF5F0]
                px-2 py-1
              "
                                  >
                                    <Star
                                      size={11}
                                      strokeWidth={2}
                                      className="fill-[#F5A623] text-[#F5A623]"
                                    />

                                    <span className="text-[10px] font-bold text-[#D95327]">
                                      4.9
                                    </span>
                                  </div>

                                  <span className="text-[10px] text-gray-400">
                                    5+ Courses
                                  </span>
                                </div>
                              </div>

                              {/* Experience */}
                              <div
                                className="
            hidden
            min-w-0
            flex-1
            border-l
            border-[#EEEAE7]
            pl-5
            md:block
          "
                              >
                                {instructor.experience?.length > 0 ? (
                                  <div>
                                    <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-[#F26738]">
                                      Experience
                                    </p>

                                    <p className="line-clamp-2 text-xs leading-5 text-gray-500">
                                      {instructor.experience
                                        .map((item) =>
                                          typeof item === "string"
                                            ? item
                                            : item?.designation ||
                                            item?.title ||
                                            item?.companyName ||
                                            "",
                                        )
                                        .filter(Boolean)
                                        .join(" • ")}
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="mb-1 text-sm font-medium uppercase tracking-wide text-[#F26738]">
                                      Faculty
                                    </p>

                                    <p className="line-clamp-2 text-xs leading-5 text-gray-400">
                                      Experienced educator dedicated to helping
                                      students achieve their academic goals.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Teaching */}
                              <div className="hidden shrink-0 items-center gap-2 lg:flex">
                                <div
                                  className="
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              bg-[#FFF1EB]
              text-[#F26738]
            "
                                >
                                  <GraduationCap size={16} strokeWidth={1.8} />
                                </div>

                                <div>
                                  <p className="text-sm text-gray-400">
                                    Teaching
                                  </p>

                                  <p className="text-[11px] font-semibold text-gray-800">
                                    Expert Faculty
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Empty State */}
                      {!course.instructorNames?.length && (
                        <div className="rounded-2xl border border-dashed border-[#E5E1DE] bg-[#FFFCFA] py-12 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1EB] text-[#F26738]">
                            <GraduationCap size={22} />
                          </div>

                          <h3 className="mt-4 text-sm font-semibold text-gray-800">
                            No instructors available
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            Instructor information will appear here once
                            available.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-6 mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-1">
                    {[
                      {
                        question: "What do your study abroad courses include?",
                        answer:
                          "Our courses cover everything from English language prep, IELTS/TOEFL training, and subject-specific coaching to application guidance, interview prep, and cultural orientation.",
                      },
                      {
                        question: "Are these courses suitable for beginners?",
                        answer:
                          "Yes! Whether you’re just starting or already advanced, we have beginner, intermediate, and advanced-level courses tailored to your needs.",
                      },
                      {
                        question:
                          "How do these courses help with my study abroad application?",
                        answer:
                          "We focus on strengthening your academic profile, language skills, and test performance so that you can meet admission requirements at top universities abroad.",
                      },
                      {
                        question:
                          "Do you provide guidance for visa and admissions along with courses?",
                        answer:
                          "Absolutely. Along with coaching, we guide you through application essays, SOPs, LORs, and visa interview preparation.",
                      },
                      {
                        question:
                          "Are the courses conducted online or offline?",
                        answer:
                          "We offer both flexible online classes and offline sessions (depending on your location). You can choose what fits you best.",
                      },
                      {
                        question:
                          "What makes your study abroad courses different from others?",
                        answer:
                          "Our trainers have years of experience helping students secure admissions abroad. We provide personalized feedback, mock tests, and one-on-one mentoring.",
                      },
                      {
                        question: "How long does it take to complete a course?",
                        answer:
                          "Course duration ranges from 4 weeks to 6 months, depending on the program and your target university requirements.",
                      },
                      {
                        question:
                          "Will these courses improve my chances of getting scholarships?",
                        answer:
                          "Yes, stronger academic and language skills increase your chances of securing merit-based scholarships abroad.",
                      },
                      {
                        question:
                          "Do you provide practice tests and study materials?",
                        answer:
                          "Yes, we provide updated study guides, sample papers, mock exams, and practice sessions for standardized tests like IELTS, TOEFL, GRE, and GMAT.",
                      },
                      {
                        question: "How do I enroll in a course?",
                        answer:
                          "Simply click on the “Enroll Now” button, fill in your details, and our team will contact you with the next steps.",
                      },
                    ]?.map((faq, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedFaq(expandedFaq === index ? null : index)
                          }
                          className="flex justify-between items-center w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {faq.question}
                          </h3>
                          <ChevronRight
                            className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === index ? "rotate-90" : ""
                              }`}
                          />
                        </button>
                        {expandedFaq === index && (
                          <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                ref={videoCardRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-3"
              >
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="sticky top-20"
                >
                  <div className="p-[1.3px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
                    <div className="relative rounded-2xl h-full bg-white p-2 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />
                      <div
                        style={{ borderRadius: "15px 15px 0px 0px" }}
                        className="relative overflow-hidden h-[180px]"
                      >
                        <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                          {course?.preview?.url ? (
                            (() => {
                              const url = course.preview.url;
                              let embedUrl = "";
                              if (
                                url.includes("youtube.com") ||
                                url.includes("youtu.be")
                              ) {
                                const regExp =
                                  /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                const match = url.match(regExp);
                                const videoId =
                                  match?.[2]?.length === 11 ? match[2] : null;
                                if (videoId) {
                                  embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&controls=1`;
                                }
                              }
                              // Vimeo
                              else if (url.includes("vimeo.com")) {
                                const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/;
                                const match = url.match(regExp);
                                const videoId = match?.[1];
                                if (videoId) {
                                  embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=0&muted=0&controls=1`;
                                }
                              }

                              if (embedUrl) {
                                return (
                                  <iframe
                                    src={embedUrl}
                                    title="Course Preview"
                                    className="w-full h-full absolute inset-0"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                );
                              }

                              return (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                  <div className="text-center">
                                    <PlayCircleIcon className="h-15 w-15 text-gray-400 stroke-1 mx-auto mb-3" />
                                    <p className="text-base text-gray-600 font-medium dark:text-gray-400">
                                      No preview available
                                    </p>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                              <div className="text-center">
                                <PlayCircleIcon className="h-15 w-15 text-gray-400 stroke-1 mx-auto mb-3" />
                                <p className="text-base text-gray-600 font-medium dark:text-gray-400">
                                  No preview available
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-2 py-2 space-y-2">
                        <h2 className="text-lg font-semibold text-gray-800">
                          <span className="text-[#F26738]">
                            {course.title.split(" ")[0]}
                          </span>
                          <span className="">
                            {" "}
                            {course.title.split(" ").slice(1).join(" ")}
                          </span>
                        </h2>
                        <div className="mt-2 space-y-2 text-gray-600 dark:text-white">
                          <div className="flex items-center gap-3 text-base">
                            <Radio size={20} className="text-[#FF6736]" />
                            <span className="text-sm"> {course?.mode}</span>
                          </div>

                          <div className="flex items-center gap-3 text-base ">
                            <Calendar size={20} className="text-[#FF6736]" />
                            <span className="text-sm">
                              Starts on{" "}
                              {new Date(
                                course?.schedule?.startDate,
                              ).toLocaleDateString("en-GB")}
                            </span>
                          </div>
                        </div>

                        {course?.isPurchased == false && (
                          <div className="mt-2 flex justify-between items-end">
                            <div>
                              <div className="flex items-center gap-1  dark:text-white">
                                {course?.pricing?.currency}
                                <span className="text-base font-bold"></span>

                                <span className="text-2xl font-bold ">
                                  {price}
                                </span>

                                <span className="line-through text-gray-400 text-base dark:text-white">
                                  {course?.pricing?.amount}{" "}
                                  {course?.pricing?.currency}
                                </span>
                                {normalDiscount > 0 && earlyBirdDiscount > 0 ? (
                                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-sm font-semibold text-green-600">
                                    {normalDiscount}%
                                    <span className="text-xs font-medium">
                                      {" + "}
                                      {earlyBirdDiscount}%
                                    </span>
                                    <span className="text-xs font-medium">
                                      {" "}
                                      OFF
                                    </span>
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600">
                                    {normalDiscount}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>)}
                        <div className="mt-0 flex justify-end">
                          {course?.isPurchased === true ? null : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/checkout/${course?.slug}`);
                              }}
                              className="border border-[#FF6736] rounded-2xl px-5 py-2 text-[#FF6736] text-sm font-medium hover:bg-[#FF6736] hover:text-white transition-all duration-300 whitespace-nowrap"
                            >
                              Enroll Now
                            </button>
                          )}
                        </div>
                        {course?.isPurchased == false && (
                          <div className="">
                            <div
                              className="
        flex
        p-2
        w-full
        items-center
        gap-[6px]
        rounded-full
        bg-[#FFE8D5]
        px-[8px]
      "
                            >
                              <span
                                className="
          flex
          h-[20px]
          shrink-0
          items-center
          rounded-full
          bg-[#FF7048]
          px-[8px]
          text-xs
          font-semibold
          leading-none
          text-white
        "
                              >
                                Ooshas Prep
                              </span>

                              <span
                                className="
          text-xs
          font-medium
          leading-none
          text-[#4F4F4F]
        "
                              >
                                Limited Time Offer
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {course?.isPurchased && nextLiveClass && (
                    <div className="pb-4 mt-3">
                      <NextLiveClassCard
                        session={nextLiveClass}
                        onContinue={(session) => {
                          handleItemNavigation(session, "");
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      <CourseSupportFooter />
    </>
  );
}
