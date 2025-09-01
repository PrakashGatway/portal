// components/admin/ModuleManagement.jsx
import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";

export default function ModuleManagement() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, openModal, closeModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "-createdAt",
    isPublished: "",
    search: "",
    course: ""
  });

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, [filters]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sortBy
      };
      const response = await api.get("/modules", { params });
      setModules(response.data?.data || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const viewModuleDetails = (module) => {
    setSelectedModule(module);
    openModal();
  };

  const handleSaveSuccess = () => {
    setEditModalOpen(false);
    fetchModules();
  };

  const handleCancelForm = () => {
    setEditModalOpen(false);
    setSelectedModule(null);
  };

  const deleteModule = async () => {
    if (!selectedModule) return;
    try {
      await api.delete(`/modules/${selectedModule._id}`);
      toast.success("Module deleted successfully");
      fetchModules();
      setDeleteModalOpen(false);
      setSelectedModule(null);
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error(error?.message || "Failed to delete module");
    }
  };

  const openCreateModal = () => {
    setSelectedModule(null);
    setEditModalOpen(true);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM10 12H8V14H10V12ZM14 12H12V14H14V12ZM10 16H8V18H10V16ZM14 16H12V18H14V16Z" fill="currentColor" />
              </svg>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                Module Management
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your course modules and their content
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {modules.length} modules
                </p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
            <button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              <Plus className="h-5 w-5" />
              Add Module
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search (Title)
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search modules..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {/* Course Filter */}
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
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              name="isPublished"
              value={filters.isPublished}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
          {/* Sort By */}
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
          {/* Reset Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                page: 1,
                limit: 10,
                sortBy: "-createdAt",
                isPublished: "",
                search: "",
                course: ""
              })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>
        {/* Actions Section */}
        <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>
        {/* Modules Table */}

        <div className="mb-6">
          {loading && modules.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : modules.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                  <ModuleCard
                    key={module._id}
                    module={module}
                    onView={viewModuleDetails}
                    onEdit={() => { setSelectedModule(module); setEditModalOpen(true); }}
                    onDelete={() => { setSelectedModule(module); setDeleteModalOpen(true); }}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              No modules found matching your criteria.
            </div>
          )}
        </div>
      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Showing{" "}
            <span className="font-medium">
              {(filters.page - 1) * filters.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(filters.page * filters.limit, total)}
            </span>{" "}
            of <span className="font-medium">{total}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${filters.page === 1
                ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                }`}
            >
              Previous
            </button>
            {Array.from(
              { length: Math.ceil(total / filters.limit) },
              (_, i) => i + 1
            )
              .slice(
                Math.max(0, filters.page - 3),
                Math.min(Math.ceil(total / filters.limit), filters.page + 2)
              )
              .map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`rounded-md border px-3 py-1 text-sm ${filters.page === pageNum
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    }`}
                >
                  {pageNum}
                </button>
              ))}
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page * filters.limit >= total}
              className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${filters.page * filters.limit >= total
                ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>

      {/* Module Details Modal */ }
  <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
    <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
      <div className="px-2 pr-14">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Module Details
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Detailed information about this module
        </p>
      </div>
      <div className="flex flex-col">
        <div className="custom-scrollbar h-[420px] overflow-y-auto px-2 pb-3">
          {selectedModule && (
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Basic Information
                </h5>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {selectedModule.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {selectedModule.courseInfo?.title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Order</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {selectedModule.order}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {selectedModule.duration > 0 ? `${selectedModule.duration} minutes` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedModule.description && (
                <div>
                  <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    Description
                  </h5>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {selectedModule.description}
                  </p>
                </div>
              )}

              {/* Status Information */}
              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Status
                </h5>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Publication Status</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${selectedModule.isPublished
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}>
                        {selectedModule.isPublished ? "Published" : "Draft"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Published At</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {selectedModule.publishedAt
                        ? moment(selectedModule.publishedAt).format("MMM D, YYYY h:mm A")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Statistics */}
              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Content Statistics
                </h5>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Live Classes</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {selectedModule.liveClassesCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Recorded Classes</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {selectedModule.recordedClassesCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tests</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {selectedModule.testsCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {selectedModule.objectives?.length > 0 && (
                <div>
                  <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    Objectives
                  </h5>
                  <ul className="space-y-2">
                    {selectedModule.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-sm text-gray-800 dark:text-white/90">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prerequisites */}
              {selectedModule.prerequisites?.length > 0 && (
                <div>
                  <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                    Prerequisites
                  </h5>
                  <ul className="space-y-2">
                    {selectedModule.prerequisites.map((prerequisite, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-sm text-gray-800 dark:text-white/90">{prerequisite}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dates */}
              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Dates
                </h5>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {moment(selectedModule.createdAt).format("MMM D, YYYY h:mm A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {moment(selectedModule.updatedAt).format("MMM D, YYYY h:mm A")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={closeModal}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  </Modal>

  {/* Edit/Create Module Modal */ }
  <Modal
    isOpen={editModalOpen}
    onClose={() => setEditModalOpen(false)}
    className="max-w-[900px] m-4"
  >
    <div className="no-scrollbar relative w-full max-w-[900px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
      <div className="px-2 pr-14">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {selectedModule ? 'Edit Module' : 'Add New Module'}
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          {selectedModule
            ? 'Update module details below'
            : 'Create a new module for your course'}
        </p>
      </div>
      <div className="custom-scrollbar h-[480px] overflow-y-auto px-2 pb-3">
        <ModuleForm
          module={selectedModule}
          onSave={handleSaveSuccess}
          onCancel={handleCancelForm}
          courses={courses}
        />
      </div>
    </div>
  </Modal>

  {/* Delete Confirmation Modal */ }
  <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
    {selectedModule && (
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Confirm Deletion
          </h4>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
            Are you sure you want to delete this module? This action cannot be undone.
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
                    Deleting "{selectedModule.title}" will permanently remove it from the system.
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
          <Button
            size="sm"
            variant="primary"
            onClick={deleteModule}
          >
            Delete Module
          </Button>
        </div>
      </div>
    )}
  </Modal>
    </div >
  );
}

// Module Form Component
const ModuleForm = ({ module = null, onSave, onCancel, courses }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    order: 0,
    duration: 0,
    objectives: [""],
    prerequisites: [""],
    isPublished: false
  });
  const [errors, setErrors] = useState({});

  // Initialize form data if editing
  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || "",
        description: module.description || "",
        course: module.course || "",
        order: module.order || 0,
        duration: module.duration || 0,
        objectives: module.objectives?.length ? [...module.objectives] : [""],
        prerequisites: module.prerequisites?.length ? [...module.prerequisites] : [""],
        isPublished: module.isPublished || false
      });
    } else {
      setFormData({
        title: "",
        description: "",
        course: "",
        order: 0,
        duration: 0,
        objectives: [""],
        prerequisites: [""],
        isPublished: false
      });
    }
    setErrors({});
  }, [module]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field, index) => {
    // Prevent removing the last item if it's the only one
    if (formData[field].length <= 1) {
      setFormData(prev => ({
        ...prev,
        [field]: [""]
      }));
    } else {
      const newArray = [...formData[field]];
      newArray.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        [field]: newArray
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Module title is required';
    if (!formData.course) newErrors.course = 'Course is required';
    if (formData.order < 0) newErrors.order = 'Order must be a positive number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        order: parseInt(formData.order) || 0,
        duration: parseInt(formData.duration) || 0
      };

      if (module) {
        await api.put(`/modules/${module._id}`, payload);
        toast.success("Module updated successfully");
      } else {
        await api.post("/modules", payload);
        toast.success("Module created successfully");
      }
      onSave();
    } catch (error) {
      console.error("Error saving module:", error);
      toast.error(error?.message || "Failed to save module");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <Label>Module Title *</Label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter module title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <Label>Course *</Label>
          <Select
            name="course"
            value={formData.course}
            options={[
              ...courses.map(course => ({ value: course._id, label: course.title }))
            ]}
            onChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
          />
          {errors.course && <p className="mt-1 text-sm text-red-600">{errors.course}</p>}
        </div>

        <div>
          <Label>Order *</Label>
          <Input
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            min="0"
          />
          {errors.order && <p className="mt-1 text-sm text-red-600">{errors.order}</p>}
        </div>

        <div>
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Description</Label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Enter module description"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Published</span>
          </Label>
        </div>
      </div>

      <div>
        <Label>Objectives</Label>
        <div className="space-y-2">
          {formData.objectives.map((objective, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={objective}
                onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                placeholder="Enter objective"
              />
              {formData.objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('objectives', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('objectives')}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Add Objective
          </button>
        </div>
      </div>

      <div>
        <Label>Prerequisites</Label>
        <div className="space-y-2">
          {formData.prerequisites.map((prerequisite, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={prerequisite}
                onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                placeholder="Enter prerequisite"
              />
              {formData.prerequisites.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayField('prerequisites', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayField('prerequisites')}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Add Prerequisite
          </button>
        </div>
      </div>

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
          {module ? "Update Module" : "Create Module"}
        </button>
      </div>
    </form>
  );
};

const ModuleCard = ({ module, onView, onEdit, onDelete }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
            {module.title}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${module.isPublished
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}>
            {module.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
          {module.courseInfo?.title || "N/A"}
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {module.description || "No description provided."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
            LC: {module.liveClassesCount || 0}
          </span>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-200">
            RC: {module.recordedClassesCount || 0}
          </span>
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">
            T: {module.testsCount || 0}
          </span>
        </div>
        <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>Order: {module.order}</span>
          <span>{module.duration > 0 ? `${module.duration} min` : "N/A"}</span>
          <span>
            {module.publishedAt
              ? moment(module.publishedAt).format("MMM D")
              : "Not Published"}
          </span>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-end space-x-2">
        <button
          onClick={() => onView(module)}
          className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
          aria-label="View"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};