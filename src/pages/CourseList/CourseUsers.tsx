import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, Search, X, SlidersHorizontal,
  Clock, Star,
  BookOpen,
  TrendingUp
} from "lucide-react"

// NOTE: Adjust these imports to match your actual project structure
import api from "../../axiosInstance"
import { useAuth } from "../../context/UserContext"
import { useNavigate } from "react-router"
import CourseCard from "./CourseCard"
import CourseSupportFooter from "../../components/SupportFooter"

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

type Course = {
  _id: string
  title: string
  subtitle: string
  code: string
  slug: string
  description: string
  shortDescription: string
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
  level?: string
  schedule?: { startDate: string; endDate: string }
}

type FilterState = {
  category: string
  subcategory: string
  status: string
  level: string
  mode: string
  featured: boolean | string | null
  language: string
  startDate: string
  endDate: string
  minPrice: number
  maxPrice: number
  sort: string
  page: number
  limit: number
  search?: string
}

const COLORS = {
  primary: "#FF6B35",
  primaryDark: "#E85A2D",
  primaryLight: "#FFF0EB",
  secondary: "#2D3436",
  accent: "#00B894",
  background: "#FAFAFA",
  cardBg: "#FFFFFF",
  border: "#E8E8E8",
  textPrimary: "#2D3436",
  textSecondary: "#636E72",
  textLight: "#B2BEC3",
}

const heroImages = [
  {
    id: "1",
    url: "/images/1.jpg",
    title: "LAKSHYA POWER BATCH",
    subtitle: "JEE 2026 | FOR CLASS 12",
    description: "Master JEE with India's most trusted coaching platform. Live classes, doubt solving, personal mentors.",
    ctaText: "Enroll Now - Up to 30% OFF",
    ctaLink: "/courses/lakshya-jee",
  },
  {
    id: "2",
    url: "/images/2.jpg",
    title: "NEET YAKEEN 2.0",
    subtitle: "Complete Medical Entrance Preparation",
    description: "Comprehensive NEET preparation with expert faculty, live doubt sessions, and extensive test series.",
    ctaText: "Start Your Journey",
    ctaLink: "/courses/neet-yakeen",
  },
  {
    id: "3",
    url: "/images/3.jpg",
    title: "ARJUNA BATCH",
    subtitle: "Advanced JEE Preparation",
    description: "Take your JEE preparation to the next level with advanced concepts and expert guidance.",
    ctaText: "Join Advanced Batch",
    ctaLink: "/courses/arjuna-jee",
  },
]

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: '🎁' },
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

const ImageSlider = ({ images, autoPlay = true, interval = 5000, height = "h-40 md:h-[250px]" }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [autoPlay, images.length, interval])

  const goToPrevious = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
  }

  if (!images || images.length === 0) return null
  const currentSlide = images[currentIndex]

  return (
    <div className={`relative ${height} overflow-hidden rounded-2xl bg-gray-100 shadow-lg`}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <img
            src={currentSlide.url || "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6b6f3cf1-090a-4705-9bd8-bbc0311260af.jpg"}
            alt={currentSlide.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" /> */}
          {/* <div className="absolute inset-0 flex items-center p-6 md:p-10">
            <div className="max-w-xl text-white">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="text-2xl md:text-4xl font-bold mb-2"
              >
                {currentSlide.title}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-lg md:text-xl font-medium mb-2 text-orange-300"
              >
                {currentSlide.subtitle}
              </motion.p>
              <motion.p 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-sm md:text-base mb-4 line-clamp-2 text-gray-200"
              >
                {currentSlide.description}
              </motion.p>
              {currentSlide.ctaText && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 rounded-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {currentSlide.ctaText}
                </motion.button>
              )}
            </div>
          </div> */}
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-mono">
            {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </div>
        </>
      )}
    </div>
  )
}

export default function CourseListingPage() {
  const { user } = useAuth() as any
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  let navigate = useNavigate();

  const [filters, setFilters] = useState<FilterState>({
    category: "", subcategory: "", status: "", level: "", mode: "",
    featured: null, language: "", startDate: "", endDate: "",
    minPrice: 0, maxPrice: 99000, sort: "-createdAt", page: 1, limit: 9, search: ""
  })

  const [courses, setCourses] = useState<Course[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [isSearching, setIsSearching] = useState(false) // Controls skeleton visibility in grid only
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) setRecentSearches(JSON.parse(saved))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowRecentSearches(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => {
        if (
          prev.search === searchQuery &&
          prev.page === 1
        ) {
          return prev; // Don't update state
        }

        return {
          ...prev,
          search: searchQuery,
          page: 1,
        };
      });
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsSearching(true)
      try {
        const params: any = { ...filters }

        Object.keys(params).forEach(key => {
          if (params[key] === "" || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })

        if (user?.category?._id && !params.category) {
          params.category = user.category._id
        }

        const response = await api.get(`/courses`, { params })
        setCourses(response.data?.data || [])
        setTotalCourses(response.data?.total || 0)
        setHasLoadedInitially(true)
      } catch (error) {
        console.error("Failed to fetch courses:", error)
        setCourses([])
        setTotalCourses(0)
      } finally {
        setIsSearching(false)
      }
    }

    fetchCourses()
  }, [filters, user?.category?._id])

  // Handlers
  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim()
    setSearchQuery(trimmed)

    if (trimmed) {
      const updated = [trimmed, ...recentSearches.filter(q => q !== trimmed)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    setFilters(prev => ({ ...prev, search: trimmed, page: 1 }))
    setShowRecentSearches(false)
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    const newFilters: any = { page: 1 }

    switch (tabId) {
      case 'featured': newFilters.featured = true; newFilters.sort = undefined; break
      case 'new': newFilters.sort = '-createdAt'; newFilters.featured = undefined; newFilters.status = undefined; break
      case 'popular': newFilters.sort = '-studentsEnrolled'; newFilters.featured = undefined; newFilters.status = undefined; break
      case 'ending': newFilters.status = 'upcoming'; newFilters.sort = undefined; newFilters.featured = undefined; break
      default: newFilters.featured = undefined; newFilters.sort = '-createdAt'; newFilters.status = undefined; break
    }

    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sort: value, page: 1 }))
    setShowSortDropdown(false)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setActiveTab("all")
    setFilters({
      category: "", subcategory: "", status: "", level: "", mode: "",
      featured: null, language: "", startDate: "", endDate: "",
      minPrice: 0, maxPrice: 99000, sort: "-createdAt", page: 1, limit: 9, search: ""
    })
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    if (filters.minPrice > 0) count++
    if (filters.maxPrice < 99000) count++
    if (filters.search) count++
    return count
  }

  const totalPages = Math.ceil(totalCourses / filters.limit)
  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === filters.sort)?.label || 'Newest First'

  const getPaginationRange = () => {
    const range = []
    const maxVisible = 5
    let start = Math.max(1, filters.page - 2)
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-2 pt-3 space-y-4">
        <ImageSlider images={heroImages} autoPlay={true} interval={6000} height="h-44 md:h-[240px]" />

        <div className="flex items-end justify-between pt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: COLORS.textPrimary }}>
              {filters.search ? `Results for "${filters.search}"` : "Explore Courses"}
            </h1>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
              {totalCourses} courses available
            </p>
          </div>
        </div>

        <div ref={searchContainerRef} className="relative">
          <div
            className="flex items-center w-full rounded-2xl border-2 transition-all duration-300 bg-white"
            style={{ borderColor: showRecentSearches ? COLORS.primary : COLORS.border }}
          >
            <Search className="ml-4 h-5 w-5 flex-shrink-0" style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchQuery)}
              onFocus={() => setShowRecentSearches(true)}
              placeholder="Search courses, categories....."
              className="w-full px-4 py-3.5 text-base bg-white border-0 rounded-2xl focus:outline-none focus:ring-0"
              style={{ color: COLORS.textPrimary }}
            />
            {searchQuery && (
              <button onClick={() => handleSearchSubmit("")} className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" style={{ color: COLORS.textSecondary }} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showRecentSearches && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-30 p-2 overflow-hidden"
              >
                <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> Recent Searches
                </div>
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onMouseDown={() => handleSearchSubmit(term)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-orange-50 flex items-center gap-3 text-sm font-semibold text-gray-700 transition-colors group"
                  >
                    <Clock className="h-4 w-4 text-gray-500 group-hover:text-orange-500" />
                    {term}
                  </button>
                ))}
                <button
                  onMouseDown={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 text-xs text-red-500 font-semibold mt-1 transition-colors border-t border-gray-50"
                >
                  Clear Recent Searches
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Top Filters & Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 pb-2">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none flex items-center gap-2"
                  style={
                    isActive
                      ? { backgroundColor: COLORS.primary, color: "#FFFFFF", boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)" }
                      : { backgroundColor: COLORS.cardBg, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }
                  }
                >
                  {/* <span>{tab.icon}</span> */}
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Sort & Clear Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap hover:bg-gray-100"
              style={{ color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Clear</span>
              {getActiveFiltersCount() > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border bg-white hover:bg-gray-50"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
                <span>Sort: {currentSortLabel}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border z-20 overflow-hidden bg-white"
                      style={{ borderColor: COLORS.border }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value)}
                          className="w-full px-4 font-medium py-3 text-left text-sm transition-colors hover:bg-orange-50 flex items-center justify-between"
                          style={{ color: filters.sort === option.value ? COLORS.primary : COLORS.textPrimary }}
                        >
                          {option.label}
                          {filters.sort === option.value && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 5. Course Grid (with Skeleton on Search/Filter) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {isSearching ? (
            Array.from({ length: filters.limit }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-9 bg-gray-200 rounded-xl w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : courses.length > 0 ? (
            // Actual Courses
            courses.map((course) => <CourseCard key={course._id} course={course} />)
          ) : (
            // Empty State
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>No courses found</h3>
              <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>Try adjusting your search terms or clearing some filters</p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: COLORS.primary }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* 6. Pagination */}
        {totalPages > 1 && !isSearching && courses.length > 0 && (
          <div className="flex justify-center items-center mt-12 space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md bg-white"
              style={{ borderColor: COLORS.border, color: filters.page === 1 ? COLORS.textLight : COLORS.textPrimary }}
            >
              Previous
            </button>

            {getPaginationRange().map((page) => {
              const isActivePage = filters.page === page
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className="w-11 h-11 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md"
                  style={
                    isActivePage
                      ? { backgroundColor: COLORS.primary, color: "#FFFFFF", boxShadow: "0 4px 12px rgba(255, 107, 53, 0.4)" }
                      : { backgroundColor: COLORS.cardBg, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }
                  }
                >
                  {page}
                </button>
              )
            })}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, filters.page + 1))}
              disabled={filters.page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md bg-white"
              style={{ borderColor: COLORS.border, color: filters.page === totalPages ? COLORS.textLight : COLORS.textPrimary }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <CourseSupportFooter />
    </div>
  )
}