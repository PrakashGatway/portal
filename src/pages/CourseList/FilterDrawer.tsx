"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Filter, RotateCcw, Check, ChevronDown } from "lucide-react"
import Button from "../../components/ui/button/Button"

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterState) => void
  initialFilters?: FilterState
}

export interface FilterState {
  selectedCategory: string
  selectedType: string
  selectedLanguage: string
  priceRange: [number, number]
  discountRange: [number, number]
  showEarlyBirdOnly: boolean
  showInfinityPlanOnly: boolean
}

const categories = [
  { value: "all", label: "All Courses", icon: "📚" },
  { value: "online", label: "Online", icon: "💻" },
  { value: "offline", label: "Offline", icon: "🏫" },
  { value: "hybrid", label: "Hybrid", icon: "🔄" },
  { value: "test-series", label: "Test Series", icon: "📝" },
  { value: "free", label: "Free", icon: "🆓" },
]

const types = [
  { value: "all", label: "All Types", icon: "🎯" },
  { value: "full-batch", label: "Full Batch", icon: "👥" },
  { value: "test-series", label: "Test Series", icon: "📊" },
  { value: "live-workshop", label: "Live Workshop", icon: "🎪" },
]

const languages = [
  { value: "all", label: "All Languages", icon: "🌐" },
  { value: "english", label: "English", icon: "🇺🇸" },
  { value: "hindi", label: "Hindi", icon: "🇮🇳" },
  { value: "bilingual", label: "Bilingual", icon: "🗣️" },
]

export default function FilterDrawer({ isOpen, onClose, onApplyFilters, initialFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      selectedCategory: "all",
      selectedType: "all",
      selectedLanguage: "all",
      priceRange: [0, 20000],
      discountRange: [0, 100],
      showEarlyBirdOnly: false,
      showInfinityPlanOnly: false,
    },
  )

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    type: true,
    language: true,
    price: true,
    discount: true,
    special: true,
  })

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      selectedCategory: "all",
      selectedType: "all",
      selectedLanguage: "all",
      priceRange: [0, 20000],
      discountRange: [0, 100],
      showEarlyBirdOnly: false,
      showInfinityPlanOnly: false,
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
    if (filters.selectedCategory !== "all") count++
    if (filters.selectedType !== "all") count++
    if (filters.selectedLanguage !== "all") count++
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 20000) count++
    if (filters.discountRange[0] !== 0 || filters.discountRange[1] !== 100) count++
    if (filters.showEarlyBirdOnly) count++
    if (filters.showInfinityPlanOnly) count++
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
            style={{zIndex:999999}}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden border-l border-border"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Filters</h2>
                    <p className="text-sm text-muted-foreground">{getActiveFiltersCount()} active filters</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Category Filter */}
                <div className="space-y-3">
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
                              onClick={() => setFilters((prev) => ({ ...prev, selectedCategory: category.value }))}
                              className={`flex items-center space-x-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                                filters.selectedCategory === category.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-lg">{category.icon}</span>
                              <span className="text-sm font-medium truncate">{category.label}</span>
                              {filters.selectedCategory === category.value && <Check className="h-4 w-4 ml-auto" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Type Filter */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("type")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Type</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.type ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.type && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 m-1">
                          {types.map((type) => (
                            <motion.button
                              key={type.value}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setFilters((prev) => ({ ...prev, selectedType: type.value }))}
                              className={`flex items-center space-x-3 w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                                filters.selectedType === type.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-lg">{type.icon}</span>
                              <span className="text-sm font-medium flex-1 text-left">{type.label}</span>
                              {filters.selectedType === type.value && <Check className="h-4 w-4" />}
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
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.language ? "rotate-180" : ""
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
                              onClick={() => setFilters((prev) => ({ ...prev, selectedLanguage: language.value }))}
                              className={`flex items-center space-x-3 w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                                filters.selectedLanguage === language.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-lg">{language.icon}</span>
                              <span className="text-sm font-medium flex-1 text-left">{language.label}</span>
                              {filters.selectedLanguage === language.value && <Check className="h-4 w-4" />}
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
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.price ? "rotate-180" : ""
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
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-primary">{formatPrice(filters.priceRange[0])}</span>
                            <span className="text-primary">{formatPrice(filters.priceRange[1])}</span>
                          </div>
                          <div className="relative">
                            <input
                              type="range"
                              min="0"
                              max="20000"
                              step="500"
                              value={filters.priceRange[0]}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  priceRange: [Number.parseInt(e.target.value), prev.priceRange[1]],
                                }))
                              }
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <input
                              type="range"
                              min="0"
                              max="20000"
                              step="500"
                              value={filters.priceRange[1]}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  priceRange: [prev.priceRange[0], Number.parseInt(e.target.value)],
                                }))
                              }
                              className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Min: ₹0</span>
                            <span>Max: ₹20,000</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Discount Range */}
                <div className="space-y-3">
                  <button
                    onClick={() => toggleSection("discount")}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-foreground">Discount Range</h3>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.discount ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.discount && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-primary">{filters.discountRange[0]}%</span>
                            <span className="text-primary">{filters.discountRange[1]}%</span>
                          </div>
                          <div className="relative">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={filters.discountRange[0]}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  discountRange: [Number.parseInt(e.target.value), prev.discountRange[1]],
                                }))
                              }
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={filters.discountRange[1]}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  discountRange: [prev.discountRange[0], Number.parseInt(e.target.value)],
                                }))
                              }
                              className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>100%</span>
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
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        expandedSections.special ? "rotate-180" : ""
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
                          >
                            <input
                              type="checkbox"
                              checked={filters.showEarlyBirdOnly}
                              onChange={(e) => setFilters((prev) => ({ ...prev, showEarlyBirdOnly: e.target.checked }))}
                              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-lg">🐦</span>
                              <span className="text-sm font-medium">Early Bird Offers Only</span>
                            </div>
                          </motion.label>

                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center space-x-3 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={filters.showInfinityPlanOnly}
                              onChange={(e) =>
                                setFilters((prev) => ({ ...prev, showInfinityPlanOnly: e.target.checked }))
                              }
                              className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <span className="text-lg">♾️</span>
                              <span className="text-sm font-medium">Infinity Plan Only</span>
                            </div>
                          </motion.label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-border bg-gradient-to-r from-muted/30 to-muted/10">
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset</span>
                  </Button>
                  <Button
                    onClick={handleApply}
                    className="flex-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
