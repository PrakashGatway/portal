import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useParams, useNavigate } from "react-router";
import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    Clock,
    Flag,
    LogOut,
    Save,
    ChevronRight,
    Edit3,
    Pause,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import FullScreenLoader from "../../components/fullScreeLoader";
import { useGmatTimers } from "./SectionTimer";
import { MultiSourceComponent, TableAnalysisSection } from "./QuestionComponent";

// ===================
// Types
// ===================
interface QuestionDoc {
    _id: string;
    questionText: string;
    questionType: string;
    difficulty?: string;
    stimulus?: string;
    options?: {
        label?: string;
        text: string;
    }[];
    marks?: number;
    negativeMarks?: number;
    dataInsights?: any; // from your question.model.ts
}

interface AttemptQuestion {
    question: string;
    order: number;
    answerOptionIndexes: number[];
    answerText?: string;
    isAnswered: boolean;
    markedForReview: boolean;
    timeSpentSeconds: number;
    isCorrect?: boolean;
    marksAwarded?: number;
    questionDoc?: QuestionDoc | null;
}

interface AttemptSection {
    sectionConfigId?: string | null;
    sectionRef?: string | null;
    name?: string;
    durationMinutes?: number;
    startedAt?: string;
    endedAt?: string;
    status: "not_started" | "in_progress" | "completed";
    questions: AttemptQuestion[];
    stats?: {
        correct: number;
        incorrect: number;
        skipped: number;
        rawScore: number;
    };
    reviewState?: {
        enabled: boolean;
        editsRemaining: number;
        questionsEdited: number[];
    };
}

interface OverallStats {
    totalQuestions: number;
    totalAttempted: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalSkipped: number;
    rawScore: number;
}

type GmatPhase =
    | "intro"
    | "select_order"
    | "section_instructions"
    | "in_section"
    | "review"
    | "break";

type GmatScreen =
    | "introduction"
    | "select_order"
    | "section_instructions"
    | "question"
    | "review"
    | "break";

interface GmatMeta {
    orderChosen: boolean;
    moduleOrder: number[];
    phase: GmatPhase;
    currentSectionIndex: number;
    currentQuestionIndex: number;
    onBreak?: boolean;
    breakExpiresAt?: string;
}

interface TestAttempt {
    _id: string;
    user: string;
    exam: {
        _id: string;
        name: string;
        description?: string;
    };
    testTemplate: {
        _id: string;
        title: string;
        description?: string;
        testType: "full_length" | "sectional" | "quiz";
    };
    testType: "full_length" | "sectional" | "quiz";
    status: "in_progress" | "completed" | "cancelled" | "expired";
    totalDurationMinutes?: number;
    totalTimeUsedSeconds: number;
    startedAt?: string;
    completedAt?: string;
    sections: AttemptSection[];
    overallStats?: OverallStats;
    gmatMeta?: GmatMeta;
}

interface StartAttemptResponse {
    _id: string;
}

const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return `${mm}:${ss}`;
};

// All 6 permutations of 3 modules (indices 0,1,2)
const MODULE_PERMUTATIONS: number[][] = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
];

export default function GmatTestAttemptPage() {
    const { testTemplateId } = useParams<{ testTemplateId: string }>();
    const navigate = useNavigate();

    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [savingProgress, setSavingProgress] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [activeSectionIndex, setActiveSectionIndex] = useState(0);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const [sectionTimedOut, setSectionTimedOut] = useState(false);

    // GMAT-only: module sequence step
    const [hasChosenSequence, setHasChosenSequence] = useState(false);
    const [selectedSequenceIndex, setSelectedSequenceIndex] =
        useState<number | null>(null);

    // Timer for section order selection (2 minutes)
    const [orderSelectionTimer, setOrderSelectionTimer] =
        useState<number>(120);
    const [isOrderSelectionTimerRunning, setIsOrderSelectionTimerRunning] =
        useState(false);

    // Current screen state
    const [currentScreen, setCurrentScreen] = useState<GmatScreen>(
        "introduction"
    );

    // Intro pages (1..4)
    const [introPage, setIntroPage] = useState(1);

    // Answer required modal
    const [showAnswerRequiredModal, setShowAnswerRequiredModal] =
        useState(false);

    // Review mode (editing from review center)
    const [isInReviewMode, setIsInReviewMode] = useState(false);
    const [editsRemaining, setEditsRemaining] = useState(3);

    // Break between modules (10 minutes)
    const [breakSecondsLeft, setBreakSecondsLeft] = useState(600);
    const [breakStarted, setBreakStarted] = useState(false);

    const isCompleted = attempt?.status === "completed";


    useEffect(() => {
        if (!attempt || !hasChosenSequence || isCompleted) return;
        if (timerSecondsLeft == 0) {
            setTimerRunning(false);
            setSectionTimedOut(true); // 🔒 NEW: lock the section
            toast.info("Time is up for this module. Moving to review.");
            setCurrentScreen("review");
        }
    }, [timerSecondsLeft]);

    const testTitle =
        attempt?.testTemplate.title ||
        (attempt as any)?.testTemplate?.name ||
        "GMAT Practice Test";

    // ===================
    // 1️⃣ Start or resume GMAT attempt
    // ===================
    const startAttempt = useCallback(
        async () => {
            if (!testTemplateId) {
                setError("Missing testTemplateId in route");
                setLoading(false);
                return;
            }

            try {
                setStarting(true);
                setError(null);

                // Start or resume attempt
                const startRes = await api.post("/mcu/start", { testTemplateId });
                if (!startRes.data?.success) {
                    throw new Error(startRes.data?.message || "Failed to start attempt");
                }

                const started: StartAttemptResponse = startRes.data.data;
                const attemptId = (started as any)._id || startRes.data.data._id;

                // Load full attempt with questions
                const detailRes = await api.get(`/mcu/attempts/${attemptId}`);
                if (!detailRes.data?.success) {
                    throw new Error(detailRes.data?.message || "Failed to load attempt");
                }

                const loaded: TestAttempt = detailRes.data.data;

                if (!loaded.sections || loaded.sections.length === 0) {
                    setError("This GMAT test has no sections configured.");
                    setLoading(false);
                    return;
                }

                setAttempt(loaded);

                const meta = loaded.gmatMeta;

                if (meta) {
                    // Use backend GMAT meta for resume
                    const secIdx =
                        typeof meta.currentSectionIndex === "number"
                            ? meta.currentSectionIndex
                            : 0;
                    const qIdx =
                        typeof meta.currentQuestionIndex === "number"
                            ? meta.currentQuestionIndex
                            : 0;

                    setActiveSectionIndex(secIdx);
                    setActiveQuestionIndex(qIdx);
                    setHasChosenSequence(!!meta.orderChosen);

                    let screen: GmatScreen = "introduction";
                    switch (meta.phase) {
                        case "intro":
                        default:
                            screen = "introduction";
                            break;
                        case "select_order":
                            screen = "select_order";
                            break;
                        case "section_instructions":
                            screen = "section_instructions";
                            break;
                        case "in_section":
                            screen = "question";
                            break;
                        case "review":
                            screen = "review";
                            break;
                        case "break":
                            screen = "break";
                            break;
                    }
                    setCurrentScreen(screen);

                    // Section timer on resume (when in question screen)
                    if (screen === "question") {
                        const sec = loaded.sections[secIdx];
                        if (sec) {
                            const secDurationMinutes =
                                sec.durationMinutes || loaded.totalDurationMinutes || 60;
                            const secTotalSeconds = secDurationMinutes * 60;
                            const usedInSection = sec.questions.reduce(
                                (sum, q) => sum + (q.timeSpentSeconds || 0),
                                0
                            );
                            const left = Math.max(0, secTotalSeconds - usedInSection);
                            setTimerSecondsLeft(left);
                            setTimerRunning(
                                loaded.status === "in_progress" && left > 0 && !isCompleted
                            );
                        }
                    }

                    // If in select_order phase, start 2min timer again
                    if (screen === "select_order" && !meta.orderChosen) {
                        setOrderSelectionTimer(120);
                        setIsOrderSelectionTimerRunning(true);
                    }

                    // If in break, compute remaining from breakExpiresAt if backend sets it
                    if (screen === "break" && meta.breakExpiresAt) {
                        const diffMs =
                            new Date(meta.breakExpiresAt).getTime() - Date.now();
                        const remaining = Math.max(0, Math.floor(diffMs / 1000));
                        setBreakSecondsLeft(remaining || 600);
                    }
                } else {
                    // Fallback if backend doesn't have gmatMeta yet
                    setActiveSectionIndex(0);
                    setActiveQuestionIndex(0);
                    setHasChosenSequence(false);
                    setCurrentScreen("introduction");
                }
            } catch (err: any) {
                console.error("startAttempt error:", err);
                setError(
                    err?.response?.data?.message ||
                    err.message ||
                    "Failed to start GMAT test"
                );
                toast.error(
                    err?.response?.data?.message || "Failed to start GMAT test"
                );
            } finally {
                setStarting(false);
                setLoading(false);
            }
        },
        [testTemplateId, isCompleted]
    );

    useEffect(() => {
        startAttempt();
    }, [startAttempt]);

    // ===================
    // 2️⃣ Derive modules (3 sections) for order screen
    // ===================
    const moduleSections = useMemo<AttemptSection[]>(() => {
        if (!attempt) return [];
        if (attempt.sections.length === 3) return attempt.sections;
        return attempt.sections.slice(0, 3);
    }, [attempt]);

    const moduleSequenceOptions = useMemo(() => {
        if (!moduleSections.length || moduleSections.length < 3) return [];
        const getName = (sec: AttemptSection, idx: number) =>
            sec.name || `Module ${idx + 1}`;
        return MODULE_PERMUTATIONS.map((perm, idx) => {
            const seqNames = perm.map((i) => ({
                order: i + 1,
                name: getName(moduleSections[i], i),
            }));
            return {
                index: idx,
                order: perm,
                labels: seqNames,
            };
        });
    }, [moduleSections]);

    // ===================
    // 3️⃣ Current section & question
    // ===================
    const currentSection = useMemo(
        () =>
            attempt && attempt.sections[activeSectionIndex]
                ? attempt.sections[activeSectionIndex]
                : null,
        [attempt, activeSectionIndex]
    );

    const currentQuestion = useMemo(
        () =>
            currentSection &&
                currentSection.questions[activeQuestionIndex]
                ? currentSection.questions[activeQuestionIndex]
                : null,
        [currentSection, activeQuestionIndex]
    );

    const qDoc = currentQuestion?.questionDoc || null;

    // ===================
    // 4️⃣ Re-init section timer when section changes (after sequence chosen)
    // ===================
    useEffect(() => {
        if (!attempt) return;
        if (!hasChosenSequence) return;
        const sec = attempt.sections[activeSectionIndex];
        if (!sec) return;

        const secDurationMinutes =
            sec.durationMinutes || attempt.totalDurationMinutes || 60;
        const secDurationSeconds = secDurationMinutes * 60;
        const usedInSection = sec.questions.reduce(
            (sum, q) => sum + (q.timeSpentSeconds || 0),
            0
        );
        const left = Math.max(0, secDurationSeconds - usedInSection);
        setTimerSecondsLeft(left);
        setTimerRunning(
            attempt.status === "in_progress" &&
            left > 0 &&
            !isCompleted &&
            currentScreen === "question"
        );
    }, [
        attempt,
        activeSectionIndex,
        hasChosenSequence,
        isCompleted,
        currentScreen,
    ]);

    // ===================
    // 5️⃣ Section timer tick (question timer)
    // ===================

    // Remove these useEffect intervals from your main component:
    // - Section timer tick (useEffect with timerRunning)
    // - Order selection timer (useEffect with isOrderSelectionTimerRunning)
    // - Break timer (useEffect with breakStarted)

    // Add this custom hook call instead:

    // useEffect(() => {
    //     if (!attempt || !timerRunning || isCompleted) return;
    //     if (currentScreen !== "question") return;
    //     if (timerSecondsLeft <= 0) return;

    //     const interval = setInterval(() => {
    //         setTimerSecondsLeft((prev) => {
    //             const next = prev - 1;
    //             return next < 0 ? 0 : next;
    //         });

    //         setAttempt((prev) => {
    //             if (!prev) return prev;
    //             const clone = { ...prev };
    //             clone.totalTimeUsedSeconds =
    //                 (clone.totalTimeUsedSeconds || 0) + 1;
    //             const sIdx = activeSectionIndex;
    //             const qIdx = activeQuestionIndex;
    //             if (
    //                 clone.sections[sIdx] &&
    //                 clone.sections[sIdx].questions[qIdx]
    //             ) {
    //                 clone.sections[sIdx].questions[qIdx].timeSpentSeconds += 1;
    //             }
    //             return clone;
    //         });
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, [
    //     attempt,
    //     timerRunning,
    //     timerSecondsLeft,
    //     activeSectionIndex,
    //     activeQuestionIndex,
    //     isCompleted,
    //     currentScreen,
    // ]);

    // ===================
    // 6️⃣ When section time is up – move to next section or submit
    // ===================
    useEffect(() => {
        if (!attempt || !hasChosenSequence || isCompleted) return;
        if (!timerRunning) return;
        if (currentScreen !== "question") return;

        if (timerSecondsLeft === 0) {
            const isLastSectionLocal =
                activeSectionIndex >= attempt.sections.length - 1;
            if (isLastSectionLocal) {
                setTimerRunning(false);
                toast.info(
                    "Time is up for the last module. Submitting your GMAT test..."
                );
                submitTestAttempt(true);
            } else {
                setTimerRunning(false);
                toast.info(
                    "Time is up for this module. Moving to the next module review."
                );
                // move to review of this section first (no break if time up)
                setCurrentScreen("review");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        timerSecondsLeft,
        timerRunning,
        attempt,
        activeSectionIndex,
        hasChosenSequence,
        isCompleted,
        currentScreen,
    ]);

    // ===================
    // Helper: save current question progress (+ optional GMAT phase/meta)
    // ===================
    const saveCurrentQuestionProgress = useCallback(
        async (opts?: {
            silent?: boolean;
            phase?: GmatPhase;
            metaSectionIndex?: number;
            metaQuestionIndex?: number;
        }) => {
            if (!attempt || !currentSection || !currentQuestion) return;
            if (attempt.status !== "in_progress") return;

            const silent = opts?.silent ?? true;

            try {
                setSavingProgress(!silent);

                const sectionIndex = activeSectionIndex;
                const questionIndex = activeQuestionIndex;

                const body: any = {
                    updates: [
                        {
                            sectionIndex,
                            questionIndex,
                            answerOptionIndexes:
                                currentQuestion.answerOptionIndexes || [],
                            answerText: currentQuestion.answerText || "",
                            isAnswered: currentQuestion.isAnswered,
                            markedForReview: currentQuestion.markedForReview,
                            timeSpentSeconds:
                                currentQuestion.timeSpentSeconds || 0,
                        },
                    ],
                    totalTimeUsedSeconds: attempt.totalTimeUsedSeconds || 0,
                };

                if (opts?.phase) {
                    body.gmatPhase = opts.phase;
                    body.currentSectionIndex =
                        opts.metaSectionIndex ?? sectionIndex;
                    body.currentQuestionIndex =
                        opts.metaQuestionIndex ?? questionIndex;
                }

                await api.patch(`/mcu/attempts/${attempt._id}/save-progress`, body);

                if (!silent) {
                    toast.success("Progress saved");
                }
            } catch (err: any) {
                if (!silent) {
                    toast.error(
                        err.response?.data?.message || "Failed to save progress"
                    );
                }
            } finally {
                setSavingProgress(false);
            }
        },
        [
            attempt,
            currentSection,
            currentQuestion,
            activeSectionIndex,
            activeQuestionIndex,
        ]
    );

    // ===================
    // 8️⃣ Answer handlers (MCQ / text)
    // ===================
    const handleOptionClick = (optionIndex: number) => {
        if (!attempt || !currentSection || !currentQuestion) return;
        if (isCompleted) return;
        setAttempt((prev) => {
            if (!prev) return prev;
            const clone = structuredClone(prev) as TestAttempt;
            const s = clone.sections[activeSectionIndex];
            const q = s.questions[activeQuestionIndex];
            q.answerOptionIndexes = [optionIndex];
            q.isAnswered = true;
            return clone;
        });
    };

    const handleTextAnswerChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = e.target.value;
        if (!attempt || !currentSection || !currentQuestion) return;
        if (isCompleted) return;
        setAttempt((prev) => {
            if (!prev) return prev;
            const clone = structuredClone(prev) as TestAttempt;
            const s = clone.sections[activeSectionIndex];
            const q = s.questions[activeQuestionIndex];
            q.answerText = value;
            q.isAnswered = value.trim().length > 0;
            return clone;
        });
    };

    const toggleMarkForReview = () => {
        if (!attempt || !currentSection || !currentQuestion) return;
        if (isCompleted) return;
        setAttempt((prev) => {
            if (!prev) return prev;
            const clone = structuredClone(prev) as TestAttempt;
            const s = clone.sections[activeSectionIndex];
            const q = s.questions[activeQuestionIndex];
            q.markedForReview = !q.markedForReview;
            return clone;
        });
    };

    // ===================
    // 9️⃣ Navigation (questions)
    // ===================
    const goToQuestion = async (qIndex: number) => {
        if (!attempt || !currentSection) return;
        if (qIndex < 0 || qIndex >= currentSection.questions.length) return;

        await saveCurrentQuestionProgress({
            silent: true,
            phase: "in_section",
            metaSectionIndex: activeSectionIndex,
            metaQuestionIndex: qIndex,
        });

        setActiveQuestionIndex(qIndex);
        setCurrentScreen("question");
    };

    const goNextQuestion = async () => {
        if (!attempt || !currentSection || !currentQuestion) return;

        const isLastQuestionInSection =
            activeQuestionIndex >= currentSection.questions.length - 1;

        // If you want "answer required" enforcement, uncomment:
        if (!currentQuestion.isAnswered) {
            setShowAnswerRequiredModal(true);
            return;
        }

        // 1) Not last question → go to next
        if (!isLastQuestionInSection && !isInReviewMode) {
            await goToQuestion(activeQuestionIndex + 1);
            return;
        }

        // 2) If we are editing from review mode, we don't use Next at all
        if (isInReviewMode) {
            return;
        }

        // 3) Last question in this module
        const isLastSectionLocal =
            activeSectionIndex >= (attempt?.sections.length || 1) - 1;

        // Save last question progress + move phase to review
        await saveCurrentQuestionProgress({
            silent: true,
            phase: "review",
            metaSectionIndex: activeSectionIndex,
            metaQuestionIndex: activeQuestionIndex,
        });

        if (isLastSectionLocal) {
            toast.info(
                "You have reached the end of the last module. You can submit your GMAT test after final review."
            );
        }

        setCurrentScreen("review");
        setIsInReviewMode(false);
    };

    const isLastQuestionInCurrentSection =
        !!currentSection &&
        activeQuestionIndex >= currentSection.questions.length - 1;

    const isLastSection =
        !!attempt && activeSectionIndex >= attempt.sections.length - 1;

    // Only disabled when test completed or submitting
    const isNextDisabled = isCompleted || submitting;

    // ===================
    // 🔟 Submit GMAT attempt
    // ===================
    const submitTestAttempt = async (fromTimeUp: boolean = false) => {
        if (!attempt || isCompleted) return;
        if (!fromTimeUp) {
            const confirmed = window.confirm(
                "Are you sure you want to submit your GMAT test? You won’t be able to change your answers afterwards."
            );
            if (!confirmed) return;
        }
        try {
            setSubmitting(true);
            setTimerRunning(false);
            await saveCurrentQuestionProgress({
                silent: true,
                phase: "review",
                metaSectionIndex: activeSectionIndex,
                metaQuestionIndex: activeQuestionIndex,
            });

            const res = await api.post(`/mcu/attempts/${attempt._id}/submit`);

            console.log("submitTestAttempt response:", res.data);
            if (!res.data?.success) {
                throw new Error(res.data?.message || "Failed to submit GMAT test");
            }
            navigate(`/gmat/analysis/${res.data.data._id}`);

            toast.success("GMAT test submitted successfully");
        } catch (err: any) {
            console.error("submitTestAttempt error:", err);
            toast.error(
                err.response?.data?.message || "Failed to submit GMAT test"
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ===================
    // Review helpers
    // ===================
    const exitReview = async () => {
        if (!attempt || !currentSection) return;

        const isLast = activeSectionIndex >= attempt.sections.length - 1;

        if (isLast) {
            // Last section: submit test from review screen
            await submitTestAttempt(false);
            return;
        }

        // Non-last section → go to next section (with optional break)
        const nextSectionIndex = activeSectionIndex + 1;

        await saveCurrentQuestionProgress({
            silent: true,
            phase: "break",
            metaSectionIndex: nextSectionIndex,
            metaQuestionIndex: 0,
        });

        setActiveSectionIndex(nextSectionIndex);
        setActiveQuestionIndex(0);
        setEditsRemaining(3);

        setBreakSecondsLeft(600);
        setBreakStarted(false);
        setCurrentScreen("break");
        setIsInReviewMode(false);
    };

    const handleReviewQuestionClick = (questionIndex: number) => {
        if (editsRemaining <= 0) {
            toast.warning("You have used all your allowed edits for this section.");
            return;
        }
        setActiveQuestionIndex(questionIndex);
        setIsInReviewMode(true);
        setCurrentScreen("question");
    };

    const handleBackToReview = async () => {
        if (!attempt || !currentSection || !currentQuestion) return;

        // Save edited question, phase remains "review"
        await saveCurrentQuestionProgress({
            silent: true,
            phase: "review",
            metaSectionIndex: activeSectionIndex,
            metaQuestionIndex: currentQuestion.order - 1,
        });

        setEditsRemaining((prev) => Math.max(0, prev - 1));
        setIsInReviewMode(false);
        setCurrentScreen("review");
    };

    // ===================
    // Data Insights answer handling (stored as JSON in answerText)
    // ===================
    type DiAnswers = {
        multiSource?: Record<string, "yes" | "no">;
        tableAnalysis?: Record<string, "true" | "false">;
        twoPart?: Record<string, string>; // columnId -> optionId
        graphics?: Record<string, number>; // dropdownId -> selectedIndex
    };

    const computeDiIsAnswered = (answers: DiAnswers, subtype: string, question: any): boolean => {
        if (!answers) return false;

        console.log("Computing DI answered for subtype:", subtype, "answers:", answers);

        switch (subtype) {

            case "multi_source_reasoning": {
                const statements = question?.questionDoc?.dataInsights?.multiSource?.statements || []
                console.log("statements:", statements);
                if (!answers.multiSource) return false;
                return statements.every(st => {
                    const v = answers.multiSource?.[st.id];
                    return v == "yes" || v == "no";
                });
            }

            case "table_analysis": {
                const statements = question?.questionDoc?.dataInsights?.tableAnalysis?.statements || [];
                if (!answers.tableAnalysis) return false;
                return statements.every(st => {
                    const v = answers.tableAnalysis?.[st.id];
                    return v == "true" || v == "false";
                });
            }

            case "two_part_analysis": {
                const columns = question?.questionDoc?.dataInsights?.twoPart?.columns || [];
                if (!answers.twoPart) return false;
                return columns.every(col => {
                    const v = answers.twoPart?.[col.id];
                    return typeof v === "string" && v.length > 0;
                });
            }

            case "graphics_interpretation": {
                const dropdowns = question?.questionDoc?.dataInsights?.graphics?.dropdowns || [];
                if (!answers.graphics) return false;
                return dropdowns.every(dd => {
                    const v = answers.graphics?.[dd.id];
                    return typeof v === "number" && !Number.isNaN(v);
                });
            }

            default:
                return false;
        }
    };



    const getDiAnswers = (): DiAnswers => {
        if (!currentQuestion?.answerText) return {};
        try {
            return JSON.parse(currentQuestion.answerText) as DiAnswers;
        } catch {
            return {};
        }
    };

    const updateDiAnswers = (
        updater: (prev: DiAnswers) => DiAnswers
    ) => {
        if (!attempt || !currentSection || !currentQuestion) return;
        if (isCompleted) return;

        console.log(currentQuestion)

        const subtype = currentQuestion?.questionDoc?.dataInsights?.subtype;
        const prevAnswers = getDiAnswers();
        const nextAnswers = updater(prevAnswers);
        const answered = computeDiIsAnswered(nextAnswers, subtype, currentQuestion);
        setAttempt((prev) => {
            if (!prev) return prev;
            const clone = structuredClone(prev) as TestAttempt;
            const s = clone.sections[activeSectionIndex];
            const q = s.questions[activeQuestionIndex];
            q.answerText = JSON.stringify(nextAnswers);
            // crude: mark answered if any key exists
            q.isAnswered = answered;
            return clone;
        });
    };

    // ===================
    // Derived UI values
    // ===================
    const totalQuestionsForCurrentSection = currentSection
        ? currentSection.questions.length
        : 0;

    const currentSectionName = currentSection?.name || "GMAT Section";

    const getSectionTypeBadge = () => {
        const nameLower = currentSectionName.toLowerCase();
        if (nameLower.includes("quant")) return "Quantitative Reasoning";
        if (nameLower.includes("verbal")) return "Verbal Reasoning";
        if (nameLower.includes("data") || nameLower.includes("insight"))
            return "Data Insights";
        if (nameLower.includes("ir") || nameLower.includes("integrated"))
            return "Integrated Reasoning";
        return currentSectionName;
    };

    // ===================
    // Order selection countdown (2 minutes)
    // ===================
    // useEffect(() => {
    //     if (!isOrderSelectionTimerRunning || orderSelectionTimer <= 0) return;
    //     const interval = setInterval(() => {
    //         setOrderSelectionTimer((prev) => {
    //             const next = prev - 1;
    //             if (next <= 0) {
    //                 setIsOrderSelectionTimerRunning(false);
    //                 (async () => {
    //                     await handleConfirmSequence();
    //                 })();
    //             }
    //             return next;
    //         });
    //     }, 1000);
    //     return () => clearInterval(interval);
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [isOrderSelectionTimerRunning, orderSelectionTimer]);

    // ===================
    // Break timer – only when breakStarted
    // ===================
    // useEffect(() => {
    //     if (currentScreen !== "break") return;
    //     if (!breakStarted) return;
    //     if (breakSecondsLeft <= 0) return;

    //     const interval = setInterval(() => {
    //         setBreakSecondsLeft((prev) => {
    //             const next = prev - 1;
    //             if (next <= 0) {
    //                 setCurrentScreen("section_instructions");
    //                 setBreakStarted(false);
    //                 return 0;
    //             }
    //             return next;
    //         });
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, [currentScreen, breakStarted, breakSecondsLeft]);

    // ===================
    // 11️⃣ Confirm GMAT module sequence
    // ===================
    const handleConfirmSequence = async () => {
        if (!attempt) return;
        if (!moduleSections.length || moduleSections.length < 3) {
            setHasChosenSequence(true);
            setCurrentScreen("section_instructions");
            return;
        }

        const chosenIndex =
            selectedSequenceIndex !== null ? selectedSequenceIndex : 0;
        const chosen = moduleSequenceOptions[chosenIndex];
        if (!chosen) return;

        try {
            const res = await api.post(
                `/mcu/attempts/${attempt._id}/set-gmat-order`,
                {
                    moduleOrder: chosen.order,
                }
            );
            if (!res.data?.success) {
                throw new Error(res.data?.message || "Failed to set GMAT order");
            }
            setAttempt((prev) => {
                if (!prev) return prev;
                const clone = structuredClone(prev) as TestAttempt;

                // Only reorder the first 3 sections (moduleSections maps to first 3)
                // but preserve any additional sections after index 3 if present.
                const firstThree = chosen?.order.map((i) => prev.sections[i]);
                const rest = prev.sections.slice(3);
                clone.sections = [...firstThree, ...rest];

                // also store meta locally so resume / timers pick it up
                clone.gmatMeta = {
                    ...(clone.gmatMeta || {}),
                    orderChosen: true,
                    moduleOrder: chosen.order,
                    phase: "section_instructions",
                    currentSectionIndex: 0,
                    currentQuestionIndex: 0,
                };
                return clone;
            });
            console.log("handleConfirmSequence response:", res.data);
            setHasChosenSequence(true);
            setActiveSectionIndex(0);
            setActiveQuestionIndex(0);
            setCurrentScreen("section_instructions");
            setIsOrderSelectionTimerRunning(false);
        } catch (err: any) {
            console.error("handleConfirmSequence error:", err);
            toast.error(
                err.response?.data?.message || "Failed to set GMAT order"
            );
        }
    };

    useGmatTimers({
        // Section timer config
        sectionTimerSeconds: timerSecondsLeft,
        setSectionTimerSeconds: setTimerSecondsLeft,
        isSectionTimerActive: timerRunning,
        onSectionTimerTick: useCallback(() => {
            // This replaces the interval logic that was updating attempt state
            setAttempt(prev => {
                if (!prev) return prev;
                const clone = { ...prev };
                clone.totalTimeUsedSeconds = (clone.totalTimeUsedSeconds || 0) + 1;
                const sIdx = activeSectionIndex;
                const qIdx = activeQuestionIndex;
                if (clone.sections[sIdx] && clone.sections[sIdx].questions[qIdx]) {
                    clone.sections[sIdx].questions[qIdx].timeSpentSeconds += 1;
                }
                return clone;
            });
        }, [activeSectionIndex, activeQuestionIndex]),
        onSectionTimerComplete: useCallback(() => {
            // Handle section time up logic
            const isLastSectionLocal = activeSectionIndex >= (attempt?.sections.length || 1) - 1;
            if (isLastSectionLocal) {
                setTimerRunning(false);
                toast.info("Time is up for the last module. Submitting your GMAT test...");
                submitTestAttempt(true);
            } else {
                setTimerRunning(false);
                toast.info("Time is up for this module. Moving to the next module review.");
                setCurrentScreen("review");
            }
        }, [activeSectionIndex, attempt, submitTestAttempt]),

        // Order selection timer config
        orderSelectionTimer: orderSelectionTimer,
        setOrderSelectionTimer: setOrderSelectionTimer,
        isOrderSelectionTimerActive: isOrderSelectionTimerRunning,
        onOrderSelectionTimerComplete: useCallback(() => {
            setIsOrderSelectionTimerRunning(false);
            (async () => {
                await handleConfirmSequence();
            })();
        }, [handleConfirmSequence]),

        // Break timer config
        breakTimerSeconds: breakSecondsLeft,
        setBreakTimerSeconds: setBreakSecondsLeft,
        isBreakTimerActive: breakStarted,
        onBreakTimerComplete: useCallback(() => {
            setCurrentScreen("section_instructions");
            setBreakStarted(false);
        }, []),

        // Global config
        currentScreen,
        isCompleted
    });

    // ===================
    // Loading / error states
    // ===================
    if (loading || starting) {
        return <FullScreenLoader />;
    }

    if (error || !attempt) {
        return (
            <>
                <PageMeta
                    title="GMAT Test"
                    description="GMAT-style test attempt"
                />
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                        <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            <h2 className="font-semibold">Unable to load GMAT test</h2>
                        </div>
                        <p className="mb-3">
                            {error || "Something went wrong while loading your attempt."}
                        </p>
                        <Button onClick={() => navigate(-1)} variant="outline" size="sm">
                            Go Back
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    // =========================
    // Intro Screen content (center section only, header/footer fixed)
    // =========================
    const renderIntro = () => {
        const introPages = [
            {
                title: "Introduction",
                content: (
                    <>
                        <p className="mb-4">
                            The GMAT Official Practice Exams are a simulation of the real GMAT™ exam. While they do use the same scoring algorithm as the actual GMAT™ exam, there are some differences between the practice exams and the real exam which are detailed on the following screens.
                        </p>
                        <p className="mb-4">
                            We recommend that all test takers review the tutorial content provided within the practice exams at least one time within 3 days of your exam day so the information is fresh in your mind.
                        </p>
                        <p className="mb-4">
                            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
                        </p>
                        <p>
                            The GMAT™ exam is owned by the Graduate Management Admission Council (GMAC), including the copyrights for all GMAT questions in the test and prep materials.
                        </p>
                    </>
                ),
            },
            {
                title: "Differences between GMAT Official Practice Exams and the GMAT™ Exam",
                content: (
                    <>
                        <p className="mb-4">
                            Optional break screens are not timed in GMAT Official Practice Exams, but are timed in the actual GMAT™ exam. For more information about the length of optional breaks, refer to www.mba.com. During the actual GMAT™ exam, if you exceed the time allowed for an optional break, the extra time used will be deducted from the time available to complete the next section of the exam.
                        </p>
                        <p className="mb-4">
                            The <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⬇ Save for Later</span> button is available in the practice exams, but not available during the GMAT™ exam.
                        </p>
                        <p className="mb-4">
                            The <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⏸ Pause</span> button is available in the practice exams but is not available during the GMAT™ exam.
                        </p>
                        <p className="mb-4">
                            After completing a GMAT Official Practice Exam, you will see section scores for the Data Insights, Quantitative Reasoning, and Verbal Reasoning sections.
                        </p>
                        <p className="mb-4">
                            Keep in mind that the GMAT Official Practice Exams are meant to illustrate GMAT content and are not accurate predictors of performance on the GMAT™ exam.
                        </p>
                        <p className="mb-4 font-bold">Please note:</p>
                        <p className="mb-4">
                            If you are planning on taking the GMAT™ exam delivered online, there are additional steps you need to take to help ensure your computer meets the minimum requirements and to help ensure you have a smooth testing experience.
                        </p>
                        <p className="mb-4">
                            For more information, please visit Plan for Exam Day for the GMAT™ exam delivered online on mba.com.
                        </p>
                        <p className="mb-4">
                            The browser back button will not work during practice exams. Use the Save for Later option to navigate out of the exam.
                        </p>
                        <p>
                            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
                        </p>
                    </>
                ),
            },
            {
                title: "GMAT Exam Nondisclosure Agreement and General Terms of Use",
                content: (
                    <>
                        <p className="mb-4">
                            Before beginning the GMAT™ exam, you will be presented with Exam Check-In Confirmation, Candidate Name Confirmation, and Welcome Screens. You will be required to read and accept the GMAT™ exam Nondisclosure Agreement and General Terms of Use. If you do not agree with these terms, your exam will be canceled, and you will forfeit your entire test fee.
                        </p>
                        <p>
                            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
                        </p>
                    </>
                ),
            },
            {
                title: "Tutorial",
                content: (
                    <>
                        <p className="mb-4">
                            The following tutorial section will walk you through the navigation of screens and provide some helpful reminders. We recommend that all test takers review the tutorial content provided within the practice exams at least one time.
                        </p>
                        <p className="mb-4">
                            When you take the GMAT™ exam, you will have <strong>two minutes</strong> to review the information in this tutorial before beginning the exam. If you have a timed accommodation, your extra time is noted on the clock timer in the upper right-hand corner.
                        </p>
                        <p className="mb-4 font-bold">
                            In the GMAT Official Practice Exams, this tutorial is not timed, so you may want to spend extra time reviewing the tutorial screens.
                        </p>
                        <p>
                            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
                        </p>
                    </>
                ),
            },
            {
                title: "Screen Layout and Navigation",
                content: (
                    <>
                        <p className="mb-4">
                            For any timed section of the exam, you can see your time remaining for that section in the upper right corner by the <span className="inline-block bg-yellow-400 w-6 h-6 rounded flex items-center justify-center text-black font-bold">⏱</span> icon.
                        </p>
                        <p className="mb-4">
                            Just below the time remaining, you will see <span className="bg-gray-700 text-white px-1 py-0.5 rounded dark:bg-gray-600">2 of 7</span>. This indicates that you are viewing the second of 7 questions or screens.
                        </p>
                        <p className="mb-4">
                            You can minimize the time remaining and the question number reminders by clicking on them. To restore them, click on the <span className="inline-block bg-yellow-400 w-6 h-6 rounded flex items-center justify-center text-black font-bold">⏱</span> and <span className="inline-block bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-white font-bold">📄</span> icons. When you have five (5) minutes remaining, you will see an alert message notifying you of the time left in the section.
                        </p>
                        <p className="mb-4">
                            You can bookmark a question for review by clicking the <span className="inline-block bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-white font-bold">🔖</span> icon. When a question is bookmarked, the icon will be filled in: <span className="inline-block bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-white font-bold">📌</span>. Clicking the icon again will remove the bookmark.
                        </p>
                        <p className="mb-4">
                            On each screen, the navigation buttons and functions can be selected by:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                            <li>Clicking the appropriate button with the mouse</li>
                            <li>Using the Tab key to move through the options and pressing the space bar to select an option,</li>
                            <li>Using the shortcut keys (Alt + underlined shortcut letter)</li>
                        </ul>
                        <p className="mb-4">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">❓ Help</span> provides access to the information in this tutorial, as well as specific testing and section instructions.
                        </p>
                        <p className="mb-4">
                            The <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⏸ Pause</span> <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">⬇ Save for Later</span> buttons are available in the Data Insights, Quantitative, and Verbal section of the Practice Exams only, but are NOT available in the GMAT™ exam.
                        </p>
                        <p>
                            Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to continue.
                        </p>
                    </>
                ),
            },
        ];

        // Determine if this is the last page
        const isLastPage = introPage === 5;

        return (
            <div className="w-full flex flex-col">
                {/* Main Content Area */}
                <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
                    <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">{introPages[introPage - 1].title}</h1>
                    <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                        {introPages[introPage - 1].content}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Left Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => null}
                                    disabled={true}
                                >
                                    <Save className="h-4 w-4" />
                                    Save Progress
                                </Button>
                            </div>

                            {/* Right Navigation */}
                            <div className="flex items-center gap-3">

                                <div className="flex gap-2">
                                    {introPage > 1 && (
                                        <button
                                            className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            onClick={() => setIntroPage((p) => Math.max(1, p - 1))}
                                        >
                                            Previous
                                        </button>
                                    )}
                                    <button
                                        className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() => {
                                            if (isLastPage) {
                                                setCurrentScreen("select_order");
                                                setOrderSelectionTimer(120);
                                                setIsOrderSelectionTimerRunning(true);
                                            } else {
                                                setIntroPage((p) => Math.min(5, p + 1));
                                            }
                                        }}
                                    >
                                        {isLastPage ? "Continue to Section Order" : "Next →"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSelectOrder = () => (
        <div className="w-full flex flex-col">
            {/* Main Content Area */}
            <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
                <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Select Section Order</h1>

                <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                    <p className="font-bold">
                        Select the order in which the exam sections are to be administered.
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                        You have one (1) minute to make your selection in the GMAT exam. If you do not make your selection within one (1) minute, the first option listed will be selected, and you will take the exam in the following order: Quantitative Reasoning, Verbal Reasoning, Data Insights.
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                        Please note that in the GMAT Official Practice Exams, this screen is not timed.
                    </p>
                    <p>
                        Six different section order options are presented below. Once you select your section order, you must view ALL questions in each section, in the order you selected, before moving to the next section. You will NOT be able to return to this screen.
                    </p>

                    {/* Grid for 6 options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        {moduleSequenceOptions.map((seq, idx) => (
                            <div
                                key={seq.index}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <input
                                    type="radio"
                                    id={`sequence-${idx}`}
                                    name="sectionOrder"
                                    checked={selectedSequenceIndex === seq.index}
                                    onChange={() => setSelectedSequenceIndex(seq.index)}
                                    className=" h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
                                />
                                <label
                                    htmlFor={`sequence-${idx}`}
                                    className="space-y-1 text-slate-700 dark:text-slate-200 cursor-pointer flex-1"
                                >
                                    {seq.labels.map((item, labelIdx) => (
                                        <div
                                            key={labelIdx}
                                            className="text-sm font-medium text-slate-800 dark:text-slate-100"
                                        >
                                            {item.name}
                                        </div>
                                    ))}
                                </label>
                            </div>
                        ))}
                    </div>

                    <p className="mt-6">
                        Click the <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> button to start the exam. You will begin the GMAT™ exam on the next screen.
                    </p>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left Actions */}
                        <div className="flex flex-wrap items-center gap-3">

                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => null}
                                disabled={true}
                            >
                                <Save className="h-4 w-4" />
                                Save
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                size="sm"
                                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800"
                                onClick={handleConfirmSequence}
                            >
                                Start GMAT Test
                            </Button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );

    // =========================
    // Section Instructions Screen
    // =========================
    const renderSectionInstructions = () => {
        if (!currentSection) return null;

        // Get the section name for dynamic content
        const sectionName = getSectionTypeBadge();
        const sectionDuration = currentSection.durationMinutes || 45;
        const questionCount = currentSection.questions.length;

        // Define specific instructions based on the section type
        const getSectionInstructions = () => {
            switch (sectionName) {
                case "Quantitative Reasoning":
                    return (
                        <>
                            <p className="mb-4">
                                When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
                            </p>
                            <p className="mb-4">
                                You are about to start the Quantitative Reasoning section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
                            </p>
                            <p className="mb-4">
                                In this section, you will be presented with <strong>{questionCount} questions</strong>.
                            </p>
                            <p className="mb-4">
                                There are two types of questions in the Quantitative section: Problem Solving and Data Sufficiency.
                            </p>
                            <p className="mb-4">
                                For each question, select the best answer of the choices given.
                            </p>
                            <p className="mb-4">
                                At any point, you can read the directions by clicking on HELP.
                            </p>
                            <p className="mb-4">
                                Each of the <strong>Problem Solving</strong> questions is designed to measure your ability to reason quantitatively, solve quantitative problems, and interpret graphic data.
                            </p>
                            <p className="mb-4">
                                Each of the <strong>Data Sufficiency</strong> questions is designed to measure your ability to analyze a quantitative problem, recognize which data is relevant, and determine at what point there is enough data to solve the problem.
                            </p>
                            <p>
                                Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the Quantitative Reasoning section.
                            </p>
                        </>
                    );
                case "Verbal Reasoning":
                    return (
                        <>
                            <p className="mb-4">
                                When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
                            </p>
                            <p className="mb-4">
                                You are about to start the Verbal Reasoning section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
                            </p>
                            <p className="mb-4">
                                In this section, you will be presented with <strong>{questionCount} questions</strong>.
                            </p>
                            <p className="mb-4">
                                There are two types of questions in the Verbal section: Critical Reasoning and Reading Comprehension.
                            </p>
                            <p className="mb-4">
                                For each question, select the best answer of the choices given.
                            </p>
                            <p className="mb-4">
                                At any point, you can read the directions by clicking on HELP.
                            </p>
                            <p className="mb-4">
                                Each of the <strong>Critical Reasoning</strong> questions is based on a short argument, a set of statements, or a plan of action.
                            </p>
                            <p className="mb-4">
                                Each of the <strong>Reading Comprehension</strong> questions is based on the content of a passage. After reading the passage, answer all questions pertaining to it on the basis of what is <strong>stated</strong> or <strong>implied</strong> in the passage.
                            </p>
                            <p>
                                Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the Verbal Reasoning section.
                            </p>
                        </>
                    );
                case "Data Insights":
                    return (
                        <>
                            <p className="mb-4">
                                When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
                            </p>
                            <p className="mb-4">
                                You are about to start the Data Insights section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
                            </p>
                            <p className="mb-4">
                                In this section, you will be presented with <strong>{questionCount} questions</strong>.
                            </p>
                            <p className="mb-4">
                                There are five types of questions in the Data Insights section: Table Analysis, Graphics Interpretation, Multi-Source Reasoning, Two-Part Analysis, and Data Sufficiency.
                            </p>
                            <p className="mb-4">
                                For each question, select the best answer of the choices given.
                            </p>
                            <p className="mb-4">
                                At any point, you can read the directions by clicking on HELP.
                            </p>
                            <p className="mb-4">
                                <strong>Table Analysis</strong> questions require you to sort and analyze a table of data, similar to a spreadsheet, to determine whether certain conditions are met.
                            </p>
                            <p className="mb-4">
                                <strong>Graphics Interpretation</strong> questions require you to interpret a graph or graphical image.
                            </p>
                            <p className="mb-4">
                                <strong>Multi-Source Reasoning</strong> questions require you to examine data from multiple sources, such as tables, graphics, and text passages, to answer questions.
                            </p>
                            <p className="mb-4">
                                <strong>Two-Part Analysis</strong> questions involve two components that must be selected from a list of possible answers.
                            </p>
                            <p className="mb-4">
                                <strong>Data Sufficiency</strong> questions are designed to measure your ability to analyze a quantitative problem, recognize which data is relevant, and determine at what point there is enough data to solve the problem.
                            </p>
                            <p>
                                Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the Data Insights section.
                            </p>
                        </>
                    );
                default:
                    return (
                        <>
                            <p className="mb-4">
                                When you take the GMAT™ exam you will have a specific amount of time to review these instructions. In the GMAT Official Practice Exams, this instruction screen is not timed, so you may want to spend extra time reviewing it.
                            </p>
                            <p className="mb-4">
                                You are about to start the {sectionName} section of the exam. You will have <strong>{sectionDuration} minutes</strong> to complete this section, including reviewing and editing answers. If you have a timed accommodation, your extra time will be noted on the exam clock timer in the upper right-hand corner.
                            </p>
                            <p className="mb-4">
                                In this section, you will be presented with <strong>{questionCount} questions</strong>.
                            </p>
                            <p>
                                Click <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> to begin the {sectionName} section.
                            </p>
                        </>
                    );
            }
        };

        return (
            <div className="w-full flex flex-col">
                {/* Main Content Area */}
                <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
                    <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">{sectionName} Instructions</h1>

                    <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                        {getSectionInstructions()}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Left Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => null}
                                    disabled={true}
                                >
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                            </div>

                            {/* Right Navigation */}
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <button
                                        className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() => setCurrentScreen("question")}
                                    >
                                        Next →
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBreak = () => (
        <div className="w-full flex flex-col">
            {/* Main Content Area */}
            <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
                <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Optional 10-Minute Break</h1>

                <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                    <p className="font-bold">
                        You may now take a short break before beginning your next module.
                    </p>
                    <p>
                        In the official exam, you are allowed one 10-minute break. In this practice test, you can either use the full break or skip it and continue immediately.
                    </p>

                    <div className="text-center my-8">
                        <div className="text-4xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {breakStarted ? formatTime(breakSecondsLeft) : "10:00"}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Time remaining</p>
                    </div>

                    <p>
                        Click the <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> button when you are ready to continue to the next section.
                    </p>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                onClick={() => {
                                    // Skip break immediately
                                    setCurrentScreen("section_instructions");
                                }}
                            >
                                Skip Break
                            </Button>
                        </div>

                        {/* Right Navigation */}
                        <div className="flex items-center gap-3">
                            {!breakStarted ? (
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl hover:text-green-600 border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => setBreakStarted(true)}
                                >
                                    Start Break
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 hover:text-red-600 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => {
                                        setBreakStarted(false);
                                        setCurrentScreen("section_instructions");
                                    }}
                                >
                                    End Break Now
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReview = () => {
        if (!currentSection) return null;
        const sectionName = getSectionTypeBadge();

        return (
            <div className="w-full flex flex-col">
                {/* Main Content Area */}
                <div className={`w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
                    <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Review Center</h1>

                    <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
                        <p className="font-bold">
                            Review and Edit Answers for {sectionName} Section
                        </p>
                        <p>
                            You have <strong>{editsRemaining} edit(s)</strong> remaining in this section. Click on any question to review and edit your answer.
                        </p>
                        <p>
                            You can review any question and edit up to <strong>{editsRemaining} more answers</strong> in this section before moving to the next module. Use your edits wisely!
                        </p>

                        <p className="mt-4">
                            Click on any question below to review and edit your answer. When you are ready to proceed, click the <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold dark:bg-blue-700">Next →</span> button.
                        </p>


                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {currentSection.questions
                                .map((q) => {
                                    const isAnsweredLocal = q.isAnswered;
                                    const isBookmarked = q.markedForReview;
                                    

                                    return (
                                        <div
                                            key={q.order}
                                            onClick={() => {
                                                if (!sectionTimedOut) {

                                                    handleReviewQuestionClick(q.order - 1)
                                                }
                                            }}
                                            className={`group flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isBookmarked
                                                ? "border-purple-300 dark:border-purple-500 bg-purple-50 dark:bg-purple-500/20"
                                                : isAnsweredLocal
                                                    ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                                                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-400"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isBookmarked
                                                        ? "bg-purple-500 text-white"
                                                        : isAnsweredLocal
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                                                        }`}
                                                >
                                                    {q.order}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                                                        Question {q.order}
                                                    </div>
                                                    <div className="flex items-center gap-2 ">
                                                        {isAnsweredLocal && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Answered
                                                            </span>
                                                        )}
                                                        {isBookmarked && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                                <Flag className="h-3 w-3" />
                                                                Bookmarked
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                        </div>
                                    );
                                })}
                        </div>

                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Left Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={() => null}
                                    disabled={true}
                                >
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                            </div>

                            {/* Right Navigation */}
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    onClick={exitReview}
                                >
                                    {isLastSection ? "Submit GMAT Test" : "End Section Review"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // =========================
    // Question rendering – including GMAT RC & Data Insights
    // =========================
    const renderQuestionBody = () => {
        if (!qDoc || !currentQuestion) return null;

        const isMCQ =
            !!qDoc.options && qDoc.options.length > 0 &&
            qDoc.questionType !== "gmat_data_insights";

        const isRC = qDoc.questionType === "gmat_verbal_rc";
        const isEssayLike =
            qDoc.questionType === "essay" ||
            qDoc.questionType === "gre_analytical_writing";

        const isDataInsights = qDoc.questionType === "gmat_data_insights";

        // GMAT Verbal RC: split passage left, question right
        if (isRC) {
            const passage = qDoc.stimulus || ""
            const questionHtml = qDoc.questionText || "";

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Passage */}
                    <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2 text- leading-relaxed text-slate-700 dark:text-slate-300">
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg">
                            {passage}
                        </div>
                    </div>

                    {/* Right: Question + options */}
                    <div>
                        {questionHtml && (
                            <div className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                                <div
                                    className="text font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
                                    dangerouslySetInnerHTML={{ __html: questionHtml }}
                                />
                            </div>
                        )}

                        {isMCQ && (
                            <div className="space-y-2">
                                {qDoc.options!.map((opt, idx) => {
                                    const selected =
                                        currentQuestion.answerOptionIndexes.includes(
                                            idx
                                        );
                                    const label =
                                        opt.label ||
                                        String.fromCharCode("A".charCodeAt(0) + idx);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(idx)}
                                            disabled={isCompleted}
                                            className={`flex w-full items-start gap-4 rounded-2xl border-1 px-4 py-2 text-left transition-all duration-200 ${selected
                                                ? "border-indigo-200 bg-indigo-100 dark:bg-indigo-500/20"
                                                : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-400"
                                                } ${isCompleted
                                                    ? "cursor-not-allowed opacity-80"
                                                    : "cursor-pointer"
                                                }`}
                                        >
                                            <div
                                                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2  text-xs font-bold transition-all ${selected
                                                    ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                                    }`}
                                            >
                                                {label}
                                            </div>
                                            <div className="flex-1 text-base font-medium text-slate-700 dark:text-slate-200">
                                                {opt.text}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Data Insights: handle subtypes with simple controls
        if (isDataInsights && qDoc.dataInsights) {
            const di = qDoc.dataInsights;
            const answers = getDiAnswers();


            // Then in your main component, use it like:
            const renderMultiSource = () => {
                return (
                    <MultiSourceComponent
                        di={di}
                        answers={answers}
                        isCompleted={isCompleted}
                        updateDiAnswers={updateDiAnswers}
                    />
                );
            };

            const renderTableAnalysis = () => {
                return (
                    <TableAnalysisSection
                        qDoc={qDoc}
                        di={di}
                        answers={answers}
                        isCompleted={isCompleted}
                        updateDiAnswers={updateDiAnswers}
                    />
                );
            };

            const renderTwoPart = () => {
                const columns = di.twoPart?.columns || [];
                const options = di.twoPart?.options || [];

                return (
                    <div className="space-y-4">

                        {qDoc.questionText && (
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-base text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
                        )}

                        <div className="overflow-x-auto">
                            <table className=" border-collapse border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800">
                                        {columns.map((col: any) => (
                                            <th
                                                key={col.id}
                                                className="py-2 px-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                                            >
                                                {col.title}
                                            </th>
                                        ))}
                                        <th className="py-2 px-3 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 last:border-r-0">

                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {options.map((option: any, optionIndex: number) => (
                                        <tr
                                            key={option.id}
                                            className={`border-t border-slate-200 dark:border-slate-700 ${optionIndex % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                                        >
                                            {columns.map((col: any, colIndex: number) => {
                                                const currentAnswer =
                                                    answers.twoPart?.[col.id] || "";
                                                const isSelected =
                                                    currentAnswer === option.id;

                                                return (
                                                    <td
                                                        key={`${col.id}-${option.id}`}
                                                        className="py-2 px-3 text-sm border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                id={`twoPart-${col.id}-${option.id}`}
                                                                name={`twoPart-${col.id}`}
                                                                value={option.id}
                                                                checked={isSelected}
                                                                disabled={isCompleted}
                                                                onChange={(e) =>
                                                                    updateDiAnswers((prev) => ({
                                                                        ...prev,
                                                                        twoPart: {
                                                                            ...(prev.twoPart || {}),
                                                                            [col.id]: e.target.value,
                                                                        },
                                                                    }))
                                                                }
                                                                className="h-4 w-4 text-blue-600 border-slate-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
                                                            />

                                                        </div>
                                                    </td>
                                                );

                                            })}
                                            <td className="py-2 px-3 text-sm border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                                                {option.label}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            };

            const renderGraphics = () => {
                const prompt = di.graphics?.prompt;
                const dropdowns = di.graphics?.dropdowns || [];

                const processPrompt = (text: string) => {
                    const parts = text.split(/(\{\{\d+\}\})/);
                    return parts.map((part, index) => {
                        if (part.match(/\{\{\d+\}\}/)) {
                            const dropdownNumber = parseInt(part.match(/\d+/)?.[0] || '0');
                            const dd = dropdowns.find(d => d.id === `dropdown_${dropdownNumber}`) ||
                                dropdowns[dropdownNumber - 1]; // Fallback to index-based if id doesn't match

                            if (dd) {
                                const currentIndex = answers.graphics?.[dd.id] ?? -1;

                                return (
                                    <select
                                        key={`dropdown-${dropdownNumber}-${index}`}
                                        className="mx-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-800 dark:text-slate-100 font-medium"
                                        disabled={isCompleted}
                                        value={currentIndex >= 0 ? currentIndex : ""}
                                        onChange={(e) =>
                                            updateDiAnswers((prev) => ({
                                                ...prev,
                                                graphics: {
                                                    ...(prev.graphics || {}),
                                                    [dd.id]: Number(e.target.value),
                                                },
                                            }))
                                        }
                                    >
                                        <option value="">Select</option>
                                        {dd.options.map((opt: string, idx: number) => (
                                            <option key={idx} value={idx}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                );
                            } else {
                                return part; // Return the placeholder if no dropdown found
                            }
                        }
                        return part;
                    });
                };

                return (
                    <div className="space-y-2">
                        {qDoc.questionText && (
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-base text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
                        )}

                        {prompt && (
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 text-base text-slate-700 dark:text-slate-300">
                                {processPrompt(prompt)}
                            </div>
                        )}
                    </div>
                );
            };

            return (
                <div className="space-y-3 mt-2">
                    {di.subtype === "multi_source_reasoning" && renderMultiSource()}
                    {di.subtype === "table_analysis" && renderTableAnalysis()}
                    {di.subtype === "two_part_analysis" && renderTwoPart()}
                    {di.subtype === "graphics_interpretation" && renderGraphics()}
                </div>
            );
        }

        // Default GMAT / GRE / SAT MCQ
        if (isMCQ) {
            return (
                <>
                    {qDoc.stimulus && (
                        <div className="mb-2 max-h-60 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                {qDoc.stimulus}
                            </div>
                        </div>
                    )}

                    <div className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                        <div
                            className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
                            dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
                        />
                    </div>

                    <div className="space-y-1 ml-1">
                        <div className="space-y-2">
                            {qDoc.options!.map((opt, idx) => {
                                const selected =
                                    currentQuestion.answerOptionIndexes.includes(idx);
                                const label =
                                    opt.label ||
                                    String.fromCharCode("A".charCodeAt(0) + idx);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionClick(idx)}
                                        disabled={isCompleted}
                                        className={`flex w-full items-start gap-4 rounded-2xl border-1 px-4 py-2 text-left transition-all duration-200 ${selected
                                            ? "border-indigo-200 bg-indigo-100 dark:bg-indigo-500/20"
                                            : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-400"
                                            } ${isCompleted
                                                ? "cursor-not-allowed opacity-80"
                                                : "cursor-pointer"
                                            }`}
                                    >
                                        <div
                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full  border-2 text-xs font-bold transition-all ${selected
                                                ? "border-indigo-500 bg-indigo-500 text-white shadow-sm"
                                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                                }`}
                                        >
                                            {label}
                                        </div>
                                        <div className="flex-1 text-base font-medium text-slate-700 dark:text-slate-200">
                                            {opt.text}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            );
        }

        // Essay / numeric / others – text input or textarea
        return (
            <>
                {qDoc.stimulus && (
                    <div className="mb-3 max-h-60 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            {qDoc.stimulus}
                        </div>
                    </div>
                )}

                <div className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                    <div
                        className="text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-100"
                        dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Your Answer
                    </label>
                    {isEssayLike ? (
                        <textarea
                            className="w-full min-h-[160px] rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                            value={currentQuestion.answerText || ""}
                            onChange={handleTextAnswerChange}
                            disabled={isCompleted}
                            placeholder="Type your response here..."
                        />
                    ) : (
                        <input
                            type="text"
                            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base text-slate-900 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                            value={currentQuestion.answerText || ""}
                            onChange={handleTextAnswerChange}
                            disabled={isCompleted}
                            placeholder="Type your answer here..."
                        />
                    )}
                </div>
            </>
        );
    };

    // =========================
    // Main layout: fixed header + footer; center scrollable
    // =========================

    const showQuestionTopMeta =
        currentScreen === "question" && currentSection && currentQuestion;

    const showTimerOnHeader =
        currentScreen === "question"
            ? formatTime(timerSecondsLeft)
            : currentScreen === "break"
                ? (breakStarted ? formatTime(breakSecondsLeft) : "10:00")
                : undefined;

    return (
        <>
            {showAnswerRequiredModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-[1px] p-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center shadow-2xl shadow-black/10 dark:shadow-black/40 w-full max-w-md mx-auto">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/20 border-2 border-yellow-200 dark:border-yellow-500/30">
                                <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                                Answer Required
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                                Please select an answer before proceeding to the next question.
                                This ensures your progress is properly recorded.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 py-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
                                onClick={() => setShowAnswerRequiredModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg"
                                onClick={() => setShowAnswerRequiredModal(false)}
                            >
                                Understand
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
                {/* Fixed Top bar (shared) */}
                <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
                                    {attempt.exam?.name || "GMAT EXAM"}
                                </p>
                                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {testTitle}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {showQuestionTopMeta && (
                                <div className="hidden flex-col text-sm text-slate-700 dark:text-slate-200 sm:flex">
                                    <span>
                                        Question {currentQuestion!.order} of{" "}
                                        {totalQuestionsForCurrentSection}
                                    </span>
                                </div>
                            )}

                            {showTimerOnHeader && (
                                <div className="flex items-center gap-3 px-4 py-2">
                                    <Clock className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                                    <div className="flex flex-row">
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                                            {showTimerOnHeader}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden items-center gap-2 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:flex"
                                onClick={() => navigate(-1)}
                            >
                                <LogOut className="h-4 w-4" />
                                Exit
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Scrollable main area (between header & footer) */}
                <div className="pt-14 pb-16">
                    {currentScreen === "introduction" && renderIntro()}
                    {currentScreen === "select_order" && renderSelectOrder()}

                    {/* Only enforce section+question on question screen */}
                    {currentScreen === "question" &&
                        (!currentSection || !currentQuestion) && (
                            <div className="flex min-h-[60vh] items-center justify-center">
                                <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                                    <div className="mb-2 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        <h2 className="font-semibold">Unable to load questions</h2>
                                    </div>
                                    <p className="mb-3">
                                        Test loaded, but no questions found for the current module.
                                    </p>
                                    <Button
                                        onClick={() => navigate(-1)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Go Back
                                    </Button>
                                </div>
                            </div>
                        )}

                    {currentScreen === "section_instructions" &&
                        currentSection &&
                        renderSectionInstructions()}

                    {currentScreen === "break" && renderBreak()}

                    {currentScreen === "review" && renderReview()}

                    {currentScreen === "question" &&
                        currentSection &&
                        currentQuestion && (
                            <div className="mx-auto max-w-7xl px-2 pb-4">
                                <div className="bg-white dark:bg-slate-900/80 py-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 dark:bg-black/30 px-1 pb-2 text-sm ">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="rounded-full bg-indigo-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                                {getSectionTypeBadge()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">
                                                <Clock className="inline-block h-4 w-4 mr-1.5 text-emerald-500 dark:text-emerald-400" />
                                                {formatTime(currentQuestion.timeSpentSeconds)}
                                            </span>
                                            {currentQuestion.markedForReview && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                                                    <Flag className="h-3.5 w-3.5" />
                                                    Marked for Review
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question body */}
                                    {renderQuestionBody()}
                                </div>
                            </div>
                        )}
                </div>

                {/* Fixed Bottom Navigation (question only) */}
                {currentScreen === "question" && currentQuestion && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                        <div className="mx-auto max-w-7xl px-4 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                {/* Left Actions */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-semibold ${currentQuestion.markedForReview
                                            ? "border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20"
                                            : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                        onClick={toggleMarkForReview}
                                        disabled={isCompleted}
                                    >
                                        <Flag className="h-4 w-4" />
                                        {currentQuestion.markedForReview
                                            ? "Unmark Review"
                                            : "Mark for Review"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        onClick={() =>
                                            saveCurrentQuestionProgress({
                                                silent: false,
                                                phase: "in_section",
                                            })
                                        }
                                        disabled={savingProgress || isCompleted}
                                        isLoading={savingProgress}
                                    >
                                        <Save className="h-4 w-4" />
                                        Save Progress
                                    </Button>
                                </div>

                                {/* Right Navigation */}
                                <div className="flex items-center gap-3">
                                    {isInReviewMode ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            onClick={handleBackToReview}
                                        >
                                            Back to Review
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            onClick={goNextQuestion}
                                            disabled={isNextDisabled}
                                        >
                                            Next
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
