// ExamManagement.jsx
import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2, BookOpen } from "lucide-react";
import TextArea from "../../components/form/input/TextArea";
import { useAuth } from "../../context/UserContext";
import moment from "moment";

const ExamTypes = [
    "Language Proficiency",
    "Undergraduate Admission",
    "Graduate Admission"
];

export default function ExamManagement() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allCategories, setAllCategories] = useState([]);
    const [allSections, setAllSections] = useState([]);
    const { user } = useAuth();

    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        examType: "",
        search: ""
    });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        examType: ExamTypes[0],
        category: "",
        sections: []
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchExams();
        fetchCategories();
        fetchSections();
    }, [filters]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: filters.limit,
                ...(filters.examType && { examType: filters.examType }),
                ...(filters.search && { search: filters.search })
            };
            const response = await api.get("/test/exams", { params });
            setExams(response.data?.data || []);
            setTotal(response.data?.total || 0);
        } catch (error) {
            toast.error("Failed to load exams");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setAllCategories(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await api.get("/test/sections");
            setAllSections(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch sections:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const viewExamDetails = async (exam) => {
        try {
            const res = await api.get(`/test/exams/${exam._id}`);
            setSelectedExam(res.data);
            openModal();
        } catch (error) {
            toast.error("Failed to load exam details");
        }
    };

    const openEditModal = (exam) => {
        setSelectedExam(exam);
        setFormData({
            name: exam.name || "",
            description: exam.description || "",
            examType: exam.examType || ExamTypes[0],
            category: exam.category?._id || "",
            sections: exam.sections?.map(s => s._id) || []
        });
        setEditModalOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name?.trim()) newErrors.name = "Exam name is required";
        if (!formData.examType) newErrors.examType = "Exam type is required";
        if (!formData.category) newErrors.category = "Category is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveExam = async () => {
        if (!validateForm()) return;
        try {
            await api.put(`/test/exams/${selectedExam._id}`, formData);
            toast.success("Exam updated successfully");
            fetchExams();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update exam");
        }
    };

    const handleCreateExam = async () => {
        if (!validateForm()) return;
        try {
            await api.post("/test/exams", formData);
            toast.success("Exam created successfully");
            fetchExams();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create exam");
        }
    };

    const deleteExam = async () => {
        if (!selectedExam) return;
        try {
            await api.delete(`/test/exams/${selectedExam._id}`);
            toast.success("Exam deleted successfully");
            fetchExams();
            setDeleteModalOpen(false);
            setSelectedExam(null);
        } catch (error) {
            toast.error("Failed to delete exam");
        }
    };

    const openCreateModal = () => {
        setSelectedExam(null);
        setFormData({
            name: "",
            description: "",
            examType: ExamTypes[0],
            category: "",
            sections: []
        });
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Header */}
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-indigo-50">
                            <BookOpen className="text-indigo-600 h-8 w-8" />
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Exam Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage test series exams</p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{exams.length} exams</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="currentColor" />
                            </svg>
                            Add New Exam
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Name)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                            placeholder="Search exams..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Exam Type
                        </label>
                        <select
                            name="examType"
                            value={filters.examType}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Types</option>
                            {ExamTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() =>
                                setFilters({
                                    page: 1,
                                    limit: 10,
                                    examType: "",
                                    search: ""
                                })
                            }
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Table Actions */}
                <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rows per page:</label>
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

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Name</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Category</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Sections</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Created</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {exams.length > 0 ? (
                                    exams.map((exam) => (
                                        <tr key={exam._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{exam.name}</div>
                                                {exam.description && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                                        {exam.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {exam.examType}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {exam.category?.name || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {exam.sections?.length || 0}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {moment(exam.createdAt).format("MMM D, YYYY")}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => viewExamDetails(exam)}
                                                        className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(exam)}
                                                        className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedExam(exam);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No exams found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                            Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(filters.page * filters.limit, total)}</span> of{" "}
                            <span className="font-medium">{total}</span> results
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page === 1
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    }`}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => i + 1)
                                .slice(Math.max(0, filters.page - 3), Math.min(Math.ceil(total / filters.limit), filters.page + 2))
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
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page * filters.limit >= total
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Exam Details</h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Detailed information</p>
                    </div>
                    {selectedExam && (
                        <div className="space-y-4 px-2">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedExam.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Exam Type</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedExam.examType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {selectedExam.category?.name || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {selectedExam.description || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sections</p>
                                {selectedExam.sections && selectedExam.sections.length > 0 ? (
                                    <ul className="mt-1 space-y-1">
                                        {selectedExam.sections.map((sec) => (
                                            <li key={sec._id} className="text-sm font-medium text-gray-800 dark:text-white">
                                                • {sec.name || `Section ${sec._id}`}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No sections assigned</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created At</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white">
                                    {moment(selectedExam.createdAt).format("MMM D, YYYY h:mm A")}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Create/Edit Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {selectedExam ? "Edit Exam" : "Add New Exam"}
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {selectedExam ? "Update exam details" : "Create a new exam for your test series"}
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            selectedExam ? handleSaveExam() : handleCreateExam();
                        }}
                        className="flex flex-col"
                    >
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label>Name *</Label>
                                        <Input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. IELTS Academic"
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label>Exam Type *</Label>
                                        <Select
                                            options={ExamTypes.map(t => ({ value: t, label: t }))}
                                            defaultValue={formData.examType}
                                            onChange={(val) => handleSelectChange("examType", val)}
                                        />
                                        {errors.examType && <p className="mt-1 text-sm text-red-600">{errors.examType}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Category *</Label>
                                        <Select
                                            options={allCategories.map(c => ({ value: c._id, label: c.name }))}
                                            defaultValue={formData.category}
                                            onChange={(val) => handleSelectChange("category", val)}
                                        />
                                        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Description</Label>
                                        <TextArea
                                            value={formData.description}
                                            onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                                            placeholder="Brief description of the exam..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Sections</Label>
                                        <div className="mt-1 space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded p-2 dark:border-gray-600">
                                            {allSections.length > 0 ? (
                                                allSections.map((section) => (
                                                    <label key={section._id} className="flex items-start space-x-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.sections.includes(section._id)}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    sections: isChecked
                                                                        ? [...prev.sections, section._id]
                                                                        : prev.sections.filter(id => id !== section._id)
                                                                }));
                                                            }}
                                                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-gray-700 dark:text-gray-300">
                                                            <strong>{section.name}</strong> — {section.description || "No description"}
                                                        </span>
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">No sections available</p>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">Select sections to include in this exam.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                {selectedExam ? "Save Changes" : "Create Exam"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedExam && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Deletion</h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete this exam? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-2">
                            <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                                    Deleting <strong>"{selectedExam.name}"</strong> will permanently remove it and its association with sections.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={deleteExam}>
                                Delete Exam
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}