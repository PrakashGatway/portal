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
    | string; // depending on populate
    duration: number; // minutes (from backend); we’ll convert to seconds
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
    type: string; // questionType for this group
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

/**
 * MUST match backend getQuestionNumbering:
 * {
 *   sectionIndex,
 *   questionIndex,
 *   questionCount,
 *   firstGlobalQuestionNumber,
 *   totalGlobalQuestions,
 *   firstSectionQuestionNumber,
 *   totalSectionQuestions
 * }
 */
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

// RHF form type
type QuestionFormValues = {
    answers: Record<string, any>;
};

// ---------- Helper UI utilities ----------

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
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "in_progress":
            return "bg-amber-100 text-amber-700 border-amber-200";
        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

const isWritingType = (t: string) =>
    ["writing_task_1_academic", "writing_task_1_general", "writing_task_2"].includes(
        t
    );

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

    const [viewMode, setViewMode] = useState<"sections" | "question" | "result">(
        "sections"
    );
    const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);

    const [currentQuestion, setCurrentQuestion] = useState<QuestionDTO | null>(null);
    const [progress, setProgress] = useState<ProgressDTO | null>(null);
    const [numbering, setNumbering] = useState<NumberingDTO | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisDTO | null>(null);

    const [sectionTimeLeft, setSectionTimeLeft] = useState<number | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const questionStartRef = useRef<number | null>(null);

    // speaking record state
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

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

    // ---------- Speaking: record + upload placeholder ----------

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

                // TODO: you must implement this:
                // upload blob to backend, get file URL/path
                // example:
                // const fileUrl = await uploadSpeakingAudio(blob);
                // then store into form as the answer
                // setValue(`answers.${currentQuestion?._id}`, fileUrl);
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

            // Full-Length → show section list, resume if section in_progress
            if (data.testSeries.type === "Full-Length") {
                const inProgressIndex = (data.sections || []).findIndex(
                    (s: SectionDTO) => s.status === "in_progress"
                );

                if (inProgressIndex !== -1) {
                    setActiveSectionIndex(inProgressIndex);
                    setViewMode("sections"); // stay on sections until user taps section
                } else {
                    setViewMode("sections");
                }
            } else {
                // Non Full-Length (Mini / Sectional) → directly show question
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
                    // timeRemaining in seconds from backend
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
            // Here you can auto-submit the section/test if you want
            return;
        }

        const id = setTimeout(() => {
            setSectionTimeLeft((prev) => (prev != null ? prev - 1 : prev));
        }, 1000);

        return () => clearTimeout(id);
    }, [sectionTimeLeft]);

    // ---------- Helpers to map API -> form ----------

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

            // backend duration is in minutes; here sectionTimeRemaining should be seconds
            setSectionTimeLeft(sectionTimeRemaining ?? null);
            hydrateQuestionState(question, progressData, null, null);
        } catch (err: any) {
            console.error(err);
            setGlobalError(err.response?.data?.message || err.message || "Fail to start section");
        }
    };

    // ---------- Submit answer (Next) ----------

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

            // 1) Finished whole test
            if (data.isTestCompleted && data.analysis) {
                setAnalysis(data.analysis);
                setViewMode("result");
                return;
            }

            // 2) Finished this section (Full-Length) but test not done
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

            // 3) Still inside section -> next question
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
            const { questionCount, firstGlobalQuestionNumber, totalGlobalQuestions } =
                numbering;
            if (questionCount > 1) {
                return `Questions ${firstGlobalQuestionNumber}–${firstGlobalQuestionNumber + questionCount - 1
                    } of ${totalGlobalQuestions}`;
            }
            return `Question ${firstGlobalQuestionNumber} of ${totalGlobalQuestions}`;
        }
        if (progress) {
            return `Question ${progress.questionsAnswered + 1} of ${progress.totalQuestions}`;
        }
        return "Question";
    }, [numbering, progress]);

    // ---------- Question answer widgets ----------

    const renderAnswerField = (
        fieldName: string,
        questionType: string,
        options?: QuestionOption[]
    ) => {
        // MCQ single choice
        if (questionType === "multiple_choice_single" && options?.length) {
            return (
                <div className="space-y-2">
                    {options.map((opt, idx) => (
                        <label
                            key={idx}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs hover:border-sky-500"
                        >
                            <input
                                type="radio"
                                value={opt.label || opt.text}
                                className="h-3 w-3"
                                {...register(`answers.${fieldName}` as const)}
                            />
                            <span className="font-semibold text-slate-100">
                                {opt.label && <span className="mr-1">{opt.label}.</span>}
                                {opt.text}
                            </span>
                        </label>
                    ))}
                </div>
            );
        }

        // MCQ multiple choice -> array of values
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
                            <div className="space-y-2">
                                {options.map((opt, idx) => {
                                    const val = opt.label || opt.text;
                                    const checked = value.includes(val);
                                    return (
                                        <label
                                            key={idx}
                                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${checked
                                                ? "border-sky-500 bg-sky-900/30"
                                                : "border-slate-700 bg-slate-900"
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-3 w-3"
                                                checked={checked}
                                                onChange={() => toggle(val)}
                                            />
                                            <span className="font-semibold text-slate-100">
                                                {opt.label && <span className="mr-1">{opt.label}.</span>}
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
                <div className="flex flex-wrap gap-2">
                    {choices.map((c) => (
                        <label
                            key={c}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs hover:border-sky-500"
                        >
                            <input
                                type="radio"
                                value={c}
                                className="h-3 w-3"
                                {...register(`answers.${fieldName}` as const)}
                            />
                            <span className="text-slate-100">{c}</span>
                        </label>
                    ))}
                </div>
            );
        }

        // Short answer / sentence completion / generic text
        if (["short_answer", "sentence_completion"].includes(questionType)) {
            return (
                <input
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-50 outline-none focus:border-sky-500"
                    placeholder="Type your answer"
                    {...register(`answers.${fieldName}` as const)}
                />
            );
        }

        // Generic textarea (writing or other)
        return (
            <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-50 outline-none focus:border-sky-500"
                placeholder="Type your answer"
                {...register(`answers.${fieldName}` as const)}
            />
        );
    };

    // ---------- Views ----------

    const renderSectionsView = () => {
        if (!testSeries) return null;
        return (
            <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <button
                                className="mb-2 inline-flex items-center text-xs text-slate-400 hover:text-slate-200"
                                onClick={() => window.history.back()}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Back
                            </button>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                {testSeries.title}
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Full-Length IELTS Style Test • {testSeries.totalQuestions} questions •{" "}
                                {testSeries.duration} minutes
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-right">
                                <div className="text-xs uppercase text-slate-400">Attempt Status</div>
                                <div className="text-sm font-semibold text-emerald-400">
                                    {sections.some((s) => s.status === "completed")
                                        ? "In Progress"
                                        : "Not Started"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {sections.map((sec) => {
                            const isObj = typeof sec.sectionId === "object";
                            const secName = isObj
                                ? (sec.sectionId as any).name
                                : String(sec.sectionId);
                            const secDesc = isObj
                                ? (sec.sectionId as any).description
                                : "Test section";

                            const canStart = sec.status !== "completed";
                            const statusBadge = getSectionStatusBadge(sec.status);

                            return (
                                <div
                                    key={sec.index}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                                                <BookOpen className="mr-1 h-3 w-3" />
                                                Section {sec.index + 1}
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadge}`}
                                            >
                                                {sec.status === "completed"
                                                    ? "Completed"
                                                    : sec.status === "in_progress"
                                                        ? "In Progress"
                                                        : "Not Started"}
                                            </span>
                                        </div>
                                        <h2 className="mt-3 text-lg font-semibold text-white">{secName}</h2>
                                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">{secDesc}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5">
                                                <Clock className="mr-1 h-3 w-3" />
                                                {sec.duration} min
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5">
                                                {sec.totalQuestions} questions
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <Button
                                            size="sm"
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
                                            disabled={!canStart}
                                            onClick={() => handleStartSection(sec.index)}
                                        >
                                            {sec.status === "not_started" ? "Start Section" : "Continue Section"}
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {globalError && (
                        <div className="mt-6 flex items-center rounded-xl bg-red-900/40 px-3 py-2 text-sm text-red-100">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            {globalError}
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
        const showListeningLayout =
            isListeningType(mainQuestionType) || !!currentQuestion.content.audioUrl;

        return (
            <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
                {/* Top bar */}
                <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <button
                                className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200"
                                onClick={() => {
                                    setViewMode("sections");
                                    setCurrentQuestion(null);
                                    setNumbering(null);
                                    setProgress(null);
                                }}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> All Sections
                            </button>
                            <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                                    {testSeries.title}
                                </div>
                                <div className="text-xs text-slate-400">
                                    Section {progress.currentSection} of {progress.totalSections}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-right">
                                <div className="text-[10px] uppercase text-slate-400">Time Left</div>
                                <div className="flex items-center justify-end gap-1 text-sm font-semibold text-emerald-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatSeconds(sectionTimeLeft ?? null)}
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-right">
                                <div className="text-[10px] uppercase text-slate-400">Progress</div>
                                <div className="text-sm font-semibold text-sky-400">
                                    {Math.round(progress.completionPercentage)}%
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-xs text-red-400 hover:bg-red-500/10"
                                onClick={handleSubmitTest}
                            >
                                End Test
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-4 py-4">
                    {/* Left: passage / instructions / audio (for writing + listening) */}
                    <section className="hidden w-2/5 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-100 md:flex">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                                <BookOpen className="mr-1 h-3 w-3" />
                                Passage / Prompt
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <span>{questionLabel}</span>
                                <button
                                    type="button"
                                    className="ml-1 inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 hover:border-sky-500"
                                    onClick={() =>
                                        handleSpeak(
                                            currentQuestion.content.passageText ||
                                            currentQuestion.content.instruction
                                        )
                                    }
                                >
                                    <Volume2 className="mr-1 h-3 w-3" />
                                    Read Aloud
                                </button>
                            </span>
                        </div>

                        {currentQuestion.content.passageTitle && (
                            <h2 className="mt-2 text-base font-semibold text-white">
                                {currentQuestion.content.passageTitle}
                            </h2>
                        )}

                        {showListeningLayout && currentQuestion.content.audioUrl && (
                            <div className="mt-3 rounded-lg bg-slate-950/40 p-2">
                                <div className="mb-1 text-[11px] uppercase text-slate-400">
                                    Listening Audio
                                </div>
                                <audio controls className="w-full">
                                    <source src={currentQuestion.content.audioUrl} />
                                </audio>
                            </div>
                        )}

                        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-200">
                            {currentQuestion.content.passageText || currentQuestion.content.instruction}
                        </p>
                    </section>

                    {/* Right: question & answers */}
                    <section className="flex w-full flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                                    {questionLabel}
                                </div>
                                {currentQuestion.title && (
                                    <h2 className="mt-1 text-base font-semibold text-white">
                                        {currentQuestion.title}
                                    </h2>
                                )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                                Section {progress.currentSection} • Question {progress.currentQuestion}
                            </div>
                        </div>

                        {!showWritingLayout && (
                            <div className="mb-3 rounded-xl bg-slate-900/80 p-3 text-xs text-slate-200">
                                {currentQuestion.content.instruction}
                            </div>
                        )}

                        {/* Writing layout (content left, big input right) is already done by split; here we just give big textarea */}
                        <form
                            className="flex flex-1 flex-col gap-4"
                            onSubmit={handleSubmit(sendAnswerAndGoNext)}
                        >
                            <div className="flex-1 overflow-y-auto pr-1 text-sm">
                                {/* Grouped question */}
                                {currentQuestion.isQuestionGroup && currentQuestion.questionGroup?.length ? (
                                    <div className="space-y-4">
                                        {currentQuestion.questionGroup.map((group) => (
                                            <div
                                                key={group._id}
                                                className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                                            >
                                                <div className="mb-2 text-[13px] font-semibold text-slate-100">
                                                    {group.title}
                                                </div>
                                                {group.instruction && (
                                                    <p className="mb-2 text-[11px] text-slate-400">
                                                        {group.instruction}
                                                    </p>
                                                )}
                                                <div className="space-y-3">
                                                    {group.questions.map((sub) => (
                                                        <div
                                                            key={sub._id}
                                                            className="rounded-lg bg-slate-950/40 p-2 text-xs"
                                                        >
                                                            <p className="mb-1 text-slate-100">{sub.question}</p>
                                                            {renderAnswerField(sub._id, group.type, sub.options)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Single question
                                    <div className="space-y-3">
                                        {showWritingLayout && (
                                            <div className="text-xs text-slate-200">
                                                {/* instruction already visible in left column; no need to repeat */}
                                            </div>
                                        )}

                                        {/* speaking controls */}
                                        {showSpeakingLayout && (
                                            <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="font-semibold text-slate-100">
                                                        Speaking Response
                                                    </span>
                                                    {recording ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                                                            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                            Recording…
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400">
                                                            Press record and answer aloud.
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!recording ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="flex items-center gap-1 rounded-full bg-emerald-500 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                                                            onClick={startRecording}
                                                        >
                                                            <Mic className="h-3.5 w-3.5" />
                                                            Record
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="flex items-center gap-1 rounded-full bg-red-500 text-xs font-semibold text-white hover:bg-red-400"
                                                            onClick={stopRecording}
                                                        >
                                                            <Square className="h-3.5 w-3.5" />
                                                            Stop
                                                        </Button>
                                                    )}
                                                    {recordedUrl && (
                                                        <audio controls className="ml-2 h-8">
                                                            <source src={recordedUrl} />
                                                        </audio>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-[10px] text-slate-400">
                                                    After you implement the upload API, your recorded audio URL will be
                                                    saved as the answer for this speaking question.
                                                </p>
                                            </div>
                                        )}

                                        {/* Fallback instruction text for non-writing */}
                                        {!showWritingLayout && !showSpeakingLayout && (
                                            <p className="text-sm text-slate-100">
                                                {currentQuestion.content.passageText ||
                                                    currentQuestion.content.instruction}
                                            </p>
                                        )}

                                        {/* For single question: use field name = question._id */}
                                        {renderAnswerField(
                                            currentQuestion._id,
                                            currentQuestion.questionType,
                                            currentQuestion.options
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Bottom bar: navigation */}
                            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                    <span>
                                        Answered: {progress.questionsAnswered} / {progress.totalQuestions}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1 border-slate-600 text-xs text-slate-200 disabled:text-slate-500"
                                        disabled={!canGoPrevious}
                                        onClick={(e) => { e.preventDefault(); goToPreviousQuestion() }}
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Previous
                                    </Button>

                                    {/* You can add a Skip button wired to /test/:sessionId/skip if you want */}

                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="flex items-center gap-1 rounded-xl bg-sky-500 text-xs font-semibold text-sky-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400"
                                        disabled={isSubmitting}
                                    >
                                        Next
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </form>

                        {globalError && (
                            <div className="mt-3 flex items-center rounded-xl bg-red-900/40 px-3 py-2 text-xs text-red-100">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                {globalError}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        );
    };

    const renderResultView = () => {
        if (!analysis || !testSeries) return null;
        const s = analysis.summary;

        return (
            <div className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <button
                                className="mb-2 inline-flex items-center text-xs text-slate-400 hover:text-slate-200"
                                onClick={() => window.history.back()}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Back
                            </button>
                            <h1 className="text-2xl font-bold text-white">Test Analysis</h1>
                            <p className="mt-1 text-sm text-slate-400">{testSeries.title}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-emerald-400" />
                    </div>

                    {/* Summary cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-slate-400">Total Questions</div>
                            <div className="mt-1 text-2xl font-bold text-white">{s.totalQuestions}</div>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-emerald-400">Correct</div>
                            <div className="mt-1 text-2xl font-bold text-emerald-400">
                                {s.correctAnswers}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-red-400">Incorrect</div>
                            <div className="mt-1 text-2xl font-bold text-red-400">
                                {s.incorrectAnswers}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <div className="text-[11px] uppercase text-sky-400">Accuracy</div>
                            <div className="mt-1 text-2xl font-bold text-sky-400">
                                {s.accuracy.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Section-wise table */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80">
                        <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
                            Section-wise Performance
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-950/60 text-xs uppercase text-slate-400">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Section</th>
                                        <th className="px-4 py-2 text-center">Questions</th>
                                        <th className="px-4 py-2 text-center">Correct</th>
                                        <th className="px-4 py-2 text-center">Accuracy</th>
                                        <th className="px-4 py-2 text-center">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.sectionWiseAnalysis.map((sec) => (
                                        <tr
                                            key={sec.sectionId}
                                            className="border-t border-slate-800/70 hover:bg-slate-900"
                                        >
                                            <td className="px-4 py-2 text-slate-100">{sec.sectionType}</td>
                                            <td className="px-4 py-2 text-center">{sec.totalQuestions}</td>
                                            <td className="px-4 py-2 text-center">{sec.correctAnswers}</td>
                                            <td className="px-4 py-2 text-center">
                                                {sec.accuracy.toFixed(1)}%
                                            </td>
                                            <td className="px-4 py-2 text-center">{sec.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-xs text-slate-200"
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
            <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            </div>
        );
    }

    if (globalError && !testSeries) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-200">
                <AlertCircle className="mb-2 h-6 w-6 text-red-400" />
                <p className="mb-4 text-sm text-red-100">{globalError}</p>
                <Button size="sm" onClick={fetchOrStartTest}>
                    Retry
                </Button>
            </div>
        );
    }

    if (viewMode === "sections") return renderSectionsView();
    if (viewMode === "question") return renderQuestionView();
    if (viewMode === "result") return renderResultView();

    return null;
};

export default FullLengthTestPage;