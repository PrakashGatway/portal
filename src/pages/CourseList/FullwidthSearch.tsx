import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Clock, TrendingUp } from "lucide-react"

interface SearchResult {
  _id: string
  title: string
  subtitle: string
  thumbnail?: { url: string }
  rating: number
  reviews: number
  pricing: { amount: number; discount: number }
}

interface FullWidthSearchProps {
  onSearch: (query: string) => void
  searchResults: SearchResult[]
  recentSearches: string[]
  isLoading?: boolean
}

export default function FullWidthSearch({
  onSearch,
  searchResults,
  recentSearches,
  isLoading = false,
}: FullWidthSearchProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    onSearch(value)
    setIsOpen(value.length > 0)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    const totalItems = searchResults.length + recentSearches.length

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      if (selectedIndex < searchResults.length) {
        const selectedCourse = searchResults[selectedIndex]
        setQuery(selectedCourse.title)
        setIsOpen(false)
      } else {
        const recentIndex = selectedIndex - searchResults.length
        setQuery(recentSearches[recentIndex])
        setIsOpen(false)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const formatPrice = (amount: number) => `₹${amount.toLocaleString()}`

  const lightClasses = {
    container: "bg-white border-gray-200",
    input: "bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500",
    icon: "text-gray-400",
    clearButton: "text-gray-400 hover:text-gray-700",
    dropdown: "bg-white border-gray-200",
    dropdownHeader: "text-gray-500",
    dropdownItem: "text-gray-900 hover:bg-gray-100",
    dropdownItemSelected: "bg-blue-100",
    recentSearchButton: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    recentSearchButtonSelected: "bg-blue-500 text-white",
    noResults: "text-gray-500",
    loadingSpinner: "border-blue-500",
    loadingText: "text-gray-500"
  }

  // Dark mode classes
  const darkClasses = {
    container: "dark:bg-gray-800 dark:border-gray-700",
    input: "dark:border-gray-600 border-blue-400 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
    icon: "dark:text-gray-400",
    clearButton: "dark:text-gray-400 dark:hover:text-gray-200",
    dropdown: "dark:bg-gray-800 dark:border-gray-700",
    dropdownHeader: "dark:text-gray-400",
    dropdownItem: "dark:text-white dark:hover:bg-gray-700",
    dropdownItemSelected: "dark:bg-blue-900",
    recentSearchButton: "dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
    recentSearchButtonSelected: "dark:bg-blue-600 dark:text-white",
    noResults: "dark:text-gray-400",
    loadingSpinner: "dark:border-blue-500",
    loadingText: "dark:text-gray-400"
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-5xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className={`h-6 w-6 ${lightClasses.icon} ${darkClasses.icon}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for courses, instructors, or topics..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className={`w-full pl-16 pr-12 py-3 text-lg rounded-full border border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm ${
            lightClasses.input
          } ${darkClasses.input}`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setIsOpen(false)
              onSearch("")
            }}
            className="absolute inset-y-0 right-0 pr-6 flex items-center"
          >
            <X className={`h-5 w-5 ${lightClasses.clearButton} ${darkClasses.clearButton} transition-colors`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto ${
              lightClasses.dropdown
            } ${darkClasses.dropdown}`}
          >
            {isLoading ? (
              <div className="p-6 text-center">
                <div
                  className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${lightClasses.loadingSpinner} ${darkClasses.loadingSpinner}`}
                ></div>
                <p className={`mt-2 ${lightClasses.loadingText} ${darkClasses.loadingText}`}>Searching...</p>
              </div>
            ) : (
              <>
                {searchResults.length > 0 && (
                  <div className="p-4">
                    <h3
                      className={`text-sm font-semibold mb-3 flex items-center ${lightClasses.dropdownHeader} ${darkClasses.dropdownHeader}`}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Search Results
                    </h3>
                    {searchResults.slice(0, 6).map((course, index) => (
                      <motion.div
                        key={course._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedIndex === index
                            ? `${lightClasses.dropdownItemSelected} ${darkClasses.dropdownItemSelected}`
                            : `${lightClasses.dropdownItem} ${darkClasses.dropdownItem}`
                        }`}
                        onClick={() => {
                          setQuery(course.title)
                          setIsOpen(false)
                        }}
                      >
                        <img
                          src={
                            course.thumbnail?.url ||
                            `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(course.title)}`
                          }
                          alt={course.title}
                          className="w-12 h-12 object-cover rounded-lg mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">Course Title</h4>
                          <p className="text-sm truncate opacity-75">Course Subtitle</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs opacity-60">⭐ 4.5 (120)</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">₹4999</div>
                          <div className="text-xs text-red-500">50% off</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <h3
                      className={`text-sm font-semibold mb-3 flex items-center ${lightClasses.dropdownHeader} ${darkClasses.dropdownHeader}`}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={search}
                          onClick={() => {
                            setQuery(search)
                            setIsOpen(false)
                            onSearch(search)
                          }}
                          className={`px-3 py-2 rounded-full text-sm transition-all duration-200 ${
                            selectedIndex === searchResults.length + index
                              ? `${lightClasses.recentSearchButtonSelected} ${darkClasses.recentSearchButtonSelected}`
                              : `${lightClasses.recentSearchButton} ${darkClasses.recentSearchButton}`
                          }`}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.length === 0 && query.length > 0 && !isLoading && (
                  <div className="p-6 text-center">
                    <p className={`${lightClasses.noResults} ${darkClasses.noResults}`}>
                      No courses found for "{query}"
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}