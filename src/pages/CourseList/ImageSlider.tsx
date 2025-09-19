// components/ImageSlider.tsx
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"

interface SlideImage {
  id: string
  url: string
  title: string
  subtitle: string
  description: string
  ctaText?: string
  ctaLink?: string
}

interface ImageSliderProps {
  images: SlideImage[]
  autoPlay?: boolean
  interval?: number
  height?: string
}

export default function ImageSlider({
  images,
  autoPlay = true,
  interval = 5000,
  height = "h-96 md:h-[300px]",
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [direction, setDirection] = useState(0)

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (images.length <= 1) return
    
    if (e.key === "ArrowLeft") {
      setDirection(-1)
      goToPrevious()
    } else if (e.key === "ArrowRight") {
      setDirection(1)
      goToNext()
    } else if (e.key === " ") {
      e.preventDefault()
      togglePlayPause()
    }
  }, [images.length])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [isPlaying, images.length, interval])

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

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

  if (images.length === 0) return null

  return (
    <div 
      className={`relative ${height} overflow-hidden rounded-2xl bg-muted group focus:outline-none`}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image Slider"
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial={direction > 0 ? "hiddenRight" : "hiddenLeft"}
          animate="visible"
          exit="exit"
          className="absolute inset-0"
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${currentIndex + 1} of ${images.length}`}
        >
          <img
            src={images[currentIndex].url || "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6b6f3cf1-090a-4705-9bd8-bbc0311260af.jpg"}
            alt={images[currentIndex].title}
            className="w-full h-full object-cover"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" /> */}

          {/* Content Overlay */}
          {/* <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="max-w-3xl"
            >
              <h2 
                className="text-2xl md:text-4xl font-bold mb-2 text-balance text-white drop-shadow-2xl"
                aria-level={2}
              >
                {images[currentIndex].title}
              </h2>
              <p className="text-lg md:text-xl text-white mb-2 drop-shadow-xl">
                {images[currentIndex].subtitle}
              </p>
              <p className="text-sm md:text-base text-white mb-4 line-clamp-2 text-pretty drop-shadow-xl">
                {images[currentIndex].description}
              </p>
              {images[currentIndex].ctaText && (
                <Button 
                  size="lg" 
                  className="bg-primary p-2 hover:bg-primary/90 text-primary-foreground mt-2"
                  aria-label={`Call to action: ${images[currentIndex].ctaText}`}
                >
                  {images[currentIndex].ctaText}
                </Button>
              )}
            </motion.div>
          </div> */}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Play/Pause Button */}
      {images.length > 1 && (
        <button
          onClick={togglePlayPause}
          className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2"
          role="tablist"
          aria-label="Slides navigation"
        >
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "bg-white w-8" 
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentIndex}
              role="tab"
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {/* {images.length > 1 && (
        <div className="absolute top-4 left-4 bg-black/30 text-white text-sm px-2 py-1 rounded-md">
          {currentIndex + 1} / {images.length}
        </div>
      )} */}
    </div>
  )
}