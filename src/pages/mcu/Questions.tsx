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
  Filter,
  Calendar,
  Award,
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { GMATDataInsightsBlock } from "./DiBlock";
import RichTextEditor from "../../components/TextEditor";
import AudioUploadComponent from "./AudioUpload";
import { useSearchParams } from "react-router";
import { Modal } from "../../components/ui/modal";
import QuestionBody from "./QuestionComponent";
import QuestionRenderer from "../SatTest/SatComponents";
import { QuestionPreviewRenderer } from "./GreComponents";
import { PteQuestionPreviewRenderer } from "../PTEtest/Components";


interface Exam {
  _id: string;
  name: string;
  sections?: Section[];
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
  tags: string;
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
  { value: "essay", label: "PTE-Essay / Long Answer" },
  { value: "other", label: "Other" },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10" },
  { value: 20, label: "20 " },
  { value: 50, label: "50 " },
  { value: 100, label: "100" },
];

const isPTEType = (questionType: string) => {
  return questionType && ["repeat_sentence", "retell_lesson", "pte_writing_listening", "summarize_group_discussions", "pte_summarize_listening", "pte_summarize_spoken"].includes(questionType);
};

const isNewFeild = (questionType: string) => {
  return questionType && ["pte_situational", "pte_reorder", "pte_highlight", "pte_summarize_listening", "pte_mcq_single_listening", "pte_fill_listening", "pte_fill_drag", "pte_mcq_multiple_listening"].includes(questionType);
};

const isMCQType = (questionType: string) => {
  return questionType && !["essay", "other", "pte_reorder", "pte_fill_listening", "pte_writing_listening", "summarize_group_discussions", "pte_summarize_listening", "pte_highlight", "pte_summarize_spoken", "pte_fill_drag", "pte_situational", "pte_fill_in_blanks", "pte_summarize_writing", "retell_lesson", "describe_image", "sat_value", "repeat_sentence", "read_aloud", "gre_analytical_writing", "gre_quantitative_value", "gre_verbal_text_completion"].includes(questionType);
};

export default function QuestionManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sections1, setSections1] = useState<Section[]>([]);


  const [searchParams, setSearchParams] = useSearchParams();

  const examId = searchParams.get("exam") || "";
  const sectionId = searchParams.get("section") || "";

  const [filters, setFilters] = useState({
    search: "",
    examId: searchParams.get("exam") || "all",
    sectionId: searchParams.get("section") || "all",
    questionType: "all",
    difficulty: "all",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  // const [loadingSections, setLoadingSections] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<any>(null)

  console.log(previewQuestion)

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
      options: [],
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

  const [audioData, setAudioData] = useState<string | null>(null);

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
      setValue("section", "");
      // setFilters((prev) => ({ ...prev, sectionId: "all" }));
    } else {
      setSections([]);
    }
  }, [watchExam, exams, setValue]);

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
    if (examId) {
      let sectionsData = exams.find((e) => e._id === examId)?.sections || [];
      setSections1(sectionsData)
    }
  }, [examId, exams]);

  useEffect(() => {
    const params: any = {};
    if (filters.examId !== "all") {
      params.exam = filters.examId;
    }
    if (filters.sectionId !== "all") {
      params.section = filters.sectionId;
    }
    setSearchParams(params);
  }, [filters, setSearchParams]);

  useEffect(() => {
    if (examId) {
      fetchQuestions();
    }
  }, [page, limit, debouncedSearch, filters.examId, filters.sectionId, filters.questionType, filters.difficulty]);

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
    }, 150);
  };

  const onSubmit = async (values: any) => {
    try {
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
        payload.correctAnswerText = undefined;
        payload.dataInsights = values.dataInsights;
      } else if (isMCQType(values.questionType)) {
        payload.options = values.options.map((opt, index) => ({
          label: opt.label || String.fromCharCode(65 + index),
          text: opt.text,
          isCorrect: !!opt.isCorrect,
        }));
        payload.correctAnswerText = undefined;
        payload.dataInsights = undefined;
      } else {
        payload.options = [];
        payload.correctAnswerText = values.correctAnswerText || "";
        payload.dataInsights = undefined;
      }

      if (editingQuestion) {
        await api.put(`/mcu/questions/${editingQuestion._id}`, payload);
        toast.success("Question updated successfully");
      } else {
        await api.post("/mcu/questions", payload);
        toast.success("Question created successfully");
      }
      closeDrawer();
      fetchQuestions();
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
      fetchQuestions();
    } catch (err: any) {
      console.error("Delete question error:", err);
      toast.error(err.response?.data?.message || "Failed to delete question");
    }
  };

  const currentQuestionTypeLabel = useMemo(
    () =>
      QUESTION_TYPE_OPTIONS.find((x) => x.value === watchQuestionType)?.label ||
      watchQuestionType ||
      "",
    [watchQuestionType]
  );

  const isMCQ = isMCQType(watchQuestionType);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30';
    }
  };

  // Get difficulty icon
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return <TrendingUp className="h-3 w-3" />;
      case 'Medium':
        return <Layers className="h-3 w-3" />;
      case 'Hard':
        return <Award className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (!examId) return (
    <>
      <div className="relative min-h-[80vh]  dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
                Question Management
                <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-medium ">
                  {totalQuestions}
                </span>
              </h1>
              <p className="text-sm">
                Create, edit and filter questions for GMAT, GRE, SAT, and PTE
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg border-2 bg-gray-100 p-2">Select an Exam</h3>

          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {exams.map((exam) => (
              <div
                key={exam._id}
                onClick={() => {
                  let sectionsData = exams.find((e) => e._id === exam._id)?.sections || [];
                  setSections1(sectionsData);

                  setFilters((prev) => ({
                    ...prev,
                    examId: exam._id,
                    sectionId: "all",
                    questionType: "all",
                  }));
                  setPage(1);
                }}
                className={`cursor-pointer p-2 px-4 hover:outline-1 hover:bg-gray-200 outline-gray-300 rounded-2xl `}
              >
                <div className="flex flex-col ">
                  <img className="w-full px-3 h-full" alt="svgImg" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI0OHB4IiBoZWlnaHQ9IjQ4cHgiPjxsaW5lYXJHcmFkaWVudCBpZD0iV1FFZnZvUUFjcFFnUWd5alFRNEhxYSIgeDE9IjI0IiB4Mj0iMjQiIHkxPSI2LjcwOCIgeTI9IjE0Ljk3NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ViYTYwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2MyODIwMCIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZmlsbD0idXJsKCNXUUVmdm9RQWNwUWdRZ3lqUVE0SHFhKSIgZD0iTTI0LjQxNCwxMC40MTRsLTIuNTM2LTIuNTM2QzIxLjMxNiw3LjMxNiwyMC41NTMsNywxOS43NTcsN0w1LDdDMy44OTUsNywzLDcuODk1LDMsOWwwLDMwCWMwLDEuMTA1LDAuODk1LDIsMiwybDM4LDBjMS4xMDUsMCwyLTAuODk1LDItMlYxM2MwLTEuMTA1LTAuODk1LTItMi0ybC0xNy4xNzIsMEMyNS4yOTgsMTEsMjQuNzg5LDEwLjc4OSwyNC40MTQsMTAuNDE0eiIvPjxsaW5lYXJHcmFkaWVudCBpZD0iV1FFZnZvUUFjcFFnUWd5alFRNEhxYiIgeDE9IjI0IiB4Mj0iMjQiIHkxPSIxMC44NTQiIHkyPSI0MC45ODMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmZmQ4NjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZWM1MmIiLz48L2xpbmVhckdyYWRpZW50PjxwYXRoIGZpbGw9InVybCgjV1FFZnZvUUFjcFFnUWd5alFRNEhxYikiIGQ9Ik0yMS41ODYsMTQuNDE0bDMuMjY4LTMuMjY4QzI0Ljk0NywxMS4wNTMsMjUuMDc0LDExLDI1LjIwNywxMUg0M2MxLjEwNSwwLDIsMC44OTUsMiwydjI2CWMwLDEuMTA1LTAuODk1LDItMiwySDVjLTEuMTA1LDAtMi0wLjg5NS0yLTJWMTUuNUMzLDE1LjIyNCwzLjIyNCwxNSwzLjUsMTVoMTYuNjcyQzIwLjcwMiwxNSwyMS4yMTEsMTQuNzg5LDIxLjU4NiwxNC40MTR6Ii8+PC9zdmc+" />

                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-medium text-gray-900">
                      {exam.name}
                    </h3>

                    <p className="text-xs text-gray-500">
                      {exam.sections?.length || 0} Sections
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )

  if (examId && !sectionId) {
    return (
      <div className="relative min-h-[80vh]">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
            Question Management
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  examId: "all",
                  sectionId: "all",
                  questionType: "all",
                }));

                setSearchParams({});
              }}
            >
              Exams
            </button>

            <span>/</span>


          </div>
        </div>

        <div className="mt-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg border-2 bg-gray-100 p-2">
              Select a Section
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {sections1.map((section) => (
              <div
                key={section._id}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    sectionId: section._id,
                  }));

                  setSearchParams({
                    exam: examId,
                    section: section._id,
                  });
                }}
                className="cursor-pointer p-2 px-4 hover:outline hover:bg-gray-200 outline-gray-300 rounded-2xl transition"
              >
                <div className="flex flex-col">
                  <img className="w-full px-3 h-full" alt="svgImg" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI0OHB4IiBoZWlnaHQ9IjQ4cHgiPjxsaW5lYXJHcmFkaWVudCBpZD0iV1FFZnZvUUFjcFFnUWd5alFRNEhxYSIgeDE9IjI0IiB4Mj0iMjQiIHkxPSI2LjcwOCIgeTI9IjE0Ljk3NyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ViYTYwMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2MyODIwMCIvPjwvbGluZWFyR3JhZGllbnQ+PHBhdGggZmlsbD0idXJsKCNXUUVmdm9RQWNwUWdRZ3lqUVE0SHFhKSIgZD0iTTI0LjQxNCwxMC40MTRsLTIuNTM2LTIuNTM2QzIxLjMxNiw3LjMxNiwyMC41NTMsNywxOS43NTcsN0w1LDdDMy44OTUsNywzLDcuODk1LDMsOWwwLDMwCWMwLDEuMTA1LDAuODk1LDIsMiwybDM4LDBjMS4xMDUsMCwyLTAuODk1LDItMlYxM2MwLTEuMTA1LTAuODk1LTItMi0ybC0xNy4xNzIsMEMyNS4yOTgsMTEsMjQuNzg5LDEwLjc4OSwyNC40MTQsMTAuNDE0eiIvPjxsaW5lYXJHcmFkaWVudCBpZD0iV1FFZnZvUUFjcFFnUWd5alFRNEhxYiIgeDE9IjI0IiB4Mj0iMjQiIHkxPSIxMC44NTQiIHkyPSI0MC45ODMiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmZmQ4NjkiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZWM1MmIiLz48L2xpbmVhckdyYWRpZW50PjxwYXRoIGZpbGw9InVybCgjV1FFZnZvUUFjcFFnUWd5alFRNEhxYikiIGQ9Ik0yMS41ODYsMTQuNDE0bDMuMjY4LTMuMjY4QzI0Ljk0NywxMS4wNTMsMjUuMDc0LDExLDI1LjIwNywxMUg0M2MxLjEwNSwwLDIsMC44OTUsMiwydjI2CWMwLDEuMTA1LTAuODk1LDItMiwySDVjLTEuMTA1LDAtMi0wLjg5NS0yLTJWMTUuNUMzLDE1LjIyNCwzLjIyNCwxNSwzLjUsMTVoMTYuNjcyQzIwLjcwMiwxNSwyMS4yMTEsMTQuNzg5LDIxLjU4NiwxNC40MTR6Ii8+PC9zdmc+" />
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-medium text-gray-900">
                      {section.name}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Click to open
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="relative min-h-screen  dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">

        <Modal
          isOpen={preview}
          onClose={() => {
            setPreview(false);
            setPreviewQuestion(null);
          }}
          className="max-w-7xl"
        >
          <div className="flex flex-col h-full max-h-[95vh]">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Question Preview
                </h3>
                {previewQuestion && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {previewQuestion.exam?.name || "Unknown Exam"}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {QUESTION_TYPE_OPTIONS.find(t => t.value === previewQuestion.questionType)?.label || previewQuestion.questionType}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setPreview(false);
                  setPreviewQuestion(null);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 p-6 relative overflow-y-auto">
              {previewQuestion && previewQuestion?.exam?.name?.toLowerCase()?.includes("sat") && (
                <QuestionRenderer
                  mode="preview"
                  qDoc={previewQuestion}
                  currentQuestion={{
                    answerOptionIndexes: [],
                    answerText: "",
                  }}
                  isCompleted={false}
                  onOptionClick={(index: number) => null}
                  onTextAnswerChange={(e: any) => null}
                  getDiAnswers={() => ({})}
                  updateDiAnswers={() => { }}
                />
              )}
              {previewQuestion && previewQuestion?.exam?.name?.toLowerCase()?.includes("gmat") && (
                <QuestionBody
                  mode="preview"
                  qDoc={previewQuestion}
                  currentQuestion={{
                    answerOptionIndexes: [],
                    answerText: "",
                  }}
                  isCompleted={false}
                  onOptionClick={(index: number) => null}
                  onTextAnswerChange={(e: any) => null}
                  getDiAnswers={() => ({})}
                  updateDiAnswers={() => { }}
                />
              )}
              {previewQuestion && previewQuestion?.exam?.name?.toLowerCase()?.includes("gre") && (
                <QuestionPreviewRenderer
                  mode="preview"
                  qDoc={previewQuestion}
                  currentQuestion={{
                    answerOptionIndexes: [],
                    answerText: "",
                  }}
                  isCompleted={false}
                  onOptionClick={(index: number) => null}
                  onTextAnswerChange={(e: any) => null}
                  getDiAnswers={() => ({})}
                  updateDiAnswers={() => { }}
                />
              )}
              {previewQuestion && previewQuestion?.exam?.name?.toLowerCase()?.includes("pte") && (
                <PteQuestionPreviewRenderer
                  mode="preview"
                  qDoc={previewQuestion}
                  currentQuestion={{
                    answerOptionIndexes: [],
                    answerText: "",
                  }}
                  isCompleted={false}
                  onOptionClick={(index: number) => null}
                  onTextAnswerChange={(e: any) => null}
                  getDiAnswers={() => ({})}
                  updateDiAnswers={() => { }}
                />
              )}
            </div>

            {/* Preview Footer */}
            {previewQuestion && (
              <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Difficulty:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {previewQuestion.difficulty}
                      </span>
                    </span>
                    <span>
                      Marks:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {previewQuestion.marks || 1}
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreview(false);
                      openEditDrawer(previewQuestion);
                    }}
                    className="rounded-xl px-4 py-2 text-xs"
                  >
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    Edit Question
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
        <div className="container mx-auto px-4">


          <div className="relative flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">

                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
                    Question Management
                    <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-medium ">
                      {totalQuestions}
                    </span>
                  </h1>
                  <p className="text-sm">
                    Create, edit and filter questions for GMAT, GRE, SAT, and PTE
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={openCreateDrawer}
              size="sm"
              className="flex items-center gap-1 rounded-2xl font-medium bg-orange-600  transition-all hover:scale-105 px-3 !py-2.5"
            >
              <Plus className="h-4 w-4" />
              New Question
            </Button>
          </div>

          {/* Filters Card with Glassmorphism */}
          <div className="border mb-4 bg-white dark:border-gray-800/50 dark:bg-gray-900/80">
            <div className="p-6 pb-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 text-white">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span>Filters</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({Object.values(filters).filter(v => v !== "all" && v !== "").length} active)
                  </span>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Search */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search questions, passages..."
                      className="w-full rounded-lg border border-gray-200 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-gray-900  transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Exam filter */}
                <div>
                  <Select
                    options={[
                      ...exams.map((e) => ({ value: e._id, label: e.name })),
                    ]}
                    defaultValue={filters.examId}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, examId: value, sectionId: "all" }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Section filter */}
                <div>
                  <Select
                    options={[
                      ...sections1.map((s) => ({ value: s._id, label: s.name })),
                    ]}
                    defaultValue={filters.sectionId}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, sectionId: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Type filter */}
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
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Difficulty filter */}
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
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Meta line */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 :border-gray-700/50">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{totalQuestions}</span>
                    <span>questions found</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <span>Page</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{page}</span>
                    <span>of</span>
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />

                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {LIMIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-2">
            {loading && (
              <div className="flex flex-col items-center justify-center border border-gray-200/50 bg-white/80 p-12 text-center  backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading questions...</p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5" />
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && questions.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200/50 bg-white/80 p-12 text-center  backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No questions found
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or create a new question
                </p>
                <Button
                  onClick={openCreateDrawer}
                  className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white  hover:"
                >
                  <Plus className="h-4 w-4" />
                  Create Question
                </Button>
              </div>
            )}

            {!loading && !error && questions.map((q) => (
              <motion.div
                key={q._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative overflow-hidden border border-gray-200 bg-white  backdrop-blur-sm transition-all hover: hover:-translate-y-1 dark:border-gray-800/50 dark:bg-gray-900/80"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-indigo-600/0 to-purple-600/0 transition-all duration-500 group-hover:from-blue-600/5 group-hover:via-indigo-600/5 group-hover:to-purple-600/5"></div>

                <div className="relative p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Tags Row */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {/* Exam Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                          <Layers className="h-3 w-3" />
                          {q.exam?.name || "Unknown"}
                        </span>

                        {/* Section Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                          <BookOpen className="h-3 w-3" />
                          {q.section?.name || "Unknown"}
                        </span>

                        {/* Question Type Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                          {QUESTION_TYPE_OPTIONS.find((t) => t.value === q.questionType)?.label || q.questionType}
                        </span>

                        {/* Difficulty Badge */}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getDifficultyColor(q.difficulty)}`}>
                          {getDifficultyIcon(q.difficulty)}
                          {q.difficulty}
                        </span>

                        {/* Tags */}
                        {q.tags && q.tags.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                            <Tag className="h-3 w-3" />
                            {q.tags.slice(0, 3).join(", ")}
                            {q.tags.length > 3 && ` +${q.tags.length - 3}`}
                          </span>
                        )}
                      </div>

                      {/* Stimulus */}
                      {q.stimulus && (
                        <div
                          className="mb-2 text-xs text-gray-500 line-clamp-1 dark:text-gray-400"
                          dangerouslySetInnerHTML={{ __html: q.stimulus }}
                        />
                      )}
                      <div
                        className="text-sm font-medium text-gray-900 line-clamp-1 dark:text-gray-100"
                        dangerouslySetInnerHTML={{ __html: q.questionText }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center gap-2 lg:flex-shrink-0">
                      <div className="flex items-center gap-2 lg:flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl px-4 py-2 text-xs border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:border-gray-700 dark:hover:border-green-500 dark:hover:bg-green-500/10"
                          onClick={() => {
                            setPreviewQuestion(q);
                            setPreview(true);
                          }}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl px-4 py-2 text-xs border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                          onClick={() => openEditDrawer(q)}
                        >
                          <Edit3 className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl px-4 py-2 text-xs border-gray-200 text-rose-600 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:border-gray-700 dark:hover:border-rose-500 dark:hover:bg-rose-500/10"
                          onClick={() => handleDelete(q)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {q.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(q.createdAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>Marks: <span className="font-medium text-gray-700 dark:text-gray-300">{q.marks ?? 1}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Side Drawer - Enhanced UI */}
          <AnimatePresence>
            {sideOpen && (
              <motion.div
                className="fixed inset-0 z-50 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Backdrop */}
                <motion.div
                  className="absolute inset-0  bg-black/10 backdrop-blur-[1px]"
                  onClick={saving ? undefined : closeDrawer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Panel */}
                <motion.div
                  className="relative ml-auto flex h-full overflow-hidden w-full max-w-3xl rounded-3xl border-4 border-gray-400 flex-col bg-white shadow-2xl dark:bg-gray-900"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-2">

                        <div>
                          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                            {editingQuestion ? "Edit Question" : "Create New Question"}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {currentQuestionTypeLabel || "Select a question type"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={saving ? undefined : closeDrawer}
                      className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      disabled={saving}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto "
                  >
                    <div className="px-6 space-y-3 py-4">
                      {/* Basic Info */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exam</Label>
                          <Select
                            options={exams.map((e) => ({ value: e._id, label: e.name }))}
                            defaultValue={watch("exam")}
                            onChange={(value: string) => setValue("exam", value)}
                            className="mt-1 rounded border-gray-200 dark:border-gray-700"
                          />
                          {errors.exam && (
                            <p className="mt-1 text-xs text-rose-500">{errors.exam.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Section</Label>
                          <Select
                            options={sections.map((s) => ({ value: s._id, label: s.name }))}
                            defaultValue={watch("section")}
                            onChange={(value: string) => setValue("section", value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                          {errors.section && (
                            <p className="mt-1 text-xs text-rose-500">{errors.section.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Question Type & Difficulty */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Type</Label>
                          <Select
                            options={QUESTION_TYPE_OPTIONS.filter((t) => {
                              const examName = exams.find(e => e._id === watch("exam"))?.name?.toLowerCase() || "";
                              if (examName.includes("gmat")) return t.label.startsWith("GMAT");
                              if (examName.includes("gre")) return t.label.startsWith("GRE");
                              if (examName.includes("sat")) return t.label.startsWith("SAT");
                              if (examName.includes("pte")) return t.label.startsWith("PTE");
                              return true;
                            })}
                            defaultValue={watchQuestionType}
                            onChange={(value: string) => setValue("questionType", value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                          {errors.questionType && (
                            <p className="mt-1 text-xs text-rose-500">{errors.questionType.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</Label>
                          <Select
                            options={DIFFICULTY_OPTIONS}
                            defaultValue={watch("difficulty")}
                            onChange={(value: string) => setValue("difficulty", value as any)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* DI Subtype */}
                      {isDataInsights && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Insights Subtype</Label>
                          <Select
                            options={[
                              { value: "multi_source_reasoning", label: "Multi-Source Reasoning" },
                              { value: "two_part_analysis", label: "Two-Part Analysis" },
                              { value: "table_analysis", label: "Table Analysis" },
                              { value: "graphics_interpretation", label: "Graphics Interpretation" },
                            ]}
                            defaultValue={diSubtype}
                            onChange={(v: string) => setValue("dataInsights.subtype", v)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}

                      {/* Tags */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tags <span className="text-xs text-gray-400">(comma separated)</span>
                        </Label>
                        <Input
                          type="text"
                          placeholder="algebra, probability, reading..."
                          value={watchTags}
                          onChange={(e) => setValue("tags", e.target.value)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Stimulus */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stimulus / Passage</Label>
                        <RichTextEditor
                          header={true}
                          initialValue={watchStimulus}
                          onChange={(html) => setValue("stimulus", html)}
                        />
                      </div>

                      {/* Question Text */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Text *</Label>
                        {isPTEType(watchQuestionType) ? (
                          <Input
                            type="text"
                            placeholder="Enter the question"
                            value={watchQuestionText}
                            onChange={(e) => setValue("questionText", e.target.value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <RichTextEditor
                            header={true}
                            initialValue={watchQuestionText}
                            onChange={(html) => setValue("questionText", html)}
                          />
                        )}
                        {errors.questionText && (
                          <p className="mt-1 text-xs text-rose-500">{errors.questionText.message}</p>
                        )}
                      </div>

                      {/* Extra Text for PTE */}
                      {isNewFeild(watchQuestionType) && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Extratext</Label>
                          <Input
                            type="text"
                            placeholder="Enter the listening text"
                            value={watch("typeSpecific.listeningText")}
                            onChange={(e) => setValue("typeSpecific.listeningText", e.target.value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}

                      {/* PTE Fill in Blanks */}
                      {watchQuestionType === "pte_fill_in_blanks" && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Number of Blanks</Label>
                          <Select
                            options={[
                              { value: "1", label: "1 Blank" },
                              { value: "2", label: "2 Blanks" },
                              { value: "3", label: "3 Blanks" },
                              { value: "4", label: "4 Blanks" },
                              { value: "5", label: "5 Blanks" },
                              { value: "6", label: "6 Blanks" },
                              { value: "7", label: "7 Blanks" },
                              { value: "8", label: "8 Blanks" },
                              { value: "9", label: "9 Blanks" },
                            ]}
                            defaultValue={(watch("typeSpecific.blanks")?.toString() || "1")}
                            onChange={(value: string) => setValue("typeSpecific.blanks", value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                          {watch("typeSpecific.blanks") && Array.from({ length: Number(watch("typeSpecific.blanks")) }).map((_, index) => (
                            <div key={index} className="mt-3">
                              <Label className="text-xs text-gray-600 dark:text-gray-400">Blank {index + 1} Options</Label>
                              <Input
                                type="text"
                                placeholder={`Options for Blank ${index + 1} (comma separated)`}
                                value={watch(`typeSpecific.options.${index}`)}
                                onChange={(e) => setValue(`typeSpecific.options.${index}`, e.target.value)}
                                className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {(isPTEType(watchQuestionType) || isNewFeild(watchQuestionType)) && (
                        <div>
                          <AudioUploadComponent
                            questionText={watch("typeSpecific.listeningText") || watchQuestionText}
                            initialAudioUrl={editingQuestion?.typeSpecific?.audio || ""}
                            onAudioChange={(audioData) => {
                              setAudioData(audioData);
                              setValue("typeSpecific.audio", audioData);
                            }}
                            disabled={saving}
                          />
                        </div>
                      )}

                      {/* MCQ Options or Text Answer */}
                      {isDataInsights ? (
                        <GMATDataInsightsBlock
                          isMultiSource={isMultiSource}
                          isTwoPart={isTwoPart}
                          isTable={isTable}
                          isGraphics={isGraphics}
                          watch={watch}
                          setValue={setValue}
                          control={control}
                          useFieldArray={useFieldArray}
                        />
                      ) : isMCQ ? (
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Options <HelpCircle className="inline h-3 w-3 text-gray-400" />
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
                              className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs text-white  transition-all hover:"
                            >
                              <Plus className="h-3 w-3" />
                              Add Option
                            </button>
                          </div>
                          <div className="space-y-2">
                            {optionFields.map((field, index) => (
                              <motion.div
                                key={field.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                              >
                                <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <div className="flex-1 space-y-1">
                                  {/* <Input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    value={watch(`options.${index}.text`)}
                                    onChange={(e) => setValue(`options.${index}.text`, e.target.value)}
                                    className="rounded-xl border-gray-200 dark:border-gray-700"
                                  /> */}
                                  <RichTextEditor
                                    header={true}
                                    initialValue={watch(`options.${index}.text`)}
                                    onChange={(html) => setValue(`options.${index}.text`, html)}
                                  />
                                  <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">

                                    <input
                                      type="checkbox"
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={watch(`options.${index}.isCorrect`)}
                                      onChange={(e) => setValue(`options.${index}.isCorrect`, e.target.checked)}
                                    />
                                    Correct answer
                                  </label>
                                </div>
                                {optionFields.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Correct Answer</Label>
                          <RichTextEditor
                            header={true}
                            initialValue={watchCorrectAnswerText}
                            onChange={(html) => setValue("correctAnswerText", html)}
                          />
                          {/* <Input
                            type="text"
                            placeholder="Enter the correct answer"
                            value={watchCorrectAnswerText}
                            onChange={(e) => setValue("correctAnswerText", e.target.value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          /> */}
                        </div>
                      )}

                      {/* Text Completion */}
                      {watchQuestionType === "gre_verbal_text_completion" && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Number of Blanks</Label>
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
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />

                          {[...Array(watch("typeSpecific.blanks") || 1)].map((_, blankIndex) => {
                            const blankOptions = (watch("typeSpecific.options") || [])
                              .filter(opt => opt.blankIndex === blankIndex);

                            return (
                              <div key={blankIndex} className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                <div className="mb-3 flex items-center justify-between">
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Blank {blankIndex + 1}</Label>
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
                                    className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Option
                                  </button>
                                </div>

                                {blankOptions.map((opt, idx) => {
                                  const globalIndex = (watch("typeSpecific.options") || []).findIndex(
                                    o => o.blankIndex === blankIndex && o.label === opt.label
                                  );
                                  return (
                                    <div key={`${blankIndex}-${opt.label}`} className="mb-2 flex items-start gap-3">
                                      <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-mono font-bold dark:bg-gray-700">
                                        {opt.label}
                                      </div>
                                      <div className="flex-1">
                                        <Input
                                          value={opt.text}
                                          onChange={(e) => {
                                            const opts = [...(watch("typeSpecific.options") || [])];
                                            opts[globalIndex] = { ...opts[globalIndex], text: e.target.value };
                                            setValue("typeSpecific.options", opts);
                                          }}
                                          placeholder={`Option text for Blank ${blankIndex + 1}`}
                                          className="rounded-xl border-gray-200 dark:border-gray-700"
                                        />
                                      </div>
                                      <div className="mt-2">
                                        <label className="flex items-center gap-1.5 text-sm">
                                          <input
                                            type="checkbox"
                                            checked={opt.isCorrect}
                                            onChange={(e) => {
                                              const opts = [...(watch("typeSpecific.options") || [])];
                                              opts.forEach(o => {
                                                if (o.blankIndex === blankIndex) {
                                                  o.isCorrect = false;
                                                }
                                              });
                                              opts[globalIndex] = { ...opts[globalIndex], isCorrect: e.target.checked };
                                              setValue("typeSpecific.options", opts);
                                            }}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                                          className="mt-2 text-rose-500 hover:text-rose-700"
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

                      {/* Marks */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Marks</Label>
                          <Input
                            type="number"
                            step="0.25"
                            value={watchMarks}
                            onChange={(e) => setValue("marks", parseFloat(e.target.value) || 0)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Negative Marks</Label>
                          <Input
                            type="number"
                            step="0.25"
                            value={watchNegativeMarks}
                            onChange={(e) => setValue("negativeMarks", parseFloat(e.target.value) || 0)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* Explanation & Source */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Explanation</Label>
                        <RichTextEditor
                          header={true}
                          initialValue={watchExplanation}
                          onChange={(html) => setValue("explanation", html)}
                        />
                        {/* <Input
                          type="text"
                          placeholder="Explain why this answer is correct"
                          value={watchExplanation}
                          onChange={(e) => setValue("explanation", e.target.value)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        /> */}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source</Label>
                        <Input
                          type="text"
                          placeholder="e.g., Official Guide 2024"
                          value={watchSource}
                          onChange={(e) => setValue("source", e.target.value)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="sticky bottom-0 z-10 px-6 w-full flex justify-end gap-3 border-t-2 border-gray-200 bg-white/80 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={closeDrawer}
                        disabled={saving}
                        className="rounded-2xl py-2.5 font-medium border-gray-200 px-6 dark:border-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saving}
                        isLoading={saving}
                        className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-medium py-2.5 text-white  transition-all hover:"
                      >
                        {editingQuestion ? "Save Changes" : "Create Question"}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}