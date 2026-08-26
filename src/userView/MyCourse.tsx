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
    MoreVertical,
    LoaderCircle,
    Activity,
    Files,
    TrendingUp
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

    const handleAction = () => {
      
            const examName = course.exam?.name?.toLowerCase() || "";
            if (examName.includes("gmat")) navigate(`/gmat/tests/${course?.item._id}`);
            else if (examName.includes("pte")) navigate(`/pte/tests/${course?.item._id}`);
            else if (examName.includes("gre")) navigate(`/gre/tests/${course?.item._id}`);
            else navigate(`/mcq/tests/${course?.item._id}`);
        } 
    


    // Grid View
    return (
        <>



            {course.itemType === "TestTemplate" ? (
                 <div className="p-[2px] rounded-[22px] bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
        <div className="bg-white dark:bg-gray-800 rounded-[17px] border border-[#EFEFEF] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
            <div className="relative h-[170px] overflow-hidden rounded-t-[18px] p-2">
                   <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />


            <div
              style={{ borderRadius: "15px 15px 0px 0px" }}
              className="relative overflow-hidden h-[170px]"
            >
              <img
                src={course?.thumbnailPic || "/images/test-img.jpg"}
                alt={course?.title || "Test"}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Image subtle overlay */}
           
         
          </div>
            <div className=" p-4 lg:p-5 gap-3 h-full">
                
                {/* Title */}
            <h3
              className="
                    text-[22px]
                    leading-7
                    font-medium
                    text-[#111111]
                    dark:text-white
                    line-clamp-2
                "
            >
              {course?.item?.title}
            </h3>

            {/* Description */}
            <p
              className="
                    mt-1
                    text-[16px]
                    leading-6
                    text-[#FF5A3C]
                    line-clamp-2
                "
            >
              {course?.item?.description ||
                `${course?.exam?.name || "Test"} full test series`}
            </p>

            {/* ================= META ================= */}
            <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-[16px] text-gray-600">
              {/* Validity */}
              <div className="flex items-center gap-2">
                <Clock className="h-[18px] w-[18px] shrink-0 text-[#FF5A3C]" />

                <span>Duration: {course?.item?.totalDurationMinutes}</span>
              </div>

              {/* Total Tests */}
              <div className="flex items-center gap-2">
                <BookOpen className="h-[18px] w-[18px] shrink-0 text-[#FF5A3C]" />

                <span>
                  Questions:{" "}
                  {course?.item?.totalTests || course?.item?.totalQuestions || 0}{" "}
                </span>
              </div>
            </div>
            {/* Language */}
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-[18px] w-[18px] shrink-0 text-[#FF5A3C]" />

              <span className="">Language: English</span>
            </div>

                {/* Difficulty Level */}
                <div className="flex items-center gap-2  pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] lg:text-[11px] text-[#6B7280] dark:text-gray-400 font-medium uppercase tracking-wide">
                        Diff:
                    </span>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                className={`h-1.5 w-3 lg:w-4 rounded-full transition-all ${
                                    level <= (course?.item?.difficultyLevel || 1)
                                        ? "bg-orange-500"
                                        : "bg-gray-200 dark:bg-gray-700"
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] lg:text-[11px] font-semibold text-orange-600 dark:text-orange-400 ml-auto">
                        {course?.item?.difficultyLevel === 1 && "Easy"}
                        {course?.item?.difficultyLevel === 2 && "Med"}
                        {course?.item?.difficultyLevel === 3 && "Hard"}
                        {course?.item?.difficultyLevel === 4 && "Exp"}
                        {course?.item?.difficultyLevel === 5 && "Mstr"}
                        {!course?.item?.difficultyLevel && "Easy"}
                    </span>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleAction}
                    className="mt-2 bg-[#ff7247] hover:to-orange-700 text-white text-xs lg:text-sm font-medium px-4 py-2.5 rounded-xl text-center transition-all duration-300 shadow-sm hover:shadow-md w-full"
                >
                    Start Test →
                </button>
            </div>
        </div>
    </div>
            ) : course.itemType === "Course" ? (
               <div className="bg-gradient-to-r from-black via-[#FAFAFA] to-white p-[1px] rounded-[22px] h-full">
    <div
        className="
            bg-[linear-gradient(90deg,#CFCFCF_0px,#F5F5F5_18px,#FFFFFF_40px,#FFFFFF_100%)]
            dark:bg-gray-800
            rounded-[22px]
            border border-[#EFEFEF]
            overflow-hidden
            shadow-sm
            hover:shadow-md
            transition-all
            duration-300
            relative
            flex
            flex-col
            xl:flex-row
            h-full
        "
    >

        {/* ================= BADGE ================= */}
        {course?.item?.featured === true && (
            <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-20">
                <span
                    className="
                        inline-flex
                        items-center
                        gap-1
                        sm:gap-1.5
                        rounded-full
                        border
                        border-orange-200
                        bg-white/95
                        px-2
                        sm:px-2.5
                        py-1
                        text-[9px]
                        sm:text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-[#FF6B35]
                        shadow-sm
                        backdrop-blur-sm
                        whitespace-nowrap
                    "
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
                    Featured
                </span>
            </div>
        )}

        {/* ================= IMAGE ================= */}
        <div
            className="
                relative
                w-full
                h-[180px]
                sm:h-[210px]
                md:h-[230px]
                lg:h-[240px]
                xl:w-[360px]
                xl:h-auto
                flex-shrink-0
                p-2
                bg-gray-50
                dark:bg-gray-900
            "
        >
            <div className="rounded-2xl overflow-hidden h-full w-full">
                <img
                    src={
                        course?.item?.thumbnailPic?.includes(
                            "res.cloudinary.com"
                        )
                            ? course.item.thumbnailPic
                            : `${ImageBaseUrl}/${course?.item?.thumbnail?.url}`
                    }
                    alt={course?.item?.title || "Course thumbnail"}
                    className="
                        w-full
                        h-full
                        object-cover
                        xl:object-contain
                    "
                />
            </div>
        </div>

        {/* ================= CENTER CONTENT ================= */}
        <div
            className="
                flex-1
                min-w-0
                flex
                flex-col
                justify-between
                p-3
                sm:p-4
                md:p-5
                lg:p-5
                xl:p-5
                xl:pl-16
            "
        >
            <div className="min-w-0">

                {/* TITLE */}
                <h2
                    className="
                        text-base
                        sm:text-lg
                        md:text-xl
                        lg:text-xl
                        xl:text-2xl
                        font-bold
                        text-[#111827]
                        dark:text-white
                        leading-tight
                        mb-2
                        line-clamp-2
                    "
                >
                    {course?.item?.title}
                </h2>

                {/* DESCRIPTION */}
                <p
                    className="
                        text-[#6B7280]
                        dark:text-gray-400
                        text-xs
                        sm:text-sm
                        lg:text-[14px]
                        xl:text-[15px]
                        leading-relaxed
                        line-clamp-2
                        xl:line-clamp-none
                        max-w-full
                        xl:max-w-[520px]
                    "
                >
                    {course?.item?.shortDescription?.length > 120
                        ? course?.item?.shortDescription.substring(0, 120) + "..."
                        : course?.item?.shortDescription}
                </p>

                {/* TAGS */}
                <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-1.5
                        sm:gap-2
                        my-2.5
                        sm:my-3
                        max-h-[48px]
                        overflow-hidden
                    "
                >
                    {course?.item?.tags
                        ?.slice(0, 12)
                        .map((item: string, index: number) => (
                            <span
                                key={`${item}-${index}`}
                                className="
                                    inline-flex
                                    items-center
                                    rounded-full
                                    border
                                    border-orange-200
                                    bg-orange-50
                                    px-2
                                    py-0.5
                                    text-[9px]
                                    sm:text-[10px]
                                    lg:text-xs
                                    font-medium
                                    text-orange-600
                                    whitespace-nowrap
                                "
                            >
                                {item}
                            </span>
                        ))}
                </div>
            </div>

            {/* ================= META ================= */}
            <div
                className="
                    flex
                    flex-wrap
                    gap-x-4
                    gap-y-2
                    mt-2
                    pt-3
                    border-t
                    border-gray-100
                    dark:border-gray-700
                "
            >
                {/* Days Left */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[#FF6B35] min-w-0">
                    <CalendarDays
                        size={16}
                        className="sm:w-[18px] sm:h-[18px] shrink-0"
                    />

                    <span
                        className="
                            text-[11px]
                            sm:text-xs
                            lg:text-[14px]
                            font-medium
                            whitespace-nowrap
                        "
                    >
                        {Math.max(
                            0,
                            Math.ceil(
                                (new Date(course?.accessExpiresAt) -
                                    new Date()) /
                                    (1000 * 60 * 60 * 24)
                            )
                        )}{" "}
                        <span className="text-[#6B7280] dark:text-gray-400 font-normal">
                            Days Left
                        </span>
                    </span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-[#FF6B35] min-w-0">
                    <Activity className="w-4 h-4 shrink-0" />

                    <span
                        className="
                            text-[11px]
                            sm:text-xs
                            lg:text-[14px]
                            font-medium
                            capitalize
                            truncate
                        "
                    >
                        {course?.item?.status}
                    </span>
                </div>
            </div>
        </div>

        {/* ================= RIGHT BUTTON ================= */}
        <div
            className="
                w-full
                xl:w-auto
                xl:min-w-[220px]
                p-3
                sm:p-4
                md:p-5
                lg:p-5
                xl:p-6
                xl:pt-0
                xl:pb-3
                xl:pl-0
                flex
                items-center
                justify-center
                xl:items-end
                xl:justify-end
            "
        >
            <Link
                to={`/course/${course?.item?.slug}?isCurriculum=true`}
                className="
                    w-full
                    sm:w-auto
                    min-w-0
                    xl:w-auto
                    bg-[#FF6B35]
                    hover:bg-[#f95d26]
                    text-white
                    px-5
                    sm:px-6
                    xl:px-4
                    py-2.5
                    sm:py-3
                    text-xs
                    sm:text-sm
                    rounded-xl
                    font-medium
                    transition
                    text-center
                    whitespace-nowrap
                    shadow-sm
                    hover:shadow-md
                "
            >
                Continue Learning &gt;
            </Link>
        </div>
    </div>
</div>
            ) : course.itemType === "McuTestSeries" ? (
              <div className="bg-gradient-to-r from-black via-[#FAFAFA] to-white p-[1px] rounded-[18px]">
    <div
        className="
            relative
            overflow-hidden
            rounded-[18px]
            border border-[#EFEFEF]
            bg-white
            shadow-sm
            transition-all duration-300
            hover:shadow-md
            dark:bg-gray-800
        "
    >
        {/* TEST TYPE */}
        {course?.item?.defaultTestType && (
            <div className="absolute right-3 top-3 z-9">
                <span
                    className="
                        inline-flex items-center gap-1.5
                        rounded-full
                        border border-orange-200
                        bg-white/95
                        px-2.5 py-1
                        text-[10px] font-bold
                        uppercase tracking-wide
                        text-[#FF6B35]
                        shadow-sm
                        backdrop-blur-sm
                    "
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
                    {course?.item?.defaultTestType}
                </span>
            </div>
        )}

        {/* IMAGE */}
        <div className="w-full h-[220px] p-2">
            <div className="w-full h-full overflow-hidden rounded-xl bg-gray-50">
                <img
                    src={
                        course?.item?.thumbnailPic?.includes(
                            "res.cloudinary.com"
                        )
                            ? course.item.thumbnailPic
                            : `${ImageBaseUrl}/${course?.item?.thumbnail?.url}`
                    }
                    alt={course?.item?.title || "Course thumbnail"}
                    className="w-full h-full object-cover"
                />
            </div>
        </div>

        {/* CONTENT */}
        <div className="px-3.5 pb-3.5 pt-1">

            {/* TITLE */}
            <h2
                className="
                    text-lg
                    font-bold
                    leading-tight
                    text-[#111827]
                    dark:text-white
                    line-clamp-1
                "
            >
                {course?.item?.title}
            </h2>

            {/* DESCRIPTION */}
            <p
                className="
                    mt-1.5
                    text-[13px]
                    leading-5
                    text-[#6B7280]
                    line-clamp-2
                "
            >
                {course?.item?.description}
            </p>

            {/* META */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3">

                <div className="inline-flex items-center gap-1.5">
                    <Files className="h-4 w-4 text-[#FF6B35]" />

                    <span className="text-xs font-medium text-gray-600">
                        {course?.item?.totalTests} Tests
                    </span>
                </div>

                {course?.item?.difficultyLevel && (
                    <div className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />

                        <span className="text-xs font-medium text-gray-600">
                            {course.item.difficultyLevel}
                        </span>
                    </div>
                )}

            </div>

            {/* BUTTON */}
            <div className="mt-3 flex justify-end">
                <Link
                    to={
                        course.itemType === "Course"
                            ? `/course/${course?.item?.slug}?isCurriculum=true`
                            : course.itemType === "McuTestSeries"
                                ? `/test-series/${course?.item?.slug}?isCurriculum=true`
                                : "#"
                    }
                    className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#FF6B35]
                        px-4 py-2.5
                        text-xs
                        font-semibold
                        text-white
                        whitespace-nowrap
                        transition-all
                        hover:bg-[#f95d26]
                        active:scale-[0.98]
                    "
                >
                    Continue Learning →
                </Link>
            </div>

        </div>
    </div>
</div>
            ) : null }
        </>

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
    // Logic remains exactly the same
    const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== 1 && v !== 6 && v !== '-enrolledAt');

    // State for the internal tabs (Sidebar)
    const [activeTab, setActiveTab] = useState<'status' | 'sort' | 'progress' | 'options'>('status');

    return (
        <div className="absolute z-10 top-70 right-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 shadow-sm w-70">
            {/* Header / Toggle Button */}
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
                        {/* COMPACT BOX LAYOUT */}
                        <div className="flex h-[240px]"> {/* Fixed height for stability */}

                            {/* LEFT SIDEBAR (Tabs) */}
                            <div className="w-22 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col py-2">
                                {[
                                    { id: 'status', label: 'Status' },
                                    { id: 'sort', label: 'Sort By' },
                                    { id: 'progress', label: 'Progress' },
                                    { id: 'options', label: 'Options' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`relative w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id
                                            ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {/* Active Indicator Line (like in your image) */}
                                        {activeTab === tab.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />
                                        )}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* RIGHT CONTENT AREA */}
                            <div className="flex-1 p-2 flex flex-col">
                                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                                    <AnimatePresence mode="wait">

                                        {/* TAB: STATUS */}
                                        {activeTab === 'status' && (
                                            <motion.div
                                                key="status"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className=""
                                            >
                                                {/* Radio-style list matching your image */}
                                                {[
                                                    { label: 'All Status', value: '' },
                                                    { label: 'Completed', value: 'true' },
                                                    { label: 'In Progress', value: 'false' },
                                                ].map((opt) => (
                                                    <label
                                                        key={opt.value}
                                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                                    >
                                                        <span className={`text-sm ${filters.isCompleted === opt.value ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {opt.label}
                                                        </span>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${filters.isCompleted === opt.value
                                                            ? 'border-orange-500 bg-orange-500'
                                                            : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-300'
                                                            }`}>
                                                            {filters.isCompleted === opt.value && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            checked={filters.isCompleted === opt.value}
                                                            onChange={() => onFilterChange('isCompleted', opt.value)}
                                                        />
                                                    </label>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* TAB: SORT */}
                                        {activeTab === 'sort' && (
                                            <motion.div
                                                key="sort"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className=""
                                            >
                                                {sortOptions.map((opt) => (
                                                    <label
                                                        key={opt.value}
                                                        className="flex gap-4 items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                                                    >
                                                        <span className={`text-sm ${filters.sort === opt.value ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {opt.label}
                                                        </span>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${filters.sort === opt.value
                                                            ? 'border-orange-500 bg-orange-500'
                                                            : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-300'
                                                            }`}>
                                                            {filters.sort === opt.value && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        <input
                                                            type="radio"
                                                            className="hidden"
                                                            checked={filters.sort === opt.value}
                                                            onChange={() => onFilterChange('sort', opt.value)}
                                                        />
                                                    </label>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* TAB: PROGRESS */}
                                        {activeTab === 'progress' && (
                                            <motion.div
                                                key="progress"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className="flex flex-col w-40 mx-auto justify-center h-full"
                                            >
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Minimum Percentage</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        min="0"
                                                        max="100"
                                                        value={filters.minPercentage}
                                                        onChange={(e) => onFilterChange('minPercentage', e.target.value)}
                                                        className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                                                </div>

                                            </motion.div>
                                        )}

                                        {/* TAB: OPTIONS */}
                                        {activeTab === 'options' && (
                                            <motion.div
                                                key="options"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                transition={{ duration: 0.15 }}
                                                className="space-y-2"
                                            >
                                                <label
                                                    className="grid grid-cols-1 items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:border-orange-200 dark:hover:border-orange-900"
                                                    onClick={() => onFilterChange('includeExpired', !filters.includeExpired)}
                                                >
                                                    <div className="flex ">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">Show Expired Items</span>

                                                    </div>

                                                    <span className="text-xs text-gray-500">Include items that have passed their deadline</span>
                                                    {/* Toggle Switch Style */}
                                                    <div className={`w-10 h-6 mt-4 rounded-full relative transition-colors duration-200 ease-in-out ${filters.includeExpired ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ease-in-out ${filters.includeExpired ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </div>
                                                </label>
                                            </motion.div>
                                        )}

                                    </AnimatePresence>
                                </div>

                                {/* FOOTER (Reset Button) - Only shows if active */}
                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <button
                                        onClick={onReset}
                                        disabled={!hasActiveFilters}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${hasActiveFilters
                                            ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed border border-transparent'
                                            }`}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
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
                        <div className="">

                            <motion.div
                                layout
                            >
                               <AnimatePresence mode="popLayout">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
            <motion.div
                key={course._id}
                layout
                className={
                    course.itemType === "Course"
                        ? "lg:col-span-3"
                        : "lg:col-span-1"
                }
            >
                <CourseCard
                    course={course}
                    onContinue={() => {}}
                />
            </motion.div>
        ))}
    </div>
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