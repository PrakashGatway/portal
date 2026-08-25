import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api, { ImageBaseUrl } from "../../axiosInstance";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Video,
  Play,
  FileText,
  Clipboard,
  Radio,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
  BookOpen,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import DynamicIcon from "../../components/DynamicIcon";
import RecordedVideoUploadModal from "../Content/UploadClass";
import { ContentThumbnailDropzone } from "../Content/CotentThumbnail";

// Tab configuration
const CONTENT_TABS = [
  { id: "all", label: "All Content", icon: BookOpen },
  { id: "LiveClasses", label: "Live Classes", icon: Radio },
  { id: "RecordedClasses", label: "Recorded Classes", icon: Video },
  { id: "Tests", label: "Tests", icon: FileText },
  { id: "StudyMaterials", label: "Study Materials", icon: Clipboard },
  { id: "Sessions", label: "1:1 Sessions", icon: Users },
];

export default function CourseContentManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [activeTab, setActiveTab] = useState("all");
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [modules, setModules] = useState([]);
  const [instructors, setInstructors] = useState([]);
  
  // Modal states
  const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "-createdAt",
    status: "",
    search: "",
    module: "",
    contentType: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch course info
  const fetchCourseInfo = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourseInfo(response.data?.data || response.data);
    } catch (error) {
      console.error("Failed to fetch course info:", error);
      toast.error("Failed to load course information");
    }
  }, [courseId]);

  // Fetch modules for this course
  const fetchModules = useCallback(async () => {
    try {
      const response = await api.get(`/modules?course=${courseId}`);
      setModules(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  }, [courseId]);

  // Fetch instructors
  const fetchInstructors = useCallback(async () => {
    try {
      const response = await api.get("/users?role=teacher");
      setInstructors(response.data?.users || []);
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
    }
  }, []);

  // Fetch contents
  const fetchContents = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params: any = {
          ...filters,
          page: reset ? 1 : filters.page,
          limit: filters.limit,
          sort: filters.sortBy,
          search: debouncedSearch,
          course: courseId,
        };

        // Add contentType if not "all"
        if (activeTab !== "all") {
          params.contentType = activeTab;
        }

        const response = await api.get("/content", { params });
        const newContents = response.data?.data || [];
        const newTotal = response.data?.total || 0;

        setTotal(newTotal);

        if (reset) {
          setContents(newContents);
          setFilters((prev) => ({ ...prev, page: 1 }));
        } else {
          setContents((prev) => [...prev, ...newContents]);
        }

        setHasMore(contents.length + newContents.length < newTotal);
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch contents");
      } finally {
        setLoading(false);
      }
    },
    [filters, debouncedSearch, courseId, activeTab]
  );

  // Initial load
  useEffect(() => {
    fetchCourseInfo();
    fetchModules();
    fetchInstructors();
  }, [fetchCourseInfo, fetchModules, fetchInstructors]);

  // Fetch contents when filters or tab changes
  useEffect(() => {
    fetchContents(true);
  }, [
    activeTab,
    filters.status,
    filters.module,
    filters.sortBy,
    debouncedSearch,
    courseId,
  ]);

  // Load more
  useEffect(() => {
    if (filters.page > 1) {
      fetchContents();
    }
  }, [filters.page]);

  const handleFilterChange = (e: any) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const loadMoreContents = () => {
    if (hasMore && !loading) {
      setFilters((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      status: "",
      module: "",
    }));
  };

  const viewContentDetails = (content: any) => {
    setSelectedContent(content);
    openViewModal();
  };

  const handleSaveSuccess = () => {
    setEditModalOpen(false);
    setSelectedContent(null);
    fetchContents(true);
  };

  const handleCancelForm = () => {
    setEditModalOpen(false);
    setSelectedContent(null);
  };

  const deleteContent = async () => {
    if (!selectedContent) return;
    try {
      await api.delete(`/content/${selectedContent._id}`);
      toast.success("Content deleted successfully");
      fetchContents(true);
      setDeleteModalOpen(false);
      setSelectedContent(null);
    } catch (error: any) {
      console.error("Error deleting content:", error);
      toast.error(error?.message || "Failed to delete content");
    }
  };

  const openCreateModal = () => {
    setSelectedContent(null);
    setEditModalOpen(true);
  };

  const toggleRowExpansion = (contentId: string) => {
    setExpandedRows((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "LiveClasses":
        return <Radio className="w-4 h-4 text-red-500" />;
      case "RecordedClasses":
        return <Play className="w-4 h-4 text-blue-500" />;
      case "Tests":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "StudyMaterials":
        return <Clipboard className="w-4 h-4 text-green-500" />;
      default:
        return <Users className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "live":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getContentCounts = () => {
    const counts: any = {
      all: total,
      LiveClasses: 0,
      RecordedClasses: 0,
      Tests: 0,
      StudyMaterials: 0,
      Sessions: 0,
    };
    
    // This would require fetching counts from API, but we can estimate from current page
    contents.forEach((content) => {
      if (counts[content.__t] !== undefined) {
        counts[content.__t]++;
      }
    });
    
    return counts;
  };

  return (
    <div className="w-full">
      {/* Course Header */}
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {courseInfo?.title || "Course Content"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage all content for this course
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Created: {courseInfo?.createdAt ? moment(courseInfo.createdAt).format("MMM D, YYYY") : "N/A"}</span>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Content
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                  isActive
                    ? "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {getContentCounts()[tab.id] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter className="h-4 w-4" />
          Filters
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {total} total contents
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search contents..."
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label>Module</Label>
              <select
                name="module"
                value={filters.module}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Modules</option>
                {modules.map((module: any) => (
                  <option key={module._id} value={module._id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 10,
                  sortBy: "-createdAt",
                  status: "",
                  search: "",
                  module: "",
                  contentType: "",
                })
              }
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Content Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        {loading && contents.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : contents.length > 0 ? (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Content
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Module
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Instructor
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Created
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {contents.map((content) => (
                  <ContentTableRow
                    key={content._id}
                    content={content}
                    onView={viewContentDetails}
                    onEdit={() => {
                      setSelectedContent(content);
                      setEditModalOpen(true);
                    }}
                    onDelete={() => {
                      setSelectedContent(content);
                      setDeleteModalOpen(true);
                    }}
                    isExpanded={expandedRows.includes(content._id)}
                    onToggleExpand={() => toggleRowExpansion(content._id)}
                    getContentTypeIcon={getContentTypeIcon}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="flex justify-center py-6">
                <button
                  onClick={loadMoreContents}
                  disabled={loading}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
            {!hasMore && contents.length > 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                All contents loaded.
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No Content Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {activeTab === "all"
                ? "No content has been added to this course yet."
                : `No ${CONTENT_TABS.find((tab) => tab.id === activeTab)?.label} found for this course.`}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Content
            </button>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={closeViewModal} className="max-w-[800px] m-4">
        <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Content Details
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Detailed information about this content
            </p>
          </div>
          <div className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              {selectedContent && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Basic Information
                    </h5>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.__t}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Module</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.moduleInfo?.title || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Instructor</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.instructorInfo?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedContent.description && (
                    <div>
                      <h5 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
                        Description
                      </h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedContent.description}
                      </p>
                    </div>
                  )}

                  {/* Status and Dates */}
                  <div>
                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Status & Dates
                    </h5>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedContent.status)}`}>
                          {selectedContent.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {moment(selectedContent.createdAt).format("MMM D, YYYY h:mm A")}
                        </p>
                      </div>
                      {selectedContent.publishedAt && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Published At</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {moment(selectedContent.publishedAt).format("MMM D, YYYY h:mm A")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type-specific details */}
                  {(selectedContent.__t === "LiveClasses" || selectedContent.__t === "Sessions") && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Schedule Details
                      </h5>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled Start</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.scheduledStart
                              ? moment(selectedContent.scheduledStart).format("MMM D, YYYY h:mm A")
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled End</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.scheduledEnd
                              ? moment(selectedContent.scheduledEnd).format("MMM D, YYYY h:mm A")
                              : "N/A"}
                          </p>
                        </div>
                        {selectedContent.meetingId && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Meeting ID</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {selectedContent.meetingId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContent.__t === "RecordedClasses" && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Video Details
                      </h5>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.duration ? `${selectedContent.duration} seconds` : "N/A"}
                          </p>
                        </div>
                        {selectedContent.video?.publicId && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Video</p>
                            <p className="text-sm font-medium text-blue-500">
                              Available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedContent.__t === "StudyMaterials" && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Material Details
                      </h5>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Material Type</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                            {selectedContent.materialType || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Downloadable</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.isDownloadable ? "Yes" : "No"}
                          </p>
                        </div>
                        {selectedContent.file?.url && (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">File</p>
                            <a
                              href={selectedContent.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-500 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedContent.tags?.length > 0 && (
                    <div>
                      <h5 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">Tags</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeViewModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        className="max-w-[900px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 sm:p-6 dark:bg-gray-900">
          <div className="px-2 pr-14">
            <h4 className="mb-px text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedContent ? "Edit Content" : "Add New Content"}
            </h4>
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {selectedContent
                ? "Update content details below"
                : `Create a new ${CONTENT_TABS.find((tab) => tab.id === activeTab)?.label || "content"} for this course`}
            </p>
          </div>
          <div className="custom-scrollbar h-[480px] overflow-y-auto px-2 pb-3">
            <ContentForm
              content={selectedContent}
              onSave={handleSaveSuccess}
              onCancel={handleCancelForm}
              courseId={courseId}
              modules={modules}
              instructors={instructors}
              type={activeTab !== "all" ? activeTab : "LiveClasses"}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        className="max-w-lg"
      >
        {selectedContent && (
          <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Confirm Deletion
              </h4>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                Are you sure you want to delete this content? This action cannot be undone.
              </p>
            </div>
            <div className="px-2">
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Warning
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Deleting "{selectedContent.title}" will permanently remove it from the system.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={deleteContent}>
                Delete Content
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Reusable Table Row Component
const ContentTableRow = ({
  content,
  onView,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand,
  getContentTypeIcon,
  getStatusColor,
}: any) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "LiveClasses":
        return "Live Class";
      case "RecordedClasses":
        return "Recorded Class";
      case "Tests":
        return "Test";
      case "StudyMaterials":
        return "Study Material";
      default:
        return "1:1 Session";
    }
  };

  return (
    <>
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {content.thumbnailPic ? (
              <img
                src={`${ImageBaseUrl}/${content.thumbnailPic}`}
                alt={content.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {getContentTypeIcon(content.__t)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                {content.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {content.description?.substring(0, 50)}
                {content.description?.length > 50 ? "..." : ""}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            {getContentTypeIcon(content.__t)}
            {getContentTypeLabel(content.__t)}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1">
            {content.moduleInfo?.title || "N/A"}
          </p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {content.instructorInfo?.name || "N/A"}
          </p>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(content.status)}`}>
            {content.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {moment(content.createdAt).format("MMM D, YYYY")}
          </p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            {content.__t === "RecordedClasses" && !content.video?.publicId && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                title="Upload Video"
              >
                <Upload size={16} />
              </button>
            )}
            <button
              onClick={() => onView(content)}
              className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onEdit()}
              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete()}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => onToggleExpand()}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {content.description || "No description available"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {content.tags?.length > 0
                    ? content.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    : "No tags"}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Additional Info</p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Duration: {content.duration ? `${content.duration}s` : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Free: {content.isFree ? "Yes" : "No"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Last Updated: {moment(content.updatedAt).format("MMM D, YYYY h:mm A")}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      {content.__t === "RecordedClasses" && (
        <RecordedVideoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          content={content}
          onUploadComplete={async (data: any) => {
            try {
              await api.put(`/content/${content._id}`, {
                ...content,
                video: {
                  url: data.url,
                  duration: data.duration,
                  publicId: data.vimeoId,
                },
              });
              setIsUploadModalOpen(false);
              toast.success("Content updated successfully");
            } catch (error: any) {
              toast.error(error.message || "Error updating content");
            }
          }}
        />
      )}
    </>
  );
};

// Content Form Component (simplified for course-specific use)
const ContentForm = ({
  content = null,
  onSave,
  onCancel,
  courseId,
  modules,
  instructors,
  type,
}: any) => {
  const [thumbnailFile, setThumbnailFile] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [testsLoading, setTestsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    module: "",
    instructor: "",
    status: "draft",
    isFree: false,
    tags: [""],
    __t: type || "LiveClasses",
    isDownloadable: true,
    version: "1.0",
    textContent: "",
    pages: 0,
    externalLink: "",
    scheduledStart: "",
    scheduledEnd: "",
    maxParticipants: 100,
    test: "",
    testType: "",
    materialType: "pdf",
    fileUrl: "",
    meetingId: "",
  });
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || "",
        description: content.description || "",
        module: content.module || "",
        instructor: content.instructor || "",
        status: content.status || "draft",
        isFree: content.isFree || false,
        tags: content.tags?.length ? [...content.tags] : [""],
        __t: content.__t || type || "LiveClasses",
        isDownloadable: content.isDownloadable !== undefined ? content.isDownloadable : true,
        version: content.version || "1.0",
        textContent: content.content?.text || "",
        pages: content.content?.pages || 0,
        externalLink: content.externalLink || "",
        scheduledStart: content.scheduledStart
          ? moment(content.scheduledStart).format("YYYY-MM-DDTHH:mm")
          : "",
        scheduledEnd: content.scheduledEnd
          ? moment(content.scheduledEnd).format("YYYY-MM-DDTHH:mm")
          : "",
        maxParticipants: content.maxParticipants || 100,
        test: content.testId || "",
        testType: content.testType || "quiz",
        materialType: content.materialType || "pdf",
        fileUrl: content.file?.url || "",
        thumbnailPic: content.thumbnailPic || null,
        meetingId: content.meetingId || "",
      });
    }
  }, [content, type]);

  const fetchTests = async (search = "") => {
    try {
      setTestsLoading(true);
      const params: any = { limit: 100 };
      if (search.trim()) {
        params.search = search.trim();
      }
      const response = await api.get("/mcu/test", { params });
      setTests(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch tests:", error);
      setTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.__t === "Tests") {
      const timer = setTimeout(() => {
        fetchTests(testSearch);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [testSearch, formData.__t]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev: any) => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayField = (field: string, index: number) => {
    if (formData[field].length <= 1) {
      setFormData((prev: any) => ({ ...prev, [field]: [""] }));
    } else {
      const newArray = [...formData[field]];
      newArray.splice(index, 1);
      setFormData((prev: any) => ({ ...prev, [field]: newArray }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (formData.__t === "LiveClasses" || formData.__t === "Sessions") {
      if (!formData.thumbnailPic && !thumbnailFile) newErrors.thumbnailPic = "Thumbnail is required";
      if (!formData.instructor) newErrors.instructor = "Instructor is required";
      if (!formData.scheduledStart) newErrors.scheduledStart = "Scheduled start time is required";
      if (!formData.scheduledEnd) newErrors.scheduledEnd = "Scheduled end time is required";
    } else if (formData.__t === "RecordedClasses") {
      if (!formData.thumbnailPic && !thumbnailFile) newErrors.thumbnailPic = "Thumbnail is required";
      if (!formData.instructor) newErrors.instructor = "Instructor is required";
    } else if (formData.__t === "StudyMaterials") {
      if (!formData.fileUrl.trim()) newErrors.fileUrl = "File URL is required";
    } else if (formData.__t === "Tests") {
      if (!formData.test) newErrors.test = "Test is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        course: courseId,
        module: formData.module,
        instructor: formData.instructor,
        status: formData.status,
        isFree: formData.isFree,
        tags: formData.tags.filter((tag: string) => tag.trim() !== ""),
        __t: formData.__t,
      };

      if (formData.__t === "LiveClasses" || formData.__t === "Sessions") {
        payload.scheduledStart = new Date(formData.scheduledStart);
        payload.scheduledEnd = new Date(formData.scheduledEnd);
        payload.meetingId = formData.meetingId || "";
      } else if (formData.__t === "Tests") {
        payload.testId = formData.test;
        payload.testType = formData.testType;
      } else if (formData.__t === "StudyMaterials") {
        payload.materialType = formData.materialType;
        payload.file = { url: formData.fileUrl };
        payload.isDownloadable = formData.isDownloadable;
        payload.version = formData.version || "1.0";
        payload.content = {
          text: formData.textContent || "",
          pages: parseInt(formData.pages, 10) || 0,
        };
        payload.externalLink = formData.externalLink || "";
      }

      let finalThumbnailUrl = formData.thumbnailPic;

      if (thumbnailFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", thumbnailFile);
        const uploadResponse = await api.post("/upload/single", uploadFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const uploadedThumbnailUrl = uploadResponse.data?.file?.filename;
        if (!uploadedThumbnailUrl) {
          throw new Error("Thumbnail upload failed: No URL returned.");
        }
        finalThumbnailUrl = uploadedThumbnailUrl;
      }

      if (content) {
        await api.put(`/content/${content._id}`, {
          ...payload,
          thumbnailPic: finalThumbnailUrl,
        });
        toast.success("Content updated successfully");
      } else {
        const endpoint = 
          formData.__t === "LiveClasses" ? "liveclass" :
          formData.__t === "RecordedClasses" ? "recordedclass" :
          formData.__t === "Tests" ? "test" :
          formData.__t === "StudyMaterials" ? "studymaterial" : "sessions";
        
        await api.post(`/content/${endpoint}`, {
          ...payload,
          thumbnailPic: finalThumbnailUrl,
        });
        toast.success("Content created successfully");
      }
      onSave();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save content");
    }
  };

  const handleThumbnailChange = (file: any) => {
    setThumbnailFile(file);
    if (errors.thumbnailPic) {
      setErrors((prev: any) => ({ ...prev, thumbnailPic: "" }));
    }
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    setFormData((prev: any) => ({ ...prev, thumbnailPic: "" }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Content Type Selector */}
      {!content && (
        <div>
          <Label>Content Type</Label>
          <Select
            defaultValue={formData.__t}
            options={[
              { value: "LiveClasses", label: "Live Class" },
              { value: "RecordedClasses", label: "Recorded Class" },
              { value: "Tests", label: "Test" },
              { value: "StudyMaterials", label: "Study Material" },
              { value: "Sessions", label: "1:1 Session" },
            ]}
            onChange={(value: string) =>
              setFormData((prev: any) => ({ ...prev, __t: value }))
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Content Title *</Label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter content title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {formData.__t !== "StudyMaterials" && formData.__t !== "Tests" && (
          <div className="md:col-span-2">
            <Label>Thumbnail Picture</Label>
            <ContentThumbnailDropzone
              value={{
                url: formData.thumbnailPic ? ImageBaseUrl + "/" + formData.thumbnailPic : "",
              }}
              onChange={handleThumbnailChange}
              onRemove={handleThumbnailRemove}
              error={errors.thumbnailPic}
            />
          </div>
        )}

        <div>
          <Label>Module</Label>
          <Select
            defaultValue={formData.module}
            options={modules.map((module: any) => ({
              value: module._id,
              label: module.title,
            }))}
            onChange={(value: string) =>
              setFormData((prev: any) => ({ ...prev, module: value }))
            }
          />
        </div>

        {formData.__t !== "StudyMaterials" && formData.__t !== "Tests" && (
          <div>
            <Label>Instructor *</Label>
            <Select
              defaultValue={formData.instructor}
              options={instructors.map((instructor: any) => ({
                value: instructor._id,
                label: `${instructor.name || "User"} (${instructor.email})`,
              }))}
              onChange={(value: string) =>
                setFormData((prev: any) => ({ ...prev, instructor: value }))
              }
            />
            {errors.instructor && <p className="mt-1 text-sm text-red-600">{errors.instructor}</p>}
          </div>
        )}

        <div>
          <Label>Status</Label>
          <Select
            defaultValue={formData.status}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
              ...(formData.__t === "LiveClasses"
                ? [
                    { value: "live", label: "Live" },
                    { value: "scheduled", label: "Scheduled" },
                  ]
                : []),
            ]}
            onChange={(value: string) =>
              setFormData((prev: any) => ({ ...prev, status: value }))
            }
          />
        </div>

        <div className="flex items-center">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFree"
              checked={formData.isFree}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Is Free</span>
          </Label>
        </div>
      </div>

      {formData.__t !== "Tests" && (
        <div>
          <Label>Description</Label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Enter content description"
          />
        </div>
      )}

      {formData.__t !== "Tests" && (
        <div>
          <Label>Tags</Label>
          <div className="space-y-2">
            {formData.tags.map((tag: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={tag}
                  onChange={(e: any) => handleArrayChange("tags", index, e.target.value)}
                  placeholder="Enter tag"
                />
                {formData.tags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField("tags", index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    <DynamicIcon name="Trash" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField("tags")}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              + Add Tag
            </button>
          </div>
        </div>
      )}

      {(formData.__t === "LiveClasses" || formData.__t === "Sessions") && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Scheduled Start *</Label>
            <Input
              type="datetime-local"
              name="scheduledStart"
              value={formData.scheduledStart}
              onChange={handleChange}
            />
            {errors.scheduledStart && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduledStart}</p>
            )}
          </div>
          <div>
            <Label>Scheduled End *</Label>
            <Input
              type="datetime-local"
              name="scheduledEnd"
              value={formData.scheduledEnd}
              onChange={handleChange}
            />
            {errors.scheduledEnd && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduledEnd}</p>
            )}
          </div>
          <div>
            <Label>Meeting ID</Label>
            <Input
              type="text"
              name="meetingId"
              value={formData.meetingId}
              onChange={handleChange}
              placeholder="Enter meeting ID"
            />
          </div>
        </div>
      )}

      {formData.__t === "Tests" && (
        <div>
          <Label>Test *</Label>
          <Select
            defaultValue={formData.test}
            options={tests.map((test: any) => ({
              value: test._id,
              label: test.title,
            }))}
            onChange={(value: string) =>
              setFormData((prev: any) => ({ ...prev, test: value }))
            }
          />
          {errors.test && <p className="mt-1 text-sm text-red-600">{errors.test}</p>}
        </div>
      )}

      {formData.__t === "StudyMaterials" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Material Type *</Label>
            <Select
              defaultValue={formData.materialType}
              options={[
                { value: "pdf", label: "PDF" },
                { value: "document", label: "Document" },
                { value: "link", label: "Link" },
                { value: "image", label: "Image" },
                { value: "audio", label: "Audio" },
              ]}
              onChange={(value: string) =>
                setFormData((prev: any) => ({ ...prev, materialType: value }))
              }
            />
          </div>
          <div>
            <Label>File URL *</Label>
            <Input
              type="url"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              placeholder="https://example.com/material.pdf"
            />
            {errors.fileUrl && <p className="mt-1 text-sm text-red-600">{errors.fileUrl}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          className="bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-2"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="bg-blue-600 text-white shadow-theme-xs hover:bg-blue-700 disabled:bg-blue-300 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-2"
          type="submit"
        >
          {content ? "Update Content" : "Create Content"}
        </button>
      </div>
    </form>
  );
};