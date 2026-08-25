// TestTemplateManagementPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
    Play,
    Clock,
    HelpCircle,
    Layers,
    ChevronDown,
    ArrowUpDown,
    AlertCircle,
    CheckCircle2,
    XCircle,
    BarChart3,
    Timer,
    Hash,
    Bookmark,
    Star,
    Zap,
    Target,
    Layout,
    Grid3X3,
    List,
    Eye,
    Copy,
    MoreHorizontal,
    Link2,
    LucideLink2,
    ArrowUpRight,
} from "lucide-react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./DropDown";

// Types (keep existing interfaces)
interface Exam {
    _id: string;
    name: string;
    sections?: any[];
}
interface Section {
    _id: string;
    name: string;
    duration?: number;
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
    randomQuestionTypes?: string;
    randomDifficulties?: string;
    randomTags?: string;
    questionIds?: string[];
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
    isActive?: boolean;
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
    series?: any[];
}
interface TestTemplateFormValues {
    title: string;
    description: string;
    exam: string;
    testType: "full_length" | "sectional" | "quiz";
    difficultyLabel: "Easy" | "Medium" | "Hard" | "Mixed";
    sections: SectionInTestForm[];
    quizMode: "single_type" | "mixed_types";
    quizAllowedTypesInput: string;
    quizDifficultiesInput: string;
    quizTagsInput: string;
    quizTotalQuestions: number;
    quizDurationMinutes: number;
    pricingIsSellable: boolean;
    pricingIsFree: boolean;
    pricingSeriesOnly: boolean;
    pricingPrice: number;
    pricingSalePrice?: number;
    selectedSeriesIds: string[];
    isActive: boolean;
}

const TEST_TYPE_OPTIONS = [
    { value: "full_length", label: "Full Length", icon: BookOpen },
    { value: "sectional", label: "Sectional", icon: Layout },
    { value: "quiz", label: "Quiz", icon: Zap },
];

const DIFFICULTY_LABEL_OPTIONS = [
    { value: "Easy", label: "Easy", color: "green" },
    { value: "Medium", label: "Medium", color: "yellow" },
    { value: "Hard", label: "Hard", color: "red" },
    { value: "Mixed", label: "Mixed", color: "blue" },
];

const LIMIT_OPTIONS = [
    { value: 12, label: "12" },
    { value: 24, label: "24" },
    { value: 48, label: "48" },
];

export default function TestTemplateManagementPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [seriesList, setSeriesList] = useState<Series[]>([]);
    const [tests, setTests] = useState<TestTemplateListItem[]>([]);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filters, setFilters] = useState({
        search: "",
        examId: "all",
        testType: "all",
        difficultyLabel: "all",
        isFree: "all",
        isActive: "all",
    });
    const [showFilters, setShowFilters] = useState(true);
    const [questionModalOpen, setQuestionModalOpen] = useState(false);
    const [questionModalSectionIndex, setQuestionModalSectionIndex] = useState<number | null>(null);
    const [questionModalLoading, setQuestionModalLoading] = useState(false);
    const [questionModalList, setQuestionModalList] = useState<QuestionSummary[]>([]);
    const [questionModalSelectedIds, setQuestionModalSelectedIds] = useState<string[]>([]);
    const [questionModalSearch, setQuestionModalSearch] = useState("");

    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTests, setTotalTests] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sideOpen, setSideOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedTests, setSelectedTests] = useState<string[]>([]);

    const allQuestionsSelected =
        questionModalList.length > 0 &&
        questionModalSelectedIds.length === questionModalList.length;

    const someQuestionsSelected =
        questionModalSelectedIds.length > 0 &&
        questionModalSelectedIds.length < questionModalList.length;

    const handleToggleSelectAllQuestions = () => {
        if (allQuestionsSelected) {
            setQuestionModalSelectedIds([]);
        } else {
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
            isActive: true,
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
    const watchIsActive = watch("isActive");

    // Fetch functions
    const fetchExams = async () => {
        try {
            const res = await api.get("/test/exams", { params: { isActive: true, limit: 200 } });
            if (res.data?.success) {
                setExams(res.data.data || res.data?.data?.data || []);
            }
        } catch (err: any) {
            console.error("Fetch exams error:", err);
            toast.error("Failed to load exams");
        }
    };

    // const fetchSeries = async () => {
    //     try {
    //         const res = await api.get("/mcu/test", { params: { isActive: true, limit: 200 } });
    //         if (res.data?.success) {
    //             setSeriesList(res.data.data || res.data?.data?.data || []);
    //         }
    //     } catch (err: any) {
    //         console.error("Fetch series error:", err);
    //     }
    // };

    useEffect(() => {
        fetchExams();
        // fetchSeries();
    }, []);

    useEffect(() => {
        if (watchExam) {
            const exam = exams.find((e) => e._id === watchExam);
            setSections(exam?.sections || []);
            sectionFields.forEach((_, index) => {
                setValue(`sections.${index}.sectionId`, "");
            });
        } else {
            setSections([]);
        }
    }, [watchExam, exams]);

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
    }, [page, limit, debouncedSearch, filters]);

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

    const activeFilterCount = Object.entries(filters).filter(
        ([key, value]) => key !== "search" && value !== "all"
    ).length;

    // Question Modal
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

    const toggleQuestionSelection = (id: string) => {
        setQuestionModalSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const applyQuestionSelectionToSection = () => {
        if (questionModalSectionIndex === null) return;
        setValue(
            `sections.${questionModalSectionIndex}.questionIds` as const,
            questionModalSelectedIds
        );
        setValue(
            `sections.${questionModalSectionIndex}.questionCount` as const,
            questionModalSelectedIds.length
        );
        closeQuestionModal();
    };

    // Drawer functions
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
            isActive: true,
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

            await new Promise((resolve) => setTimeout(resolve, 1500));

            const mappedSections = test.sections && test.sections.length
                ? test.sections.map((s: any, index: number) => ({
                    sectionId: s.section?._id || s.section?.toString() || "",
                    customName: s.customName || "",
                    order: s.order || index + 1,
                    durationMinutes: s.durationMinutes || 0,
                    questionCount: s.questionCount || s.randomConfig?.questionCount || 0,
                    selectionMode: s.selectionMode || "fixed",
                    randomQuestionCount: s.randomConfig?.questionCount || 0,
                    randomQuestionTypes: Array.isArray(s.randomConfig?.questionTypes)
                        ? s.randomConfig.questionTypes.join(", ")
                        : "",
                    randomDifficulties: Array.isArray(s.randomConfig?.difficulties)
                        ? s.randomConfig.difficulties.join(", ")
                        : "",
                    randomTags: Array.isArray(s.randomConfig?.tags)
                        ? s.randomConfig.tags.join(", ")
                        : "",
                    questionIds: s.questions?.map((q: any) => q._id || q) || [],
                }))
                : [{
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
                }];

            reset({
                title: test.title || "",
                description: test.description || "",
                exam: test.exam?._id || "",
                testType: test.testType || "full_length",
                difficultyLabel: test.difficultyLabel || "Mixed",
                sections: mappedSections,
                quizMode: test.quizConfig?.mode || "single_type",
                quizAllowedTypesInput: Array.isArray(test.quizConfig?.allowedQuestionTypes)
                    ? test.quizConfig.allowedQuestionTypes.join(", ")
                    : "",
                quizDifficultiesInput: Array.isArray(test.quizConfig?.difficulties)
                    ? test.quizConfig.difficulties.join(", ")
                    : "",
                quizTagsInput: Array.isArray(test.quizConfig?.tags)
                    ? test.quizConfig.tags.join(", ")
                    : "",
                quizTotalQuestions: test.quizConfig?.totalQuestions || 10,
                quizDurationMinutes: test.quizConfig?.durationMinutes || 30,
                pricingIsSellable: test.pricing?.isSellable ?? true,
                pricingIsFree: test.pricing?.isFree ?? false,
                pricingSeriesOnly: test.pricing?.seriesOnly ?? false,
                pricingPrice: test.pricing?.price ?? 0,
                pricingSalePrice: test.pricing?.salePrice ?? 0,
                selectedSeriesIds: (test.seriesDocs || test.series || []).map(
                    (s: any) => s._id || s
                ),
                isActive: test.isActive ?? true,
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

    const navigate = useNavigate();

    const formatDate = (iso?: string) =>
        iso ? new Date(iso).toLocaleDateString("en-IN", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : "";

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
                    (s) => !s.sectionId
                );
                if (invalidSection) {
                    toast.error("Each section must have a section selected");
                    return;
                }
            }

            setSaving(true);

            // Build sections payload
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
                        base.questions = s.questionIds || [];
                        base.questionCount = (s.questionIds || []).length;
                    } else {
                        base.randomConfig = {
                            questionCount: Number(s.randomQuestionCount) || 0,
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
                        ? values.quizAllowedTypesInput.split(",").map((x) => x.trim()).filter(Boolean)
                        : [],
                    difficulties: values.quizDifficultiesInput
                        ? values.quizDifficultiesInput.split(",").map((x) => x.trim()).filter(Boolean)
                        : [],
                    tags: values.quizTagsInput
                        ? values.quizTagsInput.split(",").map((x) => x.trim()).filter(Boolean)
                        : [],
                    totalQuestions: Number(values.quizTotalQuestions) || 0,
                    durationMinutes: Number(values.quizDurationMinutes) || 0,
                };
            }

            const pricing = {
                isSellable: values.pricingIsSellable,
                isFree: values.pricingIsFree,
                seriesOnly: values.pricingSeriesOnly,
                price: Number(values.pricingPrice) || 0,
                salePrice: values.pricingSalePrice ? Number(values.pricingSalePrice) : undefined,
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
                isActive: values.isActive,
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
        if (!window.confirm(`Delete test "${test.title}"? This action cannot be undone.`)) return;
        try {
            await api.delete(`/mcu/test/${test._id}`);
            toast.success("Test deleted successfully");
            fetchTests();
        } catch (err: any) {
            console.error("Delete test error:", err);
            toast.error(err.response?.data?.message || "Failed to delete test");
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedTests.length} selected tests?`)) return;
        try {
            await Promise.all(selectedTests.map(id => api.delete(`/mcu/test/${id}`)));
            toast.success(`${selectedTests.length} tests deleted`);
            setSelectedTests([]);
            fetchTests();
        } catch (err: any) {
            toast.error("Failed to delete some tests");
        }
    };

    const getDifficultyColor = (label: string) => {
        switch (label) {
            case "Easy": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
            case "Medium": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
            case "Hard": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
            case "Mixed": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    const getTestTypeIcon = (type: string) => {
        switch (type) {
            case "full_length": return BookOpen;
            case "sectional": return Layout;
            case "quiz": return Zap;
            default: return HelpCircle;
        }
    };

    const priceLabel = (t: TestTemplateListItem) => {
        if (t.isFree) return { label: "Free", color: "text-emerald-600 dark:text-emerald-400" };
        if (t.seriesOnly && !t.isSellable) return { label: "Series Only", color: "text-purple-600 dark:text-purple-400" };
        if (typeof t.salePrice === "number" && t.salePrice > 0) {
            return {
                label: `₹${t.salePrice}`,
                color: "text-orange-600 dark:text-orange-400",
                original: t.price ? `₹${t.price}` : undefined
            };
        }
        if (typeof t.price === "number" && t.price > 0) {
            return { label: `₹${t.price}`, color: "text-blue-600 dark:text-blue-400" };
        }
        return { label: "N/A", color: "text-gray-500" };
    };

    const isQuiz = watchTestType === "quiz";
    const disabledPrice = watchIsFree || (!watchIsSellable && !watchSeriesOnly);

    return (
        <div className="min-h-screen p-4">

            <div className="mb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            Test Templates
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage and organize your test templates
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedTests.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedTests.length})
                            </Button>
                        )}
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`rounded-md p-2 ${viewMode === "grid" ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "text-gray-500"}`}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`rounded-md p-2 ${viewMode === "list" ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400" : "text-gray-500"}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                        <Button onClick={openCreateDrawer}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Test
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mb-3 rounded-2xl bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="border-b border-gray-100 p-4 dark:border-gray-800">
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
                            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search tests..."
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
                            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Exam
                                    </label>
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
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Test Type
                                    </label>
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
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Difficulty
                                    </label>
                                    <Select
                                        defaultValue={filters.difficultyLabel}
                                        options={[
                                            { value: "all", label: "All Difficulties" },
                                            ...DIFFICULTY_LABEL_OPTIONS,
                                        ]}
                                        onChange={(value: string) => {
                                            setFilters((prev) => ({ ...prev, difficultyLabel: value }));
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Pricing
                                    </label>
                                    <Select
                                        defaultValue={filters.isFree}
                                        options={[
                                            { value: "all", label: "All" },
                                            { value: "true", label: "Free" },
                                            { value: "false", label: "Paid" },
                                        ]}
                                        onChange={(value: string) => {
                                            setFilters((prev) => ({ ...prev, isFree: value }));
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Status
                                    </label>
                                    <Select
                                        defaultValue={filters.isActive}
                                        options={[
                                            { value: "all", label: "All Status" },
                                            { value: "true", label: "Active" },
                                            { value: "false", label: "Inactive" },
                                        ]}
                                        onChange={(value: string) => {
                                            setFilters((prev) => ({ ...prev, isActive: value }));
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!loading && !error && (
                <div className="mb-3 flex items-center justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{tests.length}</span> of{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{totalTests}</span> tests
                        {filters.search && (
                            <span className="ml-2">
                                for "<span className="font-medium">{filters.search}</span>"
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Limit:</span>
                        <Select
                            defaultValue={limit.toString()}
                            options={LIMIT_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                            onChange={(value: string) => {
                                setLimit(Number(value));
                                setPage(1);
                            }}
                            className="!w-fit"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading tests...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-2xl p-8 text-center">
                    <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={fetchTests}>
                        Try Again
                    </Button>
                </div>
            ) : tests.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tests found</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {filters.search || activeFilterCount > 0
                            ? "Try adjusting your filters or search terms"
                            : "Get started by creating your first test template"}
                    </p>
                    {!filters.search && activeFilterCount === 0 && (
                        <Button className="mt-6" onClick={openCreateDrawer}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Test
                        </Button>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                /* Enhanced Grid View */
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence>
                        {tests.map((t) => {
                            const TestTypeIcon = getTestTypeIcon(t.testType);
                            const price = priceLabel(t);

                            return (
                                <motion.div
                                    key={t._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className={`group relative border rounded-2xl bg-white p-4 transition-all hover:shadow-lg dark:bg-gray-900 cursor-pointer ${selectedTests.includes(t._id)
                                        ? "border-blue-500 ring-2 ring-blue-500/20"
                                        : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                                        }`}
                                    onClick={() => {
                                        setSelectedTests(prev =>
                                            prev.includes(t._id)
                                                ? prev.filter(id => id !== t._id)
                                                : [...prev, t._id]
                                        );
                                    }}
                                >
                                    {/* Selection indicator */}
                                    <div className="absolute right-2 top-2">
                                        <div className={`h-5 w-5 rounded-full border-2 transition-colors ${selectedTests.includes(t._id)
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300 dark:border-gray-600"
                                            }`}>
                                            {selectedTests.includes(t._id) && (
                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Header */}
                                    <div className="mb-3 mt-3 flex items-start gap-3">

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                                                {t.title}
                                            </h3>
                                            <p className="mt-px text-xs text-gray-500 dark:text-gray-400">
                                                {t.exam?.name || "Unknown Exam"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mb-3 grid grid-cols-2 gap-2">
                                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Hash className="h-3 w-3" />
                                                Questions
                                            </div>
                                            <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                {t.totalQuestions || 0}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Timer className="h-3 w-3" />
                                                Duration
                                            </div>
                                            <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                                                {t.totalDurationMinutes || 0}m
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${getDifficultyColor(t.difficultyLabel)}`}>
                                            {t.difficultyLabel}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            <Layers className="h-3 w-3" />
                                            {t.sectionCount || 1} {t.sectionCount === 1 ? 'Section' : 'Sections'}
                                        </span>
                                    </div>

                                    {/* Price and Actions */}
                                    <div className="flex items-center justify-between dark:border-gray-800">
                                        <div className="flex items-center gap-2">
                                            <IndianRupee className={`h-4 w-4 ${price.color}`} />
                                            <span className={`text-sm font-semibold ${price.color}`}>
                                                {price.label}
                                            </span>
                                            {price.original && (
                                                <span className="text-xs text-gray-400 line-through">
                                                    {price.original}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                                onClick={() => { if (t.exam?.name.toLowerCase().includes("gmat")) { navigate(`/gmat/tests/${t._id}`, { replace: true }) } else if (t.exam?.name.toLowerCase().includes("pte")) { navigate(`/pte/tests/${t._id}`, { replace: true }) } else if (t.exam?.name.toLowerCase().includes("gre")) { navigate(`/gre/tests/${t._id}`, { replace: true }) } else navigate(`/mcq/tests/${t._id}`, { replace: true }) }}
                                            >
                                                <ArrowUpRight className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditDrawer(t._id);
                                                }}
                                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                            >
                                                <Edit3 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(t);
                                                }}
                                                className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="rounded-xl dark:bg-gray-800 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 text-left dark:border-gray-800">
                                    <th className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedTests.length === tests.length}
                                            onChange={() => {
                                                if (selectedTests.length === tests.length) {
                                                    setSelectedTests([]);
                                                } else {
                                                    setSelectedTests(tests.map(t => t._id));
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Test Name</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Exam</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Difficulty</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Questions</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Duration</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="p-4 text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {tests.map((t) => {
                                    const TestTypeIcon = getTestTypeIcon(t.testType);
                                    const price = priceLabel(t);

                                    return (
                                        <tr
                                            key={t._id}
                                            className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedTests.includes(t._id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                                }`}
                                        >
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTests.includes(t._id)}
                                                    onChange={() => {
                                                        setSelectedTests(prev =>
                                                            prev.includes(t._id)
                                                                ? prev.filter(id => id !== t._id)
                                                                : [...prev, t._id]
                                                        );
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {t.title}
                                                        </p>
                                                        
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {t.exam?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                    {TEST_TYPE_OPTIONS.find(x => x.value === t.testType)?.label || t.testType}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getDifficultyColor(t.difficultyLabel)}`}>
                                                    {t.difficultyLabel}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                {t.totalQuestions || 0}
                                            </td>
                                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                                {t.totalDurationMinutes || 0}m
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <IndianRupee className={`h-3.5 w-3.5 ${price.color}`} />
                                                    <span className={`text-sm font-medium ${price.color}`}>
                                                        {price.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}>
                                                    {t.isActive ? (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    ) : (
                                                        <XCircle className="h-3 w-3" />
                                                    )}
                                                    {t.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditDrawer(t._id)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem
                                                                onClick={() => navigate(`/mcq/tests/${t._id}`)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Preview
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    openCreateDrawer();
                                                                    // Clone logic here
                                                                }}
                                                            >
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Duplicate
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Enhanced Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="flex items-center gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (page <= 3) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
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
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="flex items-center gap-1"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Enhanced Drawer */}
            <AnimatePresence>
                {sideOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]"
                            onClick={saving ? undefined : closeDrawer}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.div
                            className="relative ml-auto rounded-4xl overflow-hidden flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl dark:bg-gray-900"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between border-b bg-gray-100 border-gray-200 px-6 py-3 dark:border-gray-800">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {editingId ? "Edit Test Template" : "Create New Test Template"}
                                    </h2>
                                    <p className=" text-xs text-gray-500 dark:text-gray-400">
                                        {editingId ? "Update your test configuration" : "Configure your new test template"}
                                    </p>
                                </div>
                                <button
                                    onClick={saving ? undefined : closeDrawer}
                                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {formLoading ? (
                                <div className="flex flex-1 items-center justify-center">
                                    <div className="text-center">
                                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Loading test details...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="flex-1 overflow-y-auto"
                                >
                                    <div className="space-y-6 p-6">
                                        {/* Basic Info Section */}
                                        <div className="rounded-2xl border bg-gray-50 border-gray-200 p-5 dark:border-gray-800">
                                            <div className="mb-4 flex items-center gap-2">
                                               
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    Basic Information
                                                </h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>Title *</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g., GMAT Full Length Test 01"
                                                        value={watchTitle}
                                                        onChange={(e) => setValue("title", e.target.value)}
                                                        error={!!errors.title}
                                                        hint={errors.title?.message}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Description</Label>
                                                    <textarea
                                                        value={watchDescription}
                                                        onChange={(e) => setValue("description", e.target.value)}
                                                        placeholder="Brief description of this test..."
                                                        rows={3}
                                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                                    />
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-3">
                                                    <div>
                                                        <Label>Exam *</Label>
                                                        <Select
                                                            defaultValue={watch("exam")}
                                                            options={[
                                                                { value: "", label: "Select exam" },
                                                                ...exams.map((e) => ({ value: e._id, label: e.name })),
                                                            ]}
                                                            onChange={(value: string) => setValue("exam", value)}
                                                        />
                                                        {errors.exam && (
                                                            <p className="mt-1 text-xs text-red-500">Exam is required</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label>Test Type</Label>
                                                        <Select
                                                            defaultValue={watchTestType}
                                                            options={TEST_TYPE_OPTIONS}
                                                            onChange={(value: any) =>
                                                                setValue("testType", value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Difficulty Label</Label>
                                                        <Select
                                                            defaultValue={watch("difficultyLabel")}
                                                            options={DIFFICULTY_LABEL_OPTIONS}
                                                            onChange={(value: any) =>
                                                                setValue("difficultyLabel", value)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label>Status</Label>
                                                    <div className="flex items-center gap-2">
                                                        <label className="relative inline-flex cursor-pointer items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={watchIsActive}
                                                                onChange={(e) => setValue("isActive", e.target.checked)}
                                                                className="peer sr-only"
                                                            />
                                                            <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                                                        </label>
                                                        <span className="text-sm text-gray-700 dark:text-gray-200">
                                                            {watchIsActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sections Builder (for full/sectional) */}
                                        {!isQuiz && (
                                            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                            Sections
                                                        </h3>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
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
                                                                questionIds: [],
                                                            })
                                                        }
                                                    >
                                                        <Plus className="mr-1 h-4 w-4" />
                                                        Add Section
                                                    </Button>
                                                </div>

                                                {sectionFields.length === 0 ? (
                                                    <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
                                                        <Layers className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            No sections added yet. Click "Add Section" to begin.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {sectionFields.map((field, index) => {
                                                            const selectionMode = watch(
                                                                `sections.${index}.selectionMode` as const
                                                            ) as "fixed" | "random";

                                                            return (
                                                                <motion.div
                                                                    key={field.id}
                                                                    layout
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -20 }}
                                                                    transition={{ duration: 0.3 }}
                                                                    className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                                                                >
                                                                    <div className="mb-3 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                                                {index + 1}
                                                                            </span>
                                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                                Section
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => remove(index)}
                                                                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>

                                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                                        <div>
                                                                            <Label>Section *</Label>
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
                                                                                onChange={(value: string) => {
                                                                                    setValue(
                                                                                        `sections.${index}.sectionId` as const,
                                                                                        value
                                                                                    );
                                                                                    // Auto-fill duration from section
                                                                                    const section = sections.find(s => s._id === value);
                                                                                    if (section?.duration) {
                                                                                        setValue(
                                                                                            `sections.${index}.durationMinutes` as const,
                                                                                            Math.round(section.duration / 60)
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Custom Name</Label>
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="Optional display name"
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

                                                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                                                        <div>
                                                                            <Label>Order</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={watch(`sections.${index}.order` as const)}
                                                                                onChange={(e) =>
                                                                                    setValue(
                                                                                        `sections.${index}.order` as const,
                                                                                        parseInt(e.target.value) || 1
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Duration (mins)</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={watch(`sections.${index}.durationMinutes` as const)}
                                                                                onChange={(e) =>
                                                                                    setValue(
                                                                                        `sections.${index}.durationMinutes` as const,
                                                                                        parseInt(e.target.value) || 0
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Question Selection</Label>
                                                                            <Select
                                                                                defaultValue={selectionMode}
                                                                                options={[
                                                                                    { value: "fixed", label: "Fixed Questions" },
                                                                                    { value: "random", label: "Random Pool" },
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
                                                                        <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                                                                            <div className="flex items-center justify-between">
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                                        Selected Questions
                                                                                    </p>
                                                                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                                                        {(watch(`sections.${index}.questionIds` as const) || []).length} questions selected
                                                                                    </p>
                                                                                </div>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        openQuestionModalForSection(index);
                                                                                    }}
                                                                                >
                                                                                    <Search className="mr-1 h-3 w-3" />
                                                                                    Browse Questions
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
                                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                                Random Pool Configuration
                                                                            </p>
                                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                                <div>
                                                                                    <Label>Number of Questions</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={watch(`sections.${index}.randomQuestionCount` as const)}
                                                                                        onChange={(e) =>
                                                                                            setValue(
                                                                                                `sections.${index}.randomQuestionCount` as const,
                                                                                                parseInt(e.target.value) || 0
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Question Types</Label>
                                                                                    <Input
                                                                                        type="text"
                                                                                        placeholder="gmat_quant_ps, gmat_verbal_rc"
                                                                                        value={watch(`sections.${index}.randomQuestionTypes` as const)}
                                                                                        onChange={(e) =>
                                                                                            setValue(
                                                                                                `sections.${index}.randomQuestionTypes` as const,
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Difficulties</Label>
                                                                                    <Input
                                                                                        type="text"
                                                                                        placeholder="Easy, Medium, Hard"
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
                                                                                        placeholder="algebra, geometry"
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
                                                                            <p className="text-xs text-gray-400">
                                                                                Use comma-separated values. Leave empty to include all.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Quiz Config */}
                                        {isQuiz && (
                                            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                        Quiz Configuration
                                                    </h3>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <Label>Mode</Label>
                                                        <Select
                                                            defaultValue={watchQuizMode}
                                                            options={[
                                                                { value: "single_type", label: "Single Question Type" },
                                                                { value: "mixed_types", label: "Mixed Question Types" },
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
                                                                setValue("quizTotalQuestions", parseInt(e.target.value) || 0)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Duration (minutes)</Label>
                                                        <Input
                                                            type="number"
                                                            value={watchQuizDurationMinutes}
                                                            onChange={(e) =>
                                                                setValue("quizDurationMinutes", parseInt(e.target.value) || 0)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Allowed Question Types</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="gmat_verbal_sc, gmat_verbal_rc"
                                                            value={watchQuizAllowedTypesInput}
                                                            onChange={(e) =>
                                                                setValue("quizAllowedTypesInput", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Difficulties</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="Easy, Medium"
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
                                                            placeholder="reading, algebra"
                                                            value={watchQuizTagsInput}
                                                            onChange={(e) =>
                                                                setValue("quizTagsInput", e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pricing Section */}
                                        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                                            <div className="mb-4 flex items-center gap-2">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    Pricing
                                                </h3>
                                            </div>
                                            <div className="mb-4 flex flex-wrap gap-4">
                                                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={watchPricingIsSellable}
                                                        onChange={(e) => setValue("pricingIsSellable", e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-200">Sellable Individually</span>
                                                </label>
                                                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={watchPricingIsFree}
                                                        onChange={(e) => setValue("pricingIsFree", e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-200">Free Test</span>
                                                </label>
                                                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
                                                    <input
                                                        type="checkbox"
                                                        checked={watchPricingSeriesOnly}
                                                        onChange={(e) => setValue("pricingSeriesOnly", e.target.checked)}
                                                        className="rounded"
                                                    />
                                                    <span className="text-gray-700 dark:text-gray-200">Series Only</span>
                                                </label>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <Label>Price (INR)</Label>
                                                    <Input
                                                        type="number"
                                                        disabled={disabledPrice}
                                                        value={watchPricingPrice}
                                                        onChange={(e) =>
                                                            setValue("pricingPrice", parseFloat(e.target.value) || 0)
                                                        }
                                                        placeholder="0"
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
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Drawer Footer */}
                                    <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
                                        <div className="flex items-center justify-end gap-3">
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={closeDrawer}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={saving}
                                                isLoading={saving}
                                            >
                                                {editingId ? "Save Changes" : "Create Test"}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Question Selection Modal */}
            <AnimatePresence>
                {questionModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={closeQuestionModal}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.div
                            className="relative z-10 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="border-b border-gray-200 p-5 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Select Questions
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Choose questions for this section
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeQuestionModal}
                                        className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={questionModalSearch}
                                            onChange={(e) => setQuestionModalSearch(e.target.value)}
                                            placeholder="Search questions..."
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            if (questionModalSectionIndex !== null) {
                                                openQuestionModalForSection(questionModalSectionIndex);
                                            }
                                        }}
                                        isLoading={questionModalLoading}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                <div className="mb-3 flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={allQuestionsSelected}
                                            onChange={handleToggleSelectAllQuestions}
                                            className="rounded"
                                        />
                                        <span className="text-gray-700 dark:text-gray-200">
                                            {allQuestionsSelected ? "Deselect All" : "Select All"}
                                        </span>
                                    </label>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {questionModalSelectedIds.length} selected
                                    </span>
                                </div>

                                <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
                                    {questionModalLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                        </div>
                                    ) : questionModalList.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <HelpCircle className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                No questions found
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {questionModalList.map((q) => {
                                                const selected = questionModalSelectedIds.includes(q._id);
                                                return (
                                                    <div
                                                        key={q._id}
                                                        className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                                            }`}
                                                        onClick={() => toggleQuestionSelection(q._id)}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected}
                                                                readOnly
                                                                className="mt-1 rounded"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-900 dark:text-white line-clamp-2"
                                                                    dangerouslySetInnerHTML={{ __html: q.questionText }}
                                                                />
                                                                <div className="mt-1 flex items-center gap-2">
                                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                                        {q.questionType}
                                                                    </span>
                                                                    <span className={`rounded-full px-2 py-0.5 text-xs ${getDifficultyColor(q.difficulty)}`}>
                                                                        {q.difficulty}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 p-5 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {questionModalSelectedIds.length} questions selected
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeQuestionModal}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={applyQuestionSelectionToSection}
                                        >
                                            Apply Selection
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}