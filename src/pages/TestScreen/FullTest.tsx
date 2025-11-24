// pages/student/FullLengthTestPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { Controller, useForm } from "react-hook-form";
import {
    BookOpen,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    ChevronLeft,
    HelpCircle,
    Volume2,
    Mic,
    Square,
    Home,
    BarChart3,
    Play,
    Pause
} from "lucide-react";

import api from "../../axiosInstance";
import Button from "../../components/ui/button/Button";

interface SectionDTO {
    index: number;
    sectionId:
    | {
        _id: string;
        name: string;
        description?: string;
    }
    | string;
    duration: number;
    totalQuestions: number;
    status: "not_started" | "in_progress" | "completed";
    timeSpent: number;
}

interface TestSeriesDTO {
    title: string;
    type: "Full-Length" | "Mini-Series" | "Sectional";
    duration: number;
    totalQuestions: number;
    totalSections: number;
}

interface QuestionOption {
    label?: string;
    text: string;
}

interface SubQuestion {
    _id: string;
    question: string;
    options?: QuestionOption[];
}

interface QuestionGroup {
    _id: string;
    title: string;
    instruction?: string;
    type: string;
    marks: number;
    questions: SubQuestion[];
}

interface QuestionDTO {
    _id: string;
    title?: string;
    content: {
        instruction: string;
        passageTitle?: string;
        passageText?: string;
        imageUrl?: string;
        audioUrl?: string;
    };
    isQuestionGroup: boolean;
    questionType: string;
    questionGroup?: QuestionGroup[];
    options?: QuestionOption[];
}

interface ProgressDTO {
    currentSection: number;
    totalSections: number;
    currentQuestion: number;
    questionsAnswered: number;
    totalQuestions: number;
    completionPercentage: number;
}

interface NumberingDTO {
    sectionIndex: number;
    questionIndex: number;
    questionCount: number;
    firstGlobalQuestionNumber: number;
    totalGlobalQuestions: number;
    firstSectionQuestionNumber: number;
    totalSectionQuestions: number;
}

interface UserAnswerItem {
    questionGroupId?: string;
    questionId: string;
    answer: any;
}

interface SummaryAnalysis {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    totalScore: number;
    accuracy: number;
    timeSpent: number;
    averageTimePerQuestion: number;
}

interface SectionWiseAnalysis {
    sectionType: string;
    sectionId: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    score: number;
}

interface AnalysisDTO {
    summary: SummaryAnalysis;
    questionAnalysis: any[];
    sectionWiseAnalysis: SectionWiseAnalysis[];
}

type QuestionFormValues = {
    answers: Record<string, any>;
};

// ---------- Helper utilities ----------

const formatSeconds = (totalSeconds: number | null | undefined) => {
    if (totalSeconds == null || totalSeconds < 0) return "00:00";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
};

const getSectionStatusBadge = (status: SectionDTO["status"]) => {
    switch (status) {
        case "completed":
            return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
        case "in_progress":
            return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
};

const isWritingType = (t: string) =>
    ["writing_task_1_academic", "writing_task_1_general", "writing_task_2"].includes(t);

const isSpeakingType = (t: string) =>
    ["speaking_part_1", "speaking_part_2", "speaking_part_3", "speaking"].includes(t);

const isListeningType = (t: string) =>
    ["listening", "audio_response"].includes(t) ||
    t?.toLowerCase()?.includes("listening");

// ---------- Component ----------

const FullLengthTestPage: React.FC = () => {
    const { testSeriesId } = useParams<{ testSeriesId: string }>();

    const [loading, setLoading] = useState(true);
    const [testSeries, setTestSeries] = useState<TestSeriesDTO | null>(null);
    const [sections, setSections] = useState<SectionDTO[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<"sections" | "question" | "result">("sections");
    const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);

    const [currentQuestion, setCurrentQuestion] = useState<QuestionDTO | null>(null);
    const [progress, setProgress] = useState<ProgressDTO | null>(null);
    const [numbering, setNumbering] = useState<NumberingDTO | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisDTO | null>(null);

    const [sectionTimeLeft, setSectionTimeLeft] = useState<number | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const questionStartRef = useRef<number | null>(null);
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { isSubmitting },
    } = useForm<QuestionFormValues>({
        defaultValues: { answers: {} },
    });

    // ---------- TTS ----------
    const handleSpeak = (text: string | undefined) => {
        if (!text) return;
        if (typeof window === "undefined") return;
        if (!("speechSynthesis" in window)) return;

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1;
        utter.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
    };

    // ---------- Speaking recording ----------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (e) {
            console.error("Unable to access microphone", e);
            setGlobalError("Could not access microphone. Check permissions.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    // ---------- Load / resume test ----------
    const fetchOrStartTest = async () => {
        if (!testSeriesId) return;
        setLoading(true);
        setGlobalError(null);

        try {
            const res = await api.post("/test/start", { testSeriesId });
            const data = res.data;

            if (!data.success) throw new Error(data.message || "Failed to start test");

            setSessionId(data.sessionId);
            setTestSeries(data.testSeries);
            setSections(data.sections || []);

            if (data.testSeries.type === "Full-Length") {
                const inProgressIndex = (data.sections || []).findIndex(
                    (s: SectionDTO) => s.status === "in_progress"
                );

                if (inProgressIndex !== -1) {
                    setActiveSectionIndex(inProgressIndex);
                    setViewMode("sections");
                } else {
                    setViewMode("sections");
                }
            } else {
                const question: QuestionDTO | null = data.currentQuestion || null;
                const progressData: ProgressDTO | null = data.progress || null;
                const userAnswer: UserAnswerItem[] | null = data.userAnswer || null;
                const numberingData: NumberingDTO | null = data.numbering || null;

                if (question && progressData) {
                    hydrateQuestionState(
                        question,
                        progressData,
                        userAnswer || [],
                        numberingData || undefined
                    );
                    if (data.timeRemaining != null) {
                        setSectionTimeLeft(data.timeRemaining);
                    }
                    setViewMode("question");
                }
            }
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrStartTest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [testSeriesId]);

    // ---------- Timer ----------
    useEffect(() => {
        if (sectionTimeLeft == null) return;
        if (sectionTimeLeft <= 0) {
            return;
        }

        const id = setTimeout(() => {
            setSectionTimeLeft((prev) => (prev != null ? prev - 1 : prev));
        }, 1000);

        return () => clearTimeout(id);
    }, [sectionTimeLeft]);

    // ---------- Helpers ----------
    const buildDefaultValuesFromQuestion = (
        question: QuestionDTO,
        userAnswers: UserAnswerItem[] | null | undefined
    ): QuestionFormValues => {
        const answers: Record<string, any> = {};
        const answerMap: Record<string, any> = {};

        (userAnswers || []).forEach((ua) => {
            if (ua.questionId) {
                answerMap[ua.questionId] = ua.answer;
            }
        });

        if (question.isQuestionGroup && question.questionGroup?.length) {
            for (const group of question.questionGroup) {
                for (const sub of group.questions) {
                    answers[sub._id] = answerMap[sub._id] ?? (group.type === "multiple_choice_multiple" ? [] : "");
                }
            }
        } else {
            const defaultVal =
                question.questionType === "multiple_choice_multiple" ? [] : "";
            answers[question._id] = answerMap[question._id] ?? defaultVal;
        }

        return { answers };
    };

    const hydrateQuestionState = (
        question: QuestionDTO,
        progressData: ProgressDTO,
        userAnswers?: UserAnswerItem[] | null,
        numberingData?: NumberingDTO | null
    ) => {
        setCurrentQuestion(question);
        setProgress(progressData);
        if (numberingData) setNumbering(numberingData);

        const defaults = buildDefaultValuesFromQuestion(question, userAnswers || []);
        reset(defaults);
        questionStartRef.current = Date.now();
    };

    const handleStartSection = async (sectionIndex: number) => {
        if (!sessionId) return;
        setGlobalError(null);

        try {
            const res = await api.post(`/test/session/${sessionId}/start-section`, {
                sectionIndex,
            });

            const data = res.data;
            if (!data.success) throw new Error(data.message || "Failed to start section");

            setActiveSectionIndex(sectionIndex);
            setViewMode("question");

            const question: QuestionDTO = data.currentQuestion;
            const progressData: ProgressDTO = data.progress;
            const sectionTimeRemaining: number = data.sectionTimeRemaining;

            setSectionTimeLeft(sectionTimeRemaining ?? null);
            hydrateQuestionState(question, progressData, null, null);
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Fail to start section");
        }
    };

    // ---------- Submit answer ----------
    const sendAnswerAndGoNext = async (values: QuestionFormValues) => {
        if (!sessionId || !currentQuestion || !progress) return;

        setGlobalError(null);

        const now = Date.now();
        const timeSpent =
            questionStartRef.current != null
                ? Math.max(1, Math.round((now - questionStartRef.current) / 1000))
                : 0;

        const rawAnswers = values.answers || {};
        const answersPayload = Object.entries(rawAnswers)
            .filter(([, val]) => val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0))
            .map(([questionId, answer]) => ({ questionId, answer }));

        try {
            const res = await api.post(`/test/session/${sessionId}/submit`, {
                answers: answersPayload,
                timeSpent,
                lastQuestionIndex: progress.currentQuestion ?? 0,
            });

            const data = res.data;
            if (!data.success) throw new Error(data.message || "Failed to submit answer");

            if (data.isTestCompleted && data.analysis) {
                setAnalysis(data.analysis);
                setViewMode("result");
                return;
            }

            if (data.sectionCompleted && data.sections) {
                setSections(data.sections);
                setActiveSectionIndex(null);
                setCurrentQuestion(null);
                setProgress(null);
                setNumbering(null);
                setSectionTimeLeft(null);
                setViewMode("sections");
                return;
            }

            const nextQuestion: QuestionDTO = data.currentQuestion;
            const progressData: ProgressDTO = data.progress;
            const userAnswer: UserAnswerItem[] | null = data.userAnswer || null;
            const numberingData: NumberingDTO | null = data.numbering || null;

            hydrateQuestionState(nextQuestion, progressData, userAnswer, numberingData || undefined);
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Failed to submit answer");
        }
    };

    // ---------- Previous question ----------
    const goToPreviousQuestion = async () => {
        if (!sessionId) return;
        setGlobalError(null);

        try {
            const res = await api.get(`/test/session/${sessionId}/previous`);
            const data = res.data;

            if (!data.success) throw new Error(data.message || "Failed to load previous question");

            const question: QuestionDTO = data.currentQuestion;
            const progressData: ProgressDTO = data.progress;
            const userAnswer: UserAnswerItem[] | null = data.userAnswer || null;
            const numberingData: NumberingDTO | null = data.numbering || null;

            hydrateQuestionState(question, progressData, userAnswer, numberingData || undefined);
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Failed to load previous");
        }
    };

    // ---------- Submit whole test ----------
    const handleSubmitTest = async () => {
        if (!sessionId) return;
        setGlobalError(null);

        try {
            const res = await api.post(`/test/${sessionId}/submit`);
            const data = res.data;

            if (!data.success) throw new Error(data.message || "Failed to submit test");

            setAnalysis(data.analysis);
            setViewMode("result");
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Failed to submit test");
        }
    };

    // ---------- Derived UI values ----------
    const questionLabel = useMemo(() => {
        if (numbering) {
            const { questionCount, firstGlobalQuestionNumber, totalGlobalQuestions } = numbering;
            if (questionCount > 1) {
                return `Questions ${firstGlobalQuestionNumber}–${firstGlobalQuestionNumber + questionCount - 1} of ${totalGlobalQuestions}`;
            }
            return `Question ${firstGlobalQuestionNumber} of ${totalGlobalQuestions}`;
        }
        if (progress) {
            return `Question ${progress.questionsAnswered + 1} of ${progress.totalQuestions}`;
        }
        return "Question";
    }, [numbering, progress]);

    // ---------- Answer field renderers ----------
    const renderAnswerField = (
        fieldName: string,
        questionType: string,
        options?: QuestionOption[]
    ) => {
        // MCQ single choice
        if (questionType === "multiple_choice_single" && options?.length) {
            return (
                <div className="space-y-3">
                    {options.map((opt, idx) => (
                        <label
                            key={idx}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                        >
                            <input
                                type="radio"
                                value={opt.label || opt.text}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                {...register(`answers.${fieldName}` as const)}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {opt.label && <span className="mr-2 font-bold">{opt.label}.</span>}
                                {opt.text}
                            </span>
                        </label>
                    ))}
                </div>
            );
        }

        // MCQ multiple choice
        if (questionType === "multiple_choice_multiple" && options?.length) {
            return (
                <Controller
                    control={control}
                    name={`answers.${fieldName}` as const}
                    defaultValue={[]}
                    render={({ field }) => {
                        const value: string[] = field.value || [];
                        const toggle = (val: string) => {
                            if (value.includes(val)) {
                                field.onChange(value.filter((v) => v !== val));
                            } else {
                                field.onChange([...value, val]);
                            }
                        };
                        return (
                            <div className="space-y-3">
                                {options.map((opt, idx) => {
                                    const val = opt.label || opt.text;
                                    const checked = value.includes(val);
                                    return (
                                        <label
                                            key={idx}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${checked
                                                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                                                    : "border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                                checked={checked}
                                                onChange={() => toggle(val)}
                                            />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {opt.label && <span className="mr-2 font-bold">{opt.label}.</span>}
                                                {opt.text}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        );
                    }}
                />
            );
        }

        // True/False/Not Given & Yes/No/Not Given
        if (["true_false_not_given", "yes_no_not_given"].includes(questionType)) {
            const choices =
                questionType === "true_false_not_given"
                    ? ["True", "False", "Not Given"]
                    : ["Yes", "No", "Not Given"];
            return (
                <div className="flex flex-wrap gap-3">
                    {choices.map((c) => (
                        <label
                            key={c}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
                        >
                            <input
                                type="radio"
                                value={c}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                {...register(`answers.${fieldName}` as const)}
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{c}</span>
                        </label>
                    ))}
                </div>
            );
        }

        // Short answer / sentence completion
        if (["short_answer", "sentence_completion"].includes(questionType)) {
            return (
                <input
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900/30"
                    placeholder="Type your answer here..."
                    {...register(`answers.${fieldName}` as const)}
                />
            );
        }

        // Generic textarea (writing or other)
        return (
            <textarea
                rows={6}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900/30"
                placeholder="Type your detailed answer here..."
                {...register(`answers.${fieldName}` as const)}
            />
        );
    };

    // ---------- Views ----------
    const renderSectionsView = () => {
        if (!testSeries) return null;
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <button
                            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                            {testSeries.title}
                        </h1>
                        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
                            Full-Length Test • {testSeries.totalQuestions} questions • {testSeries.duration} minutes
                        </p>
                    </div>

                    {/* Progress Summary */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sections</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{testSeries.totalSections}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-green-100 p-2 dark:bg-green-900/30">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {sections.filter(s => s.status === "completed").length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-900/30">
                                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Duration</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{testSeries.duration}m</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sections.map((sec) => {
                            const isObj = typeof sec.sectionId === "object";
                            const secName = isObj ? (sec.sectionId as any).name : String(sec.sectionId);
                            const secDesc = isObj ? (sec.sectionId as any).description : "Test section";
                            const canStart = sec.status !== "completed";
                            const statusBadge = getSectionStatusBadge(sec.status);

                            return (
                                <div
                                    key={sec.index}
                                    className="group rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-400"
                                >
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            Section {sec.index + 1}
                                        </div>
                                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadge}`}>
                                            {sec.status === "completed" ? "Completed" : sec.status === "in_progress" ? "In Progress" : "Not Started"}
                                        </span>
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{secName}</h3>
                                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{secDesc}</p>

                                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {sec.duration} min
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HelpCircle className="h-4 w-4" />
                                            {sec.totalQuestions} questions
                                        </span>
                                    </div>

                                    <Button
                                        size="lg"
                                        className={`w-full ${sec.status === "completed"
                                            ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                            }`}
                                        disabled={!canStart}
                                        onClick={() => handleStartSection(sec.index)}
                                    >
                                        {sec.status === "not_started" ? "Start Section" : "Continue Section"}
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {globalError && (
                        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm">{globalError}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderQuestionView = () => {
        if (!testSeries || !currentQuestion || !progress) return null;

        const canGoPrevious = !(progress.currentSection === 1 && progress.currentQuestion === 1);
        const mainQuestionType = currentQuestion.questionType;
        const showWritingLayout = isWritingType(mainQuestionType);
        const showSpeakingLayout = isSpeakingType(mainQuestionType);
        const showListeningLayout = isListeningType(mainQuestionType) || !!currentQuestion.content.audioUrl;

        return (
            <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
                {/* Top Navigation Bar */}
                <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
                    <div className="mx-auto max-w-7xl px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                    onClick={() => {
                                        setViewMode("sections");
                                        setCurrentQuestion(null);
                                        setNumbering(null);
                                        setProgress(null);
                                    }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    All Sections
                                </button>
                                <div className="hidden sm:block">
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{testSeries.title}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Section {progress.currentSection} of {progress.totalSections}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Timer */}
                                <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-2 dark:bg-red-900/20">
                                    <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    <div className="text-center">
                                        <div className="text-xs font-medium text-red-600 dark:text-red-400">Time Left</div>
                                        <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                            {formatSeconds(sectionTimeLeft ?? null)}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="hidden sm:flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
                                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    <div className="text-center">
                                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Progress</div>
                                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                            {Math.round(progress.completionPercentage)}%
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                                    onClick={handleSubmitTest}
                                >
                                    End Test
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-4 py-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left Panel - Passage/Instructions */}
                            <div className="lg:col-span-1">
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reading Passage</h3>
                                        <button
                                            onClick={() => handleSpeak(currentQuestion.content.passageText || currentQuestion.content.instruction)}
                                            className="rounded-lg bg-gray-100 p-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                        >
                                            <Volume2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {showListeningLayout && currentQuestion.content.audioUrl && (
                                        <div className="mb-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">Audio</span>
                                                <button
                                                    onClick={() => setAudioPlaying(!audioPlaying)}
                                                    className="rounded-full bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                                                >
                                                    {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            <audio
                                                src={currentQuestion.content.audioUrl}
                                                controls
                                                className="w-full"
                                                onPlay={() => setAudioPlaying(true)}
                                                onPause={() => setAudioPlaying(false)}
                                            />
                                        </div>
                                    )}

                                    {currentQuestion.content.passageTitle && (
                                        <h4 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
                                            {currentQuestion.content.passageTitle}
                                        </h4>
                                    )}

                                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                                        <p className="whitespace-pre-line leading-relaxed">
                                            {currentQuestion.content.passageText || currentQuestion.content.instruction}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel - Question & Answers */}
                            <div className="lg:col-span-2">
                                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    {/* Question Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {questionLabel}
                                                </div>
                                                {currentQuestion.title && (
                                                    <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                                                        {currentQuestion.title}
                                                    </h2>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Section {progress.currentSection} • Q{progress.currentQuestion}
                                            </div>
                                        </div>

                                        {!showWritingLayout && (
                                            <div className="mt-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                                    {currentQuestion.content.instruction}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Question Form */}
                                    <form onSubmit={handleSubmit(sendAnswerAndGoNext)} className="space-y-6">
                                        {/* Speaking Controls */}
                                        {showSpeakingLayout && (
                                            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-700/50">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Speaking Response</h4>
                                                    {recording && (
                                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                                            Recording...
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {!recording ? (
                                                        <Button
                                                            type="button"
                                                            size="lg"
                                                            className="bg-green-600 text-white hover:bg-green-700"
                                                            onClick={startRecording}
                                                        >
                                                            <Mic className="h-4 w-4" />
                                                            Start Recording
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            size="lg"
                                                            className="bg-red-600 text-white hover:bg-red-700"
                                                            onClick={stopRecording}
                                                        >
                                                            <Square className="h-4 w-4" />
                                                            Stop Recording
                                                        </Button>
                                                    )}
                                                    {recordedUrl && (
                                                        <audio controls className="flex-1">
                                                            <source src={recordedUrl} />
                                                        </audio>
                                                    )}
                                                </div>
                                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                    Record your answer. The audio will be saved as your response.
                                                </p>
                                            </div>
                                        )}

                                        {/* Question Content */}
                                        {currentQuestion.isQuestionGroup && currentQuestion.questionGroup?.length ? (
                                            <div className="space-y-6">
                                                {currentQuestion.questionGroup.map((group) => (
                                                    <div
                                                        key={group._id}
                                                        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-600 dark:bg-gray-700"
                                                    >
                                                        <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                                            {group.title}
                                                        </h4>
                                                        {group.instruction && (
                                                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                                                {group.instruction}
                                                            </p>
                                                        )}
                                                        <div className="space-y-4">
                                                            {group.questions.map((sub) => (
                                                                <div
                                                                    key={sub._id}
                                                                    className="rounded-xl bg-gray-50 p-4 dark:bg-gray-600/30"
                                                                >
                                                                    <p className="mb-3 font-medium text-gray-900 dark:text-white">
                                                                        {sub.question}
                                                                    </p>
                                                                    {renderAnswerField(sub._id, group.type, sub.options)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {!showWritingLayout && !showSpeakingLayout && (
                                                    <p className="text-lg text-gray-700 dark:text-gray-300">
                                                        {currentQuestion.content.passageText || currentQuestion.content.instruction}
                                                    </p>
                                                )}
                                                {renderAnswerField(
                                                    currentQuestion._id,
                                                    currentQuestion.questionType,
                                                    currentQuestion.options
                                                )}
                                            </div>
                                        )}

                                        {/* Navigation */}
                                        <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Answered: {progress.questionsAnswered} of {progress.totalQuestions}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    disabled={!canGoPrevious || isSubmitting}
                                                    onClick={goToPreviousQuestion}
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={isSubmitting}
                                                >
                                                    Next Question
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </form>

                                    {globalError && (
                                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                            <p className="text-sm">{globalError}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    };

    const renderResultView = () => {
        if (!analysis || !testSeries) return null;
        const s = analysis.summary;

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            Test Completed Successfully
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Test Results</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{testSeries.title}</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Questions</div>
                            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{s.totalQuestions}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">Correct</div>
                            <div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{s.correctAnswers}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-red-600 dark:text-red-400">Incorrect</div>
                            <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{s.incorrectAnswers}</div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Accuracy</div>
                            <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {s.accuracy.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Section-wise Performance */}
                    <div className="rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Section-wise Performance</h3>
                        </div>
                        <div className="overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Section</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Questions</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Correct</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Accuracy</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {analysis.sectionWiseAnalysis.map((sec, index) => (
                                        <tr key={sec.sectionId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {sec.sectionType}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {sec.totalQuestions}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-green-600 dark:text-green-400">
                                                {sec.correctAnswers}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-blue-600 dark:text-blue-400">
                                                {sec.accuracy.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                {sec.score}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Button>
                        <Button
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => {
                                setAnalysis(null);
                                fetchOrStartTest();
                            }}
                        >
                            Retake Test
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // ---------- Main render ----------
    if (loading && !testSeries) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-lg text-gray-600 dark:text-gray-400">Loading test...</p>
                </div>
            </div>
        );
    }

    if (globalError && !testSeries) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
                <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Error Loading Test</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{globalError}</p>
                    <Button className="mt-6" onClick={fetchOrStartTest}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (viewMode === "sections") return renderSectionsView();
    if (viewMode === "question") return renderQuestionView();
    if (viewMode === "result") return renderResultView();

    return null;
};

export default FullLengthTestPage;