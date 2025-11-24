import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Filter, RotateCcw, Check, ChevronDown } from "lucide-react"
import Button from "../../components/ui/button/Button"

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterState) => void
  initialFilters?: FilterState
  primaryColor?: string;
  secondaryColor?: string;
}

export interface FilterState {
  category: string
  subcategory: string
  status: string
  level: string
  mode: string
  featured: boolean
  language: string
  startDate: string
  endDate: string
  minPrice: number
  maxPrice: number
  sort: string
  page: number
  limit: number
}

const categories = [
  { value: "", label: "All Categories", icon: "📚" },
  { value: "jee", label: "JEE", icon: "📐" },
  { value: "neet", label: "NEET", icon: "🔬" },
  { value: "foundation", label: "Foundation", icon: "🏗️" },
  { value: "competitive-exams", label: "Competitive Exams", icon: "🏆" },
]

const statuses = [
  { value: "", label: "All Status", icon: "🔄" },
  { value: "upcoming", label: "Upcoming", icon: "📅" },
  { value: "ongoing", label: "Ongoing", icon: "⚡" },
  { value: "completed", label: "Completed", icon: "✅" },
]

const levels = [
  { value: "", label: "All Levels", icon: "🎯" },
  { value: "beginner", label: "Beginner", icon: "🌱" },
  { value: "intermediate", label: "Intermediate", icon: "📈" },
  { value: "advanced", label: "Advanced", icon: "🚀" },
]

const modes = [
  { value: "", label: "All Modes", icon: "🌐" },
  { value: "online", label: "Online", icon: "💻" },
  { value: "offline", label: "Offline", icon: "🏫" },
  { value: "hybrid", label: "Hybrid", icon: "🔄" },
  { value: "recorded", label: "Recorded", icon: "📹" },
]

const languages = [
  { value: "", label: "All Languages", icon: "🌐" },
  { value: "English", label: "English", icon: "🇺🇸" },
  { value: "hindi", label: "Hindi", icon: "🇮🇳" },
  { value: "bilingual", label: "Bilingual", icon: "🗣️" },
]

export default function FilterDrawer({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  initialFilters,
  primaryColor = "#daff02",
  secondaryColor = "#fe572a"
}: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      category: "",
      subcategory: "",
      status: "",
      level: "",
      mode: "",
      featured: false,
      language: "",
      startDate: "",
      endDate: "",
      minPrice: 0,
      maxPrice: 50000,
      sort: "-createdAt",
      page: 1,
      limit: 9,
    },
  )

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    status: true,
    level: true,
    mode: true,
    language: true,
    price: true,
    date: true,
    special: true,
  })

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      category: "",
      subcategory: "",
      status: "",
      level: "",
      mode: "",
      featured: '',
      language: "",
      startDate: "",
      endDate: "",
      minPrice: 0,
      maxPrice: 99000,
      sort: "-createdAt",
      page: 1,
      limit: 12,
    }
    setFilters(defaultFilters)
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const formatPrice = (amount: number) => `₹${amount.toLocaleString()}`

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.status) count++
    if (filters.level) count++
    if (filters.mode) count++
    if (filters.language) count++
    if (filters.minPrice !== 0) count++
    if (filters.maxPrice !== 99000) count++
    if (filters.featured) count++
    if (filters.startDate) count++
    if (filters.endDate) count++
    return count
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-99999"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{ zIndex: 999999 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden border-l border-border"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div 
                className="flex items-center justify-between p-6 border-b border-border"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Filter 
                      className="h-5 w-5" 
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Filters</h2>
                    <p className="text-sm text-muted-foreground">{getActiveFiltersCount()} active filters</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="rounded-full hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Category Filter */}
                {/* <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("category")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Category</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.category ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.category && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 m-1">
                          {categories.map((category) => (
                            <motion.button
                              key={category.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFilters((prev) => ({ ...prev, category: category.value }))}
                              className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                                filters.category === category.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-lg">{category.icon}</span>
                              <span className="text-sm font-medium truncate">{category.label}</span>
                              {filters.category === category.value && <Check className="h-4 w-4 ml-auto" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div> */}

                {/* Status Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("status")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Status</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.status ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.status && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 m-1">
                          {statuses.map((status) => (
                            <motion.button
                              key={status.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFilters((prev) => ({ ...prev, status: status.value }))}
                              className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all duration-200 ${filters.status === status.value
                                  ? "text-white"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              style={{
                                borderColor: filters.status === status.value ? secondaryColor : undefined,
                                backgroundColor: filters.status === status.value ? secondaryColor : undefined
                              }}
                            >
                              <span className="text-lg">{status.icon}</span>
                              <span className="text-sm font-medium truncate">{status.label}</span>
                              {filters.status === status.value && <Check className="h-4 w-4 ml-auto" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Level Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("level")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Level</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.level ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.level && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 m-1">
                          {levels.map((level) => (
                            <motion.button
                              key={level.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFilters((prev) => ({ ...prev, level: level.value }))}
                              className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all duration-200 ${filters.level === level.value
                                  ? "text-white"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              style={{
                                borderColor: filters.level === level.value ? secondaryColor : undefined,
                                backgroundColor: filters.level === level.value ? secondaryColor : undefined
                              }}
                            >
                              <span className="text-lg">{level.icon}</span>
                              <span className="text-sm font-medium truncate">{level.label}</span>
                              {filters.level === level.value && <Check className="h-4 w-4 ml-auto" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mode Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("mode")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Mode</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.mode ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.mode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 m-1">
                          {modes.map((mode) => (
                            <motion.button
                              key={mode.value}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setFilters((prev) => ({ ...prev, mode: mode.value }))}
                              className={`flex items-center space-x-3 w-full p-3 rounded-xl border-2 transition-all duration-200 ${filters.mode === mode.value
                                  ? "text-white"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              style={{
                                borderColor: filters.mode === mode.value ? secondaryColor : undefined,
                                backgroundColor: filters.mode === mode.value ? secondaryColor : undefined
                              }}
                            >
                              <span className="text-lg">{mode.icon}</span>
                              <span className="text-sm font-medium flex-1 text-left">{mode.label}</span>
                              {filters.mode === mode.value && <Check className="h-4 w-4" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Language Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("language")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Language</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.language ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.language && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 m-1">
                          {languages.map((language) => (
                            <motion.button
                              key={language.value}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setFilters((prev) => ({ ...prev, language: language.value }))}
                              className={`flex items-center space-x-3 w-full p-3 rounded-xl border-2 transition-all duration-200 ${filters.language === language.value
                                  ? "text-white"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              style={{
                                borderColor: filters.language === language.value ? secondaryColor : undefined,
                                backgroundColor: filters.language === language.value ? secondaryColor : undefined
                              }}
                            >
                              <span className="text-lg">{language.icon}</span>
                              <span className="text-sm font-medium flex-1 text-left">{language.label}</span>
                              {filters.language === language.value && <Check className="h-4 w-4" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("price")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Price Range</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.price ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.price && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div 
                          className="space-y-4 p-4 rounded-xl"
                          style={{ backgroundColor: `${primaryColor}20` }}
                        >
                          {/* Display Values */}
                          <div className="flex justify-between text-sm font-medium">
                            <span style={{ color: primaryColor }}>Min: ₹</span>
                            <span style={{ color: primaryColor }}>Max: ₹</span>
                          </div>

                          {/* Number Inputs */}
                          <div className="flex gap-4">
                            {/* Min Price */}
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Min Price
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={filters.maxPrice}
                                step={500}
                                value={filters.minPrice}
                                onChange={(e) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    minPrice: Math.min(Number(e.target.value), prev.maxPrice),
                                  }))
                                }
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:outline-none"
                                style={{ 
                                  borderColor: primaryColor,
                                  color: '#000'
                                }}
                              />
                            </div>

                            {/* Max Price */}
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Max Price
                              </label>
                              <input
                                type="number"
                                min={filters.minPrice}
                                max={99000}
                                step={500}
                                value={filters.maxPrice}
                                onChange={(e) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    maxPrice: Math.max(Number(e.target.value), prev.minPrice),
                                  }))
                                }
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:outline-none"
                                style={{ 
                                  borderColor: primaryColor,
                                  color: '#000'
                                }}
                              />
                            </div>
                          </div>

                          {/* Optional: Range display */}
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Min: ₹0</span>
                            <span>Max: ₹99,000</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("date")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Date Range</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.date ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.date && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div 
                          className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                          style={{ backgroundColor: `${primaryColor}20` }}
                        >
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                            <input
                              type="date"
                              value={filters.startDate}
                              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                              className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                              style={{ 
                                borderColor: primaryColor,
                                color: '#000'
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                            <input
                              type="date"
                              value={filters.endDate}
                              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                              className="w-full rounded-lg border border-border bg-background p-2 text-sm"
                              style={{ 
                                borderColor: primaryColor,
                                color: '#000'
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Special Filters */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("special")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Special Offers</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedSections.special ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.special && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 m-1">
                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center space-x-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all duration-200"
                            style={{ 
                              borderColor: filters.featured ? secondaryColor : undefined,
                              backgroundColor: filters.featured ? `${secondaryColor}20` : undefined
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={filters.featured}
                              onChange={(e) => setFilters((prev) => ({ ...prev, featured: e.target.checked }))}
                              className="h-4 w-4 focus:ring-primary border-border rounded"
                              style={{ 
                                accentColor: secondaryColor,
                                color: '#000'
                              }}
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-lg">⭐</span>
                              <span className="text-sm font-medium">Featured Courses Only</span>
                            </div>
                          </motion.label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div 
                className="p-6 border-t border-border"
                style={{ backgroundColor: `${primaryColor}10` }}
              >
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-transparent"
                    style={{
                      borderColor: primaryColor,
                      color: primaryColor
                    }}
                  >
                    <RotateCcw 
                      className="h-4 w-4" 
                      style={{ color: primaryColor }}
                    />
                    <span>Reset</span>
                  </Button>
                  <Button
                    onClick={handleApply}
                    className="flex-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    style={{
                      backgroundColor: secondaryColor,
                      color: '#fff'
                    }}
                  >
                    Apply Filters ({getActiveFiltersCount()})
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}