import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2 } from "lucide-react";
import CreateQuestionForm from "./CreateQuestion";

export default function QuestionManagement() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allExams, setAllExams] = useState([]);
    const [allSections, setAllSections] = useState([]);

    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        isActive: "true",
        questionType: "",
        difficulty: "",
        tag: "",
        examId: "",
        sectionId: "",
    });

    const [formData, setFormData] = useState({
        examId: "",
        sectionId: "",
        marks: 1,
        questionType: "multiple_choice_single",
        difficulty: "medium",
        content: {
            instruction: "",
            passageText: "",
            transcript: "",
            imageUrl: "",
            audioUrl: "",
            videoUrl: "",
        },
        cueCard: {
            topic: "",
            prompts: [""],
        },
        options: [{ label: "", text: "", isCorrect: false, explanation: "" }],
        correctAnswer: "",
        sampleAnswer: {
            text: "",
            wordCount: 0,
            bandScore: 0,
        },
        explanation: "",
        tags: [""],
        timeLimit: 0,
        isActive: true,
    });

    const [errors, setErrors] = useState({});

    // Fetch on mount & filter change
    useEffect(() => {
        fetchQuestions();
        fetchRelatedData();
    }, [filters]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy,
            };
            const response = await api.get("/test/questions", { params });
            setQuestions(response.data?.questions || []);
            setTotal(response.data?.pagination?.total || 0);
        } catch (error) {
            toast.error("Failed to load questions");
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedData = async () => {
        try {
            const [examsRes, sectionsRes] = await Promise.all([
                api.get("/test/exams"),
                api.get("/test/sections")
            ]);
            setAllExams(examsRes.data?.data || []);
            setAllSections(sectionsRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch related data:", error);
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
        setFilters((prev) => ({
            ...prev,
            page: newPage,
        }));
    };

    const toggleQuestionStatus = async (questionId, currentStatus) => {
        try {
            await api.put(`/test/questions/${questionId}`, { isActive: !currentStatus });
            toast.success(`Question ${currentStatus ? "deactivated" : "activated"} successfully`);
            fetchQuestions();
        } catch (error) {
            toast.error("Failed to update question status");
        }
    };

    const viewQuestionDetails = (question) => {
        setSelectedQuestion(question);
        openModal();
    };


    const openEditModal = (question) => {
        setSelectedQuestion(question);
        setFormData({
            examId: question.examId?._id || "",
            sectionId: question.sectionId?._id || "",
            marks: question.marks || 1,
            questionType: question.questionType || "multiple_choice_single",
            difficulty: question.difficulty || "medium",
            content: question.content || {
                instruction: "",
                passageText: "",
                transcript: "",
                imageUrl: "",
                audioUrl: "",
                videoUrl: "",
            },
            cueCard: question.cueCard || { topic: "", prompts: [""] },
            options: question.options?.length > 0
                ? question.options
                : [{ label: "", text: "", isCorrect: false, explanation: "" }],
            correctAnswer: question.correctAnswer || "",
            sampleAnswer: question.sampleAnswer || { text: "", wordCount: 0, bandScore: 0 },
            explanation: question.explanation || "",
            tags: question.tags?.length > 0 ? question.tags : [""],
            timeLimit: question.timeLimit || 0,
            isActive: question.isActive !== undefined ? question.isActive : true,
        });
        setEditModalOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.examId) newErrors.examId = "Exam is required";
        if (!formData.sectionId) newErrors.sectionId = "Section is required";
        if (!formData.content.instruction?.trim()) newErrors.instruction = "Instruction is required";
        if (!formData.questionType) newErrors.questionType = "Question type is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveQuestion = async () => {
        if (!validateForm()) return;
        try {
            const payload = { ...formData };
            await api.put(`/test/questions/${selectedQuestion._id}`, payload);
            toast.success("Question updated successfully");
            fetchQuestions();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save question");
        }
    };

    const handleCreateQuestion = async () => {
        if (!validateForm()) return;
        try {
            const payload = { ...formData, createdBy: undefined }; // backend sets this
            await api.post("/test/questions", payload);
            toast.success("Question created successfully");
            fetchQuestions();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create question");
        }
    };

    const deleteQuestion = async () => {
        if (!selectedQuestion) return;
        try {
            await api.delete(`/api/v1/questions/${selectedQuestion._id}`);
            toast.success("Question deleted successfully");
            fetchQuestions();
            setDeleteModalOpen(false);
            setSelectedQuestion(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete question");
        }
    };

    const openCreateModal = () => {
        setSelectedQuestion(null);
        setFormData({
            examId: "",
            sectionId: "",
            marks: 1,
            questionType: "multiple_choice_single",
            difficulty: "medium",
            content: {
                instruction: "",
                passageText: "",
                transcript: "",
                imageUrl: "",
                audioUrl: "",
                videoUrl: "",
            },
            cueCard: { topic: "", prompts: [""] },
            options: [{ label: "", text: "", isCorrect: false, explanation: "" }],
            correctAnswer: "",
            sampleAnswer: { text: "", wordCount: 0, bandScore: 0 },
            explanation: "",
            tags: [""],
            timeLimit: 0,
            isActive: true,
        });
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith("content.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                content: { ...prev.content, [field]: value },
            }));
        } else if (name.startsWith("sampleAnswer.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                sampleAnswer: { ...prev.sampleAnswer, [field]: value },
            }));
        } else if (name === "isActive") {
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleArrayChange = (value, name) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const updateOption = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            options: prev.options.map((opt, i) =>
                i === index ? { ...opt, [field]: value } : opt
            ),
        }));
    };

    const addOption = () => {
        setFormData((prev) => ({
            ...prev,
            options: [...prev.options, { label: "", text: "", isCorrect: false, explanation: "" }],
        }));
    };

    const removeOption = (index) => {
        setFormData((prev) => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index),
        }));
    };

    const updatePrompt = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            cueCard: {
                ...prev.cueCard,
                prompts: prev.cueCard.prompts.map((p, i) => (i === index ? value : p)),
            },
        }));
    };

    const addPrompt = () => {
        setFormData((prev) => ({
            ...prev,
            cueCard: { ...prev.cueCard, prompts: [...prev.cueCard.prompts, ""] },
        }));
    };

    const removePrompt = (index) => {
        setFormData((prev) => ({
            ...prev,
            cueCard: {
                ...prev.cueCard,
                prompts: prev.cueCard.prompts.filter((_, i) => i !== index),
            },
        }));
    };

    const updateTag = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.map((tag, i) => (i === index ? value : tag)),
        }));
    };

    const addTag = () => {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, ""] }));
    };

    const removeTag = (index) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    const getQuestionTypeLabel = (type) => {
        return type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Header */}
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H12V17H10V12H5V10H10V5H12V10H17V12Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Question Bank Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage reusable questions for all exams
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {questions.length} questions
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="" />
                            </svg>
                            Add Question
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Instruction, Tags)
                        </label>
                        <input
                            type="text"
                            name="tag"
                            value={filters.tag}
                            onChange={handleFilterChange}
                            placeholder="Search by tag..."
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
                                <option key={exam._id} value={exam._id}>
                                    {exam.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Section
                        </label>
                        <select
                            name="sectionId"
                            value={filters.sectionId}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Sections</option>
                            {allSections.map((section) => (
                                <option key={section._id} value={section._id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                        </label>
                        <select
                            name="questionType"
                            value={filters.questionType}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Types</option>
                            {[
                                'form_completion', 'note_completion', 'table_completion', 'flow_chart_completion',
                                'summary_completion', 'sentence_completion', 'short_answer', 'map_labelling',
                                'plan_labelling', 'diagram_labelling', 'matching_headings', 'matching_information',
                                'matching_features', 'true_false_not_given', 'yes_no_not_given',
                                'multiple_choice_single', 'multiple_choice_multiple',
                                'writing_task_1_academic', 'writing_task_1_general', 'writing_task_2',
                                'speaking_part_1', 'speaking_part_2', 'speaking_part_3',
                                'true_false', 'fill_in_blank', 'essay', 'matching', 'drag_and_drop',
                                'audio_response', 'image_based'
                            ].map(type => (
                                <option key={type} value={type}>
                                    {getQuestionTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Difficulty
                        </label>
                        <select
                            name="difficulty"
                            value={filters.difficulty}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            name="isActive"
                            value={filters.isActive}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({
                                page: 1,
                                limit: 10,
                                sortBy: "-createdAt",
                                isActive: "",
                                questionType: "",
                                difficulty: "",
                                tag: "",
                                examId: "",
                                sectionId: ""
                            })}
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
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Instruction</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Exam</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Difficulty</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Marks</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Created</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {questions.length > 0 ? (
                                    questions.map((q) => (
                                        <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                                {q.content.instruction}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {q.exam?.title || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {getQuestionTypeLabel(q.questionType)}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm capitalize text-gray-500 dark:text-gray-300">
                                                {q.difficulty}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {q.marks}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <span
                                                    onClick={() => toggleQuestionStatus(q._id, q.isActive)}
                                                    className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${q.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                        }`}
                                                >
                                                    {q.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {moment(q.createdAt).format("MMM D, YYYY")}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => viewQuestionDetails(q)}
                                                        className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(q)}
                                                        className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedQuestion(q); setDeleteModalOpen(true); }}
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
                                        <td colSpan={8} className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No questions found
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
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
                <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Question Details
                        </h4>
                    </div>
                    <div className="custom-scrollbar h-[500px] overflow-y-auto px-2 pb-3">
                        {selectedQuestion && (
                            <div className="space-y-6">
                                <div>
                                    <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Instruction</h6>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedQuestion.content.instruction}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Exam</h6>
                                        <p>{selectedQuestion.exam?.title || "—"}</p>
                                    </div>
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Section</h6>
                                        <p>{selectedQuestion.section?.title || "—"}</p>
                                    </div>
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Type</h6>
                                        <p>{getQuestionTypeLabel(selectedQuestion.questionType)}</p>
                                    </div>
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Difficulty</h6>
                                        <p className="capitalize">{selectedQuestion.difficulty}</p>
                                    </div>
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Marks</h6>
                                        <p>{selectedQuestion.marks}</p>
                                    </div>
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Time Limit (sec)</h6>
                                        <p>{selectedQuestion.timeLimit || "—"} </p>
                                    </div>
                                </div>
                                {selectedQuestion.content.passageText && (
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Passage</h6>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{selectedQuestion.content.passageText}</p>
                                    </div>
                                )}
                                {selectedQuestion.options?.length > 0 && (
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Options</h6>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {selectedQuestion.options.map((opt, i) => (
                                                <li key={i} className="text-sm">
                                                    <strong>{opt.label}:</strong> {opt.text} {opt.isCorrect && "(✓)"}
                                                    {opt.explanation && <div className="text-xs text-gray-500">Explanation: {opt.explanation}</div>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {selectedQuestion.correctAnswer && (
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Correct Answer</h6>
                                        <p className="font-mono">{JSON.stringify(selectedQuestion.correctAnswer)}</p>
                                    </div>
                                )}
                                {selectedQuestion.explanation && (
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Explanation</h6>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{selectedQuestion.explanation}</p>
                                    </div>
                                )}
                                {selectedQuestion.tags?.length > 0 && (
                                    <div>
                                        <h6 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Tags</h6>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedQuestion.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
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
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit/Create Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[800px] ">
                <div className=" relative w-full max-w-[800px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {selectedQuestion ? "Edit Question" : "Add New Question"}
                        </h4>
                    </div>
                    <div className="max-h-[80vh] overflow-y-auto no-scrollbar p-2">
                        <CreateQuestionForm
                            onClose={() => setEditModalOpen(false)}
                            onSuccess={fetchQuestions}
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedQuestion && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Confirm Deletion
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete this question? This will deactivate it (soft delete).
                            </p>
                        </div>
                        <div className="px-2">
                            <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>Deleting "{selectedQuestion.content.instruction?.substring(0, 30)}..." will hide it from all tests.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={deleteQuestion}>
                                Deactivate Question
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}