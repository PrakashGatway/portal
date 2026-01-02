import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
} from "react";
import { useParams, useNavigate } from "react-router";
import {
  AlertTriangle
} from "lucide-react";

import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import FullScreenLoader from "../../components/fullScreeLoader";
import QuestionRenderer, { GRETestResults, SectionInstructions, SectionReview } from "./Components";
import { GRETestHead } from "./PteHeader";
import { IntroScreen } from "../mcu/GreComponents";
import { PteIntroScreen } from "./instructions";

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
type AttemptPhase = "section_instructions" | "in_section" | "review";

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

export default function PteExamPage() {
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
  const [showingReviewScreen, setShowingReviewScreen] = useState(false);


  const [filter, setFilter] = useState<"all" | "answered" | "not_answered" | "flagged">("all");

  const isCompleted = attempt?.status === "completed";

  const [introPage, setIntroPage] = useState(1);
const [currentScreen, setCurrentScreen] = useState('intro');

  // Memoize derived values - MOVE ALL HOOKS TO TOP LEVEL
  const testTitle = useMemo(() =>
    attempt?.testTemplate.title ||
    (attempt as any)?.testTemplate?.name ||
    "Practice Test",
    [attempt]
  );

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

  const qDoc = useMemo(
    () => currentQuestion?.questionDoc || null,
    [currentQuestion?.questionDoc]
  );

  const isLastQuestionInCurrentSection = useMemo(
    () => !!currentSection &&
      activeQuestionIndex >= currentSection.questions.length - 1,
    [currentSection, activeQuestionIndex]
  );

  const isLastSection = useMemo(
    () => !!attempt && activeSectionIndex >= attempt.sections.length - 1,
    [attempt, activeSectionIndex]
  );

  const isNextDisabled = useMemo(
    () => isCompleted || submitting,
    [isCompleted, submitting]
  );

  // Memoize sectionQuestions - FIXED: This hook must be called unconditionally
  const sectionQuestions = useMemo(() =>
    currentSection?.questions || [],
    [currentSection?.questions]
  );

  // Memoize startAttempt callback
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
          setError("This GRE test has no sections configured.");
          setLoading(false);
          return;
        }

        setAttempt(loaded);

        const meta = loaded.gmatMeta;
        let secIdx = 0;
        let qIdx = 0;
        let nextScreen: GreScreen = (testType !== "full_length") ? "question" : "intro";

        if (loaded.status === "completed") {
          setCurrentScreen("results");
          setLoading(false);
          return;
        }

        if (meta && typeof meta.currentSectionIndex === "number") {
          secIdx = meta.currentSectionIndex;
          qIdx = meta.currentQuestionIndex || 0;
          if (meta.phase === "in_section") nextScreen = "question";
          else if (meta.phase === "review") nextScreen = "section_review";
          else nextScreen = (testType !== "full_length") ? "question" : "intro";
        } else {
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

  // Timer effect
  useEffect(() => {
    if (!attempt || !currentSection) return;

    const secDurationMinutes = currentSection.durationMinutes || 0;
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

  // Timer countdown effect
  useEffect(() => {
    if (!attempt) return;
    if (!timerRunning) return;
    if (isCompleted) return;
    if (!currentSection?.durationMinutes) return;
    if (currentScreen !== "question") return;
    if (timerSecondsLeft <= 0) return;

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });
      setAttempt((prev) => {
        if (!prev) return prev;
        const clone = structuredClone(prev) as TestAttempt;
        clone.totalTimeUsedSeconds = (clone.totalTimeUsedSeconds || 0) + 1;
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

  // Timer expiration effect
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

  // Memoize saveCurrentQuestionProgress
  const saveCurrentQuestionProgress = useCallback(
    async (opts?: {
      silent?: boolean;
      phase?: AttemptPhase;
      metaSectionIndex?: number;
      metaQuestionIndex?: number;
    }) => {
      if (!attempt || !currentSection || !currentQuestion) return;
      if (attempt.status !== "in_progress") return;
      console.log("dsfdsfddddddddddddddddddddddd", currentQuestion?.answerText)
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
              answerOptionIndexes: currentQuestion.answerOptionIndexes || [],
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
          body.currentSectionIndex = opts.metaSectionIndex ?? sectionIndex;
          body.currentQuestionIndex = opts.metaQuestionIndex ?? questionIndex;
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
    [attempt, currentSection, currentQuestion, activeSectionIndex, activeQuestionIndex]
  );

  // Memoize event handlers
  const handleOptionClick = useCallback((optionIndex: number) => {
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
  }, [attempt, currentSection, currentQuestion, isCompleted, activeSectionIndex, activeQuestionIndex]);

  const handleTextAnswerChange = useCallback((
    e: any
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

  }, [attempt, currentSection, currentQuestion, isCompleted, activeSectionIndex, activeQuestionIndex]);

  const toggleMarkForReview = useCallback(() => {
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
  }, [attempt, currentSection, currentQuestion, isCompleted, activeSectionIndex, activeQuestionIndex]);

  const goToQuestion = useCallback(async (qIndex: number) => {
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
  }, [attempt, currentSection, saveCurrentQuestionProgress, activeSectionIndex]);

  const goNextQuestion = useCallback(async () => {
    if (!attempt || !currentSection || !currentQuestion) return;

    const isLastQuestionInSection = activeQuestionIndex >= currentSection.questions.length - 1;

    if (!isLastQuestionInSection) {
      await goToQuestion(activeQuestionIndex + 1);
      return;
    }

    await saveCurrentQuestionProgress({
      silent: true,
      phase: "review",
      metaSectionIndex: activeSectionIndex,
      metaQuestionIndex: activeQuestionIndex,
    });

    toast.info(
      "You've reached the end of this section. Review your answers before moving on."
    );
    setCurrentScreen("section_review");
  }, [attempt, currentSection, currentQuestion, activeQuestionIndex, goToQuestion, saveCurrentQuestionProgress, activeSectionIndex]);

  const handleFinishSectionReview = useCallback(async () => {
    if (!attempt || !currentSection) return;

    await saveCurrentQuestionProgress({
      silent: true,
      phase: "in_section",
      metaSectionIndex: activeSectionIndex,
      metaQuestionIndex: activeQuestionIndex,
    });

    if (isLastSection) {
      submitTestAttempt();
      setCurrentScreen("results");
      return;
    }

    const nextIndex = activeSectionIndex + 1;
    setActiveSectionIndex(nextIndex);
    setActiveQuestionIndex(0);
    setCurrentScreen("question");
  }, [attempt, currentSection, saveCurrentQuestionProgress, activeSectionIndex, activeQuestionIndex, isLastSection]);

  const submitTestAttempt = useCallback(async () => {
    if (!attempt || isCompleted) return;

    const confirmed = window.confirm(
      "Are you sure you want to submit your test? You won't be able to change your answers afterwards."
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

      toast.success("test submitted successfully");
    } catch (err: any) {
      console.error("submitTestAttempt error:", err);
      toast.error(
        err.response?.data?.message || "Failed to submit GRE test"
      );
    } finally {
      setSubmitting(false);
    }
  }, [attempt, isCompleted, saveCurrentQuestionProgress, activeSectionIndex, activeQuestionIndex]);

  // Memoize updateCurrentQuestion function
  const updateCurrentQuestion = useCallback((patch: Partial<AttemptQuestion>) => {
    if (!attempt) return;

    setAttempt(prev => {
      if (!prev) return prev;
      const clone = { ...prev };
      const sIdx = activeSectionIndex;
      const qIdx = activeQuestionIndex;
      const section = { ...clone.sections[sIdx] };
      const questions = [...section.questions];
      const question = { ...questions[qIdx], ...(patch || {}) };
      questions[qIdx] = question;
      section.questions = questions;
      clone.sections = [...clone.sections];
      clone.sections[sIdx] = section;
      return clone;
    });
  }, [attempt, activeSectionIndex, activeQuestionIndex]);

  const updateCurrentQuestionAsync = (patch) => {
    return new Promise<void>((resolve) => {
      setAttempt(prev => {
        if (!prev) return prev;

        const clone = structuredClone(prev);
        const q =
          clone.sections[activeSectionIndex].questions[activeQuestionIndex];

        Object.assign(q, patch);

        resolve(); // resolve AFTER state set
        return clone;
      });
    });
  };


  // Memoize setCurrentScreen function
  const memoizedSetCurrentScreen = useCallback((screen: GreScreen) => {
    setCurrentScreen(screen);
  }, []);

  // Memoize setActiveQuestionIndex function
  const memoizedSetActiveQuestionIndex = useCallback((index: number) => {
    setActiveQuestionIndex(index);
  }, []);

  // Memoize setShowingReviewScreen function
  const memoizedSetShowingReviewScreen = useCallback((show: boolean) => {
    setShowingReviewScreen(show);
  }, []);

  // Memoize setFilter function
  const memoizedSetFilter = useCallback((filterValue: "all" | "answered" | "not_answered" | "flagged") => {
    setFilter(filterValue);
  }, []);

  // Memoize navigateBack function
  const memoizedNavigateBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Render loading state
  if (loading || starting) {
    return <FullScreenLoader />;
  }

  // Render error state
  if (error || !attempt) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold">Unable to load test</h2>
            </div>
            <p className="mb-3">
              {error ||
                "Something went wrong while loading your attempt."}
            </p>
            <Button
              onClick={memoizedNavigateBack}
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

  return (
    <>
      <div className="relative min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">


        <GRETestHead
          testTitle={testTitle}
          currentSection={currentSection}
          currentQuestion={currentQuestion}
          activeSectionIndex={activeSectionIndex}
          totalSections={attempt?.sections.length || 0}
          timerSecondsLeft={timerSecondsLeft}
          currentScreen={currentScreen}
          isCompleted={isCompleted}
          savingProgress={savingProgress}
          saveCurrentQuestionProgress={() => saveCurrentQuestionProgress({ silent: false })}
          navigateBack={memoizedNavigateBack}
        />

        {/* Scrollable main area between header & footer */}
        <div className="pt-14 pb-14">

          {currentScreen === "intro" && (
            <PteIntroScreen
              introPage={introPage}
              setIntroPage={setIntroPage}
              setCurrentScreen={setCurrentScreen}
            />
          )}

          

          {currentScreen === "section_instructions" && currentSection && (
            <SectionInstructions
              currentSection={currentSection}
              activeSectionIndex={activeSectionIndex}
              setCurrentScreen={(screen) => memoizedSetCurrentScreen(screen)}
            />
          )}
          {currentScreen === "question" && currentSection && currentQuestion && (
            <QuestionRenderer
              key={`question-${currentQuestion.question}-${activeQuestionIndex}`}
              qDoc={qDoc}
              sectionQuestions={sectionQuestions}
              currentQuestion={currentQuestion}
              onReviewSection={memoizedSetCurrentScreen}
              isCompleted={isCompleted}
              handleOptionClick={handleOptionClick}
              handleTextAnswerChange={handleTextAnswerChange}
              toggleMarkForReview={toggleMarkForReview}
              updateCurrentQuestion={updateCurrentQuestion}
              updateCurrentQuestionAsync={updateCurrentQuestionAsync}
              saveCurrentQuestionProgress={saveCurrentQuestionProgress}
              activeQuestionIndex={activeQuestionIndex}
              sectionTotal={currentSection.questions.length}
              isLastQuestionInCurrentSection={isLastQuestionInCurrentSection}
              isNextDisabled={isNextDisabled}
              goToQuestion={goToQuestion}
              goNextQuestion={goNextQuestion}
            />
          )}
          {currentScreen === "section_review" && attempt && currentSection && (
            <SectionReview
              currentSection={currentSection}
              attempt={attempt}
              activeQuestionIndex={activeQuestionIndex}
              isLastSection={isLastSection}
              submitting={submitting}
              showingReviewScreen={showingReviewScreen}
              filter={filter}
              setFilter={memoizedSetFilter}
              setShowingReviewScreen={memoizedSetShowingReviewScreen}
              setActiveQuestionIndex={memoizedSetActiveQuestionIndex}
              setCurrentScreen={memoizedSetCurrentScreen}
              saveCurrentQuestionProgress={saveCurrentQuestionProgress}
              handleFinishSectionReview={handleFinishSectionReview}
            />
          )}
          {currentScreen === "results" && attempt && (
            <GRETestResults
              attempt={attempt}
              navigateBack={memoizedNavigateBack}
              onTakeAnotherTest={() => navigate("/gmat/practice")}
            />
          )}
        </div>
      </div>
    </>
  );
}