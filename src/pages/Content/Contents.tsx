import { useState, useEffect, useCallback, use } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api, { ImageBaseUrl } from "../../axiosInstance";
import ReactSelect from "react-select";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Video,
  Play,
  FileText,
  Clipboard,
  PlaySquareIcon,
  Upload,
  Radio,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import RecordedVideoUploadModal from "./UploadClass";
import { ContentThumbnailDropzone } from "./CotentThumbnail";
import DynamicIcon from "../../components/DynamicIcon";

export default function ContentManagement({ type }: any) {
  const [contents, setContents] = useState([]) as any;
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "-createdAt",
    contentType: type || "",
    status: "",
    search: "",
    course: "",
  });
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchContents = useCallback(
    async (reset = false) => {
      if (loading && !reset) return;
      setLoading(true);
      try {
        const params = {
          ...filters,
          page: reset ? 1 : filters.page,
          limit: filters.limit,
          sort: filters.sortBy,
          search: debouncedSearch,
          contentType: type || "",
        };

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
      } catch (error) {
        toast.error(error.message || "Failed to fetch contents");
      } finally {
        setLoading(false);
      }
    },
    [filters, debouncedSearch, type, filters.contentType],
  );

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  }, []);

  const fetchModules = useCallback(async (courseId) => {
    if (!courseId) {
      setModules([]);
      return;
    }
    try {
      const response = await api.get(`/modules?course=${courseId}`);
      setModules(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const response = await api.get("/users?role=teacher");
      setInstructors(response.data?.users || []);
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
    }
  }, []);

  useEffect(() => {
    fetchContents(true);
  }, [
    filters.contentType,
    filters.status,
    filters.course,
    filters.sortBy,
    debouncedSearch,
    type,
  ]);

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
  }, [fetchCourses, fetchInstructors]);

  useEffect(() => {
    fetchModules(filters.course);
  }, [filters.course, fetchModules]);

  const handleFilterChange = (e) => {
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

  useEffect(() => {
    if (filters.page > 1) {
      fetchContents();
    }
  }, [filters.page, fetchContents]);

  const viewContentDetails = (content) => {
    setSelectedContent(content);
    openModal();
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
    } catch (error) {
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
        : [...prev, contentId],
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
        return <Play className="w-4 h-4 text-gray-500" />;
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

  return (
    <div className="w-full">
      {/* Header */}
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="text-blue-600"
              >
                <path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM10 12H8V14H10V12ZM14 12H12V14H14V12ZM10 16H8V18H10V16ZM14 16H12V18H14V16Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                Content Management
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your course content
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {total} contents
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              <Filter className="h-5 w-5" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-blue-700 lg:inline-flex lg:w-auto"
            >
              <Plus className="h-5 w-5" />
              Add Content
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search (Title)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search contents..."
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course
              </label>
              <select
                name="course"
                value={filters.course}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="-title">Title (Z-A)</option>
                <option value="order">Order (Low to High)</option>
                <option value="-order">Order (High to Low)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 10,
                  sortBy: "-createdAt",
                  contentType: type || "",
                  status: "",
                  search: "",
                  course: "",
                })
              }
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-6">
        {loading && contents.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : contents.length > 0 ? (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Content
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Course
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
              <div className="flex justify-center mt-6 pb-6">
                <button
                  onClick={loadMoreContents}
                  disabled={loading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No contents found matching your criteria.
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
        <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Content Details
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Detailed information about this content
            </p>
          </div>
          <div className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              {selectedContent && (
                <div className="space-y-8">
                  <div>
                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Basic Information
                    </h5>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Title
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Course
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.courseInfo?.title || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Module
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.moduleInfo?.title || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Instructor
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.instructorInfo?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Order
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.order}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Duration
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.duration
                            ? `${selectedContent.duration} seconds`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedContent.description && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Description
                      </h5>
                      <p className="text-sm text-gray-800 dark:text-white/90">
                        {selectedContent.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Status
                    </h5>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Publication Status
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              selectedContent.status === "published"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : selectedContent.status === "draft"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : selectedContent.status === "archived"
                                    ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {selectedContent.status}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Published At
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.publishedAt
                            ? moment(selectedContent.publishedAt).format(
                                "MMM D, YYYY h:mm A",
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Access
                    </h5>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Access Type
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                          {selectedContent.access?.type || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Is Free
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {selectedContent.isFree ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedContent.tags?.length > 0 && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Tags
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.tags.map((tag, index) => (
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

                  {/* Specific Content Type Details */}
                  {(selectedContent.__t === "LiveClasses" ||
                    selectedContent.__t === "Sessions") && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Live Class Details
                      </h5>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Scheduled Start
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.scheduledStart
                              ? moment(selectedContent.scheduledStart).format(
                                  "MMM D, YYYY h:mm A",
                                )
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Scheduled End
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.scheduledEnd
                              ? moment(selectedContent.scheduledEnd).format(
                                  "MMM D, YYYY h:mm A",
                                )
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Live Status
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                            {selectedContent.liveStatus || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Meeting ID
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.meetingId || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Meeting URL
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.meetingUrl ? (
                              <a
                                href={selectedContent.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Join Meeting
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Max Participants
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.maxParticipants || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedContent.__t === "RecordedClasses" && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Recorded Class Details
                      </h5>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Video URL
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.video?.publicId ? (
                              <a
                                href={selectedContent.video.publicId}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Watch Video
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Duration
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.video?.duration
                              ? `${selectedContent.video.duration} seconds`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedContent.__t === "Tests" && (
                    <div className="md:col-span-2">
                      <Label>Test *</Label>

                      {/* Search */}
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

                        <input
                          type="text"
                          value={testSearch}
                          onChange={(e) => setTestSearch(e.target.value)}
                          placeholder="Search test..."
                          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Test Select */}
                      <Select
                        value={formData.test}
                        defaultValue={formData.test}
                        placeholder={
                          testsLoading ? "Loading tests..." : "Select Test"
                        }
                        options={tests.map((test) => ({
                          value: test._id,
                          label: test.title,
                        }))}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            test: value,
                          }));
                        }}
                      />

                      {errors.test && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.test}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedContent.__t === "StudyMaterials" && (
                    <div>
                      <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                        Study Material Details
                      </h5>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Material Type
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                            {selectedContent.materialType || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            File URL
                          </p>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedContent.file?.url ? (
                              <a
                                href={selectedContent.file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                View File
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                      Dates
                    </h5>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Created At
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {moment(selectedContent.createdAt).format(
                            "MMM D, YYYY h:mm A",
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Last Updated
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {moment(selectedContent.updatedAt).format(
                            "MMM D, YYYY h:mm A",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        className="max-w-[900px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 sm:p-6 dark:bg-gray-900 ">
          <div className="px-2 pr-14">
            <h4 className="mb-px text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedContent ? "Edit Content" : "Add New Content"}
            </h4>
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {selectedContent
                ? "Update content details below"
                : "Create a new content for your course"}
            </p>
          </div>
          <div className="custom-scrollbar h-[480px] overflow-y-auto px-2 pb-3">
            <ContentForm
              content={selectedContent}
              onSave={handleSaveSuccess}
              onCancel={handleCancelForm}
              courses={courses}
              modules={modules}
              instructors={instructors}
              type={type}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
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
                Are you sure you want to delete this content? This action cannot
                be undone.
              </p>
            </div>
            <div className="px-2">
              <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Warning
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>
                        Deleting "{selectedContent.title}" will permanently
                        remove it from the system.
                      </p>
                    </div>
                  </div>
                </div>
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
  let navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const getContentTypeLabel = (type) => {
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
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
        <td className="px-4 py-3">
          {/* {content.__t === "RecordedClasses" &&
                            content.video?.publicId && (
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/class/${content._id}/${content.courseInfo?._id}?module=${content.module}`
                                        )
                                    }
                                    className="
                absolute inset-0
                flex items-center justify-center
                opacity-0 group-hover:opacity-100
                transition
                "
                                >
                                    <div className="bg-white rounded-full p-4 shadow-xl">
                                        <Play className="w-8 h-8 text-gray-600 fill-gray-600" />
                                    </div>
                                </button>
                            )}

                        {content.__t === "LiveClasses" && (
                            <button
                                onClick={() =>
                                    navigate(
                                        `/class/${content._id}/${content.courseInfo?._id}?module=${content.module}`
                                    )
                                }
                                className="
              absolute inset-0
              flex items-center justify-center
              opacity-0 group-hover:opacity-100
              transition
              "
                            >
                                <div className="bg-red-500 rounded-full p-4 shadow-xl">
                                    <Radio className="w-8 h-8 text-white" />
                                </div>
                            </button>
                        )} */}
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
                {content.description?.substring(0, 50)}...
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
            {content.courseInfo?.title || "N/A"}
          </p>
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
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(content.status)}`}
          >
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
        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {content.description || "No description available"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1">
                  {content.tags?.length > 0
                    ? content.tags.map((tag, idx) => (
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Additional Info
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Duration:{" "}
                    {content.duration ? `${content.duration}s` : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Free: {content.isFree ? "Yes" : "No"}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Last Updated:{" "}
                    {moment(content.updatedAt).format("MMM D, YYYY h:mm A")}
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
          onUploadComplete={async (data) => {
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

const ContentForm = ({
  content = null,
  onSave,
  onCancel,
  courses,
  type,
  instructors,
}: any) => {
  const [modules, setModules] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tests, setTests] = useState<any[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [testsLoading, setTestsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    module: "",
    instructor: "",
    order: 0,
    duration: 0,
    status: "draft",
    isFree: false,
    tags: [""],
    __t: type || "", // Default content type
    isDownloadable: false,
    version: "1.0",
    textContent: "",
    pages: 0,
    externalLink: "",
    scheduledStart: "",
    scheduledEnd: "",
    maxParticipants: 100,
    videoUrl: "",
    videoDuration: 0,
    test: "",
    testType: "",
    materialType: "pdf",
    fileUrl: "",
    meetingId: "",
  }) as any;
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (content && courses) {
      setFormData({
        title: content.title || "",
        description: content.description || "",
        course: content.course || "",
        module: content.module || "",
        instructor: content.instructor || "",
        order: content.order || 0,
        duration: content.duration || 0,
        status: content.status || "draft",
        isFree: content.isFree || false,
        tags: content.tags?.length ? [...content.tags] : [""],
        __t: content.__t || "LiveClasses",
        isDownloadable:
          content.isDownloadable !== undefined ? content.isDownloadable : true,
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
        test: content.test || "",
        testType: content.testType || "quiz",
        materialType: content.materialType || "pdf",
        fileUrl: content.file?.url || "",
        thumbnailPic: content.thumbnailPic || null,
        meetingId: content.meetingId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        course: "",
        module: "",
        instructor: "",
        order: 0,
        duration: 0,
        status: "draft",
        isFree: false,
        tags: [""],
        __t: type || "",
        scheduledStart: "",
        scheduledEnd: "",
        maxParticipants: 100,
        videoUrl: "",
        videoDuration: 0,
        test: "",
        testType: "",
        materialType: "pdf",
        fileUrl: "",
        thumbnailPic: "",
        meetingId: "",
      });
    }
    setErrors({});
  }, [content, courses]);

  const fetchModules = async (courseId: any) => {
    if (!courseId) {
      setModules([]);
      return;
    }
    try {
      const response = await api.get(`/modules?course=${courseId}`);
      setModules(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  };

  const fetchTests = async (search = "") => {
    try {
      setTestsLoading(true);

      const params: any = {
        limit: 100,
        category: formData?.course,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/mcu/test", { params });

      if (response.data?.success) {
        const data = response.data?.data || [];
        setTests(data);
      } else {
        setTests([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch tests:", error);
      toast.error(error?.response?.data?.message || "Failed to load tests");
      setTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  // useEffect(() => {
  //   if (type !== "Tests") {
  //     setTests([]);
  //     return;
  //   }
  //   fetchTests();
  // }, [type]);

  useEffect(() => {
    if (type !== "Tests") return;
    const timer = setTimeout(() => {
      fetchTests(testSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [testSearch, type]);

  const handleThumbnailChange = (file) => {
    setThumbnailFile(file); // Store the File object
    if (errors.thumbnailPic) {
      setErrors((prev) => ({ ...prev, thumbnailPic: "" }));
    }
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null); // Clear the selected file
    setFormData((prev) => ({ ...prev, thumbnailPic: "" })); // Clear the thumbnail URL in formData
    if (errors.thumbnailPic) {
      setErrors((prev) => ({ ...prev, thumbnailPic: "" }));
    }
  };

  useEffect(() => {
    fetchModules(formData.course);
  }, [formData.course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field) => {
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayField = (field, index) => {
    if (formData[field].length <= 1) {
      setFormData((prev) => ({ ...prev, [field]: [""] }));
    } else {
      const newArray = [...formData[field]];
      newArray.splice(index, 1);
      setFormData((prev) => ({ ...prev, [field]: newArray }));
    }
  };

  const validateForm = () => {
    const newErrors = {} as any;
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.course) newErrors.course = "Course is required";
    if (formData.__t === "LiveClasses" || formData.__t === "Sessions") {
      if (!formData.thumbnailPic && !thumbnailFile)
        newErrors.thumbnailPic = "Thumbnail is required";
      if (!formData.instructor) newErrors.instructor = "Instructor is required";
      if (!formData.scheduledStart)
        newErrors.scheduledStart = "Scheduled start time is required";
      if (!formData.scheduledEnd)
        newErrors.scheduledEnd = "Scheduled end time is required";
    } else if (formData.__t === "RecordedClasses") {
      if (!formData.thumbnailPic && !thumbnailFile)
        newErrors.thumbnailPic = "Thumbnail is required";
      if (!formData.instructor) newErrors.instructor = "Instructor is required";
    } else if (formData.__t === "StudyMaterials") {
      if (!formData.fileUrl.trim()) newErrors.fileUrl = "File URL is required";
      if (!formData.materialType) {
        newErrors.materialType = "Material type is required";
      }
    } else if (formData.__t === "Tests") {
      if (!formData.test) {
        newErrors.test = "Test is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        course: formData.course,
        module: formData.module,
        instructor: formData.instructor,
        // order: parseInt(formData.order, 10) || 0,
        status: formData.status,
        isFree: formData.isFree,
        tags: formData.tags.filter((tag) => tag.trim() !== ""),
        __t: formData.__t,
      };

      if (formData.__t === "LiveClasses" || formData.__t === "Sessions") {
        payload.scheduledStart = new Date(formData.scheduledStart);
        payload.scheduledEnd = new Date(formData.scheduledEnd);
        payload.meetingId = formData?.meetingId || "";
      } else if (formData.__t === "RecordedClasses") {
      } else if (formData.__t === "Tests") {
        payload.test = formData.test;
        payload.testType = formData.testType;
      } else if (formData.__t === "StudyMaterials") {
        payload.materialType = formData.materialType;
        payload.file = {
          url: formData.fileUrl,
        };
        payload.isDownloadable =
          formData.isDownloadable === "true" ||
          formData.isDownloadable === true;
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
        uploadFormData.append("image", thumbnailFile); // Append the File object
        try {
          const uploadResponse = await api.post(
            "/upload/single",
            uploadFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            },
          );
          const uploadedThumbnailUrl = uploadResponse.data?.file?.filename;
          if (!uploadedThumbnailUrl) {
            throw new Error("Thumbnail upload failed: No URL returned.");
          }
          finalThumbnailUrl = uploadedThumbnailUrl;
        } catch (uploadError) {
          toast.error(uploadError.message || "Failed to upload thumbnail");
          return;
        }
      }

      if (content) {
        await api.put(`/content/${content._id}`, {
          ...payload,
          thumbnailPic: finalThumbnailUrl,
        });
        toast.success("Content updated successfully");
      } else {
        await api.post(
          `/content/${type == "LiveClasses" ? "liveclass" : type == "RecordedClasses" ? "recordedclass" : type == "Tests" ? "test" : type == "StudyMaterials" ? "studymaterial" : "sessions"}`,
          { ...payload, thumbnailPic: finalThumbnailUrl },
        );
        toast.success("Content created successfully");
      }
      onSave();
    } catch (error) {
      toast.error(error?.message || "Failed to save content");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>
        {formData.__t != "StudyMaterials" && formData.__t != "Tests" && (
          <div className="md:col-span-2">
            <Label>Thumbnail Picture</Label>
            <ContentThumbnailDropzone
              value={{
                url: formData.thumbnailPic
                  ? ImageBaseUrl + "/" + formData.thumbnailPic
                  : "",
              }}
              onChange={handleThumbnailChange}
              onRemove={handleThumbnailRemove}
              error={errors.thumbnailPic}
            />
          </div>
        )}

        <div>
          <Label>Course *</Label>
          <Select
            defaultValue={formData.course}
            options={[
              ...courses.map((course) => ({
                value: course._id,
                label: course.title,
              })),
            ]}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, course: value, module: "" }))
            }
          />
          {errors.course && (
            <p className="mt-1 text-sm text-red-600">{errors.course}</p>
          )}
        </div>
        <div>
          <Label>Module</Label>
          <Select
            value={formData.module}
            defaultValue={formData.module}
            options={[
              ...modules.map((module) => ({
                value: module._id,
                label: module.title,
              })),
            ]}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, module: value }))
            }
          />
        </div>
        {formData.__t != "StudyMaterials" && formData.__t != "Tests" && (
          <div>
            <Label>Instructor *</Label>
            <Select
              defaultValue={formData.instructor}
              options={[
                ...instructors.map((instructor) => ({
                  value: instructor._id,
                  label: `${instructor.name || "User"} (${instructor.email})`,
                })),
              ]}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, instructor: value }))
              }
            />
            {errors.instructor && (
              <p className="mt-1 text-sm text-red-600">{errors.instructor}</p>
            )}
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
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
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

      {formData.__t != "Tests" && (
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

      {formData.__t != "Tests" && (
        <div>
          <Label>Tags</Label>
          <div className="space-y-2">
            {formData.tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={tag}
                  onChange={(e) =>
                    handleArrayChange("tags", index, e.target.value)
                  }
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
              <p className="mt-1 text-sm text-red-600">
                {errors.scheduledStart}
              </p>
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
            <Label>Meeting Id</Label>
            <Input
              type="text"
              name="meetingId"
              value={formData.meetingId}
              onChange={handleChange}
              placeholder="Enter live Video Id"
            />
            {errors.meetingId && (
              <p className="mt-1 text-sm text-red-600">{errors.meetingId}</p>
            )}
          </div>
        </div>
      )}
      {formData.__t === "Tests" && (
        <div>
          <Label>Test *</Label>

          <ReactSelect
            isSearchable
            isClearable
            isLoading={testsLoading}
            placeholder="Search and select test..."
            value={
              tests
                .map((test) => ({
                  value: test._id,
                  label: test.title,
                }))
                .find((option) => option.value === formData.test) || null
            }
            options={tests.map((test) => ({
              value: test._id,
              label: test.title,
            }))}
            onInputChange={(inputValue, { action }) => {
              if (action === "input-change") {
                setTestSearch(inputValue);
              }
            }}
            onChange={(selectedOption) => {
              setFormData((prev) => ({
                ...prev,
                test: selectedOption?.value || "",
              }));
            }}
            className="react-select-container"
            classNamePrefix="react-select"
          />

          {errors.test && (
            <p className="mt-1 text-sm text-red-600">{errors.test}</p>
          )}
        </div>
      )}

      {formData.__t === "StudyMaterials" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Material Type *</Label>
            <Select
              placeholder="false"
              defaultValue={formData.materialType}
              options={[
                { value: "pdf", label: "PDF" },
                { value: "document", label: "Document" },
                { value: "link", label: "Link" },
                { value: "image", label: "Image" },
                { value: "audio", label: "Audio" },
              ]}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, materialType: value }))
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
            {errors.fileUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.fileUrl}</p>
            )}
          </div>
          <div>
            <Label>Is Downloadable</Label>
            <select
              name="isDownloadable"
              value={formData.isDownloadable}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <Label>Version</Label>
            <Input
              type="text"
              name="version"
              value={formData.version || "1.0"}
              onChange={handleChange}
              placeholder="1.0"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Text Content</Label>
            <textarea
              name="textContent"
              value={formData.textContent || ""}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Enter text content for the study material"
            />
          </div>
          <div>
            <Label>Number of Pages</Label>
            <Input
              type="number"
              name="pages"
              value={formData.pages || ""}
              onChange={handleChange}
              placeholder="Enter number of pages"
              min="0"
            />
          </div>
          <div>
            <Label>External Link</Label>
            <Input
              type="url"
              name="externalLink"
              value={formData.externalLink || ""}
              onChange={handleChange}
              placeholder="https://example.com"
            />
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
          className="bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-2"
          type="submit"
        >
          {content ? "Update Content" : "Create Content"}
        </button>
      </div>
    </form>
  );
};
