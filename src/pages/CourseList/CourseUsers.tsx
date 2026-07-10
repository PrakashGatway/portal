import { useState, useEffect } from "react"
import FullWidthSearch from "./FullwidthSearch"
import ImageSlider from "./ImageSlider"
import CourseList from "./CourseList"
import FeaturedCourseSlider from "./FeaturedCourse"
import api from "../../axiosInstance"
import { useAuth } from "../../context/UserContext"
import { Loader } from "../../components/fullScreeLoader"
import { SkeletonCard } from "../Dashboard/userDashboard"

// Define types for better type safety
type Course = {
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
  pricing: { amount: number; discount: number; originalAmount: number }
  instructorNames: string[]
  tags: string[]
  status: string
  mode: string
  categoryInfo: { name: string }
  language: string
  featured: boolean
  hasInfinityPlan: boolean
  level?: string
  schedule?: {
    startDate: string
    endDate: string
  }
}

type HeroImage = {
  id: string
  url: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaLink: string
}

type FilterState = {
  category: string
  subcategory: string
  status: string
  level: string
  mode: string
  featured: boolean | string
  language: string
  startDate: string
  endDate: string
  minPrice: number
  maxPrice: number
  sort: string
  page: number
  limit: number
}

// Color Palette
const COLORS = {
  primaryDark: "#3F3F3F",    // Sidebar, headings, icons, charts, borders
  accentOrange: "#F6673C",   // Buttons, active menu, highlights, progress bars, stats growth
  cardBg: "#FFFFFF",         // Cards
  pageBg: "#F8F9FA",         // Page Background
  border: "#ECECEC",         // Borders
  mainText: "#2D2D2D",       // Main Text
  secondaryText: "#676868",  // Secondary text
  lightOrange: "#FFF3EF",    // Light orange tint for backgrounds
}

const heroImages: HeroImage[] = [
  {
    id: "1",
    url: "/images/1.jpg",
    title: "LAKSHYA POWER BATCH",
    subtitle: "JEE 2026 | FOR CLASS 12",
    description:
      "Master JEE with India's most trusted coaching platform. Live classes, doubt solving, personal mentors, and unlimited test series.",
    ctaText: "Enroll Now - Up to 30% OFF",
    ctaLink: "/courses/lakshya-jee",
  },
  {
    id: "2",
    url: "/images/2.jpg",
    title: "NEET YAKEEN 2.0",
    subtitle: "Complete Medical Entrance Preparation",
    description:
      "Comprehensive NEET preparation with expert faculty, live doubt sessions, and extensive test series for medical aspirants.",
    ctaText: "Start Your Journey",
    ctaLink: "/courses/neet-yakeen",
  },
  {
    id: "3",
    url: "/images/3.jpg",
    title: "ARJUNA BATCH",
    subtitle: "Advanced JEE Preparation",
    description:
      "Take your JEE preparation to the next level with advanced concepts, problem-solving techniques, and expert guidance.",
    ctaText: "Join Advanced Batch",
    ctaLink: "/courses/arjuna-jee",
  },
]

const recentSearches = [
  "GMAT",
  "SAT",
  "TOEFL",
  "IELTS",
  "GRE",
  "PTE Academic",
  "Duolingo",
]

export default function CourseListingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const { user } = useAuth() as any
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    subcategory: "",
    status: "",
    level: "",
    mode: "",
    featured: '',
    language: "",
    startDate: "",
    endDate: "",
    minPrice: 0,
    maxPrice: 99000,
    sort: "-createdAt",
    page: 1,
    limit: 12,
  })
  const [totalCourses, setTotalCourses] = useState(0)

  const fetchCourses = async (searchQuery: string = "", filterParams: Partial<FilterState> = {}) => {
    try {
      setIsLoading(true)
      const params: any = { ...filters, ...filterParams, limit: 12 }
      if (searchQuery) {
        params.search = searchQuery
      }
      Object.keys(params).forEach(key => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })
      const response = await api.get(`/courses?category=${user?.category?._id}`, { params })
      const courses: Course[] = response.data?.data || []
      const total = response.data?.total || 0

      setAllCourses(courses)
      setTotalCourses(total)
      const featured = courses.filter(course => course.featured)
      setFeaturedCourses(featured)
      setFilteredCourses(courses)
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      setAllCourses([])
      setFilteredCourses([])
      setFeaturedCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    const getCourses = async () => {
      setIsLoading(true);

      try {
        await fetchCourses();
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    getCourses();
  }, []);
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearchLoading(true)
    setTimeout(() => {
      fetchCourses(query)
      setIsSearchLoading(false)
    }, 300)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    fetchCourses(searchQuery, updatedFilters)
  }

  // Handle sort change
  const handleSortChange = (sortValue: string) => {
    handleFilterChange({ sort: sortValue })
  }

  if (isLoading) {
    return <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900">
      <div className="p-4 space-y-6">
        <div className="flex flex-col gap-3">
          <SkeletonCard className="w-full h-50" />
          <SkeletonCard className="w-50 h-12" />
          <SkeletonCard className="w-full h-12" />
        </div>
        <div className="flex gap-2">
          <SkeletonCard className="w-30 h-10" />
          <SkeletonCard className="w-30 h-10" />
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

  return (
    <div
      className="min-h-[84vh] dark:bg-gray-900 text-[#2D2D2D] dark:text-white max-w-7xl mx-auto"
    >
      {/* Search Section */}
      {/* <section className="pb-6 pt-3">
        <div className="max-w-4xl mx-auto">
          <FullWidthSearch
            onSearch={handleSearch}
            searchResults={filteredCourses}
            recentSearches={recentSearches}
            isLoading={isSearchLoading}
          />
        </div>
      </section> */}

      {/* Hero Slider */}
      <section className="max-w-7xl mx-auto pb-4 px-3">
        <ImageSlider
          images={heroImages}
          autoPlay={true}
          interval={8000}
          height="h-40 md:h-[250px]"
          primaryColor={COLORS.accentOrange}
          secondaryColor={COLORS.primaryDark}
        />
      </section>

      {/* Page Title */}
      <section className="max-w-7xl mx-auto px-4 pb-1 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: COLORS.mainText }}
            >
              {searchQuery ? `Results for "${searchQuery}"` : "Explore Courses"}
            </h1>
            <p
              className="text-sm"
              style={{ color: COLORS.secondaryText }}
            >
              {totalCourses} courses available
            </p>
          </div>
        </div>
      </section>

      <CourseList
        courses={filteredCourses}
        title={searchQuery ? `Search Results for "${searchQuery}"` : "All Courses"}
        showFilters={true}
        itemsPerPage={9}
        totalCourses={totalCourses}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        currentFilters={filters}
        primaryColor={COLORS.accentOrange}
        secondaryColor={COLORS.primaryDark}
      />
    </div>
  )
}