import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Flag,
  Save,
  LogOut,
  BookmarkCheck,
  BookmarkIcon,
  ChevronDown,
  Clock,
  ChevronUp,
  BarChart3,
  Calculator,
  BookOpenText,
} from "lucide-react";
import Button from "../../components/ui/button/Button";

const QuestionRenderer: any = React.memo(
  ({
    mode,
    qDoc,
    currentQuestion,
    isCompleted,
    handleOptionClick,
    handleTextAnswerChange,
    toggleMarkForReview,
    saveCurrentQuestionProgress,
    activeQuestionIndex,
    sectionTotal,
    isLastQuestionInCurrentSection,
    isNextDisabled,
    goToQuestion,
    goNextQuestion,
    // NEW: full palette + review button
    sectionQuestions, // array of all questions in current section
    onReviewSection, // callback to go to review screen
  }: any) => {
    const questionNumber = currentQuestion.order || activeQuestionIndex + 1;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const [leftPercent, setLeftPercent] = useState(45);

    // for elimination feature
    const [showEliminationMode, setShowEliminationMode] = useState(true);
    const [crossedOptions, setCrossedOptions] = useState<number[]>([]);

    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const onMove = useCallback((e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(80, Math.max(20, percent))); // clamp 20–80%
    }, []);

    const onUp = useCallback(() => {
      draggingRef.current = false;
      document.body.style.userSelect = "";
    }, []);

    useEffect(() => {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    }, [onMove, onUp]);

    const onDividerDown = (e: React.MouseEvent) => {
      draggingRef.current = true;
      document.body.style.userSelect = "none";
      e.preventDefault();
    };

    if (!qDoc || !currentQuestion) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          Error to Load Question
        </div>
      );
    }

    const isMCQ = Array.isArray(qDoc.options) && qDoc.options.length > 0;
    const type = qDoc.questionType || "";

    const toggleCrossOption = (index: number) => {
      setCrossedOptions((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    };

    const onOptionClick = (index: number) => {
      if (isCompleted) return;
      setCrossedOptions((prev) => prev.filter((i) => i !== index));
      handleOptionClick(index);
    };

    const togglePalette = () => {
      setIsPaletteOpen((prev) => !prev);
    };

    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {isMCQ && type == "sat_reading_writing" ? (
          <div ref={containerRef} className="flex gap-3">
            {/* LEFT: Passage / Stimulus */}
            <div
              style={{ width: `${leftPercent}%` }}
              className="rounded-xl bg-white dark:bg-slate-900 min-h-[60vh] p-2 overflow-y-auto"
            >
              {qDoc.stimulus ? (
                <div
                  className="prose text-base sm:text-lg prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: qDoc.stimulus }}
                />
              ) : (
                <p className="text-lg text-slate-500 italic">
                  No passage provided.
                </p>
              )}
            </div>

            <div
              onMouseDown={onDividerDown}
              className="cursor-col-resize flex items-center justify-center"
            >
              <div className="h-full w-1 bg-slate-400 rounded-full" />
            </div>

            <div
              style={{ width: `${100 - leftPercent}%` }}
              className="bg-white rounded dark:bg-slate-900 p-2 min-h-[65vh] overflow-y-auto"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4 bg-slate-300 dark:bg-slate-700 border-b-3 border-dashed border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="bg-slate-800 dark:bg-slate-100 text-slate-100 dark:text-slate-800 p-2">
                    {questionNumber}
                  </span>
                  <span
                    className="flex cursor-pointer"
                    onClick={toggleMarkForReview}
                  >
                    {currentQuestion.markedForReview ? (
                      <>
                        <BookmarkCheck className="mr-1 h-6 w-6 text-slate-900" />
                        Marked
                      </>
                    ) : (
                      <>
                        <BookmarkIcon className="mr-1 h-6 w-6" />
                        Mark for Review
                      </>
                    )}
                  </span>
                </div>

                {/* ABC / elimination switch */}
                <div>
                  <span
                    onClick={() => {
                      setShowEliminationMode((prev) => !prev);
                      setCrossedOptions([]);
                    }}
                    className="bg-blue-800 dark:bg-blue-100 border border-slate-800 rounded-lg text-slate-100 dark:text-slate-800 p-1 mr-2 cursor-pointer select-none"
                  >
                    {showEliminationMode ? <del>ABC</del> : "ABC"}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="flex items-start justify-between mb-4">
                <h2
                  className="text-base sm:text-lg"
                  dangerouslySetInnerHTML={{
                    __html: qDoc.questionText || "Question missing",
                  }}
                />
              </div>

              {/* Options */}
              <div className="space-y-3 mt-4">
                {qDoc.options.map((opt: any, i: number) => {
                  const selected =
                    currentQuestion.answerOptionIndexes?.includes(i);
                  const isCrossed = crossedOptions.includes(i);

                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-full relative">
                        <button
                          onClick={() => onOptionClick(i)}
                          disabled={isCompleted}
                          className={`w-full text-left rounded-lg border-2 px-4 py-2 flex items-start gap-3 transition ${
                            selected
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                              : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          } ${
                            isCrossed && !selected
                              ? "opacity-60"
                              : "opacity-100"
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              selected
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-400 text-slate-700 dark:border-slate-500 dark:text-slate-300"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                          <div
                            className="prose prose-sm dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: opt.text }}
                          />
                        </button>

                        {/* Strike-through on main option when crossed */}
                        {showEliminationMode && isCrossed && !selected && (
                          <span className="absolute h-0.5 w-full bg-slate-900 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>

                      {/* Elimination control on right */}
                      {showEliminationMode && (
                        <div className="relative">
                          <div
                            onClick={() => toggleCrossOption(i)}
                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center border border-slate-400 text-slate-700 dark:border-slate-500 dark:text-slate-300 rounded-full text-sm font-bold cursor-pointer select-none ${
                              isCrossed ? "bg-slate-800 text-slate-100" : ""
                            }`}
                          >
                            {isCrossed ? "X" : String.fromCharCode(65 + i)}
                          </div>
                          {isCrossed && (
                            <span className="absolute h-0.5 w-full bg-slate-900 top-1/2 -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : isMCQ && type != "sat_reading_writing" ? (
          <div className="bg-white rounded dark:bg-slate-900 p-2 min-h-[65vh] max-h-[65vh] overflow-y-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4 bg-slate-300 dark:bg-slate-700 border-b-3 border-dashed border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-slate-800 dark:bg-slate-100 text-slate-100 dark:text-slate-800 p-2">
                  {questionNumber}
                </span>
                <span
                  className="flex cursor-pointer"
                  onClick={toggleMarkForReview}
                >
                  {currentQuestion.markedForReview ? (
                    <>
                      <BookmarkCheck className="mr-1 h-6 w-6 text-slate-900" />
                      Marked
                    </>
                  ) : (
                    <>
                      <BookmarkIcon className="mr-1 h-6 w-6" />
                      Mark for Review
                    </>
                  )}
                </span>
              </div>

              {/* ABC / elimination switch */}
              <div>
                <span
                  onClick={() => {
                    setShowEliminationMode((prev) => !prev);
                    setCrossedOptions([]);
                  }}
                  className="bg-blue-800 dark:bg-blue-100 border border-slate-800 rounded-lg text-slate-100 dark:text-slate-800 p-1 mr-2 cursor-pointer select-none"
                >
                  {showEliminationMode ? <del>ABC</del> : "ABC"}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="flex items-start justify-between mb-4">
              <h2
                className="text-base sm:text-lg"
                dangerouslySetInnerHTML={{
                  __html: qDoc.questionText || "Question missing",
                }}
              />
            </div>

            {/* Options */}
            <div className="space-y-3 mt-4">
              {qDoc.options.map((opt: any, i: number) => {
                const selected =
                  currentQuestion.answerOptionIndexes?.includes(i);
                const isCrossed = crossedOptions.includes(i);

                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-full relative">
                      <button
                        onClick={() => onOptionClick(i)}
                        disabled={isCompleted}
                        className={`w-full text-left rounded-lg border-2 px-4 py-2 flex items-start gap-3 transition ${
                          selected
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                            : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        } ${
                          isCrossed && !selected ? "opacity-60" : "opacity-100"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            selected
                              ? "bg-indigo-600 text-white"
                              : "border border-slate-400 text-slate-700 dark:border-slate-500 dark:text-slate-300"
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div
                          className="prose prose-sm dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: opt.text }}
                        />
                      </button>

                      {/* Strike-through on main option when crossed */}
                      {showEliminationMode && isCrossed && !selected && (
                        <span className="absolute h-0.5 w-full bg-slate-900 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>

                    {/* Elimination control on right */}
                    {showEliminationMode && (
                      <div className="relative">
                        <div
                          onClick={() => toggleCrossOption(i)}
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center border border-slate-400 text-slate-700 dark:border-slate-500 dark:text-slate-300 rounded-full text-sm font-bold cursor-pointer select-none ${
                            isCrossed ? "bg-slate-800 text-slate-100" : ""
                          }`}
                        >
                          {isCrossed ? "X" : String.fromCharCode(65 + i)}
                        </div>
                        {isCrossed && (
                          <span className="absolute h-0.5 w-full bg-slate-900 top-1/2 -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded dark:bg-slate-900 p-2 min-h-[65vh] max-h-[65vh] overflow-y-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4 bg-slate-300 dark:bg-slate-700 border-b-3 border-dashed border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-slate-800 dark:bg-slate-100 text-slate-100 dark:text-slate-800 p-2">
                  {questionNumber}
                </span>
                <span
                  className="flex cursor-pointer"
                  onClick={toggleMarkForReview}
                >
                  {currentQuestion.markedForReview ? (
                    <>
                      <BookmarkCheck className="mr-1 h-6 w-6 text-slate-900" />
                      Marked
                    </>
                  ) : (
                    <>
                      <BookmarkIcon className="mr-1 h-6 w-6" />
                      Mark for Review
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between mb-4">
              <h2
                className="text-base sm:text-lg"
                dangerouslySetInnerHTML={{
                  __html: qDoc.questionText || "Question missing",
                }}
              />
            </div>
            <div className="space-y-3 mt-4">
              <textarea
                value={currentQuestion.answerText || ""}
                onChange={handleTextAnswerChange}
                rows={2}
                disabled={isCompleted}
                className="min-w-xl rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-white"
                placeholder="Type your answer..."
              />
            </div>
          </div>
        )}
        <div
          className={`fixed left-0 right-0 z-30 max-w-3xl mx-auto transition-transform duration-300 ease-out ${
            isPaletteOpen ? "translate-y-0" : "translate-y-[200%]"
          } bottom-10 sm:bottom-12`}
        >
          <div className="mx-auto max-w-3xl min-h-[50vh] rounded-t-2xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 shadow-xl p-6">
            <div className="">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                  Question
                </div>
                <button
                  onClick={() => onReviewSection("section_review")}
                  className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-800 text-white dark:bg-blue-500"
                >
                  Review Section
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm mb-4 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-green-600" />
                  Answered
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-slate-700" />
                  Not Answered
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  Marked for Review
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-blue-700" />
                  Current Question
                </div>
              </div>

              <div className="grid grid-cols-8 sm:grid-cols-10 gap-3 mb-3">
                {(sectionQuestions || []).map((q: any, idx: number) => {
                  const answered =
                    (q.answerOptionIndexes &&
                      q.answerOptionIndexes.length > 0) ||
                    (q.answerText && String(q.answerText).trim().length > 0);
                  const marked = q.markedForReview;
                  const isCurrent = idx === activeQuestionIndex;

                  let stateClass = "bg-slate-700 text-slate-100";
                  if (isCurrent) {
                    stateClass = "bg-blue-700 text-white";
                  } else if (marked) {
                    stateClass =
                      "bg-yellow-400 text-slate-900 border border-yellow-700";
                  } else if (answered) {
                    stateClass = "bg-green-600 text-white";
                  }

                  return (
                    <button
                      key={q._id || idx}
                      onClick={() => goToQuestion(idx)}
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-semibold ${stateClass}`}
                      disabled={isCompleted}
                    >
                      {q.order || idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        {!mode && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t-3 border-dashed border-slate-900 dark:border-slate-700 bg-slate-300 dark:bg-slate-900/90 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <div className="grid grid-cols-3 items-center gap-3">
                <div className="flex text-lg text-slate-900 dark:text-slate-100 flex-wrap gap-2">
                  SAT TEST
                </div>

                {/* Palette toggle button */}
                <div className="flex-1 mx-auto">
                  <button
                    type="button"
                    onClick={togglePalette}
                    className="text-base  flex items-center bg-slate-800 p-1.5 px-2 rounded-lg text-slate-100 dark:text-slate-300"
                  >
                    Question {questionNumber} of {sectionTotal}
                    {isPaletteOpen ? (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  {activeQuestionIndex <= 0 ? (
                    ""
                  ) : (
                    <button
                      className="p-1.5 bg-slate-800 text-slate-100 font-semibold border-slate-200 rounded-full px-4"
                      disabled={activeQuestionIndex <= 0 || isCompleted}
                      onClick={() => {
                        goToQuestion(Math.max(0, activeQuestionIndex - 1));
                        setCrossedOptions([]);
                      }}
                    >
                      Previous
                    </button>
                  )}

                  <button
                    className="p-1.5 bg-blue-800 text-slate-100 font-semibold border-slate-200 rounded-full px-4"
                    disabled={isNextDisabled}
                    onClick={() => {
                      goNextQuestion();
                      setCrossedOptions([]);
                    }}
                  >
                    {isLastQuestionInCurrentSection ? "Review Section" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default QuestionRenderer;

interface SectionInstructionsProps {
  currentSection: {
    name?: string;
    durationMinutes?: number;
    questions: any[]; // ideally typed as AttemptQuestion[]
  } | null;
  activeSectionIndex: number;
  setCurrentScreen: (screen: "question") => void;
}

export const SectionInstructions: React.FC<SectionInstructionsProps> =
  React.memo(({ currentSection, activeSectionIndex, setCurrentScreen }) => {
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
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {sectionName} — Instructions
        </h2>
        <p className="mb-4">
          This section is <b>{timedText}</b> and contains <b>{questionCount}</b>{" "}
          questions.
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

        {/* Fixed bottom nav */}
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
  });

import { Eye, ArrowLeft, CheckCircle2 } from "lucide-react";

interface SectionReviewProps {
  currentSection: any;
  attempt: any; // or properly typed TestAttempt
  activeQuestionIndex: number;
  isLastSection: boolean;
  submitting: boolean;
  showingReviewScreen: boolean;
  filter: "all" | "answered" | "not_answered" | "flagged";
  setFilter: (filter: "all" | "answered" | "not_answered" | "flagged") => void;
  setShowingReviewScreen: (val: boolean) => void;
  setActiveQuestionIndex: (idx: number) => void;
  setCurrentScreen: (screen: "question") => void;
  saveCurrentQuestionProgress: (opts?: { silent?: boolean }) => Promise<void>;
  handleFinishSectionReview: () => Promise<void>;
}

export const SectionReview: React.FC<SectionReviewProps> = React.memo(
  ({
    currentSection,
    attempt,
    activeQuestionIndex,
    isLastSection,
    submitting,
    showingReviewScreen,
    filter,
    setFilter,
    setShowingReviewScreen,
    setActiveQuestionIndex,
    setCurrentScreen,
    saveCurrentQuestionProgress,
    handleFinishSectionReview,
  }) => {
    const total = currentSection.questions.length;
    const answeredCount = currentSection.questions.filter(
      (q) => q.isAnswered,
    ).length;

    const filtered = useMemo(() => {
      return currentSection.questions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q }) => {
          if (filter === "answered" && !q.isAnswered) return false;
          if (filter === "not_answered" && q.isAnswered) return false;
          if (filter === "flagged" && !q.markedForReview) return false;
          return true;
        });
    }, [currentSection.questions, filter]);

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="">
          {/* Left palette */}
          <aside className=" max-w-4xl flex-shrink-0 mx-auto">
            <div className="">
              <div className="py-6">
                <h4 className="text-3xl text-center font-semibold text-slate-900 dark:text-slate-50">
                  Check Your Work
                </h4>
                <div className="text-base text-center text-slate-500">
                  On the test day you will not be able to return to this section
                  review. and go to next section without time completed
                </div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-6">
                <div className="mt-3 flex gap-1 flex-wrap">
                  {(
                    ["all", "answered", "not_answered", "flagged"] as const
                  ).map((f) => {
                    const isActive = filter === f;
                    let bgClass =
                      "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200";
                    if (isActive) {
                      if (f === "answered")
                        bgClass = "bg-emerald-600 text-white";
                      else if (f === "not_answered")
                        bgClass = "bg-yellow-500 text-white";
                      else if (f === "flagged")
                        bgClass = "bg-indigo-700 text-white";
                      else bgClass = "bg-indigo-600 text-white";
                    }
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full ${bgClass}`}
                      >
                        {f === "not_answered"
                          ? "Not answered"
                          : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {filtered.map(({ q, idx }) => {
                      const isAnsweredLocal = q.isAnswered;
                      const isBookmarked = q.markedForReview;
                      return (
                        <button
                          key={`${q.question}-${idx}`}
                          onClick={() => {
                            setActiveQuestionIndex(idx);
                            setCurrentScreen("question");
                          }}
                          className={`group flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-colors ${
                            isBookmarked
                              ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10"
                              : isAnsweredLocal
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-white dark:bg-slate-900 hover:border-indigo-300"
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                              isBookmarked
                                ? "bg-purple-500 text-white"
                                : isAnsweredLocal
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {q.order || idx + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Fixed bottom actions */}

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t-3 border-dashed border-slate-900 dark:border-slate-700 bg-slate-300 dark:bg-slate-900/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex text-lg text-slate-900 dark:text-slate-100 flex-wrap gap-2">
                SAT TEST
              </div>

              <div className="flex gap-2">
                {activeQuestionIndex <= 0 ? (
                  ""
                ) : (
                  <button
                    className="p-1.5 bg-slate-800 text-slate-100 font-semibold border-slate-200 rounded-full px-4"
                    onClick={() => {
                      setActiveQuestionIndex(
                        Math.max(0, activeQuestionIndex - 1),
                      );
                      setCurrentScreen("question");
                    }}
                    disabled={activeQuestionIndex <= 0}
                  >
                    Previous
                  </button>
                )}

                <button
                  className="p-1.5 bg-blue-800 text-slate-100 font-semibold border-slate-200 rounded-full px-4"
                  onClick={handleFinishSectionReview}
                  disabled={submitting}
                >
                  {isLastSection ? "Submit" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);


