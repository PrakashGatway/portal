import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Play,
    Clock,
    BookOpen,
    CheckCircle,
    Search,
    Grid,
    List,
    Award,
    Sparkles,
    Trophy,
    Brain,
    Zap,
    Crown,
    Target,
    Timer,
    ChevronRight,
    Share2,
    Rocket,
    Lightbulb
} from "lucide-react"
import Button from "../components/ui/button/Button"
import api, { ImageBaseUrl } from "../axiosInstance"
import { useNavigate } from "react-router"

interface CourseProgress {
    completedLessons: number
    totalLessons: number
    progressPercentage: number
    lastAccessed: string
    timeSpent: number // in minutes
    currentLesson?: string
    quizScore?: number
    streak?: number
}

interface PurchasedCourse {
    _id: string
    courseId: {
        _id: string
        title: string
        subtitle: string
        thumbnail: { url: string }
        instructorNames: string[]
        duration: string
        level: string
        categoryInfo: { name: string }
        rating: number
        studentsEnrolled: number
        tags: string[]
        language: string
        whatYouLearn: string[]
    }
    purchaseDate: string
    progress: CourseProgress
    expiresAt?: string
    certificateEligible: boolean
    accessType: "lifetime" | "temporary"
    favorite: boolean
    notesCount: number
    assignmentsCompleted: number
    totalAssignments: number
}

const CourseCard = ({ course, viewMode }: { course: PurchasedCourse; viewMode: "grid" | "list" }) => {
    const progress = course.progress?.progressPercentage || 0
    const isCompleted = progress === 100
    const isRecentlyAccessed = new Date(course.progress?.lastAccessed).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    const isNew = new Date(course.purchaseDate).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000
    const timeRemaining = course.expiresAt ? Math.ceil((new Date(course.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
        }
    }
    let navigate = useNavigate()

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return 'from-emerald-400 to-green-500'
        if (progress >= 50) return 'from-blue-400 to-cyan-500'
        if (progress >= 25) return 'from-amber-400 to-orange-500'
        return 'from-gray-300 to-gray-400'
    }

    if (viewMode === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/80 hover:shadow-xl transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-800/50 overflow-hidden"
            >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/5 dark:via-gray-800 dark:to-purple-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-center p-6 z-10">
                    {/* Course Image */}
                    <div className="relative flex-shrink-0">
                        <div className="relative w-58 h-36 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-500">
                            <img
                                src={!course.thumbnail?.url
                                    ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                                    : `${ImageBaseUrl}/${course.thumbnail.url}`
                                }
                                alt={course.title}
                                className="w-full h-full object-cover transform transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                            {/* Progress bar on image */}
                            {/* <div className="absolute bottom-0 left-0 right-0 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white text-xs font-medium">Progress</span>
                                    <span className="text-white text-xs font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-white/30 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-1000 ease-out`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div> */}
                        </div>

                        {/* Status Badges */}
                        <div className="absolute -top-2 -left-2 flex flex-col gap-2">
                            {isNew && (
                                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-amber-300/50">
                                    <Rocket className="h-3 w-3 mr-1" />
                                    New
                                </div>
                            )}
                            {isRecentlyAccessed && !isCompleted && (
                                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-green-300/50">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Recent
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 ml-3">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                                        {course.level}
                                    </span>
                                    {course.certificateEligible && isCompleted && (
                                        <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs border border-amber-300/50">
                                            <Award className="h-3 w-3 mr-1" />
                                            Certificate Ready
                                        </div>
                                    )}
                                </div>

                                <h3 onClick={() => navigate(`/courses/${course.slug}`)} className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                    {course.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-1 line-clamp-2">
                                    {course.shortDescription}
                                </p>
                            </div>
                        </div>

                        {/* Stats and Actions */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {course.progress?.streak && course.progress.streak > 0 && (
                                    <div className="flex items-center bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-xl text-sm border border-orange-200 dark:border-orange-800">
                                        <FlameIcon className="h-4 w-4 mr-1.5" />
                                        {course.progress.streak} day streak
                                    </div>
                                )}

                                {timeRemaining && timeRemaining > 0 && (
                                    <div className="flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded-xl text-sm border border-red-200 dark:border-red-800">
                                        <Clock className="h-4 w-4 mr-1.5" />
                                        {timeRemaining} days left
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-3">
                                {/* <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200">
                                    <Share2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </Button> */}

                                {isCompleted ? (
                                    <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                                        <Trophy className="h-4 w-4 mr-2" />
                                        Get Certificate
                                    </Button>
                                ) : (
                                    <Button onClick={() => navigate(`/courses/${course.slug}`)} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                                        {progress === 0 ? "Start Learning" : "Continue"}
                                        <ChevronRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // Grid View
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 hover:shadow-xl transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-800/50 overflow-hidden"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-blue-900/5 dark:via-gray-800 dark:to-purple-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Course Image */}
            <div className="relative h-38 overflow-hidden">
                <img
                    src={!course.thumbnail?.url
                        ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                        : `${ImageBaseUrl}/${course.thumbnail.url}`
                    }
                    alt={course.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {isNew && (
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-amber-300/50">
                            <Rocket className="h-3 w-3 mr-1" />
                            New
                        </div>
                    )}
                    {course.accessType === "lifetime" && (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg border border-purple-300/50">
                            <Crown className="h-3 w-3 mr-1" />
                            Lifetime
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
                        {course.level}
                    </span>
                    {isCompleted && (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                </div>
                {/* Progress overlay */}
                {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-semibold">Your Progress</span>
                        <span className="text-white text-sm font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2 mb-2">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-1000 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/90">
                        <span>{course.progress?.completedLessons || 0} completed</span>
                        <span>{course.progress?.totalLessons || 0} total</span>
                    </div>
                </div> */}
            </div>

            {/* Content */}
            <div className="relative p-4 pt-2 z-10">
                <div className="mb-4">
                    <h3 onClick={() => navigate(`/courses/${course.slug}`)} className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed line-clamp-2">
                        {course.shortDescription}
                    </p>
                </div>

                {/* Additional info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 ">
                    {/* <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.duration || 'Self-paced'}
                    </div> */}
                    {course.rating && (
                        <div className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-amber-400" />
                            {course.rating}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Button onClick={() => navigate(`/courses/${course.slug}`)}
                    className="w-full rounded-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:-translate-y-0.5 group"
                    size="lg"
                >
                    {isCompleted ? (
                        <>
                            <Trophy className="h-4 w-4 mr-1" />
                            View Certificate
                        </>
                    ) : (
                        <>
                            {progress === 0 ? "Start Learning" : "Continue"}
                        </>
                    )}
                    <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
            </div>
        </motion.div>
    )
}

const CourseSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
    if (viewMode === "list") {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 animate-pulse">
                <div className="flex items-center">
                    <div className="w-48 h-28 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="flex-1 ml-8 space-y-4">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-8 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse overflow-hidden">
            <div className="w-full h-56 bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-6 space-y-4">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                    ))}
                </div>
                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            </div>
        </div>
    )
}

const FlameIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12-.06-.05-.1-.1-.15-.17-1.1-1.43-1.28-3.48-.53-5.12C5.87 10 5 12.3 5.12 14.47c.04.5.1 1 .27 1.5.14.6.41 1.2.75 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.73.5-1.08.6-1.1.38-2.2-.16-2.88-.82 1.2-.28 1.9-1.16 2.11-2.05.17-.8-.15-1.46-.28-2.23-.12-.74-.1-1.37.17-2.06.19.38.39.76.63 1.06.77 1 1.98 1.44 2.24 2.8.04.14.06.28.06.43.03.82-.33 1.72-.93 2.27z" />
    </svg>
)

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<PurchasedCourse[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [filter, setFilter] = useState<"all" | "in-progress" | "completed" | "recent" | "favorites">("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                const response = await api.get("/courses")
                setCourses(response.data.data || [])
            } catch (error) {
                console.error("Failed to fetch purchased courses:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchMyCourses()
    }, [])

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.courseId?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.courseId?.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filter === "all" ||
            (filter === "in-progress" && course.progress?.progressPercentage > 0 && course.progress?.progressPercentage < 100) ||
            (filter === "completed" && course.progress?.progressPercentage === 100) ||
            (filter === "recent" && new Date(course.progress?.lastAccessed).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
            (filter === "favorites" && course.favorite)

        return matchesSearch && matchesFilter
    })

    const totalCourses = courses.length
    const completedCourses = courses.filter(course => course.progress?.progressPercentage === 100).length
    const inProgressCourses = courses.filter(course => course.progress?.progressPercentage > 0 && course.progress?.progressPercentage < 100).length
    const totalLearningTime = courses.reduce((total, course) => total + (course.progress?.timeSpent || 0), 0)
    const averageProgress = courses.length > 0 ? Math.round(courses.reduce((sum, course) => sum + (course.progress?.progressPercentage || 0), 0) / courses.length) : 0

    const stats = [
        {
            icon: BookOpen,
            label: "Total Courses",
            value: totalCourses.toString(),
            trend: 12,
            description: "In your learning journey"
        },
        {
            icon: CheckCircle,
            label: "Completed",
            value: completedCourses.toString(),
            trend: 8,
            description: "Courses finished"
        },
        {
            icon: Brain,
            label: "In Progress",
            value: inProgressCourses.toString(),
            trend: 15,
            description: "Active learning"
        },
        {
            icon: Timer,
            label: "Learning Time",
            value: `${Math.floor(totalLearningTime / 60)}h ${totalLearningTime % 60}m`,
            trend: 20,
            description: "Total time spent"
        },
        {
            icon: Target,
            label: "Avg Progress",
            value: `${averageProgress}%`,
            trend: 5,
            description: "Across all courses"
        }
    ]

    const filterButtons = [
        { key: "all" as const, label: "All Courses", icon: Grid },
        { key: "in-progress" as const, label: "In Progress", icon: Play },
        { key: "completed" as const, label: "Completed", icon: CheckCircle },
        // { key: "recent" as const, label: "Recently Viewed", icon: Clock }
    ]

    return (
        <div className="min-h- bg-[80vh] gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 py-3">
            <div className="max-w-7xl mx-auto px-3">
                {/* <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                >
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {stats.map((stat, index) => (
                            <StatsCard
                                key={stat.label}
                                {...stat}
                            />
                        ))}
                    </div>
                </motion.div> */}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 mb-4"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses, instructors, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-inner transition-all duration-300"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 overflow-x-auto">
                                {filterButtons.map((filterOption) => {
                                    const IconComponent = filterOption.icon
                                    return (
                                        <button
                                            key={filterOption.key}
                                            onClick={() => setFilter(filterOption.key)}
                                            className={`flex items-center px-4 py-2.5 mt-auto rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${filter === filterOption.key
                                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            <IconComponent className="h-4 w-4 mr-2" />
                                            {filterOption.label}
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "grid"
                                        ? "bg-white dark:bg-gray-600 shadow-lg text-blue-600 transform scale-110"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <Grid className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-lg transition-all duration-300 ${viewMode === "list"
                                        ? "bg-white dark:bg-gray-600 shadow-lg text-blue-600 transform scale-110"
                                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                >
                                    <List className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-2"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            {/* <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filter === 'all' ? 'All Courses' :
                                    filter === 'in-progress' ? 'Courses in Progress' :
                                        filter === 'completed' ? 'Completed Courses' :
                                            filter === 'recent' ? 'Recently Viewed' : 'Favorite Courses'}
                            </h2> */}
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
                                {searchQuery && ` for "${searchQuery}"`}
                            </p>
                        </div>

                        {filteredCourses.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Lightbulb className="h-4 w-4" />
                                <span>Sorted by: Recent Activity</span>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className={
                            viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                : "space-y-6"
                        }>
                            {[...Array(6)].map((_, index) => (
                                <CourseSkeleton key={index} viewMode={viewMode} />
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                                <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {searchQuery || filter !== "all" ? "No courses match your criteria" : "Start Your Learning Journey"}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                                    {searchQuery || filter !== "all"
                                        ? "Try adjusting your search or filter to find what you're looking for."
                                        : "Explore our catalog and enroll in your first course to begin learning."
                                    }
                                </p>
                                <Button size="lg" className="rounded-xl px-8 py-4 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300">
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Browse Courses
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className={
                            viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
                                : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-2"
                        }>
                            <AnimatePresence>
                                {courses.map((course, index) => (
                                    <CourseCard
                                        key={course._id}
                                        course={course}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}