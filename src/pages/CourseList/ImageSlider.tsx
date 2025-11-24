// components/ImageSlider.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface SlideImage {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
}

interface ImageSliderProps {
  images: SlideImage[];
  autoPlay?: boolean;
  interval?: number;
  height?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function ImageSlider({
  images,
  autoPlay = true,
  interval = 5000,
  height = "h-96 md:h-[500px]",
  primaryColor = "#ced4afff",
  secondaryColor = "#fe572a",
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [direction, setDirection] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (images.length <= 1) return;
    if (e.key === "ArrowLeft") {
      setDirection(-1);
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      setDirection(1);
      goToNext();
    } else if (e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    }
  }, [images.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [isPlaying, images.length, interval]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const togglePlayPause = () => setIsPlaying(!isPlaying);

  // 3D Slide Variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.92,
      rotateY: direction > 0 ? -8 : 8,
      zIndex: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      zIndex: 2,
      transition: {
        x: { type: "spring", stiffness: 350, damping: 30 },
        opacity: { duration: 0.35 },
        scale: { duration: 0.45, ease: "easeOut" },
        rotateY: { duration: 0.4 },
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.92,
      rotateY: direction < 0 ? -8 : 8,
      zIndex: 1,
      transition: {
        x: { type: "spring", stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.35 },
        rotateY: { duration: 0.3 },
      },
    }),
  };

  if (images.length === 0) return null;

  const currentSlide = images[currentIndex];

  return (
    <div
      ref={sliderRef}
      className={`relative ${height} overflow-hidden rounded-2xl bg-gray-900/10 backdrop-blur-sm focus:outline-none shadow-xl border border-white/10`}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image Slider"
    >
      {/* 3D Slider */}
      <div className="absolute inset-0 perspective-1000">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${currentIndex + 1} of ${images.length}`}
          >
            {/* Image */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <img
                src={currentSlide.url || "https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/6b6f3cf1-090a-4705-9bd8-bbc0311260af.jpg"}
                alt={currentSlide.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Gradient Overlay */}
            {/* <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" /> */}

            {/* Content */}
            {/* <div className="relative z-10 p-6 md:p-8 text-white max-w-3xl">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
              >
                <h2 className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-md">
                  {currentSlide.title}
                </h2>
                <p className="text-lg md:text-xl mb-2 opacity-95 drop-shadow-sm">
                  {currentSlide.subtitle}
                </p>
                <p className="text-sm md:text-base mb-4 line-clamp-2 opacity-85">
                  {currentSlide.description}
                </p>
                {currentSlide.ctaText && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 rounded-full font-semibold text-white shadow-lg transition-all"
                    style={{ backgroundColor: secondaryColor }}
                    aria-label={`Call to action: ${currentSlide.ctaText}`}
                  >
                    {currentSlide.ctaText}
                  </motion.button>
                )}
              </motion.div>
            </div> */}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* === CONTROLLERS (ALWAYS VISIBLE) === */}

      {/* Left Arrow */}
      {images.length > 1 && (
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full shadow-lg z-20"
          aria-label="Previous slide"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      )}

      {/* Right Arrow */}
      {images.length > 1 && (
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full shadow-lg z-20"
          aria-label="Next slide"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      )}

      {/* Play/Pause Button */}
      {/* {images.length > 1 && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full shadow-lg z-20"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          style={{ backgroundColor: secondaryColor }}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </motion.button>
      )} */}

      {/* Dots Indicator */}
      {/* {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 backdrop-blur-sm bg-black/30 px-3 py-2 rounded-full z-20"
          role="tablist"
          aria-label="Slides navigation"
        >
          {images.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "w-6" : "opacity-80"
              }`}
              style={{
                backgroundColor: index === currentIndex ? secondaryColor : primaryColor,
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentIndex}
              role="tab"
            />
          ))}
        </div>
      )} */}

      {/* Slide Counter */}
      {images.length > 1 && (
        <div
          className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-sm px-2.5 py-1 rounded-full font-mono text-xs z-20"
          style={{ backgroundColor: `${primaryColor}80` }}
        >
          {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}