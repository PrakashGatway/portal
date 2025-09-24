import { useState, useEffect, useRef } from "react"
import {
    Star,
    Users,
    Clock,
    Calendar,
    BookOpen,
    TrendingUp,
    MapPin,
    Award,
    Download,
    Play,
    CheckCircle,
    ChevronRight,
    Heart,
    Share2,
    BarChart3,
    FileText,
    Video,
    Headphones,
    MessageCircle,
    Shield,
    Lightbulb,
    Book,
    Target,
    Users2,
    School,
    AlertCircle,
    Phone,
    Laptop,
    Sparkles,
    Globe,
    PlayCircle,
    Zap,
} from "lucide-react"
import Button from "../components/ui/button/Button"
import api, { ImageBaseUrl } from "../axiosInstance"
import { useParams } from "react-router"
import { motion, LayoutGroup } from "framer-motion"


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
    <div className={`rounded-lg border bg-gray-200 shadow-sm ${className}`}>{children}</div>
)

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`${className}`}>{children}</div>
)

export default function CourseDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [isVideoCardFixed, setIsVideoCardFixed] = useState(false)
    const courseHeaderRef = useRef<HTMLDivElement>(null)
    const videoCardRef = useRef<HTMLDivElement>(null)

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
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course details...</p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <motion.div
                ref={courseHeaderRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10"
            >
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 items-start">
                        {/* Left: Course Info */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
                                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                                    {course.categoryInfo?.name}
                                </Badge>
                                {course.level && (
                                    <Badge variant="outline" className="border-accent/30 text-accent-foreground px-4 py-1.5">
                                        <Target className="mr-1.5 h-3.5 w-3.5" />
                                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                                    </Badge>
                                )}
                                {course.featured && (
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-1.5">
                                        <Award className="mr-1.5 h-3.5 w-3.5" />
                                        Featured
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight text-balance">
                                    {course.title}
                                </h1>
                                <p className="text-lg text-muted-foreground leading-relaxed text-pretty max-w-3xl">
                                    {course.shortDescription}
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed text-pretty max-w-3xl">
                                    {course.description}
                                </p>
                            </div>

                            {/* Course Stats */}
                            <div className="flex flex-wrap items-center gap-6 pt-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < Math.floor(course.rating || 5) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-foreground">{course.rating || 4.8}</span>
                                    <span className="text-muted-foreground">({course.reviews || '1000+'} reviews)</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-5 w-5" />
                                    <span className="font-medium">{course.studentsEnrolled?.toLocaleString() || "1000+"} students</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-5 w-5" />
                                    <span className="font-medium">{course.duration || "1 year"}</span>
                                </div>
                            </div>

                            {/* Course Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                    <CardContent className="text-center p-4">
                                        <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                                        <p className="text-sm font-medium text-foreground">Start Date</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDate(course.schedule?.startDate || "")}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                    <CardContent className="p-4 text-center">
                                        <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                                        <p className="text-sm font-medium text-foreground">Mode</p>
                                        <p className="text-xs text-muted-foreground mt-1 capitalize">{course.mode}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                    <CardContent className="p-4 text-center">
                                        <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                                        <p className="text-sm font-medium text-foreground">Language</p>
                                        <p className="text-xs text-muted-foreground mt-1 capitalize">{course.language}</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                                    <CardContent className="p-4 text-center">
                                        <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                                        <p className="text-sm font-medium text-foreground">Sections</p>
                                        <p className="text-xs text-muted-foreground mt-1">{course.curriculum?.length || 0} modules</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <motion.div
                            ref={videoCardRef}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2"
                        >
                            <Card className="backdrop-blur-xl shadow-lg mb-2">
                                <CardContent className="p-0">
                                    {/* Video Preview */}
                                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg overflow-hidden group">
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                            <div className="text-center">
                                                <PlayCircle className="h-16 w-16 text-primary/60 mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground">Course Preview</p>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                            <Play className="h-12 w-12 text-white drop-shadow-lg" />
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Pricing */}
                                        <div className="text-center space-y-3">
                                            <div className="space-y-2">
                                                <div className="text-3xl font-bold text-foreground">
                                                    {formatPrice(finalPrice, course.pricing.currency)}
                                                </div>
                                                {discountPercent > 0 && (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <span className="text-lg text-muted-foreground line-through">
                                                            {formatPrice(originalPrice, course.pricing.currency)}
                                                        </span>
                                                        <Badge className="bg-destructive text-destructive-foreground">{discountPercent}% OFF</Badge>
                                                    </div>
                                                )}
                                                {isEarlyBirdActive && (
                                                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                                                        <Zap className="mr-1 h-3 w-3" />
                                                        Early Bird: {getDaysRemaining(course.pricing.earlyBird!.deadline)} days left
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            <Button
                                                size="lg"
                                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                                            >
                                                <PlayCircle className="mr-2 h-5 w-5" />
                                                Enroll Now
                                            </Button>
                                            {/* <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                                    className={`${isWishlisted ? "text-red-500 border-red-200" : ""}`}
                                                >
                                                    <Heart className={`mr-1 h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                                                    Save
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Share2 className="mr-1 h-4 w-4" />
                                                    Share
                                                </Button>
                                            </div> */}
                                        </div>

                                        {/* Course Snapshot */}
                                        <div className="space-y-3 pt-2 border-t border-border/50">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground flex items-center gap-2">
                                                        <Award className="h-4 w-4" />
                                                        Certificate
                                                    </span>
                                                    <span className="font-medium">Included</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground flex items-center gap-2">
                                                        <Shield className="h-4 w-4" />
                                                        Access
                                                    </span>
                                                    <span className="font-medium">Lifetime</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    {/* LEFT COLUMN — Main Content (3/4 width) */}
                    <div className="lg:col-span-4">
                        <div className="mb-8">
                            <nav className="relative">
                                <LayoutGroup>
                                    <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-2">
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
                                                    className={`relative py-3 px-4 font-medium text-sm flex items-center rounded-lg transition-all duration-200
                                                        ${activeTab === tab.id
                                                            ? "text-blue-600 bg-white shadow-sm dark:bg-gray-900 dark:text-blue-400"
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
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Course Description</h2>
                                        <div
                                            className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: course.description }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What You'll Learn</h3>
                                        <ul className="space-y-3">
                                            {course.objectives?.map((objective, index) => (
                                                <li key={index} className="flex items-start">
                                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Course Highlights</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {course.highlights?.map((highlight, index) => (
                                                <div key={index} className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    <Award className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Requirements</h3>
                                        <ul className="space-y-3">
                                            {course.requirements?.map((requirement, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Who This Course Is For</h3>
                                        <ul className="space-y-3">
                                            {course.targetAudience?.map((audience, index) => (
                                                <li key={index} className="flex items-start">
                                                    <Users className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 dark:text-gray-300">{audience}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                            {activeTab === "curriculum" && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Curriculum</h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {course.curriculum?.length || 0} sections • {course.curriculum?.reduce((acc, section) => acc + section.items.length, 0) || 0} lectures
                                    </p>
                                    <div className="space-y-4">
                                        {course.curriculum?.map((section, sectionIndex) => (
                                            <div key={section._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50">
                                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                                        Section {sectionIndex + 1}: {section.title}
                                                    </h3>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {section.items.length} lectures
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {section.items.map((item, itemIndex) => (
                                                        <div key={item._id} className="flex items-center p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                            <div className="flex items-center mr-4">
                                                                {item.type === "video" && <Video className="h-5 w-5 text-blue-500" />}
                                                                {item.type === "document" && <FileText className="h-5 w-5 text-green-500" />}
                                                                {item.type === "quiz" && <BarChart3 className="h-5 w-5 text-purple-500" />}
                                                                {item.type === "assignment" && <Download className="h-5 w-5 text-orange-500" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.duration}</div>
                                                            </div>
                                                            {item.isPreview && (
                                                                <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400">
                                                                    Preview
                                                                </Button>
                                                            )}
                                                            <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {activeTab === "instructors" && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meet Your Instructors</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {course.instructors?.map((instructor) => (
                                            <div key={instructor._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                                                <div className="flex items-start">
                                                    <img
                                                        src={instructor.avatar || "/placeholder-avatar.jpg"}
                                                        alt={instructor.name}
                                                        className="h-16 w-16 rounded-full object-cover mr-4 border-2 border-gray-100 dark:border-gray-700"
                                                    />
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{instructor.name}</h3>
                                                        <div className="flex items-center mt-1">
                                                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
                                                                {instructor.rating} ({instructor.totalCourses} courses)
                                                            </span>
                                                        </div>
                                                        {instructor.bio && (
                                                            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                                                                {instructor.bio}
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
                                    <div className="space-y-4">
                                        {course.faqs?.map((faq, index) => (
                                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <button
                                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                    className="flex justify-between items-center w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <h3 className="font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                                                    <ChevronRight
                                                        className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === index ? "rotate-90" : ""
                                                            }`}
                                                    />
                                                </button>
                                                {expandedFaq === index && (
                                                    <div className="px-6 pb-6 pt-0 border-t border-gray-200 dark:border-gray-700">
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

                    {/* RIGHT COLUMN — Fixed Preview Video Card (1/4 width) */}
                    <div className="lg:col-span-2">
                        <div
                            ref={videoCardRef}
                            className={`bg-white dark:bg-gray-800 rounded-lg dark:border-gray-700 p-4 transition-all duration-300 ease-in-out ${isVideoCardFixed
                                ? 'fixed top-22 right-8 w-72 lg:w-96 z-30 shadow-xl'
                                : 'sticky top-22'
                                }`}
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                {course.title}
                            </h3>
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-4 relative group">
                                {course.thumbnail && (
                                    <img
                                        src={course.thumbnail?.url ? `${ImageBaseUrl}/${course.thumbnail.url}` : "/placeholder-course.jpg"}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="space-y-3">
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                >
                                    Enroll Now
                                </Button>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Duration</span>
                                        <span>{course.duration || "1 Year"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Mode</span>
                                        <span className="capitalize">{course.mode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Language</span>
                                        <span className="capitalize">{course.language}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}