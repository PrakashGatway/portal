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
    GripVertical,
} from "lucide-react";
import TextArea from "../../components/form/input/TextArea";

const TestSeriesTypes = ["Full-Length", "Mini-Series", "Sectional"];
const DifficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
const SubTypes = ["reading", "listening", "speaking", "writing"];

export default function TestSeriesManagement() {
    // ====== STATES ======
    const [testSeriesList, setTestSeriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTestSeries, setSelectedTestSeries] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    // Related data
    const [allExams, setAllExams] = useState([]);
    const [allCourses, setAllCourses] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        examId: "",
        type: "",
        isPaid: "",
        search: "",
    });

    // Stepper state → **Only 2 steps now**
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        type: TestSeriesTypes[0],
        subType: "",
        description: "",
        examId: "",
        thumbnailPic: "",
        slug: "",
        difficultyLevel: "Intermediate",
        isPaid: false,
        price: { amount: 0, discount: 0, currency: "INR" },
        negativeMarking: 0,
        duration: 60,
        totalQuestions: 0,
        passingScore: 0,
        isTimed: true,
        allowPause: false,
        courseAccess: [],
        isActive: true,
        sections: [], // [{ sectionId, order, questionIds: [], duration, totalQuestions }]
    });

    const [errors, setErrors] = useState({});
    const [questionSearchTerm, setQuestionSearchTerm] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState(null); // Tracks which section we're managing questions for
    const [questionsForSection, setQuestionsForSection] = useState([]); // Fetched questions for selected section
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // ====== EFFECTS ======
    useEffect(() => {
        fetchTestSeries();
    }, [filters]);

    useEffect(() => {
        fetchRelatedData();
    }, []);

    // ====== FETCH DATA ======
    const fetchTestSeries = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: filters.limit,
                ...(filters.examId && { examId: filters.examId }),
                ...(filters.type && { type: filters.type }),
                ...(filters.isPaid !== "" && { isPaid: filters.isPaid === "true" }),
                ...(filters.search && { search: filters.search }),
            };
            const res = await api.get("/test/series", { params });
            setTestSeriesList(res.data?.data || []);
            setTotal(res.data?.pagination?.total || 0);
        } catch (error) {
            toast.error("Failed to load test series");
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedData = async () => {
        try {
            const [examsRes, coursesRes] = await Promise.all([
                api.get("/test/exams?limit=100"),
                api.get("/courses?limit=100"),
            ]);
            setAllExams(examsRes.data?.data || []);
            setAllCourses(coursesRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch related data", error);
        }
    };

    // ====== UTILS ======
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    // ====== MODAL HANDLERS ======
    const resetForm = () => {
        setFormData({
            title: "",
            type: TestSeriesTypes[0],
            subType: "",
            description: "",
            examId: "",
            thumbnailPic: "",
            slug: "",
            difficultyLevel: "Intermediate",
            isPaid: false,
            price: { amount: 0, discount: 0, currency: "INR" },
            negativeMarking: 0,
            duration: 60,
            totalQuestions: 0,
            passingScore: 0,
            isTimed: true,
            allowPause: false,
            courseAccess: [],
            isActive: true,
            sections: [],
        });
        setSelectedSectionId(null);
        setErrors({});
    };

    const openCreateModal = () => {
        setSelectedTestSeries(null);
        resetForm();
        setCurrentStep(1);
        setEditModalOpen(true);
    };

    const openEditModal = async (ts) => {
        try {
            const res = await api.get(`/test/series/${ts._id}`);
            const data = res.data?.data || ts;
            setSelectedTestSeries(data);
            const mappedSections = (data.sections || []).map((sec) => ({
                ...sec,
                questionIds: Array.isArray(sec.questionIds) ? sec.questionIds.map(String) : [],
            }));
            setFormData({
                title: data.title || "",
                type: data.type || TestSeriesTypes[0],
                subType: data.subType || "",
                description: data.description || "",
                examId: data.examId?._id || "",
                thumbnailPic: data.thumbnailPic || "",
                slug: data.slug || "",
                difficultyLevel: data.difficultyLevel || "Intermediate",
                isPaid: !!data.isPaid,
                price: {
                    amount: data.price?.amount || 0,
                    discount: data.price?.discount || 0,
                    currency: data.price?.currency || "INR",
                },
                negativeMarking: data.negativeMarking || 0,
                duration: data.duration || 60,
                totalQuestions: data.totalQuestions || 0,
                passingScore: data.passingScore || 0,
                isTimed: data.isTimed !== false,
                allowPause: !!data.allowPause,
                courseAccess: (data.courseAccess || []).map((c) => c._id),
                isActive: data.isActive !== false,
                sections: mappedSections,
            });
            setCurrentStep(1);
            setEditModalOpen(true);
        } catch (err) {
            toast.error("Failed to load test series");
        }
    };

    // ====== VALIDATION ======
    const validateStep1 = () => {
        const err = {};
        if (!formData.title?.trim()) err.title = "Title is required";
        if (!formData.examId) err.examId = "Exam is required";
        if (!formData.slug?.trim()) err.slug = "Slug is required";
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    // ====== SECTION HANDLING ======
    const addSectionToTest = (section) => {
        const exists = formData.sections.some((s) => s.sectionId === section._id);
        if (exists) {
            toast.warn("Section already added");
            return;
        }
        const newSection = {
            sectionId: section._id,
            order: formData.sections.length + 1,
            questionIds: [],
            duration: section.duration || 30,
            totalQuestions: 0,
        };
        setFormData((prev) => ({
            ...prev,
            sections: [...prev.sections, newSection],
        }));
    };

    const removeSectionFromTest = (index) => {
        setFormData((prev) => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index),
        }));
    };

    const updateSectionField = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            sections: prev.sections.map((sec, i) =>
                i === index ? { ...sec, [field]: value } : sec
            ),
        }));
    };

    // ====== QUESTION HANDLING ======
    const fetchQuestionsForSection = async (sectionId, search = "") => {
        if (!sectionId) return;
        setLoadingQuestions(true);
        try {
            const res = await api.get(`/test/questions`, {
                params: { sectionId, search, limit: 100 },
            });
            setQuestionsForSection(res.data?.questions || []);
            setSelectedSectionId(sectionId);
        } catch (error) {
            toast.error("Failed to load questions");
            setQuestionsForSection([]);
        } finally {
            setLoadingQuestions(false);
        }
    };

    const toggleQuestionInSection = (sectionIndex, questionId) => {
        setFormData((prev) => {
            const newSections = [...prev.sections];
            const sec = newSections[sectionIndex];
            const qIdStr = String(questionId);
            const idx = sec.questionIds.findIndex((id) => String(id) === qIdStr);
            let newQuestionIds;
            if (idx > -1) {
                newQuestionIds = sec.questionIds.filter((id) => String(id) !== qIdStr);
            } else {
                newQuestionIds = [...sec.questionIds, questionId];
            }
            sec.questionIds = newQuestionIds;
            sec.totalQuestions = newQuestionIds.length;
            return { ...prev, sections: newSections };
        });
    };

    const moveQuestionInSection = (sectionIndex, fromIndex, toIndex) => {
        setFormData((prev) => {
            const newSections = [...prev.sections];
            const sec = newSections[sectionIndex];
            const updated = [...sec.questionIds];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            sec.questionIds = updated;
            return { ...prev, sections: newSections };
        });
    };

    // ====== STEPPER & SUBMIT ======
    const goToNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        }
    };

    const goToPrev = () => setCurrentStep(1);

    const handleCreate = async () => {
        try {
            await api.post("/test/series", formData);
            toast.success("Test series created!");
            fetchTestSeries();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Creation failed");
        }
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/test/series/${selectedTestSeries._id}`, formData);
            toast.success("Test series updated!");
            fetchTestSeries();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentStep === 1) {
            goToNext();
        } else {
            if (selectedTestSeries) handleUpdate();
            else handleCreate();
        }
    };

    // ====== DELETE ======
    const deleteTestSeries = async () => {
        if (!selectedTestSeries) return;
        try {
            await api.delete(`/test/series/${selectedTestSeries._id}`);
            toast.success("Deleted successfully");
            fetchTestSeries();
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error("Deletion failed");
        }
    };

    // ====== DERIVED DATA ======
    const examSections = useMemo(() => {
        const exam = allExams.find((e) => e._id === formData.examId);
        return exam?.sections || [];
    }, [formData.examId, allExams]);

    const filteredSections = useMemo(() => {
        return examSections.filter((s) =>
            s.name.toLowerCase().includes(questionSearchTerm.toLowerCase())
        );
    }, [examSections, questionSearchTerm]);

    // ====== RENDER ======
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
                                Test Series Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage exam test series</p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{testSeriesList.length} series</p>
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
                            Add New Test Series
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Title)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                            }
                            placeholder="Search..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Exam
                        </label>
                        <select
                            name="examId"
                            value={filters.examId}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Exams</option>
                            {allExams.map((exam) => (
                                <option key={exam._id} value={exam._id}>{exam.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                        </label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Types</option>
                            {TestSeriesTypes.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() =>
                                setFilters({
                                    page: 1,
                                    limit: 10,
                                    examId: "",
                                    type: "",
                                    isPaid: "",
                                    search: "",
                                })
                            }
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            Reset Filters
                        </button>
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
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Title</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Exam</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Sub-Type</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Paid</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Duration</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Active</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {testSeriesList.length > 0 ? (
                                    testSeriesList.map((ts) => (
                                        <tr key={ts._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-2">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{ts.title}</div>
                                                {ts.description && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{ts.description}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ts?.populatedExams?.name || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">{ts.type}</td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">{ts.subType || "—"}</td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">{ts.isPaid ? "Yes" : "No"}</td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">{ts.duration} min</td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">{ts.isActive ? "Yes" : "No"}</td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button onClick={() => openEditModal(ts)} className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedTestSeries(ts); setDeleteModalOpen(true); }}
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
                                        <td colSpan="8" className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No test series found
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
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page === 1 ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => i + 1)
                                .slice(Math.max(0, filters.page - 3), Math.min(Math.ceil(total / filters.limit), filters.page + 2))
                                .map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`rounded-md border px-3 py-1 text-sm ${filters.page === pageNum ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page * filters.limit >= total}
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page * filters.limit >= total ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal - 2 STEPS ONLY */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="m-4">
                <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                                {selectedTestSeries ? "Edit Test Series" : "Create Test Series"}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Step {currentStep} of 2
                            </span>
                        </div>
                        <p className="text-lg text-gray-500 mb-6 dark:text-gray-400">
                            {currentStep === 1 ? "Basic information" : "Configure sections & questions"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="custom-scrollbar max-h-[450px] min-h-[450px] overflow-y-auto px-2 pb-3">
                            {/* STEP 1: Basic Info */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Title *</Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g. IELTS Full Mock Test"
                                            />
                                            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
                                        </div>
                                        <div>
                                            <Label>Slug *</Label>
                                            <Input
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                placeholder="e.g. ielts-full-mock-test"
                                            />
                                            {errors.slug && <p className="text-red-600 text-sm mt-1">{errors.slug}</p>}
                                        </div>
                                        <div>
                                            <Label>Exam *</Label>
                                            <Select
                                                options={allExams.map((e) => ({ value: e._id, label: e.name }))}
                                                defaultValue={formData.examId}
                                                onChange={(val) => setFormData({ ...formData, examId: val })}
                                            />
                                            {errors.examId && <p className="text-red-600 text-sm mt-1">{errors.examId}</p>}
                                        </div>
                                        <div>
                                            <Label>Type</Label>
                                            <Select
                                                options={TestSeriesTypes.map((t) => ({ value: t, label: t }))}
                                                defaultValue={formData.type}
                                                onChange={(val) => setFormData({ ...formData, type: val })}
                                            />
                                        </div>
                                        {formData.type === "Sectional" && (
                                            <div>
                                                <Label>Sub-Type</Label>
                                                <Select
                                                    options={SubTypes.map((st) => ({ value: st, label: st }))}
                                                    defaultValue={formData.subType}
                                                    onChange={(val) => setFormData({ ...formData, subType: val })}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <Label>Difficulty</Label>
                                            <Select
                                                options={DifficultyLevels.map((d) => ({ value: d, label: d }))}
                                                defaultValue={formData.difficultyLevel}
                                                onChange={(val) => setFormData({ ...formData, difficultyLevel: val })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Description</Label>
                                            <TextArea
                                                value={formData.description}
                                                onChange={(val) => setFormData({ ...formData, description: val })}
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.isPaid}
                                                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                                                className="h-4 w-4 text-indigo-600 rounded"
                                            />
                                            Paid Test Series
                                        </Label>
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="h-4 w-4 text-indigo-600 rounded"
                                            />
                                            Is Active
                                        </Label>
                                    </div>

                                    {formData.isPaid && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                                            <div>
                                                <Label>Price (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.price.amount}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            price: { ...formData.price, amount: Number(e.target.value) },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Discount (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.price.discount}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            price: { ...formData.price, discount: Number(e.target.value) },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label>Currency</Label>
                                                <Input value="INR" disabled />
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Total Duration (minutes)</Label>
                                            <Input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Total Questions</Label>
                                            <Input
                                                type="number"
                                                value={formData.totalQuestions}
                                                onChange={(e) => setFormData({ ...formData, totalQuestions: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Negative Marking</Label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={formData.negativeMarking}
                                                onChange={(e) => setFormData({ ...formData, negativeMarking: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Passing Score (%)</Label>
                                            <Input
                                                type="number"
                                                value={formData.passingScore}
                                                onChange={(e) => setFormData({ ...formData, passingScore: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.isTimed}
                                                onChange={(e) => setFormData({ ...formData, isTimed: e.target.checked })}
                                                className="h-4 w-4 text-indigo-600 rounded"
                                            />
                                            Timed Test
                                        </Label>
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowPause}
                                                onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                                                className="h-4 w-4 text-indigo-600 rounded"
                                            />
                                            Allow Pause
                                        </Label>
                                    </div>

                                    <div>
                                        <Label>Course Access (Optional)</Label>
                                        <Select
                                            isMulti
                                            options={allCourses.map((c) => ({ value: c._id, label: c.title }))}
                                            defaultValue={formData.courseAccess}
                                            onChange={(vals) => setFormData({ ...formData, courseAccess: vals })}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Sections & Questions */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    {/* Section Picker */}
                                    <div>
                                        <Label>Add Sections (from selected exam)</Label>
                                        <div className="flex gap-2 mt-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search sections..."
                                                    value={questionSearchTerm}
                                                    onChange={(e) => setQuestionSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                        {filteredSections.length > 0 && (
                                            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded dark:border-gray-700">
                                                {filteredSections.map((sec) => (
                                                    <div
                                                        key={sec._id}
                                                        onClick={() => addSectionToTest(sec)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                                                    >
                                                        {sec.name} ({sec.questionCount || 0} Qs)
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {filteredSections.length === 0 && questionSearchTerm && (
                                            <p className="text-sm text-gray-500 mt-2 italic">No sections match your search.</p>
                                        )}
                                    </div>

                                    {/* Added Sections */}
                                    <div>
                                        <Label>Selected Sections ({formData.sections.length})</Label>
                                        {formData.sections.length === 0 ? (
                                            <p className="text-sm text-gray-500 mt-2 italic">No sections added yet.</p>
                                        ) : (
                                            <div className="mt-2 space-y-3">
                                                {formData.sections.map((sec, idx) => {
                                                    const sectionDetails = examSections.find((s) => s._id === sec.sectionId);
                                                    const isSelectedSection = selectedSectionId === sec.sectionId;
                                                    const selectedQuestions = sec.questionIds.map(String);
                                                    return (
                                                        <div key={idx} className="border border-gray-200 rounded-lg p-3 dark:border-gray-700">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h6 className="font-medium">{sectionDetails?.name || "Unknown Section"}</h6>
                                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                                        <Input
                                                                            type="number"
                                                                            label="Duration (min)"
                                                                            value={sec.duration}
                                                                            onChange={(e) => updateSectionField(idx, "duration", Number(e.target.value))}
                                                                            className="text-xs"
                                                                        />
                                                                        <Input
                                                                            type="number"
                                                                            label="Total Questions"
                                                                            value={sec.totalQuestions}
                                                                            disabled
                                                                            className="text-xs"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSectionFromTest(idx)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>

                                                            {/* Manage Questions */}
                                                            <div className="mt-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelectedSection) {
                                                                            setSelectedSectionId(null);
                                                                        } else {
                                                                            fetchQuestionsForSection(sec.sectionId, "");
                                                                            setQuestionSearchTerm("");
                                                                        }
                                                                    }}
                                                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                                                >
                                                                    {isSelectedSection ? "Hide Questions" : "Manage Questions"}
                                                                </button>

                                                                {isSelectedSection && (
                                                                    <div className="mt-2 border border-gray-200 rounded-lg p-2 dark:border-gray-700">
                                                                        {/* Question Search within section */}
                                                                        {/* Question Search within section */}
                                                                        <div className="relative mb-2">
                                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Search questions..."
                                                                                value={questionSearchTerm}
                                                                                onChange={(e) => {
                                                                                    setQuestionSearchTerm(e.target.value);
                                                                                    fetchQuestionsForSection(sec.sectionId, e.target.value);
                                                                                }}
                                                                                className="w-full pl-8 pr-4 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                                            />
                                                                        </div>

                                                                        {loadingQuestions ? (
                                                                            <p className="text-sm text-gray-500 py-2 text-center">Loading...</p>
                                                                        ) : questionsForSection.length === 0 ? (
                                                                            <p className="text-sm text-gray-500 py-2 text-center">No questions found.</p>
                                                                        ) : (
                                                                            <div className="max-h-64 overflow-y-auto border rounded p-1 mb-3 bg-gray-50 dark:bg-gray-800/50">
                                                                                {questionsForSection.map((q) => {
                                                                                    const isChecked = sec.questionIds.some(id => String(id) === String(q._id));
                                                                                    return (
                                                                                        <div
                                                                                            key={q._id}
                                                                                            className={`flex items-center gap-2 p-2 text-sm cursor-pointer ${isChecked
                                                                                                    ? "bg-indigo-100 dark:bg-indigo-900/40"
                                                                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                                                }`}
                                                                                            onClick={() => toggleQuestionInSection(idx, q._id)}
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isChecked}
                                                                                                onChange={(e) => e.stopPropagation()} // prevent double toggle
                                                                                                className="rounded"
                                                                                            />
                                                                                            <span className="truncate flex-1">{q.title || "Untitled Question"}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}

                                                                        {/* ✅ NEW: Dedicated reorder zone for selected questions */}
                                                                        {sec.questionIds.length > 0 && (
                                                                            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                                <p className="text-xs text-gray-500 mb-2">Selected Questions (drag to reorder):</p>
                                                                                <div
                                                                                    className="space-y-1 min-h-[40px]"
                                                                                    onDragOver={(e) => e.preventDefault()}
                                                                                    onDrop={(e) => {
                                                                                        e.preventDefault();
                                                                                        const draggedId = e.dataTransfer.getData("draggedQuestionId");
                                                                                        if (!draggedId) return;

                                                                                        // Find drop position based on mouse Y
                                                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                                                        const y = e.clientY - rect.top;
                                                                                        const itemHeight = 40; // approx height of each item
                                                                                        let newIndex = Math.floor(y / itemHeight);
                                                                                        newIndex = Math.max(0, Math.min(newIndex, sec.questionIds.length - 1));

                                                                                        const currentIndex = sec.questionIds.findIndex(id => String(id) === draggedId);
                                                                                        if (currentIndex !== -1 && currentIndex !== newIndex) {
                                                                                            moveQuestionInSection(idx, currentIndex, newIndex);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    {sec.questionIds.map((qId, orderIdx) => {
                                                                                        const q = questionsForSection.find(q => String(q._id) === String(qId));
                                                                                        if (!q) return null;
                                                                                        return (
                                                                                            <div
                                                                                                key={qId}
                                                                                                draggable
                                                                                                className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border text-sm cursor-grab"
                                                                                                onDragStart={(e) => {
                                                                                                    e.dataTransfer.setData("draggedQuestionId", String(qId));
                                                                                                    e.dataTransfer.effectAllowed = "move";
                                                                                                }}
                                                                                            >
                                                                                                <GripVertical className="h-4 w-4 text-gray-400" />
                                                                                                <span>#{orderIdx + 1}</span>
                                                                                                <span className="truncate">{q.title || "Untitled"}</span>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                                                            Selected: {sec.questionIds.length} / {questionsForSection.length}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between px-2 mt-6">
                            <div>
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={goToPrev}
                                        className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        ← Back
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        setCurrentStep(1);
                                    }}
                                    className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    {currentStep === 1
                                        ? "Continue →"
                                        : selectedTestSeries
                                            ? "Save Changes"
                                            : "Create Test Series"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedTestSeries && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Deletion</h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete <strong>"{selectedTestSeries.title}"</strong>?
                            </p>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={deleteTestSeries}>
                                Delete
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}