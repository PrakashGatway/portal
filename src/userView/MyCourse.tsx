import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Play,
    Clock,
    BookOpen,
    CheckCircle,
    Star,
    TrendingUp,
    Calendar,
    Filter,
    Search,
    Grid,
    List,
    Award,
    Clock3,
    BarChart3,
    Bookmark,
    ExternalLink,
    Sparkles,
    Trophy,
    Brain,
    Zap,
    Crown,
    Target,
    BarChart4,
    Timer,
    User,
    ChevronRight,
    BookmarkCheck,
    RotateCcw,
    Eye,
    Share2,
    Heart,
    CalendarDays,
    Users,
    BadgeCheck,
    Rocket,
    Lightbulb,
    GraduationCap,
} from "lucide-react"
import Button from "../components/ui/button/Button"
import api from "../axiosInstance"

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

    // Enhanced progress with milestones
    const getProgressColor = (progress: number) => {
        if (progress < 25) return "from-red-500 to-orange-500"
        if (progress < 50) return "from-orange-500 to-yellow-500"
        if (progress < 75) return "from-yellow-500 to-green-500"
        return "from-green-500 to-emerald-500"
    }

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    if (viewMode === "list") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -2, scale: 1.005 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/80 dark:border-gray-700/80 hover:shadow-2xl transition-all duration-500 backdrop-blur-sm overflow-hidden"
            >
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-center p-8 z-10">
                    {/* Thumbnail with Enhanced Effects */}
                    <div className="relative flex-shrink-0">
                        <div className="relative w-48 h-28 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-500">
                            <img
                                src={course.courseId?.thumbnail?.url || "/api/placeholder/200/120"}
                                alt={course.courseId?.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                            
                            {/* Progress Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white text-xs font-semibold">Progress</span>
                                    <span className="text-white text-xs font-bold">{progress}%</span>
                                </div>
                                <div className="w-full bg-white/30 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-1000 ease-out`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="absolute -top-2 -left-2 flex flex-col gap-1">
                            {isNew && (
                                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg">
                                    <Rocket className="h-3 w-3 mr-1" />
                                    New
                                </div>
                            )}
                            {isRecentlyAccessed && !isCompleted && (
                                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Recent
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 ml-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.courseId?.level)}`}>
                                        {course.courseId?.level}
                                    </span>
                                    {course.certificateEligible && isCompleted && (
                                        <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs">
                                            <Award className="h-3 w-3 mr-1" />
                                            Certificate
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                    {course.courseId?.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
                                    {course.courseId?.subtitle}
                                </p>
                                
                                {/* Instructor and Meta Info */}
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <div className="flex items-center">
                                        <User className="h-4 w-4 mr-1.5 text-blue-500" />
                                        <span>By {course.courseId?.instructorNames?.join(", ") || "Unknown Instructor"}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <div className="flex items-center">
                                        <CalendarDays className="h-4 w-4 mr-1.5 text-purple-500" />
                                        <span>Enrolled {new Date(course.purchaseDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1.5 text-green-500" />
                                        <span>{course.courseId?.studentsEnrolled?.toLocaleString()} students</span>
                                    </div>
                                </div>

                                {/* Enhanced Progress Stats */}
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                                            <BookOpen className="h-4 w-4 mr-1.5" />
                                            <span className="text-sm font-semibold">{course.progress?.completedLessons}/{course.progress?.totalLessons}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Lessons</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                                            <Timer className="h-4 w-4 mr-1.5" />
                                            <span className="text-sm font-semibold">{Math.floor(course.progress?.timeSpent / 60)}h {course.progress?.timeSpent % 60}m</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Time Spent</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                                            <BookmarkCheck className="h-4 w-4 mr-1.5" />
                                            <span className="text-sm font-semibold">{course.assignmentsCompleted}/{course.totalAssignments}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Assignments</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-1">
                                            <Target className="h-4 w-4 mr-1.5" />
                                            <span className="text-sm font-semibold">{course.notesCount}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">Notes</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {course.progress?.streak && course.progress.streak > 0 && (
                                    <div className="flex items-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full text-sm">
                                        <FlameIcon className="h-4 w-4 mr-1.5" />
                                        {course.progress.streak} day streak
                                    </div>
                                )}
                                
                                {timeRemaining && timeRemaining > 0 && (
                                    <div className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm">
                                        <Clock className="h-4 w-4 mr-1.5" />
                                        {timeRemaining} days left
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-3">
                                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                                    <Heart className={`h-4 w-4 ${course.favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                </Button>
                                <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                                    <Share2 className="h-4 w-4 text-gray-400" />
                                </Button>
                                
                                {isCompleted ? (
                                    <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 rounded-xl">
                                        <Trophy className="h-4 w-4 mr-2" />
                                        Get Certificate
                                    </Button>
                                ) : (
                                    <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 rounded-xl">
                                        <Play className="h-4 w-4 mr-2" />
                                        {progress === 0 ? "Start Learning" : "Continue"}
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200/80 dark:border-gray-700/80 hover:shadow-2xl transition-all duration-500 overflow-hidden backdrop-blur-sm"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Thumbnail */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={course.courseId?.thumbnail?.url || "/api/placeholder/400/200"}
                    alt={course.courseId?.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Top Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {isNew && (
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg">
                            <Rocket className="h-3 w-3 mr-1" />
                            New
                        </div>
                    )}
                    {course.accessType === "lifetime" && (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg">
                            <Crown className="h-3 w-3 mr-1" />
                            Lifetime
                        </div>
                    )}
                </div>

                {/* Progress Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-semibold">Your Progress</span>
                        <span className="text-white text-sm font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2.5 mb-2">
                        <div
                            className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(progress)} transition-all duration-1000 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/80">
                        <span>{course.progress?.completedLessons} of {course.progress?.totalLessons} lessons</span>
                        <span>{Math.floor(course.progress?.timeSpent / 60)}h spent</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative p-6 z-10">
                {/* Course Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getLevelColor(course.courseId?.level)}`}>
                            {course.courseId?.level}
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {course.courseId?.title}
                        </h3>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Heart className={`h-4 w-4 ${course.favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </Button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                    {course.courseId?.subtitle}
                </p>

                {/* Instructor and Rating */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4 mr-1.5 text-blue-500" />
                        <span className="truncate">{course.courseId?.instructorNames?.[0]}</span>
                    </div>
                    <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-gray-600 dark:text-gray-400 font-semibold">{course.courseId?.rating}</span>
                        <span className="text-gray-400 mx-1">•</span>
                        <span className="text-gray-500 text-xs">{course.courseId?.studentsEnrolled?.toLocaleString()}</span>
                    </div>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <BookOpen className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{course.progress?.completedLessons}/{course.progress?.totalLessons}</div>
                        <div className="text-xs text-gray-500">Lessons</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <BookmarkCheck className="h-4 w-4 text-green-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{course.assignmentsCompleted}/{course.totalAssignments}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <Target className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                        <div className="text-xs font-semibold text-gray-900 dark:text-white">{course.notesCount}</div>
                        <div className="text-xs text-gray-500">Notes</div>
                    </div>
                </div>

                {/* Action Button */}
                <Button 
                    className="w-full rounded-xl py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg transform group-hover:scale-105 transition-all duration-300"
                    size="lg"
                >
                    {isCompleted ? (
                        <>
                            <Trophy className="h-5 w-5 mr-2" />
                            View Certificate
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5 mr-2" />
                            {progress === 0 ? "Start Learning" : "Continue Learning"}
                        </>
                    )}
                    <ChevronRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
            </div>
        </motion.div>
    )
}

// Enhanced Stats Card Component
const StatsCard = ({ icon: Icon, label, value, trend, description, className = "" }: {
    icon: any;
    label: string;
    value: string;
    trend?: number;
    description?: string;
    className?: string;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200/80 dark:border-gray-700/80 hover:shadow-xl transition-all duration-300 overflow-hidden group ${className}`}
    >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</p>
                    {description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{description}</p>
                    )}
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {trend && (
                <div className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className={`h-4 w-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(trend)}% from last month
                </div>
            )}
        </div>
    </motion.div>
)

// Enhanced Loading Skeletons
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

// Flame Icon Component
const FlameIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12-.06-.05-.1-.1-.15-.17-1.1-1.43-1.28-3.48-.53-5.12C5.87 10 5 12.3 5.12 14.47c.04.5.1 1 .27 1.5.14.6.41 1.2.75 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.73.5-1.08.6-1.1.38-2.2-.16-2.88-.82 1.2-.28 1.9-1.16 2.11-2.05.17-.8-.15-1.46-.28-2.23-.12-.74-.1-1.37.17-2.06.19.38.39.76.63 1.06.77 1 1.98 1.44 2.24 2.8.04.14.06.28.06.43.03.82-.33 1.72-.93 2.27z"/>
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

    // Filter courses based on current filter and search query
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

    // Calculate enhanced stats
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
        },
        {
            icon: GraduationCap,
            label: "Certificates",
            value: courses.filter(c => c.certificateEligible && c.progress?.progressPercentage === 100).length.toString(),
            trend: 25,
            description: "Ready to claim"
        }
    ]

    const filterButtons = [
        { key: "all" as const, label: "All Courses", icon: Grid },
        { key: "in-progress" as const, label: "In Progress", icon: Play },
        { key: "completed" as const, label: "Completed", icon: CheckCircle },
        { key: "recent" as const, label: "Recently Viewed", icon: Clock },
        { key: "favorites" as const, label: "Favorites", icon: Heart },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                            My Learning Dashboard
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                            Track your progress, continue learning, and achieve your goals
                        </p>
                    </div>

                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                        {stats.map((stat, index) => (
                            <StatsCard
                                key={stat.label}
                                {...stat}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Enhanced Filters and Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Search */}
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses, instructors, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-inner transition-all duration-300"
                            />
                        </div>

                        {/* Enhanced Filters and View Toggle */}
                        <div className="flex items-center space-x-4">
                            {/* Filter Buttons */}
                            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                                {filterButtons.map((filterOption) => {
                                    const IconComponent = filterOption.icon
                                    return (
                                        <button
                                            key={filterOption.key}
                                            onClick={() => setFilter(filterOption.key)}
                                            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                                                filter === filterOption.key
                                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                            }`}
                                        >
                                            <IconComponent className="h-4 w-4 mr-2" />
                                            {filterOption.label}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                        viewMode === "grid"
                                            ? "bg-white dark:bg-gray-600 shadow-lg text-blue-600 transform scale-110"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    <Grid className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-lg transition-all duration-300 ${
                                        viewMode === "list"
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

                {/* Courses Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    {/* Results Count */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {filter === 'all' ? 'All Courses' : 
                                 filter === 'in-progress' ? 'Courses in Progress' :
                                 filter === 'completed' ? 'Completed Courses' :
                                 filter === 'recent' ? 'Recently Viewed' : 'Favorite Courses'}
                            </h2>
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
                    ) : filteredCourses.length === 0 ? (
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
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                : "space-y-6"
                        }>
                            <AnimatePresence>
                                {filteredCourses.map((course, index) => (
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