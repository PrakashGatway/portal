import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  BookOpen,
  FileText,
  Video,
  Headphones,
  BookMarked,
  Library,
  Clock,
  Star,
  Eye,
  Bookmark,
  Share2,
  Play,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  Zap,
  Award,
  BarChart3,
  Users,
  Calendar,
  Brain,
  Target,
  CheckCircle,
  Grid,
  List,
  Sparkles,
  Lightbulb,
  Notebook,
  PenTool,
  TrendingUp
} from "lucide-react";
import Button from "../components/ui/button/Button";

// Types
interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  type: "pdf" | "video" | "audio" | "document" | "presentation" | "quiz";
  fileUrl: string;
  thumbnail?: string;
  duration?: string;
  fileSize: string;
  pages?: number;
  category: string;
  subject: string;
  topic: string;
  level: "beginner" | "intermediate" | "advanced";
  rating: number;
  downloads: number;
  views: number;
  isBookmarked: boolean;
  isDownloaded: boolean;
  lastAccessed?: string;
  uploadDate: string;
  tags: string[];
  relatedMaterials: string[];
  instructor?: {
    name: string;
    avatar: string;
  };
}

interface MaterialCategory {
  id: string;
  name: string;
  icon: any;
  count: number;
  color: string;
}

// Dummy Data
const mockMaterials: StudyMaterial[] = [
  {
    _id: "1",
    title: "Advanced React Patterns",
    description: "Master advanced React patterns including compound components, render props, and hooks composition.",
    type: "pdf",
    fileUrl: "#",
    fileSize: "4.2 MB",
    pages: 87,
    subject: "programming",
    topic: "React",
    level: "advanced",
    rating: 4.8,
    downloads: 1240,
    views: 3560,
    isBookmarked: true,
    isDownloaded: true,
    lastAccessed: "2024-05-20",
    uploadDate: "2024-01-15",
    tags: ["react", "javascript", "frontend"],
    relatedMaterials: ["2", "5"]
  },
  {
    _id: "2",
    title: "JavaScript Fundamentals",
    description: "Complete guide to JavaScript basics including variables, functions, and DOM manipulation.",
    type: "video",
    fileUrl: "#",
    fileSize: "1.2 GB",
    duration: "2h 15m",
    subject: "programming",
    topic: "JavaScript",
    level: "beginner",
    rating: 4.6,
    downloads: 2150,
    views: 5230,
    isBookmarked: false,
    isDownloaded: true,
    lastAccessed: "2024-05-18",
    uploadDate: "2024-02-10",
    tags: ["javascript", "web", "basics"],
    relatedMaterials: ["1", "3"]
  },
  {
    _id: "3",
    title: "Calculus I: Limits & Derivatives",
    description: "Comprehensive introduction to calculus concepts with practice problems and solutions.",
    type: "pdf",
    fileUrl: "#",
    fileSize: "6.8 MB",
    pages: 120,
    subject: "mathematics",
    topic: "Calculus",
    level: "intermediate",
    rating: 4.7,
    downloads: 980,
    views: 2450,
    isBookmarked: true,
    isDownloaded: false,
    lastAccessed: "2024-05-15",
    uploadDate: "2024-03-05",
    tags: ["calculus", "math", "derivatives"],
    relatedMaterials: ["4"]
  },
  {
    _id: "4",
    title: "Physics: Mechanics Explained",
    description: "Visual guide to Newtonian mechanics with real-world examples and problem-solving techniques.",
    type: "presentation",
    fileUrl: "#",
    fileSize: "15.3 MB",
    pages: 45,
    subject: "science",
    topic: "Physics",
    level: "intermediate",
    rating: 4.5,
    downloads: 760,
    views: 1890,
    isBookmarked: false,
    isDownloaded: false,
    uploadDate: "2024-04-12",
    tags: ["physics", "mechanics", "science"],
    relatedMaterials: ["3"]
  },
  {
    _id: "5",
    title: "Python for Data Science",
    description: "Learn Python libraries like Pandas, NumPy, and Matplotlib for data analysis and visualization.",
    type: "video",
    fileUrl: "#",
    fileSize: "2.4 GB",
    duration: "4h 30m",
    subject: "programming",
    topic: "Python",
    level: "intermediate",
    rating: 4.9,
    downloads: 1870,
    views: 4120,
    isBookmarked: true,
    isDownloaded: true,
    lastAccessed: "2024-05-21",
    uploadDate: "2024-01-28",
    tags: ["python", "data-science", "pandas"],
    relatedMaterials: ["1"]
  },
  {
    _id: "6",
    title: "Business Strategy Fundamentals",
    description: "Core principles of business strategy including SWOT analysis, competitive advantage, and market positioning.",
    type: "document",
    fileUrl: "#",
    fileSize: "3.1 MB",
    pages: 65,
    subject: "business",
    topic: "Strategy",
    level: "beginner",
    rating: 4.4,
    downloads: 620,
    views: 1450,
    isBookmarked: false,
    isDownloaded: false,
    uploadDate: "2024-03-22",
    tags: ["business", "strategy", "management"],
    relatedMaterials: []
  }
] as any;

const MaterialCard = ({ material, viewMode }: { material: StudyMaterial; viewMode: "grid" | "list" }) => {
  const [isBookmarked, setIsBookmarked] = useState(material.isBookmarked);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDownloading(false);
    alert(`Downloaded: ${material.title}`);
  };

  const getTypeIcon = () => {
    switch (material.type) {
      case "pdf": return <FileText className="h-5 w-5 text-red-500" />;
      case "video": return <Video className="h-5 w-5 text-blue-500" />;
      case "audio": return <Headphones className="h-5 w-5 text-green-500" />;
      case "document": return <BookOpen className="h-5 w-5 text-orange-500" />;
      case "presentation": return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case "quiz": return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = () => {
    switch (material.type) {
      case "pdf": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "video": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "audio": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "document": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      case "presentation": return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "quiz": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center p-6">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              {getTypeIcon()}
            </div>
            <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
              {material.type.toUpperCase()}
            </div>
          </div>

          {/* Material Info */}
          <div className="flex-1 ml-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {material.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                  {material.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{material.subject}</span>
                  <span>•</span>
                  <span>{material.topic}</span>
                  <span>•</span>
                  <span className="capitalize">{material.level}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right ml-4">
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {material.downloads}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {material.views}
                  </span>
                  <span className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    {material.rating}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {material.fileSize} • {material.pages || material.duration || 'N/A'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Uploaded {new Date(material.uploadDate).toLocaleDateString()}
                </div>
                {material.lastAccessed && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Zap className="h-4 w-4 mr-1" />
                    Accessed {new Date(material.lastAccessed).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={isBookmarked ? "text-blue-600 border-blue-200 bg-blue-50" : ""}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:translate-y-1"
    >
      {/* Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-2xl flex items-center justify-center">
          {getTypeIcon()}
        </div>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
            {material.type.toUpperCase()}
          </span>
          {material.lastAccessed && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              Recent
            </span>
          )}
        </div>

        {/* Level Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            material.level === 'beginner' ? 'bg-green-100 text-green-800' :
            material.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {material.level.charAt(0).toUpperCase() + material.level.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3">
          <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full mb-2">
            {material.subject}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {material.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
            {material.description}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Download className="h-3 w-3 mr-1" />
              <span className="text-xs">{material.downloads}</span>
            </div>
            <div className="text-xs text-gray-500">Downloads</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Eye className="h-3 w-3 mr-1" />
              <span className="text-xs">{material.views}</span>
            </div>
            <div className="text-xs text-gray-500">Views</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
              <span className="text-xs">{material.rating}</span>
            </div>
            <div className="text-xs text-gray-500">Rating</div>
          </div>
        </div>

        {/* File Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>{material.fileSize}</span>
          <span>{material.pages || material.duration || 'N/A'}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current text-blue-600" : ""}`} />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-1" />
            {isDownloading ? "..." : "Get"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const CategoryCard = ({ category, isActive, onClick }: {
  category: MaterialCategory;
  isActive: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`p-4 h-36 w-44 rounded-2xl text-left transition-all duration-200 ${
      isActive
        ? "bg-white dark:bg-gray-800 shadow-lg border-2 border-blue-500"
        : "bg-gray-100 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 border-2 border-transparent"
    }`}
  >
    <div className="flex items-center justify-center mb-2">
      <div className={`p-3 rounded-xl ${category.color}`}>
        <category.icon className="h-6 w-6 text-white" />
      </div>
    </div>
    <h3 className="font-semibold text-center text-gray-900 dark:text-white mb-1">{category.name}</h3>
    <p className="text-sm text-gray-600 text-center dark:text-gray-400">{category.count} materials</p>
  </motion.button>
);

export default function StudyMaterialPage() {
  const [materials] = useState<StudyMaterial[]>(mockMaterials);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const categories: MaterialCategory[] = [
    { id: "all", name: "All Materials", icon: Library, count: materials.length, color: "bg-gradient-to-br from-blue-500 to-purple-600" },
    { id: "mathematics", name: "Mathematics", icon: Brain, count: materials.filter(m => m.subject === "mathematics").length, color: "bg-gradient-to-br from-green-500 to-teal-600" },
    { id: "science", name: "Science", icon: Lightbulb, count: materials.filter(m => m.subject === "science").length, color: "bg-gradient-to-br from-orange-500 to-red-600" },
    { id: "programming", name: "Programming", icon: PenTool, count: materials.filter(m => m.subject === "programming").length, color: "bg-gradient-to-br from-purple-500 to-pink-600" },
    { id: "business", name: "Business", icon: BarChart3, count: materials.filter(m => m.subject === "business").length, color: "bg-gradient-to-br from-indigo-500 to-blue-600" },
  ];


  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          material.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || material.subject === selectedCategory;
    const matchesType = selectedType === "all" || material.type === selectedType;
    const matchesLevel = selectedLevel === "all" || material.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesType && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
                ))}
              </div>
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-300 dark:bg-gray-700 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Stats */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex gap-3 space-y-3">
                {categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isActive={selectedCategory === category.id}
                    onClick={() => setSelectedCategory(category.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4"
          >
            {/* Search and Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials, topics, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* View Toggle and Results */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredMaterials.length} materials found
                  </span>
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === "grid"
                          ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === "list"
                          ? "bg-white dark:bg-gray-600 shadow-sm text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials Grid */}
            {filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-auto">
                  <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No materials found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedType("all");
                      setSelectedLevel("all");
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                <AnimatePresence>
                  {filteredMaterials.map((material) => (
                    <MaterialCard
                      key={material._id}
                      material={material}
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}