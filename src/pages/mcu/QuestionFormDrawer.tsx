// components/questions/QuestionFolderView.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  FileText,
  Edit3,
  Trash2,
  Tag,
  BookOpen,
} from "lucide-react";
import Button from "../../components/ui/button/Button";

interface Question {
  _id: string;
  exam: { _id: string; name: string };
  section: { _id: string; name: string };
  questionType: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags?: string[];
  stimulus?: string;
  questionText: string;
  options?: any[];
  correctAnswerText?: string;
  marks?: number;
  negativeMarks?: number;
  explanation?: string;
  source?: string;
  createdAt?: string;
}

interface QuestionFolderViewProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  questionTypeOptions: { value: string; label: string }[];
}

export function QuestionFolderView({
  questions,
  onEdit,
  onDelete,
  questionTypeOptions,
}: QuestionFolderViewProps) {
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Group questions by exam
  const groupedByExam = questions.reduce((acc, q) => {
    const examId = q.exam?._id || "unknown";
    if (!acc[examId]) {
      acc[examId] = {
        exam: q.exam,
        sections: {},
      };
    }
    const sectionId = q.section?._id || "unknown";
    if (!acc[examId].sections[sectionId]) {
      acc[examId].sections[sectionId] = {
        section: q.section,
        questions: [],
      };
    }
    acc[examId].sections[sectionId].questions.push(q);
    return acc;
  }, {} as Record<string, { exam: any; sections: Record<string, { section: any; questions: Question[] }> }>);

  const toggleExam = (examId: string) => {
    setExpandedExams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(examId)) {
        newSet.delete(examId);
      } else {
        newSet.add(examId);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      case "Hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
    }
  };

  const getTypeLabel = (type: string) => {
    return questionTypeOptions.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-2">
      {Object.entries(groupedByExam).map(([examId, examData]) => {
        const isExamExpanded = expandedExams.has(examId);
        const examName = examData.exam?.name || "Unknown Exam";

        return (
          <motion.div
            key={examId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Exam Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleExam(examId)}
            >
              <div className="text-blue-600 dark:text-blue-400">
                {isExamExpanded ? (
                  <FolderOpen className="h-5 w-5" />
                ) : (
                  <Folder className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {examName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {Object.keys(examData.sections).length} sections •{" "}
                  {Object.values(examData.sections).reduce(
                    (acc, sec) => acc + sec.questions.length,
                    0
                  )}{" "}
                  questions
                </p>
              </div>
              <div className="text-gray-400">
                {isExamExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>
            </div>

            {/* Sections */}
            <AnimatePresence>
              {isExamExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-200 dark:border-gray-800"
                >
                  <div className="p-3 space-y-2">
                    {Object.entries(examData.sections).map(
                      ([sectionId, sectionData]) => {
                        const isSectionExpanded = expandedSections.has(sectionId);
                        const sectionName = sectionData.section?.name || "Unknown Section";

                        return (
                          <div
                            key={sectionId}
                            className="rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                          >
                            {/* Section Header */}
                            <div
                              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                              onClick={() => toggleSection(sectionId)}
                            >
                              <div className="text-purple-600 dark:text-purple-400">
                                {isSectionExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {sectionName}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {sectionData.questions.length} questions
                                </p>
                              </div>
                            </div>

                            {/* Questions */}
                            <AnimatePresence>
                              {isSectionExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-gray-100 dark:border-gray-700"
                                >
                                  <div className="p-3 space-y-3">
                                    {sectionData.questions.map((q) => (
                                      <motion.div
                                        key={q._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                <FileText className="h-3 w-3" />
                                                {getTypeLabel(q.questionType)}
                                              </span>
                                              <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${getDifficultyColor(
                                                  q.difficulty
                                                )}`}
                                              >
                                                {q.difficulty}
                                              </span>
                                              {q.tags && q.tags.length > 0 && (
                                                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                                  <Tag className="h-3 w-3" />
                                                  {q.tags.slice(0, 2).join(", ")}
                                                  {q.tags.length > 2 && ` +${q.tags.length - 2}`}
                                                </span>
                                              )}
                                            </div>
                                            {q.stimulus && (
                                              <div
                                                className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400"
                                                dangerouslySetInnerHTML={{ __html: q.stimulus }}
                                              />
                                            )}
                                            <div
                                              className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-gray-100"
                                              dangerouslySetInnerHTML={{ __html: q.questionText }}
                                            />
                                            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                              Marks: {q.marks ?? 1}
                                              {typeof q.negativeMarks === "number" &&
                                                q.negativeMarks !== 0 && (
                                                  <span className="ml-2">• Negative: {q.negativeMarks}</span>
                                                )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="rounded-lg px-2 py-1 text-xs"
                                              onClick={() => onEdit(q)}
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="rounded-lg px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                              onClick={() => onDelete(q)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// components/questions/QuestionDrawer.tsx
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, HelpCircle } from "lucide-react";
import { toast } from "react-toastify";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import {
  QUESTION_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  isMCQType,
  isPTEType,
  isNewFeild,
} from "./Questions";
import api from "../../axiosInstance";
import RichTextEditor from "../../components/TextEditor";
import AudioUploadComponent from "./AudioUpload";
import { GMATDataInsightsBlock } from "./DiBlock";



interface QuestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuestion: any | null;
  exams: any[];
  sections: any[];
  onSave: () => void;
}

export function QuestionDrawer({
  isOpen,
  onClose,
  editingQuestion,
  exams,
  sections,
  onSave,
}: QuestionDrawerProps) {
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<any>({
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

  const watchQuestionType = watch("questionType");
  const watchExam = watch("exam");
  const diSubtype = watch("dataInsights.subtype");
  const isDataInsights = watchQuestionType === "gmat_data_insights";
  const isMultiSource = isDataInsights && diSubtype === "multi_source_reasoning";
  const isTwoPart = isDataInsights && diSubtype === "two_part_analysis";
  const isTable = isDataInsights && diSubtype === "table_analysis";
  const isGraphics = isDataInsights && diSubtype === "graphics_interpretation";

  const [saving, setSaving] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && editingQuestion) {
      // Populate form with editing data
      const baseValues = {
        exam: editingQuestion.exam?._id || "",
        section: editingQuestion.section?._id || "",
        questionType: editingQuestion.questionType,
        difficulty: editingQuestion.difficulty || "Medium",
        tags: (editingQuestion.tags || []).join(", "),
        stimulus: editingQuestion.stimulus || "",
        questionText: editingQuestion.questionText || "",
        typeSpecific: editingQuestion.typeSpecific || undefined,
        options: editingQuestion.options?.length > 0
          ? editingQuestion.options.map((opt: any, idx: number) => ({
              label: opt.label || String.fromCharCode(65 + idx),
              text: opt.text,
              isCorrect: !!opt.isCorrect,
            }))
          : [
              { label: "A", text: "", isCorrect: false },
              { label: "B", text: "", isCorrect: false },
            ],
        correctAnswerText: editingQuestion.correctAnswerText || "",
        marks: editingQuestion.marks ?? 1,
        negativeMarks: editingQuestion.negativeMarks ?? 0,
        explanation: editingQuestion.explanation || "",
        source: editingQuestion.source || "",
      };

      if (editingQuestion.questionType === "gmat_data_insights") {
        // Handle DI data loading
        const di = editingQuestion.dataInsights || {};
        const subtype = di.subtype || "multi_source_reasoning";
        let dataInsights: any = { subtype };

        // ... (DI data loading logic)
        reset({ ...baseValues, dataInsights });
      } else {
        reset(baseValues);
      }
    } else if (isOpen) {
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
    }
  }, [isOpen, editingQuestion, reset]);

  const onSubmit = async (values: any) => {
    try {
      // Validation
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
        const hasCorrect = values.options.some((opt: any) => opt.isCorrect);
        if (!hasCorrect) {
          toast.error("Select at least one correct option");
          return;
        }
      }

      setSaving(true);
      const tagsArray = values.tags
        ? values.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
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
        payload.options = values.options.map((opt: any, index: number) => ({
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
      onSave();
    } catch (err: any) {
      console.error("Save question error:", err);
      toast.error(err.response?.data?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={saving ? undefined : onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="relative ml-auto flex h-full w-full max-w-4xl flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {editingQuestion ? "Edit Question" : "Create New Question"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {QUESTION_TYPE_OPTIONS.find((t) => t.value === watchQuestionType)?.label ||
                    "Select type to see more options"}
                </p>
              </div>
              <button
                onClick={saving ? undefined : onClose}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                disabled={saving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
            >
              {/* Exam & Section */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Exam</Label>
                  <Select
                    options={exams.map((e) => ({ value: e._id, label: e.name }))}
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
                  <Label className="text-sm font-medium">Section</Label>
                  <Select
                    options={sections.map((s) => ({ value: s._id, label: s.name }))}
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

              {/* Type & Difficulty */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Question Type</Label>
                  <Select
                    options={QUESTION_TYPE_OPTIONS}
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
                  <Label className="text-sm font-medium">Difficulty</Label>
                  <Select
                    options={DIFFICULTY_OPTIONS}
                    defaultValue={watch("difficulty")}
                    onChange={(value: string) =>
                      setValue("difficulty", value as any)
                    }
                  />
                </div>
              </div>

              {/* Data Insights Subtype */}
              {isDataInsights && (
                <div>
                  <Label className="text-sm font-medium">Data Insights Subtype</Label>
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

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium">
                  Tags
                  <span className="ml-1 text-xs text-gray-400">(comma separated)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="algebra, probability, reading, geometry"
                  value={watch("tags")}
                  onChange={(e) => setValue("tags", e.target.value)}
                  error={!!errors.tags}
                  hint={errors.tags?.message as string}
                />
              </div>

              {/* Stimulus */}
              <div>
                <Label className="text-sm font-medium">Stimulus / Passage <span className="text-xs text-gray-400">(optional)</span></Label>
                <RichTextEditor
                  header={false}
                  initialValue={watch("stimulus")}
                  onChange={(html) => setValue("stimulus", html)}
                />
              </div>

              {/* Question Text */}
              <div>
                <Label className="text-sm font-medium">Question Text</Label>
                {isPTEType(watchQuestionType) ? (
                  <Input
                    type="text"
                    placeholder="Enter the actual question"
                    value={watch("questionText")}
                    onChange={(e) => setValue("questionText", e.target.value)}
                    error={!!errors.questionText}
                    hint={errors.questionText?.message as string}
                  />
                ) : (
                  <RichTextEditor
                    header={false}
                    initialValue={watch("questionText")}
                    onChange={(html) => setValue("questionText", html)}
                  />
                )}
              </div>

              {/* Extra Text for specific types */}
              {isNewFeild(watchQuestionType) && (
                <div>
                  <Label className="text-sm font-medium">Extra Text</Label>
                  <Input
                    type="text"
                    placeholder="Enter the listening text"
                    value={watch("typeSpecific.listeningText")}
                    onChange={(e) => setValue("typeSpecific.listeningText", e.target.value)}
                  />
                </div>
              )}

              {/* PTE Fill in Blanks */}
              {watchQuestionType === "pte_fill_in_blanks" && (
                <div>
                  <Label className="text-sm font-medium">Number of Blanks</Label>
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
                    defaultValue={watch("typeSpecific.blanks")?.toString() || "1"}
                    onChange={(value: string) => setValue("typeSpecific.blanks", value)}
                  />
                  {watch("typeSpecific.blanks") &&
                    Array.from({ length: Number(watch("typeSpecific.blanks")) }).map((_, index) => (
                      <div key={index} className="mt-2">
                        <Label className="text-sm">Blank {index + 1} Options</Label>
                        <Input
                          type="text"
                          placeholder={`Options for Blank ${index + 1} (comma separated)`}
                          value={watch(`typeSpecific.options.${index}`)}
                          onChange={(e) => setValue(`typeSpecific.options.${index}`, e.target.value)}
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Audio Upload */}
              {(isPTEType(watchQuestionType) || isNewFeild(watchQuestionType)) && (
                <div>
                  <Label className="text-sm font-medium">Audio</Label>
                  <AudioUploadComponent
                    questionText={watch("typeSpecific.listeningText") || watch("questionText")}
                    initialAudioUrl={editingQuestion?.typeSpecific?.audio || ""}
                    onAudioChange={(audioData) => {
                      setAudioData(audioData);
                      setValue("typeSpecific.audio", audioData);
                    }}
                    disabled={saving}
                  />
                </div>
              )}

              {/* GMAT Data Insights Block */}
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
              ) : isMCQType(watchQuestionType) ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-sm font-medium">Options</Label>
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          label: String.fromCharCode(65 + optionFields.length),
                          text: "",
                          isCorrect: false,
                        })
                      }
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      + Add option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {optionFields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className="mt-2 text-sm font-semibold text-gray-500">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            value={watch(`options.${index}.text`)}
                            onChange={(e) =>
                              setValue(`options.${index}.text`, e.target.value)
                            }
                            error={!!(errors.options && errors.options[index]?.text)}
                            hint={errors.options && errors.options[index]?.text?.message as string}
                          />
                          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300"
                              checked={watch(`options.${index}.isCorrect`)}
                              onChange={(e) =>
                                setValue(`options.${index}.isCorrect`, e.target.checked)
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
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium">Correct Answer (text / numeric)</Label>
                  <Input
                    type="text"
                    placeholder="Correct answer text"
                    value={watch("correctAnswerText")}
                    onChange={(e) => setValue("correctAnswerText", e.target.value)}
                  />
                </div>
              )}

              {/* GRE Text Completion */}
              {watchQuestionType === "gre_verbal_text_completion" && (
                <div>
                  <Label className="text-sm font-medium">Number of Blanks</Label>
                  <Select
                    options={[
                      { value: "1", label: "1 Blank" },
                      { value: "2", label: "2 Blanks" },
                      { value: "3", label: "3 Blanks" },
                    ]}
                    defaultValue={watch("typeSpecific.blanks")?.toString() || "1"}
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
                  />
                  {[...Array(watch("typeSpecific.blanks") || 1)].map((_, blankIndex) => {
                    const blankOptions = (watch("typeSpecific.options") || [])
                      .filter((opt: any) => opt.blankIndex === blankIndex);

                    return (
                      <div key={blankIndex} className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Blank {blankIndex + 1}</Label>
                          <button
                            type="button"
                            onClick={() => {
                              const opts = watch("typeSpecific.options") || [];
                              const nextLabel = String.fromCharCode(65 + blankOptions.length);
                              setValue("typeSpecific.options", [
                                ...opts,
                                { blankIndex, label: nextLabel, text: "", isCorrect: false },
                              ]);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            + Add Option
                          </button>
                        </div>
                        {blankOptions.map((opt: any, idx: number) => {
                          const globalIndex = (watch("typeSpecific.options") || []).findIndex(
                            (o: any) => o.blankIndex === blankIndex && o.label === opt.label
                          );
                          return (
                            <div key={`${blankIndex}-${opt.label}`} className="flex items-start gap-3 mt-2">
                              <div className="mt-2 w-6 text-sm font-mono font-semibold">{opt.label}</div>
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
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={opt.isCorrect}
                                    onChange={(e) => {
                                      const opts = [...(watch("typeSpecific.options") || [])];
                                      opts.forEach((o: any) => {
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

              {/* Marks */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Marks</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={watch("marks")}
                    onChange={(e) => setValue("marks", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Negative Marks</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={watch("negativeMarks")}
                    onChange={(e) => setValue("negativeMarks", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Explanation & Source */}
              <div>
                <Label className="text-sm font-medium">Explanation <span className="text-xs text-gray-400">(for review)</span></Label>
                <Input
                  type="text"
                  placeholder="Explain why this answer is correct"
                  value={watch("explanation")}
                  onChange={(e) => setValue("explanation", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Source</Label>
                <Input
                  type="text"
                  placeholder="e.g., Official Guide 2024, Custom, etc."
                  value={watch("source")}
                  onChange={(e) => setValue("source", e.target.value)}
                />
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white py-4 dark:border-gray-800 dark:bg-gray-900">
                <Button variant="outline" onClick={onClose} disabled={saving}>
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
  );
}