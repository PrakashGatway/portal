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
  Clock3,
  FileText,
  Accessibility,
  LockKeyhole,
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
    submitting,
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

    console.log(submitting);
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
      <div className="bg-white w-full h-full py-6 px-4 pt-5">
        <div
          className="
      max-w-7xl mx-auto
      px-3 sm:px-4
      pt-2
      space-y-4
      rounded-2xl
      border-3 border-dashed border-orange-200
      h-full
      xl:h-75vh
    
    "
        >
          {/* =========================================================
        SAT READING / WRITING
        Desktop  : Passage | Divider | Question
        Tablet/Mobile : Passage
                        Question
    ========================================================= */}
          {isMCQ && type === "sat_reading_writing" ? (
            <div
              ref={containerRef}
              className="
          grid
          grid-cols-1
          lg:grid-cols-[minmax(0,var(--left-width))_12px_minmax(0,1fr)]
          gap-3
          lg:gap-0
        "
              style={
                {
                  "--left-width": `${leftPercent}%`,
                } as React.CSSProperties
              }
            >
              {/* =====================================================
            LEFT - PASSAGE / STIMULUS
        ===================================================== */}
              <div
                className="
            min-w-0
            w-full
            rounded-xl
            bg-white
            dark:bg-slate-900
            min-h-[40vh]
            sm:min-h-[0]
            md:min-h-[0]
            lg:min-h-[60vh]
            max-h-[65vh]
            p-2
            overflow-y-auto
          "
              >
                {qDoc.stimulus ? (
                  <div
                    className="
                prose
                prose-sm
                sm:prose
                text-sm
                sm:text-base
                lg:text-lg
                dark:prose-invert
                max-w-none
              "
                    dangerouslySetInnerHTML={{
                      __html: qDoc.stimulus,
                    }}
                  />
                ) : null}
              </div>

              {/* =====================================================
            DIVIDER
            Only visible on desktop
        ===================================================== */}
              <div
                onMouseDown={onDividerDown}
                className="
            hidden
            lg:flex
            cursor-col-resize
            items-center
            justify-center
            w-3
            select-none
          "
              >
                <div className="h-full w-1 bg-[#F36D45] rounded-full" />
              </div>

              {/* =====================================================
            RIGHT - QUESTION
        ===================================================== */}
              <div
                className="
            min-w-0
            w-full
            bg-white
            rounded
            dark:bg-slate-900
            p-2
            min-h-[55vh]
            lg:min-h-[65vh]
            max-h-[65vh]
            overflow-y-auto
          "
              >
                {/* QUESTION HEADER */}
                <div
                  className="
              flex
              items-center
              justify-between
              gap-2
              mb-4
              bg-orange-50
              dark:bg-slate-700
              rounded-lg
              p-1
            "
                >
                  {/* Question number + review */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="
                  shrink-0
                  bg-[#F36D45]
                  dark:bg-slate-100
                  text-white
                  dark:text-slate-800
                  px-2.5
                  py-1.5
                  rounded-lg
                  text-sm
                  font-semibold
                "
                    >
                      {questionNumber}
                    </span>

                    <span
                      className="
                  flex
                  items-center
                  cursor-pointer
                  text-xs
                  sm:text-sm
                  whitespace-nowrap
                "
                      onClick={toggleMarkForReview}
                    >
                      {currentQuestion.markedForReview ? (
                        <>
                          <BookmarkCheck className="mr-1 h-5 w-5 text-slate-900" />
                          Marked
                        </>
                      ) : (
                        <>
                          <BookmarkIcon className="mr-1 h-5 w-5" />
                          Mark for Review
                        </>
                      )}
                    </span>
                  </div>

                  {/* ABC elimination */}
                  <div className="shrink-0">
                    <span
                      onClick={() => {
                        setShowEliminationMode((prev) => !prev);
                        setCrossedOptions([]);
                      }}
                      className="
                  inline-flex
                  items-center
                  justify-center
                  bg-[#F36D45]
                  dark:bg-blue-100
                  rounded-lg
                  text-white
                  dark:text-slate-800
                  px-2
                  py-1
                  text-xs
                  sm:text-sm
                  cursor-pointer
                  select-none
                "
                    >
                      {showEliminationMode ? <del>ABC</del> : "ABC"}
                    </span>
                  </div>
                </div>

                {/* QUESTION TEXT */}
                <div className="flex items-start justify-between mb-4">
                  <h2
                    className="
                text-sm
                sm:text-base
                lg:text-lg
                leading-relaxed
                min-w-0
              "
                    dangerouslySetInnerHTML={{
                      __html: qDoc.questionText || "Question missing",
                    }}
                  />
                </div>

                {/* OPTIONS */}
                <div className="space-y-3 mt-4">
                  {qDoc.options.map((opt: any, i: number) => {
                    const selected =
                      currentQuestion.answerOptionIndexes?.includes(i);

                    const isCrossed = crossedOptions.includes(i);

                    return (
                      <div
                        key={i}
                        className="
                    flex
                    items-center
                    gap-2
                    min-w-0
                  "
                      >
                        {/* OPTION */}
                        <div className="w-full min-w-0 relative">
                          <button
                            onClick={() => onOptionClick(i)}
                            disabled={isCompleted}
                            className={`
                        w-full
                        text-left
                        rounded-2xl
                        border-2
                        px-3
                        sm:px-4
                        py-2
                        flex
                        items-start
                        gap-2
                        sm:gap-3
                        transition
                        min-w-0
                        ${
                          selected
                            ? "border-[#F36D45] bg-orange-50 dark:bg-indigo-900/30 shadow-sm"
                            : "border-orange-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-800"
                        }
                        ${isCrossed && !selected ? "opacity-60" : "opacity-100"}
                      `}
                          >
                            {/* A/B/C/D */}
                            <div
                              className={`
                          flex
                          h-7
                          w-7
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          text-xs
                          font-bold
                          ${
                            selected
                              ? "bg-[#F36D45] text-white"
                              : "border border-orange-400 text-[#F36D45] dark:border-slate-500 dark:text-slate-300"
                          }
                        `}
                            >
                              {String.fromCharCode(65 + i)}
                            </div>

                            {/* OPTION TEXT */}
                            <div
                              className="
                          prose
                          prose-sm
                          dark:prose-invert
                          max-w-none
                          min-w-0
                          break-words
                        "
                              dangerouslySetInnerHTML={{
                                __html: opt.text,
                              }}
                            />
                          </button>

                          {/* STRIKE THROUGH */}
                          {showEliminationMode && isCrossed && !selected && (
                            <span
                              className="
                            absolute
                            h-0.5
                            w-full
                            bg-slate-900
                            top-1/2
                            -translate-y-1/2
                            pointer-events-none
                          "
                            />
                          )}
                        </div>

                        {/* ELIMINATION BUTTON */}
                        {showEliminationMode && (
                          <div className="relative shrink-0">
                            <div
                              onClick={() => toggleCrossOption(i)}
                              className={`
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          border
                          border-orange-400
                          text-[#F36D45]
                          dark:border-slate-500
                          dark:text-slate-300
                          rounded-full
                          text-sm
                          font-bold
                          cursor-pointer
                          select-none
                          ${isCrossed ? "bg-[#F36D45] text-white" : ""}
                        `}
                            >
                              {isCrossed ? "X" : String.fromCharCode(65 + i)}
                            </div>

                            {isCrossed && (
                              <span
                                className="
                            absolute
                            h-0.5
                            w-full
                            bg-black
                            top-1/2
                            -translate-y-1/2
                            pointer-events-none
                          "
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : isMCQ && type !== "sat_reading_writing" ? (
            /* =========================================================
         OTHER MCQ QUESTIONS
         Always single column
      ========================================================= */
            <div
              className="
          bg-white
          rounded
          dark:bg-slate-900
          p-2
          min-h-[55vh]
          lg:min-h-[65vh]
          max-h-[65vh]
          overflow-y-auto
        "
            >
              {/* QUESTION HEADER */}
              <div
                className="
            flex
            items-center
            justify-between
            gap-2
            mb-4
            bg-orange-50
            dark:bg-slate-700
            rounded-lg
            p-1
          "
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="
                shrink-0
                bg-[#F36D45]
                dark:bg-slate-100
                text-white
                dark:text-slate-800
                px-2.5
                py-1.5
                rounded-lg
                text-sm
                font-semibold
              "
                  >
                    {questionNumber}
                  </span>

                  <span
                    className="
                flex
                items-center
                cursor-pointer
                text-xs
                sm:text-sm
              "
                    onClick={toggleMarkForReview}
                  >
                    {currentQuestion.markedForReview ? (
                      <>
                        <BookmarkCheck className="mr-1 h-5 w-5 text-slate-900" />
                        Marked
                      </>
                    ) : (
                      <>
                        <BookmarkIcon className="mr-1 h-5 w-5" />
                        Mark for Review
                      </>
                    )}
                  </span>
                </div>

                <div className="shrink-0">
                  <span
                    onClick={() => {
                      setShowEliminationMode((prev) => !prev);
                      setCrossedOptions([]);
                    }}
                    className="
                inline-flex
                bg-[#F36D45]
                dark:bg-blue-100
                rounded-lg
                text-white
                dark:text-slate-800
                px-2
                py-1
                text-xs
                cursor-pointer
                select-none
              "
                  >
                    {showEliminationMode ? <del>ABC</del> : "ABC"}
                  </span>
                </div>
              </div>

              {/* QUESTION */}
              <div className="flex items-start justify-between mb-4">
                <h2
                  className="
              text-sm
              sm:text-base
              lg:text-lg
              !font-light
              leading-relaxed
            "
                  dangerouslySetInnerHTML={{
                    __html: qDoc.questionText || "Question missing",
                  }}
                />
              </div>

              {/* STIMULUS */}
              {qDoc.stimulus ? (
                <div
                  className="
              prose
              prose-sm
              sm:prose
              text-sm
              sm:text-base
              lg:text-lg
              dark:prose-invert
              max-w-none
            "
                  dangerouslySetInnerHTML={{
                    __html: qDoc.stimulus,
                  }}
                />
              ) : null}

              {/* OPTIONS */}
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
                          className={`
                      w-full
                      text-left
                      rounded-lg
                      border-2
                      px-3
                      sm:px-4
                      py-2
                      flex
                      items-start
                      gap-2
                      sm:gap-3
                      transition
                      ${
                        selected
                          ? "border-[#F36D45] bg-orange-50 dark:bg-indigo-900/30 shadow-sm"
                          : "border-orange-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-800"
                      }
                      ${isCrossed && !selected ? "opacity-60" : "opacity-100"}
                    `}
                        >
                          <div
                            className={`
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        text-xs
                        font-bold
                        ${
                          selected
                            ? "bg-[#F36D45] text-white"
                            : "border border-orange-400 text-slate-700 dark:border-slate-500 dark:text-slate-300"
                        }
                      `}
                          >
                            {String.fromCharCode(65 + i)}
                          </div>

                          <div
                            className="
                        prose
                        prose-sm
                        dark:prose-invert
                        min-w-0
                        break-words
                      "
                            dangerouslySetInnerHTML={{
                              __html: opt.text,
                            }}
                          />
                        </button>

                        {showEliminationMode && isCrossed && !selected && (
                          <span
                            className="
                          absolute
                          h-0.5
                          w-full
                          bg-slate-900
                          top-1/2
                          -translate-y-1/2
                          pointer-events-none
                        "
                          />
                        )}
                      </div>

                      {showEliminationMode && (
                        <div className="relative shrink-0">
                          <div
                            onClick={() => toggleCrossOption(i)}
                            className={`
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        border
                        border-orange-400
                        text-[#F36D45]
                        dark:border-slate-500
                        dark:text-slate-300
                        rounded-full
                        text-sm
                        font-bold
                        cursor-pointer
                        select-none
                        ${isCrossed ? "bg-orange-500 text-white" : ""}
                      `}
                          >
                            {isCrossed ? "X" : String.fromCharCode(65 + i)}
                          </div>

                          {isCrossed && (
                            <span
                              className="
                          absolute
                          h-0.5
                          w-full
                          bg-orange-900
                          top-1/2
                          -translate-y-1/2
                          pointer-events-none
                        "
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* =========================================================
         NON MCQ QUESTION
      ========================================================= */
            <div
              className="
          bg-white
          rounded
          dark:bg-slate-900
          p-2
          min-h-[55vh]
          lg:min-h-[65vh]
          max-h-[65vh]
          overflow-y-auto
        "
            >
              {/* HEADER */}
              <div
                className="
            flex
            items-center
            justify-between
            mb-4
            bg-orange-50
            dark:bg-slate-700
            rounded-lg
            p-1
          "
              >
                <div className="flex items-center gap-2">
                  <span
                    className="
                bg-[#F36D45]
                rounded-lg
                dark:bg-slate-100
                text-white
                dark:text-slate-800
                px-2.5
                py-1.5
                text-sm
                font-semibold
              "
                  >
                    {questionNumber}
                  </span>

                  <span
                    className="
                flex
                items-center
                cursor-pointer
                text-xs
                sm:text-sm
              "
                    onClick={toggleMarkForReview}
                  >
                    {currentQuestion.markedForReview ? (
                      <>
                        <BookmarkCheck className="mr-1 h-5 w-5 text-slate-900" />
                        Marked
                      </>
                    ) : (
                      <>
                        <BookmarkIcon className="mr-1 h-5 w-5" />
                        Mark for Review
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* QUESTION */}
              <div className="flex items-start justify-between mb-4">
                <h2
                  className="
              text-sm
              sm:text-base
              lg:text-lg
              leading-relaxed
            "
                  dangerouslySetInnerHTML={{
                    __html: qDoc.questionText || "Question missing",
                  }}
                />
              </div>

              {/* STIMULUS */}
              {qDoc.stimulus ? (
                <div
                  className="
              prose
              prose-sm
              sm:prose
              text-sm
              sm:text-base
              lg:text-lg
              dark:prose-invert
              max-w-none
            "
                  dangerouslySetInnerHTML={{
                    __html: qDoc.stimulus,
                  }}
                />
              ) : null}

              {/* TEXT ANSWER */}
              <div className="space-y-3 mt-4">
                <textarea
                  value={currentQuestion.answerText || ""}
                  onChange={handleTextAnswerChange}
                  rows={3}
                  disabled={isCompleted}
                  className="
              w-full
              min-w-0
              rounded-lg
              border
              border-slate-300
              dark:border-slate-600
              px-3
              py-2
              text-sm
              sm:text-base
              focus:ring-2
              focus:ring-indigo-500
              focus:border-indigo-500
              dark:bg-slate-800
              dark:text-white
              resize-y
            "
                  placeholder="Type your answer..."
                />
              </div>
            </div>
          )}

          {/* =========================================================
        QUESTION PALETTE
    ========================================================= */}
          <div
            className={`
        fixed
        left-0
        right-0
        z-0
        max-w-3xl
        mx-auto
        transition-transform
        duration-300
        ease-out
        ${isPaletteOpen ? "translate-y-0" : "translate-y-[200%]"}
        bottom-10
        sm:bottom-12
      `}
          >
            <div
              className="
          mx-auto
          max-w-3xl
          min-h-[40vh]
          sm:min-h-[50vh]
          rounded-t-2xl
          border
          border-slate-300
          dark:border-slate-700
          bg-slate-200
          dark:bg-slate-900
          shadow-xl
          p-4
          sm:p-6
        "
            >
              {/* PALETTE HEADER */}
              <div className="flex items-center justify-between mb-4 gap-2">
                <div
                  className="
              font-semibold
              text-base
              sm:text-lg
              text-slate-800
              dark:text-slate-100
            "
                >
                  Question
                </div>

                <button
                  onClick={() => onReviewSection("section_review")}
                  className="
              text-xs
              sm:text-sm
              font-semibold
              px-3
              py-1
              rounded-full
              bg-[#f36d45]
              text-white
              dark:bg-blue-500
            "
                >
                  Review Section
                </button>
              </div>

              {/* LEGEND */}
              <div
                className="
            flex
            flex-wrap
            gap-x-4
            gap-y-2
            text-xs
            sm:text-sm
            mb-4
            text-slate-700
            dark:text-slate-300
          "
              >
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
                  <span className="h-3 w-3 rounded-full bg-[#f36d45]" />
                  Current Question
                </div>
              </div>

              {/* QUESTION NUMBERS */}
              <div
                className="
            grid
            grid-cols-5
            sm:grid-cols-8
            md:grid-cols-10
            gap-2
            sm:gap-3
            mb-3
          "
              >
                {(sectionQuestions || []).map((q: any, idx: number) => {
                  const answered =
                    (q.answerOptionIndexes &&
                      q.answerOptionIndexes.length > 0) ||
                    (q.answerText && String(q.answerText).trim().length > 0);

                  const marked = q.markedForReview;

                  const isCurrent = idx === activeQuestionIndex;

                  let stateClass = "bg-slate-700 text-slate-100";

                  if (isCurrent) {
                    stateClass = "bg-[#f36d45] text-white";
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
                      className={`
                    h-9
                    w-9
                    sm:h-10
                    sm:w-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-sm
                    sm:text-base
                    font-semibold
                    ${stateClass}
                  `}
                      disabled={isCompleted}
                    >
                      {q.order || idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================
        BOTTOM BAR
    ========================================================= */}
          {!mode && (
            <div
              className="
          fixed
          bottom-4
          left-0
          right-0
          z-40
          dark:border-slate-700
          bg-orange-50
          dark:bg-slate-900/90
          backdrop-blur
        "
            >
              <div
                className="
            mx-auto
            max-w-7xl
            px-3
            sm:px-4
            py-2
            sm:py-3
          "
              >
                <div
                  className="
              grid
              grid-cols-1
              sm:grid-cols-3
              items-center
              gap-2
              sm:gap-3
            "
                >
                  {/* TEST TITLE */}
                  <div
                    className="
                hidden
                sm:flex
                text-sm
                lg:text-lg
                text-slate-900
                dark:text-slate-100
                flex-wrap
                gap-2
              "
                  >
                    SAT TEST
                  </div>

                  {/* PALETTE TOGGLE */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={togglePalette}
                      className="
                  text-sm
                  sm:text-base
                  flex
                  items-center
                  bg-[#F36D45]
                  p-2
                  px-4
                  rounded-3xl
                  text-white
                  dark:text-slate-300
                "
                    >
                      Question {questionNumber} of {sectionTotal}
                      {isPaletteOpen ? (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* NEXT/PREVIOUS */}
                  <div
                    className="
                flex
                justify-center
                sm:justify-end
                gap-2
              "
                  >
                    {activeQuestionIndex <= 0 ? (
                      ""
                    ) : (
                      <button
                        className="
                    p-1.5
                    bg-[#F36D45]
                    text-white
                    font-semibold
                    rounded-full
                    px-3
                    sm:px-4
                    text-xs
                    sm:text-sm
                  "
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
                      className={`
                  p-1.5
                  text-white
                  font-semibold
                  rounded-full
                  px-3
                  sm:px-4
                  text-xs
                  sm:text-sm
                  ${submitting ? "bg-orange-400" : "bg-[#F36D45]"}
                `}
                      disabled={submitting}
                      onClick={() => {
                        goNextQuestion();
                        setCrossedOptions([]);
                      }}
                    >
                      {isLastQuestionInCurrentSection
                        ? "Review Section"
                        : "Next"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM GRADIENT */}
        <div
          className="
      h-[16px]
      fixed
      bottom-0
      w-full
      bg-gradient-to-r
      from-[#fff1dc]
      via-[#ffd19f]
      to-[#ff947d]
    "
        />
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
    timerSecondsLeft,
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
              <div className="rounded-2xl bg-white dark:bg-slate-900/60 border-3 border-dashed border-orange-200 dark:border-slate-700 p-6">
                <div className="mt-3 flex gap-1 flex-wrap">
                  {(
                    ["all", "answered", "not_answered", "flagged"] as const
                  ).map((f) => {
                    const isActive = filter === f;
                    let bgClass =
                      "bg-orange-50 dark:bg-slate-800 text-[#F36D45] dark:text-slate-200";
                    if (isActive) {
                      if (f === "answered") bgClass = "bg-[#F36D45] text-white";
                      else if (f === "not_answered")
                        bgClass = "bg-[#F36D45] text-white";
                      else if (f === "flagged")
                        bgClass = "bg-[#F36D45] text-white";
                      else bgClass = "bg-[#F36D45] text-white";
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
                            if (timerSecondsLeft === 0) {
                              return;
                            }

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
                                  : "bg-orange-50 text-slate-700"
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
        <div className="fixed bottom-0 left-0 right-0 h-[16px] w-full bg-gradient-to-r from-[#fff1dc] via-[#ffd19f] to-[#ff947d]" />

        <div className="fixed bottom-4 left-0 right-0 z-40  dark:border-slate-700 bg-orange-50 dark:bg-slate-900/90 backdrop-blur">
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
                    className="p-1.5 bg-[#F36D45] text-slate-100 font-semibold border-slate-200 rounded-full px-4"
                    onClick={() => {
                      if (timerSecondsLeft === 0) {
                        return;
                      }
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
                  className="p-1.5 bg-[#F36D45] text-slate-100 font-semibold border-slate-200 rounded-full px-4"
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

export const BreakComponent = ({
  setBreakSeconds,
  breakSeconds,
  setCurrentScreen,
}) => {
  return (
    <div className="relative xl:h-164  w-full overflow-hidden bg-[#17233D] text-white">
      {/* Main Content */}
      <div className="relative z-10 flex  w-full items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16 mx-auto">
          
          {/* ================= LEFT : TIMER ================= */}
          <div className="flex flex-col items-center lg:items-center">
            <div className="w-full max-w-[320px] rounded-xl border border-white/25 bg-white/[0.04] px-8 py-7 backdrop-blur-sm">
              
              <p className="text-center text-sm font-semibold text-white/90">
                Remaining Break Time:
              </p>

              {/* Timer */}
              <div className="mt-2 text-center">
                <div className="text-6xl font-medium tracking-tight text-white sm:text-7xl">
                  {String(Math.floor(breakSeconds / 60)).padStart(2, "0")}:
                  {String(breakSeconds % 60).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Resume / Continue Button */}
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  "Are you sure you want to skip the break?"
                );

                if (confirmed) {
                  setBreakSeconds(0);
                  setCurrentScreen("question");
                }
              }}
              className="mt-6 rounded-full bg-[#F36D45] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#F36D45]/20 transition-all duration-200 hover:bg-[#e85f38] hover:shadow-[#F36D45]/30 focus:outline-none focus:ring-2 focus:ring-[#F36D45]/50"
            >
              Resume Testing
            </button>
          </div>

          {/* ================= RIGHT : INFORMATION ================= */}
          <div className="w-full max-w-2xl mt-20">
            
            {/* Heading */}
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Practice Test Break
            </h1>

            {/* Description */}
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
              You can resume this practice test as soon as you're ready to
              move on. On test day, you'll wait until the clock counts down.
              Read below to see how breaks work on test day.
            </p>

            {/* Divider */}
            <div className="my-7 h-px w-full bg-white/20" />

            {/* Break Rules */}
            <div>
              <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                Take a Break: Do Not Close
                <br className="hidden sm:block" />
                Your Device
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                After the break, a{" "}
                <span className="font-semibold text-white">
                  Resume Testing Now
                </span>{" "}
                button will appear and you'll select the next section.
              </p>
            </div>

            {/* Rules */}
            <div className="mt-7">
              <h3 className="text-sm font-bold text-white sm:text-base">
                Follow these rules during the break:
              </h3>

              <ol className="mt-4 space-y-3 text-sm text-white/80 sm:text-base">
                <li className="flex gap-3">
                  <span className="font-bold text-white">1.</span>
                  <span>
                    Do not disturb students who are still testing.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span className="font-bold text-white">2.</span>
                  <span>
                    Do not exit the app or close your laptop.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-[#fff1dc] via-[#ffd19f] to-[#ff947d]" />
    </div>
  );
};

interface TestInformationProps {
  onStart: () => void;
}

export const TestInformation = ({ onStart }: TestInformationProps) => {
  const instructions = [
    {
      icon: Clock3,
      title: "Timing",
      description:
        "Practice tests are timed, but you can pause them. To continue on another device, you have to start over. We delete incomplete practice tests after 90 days.",
    },
    {
      icon: FileText,
      title: "Scores",
      description:
        "When you finish the practice test, go to My Practice to see your scores and get personalized study tips.",
    },
    {
      icon: Accessibility,
      title: "Assistive Technology (AT)",
      description:
        "Be sure to practice with any AT you use for testing. If you configure your AT settings here, you may need to repeat this step on test day.",
    },
    {
      icon: LockKeyhole,
      title: "No Device Lock",
      description:
        "We don't lock your device during practice. On test day, you'll be blocked from using other programs or apps.",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl font-medium bg-white px-6 py-6 sm:px-8 border-3 border-gray-300 mt-10">
      <div className="space-y-7">
        {instructions.map((item, index) => {
          const Icon = item.icon;

          return (
            <div key={index} className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="
                  mt-0.5
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#f36d45]/10
                "
              >
                <Icon
                  className="h-[18px] w-[18px] text-[#f36d45]"
                  strokeWidth={1.8}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-6 text-[#24344D]">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-sm leading-6 text-[#4B5563]">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onStart}
          className="rounded-xl bg-[#f36d45] px-6 py-3 mt-4 font-semibold text-white"
        >
          Start Test
        </button>
      </div>
    </div>
  );
};

interface ModuleCompleteLoaderProps {
  currentScreen: string;
  isCompleted: boolean;
  isLastSection: boolean;
}

 export const ModuleCompleteLoader=({
  currentScreen,
  isCompleted,
  isLastSection,
}: ModuleCompleteLoaderProps)=> {
  console.log(isCompleted,"cc")
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center text-center">
        {/* Heading */}
        <h1 className="text-[28px] font-normal tracking-tight text-[#315da8] sm:text-[32px]">
          This {isLastSection === true ? "Test" : "Module"} Is Over
        </h1>

        {/* Messages */}
        <div className="mt-6 space-y-3 text-[18px] leading-relaxed text-[#243b68] sm:text-[20px]">
          <p>All your work has been saved.</p>

          <p>You’ll move on automatically in just a moment.</p>

          <p>Do not refresh this page or quit the app.</p>
        </div>

        {/* Loader */}
        <div className="mt-10">
          <div className="animate-spin relative h-[55px] w-[55px]">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={index}
                className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#315da8]"
                style={{
                  transform: `rotate(${index * 45}deg) translateY(-23px)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}




import { Upload } from "lucide-react";

export const ModuleCompleteSubmitLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return Math.min(prev + Math.floor(Math.random() * 5) + 1, 95);
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4">
      <div className="w-full max-w-2xl text-center">

        <h1 className="text-3xl font-medium tracking-tight text-[#315da8] sm:text-4xl">
          Digital Practice Is Over: Stand By!
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-6 text-gray-600 sm:text-lg">
          All your work has been saved, and we're
          <br />
          uploading it now. Do not refresh this page or
          <br />
          quit the app.
        </p>

        {/* Progress */}
        <div className="mt-10 flex flex-col items-center">

          <div className="relative h-20 w-20">
            <svg
              className="h-20 w-20 -rotate-90"
              viewBox="0 0 80 80"
            >
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="5"
                strokeDasharray="2 8"
                strokeLinecap="round"
              />

              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="#315da8"
                strokeWidth="5"
                strokeDasharray="2 8"
                strokeLinecap="round"
                strokeDashoffset={188 - (188 * progress) / 100}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {progress}%
              </span>
            </div>
          </div>

          {/* Upload illustration */}
          <div className="mt-8 flex h-32 w-32 items-center justify-center">
            <Upload
              className="h-24 w-24 text-[#315da8]"
              strokeWidth={1.3}
            />
          </div>

        </div>
      </div>
    </div>
  );
};


