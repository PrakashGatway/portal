import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Filter, RotateCcw, Check, ChevronDown, SlidersHorizontal } from "lucide-react"
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
  { value: "sat", label: "SAT", icon: "" },
  { value: "gre", label: "GRE", icon: "📖" },
  { value: "gmat", label: "GMAT", icon: "💼" },
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
  { value: "English", label: "English", icon: "🇬🇧" },
  { value: "hindi", label: "Hindi", icon: "🇮🇳" },
  { value: "bilingual", label: "Bilingual", icon: "🗣️" },
]

export default function FilterDrawer({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  initialFilters,
  primaryColor = "#FF6B35",
  secondaryColor = "#E85A2D"
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
      maxPrice: 99000,
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
      featured: false,
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

  const FilterSection = ({ 
    title, 
    icon, 
    sectionKey, 
    children 
  }: { 
    title: string
    icon: string
    sectionKey: keyof typeof expandedSections
    children: React.ReactNode
  }) => (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
            expandedSections[sectionKey] ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {expandedSections[sectionKey] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
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
            }}
            style={{ zIndex: 51 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div 
                className="flex items-center justify-between p-6 border-b"
                style={{ 
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}20`
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                    <p className="text-sm text-gray-500">{getActiveFiltersCount()} active filters</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-2">
                  
                  {/* Category Filter */}
                  <FilterSection title="Category" icon="📚" sectionKey="category">
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setFilters((prev) => ({ ...prev, category: category.value }))}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                            filters.category === category.value
                              ? 'border-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: filters.category === category.value ? primaryColor : 'white',
                            color: filters.category === category.value ? 'white' : 'inherit',
                          }}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm font-medium truncate">{category.label}</span>
                          {filters.category === category.value && (
                            <Check className="h-4 w-4 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Status Filter */}
                  <FilterSection title="Status" icon="📅" sectionKey="status">
                    <div className="grid grid-cols-2 gap-2">
                      {statuses.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => setFilters((prev) => ({ ...prev, status: status.value }))}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                            filters.status === status.value
                              ? 'border-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: filters.status === status.value ? primaryColor : 'white',
                            color: filters.status === status.value ? 'white' : 'inherit',
                          }}
                        >
                          <span className="text-lg">{status.icon}</span>
                          <span className="text-sm font-medium truncate">{status.label}</span>
                          {filters.status === status.value && (
                            <Check className="h-4 w-4 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Level Filter */}
                  <FilterSection title="Level" icon="🎯" sectionKey="level">
                    <div className="grid grid-cols-2 gap-2">
                      {levels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setFilters((prev) => ({ ...prev, level: level.value }))}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                            filters.level === level.value
                              ? 'border-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: filters.level === level.value ? primaryColor : 'white',
                            color: filters.level === level.value ? 'white' : 'inherit',
                          }}
                        >
                          <span className="text-lg">{level.icon}</span>
                          <span className="text-sm font-medium truncate">{level.label}</span>
                          {filters.level === level.value && (
                            <Check className="h-4 w-4 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Mode Filter */}
                  <FilterSection title="Mode" icon="💻" sectionKey="mode">
                    <div className="space-y-2">
                      {modes.map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() => setFilters((prev) => ({ ...prev, mode: mode.value }))}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                            filters.mode === mode.value
                              ? 'border-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: filters.mode === mode.value ? primaryColor : 'white',
                            color: filters.mode === mode.value ? 'white' : 'inherit',
                          }}
                        >
                          <span className="text-lg">{mode.icon}</span>
                          <span className="text-sm font-medium flex-1 text-left">{mode.label}</span>
                          {filters.mode === mode.value && (
                            <Check className="h-4 w-4 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Language Filter */}
                  <FilterSection title="Language" icon="🌐" sectionKey="language">
                    <div className="space-y-2">
                      {languages.map((language) => (
                        <button
                          key={language.value}
                          onClick={() => setFilters((prev) => ({ ...prev, language: language.value }))}
                          className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                            filters.language === language.value
                              ? 'border-white shadow-md'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{
                            backgroundColor: filters.language === language.value ? primaryColor : 'white',
                            color: filters.language === language.value ? 'white' : 'inherit',
                          }}
                        >
                          <span className="text-lg">{language.icon}</span>
                          <span className="text-sm font-medium flex-1 text-left">{language.label}</span>
                          {filters.language === language.value && (
                            <Check className="h-4 w-4 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Price Range */}
                  <FilterSection title="Price Range" icon="💰" sectionKey="price">
                    <div 
                      className="p-4 rounded-xl space-y-4"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Min Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
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
                              className="w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                              style={{ 
                                borderColor: `${primaryColor}40`,
                                focusRing: primaryColor,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Max Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
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
                              className="w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                              style={{ borderColor: `${primaryColor}40` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Price Range Slider Visualization */}
                      <div className="pt-2">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ 
                              backgroundColor: primaryColor,
                              width: `${((filters.maxPrice - filters.minPrice) / 99000) * 100}%`,
                              marginLeft: `${(filters.minPrice / 99000) * 100}%`
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>₹0</span>
                          <span>₹99,000</span>
                        </div>
                      </div>
                    </div>
                  </FilterSection>

                  {/* Date Range */}
                  <FilterSection title="Date Range" icon="📆" sectionKey="date">
                    <div 
                      className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: `${primaryColor}40` }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2"
                          style={{ borderColor: `${primaryColor}40` }}
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {/* Special Filters */}
                  <FilterSection title="Special Offers" icon="⭐" sectionKey="special">
                    <label
                      className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md"
                      style={{ 
                        borderColor: filters.featured ? 'white' : '#E5E7EB',
                        backgroundColor: filters.featured ? `${primaryColor}20` : 'white',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filters.featured}
                        onChange={(e) => setFilters((prev) => ({ ...prev, featured: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 focus:ring-2"
                        style={{ 
                          accentColor: primaryColor,
                        }}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">🎯</span>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">Featured Courses Only</div>
                          <div className="text-xs text-gray-500">Show only premium featured courses</div>
                        </div>
                      </div>
                      {filters.featured && (
                        <Check className="h-5 w-5" style={{ color: primaryColor }} />
                      )}
                    </label>
                  </FilterSection>

                </div>
              </div>

              {/* Footer */}
              <div 
                className="p-6 border-t space-y-3"
                style={{ 
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}20`
                }}
              >
                <button
                  onClick={resetFilters}
                  className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border-2"
                  style={{
                    borderColor: primaryColor,
                    color: primaryColor,
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset All Filters
                </button>
                <button
                  onClick={handleApply}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Apply Filters ({getActiveFiltersCount()})
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}