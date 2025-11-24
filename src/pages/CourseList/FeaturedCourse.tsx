// components/FeaturedCourseSlider.tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Calendar,
  Tag,
} from "lucide-react";
import { ImageBaseUrl } from "../../axiosInstance";

interface Course {
  _id: string;
  title: string;
  subtitle: string;
  code: string;
  shortDescription?: string;
  thumbnail?: { url: string };
  rating: number;
  reviews: number;
  studentsEnrolled: number;
  duration?: string;
  pricing: {
    amount: number;
    discount: number;
    originalAmount?: number;
    currency?: string;
    earlyBird?: {
      discount: number;
      deadline: string;
    };
  };
  instructorNames: string[];
  instructors?: { _id: string; name: string }[];
  tags: string[];
  level?: string;
  language: string;
  schedule?: {
    startDate: string;
    endDate: string;
  };
  featured?: boolean;
  status?: string;
}

interface FeaturedCourseSliderProps {
  courses: Course[];
  title?: string;
  autoPlay?: boolean;
  interval?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export default function FeaturedCourseSlider({
  courses,
  title = "Featured Courses",
  autoPlay = true,
  interval = 5000,
  primaryColor = "#daff02",
  secondaryColor = "#fe572a",
}: FeaturedCourseSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [direction, setDirection] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (courses.length <= 1) return;
    if (e.key === "ArrowLeft") {
      setDirection(-1);
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      setDirection(1);
      goToNext();
    } else if (e.key === " ") {
      e.preventDefault();
      toggleAutoplay();
    }
  }, [courses.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isPlaying || courses.length <= 1) return;
    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [isPlaying, courses.length, interval]);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  const toggleAutoplay = () => setIsPlaying(!isPlaying);

  const formatPrice = (amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getDaysRemaining = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const slideVariants = {
    hiddenRight: { x: "100%", opacity: 0 },
    hiddenLeft: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: direction > 0 ? "100%" : "-100%", transition: { duration: 0.3 } },
  };

  if (courses.length === 0) return null;

  const currentCourse = courses[currentIndex];

  const discountPercent =
    currentCourse?.pricing?.earlyBird?.discount > 0 &&
    new Date() < new Date(currentCourse?.pricing?.earlyBird?.deadline)
      ? currentCourse?.pricing?.earlyBird?.discount
      : currentCourse?.pricing?.discount > 0
      ? currentCourse?.pricing?.discount
      : 0;

  const isEarlyBirdActive =
    currentCourse?.pricing?.earlyBird?.discount > 0 &&
    new Date() < new Date(currentCourse?.pricing?.earlyBird?.deadline);

  const originalPrice = currentCourse?.pricing.originalAmount || currentCourse?.pricing.amount || 0;
  const finalPrice = discountPercent > 0 ? originalPrice * (1 - discountPercent / 100) : originalPrice;

  return (
    <section className="py-6 relative" aria-label="Featured Courses Carousel" tabIndex={0}>
      <div className="container-sm mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <h2 className="text-2xl font-bold" style={{ color: secondaryColor }}>
            {title}
          </h2>

          {courses.length > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                onClick={goToPrevious}
                className="p-1.5 rounded-full bg-white border shadow-sm"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                aria-label="Previous course"
              >
                <ChevronLeft className="h-4 w-4 text-gray-900" />
              </button>
              <button
                onClick={goToNext}
                className="p-1.5 rounded-full bg-white border shadow-sm"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                aria-label="Next course"
              >
                <ChevronRight className="h-4 w-4 text-gray-900" />
              </button>
            </div>
          )}
        </div>

        {/* Slider Card - FIXED HEIGHT 350PX */}
        <div
          className="relative overflow-hidden rounded-2xl border border-2 shadow-lg"
          style={{ borderColor: primaryColor, height: "320px" }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial={direction > 0 ? "hiddenRight" : "hiddenLeft"}
              animate="visible"
              exit="exit"
              className="flex flex-col lg:flex-row w-full h-full"
            >
              {/* LEFT: Beautiful Content */}
              <div className="lg:w-1/2 p-5 bg-white dark:bg-gray-800 flex flex-col">
                {/* Badges & Title */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentCourse.featured && (
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        FEATURED
                      </span>
                    )}
                    {currentCourse.level && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-white ${
                          currentCourse.level === "beginner"
                            ? "bg-green-500"
                            : currentCourse.level === "intermediate"
                            ? "bg-blue-500"
                            : "bg-purple-500"
                        }`}
                      >
                        {currentCourse.level.toUpperCase()}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        {discountPercent}% OFF
                      </span>
                    )}
                    {isEarlyBirdActive && (
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full text-black"
                        style={{ backgroundColor: primaryColor }}
                      >
                        EARLY BIRD
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {currentCourse.title}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-300 mb-2 italic">
                    {currentCourse.shortDescription || currentCourse.subtitle}
                  </p>

                  {/* Tags - Brand Styled */}
                  {/* <div className="flex flex-wrap gap-1.5 mb-4">
                    {currentCourse.tags.slice(0, 4).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full text-black"
                        style={{ backgroundColor: `${primaryColor}60` }}
                      >
                        <Tag className="h-2.5 w-2.5 mr-1" style={{ color: secondaryColor }} />
                        {tag}
                      </span>
                    ))}
                  </div> */}

                  {/* Schedule */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Calendar className="h-4 w-4 mr-1.5" style={{ color: primaryColor }} />
                    <span>Starts: {formatDate(currentCourse.schedule?.startDate || "")}</span>
                    {currentCourse.status === "upcoming" && (
                      <span
                        className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${primaryColor}30`, color: "#000" }}
                      >
                        {getDaysRemaining(currentCourse.schedule?.startDate || "")} days left
                      </span>
                    )}
                  </div>

                  {/* Early Bird Notice */}
                  {isEarlyBirdActive && (
                    <div
                      className="text-[11px] font-medium mb-3 px-2.5 py-1.5 rounded-lg inline-block"
                      style={{ backgroundColor: `${primaryColor}20`, color: "#000" }}
                    >
                      🕒 Early bird ends {formatDate(currentCourse.pricing.earlyBird?.deadline || "")}
                    </div>
                  )}
                </div>

                <div>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { icon: Users, label: "Students", value: currentCourse.studentsEnrolled?.toLocaleString() || "200", color: primaryColor },
                      { icon: TrendingUp, label: "Language", value: currentCourse.language || "English", color: secondaryColor },
                      { icon: Clock, label: "Duration", value: currentCourse.duration || "N/A", color: primaryColor },
                      { icon: BookOpen, label: "Instructors", value: (currentCourse.instructors?.length || currentCourse.instructorNames?.length || 1).toString(), color: secondaryColor },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center p-2.5 rounded-2xl bg-gray-100 border border-[#daff02] border-2 dark:bg-gray-700"
                      >
                        <div
                          className="p-1.5 rounded-md mr-2"
                          style={{ backgroundColor: `${item.color}15` }}
                        >
                          <item.icon className="h-5 w-5" style={{ color: secondaryColor }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing & CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(finalPrice, currentCourse.pricing.currency)}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-lg text-gray-500 line-through dark:text-gray-400">
                          {formatPrice(originalPrice, currentCourse.pricing.currency)}
                        </span>
                      )}
                      {discountPercent > 0 && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          Save {discountPercent}%
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white rounded"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        Enroll Now
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-semibold rounded border"
                        style={{ backgroundColor: primaryColor, color: "#000", borderColor: primaryColor }}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Full-height Image */}
              <div className="lg:w-1/2 relative">
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={
                      currentCourse.thumbnail?.url
                        ? `${ImageBaseUrl}/${currentCourse.thumbnail.url}`
                        : "https://www.gatewayabroadeducations.com/images/logo.svg"
                    }
                    alt={currentCourse.title}
                    className="w-full h-full object-cover rounded-2xl"
                    loading="lazy"
                  />
                </div>

                {/* Rating Badge */}
                {/* <div
                  className="absolute -top-3 -right-3 flex items-center px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-lg"
                  style={{ border: `2px solid ${primaryColor}` }}
                >
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-bold text-gray-900 dark:text-white">
                    {currentCourse.rating?.toFixed(1) || "4.8"}
                  </span>
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    ({currentCourse.reviews?.toLocaleString() || "1K+"})
                  </span>
                </div> */}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}