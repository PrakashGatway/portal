// components/FeaturedCourseSlider.tsx
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Users, Clock } from "lucide-react"
import Button from "../../components/ui/button/Button"

interface Course {
  _id: string
  title: string
  subtitle: string
  thumbnail?: { url: string }
  rating: number
  reviews: number
  studentsEnrolled: number
  duration?: string
  pricing: { amount: number; discount: number }
  instructorNames: string[]
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

  const formatPrice = (amount: number) => `₹${amount.toLocaleString()}`

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
                    className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    aria-label="Previous course"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    aria-label="Next course"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 backdrop-blur-sm p-1">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-center py-6 px-6 md:px-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-3"
                >
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-800 text-white rounded-full text-sm font-medium shadow-lg">
                    <Star className="h-4 w-4 mr-2 fill-current" />
                    Featured Course
                  </div>

                  <h3 className="text-xl md:text-2xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {courses[currentIndex].title}
                  </h3>

                  <p className="text-lg md:text-lg text-gray-600 dark:text-gray-300">
                    {courses[currentIndex].subtitle}
                  </p>

                  <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {courses[currentIndex].rating.toFixed(1)} ({courses[currentIndex].reviews.toLocaleString()} reviews)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span>{courses[currentIndex].studentsEnrolled.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span>{courses[currentIndex].duration || "10 months"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-baseline space-x-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(courses[currentIndex].pricing.amount)}
                      </span>
                      {courses[currentIndex].pricing.discount > 0 && (
                        <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                          {formatPrice(
                            Math.round(
                              courses[currentIndex].pricing.amount /
                                (1 - courses[currentIndex].pricing.discount / 100)
                            )
                          )}
                        </span>
                      )}
                    </div>
                    {courses[currentIndex].pricing.discount > 0 && (
                      <span className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                        {courses[currentIndex].pricing.discount}% OFF
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      Enroll Now
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all"
                    >
                      Learn More
                    </Button>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Instructors:</span>{" "}
                      {courses[currentIndex].instructorNames.join(", ")}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative"
                >
                  <div className="rounded-xl overflow-hidden shadow-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 aspect-video">
                    <img
                      src={
                        courses[currentIndex].thumbnail?.url ||
                        `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(
                          courses[currentIndex].title
                        )}`
                      }
                      alt={courses[currentIndex].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {courses[currentIndex].pricing.discount > 0 && (
                    <div className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-600 dark:to-orange-600 text-white px-5 py-3 rounded-full text-sm font-bold shadow-lg animate-pulse">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        LIMITED OFFER
                      </span>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Indicators */}
        {courses.length > 1 && (
          <div className="flex justify-center mt-6 space-x-1">
            {courses.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-gray-700 dark:bg-gray-300 w-5"
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