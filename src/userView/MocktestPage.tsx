// pages/MockTestsPage.tsx
import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Clock, Users, Star, BookOpen, Globe, Award, TrendingUp } from "lucide-react"
import { Link } from "react-router"
import Button from "../components/ui/button/Button"

interface MockTest {
  id: string
  title: string
  description: string
  category: string
  duration: string
  questions: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  rating: number
  reviews: number
  enrolled: number
  price: number
  originalPrice?: number
  discount?: number
  thumbnail: string
  examType: string
  country: string
  language: string
  isFree: boolean
  isFeatured: boolean
  tags: string[]
}

const MockTestsPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [difficultyFilter, setDifficultyFilter] = useState("all")

  // Mock data for study abroad tests
  const mockTests: MockTest[] = [
    {
      id: "1",
      title: "IELTS Academic Practice Test",
      description: "Full-length IELTS practice test with authentic exam format",
      category: "Language Proficiency",
      duration: "2h 45m",
      questions: 40,
      difficulty: "Intermediate",
      rating: 4.7,
      reviews: 1240,
      enrolled: 5620,
      price: 0,
      isFree: true,
      isFeatured: true,
      thumbnail: "/images/ielts-mock.jpg",
      examType: "IELTS",
      country: "UK",
      language: "English",
      tags: ["Listening", "Reading", "Writing", "Speaking"]
    },
    {
      id: "2",
      title: "TOEFL iBT Full Practice Exam",
      description: "Comprehensive TOEFL practice with integrated skills assessment",
      category: "Language Proficiency",
      duration: "3h 30m",
      questions: 54,
      difficulty: "Advanced",
      rating: 4.8,
      reviews: 980,
      enrolled: 4210,
      price: 2999,
      originalPrice: 4999,
      discount: 40,
      isFree: false,
      isFeatured: true,
      thumbnail: "/images/toefl-mock.jpg",
      examType: "TOEFL",
      country: "USA",
      language: "English",
      tags: ["Reading", "Listening", "Speaking", "Writing"]
    },
    {
      id: "3",
      title: "PTE Academic Mock Test",
      description: "Realistic PTE practice with automated scoring",
      category: "Language Proficiency",
      duration: "3h",
      questions: 79,
      difficulty: "Intermediate",
      rating: 4.5,
      reviews: 756,
      enrolled: 3120,
      price: 1999,
      isFree: false,
      isFeatured: false,
      thumbnail: "/images/pte-mock.jpg",
      examType: "PTE",
      country: "Australia",
      language: "English",
      tags: ["Speaking", "Writing", "Reading", "Listening"]
    },
    {
      id: "4",
      title: "GRE General Test Practice",
      description: "Complete GRE practice with adaptive scoring",
      category: "Graduate Admissions",
      duration: "3h 45m",
      questions: 82,
      difficulty: "Advanced",
      rating: 4.6,
      reviews: 1120,
      enrolled: 4890,
      price: 3499,
      originalPrice: 5999,
      discount: 42,
      isFree: false,
      isFeatured: true,
      thumbnail: "/images/gre-mock.jpg",
      examType: "GRE",
      country: "USA",
      language: "English",
      tags: ["Quantitative", "Verbal", "Analytical"]
    },
    {
      id: "5",
      title: "GMAT Practice Exam",
      description: "Official GMAT practice with detailed performance analytics",
      category: "Graduate Admissions",
      duration: "3h 30m",
      questions: 80,
      difficulty: "Advanced",
      rating: 4.9,
      reviews: 1560,
      enrolled: 6720,
      price: 3999,
      isFree: false,
      isFeatured: true,
      thumbnail: "/images/gmat-mock.jpg",
      examType: "GMAT",
      country: "USA",
      language: "English",
      tags: ["Quantitative", "Verbal", "IR", "AWA"]
    },
    {
      id: "6",
      title: "SAT Practice Test",
      description: "College Board SAT practice with real test conditions",
      category: "Undergraduate Admissions",
      duration: "3h",
      questions: 154,
      difficulty: "Intermediate",
      rating: 4.4,
      reviews: 890,
      enrolled: 3420,
      price: 0,
      isFree: true,
      isFeatured: false,
      thumbnail: "/images/sat-mock.jpg",
      examType: "SAT",
      country: "USA",
      language: "English",
      tags: ["Math", "Evidence-Based Reading", "Writing"]
    }
  ]

  const categories = [
    "all", "Language Proficiency", "Graduate Admissions", 
    "Undergraduate Admissions", "Subject Tests"
  ]

  const difficultyLevels = ["all", "Beginner", "Intermediate", "Advanced"]

  const filteredTests = mockTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          test.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || test.category === selectedCategory
    const matchesDifficulty = difficultyFilter === "all" || test.difficulty === difficultyFilter
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const sortedTests = [...filteredTests].sort((a, b) => {
    switch (sortBy) {
      case "popular": return b.enrolled - a.enrolled
      case "rating": return b.rating - a.rating
      case "newest": return b.reviews - a.reviews
      case "price-low": return a.price - b.price
      case "price-high": return b.price - a.price
      default: return 0
    }
  })

  const formatPrice = (amount: number) => {
    return amount === 0 ? "FREE" : `₹${amount.toLocaleString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Study Abroad Mock Tests
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Prepare for your international education journey with our comprehensive practice tests. 
            Get real exam experience with detailed performance analytics.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search mock tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
              
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>
                    {level === "all" ? "All Levels" : level}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              
              <Button variant="outline" className="px-4 py-3 flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                <Filter className="h-5 w-5" />
                <span className="hidden md:inline">Filters</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tests Available</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{mockTests.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Students Enrolled</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mockTests.reduce((sum, test) => sum + test.enrolled, 0).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Countries Covered</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">15+</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Rating</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">4.7/5</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Featured Tests */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Mock Tests</h2>
            <Link to="/all-tests" className="text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTests.filter(test => test.isFeatured).slice(0, 3).map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="relative">
                  <img 
                    src={test.thumbnail} 
                    alt={test.title} 
                    className="w-full h-48 object-cover"
                  />
                  {test.isFeatured && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Featured
                    </div>
                  )}
                  {test.discount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {test.discount}% OFF
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium mb-2">
                        {test.examType}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                        {test.title}
                      </h3>
                    </div>
                    <div className="flex items-center bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                      <Star className="h-4 w-4 text-amber-500 fill-current" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-200 ml-1">
                        {test.rating}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {test.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {test.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag} 
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {test.duration}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {test.questions} Qs
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {test.enrolled.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {test.difficulty}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(test.price)}
                      </span>
                      {test.originalPrice && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                          ₹{test.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white">
                      Start Test
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* All Tests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Mock Tests</h2>
          
          {sortedTests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No mock tests found matching your criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
                >
                  <div className="relative">
                    <img 
                      src={test.thumbnail} 
                      alt={test.title} 
                      className="w-full h-40 object-cover"
                    />
                    {test.isFree && (
                      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        FREE
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium mb-1">
                          {test.examType}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                          {test.title}
                        </h3>
                      </div>
                      <div className="flex items-center bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                        <Star className="h-3 w-3 text-amber-500 fill-current" />
                        <span className="text-xs font-medium text-amber-800 dark:text-amber-200 ml-0.5">
                          {test.rating}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{test.duration}</span>
                      <span className="mx-2">•</span>
                      <Users className="h-4 w-4 mr-1" />
                      <span>{test.enrolled.toLocaleString()} enrolled</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(test.price)}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/50"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MockTestsPage