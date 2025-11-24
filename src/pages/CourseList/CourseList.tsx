import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Filter } from "lucide-react"
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

export default function CourseList({
    courses,
    title = "All Courses",
    showFilters = true,
    itemsPerPage = 9,
    totalCourses = 0,
    onFilterChange,
    onSortChange,
    currentFilters,
}: CourseListProps) {
    const [sortBy, setSortBy] = useState(currentFilters?.sort || "-createdAt")
    const [currentPage, setCurrentPage] = useState(1)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>(currentFilters || {
        category: "",
        subcategory: "",
        status: "",
        level: "",
        mode: "",
        featured: false,
        language: "",
        startDate: "",
        endDate: "",
        minPrice: 0,
        maxPrice: 99000,
        sort: "-createdAt",
        page: 1,
        limit: 9,
    })

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
        onSortChange && onSortChange(value)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        onFilterChange && onFilterChange({ page })
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

    return (
        <section className="py-3 relative">
            <div className="max-w-7xl mx-auto px-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        {[
                            { id: 'all', label: 'All Course' },
                            { id: 'online', label: 'Online' },
                            { id: 'offline', label: 'Offline' },
                            { id: 'free', label: 'Free' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    const mode = tab.id === 'all' ? '' : tab.id
                                    handleApplyFilters({ mode })
                                }}
                                className={`
                                px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform
                                ${filters.mode === tab.id || (tab.id === 'all' && !filters.mode)
                                        ? 'bg-gradient-to-r from-[#fe572a] to-[#fe572a] text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {showFilters && (
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            >
                                <option value="-createdAt">Newest</option>
                                <option value="createdAt">Oldest</option>
                                <option value="pricing.amount">Price: Low to High</option>
                                <option value="-pricing.amount">Price: High to Low</option>
                                <option value="-rating">Highest Rated</option>
                                <option value="-studentsEnrolled">Most Popular</option>
                                <option value="-pricing.discount">Best Discount</option>
                            </select>

                            <Button
                                variant="outline"
                                size="sm"
                                className="border border-gray-300 relative dark:text-gray-200"
                                onClick={handleFilterToggle}
                            >
                                <Filter className="h-4 w-4" />
                                <span>Filters</span>
                                {getActiveFiltersCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-blue-600 text-gray-100 font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {getActiveFiltersCount()}
                                    </span>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence>
                        {courses.map((course, index) => (
                            <CourseCard key={course._id} course={course} />
                        ))}
                    </AnimatePresence>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-10 space-x-1">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Previous
                        </Button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    onClick={() => handlePageChange(page)}
                                    className={`w-10 h-10 ${currentPage === page
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {page}
                                </Button>
                            )
                        })}

                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
            
            <FilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onApplyFilters={handleApplyFilters}
                initialFilters={filters}
            />
        </section>
    )
}