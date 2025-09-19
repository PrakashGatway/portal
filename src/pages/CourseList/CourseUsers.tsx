"use client"

import { useState } from "react"
import FullWidthSearch from "./FullwidthSearch"
import ImageSlider from "./ImageSlider"
import CourseList from "./CourseList"
import FeaturedCourseSlider from "./FeaturedCourse"
// import ImageSlider from "@/components/image-slider"
// import FeaturedCourseSlider from "@/components/featured-course-slider"
// import CourseList from "@/components/course-list"

const mockCourses = [
  {
    _id: "1",
    title: "Lakshya JEE 3.0 2026",
    subtitle: "For JEE Aspirants",
    code: "JEE3-2026",
    slug: "lakshya-jee-3-0-2026",
    description: "Complete JEE preparation with live classes, doubt solving, and test series",
    shortDescription: "Master JEE with comprehensive preparation program",
    thumbnail: { url: "https://d2bps9p1kiy4ka.cloudfront.net/5eb393ee95fab7468a79d189/1bfd3747-f0db-4344-b073-d6f417ce7993.jpg" },
    rating: 4.8,
    reviews: 2847,
    studentsEnrolled: 15420,
    duration: "10 months",
    pricing: { amount: 12999, discount: 25, originalAmount: 17332 },
    instructorNames: ["Alakh Pandey", "Prateek Jain", "Nishant Vora"],
    tags: ["JEE", "Physics", "Chemistry", "Mathematics"],
    status: "active",
    mode: "live",
    categoryInfo: { name: "JEE" },
    language: "hindi",
    featured: true,
    hasInfinityPlan: true,
  },
  {
    _id: "2",
    title: "NEET Yakeen 2.0",
    subtitle: "For NEET Aspirants",
    code: "NEET-Y2-2026",
    slug: "neet-yakeen-2-0-2026",
    description: "Complete NEET preparation with expert faculty and comprehensive study material",
    shortDescription: "Comprehensive NEET preparation program",
    thumbnail: { url: "https://d2bps9p1kiy4ka.cloudfront.net/5eb393ee95fab7468a79d189/1bfd3747-f0db-4344-b073-d6f417ce7993.jpg" },
    rating: 4.7,
    reviews: 1923,
    studentsEnrolled: 12340,
    duration: "12 months",
    pricing: { amount: 14999, discount: 20, originalAmount: 18749 },
    instructorNames: ["Sachin Rana", "Vipin Sharma", "Tarun Kumar"],
    tags: ["NEET", "Biology", "Chemistry", "Physics"],
    status: "active",
    mode: "live",
    categoryInfo: { name: "NEET" },
    language: "hindi",
    featured: true,
    hasInfinityPlan: false,
  },
  {
    _id: "3",
    title: "Arjuna JEE 2026",
    subtitle: "Advanced JEE Preparation",
    code: "ARJ-JEE-2026",
    slug: "arjuna-jee-2026",
    description: "Advanced level JEE preparation for serious aspirants",
    shortDescription: "Advanced JEE preparation course",
    thumbnail: { url: "https://d2bps9p1kiy4ka.cloudfront.net/5eb393ee95fab7468a79d189/1bfd3747-f0db-4344-b073-d6f417ce7993.jpg" },
    rating: 4.9,
    reviews: 1456,
    studentsEnrolled: 8750,
    duration: "8 months",
    pricing: { amount: 9999, discount: 30, originalAmount: 14284 },
    instructorNames: ["Alakh Pandey", "Nishant Vora"],
    tags: ["JEE", "Advanced", "Mathematics"],
    status: "active",
    mode: "recorded",
    categoryInfo: { name: "JEE" },
    language: "english",
    featured: false,
    hasInfinityPlan: true,
  },
]

const heroImages = [
  {
    id: "1",
    url: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/5e065e49-c332-48f2-9bf3-b4d5e1b74f2a.jpg",
    title: "LAKSHYA POWER BATCH",
    subtitle: "JEE 2026 | FOR CLASS 12",
    description:
      "Master JEE with India's most trusted coaching platform. Live classes, doubt solving, personal mentors, and unlimited test series.",
    ctaText: "Enroll Now - Up to 30% OFF",
    ctaLink: "/courses/lakshya-jee",
  },
  {
    id: "2",
    url: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6b6f3cf1-090a-4705-9bd8-bbc0311260af.jpg",
    title: "NEET YAKEEN 2.0",
    subtitle: "Complete Medical Entrance Preparation",
    description:
      "Comprehensive NEET preparation with expert faculty, live doubt sessions, and extensive test series for medical aspirants.",
    ctaText: "Start Your Journey",
    ctaLink: "/courses/neet-yakeen",
  },
  {
    id: "3",
    url: "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6b6f3cf1-090a-4705-9bd8-bbc0311260af.jpg",
    title: "ARJUNA BATCH",
    subtitle: "Advanced JEE Preparation",
    description:
      "Take your JEE preparation to the next level with advanced concepts, problem-solving techniques, and expert guidance.",
    ctaText: "Join Advanced Batch",
    ctaLink: "/courses/arjuna-jee",
  },
]

const recentSearches = [
  "JEE 2026",
  "Physics Wallah",
  "Organic Chemistry",
  "Mathematics",
  "NEET Biology",
  "Test Series",
  "Lakshya Batch",
  "Chemistry",
]

export default function CourseListingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState(mockCourses)
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearchLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      if (query.trim()) {
        const filtered = mockCourses.filter(
          (course) =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.subtitle.toLowerCase().includes(query.toLowerCase()) ||
            course.code.toLowerCase().includes(query.toLowerCase()) ||
            course.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
        )
        setSearchResults(filtered)
      } else {
        setSearchResults(mockCourses)
      }
      setIsSearchLoading(false)
    }, 300)
  }

  const featuredCourses = mockCourses.filter((course) => course.featured)

  return (
    <div className="min-h-[84vh] max-w-7xl mx-auto text-foreground">
      <section className="pb-6 pt-3">
        <div className="max-w-7xl mx-auto">
          <FullWidthSearch
            onSearch={handleSearch}
            searchResults={searchResults}
            recentSearches={recentSearches}
            isLoading={isSearchLoading}
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto pb-4 px-3">
        <ImageSlider images={heroImages} autoPlay={true} interval={6000} height="h-60 md:h-[250px]" />
      </section>

      <FeaturedCourseSlider courses={featuredCourses} title="Featured Courses" autoPlay={true} interval={5000} />

      <CourseList
        courses={searchQuery ? searchResults : mockCourses}
        title={searchQuery ? `Search Results for "${searchQuery}"` : "All Courses"}
        showFilters={true}
        itemsPerPage={9}
      />
    </div>
  )
}
