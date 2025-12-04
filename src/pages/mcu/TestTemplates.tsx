// TestTemplateManagementPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, set } from "react-hook-form";
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Filter,
    Loader2,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
    Tag,
    IndianRupee,
    UserPlus2Icon,
    Play,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

interface Exam {
    _id: string;
    name: string;
}
interface Section {
    _id: string;
    name: string;
}
interface Series {
    _id: string;
    title: string;
}
interface QuestionSummary {
    _id: string;
    questionText: string;
    questionType: string;
    difficulty: string;
}

interface SectionInTestForm {
    sectionId: string;
    customName: string;
    order: number;
    durationMinutes: number;
    questionCount: number;
    selectionMode: "fixed" | "random";
    randomQuestionCount?: number;
    randomQuestionTypes?: string; // comma separated
    randomDifficulties?: string;  // comma separated
    randomTags?: string;
    questions?: string[];         // comma separated
}
interface TestTemplateListItem {
    _id: string;
    title: string;
    description?: string;
    exam: { _id: string; name: string };
    testType: "full_length" | "sectional" | "quiz";
    difficultyLabel: "Easy" | "Medium" | "Hard" | "Mixed";
    totalDurationMinutes?: number;
    totalQuestions?: number;
    sectionCount?: number;
    isFree?: boolean;
    isSellable?: boolean;
    seriesOnly?: boolean;
    price?: number;
    salePrice?: number;
    createdAt?: string;
}
interface TestTemplateDetail extends TestTemplateListItem {
    sections?: any[];
    quizConfig?: any;
    pricing?: {
        isSellable: boolean;
        isFree: boolean;
        price: number;
        salePrice?: number;
        currency: string;
        seriesOnly: boolean;
    };
    seriesDocs?: Series[];
}
interface TestTemplateFormValues {
    title: string;
    description: string;
    exam: string;
    testType: "full_length" | "sectional" | "quiz";
    difficultyLabel: "Easy" | "Medium" | "Hard" | "Mixed";
    // sections builder (for full/sectional)
    sections: SectionInTestForm[];
    // quiz config (for quiz)
    quizMode: "single_type" | "mixed_types";
    quizAllowedTypesInput: string;   // comma-separated questionType keys
    quizDifficultiesInput: string;   // comma-separated
    quizTagsInput: string;           // comma-separated
    quizTotalQuestions: number;
    quizDurationMinutes: number;
    // pricing
    pricingIsSellable: boolean;
    pricingIsFree: boolean;
    pricingSeriesOnly: boolean;
    pricingPrice: number;
    pricingSalePrice?: number;
    // series
    selectedSeriesIds: string[];
}

const QUESTION_TYPE_KEYS = [
    "gmat_quant_problem_solving",
    "gmat_quant_data_sufficiency",
    "gmat_verbal_sc",
    "gmat_verbal_cr",
    "gmat_verbal_rc",
    "gmat_data_insights",
    "gre_analytical_writing",
    "gre_verbal_text_completion",
    "gre_verbal_sentence_equivalence",
    "gre_verbal_reading_comp",
    "gre_quantitative",
    "sat_reading_writing",
    "sat_math_calculator",
    "sat_math_no_calculator",
    "essay",
    "other",
];

const TEST_TYPE_OPTIONS = [
    { value: "full_length", label: "Full Length" },
    { value: "sectional", label: "Sectional" },
    { value: "quiz", label: "Quiz" },
];

const DIFFICULTY_LABEL_OPTIONS = [
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
    { value: "Mixed", label: "Mixed" },
];

const LIMIT_OPTIONS = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
];

export default function TestTemplateManagementPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [tests, setTests] = useState<TestTemplateListItem[]>([]);
    const [filters, setFilters] = useState({
        search: "",
        examId: "all",
        testType: "all",
        difficultyLabel: "all",
        isFree: "all",
        isActive: "all",
    });


    const [questionModalOpen, setQuestionModalOpen] = useState(false);
    const [questionModalSectionIndex, setQuestionModalSectionIndex] = useState<number | null>(null);
    const [questionModalLoading, setQuestionModalLoading] = useState(false);
    const [questionModalList, setQuestionModalList] = useState<QuestionSummary[]>([]);
    const [questionModalSelectedIds, setQuestionModalSelectedIds] = useState<string[]>([]);
    const [questionModalSearch, setQuestionModalSearch] = useState("");

    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10); // State for limit
    const [totalPages, setTotalPages] = useState(1);
    const [totalTests, setTotalTests] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sideOpen, setSideOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const allQuestionsSelected =
        questionModalList.length > 0 &&
        questionModalSelectedIds.length === questionModalList.length;

    const someQuestionsSelected =
        questionModalSelectedIds.length > 0 &&
        questionModalSelectedIds.length < questionModalList.length;

    const handleToggleSelectAllQuestions = () => {
        if (allQuestionsSelected) {
            // unselect all
            setQuestionModalSelectedIds([]);
        } else {
            // select all visible
            setQuestionModalSelectedIds(questionModalList.map((q) => q._id));
        }
    };


    const {
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm<TestTemplateFormValues>({
        defaultValues: {
            title: "",
            description: "",
            exam: "",
            testType: "full_length",
            difficultyLabel: "Mixed",
            sections: [
                {
                    sectionId: "",
                    customName: "",
                    order: 1,
                    durationMinutes: 0,
                    questionCount: 0,
                    selectionMode: "fixed",
                    randomQuestionCount: 0,
                    randomQuestionTypes: "",
                    randomDifficulties: "",
                    randomTags: "",
                    questionIds: [],
                },
            ],
            quizMode: "single_type",
            quizAllowedTypesInput: "",
            quizDifficultiesInput: "",
            quizTagsInput: "",
            quizTotalQuestions: 10,
            quizDurationMinutes: 30,
            pricingIsSellable: true,
            pricingIsFree: false,
            pricingSeriesOnly: false,
            pricingPrice: 0,
            pricingSalePrice: 0,
            selectedSeriesIds: [],
        },
    });

    const { fields: sectionFields, append, remove } = useFieldArray({
        control,
        name: "sections",
    });

    const watchExam = watch("exam");
    const watchTestType = watch("testType");
    const watchIsFree = watch("pricingIsFree");
    const watchIsSellable = watch("pricingIsSellable");
    const watchSeriesOnly = watch("pricingSeriesOnly");
    const watchTitle = watch("title");
    const watchDescription = watch("description");
    const watchQuizMode = watch("quizMode");
    const watchQuizTotalQuestions = watch("quizTotalQuestions");
    const watchQuizDurationMinutes = watch("quizDurationMinutes");
    const watchQuizAllowedTypesInput = watch("quizAllowedTypesInput");
    const watchQuizDifficultiesInput = watch("quizDifficultiesInput");
    const watchQuizTagsInput = watch("quizTagsInput");
    const watchPricingIsSellable = watch("pricingIsSellable");
    const watchPricingIsFree = watch("pricingIsFree");
    const watchPricingSeriesOnly = watch("pricingSeriesOnly");
    const watchPricingPrice = watch("pricingPrice");
    const watchPricingSalePrice = watch("pricingSalePrice");
    const watchSelectedSeriesIds = watch("selectedSeriesIds");

    // -----------------------------
    // Fetch exams / sections / series
    // -----------------------------


    const openQuestionModalForSection = async (sectionIndex: number) => {
        const examId = watch("exam");
        const sectionId = watch(`sections.${sectionIndex}.sectionId` as const);

        if (!examId) {
            toast.error("Select exam first");
            return;
        }
        if (!sectionId) {
            toast.error("Select section first");
            return;
        }

        try {
            setQuestionModalLoading(true);
            setQuestionModalSectionIndex(sectionIndex);

            // Get already selected questionIds from form
            const currentSelected: string[] = watch(
                `sections.${sectionIndex}.questionIds` as const
            ) || [];
            setQuestionModalSelectedIds(currentSelected);

            const params: any = {
                examId,
                sectionId,
                limit: 100,
            };
            if (questionModalSearch) params.search = questionModalSearch;

            const res = await api.get("/mcu/questions", { params });
            if (res.data?.success) {
                const list = (res.data.data || res.data?.data?.data || []) as any[];
                setQuestionModalList(
                    list.map((q) => ({
                        _id: q._id,
                        questionText: q.questionText,
                        questionType: q.questionType,
                        difficulty: q.difficulty,
                    }))
                );
            } else {
                setQuestionModalList([]);
            }

            setQuestionModalOpen(true);
        } catch (err: any) {
            console.error("Fetch questions for modal error:", err);
            toast.error("Failed to fetch questions for this section");
        } finally {
            setQuestionModalLoading(false);
        }
    };

    const closeQuestionModal = () => {
        setQuestionModalOpen(false);
        setQuestionModalSectionIndex(null);
        setQuestionModalList([]);
        setQuestionModalSearch("");
    };

    // when user toggles a checkbox
    const toggleQuestionSelection = (id: string) => {
        setQuestionModalSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // when user clicks "Apply"
    const applyQuestionSelectionToSection = () => {
        if (questionModalSectionIndex === null) return;
        setValue(
            `sections.${questionModalSectionIndex}.questionIds` as const,
            questionModalSelectedIds
        );
        // also keep questionCount in sync
        setValue(
            `sections.${questionModalSectionIndex}.questionCount` as const,
            questionModalSelectedIds.length
        );
        closeQuestionModal();
    };

    const fetchExams = async () => {
        try {
            const res = await api.get("/test/exams", { params: { isActive: true, limit: 200 } });
            if (res.data?.success) {
                setExams(res.data.data || res.data?.data?.data || []);
            } else {
                setExams([]);
            }
        } catch (err: any) {
            console.error("Fetch exams error:", err);
            toast.error("Failed to load exams");
        }
    };

    const fetchSeries = async () => {
        try {
            const res = await api.get("/mcu/test", { params: { isActive: true, limit: 200 } });
            if (res.data?.success) {
                setSeriesList(res.data.data || res.data?.data?.data || []);
            } else {
                setSeriesList([]);
            }
        } catch (err: any) {
            console.error("Fetch series error:", err);
        }
    };

    useEffect(() => {
        fetchExams();
        fetchSeries();
    }, []);

    useEffect(() => {
        if (watchExam) {
            const sections = exams.find((e) => e._id === watchExam)?.sections || [];
            setSections(sections);
            sectionFields.forEach((_, index) => {
                setValue(`sections.${index}.sectionId`, "");
            });
        } else {
            setSections([]);
        }
    }, [watchExam, sectionFields, setValue]); // Add dependencies

    const fetchTests = async () => {
        try {
            setLoading(true);
            setError(null);
            const params: any = {
                page,
                limit,
            };
            if (debouncedSearch) params.search = debouncedSearch;
            if (filters.examId !== "all") params.examId = filters.examId;
            if (filters.testType !== "all") params.testType = filters.testType;
            if (filters.difficultyLabel !== "all") params.difficultyLabel = filters.difficultyLabel;
            if (filters.isFree !== "all") params.isFree = filters.isFree;
            if (filters.isActive !== "all") params.isActive = filters.isActive;

            const res = await api.get("/mcu/test", { params });

            if (res.data?.success) {
                const data = res.data.data || res.data?.data?.data || [];
                setTests(data);
                const pagination = res.data.pagination || res.data?.data?.pagination;
                if (pagination) {
                    setTotalPages(pagination.pages || 1);
                    setTotalTests(pagination.total || data.length);
                } else {
                    setTotalPages(1);
                    setTotalTests(data.length);
                }
            } else {
                setTests([]);
                setTotalPages(1);
                setTotalTests(0);
                setError("Failed to load tests");
            }
        } catch (err: any) {
            console.error("Fetch tests error:", err);
            setError(err.response?.data?.message || "Failed to load tests");
            toast.error(err.response?.data?.message || "Failed to load tests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, [page, limit, debouncedSearch, filters.examId, filters.testType, filters.difficultyLabel, filters.isFree, filters.isActive]); // Add limit to dependency

    const handleSearchChange = (value: string) => {
        setFilters((prev) => ({ ...prev, search: value }));
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeoutId = setTimeout(() => setDebouncedSearch(value), 600);
        setSearchTimeout(timeoutId);
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            examId: "all",
            testType: "all",
            difficultyLabel: "all",
            isFree: "all",
            isActive: "all",
        });
        setDebouncedSearch("");
        setPage(1);
    };

    // -----------------------------
    // Drawer open/close + load detail
    // -----------------------------
    const openCreateDrawer = () => {
        setEditingId(null);
        reset({
            title: "",
            description: "",
            exam: "",
            testType: "full_length",
            difficultyLabel: "Mixed",
            sections: [
                {
                    sectionId: "",
                    customName: "",
                    order: 1,
                    durationMinutes: 0,
                    questionCount: 0,
                    selectionMode: "fixed",
                    randomQuestionCount: 0,
                    randomQuestionTypes: "",
                    randomDifficulties: "",
                    randomTags: "",
                },
            ],
            quizMode: "single_type",
            quizAllowedTypesInput: "",
            quizDifficultiesInput: "",
            quizTagsInput: "",
            quizTotalQuestions: 10,
            quizDurationMinutes: 30,
            pricingIsSellable: true,
            pricingIsFree: false,
            pricingSeriesOnly: false,
            pricingPrice: 0,
            pricingSalePrice: 0,
            selectedSeriesIds: [],
        });
        setSideOpen(true);
    };

    const openEditDrawer = async (id: string) => {
        try {
            setSideOpen(true);
            setEditingId(id);
            setFormLoading(true);
            const res = await api.get(`/mcu/test/${id}`);
            if (!res.data?.success) {
                throw new Error("Failed to load test");
            }
            const test: TestTemplateDetail = res.data.data;
            reset({
                title: test.title,
                description: test.description || "",
                exam: test.exam?._id || "",
                testType: test.testType,
                difficultyLabel: test.difficultyLabel || "Mixed",
                sections:
                    test.sections && test.sections.length
                        ? test.sections.map((s: any, index: number) => ({
                            sectionId: s.section?._id || s.section?.toString() || "",
                            customName: s.customName || "",
                            order: s.order || index + 1,
                            durationMinutes: s.durationMinutes || 0,
                            questionCount: s.questionCount || s.randomConfig?.questionCount || 0,
                            selectionMode: s.selectionMode || "fixed",
                            randomQuestionCount: s.randomConfig?.questionCount || 0,
                            randomQuestionTypes: (s.randomConfig?.questionTypes || []).join(", "),
                            randomDifficulties: (s.randomConfig?.difficulties || []).join(", "),
                            randomTags: (s.randomConfig?.tags || []).join(", "),
                        }))
                        : [
                            {
                                sectionId: "",
                                customName: "",
                                order: 1,
                                durationMinutes: 0,
                                questionCount: 0,
                                selectionMode: "fixed",
                                randomQuestionCount: 0,
                                randomQuestionTypes: "",
                                randomDifficulties: "",
                                randomTags: "",
                            },
                        ],
                quizMode: test.quizConfig?.mode || "single_type",
                quizAllowedTypesInput: (test.quizConfig?.allowedQuestionTypes || []).join(", "),
                quizDifficultiesInput: (test.quizConfig?.difficulties || []).join(", "),
                quizTagsInput: (test.quizConfig?.tags || []).join(", "),
                quizTotalQuestions: test.quizConfig?.totalQuestions || 10,
                quizDurationMinutes: test.quizConfig?.durationMinutes || 30,
                pricingIsSellable: test.pricing?.isSellable ?? true,
                pricingIsFree: test.pricing?.isFree ?? false,
                pricingSeriesOnly: test.pricing?.seriesOnly ?? false,
                pricingPrice: test.pricing?.price ?? 0,
                pricingSalePrice: test.pricing?.salePrice ?? 0,
                selectedSeriesIds: (test.seriesDocs || test.series || []).map(
                    (s: any) => s._id
                ),
            });
        } catch (err: any) {
            console.error("Load test detail error:", err);
            toast.error(err.message || "Failed to load test");
            setSideOpen(false);
            setEditingId(null);
        } finally {
            setFormLoading(false);
        }
    };

    const closeDrawer = () => {
        if (saving) return;
        setSideOpen(false);
        setEditingId(null);
    };

    let navigate = useNavigate();

    const formatDate = (iso?: string) =>
        iso ? new Date(iso).toLocaleDateString("en-IN") : "";

    const onSubmit = async (values: TestTemplateFormValues) => {
        try {
            if (!values.exam) {
                toast.error("Please select an exam");
                return;
            }
            if (!values.title.trim()) {
                toast.error("Title is required");
                return;
            }
            if (values.testType !== "quiz") {
                if (!values.sections || !values.sections.length) {
                    toast.error("Add at least one section");
                    return;
                }
                const invalidSection = values.sections.find(
                    (s) => !s.sectionId || (s.selectionMode === "fixed" && !s.questionCount)
                );
                if (invalidSection) {
                    toast.error("Each section must have section and question count");
                    return;
                }
            } else {
                if (!values.quizTotalQuestions || values.quizTotalQuestions <= 0) {
                    toast.error("Quiz total questions must be > 0");
                    return;
                }
                if (!values.quizDurationMinutes || values.quizDurationMinutes <= 0) {
                    toast.error("Quiz duration must be > 0");
                    return;
                }
            }
            if (!watchIsFree && watchIsSellable && !values.pricingPrice) {
                toast.error("Price is required for paid tests");
                return;
            }

            setSaving(true);
            // Build sections array
            let sectionsPayload: any[] = [];
            if (values.testType !== "quiz") {
                sectionsPayload = values.sections.map((s, index) => {
                    const randomTypes = s.randomQuestionTypes
                        ? s.randomQuestionTypes.split(",").map((x) => x.trim()).filter(Boolean)
                        : [];
                    const randomDiffs = s.randomDifficulties
                        ? s.randomDifficulties.split(",").map((x) => x.trim()).filter(Boolean)
                        : [];
                    const randomTags = s.randomTags
                        ? s.randomTags.split(",").map((x) => x.trim()).filter(Boolean)
                        : [];

                    const base: any = {
                        section: s.sectionId,
                        customName: s.customName || undefined,
                        order: s.order || index + 1,
                        durationMinutes: Number(s.durationMinutes) || undefined,
                        selectionMode: s.selectionMode,
                    };

                    if (s.selectionMode === "fixed") {
                        const selectedQuestions = s.questionIds || [];
                        base.questions = selectedQuestions;
                        base.questionCount =
                            selectedQuestions.length || Number(s.questionCount) || 0;
                    } else {
                        base.randomConfig = {
                            questionCount:
                                Number(s.randomQuestionCount || s.questionCount) || 0,
                            questionTypes: randomTypes,
                            difficulties: randomDiffs,
                            tags: randomTags,
                        };
                    }
                    return base;
                });
            }

            // Build quizConfig
            let quizConfig: any = undefined;
            if (values.testType === "quiz") {
                quizConfig = {
                    mode: values.quizMode,
                    allowedQuestionTypes: values.quizAllowedTypesInput
                        ? values.quizAllowedTypesInput
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        : [],
                    difficulties: values.quizDifficultiesInput
                        ? values.quizDifficultiesInput
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        : [],
                    tags: values.quizTagsInput
                        ? values.quizTagsInput
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        : [],
                    totalQuestions: Number(values.quizTotalQuestions) || 0,
                    durationMinutes: Number(values.quizDurationMinutes) || 0,
                };
            }

            // pricing
            const pricing = {
                isSellable: values.pricingIsSellable,
                isFree: values.pricingIsFree,
                seriesOnly: values.pricingSeriesOnly,
                price: Number(values.pricingPrice) || 0,
                salePrice: values.pricingSalePrice
                    ? Number(values.pricingSalePrice)
                    : undefined,
                currency: "INR",
            };

            const payload: any = {
                title: values.title,
                description: values.description || "",
                exam: values.exam,
                testType: values.testType,
                difficultyLabel: values.difficultyLabel,
                sections: values.testType === "quiz" ? [] : sectionsPayload,
                quizConfig: values.testType === "quiz" ? quizConfig : undefined,
                pricing,
                series: values.selectedSeriesIds || [],
                isActive: true,
            };

            if (editingId) {
                await api.put(`/mcu/test/${editingId}`, payload);
                toast.success("Test updated successfully");
            } else {
                await api.post("/mcu/test", payload);
                toast.success("Test created successfully");
            }
            closeDrawer();
            fetchTests();
        } catch (err: any) {
            console.error("Save test error:", err);
            toast.error(err.response?.data?.message || "Failed to save test");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (test: TestTemplateListItem) => {
        if (!window.confirm(`Delete test "${test.title}"?`)) return;
        try {
            await api.delete(`/mcu/test/${test._id}`);
            toast.success("Test deleted");
            fetchTests();
        } catch (err: any) {
            console.error("Delete test error:", err);
            toast.error(err.response?.data?.message || "Failed to delete test");
        }
    };

    // Summary for price
    const priceLabel = (t: TestTemplateListItem) => {
        if (t.isFree) return "Free";
        if (!t.isSellable && t.seriesOnly) return "Bundle only";
        if (typeof t.salePrice === "number" && t.salePrice > 0) {
            return `₹${t.salePrice} (₹${t.price})`;
        }
        if (typeof t.price === "number" && t.price > 0) {
            return `₹${t.price}`;
        }
        return "N/A";
    };

    const isQuiz = watchTestType === "quiz";
    const disabledPrice = watchIsFree || (!watchIsSellable && !watchSeriesOnly);

    return (
        <>
            <div className="relative">
                <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                        </div>
                        <div className="flex gap-2 ">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetFilters}
                                className=""
                            >
                                Clear filters
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openCreateDrawer}
                                className="!m-0"
                            >
                                <Plus className="h-4 w-4" />
                                New Test
                            </Button>
                        </div>

                    </div>
                    <div className="grid gap-3 md:grid-cols-6">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search by title or description"
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                        {/* Exam filter */}
                        <div>
                            <Select
                                defaultValue={filters.examId}
                                options={[
                                    { value: "all", label: "All Exams" },
                                    ...exams.map((e) => ({ value: e._id, label: e.name })),
                                ]}
                                onChange={(value: string) => {
                                    setFilters((prev) => ({ ...prev, examId: value }));
                                    setPage(1);
                                }}
                            />
                        </div>
                        {/* TestType filter */}
                        <div>
                            <Select
                                defaultValue={filters.testType}
                                options={[
                                    { value: "all", label: "All Types" },
                                    ...TEST_TYPE_OPTIONS,
                                ]}
                                onChange={(value: string) => {
                                    setFilters((prev) => ({ ...prev, testType: value }));
                                    setPage(1);
                                }}
                            />
                        </div>
                        {/* Difficulty / Free / Limit */}
                        <div>
                            <Select
                                defaultValue={filters.difficultyLabel}
                                options={[
                                    { value: "all", label: "All Difficulty" },
                                    ...DIFFICULTY_LABEL_OPTIONS,
                                ]}
                                onChange={(value: string) => {
                                    setFilters((prev) => ({ ...prev, difficultyLabel: value }));
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div className="flex gap-2 md:col-span-1">
                            <Select
                                defaultValue={filters.isFree}
                                options={[
                                    { value: "all", label: "All Pricing" },
                                    { value: "true", label: "Free Only" },
                                    { value: "false", label: "Paid Only" },
                                ]}
                                onChange={(value: string) => {
                                    setFilters((prev) => ({ ...prev, isFree: value }));
                                    setPage(1);
                                }}
                            />
                        </div>
                        <div>
                            <Select
                                className=""
                                options={LIMIT_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                                defaultValue={limit.toString()}
                                onChange={(value: string) => {
                                    setLimit(Number(value));
                                    setPage(1); // Reset to first page when limit changes
                                }}
                            />
                        </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div>
                            Showing page <span className="font-semibold">{page}</span> of{" "}
                            <span className="font-semibold">{totalPages}</span> •{" "}
                            <span className="font-semibold">{totalTests}</span> tests
                        </div>
                    </div>
                </div>
                {/* List */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {loading && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="mb-2 flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading tests...
                            </div>
                        </div>
                    )}
                    {!loading && error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                            {error}
                        </div>
                    )}
                    {!loading && !error && tests.length === 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            No tests found. Try changing filters or create a new one.
                        </div>
                    )}
                    {!loading &&
                        !error &&
                        tests.map((t) => (
                            <motion.div
                                key={t._id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div className="space-y-2 gap-3 relative ">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="absolute -top-1 right-1 !p-0 h-6 w-6 rounded-full text-xs text-red-600 hover:text-red-700"
                                        onClick={() => { if (t.exam?.name.toLowerCase().includes("gmat")) { navigate(`/gmat/tests/${t._id}`) } else navigate(`/gre/tests/${t._id}`) }}
                                    >
                                        <Play className="h-3 w-3" />
                                    </Button>
                                    <div className="flex-1">
                                        <h3 className="block mb-2 px-1 text-base uppercase text-gray-900 dark:text-gray-100">
                                            {t.title}
                                        </h3>
                                        <div className="mb-1 flex flex-wrap items-center gap-2">
                                            {/* {t.description && (
                                                <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                                                    {t.description}
                                                </p>
                                            )} */}
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                {t.exam?.name || "Unknown exam"}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                {TEST_TYPE_OPTIONS.find((x) => x.value === t.testType)?.label ||
                                                    t.testType}
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${t.difficultyLabel === "Easy"
                                                    ? "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                                    : t.difficultyLabel === "Hard"
                                                        ? "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                                        : t.difficultyLabel === "Medium"
                                                            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                                                            : "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                                    }`}
                                            >
                                                {t.difficultyLabel}
                                            </span>
                                            <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                <Tag className="h-3 w-3" />
                                                {t.totalQuestions || 0} Q • {t.totalDurationMinutes || 0} mins
                                            </span>
                                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                <IndianRupee className="h-3 w-3" />
                                                {priceLabel(t)}
                                            </span>
                                        </div>

                                        {/* <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                            {t.createdAt && (
                                                <span>Created: {formatDate(t.createdAt)} • </span>
                                            )}
                                            <span>
                                                Sections: {t.sectionCount ?? (t.testType === "quiz" ? 1 : 0)}
                                            </span>
                                        </div> */}
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl px-1 py-1 text-xs"
                                            onClick={() => openEditDrawer(t._id)}
                                        >
                                            <Edit3 className="mr- h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl px-1 py-1 text-xs text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(t)}
                                        >
                                            <Trash2 className="mr- h-3 w-3" />
                                            Delete
                                        </Button>

                                    </div>
                                </div>
                            </motion.div>
                        ))}
                </div>
                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-3">
                        <Button
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Prev
                        </Button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Page{" "}
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{page}</span>{" "}
                            of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {/* Drawer */}
                <AnimatePresence>
                    {sideOpen && (
                        <motion.div
                            className="fixed inset-0 z-50 flex" // Increased z-index to 50
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Backdrop */}
                            <motion.div
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                                onClick={saving ? undefined : closeDrawer}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                            {/* Panel */}
                            <motion.div
                                className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
                            >
                                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {editingId ? "Edit Test Template" : "Create Test Template"}
                                            <Filter className="h-3 w-3 text-gray-400" />
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Configure sections, quiz settings and pricing.
                                        </p>
                                    </div>
                                    <button
                                        onClick={saving ? undefined : closeDrawer}
                                        className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                {formLoading ? (
                                    <div className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading test details...
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleSubmit(onSubmit)}
                                        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
                                    >
                                        {/* Basic Info */}
                                        <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                                            <div>
                                                <Label>Title</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="GMAT Full Length Test 01"
                                                    value={watchTitle}
                                                    onChange={(e) => setValue("title", e.target.value)}
                                                    error={!!errors.title}
                                                    hint={errors.title?.message}
                                                />
                                            </div>
                                            <div>
                                                <Label>Description</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Short description for this test"
                                                    value={watchDescription}
                                                    onChange={(e) => setValue("description", e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                <div>
                                                    <Label>Exam</Label>
                                                    <Select
                                                        defaultValue={watch("exam")}
                                                        options={[
                                                            { value: "", label: "Select exam" },
                                                            ...exams.map((e) => ({ value: e._id, label: e.name })),
                                                        ]}
                                                        onChange={(value: string) => setValue("exam", value)}
                                                    />
                                                    {errors.exam && (
                                                        <p className="mt-1 text-xs text-red-500">
                                                            {(errors as any).exam?.message || "Exam is required"}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <Label>Test Type</Label>
                                                    <Select
                                                        defaultValue={watchTestType}
                                                        options={TEST_TYPE_OPTIONS}
                                                        onChange={(value: any) =>
                                                            setValue("testType", value as TestTemplateFormValues["testType"])
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Difficulty Label</Label>
                                                    <Select
                                                        defaultValue={watch("difficultyLabel")}
                                                        options={DIFFICULTY_LABEL_OPTIONS}
                                                        onChange={(value: any) =>
                                                            setValue(
                                                                "difficultyLabel",
                                                                value as TestTemplateFormValues["difficultyLabel"]
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Sections builder (for full/sectional) */}
                                        {!isQuiz && (
                                            <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                                                <div className="flex items-center justify-between">
                                                    <Label>Sections in this Test</Label>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            append({
                                                                sectionId: "",
                                                                customName: "",
                                                                order: sectionFields.length + 1,
                                                                durationMinutes: 0,
                                                                questionCount: 0,
                                                                selectionMode: "fixed",
                                                                randomQuestionCount: 0,
                                                                randomQuestionTypes: "",
                                                                randomDifficulties: "",
                                                                randomTags: "",
                                                                questionIds: []
                                                            })
                                                        }
                                                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        + Add Section
                                                    </button>
                                                </div>
                                                {sectionFields.length === 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        No sections added yet.
                                                    </p>
                                                )}
                                                <div className="space-y-3">
                                                    {sectionFields.map((field, index) => {
                                                        const selectionMode = watch(
                                                            `sections.${index}.selectionMode` as const
                                                        ) as "fixed" | "random";
                                                        return (
                                                            <motion.div
                                                                key={field.id}
                                                                layout
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="space-y-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                                                            >
                                                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                    <span>Section #{index + 1}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => remove(index)}
                                                                        className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                    <div>
                                                                        <Label>Section</Label>
                                                                        <Select
                                                                            defaultValue={watch(
                                                                                `sections.${index}.sectionId` as const
                                                                            )}
                                                                            options={[
                                                                                { value: "", label: "Select section" },
                                                                                ...sections.map((s) => ({
                                                                                    value: s._id,
                                                                                    label: s.name,
                                                                                })),
                                                                            ]}
                                                                            onChange={(value: string) =>
                                                                                setValue(
                                                                                    `sections.${index}.sectionId` as const,
                                                                                    value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label>Custom Name (optional)</Label>
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="e.g., Verbal Section 1"
                                                                            value={watch(`sections.${index}.customName` as const)}
                                                                            onChange={(e) =>
                                                                                setValue(
                                                                                    `sections.${index}.customName` as const,
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="grid gap-2 sm:grid-cols-3">
                                                                    <div>
                                                                        <Label>Order</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={watch(`sections.${index}.order` as const)}
                                                                            onChange={(e) =>
                                                                                setValue(
                                                                                    `sections.${index}.order` as const,
                                                                                    parseFloat(e.target.value) || 0
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label>Duration (mins)</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={watch(`sections.${index}.durationMinutes` as const) || sections.find(s => s._id === watch(`sections.${index}.sectionId` as const))?.duration / 60 || 0}
                                                                            onChange={(e) =>
                                                                                setValue(
                                                                                    `sections.${index}.durationMinutes` as const,
                                                                                    parseFloat(e.target.value) || 0
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label>Selection Mode</Label>
                                                                        <Select
                                                                            defaultValue={selectionMode}
                                                                            options={[
                                                                                { value: "fixed", label: "Fixed questions" },
                                                                                { value: "random", label: "Random from pool" },
                                                                            ]}
                                                                            onChange={(val: "fixed" | "random") =>
                                                                                setValue(
                                                                                    `sections.${index}.selectionMode` as const,
                                                                                    val
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {selectionMode === "fixed" ? (
                                                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            <span className="font-medium">
                                                                                Selected questions:{" "}
                                                                                {(watch(`sections.${index}.questionIds` as const) || []).length}
                                                                            </span>
                                                                            {(watch(`sections.${index}.questionIds` as const) || []).length > 0 && (
                                                                                <span className="ml-1 text-[10px]">
                                                                                    (Question count will auto-sync)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="mt-1 rounded-xl px-3 py-1 text-xs sm:mt-0"
                                                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); openQuestionModalForSection(index) }}
                                                                        >
                                                                            Manage Questions
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2 rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-800/50">
                                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                                            <div>
                                                                                <Label>Random Question Count</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    value={watch(`sections.${index}.randomQuestionCount` as const)}
                                                                                    onChange={(e) =>
                                                                                        setValue(
                                                                                            `sections.${index}.randomQuestionCount` as const,
                                                                                            parseFloat(e.target.value) || 0
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <Label>Question Types (keys)</Label>
                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="e.g., gmat_quant_problem_solving"
                                                                                    value={watch(`sections.${index}.randomQuestionTypes` as const)}
                                                                                    onChange={(e) =>
                                                                                        setValue(
                                                                                            `sections.${index}.randomQuestionTypes` as const,
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="grid gap-2 sm:grid-cols-2">
                                                                            <div>
                                                                                <Label>Difficulties</Label>
                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="Easy,Medium,Hard"
                                                                                    value={watch(`sections.${index}.randomDifficulties` as const)}
                                                                                    onChange={(e) =>
                                                                                        setValue(
                                                                                            `sections.${index}.randomDifficulties` as const,
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <Label>Tags</Label>
                                                                                <Input
                                                                                    type="text"
                                                                                    placeholder="algebra,probability"
                                                                                    value={watch(`sections.${index}.randomTags` as const)}
                                                                                    onChange={(e) =>
                                                                                        setValue(
                                                                                            `sections.${index}.randomTags` as const,
                                                                                            e.target.value
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                            Use comma separated values. Question types must match your
                                                                            question schema keys.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {/* Quiz Config */}
                                        {isQuiz && (
                                            <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                                                <Label>Quiz Config</Label>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <div>
                                                        <Label>Mode</Label>
                                                        <Select
                                                            defaultValue={watchQuizMode}
                                                            options={[
                                                                { value: "single_type", label: "Single Type" },
                                                                { value: "mixed_types", label: "Mixed Types" },
                                                            ]}
                                                            onChange={(value: "single_type" | "mixed_types") =>
                                                                setValue("quizMode", value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Total Questions</Label>
                                                        <Input
                                                            type="number"
                                                            value={watchQuizTotalQuestions}
                                                            onChange={(e) =>
                                                                setValue("quizTotalQuestions", parseFloat(e.target.value) || 0)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <div>
                                                        <Label>Duration (mins)</Label>
                                                        <Input
                                                            type="number"
                                                            value={watchQuizDurationMinutes}
                                                            onChange={(e) =>
                                                                setValue("quizDurationMinutes", parseFloat(e.target.value) || 0)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Allowed Question Types</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="gmat_verbal_sc,gmat_verbal_rc"
                                                            value={watchQuizAllowedTypesInput}
                                                            onChange={(e) =>
                                                                setValue("quizAllowedTypesInput", e.target.value)
                                                            }
                                                        />
                                                        <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                            Comma separated, keys like:{" "}
                                                            <span className="font-mono text-[10px]">
                                                                {QUESTION_TYPE_KEYS.slice(0, 3).join(", ")}...
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <div>
                                                        <Label>Difficulties</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="Easy,Medium"
                                                            value={watchQuizDifficultiesInput}
                                                            onChange={(e) =>
                                                                setValue("quizDifficultiesInput", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Tags</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="reading,algebra"
                                                            value={watchQuizTagsInput}
                                                            onChange={(e) =>
                                                                setValue("quizTagsInput", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {/* Pricing + Series */}
                                        <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                                            <Label>Pricing</Label>
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={watchPricingIsSellable}
                                                        onChange={(e) => setValue("pricingIsSellable", e.target.checked)}
                                                    />
                                                    Sellable individually
                                                </label>
                                                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={watchPricingIsFree}
                                                        onChange={(e) => setValue("pricingIsFree", e.target.checked)}
                                                    />
                                                    Free test
                                                </label>
                                                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={watchPricingSeriesOnly}
                                                        onChange={(e) => setValue("pricingSeriesOnly", e.target.checked)}
                                                    />
                                                    Available only in series
                                                </label>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <div>
                                                    <Label>Price (INR)</Label>
                                                    <Input
                                                        type="number"
                                                        disabled={disabledPrice}
                                                        value={watchPricingPrice}
                                                        onChange={(e) =>
                                                            setValue("pricingPrice", parseFloat(e.target.value) || 0)
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Sale Price (INR)</Label>
                                                    <Input
                                                        type="number"
                                                        disabled={disabledPrice}
                                                        value={watchPricingSalePrice}
                                                        onChange={(e) =>
                                                            setValue("pricingSalePrice", parseFloat(e.target.value) || 0)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            {/* Series selection */}
                                            <div>
                                                <Label>Assign to Series</Label>
                                                {seriesList.length === 0 ? (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        No series found.
                                                    </p>
                                                ) : (
                                                    <div className="mt-1 grid max-h-32 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-2 text-xs dark:border-gray-700">
                                                        {seriesList.map((s) => {
                                                            const selected = watchSelectedSeriesIds?.includes(s._id);
                                                            return (
                                                                <label
                                                                    key={s._id}
                                                                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                                >
                                                                    <span className="text-gray-700 dark:text-gray-200">
                                                                        {s.title}
                                                                    </span>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        onChange={(e) => {
                                                                            const current = watchSelectedSeriesIds || [];
                                                                            if (e.target.checked) {
                                                                                setValue("selectedSeriesIds", [
                                                                                    ...current,
                                                                                    s._id,
                                                                                ]);
                                                                            } else {
                                                                                setValue(
                                                                                    "selectedSeriesIds",
                                                                                    current.filter((id) => id !== s._id)
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div className="sticky bottom-0 mt-2 flex justify-end gap-2 border-t border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-gray-900">
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={closeDrawer}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={saving} isLoading={saving}>
                                                {editingId ? "Save Changes" : "Create Test"}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {questionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeQuestionModal}
                    />
                    {/* card */}
                    <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Select Questions for Section
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Only questions from this exam & section are shown.
                                </p>
                            </div>
                            <button
                                onClick={closeQuestionModal}
                                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Search bar */}
                        <div className="mb-3 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={questionModalSearch}
                                    onChange={(e) => setQuestionModalSearch(e.target.value)}
                                    placeholder="Search question text"
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    if (questionModalSectionIndex !== null) {
                                        openQuestionModalForSection(questionModalSectionIndex);
                                    }
                                }}
                                isLoading={questionModalLoading}
                                className="rounded-xl px-3 py-1 text-xs"
                            >
                                Refresh
                            </Button>
                        </div>

                        {/* Select all row */}
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={allQuestionsSelected}
                                    // You can manually mimic indeterminate, or just ignore it:
                                    onChange={handleToggleSelectAllQuestions}
                                />
                                <span>
                                    {allQuestionsSelected
                                        ? "Unselect all questions"
                                        : "Select all questions on this list"}
                                </span>
                            </label>
                            {someQuestionsSelected && !allQuestionsSelected && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {questionModalSelectedIds.length} selected
                                </span>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
                            {questionModalLoading ? (
                                <div className="flex items-center justify-center py-8 text-xs text-gray-500 dark:text-gray-400">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading questions...
                                </div>
                            ) : questionModalList.length === 0 ? (
                                <div className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                                    No questions found for this exam + section.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200 text-xs dark:divide-gray-800">
                                    {questionModalList.map((q) => {
                                        const selected = questionModalSelectedIds.includes(q._id);
                                        return (
                                            <li
                                                key={q._id}
                                                className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                                onClick={() => toggleQuestionSelection(q._id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    readOnly
                                                    className="mt-1 h-3 w-3"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                                        {q.questionText}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                                                        {q.questionType} • {q.difficulty}
                                                    </p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">
                                Selected:{" "}
                                <span className="font-semibold">
                                    {questionModalSelectedIds.length}
                                </span>
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={closeQuestionModal}
                                    className="rounded-xl px-3 py-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={applyQuestionSelectionToSection}
                                    className="rounded-xl px-3 py-1"
                                >
                                    Apply to Section
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}