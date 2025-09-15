import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterIcon, LocationEditIcon, PilcrowRight, Search, SearchCheckIcon, Star, X, Clock, TrendingUp, Users, ShieldCheck, Moon, Sun } from 'lucide-react';
import moment from 'moment';

// Mock data derived from your CourseManagement structure
const mockCourses = [
  {
    _id: "1",
    title: "Lakshya JEE 3.0 2026",
    subtitle: "For JEE Aspirants",
    code: "JEE3-2026",
    slug: "lakshya-jee-3-0-2026",
    description: "Comprehensive preparation for JEE Main and Advanced with live classes, doubt solving, and personalized mentorship.",
    shortDescription: "Live classes, doubt solving, mentorship for JEE 2026",
    thumbnail: { url: "https://via.placeholder.com/400x250?text=Lakshya+JEE+3.0" },
    preview: { url: "https://via.placeholder.com/600x400?text=Preview+JEE+3.0" },
    categoryInfo: { name: "Online" },
    subcategoryInfo: { name: "JEE Preparation" },
    level: "advanced",
    mode: "online",
    language: "English",
    status: "ongoing",
    featured: true,
    tags: ["new", "featured", "popular"],
    extraFields: {},
    instructorNames: [
      { name: "Rahul Sir", email: "rahul@pw.com" },
      { name: "Anil Sir", email: "anil@pw.com" }
    ],
    schedule: {
      startDate: "2023-08-01T09:00:00Z",
      endDate: "2024-07-30T18:00:00Z",
      enrollmentDeadline: "2023-08-15T23:59:59Z",
      timezone: "Asia/Kolkata"
    },
    schedule_pattern: {
      frequency: "weekly",
      days: ["monday", "wednesday", "friday"],
      time: { start: "09:00", end: "12:00" },
      duration: 180
    },
    pricing: {
      currency: "₹",
      amount: 4000,
      originalAmount: 5000,
      discount: 20,
      earlyBird: {
        discount: 30,
        deadline: "2023-07-20T23:59:59Z"
      }
    },
    features: ["Interactive Live Learning", "One-on-One Doubt Solving", "Personal Academic Mentor"],
    requirements: ["Class 11th or 12th student", "Basic understanding of Physics"],
    objectives: ["Master JEE Main & Advanced syllabus", "Improve problem-solving speed", "Build exam temperament"],
    targetAudience: ["JEE aspirants", "Class 12 students", "Droppers"],
    createdAt: "2023-06-15T10:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    studentsEnrolled: 12000,
    rating: 4.8,
    reviews: 1247,
    hasInfinityPlan: true,
    type: "full-batch"
  },
  {
    _id: "2",
    title: "Lakshya JEE Hindi 2.0 2026",
    subtitle: "For IT JEE Aspirants",
    code: "JEEH-2026",
    slug: "lakshya-jee-hindi-2-0-2026",
    description: "Complete JEE preparation in Hindi with expert faculty and comprehensive study material.",
    shortDescription: "Full JEE prep in Hindi with live classes",
    thumbnail: { url: "https://via.placeholder.com/400x250?text=Lakshya+JEE+Hindi" },
    categoryInfo: { name: "Online" },
    subcategoryInfo: { name: "JEE Preparation" },
    level: "intermediate",
    mode: "online",
    language: "Hindi",
    status: "upcoming",
    featured: true,
    tags: ["new", "bilingual"],
    instructorNames: [{ name: "Amit Sir", email: "amit@pw.com" }],
    schedule: {
      startDate: "2023-09-01T09:00:00Z",
      endDate: "2024-07-30T18:00:00Z",
      enrollmentDeadline: "2023-09-10T23:59:59Z",
      timezone: "Asia/Kolkata"
    },
    pricing: {
      currency: "₹",
      amount: 1999,
      originalAmount: 4000,
      discount: 50,
      earlyBird: {
        discount: 60,
        deadline: "2023-08-25T23:59:59Z"
      }
    },
    features: ["Interactive Live Learning", "One-on-One Doubt Solving", "Personal Academic Mentor"],
    studentsEnrolled: 8500,
    rating: 4.9,
    reviews: 892,
    hasInfinityPlan: true,
    type: "full-batch"
  },
  {
    _id: "3",
    title: "Lakshya Power Batch JEE 2026",
    subtitle: "For Class 12",
    code: "PW-JEE-2026",
    slug: "lakshya-power-batch-jee-2026",
    description: "Powerful batch with intensive coaching and advanced learning techniques for maximum results.",
    shortDescription: "Intensive offline + online hybrid batch for top rankers",
    thumbnail: { url: "https://via.placeholder.com/400x250?text=Power+Batch" },
    categoryInfo: { name: "Hybrid" },
    subcategoryInfo: { name: "Elite Coaching" },
    level: "advanced",
    mode: "hybrid",
    language: "English",
    status: "ongoing",
    featured: true,
    tags: ["new", "featured", "popular"],
    instructorNames: [{ name: "Anil Sir", email: "anil@pw.com" }],
    schedule: {
      startDate: "2023-08-01T09:00:00Z",
      endDate: "2024-07-30T18:00:00Z",
      enrollmentDeadline: "2023-08-15T23:59:59Z",
      timezone: "Asia/Kolkata"
    },
    pricing: {
      currency: "₹",
      amount: 4900,
      originalAmount: 9900,
      discount: 50,
      earlyBird: {
        discount: 60,
        deadline: "2023-07-25T23:59:59Z"
      }
    },
    features: ["Interactive Live Learning", "One-on-One Doubt Solving", "Personal Academic Mentor", "Weekly Mock Tests"],
    studentsEnrolled: 15000,
    rating: 4.7,
    reviews: 2341,
    hasInfinityPlan: true,
    type: "full-batch"
  },
  {
    _id: "4",
    title: "REAL Test Series 12th JEE 2026",
    subtitle: "Get up to ₹400 OFF",
    code: "TS-JEE-2026",
    slug: "real-test-series-jee-2026",
    description: "Authentic test series with detailed analysis and performance tracking.",
    shortDescription: "Full-length mock tests with AI-based analysis",
    thumbnail: { url: "https://via.placeholder.com/400x250?text=Test+Series" },
    categoryInfo: { name: "Online" },
    subcategoryInfo: { name: "Test Series" },
    level: "beginner",
    mode: "online",
    language: "English",
    status: "ongoing",
    featured: false,
    tags: ["new", "test-series"],
    instructorNames: [{ name: "Expert Faculty", email: "faculty@pw.com" }],
    schedule: {
      startDate: "2023-08-02T00:00:00Z",
      endDate: "2024-01-31T23:59:59Z",
      enrollmentDeadline: "2024-01-20T23:59:59Z",
      timezone: "Asia/Kolkata"
    },
    pricing: {
      currency: "₹",
      amount: 1299,
      originalAmount: 1699,
      discount: 24,
      earlyBird: {
        discount: 30,
        deadline: "2023-08-10T23:59:59Z"
      }
    },
    features: ["Realistic Test Environment", "Detailed Analysis", "Performance Tracking"],
    studentsEnrolled: 6500,
    rating: 4.6,
    reviews: 765,
    hasInfinityPlan: false,
    type: "test-series"
  },
  {
    _id: "5",
    title: "Lakshya JEE 2026",
    subtitle: "For JEE 2026",
    code: "JEE-2026",
    slug: "lakshya-jee-2026",
    description: "Comprehensive JEE preparation with live classes and personalized guidance.",
    shortDescription: "All-in-one JEE prep with expert faculty",
    thumbnail: { url: "https://via.placeholder.com/400x250?text=Lakshya+JEE" },
    categoryInfo: { name: "Online" },
    subcategoryInfo: { name: "JEE Preparation" },
    level: "intermediate",
    mode: "online",
    language: "English",
    status: "upcoming",
    featured: false,
    tags: ["new", "popular"],
    instructorNames: [{ name: "Rajesh Sir", email: "rajesh@pw.com" }],
    schedule: {
      startDate: "2023-07-25T09:00:00Z",
      endDate: "2024-07-30T18:00:00Z",
      enrollmentDeadline: "2023-08-10T23:59:59Z",
      timezone: "Asia/Kolkata"
    },
    pricing: {
      currency: "₹",
      amount: 3499,
      originalAmount: 4999,
      discount: 30,
      earlyBird: {
        discount: 40,
        deadline: "2023-07-20T23:59:59Z"
      }
    },
    features: ["Interactive Live Learning", "One-on-One Doubt Solving", "Personal Academic Mentor"],
    studentsEnrolled: 10000,
    rating: 4.8,
    reviews: 1892,
    hasInfinityPlan: true,
    type: "full-batch"
  },
  {
    _id: "6",
    title: "Lakshya JEE 2.0 2026",
    subtitle: "For Class 12th",
    code: "JEE2-2026",
    slug: "lakshya-jee-2-0-2026",
    description: "Intensive offline coaching with expert faculty and comprehensive study material.",
    shortDescription: "Offline classroom experience with digital support",
    thumbnail: { url: "https://via.placeholder.com/400x250?text=Lakshya+JEE+2.0" },
    categoryInfo: { name: "Offline" },
    subcategoryInfo: { name: "JEE Preparation" },
    level: "advanced",
    mode: "offline",
    language: "English",
    status: "upcoming",
    featured: true,
    tags: ["new", "featured"],
    instructorNames: [{ name: "Sandeep Sir", email: "sandeep@pw.com" }],
    schedule: {
      startDate: "2023-08-01T09:00:00Z",
      endDate: "2024-07-30T18:00:00Z",
      enrollmentDeadline: "2023-08-15T23:59:59Z",
      timezone: "Asia/Kolkata"
    },
    pricing: {
      currency: "₹",
      amount: 4900,
      originalAmount: 9900,
      discount: 50,
      earlyBird: {
        discount: 60,
        deadline: "2023-07-25T23:59:59Z"
      }
    },
    features: ["Interactive Live Learning", "One-on-One Doubt Solving", "Personal Academic Mentor"],
    studentsEnrolled: 13500,
    rating: 4.7,
    reviews: 2145,
    hasInfinityPlan: true,
    type: "full-batch"
  }
];

const categories = [
  { value: 'all', label: 'All Courses' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'test-series', label: 'Test Series' },
  { value: 'free', label: 'Free' }
];

const types = [
  { value: 'all', label: 'All Types' },
  { value: 'full-batch', label: 'Full Batch' },
  { value: 'test-series', label: 'Test Series' },
  { value: 'live-workshop', label: 'Live Workshop' }
];

const languages = [
  { value: 'all', label: 'All Languages' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'bilingual', label: 'Bilingual' }
];

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'students', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'discount', label: 'Highest Discount' }
];

const getTagColor = (tag, isDark) => {
  const base = isDark ? 'bg-opacity-20' : 'bg-opacity-10';
  switch (tag) {
    case 'new': return `bg-yellow-500 text-white ${base}`;
    case 'featured': return `bg-purple-600 text-white ${base}`;
    case 'popular': return `bg-blue-500 text-white ${base}`;
    case 'bilingual': return `bg-green-500 text-white ${base}`;
    case 'test-series': return `bg-red-500 text-white ${base}`;
    default: return `bg-gray-500 text-white ${base}`;
  }
};

const getStatusColor = (status, isDark) => {
  const base = isDark ? 'dark:bg-opacity-20' : '';
  switch (status) {
    case 'upcoming': return `bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ${base}`;
    case 'ongoing': return `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 ${base}`;
    case 'completed': return `bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 ${base}`;
    case 'cancelled': return `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ${base}`;
    default: return `bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300 ${base}`;
  }
};

export default function CourseListingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [discountRange, setDiscountRange] = useState([0, 100]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showEarlyBirdOnly, setShowEarlyBirdOnly] = useState(false);
  const [showInfinityPlanOnly, setShowInfinityPlanOnly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Simulate fetching courses from API
  const [courses, setCourses] = useState(mockCourses);
  const [loading, setLoading] = useState(false);

  // Filtered courses
  const filteredCourses = courses
    .filter(course => {
      // Search
      if (searchQuery && !(
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
      )) return false;

      // Category
      if (selectedCategory !== 'all' && course.categoryInfo?.name.toLowerCase() !== selectedCategory) return false;

      // Type
      if (selectedType !== 'all' && course.type !== selectedType) return false;

      // Language
      if (selectedLanguage !== 'all' && course.language.toLowerCase() !== selectedLanguage) return false;

      // Price range
      if (course.pricing.amount < priceRange[0] || course.pricing.amount > priceRange[1]) return false;

      // Discount range
      if (course.pricing.discount < discountRange[0] || course.pricing.discount > discountRange[1]) return false;

      // Early Bird only
      if (showEarlyBirdOnly && (!course.pricing.earlyBird || !course.pricing.earlyBird.deadline)) return false;

      // Infinity Plan only
      if (showInfinityPlanOnly && !course.hasInfinityPlan) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.pricing.amount - b.pricing.amount;
        case 'price-high': return b.pricing.amount - a.pricing.amount;
        case 'rating': return b.rating - a.rating;
        case 'students': return b.studentsEnrolled - a.studentsEnrolled;
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'discount': return b.pricing.discount - a.pricing.discount;
        default: return 0;
      }
    });

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchPopupOpen(true);
  };

  const closeSearchPopup = () => setIsSearchPopupOpen(false);
  const openFilterDrawer = () => setIsFilterOpen(true);
  const closeFilterDrawer = () => setIsFilterOpen(false);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedLanguage('all');
    setPriceRange([0, 20000]);
    setDiscountRange([0, 100]);
    setSortBy('relevance');
    setShowEarlyBirdOnly(false);
    setShowInfinityPlanOnly(false);
  };

  // Get recent searches (mock)
  const recentSearches = ["JEE 2026", "Physics", "Chemistry", "Mathematics", "Test Series", "Lakshya"];

  // Format price with currency
  const formatPrice = (amount) => `${amount.toLocaleString()}₹`;

  // Get remaining days until enrollment deadline
  const getEnrollmentStatus = (deadline) => {
    const now = new Date();
    const due = new Date(deadline);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Enrollment Closed";
    if (diffDays <= 3) return `Ends in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    return `Enrolls until ${moment(deadline).format("MMM D")}`;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-lg">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchCheckIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for courses, instructors, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 shadow-sm"
                  />
                </form>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 animate-pulse" />
                ) : (
                  <Moon className="h-5 w-5 animate-pulse" />
                )}
              </button>
              <button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Explore All Courses
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDYwdjYwSDB6IiBmaWxsPSJ1cmwoI2xpbmVhckdyYWRpZW50KSIvPjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNmZmZmZmYiIHN0b3Atb3BhY2l0eT0iMC4xIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwLjAiLz48L2xpbmVhckdyYWRpZW50Pjwvc3ZnPg==')] opacity-5 dark:opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium backdrop-blur-sm">
                #TeachersDayWithPW
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                LAKSHYA POWER BATCH
                <span className="block text-2xl md:text-4xl font-normal text-gray-600 dark:text-gray-300 mt-2">JEE 2026 | FOR CLASS 12</span>
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-lg leading-relaxed">
                Master JEE with India’s most trusted coaching platform. Live classes, doubt solving, personal mentors, and unlimited test series.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl text-xl font-bold shadow-lg backdrop-blur-sm">
                  GET UP TO <br />
                  <span className="text-4xl">30% OFF</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>Verified by Top Educators</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span>15,000+ Students Enrolled</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                className="rounded-2xl overflow-hidden shadow-2xl bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm border border-white/10 dark:border-gray-700/50 p-1"
              >
                <img 
                  src="https://via.placeholder.com/600x400?text=Lakshya+Power+Batch+JEE+2026" 
                  alt="Lakshya Power Batch JEE 2026"
                  className="w-full h-auto object-cover rounded-xl"
                />
              </motion.div>
              <div className="absolute -top-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                LIMITED TIME OFFER
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters & Sort Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <button 
              onClick={openFilterDrawer}
              className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FilterIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <span className="font-medium text-gray-800 dark:text-gray-200">Filters</span>
            </button>
            <button 
              onClick={resetFilters}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Featured Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-gray-800/40 dark:to-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top-Rated Courses This Week</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Discover our most popular courses with 4.8+ ratings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-yellow-600 dark:text-yellow-400">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-semibold">4.8+ avg rating</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                <Users className="h-5 w-5" />
                <span className="font-semibold">25,000+ students</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <motion.div
                  key={course._id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group cursor-pointer"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-400 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden">
                      <img 
                        src={course.thumbnail?.url || "https://via.placeholder.com/400x250"} 
                        alt={course.title}
                        className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Badges */}
                      {course.featured && (
                        <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                          FEATURED
                        </div>
                      )}
                      {course.hasInfinityPlan && (
                        <div className="absolute top-3 right-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                          INFINITY PLAN
                        </div>
                      )}
                      {course.pricing.discount > 0 && (
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                          {course.pricing.discount}% OFF
                        </div>
                      )}
                      {course.pricing.earlyBird?.discount && (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm animate-pulse">
                          EARLY BIRD!
                        </div>
                      )}

                      {/* Tags */}
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                        {course.tags.map(tag => (
                          <span 
                            key={tag} 
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getTagColor(tag, isDarkMode)}`}
                          >
                            {tag.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{course.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{course.subtitle}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{course.code}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{course.rating}</span>
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">({course.reviews})</span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Mode */}
                      <div className="flex items-center mt-3 space-x-3 text-xs">
                        <span className={`px-2 py-1 rounded-full ${getStatusColor(course.status, isDarkMode)}`}>
                          {course.status}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                          {course.mode}
                        </span>
                        <span className="px-2 py-1 bg-blue-100/60 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full capitalize">
                          {course.categoryInfo?.name}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {course.shortDescription || course.description}
                      </p>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration || "10 months"}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{course.studentsEnrolled.toLocaleString()} enrolled</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-500">
                          <LocationEditIcon className="h-4 w-4" />
                          <span className="capitalize">{course.language}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-500">
                          <TrendingUp className="h-4 w-4" />
                          <span>{course.instructorNames.length} instructors</span>
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div className="mt-5 flex flex-col space-y-3">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(course.pricing.amount)}</span>
                            {course.pricing.originalAmount > course.pricing.amount && (
                              <span className="text-lg text-gray-500 dark:text-gray-600 line-through">{formatPrice(course.pricing.originalAmount)}</span>
                            )}
                          </div>
                          {course.pricing.earlyBird?.deadline && (
                            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full">
                              {getEnrollmentStatus(course.pricing.earlyBird.deadline)}
                            </span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            Enroll Now
                          </button>
                          <button className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-600 dark:text-gray-400 transition-colors duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No courses found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search term.</p>
                <button 
                  onClick={resetFilters}
                  className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination Placeholder */}
        <div className="flex justify-center mt-12">
          <button className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
            Load More Courses
          </button>
        </div>
      </main>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl overflow-y-auto border-l border-gray-200 dark:border-gray-800"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filters</h2>
                <button
                  onClick={closeFilterDrawer}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category.value} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={selectedCategory === category.value}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Type</h3>
                <div className="space-y-2">
                  {types.map(type => (
                    <label key={type.value} className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={selectedType === type.value}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Language</h3>
                <div className="space-y-2">
                  {languages.map(lang => (
                    <label key={lang.value} className="flex items-center">
                      <input
                        type="radio"
                        name="language"
                        value={lang.value}
                        checked={selectedLanguage === lang.value}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Price Range</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="20000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Range */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Discount (%)</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{discountRange[0]}%</span>
                    <span>{discountRange[1]}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={discountRange[0]}
                      onChange={(e) => setDiscountRange([parseInt(e.target.value), discountRange[1]])}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={discountRange[1]}
                      onChange={(e) => setDiscountRange([discountRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Filters */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showEarlyBirdOnly}
                    onChange={(e) => setShowEarlyBirdOnly(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Show Only Early Bird Offers</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showInfinityPlanOnly}
                    onChange={(e) => setShowInfinityPlanOnly(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-700 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Show Only Infinity Plan</span>
                </label>
              </div>

              {/* Apply Buttons */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex space-x-4">
                  <button
                    onClick={closeFilterDrawer}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 py-3 px-4 rounded-full text-sm font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={closeFilterDrawer}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-full text-sm font-medium transition-colors duration-200 shadow-md"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Popup */}
      <AnimatePresence>
        {isSearchPopupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeSearchPopup}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Courses</h2>
                <button
                  onClick={closeSearchPopup}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search for courses, instructors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 border border-gray-300 dark:border-gray-700 rounded-2xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 dark:text-white shadow-sm"
                  autoFocus
                />
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(search => (
                      <button
                        key={search}
                        onClick={() => {
                          setSearchQuery(search);
                          closeSearchPopup();
                        }}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full text-sm transition-colors duration-200"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <div className="max-h-80 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Results</h3>
                  {mockCourses
                    .filter(course => 
                      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.code.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 8)
                    .map(course => (
                      <div 
                        key={course._id} 
                        className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors duration-200 mb-3"
                        onClick={() => {
                          setSearchQuery(course.title);
                          closeSearchPopup();
                        }}
                      >
                        <img 
                          src={course.thumbnail?.url || "https://via.placeholder.com/80x80"} 
                          alt={course.title}
                          className="w-14 h-14 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{course.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{course.subtitle}</p>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-500">{course.rating} ({course.reviews})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(course.pricing.amount)}</div>
                          {course.pricing.discount > 0 && (
                            <div className="text-xs text-red-500 dark:text-red-400">{course.pricing.discount}% off</div>
                          )}
                        </div>
                      </div>
                    ))}
                  {mockCourses.filter(course => 
                    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.code.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">No courses match your search.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeSearchPopup}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay when any modal is open */}
      <AnimatePresence>
        {(isFilterOpen || isSearchPopupOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black backdrop-blur-sm"
            onClick={() => {
              if (isFilterOpen) closeFilterDrawer();
              if (isSearchPopupOpen) closeSearchPopup();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};