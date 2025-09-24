// components/FeaturedCourseSlider.tsx
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Calendar,
  Tag
} from "lucide-react"
import Button from "../../components/ui/button/Button"
import { ImageBaseUrl } from "../../axiosInstance"

interface Course {
  _id: string
  title: string
  subtitle: string
  code: string
  shortDescription?: string
  thumbnail?: { url: string }
  rating: number
  reviews: number
  studentsEnrolled: number
  duration?: string
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
  instructors?: { _id: string; name: string }[]
  tags: string[]
  level?: string
  language: string
  schedule?: {
    startDate: string
    endDate: string
  }
  hasInfinityPlan?: boolean
  featured?: boolean
  status?: string
}

interface FeaturedCourseSliderProps {
  courses: Course[]
  title?: string
  autoPlay?: boolean
  interval?: number
}

export default function FeaturedCourseSlider({
  courses,
  title = "Featured Courses",
  autoPlay = true,
  interval = 5000,
}: FeaturedCourseSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [direction, setDirection] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (courses.length <= 1) return

    if (e.key === "ArrowLeft") {
      setDirection(-1)
      goToPrevious()
    } else if (e.key === "ArrowRight") {
      setDirection(1)
      goToNext()
    } else if (e.key === " ") {
      e.preventDefault()
      toggleAutoplay()
    }
  }, [courses.length])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!isPlaying || courses.length <= 1) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % courses.length)
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, courses.length, interval])

  const goToPrevious = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length)
  }

  const goToNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % courses.length)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying)
  }

  const formatPrice = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (date: string) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Variants for slide animations
  const slideVariants = {
    hiddenRight: {
      x: "100%",
      opacity: 0,
    },
    hiddenLeft: {
      x: "-100%",
      opacity: 0,
    },
    visible: {
      x: "0",
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3,
      },
    },
  }

  if (courses.length === 0) return null

  const currentCourse = courses[currentIndex]

  // Calculate pricing
  const discountPercent =
    currentCourse?.pricing?.earlyBird?.discount > 0 &&
      new Date() < new Date(currentCourse?.pricing?.earlyBird?.deadline)
      ? currentCourse?.pricing?.earlyBird?.discount
      : currentCourse?.pricing?.discount > 0
        ? currentCourse?.pricing?.discount
        : 0

  const isEarlyBirdActive =
    currentCourse?.pricing?.earlyBird?.discount > 0 &&
    new Date() < new Date(currentCourse?.pricing?.earlyBird?.deadline)

  const originalPrice = currentCourse?.pricing.originalAmount || currentCourse?.pricing.amount
  const finalPrice = discountPercent > 0
    ? originalPrice * (1 - discountPercent / 100)
    : originalPrice

  return (
    <section
      className="py-6 pb-3 relative group"
      aria-label="Featured Courses Carousel"
      tabIndex={0}
    >
      <div className="mx-auto px-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h2>

          <div className="flex items-center space-x-4">
            {courses.length > 1 && (
              <>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevious}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm"
                    aria-label="Previous course"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm"
                    aria-label="Next course"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial={direction > 0 ? "hiddenRight" : "hiddenLeft"}
              animate="visible"
              exit="exit"
              className="w-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${currentIndex + 1} of ${courses.length}`}
            >
              <div className="py-6 px-4 md:px-6">
                <div className="rounded-lg overflow-hidden transition-all duration-300 group h-full flex flex-col lg:flex-row">
                  <div className="w-full lg:w-6/12 p-6 flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {currentCourse?.featured && (
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          FEATURED
                        </span>
                      )}
                      {currentCourse?.level && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${currentCourse?.level === 'beginner' ? 'bg-green-500' :
                          currentCourse?.level === 'intermediate' ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}>
                          {currentCourse?.level.toUpperCase()}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          {discountPercent}% OFF
                        </span>
                      )}
                      {isEarlyBirdActive && (
                        <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                          EARLY BIRD
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {currentCourse?.title} ({currentCourse?.code})
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      {currentCourse?.subtitle}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {currentCourse?.shortDescription || "Comprehensive course with expert guidance and extensive study material."}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {currentCourse?.tags.slice(0, 4).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                        <span>Starts: {formatDate(currentCourse?.schedule?.startDate || new Date().toISOString())}</span>
                        {currentCourse?.status === 'upcoming' && (
                          <span className="ml-3 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                            {getDaysRemaining(currentCourse?.schedule?.startDate || new Date().toISOString())} days left
                          </span>
                        )}
                      </div>

                      {isEarlyBirdActive && (
                        <div className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-3 py-2 rounded-lg inline-block">
                          Early bird offer ends {formatDate(currentCourse?.pricing.earlyBird?.deadline || '')}
                        </div>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2 text-sm">
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {currentCourse?.studentsEnrolled?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 capitalize">
                            {currentCourse?.language || 'English'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Language</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {currentCourse?.duration || '10 months'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <BookOpen className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            {currentCourse?.instructors?.length || currentCourse?.instructorNames?.length || 1}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Instructors</p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="mt-auto pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-baseline space-x-3">
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {formatPrice(finalPrice, currentCourse?.pricing.currency)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-xl text-gray-500 dark:text-gray-400 line-through">
                              {formatPrice(originalPrice, currentCourse?.pricing.currency)}
                            </span>
                          )}
                        </div>

                        {discountPercent > 0 && (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            Save {discountPercent}%
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 px-6 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                          Enroll Now
                        </button>
                        <button className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-6 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Thumbnail */}
                  <div className="w-full lg:w-6/12 relative my-auto pt-3">
                    <div className="rounded-xl overflow-hidden aspect-video">
                      <img
                        src={
                          !currentCourse?.thumbnail?.url
                            ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                            : `${ImageBaseUrl}/${currentCourse?.thumbnail.url}`
                        }
                        alt={currentCourse?.title}
                        className="w-full h-full object-fit"
                        onError={() => setImageError(true)}
                      />
                    </div>
                    <div className="absolute -top-7 right-2">
                      <div className="flex items-center">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="ml-1 text-base font-bold text-gray-900 dark:text-white">
                            {currentCourse?.rating || '4.8'}
                          </span>
                          <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                            ({currentCourse?.reviews?.toLocaleString() || '1000+'} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {discountPercent > 0 && (
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg">
                          <span className="flex items-center">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            {discountPercent}% OFF
                          </span>
                        </div>
                      )}
                      {isEarlyBirdActive && (
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            EARLY BIRD
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Indicators */}
        {courses.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {courses.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 w-6"
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}