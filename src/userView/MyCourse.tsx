// src/pages/MyCoursesPage.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    CheckCircle,
    Search,
    Grid,
    List,
    Award,
    Sparkles,
    Clock,
    Timer,
    ChevronRight,
    Filter,
    X,
    ChevronLeft,
    ChevronDown,
    Package,
    FileText,
    File,
    Video,
    Music,
    Link as LinkIcon,
    Layers,
    FileCheck,
    CalendarDays,
    Clock3,
    Play,
    MoreVertical
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api, { ImageBaseUrl } from "../axiosInstance";
import { Link, useNavigate } from "react-router";

// Types
interface CourseProgress {
    percentage: number;
    completedLessons: Array<{
        lesson: string;
        completedAt: string;
    }>;
}

interface PurchasedCourse {
    _id: string;
    itemId: string;
    itemType: 'Course' | 'package' | 'McuTestSeries' | 'TestTemplate' | 'subscription' | 'ilets' | 'PDF' | 'Video' | 'Document';
    item: {
        _id: string;
        title: string;
        slug?: string;
        thumbnail?: { url: string };
        description?: string;
        shortDescription?: string;
        duration?: string;
        level?: string;
        language?: string;
        status?: string;
        rating?: number;
        price?: number;
        salePrice?: number;
    };
    enrolledAt: string;
    accessExpiresAt?: string;
    isActive: boolean;
    isCompleted: boolean;
    completedAt?: string;
    progress: CourseProgress;
    totalTimeSpent: number;
    lastAccessedAt?: string;
    isExpired?: boolean;
    percentage: number;
}

interface FilterState {
    type: string;
    itemId: string;
    isActive: string;
    isCompleted: string;
    enrolledStart: string;
    enrolledEnd: string;
    accessStart: string;
    accessEnd: string;
    minPercentage: string;
    maxPercentage: string;
    includeExpired: boolean;
    page: number;
    limit: number;
    sort: string;
}

// "Course", "package", "McuTestSeries", "TestTemplate", "subscription", "ilets"
const materialTypes = [
    { value: '', label: 'Courses', icon: BookOpen },
    { value: 'McuTestSeries', label: 'Test Series', icon: FileCheck },
    { value: 'TestTemplate', label: 'Tests', icon: FileCheck },
    { value: 'package', label: 'Packages', icon: Package },
    { value: 'subscription', label: 'Subscriptions', icon: Sparkles }
];

const sortOptions = [
    { value: '-enrolledAt', label: 'Newest First' },
    { value: 'enrolledAt', label: 'Oldest First' },
    { value: '-lastAccessedAt', label: 'Recently Accessed' },
    { value: '-percentage', label: 'Highest Progress' },
    { value: 'percentage', label: 'Lowest Progress' },
];

const limitOptions = [6, 12, 24, 48];

// Helper: Get type-specific styling
const getTypeStyle = (type: string) => {
    const lowerType = type?.toLowerCase();
    switch (lowerType) {
        case 'pdf':
            return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', icon: FileText, iconColor: 'text-red-600' };
        case 'video':
        case 'course':
            return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: Video, iconColor: 'text-blue-600' };
        case 'document':
        case 'testtemplate':
            return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: File, iconColor: 'text-emerald-600' };
        case 'mcutestseries':
        case 'ilets':
            return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', icon: FileCheck, iconColor: 'text-purple-600' };
        case 'package':
            return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: Package, iconColor: 'text-amber-600' };
        case 'subscription':
            return { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800', icon: LinkIcon, iconColor: 'text-pink-600' };
        default:
            return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', icon: BookOpen, iconColor: 'text-gray-600' };
    }
};

const CourseCard = ({
    course,
    onContinue
}: {
    course: PurchasedCourse;
    viewMode: "grid" | "list";
    onContinue: (course: PurchasedCourse) => void;
}) => {
    const progress = course.progress?.percentage || 0;
    const isCompleted = course.isCompleted || progress >= 100;
    const isExpired = course.isExpired || (course.accessExpiresAt && new Date(course.accessExpiresAt).getTime() <= Date.now());
    const typeStyle = getTypeStyle(course.itemType);
    const TypeIcon = typeStyle.icon;

    const navigate = useNavigate();

    const handleContinue = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCompleted) {
            navigate(`/courses/${course.item?.slug || course.itemId}/certificate`);
        } else {
            if (course.itemType === "Course") {
                navigate(`/courses/${course.item?.slug || course.itemId}`);
            } else if (course.itemType === "McuTestSeries") {
                navigate(`/test-series/${course.item?.slug || course.itemId}`);
            } else if (course.itemType === "ilets") {
                navigate(`/ilets/${course.item?.slug || course.itemId}`);
            }
        }
        onContinue(course);
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return '0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // Grid View
    return (
        // <motion.div
        //     initial={{ opacity: 0, scale: 0.98 }}
        //     animate={{ opacity: 1, scale: 1 }}
        //     exit={{ opacity: 0, scale: 0.98 }}
        //     className={`group relative bg-white dark:bg-gray-800 rounded-xl border ${isExpired ? 'border-red-200 dark:border-red-800/50' : 'border-gray-200 dark:border-gray-700'} hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}
        // >
        //     {/* Header Image / Icon */}
        //     <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        //         {course.item?.thumbnail?.url ? (
        //             <img
        //                 src={`${ImageBaseUrl}/${course.item.thumbnail.url}`}
        //                 alt={course.item?.title}
        //                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        //             />
        //         ) : (
        //             <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${typeStyle.bg}`}>
        //                 <TypeIcon className={`h-10 w-10 ${typeStyle.iconColor}`} />
        //                 <span className={`text-xs font-medium ${typeStyle.text}`}>{course.itemType}</span>
        //             </div>
        //         )}

        //         {isExpired && (
        //             <div className="absolute inset-0 bg-red-900/60 backdrop-blur-[1px] flex items-center justify-center">
        //                 <span className="text-white text-sm font-bold px-3 py-1.5 bg-red-600 rounded-lg shadow-sm">EXPIRED</span>
        //             </div>
        //         )}

        //         <div className="absolute top-3 left-3">
        //             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border backdrop-blur-md bg-white/90 dark:bg-gray-900/90 ${typeStyle.text} ${typeStyle.border}`}>
        //                 <TypeIcon className="h-3 w-3" />
        //                 {course.itemType}
        //             </span>
        //         </div>
        //     </div>

        //     {/* Body */}
        //     <div className="p-4 flex flex-col flex-1">
        //         <h3
        //             onClick={handleContinue}
        //             className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-1"
        //         >
        //             {course.item?.title || 'Untitled Material'}
        //         </h3>
        //         <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
        //             {course.item?.shortDescription || course.item?.description || 'No description available'}
        //         </p>

        //         {/* Progress */}
        //         <div className="mb-4">
        //             <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        //                 <span className="flex items-center gap-1">
        //                     <Timer className="h-3 w-3" />
        //                     {formatTime(course.totalTimeSpent)}
        //                 </span>
        //                 <span className="font-medium">{Math.round(progress)}%</span>
        //             </div>
        //             <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        //                 <div
        //                     className={`h-full rounded-full transition-all duration-500 ${progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
        //                     style={{ width: `${Math.min(progress, 100)}%` }}
        //                 />
        //             </div>
        //         </div>

        //         {/* Action Button */}
        //         <Button
        //             onClick={handleContinue}
        //             size="sm"
        //             disabled={!course.isActive || isExpired}
        //             className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${isExpired || !course.isActive
        //                 ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
        //                 : isCompleted
        //                     ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
        //                     : 'bg-orange-600 hover:bg-orange-700 text-white'
        //                 }`}
        //         >
        //             {isExpired ? 'Expired' : isCompleted ? 'View Certificate' : progress === 0 ? 'Start Learning' : 'Continue'}
        //             <ChevronRight className="h-3.5 w-3.5" />
        //         </Button>
        //     </div>
        // </motion.div>

        <div className="bg-gradient-to-r from-black via-[#FAFAFA] to-white p-[1px] rounded-[22px] ">
            <div className="bg-[linear-gradient(90deg,#CFCFCF_0px,#F5F5F5_18px,#FFFFFF_40px,#FFFFFF_100%)] dark:bg-gray-800 rounded-[22px] border border-[#EFEFEF] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex flex-col lg:flex-row items-center">

                    {/* LEFT IMAGE */}
                    <div className="relative w-full lg:w-[360px] h-full lg:h-full flex-shrink-0 p-2">
                        <div className="rounded-2xl overflow-hidden h-full">
                            <img
                                src={`${ImageBaseUrl}/${course?.item?.thumbnail?.url}`}
                                alt={course?.item?.title}
                                className="w-full h-full object-contain "
                            />
                        </div>
                    </div>

                    {/* CENTER */}
                    <div className="flex-1 pl-4 lg:pl-16 py-4 lg:py-5">

                        <div className="flex justify-between w-full">
                            <div className="w-full">
                                <h2 className="text-xl lg:text-2xl font-bold text-[#111827] dark:text-white leading-tight">
                                    {course?.item?.title}
                                </h2>

                                <p className="text-[#6B7280] text-[14px] lg:text-[15px] mt-2 max-w-[520px] leading-6 lg:leading-7">
                                    {course?.item?.shortDescription?.length > 120
                                        ? course?.item?.shortDescription.substring(0, 120) + "..."
                                        : course?.item?.shortDescription}
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-5 lg:mt-6">

                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[#FF6B35] font-semibold text-sm">
                                    {course?.percentage}%
                                </span>

                                <span className="text-[#666] text-sm">
                                    Completed
                                </span>
                            </div>

                            <div className="w-full lg:w-120 h-[8px] bg-[#ECECEC] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#FF6B35] rounded-full transition-all duration-500"
                                    style={{ width: `${course?.percentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Days Left */}
                        <div className="flex mt-3 gap-2 items-center text-[#FF6B35]">
                            <CalendarDays size={18} />

                            <span className="text-[14px] lg:text-[15px]">
                                {Math.max(
                                    0,
                                    Math.ceil(
                                        (new Date(course?.accessExpiresAt) - new Date()) /
                                        (1000 * 60 * 60 * 24)
                                    )
                                )}{" "}
                                <span className="text-black dark:text-white">
                                    Days Left
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col mt-0 lg:mt-auto my-4 justify-center items-stretch lg:items-end px-4 lg:px-6 pb-0 lg:pb-0 gap-6 min-w-0 lg:min-w-[220px]">

                        <Link
                            to={`/course/${course?.item?.slug}?isCurriculum=true`}
                            className="bg-[#FF6B35] hover:bg-[#f95d26] text-white px-3 py-3 text-sm rounded-xl font-medium transition text-center whitespace-nowrap"
                        >
                            Continue Learning &gt;
                        </Link>

                    </div>

                </div>
            </div>
        </div>



    );
};

const CourseSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => {
    if (viewMode === "list") {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-full sm:w-48 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1 w-full space-y-3">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-4" />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse overflow-hidden">
            <div className="h-40 bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-4" />
                <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mt-4" />
            </div>
        </div>
    );
};

// Filter Panel Component
const FilterPanel = ({
    filters,
    onFilterChange,
    onReset,
    isOpen,
    onToggle
}: {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: any) => void;
    onReset: () => void;
    isOpen: boolean;
    onToggle: () => void;
}) => {
    const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== 1 && v !== 6 && v !== '-enrolledAt');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="font-medium text-sm text-gray-900 dark:text-white">Advanced Filters</span>
                    {hasActiveFilters && (
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ACTIVE
                        </span>
                    )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Status</label>
                                <select
                                    value={filters.isCompleted}
                                    onChange={(e) => onFilterChange('isCompleted', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="">All Status</option>
                                    <option value="true">Completed</option>
                                    <option value="false">In Progress</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sort By</label>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => onFilterChange('sort', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    {sortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Progress Min (%)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    value={filters.minPercentage}
                                    onChange={(e) => onFilterChange('minPercentage', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Show Expired</label>
                                <select
                                    value={filters.includeExpired ? 'true' : 'false'}
                                    onChange={(e) => onFilterChange('includeExpired', e.target.value === 'true')}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="false">Hide Expired</option>
                                    <option value="true">Show Expired</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-4 pb-4 flex items-center justify-end gap-2">
                            <Button
                                onClick={onReset}
                                variant="outline"
                                size="sm"
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reset
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<PurchasedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, limit: 12, hasPrev: false, hasNext: false, total: 0 });

    const [filters, setFilters] = useState<FilterState>({
        type: '',
        itemId: '',
        isActive: 'true',
        isCompleted: '',
        enrolledStart: '',
        enrolledEnd: '',
        accessStart: '',
        accessEnd: '',
        minPercentage: '',
        maxPercentage: '',
        includeExpired: false,
        page: 1,
        limit: 12,
        sort: '-enrolledAt'
    });

    const navigate = useNavigate();

    const fetchMyCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: filters.page,
                limit: filters.limit,
                sort: filters.sort,
                isActive: filters.isActive,
                includeExpired: filters.includeExpired ? 'true' : 'false',
            };

            if (filters.type) params.type = filters.type;
            if (filters.itemId) params.itemId = filters.itemId;
            if (filters.isCompleted !== '') params.isCompleted = filters.isCompleted;
            if (filters.enrolledStart) params.enrolledStart = filters.enrolledStart;
            if (filters.enrolledEnd) params.enrolledEnd = filters.enrolledEnd;
            if (filters.minPercentage) params.minPercentage = filters.minPercentage;
            if (filters.maxPercentage) params.maxPercentage = filters.maxPercentage;

            const response = await api.get("/purchase", { params });

            setCourses(response.data.data || []);
            setPagination({
                page: response.data.pagination?.page || 1,
                pages: response.data.pagination?.pages || 1,
                limit: response.data.pagination?.limit || 12,
                hasPrev: response.data.pagination?.hasPrev || false,
                hasNext: response.data.pagination?.hasNext || false,
                total: response.data.count || 0
            });
        } catch (err: any) {
            console.error("Failed to fetch purchased courses:", err);
            setError(err.response?.data?.message || "Failed to load materials");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchMyCourses();
    }, [fetchMyCourses]);

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch = searchQuery === '' ||
                course.item?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.item?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.itemType?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [courses, searchQuery]);

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handleResetFilters = () => {
        setFilters({
            type: '', itemId: '', isActive: 'true', isCompleted: '', enrolledStart: '',
            enrolledEnd: '', accessStart: '', accessEnd: '', minPercentage: '', maxPercentage: '',
            includeExpired: false, page: 1, limit: 12, sort: '-enrolledAt'
        });
        setSearchQuery('');
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            handleFilterChange('page', newPage);
        }
    };

    return (
        <div className="min-h-screen transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Learning</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-px text-sm">Track your progress and continue your study journey.</p>
                </motion.div>

                {/* Search & Controls */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, description, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                        {materialTypes.map((type) => {
                            const Icon = type.icon;
                            const isActive = filters.type === type.value;
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => handleFilterChange('type', type.value)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${isActive
                                        ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-200 dark:shadow-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {type.label}
                                </button>
                            );
                        })}
                        <div className="flex-1"></div>

                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${filterOpen || Object.values(filters).some(v => v !== '' && v !== false && v !== 1 && v !== 12 && v !== '-enrolledAt')
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-300'
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                    </div>
                </motion.div>

                {/* Filter Panel */}
                {filterOpen && <FilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                    isOpen={filterOpen}
                    onToggle={() => setFilterOpen(!filterOpen)}
                />}

                {/* Results Count */}
                <div className="flex items-center justify-between mt-6 mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredCourses.length}</span> of {pagination.total} materials
                    </p>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1 gap-5" : "space-y-4"}>
                        {[...Array(8)].map((_, i) => <CourseSkeleton key={i} viewMode={viewMode} />)}
                    </div>
                ) : error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load materials</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">{error}</p>
                        <Button onClick={() => fetchMyCourses()} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg">
                            Try Again
                        </Button>
                    </motion.div>
                ) : filteredCourses.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No materials found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                            {searchQuery || filters.type ? "Try adjusting your search or filters." : "You haven't enrolled in any materials yet."}
                        </p>
                        <Button onClick={() => navigate('/course')} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg">
                            Browse Catalog
                        </Button>
                    </motion.div>
                ) : (
                    <>
                        <div className=" gap-5">

                            <motion.div
                                layout
                                className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-5" : "space-y-4"}
                            >
                                <AnimatePresence mode="popLayout">
                                    {filteredCourses.map((course) => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            viewMode={viewMode}
                                            onContinue={() => { }}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                            <div>

                            </div>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-2 rounded-lg disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                                        let pageNum;
                                        if (pagination.pages <= 5) pageNum = i + 1;
                                        else if (pagination.page <= 3) pageNum = i + 1;
                                        else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                                        else pageNum = pagination.page - 2 + i;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${pagination.page === pageNum
                                                    ? 'bg-orange-600 text-white shadow-md'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-2 rounded-lg disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}