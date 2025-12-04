import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  LogOut,
  Save,
} from "lucide-react";

import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import FullScreenLoader from "../../components/fullScreeLoader";

// ===================
// Types (same as GMAT attempt, simplified)
// ===================
interface QuestionDoc {
  _id: string;
  questionText: string;
  questionType: string;
  difficulty?: string;
  stimulus?: string; // for reading comp passage, etc.
  options?: {
    label?: string;
    text: string;
  }[];
  marks?: number;
  negativeMarks?: number;
  correctOptionIndex?: number | null; // used for review screen
  dataInsights?: any;
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
  durationMinutes?: number; // if missing => untimed section
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

// We still send gmatPhase since your backend already expects it in save-progress
type AttemptPhase = "intro" | "section_instructions" | "in_section" | "review";

interface GmatMetaLike {
  phase?: AttemptPhase;
  currentSectionIndex?: number;
  currentQuestionIndex?: number;
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
  gmatMeta?: GmatMetaLike; // reused to resume position if backend uses it
}

interface StartAttemptResponse {
  _id: string;
}

// Screens for GRE flow
type GreScreen =
  | "intro"
  | "section_instructions"
  | "question"
  | "section_review"
  | "results";

const formatTime = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function GRETestAttemptPage() {
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

  // Section timer (GRE: per section, timed or untimed)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showingReviewScreen, setShowingReviewScreen] = useState(false);

  // GRE screens
  const [currentScreen, setCurrentScreen] = useState<GreScreen>("intro");
  const [introPage, setIntroPage] = useState(1);

  const isCompleted = attempt?.status === "completed";

  const testTitle =
    attempt?.testTemplate.title ||
    (attempt as any)?.testTemplate?.name ||
    "GRE Practice Test";

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

        // Start or resume attempt (same API as GMAT)
        const startRes = await api.post("/mcu/start", { testTemplateId });
        if (!startRes.data?.success) {
          throw new Error(startRes.data?.message || "Failed to start attempt");
        }

        const started: StartAttemptResponse = startRes.data.data;
        const attemptId = (started as any)._id || startRes.data.data._id;

        // Load full attempt with questions (same as GMAT)
        const detailRes = await api.get(`/mcu/attempts/${attemptId}`);
        if (!detailRes.data?.success) {
          throw new Error(detailRes.data?.message || "Failed to load attempt");
        }

        const loaded: TestAttempt = detailRes.data.data;

        if (!loaded.sections || loaded.sections.length === 0) {
          setError("This GRE test has no sections configured.");
          setLoading(false);
          return;
        }

        setAttempt(loaded);

        // Resume position: use gmatMeta if backend sets it, else first unanswered
        const meta = loaded.gmatMeta;
        let secIdx = 0;
        let qIdx = 0;
        let nextScreen: GreScreen = "intro";

        if (loaded.status === "completed") {
          // Attempt done → go directly to results screen
          setCurrentScreen("results");
          setLoading(false);
          return;
        }

        if (meta && typeof meta.currentSectionIndex === "number") {
          secIdx = meta.currentSectionIndex;
          qIdx = meta.currentQuestionIndex || 0;
          if (meta.phase === "in_section") nextScreen = "question";
          else if (meta.phase === "review") nextScreen = "section_review";
          else nextScreen = "intro";
        } else {
          // fallback: find first section with unanswered question
          outer: for (let s = 0; s < loaded.sections.length; s++) {
            const sec = loaded.sections[s];
            for (let i = 0; i < sec.questions.length; i++) {
              if (!sec.questions[i].isAnswered) {
                secIdx = s;
                qIdx = i;
                nextScreen = "intro";
                break outer;
              }
            }
          }
        }

        setActiveSectionIndex(secIdx);
        setActiveQuestionIndex(qIdx);
        setCurrentScreen(nextScreen || "intro");
      } catch (err: any) {
        console.error("startAttempt error:", err);
        setError(
          err?.response?.data?.message ||
          err.message ||
          "Failed to start GRE test"
        );
        toast.error(
          err?.response?.data?.message || "Failed to start GRE test"
        );
      } finally {
        setStarting(false);
        setLoading(false);
      }
    },
    [testTemplateId]
  );

  useEffect(() => {
    startAttempt();
  }, [startAttempt]);

  // ===================
  // 2️⃣ Current section & question
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
  // 3️⃣ Init / reset section timer when section or screen changes
  // ===================
  useEffect(() => {
    if (!attempt || !currentSection) return;

    const secDurationMinutes =
      currentSection.durationMinutes || 0; // 0 → untimed
    if (!secDurationMinutes) {
      setTimerSecondsLeft(0);
      setTimerRunning(false);
      return;
    }

    const secDurationSeconds = secDurationMinutes * 60;
    const usedInSection = currentSection.questions.reduce(
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
  }, [attempt, currentSection, currentScreen, isCompleted]);

  // ===================
  // 4️⃣ Section timer tick (question timer)
  // ===================
  useEffect(() => {
    if (!attempt) return;
    if (!timerRunning) return;
    if (isCompleted) return;
    if (!currentSection?.durationMinutes) return; // untimed
    if (currentScreen !== "question") return;
    if (timerSecondsLeft <= 0) return;

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });

      // Increment total + question time
      setAttempt((prev) => {
        if (!prev) return prev;
        const clone = structuredClone(prev) as TestAttempt;
        clone.totalTimeUsedSeconds =
          (clone.totalTimeUsedSeconds || 0) + 1;
        const sIdx = activeSectionIndex;
        const qIdx = activeQuestionIndex;
        if (
          clone.sections[sIdx] &&
          clone.sections[sIdx].questions[qIdx]
        ) {
          clone.sections[sIdx].questions[qIdx].timeSpentSeconds =
            (clone.sections[sIdx].questions[qIdx].timeSpentSeconds || 0) + 1;
        }
        return clone;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    attempt,
    timerRunning,
    timerSecondsLeft,
    activeSectionIndex,
    activeQuestionIndex,
    isCompleted,
    currentScreen,
    currentSection,
  ]);

  // When time hits 0 → go to section review (like GMAT, but no next-section auto submit)
  useEffect(() => {
    if (!attempt || !currentSection) return;
    if (!currentSection.durationMinutes) return;
    if (!timerRunning) return;
    if (currentScreen !== "question") return;

    if (timerSecondsLeft === 0) {
      setTimerRunning(false);
      toast.info(
        "Time is up for this section. Moving to section review."
      );
      setCurrentScreen("section_review");
    }
  }, [
    timerSecondsLeft,
    timerRunning,
    attempt,
    currentSection,
    currentScreen,
  ]);

  // ===================
  // 5️⃣ Save current question progress (same API as GMAT: /mcu/attempts/:id/save-progress)
  // ===================
  const saveCurrentQuestionProgress = useCallback(
    async (opts?: {
      silent?: boolean;
      phase?: AttemptPhase;
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
              timeSpentSeconds: currentQuestion.timeSpentSeconds || 0,
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

        await api.patch(
          `/mcu/attempts/${attempt._id}/save-progress`,
          body
        );

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
  // 6️⃣ Answer handlers
  // ===================
  const handleOptionClick = (optionIndex: number) => {
    if (!attempt || !currentSection || !currentQuestion) return;
    if (isCompleted) return;
    setAttempt((prev) => {
      if (!prev) return prev;
      const clone = structuredClone(prev) as TestAttempt;
      const s = clone.sections[activeSectionIndex];
      const q = s.questions[activeQuestionIndex];

      // For GRE text completion/sentence equivalence, you might later support multi-select.
      // For now we keep single-select like GMAT.
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
  // 7️⃣ Navigation inside current section ONLY (GRE rule)
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

    // GRE: you *can* skip questions, so we don't force answer here.

    // 1) Not last question → go to next
    if (!isLastQuestionInSection) {
      await goToQuestion(activeQuestionIndex + 1);
      return;
    }

    // 2) Last question in this section → go to section review
    await saveCurrentQuestionProgress({
      silent: true,
      phase: "review",
      metaSectionIndex: activeSectionIndex,
      metaQuestionIndex: activeQuestionIndex,
    });

    toast.info(
      "You’ve reached the end of this section. Review your answers before moving on."
    );
    setCurrentScreen("section_review");
  };

  const isLastQuestionInCurrentSection =
    !!currentSection &&
    activeQuestionIndex >= currentSection.questions.length - 1;

  const isLastSection =
    !!attempt && activeSectionIndex >= attempt.sections.length - 1;

  const isNextDisabled = isCompleted || submitting;

  // ===================
  // 8️⃣ Move from section review → next section or results
  // ===================
  const handleFinishSectionReview = async () => {
    if (!attempt || !currentSection) return;

    await saveCurrentQuestionProgress({
      silent: true,
      phase: "review",
      metaSectionIndex: activeSectionIndex,
      metaQuestionIndex: activeQuestionIndex,
    });

    if (isLastSection) {
      // last section → go to submit/results
      setCurrentScreen("results");
      return;
    }

    // Move to next section instructions; cannot go back to previous section
    const nextIndex = activeSectionIndex + 1;
    setActiveSectionIndex(nextIndex);
    setActiveQuestionIndex(0);
    setCurrentScreen("section_instructions");
  };

  // ===================
  // 9️⃣ Submit GRE attempt (same API as GMAT: /mcu/attempts/:id/submit)
  // ===================
  const submitTestAttempt = async () => {
    if (!attempt || isCompleted) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit your GRE test? You won’t be able to change your answers afterwards."
    );
    if (!confirmed) return;

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

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to submit GRE test");
      }

      // Reload attempt to get stats + correctness
      const detailRes = await api.get(`/mcu/attempts/${attempt._id}`);
      if (!detailRes.data?.success) {
        throw new Error(detailRes.data?.message || "Failed to load results");
      }

      const submittedAttempt: TestAttempt = detailRes.data.data;
      setAttempt(submittedAttempt);
      setCurrentScreen("results");

      toast.success("GRE test submitted successfully");
      // Optional: if you want a separate analysis page:
      // navigate(`/gre/analysis/${submittedAttempt._id}`);
    } catch (err: any) {
      console.error("submitTestAttempt error:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit GRE test"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===================
  // 1️⃣0️⃣ Intro content (3–5 pages, GRE-themed)
  // ===================
  const renderIntro = () => {
    const introPages = [
      {
        title: "Welcome to the GRE Practice Test",
        content: (
          <>
            <p className="mb-4">
              This practice test is designed to closely simulate the official GRE
              General Test interface and flow.
            </p>
            <p className="mb-4">
              Some sections will be timed. Your remaining time will be shown in
              the top-right corner whenever timing applies.
            </p>
            <p className="mb-4">
              You can move forward and backward between questions <b>within the
                current section only</b>. Once you leave a section, you cannot
              return to it.
            </p>
            <p>
              Click{" "}
              <span className="bg-indigo-600 text-white px-2 py-1 rounded font-bold">
                Next →
              </span>{" "}
              to continue.
            </p>
          </>
        ),
      },
      {
        title: "Question Types",
        content: (
          <>
            <p className="mb-3">
              This test includes GRE-style question types:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Analytical Writing</li>
              <li>Verbal — Text Completion</li>
              <li>Verbal — Sentence Equivalence</li>
              <li>Verbal — Reading Comprehension</li>
              <li>Quantitative Reasoning</li>
            </ul>
            <p className="mb-4">
              Question presentation and layout follow the style of the official
              GRE exam as closely as possible.
            </p>
          </>
        ),
      },
      {
        title: "Marking & Review",
        content: (
          <>
            <p className="mb-4">
              You can mark questions for review within a section. During section
              review, you’ll see a list of all questions, their status, and
              whether they are marked.
            </p>
            <p className="mb-4">
              You can change your answers as many times as you like while you
              are still in the section or its review screen.
            </p>
          </>
        ),
      },
      {
        title: "Timed vs. Untimed Modes",
        content: (
          <>
            <p className="mb-4">
              Some tests or sections may be untimed for practice purposes. In
              untimed sections, no countdown clock is displayed.
            </p>
            <p className="mb-4">
              In timed sections, once time expires, you’ll be moved to the
              section review automatically.
            </p>
          </>
        ),
      },
      {
        title: "Begin the Test",
        content: (
          <>
            <p className="mb-4">
              After this introduction, you will see instructions for the first
              section and then the questions.
            </p>
            <p className="mb-4">
              When you complete all sections and submit the test, you’ll see a
              question-wise review with correct and incorrect answers.
            </p>
            <p>
              Click{" "}
              <span className="bg-indigo-600 text-white px-2 py-1 rounded font-bold">
                Begin
              </span>{" "}
              when you are ready.
            </p>
          </>
        ),
      },
    ];

    const maxPage = introPages.length;
    const page = Math.min(introPage, maxPage);
    const isLast = page === maxPage;

    const current = introPages[page - 1];

    return (
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {current.title}
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {current.content}
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                {page > 1 && (
                  <Button
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    variant="outline"
                    size="sm"
                    onClick={() => setIntroPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                )}
                <Button
                  size="sm"
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800"
                  onClick={() => {
                    if (isLast) {
                      setCurrentScreen("section_instructions");
                    } else {
                      setIntroPage((p) => p + 1);
                    }
                  }}
                >
                  {isLast ? "Begin Test" : "Next →"}
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // Section Instructions Screen (GRE-style)
  // =========================
  const renderSectionInstructions = () => {
    if (!currentSection) return null;

    const sectionName =
      currentSection.name || `Section ${activeSectionIndex + 1}`;
    const sectionDuration = currentSection.durationMinutes;
    const questionCount = currentSection.questions.length;

    const timedText = sectionDuration
      ? `${sectionDuration} minutes`
      : "Untimed (no countdown)";

    return (
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="mb-4 text-2xl font-bold">
          {sectionName} — Instructions
        </h2>
        <p className="mb-4">
          This section is <b>{timedText}</b> and contains{" "}
          <b>{questionCount}</b> questions.
        </p>
        <p className="mb-4">
          You may move backward and forward among questions in this section. You
          can mark questions for review and change your answers as many times as
          you like while you remain in this section or its review screen.
        </p>
        <p className="mb-4">
          Once you move to the next section, you will not be able to return to
          this one.
        </p>
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                  onClick={() => {
                    setCurrentScreen("question");
                  }}
                >
                  Start Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // Question rendering (handles GRE question types)
  // =========================
  const renderQuestionContent = () => {
    if (!qDoc || !currentQuestion) return null;

    const type = qDoc.questionType;

    if (type === "gre_analytical_writing") {
      return (
        <>
        <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-300 dark:text-red-100 mb-3 mx-auto">Type your essay into the provided editor.</div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
            <div
              className="dark:prose-invert max-w-none text-lg text-slate-900 dark:text-slate-100 mb-4"
              dangerouslySetInnerHTML={{ __html: qDoc.stimulus || "" }}
            />
            <div
              className="prose text-lg dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
            />
          </div>
          <textarea
            className="w-full min-h-[260px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm"
            value={currentQuestion.answerText || ""}
            onChange={handleTextAnswerChange}
          />
        </div>
        </>
      );
    }

    // 2) GRE Verbal Reading Comprehension: passage + question
    if (type === "gre_verbal_reading_comp") {
      return (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 max-h-[60vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Reading Passage
            </h3>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: qDoc.stimulus || "" }}
            />
          </div>
          <div className="col-span-7 space-y-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
              <div
                className="text-sm font-semibold"
                dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
              />
            </div>
            <div className="space-y-2">
              {qDoc.options?.map((opt, idx) => {
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
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2 text-left text-sm transition ${selected
                      ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                      }`}
                  >
                    <span className="mt-0.5 text-xs font-semibold">
                      {label}.
                    </span>
                    <span
                      dangerouslySetInnerHTML={{ __html: opt.text }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // 3) Other verbal/quant questions (text completion, sentence equivalence, quant)
    //    We present them as standard MCQ (you can later extend TC/SE to multi-select)
    if (qDoc.options && qDoc.options.length) {
      return (
        <div className="space-y-3">
          {qDoc.stimulus && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: qDoc.stimulus }}
              />
            </div>
          )}

          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
            <div
              className="text-sm font-semibold"
              dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
            />
          </div>

          <div className="space-y-2 ml-1">
            {qDoc.options.map((opt, idx) => {
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
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2 text-left text-sm transition ${selected
                    ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                    }`}
                >
                  <span className="mt-0.5 text-xs font-semibold">
                    {label}.
                  </span>
                  <span
                    dangerouslySetInnerHTML={{ __html: opt.text }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Fallback (no options)
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
      />
    );
  };

  // =========================
  // Question Screen
  // =========================
  const renderQuestionScreen = () => {
    if (!currentSection || !currentQuestion) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Unable to load question</h2>
            </div>
            <p className="mb-3">
              Please try reloading the page or contact support if the problem
              persists.
            </p>
          </div>
        </div>
      );
    }

    const questionNumber = currentQuestion.order || activeQuestionIndex + 1;
    const sectionTotal = currentSection.questions.length;

    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4">

        {/* Question body */}
        <div className="bg-white dark:bg-slate-900">
          {renderQuestionContent()}
        </div>

        {/* Bottom controls for this question (inside main area) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMarkForReview}
                  disabled={isCompleted}
                >
                  <Flag className="mr-1 h-3 w-3" />
                  {currentQuestion.markedForReview ? "Unmark" : "Mark for Review"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveCurrentQuestionProgress({ silent: false })}
                  disabled={isCompleted || savingProgress}
                >
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>

              {/* Top info bar in content area */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className=" text-slate-800 dark:text-slate-100">
                    Question {questionNumber} of {sectionTotal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeQuestionIndex <= 0 || isCompleted}
                  onClick={() =>
                    goToQuestion(Math.max(0, activeQuestionIndex - 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  disabled={isNextDisabled}
                  onClick={goNextQuestion}
                >
                  {isLastQuestionInCurrentSection ? "Review Section" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderSectionReview = () => {
    if (!attempt || !currentSection) return null;

    // Step 1: Confirmation screen
    if (!showingReviewScreen) {
      return (
        <div className="max-w-7xl mx-auto p-4 space-y-8">

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">You have reached the end of this section.</h3>

              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-300">
                  You have time remaining to review. As long as there is time remaining, you can check your work.
                </p>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  Once you leave this section, you WILL NOT be able to return to it.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Review Options:</p>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Check your work before moving on
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Change answers while time remains
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    View all questions in this section
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Navigation Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => saveCurrentQuestionProgress({ silent: true })}
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800"
                    onClick={() => {
                      // Go directly to next section without review
                      handleFinishSectionReview();
                    }}
                  >
                    Continue to Next Section
                  </Button>

                  <Button
                    size="sm"
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => {
                      // Show the review screen
                      setShowingReviewScreen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Review Section
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Step 2: Review screen (original code with modifications)
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {currentSection.name || "Section"} — Review
          </h2>
          {currentSection.durationMinutes ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You can still change answers while you remain in this section.
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Untimed section — change any answers before moving on.
            </p>
          )}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Questions</p>
                <p className="text-xs text-slate-500">
                  Click any question to review
                </p>
              </div>
              <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2">
                {currentSection.questions.map((q, idx) => {
                  const answered = q.isAnswered;
                  return (
                    <button
                      key={q.question}
                      onClick={() => {
                        setActiveQuestionIndex(idx);
                        setCurrentScreen("question");
                      }}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-xs text-left hover:border-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>Q{idx + 1}</span>
                      <span className="flex items-center gap-2">
                        {answered ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Answered
                          </span>
                        ) : (
                          <span className="text-slate-500">Not Answered</span>
                        )}
                        {q.markedForReview && (
                          <Flag className="h-3 w-3 text-indigo-500" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    saveCurrentQuestionProgress({ silent: false })
                  }
                >
                  Save Progress
                </Button>
                <Button
                  size="sm"
                  onClick={handleFinishSectionReview}
                  disabled={submitting}
                >
                  {isLastSection
                    ? "Proceed to Submit / Results"
                    : "Proceed to Next Section"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    // Go back to question view
                    setCurrentScreen("question");
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Questions
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800"
                  onClick={() => {
                    // Go back to confirmation screen
                    setShowingReviewScreen(false);
                  }}
                >
                  Back to Section Summary
                </Button>

                <Button
                  size="sm"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  onClick={handleFinishSectionReview}
                  disabled={submitting}
                >
                  {isLastSection
                    ? "Submit Test"
                    : "Continue to Next Section"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!attempt) return null;

    const overall = attempt.overallStats;

    const getQuestionStatus = (q: AttemptQuestion, qd?: QuestionDoc | null) => {
      if (!q.isAnswered) return "skipped";
      if (typeof q.isCorrect === "boolean") {
        return q.isCorrect ? "correct" : "incorrect";
      }
      if (
        qd &&
        typeof qd.correctOptionIndex === "number" &&
        qd.correctOptionIndex >= 0
      ) {
        const userIdx = q.answerOptionIndexes[0];
        return userIdx === qd.correctOptionIndex
          ? "correct"
          : "incorrect";
      }
      return "attempted";
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "correct":
          return "text-emerald-600 bg-emerald-50";
        case "incorrect":
          return "text-red-600 bg-red-50";
        case "skipped":
          return "text-slate-600 bg-slate-100";
        default:
          return "text-slate-700 bg-slate-100";
      }
    };

    return (
      <div className="max-w-6xl mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Review & Results</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Exit
          </Button>
        </div>

        {overall && (
          <div className="grid grid-cols-5 gap-3">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs">
              <p className="text-slate-500">Total Questions</p>
              <p className="text-lg font-semibold">
                {overall.totalQuestions}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs">
              <p className="text-slate-500">Attempted</p>
              <p className="text-lg font-semibold">
                {overall.totalAttempted}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs">
              <p className="text-slate-500">Correct</p>
              <p className="text-lg font-semibold text-emerald-600">
                {overall.totalCorrect}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs">
              <p className="text-slate-500">Incorrect</p>
              <p className="text-lg font-semibold text-red-600">
                {overall.totalIncorrect}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 text-xs">
              <p className="text-slate-500">Raw Score</p>
              <p className="text-lg font-semibold">
                {overall.rawScore}
              </p>
            </div>
          </div>
        )}

        {/* Section-wise answer sheet */}
        {attempt.sections.map((sec, sIdx) => (
          <div
            key={sIdx}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {sec.name || `Section ${sIdx + 1}`}
                </p>
                {sec.stats && (
                  <p className="text-xs text-slate-500">
                    Correct: {sec.stats.correct} • Incorrect:{" "}
                    {sec.stats.incorrect} • Skipped: {sec.stats.skipped}
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-3 text-left font-semibold">
                      #
                    </th>
                    <th className="py-2 pr-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="py-2 pr-3 text-left font-semibold">
                      Your Answer
                    </th>
                    <th className="py-2 pr-3 text-left font-semibold">
                      Correct Answer
                    </th>
                    <th className="py-2 pr-3 text-left font-semibold">
                      Question
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sec.questions.map((q, qIdx) => {
                    const qd = q.questionDoc;
                    const status = getQuestionStatus(q, qd);
                    const statusClass = getStatusColor(status);

                    const getOptionLabel = (idx: number) => {
                      if (!qd?.options || !qd.options[idx]) return "--";
                      const lab =
                        qd.options[idx].label ||
                        String.fromCharCode(
                          "A".charCodeAt(0) + idx
                        );
                      return lab;
                    };

                    const userLabel =
                      q.answerOptionIndexes.length > 0
                        ? q.answerOptionIndexes
                          .map(getOptionLabel)
                          .join(", ")
                        : q.answerText
                          ? q.answerText
                          : "--";

                    const correctLabel =
                      typeof qd?.correctOptionIndex === "number"
                        ? getOptionLabel(qd.correctOptionIndex)
                        : "--";

                    return (
                      <tr
                        key={q.question}
                        className="border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="py-2 pr-3 align-top">
                          {q.order || qIdx + 1}
                        </td>
                        <td className="py-2 pr-3 align-top">
                          <span className={`inline-flex rounded-full px-2 py-1 ${statusClass}`}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 pr-3 align-top">
                          {userLabel}
                        </td>
                        <td className="py-2 pr-3 align-top">
                          {correctLabel}
                        </td>
                        <td className="py-2 pr-3 align-top max-w-md">
                          {qd ? (
                            <div
                              className="line-clamp-3 text-slate-700 dark:text-slate-200"
                              dangerouslySetInnerHTML={{
                                __html: qd.questionText,
                              }}
                            />
                          ) : (
                            "--"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Exit
          </Button>
        </div>
      </div>
    );
  };

  if (loading || starting) {
    return <FullScreenLoader />;
  }

  if (error || !attempt) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Unable to load GRE test</h2>
            </div>
            <p className="mb-3">
              {error ||
                "Something went wrong while loading your attempt."}
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
      </>
    );
  }

  // ===================
  // Main GRE layout — full screen
  // ===================
  return (
    <>
      <div className="relative min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
        {/* Fixed Top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-900 dark:text-slate-50">
                  {testTitle}

                </p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {currentSection?.name || "Section"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {currentSection && currentQuestion && (
                <div className="hidden sm:flex flex-col items-end text-sm">
                  {currentSection && (
                    <p className="text-sm font-medium">
                      Section {activeSectionIndex + 1} of {attempt?.sections?.length}
                    </p>
                  )}
                </div>
              )}

              {/* Timer indicator */}
              {currentSection?.durationMinutes &&
                currentScreen !== "intro" && (
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold tabular-nums">
                      {formatTime(timerSecondsLeft)}
                    </span>
                  </div>
                )}

              {/* Save + Submit */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    saveCurrentQuestionProgress({ silent: false })
                  }
                  disabled={isCompleted || savingProgress}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                {currentScreen === "results" || isCompleted ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Exit
                  </Button>
                ) : (""
                  // <Button
                  //   size="sm"
                  //   onClick={submitTestAttempt}
                  //   disabled={submitting}
                  // >
                  //   Submit
                  // </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable main area between header & footer */}
        <div className="pt-14 pb-14">
          {currentScreen === "intro" && renderIntro()}
          {currentScreen === "section_instructions" &&
            renderSectionInstructions()}
          {currentScreen === "question" && renderQuestionScreen()}
          {currentScreen === "section_review" &&
            renderSectionReview()}
          {currentScreen === "results" && renderResults()}
        </div>
      </div>
    </>
  );
}
