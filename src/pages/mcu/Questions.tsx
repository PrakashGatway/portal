// QuestionManagementPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  SlidersHorizontal,
  Tag,
  HelpCircle,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField"; // Ensure path is correct
import Label from "../../components/form/Label"; // Ensure path is correct
import Select from "../../components/form/Select"; // Ensure path is correct
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { GMATDataInsightsBlock } from "./DiBlock";
import RichTextEditor from "../../components/TextEditor";

interface Exam {
  _id: string;
  name: string;
  sections?: Section[]; // Assuming sections are embedded in exam data
}

interface Section {
  _id: string;
  name: string;
}

interface Option {
  _id?: string;
  label?: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  _id: string;
  exam: { _id: string; name: string };
  section: { _id: string; name: string };
  questionType: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags?: string[];
  stimulus?: string;
  questionText: string;
  options?: Option[];
  correctAnswerText?: string;
  marks?: number;
  negativeMarks?: number;
  explanation?: string;
  source?: string;
  createdAt?: string;
}

interface QuestionFormValues {
  exam: string;
  section: string;
  questionType: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string; // comma separated for UI
  stimulus: string;
  questionText: string;
  options: Option[];
  correctAnswerText: string;
  marks: number;
  negativeMarks: number;
  explanation: string;
  source: string;
}

const QUESTION_TYPE_OPTIONS = [
  { value: "gmat_quant_problem_solving", label: "GMAT – Quant Problem Solving" },
  { value: "gmat_quant_data_sufficiency", label: "GMAT – Quant Data Sufficiency" },
  { value: "gmat_verbal_sc", label: "GMAT – Sentence Correction" },
  { value: "gmat_verbal_cr", label: "GMAT – Critical Reasoning" },
  { value: "gmat_verbal_rc", label: "GMAT – Reading Comprehension" },
  { value: "gmat_data_insights", label: "GMAT – Data Insights" },
  { value: "gre_analytical_writing", label: "GRE – Analytical Writing" },
  { value: "gre_verbal_text_completion", label: "GRE – Text Completion" },
  { value: "gre_verbal_sentence_equivalence", label: "GRE – Sentence Equivalence" },
  { value: "gre_verbal_reading_comp", label: "GRE – Reading Comprehension" },
  { value: "gre_verbal_reading_multi", label: "GRE – Reading Comprehension (Multiple Choice)" },
  { value: "gre_quantitative", label: "GRE – Quantitative" },
  { value: "gre_quantitative_multi", label: "GRE – Quantitative (Multiple Choice)" },
  { value: "gre_quantitative_value", label: "GRE – Quantitative (Value)" },
  { value: "sat_reading_writing", label: "SAT – Reading & Writing" },
  { value: "sat_math_calculator", label: "SAT – Math (Calculator)" },
  { value: "sat_math_no_calculator", label: "SAT – Math (No Calculator)" },
  { value: "read_aloud", label: "PTE-Read Aloud" },
  { value: "repeat_sentence", label: "PTE-Repeat Sentence" },
  { value: "describe_image", label: "PTE-Describe Image" },
  { value: "retell_lesson", label: "PTE-Retell Lesson" },
  { value: "short_answer", label: "PTE-Short Answer" },
  { value: "summarize_group_discussions", label: "Summarize Group Discussions" },
  { value: "pte_summarize_writing", label: "PTE-Summarize Writing" },
  { value: "pte_situational", label: "PTE-Situational" },
  { value: "pte_writing", label: "PTE-Writing" },
  { value: "pte_fill_in_blanks", label: "PTE-Fill in the Blanks" },
  { value: "pte_mcq_multiple", label: "PTE-MCQ (Multiple Choice)" },
  { value: "pte_reorder", label: "PTE-Reorder" },
  { value: "pte_fill_drag", label: "PTE-Fill and Drag" },
  { value: "pte_mcq_single", label: "PTE-MCQ (Single Choice)" },
  { value: "pte_summarize_spoken", label: "PTE-Summarize Spoken" },
  { value: "pte_mcq_multiple_listening", label: "PTE-MCQ (Multiple Choice) listening" },
  { value: "pte_fill_listening", label: "PTE-Fill listening" },
  { value: "pte_highlight", label: "PTE-Highlight" },
  { value: "pte_mcq_single_listening", label: "PTE-MCQ (Single Choice) listening" },
  { value: "pte_summarize_listening", label: "PTE-Summarize listening" },
  { value: "pte_writing_listening", label: "PTE-Writing listening" },
  { value: "essay", label: "Essay / Long Answer" },
  { value: "other", label: "Other" },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10 per page" },
  { value: 20, label: "20 per page" },
  { value: 50, label: "50 per page" },
  { value: 100, label: "100 per page" },
];

const isPTEType = (questionType: string) => {
  return questionType && ["repeat_sentence", "retell_lesson","summarize_group_discussions","pte_summarize_listening","pte_summarize_spoken"].includes(questionType);
};

const isNewFeild = (questionType: string) => {
  return questionType && ["pte_situational","pte_reorder","pte_highlight","pte_summarize_listening","pte_mcq_single_listening","pte_fill_listening","pte_fill_drag","pte_mcq_multiple_listening","pte_fill_in_blanks"].includes(questionType);
};

const isMCQType = (questionType: string) => {
  return questionType && !["essay", "other","pte_reorder","pte_fill_listening","pte_summarize_listening","pte_highlight","pte_summarize_spoken","pte_fill_drag","pte_situational","pte_fill_in_blanks","pte_summarize_writing", "retell_lesson", "describe_image", "sat_value", "repeat_sentence", "read_aloud", "gre_analytical_writing", "gre_quantitative_value", "gre_verbal_text_completion"].includes(questionType);
};

export default function QuestionManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    examId: "all",
    sectionId: "all",
    questionType: "all",
    difficulty: "all",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null); // Use NodeJS.Timeout for setTimeout
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // State for limit
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    defaultValues: {
      exam: "",
      section: "",
      questionType: "",
      difficulty: "Medium",
      tags: "",
      stimulus: "",
      questionText: "",
      options: [
      ],
      correctAnswerText: "",
      marks: 1,
      negativeMarks: 0,
      explanation: "",
      source: "",
    },
  });

  const { fields: optionFields, append, remove } = useFieldArray({
    control,
    name: "options",
  });


  const watchQuestionType = watch("questionType");
  const watchExam = watch("exam");
  const watchTags = watch("tags");
  const watchStimulus = watch("stimulus");
  const watchQuestionText = watch("questionText");
  const watchCorrectAnswerText = watch("correctAnswerText");
  const watchMarks = watch("marks");
  const watchNegativeMarks = watch("negativeMarks");
  const watchExplanation = watch("explanation");
  const watchSource = watch("source");

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const res = await api.get("/test/exams", { params: { isActive: true, limit: 100 } });
      if (res.data?.success) {
        setExams(res.data.data || res.data?.data?.data || []);
      } else {
        setExams([]);
      }
    } catch (err: any) {
      console.error("Fetch exams error:", err);
      toast.error("Failed to load exams");
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (watchExam) {
      let sectionsData = exams.find((e) => e._id === watchExam)?.sections || [];
      setSections(sectionsData);
      setValue("section", ""); // Reset section when exam changes
      setFilters((prev) => ({ ...prev, sectionId: "all" })); // Reset filter
    } else {
      setSections([]); // Clear sections if no exam is selected
    }
  }, [watchExam, exams, setValue]); // Add exams and setValue to dependency array

  // =========================
  // Fetch Questions
  // =========================
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.examId !== "all") params.examId = filters.examId;
      if (filters.sectionId !== "all") params.sectionId = filters.sectionId;
      if (filters.questionType !== "all") params.questionType = filters.questionType;
      if (filters.difficulty !== "all") params.difficulty = filters.difficulty;

      const res = await api.get("/mcu/questions", { params });

      if (res.data?.success) {
        const data = res.data.data || res.data?.data?.data || [];
        setQuestions(data);
        const pagination = res.data.pagination || res.data?.data?.pagination;
        if (pagination) {
          setTotalPages(pagination.pages || 1);
          setTotalQuestions(pagination.total || data.length);
        } else {
          setTotalPages(1);
          setTotalQuestions(data.length);
        }
      } else {
        setQuestions([]);
        setTotalPages(1);
        setTotalQuestions(0);
        setError("Failed to load questions");
      }
    } catch (err: any) {
      console.error("Fetch questions error:", err);
      setError(err.response?.data?.message || "Failed to load questions");
      toast.error(err.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, limit, debouncedSearch, filters.examId, filters.sectionId, filters.questionType, filters.difficulty]); // Add limit to dependency

  // Debounce search
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeoutId = setTimeout(() => setDebouncedSearch(value), 600);
    setSearchTimeout(timeoutId);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      examId: "all",
      sectionId: "all",
      questionType: "all",
      difficulty: "all",
    });
    setDebouncedSearch("");
    setPage(1);
  };

  const diSubtype = watch("dataInsights.subtype");
  const isDataInsights = watchQuestionType === "gmat_data_insights";
  const isMultiSource = isDataInsights && diSubtype === "multi_source_reasoning";
  const isTwoPart = isDataInsights && diSubtype === "two_part_analysis";
  const isTable = isDataInsights && diSubtype === "table_analysis";
  const isGraphics = isDataInsights && diSubtype === "graphics_interpretation";

  // =========================
  // Form helpers
  // =========================
  const openCreateDrawer = () => {
    setEditingQuestion(null);
    reset({
      exam: "",
      section: "",
      questionType: "",
      difficulty: "Medium",
      tags: "",
      stimulus: "",
      questionText: "",
      options: [
        { label: "A", text: "", isCorrect: false },
        { label: "B", text: "", isCorrect: false },
      ],
      correctAnswerText: "",
      marks: 1,
      negativeMarks: 0,
      explanation: "",
      source: "",
    });
    setSideOpen(true);
  };

  const openEditDrawer = (question: any) => {
    const baseValues = {
      exam: question.exam?._id || "",
      section: question.section?._id || "",
      questionType: question.questionType,
      difficulty: question.difficulty || "Medium",
      tags: (question.tags || []).join(", "),
      stimulus: question.stimulus || "",
      questionText: question.questionText || "",
      typeSpecific: question.typeSpecific || undefined,
      options: question.options && question.options.length > 0
        ? question.options.map((opt, idx) => ({
          label: opt.label || String.fromCharCode(65 + idx),
          text: opt.text,
          isCorrect: !!opt.isCorrect,
        }))
        : [
          { label: "A", text: "", isCorrect: false },
          { label: "B", text: "", isCorrect: false },
        ],
      correctAnswerText: question.correctAnswerText || "",
      marks: question.marks ?? 1,
      negativeMarks: question.negativeMarks ?? 0,
      explanation: question.explanation || "",
      source: question.source || "",
    };

    if (question.questionType === "gmat_data_insights") {
      const di = question.dataInsights || {};
      const subtype = di.subtype || "multi_source_reasoning";

      let dataInsights: any = { subtype };

      if (subtype === "multi_source_reasoning") {
        const tabs = di.multiSource?.tabs?.map(t => ({
          id: t.id || crypto.randomUUID(),
          title: t.title || "",
          contentHtml: t.contentHtml || "",
        })) || [{ id: crypto.randomUUID(), title: "", contentHtml: "" }];

        const statements = di.multiSource?.statements?.map(s => ({
          id: s.id || crypto.randomUUID(),
          text: s.text || "",
          correct: s.correct || "yes",
          yesLabel: s.yesLabel || "Yes",
          noLabel: s.noLabel || "No",
        })) || [{ id: crypto.randomUUID(), text: "", correct: "yes", yesLabel: "Yes", noLabel: "No" }];

        dataInsights.multiSource = { tabs, statements };
      }

      else if (subtype === "two_part_analysis") {
        const cols = di.twoPart?.columns?.map(c => ({
          id: c.id || crypto.randomUUID(),
          title: c.title || "",
          correctOptionId: c.correctOptionId || "",
        })) || [{ id: crypto.randomUUID(), title: "", correctOptionId: "" }];

        const opts = di.twoPart?.options?.map(o => ({
          id: o.id || crypto.randomUUID(),
          label: o.label || "",
        })) || [{ id: crypto.randomUUID(), label: "" }];

        // Auto-link if missing
        if (opts.length > 0 && cols.some(c => !c.correctOptionId)) {
          cols.forEach(c => {
            if (!c.correctOptionId) c.correctOptionId = opts[0].id;
          });
        }

        dataInsights.twoPart = { stem: di.twoPart?.stem || "", columns: cols, options: opts };
      }

      else if (subtype === "table_analysis") {
        const tableCols = di.tableAnalysis?.table?.columns || ["Column 1"];
        const rows = di.tableAnalysis?.table?.rows?.map(r => ({
          id: r.id || crypto.randomUUID(),
          cells: r.cells?.length === tableCols.length ? r.cells : Array(tableCols.length).fill(""),
        })) || [{ id: crypto.randomUUID(), cells: Array(tableCols.length).fill("") }];

        const statements = di.tableAnalysis?.statements?.map(s => ({
          id: s.id || crypto.randomUUID(),
          text: s.text || "",
          correct: s.correct || "true",
          trueLabel: s.trueLabel || "True",
          falseLabel: s.falseLabel || "False",
        })) || [{ id: crypto.randomUUID(), text: "", correct: "true", trueLabel: "True", falseLabel: "False" }];

        dataInsights.tableAnalysis = { table: { columns: tableCols, rows }, statements };
      }

      else if (subtype === "graphics_interpretation") {
        const dropdowns = di.graphics?.dropdowns?.map(d => ({
          id: d.id || crypto.randomUUID(),
          label: d.label || "",
          options: d.options || [""],
          correctIndex: d.correctIndex ?? 0,
        })) || [{ id: crypto.randomUUID(), label: "", options: [""], correctIndex: 0 }];

        dataInsights.graphics = { prompt: di.graphics?.prompt || "", dropdowns };
      }

      reset({ ...baseValues, dataInsights });
    } else {
      reset(baseValues);
    }

    setEditingQuestion(question);
    setSideOpen(true);
  };

  const closeDrawer = () => {
    setSideOpen(false);
    setTimeout(() => {
      setEditingQuestion(null);
    }, 150); // Match the exit animation duration
  };

  const onSubmit = async (values: any) => {
    try {
      // Validation: exam/section/type/text required
      if (!values.exam) {
        toast.error("Please select an exam");
        return;
      }
      if (!values.section) {
        toast.error("Please select a section");
        return;
      }
      if (!values.questionType) {
        toast.error("Please select question type");
        return;
      }
      if (!values.questionText.trim()) {
        toast.error("Question text is required");
        return;
      }

      // MCQ-specific validation
      if (isMCQType(values.questionType) && !isDataInsights) {
        if (!values.options || values.options.length < 2) {
          toast.error("MCQ must have at least 2 options");
          return;
        }
        const hasCorrect = values.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          toast.error("Select at least one correct option");
          return;
        }
      }

      if (watchQuestionType === "gre_verbal_text_completion") {
        const blanks = values.typeSpecific?.blanks || 1;
        const options = values.typeSpecific?.options || [];
        for (let i = 0; i < blanks; i++) {
          const correctInBlank = options.filter(opt => opt.blankIndex === i && opt.isCorrect);
          if (correctInBlank.length !== 1) {
            toast.error(`Blank ${i + 1} must have exactly one correct option`);
            return;
          }
        }
      }

      setSaving(true);
      const tagsArray = values.tags
        ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        : [];

      const payload: any = {
        exam: values.exam,
        section: values.section,
        questionType: values.questionType,
        difficulty: values.difficulty,
        tags: tagsArray,
        stimulus: values.stimulus || undefined,
        typeSpecific: values.typeSpecific || undefined,
        questionText: values.questionText,
        marks: Number(values.marks) || 1,
        negativeMarks: Number(values.negativeMarks) || 0,
        explanation: values.explanation || undefined,
        source: values.source || undefined,
      };

      if (values.questionType === "gmat_data_insights") {
        payload.options = [];
        payload.correctAnswerText = undefined; // Ensure this is not sent for DI
        payload.dataInsights = values.dataInsights;
      } else if (isMCQType(values.questionType)) {
        payload.options = values.options.map((opt, index) => ({
          label: opt.label || String.fromCharCode(65 + index), // Ensure label exists
          text: opt.text,
          isCorrect: !!opt.isCorrect, // Ensure boolean
        }));
        payload.correctAnswerText = undefined; // Ensure this is not sent for MCQs
        payload.dataInsights = undefined; // Ensure this is not sent for non-DI
      } else {
        payload.options = []; // Ensure empty array for non-MCQ
        payload.correctAnswerText = values.correctAnswerText || ""; // Send the text answer
        payload.dataInsights = undefined; // Ensure this is not sent for non-DI
      }

      if (editingQuestion) {
        await api.put(`/mcu/questions/${editingQuestion._id}`, payload);
        toast.success("Question updated successfully");
      } else {
        await api.post("/mcu/questions", payload);
        toast.success("Question created successfully");
      }
      closeDrawer(); // Close drawer after successful save
      fetchQuestions(); // Refresh the list
    } catch (err: any) {
      console.error("Save question error:", err);
      toast.error(err.response?.data?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (q: Question) => {
    if (!window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) return;
    try {
      await api.delete(`/mcu/questions/${q._id}`);
      toast.success("Question deleted successfully");
      fetchQuestions(); // Refresh the list after deletion
    } catch (err: any) {
      console.error("Delete question error:", err);
      toast.error(err.response?.data?.message || "Failed to delete question");
    }
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-IN") : "";

  const currentQuestionTypeLabel = useMemo(
    () =>
      QUESTION_TYPE_OPTIONS.find((x) => x.value === watchQuestionType)?.label ||
      watchQuestionType ||
      "",
    [watchQuestionType]
  );

  const isMCQ = isMCQType(watchQuestionType);

  // =========================
  // JSX
  // =========================
  return (
    <>
      <PageMeta title="Question Management" description="Manage GMAT / GRE / SAT questions" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Question Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create, edit and filter questions for GMAT, GRE and SAT.
            </p>
          </div>
          <Button onClick={openCreateDrawer} className="flex items-center gap-2 rounded-xl px-4 py-2">
            <Plus className="h-4 w-4" />
            New Question
          </Button>
        </div>

        {/* Filters card */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear filters
            </button>
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
                  placeholder="Search question text, passage..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            {/* Exam filter */}
            <div>
              <Select
                options={[
                  { value: "all", label: "All Exams" },
                  ...exams.map((e) => ({ value: e._id, label: e.name })),
                ]}
                defaultValue={filters.examId}
                onChange={(value: string) => {
                  setFilters((prev) => ({ ...prev, examId: value, sectionId: "all" }));
                  setPage(1);
                }}
              />
            </div>
            {/* Section filter */}
            <div>
              <Select
                options={[
                  { value: "all", label: loadingSections ? "Loading sections..." : "All Sections" },
                  ...sections.map((s) => ({ value: s._id, label: s.name })),
                ]}
                defaultValue={filters.sectionId}
                onChange={(value: string) => {
                  setFilters((prev) => ({ ...prev, sectionId: value }));
                  setPage(1);
                }}
              />
            </div>
            {/* Type / Difficulty / Limit */}
            <div>
              <Select
                options={[
                  { value: "all", label: "All Types" },
                  ...QUESTION_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label })),
                ]}
                defaultValue={filters.questionType}
                onChange={(value: string) => {
                  setFilters((prev) => ({ ...prev, questionType: value }));
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Select
                options={[
                  { value: "all", label: "All Levels" },
                  ...DIFFICULTY_OPTIONS,
                ]}
                defaultValue={filters.difficulty}
                onChange={(value: string) => {
                  setFilters((prev) => ({ ...prev, difficulty: value as any }));
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Select
                options={LIMIT_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                defaultValue={limit.toString()}
                onChange={(value: string) => {
                  setLimit(Number(value));
                  setPage(1); // Reset to first page when limit changes
                }}
              />
            </div>
          </div>
          {/* meta line */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              Showing page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> •{" "}
              <span className="font-semibold">{totalQuestions}</span> questions
            </div>
          </div>
        </div>

        {/* List / table */}
        <div className="space-y-1">
          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading questions...
              </div>
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
          {!loading && !error && questions.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              No questions found. Try changing filters or create a new question.
            </div>
          )}
          {!loading &&
            !error &&
            questions.map((q) => (
              <motion.div
                key={q._id}
                layout // Enable layout animations for list items
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {q.exam?.name || "Unknown exam"}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {q.section?.name || "Unknown section"}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {
                          QUESTION_TYPE_OPTIONS.find((t) => t.value === q.questionType)
                            ?.label || q.questionType
                        }
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${q.difficulty === "Easy"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : q.difficulty === "Hard"
                            ? "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                          }`}
                      >
                        {q.difficulty}
                      </span>
                      {q.tags && q.tags.length > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          <Tag className="h-3 w-3" />
                          {q.tags.slice(0, 3).join(", ")}
                          {q.tags.length > 3 && ` +${q.tags.length - 3}`}
                        </span>
                      )}
                    </div>
                    {q.stimulus && (
                      <div className="mb-1 text-xs text-gray-500 line-clamp-1 dark:text-gray-400"
                        dangerouslySetInnerHTML={{ __html: q?.stimulus }} />
                    )}
                    {/* <p className="text-sm font-medium text-gray-900 line-clamp-1 dark:text-gray-100">
                      {q.questionText}
                    </p> */}
                    <div className="text-sm font-medium text-gray-900 line-clamp-1 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                    {/* <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {q.createdAt && (
                        <span>Created: {formatDate(q.createdAt)} • </span>
                      )}
                      <span>Marks: {q.marks ?? 1}</span>
                      {typeof q.negativeMarks === "number" && q.negativeMarks !== 0 && (
                        <span> • Negative: {q.negativeMarks}</span>
                      )}
                    </div> */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 py-1 text-xs"
                      onClick={() => openEditDrawer(q)}
                    >
                      <Edit3 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 py-1 text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(q)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
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

        {/* Side Drawer for Create / Edit - Framer Motion */}
        <AnimatePresence>
          {sideOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex" // Increased z-index to 50
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={saving ? undefined : closeDrawer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
              {/* panel */}
              <motion.div
                className="relative ml-auto flex h-full w-full max-w-4xl flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {editingQuestion ? "Edit Question" : "Create Question"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentQuestionTypeLabel || "Select type to see more options"}
                    </p>
                  </div>
                  <button
                    onClick={saving ? undefined : closeDrawer}
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    disabled={saving}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
                >
                  {/* Exam & Section - Using Custom Components */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Exam</Label>
                      <Select
                        options={[
                          ...exams.map((e) => ({ value: e._id, label: e.name })),
                        ]}
                        defaultValue={watch("exam")}
                        onChange={(value: string) => setValue("exam", value)}
                      />
                      {errors.exam && (
                        <p className="mt-1 text-xs text-red-500">
                          {(errors as any).exam?.message || "Exam is required"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Section</Label>
                      <Select
                        options={[
                          ...sections.map((s) => ({ value: s._id, label: s.name })),
                        ]}
                        defaultValue={watch("section")}
                        onChange={(value: string) => setValue("section", value)}
                      />
                      {errors.section && (
                        <p className="mt-1 text-xs text-red-500">
                          {(errors as any).section?.message || "Section is required"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Type & Difficulty - Using Custom Components */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Question Type</Label>
                      <Select
                        options={[
                          ...QUESTION_TYPE_OPTIONS,
                        ]}
                        defaultValue={watchQuestionType}
                        onChange={(value: string) => setValue("questionType", value)}
                      />
                      {errors.questionType && (
                        <p className="mt-1 text-xs text-red-500">
                          {(errors as any).questionType?.message || "Type is required"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Difficulty</Label>
                      <Select
                        options={DIFFICULTY_OPTIONS}
                        defaultValue={watch("difficulty")}
                        onChange={(value: string) =>
                          setValue("difficulty", value as QuestionFormValues["difficulty"])
                        }
                      />
                    </div>
                  </div>
                  {isDataInsights && (
                    <div className="mt-2">
                      <Label>Data Insights subtype</Label>
                      <Select
                        options={[
                          { value: "multi_source_reasoning", label: "Multi-Source Reasoning" },
                          { value: "two_part_analysis", label: "Two-Part Analysis" },
                          { value: "table_analysis", label: "Table Analysis" },
                          { value: "graphics_interpretation", label: "Graphics Interpretation" },
                        ]}
                        defaultValue={diSubtype}
                        onChange={(v: string) => setValue("dataInsights.subtype", v)}
                      />
                    </div>
                  )}

                  {/* Tags - Using Custom Component */}
                  <div>
                    <Label className="flex items-center gap-1">
                      Tags
                      <span className="text-[10px] text-gray-400">(comma separated)</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="algebra, probability, reading, geometry"
                      value={watchTags}
                      onChange={(e) => setValue("tags", e.target.value)}
                      error={!!errors.tags} // Pass error state
                      hint={errors.tags?.message} // Pass error message as hint
                    />
                  </div>

                  {/* Stimulus - Using Custom Component */}
                  <div>
                    <Label>Stimulus / Passage (optional)</Label>
                    {/* <Input
                      type="text"
                      placeholder="Paste passage or context here"
                      value={watchStimulus}
                      onChange={(e) => setValue("stimulus", e.target.value)}
                    /> */}
                    <RichTextEditor
                      header={false}
                      initialValue={watchStimulus}
                      onChange={(html) => setValue("stimulus", html)}
                    />
                  </div>

                  {/* Question Text - Using Custom Component */}
                  <div>
                    <Label>Question Text</Label>
                    {isPTEType(watchQuestionType) ? <Input
                      type="text"
                      placeholder="Enter the actual question"
                      value={watchQuestionText}
                      onChange={(e) => setValue("questionText", e.target.value)}
                      error={!!errors.questionText} // Pass error state
                      hint={errors.questionText?.message} // Pass error message as hint
                    /> :
                      <RichTextEditor
                        header={false}
                        initialValue={watchQuestionText}
                        onChange={(html) => setValue("questionText", html)}
                      />}
                    {/* <RichTextEditor
                      initialValue={formData.content.passageText}
                      onChange={(e) => handleChange({ target: { name: 'content.passageText', value: e } })}
                    /> */}
                  </div>
                  {isNewFeild(watchQuestionType) && <div>
                    <Label>Extratext</Label>
                    <Input
                      type="text"
                      placeholder="Enter the listening text"
                      value={watch("typeSpecific.listeningText")}
                      onChange={(e) => setValue("typeSpecific.listeningText", e.target.value)}
                    />
                  </div>}

                  {/* MCQ Options or Text Answer */}
                  {isDataInsights ? (
                    <GMATDataInsightsBlock
                      isMultiSource={isMultiSource}
                      isTwoPart={isTwoPart}
                      isTable={isTable}
                      isGraphics={isGraphics}
                      watch={watch}
                      setValue={setValue}
                      control={control} // Pass control if needed inside the DI block (though currently it uses watch/setValue)
                      useFieldArray={useFieldArray}
                    />
                  )
                    : isMCQ ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="flex items-center gap-1">
                            Options
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </Label>
                          <button
                            type="button"
                            onClick={() =>
                              append({
                                label: String.fromCharCode(65 + optionFields.length),
                                text: "",
                                isCorrect: false,
                              })
                            }
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            + Add option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {optionFields.map((field, index) => (
                            <motion.div
                              key={field.id}
                              layout // Enable layout animations for list items
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-start gap-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700"
                            >
                              <div className="mt-2 text-xs font-semibold text-gray-500">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <Input
                                  type="text"
                                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                  value={watch(`options.${index}.text`)}
                                  onChange={(e) =>
                                    setValue(`options.${index}.text`, e.target.value)
                                  }
                                  error={!!(errors.options && errors.options[index]?.text)} // Pass error state for specific option
                                  hint={errors.options && errors.options[index]?.text?.message} // Pass error message as hint
                                />
                                <label className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3"
                                    checked={watch(`options.${index}.isCorrect`)}
                                    onChange={(e) =>
                                      setValue(
                                        `options.${index}.isCorrect`,
                                        e.target.checked
                                      )
                                    }
                                  />
                                  Correct answer
                                </label>
                              </div>
                              {optionFields.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="mt-1 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label>Correct Answer (text / numeric)</Label>
                        <Input
                          type="text"
                          placeholder="Correct answer text"
                          value={watchCorrectAnswerText}
                          onChange={(e) => setValue("correctAnswerText", e.target.value)}
                        />
                      </div>
                    )}

                  {/* Text Completion */}
                  {watchQuestionType === "gre_verbal_text_completion" && (
                    <div className="mt-2">
                      <Label>Number of Blanks</Label>
                      <Select
                        options={[
                          { value: "1", label: "1 Blank" },
                          { value: "2", label: "2 Blanks" },
                          { value: "3", label: "3 Blanks" },
                        ]}
                        defaultValue={(watch("typeSpecific.blanks")?.toString() || "1")}
                        onChange={(v) => {
                          const num = Number(v);
                          setValue("typeSpecific.blanks", num);

                          // Initialize options array if empty
                          const currentOpts = watch("typeSpecific.options") || [];
                          if (currentOpts.length === 0) {
                            const newOpts = [];
                            for (let i = 0; i < num; i++) {
                              newOpts.push({ blankIndex: i, label: "A", text: "", isCorrect: true });
                              newOpts.push({ blankIndex: i, label: "B", text: "", isCorrect: false });
                            }
                            setValue("typeSpecific.options", newOpts);
                          }
                        }}
                      />

                      {[...Array(watch("typeSpecific.blanks") || 1)].map((_, blankIndex) => {
                        const blankOptions = (watch("typeSpecific.options") || [])
                          .filter(opt => opt.blankIndex === blankIndex);

                        return (
                          <div key={blankIndex} className="mt-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <Label>Blank {blankIndex + 1}</Label>
                              <button
                                type="button"
                                onClick={() => {
                                  const opts = watch("typeSpecific.options") || [];
                                  const nextLabel = String.fromCharCode(65 + blankOptions.length);
                                  setValue("typeSpecific.options", [
                                    ...opts,
                                    { blankIndex, label: nextLabel, text: "", isCorrect: false }
                                  ]);
                                }}
                                className="text-xs text-blue-600"
                              >
                                + Add Option
                              </button>
                            </div>

                            {blankOptions.map((opt, idx) => {
                              const globalIndex = (watch("typeSpecific.options") || []).findIndex(
                                o => o.blankIndex === blankIndex && o.label === opt.label
                              );
                              return (
                                <div key={`${blankIndex}-${opt.label}`} className="mt-2 flex items-start gap-2">
                                  <div className="mt-2 w-6 text-sm font-mono">{opt.label}</div>
                                  <Input
                                    value={opt.text}
                                    onChange={(e) => {
                                      const opts = [...(watch("typeSpecific.options") || [])];
                                      opts[globalIndex] = { ...opts[globalIndex], text: e.target.value };
                                      setValue("typeSpecific.options", opts);
                                    }}
                                    placeholder={`Option text for Blank ${blankIndex + 1}`}
                                  />
                                  <div className="mt-2">
                                    <label className="flex items-center gap-1 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={opt.isCorrect}
                                        onChange={(e) => {
                                          const opts = [...(watch("typeSpecific.options") || [])];
                                          // Ensure only one correct per blank
                                          opts.forEach(o => {
                                            if (o.blankIndex === blankIndex) {
                                              o.isCorrect = false;
                                            }
                                          });
                                          opts[globalIndex] = { ...opts[globalIndex], isCorrect: e.target.checked };
                                          setValue("typeSpecific.options", opts);
                                        }}
                                      />
                                      Correct
                                    </label>
                                  </div>
                                  {blankOptions.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const opts = (watch("typeSpecific.options") || []).filter(
                                          (_, i) => i !== globalIndex
                                        );
                                        setValue("typeSpecific.options", opts);
                                      }}
                                      className="mt-2 text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}


                  {/* Marks - Using Custom Components */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={watchMarks}
                        onChange={(e) => setValue("marks", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Negative Marks</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={watchNegativeMarks}
                        onChange={(e) => setValue("negativeMarks", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* Explanation & Source - Using Custom Components */}
                  <div>
                    <Label>Explanation (for review)</Label>
                    <Input
                      type="text"
                      placeholder="Explain why this answer is correct"
                      value={watchExplanation}
                      onChange={(e) => setValue("explanation", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Input
                      type="text"
                      placeholder="e.g., Official Guide 2024, Custom, etc."
                      value={watchSource}
                      onChange={(e) => setValue("source", e.target.value)}
                    />
                  </div>

                  <div className="sticky bottom-0 mt-3 flex justify-end gap-2 border-t border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-gray-900">
                    <Button
                      variant="outline"
                      onClick={closeDrawer}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} isLoading={saving}>
                      {editingQuestion ? "Save Changes" : "Create Question"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}