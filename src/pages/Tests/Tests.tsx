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
    GripVertical // Icon for drag handle
} from "lucide-react";
import TextArea from "../../components/form/input/TextArea";

const TestSeriesTypes = ["Full-Length", "Mini-Series", "Sectional"];
const DifficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
const SubTypes = ["reading", "listening", "speaking", "writing"]; // Added SubTypes

export default function TestSeriesManagement() {
    const [testSeriesList, setTestSeriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedTestSeries, setSelectedTestSeries] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    // Related data
    const [allExams, setAllExams] = useState([]);
    const [allSections, setAllSections] = useState([]);
    const [allQuestions, setAllQuestions] = useState({}); // Changed to store questions per sectionId { sectionId: [questions] }
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

    // Stepper state
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        type: TestSeriesTypes[0],
        subType: "", // Added subType
        description: "",
        examId: "",
        thumbnailPic: "",
        slug: "", // Added slug
        difficultyLevel: "Intermediate",
        isPaid: false,
        price: { amount: 0, discount: 0, currency: "INR" },
        negativeMarking: 0,
        duration: 60, // minutes
        totalQuestions: 0,
        passingScore: 0,
        isTimed: true,
        allowPause: false,
        courseAccess: [],
        isActive: true, // Added isActive
        sections: [], // will be built step-by-step [{ sectionId, order, questionIds: [ObjectId], duration, totalQuestions }]
    });

    const [errors, setErrors] = useState({});
    const [sectionSearch, setSectionSearch] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState(null); // Now tracks the sectionId for which questions are being managed

    // Fetch data
    useEffect(() => {
        fetchTestSeries();
        fetchRelatedData();
    }, [filters]);

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
            const [examsRes, sectionsRes, coursesRes] = await Promise.all([
                api.get("/test/exams?limit=100"),
                api.get("/test/sections?limit=100"),
                api.get("/courses?limit=100"),
            ]);
            setAllExams(examsRes.data?.data || []);
            setAllSections(sectionsRes.data?.data || []);
            setAllCourses(coursesRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch related data", error);
        }
    };

    // --- FILTERS ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    // --- VIEW ---
    const viewTestSeries = async (ts) => {
        try {
            const res = await api.get(`/test/series/${ts._id}`);
            setSelectedTestSeries(res.data?.data || ts);
            openModal();
        } catch (error) {
            toast.error("Failed to load details");
        }
    };

    // --- MODAL HANDLERS ---
    const openCreateModal = () => {
        setSelectedTestSeries(null);
        resetForm();
        setCurrentStep(1);
        setEditModalOpen(true);
    };

    const openEditModal = (ts) => {
        setSelectedTestSeries(ts);
        // Ensure questionIds are mapped correctly from the backend response
        const mappedSections = ts.sections?.map(section => ({
            ...section,
            // Ensure questionIds is always an array, even if backend sends null/undefined
            questionIds: Array.isArray(section.questionIds) ? section.questionIds : [],
        })) || [];
        setFormData({
            title: ts.title || "",
            type: ts.type || TestSeriesTypes[0],
            subType: ts.subType || "", // Added subType
            description: ts.description || "",
            examId: ts.examId?._id || "",
            thumbnailPic: ts.thumbnailPic || "",
            slug: ts.slug || "", // Added slug
            difficultyLevel: ts.difficultyLevel || "Intermediate",
            isPaid: !!ts.isPaid,
            price: {
                amount: ts.price?.amount || 0,
                discount: ts.price?.discount || 0,
                currency: ts.price?.currency || "INR",
            },
            negativeMarking: ts.negativeMarking || 0,
            duration: ts.duration || 60,
            totalQuestions: ts.totalQuestions || 0,
            passingScore: ts.passingScore || 0,
            isTimed: ts.isTimed !== false,
            allowPause: !!ts.allowPause,
            courseAccess: ts.courseAccess?.map(c => c._id) || [],
            isActive: ts.isActive !== false, // Added isActive
            sections: mappedSections, // Use mapped sections
        });
        setCurrentStep(1);
        setEditModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: "",
            type: TestSeriesTypes[0],
            subType: "", // Added subType
            description: "",
            examId: "",
            thumbnailPic: "",
            slug: "", // Added slug
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
            isActive: true, // Added isActive
            sections: [],
        });
        setAllQuestions({}); // Reset questions state
        setSelectedSectionId(null); // Reset selected section ID
        setErrors({});
    };

    // --- VALIDATION ---
    const validateStep1 = () => {
        const err = {};
        if (!formData.title?.trim()) err.title = "Title is required";
        if (!formData.examId) err.examId = "Exam is required";
        if (!formData.slug?.trim()) err.slug = "Slug is required"; // Added slug validation
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    // Removed validateStep2 as sections are not strictly required by the schema itself,
    // only its internal fields if a section exists. The UI logic for adding sections remains.
    // If you want to enforce at least one section via UI, you can uncomment this:
    // const validateStep2 = () => {
    //     const err = {};
    //     if (formData.sections.length === 0) err.sections = "At least one section is required";
    //     setErrors(err);
    //     return Object.keys(err).length === 0;
    // };

    // --- SECTION MANAGEMENT ---
    const addSectionToTest = (sectionId) => {
        const section = allSections.find(s => s._id === sectionId);
        if (!section) return;
        const newSection = {
            sectionId: section._id,
            order: formData.sections.length + 1,
            questionIds: [],
            duration: section.duration || 30,
            totalQuestions: section.questionCount || 0,
        };
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, newSection],
        }));
    };

    const removeSectionFromTest = (index) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index),
        }));
    };

    const updateSectionField = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map((sec, i) =>
                i === index ? { ...sec, [field]: value } : sec
            ),
        }));
    };

    // --- QUESTION MANAGEMENT WITHIN SECTION ---
const toggleQuestionInSection = (sectionIndex, questionId) => {
    console.log("Toggle question:", sectionIndex, questionId);
    console.log("Current section questions:", formData.sections[sectionIndex]?.questionIds);
    
    setFormData(prev => {
        const newSections = prev.sections.map((section, idx) => {
            if (idx !== sectionIndex) return section;
            
            // Create a new array for questionIds to maintain immutability
            const currentQuestionIds = [...section.questionIds];
            const questionIdStr = String(questionId);
            
            // Find index using strict comparison with string conversion
            const existingIndex = currentQuestionIds.findIndex(
                qId => String(qId) === questionIdStr
            );
            
            let newQuestionIds;
            if (existingIndex > -1) {
                // Remove question
                newQuestionIds = [
                    ...currentQuestionIds.slice(0, existingIndex),
                    ...currentQuestionIds.slice(existingIndex + 1)
                ];
            } else {
                // Add question
                newQuestionIds = [...currentQuestionIds, questionId];
            }
            
            // Return updated section
            return {
                ...section,
                questionIds: newQuestionIds,
                totalQuestions: newQuestionIds.length
            };
        });
        
        console.log("Updated sections:", newSections);
        return { ...prev, sections: newSections };
    });
};

    // --- DRAG & DROP LOGIC FOR QUESTIONS ---
    // This function handles the reordering of questions within a specific section
    const moveQuestionInSection = (sectionIndex, fromIndex, toIndex) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            const section = newSections[sectionIndex];
            const updatedQuestionIds = [...section.questionIds]; // Create a copy of the array
            // Remove question from old position
            const [movedQuestionId] = updatedQuestionIds.splice(fromIndex, 1);
            // Insert question at new position
            updatedQuestionIds.splice(toIndex, 0, movedQuestionId);
            // Update the section's questionIds array with the new order
            section.questionIds = updatedQuestionIds;
            // TotalQuestions remains the same after reordering
            section.totalQuestions = updatedQuestionIds.length;
            return { ...prev, sections: newSections };
        });
    };

    const fetchQuestionsForSection = async (sectionId) => {
        try {
            const res = await api.get(`/test/questions/?sectionId=${sectionId}`);
            setAllQuestions(prev => ({
                ...prev,
                [sectionId]: res.data?.questions || [] // Store questions under the section ID
            }));
            setSelectedSectionId(sectionId); // Set the section ID after fetching
        } catch (error) {
            toast.error("Failed to load questions");
            setAllQuestions(prev => ({
                ...prev,
                [sectionId]: [] // Store empty array on error
            }));
            setSelectedSectionId(sectionId); // Still set the ID so the UI shows the error state
        }
    };

    // --- STEPPER NAV ---
    const goToNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 /*&& validateStep2()*/ ) { // Removed validation call if not enforcing sections
            setCurrentStep(3);
        }
    };

    const goToPrev = () => {
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };

    // --- SUBMIT ---
    const handleCreate = async () => {
        // The payload structure matches the updated schema
        const payload = {
            ...formData,
            // No need to transform questionIds, they are already ObjectId arrays
        };
        try {
            await api.post("/test/series", payload);
            toast.success("Test series created!");
            fetchTestSeries();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Creation failed");
        }
    };

    const handleUpdate = async () => {
        const payload = {
            ...formData,
        };
        try {
            await api.put(`/test/series/${selectedTestSeries._id}`, payload);
            toast.success("Test series updated!");
            fetchTestSeries();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentStep < 3) {
            goToNext();
        } else {
            if (selectedTestSeries) {
                handleUpdate();
            } else {
                handleCreate();
            }
        }
    };

    // --- DELETE ---
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

    // --- FILTERED SECTIONS ---
    const filteredSections = useMemo(() => {
        if (!sectionSearch) return allSections;
        return allSections.filter(s =>
            s.name.toLowerCase().includes(sectionSearch.toLowerCase())
        );
    }, [allSections, sectionSearch]);

    // --- RENDER ---
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
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
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
                            {allExams.map(exam => (
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
                            {TestSeriesTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({ page: 1, limit: 10, examId: "", type: "", isPaid: "", search: "" })}
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
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Sub-Type</th> {/* Added Sub-Type column */}
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Paid</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Duration</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Active</th> {/* Added Active column */}
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {testSeriesList.length > 0 ? (
                                    testSeriesList.map(ts => (
                                        <tr key={ts._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-2">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{ts.title}</div>
                                                {ts.description && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{ts.description}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ts.examId?.name || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ts.type}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300"> {/* Added Sub-Type cell */}
                                                {ts.subType || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ts.isPaid ? "Yes" : "No"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                {ts.duration} min
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300"> {/* Added Active cell */}
                                                {ts.isActive ? "Yes" : "No"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button onClick={() => viewTestSeries(ts)} className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                        <Eye className="h-5 w-5" />
                                                    </button>
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
                                        <td colSpan="7" className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300"> {/* Updated colspan */}
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
                                .map(pageNum => (
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
            {/* View Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Test Series Details</h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Detailed information</p>
                    </div>
                    {selectedTestSeries && (
                        <div className="space-y-4 px-2">
                            <div><p className="text-sm text-gray-500">Title</p><p className="text-sm font-medium">{selectedTestSeries.title}</p></div>
                            <div><p className="text-sm text-gray-500">Exam</p><p className="text-sm font-medium">{selectedTestSeries.examId?.name}</p></div>
                            <div><p className="text-sm text-gray-500">Type</p><p className="text-sm font-medium">{selectedTestSeries.type}</p></div>
                            <div><p className="text-sm text-gray-500">Sub-Type</p><p className="text-sm font-medium">{selectedTestSeries.subType || "—"}</p></div> {/* Added Sub-Type detail */}
                            <div><p className="text-sm text-gray-500">Duration</p><p className="text-sm font-medium">{selectedTestSeries.duration} minutes</p></div>
                            <div><p className="text-sm text-gray-500">Total Questions</p><p className="text-sm font-medium">{selectedTestSeries.totalQuestions}</p></div>
                            <div><p className="text-sm text-gray-500">Is Active</p><p className="text-sm font-medium">{selectedTestSeries.isActive ? "Yes" : "No"}</p></div> {/* Added Active detail */}
                            <div><p className="text-sm text-gray-500">Sections</p>
                                <ul className="mt-1 space-y-1">
                                    {selectedTestSeries.sections?.map((s, i) => (
                                        <li key={i} className="text-sm">• {s.sectionId?.name || s.sectionId} ({s.questionIds?.length || 0} Qs)</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal}>Close</Button>
                    </div>
                </div>
            </Modal>
            {/* Stepper Create/Edit Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                                {selectedTestSeries ? "Edit Test Series" : "Create Test Series"}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Step {currentStep} of 3
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between mx-auto items-center w-[200px] mb-3">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep === step ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                                        {step}
                                    </div>
                                    {step < 3 && (
                                        <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-indigo-600' : 'bg-gray-300'} transition-colors`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 lg:mb-4">
                            {currentStep === 1
                                ? "Basic information"
                                : currentStep === 2
                                    ? "Configure sections & questions"
                                    : "Pricing, timing & settings"}
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col">
                        <div className="custom-scrollbar max-h-[450px] min-h-[350px] overflow-y-auto px-2 pb-3">
                            {/* Step 1: Basic Info */}
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
                                            <Label>Slug *</Label> {/* Added Slug field */}
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
                                                options={allExams.map(e => ({ value: e._id, label: e.name }))}
                                                defaultValue={formData.examId}
                                                onChange={(val) => setFormData({ ...formData, examId: val })}
                                            />
                                            {errors.examId && <p className="text-red-600 text-sm mt-1">{errors.examId}</p>}
                                        </div>
                                        <div>
                                            <Label>Type</Label>
                                            <Select
                                                options={TestSeriesTypes.map(t => ({ value: t, label: t }))}
                                                defaultValue={formData.type}
                                                onChange={(val) => setFormData({ ...formData, type: val })}
                                            />
                                        </div>
                                        {formData.type === "Sectional" && // Show Sub-Type only if type is Sectional
                                            <div>
                                                <Label>Sub-Type</Label> {/* Added Sub-Type field */}
                                                <Select
                                                    options={SubTypes.map(st => ({ value: st, label: st }))}
                                                    defaultValue={formData.subType}
                                                    onChange={(val) => setFormData({ ...formData, subType: val })}
                                                />
                                            </div>
                                        }
                                        <div>
                                            <Label>Difficulty</Label>
                                            <Select
                                                options={DifficultyLevels.map(d => ({ value: d, label: d }))}
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
                                </div>
                            )}
                            {/* Step 2: Sections & Questions */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    {/* Add Section Picker */}
                                    <div>
                                        <Label>Add Sections</Label>
                                        <div className="flex gap-2 mt-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search sections..."
                                                    value={sectionSearch}
                                                    onChange={(e) => setSectionSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (filteredSections.length > 0) {
                                                        addSectionToTest(filteredSections[0]._id);
                                                        setSectionSearch("");
                                                    }
                                                }}
                                                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {filteredSections.slice(0, 5).length > 0 && (
                                            <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded dark:border-gray-700">
                                                {filteredSections.slice(0, 5).map(sec => (
                                                    <div
                                                        key={sec._id}
                                                        onClick={() => {
                                                            addSectionToTest(sec._id);
                                                            setSectionSearch("");
                                                        }}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                                                    >
                                                        {sec.name} ({sec.questionCount || 0} Qs)
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* Added Sections */}
                                    <div>
                                        <Label>Selected Sections ({formData.sections.length})</Label>
                                        {formData.sections.length === 0 ? (
                                            <p className="text-sm text-gray-500 mt-2 italic">No sections added yet. Add sections to configure questions.</p>
                                        ) : (
                                            <div className="mt-2 space-y-3">
                                                {formData.sections.map((sec, idx) => {
                                                    const sectionDetails = allSections.find(s => s._id === sec.sectionId);
                                                    const sectionQuestions = allQuestions[sec.sectionId] || []; // Get questions for this specific section
                                                    const isManagingThisSection = selectedSectionId === sec.sectionId;

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
                                                                            onChange={(e) => updateSectionField(idx, "totalQuestions", Number(e.target.value))}
                                                                            className="text-xs"
                                                                            disabled // Disable direct input, it's calculated
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
                                                            {/* Questions */}
                                                            <div className="mt-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => fetchQuestionsForSection(sec.sectionId)} // Fetch questions for this specific section
                                                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                                                >
                                                                    {isManagingThisSection ? "Hide Questions" : "Manage Questions"}
                                                                </button>
                                                                {isManagingThisSection && (
                                                                    <div className="mt-2 border border-gray-200 rounded-lg p-2 dark:border-gray-700">
                                                                        <div className="max-h-64 overflow-y-auto">
                                                                            {sectionQuestions.length === 0 ? (
                                                                                <p className="text-sm text-gray-500 py-2 text-center">No questions found for this section.</p>
                                                                            ) : (
                                                                                sectionQuestions.map((question, questionIdx) => {
                                                                                    console.log("Rendering question:", question._id);
                                                                                    console.log("Is selected:", sec.questionIds);
                                                                                    const isQuestionSelected = sec.questionIds.includes(question._id);
                                                                                    console.log("isQuestionSelected:", isQuestionSelected);
                                                                                    return (
                                                                                        <div
                                                                                            key={question._id}
                                                                                            className={`flex items-center gap-2 text-sm p-2 border-b border-gray-100 dark:border-gray-700 ${isQuestionSelected ? 'bg-indigo-50 dark:bg-gray-800' : ''}`} // Highlight selected
                                                                                            draggable // Enable dragging
                                                                                            onDragStart={(e) => {
                                                                                                e.dataTransfer.setData("text/plain", JSON.stringify({ sectionIndex: idx, questionIndex: sec.questionIds.indexOf(question._id), questionId: question._id })); // Use index in current selection for drag
                                                                                            }}
                                                                                            onDragOver={(e) => e.preventDefault()} // Necessary for drop
                                                                                            onDrop={(e) => {
                                                                                                e.preventDefault();
                                                                                                const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
                                                                                                if (dragData.sectionIndex === idx) {
                                                                                                    const newQuestionIndex = sec.questionIds.indexOf(question._id);
                                                                                                    if (newQuestionIndex !== -1) { // Only reorder if the question is already selected
                                                                                                        moveQuestionInSection(idx, dragData.questionIndex, newQuestionIndex);
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            {/* Drag Handle */}
                                                                                            {isQuestionSelected && <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />}
                                                                                            {/* Show visual indicator of position if selected */}
                                                                                            {isQuestionSelected && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{sec.questionIds.indexOf(question._id) + 1}</span>}
                                                                                            <span className="flex-1 truncate">{question?.title}</span>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isQuestionSelected}
                                                                                                onChange={() => toggleQuestionInSection(idx, question._id)}
                                                                                                className="rounded"
                                                                                            />
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>
                                                                        {/* Counter for selected questions */}
                                                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                                                            Selected: {sec.questionIds.length} / {sectionQuestions.length}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Removed error display for sections if validation is removed */}
                                        {/* {errors.sections && <p className="text-red-600 text-sm mt-1">{errors.sections}</p>} */}
                                    </div>
                                </div>
                            )}
                            {/* Step 3: Pricing & Settings */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isPaid}
                                                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                                                    className="h-4 w-4 text-indigo-600 rounded"
                                                />
                                                Paid Test Series
                                            </Label>
                                        </div>
                                         <div> {/* Added Active toggle */}
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
                                    </div>
                                    {formData.isPaid && (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                                            <div>
                                                <Label>Price (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.price.amount}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        price: { ...formData.price, amount: Number(e.target.value) }
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <Label>Discount (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.price.discount}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        price: { ...formData.price, discount: Number(e.target.value) }
                                                    })}
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
                                            <Label>Total Duration (minutes) *</Label>
                                            <Input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Total Questions *</Label>
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
                                        <div>
                                            <Label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isTimed}
                                                    onChange={(e) => setFormData({ ...formData, isTimed: e.target.checked })}
                                                    className="h-4 w-4 text-indigo-600 rounded"
                                                />
                                                Timed Test
                                            </Label>
                                        </div>
                                        <div>
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
                                    </div>
                                    <div>
                                        <Label>Course Access (Optional)</Label>
                                        <Select
                                            isMulti
                                            options={allCourses.map(c => ({ value: c._id, label: c.title }))}
                                            defaultValue={formData.courseAccess}
                                            onChange={(vals) => setFormData({ ...formData, courseAccess: vals })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Footer */}
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
                                    {currentStep < 3
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