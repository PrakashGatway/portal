import { useState, useEffect, useRef } from "react"
import {
    Star,
    Users,
    Clock,
    Calendar,
    BookOpen,
    MapPin,
    Award,
    Download,
    Play,
    CheckCircle,
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
} from "lucide-react"
import Button from "../components/ui/button/Button"
import api, { ImageBaseUrl } from "../axiosInstance"
import { useNavigate, useParams } from "react-router"
import { motion, LayoutGroup } from "framer-motion"
import { SkeletonCard } from "../pages/Dashboard/userDashboard"
import CourseSupportFooter from "../components/SupportFooter"


interface Instructor {
    _id: string
    name: string
    email: string
    bio?: string
    avatar?: string
    rating: number
    totalCourses: number
}

interface CurriculumItem {
    _id: string
    title: string
    duration: string
    type: "video" | "document" | "quiz" | "assignment"
    isPreview: boolean
}

interface CurriculumSection {
    _id: string
    title: string
    items: CurriculumItem[]
}

interface Review {
    _id: string
    user: {
        name: string
        avatar?: string
    }
    rating: number
    comment: string
    date: string
    helpful: number
}

interface Course {
    _id: string
    title: string
    subtitle: string
    code: string
    slug: string
    description: string
    shortDescription: string
    thumbnail: { url: string }
    rating: number
    reviews: number
    studentsEnrolled: number
    duration: string
    pricing: {
        amount: number;
        discount: number;
        originalAmount?: number;
        currency?: string;
        earlyBird?: {
            discount: number;
            deadline: string;
        }
    }
    instructorNames: string[]
    instructors: Instructor[]
    tags: string[]
    status: string
    mode: string
    categoryInfo: { name: string; slug: string }
    subcategoryInfo?: { name: string; slug: string }
    language: string
    featured: boolean
    hasInfinityPlan: boolean
    level: string
    schedule?: {
        startDate: string
        endDate: string
    }
    curriculum: CurriculumSection[]
    reviewsData: Review[]
    objectives: string[]
    requirements: string[]
    targetAudience: string[]
    faqs: { question: string; answer: string }[]
    highlights: string[]
    previewVideoUrl?: string
}

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode
    variant?: "default" | "secondary" | "outline"
    className?: string
}) => {
    const baseClasses =
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",
    }

    return <div className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</div>
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
        <div className="relative rounded-2xl h-full bg-white p-1.5 overflow-hidden">

            {/* Top Highlight */}
            <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />
            <div className={``}>{children}</div>
        </div>
    </div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`${className}`}>{children}</div>
)

const CurriculumSkeleton = () => {
    return (
        <div className="space-y-6">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
    const { slug } = useParams<{ slug: string }>()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
    const [isVideoCardFixed, setIsVideoCardFixed] = useState(false)
    const courseHeaderRef = useRef<HTMLDivElement>(null)
    const videoCardRef = useRef<HTMLDivElement>(null)
    const [curriculum, setCurriculum] = useState<{ _id: string; title: string; items: any[] }[]>([]);
    const [curriculumLoading, setCurriculumLoading] = useState(false);
    const curriculumRef = useRef(false); // to ensure fetch only once

    const navigate = useNavigate()

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${slug}`)
                setCourse(response.data.data)
            } catch (error) {
                console.error("Failed to fetch course:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchCourse()
    }, [slug])

    useEffect(() => {
        if (activeTab === "curriculum" && course && !curriculumRef.current) {
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
            if (!courseHeaderRef.current || !videoCardRef.current) return

            const headerBottom = courseHeaderRef.current.getBoundingClientRect().bottom
            if (headerBottom <= 0 && !isVideoCardFixed) {
                setIsVideoCardFixed(true)
            } else if (headerBottom > 0 && isVideoCardFixed) {
                setIsVideoCardFixed(false)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [isVideoCardFixed])

    const formatPrice = (amount: number, currency = "INR") => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getDaysRemaining = (date: string) => {
        const today = new Date();
        const targetDate = new Date(date);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Calculate pricing
    const discountPercent =
        course?.pricing.earlyBird?.discount && new Date() < new Date(course.pricing.earlyBird.deadline)
            ? course.pricing.earlyBird.discount
            : course?.pricing.discount || 0
    const isEarlyBirdActive =
        course?.pricing.earlyBird?.discount && new Date() < new Date(course.pricing.earlyBird.deadline)
    const originalPrice = course?.pricing.originalAmount || course?.pricing.amount || 0
    const finalPrice = discountPercent > 0
        ? originalPrice * (1 - discountPercent / 100)
        : originalPrice

    if (loading) {
        return <div className="min-h-screen">
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
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Course not found</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">The course you're looking for doesn't exist.</p>
                    <Button className="mt-6" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        )
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
                <motion.div
                    ref={courseHeaderRef}
                    className="relative"
                >

                    <div className="relative">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                            {/* Left: Course Info */}
                            <div className="lg:col-span-4 space-y-4">

                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold text-gray-700 dark:text-white leading-tight text-balance">
                                        {course.title}
                                    </h1>
                                    <p className="text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed text-pretty">
                                        {course.shortDescription}
                                    </p>
                                    <p className="text-base font-medium text-gray-600 dark:text-gray-400 leading-relaxed text-pretty">
                                        {course.description}
                                    </p>
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
                                    <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
                                        <CardContent className="text-center p-2">
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white">Start Date</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {formatDate(course.schedule?.startDate || "")}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border border-gray-200 dark:border-gray-700  dark:bg-gray-800/50">
                                        <CardContent className="p-2 text-center">
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white">Mode</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">
                                                {course.mode}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border border-gray-200 dark:border-gray-700  dark:bg-gray-800/50 backdrop-blur-sm">
                                        <CardContent className="p-2 text-center">
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white">Language</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">
                                                {course.language}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border border-gray-200 dark:border-gray-700  dark:bg-gray-800/50 backdrop-blur-sm">
                                        <CardContent className="p-2 text-center">
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white">Validity</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                2 year
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="mb-8">
                                    <nav className="relative">
                                        <LayoutGroup>
                                            <div className="flex flex-wrap gap-2 bg-zinc-200 dark:bg-gray-800 rounded-xl p-1">
                                                {[
                                                    { id: "overview", label: "Overview", icon: BookOpen },
                                                    { id: "curriculum", label: "Curriculum", icon: Book },
                                                    { id: "instructors", label: "Instructors", icon: Users2 },
                                                    { id: "faq", label: "FAQ", icon: MessageCircle }
                                                ].map((tab) => {
                                                    const IconComponent = tab.icon;
                                                    return (
                                                        <motion.button
                                                            key={tab.id}
                                                            layout
                                                            onClick={() => setActiveTab(tab.id)}
                                                            className={`relative py-2.5 px-4 font-semibold text-sm flex items-center rounded-lg transition-all duration-200
                                                        ${activeTab === tab.id
                                                                    ? "text-gray-600 font-semibold bg-white shadow-sm dark:bg-gray-900 dark:text-blue-400"
                                                                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                                                }`}
                                                            whileHover={{ y: -1 }}
                                                            whileTap={{ y: 0 }}
                                                        >
                                                            {activeTab === tab.id && (
                                                                <motion.div
                                                                    layoutId="tabBackground"
                                                                    className="absolute inset-0 bg-white dark:bg-gray-900 rounded-lg shadow-sm -z-10"
                                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                                />
                                                            )}
                                                            <IconComponent className="h-4 w-4 mr-2" />
                                                            {tab.label}
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
                                                <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Course Description</h2>
                                                <div
                                                    className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: course.description }}
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">What You'll Learn</h3>
                                                <ul className="space-y-3">
                                                    {course.objectives?.map((objective, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 bg-white flex-shrink-0 border border-gray-500 rounded-full p-px" />
                                                            <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Course Highlights</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {course.features?.map((highlight, index) => (
                                                        <div key={index} className="flex items-start p-3 bg-zinc-100 dark:bg-gray-800 rounded-2xl">
                                                            <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 bg-white flex-shrink-0 border border-gray-500 rounded-full p-px" />
                                                            <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Requirements</h3>
                                                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 list-disc">
                                                        {course.requirements?.map((requirement, index) => (
                                                            <li key={index} className="flex items-center">
                                                                <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0 border border-gray-500 rounded-full p-px" />
                                                                <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Who This Course Is For</h3>
                                                    <ul className="space-y-3">
                                                        {course.targetAudience?.map((audience, index) => (
                                                            <li key={index} className="flex items-start">
                                                                <ChevronRight className="h-5 w-5 text-gray-500 mt-0.5 mr-3 bg-white flex-shrink-0 border border-gray-500 rounded-full p-px" />
                                                                <span className="text-gray-700 dark:text-gray-300">{audience}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === "curriculum" && (
                                        <div className="space-y-4">
                                            <h2 className="text-xl font-bold text-gray-700 dark:text-white">Course Curriculum</h2>

                                            {curriculumLoading ? (
                                                <CurriculumSkeleton />
                                            ) : (
                                                <>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                        {curriculum.length || 0} sections •{' '}
                                                        {curriculum.reduce((acc, section) => acc + section.items.length, 0) || 0} lectures
                                                    </p>

                                                    <div className="space-y-2">
                                                        {curriculum.map((section, sectionIndex) => (
                                                            <div
                                                                key={section._id}
                                                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
                                                            >
                                                                <div className="flex items-center justify-between p-4 bg-[#FF9A86] dark:bg-gray-700/50">
                                                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                                                        Section {sectionIndex + 1}: {section.title}
                                                                    </h3>
                                                                    <span className="text-base text-gray-800 dark:text-gray-400">
                                                                        {section.items.length} lectures
                                                                    </span>
                                                                </div>
                                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                    {section.items.map((item) => (
                                                                        <div
                                                                            key={item._id}
                                                                            className="flex items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                                        >
                                                                            <div className="flex items-center mr-4 mt-1">
                                                                                {item.type === "video" && <Video className="h-7 w-7 stroke-[1.4px] text-[#F36E45]" />}
                                                                                {item.type === "document" && <FileText className="h-5 w-5 text-green-500" />}
                                                                                {item.type === "quiz" && <BarChart3 className="h-5 w-5 text-purple-500" />}
                                                                                {item.type === "assignment" && <Download className="h-5 w-5 text-orange-500" />}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.duration}</div>
                                                                            </div>
                                                                            {item.isPreview && !item.isLocked && (
                                                                                <Button onClick={() =>
                                                                                    navigate(
                                                                                        `/class/${item._id}/${course?._id}?module=${section._id}`
                                                                                    )
                                                                                } variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                                                                                    Preview
                                                                                </Button>
                                                                            )}
                                                                            {item.isLocked && (
                                                                                <Button disabled size="sm" variant="outline" className="text-gray-400 cursor-not-allowed">
                                                                                    Locked
                                                                                </Button>
                                                                            ) }
                                                                            {/* {item.isPreview && !item.isLocked && (
                                                                                <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                                                                                    Preview
                                                                                </Button>
                                                                            )}
                                                                            {item.isLocked ? (
                                                                                <Button disabled size="sm" variant="outline" className="text-gray-400 cursor-not-allowed">
                                                                                    Locked
                                                                                </Button>
                                                                            ) : (
                                                                                <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                                                                            )} */}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === "instructors" && (
                                        <div className="space-y-8">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meet Your Instructors</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {course.instructorNames?.map((instructor) => (
                                                    <div key={instructor._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                                        <div className="flex items-start">
                                                            <img
                                                                src={`https://res.cloudinary.com/dd5s7qpsc/image/upload/${instructor.profilePic}` || "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"}
                                                                alt={instructor.name || instructor.email}
                                                                className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-100 dark:border-gray-700"
                                                            />
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{instructor.name || 'Teacher'}</h3>
                                                                <div className="flex items-center mt-1">
                                                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                                    <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                                                                        {4.9} ({'5+'} courses)
                                                                    </span>
                                                                </div>
                                                                {instructor.profile && (
                                                                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                                                                        {instructor?.profile?.bio}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === "reviews" && (
                                        <div className="space-y-8">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Reviews</h2>
                                                <div className="mt-4 sm:mt-0">
                                                    <Button>Write a Review</Button>
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                                <div className="flex items-center mb-6">
                                                    <div className="text-5xl font-bold text-gray-900 dark:text-white mr-6">
                                                        {course.rating}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-5 w-5 ${i < Math.floor(course.rating)
                                                                        ? "text-yellow-400 fill-current"
                                                                        : "text-gray-300 dark:text-gray-600"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                                                            Based on {course.reviews} reviews
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="space-y-6">
                                                    {course.reviewsData?.slice(0, 5).map((review) => (
                                                        <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                                                            <div className="flex items-center mb-3">
                                                                <img
                                                                    src={review.user.avatar || "/placeholder-avatar.jpg"}
                                                                    alt={review.user.name}
                                                                    className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200 dark:border-gray-700"
                                                                />
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900 dark:text-white">{review.user.name}</h4>
                                                                    <div className="flex items-center mt-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`h-4 w-4 ${i < review.rating
                                                                                    ? "text-yellow-400 fill-current"
                                                                                    : "text-gray-300 dark:text-gray-600"
                                                                                    }`}
                                                                            />
                                                                        ))}
                                                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                                            {formatDate(review.date)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                                                            <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                                <button className="flex items-center hover:text-gray-700 dark:hover:text-gray-300">
                                                                    <MessageCircle className="h-4 w-4 mr-1" />
                                                                    Reply
                                                                </button>
                                                                <span className="mx-2">•</span>
                                                                <button className="flex items-center hover:text-gray-700 dark:hover:text-gray-300">
                                                                    <span className="mr-1">👍</span>
                                                                    Helpful ({review.helpful})
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === "faq" && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
                                            <div className="space-y-1">
                                                {[
                                                    {
                                                        question: "What do your study abroad courses include?",
                                                        answer: "Our courses cover everything from English language prep, IELTS/TOEFL training, and subject-specific coaching to application guidance, interview prep, and cultural orientation."
                                                    },
                                                    {
                                                        question: "Are these courses suitable for beginners?",
                                                        answer: "Yes! Whether you’re just starting or already advanced, we have beginner, intermediate, and advanced-level courses tailored to your needs."
                                                    },
                                                    {
                                                        question: "How do these courses help with my study abroad application?",
                                                        answer: "We focus on strengthening your academic profile, language skills, and test performance so that you can meet admission requirements at top universities abroad."
                                                    },
                                                    {
                                                        question: "Do you provide guidance for visa and admissions along with courses?",
                                                        answer: "Absolutely. Along with coaching, we guide you through application essays, SOPs, LORs, and visa interview preparation."
                                                    },
                                                    {
                                                        question: "Are the courses conducted online or offline?",
                                                        answer: "We offer both flexible online classes and offline sessions (depending on your location). You can choose what fits you best."
                                                    },
                                                    {
                                                        question: "What makes your study abroad courses different from others?",
                                                        answer: "Our trainers have years of experience helping students secure admissions abroad. We provide personalized feedback, mock tests, and one-on-one mentoring."
                                                    },
                                                    {
                                                        question: "How long does it take to complete a course?",
                                                        answer: "Course duration ranges from 4 weeks to 6 months, depending on the program and your target university requirements."
                                                    },
                                                    {
                                                        question: "Will these courses improve my chances of getting scholarships?",
                                                        answer: "Yes, stronger academic and language skills increase your chances of securing merit-based scholarships abroad."
                                                    },
                                                    {
                                                        question: "Do you provide practice tests and study materials?",
                                                        answer: "Yes, we provide updated study guides, sample papers, mock exams, and practice sessions for standardized tests like IELTS, TOEFL, GRE, and GMAT."
                                                    },
                                                    {
                                                        question: "How do I enroll in a course?",
                                                        answer: "Simply click on the “Enroll Now” button, fill in your details, and our team will contact you with the next steps."
                                                    }
                                                ]?.map((faq, index) => (
                                                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                            className="flex justify-between items-center w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                        >
                                                            <h3 className="font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                                                            <ChevronRight
                                                                className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === index ? "rotate-90" : ""
                                                                    }`}
                                                            />
                                                        </button>
                                                        {expandedFaq === index && (
                                                            <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <motion.div
                                ref={videoCardRef}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="lg:col-span-2"
                            >
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="sticky top-20"
                                >
                                    <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
                                        <div className="relative rounded-2xl h-full bg-white p-1.5 overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />
                                            <div style={{ borderRadius: "15px 15px 0px 0px" }} className="relative overflow-hidden h-[210px]">
                                                <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                                                    {course?.preview?.url ? (() => {
                                                        const url = course.preview.url;
                                                        let embedUrl = '';

                                                        // YouTube
                                                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                                            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                                            const match = url.match(regExp);
                                                            const videoId = match?.[2]?.length === 11 ? match[2] : null;
                                                            if (videoId) {
                                                                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&controls=1`;
                                                            }
                                                        }
                                                        // Vimeo
                                                        else if (url.includes('vimeo.com')) {
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
                                                                    <p className="text-base text-gray-600 font-medium dark:text-gray-400">No preview available</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })() : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                                            <div className="text-center">
                                                                <PlayCircleIcon className="h-15 w-15 text-gray-400 stroke-1 mx-auto mb-3" />
                                                                <p className="text-base text-gray-600 font-medium dark:text-gray-400">No preview available</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="px-5 py-2 space-y-2">

                                                <h2 className="text-lg font-semibold text-gray-800">
                                                    {course.title}
                                                </h2>

                                                <div className="space-y-2 py-2 text-sm grid grid-cols-2 gap-x-4">

                                                    <div className="flex justify-between">
                                                        <span>Duration :</span>
                                                        <span>{course.duration || "Unknown"}</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Language :</span>
                                                        <span>{course.language}</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Mode :</span>
                                                        <span>{course.mode}</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span>Validity :</span>
                                                        <span>2 Years</span>
                                                    </div>

                                                </div>

                                                <div className="space-y-1 grid grid-cols-2">

                                                    <div className="flex items-center gap-2 text-sm">
                                                        ✓ Lifetime Access
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        ✓ Certificate Included
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        ✓ Study Material
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm">
                                                        ✓ Expert Support
                                                    </div>

                                                </div>

                                            </div>

                                            {/* FOOTER */}
                                            <div className="flex items-start">
                                                <div style={{ borderRadius: "0px 0px 12px 15px" }} className="flex-1 f bg-[#FF6A3D] text-center text-white text-3xl font-bold px-4 py-2">
                                                    {formatPrice(finalPrice, course.pricing.currency)}
                                                </div>
                                                <button onClick={() => navigate(`/checkout/${slug}`)} style={{ borderRadius: "0px 0px 15px 0px" }} onClick={() => { series?.pricing?.isFree ? "" : navigate(`/checkout/${series?.slug}`, { state: { testSeries: true } }) }} className="flex-1 bg-[#3B3B3B] text-white font-medium py-2 bg-gradient-to-b from-[#545454] via-[#ffffff]/30 to-[#545454] hover:bg-black transition">
                                                    Enroll Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                            </motion.div>
                        </div>
                    </div>
                </motion.div>


            </div>
            <CourseSupportFooter />
        </>

    )
}



// <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
//             <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
//                 {/* LEFT COLUMN — Main Content (3/4 width) */}
//                 <div className="lg:col-span-4">

//                 </div>

//                 {/* RIGHT COLUMN — Fixed Preview Video Card (1/4 width) */}
//                 <div className="lg:col-span-2">
//                     <div
//                         ref={videoCardRef}
//                         className={`bg-white dark:bg-gray-800 rounded-lg dark:border-gray-700 p-4 transition-all duration-300 ease-in-out ${isVideoCardFixed
//                             ? 'fixed top-22 right-8 w-72 lg:w-96 z-30 shadow-xl'
//                             : 'sticky top-22'
//                             }`}
//                     >
//                         <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
//                             {course.title}
//                         </h3>
//                         <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-4 relative group">
//                             {course.thumbnail && (
//                                 <img
//                                     src={course.thumbnail?.url ? `${ImageBaseUrl}/${course.thumbnail.url}` : "/placeholder-course.jpg"}
//                                     className="w-full h-full object-cover"
//                                 />
//                             )}
//                         </div>
//                         <div className="space-y-3">
//                             <Button
//                                 size="sm"
//                                 onClick={() => navigate(`/checkout/${slug}`)}
//                                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
//                             >
//                                 Enroll Now
//                             </Button>
//                         </div>
//                         <div className="mt-4 pb-3 pt-3 border-gray-200 dark:border-gray-700">
//                             <div className="space-y-2 text-sm">
//                                 <div className="flex justify-between">
//                                     <span className="text-gray-500 dark:text-gray-400">{course.shortDescription}</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>