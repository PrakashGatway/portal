// IELTSQuestionManagementPage.tsx
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
  Upload,
  FileAudio,
  Video,
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

// IELTS Question Types organized by section
export const IELTS_QUESTION_TYPES = {
  reading: [
    { value: "mcq_single", label: "MCQ - Single Answer" },
    { value: "mcq_multiple", label: "MCQ - Multiple Answers" },
    { value: "true_false_ng", label: "True / False / Not Given" },
    { value: "yes_no_ng", label: "Yes / No / Not Given" },
    { value: "matching_headings", label: "Matching Headings" },
    { value: "matching_information", label: "Matching Information" },
    { value: "matching_features", label: "Matching Features" },
    { value: "sentence_completion", label: "Sentence Completion" },
    { value: "summary_completion", label: "Summary Completion" },
    { value: "note_completion", label: "Note Completion" },
    { value: "table_completion", label: "Table Completion" },
    { value: "flow_chart_completion", label: "Flow Chart Completion" },
    { value: "diagram_labeling", label: "Diagram Labeling" },
    { value: "short_answer", label: "Short Answer" },
    { value: "matching_sentence_endings", label: "Matching Sentence Endings" },
    { value: "classification", label: "Classification" },
  ],
  listening: [
    { value: "form_completion", label: "Form Completion" },
    { value: "mcq_single", label: "MCQ - Single Answer" },
    { value: "mcq_multiple", label: "MCQ - Multiple Answers" },
    { value: "matching", label: "Matching" },
    { value: "plan_labeling", label: "Plan Labeling" },
    { value: "map_labeling", label: "Map Labeling" },
    { value: "sentence_completion", label: "Sentence Completion" },
    { value: "summary_completion", label: "Summary Completion" },
    { value: "note_completion", label: "Note Completion" },
    { value: "table_completion", label: "Table Completion" },
    { value: "flow_chart_completion", label: "Flow Chart Completion" },
    { value: "short_answer", label: "Short Answer" },
    { value: "pick_from_list", label: "Pick from List" },
  ],
  writing: [
    { value: "formal_letter", label: "Formal Letter" },
    { value: "semi_formal_letter", label: "Semi-Formal Letter" },
    { value: "informal_letter", label: "Informal Letter" },
    { value: "opinion", label: "Opinion Essay" },
    { value: "discussion", label: "Discussion Essay" },
    { value: "problem_solution", label: "Problem Solution Essay" },
    {
      value: "advantages_disadvantages",
      label: "Advantages Disadvantages Essay",
    },
    { value: "double_question", label: "Double Question Essay" },
  ],
  speaking: [
    { value: "speaking_part_1", label: "Speaking Part 1" },
    { value: "speaking_part_2", label: "Speaking Part 2 (Cue Card)" },
    { value: "speaking_part_3", label: "Speaking Part 3" },
  ],
};

const SECTION_OPTIONS = [
  { value: "reading", label: "Reading", icon: BookOpen },
  { value: "listening", label: "Listening", icon: Headphones },
  { value: "writing", label: "Writing", icon: PenTool },
  { value: "speaking", label: "Speaking", icon: Mic },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

interface Question {
  _id: string;
  section: string;
  questionType: string;
  content: string;
  instructions?: string;
  choices?: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: any;
  correctChoiceLabel?: string;
  constraints?: {
    maxWords?: number;
    minWords?: number;
    maxSelections?: number;
    allowNumbers?: boolean;
  };
  media?: {
    passageId?: any;
    audioUrl?: string;
    imageUrl?: string;
  };
  metadata?: {
    difficulty: string;
    taskType?: string;
    topic?: string;
    cueCardPoints?: string[];
    preparationTime?: number;
    responseTime?: number;
    minWords?: number;
    maxWords?: number;
  };
  marks: number;
  source?: string;
  isActive: boolean;
  createdAt?: string;
}

interface SpeakingContent {
  question: string;
  followUpQuestions?: string[];
  audioUrl?: string;
  videoUrl?: string;
  transcript?: string;
  sampleAnswer?: string;
  tips?: string[];
}

interface QuestionFormValues {
  section: string;
  questionType: string;
  content: string;
  speakingContent: SpeakingContent;
  instructions: string;
  choices: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer: string;
  maxWords: number;
  minWords: number;
  maxSelections: number;
  allowNumbers: boolean;
  audioUrl: string;
  imageUrl: string;
  difficulty: string;
  taskType: string;
  topic: string;
  cueCardPoints: string;
  preparationTime: number;
  responseTime: number;
  writingMinWords: number;
  writingMaxWords: number;
  marks: number;
  source: string;
  isActive: boolean;
}

const isMCQType = (questionType: string) => {
  return ["mcq_single", "mcq_multiple", "pick_from_list"].includes(
    questionType,
  );
};

const isTrueFalseNG = (questionType: string) => {
  return ["true_false_ng", "yes_no_ng"].includes(questionType);
};

const isMatchingType = (questionType: string) => {
  return [
    "matching_headings",
    "matching_information",
    "matching_features",
    "matching",
    "matching_sentence_endings",
    "classification",
  ].includes(questionType);
};

const isCompletionType = (questionType: string) => {
  return [
    "sentence_completion",
    "summary_completion",
    "map_labeling",
    "note_completion",
    "table_completion",
    "flow_chart_completion",
    "diagram_labeling",
    "form_completion",
    "short_answer",
    "matching_headings",
    "matching_information",
    "matching_features",
    "matching",
    "matching_sentence_endings",
    "classification",
  ].includes(questionType);
};

const isWritingType = (questionType: string) => {
  return [
    "formal_letter",
    "semi_formal_letter",
    "informal_letter",
    "opinion",
    "discussion",
    "problem_solution",
    "advantages_disadvantages",
    "double_question",
  ].includes(questionType);
};

const isSpeakingType = (questionType: string) => {
  return ["speaking_part_1", "speaking_part_2", "speaking_part_3"].includes(
    questionType,
  );
};

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

export default function IELTSQuestionManagementPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Speaking states
  const [speakingQuestion, setSpeakingQuestion] = useState("");
  const [speakingFollowUpQuestions, setSpeakingFollowUpQuestions] = useState([
    {
      text: "",
      mediaType: "none",
      mediaUrl: "",
    },
  ]);
  const [speakingAudioUrl, setSpeakingAudioUrl] = useState("");
  const [speakingVideoUrl, setSpeakingVideoUrl] = useState("");
  const [speakingTranscript, setSpeakingTranscript] = useState("");
  const [speakingSampleAnswer, setSpeakingSampleAnswer] = useState("");
  const [speakingTips, setSpeakingTips] = useState<string[]>([""]);
  const [audioUploading, setAudioUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    section: "all",
    questionType: "all",
    difficulty: "all",
    isActive: "all",
    source: "",
    minMarks: "",
    maxMarks: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    defaultValues: {
      section: "reading",
      questionType: "",
      content: "",
      speakingContent: {},
      instructions: "",
      choices: [],
      correctAnswer: "",
      maxWords: null,
      minWords: null,
      maxSelections: null,
      allowNumbers: true,
      audioUrl: "",
      imageUrl: "",
      difficulty: "Medium",
      taskType: "",
      topic: "",
      cueCardPoints: "",
      preparationTime: null,
      responseTime: null,
      writingMinWords: null,
      writingMaxWords: null,
      marks: 1,
      source: "",
      isActive: true,
    },
  });

  const watchSection = watch("section");
  const watchQuestionType = watch("questionType");
  const watchContent = watch("content");
  const watchInstructions = watch("instructions");
  const watchCorrectAnswer = watch("correctAnswer");
  const watchMaxWords = watch("maxWords");
  const watchMinWords = watch("minWords");
  const watchMaxSelections = watch("maxSelections");
  const watchAllowNumbers = watch("allowNumbers");
  const watchAudioUrl = watch("audioUrl");
  const watchImageUrl = watch("imageUrl");
  const watchDifficulty = watch("difficulty");
  const watchTaskType = watch("taskType");
  const watchTopic = watch("topic");
  const watchCueCardPoints = watch("cueCardPoints");
  const watchPreparationTime = watch("preparationTime");
  const watchResponseTime = watch("responseTime");
  const watchWritingMinWords = watch("writingMinWords");
  const watchWritingMaxWords = watch("writingMaxWords");
  const watchMarks = watch("marks");
  const watchSource = watch("source");
  const watchIsActive = watch("isActive");

  const updateSpeakingContent = () => {
    const speakingContent: SpeakingContent = {
      question: speakingQuestion,

      followUpQuestions: speakingFollowUpQuestions.filter(
        (q) => q.text?.trim() || q.mediaUrl,
      ),

      audioUrl: speakingAudioUrl || undefined,
      videoUrl: speakingVideoUrl || undefined,
      transcript: speakingTranscript || undefined,
      sampleAnswer: speakingSampleAnswer || undefined,
      tips: speakingTips.filter((t) => t.trim()),
    };

    setValue("content", JSON.stringify(speakingContent));
    setValue("speakingContent", speakingContent);
  };

  const handleAudioUpload = async (file: File) => {
    try {
      setAudioUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        setSpeakingAudioUrl(res.data.data.url);
        toast.success("Audio uploaded successfully");
        updateSpeakingContent();
      }
    } catch (err: any) {
      console.error("Audio upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload audio");
    } finally {
      setAudioUploading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      setVideoUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        setSpeakingVideoUrl(res.data.data.url);
        toast.success("Video uploaded successfully");
        updateSpeakingContent();
      }
    } catch (err: any) {
      console.error("Video upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload video");
    } finally {
      setVideoUploading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.section !== "all") params.section = filters.section;
      if (filters.questionType !== "all")
        params.questionType = filters.questionType;
      if (filters.difficulty !== "all") params.difficulty = filters.difficulty;
      if (filters.isActive !== "all") params.isActive = filters.isActive;
      if (filters.source) params.source = filters.source;
      if (filters.minMarks) params.minMarks = filters.minMarks;
      if (filters.maxMarks) params.maxMarks = filters.maxMarks;

      const res = await api.get("/ielts/questions", { params });

      if (res.data?.success) {
        const data = res.data.data || [];
        setQuestions(data);
        const pagination = res.data.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
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
  }, [
    page,
    limit,
    debouncedSearch,
    filters.section,
    filters.questionType,
    filters.difficulty,
    filters.isActive,
    filters.source,
    filters.minMarks,
    filters.maxMarks,
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
      questionType: "all",
      difficulty: "all",
      isActive: "all",
      source: "",
      minMarks: "",
      maxMarks: "",
    });
    setDebouncedSearch("");
    setPage(1);
  };

  const openCreateDrawer = () => {
    setEditingQuestion(null);
    setSpeakingQuestion("");
    setSpeakingFollowUpQuestions([
      {
        text: "",
        mediaType: "none",
        mediaUrl: "",
      },
    ]);
    setSpeakingAudioUrl("");
    setSpeakingVideoUrl("");
    setSpeakingTranscript("");
    setSpeakingSampleAnswer("");
    setSpeakingTips([""]);

    reset({
      section: "reading",
      questionType: "",
      content: "",
      speakingContent: {},
      instructions: "",
      choices: [
        { label: "A", text: "", isCorrect: false },
        { label: "B", text: "", isCorrect: false },
      ],
      correctAnswer: "",
      maxWords: null,
      minWords: null,
      maxSelections: null,
      allowNumbers: true,
      audioUrl: "",
      imageUrl: "",
      difficulty: "Medium",
      taskType: "",
      topic: "",
      cueCardPoints: "",
      preparationTime: null,
      responseTime: null,
      writingMinWords: null,
      writingMaxWords: null,
      marks: 1,
      source: "",
      isActive: true,
    });
    setSideOpen(true);
  };

  const openEditDrawer = (question: Question) => {
    setEditingQuestion(question);

    // Parse speaking content if it's JSON
    if (question.section === "speaking" && question.content) {
      try {
        const parsedContent = JSON.parse(question.content);
        setSpeakingQuestion(parsedContent.question || "");
        setSpeakingFollowUpQuestions(
          parsedContent.followUpQuestions?.length
            ? parsedContent.followUpQuestions.map((q: any) => {
                // Backward compatibility with old string questions
                if (typeof q === "string") {
                  return {
                    text: q,
                    mediaType: "none",
                    mediaUrl: "",
                  };
                }

                return {
                  text: q.text || "",
                  mediaType: q.mediaType || "none",
                  mediaUrl: q.mediaUrl || "",
                };
              })
            : [
                {
                  text: "",
                  mediaType: "none",
                  mediaUrl: "",
                },
              ],
        );
        setSpeakingAudioUrl(parsedContent.audioUrl || "");
        setSpeakingVideoUrl(parsedContent.videoUrl || "");
        setSpeakingTranscript(parsedContent.transcript || "");
        setSpeakingSampleAnswer(parsedContent.sampleAnswer || "");
        setSpeakingTips(parsedContent.tips?.length ? parsedContent.tips : [""]);
      } catch (e) {
        setSpeakingQuestion(question.content || "");
        setSpeakingFollowUpQuestions([""]);
        setSpeakingAudioUrl("");
        setSpeakingVideoUrl("");
        setSpeakingTranscript("");
        setSpeakingSampleAnswer("");
        setSpeakingTips([""]);
      }
    }

    reset({
      section: question.section,
      questionType: question.questionType,
      content: question.content,
      speakingContent: isJsonString(question.content)
        ? JSON.parse(question.content)
        : {},
      instructions: question.instructions || "",
      choices: question.choices?.length
        ? question.choices
        : [
            { label: "A", text: "", isCorrect: false },
            { label: "B", text: "", isCorrect: false },
          ],
      correctAnswer:
        typeof question.correctAnswer === "string"
          ? question.correctAnswer
          : "",
      maxWords: question.constraints?.maxWords || null,
      minWords: question.constraints?.minWords || null,
      maxSelections: question.constraints?.maxSelections || null,
      allowNumbers: question.constraints?.allowNumbers ?? true,
      audioUrl: question.media?.audioUrl || "",
      imageUrl: question.media?.imageUrl || "",
      difficulty: question.metadata?.difficulty || "Medium",
      taskType: question.metadata?.taskType || "",
      topic: question.metadata?.topic || "",
      cueCardPoints: question.metadata?.cueCardPoints?.join("\n") || "",
      preparationTime: question.metadata?.preparationTime || null,
      responseTime: question.metadata?.responseTime || null,
      writingMinWords: question.metadata?.minWords || null,
      writingMaxWords: question.metadata?.maxWords || null,
      marks: question.marks || 1,
      source: question.source || "",
      isActive: question.isActive,
    });
    setSideOpen(true);
  };

  const closeDrawer = () => {
    setSideOpen(false);
    setTimeout(() => {
      setEditingQuestion(null);
    }, 150);
  };

  const onSubmit = async (values: QuestionFormValues) => {
    try {
      if (!values.section) {
        toast.error("Please select a section");
        return;
      }
      if (!values.questionType) {
        toast.error("Please select question type");
        return;
      }

      // For speaking questions, validate speaking content
      if (isSpeakingType(values.questionType)) {
        if (!speakingQuestion.trim()) {
          toast.error("Speaking question is required");
          return;
        }
        // Ensure content is updated with latest speaking data
        updateSpeakingContent();
        values.content = JSON.stringify({
          question: speakingQuestion,
          followUpQuestions: speakingFollowUpQuestions
            .filter((q) => q.text?.trim() || q.mediaUrl)
            .map((q) => ({
              text: q.text?.trim() || "",
              mediaType: q.mediaType || "none",
              mediaUrl: q.mediaUrl || undefined,
            })),
          audioUrl: speakingAudioUrl || undefined,
          videoUrl: speakingVideoUrl || undefined,
          transcript: speakingTranscript || undefined,
          sampleAnswer: speakingSampleAnswer || undefined,
          tips: speakingTips.filter((t) => t.trim()),
        });
      } else {
        if (!values.content?.trim()) {
          toast.error("Question content is required");
          return;
        }
      }

      if (isMCQType(values.questionType)) {
        if (!values.choices || values.choices.length < 2) {
          toast.error("MCQ must have at least 2 options");
          return;
        }
        const hasCorrect = values.choices.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          toast.error("Select at least one correct option");
          return;
        }
      }

      if (isWritingType(values.questionType) && !values.writingMinWords) {
        toast.error("Please specify minimum words for writing task");
        return;
      }

      setSaving(true);

      const cueCardPointsArray = values.cueCardPoints
        ? values.cueCardPoints
            .split("\n")
            .map((point) => point.trim())
            .filter(Boolean)
        : undefined;

      const payload: any = {
        section: values.section,
        questionType: values.questionType,
        content: values.content,
        instructions: values.instructions || undefined,
        marks: Number(values.marks) || 1,
        source: values.source || undefined,
        isActive: values.isActive,
        constraints: {
          maxWords: values.maxWords || null,
          minWords: values.minWords || null,
          maxSelections: values.maxSelections || null,
          allowNumbers: values.allowNumbers,
        },
        media: {
          audioUrl: isSpeakingType(values.questionType)
            ? speakingAudioUrl || null
            : values.audioUrl || null,
          imageUrl: values.imageUrl || null,
        },
        metadata: {
          difficulty: values.difficulty,
          taskType: values.taskType || undefined,
          topic: values.topic || undefined,
          cueCardPoints: cueCardPointsArray,
          preparationTime: values.preparationTime || null,
          responseTime: values.responseTime || null,
          minWords: values.writingMinWords || null,
          maxWords: values.writingMaxWords || null,
        },
      };

      if (isMCQType(values.questionType)) {
        payload.choices = values.choices.map((opt, index) => ({
          label: opt.label || String.fromCharCode(65 + index),
          text: opt.text,
          isCorrect: !!opt.isCorrect,
        }));
        payload.correctAnswer = null;
        payload.correctChoiceLabel =
          values.choices.find((opt) => opt.isCorrect)?.label || null;
      } else if (isTrueFalseNG(values.questionType)) {
        payload.choices = [
          {
            label: values.questionType === "true_false_ng" ? "True" : "Yes",
            text: values.questionType === "true_false_ng" ? "True" : "Yes",
            isCorrect: false,
          },
          {
            label: values.questionType === "true_false_ng" ? "False" : "No",
            text: values.questionType === "true_false_ng" ? "False" : "No",
            isCorrect: false,
          },
          { label: "Not Given", text: "Not Given", isCorrect: false },
        ];
        const correctAnswer = values.correctAnswer?.toLowerCase();
        if (correctAnswer) {
          payload.choices = payload.choices.map((choice: any) => ({
            ...choice,
            isCorrect:
              choice.label.toLowerCase() === correctAnswer ||
              (correctAnswer === "not given" && choice.label === "Not Given"),
          }));
        }
        payload.correctAnswer = values.correctAnswer;
      } else {
        payload.correctAnswer = values.correctAnswer || null;
        payload.choices = undefined;
      }

      if (editingQuestion) {
        await api.put(`/ielts/questions/${editingQuestion._id}`, payload);
        toast.success("Question updated successfully");
      } else {
        await api.post("/ielts/questions", payload);
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
    if (
      !window.confirm(
        "Are you sure you want to delete this question? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/ielts/questions/${q._id}`);
      toast.success("Question deleted successfully");
      fetchQuestions();
    } catch (err: any) {
      console.error("Delete question error:", err);
      toast.error(err.response?.data?.message || "Failed to delete question");
    }
  };

  const handleToggleStatus = async (q: Question) => {
    try {
      await api.patch(`/ielts/questions/${q._id}/status`, {
        isActive: !q.isActive,
      });
      toast.success(
        `Question ${!q.isActive ? "activated" : "deactivated"} successfully`,
      );
      fetchQuestions();
    } catch (err: any) {
      console.error("Toggle status error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update question status",
      );
    }
  };

  const handleDuplicate = async (q: Question) => {
    try {
      await api.post(`/ielts/questions/${q._id}/duplicate`);
      toast.success("Question duplicated successfully");
      fetchQuestions();
    } catch (err: any) {
      console.error("Duplicate question error:", err);
      toast.error(
        err.response?.data?.message || "Failed to duplicate question",
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30";
      case "Hard":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const getSectionIcon = (section: string) => {
    const found = SECTION_OPTIONS.find((s) => s.value === section);
    return found?.icon || FileText;
  };

  const getQuestionTypeLabel = (section: string, questionType: string) => {
    const types =
      IELTS_QUESTION_TYPES[section as keyof typeof IELTS_QUESTION_TYPES] || [];
    return types.find((t) => t.value === questionType)?.label || questionType;
  };

  return (
    <>
      <div className="relative min-h-screen dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
        {/* Preview Modal */}
        <Modal
          isOpen={preview}
          onClose={() => {
            setPreview(false);
            setPreviewQuestion(null);
          }}
          className="max-w-4xl"
        >
          <div className="flex flex-col h-full max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Question Preview
                </h3>
                {previewQuestion && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {previewQuestion.section.charAt(0).toUpperCase() +
                        previewQuestion.section.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getQuestionTypeLabel(
                        previewQuestion.section,
                        previewQuestion.questionType,
                      )}
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

            <div className="flex-1 p-6 overflow-y-auto">
              {previewQuestion && (
                <div className="space-y-4">
                  {previewQuestion.instructions && (
                    <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Instructions: {previewQuestion.instructions}
                      </p>
                    </div>
                  )}

                  <div className="prose dark:prose-invert max-w-none">
                    {previewQuestion.section === "speaking" ? (
                      <div className="space-y-4">
                        {(() => {
                          try {
                            const speakingData = JSON.parse(
                              previewQuestion.content,
                            );
                            return (
                              <>
                                <h3 className="text-lg font-semibold">
                                  {speakingData.question ||
                                    previewQuestion.content}
                                </h3>

                                {speakingData.followUpQuestions?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      Follow-up Questions:
                                    </h4>

                                    <div className="mt-2 space-y-3">
                                      {speakingData.followUpQuestions.map(
                                        (
                                          q: SpeakingFollowUpQuestion,
                                          idx: number,
                                        ) => (
                                          <div
                                            key={idx}
                                            className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                                          >
                                            <p className="text-sm font-medium">
                                              {idx + 1}.{" "}
                                              {q.text || "Media question"}
                                            </p>

                                            {/* Audio */}
                                            {q.mediaType === "audio" &&
                                              q.mediaUrl && (
                                                <audio
                                                  controls
                                                  className="mt-2 w-full"
                                                  src={q.mediaUrl}
                                                />
                                              )}

                                            {/* Video */}
                                            {q.mediaType === "video" &&
                                              q.mediaUrl && (
                                                <video
                                                  controls
                                                  className="mt-2 w-full rounded-xl"
                                                  src={q.mediaUrl}
                                                />
                                              )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                                {speakingData.audioUrl && (
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      Audio:
                                    </h4>
                                    <audio controls className="w-full">
                                      <source src={speakingData.audioUrl} />
                                    </audio>
                                  </div>
                                )}

                                {speakingData.videoUrl && (
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      Video:
                                    </h4>
                                    <video
                                      controls
                                      className="w-full rounded-xl"
                                    >
                                      <source src={speakingData.videoUrl} />
                                    </video>
                                  </div>
                                )}

                                {speakingData.transcript && (
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      Transcript:
                                    </h4>
                                    <p className="text-sm">
                                      {speakingData.transcript}
                                    </p>
                                  </div>
                                )}

                                {speakingData.sampleAnswer && (
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      Sample Answer:
                                    </h4>
                                    <p className="text-sm">
                                      {speakingData.sampleAnswer}
                                    </p>
                                  </div>
                                )}

                                {speakingData.tips?.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold">
                                      Tips:
                                    </h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {speakingData.tips.map(
                                        (tip: string, idx: number) => (
                                          <li key={idx} className="text-sm">
                                            {tip}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </>
                            );
                          } catch (e) {
                            return <p>{previewQuestion.content}</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: previewQuestion.content,
                        }}
                      />
                    )}
                  </div>

                  {previewQuestion.choices &&
                    previewQuestion.choices.length > 0 && (
                      <div className="space-y-2">
                        {previewQuestion.choices.map((choice, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 rounded-xl border p-3 ${
                              choice.isCorrect
                                ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold dark:bg-gray-800">
                              {choice.label}
                            </span>
                            <span className="text-sm">{choice.text}</span>
                            {choice.isCorrect && (
                              <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {previewQuestion.correctAnswer &&
                    !previewQuestion.choices?.length && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Correct Answer: {previewQuestion.correctAnswer}
                        </p>
                      </div>
                    )}

                  {previewQuestion.metadata?.cueCardPoints &&
                    previewQuestion.metadata.cueCardPoints.length > 0 && (
                      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                        <h4 className="mb-2 text-sm font-semibold">
                          Cue Card Points:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {previewQuestion.metadata.cueCardPoints.map(
                            (point, idx) => (
                              <li key={idx} className="text-sm">
                                {point}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>

            {previewQuestion && (
              <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Difficulty:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {previewQuestion.metadata?.difficulty || "Medium"}
                      </span>
                    </span>
                    <span>
                      Marks:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {previewQuestion.marks || 1}
                      </span>
                    </span>
                    {previewQuestion.metadata?.topic && (
                      <span>
                        Topic:{" "}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {previewQuestion.metadata.topic}
                        </span>
                      </span>
                    )}
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
              <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
                IELTS Question Management
                <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-medium">
                  {totalQuestions}
                </span>
              </h1>
              <p className="text-sm">
                Create, edit and manage IELTS questions for all sections
              </p>
            </div>
            <Button
              onClick={openCreateDrawer}
              size="sm"
              className="flex items-center gap-1 rounded-2xl font-medium bg-orange-600 transition-all hover:scale-105 px-3 !py-2.5"
            >
              <Plus className="h-4 w-4" />
              New Question
            </Button>
          </div>

          {/* Filters Card */}
          <div className="border mb-4 bg-white dark:border-gray-800/50 dark:bg-gray-900/80">
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search questions..."
                      className="w-full rounded-lg border border-gray-200 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>

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
                        questionType: "all",
                      }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Types" },
                      ...(filters.section !== "all"
                        ? IELTS_QUESTION_TYPES[
                            filters.section as keyof typeof IELTS_QUESTION_TYPES
                          ] || []
                        : Object.values(IELTS_QUESTION_TYPES).flat()
                      ).map((t) => ({ value: t.value, label: t.label })),
                    ]}
                    defaultValue={filters.questionType}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, questionType: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Difficulties" },
                      ...DIFFICULTY_OPTIONS,
                    ]}
                    defaultValue={filters.difficulty}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, difficulty: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {totalQuestions}
                    </span>
                    <span>questions found</span>
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

          {/* Question List */}
          <div className="space-y-2">
            {loading && (
              <div className="flex flex-col items-center justify-center border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading questions...
                </p>
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
              <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
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
                  className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Question
                </Button>
              </div>
            )}

            {!loading &&
              !error &&
              questions.map((q) => {
                const SectionIcon = getSectionIcon(q.section);
                return (
                  <motion.div
                    key={q._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group relative overflow-hidden border border-gray-200 bg-white backdrop-blur-sm transition-all hover:-translate-y-1 dark:border-gray-800/50 dark:bg-gray-900/80"
                  >
                    <div className="relative p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                              <SectionIcon className="h-3 w-3" />
                              {q.section.charAt(0).toUpperCase() +
                                q.section.slice(1)}
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                              {getQuestionTypeLabel(q.section, q.questionType)}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getDifficultyColor(q.metadata?.difficulty || "Medium")}`}
                            >
                              <TrendingUp className="h-3 w-3" />
                              {q.metadata?.difficulty || "Medium"}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                q.isActive
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400"
                              }`}
                            >
                              {q.isActive ? "Active" : "Inactive"}
                            </span>

                            {q.metadata?.topic && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                                <Tag className="h-3 w-3" />
                                {q.metadata.topic}
                              </span>
                            )}
                          </div>

                          {q.instructions && (
                            <p className="mb-2 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                              <span className="font-medium">Instructions:</span>{" "}
                              {q.instructions}
                            </p>
                          )}

                          <div
                            className="text-sm font-medium text-gray-900 line-clamp-1 dark:text-gray-100"
                            dangerouslySetInnerHTML={{
                              __html:
                                q.section === "speaking"
                                  ? isJsonString(q.content)
                                    ? JSON.parse(q.content).question ||
                                      q.content
                                    : q.content
                                  : q.content,
                            }}
                          />
                        </div>

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
                            <button
                              onClick={() => handleDuplicate(q)}
                              className="hover:text-blue-600 dark:hover:text-blue-400"
                              title="Duplicate question"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleToggleStatus(q)}
                              className={`hover:text-blue-600 dark:hover:text-blue-400 ${!q.isActive ? "text-emerald-600" : "text-gray-400"}`}
                              title={q.isActive ? "Deactivate" : "Activate"}
                            >
                              {q.isActive ? "Deactivate" : "Activate"}
                            </button>
                            {q.createdAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(q.createdAt)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              <span>
                                Marks:{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {q.marks}
                                </span>
                              </span>
                            </div>
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
                        {editingQuestion
                          ? "Edit Question"
                          : "Create New Question"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {watchQuestionType
                          ? getQuestionTypeLabel(
                              watchSection,
                              watchQuestionType,
                            )
                          : "Select a question type"}
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
                    <div className="px-6 space-y-3 py-4">
                      {/* Section and Question Type */}
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
                              setValue("questionType", "");
                            }}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Question Type *
                          </Label>
                          <Select
                            options={
                              IELTS_QUESTION_TYPES[
                                watchSection as keyof typeof IELTS_QUESTION_TYPES
                              ] || []
                            }
                            defaultValue={watchQuestionType}
                            onChange={(value: string) =>
                              setValue("questionType", value)
                            }
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* Instructions */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Instructions
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter instructions for this question"
                          value={watchInstructions}
                          onChange={(e) =>
                            setValue("instructions", e.target.value)
                          }
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Content - Different for Speaking vs Other sections */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isSpeakingType(watchQuestionType)
                            ? watchQuestionType === "speaking_part_2"
                              ? "Cue Card Topic *"
                              : "Question *"
                            : "Question Content *"}
                        </Label>

                        {isSpeakingType(watchQuestionType) ? (
                          <div className="space-y-4">
                            {/* Main Question */}
                            <Input
                              type="text"
                              placeholder={
                                watchQuestionType === "speaking_part_2"
                                  ? "e.g., Describe a memorable trip you took"
                                  : watchQuestionType === "speaking_part_1"
                                    ? "e.g., Do you like reading books?"
                                    : "e.g., Why do people prefer to live in cities?"
                              }
                              value={speakingQuestion}
                              onChange={(e) => {
                                setSpeakingQuestion(e.target.value);
                                updateSpeakingContent();
                              }}
                              className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                            />

                            {/* Follow-up Questions */}
                            {/* Follow-up Questions */}
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Follow-up Questions
                              </Label>

                              <div className="mt-2 space-y-3">
                                {speakingFollowUpQuestions.map(
                                  (item, index) => (
                                    <div
                                      key={index}
                                      className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                                    >
                                      {/* Header */}
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">
                                          Follow-up Question {index + 1}
                                        </span>

                                        {speakingFollowUpQuestions.length >
                                          1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newQuestions =
                                                speakingFollowUpQuestions.filter(
                                                  (_, i) => i !== index,
                                                );

                                              setSpeakingFollowUpQuestions(
                                                newQuestions,
                                              );
                                              updateSpeakingContent();
                                            }}
                                            className="text-rose-500 hover:text-rose-700"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                      
                                      <Input
                                        type="text"
                                        placeholder="Enter follow-up question"
                                        value={item.text || ""}
                                        onChange={(e) => {
                                          const newQuestions = [
                                            ...speakingFollowUpQuestions,
                                          ];

                                          newQuestions[index] = {
                                            ...newQuestions[index],
                                            text: e.target.value,
                                          };

                                          setSpeakingFollowUpQuestions(
                                            newQuestions,
                                          );
                                          updateSpeakingContent();
                                        }}
                                        className="rounded-xl border-gray-200 dark:border-gray-700"
                                      />

                                      {/* Media Type */}
                                      <div className="mt-3">
                                        <Label className="text-xs text-gray-500">
                                          Question Media
                                        </Label>

                                        <Select
                                          options={[
                                            {
                                              value: "none",
                                              label: "Text Only",
                                            },
                                            { value: "audio", label: "Audio" },
                                            { value: "video", label: "Video" },
                                          ]}
                                          defaultValue={item.mediaType}
                                          onChange={(value: string) => {
                                            const newQuestions = [
                                              ...speakingFollowUpQuestions,
                                            ];

                                            newQuestions[index] = {
                                              ...newQuestions[index],
                                              mediaType: value as
                                                | "none"
                                                | "audio"
                                                | "video",
                                              mediaUrl:
                                                value === "none"
                                                  ? ""
                                                  : newQuestions[index]
                                                      .mediaUrl,
                                            };

                                            setSpeakingFollowUpQuestions(
                                              newQuestions,
                                            );
                                            updateSpeakingContent();
                                          }}
                                          className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                        />
                                      </div>

                                      {/* Audio Upload */}
                                      {item.mediaType === "audio" && (
                                        <div className="mt-3">
                                          <Label className="text-xs text-gray-500">
                                            Audio File
                                          </Label>

                                          <input
                                            type="file"
                                            accept="audio/*"
                                            className="mt-1 block w-full text-xs border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 p-2"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];

                                              if (!file) return;

                                              try {
                                                const formData = new FormData();
                                                formData.append("file", file);

                                                const res = await api.post(
                                                  "/upload/audio",
                                                  formData,
                                                  {
                                                    headers: {
                                                      "Content-Type":
                                                        "multipart/form-data",
                                                    },
                                                  },
                                                );

                                                if (res.data?.success) {
                                                  const newQuestions = [
                                                    ...speakingFollowUpQuestions,
                                                  ];

                                                  newQuestions[index] = {
                                                    ...newQuestions[index],
                                                    mediaUrl: res.data.data.url,
                                                  };

                                                  setSpeakingFollowUpQuestions(
                                                    newQuestions,
                                                  );
                                                  updateSpeakingContent();

                                                  toast.success(
                                                    "Audio uploaded successfully",
                                                  );
                                                }
                                              } catch (err: any) {
                                                console.error(
                                                  "Follow-up audio upload error:",
                                                  err,
                                                );

                                                toast.error(
                                                  err.response?.data?.message ||
                                                    "Failed to upload audio",
                                                );
                                              }
                                            }}
                                          />

                                          {item.mediaUrl && (
                                            <audio
                                              controls
                                              className="mt-2 w-full"
                                              src={item.mediaUrl}
                                            />
                                          )}
                                        </div>
                                      )}

                                      {/* Video Upload */}
                                      {item.mediaType === "video" && (
                                        <div className="mt-3">
                                          <Label className="text-xs text-gray-500">
                                            Video File
                                          </Label>

                                          <input
                                            type="file"
                                            accept="video/*"
                                            className="mt-1 block w-full text-xs"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];

                                              if (!file) return;

                                              try {
                                                const formData = new FormData();
                                                formData.append("file", file);

                                                const res = await api.post(
                                                  "/upload/video",
                                                  formData,
                                                  {
                                                    headers: {
                                                      "Content-Type":
                                                        "multipart/form-data",
                                                    },
                                                  },
                                                );

                                                if (res.data?.success) {
                                                  const newQuestions = [
                                                    ...speakingFollowUpQuestions,
                                                  ];

                                                  newQuestions[index] = {
                                                    ...newQuestions[index],
                                                    mediaUrl: res.data.data.url,
                                                  };

                                                  setSpeakingFollowUpQuestions(
                                                    newQuestions,
                                                  );
                                                  updateSpeakingContent();

                                                  toast.success(
                                                    "Video uploaded successfully",
                                                  );
                                                }
                                              } catch (err: any) {
                                                console.error(
                                                  "Follow-up video upload error:",
                                                  err,
                                                );

                                                toast.error(
                                                  err.response?.data?.message ||
                                                    "Failed to upload video",
                                                );
                                              }
                                            }}
                                          />

                                          {item.mediaUrl && (
                                            <video
                                              controls
                                              className="mt-2 w-full rounded-xl"
                                              src={item.mediaUrl}
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}

                                {/* Add */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSpeakingFollowUpQuestions([
                                      ...speakingFollowUpQuestions,
                                      {
                                        text: "",
                                        mediaType: "none",
                                        mediaUrl: "",
                                      },
                                    ]);
                                  }}
                                  className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Follow-up Question
                                </button>
                              </div>
                            </div>

                            {/* Audio Upload */}
                            {/* <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Audio File
                              </Label>
                              <div className="mt-1 flex items-center gap-3">
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAudioUpload(file);
                                  }}
                                  className="hidden"
                                  id="speaking-audio-upload"
                                />
                                <label
                                  htmlFor="speaking-audio-upload"
                                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                  <FileAudio className="h-4 w-4" />
                                  {audioUploading
                                    ? "Uploading..."
                                    : "Upload Audio"}
                                </label>
                                {speakingAudioUrl && (
                                  <div className="flex items-center gap-2 flex-1">
                                    <audio controls className="h-8 flex-1">
                                      <source src={speakingAudioUrl} />
                                    </audio>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSpeakingAudioUrl("");
                                        updateSpeakingContent();
                                      }}
                                      className="text-rose-500 hover:text-rose-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {speakingAudioUrl && (
                                <Input
                                  type="text"
                                  placeholder="Or enter audio URL manually"
                                  value={speakingAudioUrl}
                                  onChange={(e) => {
                                    setSpeakingAudioUrl(e.target.value);
                                    updateSpeakingContent();
                                  }}
                                  className="mt-2 rounded-xl border-gray-200 dark:border-gray-700"
                                />
                              )}
                            </div> */}

                            {/* Video Upload */}
                            {/* <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Video File
                              </Label>
                              <div className="mt-1 flex items-center gap-3">
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleVideoUpload(file);
                                  }}
                                  className="hidden"
                                  id="speaking-video-upload"
                                />
                                <label
                                  htmlFor="speaking-video-upload"
                                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                >
                                  <Video className="h-4 w-4" />
                                  {videoUploading
                                    ? "Uploading..."
                                    : "Upload Video"}
                                </label>
                                {speakingVideoUrl && (
                                  <div className="flex items-center gap-2 flex-1">
                                    <video
                                      controls
                                      className="h-20 flex-1 rounded-xl"
                                    >
                                      <source src={speakingVideoUrl} />
                                    </video>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSpeakingVideoUrl("");
                                        updateSpeakingContent();
                                      }}
                                      className="text-rose-500 hover:text-rose-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {speakingVideoUrl && (
                                <Input
                                  type="text"
                                  placeholder="Or enter video URL manually"
                                  value={speakingVideoUrl}
                                  onChange={(e) => {
                                    setSpeakingVideoUrl(e.target.value);
                                    updateSpeakingContent();
                                  }}
                                  className="mt-2 rounded-xl border-gray-200 dark:border-gray-700"
                                />
                              )}
                            </div> */}

                            {/* Transcript */}
                            {/* <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Transcript
                              </Label>
                              <textarea
                                placeholder="Enter the transcript of the audio/video"
                                value={speakingTranscript}
                                onChange={(e) => {
                                  setSpeakingTranscript(e.target.value);
                                  updateSpeakingContent();
                                }}
                                rows={3}
                                className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                              />
                            </div> */}

                            {/* Sample Answer */}
                            {/* <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Sample Answer
                              </Label>
                              <textarea
                                placeholder="Enter a sample answer"
                                value={speakingSampleAnswer}
                                onChange={(e) => {
                                  setSpeakingSampleAnswer(e.target.value);
                                  updateSpeakingContent();
                                }}
                                rows={4}
                                className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                              />
                            </div> */}

                            {/* Tips */}
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Tips
                              </Label>
                              <div className="space-y-2 mt-1">
                                {speakingTips.map((tip, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-2"
                                  >
                                    <Input
                                      type="text"
                                      placeholder={`Tip ${index + 1}`}
                                      value={tip}
                                      onChange={(e) => {
                                        const newTips = [...speakingTips];
                                        newTips[index] = e.target.value;
                                        setSpeakingTips(newTips);
                                        updateSpeakingContent();
                                      }}
                                      className="rounded-xl border-gray-200 dark:border-gray-700"
                                    />
                                    {speakingTips.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newTips = speakingTips.filter(
                                            (_, i) => i !== index,
                                          );
                                          setSpeakingTips(newTips);
                                          updateSpeakingContent();
                                        }}
                                        className="mt-2 text-rose-500 hover:text-rose-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSpeakingTips([...speakingTips, ""]);
                                  }}
                                  className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Tip
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <RichTextEditor
                            header={true}
                            initialValue={watchContent}
                            onChange={(html) => setValue("content", html)}
                          />
                        )}
                      </div>

                      {/* MCQ Choices */}
                      {isMCQType(watchQuestionType) && (
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Options *
                            </Label>
                            <button
                              type="button"
                              onClick={() => {
                                const currentChoices = watch("choices") || [];
                                const nextLabel = String.fromCharCode(
                                  65 + currentChoices.length,
                                );
                                setValue("choices", [
                                  ...currentChoices,
                                  {
                                    label: nextLabel,
                                    text: "",
                                    isCorrect: false,
                                  },
                                ]);
                              }}
                              className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs text-white"
                            >
                              <Plus className="h-3 w-3" />
                              Add Option
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(watch("choices") || []).map((field, index) => (
                              <motion.div
                                key={index}
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
                                  <Input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    value={watch(`choices.${index}.text`)}
                                    onChange={(e) =>
                                      setValue(
                                        `choices.${index}.text`,
                                        e.target.value,
                                      )
                                    }
                                    className="rounded-xl border-gray-200 dark:border-gray-700"
                                  />
                                  <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <input
                                      type="checkbox"
                                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={watch(
                                        `choices.${index}.isCorrect`,
                                      )}
                                      onChange={(e) =>
                                        setValue(
                                          `choices.${index}.isCorrect`,
                                          e.target.checked,
                                        )
                                      }
                                    />
                                    Correct answer
                                  </label>
                                </div>
                                {(watch("choices") || []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentChoices =
                                        watch("choices") || [];
                                      const newChoices = currentChoices.filter(
                                        (_, i) => i !== index,
                                      );
                                      setValue("choices", newChoices);
                                    }}
                                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* True/False/Not Given or Yes/No/Not Given */}
                      {isTrueFalseNG(watchQuestionType) && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Correct Answer *
                          </Label>
                          <Select
                            options={[
                              {
                                value:
                                  watchQuestionType === "true_false_ng"
                                    ? "true"
                                    : "yes",
                                label:
                                  watchQuestionType === "true_false_ng"
                                    ? "True"
                                    : "Yes",
                              },
                              {
                                value:
                                  watchQuestionType === "true_false_ng"
                                    ? "false"
                                    : "no",
                                label:
                                  watchQuestionType === "true_false_ng"
                                    ? "False"
                                    : "No",
                              },
                              { value: "not given", label: "Not Given" },
                            ]}
                            defaultValue={watchCorrectAnswer}
                            onChange={(value: string) =>
                              setValue("correctAnswer", value)
                            }
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      )}

                      {/* Text Answer for completion/short answer types */}
                      {isCompletionType(watchQuestionType) && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Correct Answer
                            </Label>
                            <Input
                              type="text"
                              placeholder="Enter the correct answer"
                              value={watchCorrectAnswer}
                              onChange={(e) =>
                                setValue("correctAnswer", e.target.value)
                              }
                              className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Max Words
                              </Label>
                              <Input
                                type="number"
                                placeholder="Max words allowed"
                                value={watchMaxWords || ""}
                                onChange={(e) =>
                                  setValue(
                                    "maxWords",
                                    parseInt(e.target.value) || null,
                                  )
                                }
                                className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Min Words
                              </Label>
                              <Input
                                type="number"
                                placeholder="Min words required"
                                value={watchMinWords || ""}
                                onChange={(e) =>
                                  setValue(
                                    "minWords",
                                    parseInt(e.target.value) || null,
                                  )
                                }
                                className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Writing specific fields */}
                      {isWritingType(watchQuestionType) && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Task Type
                            </Label>
                            <Select
                              options={[
                                { value: "Task 1", label: "Task 1" },
                                { value: "Task 2", label: "Task 2" },
                              ]}
                              defaultValue={watchTaskType}
                              onChange={(value: string) =>
                                setValue("taskType", value)
                              }
                              className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                            />
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Min Words *
                              </Label>
                              <Input
                                type="number"
                                placeholder="e.g., 150 for Task 1, 250 for Task 2"
                                value={watchWritingMinWords || ""}
                                onChange={(e) =>
                                  setValue(
                                    "writingMinWords",
                                    parseInt(e.target.value) || null,
                                  )
                                }
                                className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Max Words
                              </Label>
                              <Input
                                type="number"
                                placeholder="Optional max words"
                                value={watchWritingMaxWords || ""}
                                onChange={(e) =>
                                  setValue(
                                    "writingMaxWords",
                                    parseInt(e.target.value) || null,
                                  )
                                }
                                className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Speaking Part 2 specific fields */}
                      {isSpeakingType(watchQuestionType) &&
                        watchQuestionType === "speaking_part_2" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Cue Card Points{" "}
                                <span className="text-xs text-gray-400">
                                  (one per line)
                                </span>
                              </Label>
                              <textarea
                                placeholder={
                                  "Describe a memorable trip you took\n\nYou should say:\n- Where you went\n- Who you went with\n- What you did there\n- And explain why it was memorable"
                                }
                                value={watchCueCardPoints}
                                onChange={(e) =>
                                  setValue("cueCardPoints", e.target.value)
                                }
                                rows={6}
                                className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                              />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Preparation Time (seconds)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="e.g., 60"
                                  value={watchPreparationTime || ""}
                                  onChange={(e) =>
                                    setValue(
                                      "preparationTime",
                                      parseInt(e.target.value) || null,
                                    )
                                  }
                                  className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Response Time (seconds)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="e.g., 120"
                                  value={watchResponseTime || ""}
                                  onChange={(e) =>
                                    setValue(
                                      "responseTime",
                                      parseInt(e.target.value) || null,
                                    )
                                  }
                                  className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Media URLs for non-speaking questions */}
                      {!isSpeakingType(watchQuestionType) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Audio URL
                            </Label>
                            <Input
                              type="text"
                              placeholder="https://example.com/audio.mp3"
                              value={watchAudioUrl}
                              onChange={(e) =>
                                setValue("audioUrl", e.target.value)
                              }
                              className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Image URL
                            </Label>
                            <Input
                              type="text"
                              placeholder="https://example.com/image.png"
                              value={watchImageUrl}
                              onChange={(e) =>
                                setValue("imageUrl", e.target.value)
                              }
                              className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                            />
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Difficulty
                          </Label>
                          <Select
                            options={DIFFICULTY_OPTIONS}
                            defaultValue={watchDifficulty}
                            onChange={(value: string) =>
                              setValue("difficulty", value)
                            }
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Topic
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g., Environment, Technology, Education"
                            value={watchTopic}
                            onChange={(e) => setValue("topic", e.target.value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* Marks and Source */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Marks
                          </Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={watchMarks}
                            onChange={(e) =>
                              setValue("marks", parseFloat(e.target.value) || 1)
                            }
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Source
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g., Cambridge IELTS 17"
                            value={watchSource}
                            onChange={(e) => setValue("source", e.target.value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
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