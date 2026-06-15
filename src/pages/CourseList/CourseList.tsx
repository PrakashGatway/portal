import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Filter, Search, X, SlidersHorizontal } from "lucide-react"
import Button from "../../components/ui/button/Button"
import FilterDrawer from "./FilterDrawer"
import CourseCard from "./CourseCard"

interface Course {
    _id: string
    title: string
    subtitle: string
    code: string
    thumbnail?: { url: string }
    rating: number
    reviews: number
    studentsEnrolled: number
    duration?: string
    pricing: { amount: number; discount: number; originalAmount?: number }
    instructorNames: string[]
    tags: string[]
    status: string
    mode: string
    categoryInfo?: { name: string }
    language: string
    featured?: boolean
    hasInfinityPlan?: boolean
}

interface FilterState {
    category: string
    subcategory: string
    status: string
    level: string
    mode: string
    featured: boolean
    language: string
    startDate: string
    endDate: string
    minPrice: number
    maxPrice: number
    sort: string
    page: number
    limit: number
}

interface CourseListProps {
    courses: Course[]
    title?: string
    showFilters?: boolean
    itemsPerPage?: number
    totalCourses?: number
    onFilterChange?: (filters: Partial<FilterState>) => void
    onSortChange?: (sort: string) => void
    currentFilters?: FilterState
}

// Color Palette - Modern Test Prep Theme
const COLORS = {
    primary: "#FF6B35",        // Vibrant Orange - Primary Action
    primaryDark: "#E85A2D",    // Darker Orange - Hover
    primaryLight: "#FFF0EB",   // Light Orange - Backgrounds
    secondary: "#2D3436",      // Dark Gray - Text
    accent: "#00B894",         // Teal - Success/Secondary
    background: "#FAFAFA",     // Light Gray - Page Background
    cardBg: "#FFFFFF",         // White - Cards
    border: "#E8E8E8",         // Light Border
    textPrimary: "#2D3436",    // Primary Text
    textSecondary: "#636E72",  // Secondary Text
    textLight: "#B2BEC3",      // Light Text
    success: "#00B894",
    warning: "#FDCB6E",
    error: "#D63031",
}

const FILTER_TABS = [
    { id: 'all', label: 'All Offers', icon: '🎁' },
    { id: 'featured', label: 'Featured', icon: '⭐' },
    { id: 'new', label: 'New Arrivals', icon: '🆕' },
    { id: 'popular', label: 'Most Popular', icon: '🔥' },
    { id: 'ending', label: 'Ending Soon', icon: '⏰' },
]

const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: '-pricing.amount', label: 'Price: High to Low' },
    { value: 'pricing.amount', label: 'Price: Low to High' },
    { value: '-rating', label: 'Highest Rated' },
    { value: '-studentsEnrolled', label: 'Most Popular' },
    { value: '-pricing.discount', label: 'Best Discount' },
]

export default function CourseList({
    courses,
    itemsPerPage = 9,
    totalCourses = 0,
    onFilterChange,
    onSortChange,
    currentFilters,
}: CourseListProps) {
    const [sortBy, setSortBy] = useState(currentFilters?.sort || "-createdAt")
    const [currentPage, setCurrentPage] = useState(1)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("all")
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const [filters, setFilters] = useState<any>(currentFilters || {
        category: "",
        subcategory: "",
        status: "",
        level: "",
        mode: "",
        featured: "",
        language: "",
        startDate: "",
        endDate: "",
        minPrice: 0,
        maxPrice: 99000,
        sort: "-createdAt",
        page: 1,
        limit: 9,
    })

    const defaultFilters: FilterState = {
        category: "",
        subcategory: "",
        status: "",
        level: "",
        mode: "",
        featured: "",
        language: "",
        startDate: "",
        endDate: "",
        minPrice: 0,
        maxPrice: 99000,
        sort: "-createdAt",
        page: 1,
        limit: 9,
    };

    const handleClearFilters = () => {
        setFilters(defaultFilters);
        setSearchQuery("");
        setActiveTab("all");
        setSortBy("-createdAt");
        setCurrentPage(1);

        onFilterChange?.({
            ...defaultFilters,
            search: "",
        });

        onSortChange?.("-createdAt");
    };

    const totalPages = Math.ceil(totalCourses / itemsPerPage)

    const handleFilterToggle = () => {
        setIsFilterDrawerOpen(true)
    }

    const handleApplyFilters = (newFilters: any) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 }
        setFilters(updatedFilters)
        setCurrentPage(1)
        onFilterChange && onFilterChange(updatedFilters)
    }

    const handleSortChange = (value: string) => {
        setSortBy(value)
        setShowSortDropdown(false)
        onSortChange && onSortChange(value)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        onFilterChange && onFilterChange({ page })
    }

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId)
        // Apply filter based on tab
        const newFilters: any = { page: 1 }

        switch (tabId) {
            case 'featured':
                newFilters.featured = true
                break
            case 'new':
                newFilters.sort = '-createdAt'
                newFilters.featured = null
                break
            case 'popular':
                newFilters.sort = '-studentsEnrolled'
                newFilters.featured = null
                break
            case 'ending':
                newFilters.status = 'upcoming'
                newFilters.featured = null
                break
            case 'all':
            default:
                newFilters.featured = null
                newFilters.sort = '-createdAt'
                break
        }

        const updatedFilters = { ...filters, ...newFilters }
        setFilters(updatedFilters)
        setSortBy(newFilters.sort || filters.sort)
        onFilterChange && onFilterChange(updatedFilters)
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value
        setSearchQuery(query)
        // Debounce search if needed
        const timeoutId = setTimeout(() => {
            onFilterChange && onFilterChange({ search: query, page: 1 })
        }, 300)
        return () => clearTimeout(timeoutId)
    }

    const clearSearch = () => {
        setSearchQuery("")
        onFilterChange && onFilterChange({ search: "", page: 1 })
    }

    const getActiveFiltersCount = () => {
        let count = 0
        if (filters.category) count++
        if (filters.subcategory) count++
        if (filters.status) count++
        if (filters.level) count++
        if (filters.mode) count++
        if (filters.featured) count++
        if (filters.language) count++
        if (filters.startDate) count++
        if (filters.endDate) count++
        if (filters.minPrice !== 0) count++
        if (filters.maxPrice !== 99000) count++
        return count
    }

    const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || 'Newest First'

    return (
        <section className="py-4 relative">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-8">
                    <div className="relative mb-4">
                        <div
                            className="flex items-center w-full rounded-2xl border-2 transition-all duration-300"
                            style={{
                                backgroundColor: COLORS.cardBg,
                                borderColor: COLORS.border,
                            }}
                            onFocus={() => { }}
                        >
                            <Search
                                className="ml-4 h-5 w-5 flex-shrink-0"
                                style={{ color: COLORS.textSecondary }}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search offers, courses, or codes..."
                                className="w-full px-4 py-3 text-base bg-transparent border-0 rounded-2xl focus:outline-none focus:ring-0"
                                style={{
                                    color: COLORS.textPrimary,
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={clearSearch}
                                    className="mr-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-4 w-4" style={{ color: COLORS.textSecondary }} />
                                </button>
                            )}
                            <div className="flex items-center gap-2 mr-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 w-auto whitespace-nowrap"
                                    style={{
                                        backgroundColor: COLORS.primary,
                                        color: '#FFFFFF',
                                    }}
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    <span>Clear Filters</span>

                                    {getActiveFiltersCount() > 0 && (
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs font-bold"
                                            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                                        >
                                            {getActiveFiltersCount()}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs and Sort */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                            {FILTER_TABS.map((tab) => {
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabClick(tab.id)}
                                        className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2"
                                        style={
                                            isActive
                                                ? {
                                                    backgroundColor: COLORS.primary,
                                                    color: "#FFFFFF",
                                                    boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
                                                }
                                                : {
                                                    backgroundColor: COLORS.cardBg,
                                                    color: COLORS.textPrimary,
                                                    border: `1px solid ${COLORS.border}`,
                                                }
                                        }
                                    >
                                        {/* <span className="mr-1.5">{tab.icon}</span> */}
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border"
                                style={{
                                    backgroundColor: COLORS.cardBg,
                                    borderColor: COLORS.border,
                                    color: COLORS.textPrimary,
                                }}
                            >
                                <span>{currentSortLabel}</span>
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <AnimatePresence>
                                {showSortDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowSortDropdown(false)}
                                        />
                                        <div
                                            className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-20 overflow-hidden"
                                            style={{
                                                backgroundColor: COLORS.cardBg,
                                                borderColor: COLORS.border,
                                            }}
                                        >
                                            {SORT_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleSortChange(option.value)}
                                                    className="w-full px-4 font-medium py-2 text-left text-sm transition-colors hover:bg-gray-50 flex items-center justify-between"
                                                    style={{
                                                        color: sortBy === option.value ? COLORS.primary : COLORS.textPrimary,
                                                    }}
                                                >
                                                    {option.label}
                                                    {sortBy === option.value && (
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {courses.map((course, index) => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {courses.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
                            No courses found
                        </h3>
                        <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                            Try adjusting your search or filters
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-12 space-x-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                            style={{
                                backgroundColor: currentPage === 1 ? COLORS.background : COLORS.cardBg,
                                borderColor: COLORS.border,
                                color: currentPage === 1 ? COLORS.textLight : COLORS.textPrimary,
                            }}
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1
                            const isActivePage = currentPage === page
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className="w-11 h-11 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md"
                                    style={
                                        isActivePage
                                            ? {
                                                backgroundColor: COLORS.primary,
                                                color: "#FFFFFF",
                                                boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)",
                                            }
                                            : {
                                                backgroundColor: COLORS.cardBg,
                                                color: COLORS.textPrimary,
                                                border: `1px solid ${COLORS.border}`,
                                            }
                                    }
                                >
                                    {page}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                            style={{
                                backgroundColor: currentPage === totalPages ? COLORS.background : COLORS.cardBg,
                                borderColor: COLORS.border,
                                color: currentPage === totalPages ? COLORS.textLight : COLORS.textPrimary,
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* <FilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onApplyFilters={handleApplyFilters}
                initialFilters={filters}
                primaryColor={COLORS.primary}
                secondaryColor={COLORS.primaryDark}
            /> */}
        </section>
    )
}