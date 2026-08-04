// SectionManagement.jsx
import { useState, useEffect, useMemo } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Layers,
  SlidersHorizontal,
  Grid3X3,
  List,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Hash,
  Loader2,
  RefreshCcw,
  Timer,
  HelpCircle,
  FileText,
  BookOpen,
} from "lucide-react";
import TextArea from "../../components/form/input/TextArea";
import { useAuth } from "../../context/UserContext";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

export default function SectionManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, openModal, closeModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedSections, setSelectedSections] = useState([]);
  const [saving, setSaving] = useState(false);

  // Filters for listing
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    thumbnailPic: "",
    duration: 0,
    totalQuestions: 0,
  });

  const [errors, setErrors] = useState({});

  // Fetch data on filter change
  useEffect(() => {
    fetchSections();
  }, [filters]);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    setSearchTimeout(timeoutId);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
      };
      const response = await api.get("/test/sections", { params });
      setSections(response.data?.data || []);
      setTotal(response.data?.total || response.data?.pagination?.total || 0);
    } catch (error) {
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      search: "",
    });
    setSearchInput("");
  };

  const viewSectionDetails = async (section) => {
    try {
      const res = await api.get(`/test/sections/${section._id}`);
      setSelectedSection(res.data?.data || section);
      openModal();
    } catch (error) {
      setSelectedSection(section);
      openModal();
    }
  };

  const openCreateModal = () => {
    setSelectedSection(null);
    setFormData({
      name: "",
      description: "",
      instructions: "",
      thumbnailPic: "",
      duration: 0,
      totalQuestions: 0,
    });
    setErrors({});
    setEditModalOpen(true);
  };

  const openEditModal = (section) => {
    setSelectedSection(section);
    setFormData({
      name: section.name || "",
      description: section.description || "",
      instructions: section.instructions || "",
      thumbnailPic: section.thumbnailPic || "",
      duration: section.duration || 0,
      totalQuestions: section.totalQuestions || 0,
    });
    setErrors({});
    setEditModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Section name is required";
    if (!formData.duration || formData.duration <= 0) newErrors.duration = "Duration must be greater than 0";
    if (!formData.totalQuestions || formData.totalQuestions <= 0) newErrors.totalQuestions = "Total questions must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSection = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        totalQuestions: Number(formData.totalQuestions),
      };
      await api.post("/test/sections", payload);
      toast.success("Section created successfully");
      fetchSections();
      setEditModalOpen(false);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create section";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        totalQuestions: Number(formData.totalQuestions),
      };
      await api.put(`/test/sections/${selectedSection._id}`, payload);
      toast.success("Section updated successfully");
      fetchSections();
      setEditModalOpen(false);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update section";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSection) {
      handleSaveSection();
    } else {
      handleCreateSection();
    }
  };

  const deleteSection = async () => {
    if (!selectedSection) return;
    try {
      await api.delete(`/test/sections/${selectedSection._id}`);
      toast.success("Section deleted successfully");
      fetchSections();
      setDeleteModalOpen(false);
      setSelectedSection(null);
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete section";
      toast.error(msg);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedSections.length} selected sections?`)) return;
    try {
      await Promise.all(selectedSections.map(id => api.delete(`/test/sections/${id}`)));
      toast.success(`${selectedSections.length} sections deleted`);
      setSelectedSections([]);
      fetchSections();
    } catch (error) {
      toast.error("Failed to delete some sections");
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0m";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (mins > 0) result += `${mins}m `;
    if (secs > 0 && hours === 0) result += `${secs}s`;

    return result.trim() || "0m";
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="min-h-screen max-w-7xl mx-auto p-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Section Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your test sections and configurations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* {selectedSections.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedSections.length})
                            </Button>
                        )} */}
            <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-md p-1.5 ${viewMode === "table"
                    ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-500"
                  }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 ${viewMode === "grid"
                    ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-500"
                  }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="mb-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 p-3 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronRight className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search sections..."
                  className="w-64 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
              </div>

              {filters.search && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
              <button
                    onClick={resetFilters}
                    className="w-full flex items-center rounded-xl border border-gray-200 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    <RefreshCcw className="mr-2 inline-block h-4 w-4" />
                    Reset
                  </button>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && (
        <div className="mb-4 flex items-center justify-between text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{sections.length}</span> of{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{total}</span> sections
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading sections...</p>
          </div>
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Layers className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No sections found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filters.search
              ? "Try adjusting your search terms"
              : "Get started by creating your first section"}
          </p>
          {!filters.search && (
            <Button className="mt-6" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Section
            </Button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Enhanced Table View */
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left dark:border-gray-800">
                  <th className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedSections.length === sections.length && sections.length > 0}
                      onChange={() => {
                        if (selectedSections.length === sections.length) {
                          setSelectedSections([]);
                        } else {
                          setSelectedSections(sections.map(s => s._id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Section Name</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Questions</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                  <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <AnimatePresence>
                  {sections.map((section) => (
                    <motion.tr
                      key={section._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedSections.includes(section._id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(section._id)}
                          onChange={() => {
                            setSelectedSections(prev =>
                              prev.includes(section._id)
                                ? prev.filter(id => id !== section._id)
                                : [...prev, section._id]
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {section.name}
                            </p>
                            {section.instructions && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {section.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                        <p className="line-clamp-2">
                          {section.description || "—"}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Timer className="h-3 w-3" />
                          {formatDuration(section.duration)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <Hash className="h-3 w-3" />
                          {section.totalQuestions || 0}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {moment(section.createdAt).format("MMM D, YYYY")}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewSectionDetails(section)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(section)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSection(section);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence>
            {sections.map((section) => (
              <motion.div
                key={section._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`group relative rounded-2xl border bg-white p-5 transition-all hover:shadow-lg dark:bg-gray-900 cursor-pointer ${selectedSections.includes(section._id)
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                  }`}
                onClick={() => {
                  setSelectedSections(prev =>
                    prev.includes(section._id)
                      ? prev.filter(id => id !== section._id)
                      : [...prev, section._id]
                  );
                }}
              >
                {/* Selection indicator */}
                <div className="absolute right-2 top-2">
                  <div className={`h-5 w-5 rounded-full border-2 transition-colors ${selectedSections.includes(section._id)
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300 dark:border-gray-600"
                    }`}>
                    {selectedSections.includes(section._id) && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>

                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                   
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {section.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Timer className="h-3 w-3" />
                      Duration
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatDuration(section.duration)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Hash className="h-3 w-3" />
                      Questions
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                      {section.totalQuestions || 0}
                    </p>
                  </div>
                </div>

                {/* Description Preview */}
                {section.description && (
                  <p className="mb-3 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {section.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {moment(section.createdAt).format("MMM D, YYYY")}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewSectionDetails(section);
                      }}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(section);
                      }}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSection(section);
                        setDeleteModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Enhanced Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {filters.page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (filters.page <= 3) {
                pageNum = i + 1;
              } else if (filters.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = filters.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${filters.page === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Section Details</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detailed information about this section</p>
            </div>
            <button
              onClick={closeModal}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {selectedSection && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedSection.name}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDuration(selectedSection.duration)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Questions</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedSection.totalQuestions}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {moment(selectedSection.createdAt).format("MMM D, YYYY h:mm A")}
                  </p>
                </div>
              </div>

              {selectedSection.description && (
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedSection.description}
                  </p>
                </div>
              )}

              {selectedSection.instructions && (
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Instructions</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedSection.instructions}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                {selectedSection ? "Edit Section" : "Create New Section"}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedSection ? "Update section details" : "Configure your new section"}
              </p>
            </div>
            <button
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto pb-3">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Section Name *</Label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="e.g., Quantitative Reasoning"
                      error={!!errors.name}
                      hint={errors.name}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <TextArea
                      value={formData.description}
                      onChange={(val) => setFormData({ ...formData, description: val })}
                      placeholder="Brief description of this section..."
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Instructions</Label>
                    <TextArea
                      value={formData.instructions}
                      onChange={(val) => setFormData({ ...formData, instructions: val })}
                      placeholder="Instructions for test takers..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Duration (seconds) *</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => {
                        setFormData({ ...formData, duration: e.target.value });
                        if (errors.duration) setErrors({ ...errors, duration: "" });
                      }}
                      placeholder="e.g., 3600"
                      min="1"
                      error={!!errors.duration}
                      hint={errors.duration}
                    />
                    {formData.duration > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        = {formatDuration(Number(formData.duration))}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Total Questions *</Label>
                    <Input
                      type="number"
                      value={formData.totalQuestions}
                      onChange={(e) => {
                        setFormData({ ...formData, totalQuestions: e.target.value });
                        if (errors.totalQuestions) setErrors({ ...errors, totalQuestions: "" });
                      }}
                      placeholder="e.g., 36"
                      min="1"
                      error={!!errors.totalQuestions}
                      hint={errors.totalQuestions}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={saving}
                disabled={saving}
              >
                {selectedSection ? "Save Changes" : "Create Section"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
        {selectedSection && (
          <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">Delete Section</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Warning
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    You are about to permanently delete{" "}
                    <strong>"{selectedSection.name}"</strong>.
                    This will remove all associations and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={deleteSection}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Section
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}