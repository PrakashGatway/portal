// ExamManagement.jsx
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
    BookOpen,
    Search,
    CheckCircle,
    FolderOpen,
    Info,
    Plus,
    X,
    ChevronRight,
    ChevronLeft,
    Clock,
    Layers,
    Filter,
    SlidersHorizontal,
    ArrowUpDown,
    Grid3X3,
    List,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    XCircle,
    BarChart3,
    Calendar,
    Hash,
    Tag,
    Loader2,
    RefreshCcw,
} from "lucide-react";
import TextArea from "../../components/form/input/TextArea";
import { useAuth } from "../../context/UserContext";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown/Dropdown";

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
    const [viewMode, setViewMode] = useState("grid"); // table or grid
    const [showFilters, setShowFilters] = useState(true);
    const [selectedExams, setSelectedExams] = useState([]);

    // Filters for listing
    const [filters, setFilters] = useState({
        page: 1,
        limit: 12,
        examType: "",
        search: ""
    });

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        examType: ExamTypes[0],
        category: "",
        sections: []
    });
    const [errors, setErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [saving, setSaving] = useState(false);

    // Fetch data on filter change
    useEffect(() => {
        fetchExams();
        fetchCategories();
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
            setTotal(response.data?.total || response.data?.pagination?.total || 0);
        } catch (error) {
            toast.error("Failed to load exams");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories?limit=50");
            setAllCategories(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await api.get("/test/sections?limit=50");
            setAllSections(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch sections:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 12,
            examType: "",
            search: ""
        });
        setSearchInput("");
    };

    const activeFilterCount = filters.examType ? 1 : 0;

    const viewExamDetails = async (exam) => {
        try {
            const res = await api.get(`/test/exams/${exam._id}`);
            setSelectedExam(res.data?.data || exam);
            openModal();
        } catch (error) {
            toast.error("Failed to load exam details");
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
        setCurrentStep(1);
        setSearchTerm("");
        setEditModalOpen(true);
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
        setErrors({});
        setCurrentStep(1);
        setSearchTerm("");
        setEditModalOpen(true);
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.name?.trim()) newErrors.name = "Exam name is required";
        if (!formData.examType) newErrors.examType = "Exam type is required";
        if (!formData.category) newErrors.category = "Category is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const goToNextStep = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        }
    };

    const goToPrevStep = () => {
        setCurrentStep(1);
    };

    const filteredSections = useMemo(() => {
        if (!searchTerm) return allSections;
        return allSections.filter(section =>
            section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (section.description && section.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allSections, searchTerm]);

    const handleSelectAll = () => {
        setFormData(prev => ({
            ...prev,
            sections: filteredSections.map(section => section._id)
        }));
    };

    const handleClearAll = () => {
        setFormData(prev => ({ ...prev, sections: [] }));
    };

    const toggleSection = (sectionId) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.includes(sectionId)
                ? prev.sections.filter(id => id !== sectionId)
                : [...prev.sections, sectionId]
        }));
    };

    const handleCreateExam = async () => {
        try {
            setSaving(true);
            await api.post("/test/exams", formData);
            toast.success("Exam created successfully");
            fetchExams();
            setEditModalOpen(false);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to create exam";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateExam = async () => {
        try {
            setSaving(true);
            await api.put(`/test/exams/${selectedExam._id}`, formData);
            toast.success("Exam updated successfully");
            fetchExams();
            setEditModalOpen(false);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to update exam";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentStep === 1) {
            goToNextStep();
        } else {
            if (selectedExam) {
                handleUpdateExam();
            } else {
                handleCreateExam();
            }
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

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedExams.length} selected exams?`)) return;
        try {
            await Promise.all(selectedExams.map(id => api.delete(`/test/exams/${id}`)));
            toast.success(`${selectedExams.length} exams deleted`);
            setSelectedExams([]);
            fetchExams();
        } catch (error) {
            toast.error("Failed to delete some exams");
        }
    };

    const totalPages = Math.ceil(total / filters.limit);

    return (
        <div className="min-h-screen max-w-7xl mx-auto p-3">
            {/* Header */}
            <div className="mb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            Exam Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage your exam configurations and sections
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* {selectedExams.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedExams.length})
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
                            Add New Exam
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
                            {activeFilterCount > 0 && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    {activeFilterCount}
                                </span>
                            )}
                            <ChevronRight className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search exams..."
                                    className="w-64 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                                />
                            </div>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="grid gap-4 p-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Exam Type
                                    </label>
                                    <select
                                        name="examType"
                                        value={filters.examType}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">All Types</option>
                                        {ExamTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Per Page
                                    </label>
                                    <select
                                        name="limit"
                                        value={filters.limit}
                                        onChange={handleFilterChange}
                                        className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="12">12 per page</option>
                                        <option value="24">24 per page</option>
                                        <option value="48">48 per page</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={resetFilters}
                                        className="w-full rounded-xl border border-gray-200 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    >
                                        <RefreshCcw className="mr-2 inline-block h-4 w-4" />
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats Bar */}
            {!loading && (
                <div className="mb-4 flex items-center justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{exams.length}</span> of{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{total}</span> exams
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading exams...</p>
                    </div>
                </div>
            ) : exams.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No exams found</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {filters.search || filters.examType
                            ? "Try adjusting your filters or search terms"
                            : "Get started by creating your first exam"}
                    </p>
                    {!filters.search && !filters.examType && (
                        <Button className="mt-6" onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Exam
                        </Button>
                    )}
                </div>
            ) : viewMode === "table" ? (
                <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 text-left dark:border-gray-800">
                                    <th className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedExams.length === exams.length && exams.length > 0}
                                            onChange={() => {
                                                if (selectedExams.length === exams.length) {
                                                    setSelectedExams([]);
                                                } else {
                                                    setSelectedExams(exams.map(e => e._id));
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Exam Name</th>
                                    <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                                    <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Category</th>
                                    <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Sections</th>
                                    <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                                    <th className="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                <AnimatePresence>
                                    {exams.map((exam) => (
                                        <motion.tr
                                            key={exam._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedExams.includes(exam._id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                                }`}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedExams.includes(exam._id)}
                                                    onChange={() => {
                                                        setSelectedExams(prev =>
                                                            prev.includes(exam._id)
                                                                ? prev.filter(id => id !== exam._id)
                                                                : [...prev, exam._id]
                                                        );
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                            {exam.name}
                                                        </p>
                                                        {exam.description && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                                {exam.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                    {exam.examType}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-700 dark:text-gray-300">
                                                {exam.category?.name || "—"}
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                    <Layers className="h-3 w-3" />
                                                    {exam.sections?.length || 0}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {moment(exam.createdAt).format("MMM D, YYYY")}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => viewExamDetails(exam)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(exam)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedExam(exam);
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
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <AnimatePresence>
                        {exams.map((exam) => (
                            <motion.div
                                key={exam._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`group relative rounded-2xl border bg-white p-5 transition-all hover:shadow-lg dark:bg-gray-900 cursor-pointer ${selectedExams.includes(exam._id)
                                    ? "border-blue-500 ring-2 ring-blue-500/20"
                                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                                    }`}
                                onClick={() => {
                                    setSelectedExams(prev =>
                                        prev.includes(exam._id)
                                            ? prev.filter(id => id !== exam._id)
                                            : [...prev, exam._id]
                                    );
                                }}
                            >
                                {/* Selection indicator */}
                                <div className="absolute right-2 top-2">
                                    <div className={`h-5 w-5 rounded-full border-2 transition-colors ${selectedExams.includes(exam._id)
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-gray-300 dark:border-gray-600"
                                        }`}>
                                        {selectedExams.includes(exam._id) && (
                                            <CheckCircle2 className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                </div>

                                {/* Header */}
                                <div className="mb-4 flex items-start gap-3">

                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize line-clamp-2">
                                            {exam.name}
                                        </h3>
                                        <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                            {exam.examType}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Layers className="h-3 w-3" />
                                            Sections
                                        </div>
                                        <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                                            {exam.sections?.length || 0}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Tag className="h-3 w-3" />
                                            Category
                                        </div>
                                        <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {exam.category?.name || "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3 w-3" />
                                        {moment(exam.createdAt).format("MMM D, YYYY")}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                viewExamDetails(exam);
                                            }}
                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(exam);
                                            }}
                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedExam(exam);
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
                            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Exam Details</h4>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detailed information about this exam</p>
                        </div>
                        <button
                            onClick={closeModal}
                            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {selectedExam && (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                        {selectedExam.name}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Exam Type</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                        {selectedExam.examType}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                        {selectedExam.category?.name || "—"}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                        {moment(selectedExam.createdAt).format("MMM D, YYYY h:mm A")}
                                    </p>
                                </div>
                            </div>

                            {selectedExam.description && (
                                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {selectedExam.description}
                                    </p>
                                </div>
                            )}

                            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Sections ({selectedExam.sections?.length || 0})
                                </p>
                                {selectedExam.sections && selectedExam.sections.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedExam.sections.map((sec) => (
                                            <span
                                                key={sec._id}
                                                className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-200"
                                            >
                                                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                                {sec.name || `Section ${sec._id}`}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No sections assigned</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Create/Edit Stepper Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                                {selectedExam ? "Edit Exam" : "Create New Exam"}
                            </h4>
                            <p className=" text-sm text-gray-500 dark:text-gray-400">
                                {currentStep === 1 ? "Basic information" : "Select sections"}
                            </p>
                        </div>
                       
                        <div></div>
                    </div>
                     <div className="mb-6">
                            <div className="flex items-center justify-center">
                                <div className="flex items-center">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${currentStep === 1
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                            : currentStep > 1
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                            }`}
                                    >
                                        {currentStep > 1 ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <span className="text-sm font-semibold">1</span>
                                        )}
                                    </div>
                                    <div
                                        className={`mx-4 h-1 w-24 rounded-full transition-all ${currentStep > 1 ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                                            }`}
                                    />
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${currentStep === 2
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                            : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                            }`}
                                    >
                                        <span className="text-sm font-semibold">2</span>
                                    </div>
                                </div>
                            </div>
                            
                        </div>

                    {/* Enhanced Stepper */}


                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="custom-scrollbar max-h-[400px] min-h-[350px] overflow-y-auto pb-3">
                            {/* Step 1: Basic Info */}
                            <AnimatePresence mode="wait">
                                {currentStep === 1 ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <Label>Exam Name *</Label>
                                                <Input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, name: e.target.value });
                                                        if (errors.name) setErrors({ ...errors, name: "" });
                                                    }}
                                                    placeholder="e.g., IELTS Academic"
                                                    error={!!errors.name}
                                                    hint={errors.name}
                                                />
                                            </div>
                                            <div>
                                                <Label>Exam Type *</Label>
                                                <Select
                                                    options={ExamTypes.map(t => ({ value: t, label: t }))}
                                                    defaultValue={formData.examType}
                                                    onChange={(val) => {
                                                        setFormData({ ...formData, examType: val });
                                                        if (errors.examType) setErrors({ ...errors, examType: "" });
                                                    }}
                                                />
                                                {errors.examType && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.examType}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Category *</Label>
                                                <Select
                                                    options={allCategories.map(c => ({ value: c._id, label: c.name }))}
                                                    defaultValue={formData.category}
                                                    onChange={(val) => {
                                                        setFormData({ ...formData, category: val });
                                                        if (errors.category) setErrors({ ...errors, category: "" });
                                                    }}
                                                />
                                                {errors.category && (
                                                    <p className="mt-1 text-xs text-red-500">{errors.category}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label>Description</Label>
                                                <TextArea
                                                    value={formData.description}
                                                    onChange={(val) => setFormData({ ...formData, description: val })}
                                                    placeholder="Brief description of the exam..."
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        {formData.sections.length > 0 && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                                        Sections Preview
                                                    </span>
                                                </div>
                                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                                    You have <strong>{formData.sections.length}</strong> section{formData.sections.length !== 1 ? 's' : ''} selected.
                                                    You can review and modify them in the next step.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                                                <div className="relative flex-1">
                                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search sections..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleSelectAll}
                                                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleClearAll}
                                                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                                                <div className="max-h-64 overflow-y-auto">
                                                    {filteredSections.length > 0 ? (
                                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                            {filteredSections.map((section) => (
                                                                <label
                                                                    key={section._id}
                                                                    className={`flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${formData.sections.includes(section._id)
                                                                        ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                                                                        : ""
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center h-5 mt-0.5">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={formData.sections.includes(section._id)}
                                                                            onChange={() => toggleSection(section._id)}
                                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-start justify-between">
                                                                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                                                {section.name}
                                                                            </span>
                                                                            {formData.sections.includes(section._id) && (
                                                                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-2" />
                                                                            )}
                                                                        </div>
                                                                        {section.description && (
                                                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                                {section.description}
                                                                            </p>
                                                                        )}
                                                                        {section.questionCount !== undefined && (
                                                                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                                                {section.questionCount} questions available
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-12 text-center">
                                                            <FolderOpen className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                                                            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                {allSections.length === 0 ? 'No sections available' : 'No sections match your search'}
                                                            </p>
                                                            {allSections.length === 0 && (
                                                                <p className="mt-1 text-xs text-gray-400">
                                                                    Create sections first to add them to exams
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                <Info className="h-4 w-4 flex-shrink-0" />
                                                <span>
                                                    Select sections to include in this exam. Each section will contribute questions to the exam.
                                                    <strong className="ml-1 text-gray-700 dark:text-gray-200">
                                                        {formData.sections.length} section{formData.sections.length !== 1 ? 's' : ''} selected
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Modal Footer */}
                        <div className=" flex items-center justify-between dark:border-gray-800">
                            <div>
                                {currentStep === 2 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={goToPrevStep}
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        setCurrentStep(1);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={saving}
                                    disabled={saving}
                                >
                                    {currentStep === 1 ? (
                                        <>
                                            Continue
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    ) : (
                                        selectedExam ? "Save Changes" : "Create Exam"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedExam && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">Delete Exam</h4>
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
                                        <strong className="capitalize">"{selectedExam.name}"</strong>.
                                        This will remove all associations with sections and cannot be recovered.
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
                                onClick={deleteExam}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Exam
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}