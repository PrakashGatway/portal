// components/admin/CourseManagement.jsx
import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2 } from "lucide-react";
import CourseSteppedForm from "./CourseSteps";


export default function CourseManagement() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        status: "",
        level: "",
        mode: "",
        search: ""
    });
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    useEffect(() => {
        fetchCourses();
        fetchCategories();
        fetchUsers();
    }, [filters]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy
            };
            const response = await api.get("/courses", { params });
            setCourses(response.data?.data || []);
            setTotal(response.data?.total || 0);
        } catch (error) {
            toast.error("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get("/categories");
            setCategories(response.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users?role=teacher");
            setUsers(response.data?.users || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
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

    const viewCourseDetails = (course) => {
        setSelectedCourse(course);
        openModal();
    };

    const handleSaveSuccess = () => {
        setEditModalOpen(false);
        fetchCourses();
    };

    const handleCancelForm = () => {
        setEditModalOpen(false);
        setSelectedCourse(null);
    };

    const deleteCourse = async () => {
        if (!selectedCourse) return;
        try {
            await api.delete(`/courses/${selectedCourse._id}`);
            toast.success("Course deleted successfully");
            fetchCourses();
            setDeleteModalOpen(false);
            setSelectedCourse(null);
        } catch (error) {
            console.error("Error deleting course:", error);
            toast.error(error.message || "Failed to delete course");
        }
    };

    const openCreateModal = () => {
        setSelectedCourse(null);
        setEditModalOpen(true);
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                                <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM18 20H6V4H18V20ZM11 16L15.5 12L11 8V11H7V13H11V16Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Course Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your courses and their details
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {courses.length} courses
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                                    fill=""
                                />
                            </svg>
                            Add Course
                        </button>
                    </div>
                </div>
            </div>
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                {/* Filters Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Title, Code)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search courses..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    {/* Status Filter */}
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
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    {/* Level Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Level
                        </label>
                        <select
                            name="level"
                            value={filters.level}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                    {/* Mode Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mode
                        </label>
                        <select
                            name="mode"
                            value={filters.mode}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Modes</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="recorded">Recorded</option>
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
                            <option value="startDate">Start Date (Earliest)</option>
                            <option value="-startDate">Start Date (Latest)</option>
                        </select>
                    </div>
                    {/* Reset Filters Button */}
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({
                                page: 1,
                                limit: 10,
                                sortBy: "-createdAt",
                                status: "",
                                level: "",
                                mode: "",
                                search: ""
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
                <div className="mb-6">
                    {loading && courses.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : courses.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map((course) => (
                                    <CourseCard
                                        key={course._id}
                                        course={course}
                                        onView={viewCourseDetails}
                                        onEdit={() => { setSelectedCourse(course); setEditModalOpen(true); }}
                                        onDelete={() => { setSelectedCourse(course); setDeleteModalOpen(true); }}
                                    />
                                ))}
                            </div>
                            {/* Pagination */}
                            {total > 0 && (
                                <div className="mt-6 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
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
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            No courses found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
            {/* Course Details Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Course Details
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Detailed information about this course
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            {selectedCourse && (
                                <div className="space-y-8">
                                    {/* Basic Information */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Basic Information
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedCourse.title}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Code</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedCourse.code}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Slug</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedCourse.slug}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedCourse.description}
                                                    </p>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Short Description</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedCourse.shortDescription || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category & Metadata */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Category & Metadata
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.categoryInfo?.name ||
                                                        (typeof selectedCourse.category === 'string' ? selectedCourse.category : 'N/A')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Subcategory</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.subcategoryInfo?.name ||
                                                        (typeof selectedCourse.subcategory === 'string' ? selectedCourse.subcategory : 'N/A')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                                                    {selectedCourse.level}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Language</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.language}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Instructors */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Instructors
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCourse.instructorNames && selectedCourse.instructorNames.length > 0 ? (
                                                selectedCourse.instructorNames.map((instructor, index) => (
                                                    <span
                                                        key={instructor._id || index}
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                    >
                                                        {instructor.name || instructor.email || instructor._id}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No instructors assigned</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Schedule
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule?.startDate
                                                        ? moment(selectedCourse.schedule.startDate).format("MMM D, YYYY h:mm A")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule?.endDate
                                                        ? moment(selectedCourse.schedule.endDate).format("MMM D, YYYY h:mm A")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Enrollment Deadline</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule?.enrollmentDeadline
                                                        ? moment(selectedCourse.schedule.enrollmentDeadline).format("MMM D, YYYY h:mm A")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Timezone</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule?.timezone || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schedule Pattern */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Schedule Pattern
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Frequency</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                                                    {selectedCourse.schedule_pattern?.frequency || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Days</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule_pattern?.days?.length > 0
                                                        ? selectedCourse.schedule_pattern.days.map(d => (
                                                            <span key={d} className="capitalize">{d}</span>
                                                        )).reduce((prev, curr) => [prev, ', ', curr])
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule_pattern?.time?.start && selectedCourse.schedule_pattern?.time?.end
                                                        ? `${selectedCourse.schedule_pattern.time.start} - ${selectedCourse.schedule_pattern.time.end}`
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Duration (mins)</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.schedule_pattern?.duration || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Pricing
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.pricing?.currency} {selectedCourse.pricing?.amount}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Discount</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.pricing?.discount
                                                        ? `${selectedCourse.pricing.discount}%`
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Early Bird</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.pricing?.earlyBird?.discount
                                                        ? `${selectedCourse.pricing.earlyBird.discount}%`
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Early Bird Deadline</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.pricing?.earlyBird?.deadline
                                                        ? moment(selectedCourse.pricing.earlyBird.deadline).format("MMM D, YYYY")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Media
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Thumbnail</p>
                                                {selectedCourse.thumbnail?.url ? (
                                                    <a
                                                        href={selectedCourse.thumbnail.url.trim()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        View Thumbnail
                                                    </a>
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">N/A</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Preview</p>
                                                {selectedCourse.preview?.url ? (
                                                    <a
                                                        href={selectedCourse.preview.url.trim()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        View Preview
                                                    </a>
                                                ) : (
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">N/A</p>
                                                )}
                                            </div>
            
                                        </div>
                                    </div>

                                    {/* Course Settings */}
                                    <div>
                                        <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                            Course Settings
                                        </h5>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Mode</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                                                    {selectedCourse.mode}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                                                    {selectedCourse.status}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedCourse.featured ? "Yes" : "No"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lists (Features, Requirements, etc.) */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Features
                                            </h6>
                                            {selectedCourse.features?.length > 0 && selectedCourse.features.some(f => f) ? (
                                                <ul className="space-y-2">
                                                    {selectedCourse.features
                                                        .filter(feature => feature)
                                                        .map((feature, index) => (
                                                            <li key={index} className="flex items-start">
                                                                <span className="mr-2 text-gray-500 dark:text-gray-400">•</span>
                                                                <span className="text-sm text-gray-800 dark:text-white/90">{feature}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No features listed</p>
                                            )}
                                        </div>

                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Requirements
                                            </h6>
                                            {selectedCourse.requirements?.length > 0 && selectedCourse.requirements.some(r => r) ? (
                                                <ul className="space-y-2">
                                                    {selectedCourse.requirements
                                                        .filter(req => req)
                                                        .map((req, index) => (
                                                            <li key={index} className="flex items-start">
                                                                <span className="mr-2 text-gray-500 dark:text-gray-400">•</span>
                                                                <span className="text-sm text-gray-800 dark:text-white/90">{req}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No requirements listed</p>
                                            )}
                                        </div>

                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Objectives
                                            </h6>
                                            {selectedCourse.objectives?.length > 0 && selectedCourse.objectives.some(o => o) ? (
                                                <ul className="space-y-2">
                                                    {selectedCourse.objectives
                                                        .filter(obj => obj)
                                                        .map((obj, index) => (
                                                            <li key={index} className="flex items-start">
                                                                <span className="mr-2 text-gray-500 dark:text-gray-400">•</span>
                                                                <span className="text-sm text-gray-800 dark:text-white/90">{obj}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No objectives listed</p>
                                            )}
                                        </div>

                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Target Audience
                                            </h6>
                                            {selectedCourse.targetAudience?.length > 0 && selectedCourse.targetAudience.some(a => a) ? (
                                                <ul className="space-y-2">
                                                    {selectedCourse.targetAudience
                                                        .filter(aud => aud)
                                                        .map((aud, index) => (
                                                            <li key={index} className="flex items-start">
                                                                <span className="mr-2 text-gray-500 dark:text-gray-400">•</span>
                                                                <span className="text-sm text-gray-800 dark:text-white/90">{aud}</span>
                                                            </li>
                                                        ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No target audience listed</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Tags
                                        </h6>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCourse.tags?.length > 0 && selectedCourse.tags.some(tag => tag) ? (
                                                selectedCourse.tags
                                                    .filter(tag => tag)
                                                    .map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No tags</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Extra Fields */}
                                    {selectedCourse.extraFields && Object.keys(selectedCourse.extraFields).length > 0 && (
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Extra Fields
                                            </h6>
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {Object.entries(selectedCourse.extraFields).map(([key, value]) => (
                                                    <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{key}</p>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Dates */}
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Dates
                                        </h6>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {moment(selectedCourse.createdAt).format("MMM D, YYYY h:mm A")}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {moment(selectedCourse.updatedAt).format("MMM D, YYYY h:mm A")}
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
            {/* Edit/Create Course Modal with Stepped Form */}
            <Modal
                isFullscreen
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                className=""
            >
                <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl max-h-screen bg-white p-4 dark:bg-gray-900 lg:px-16 lg:py-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                {selectedCourse ? 'Edit Course' : 'Add New Course'}
                            </h4>
                            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                {selectedCourse
                                    ? 'Update course details using the step-by-step form'
                                    : 'Create a new course using the step-by-step form'}
                            </p>
                        </div>
                        <div className="custom-scrollbar max-h-[83vh] overflow-y-auto px-2 pb-3">
                            <CourseSteppedForm
                                course={selectedCourse}
                                onSave={handleSaveSuccess}
                                onCancel={handleCancelForm}
                                categories={categories}
                                users={users}
                            />
                        </div>
                    </div>

                </div>
            </Modal>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedCourse && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Confirm Deletion
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                Are you sure you want to delete this course? This action cannot be undone.
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
                                                Deleting "{selectedCourse.title}" will permanently remove it from the system.
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
                                onClick={deleteCourse}
                            >
                                Delete Course
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}

const CourseCa = ({ course, onView, onEdit, onDelete }) => {
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                        {course.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === "upcoming"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : course.status === "ongoing"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : course.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                        {course.status}
                    </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {course.code}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {course.shortDescription || course.description || "No description provided."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200 capitalize">
                        {course.level}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-200 capitalize">
                        {course.mode}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-200">
                        {course.categoryInfo?.name || "N/A"}
                    </span>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>Start: {course.schedule?.startDate ? moment(course.schedule.startDate).format("MMM D, YYYY") : "N/A"}</span>
                    <span>{course.pricing?.currency} {course.pricing?.amount || "N/A"}</span>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-end space-x-2">
                <button
                    onClick={() => onView(course)}
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

const CourseCard = ({ course, onView, onEdit, onDelete }) => {
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
                <div className="flex flex-col md:flex-col">
                    {/* Course Info Section */}
                    <div className="flex-1 min-w-0">
                        <div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white truncate">
                                {course.title}  ({course.code} )
                            </h3>

                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-start">

                            <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === "upcoming"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : course.status === "ongoing"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : course.status === "completed"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    }`}>
                                    {course.status}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${course.level === "beginner"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : course.level === "intermediate"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    }`}>
                                    {course.level}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${course.mode === "online"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : course.mode === "offline"
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                        : course.mode === "hybrid"
                                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    }`}>
                                    {course.mode}
                                </span>
                            </div>


                        </div>
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">Category : {course.categoryInfo?.name || "N/A"}</p>

                        {/* Description */}
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {course.shortDescription || course.description || "No description provided."}
                        </p>

                        {/* Schedule & Pricing */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    {course.schedule?.startDate
                                        ? moment(course.schedule.startDate).format("MMM D, YYYY")
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Price</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    {course.pricing?.currency} {course.pricing?.amount || "N/A"}
                                    {course.pricing?.discount && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded dark:bg-red-900 dark:text-red-200">
                                            {course.pricing.discount}% off
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Enrollment Deadline</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    {course.schedule?.enrollmentDeadline
                                        ? moment(course.schedule.enrollmentDeadline).format("MMM D, YYYY")
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Language</p>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    {course.language || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Instructors */}
                        <div className="mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Instructors</p>
                            <div className="flex flex-wrap gap-1">
                                {course.instructorNames && course.instructorNames.length > 0 ? (
                                    course.instructorNames.slice(0, 3).map((instructor, index) => (
                                        <span
                                            key={instructor._id || index}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        >
                                            {instructor.name || instructor.email || "Unknown"}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">No instructors assigned</span>
                                )}
                                {course.instructorNames && course.instructorNames.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                        +{course.instructorNames.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        {/* <div className="mt-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tags</p>
                            <div className="flex flex-wrap gap-1">
                                {course.tags && course.tags.length > 0 ? (
                                    course.tags.slice(0, 4).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                        >
                                            {tag}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">No tags</span>
                                )}
                                {course.tags && course.tags.length > 4 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                        +{course.tags.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div> */}
                    </div>

                    {/* Actions Section */}
                    <div className="mt-4">
                        <div className="flex space-x-2 gap-2">
                            <button
                                onClick={() => onView(course)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                aria-label="View"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="hidden md:inline">View</span>
                            </button>
                            <button
                                onClick={onEdit}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                aria-label="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                                onClick={onDelete}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 text-red-700 bg-white hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-gray-700 dark:hover:bg-red-900/20"
                                aria-label="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden md:inline">Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};