import { useState, useEffect } from "react"
import FullWidthSearch from "./FullwidthSearch"
import ImageSlider from "./ImageSlider"
import CourseList from "./CourseList"
import FeaturedCourseSlider from "./FeaturedCourse"
import api from "../../axiosInstance"

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
      const response = await api.get("/courses", { params })
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
    fetchCourses()
  }, [])

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

  return (
    <div className="min-h-[84vh] max-w-6xl mx-auto text-foreground ">
      <section className="pb-6 pt-3">
        <div className="max-w-4xl mx-auto">
          <FullWidthSearch
            onSearch={handleSearch}
            searchResults={filteredCourses}
            recentSearches={recentSearches}
            isLoading={isSearchLoading}
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto pb-4 px-3">
        <ImageSlider 
          images={heroImages} 
          autoPlay={true} 
          interval={8000} 
          height="h-40 md:h-[250px]" 
          primaryColor="#daff02"
          secondaryColor="#fe572a"
        />
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
        primaryColor="#daff02"
        secondaryColor="#fe572a"
      />

      
     {featuredCourses.length > 0 && (
        <FeaturedCourseSlider
          courses={featuredCourses}
          title="Featured Courses"
          autoPlay={true}
          interval={5000}
          primaryColor="#daff02"
          secondaryColor="#fe572a"
        />
      )} 
    </div>
  )
}