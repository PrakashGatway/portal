import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useParams, useNavigate } from "react-router";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Flag,
    LogOut,
    Save,
    ChevronRight,
    FileStack,
    BookMarked,
    BookmarkIcon,
    Bookmark,
    BookmarkCheckIcon,
    HelpCircle,
    Pause,
    DownloadIcon,
    ForwardIcon,
    StepForward,
    SkipForward,
    NotebookPenIcon,
    CalculatorIcon,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import FullScreenLoader from "../../components/fullScreeLoader";
import { useGmatTimers } from "./SectionTimer";
import QuestionBody, { IntroScreen, SectionInstructionsScreen, SelectOrderScreen } from "./QuestionComponent";
import GmatHelpModal, { GmatCalculatorModal, GmatWhiteboardModal } from "./GmatHelp";
import { get } from "react-hook-form";

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
    const [hasChosenSequence, setHasChosenSequence] = useState(false);
    const [selectedSequenceIndex, setSelectedSequenceIndex] =
        useState<number | null>(null);
    const [orderSelectionTimer, setOrderSelectionTimer] =
        useState<number>(120);
    const [isOrderSelectionTimerRunning, setIsOrderSelectionTimerRunning] =
        useState(false);
    const [currentScreen, setCurrentScreen] = useState<GmatScreen>(
        "introduction"
    );
    const [showHelp, setShowHelp] = useState(false);

    const [introPage, setIntroPage] = useState(1);

    const [showAnswerRequiredModal, setShowAnswerRequiredModal] =
        useState(false);

    const [isInReviewMode, setIsInReviewMode] = useState(false);
    const [editsRemaining, setEditsRemaining] = useState(3);

    const [breakSecondsLeft, setBreakSecondsLeft] = useState(600);
    const [breakStarted, setBreakStarted] = useState(false);
    const [openBoard, setOpenBoard] = useState(false);

    const [openCalc, setOpenCalc] = useState(false);

    const isCompleted = attempt?.status === "completed";

    const PAUSE_LIMIT_SECONDS = 20 * 60;

    const [pauseSecondsLeft, setPauseSecondsLeft] = useState(PAUSE_LIMIT_SECONDS);
    const [pauseActive, setPauseActive] = useState(false);

    useEffect(() => {
        if (!attempt || !hasChosenSequence || isCompleted) return;
        if (sectionTimedOut) return;

        if (currentScreen !== "question") return;

        if (timerSecondsLeft !== 0) return;

        const isLastSection =
            activeSectionIndex >= attempt.sections.length - 1;

        setTimerRunning(false);
        setSectionTimedOut(true);

        if (isLastSection) {
            toast.info("Time is up. Submitting your GMAT test...");
            submitTestAttempt(true);
        } else {
            toast.info("Time is up. Moving to the next section.");
            setActiveSectionIndex(prev => prev + 1);
            setActiveQuestionIndex(0);
            setCurrentScreen("section_instructions");
        }
    }, [
        timerSecondsLeft,
        attempt,
        activeSectionIndex,
        hasChosenSequence,
        isCompleted,
        sectionTimedOut, // ✅ IMPORTANT
    ]);



    const testTitle =
        attempt?.testTemplate.title ||
        (attempt as any)?.testTemplate?.name ||
        "GMAT Practice Test";

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

                const startRes = await api.post("/mcu/start", { testTemplateId });
                if (!startRes.data?.success) {
                    throw new Error(startRes.data?.message || "Failed to start attempt");
                }

                const started: StartAttemptResponse = startRes.data.data;
                const attemptId = (started as any)._id || startRes.data.data._id;

                const detailRes = await api.get(`/mcu/attempts/${attemptId}`);
                if (!detailRes.data?.success) {
                    throw new Error(detailRes.data?.message || "Failed to load attempt");
                }

                const loaded: TestAttempt = detailRes.data.data;
                const testType = loaded?.testType;

                if (!loaded.sections || loaded.sections.length === 0) {
                    setError("This GMAT test has no sections configured.");
                    setLoading(false);
                    return;
                }

                setAttempt(loaded);

                const meta = loaded.gmatMeta;

                if (meta) {
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
                    if (testType !== "full_length") {
                        setCurrentScreen("question");
                        screen = "question";
                    } else {
                        setCurrentScreen(screen);
                    }

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
                    if (screen === "select_order" && !meta.orderChosen) {
                        setOrderSelectionTimer(60);
                        setIsOrderSelectionTimerRunning(true);
                    }
                    if (screen === "break" && meta.breakExpiresAt) {
                        const diffMs =
                            new Date(meta.breakExpiresAt).getTime() - Date.now();
                        const remaining = Math.max(0, Math.floor(diffMs / 1000));
                        setBreakSecondsLeft(remaining || 600);
                    }
                } else {
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
    const isNextDisabled = isCompleted || submitting;

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
            navigate(`/gmat/analysis/${res.data.data._id}`, { replace: true });

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

        const nextSectionIndex = activeSectionIndex + 1;
        const isLastSection = nextSectionIndex >= attempt.sections.length;

        if (isLastSection) {
            await submitTestAttempt(false);
            return;
        }

        await saveCurrentQuestionProgress({
            silent: true,
            phase: "section_instructions",
            metaSectionIndex: nextSectionIndex,
            metaQuestionIndex: 0,
        });

        setActiveSectionIndex(nextSectionIndex);
        setActiveQuestionIndex(0);
        setEditsRemaining(3);
        setIsInReviewMode(false);

        if (activeSectionIndex === 1) {
            setBreakSecondsLeft(600);
            setBreakStarted(false);
            setCurrentScreen("break");
        } else {
            setCurrentScreen("section_instructions");
        }
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

    type DiAnswers = {
        multiSource?: Record<string, "yes" | "no">;
        tableAnalysis?: Record<string, "true" | "false">;
        twoPart?: Record<string, string>;
        graphics?: Record<string, number>;
    };

    const computeDiIsAnswered = (answers: DiAnswers, subtype: string, question: any): boolean => {
        if (!answers) return false;


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
            const isLastSection =
                activeSectionIndex >= (attempt?.sections.length || 1) - 1;

            setTimerRunning(false);
            setSectionTimedOut(true);

            if (isLastSection) {
                toast.info("Time is up. Submitting your GMAT test...");
                submitTestAttempt(true);
            } else {
                toast.info("Time is up. Moving to the next section.");
                setActiveSectionIndex(prev => prev + 1);
                setActiveQuestionIndex(0);
                setCurrentScreen("section_instructions");
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


    useEffect(() => {
        if (!pauseActive) return;

        const interval = setInterval(() => {
            setPauseSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleResumeExam(true); // auto resume
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [pauseActive]);


    const handlePauseExam = async () => {
        if (!attempt || isCompleted) return;

        // stop section timer
        setTimerRunning(false);

        await saveCurrentQuestionProgress({
            silent: true,
            phase: "in_section",
        });

        setPauseSecondsLeft(PAUSE_LIMIT_SECONDS);
        setPauseActive(true);
        setCurrentScreen("pause");
    };

    const handleResumeExam = async (auto = false) => {
        setPauseActive(false);

        // resume section timer
        setTimerRunning(true);

        setCurrentScreen("question");

        if (auto) {
            toast.info("Pause limit reached. Exam resumed automatically.");
        }
    };


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

    const renderBreak = () => (
        <div className="w-full flex flex-col mt-6">
            {/* Main Content Area */}
            <div className={`w-full max-w-8xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
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

            <div className="fixed bottom-0 left-0 right-0 z-50  px-4 border-slate-200 dark:border-slate-700 bg-[#0a8cbd] dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                <div className="mx-auto max-w-8xl px-4 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant=""
                                size="sm"
                                className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
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
                                    variant=""
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                    onClick={() => setBreakStarted(true)}
                                >
                                    Start Break
                                </Button>
                            ) : (
                                <Button
                                    variant=""
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                    onClick={() => {
                                        setBreakStarted(false);
                                        setCurrentScreen("section_instructions");
                                    }}
                                >
                                    Next →
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
            <div className="w-full flex flex-col mt-6">
                {/* Main Content Area */}
                <div className={`w-full max-w-8xl mx-auto bg-white dark:bg-slate-900 p-6 border-t-4 border-blue-600 dark:border-blue-500 flex-grow`}>
                    <h1 className="text-xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Review Answers</h1>

                    <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-2">
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


                        <div className="grid grid-cols-2 md:grid-cols-5 mt-4 max-w-4xl mx-auto gap-2">
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
                                            className={`group flex items-center justify-between p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isBookmarked
                                                ? "border-purple-300 dark:border-purple-500 bg-purple-50 dark:bg-purple-500/20"
                                                : isAnsweredLocal
                                                    ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                                                    : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-400"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isBookmarked
                                                        ? "bg-purple-500 text-white"
                                                        : isAnsweredLocal
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                                                        }`}
                                                >
                                                    {q.order}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 ">
                                                        {isAnsweredLocal && (
                                                            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Answered
                                                            </span>
                                                        )}
                                                        {isBookmarked && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                                <Flag className="h-3 w-3" />
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

                <div className="fixed bottom-0 left-0 right-0 z-50  px-4 border-slate-200 dark:border-slate-700 bg-[#0a8cbd] dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto max-w-8xl px-4 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Left Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant=""
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
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
                                    variant=""
                                    size="sm"
                                    className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                    onClick={exitReview}
                                >
                                    {isLastSection ? "Submit Text" : "Next"}

                                    {isLastSection ? <Save className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}

                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderPauseScreen = () => (
        <div className="h-[calc(60vh-56px)] flex flex-col bg-white dark:bg-slate-900 mt-18">

            {/* Content */}
            <div className="flex-1 flex items-center justify-center text-center px-6">
                <div className="max-w-4xl">
                    <p className="text-lg mb-6">
                        You have paused your practice exam. Click the{" "}
                        <strong>Resume Exam</strong> button below to continue.
                    </p>

                    <p className="text-base text-slate-600 mb-8">
                        Please note: the pause button is intended for short pauses or breaks.
                        If you expect to be away for more than 20 minutes, we suggest you save
                        your exam for later. Otherwise, your exam will automatically resume.
                    </p>

                    <div className="text-2xl font-mono font-bold text-red-600 mb-8">
                        Pause time remaining: {formatTime(pauseSecondsLeft)}
                    </div>
                </div>
            </div>
        </div>
    );


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
            <GmatHelpModal
                open={showHelp}
                onClose={() => setShowHelp(false)}
            />

            <GmatWhiteboardModal
                open={openBoard}
                onClose={() => setOpenBoard(false)}
            />

            <GmatCalculatorModal
                open={openCalc}
                onClose={() => setOpenCalc(false)}
            />

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
                <div className="fixed top-0 left-0 mb-0 right-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-[#3c3737] dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                    <div className="mx-auto flex max-w-8xl items-center justify-between gap-4 px-4 py-2">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="py-2 text-base uppercase text-white dark:text-slate-400 font-semibold">
                                    {testTitle || "GMAT EXAM"}
                                </p>
                                {/* {currentScreen !== "introduction" && <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {testTitle}
                                </h1>} */}
                            </div>
                        </div>

                        <div className="flex flex-col items-end ">
                            {showTimerOnHeader && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#FFD400]" />
                                    <span className="text-[#FFD400] font-semibold">
                                        Time Remaining:
                                    </span>
                                    <span className="font-mono font-bold text-[#FFD400] tracking-wider">
                                        {showTimerOnHeader}
                                    </span>
                                </div>
                            )}
                            {showQuestionTopMeta && (
                                <div className="hidden flex text-sm text-slate-700 dark:text-slate-200 sm:flex gap-4">
                                    <button onClick={toggleMarkForReview}>
                                        {currentQuestion?.markedForReview ? <BookmarkCheckIcon className="text-[#FFD400] h-5 w-5" /> : <BookmarkIcon className="text-[#E0E0E0] h-5 w-5" />}
                                    </button>

                                    <div className="flex gap-2 text-[#E0E0E0] font-medium">
                                        <FileStack className="h-5 w-5" />
                                        {currentQuestion!.order} of {totalQuestionsForCurrentSection}
                                    </div>
                                </div>
                            )}

                            {/* {currentScreen !== "introduction" && <Button
                                variant="outline"
                                size="sm"
                                className="hidden items-center gap-2 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-1 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 sm:flex"
                                onClick={() => navigate(-1)}
                            >
                                <LogOut className="h-4 w-4" />
                                Exit
                            </Button>} */}
                        </div>
                    </div>
                    <div className="h-8 mt-0 bg-[#0a8cbd] flex gap-3 items-center justify-start">
                        {currentScreen == "question" && <span className="px-4 text-base font-semibold  capitalize tracking-wider text-white dark:text-indigo-300">
                            {getSectionTypeBadge()}
                        </span>}
                        {currentScreen == "question" && <button onClick={() => setOpenBoard(true)}>
                            <NotebookPenIcon className="h-6 w-6 text-white" />
                        </button>}
                        {currentScreen == "question" && getSectionTypeBadge() == "Data Insights" && <button onClick={() => setOpenCalc(true)}>
                            <CalculatorIcon className="h-6 w-6 text-white" />
                        </button>}

                    </div>
                </div>



                {/* Scrollable main area (between header & footer) */}
                <div className="pt-14 pb-16">
                    {
                        currentScreen === "introduction" && (
                            <IntroScreen
                                introPage={introPage}
                                setIntroPage={setIntroPage}
                                onContinue={() => {
                                    setCurrentScreen("select_order");
                                    setOrderSelectionTimer(120);
                                    setIsOrderSelectionTimerRunning(true);
                                }}
                            />
                        )
                    }
                    {
                        currentScreen === "select_order" && (
                            <SelectOrderScreen
                                moduleSequenceOptions={moduleSequenceOptions}
                                selectedSequenceIndex={selectedSequenceIndex}
                                setSelectedSequenceIndex={setSelectedSequenceIndex}
                                onStartTest={handleConfirmSequence}
                            />
                        )
                    }


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

                    {currentScreen == "pause" && renderPauseScreen()}

                    {
                        currentScreen === "section_instructions" &&
                        currentSection && (
                            <SectionInstructionsScreen
                                sectionName={getSectionTypeBadge()}
                                sectionDuration={currentSection.durationMinutes || 45}
                                questionCount={currentSection.questions.length}
                                onNext={() => setCurrentScreen("question")}
                            />
                        )
                    }

                    {currentScreen === "break" && renderBreak()}

                    {currentScreen === "review" && renderReview()}

                    {currentScreen === "question" &&
                        currentSection &&
                        currentQuestion && (
                            <div className="mx-auto max-w-8xl px-4 pb-4 mt-10">
                                <div className="bg-white dark:bg-slate-900/80 py-4">
                                    {/* <div className="flex flex-wrap items-center justify-between gap-2 dark:bg-black/30 px-1 pb-2 text-sm ">
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
                                    </div> */}
                                    <QuestionBody
                                        qDoc={qDoc}
                                        currentQuestion={currentQuestion}
                                        isCompleted={isCompleted}
                                        onOptionClick={handleOptionClick}
                                        onTextAnswerChange={handleTextAnswerChange}
                                        getDiAnswers={getDiAnswers}
                                        updateDiAnswers={updateDiAnswers}
                                    />
                                </div>
                            </div>
                        )}
                </div>

                {/* Fixed Bottom Navigation (question only) */}
                {(currentScreen === "question" || currentScreen == "pause") && currentQuestion && (
                    <div className="fixed bottom-0 left-0 right-0 z-50  px-4 border-slate-200 dark:border-slate-700 bg-[#0a8cbd] dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
                        <div className="mx-auto max-w-8xl px-4 py-2">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                {/* Left Actions */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        variant=""
                                        size="sm"
                                        className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800" onClick={() => setShowHelp(true)}
                                    >

                                        <HelpCircle className="h-4 w-4" />
                                        Help
                                    </Button>
                                    <Button
                                        variant=""
                                        size="sm"
                                        onClick={handlePauseExam}
                                        disabled={savingProgress || isCompleted || currentScreen == "pause"}
                                        className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                    >

                                        <Pause className="h-4 w-4" />
                                        Pause
                                    </Button>

                                    <Button
                                        variant=""
                                        size="sm"
                                        onClick={() =>
                                            saveCurrentQuestionProgress({
                                                silent: false,
                                                phase: "in_section",
                                            })
                                        }
                                        disabled={savingProgress || isCompleted}
                                        isLoading={savingProgress}
                                        className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                    >
                                        <DownloadIcon className="h-4 w-4" />
                                        Save for Later
                                    </Button>

                                    {currentScreen == "pause" && <Button
                                        variant=""
                                        size="sm"
                                        onClick={() => handleResumeExam(false)}
                                        className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                    >

                                        <ForwardIcon className="h-4 w-4" />
                                        Resume Exam
                                    </Button>}
                                    {/* <Button
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
                                    </Button> */}

                                </div>

                                {/* Right Navigation */}
                                <div className="flex items-center gap-3">
                                    {isInReviewMode ? (
                                        <Button
                                            variant=""
                                            size="sm"
                                            className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 text-base font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                            onClick={handleBackToReview}
                                        >
                                            Back to Review
                                        </Button>
                                    ) : (
                                        <Button
                                            variant=""
                                            size="sm"
                                            className="flex items-center gap-2 rounded-xl dark:border-slate-600 px-4 py-2 text-base font-semibold text-white dark:text-slate-200 hover:outline dark:hover:bg-slate-800"
                                            onClick={goNextQuestion}
                                            disabled={isNextDisabled || currentScreen == "pause"}
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
