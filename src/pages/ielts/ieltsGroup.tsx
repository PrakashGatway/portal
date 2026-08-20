// IELTSGroupQuestionManagementPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
  Tag,
  Filter,
  Calendar,
  Award,
  Layers,
  TrendingUp,
  Clock,
  Eye,
  Headphones,
  PenTool,
  Mic,
  FileText,
  Link,
  ListOrdered,
  Type,
} from "lucide-react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "../../components/TextEditor";
import { Modal } from "../../components/ui/modal";
import { IELTS_QUESTION_TYPES } from "./ieltsQuestion";

// Group Types organized by section
const GROUP_TYPES = {
  reading: [
    { value: "reading_passage", label: "Reading Passage" },
    { value: "matching", label: "Matching" },
    { value: "summary", label: "Summary" },
    { value: "table", label: "Table" },
    { value: "flow_chart", label: "Flow Chart" },
  ],
  listening: [
    { value: "listening_section", label: "Listening Section" },
    { value: "form", label: "Form" },
    { value: "table", label: "Table" },
    { value: "flow_chart", label: "Flow Chart" },
    { value: "map", label: "Map" },
    { value: "matching", label: "Matching" },
  ],
  writing: [{ value: "writing_task", label: "Writing Task" }],
  speaking: [{ value: "speaking_topic", label: "Speaking Topic" }],
};

const SECTION_OPTIONS = [
  { value: "reading", label: "Reading", icon: BookOpen },
  { value: "listening", label: "Listening", icon: Headphones },
  { value: "writing", label: "Writing", icon: PenTool },
  { value: "speaking", label: "Speaking", icon: Mic },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

interface Passage {
  _id: string;
  title: string;
  content: string;
  topic?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface QuestionSet {
  title?: string;
  instructions?: string;
  questions: Array<{
    _id: string;
    content: string;
    questionType: string;
    marks: number;
    [key: string]: any;
  }>;
}

interface GroupQuestion {
  _id: string;
  section: string;
  groupType: string;
  title: string;
  instructions?: string;
  questionSets: QuestionSet[];
  content?: string;
  passage?: string | Passage; // Passage ID or populated passage
  isActive: boolean;
  createdAt?: string;
}

interface GroupQuestionFormValues {
  section: string;
  groupType: string;
  title: string;
  instructions: string;
  questionSets: QuestionSet[];
  content: string;
  passage: string; // Passage ID
  isActive: boolean;
}

export default function IELTSGroupQuestionManagementPage() {
  const [groupQuestions, setGroupQuestions] = useState<GroupQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingGroupQuestion, setEditingGroupQuestion] =
    useState<GroupQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewGroupQuestion, setPreviewGroupQuestion] =
    useState<GroupQuestion | null>(null);

  // Question picker states
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionPickerFilters, setQuestionPickerFilters] = useState({
    search: "",
    questionType: "all",
    difficulty: "all",
    isActive: "true",
    source: "",
    minMarks: "",
    maxMarks: "",
  });
  const [questionPickerSearch, setQuestionPickerSearch] = useState("");
  const [questionPickerPage, setQuestionPickerPage] = useState(1);
  const [questionPickerLimit, setQuestionPickerLimit] = useState(10);
  const [questionPickerTotalPages, setQuestionPickerTotalPages] = useState(1);
  const [questionPickerTotal, setQuestionPickerTotal] = useState(0);

  // Active question set index for adding questions
  const [activeQuestionSetIndex, setActiveQuestionSetIndex] = useState(0);

  // Passage picker states
  const [availablePassages, setAvailablePassages] = useState<Passage[]>([]);
  const [passagesLoading, setPassagesLoading] = useState(false);
  const [passagePickerSearch, setPassagePickerSearch] = useState("");
  const [passagePickerDebouncedSearch, setPassagePickerDebouncedSearch] =
    useState("");
  const [passagePickerPage, setPassagePickerPage] = useState(1);
  const [passagePickerLimit, setPassagePickerLimit] = useState(10);
  const [passagePickerTotalPages, setPassagePickerTotalPages] = useState(1);
  const [passagePickerTotal, setPassagePickerTotal] = useState(0);
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuestionPickerSearch(questionPickerFilters.search);
      setQuestionPickerPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [questionPickerFilters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPassagePickerDebouncedSearch(passagePickerSearch);
      setPassagePickerPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [passagePickerSearch]);

  const [filters, setFilters] = useState({
    search: "",
    section: "all",
    groupType: "all",
    isActive: "all",
    fromDate: "",
    toDate: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroupQuestions, setTotalGroupQuestions] = useState(0);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GroupQuestionFormValues>({
    defaultValues: {
      section: "reading",
      groupType: "",
      title: "",
      instructions: "",
      questionSets: [{ title: "", instructions: "", questions: [] }],
      content: "",
      passage: "",
      isActive: true,
    },
  });

  const watchSection = watch("section");
  const watchGroupType = watch("groupType");
  const watchTitle = watch("title");
  const watchInstructions = watch("instructions");
  const watchQuestionSets = watch("questionSets");
  const watchContent = watch("content");
  const watchPassage = watch("passage");
  const watchIsActive = watch("isActive");

  const fetchGroupQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit,
        populate: "true",
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.section !== "all") params.section = filters.section;
      if (filters.groupType !== "all") params.groupType = filters.groupType;
      if (filters.isActive !== "all") params.isActive = filters.isActive;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const res = await api.get("/ielts/group", { params });

      if (res.data?.success) {
        const data = res.data.data || [];
        setGroupQuestions(data);
        const pagination = res.data.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalGroupQuestions(pagination.total || data.length);
        } else {
          setTotalPages(1);
          setTotalGroupQuestions(data.length);
        }
      } else {
        setGroupQuestions([]);
        setTotalPages(1);
        setTotalGroupQuestions(0);
        setError("Failed to load group questions");
      }
    } catch (err: any) {
      console.error("Fetch group questions error:", err);
      setError(err.response?.data?.message || "Failed to load group questions");
      toast.error(
        err.response?.data?.message || "Failed to load group questions",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableQuestions = async () => {
    try {
      setQuestionsLoading(true);

      const params: any = {
        page: questionPickerPage,
        limit: questionPickerLimit,
        section: watchSection,
        isActive: questionPickerFilters.isActive,
      };

      if (questionPickerSearch) {
        params.search = questionPickerSearch;
      }

      if (questionPickerFilters.questionType !== "all") {
        params.questionType = questionPickerFilters.questionType;
      }

      if (questionPickerFilters.difficulty !== "all") {
        params.difficulty = questionPickerFilters.difficulty;
      }

      if (questionPickerFilters.source) {
        params.source = questionPickerFilters.source;
      }

      if (questionPickerFilters.minMarks) {
        params.minMarks = questionPickerFilters.minMarks;
      }

      if (questionPickerFilters.maxMarks) {
        params.maxMarks = questionPickerFilters.maxMarks;
      }

      const res = await api.get("/ielts/questions", { params });

      if (res.data?.success) {
        setAvailableQuestions(res.data.data || []);
        const pagination = res.data.pagination;
        setQuestionPickerTotal(pagination?.total || res.data.data?.length || 0);
        setQuestionPickerTotalPages(pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Fetch available questions error:", err);
      toast.error(err.response?.data?.message || "Failed to load questions");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchAvailablePassages = async () => {
    try {
      setPassagesLoading(true);

      const params: any = {
        page: passagePickerPage,
        limit: passagePickerLimit,
      };

      if (passagePickerDebouncedSearch) {
        params.search = passagePickerDebouncedSearch;
      }

      const res = await api.get("/ielts/passages", { params });

      if (res.data?.success) {
        setAvailablePassages(res.data.data || []);
        const pagination = res.data.pagination;
        setPassagePickerTotal(pagination?.total || res.data.data?.length || 0);
        setPassagePickerTotalPages(pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Fetch available passages error:", err);
      toast.error(err.response?.data?.message || "Failed to load passages");
    } finally {
      setPassagesLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupQuestions();
  }, [
    page,
    limit,
    debouncedSearch,
    filters.section,
    filters.groupType,
    filters.isActive,
    filters.fromDate,
    filters.toDate,
  ]);

  useEffect(() => {
    if (!sideOpen || !watchSection) {
      return;
    }

    fetchAvailableQuestions();
  }, [
    sideOpen,
    watchSection,
    questionPickerPage,
    questionPickerLimit,
    questionPickerSearch,
    questionPickerFilters.questionType,
    questionPickerFilters.difficulty,
    questionPickerFilters.isActive,
    questionPickerFilters.source,
    questionPickerFilters.minMarks,
    questionPickerFilters.maxMarks,
  ]);

  // Fetch passages when drawer opens (mainly for reading section)
  useEffect(() => {
    if (!sideOpen) {
      return;
    }

    fetchAvailablePassages();
  }, [
    sideOpen,
    passagePickerPage,
    passagePickerLimit,
    passagePickerDebouncedSearch,
  ]);

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
      section: "all",
      groupType: "all",
      isActive: "all",
      fromDate: "",
      toDate: "",
    });
    setDebouncedSearch("");
    setPage(1);
  };

  const openCreateDrawer = () => {
    setEditingGroupQuestion(null);

    setQuestionPickerFilters({
      search: "",
      questionType: "all",
      difficulty: "all",
      isActive: "true",
      source: "",
      minMarks: "",
      maxMarks: "",
    });

    setQuestionPickerSearch("");
    setQuestionPickerPage(1);
    setQuestionPickerLimit(10);
    setActiveQuestionSetIndex(0);

    setPassagePickerSearch("");
    setPassagePickerDebouncedSearch("");
    setPassagePickerPage(1);
    setPassagePickerLimit(10);
    setSelectedPassage(null);

    reset({
      section: "reading",
      groupType: "",
      title: "",
      instructions: "",
      questionSets: [{ title: "", instructions: "", questions: [] }],
      content: "",
      passage: "",
      isActive: true,
    });

    setSideOpen(true);
  };

  useEffect(() => {
    if (!sideOpen) return;

    setQuestionPickerPage(1);
    setQuestionPickerFilters((prev) => ({
      ...prev,
      search: "",
      questionType: "all",
      source: "",
      minMarks: "",
      maxMarks: "",
    }));
    setQuestionPickerSearch("");

    // Reset passage picker when section changes
    setPassagePickerSearch("");
    setPassagePickerDebouncedSearch("");
    setPassagePickerPage(1);
    setSelectedPassage(null);
    setValue("passage", "");
  }, [watchSection]);

  const openEditDrawer = (groupQuestion: GroupQuestion) => {
    setEditingGroupQuestion(groupQuestion);
    setActiveQuestionSetIndex(0);

    // Set selected passage if exists
    if (typeof groupQuestion.passage === "object" && groupQuestion.passage) {
      setSelectedPassage(groupQuestion.passage as Passage);
    } else if (groupQuestion.passage) {
      setSelectedPassage({
        _id: groupQuestion.passage as string,
        title: "",
        content: "",
      });
    } else {
      setSelectedPassage(null);
    }

    reset({
      section: groupQuestion.section,
      groupType: groupQuestion.groupType,
      title: groupQuestion.title || "",
      instructions: groupQuestion.instructions || "",
      questionSets: groupQuestion.questionSets?.map((qs) => ({
        title: qs.title || "",
        instructions: qs.instructions || "",
        questions: qs.questions?.map((q) => q._id) || [],
      })) || [{ title: "", instructions: "", questions: [] }],
      content: groupQuestion.content || "",
      passage:
        typeof groupQuestion.passage === "object"
          ? (groupQuestion.passage as Passage)._id
          : (groupQuestion.passage as string) || "",
      isActive: groupQuestion.isActive,
    });
    setSideOpen(true);
  };

  const closeDrawer = () => {
    setSideOpen(false);
    setTimeout(() => {
      setEditingGroupQuestion(null);
    }, 150);
  };

  const onSubmit = async (values: GroupQuestionFormValues) => {
    try {
      if (!values.section) {
        toast.error("Please select a section");
        return;
      }
      if (!values.groupType) {
        toast.error("Please select a group type");
        return;
      }
      if (!values.title.trim()) {
        toast.error("Title is required");
        return;
      }
      if (!values.questionSets || values.questionSets.length === 0) {
        toast.error("At least one question set is required");
        return;
      }

      setSaving(true);

      const payload: any = {
        section: values.section,
        groupType: values.groupType,
        title: values.title,
        instructions: values.instructions || undefined,
        questionSets: values.questionSets.map((qs) => ({
          title: qs.title || undefined,
          instructions: qs.instructions || undefined,
          questions: qs.questions || [],
        })),
        content: values.content || undefined,
        passage: values.passage || undefined,
        isActive: values.isActive,
      };

      if (editingGroupQuestion) {
        await api.put(`/ielts/group/${editingGroupQuestion._id}`, payload);
        toast.success("Group question updated successfully");
      } else {
        await api.post("/ielts/group", payload);
        toast.success("Group question created successfully");
      }
      closeDrawer();
      fetchGroupQuestions();
    } catch (err: any) {
      console.error("Save group question error:", err);
      toast.error(
        err.response?.data?.message || "Failed to save group question",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gq: GroupQuestion) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this group question? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/ielts/group/${gq._id}`);
      toast.success("Group question deleted successfully");
      fetchGroupQuestions();
    } catch (err: any) {
      console.error("Delete group question error:", err);
      toast.error(
        err.response?.data?.message || "Failed to delete group question",
      );
    }
  };

  const handleToggleStatus = async (gq: GroupQuestion) => {
    try {
      await api.patch(`/ielts/group/${gq._id}/status`);
      toast.success(
        `Group question ${!gq.isActive ? "activated" : "deactivated"} successfully`,
      );
      fetchGroupQuestions();
    } catch (err: any) {
      console.error("Toggle status error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update group question status",
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSectionIcon = (section: string) => {
    const found = SECTION_OPTIONS.find((s) => s.value === section);
    return found?.icon || FileText;
  };

  const getGroupTypeLabel = (section: string, groupType: string) => {
    const types = GROUP_TYPES[section as keyof typeof GROUP_TYPES] || [];
    return types.find((t) => t.value === groupType)?.label || groupType;
  };

  const getTotalQuestionsCount = (gq: GroupQuestion) => {
    return (
      gq.questionSets?.reduce(
        (total, qs) => total + (qs.questions?.length || 0),
        0,
      ) || 0
    );
  };

  const getPassageTitle = (gq: GroupQuestion) => {
    if (typeof gq.passage === "object" && gq.passage) {
      return (gq.passage as Passage).title || "Untitled Passage";
    }
    return null;
  };

  // Question Set Management Functions
  const addQuestionSet = () => {
    const currentSets = watchQuestionSets || [];
    setValue("questionSets", [
      ...currentSets,
      { title: "", instructions: "", questions: [] },
    ]);
    setActiveQuestionSetIndex(currentSets.length);
  };

  const removeQuestionSet = (index: number) => {
    const currentSets = watchQuestionSets || [];
    const newSets = currentSets.filter((_, i) => i !== index);
    setValue("questionSets", newSets);
    if (activeQuestionSetIndex >= newSets.length) {
      setActiveQuestionSetIndex(Math.max(0, newSets.length - 1));
    }
  };

  const isQuestionSelectedInSet = (questionId: string, setIndex: number) => {
    return (
      watchQuestionSets?.[setIndex]?.questions?.includes(questionId) || false
    );
  };

  const toggleQuestionInSet = (questionId: string, setIndex: number) => {
    const currentSets = watchQuestionSets || [];
    const currentQuestions = currentSets[setIndex]?.questions || [];
    if (currentQuestions.includes(questionId)) {
      currentSets[setIndex].questions = currentQuestions.filter(
        (id) => id !== questionId,
      );
    } else {
      currentSets[setIndex].questions = [...currentQuestions, questionId];
    }
    setValue("questionSets", [...currentSets]);
  };

  return (
    <>
      <div className="relative min-h-screen">
        {/* Preview Modal */}
        <Modal
          isOpen={preview}
          onClose={() => {
            setPreview(false);
            setPreviewGroupQuestion(null);
          }}
          className="max-w-4xl"
        >
          <div className="flex flex-col h-full max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Group Question Preview
                </h3>
                {previewGroupQuestion && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {previewGroupQuestion.section.charAt(0).toUpperCase() +
                        previewGroupQuestion.section.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getGroupTypeLabel(
                        previewGroupQuestion.section,
                        previewGroupQuestion.groupType,
                      )}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setPreview(false);
                  setPreviewGroupQuestion(null);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {previewGroupQuestion && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {previewGroupQuestion.title}
                  </h2>

                  {previewGroupQuestion.instructions && (
                    <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Instructions: {previewGroupQuestion.instructions}
                      </p>
                    </div>
                  )}

                  {previewGroupQuestion.passage && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900/20">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          Linked Passage: {getPassageTitle(previewGroupQuestion)}
                        </span>
                      </div>
                    </div>
                  )}

                  {previewGroupQuestion.content && (
                    <div className="prose dark:prose-invert max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: previewGroupQuestion.content,
                        }}
                      />
                    </div>
                  )}

                  {previewGroupQuestion.questionSets?.map((qs, setIndex) => (
                    <div
                      key={setIndex}
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          {qs.title || `Question Set ${setIndex + 1}`}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {qs.questions?.length || 0} questions
                        </span>
                      </div>

                      {qs.instructions && (
                        <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                          {qs.instructions}
                        </p>
                      )}

                      <div className="space-y-2">
                        {qs.questions?.map((q, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50"
                          >
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: q.content }}
                              />
                              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{q.questionType}</span>
                                <span>Marks: {q.marks}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!qs.questions?.length && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No questions in this set
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {previewGroupQuestion && (
              <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Status:{" "}
                      <span
                        className={`font-medium ${
                          previewGroupQuestion.isActive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {previewGroupQuestion.isActive ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreview(false);
                      if (previewGroupQuestion) {
                        openEditDrawer(previewGroupQuestion);
                      }
                    }}
                    className="rounded-xl px-4 py-2 text-xs"
                  >
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    Edit Group
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        <div className="container mx-auto px-4">
          <div className="relative flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
                IELTS Group Question Management
                <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-medium">
                  {totalGroupQuestions}
                </span>
              </h1>
              <p className="text-sm">
                Create and manage grouped questions for reading passages,
                listening sections, and more
              </p>
            </div>
            <Button
              onClick={openCreateDrawer}
              size="sm"
              className="flex items-center gap-1 rounded-2xl font-medium bg-orange-600 transition-all hover:scale-105 px-3 !py-2.5"
            >
              <Plus className="h-4 w-4" />
              New Group Question
            </Button>
          </div>

          {/* Filters Card */}
          <div className="border mb-4 bg-white dark:border-gray-800/50 dark:bg-gray-900/80 rounded-2xl">
            <div className="p-6 pb-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 text-white">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span>Filters</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (
                    {
                      Object.values(filters).filter(
                        (v) => v !== "all" && v !== "",
                      ).length
                    }{" "}
                    active)
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Search */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search group questions..."
                      className="w-full rounded-lg border border-gray-200 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Section filter */}
                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Sections" },
                      ...SECTION_OPTIONS.map((s) => ({
                        value: s.value,
                        label: s.label,
                      })),
                    ]}
                    defaultValue={filters.section}
                    onChange={(value: string) => {
                      setFilters((prev) => ({
                        ...prev,
                        section: value,
                        groupType: "all",
                      }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Group Type filter */}
                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Types" },
                      ...(filters.section !== "all"
                        ? GROUP_TYPES[
                            filters.section as keyof typeof GROUP_TYPES
                          ] || []
                        : Object.values(GROUP_TYPES).flat()
                      ).map((t) => ({ value: t.value, label: t.label })),
                    ]}
                    defaultValue={filters.groupType}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, groupType: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Status filter */}
                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "true", label: "Active" },
                      { value: "false", label: "Inactive" },
                    ]}
                    defaultValue={filters.isActive}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, isActive: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Date filters */}
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">
                    From Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        fromDate: e.target.value,
                      }));
                      setPage(1);
                    }}
                    className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">
                    To Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        toDate: e.target.value,
                      }));
                      setPage(1);
                    }}
                    className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              {/* Meta line */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pb-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {totalGroupQuestions}
                    </span>
                    <span>group questions found</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <span>Page</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {page}
                    </span>
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

          {/* Group Question List */}
          <div className="space-y-3">
            {loading && (
              <div className="flex flex-col items-center justify-center border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80 rounded-2xl">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading group questions...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5" />
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && groupQuestions.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <Layers className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No group questions found
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or create a new group question
                </p>
                <Button
                  onClick={openCreateDrawer}
                  className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Group Question
                </Button>
              </div>
            )}

            {!loading &&
              !error &&
              groupQuestions.map((gq) => {
                const SectionIcon = getSectionIcon(gq.section);
                const passageTitle = getPassageTitle(gq);
                const totalQuestions = getTotalQuestionsCount(gq);
                return (
                  <motion.div
                    key={gq._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group relative overflow-hidden border border-gray-200 bg-white backdrop-blur-sm transition-all hover:-translate-y-1 dark:border-gray-800/50 dark:bg-gray-900/80 rounded-2xl"
                  >
                    <div className="relative p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Tags Row */}
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {/* Section Badge */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                              <SectionIcon className="h-3 w-3" />
                              {gq.section.charAt(0).toUpperCase() +
                                gq.section.slice(1)}
                            </span>

                            {/* Group Type Badge */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                              <Type className="h-3 w-3" />
                              {getGroupTypeLabel(gq.section, gq.groupType)}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                gq.isActive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400"
                              }`}
                            >
                              {gq.isActive ? "Active" : "Inactive"}
                            </span>

                            {/* Question Count Badge */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                              <ListOrdered className="h-3 w-3" />
                              {totalQuestions} Questions
                            </span>

                            {/* Question Sets Badge */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                              <Layers className="h-3 w-3" />
                              {gq.questionSets?.length || 0} Sets
                            </span>

                            {/* Passage Badge */}
                            {passageTitle && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                <BookOpen className="h-3 w-3" />
                                {passageTitle.length > 30
                                  ? passageTitle.substring(0, 30) + "..."
                                  : passageTitle}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {gq.title}
                          </h3>

                          {/* Instructions */}
                          {gq.instructions && (
                            <p className="mb-2 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                              <span className="font-medium">Instructions:</span>{" "}
                              {gq.instructions}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col items-center gap-2 lg:flex-shrink-0">
                          <div className="flex items-center gap-2 lg:flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl px-4 py-2 text-xs border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:border-gray-700 dark:hover:border-green-500 dark:hover:bg-green-500/10"
                              onClick={() => {
                                setPreviewGroupQuestion(gq);
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
                              onClick={() => openEditDrawer(gq)}
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl px-4 py-2 text-xs border-gray-200 text-rose-600 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:border-gray-700 dark:hover:border-rose-500 dark:hover:bg-rose-500/10"
                              onClick={() => handleDelete(gq)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <button
                              onClick={() => handleToggleStatus(gq)}
                              className={`hover:text-blue-600 dark:hover:text-blue-400 ${!gq.isActive ? "text-emerald-600" : "text-gray-400"}`}
                              title={gq.isActive ? "Deactivate" : "Activate"}
                            >
                              {gq.isActive ? "Deactivate" : "Activate"}
                            </button>
                            {gq.createdAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(gq.createdAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Side Drawer */}
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
                  className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
                  onClick={saving ? undefined : closeDrawer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />

                <motion.div
                  className="relative ml-auto flex h-full overflow-hidden w-full max-w-3xl rounded-3xl border-4 border-gray-400 flex-col bg-white shadow-2xl dark:bg-gray-900"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 dark:border-gray-800">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                        {editingGroupQuestion
                          ? "Edit Group Question"
                          : "Create New Group Question"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {watchGroupType
                          ? getGroupTypeLabel(watchSection, watchGroupType)
                          : "Select a group type"}
                      </p>
                    </div>
                    <button
                      onClick={saving ? undefined : closeDrawer}
                      className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      disabled={saving}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto"
                  >
                    <div className="px-6 space-y-4 py-4">
                      {/* Section and Group Type */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Section *
                          </Label>
                          <Select
                            options={SECTION_OPTIONS.map((s) => ({
                              value: s.value,
                              label: s.label,
                            }))}
                            defaultValue={watchSection}
                            onChange={(value: string) => {
                              setValue("section", value);
                              setValue("groupType", "");
                            }}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Group Type *
                          </Label>
                          <Select
                            options={
                              GROUP_TYPES[
                                watchSection as keyof typeof GROUP_TYPES
                              ] || []
                            }
                            defaultValue={watchGroupType}
                            onChange={(value: string) =>
                              setValue("groupType", value)
                            }
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title *
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter group title"
                          value={watchTitle}
                          onChange={(e) => setValue("title", e.target.value)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Instructions */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Instructions
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter instructions for this group"
                          value={watchInstructions}
                          onChange={(e) =>
                            setValue("instructions", e.target.value)
                          }
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Content */}
                      {/* <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Content
                        </Label>
                        <RichTextEditor
                          value={watchContent || ""}
                          onChange={(html) => setValue("content", html)}
                          placeholder="Enter content for this group"
                        />
                      </div> */}

                      {/* Passage Picker - Show for reading section */}
                      {watchSection === "reading" && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Link Passage
                          </Label>

                          {selectedPassage ? (
                            <div className="mt-2 rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900/20">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                      {selectedPassage.title}
                                    </span>
                                  </div>
                                  {selectedPassage.topic && (
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                      Topic: {selectedPassage.topic}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPassage(null);
                                    setValue("passage", "");
                                  }}
                                  className="rounded-full p-1 text-purple-400 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 rounded-2xl border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
                              {/* Search */}
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={passagePickerSearch}
                                  onChange={(e) => {
                                    setPassagePickerSearch(e.target.value);
                                  }}
                                  placeholder="Search passages..."
                                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                />
                              </div>

                              {/* Passage list */}
                              <div className="mt-2 max-h-[240px] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                {passagesLoading ? (
                                  <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                  </div>
                                ) : availablePassages.length === 0 ? (
                                  <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No passages found
                                  </div>
                                ) : (
                                  availablePassages.map((passage) => (
                                    <button
                                      key={passage._id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedPassage(passage);
                                        setValue("passage", passage._id);
                                      }}
                                      className="flex w-full items-start gap-3 border-b p-3 text-left transition last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    >
                                      <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                          {passage.title}
                                        </p>
                                        {passage.topic && (
                                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            {passage.topic}
                                          </p>
                                        )}
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>

                              {/* Pagination */}
                              {passagePickerTotalPages > 1 && (
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    Page {passagePickerPage} of{" "}
                                    {passagePickerTotalPages}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={passagePickerPage <= 1}
                                      onClick={() =>
                                        setPassagePickerPage((p) =>
                                          Math.max(1, p - 1),
                                        )
                                      }
                                      className="rounded-lg px-2 py-1"
                                    >
                                      <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={
                                        passagePickerPage >=
                                        passagePickerTotalPages
                                      }
                                      onClick={() =>
                                        setPassagePickerPage((p) =>
                                          Math.min(
                                            passagePickerTotalPages,
                                            p + 1,
                                          ),
                                        )
                                      }
                                      className="rounded-lg px-2 py-1"
                                    >
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Sets */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Question Sets *
                          </Label>
                          <button
                            type="button"
                            onClick={addQuestionSet}
                            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs text-white"
                          >
                            <Plus className="h-3 w-3" />
                            Add Question Set
                          </button>
                        </div>

                        {/* Question Set Tabs */}
                        {watchQuestionSets?.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {watchQuestionSets.map((_, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setActiveQuestionSetIndex(index)}
                                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                                  activeQuestionSetIndex === index
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                }`}
                              >
                                Set {index + 1}
                                {watchQuestionSets[index]?.questions?.length >
                                  0 && (
                                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                                    {watchQuestionSets[index].questions.length}
                                  </span>
                                )}
                                {watchQuestionSets.length > 1 && (
                                  <X
                                    className="h-3 w-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeQuestionSet(index);
                                    }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Active Question Set */}
                        {watchQuestionSets?.length > 0 &&
                          activeQuestionSetIndex < watchQuestionSets.length && (
                            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/30">
                              {/* Question Set Title */}
                              <div className="mb-3">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Set Title
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="e.g., Questions 1-5"
                                  value={
                                    watchQuestionSets[activeQuestionSetIndex]
                                      ?.title || ""
                                  }
                                  onChange={(e) => {
                                    const currentSets = [...watchQuestionSets];
                                    currentSets[activeQuestionSetIndex].title =
                                      e.target.value;
                                    setValue("questionSets", currentSets);
                                  }}
                                  className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                />
                              </div>

                              {/* Question Set Instructions */}
                              <div className="mb-3">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Set Instructions
                                </Label>
                                <Input
                                  type="text"
                                  placeholder="e.g., Answer the following questions"
                                  value={
                                    watchQuestionSets[activeQuestionSetIndex]
                                      ?.instructions || ""
                                  }
                                  onChange={(e) => {
                                    const currentSets = [...watchQuestionSets];
                                    currentSets[
                                      activeQuestionSetIndex
                                    ].instructions = e.target.value;
                                    setValue("questionSets", currentSets);
                                  }}
                                  className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                />
                              </div>

                              {/* Selected Questions Count */}
                              <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Questions in this set:{" "}
                                  <span className="text-blue-600 dark:text-blue-400">
                                    {watchQuestionSets[activeQuestionSetIndex]
                                      ?.questions?.length || 0}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentSets = [...watchQuestionSets];
                                    currentSets[activeQuestionSetIndex].questions =
                                      [];
                                    setValue("questionSets", currentSets);
                                  }}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Clear all questions
                                </button>
                              </div>

                              {/* Question Picker */}
                              <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                                {/* Search */}
                                <div className="relative">
                                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    value={questionPickerFilters.search}
                                    onChange={(e) => {
                                      setQuestionPickerFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                      }));
                                    }}
                                    placeholder="Search questions..."
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                  />
                                </div>

                                {/* Filters */}
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  <Select
                                    options={[
                                      {
                                        value: "all",
                                        label: "All Question Types",
                                      },
                                      ...(IELTS_QUESTION_TYPES[
                                        watchSection as keyof typeof IELTS_QUESTION_TYPES
                                      ] || []),
                                    ]}
                                    defaultValue={
                                      questionPickerFilters.questionType
                                    }
                                    onChange={(value: string) => {
                                      setQuestionPickerFilters((prev) => ({
                                        ...prev,
                                        questionType: value,
                                      }));
                                      setQuestionPickerPage(1);
                                    }}
                                  />
                                  <Select
                                    options={[
                                      { value: "all", label: "All Difficulty" },
                                      { value: "Easy", label: "Easy" },
                                      { value: "Medium", label: "Medium" },
                                      { value: "Hard", label: "Hard" },
                                    ]}
                                    defaultValue={
                                      questionPickerFilters.difficulty
                                    }
                                    onChange={(value: string) => {
                                      setQuestionPickerFilters((prev) => ({
                                        ...prev,
                                        difficulty: value,
                                      }));
                                      setQuestionPickerPage(1);
                                    }}
                                  />
                                </div>

                                {/* Results count */}
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                  <span>
                                    {questionPickerTotal} questions found
                                  </span>
                                  <select
                                    value={questionPickerLimit}
                                    onChange={(e) => {
                                      setQuestionPickerLimit(
                                        Number(e.target.value),
                                      );
                                      setQuestionPickerPage(1);
                                    }}
                                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                  </select>
                                </div>

                                {/* Question list */}
                                <div className="mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                                  {questionsLoading ? (
                                    <div className="flex items-center justify-center p-8">
                                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                    </div>
                                  ) : availableQuestions.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                      No questions found with the selected
                                      filters.
                                    </div>
                                  ) : (
                                    availableQuestions.map((q) => {
                                      const selected = isQuestionSelectedInSet(
                                        q._id,
                                        activeQuestionSetIndex,
                                      );
                                      return (
                                        <label
                                          key={q._id}
                                          className={`flex cursor-pointer items-start gap-3 border-b p-3 transition last:border-b-0 ${
                                            selected
                                              ? "bg-blue-50 dark:bg-blue-900/20"
                                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={(e) => {
                                              toggleQuestionInSet(
                                                q._id,
                                                activeQuestionSetIndex,
                                              );
                                            }}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <div
                                              className="line-clamp-2 text-sm text-gray-900 dark:text-gray-100"
                                              dangerouslySetInnerHTML={{
                                                __html: q.content,
                                              }}
                                            />
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                {q.questionType}
                                              </span>
                                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                {q.metadata?.difficulty ||
                                                  "Medium"}
                                              </span>
                                              <span className="text-[10px] text-gray-500">
                                                {q.marks} mark
                                              </span>
                                              {q.source && (
                                                <span className="text-[10px] text-gray-500">
                                                  • {q.source}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {selected && (
                                            <span className="text-xs font-semibold text-blue-600">
                                              Selected
                                            </span>
                                          )}
                                        </label>
                                      );
                                    })
                                  )}
                                </div>

                                {/* Pagination */}
                                {questionPickerTotalPages > 1 && (
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      Page {questionPickerPage} of{" "}
                                      {questionPickerTotalPages}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={questionPickerPage <= 1}
                                        onClick={() =>
                                          setQuestionPickerPage((p) =>
                                            Math.max(1, p - 1),
                                          )
                                        }
                                        className="rounded-xl px-3"
                                      >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          questionPickerPage >=
                                          questionPickerTotalPages
                                        }
                                        onClick={() =>
                                          setQuestionPickerPage((p) =>
                                            Math.min(
                                              questionPickerTotalPages,
                                              p + 1,
                                            ),
                                          )
                                        }
                                        className="rounded-xl px-3"
                                      >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={watchIsActive}
                          onChange={(e) =>
                            setValue("isActive", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Active
                        </Label>
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
                        className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-medium py-2.5 text-white"
                      >
                        {editingGroupQuestion
                          ? "Save Changes"
                          : "Create Group Question"}
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