import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Users, Clock, Filter, TrendingUp } from "lucide-react"
import Button from "../../components/ui/button/Button"
import FilterDrawer from "./FilterDrawer"

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

interface CourseListProps {
    courses: Course[]
    title?: string
    showFilters?: boolean
    itemsPerPage?: number
}

export default function CourseList({
    courses,
    title = "All Courses",
    showFilters = true,
    itemsPerPage = 9,
}: CourseListProps) {
    const [sortBy, setSortBy] = useState("relevance")
    const [currentPage, setCurrentPage] = useState(1)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [filters, setFilters] = useState<FilterState>({
        selectedCategory: 'all',
        selectedType: 'all',
        selectedLanguage: 'all',
        priceRange: [0, 20000],
        discountRange: [0, 100],
        showEarlyBirdOnly: false,
        showInfinityPlanOnly: false,
    })

    const sortedCourses = [...courses].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.pricing.amount - b.pricing.amount
            case "price-high":
                return b.pricing.amount - a.pricing.amount
            case "rating":
                return b.rating - a.rating
            case "students":
                return b.studentsEnrolled - a.studentsEnrolled
            case "discount":
                return b.pricing.discount - a.pricing.discount
            default:
                return 0
        }
    })

    const totalPages = Math.ceil(sortedCourses.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const displayedCourses = sortedCourses.slice(startIndex, startIndex + itemsPerPage)

    const formatPrice = (amount: number) => `₹${amount.toLocaleString()}`

    const getTagColor = (tag: string) => {
        const colors: Record<string, string> = {
            jee: "bg-blue-500 text-white dark:bg-blue-600",
            neet: "bg-green-500 text-white dark:bg-green-600",
            physics: "bg-purple-500 text-white dark:bg-purple-600",
            chemistry: "bg-orange-500 text-white dark:bg-orange-600",
            mathematics: "bg-red-500 text-white dark:bg-red-600",
            biology: "bg-emerald-500 text-white dark:bg-emerald-600",
            advanced: "bg-indigo-500 text-white dark:bg-indigo-600",
        }
        return colors[tag.toLowerCase()] || "bg-gray-600 text-white dark:bg-gray-500"
    }
    const handleFilterToggle = () => {
        setIsFilterDrawerOpen(true)
    }

    const handleApplyFilters = (newFilters: any) => {
        setFilters(newFilters)
        setCurrentPage(1)
    }

    const getActiveFiltersCount = () => {
        let count = 0
        if (filters.selectedCategory !== 'all') count++
        if (filters.selectedType !== 'all') count++
        if (filters.selectedLanguage !== 'all') count++
        if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 20000) count++
        if (filters.discountRange[0] !== 0 || filters.discountRange[1] !== 100) count++
        if (filters.showEarlyBirdOnly) count++
        if (filters.showInfinityPlanOnly) count++
        return count
    }
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: "bg-green-500 text-white dark:bg-green-600",
            upcoming: "bg-yellow-500 text-black dark:bg-yellow-400 dark:text-black",
            completed: "bg-gray-500 text-white dark:bg-gray-600",
        }
        return colors[status.toLowerCase()] || "bg-gray-500 text-white dark:bg-gray-600"
    }

    return (
        <section className="py-3 relative">
            <div className="max-w-7xl mx-auto px-3">
                {/*<div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
                    <span className="text-gray-500 dark:text-gray-400">({courses.length} courses)</span>
                </div> */}
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
                                onClick={() => setFilters(prev => ({ ...prev, selectedType: tab.id }))}
                                className={`
                                px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform
                                ${filters.selectedType === tab.id
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
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
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            >
                                <option value="relevance">Sort by Relevance</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                                <option value="students">Most Popular</option>
                                <option value="discount">Best Discount</option>
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

                {/* Course Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {displayedCourses.map((course, index) => (
                            <motion.div
                                key={course._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
                                className="group"
                            >
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                                    {/* Thumbnail */}
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={
                                                course.thumbnail?.url ||
                                                `/placeholder.svg?height=200&width=400&text=${encodeURIComponent(course.title)}`
                                            }
                                            alt={course.title}
                                            className="w-full h-48 object-cover transition-transform duration-500"
                                        />

                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                            {course.featured && (
                                                <span className="bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
                                                    FEATURED
                                                </span>
                                            )}
                                            {course.pricing.discount > 0 && (
                                                <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow">
                                                    {course.pricing.discount}% OFF
                                                </span>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
                                            {course.tags.slice(0, 2).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getTagColor(tag)}`}
                                                >
                                                    {tag.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                                                    {course.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">{course.subtitle}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.code}</p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <div className="flex items-center">
                                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                    <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">{course.rating}</span>
                                                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({course.reviews})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Mode */}
                                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                                            <span className={`px-2 py-1 rounded-full ${getStatusColor(course.status)}`}>
                                                {course.status}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full capitalize">
                                                {course.mode}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full capitalize">
                                                {course.categoryInfo?.name}
                                            </span>
                                        </div>

                                        {/* Metadata Grid */}
                                        {/* <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{course.duration || "10 months"}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{course.studentsEnrolled.toLocaleString()} enrolled</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                        <TrendingUp className="h-4 w-4 flex-shrink-0" />
                        <span className="capitalize">{course.language}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{course.instructorNames.length} instructors</span>
                      </div>
                    </div> */}

                                        {/* Pricing & CTA */}
                                        <div className="mt-5 flex flex-col space-y-3">
                                            <div className="flex items-baseline justify-between">
                                                <div className="flex items-baseline space-x-1.5">
                                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {formatPrice(course.pricing.amount)}
                                                    </span>
                                                    {course.pricing.originalAmount && course.pricing.originalAmount > course.pricing.amount && (
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                            {formatPrice(course.pricing.originalAmount)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex space-x-2">
                                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                                    Enroll Now
                                                </Button>
                                                <Button variant="outline" size="icon" className="w-11 h-11 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M12 5v14M5 12h14" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-10 space-x-1">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Previous
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 ${currentPage === page
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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