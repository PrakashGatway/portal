import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  LogOut,
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";

/* ---------- Types ---------- */

interface QuestionDoc {
  _id: string;
  questionText: string;
  questionType: string; // gre_analytical_writing / gre_verbal_* / gre_quantitative
  difficulty?: string;
  stimulus?: string;
  options?: {
    label?: string;
    text: string;
  }[];
  marks?: number;
  negativeMarks?: number;
}

interface AttemptQuestion {
  question: string; // ObjectId
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
}

interface OverallStats {
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  rawScore: number;
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
  totalDurationMinutes?: number; // still available for whole test if you want
  totalTimeUsedSeconds: number;
  startedAt?: string;
  completedAt?: string;
  sections: AttemptSection[];
  overallStats?: OverallStats;
}

interface StartAttemptResponse {
  _id: string;
}

/* ---------- Helpers ---------- */

const formatTime = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
};

// small helper to detect section type by name (optional)
const getGreSectionType = (sec: AttemptSection, index: number) => {
  const n = (sec.name || "").toLowerCase();
  if (n.includes("writing")) return "Analytical Writing";
  if (n.includes("verbal")) return "Verbal Reasoning";
  if (n.includes("quant")) return "Quantitative Reasoning";

  // fallback by index: 0–1 writing, 2–3 verbal, 4–5 quant
  if (index <= 1) return "Analytical Writing";
  if (index <= 3) return "Verbal Reasoning";
  return "Quantitative Reasoning";
};

/* ---------- Component ---------- */

export default function GreTestAttemptPage() {
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

  // GRE-style: per-section timer
  const [sectionSecondsLeft, setSectionSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const isCompleted = attempt?.status === "completed";

  /* ---------- 1. Start / resume GRE attempt ---------- */

  const startAttempt = useCallback(async () => {
    if (!testTemplateId) {
      setError("Missing testTemplateId in route");
      setLoading(false);
      return;
    }

    try {
      setStarting(true);
      setError(null);

      // 1) Start or resume attempt (generic MCU start)
      const startRes = await api.post("/mcu/start", {
        testTemplateId,
      });

      if (!startRes.data?.success) {
        throw new Error(startRes.data?.message || "Failed to start GRE attempt");
      }

      const started: StartAttemptResponse = startRes.data.data;
      const attemptId = (started as any)._id || startRes.data.data._id;

      // 2) Fetch full attempt with populated question docs
      const detailRes = await api.get(`/mcu/attempts/${attemptId}`);
      if (!detailRes.data?.success) {
        throw new Error(detailRes.data?.message || "Failed to load GRE attempt");
      }

      const loaded: TestAttempt = detailRes.data.data;
      setAttempt(loaded);

      // Initialize: start at first section + first question
      const firstSection = loaded.sections[0];
      const sectionDurationMinutes = firstSection?.durationMinutes || 30;
      const sectionTotalSeconds = sectionDurationMinutes * 60;

      // time spent in this section so far = sum of questions
      const usedInSection = (firstSection?.questions || []).reduce(
        (sum, q) => sum + (q.timeSpentSeconds || 0),
        0
      );
      const left = Math.max(0, sectionTotalSeconds - usedInSection);

      setSectionSecondsLeft(left);
      setTimerRunning(loaded.status === "in_progress" && left > 0);
      setActiveSectionIndex(0);
      setActiveQuestionIndex(0);
    } catch (err: any) {
      console.error("startAttempt error:", err);
      setError(err.response?.data?.message || err.message || "Failed to start GRE test");
      toast.error(err.response?.data?.message || "Failed to start GRE test");
    } finally {
      setStarting(false);
      setLoading(false);
    }
  }, [testTemplateId]);

  useEffect(() => {
    startAttempt();
  }, [startAttempt]);

  /* ---------- 2. Per-section timer ---------- */

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

  useEffect(() => {
    if (!attempt || !currentSection) return;
    if (!timerRunning || isCompleted) return;
    if (sectionSecondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSectionSecondsLeft((prev) => {
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });

      // Update time used for test + current question
      setAttempt((prev) => {
        if (!prev) return prev;
        const clone: TestAttempt = JSON.parse(JSON.stringify(prev));
        clone.totalTimeUsedSeconds = (clone.totalTimeUsedSeconds || 0) + 1;

        const sIdx = activeSectionIndex;
        const qIdx = activeQuestionIndex;
        if (clone.sections[sIdx] && clone.sections[sIdx].questions[qIdx]) {
          clone.sections[sIdx].questions[qIdx].timeSpentSeconds += 1;
        }
        return clone;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, currentSection, timerRunning, sectionSecondsLeft, activeSectionIndex, activeQuestionIndex, isCompleted]);

  // Auto move when section time is over
  useEffect(() => {
    if (!attempt || !currentSection) return;
    if (isCompleted) return;
    if (!timerRunning) return;
    if (sectionSecondsLeft > 0) return;

    // Section time finished
    setTimerRunning(false);
    toast.info(`Time is up for this section. Moving to the next section...`);

    const isLastSection =
      activeSectionIndex >= attempt.sections.length - 1;

    const move = async () => {
      // Save progress for current section
      await saveCurrentQuestionProgress(true);

      if (isLastSection) {
        // Last section → auto submit GRE test
        await submitTestAttempt(true);
      } else {
        const nextSectionIndex = activeSectionIndex + 1;
        const nextSection = attempt.sections[nextSectionIndex];

        setActiveSectionIndex(nextSectionIndex);
        setActiveQuestionIndex(0);

        const secMinutes = nextSection?.durationMinutes || 30;
        const secTotalSeconds = secMinutes * 60;
        const used = nextSection.questions.reduce(
          (sum, q) => sum + (q.timeSpentSeconds || 0),
          0
        );
        const left = Math.max(0, secTotalSeconds - used);
        setSectionSecondsLeft(left);
        setTimerRunning(left > 0 && attempt.status === "in_progress");
      }
    };

    move();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionSecondsLeft, timerRunning]);

  /* ---------- 3. Save progress for current question ---------- */

  const saveCurrentQuestionProgress = useCallback(
    async (silent: boolean = true) => {
      if (!attempt || !currentSection || !currentQuestion) return;
      if (attempt.status !== "in_progress") return;

      try {
        setSavingProgress(!silent);

        const sectionIndex = activeSectionIndex;
        const questionIndex = activeQuestionIndex;

        const updates = [
          {
            sectionIndex,
            questionIndex,
            answerOptionIndexes: currentQuestion.answerOptionIndexes || [],
            answerText: currentQuestion.answerText || "",
            isAnswered: currentQuestion.isAnswered,
            markedForReview: currentQuestion.markedForReview,
            timeSpentSeconds: currentQuestion.timeSpentSeconds || 0,
          },
        ];

        await api.patch(`/test-attempts/${attempt._id}/save-progress`, {
          updates,
          totalTimeUsedSeconds: attempt.totalTimeUsedSeconds || 0,
        });

        if (!silent) {
          toast.success("Progress saved");
        }
      } catch (err: any) {
        console.error("saveCurrentQuestionProgress error:", err);
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

  /* ---------- 4. Answer handlers ---------- */

  const isWritingSection = useMemo(() => {
    if (!currentSection) return false;
    const type = getGreSectionType(currentSection, activeSectionIndex);
    return type === "Analytical Writing";
  }, [currentSection, activeSectionIndex]);

  // MCQ click
  const handleOptionClick = (optionIndex: number) => {
    if (!attempt || !currentSection || !currentQuestion) return;
    if (isCompleted) return;
    if (isWritingSection) return; // writing has no options

    setAttempt((prev) => {
      if (!prev) return prev;
      const clone: TestAttempt = JSON.parse(JSON.stringify(prev));
      const s = clone.sections[activeSectionIndex];
      const q = s.questions[activeQuestionIndex];

      q.answerOptionIndexes = [optionIndex];
      q.isAnswered = true;
      return clone;
    });
  };

  // Text / writing answer
  const handleTextAnswerChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (!attempt || !currentSection || !currentQuestion) return;
    if (isCompleted) return;

    setAttempt((prev) => {
      if (!prev) return prev;
      const clone: TestAttempt = JSON.parse(JSON.stringify(prev));
      const s = clone.sections[activeSectionIndex];
      const q = s.questions[activeQuestionIndex];

      q.answerText = value;
      q.isAnswered = value.trim().length > 0;
      return clone;
    });
  };

  // Mark for review
  const toggleMarkForReview = () => {
    if (!attempt || !currentSection || !currentQuestion) return;
    if (isCompleted) return;

    setAttempt((prev) => {
      if (!prev) return prev;
      const clone: TestAttempt = JSON.parse(JSON.stringify(prev));
      const s = clone.sections[activeSectionIndex];
      const q = s.questions[activeQuestionIndex];

      q.markedForReview = !q.markedForReview;
      return clone;
    });
  };

  /* ---------- 5. Navigation ---------- */

  const goToQuestion = async (qIndex: number) => {
    if (!attempt || !currentSection) return;
    if (qIndex < 0 || qIndex >= currentSection.questions.length) return;

    await saveCurrentQuestionProgress(true);
    setActiveQuestionIndex(qIndex);
  };

  const goPrevQuestion = async () => {
    if (!currentSection) return;
    if (activeQuestionIndex === 0) return;
    await goToQuestion(activeQuestionIndex - 1);
  };

  const goNextQuestion = async () => {
    if (!currentSection) return;

    const isLastQuestionInSection =
      activeQuestionIndex >= currentSection.questions.length - 1;

    if (!isLastQuestionInSection) {
      await goToQuestion(activeQuestionIndex + 1);
      return;
    }

    // Last question in this section: GRE allows review, but we keep simple
    toast.info("You’re at the last question of this section. You may review or end the section.");
  };

  const endSectionAndMoveNext = async () => {
    if (!attempt || !currentSection) return;
    const isLastSection =
      activeSectionIndex >= attempt.sections.length - 1;

    const confirmed = window.confirm(
      isLastSection
        ? "You’re about to end the last section of the GRE. Continue and submit?"
        : "You’re about to end this section. You won’t be able to return. Continue?"
    );
    if (!confirmed) return;

    // Save current question
    await saveCurrentQuestionProgress(true);

    if (isLastSection) {
      await submitTestAttempt(false);
      return;
    }

    const nextSectionIndex = activeSectionIndex + 1;
    const nextSection = attempt.sections[nextSectionIndex];

    setActiveSectionIndex(nextSectionIndex);
    setActiveQuestionIndex(0);

    const secMinutes = nextSection?.durationMinutes || 30;
    const secTotalSeconds = secMinutes * 60;
    const used = nextSection.questions.reduce(
      (sum, q) => sum + (q.timeSpentSeconds || 0),
      0
    );
    const left = Math.max(0, secTotalSeconds - used);
    setSectionSecondsLeft(left);
    setTimerRunning(left > 0 && attempt.status === "in_progress");
  };

  /* ---------- 6. Submit GRE attempt ---------- */

  const submitTestAttempt = async (fromTimeUp: boolean = false) => {
    if (!attempt || isCompleted) return;

    if (!fromTimeUp) {
      const confirmed = window.confirm(
        "Are you sure you want to submit your GRE test? You won’t be able to change your answers afterwards."
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);
      setTimerRunning(false);
      await saveCurrentQuestionProgress(true);

      const res = await api.post(`/test/${attempt._id}/submit`);
      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to submit GRE test");
      }

      const updated: TestAttempt = res.data.data;
      setAttempt(updated);
      toast.success("GRE test submitted successfully");
    } catch (err: any) {
      console.error("submitTestAttempt error:", err);
      toast.error(err.response?.data?.message || "Failed to submit GRE test");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- 7. Derived UI info ---------- */

  const totalQuestionsForCurrentSection = currentSection
    ? currentSection.questions.length
    : 0;

  const paletteStatus = useMemo(() => {
    if (!currentSection) return [];
    return currentSection.questions.map((q, index) => {
      const isCurrent = index === activeQuestionIndex;
      const answered = q.isAnswered;
      const marked = q.markedForReview;

      return { index, answered, marked, isCurrent };
    });
  }, [currentSection, activeQuestionIndex]);

  const totalQuestionsOverall = useMemo(() => {
    if (!attempt) return 0;
    return attempt.sections.reduce(
      (sum, s) => sum + (s.questions?.length || 0),
      0
    );
  }, [attempt]);

  const attemptedCount = useMemo(() => {
    if (!attempt) return 0;
    return attempt.sections.reduce(
      (sum, s) =>
        sum +
        s.questions.filter((q) => q.isAnswered && !q.markedForReview).length,
      0
    );
  }, [attempt]);

  const isLastQuestionInCurrentSection =
    !!currentSection &&
    activeQuestionIndex >= currentSection.questions.length - 1;
  const isLastSection =
    !!attempt && activeSectionIndex >= attempt.sections.length - 1;

  /* ---------- 8. Loading / error states ---------- */

  if (loading || starting) {
    return (
      <>
        <PageMeta title="GRE Test" description="GRE style test attempt" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            <p className="text-gray-700 dark:text-gray-200">
              Preparing your GRE test...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error || !attempt || !currentSection || !currentQuestion) {
    return (
      <>
        <PageMeta title="GRE Test" description="GRE style test attempt" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Unable to load GRE test</h2>
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

  const qDoc = currentQuestion.questionDoc;
  const isMCQ = !isWritingSection && !!(qDoc && qDoc.options && qDoc.options.length);
  const greSectionType = getGreSectionType(currentSection, activeSectionIndex);

  /* ---------- 9. GRE-style UI ---------- */

  return (
    <>
      <PageMeta
        title={attempt.testTemplate.title || "GRE Test"}
        description="GRE style test attempt"
      />
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        {/* Top bar (GRE-style header) */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  GRE General Test
                </p>
                <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {greSectionType} • Section {activeSectionIndex + 1} of {attempt.sections.length}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Per-section timer */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-100 shadow-lg dark:bg-slate-800">
                <Clock className="h-4 w-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    Section Time Remaining
                  </span>
                  <span className="font-mono text-sm">
                    {formatTime(sectionSecondsLeft)}
                  </span>
                </div>
              </div>

              <div className="hidden flex-col text-[10px] text-slate-500 dark:text-slate-400 sm:flex">
                <span>
                  Questions: {attemptedCount}/{totalQuestionsOverall} answered
                </span>
              </div>

              {attempt.status === "in_progress" && (
                <Button
                  size="sm"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs hover:bg-emerald-700"
                  onClick={() => submitTestAttempt(false)}
                  isLoading={submitting}
                >
                  <Send className="h-4 w-4" />
                  Submit Test
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="hidden items-center gap-1 rounded-xl px-3 py-2 text-xs sm:flex"
                onClick={() => navigate(-1)}
              >
                <LogOut className="h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 lg:flex-row">
          {/* Left: Question area */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Section header strip */}
            <div className="mb-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="inline-flex h-6 items-center justify-center rounded-full bg-slate-900 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-50 dark:bg-slate-800">
                  Q {currentQuestion.order} of {totalQuestionsForCurrentSection}
                </span>
                {qDoc?.difficulty && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Difficulty: {qDoc.difficulty}
                  </span>
                )}
                {qDoc?.questionType && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {qDoc.questionType.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Time on question: {formatTime(currentQuestion.timeSpentSeconds)}</span>
                {currentQuestion.markedForReview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Flag className="h-3 w-3" />
                    Marked for review
                  </span>
                )}
              </div>
            </div>

            {/* Stimulus / passage */}
            {qDoc?.stimulus && (
              <div className="mb-3 max-h-52 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <div>{qDoc.stimulus}</div>
              </div>
            )}

            {/* Question text */}
            <div className="mb-4 rounded-xl bg-white p-2 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100">
              {qDoc?.questionText}
            </div>

            {/* Answer area */}
            <div className="space-y-3">
              {isWritingSection ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Type your response in the box below.
                  </label>
                  <textarea
                    className="h-64 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    value={currentQuestion.answerText || ""}
                    onChange={handleTextAnswerChange}
                    disabled={isCompleted}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    GRE Analytical Writing-style: you can edit your response until the section
                    time expires.
                  </p>
                </div>
              ) : isMCQ ? (
                <div className="space-y-2">
                  {qDoc!.options!.map((opt, idx) => {
                    const selected =
                      currentQuestion.answerOptionIndexes.includes(idx);
                    const label =
                      opt.label ||
                      String.fromCharCode("A".charCodeAt(0) + idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-100"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-400"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                            selected
                              ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400"
                              : "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {label}
                        </div>
                        <div className="flex-1 text-xs sm:text-sm">{opt.text}</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Answer
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    value={currentQuestion.answerText || ""}
                    onChange={handleTextAnswerChange}
                    disabled={isCompleted}
                  />
                </div>
              )}

              {/* Bottom controls */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                      currentQuestion.markedForReview
                        ? "border-purple-500 text-purple-600 dark:border-purple-400 dark:text-purple-300"
                        : ""
                    }`}
                    onClick={toggleMarkForReview}
                    disabled={isCompleted}
                  >
                    <Flag className="h-3 w-3" />
                    {currentQuestion.markedForReview
                      ? "Unmark Review"
                      : "Mark for Review"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 rounded-full px-3 py-1"
                    onClick={() => saveCurrentQuestionProgress(false)}
                    disabled={savingProgress || isCompleted}
                    isLoading={savingProgress}
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 rounded-full px-3 py-1"
                    onClick={goPrevQuestion}
                    disabled={activeQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 rounded-full px-3 py-1"
                    onClick={goNextQuestion}
                    disabled={false}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
                    onClick={endSectionAndMoveNext}
                  >
                    {isLastSection ? "End Test" : "End Section"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Palette + Summary */}
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Palette */}
            <div className="mb-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Question Palette
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {greSectionType}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {paletteStatus.map((p) => {
                  const isCurrent = p.isCurrent;
                  const answered = p.answered;
                  const marked = p.marked;

                  let bg = "bg-slate-100 dark:bg-slate-800";
                  let text = "text-slate-700 dark:text-slate-200";
                  if (answered) {
                    bg = "bg-emerald-100 dark:bg-emerald-900/30";
                    text = "text-emerald-700 dark:text-emerald-300";
                  }
                  if (marked) {
                    bg = "bg-purple-100 dark:bg-purple-900/30";
                    text = "text-purple-700 dark:text-purple-300";
                  }
                  if (isCurrent) {
                    bg = "bg-indigo-600";
                    text = "text-white";
                  }

                  return (
                    <button
                      key={p.index}
                      onClick={() => goToQuestion(p.index)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold transition ${
                        isCurrent
                          ? "border-indigo-600 shadow-sm shadow-indigo-500/40"
                          : "border-slate-200 dark:border-slate-700"
                      } ${bg} ${text}`}
                    >
                      {p.index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-300" />
                  Answered
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-slate-300" />
                  Not visited
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-purple-300" />
                  Marked for review
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded-full bg-indigo-500" />
                  Current
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <div className="mb-1 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Summary
                </p>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Total Questions</span>
                  <span>{totalQuestionsOverall}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attempted</span>
                  <span>{attemptedCount}</span>
                </div>
                {attempt.overallStats && isCompleted && (
                  <>
                    <div className="flex justify-between">
                      <span>Correct</span>
                      <span>{attempt.overallStats.totalCorrect}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Incorrect</span>
                      <span>{attempt.overallStats.totalIncorrect}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skipped</span>
                      <span>{attempt.overallStats.totalSkipped}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Raw Score</span>
                      <span>{attempt.overallStats.rawScore}</span>
                    </div>
                  </>
                )}
                {!isCompleted && (
                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    Your detailed GRE-style score report will be available after
                    submission.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            {attempt.status === "in_progress" && (
              <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-800">
                <Button
                  size="sm"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-xs hover:bg-emerald-700"
                  onClick={() => submitTestAttempt(false)}
                  isLoading={submitting}
                >
                  <Send className="h-4 w-4" />
                  Submit GRE Test
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="mt-3 text-[11px] text-emerald-600 dark:text-emerald-400">
                Test submitted • You can safely close this window.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
