import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp, Star, Tag } from "lucide-react";
import { ImageBaseUrl } from "../../axiosInstance";

interface SearchResult {
  _id: string;
  title: string;
  subtitle: string;
  code: string;
  thumbnail?: { url: string };
  rating: number;
  reviews: number;
  studentsEnrolled: number;
  pricing: {
    amount: number;
    discount: number;
    originalAmount?: number;
    currency?: string;
  };
  tags: string[];
  categoryInfo?: { name: string };
  level?: string;
}

interface FullWidthSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchResult[];
  recentSearches: string[];
  isLoading?: boolean;
}

export default function FullWidthSearch({
  onSearch,
  searchResults,
  recentSearches,
  isLoading = false,
}: FullWidthSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const primaryColor = "#daff02";   // Yellow
  const secondaryColor = "#fe572a"; // Orange

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = searchResults.length + recentSearches.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < searchResults.length) {
        const selectedCourse = searchResults[selectedIndex];
        setQuery(selectedCourse.title);
        setIsOpen(false);
      } else {
        const recentIndex = selectedIndex - searchResults.length;
        setQuery(recentSearches[recentIndex]);
        setIsOpen(false);
        onSearch(recentSearches[recentIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const formatPrice = (amount: number, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div ref={searchRef} className="relative w-full max-w-4xl mx-auto p-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for courses..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className={`w-full pl-16 pr-12 py-3.5 text-lg rounded-full border-2 focus:outline-none focus:ring-4 transition-all duration-200 shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
          style={{
            borderColor: primaryColor,
            boxShadow: `0 0 0 0 ${primaryColor}`,
            WebkitBoxShadow: `0 0 0 0 ${primaryColor}`,
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              onSearch("");
            }}
            className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            {isLoading ? (
              <div className="p-6 text-center">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                  style={{ borderColor: secondaryColor }}
                ></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Searching...</p>
              </div>
            ) : (
              <>
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="p-4">
                    <h3 className="text-sm font-bold mb-3 flex items-center text-gray-600 dark:text-gray-400">
                      <TrendingUp className="h-4 w-4 mr-2" style={{ color: secondaryColor }} />
                      Search Results
                    </h3>
                    {searchResults.map((course, index) => (
                      <motion.div
                        key={course._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-start p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedIndex === index
                            ? "bg-yellow-50 dark:bg-gray-700 border-l-2"
                            : "hover:bg-gray-50 dark:hover:bg-gray-750"
                        }`}
                        style={
                          selectedIndex === index
                            ? { borderColor: primaryColor }
                            : {}
                        }
                        onClick={() => {
                          setQuery(course.title);
                          setIsOpen(false);
                        }}
                      >
                        <img
                          src={
                            course.thumbnail?.url
                              ? `${ImageBaseUrl}/${course.thumbnail.url}`
                              : "https://www.gatewayabroadeducations.com/images/logo.svg"
                          }
                          alt={course.title}
                          className="w-20 h-12 object-cover rounded-md flex-shrink-0 mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {course.subtitle}
                          </p>

                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                            {course.rating || "4.8"} ({course.reviews?.toLocaleString() || "1K+"})
                            <span className="mx-1.5">•</span>
                            {course.studentsEnrolled?.toLocaleString() || "1K+"} students
                          </div>

                          {course.level && (
                            <span
                              className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: `${primaryColor}20`,
                                color: "#000",
                              }}
                            >
                              {course.level.toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="text-right ml-2 flex flex-col items-end justify-start">
                          <div
                            className="font-bold text-base"
                            style={{ color: secondaryColor }}
                          >
                            {formatPrice(course.pricing.amount, course.pricing.currency)}
                          </div>
                          {course.pricing.discount > 0 && (
                            <span className="text-[11px] font-medium mt-0.5" style={{ color: secondaryColor }}>
                              {course.pricing.discount}% OFF
                            </span>
                          )}
                          {course.categoryInfo?.name && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-[80px] truncate">
                              {course.categoryInfo.name}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold mb-3 flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" style={{ color: primaryColor }} />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((search, index) => (
                        <button
                          key={search}
                          onClick={() => {
                            setQuery(search);
                            setIsOpen(false);
                            onSearch(search);
                          }}
                          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                            selectedIndex === searchResults.length + index
                              ? "text-black"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                          style={{
                            backgroundColor:
                              selectedIndex === searchResults.length + index
                                ? primaryColor
                                : "rgba(218, 255, 2, 0.15)",
                            border: `1px solid ${primaryColor}40`,
                          }}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchResults.length === 0 && query.length > 0 && !isLoading && (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No courses found for <span className="font-medium">"{query}"</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}