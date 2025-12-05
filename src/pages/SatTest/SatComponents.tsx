import React, { useMemo } from "react";
import { Calculator, Flag, MoreVertical, Save, UserX2 } from "lucide-react";
import Button from "../../components/ui/button/Button";

interface QuestionRendererProps {
  qDoc: any | null;
  currentQuestion: any; // Ideally typed via AttemptQuestion
  isCompleted: boolean;
  handleOptionClick: (idx: number) => void;
  handleTextAnswerChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  toggleMarkForReview: () => void;
  updateCurrentQuestion: (patch: Partial<any>) => void; // Replace `any` with AttemptQuestion if typed
  saveCurrentQuestionProgress: (opts?: { silent?: boolean }) => Promise<void>;
  activeQuestionIndex: number;
  sectionTotal: number;
  isLastQuestionInCurrentSection: boolean;
  isNextDisabled: boolean;
  goToQuestion: (idx: number) => Promise<void>;
  goNextQuestion: () => Promise<void>;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = React.memo(
  ({
    qDoc,
    currentQuestion,
    isCompleted,
    handleOptionClick,
    handleTextAnswerChange,
    toggleMarkForReview,
    updateCurrentQuestion,
    saveCurrentQuestionProgress,
    activeQuestionIndex,
    sectionTotal,
    isLastQuestionInCurrentSection,
    isNextDisabled,
    goToQuestion,
    goNextQuestion,
  }) => {
    const questionNumber = currentQuestion.order || activeQuestionIndex + 1;

    // 👇 Render only the question content (no footer controls)
    const renderQuestionContent = useMemo(() => {
      if (!qDoc || !currentQuestion) return null;

      const type = qDoc.questionType;

      if (type === "gre_analytical_writing") {
        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Type your essay into the provided editor.
            </div>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                <div
                  className="dark:prose-invert max-w-none text-lg text-slate-900 dark:text-slate-100 mb-4"
                  dangerouslySetInnerHTML={{ __html: qDoc.stimulus || "" }}
                />
                <div
                  className="text-lg text-justify dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
                />
              </div>
              <textarea
                className="w-full min-h-[360px] rounded border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm"
                value={currentQuestion.answerText || ""}
                onChange={handleTextAnswerChange}
                disabled={isCompleted}
              />
            </div>
          </>
        );
      }

      // 🟢 Add other question types similarly (copy from original)
      // You can break these further into sub-components later (e.g., TextCompletionQuestion, etc.)

      // Example for one more:
      if (type === "gre_verbal_reading_comp") {
        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Choose the option that best answers the question.
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: qDoc.stimulus || "" }}
                />
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                  <div dangerouslySetInnerHTML={{ __html: qDoc.questionText }} />
                </div>
                <div className="space-y-2">
                  {qDoc.options?.map((opt, idx) => {
                    const selected = currentQuestion.answerOptionIndexes.includes(idx);
                    const label = opt.label || String.fromCharCode("A".charCodeAt(0) + idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={isCompleted}
                        className={`flex items-start w-full gap-3 rounded border-2 px-4 py-2 text-left text-sm transition ${selected
                          ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                          }`}
                      >
                        <span className="mt-0.5 text-xs font-semibold">{label}.</span>
                        <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );
      }

      if (type === "gre_verbal_text_completion") {
        const blanksFromTypeSpecific: number | undefined =
          (qDoc as any).typeSpecific?.blanks;

        const blanksFromText =
          (qDoc.questionText.match(/\{\{\d+\}\}/g) || []).length;

        const blanksCount = blanksFromTypeSpecific || blanksFromText || 1;

        // ---- 2. Group options by blankIndex ----
        type TextCompletionOption = {
          blankIndex: number;
          label?: string;
          text: string;
        };

        const rawOptions: TextCompletionOption[] =
          ((qDoc as any).typeSpecific?.options as TextCompletionOption[]) || [];

        // grouped[blankIndex] = [{ option, globalIndex }, ...]
        const grouped: {
          blankIndex: number;
          label?: string;
          text: string;
          globalIndex: number;
        }[][] = Array.from({ length: blanksCount }, () => []);

        rawOptions.forEach((opt, globalIndex) => {
          const idx =
            typeof opt.blankIndex === "number" && opt.blankIndex >= 0
              ? opt.blankIndex
              : 0;
          if (idx < blanksCount) {
            grouped[idx].push({ ...opt, globalIndex });
          }
        });

        // ---- 3. Parse current answers (blankIndex -> globalOptionIndex) ----
        const answers: Record<number, number> = (() => {
          try {
            return currentQuestion.answerText
              ? JSON.parse(currentQuestion.answerText)
              : {};
          } catch {
            return {};
          }
        })();

        // ---- 4. Click handler for a blank's option ----
        const handleBlankOptionClick = (blankIndex: number, globalIndex: number) => {
          if (isCompleted) return;

          const next = { ...answers, [blankIndex]: globalIndex };

          // all blanks must be filled
          const allFilled =
            blanksCount > 0 &&
            Array.from({ length: blanksCount }, (_, i) => next[i] !== undefined).every(
              Boolean
            );

          updateCurrentQuestion({
            answerText: JSON.stringify(next),
            isAnswered: allFilled,
          });
        };

        const roman = ["(i)_____", "(ii)_____", "(iii)_____", "(iv)_____", "(v)_____"];

        const renderedQuestionHtml = qDoc.questionText.replace(
          /\{\{(\d+)\}\}/g,
          (_match, numStr) => {
            const idx = parseInt(numStr, 10) - 1;
            return roman[idx] || _match;
          }
        );

        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">For each blank select one word from each column that best completes the
              sentence..</div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 mb-6">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedQuestionHtml }}
              />
            </div>
            <div
              className="flex justify-center gap-2"
            >
              {Array.from({ length: blanksCount }).map((_, blankIdx) => (
                <div
                  key={blankIdx}
                  className="rounded-xl min-w-[200px] bg-slate-50 dark:bg-slate-900/60 p-3"
                >
                  <div className="text-xs font-semibold text-center mb-2 uppercase tracking-wide text-slate-600">
                    Blank {roman[blankIdx] || `(${blankIdx + 1})`}
                  </div>

                  <div className="space-y-1">
                    {grouped[blankIdx].map(({ label, text, globalIndex }, optIdx) => {
                      const optionLabel =
                        label || String.fromCharCode("A".charCodeAt(0) + optIdx);
                      const selected = answers[blankIdx] === globalIndex;

                      return (
                        <button
                          key={globalIndex}
                          onClick={() => handleBlankOptionClick(blankIdx, globalIndex)}
                          disabled={isCompleted}
                          className={`flex w-full items-start gap-3 rounded border-2 px-3 py-2 text-left text-sm transition ${selected
                            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            }`}
                        >
                          <span className="mt-0.5 text-xs font-semibold">
                            {optionLabel}
                          </span>
                          <span
                            className="flex-1"
                            dangerouslySetInnerHTML={{ __html: text }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      }

      if (type === "gre_verbal_sentence_equivalence") {
        const selectedSet = new Set(currentQuestion.answerOptionIndexes || []);

        const toggleEquiv = (idx: number) => {
          if (isCompleted) return;
          const nextSet = new Set(selectedSet);
          if (nextSet.has(idx)) nextSet.delete(idx);
          else {
            if (nextSet.size >= 2) {
              const first = nextSet.values().next().value;
              nextSet.delete(first);
              nextSet.add(idx);
            } else {
              nextSet.add(idx);
            }
          }
          updateCurrentQuestion({ answerOptionIndexes: Array.from(nextSet), isAnswered: (nextSet.size === 2) });
        };

        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">Select exactly two answer choices that best complete the sentence .</div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                <div dangerouslySetInnerHTML={{ __html: qDoc.questionText }} />
              </div>

              <div className="space-y-2">
                {qDoc.options?.map((opt, idx) => {
                  const selected = selectedSet.has(idx);
                  const label = opt.label || String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleEquiv(idx)}
                      className={`flex w-full items-start gap-3 rounded border-2 px-4 py-2 text-left text-sm transition ${selected
                        ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                        }`}
                      disabled={isCompleted}
                    >
                      <span className="mt-0.5 text-xs font-semibold">{label}.</span>
                      <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        );
      }

      if (type === "gre_verbal_reading_multi") {
        const mainSelected = new Set<number>(currentQuestion.answerOptionIndexes || []);

        const toggleMainOption = (idx: number) => {
          if (isCompleted) return;
          const set = new Set<number>(currentQuestion.answerOptionIndexes || []);
          if (set.has(idx)) set.delete(idx);
          else set.add(idx);
          const arr = Array.from(set);
          updateCurrentQuestion({
            answerOptionIndexes: arr,
            isAnswered: arr.length > 0,
          });
        };

        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Consider each of the choices separately and select all that apply.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
                <div dangerouslySetInnerHTML={{ __html: qDoc.stimulus || "" }} />
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                  <div dangerouslySetInnerHTML={{ __html: qDoc.questionText }} />
                </div>

                <div className="space-y-2">
                  {qDoc.options?.map((opt, idx) => {
                    const selected = mainSelected.has(idx);
                    const label = opt.label || String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleMainOption(idx)}
                        disabled={isCompleted}
                        className={`flex items-start w-full gap-3 rounded border-2 px-4 py-2 text-left text-sm transition ${selected
                          ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                          }`}
                      >
                        <span className="mt-0.5 text-xs font-semibold">{label}.</span>
                        <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );
      }

      if (type === "gre_quantitative") {
        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Choose the option that best answers the question.
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                <div dangerouslySetInnerHTML={{ __html: qDoc.questionText }} />
              </div>


              <div className="space-y-2 ml-1 mt-2">
                {qDoc.stimulus && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4">
                    <div dangerouslySetInnerHTML={{ __html: qDoc.stimulus }} />
                  </div>
                )}
                {qDoc.options?.map((opt, idx) => {
                  const selected = currentQuestion.answerOptionIndexes.includes(idx);
                  const label = opt.label || String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(idx)}
                      disabled={isCompleted}
                      className={`flex w-full items-start gap-3 rounded border-2 px-4 py-2 text-left text-sm transition ${selected
                        ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                        }`}
                    >
                      <span className="mt-0.5 text-xs font-semibold">{label}.</span>
                      <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </>

        );
      }

      if (type === "gre_quantitative_multi") {
        const mainSelected = new Set<number>(currentQuestion.answerOptionIndexes || []);

        const toggleMainOption = (idx: number) => {
          if (isCompleted) return;
          const set = new Set<number>(currentQuestion.answerOptionIndexes || []);
          if (set.has(idx)) set.delete(idx);
          else set.add(idx);
          const arr = Array.from(set);
          updateCurrentQuestion({
            answerOptionIndexes: arr,
            isAnswered: arr.length > 0,
          });
        };

        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Consider each of the choices separately and select all that apply.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
                <div dangerouslySetInnerHTML={{ __html: qDoc.stimulus || "" }} />
                <div dangerouslySetInnerHTML={{ __html: qDoc.questionText }} />

              </div>

              <div className="space-y-4">

                <div className="space-y-2">
                  {qDoc.options?.map((opt, idx) => {
                    const selected = mainSelected.has(idx);
                    const label = opt.label || String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleMainOption(idx)}
                        disabled={isCompleted}
                        className={`flex items-start w-full gap-3 rounded border-2 px-4 py-2 text-left text-sm transition ${selected
                          ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                          }`}
                      >
                        <span className="mt-0.5 text-xs font-semibold">{label}.</span>
                        <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );
      }

      if (type === "gre_quantitative_value") {
        const value = currentQuestion.answerText ?? "";

        const onChangeValue = (val: string) => {
          updateCurrentQuestion({ answerText: val, isAnswered: val.trim() !== "" });
        };

        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Enter the answer in the blank.
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4" dangerouslySetInnerHTML={{ __html: qDoc.questionText }} />
              <div className="max-w-sm mt-4">
                <input
                  inputMode="decimal"
                  className="w-full rounded border px-3 py-2 bg-white dark:bg-slate-800"
                  value={value}
                  onChange={(e) => onChangeValue(e.target.value)}
                  disabled={isCompleted}
                  placeholder="Enter your answer..."
                />
              </div>
            </div>
          </>
        );
      }

      if (qDoc.options && qDoc.options.length) {
        return (
          <>
            <div className="p-4 bg-gray-300 dark:bg-gray-700 text-red-700 dark:text-red-100 mb-3 mx-auto">
              Choose the option that best answers the question.
            </div>
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
                      className={`flex w-full items-start gap-3 rounded border-2 px-4 py-2 text-left text-sm transition ${selected
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
          </>

        );
      }
      // ➕ Add all other types (text completion, sentence equivalence, etc.)

      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: qDoc.questionText }}
        />
      );
    }, [
      qDoc,
      currentQuestion,
      isCompleted,
      handleOptionClick,
      handleTextAnswerChange,
      updateCurrentQuestion,
    ]);

    if (!qDoc || !currentQuestion) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="font-semibold">Unable to load question</h2>
            </div>
            <p>Please try reloading or contact support.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Question body */}
        <div className="bg-white dark:bg-slate-900">{renderQuestionContent}</div>

        {/* Fixed bottom controls */}
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
                  disabled={isCompleted}
                >
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>

              <div className="text-slate-800 dark:text-slate-100">
                Question {questionNumber} of {sectionTotal}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activeQuestionIndex <= 0 || isCompleted}
                  onClick={() => goToQuestion(Math.max(0, activeQuestionIndex - 1))}
                >
                  Previous
                </Button>
                <Button size="sm" disabled={isNextDisabled} onClick={goNextQuestion}>
                  {isLastQuestionInCurrentSection ? "Review Section" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
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

export const SectionInstructions: React.FC<SectionInstructionsProps> = React.memo(
  ({ currentSection, activeSectionIndex, setCurrentScreen }) => {
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
  }
);

// src/components/test/SectionReview.tsx
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
    const answeredCount = currentSection.questions.filter((q) => q.isAnswered).length;

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
                    onClick={handleFinishSectionReview}
                  >
                    Continue to Next Section
                  </Button>

                  <Button
                    size="sm"
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    onClick={() => setShowingReviewScreen(true)}
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

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left palette */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Questions</h4>
                    <div className="text-xs text-slate-500">Tap any to jump and edit</div>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                    {answeredCount}/{total}
                  </div>
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {(["all", "answered", "not_answered", "flagged"] as const).map((f) => {
                    const isActive = filter === f;
                    let bgClass = "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200";
                    if (isActive) {
                      if (f === "answered") bgClass = "bg-emerald-600 text-white";
                      else if (f === "not_answered") bgClass = "bg-yellow-500 text-white";
                      else if (f === "flagged") bgClass = "bg-indigo-700 text-white";
                      else bgClass = "bg-indigo-600 text-white";
                    }
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-2 py-1 text-xs rounded-md ${bgClass}`}
                      >
                        {f === "not_answered" ? "Not answered" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-4 gap-2">
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
                          className={`group flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-colors ${isBookmarked
                            ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10"
                            : isAnsweredLocal
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${isBookmarked
                              ? "bg-purple-500 text-white"
                              : isAnsweredLocal
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-700"
                              }`}
                          >
                            {q.order || idx + 1}
                          </div>
                          <div className="text-[10px] text-slate-500 group-hover:text-slate-700">Q{idx + 1}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => saveCurrentQuestionProgress({ silent: false })}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                  <Button size="sm" onClick={() => setShowingReviewScreen(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Right content area */}
          <main className="col-span-12 lg:col-span-8 space-y-2">
            <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="grid md:grid-cols-2 gap-1">
                {currentSection.questions.map((q, idx) => {
                  const answered = q.isAnswered;
                  return (
                    <div
                      key={`${q.question}-${idx}`}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold ${answered ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                            }`}
                        >
                          {q.order || idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            Question {q.order || idx + 1}
                          </div>
                          <div className="text-xs text-slate-500">
                            Status: {answered ? "Answered" : "Not answered"}
                            {q.markedForReview && (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs text-indigo-600">
                                <Flag className="h-3 w-3" /> Flagged
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveQuestionIndex(idx);
                            setCurrentScreen("question");
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>

        {/* Fixed bottom actions */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-backdrop-blur:bg-white/60">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => saveCurrentQuestionProgress({ silent: false })}>
                  <Save className="h-4 w-4 mr-2" /> Save Progress
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowingReviewScreen(false)}>
                  Back to Summary
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
                    setCurrentScreen("question");
                  }}
                  disabled={activeQuestionIndex <= 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white"
                  onClick={handleFinishSectionReview}
                  disabled={submitting}
                >
                  {isLastSection ? "Submit Test" : "Continue to Next Section"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

import  { useEffect, useRef, useState } from "react";
import {
  Calculator as CalculatorIcon,
  LogOut,
  HelpCircle,
  MessageSquare,
  Settings,
  Moon,
} from "lucide-react";

export type GRETestHeaderProps = {
  testTitle?: string;
  currentSection?: { name?: string; durationMinutes?: number };
  currentQuestion?: any;
  activeSectionIndex: number;
  totalSections: number;
  timerSecondsLeft: number;
  currentScreen: "intro" | "test" | "results" | string;
  isCompleted: boolean;
  savingProgress?: boolean;
  saveCurrentQuestionProgress?: () => void;
  navigateBack?: () => void;
};

function useClickOutside<T extends HTMLElement>(ref: React.RefObject<T>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      if (!ref.current) return;
      if (e.target instanceof Node && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

/* ---------------- Popover (Directions / Reference) ---------------- */
const Popover: React.FC<{
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  width?: number | string;
  maxHeight?: number | string;
  title?: string;
  children?: React.ReactNode;
}> = ({ anchorRef, open, onClose, width = 720, maxHeight = "60vh", title, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useClickOutside(ref, onClose);

  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null);
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    // center under anchor
    const w = typeof width === "number" ? width : 720;
    const left = Math.min(window.innerWidth - w - 12, rect.left + rect.width / 2 - w / 2);
    const top = rect.bottom + 12;
    setPos({ left: Math.max(12, left), top: Math.max(12, top) });
  }, [open, anchorRef, width]);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left: pos?.left, top: pos?.top, width, maxHeight, zIndex: 60 }}
      className="bg-white rounded shadow-2xl border border-slate-200 overflow-hidden"
      role="dialog"
      aria-modal="false"
      aria-label={title || "Popover"}
    >
      {/* Arrow */}
      <div style={{ position: "absolute", left: 24, top: -12 }} className="w-0 h-0">
        <svg width="24" height="12" viewBox="0 0 24 12" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0 L24 12 L0 12 Z" fill="white" stroke="#e6e6e6" />
        </svg>
      </div>

      <div className="p-6" style={{ maxHeight: maxHeight, overflow: "auto" }}>
        {title && <h3 className="text-lg font-semibold mb-4 text-slate-800">{title}</h3>}
        <div className="text-sm text-slate-700 leading-relaxed">{children}</div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-semibold shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- NavDropdown (keyboard navigable) ---------------- */
const NavDropdown: React.FC<{
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  width?: number;
}> = ({ anchorRef, open, onClose, children, width = 220 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useClickOutside(ref, onClose);

  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null);
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    const left = Math.min(window.innerWidth - width - 12, rect.left);
    const top = rect.bottom + 8;
    setPos({ left: Math.max(12, left), top });
  }, [open, anchorRef, width]);

  // keyboard navigation for children (delegated)
  useEffect(() => {
    if (!open || !ref.current) return;
    const focusable = Array.from(ref.current.querySelectorAll<HTMLElement>("button[role='menuitem']:not(:disabled), a[role='menuitem']"));
    if (focusable.length) focusable[0].focus();
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        idx = Math.min(focusable.length - 1, idx + 1);
        focusable[idx]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        idx = Math.max(0, idx - 1);
        focusable[idx]?.focus();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{ position: "fixed", left: pos?.left, top: pos?.top, width, zIndex: 60 }}
      className="bg-white rounded shadow-lg border border-slate-200 overflow-hidden"
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

/* ---------------- Calculator Window (draggable, minimizable) ---------------- */
const CalculatorWindow: React.FC<{ open: boolean; onClose: () => void; initialX?: number; initialY?: number }> = ({
  open,
  onClose,
  initialX = 80,
  initialY = 120,
}) => {
  const windowRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; x: number; y: number } | null>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setPos({ x: dragStart.current.x + dx, y: dragStart.current.y + dy });
    }
    function onMouseUp() {
      setDragging(false);
      dragStart.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, x: pos.x, y: pos.y };
    e.preventDefault();
  };

  // calculator state and logic
  const [display, setDisplay] = useState("0");
  const [waitingForNew, setWaitingForNew] = useState(false);
  const [operator, setOperator] = useState<string | null>(null);
  const [leftOperand, setLeftOperand] = useState<number | null>(null);

  useEffect(() => {
    // reset display when closed
    if (!open) {
      setMinimized(false);
    }
  }, [open]);

  const inputDigit = (digit: string) => {
    if (waitingForNew) {
      setDisplay(digit === "." ? "0." : digit);
      setWaitingForNew(false);
      return;
    }
    if (display === "0" && digit !== ".") setDisplay(digit);
    else if (digit === "." && display.includes(".")) return;
    else setDisplay(display + digit);
  };

  const compute = (a: number, b: number, op: string) => {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    if (op === "/") return b === 0 ? NaN : a / b;
    if (op === "%") return a % b;
    return b;
  };

  const inputOperator = (op: string) => {
    const current = parseFloat(display);
    if (leftOperand == null) {
      setLeftOperand(current);
    } else if (operator) {
      const res = compute(leftOperand, current, operator);
      setDisplay(String(res));
      setLeftOperand(res);
    }
    setOperator(op);
    setWaitingForNew(true);
  };

  const handleEquals = () => {
    if (operator && leftOperand != null) {
      const res = compute(leftOperand, parseFloat(display), operator);
      setDisplay(String(res));
      setLeftOperand(null);
      setOperator(null);
      setWaitingForNew(true);
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setLeftOperand(null);
    setOperator(null);
    setWaitingForNew(false);
  };

  const backspace = () => {
    if (waitingForNew) {
      setDisplay("0");
      setWaitingForNew(false);
      return;
    }
    if (display.length === 1) setDisplay("0");
    else setDisplay(display.slice(0, -1));
  };

  // ESC closes calculator
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={windowRef}
      className="fixed z-50"
      style={{
        left: pos.x,
        top: pos.y,
        width: minimized ? 180 : 320,
        boxShadow: "0 12px 30px rgba(2,6,23,0.2)",
      }}
      role="dialog"
      aria-label="Calculator"
    >
      <div
        ref={headerRef}
        onMouseDown={onHeaderMouseDown}
        className="flex items-center justify-between cursor-move px-3 py-2 rounded-t bg-slate-800 text-white"
        style={{ userSelect: "none" }}
      >
        <div className="flex items-center gap-2">
          <CalculatorIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Calculator</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="text-xs px-2 py-1 rounded hover:bg-slate-700"
            onClick={() => setMinimized((s) => !s)}
            aria-label={minimized ? "Restore calculator" : "Minimize calculator"}
          >
            {minimized ? "Restore" : "—"}
          </button>
          <button
            className="text-xs px-2 py-1 rounded hover:bg-slate-700"
            onClick={onClose}
            aria-label="Close calculator"
          >
            ✕
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-b p-3 ${minimized ? "hidden" : "block"}`}>
        <div className="mb-3">
          <div className="w-full h-12 rounded border border-slate-200 flex items-center justify-end pr-3 text-2xl font-mono tabular-nums">
            {display}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "C", onClick: clearAll },
            { label: "⌫", onClick: backspace },
            { label: "%", onClick: () => inputOperator("%") },
            { label: "/", onClick: () => inputOperator("/") },
          ].map((b) => (
            <button key={b.label} onClick={b.onClick} className="py-2 rounded bg-slate-100 hover:bg-slate-200">
              {b.label}
            </button>
          ))}

          {["7", "8", "9"].map((d) => (
            <button key={d} onClick={() => inputDigit(d)} className="py-3 rounded bg-slate-50 hover:bg-slate-100">
              {d}
            </button>
          ))}
          <button onClick={() => inputOperator("*")} className="py-3 rounded bg-slate-100 hover:bg-slate-200">
            *
          </button>

          {["4", "5", "6"].map((d) => (
            <button key={d} onClick={() => inputDigit(d)} className="py-3 rounded bg-slate-50 hover:bg-slate-100">
              {d}
            </button>
          ))}
          <button onClick={() => inputOperator("-")} className="py-3 rounded bg-slate-100 hover:bg-slate-200">
            -
          </button>

          {["1", "2", "3"].map((d) => (
            <button key={d} onClick={() => inputDigit(d)} className="py-3 rounded bg-slate-50 hover:bg-slate-100">
              {d}
            </button>
          ))}
          <button onClick={() => inputOperator("+")} className="py-3 rounded bg-slate-100 hover:bg-slate-200">
            +
          </button>

          <button onClick={() => inputDigit("0")} className="col-span-2 py-3 rounded bg-slate-50 hover:bg-slate-100">
            0
          </button>
          <button onClick={() => inputDigit(".")} className="py-3 rounded bg-slate-50 hover:bg-slate-100">
            .
          </button>
          <button onClick={handleEquals} className="py-3 rounded bg-amber-400 hover:bg-amber-300 font-semibold">
            =
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Simple Modal (Help / Complain / Settings) ---------------- */
const Modal: React.FC<{
  open: boolean;
  title?: string;
  onClose: () => void;
  children?: React.ReactNode;
}> = ({ open, title, onClose, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useClickOutside(ref, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap: focus first focusable element on open
  useEffect(() => {
    if (!open || !ref.current) return;
    const focusable = ref.current.querySelector<HTMLElement>("button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Modal"}
    >
      <div ref={ref} className="bg-white rounded shadow-lg max-w-2xl w-full p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-700">{children}</div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Header Component ---------------- */
export const GRETestHeader: React.FC<GRETestHeaderProps> = React.memo(
  ({
    testTitle,
    currentSection,
    currentQuestion,
    activeSectionIndex,
    totalSections,
    timerSecondsLeft,
    currentScreen,
    isCompleted,
    savingProgress,
    saveCurrentQuestionProgress,
    navigateBack,
  }) => {
    const formatTime = (seconds: number) => {
      if (seconds < 0) seconds = 0;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // anchors & open states
    const directionsRef = useRef<HTMLButtonElement | null>(null);
    const referenceRef = useRef<HTMLButtonElement | null>(null);
    const moreRef = useRef<HTMLButtonElement | null>(null);

    const [openDirections, setOpenDirections] = useState(false);
    const [openReference, setOpenReference] = useState(false);
    const [openCalculator, setOpenCalculator] = useState(false);
    const [openMore, setOpenMore] = useState(false);

    // Modal states:
    const [helpOpen, setHelpOpen] = useState(false);
    const [complainOpen, setComplainOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    // close all on ESC (global)
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpenDirections(false);
          setOpenReference(false);
          setOpenCalculator(false);
          setOpenMore(false);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);

    // sample directions & reference content (replace with real content)
    const directionsContent = useMemo(
      () => (
        <>
          <p className="mb-4">
            The questions in this section address a number of important reading and writing skills. Each question includes one
            or more passages, which may include a table or graph. Read each passage and question carefully, and then choose
            the best answer to the question based on the passage(s).
          </p>
          <p className="mb-4">
            All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.
          </p>
          <p>
            You can highlight, take notes, and use the tools available on the right side of the test interface. The timer at
            the top shows the remaining time for this section. If the timer reaches 00:00 the section will be submitted
            automatically.
          </p>
        </>
      ),
      []
    );

    const referenceContent = useMemo(
      () => (
        <>
          <p className="mb-3 font-medium">Reference Materials</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Formula sheet (algebra, geometry)</li>
            <li>Common abbreviations & notation</li>
            <li>Style & punctuation reminders</li>
            <li>Allowed calculators & tools</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">Tip: You can copy short reference notes into the "Highlights & Notes" panel for quick reuse.</p>
        </>
      ),
      []
    );

    // More dropdown action handlers
    const handleHelp = () => {
      setOpenMore(false);
      setHelpOpen(true);
    };

    const handleComplain = () => {
      setOpenMore(false);
      setComplainOpen(true);
    };

    const handleSettings = () => {
      setOpenMore(false);
      setSettingsOpen(true);
    };

    const handleToggleTheme = () => {
      setOpenMore(false);
      // Wire to your theme provider / context. For now placeholder:
      // e.g. themeContext.toggle();
      alert("Toggle theme (implement with your theme provider).");
    };

    return (
      <>
        <div
          style={{ borderBottomWidth: "3px" }}
          className="fixed top-0 left-0 right-0 z-50 border-dashed border-gray-800 dark:border-slate-700 bg-gray-200 dark:bg-slate-900/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-7xl h-16 items-center justify-between gap-4 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-lg capitalize text-slate-800 dark:text-slate-200">
                  Section {activeSectionIndex + 1} : {currentSection?.name || "Section"}
                </p>
                <button
                  ref={directionsRef}
                  onClick={() => {
                    setOpenDirections((s) => !s);
                    setOpenReference(false);
                    setOpenMore(false);
                  }}
                  className="text-sm text-slate-700 dark:text-slate-400 inline-flex items-center gap-2"
                >
                  Directions
                </button>
              </div>
            </div>

            <div>
              {currentSection?.durationMinutes && currentScreen !== "intro" && (
                <div className="flex flex-col items-center rounded-full px-3 py-1">
                  <span className="text-lg tabular-nums">{formatTime(timerSecondsLeft)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="!rounded-full border-slate-300 dark:border-slate-600 !py-0.5 !px-2 !text-xs font-semibold text-slate-700 dark:text-slate-200"
                    onClick={() => {
                      // optionally hide / show timer
                    }}
                  >
                    Hide
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center flex-col text-xs"
                  onClick={() => {
                    setOpenCalculator((s) => !s);
                    setOpenDirections(false);
                    setOpenReference(false);
                    setOpenMore(false);
                  }}
                >
                  <CalculatorIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-[11px]">Calculator</span>
                </button>

                <button
                  ref={referenceRef}
                  className="flex items-center flex-col text-xs"
                  onClick={() => {
                    setOpenReference((s) => !s);
                    setOpenDirections(false);
                    setOpenMore(false);
                  }}
                >
                  <UserX2 className="w-5 h-5 text-gray-600" />
                  <span className="text-[11px]">Reference</span>
                </button>

                <button
                  ref={moreRef}
                  className="flex items-center flex-col text-xs relative"
                  onClick={() => {
                    setOpenMore((s) => !s);
                    setOpenDirections(false);
                    setOpenReference(false);
                    setOpenCalculator(false);
                  }}
                  aria-haspopup="true"
                  aria-expanded={openMore}
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                  <span className="text-[11px]">More</span>
                </button>

                {(currentScreen === "results" || isCompleted) && (
                  <Button size="sm" variant="outline" onClick={navigateBack}>
                    <LogOut className="h-3 w-3 mr-1" />
                    Exit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spacer so page content doesn't hide under fixed header */}
        <div style={{ height: 64 }} />

        {/* Popovers */}
        <Popover
          anchorRef={directionsRef}
          open={openDirections}
          onClose={() => setOpenDirections(false)}
          width={760}
          maxHeight={"70vh"}
          title="Section Directions"
        >
          {directionsContent}
        </Popover>

        <Popover
          anchorRef={referenceRef}
          open={openReference}
          onClose={() => setOpenReference(false)}
          width={420}
          maxHeight={"50vh"}
          title="Reference"
        >
          {referenceContent}
        </Popover>

        {/* Calculator Floating Window */}
        <CalculatorWindow open={openCalculator} onClose={() => setOpenCalculator(false)} />

        {/* More dropdown (keyboard navigable) */}
        <NavDropdown anchorRef={moreRef} open={openMore} onClose={() => setOpenMore(false)} width={220}>
          <div className="px-2">
            <button
              onClick={() => {
                setOpenMore(false);
                if (saveCurrentQuestionProgress) saveCurrentQuestionProgress();
              }}
              disabled={!!isCompleted || !!savingProgress}
              role="menuitem"
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50 ${
                isCompleted || savingProgress ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <Save className="w-4 h-4" />
              <span className="text-sm">Save</span>
            </button>

            {(currentScreen === "results" || isCompleted) && (
              <button
                onClick={() => {
                  setOpenMore(false);
                  if (navigateBack) navigateBack();
                }}
                role="menuitem"
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Exit</span>
              </button>
            )}

            <div className="border-t my-1 border-slate-100" />

            <button onClick={handleHelp} role="menuitem" className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Help</span>
            </button>

            <button onClick={handleComplain} role="menuitem" className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Complain</span>
            </button>

            <div className="border-t my-1 border-slate-100" />

            <button onClick={handleSettings} role="menuitem" className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>

            <button onClick={handleToggleTheme} role="menuitem" className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-50">
              <Moon className="w-4 h-4" />
              <span className="text-sm">Toggle Theme</span>
            </button>
          </div>
        </NavDropdown>

        {/* Help Modal */}
        <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help">
          <p className="mb-3">
            If you need help during the test, you can view guidelines here or contact support. This modal is a placeholder — integrate your actual help content or link to support.
          </p>
          <p className="text-sm text-slate-600">Contact: support@example.com • Phone: +1 800 000 000</p>
        </Modal>

        {/* Complain Modal */}
        <Modal open={complainOpen} onClose={() => setComplainOpen(false)} title="Complain / Report an Issue">
          <p className="mb-4">Describe the issue below and submit. Our support team will respond.</p>
          <textarea placeholder="Describe your issue..." className="w-full border rounded p-2 min-h-[120px]" />
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                // wire to API or form submit
                alert("Complaint submitted (placeholder).");
                setComplainOpen(false);
              }}
              className="px-4 py-2 rounded bg-amber-400 hover:bg-amber-300"
            >
              Submit
            </button>
          </div>
        </Modal>

        {/* Settings Modal */}
        <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
          <p className="mb-3">Sample settings placeholder. Wire these toggles to your real application settings.</p>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" />
              <span>Enable Auto-save</span>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" />
              <span>Reduce Animations</span>
            </label>
          </div>
        </Modal>
      </>
    );
  }
);


import {
  AlertTriangle,
  BookOpen,
  Edit3,
} from "lucide-react";

interface GRETestResultsProps {
  attempt: any;
  navigateBack: () => void;
  onTakeAnotherTest: () => void;
}

export const GRETestResults: React.FC<GRETestResultsProps> = React.memo(
  ({ attempt, navigateBack, onTakeAnotherTest }) => {
    const overall = attempt.overallStats;

    const getQuestionStatus = (q: any, qd?: any | null) => {
      if (!q.isAnswered) return "skipped";
      if (typeof q.isCorrect === "boolean") {
        return q.isCorrect ? "correct" : "incorrect";
      }
      if (qd && typeof qd.correctOptionIndex === "number" && qd.correctOptionIndex >= 0) {
        const userIdx = q.answerOptionIndexes[0];
        return userIdx === qd.correctOptionIndex ? "correct" : "incorrect";
      }
      return "attempted";
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "correct": return "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/30";
        case "incorrect": return "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200 dark:shadow-red-900/30";
        case "skipped": return "bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-slate-200 dark:shadow-slate-900/30";
        default: return "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/30";
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "correct": return <CheckCircle2 className="h-4 w-4 mr-1.5" />;
        case "incorrect": return <AlertTriangle className="h-4 w-4 mr-1.5" />;
        case "skipped": return <Clock className="h-4 w-4 mr-1.5" />;
        default: return <Edit3 className="h-4 w-4 mr-1.5" />;
      }
    };

    const formatTimeSpent = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (!attempt) return null;

    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
              Test Result
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Review your performance and detailed answers
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={navigateBack}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Overall Stats */}
        {overall && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Questions", value: overall.totalQuestions, icon: BookOpen, color: "indigo" },
              { label: "Attempted", value: `${overall.totalAttempted} (${Math.round((overall.totalAttempted / overall.totalQuestions) * 100)}%)`, icon: Edit3, color: "blue" },
              { label: "Correct", value: `${overall.totalCorrect} (${Math.round((overall.totalCorrect / overall.totalQuestions) * 100)}%)`, icon: CheckCircle2, color: "emerald" },
              { label: "Incorrect", value: `${overall.totalIncorrect} (${Math.round((overall.totalIncorrect / overall.totalQuestions) * 100)}%)`, icon: AlertTriangle, color: "red" },
              { label: "Raw Score", value: `${overall.rawScore}/${overall.totalQuestions}`, icon: Flag, color: "purple" },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition-all duration-200 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {item.value}
                    </p>
                  </div>
                  <div className={`h-10 w-10 rounded-full bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section-wise Results */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 px-2">
            Section-wise Performance
          </h3>

          {attempt.sections.map((sec, sIdx) => (
            <div
              key={sIdx}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-200 hover:shadow-lg"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold">{sIdx + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                        {sec.name || `Section ${sIdx + 1}`}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {sec.questions.length} Questions • {sec.durationMinutes || 45} minutes
                      </p>
                    </div>
                  </div>

                  {sec.stats && (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{sec.stats.correct}</div>
                        <div className="text-xs text-slate-500">Correct</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{sec.stats.incorrect}</div>
                        <div className="text-xs text-slate-500">Incorrect</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-600 dark:text-slate-400">{sec.stats.skipped}</div>
                        <div className="text-xs text-slate-500">Skipped</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      {["Q.No", "Status", "Your Answer", "Correct Answer", "Time Spent", "Question Preview"].map((col) => (
                        <th key={col} className="py-3 px-4 text-left font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.questions.map((q, qIdx) => {
                      const qd = q.questionDoc;
                      const status = getQuestionStatus(q, qd);
                      const statusClass = getStatusColor(status);

                      const getOptionLabel = (idx: number) => {
                        if (!qd?.options || !qd.options[idx]) return "--";
                        return qd.options[idx].label || String.fromCharCode("A".charCodeAt(0) + idx);
                      };

                      const userLabel = q.answerOptionIndexes.length > 0
                        ? q.answerOptionIndexes.map(getOptionLabel).join(", ")
                        : q.answerText || "--";

                      const correctLabel = typeof qd?.correctOptionIndex === "number"
                        ? getOptionLabel(qd.correctOptionIndex)
                        : "--";

                      return (
                        <tr
                          key={q.question}
                          className={`border-b border-slate-50 dark:border-slate-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${status === "correct" ? "bg-emerald-50/20 dark:bg-emerald-900/5" : ""}`}
                        >
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${status === "correct"
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                : status === "incorrect"
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}>
                                <span className="font-bold">{q.order || qIdx + 1}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium shadow-sm ${statusClass}`}>
                              {getStatusIcon(status)}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className={`font-medium ${status === "correct"
                              ? "text-emerald-700 dark:text-emerald-300"
                              : status === "incorrect"
                                ? "text-red-700 dark:text-red-300"
                                : "text-slate-700 dark:text-slate-300"
                              }`}>
                              {userLabel}
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="font-medium text-emerald-700 dark:text-emerald-300">{correctLabel}</div>
                          </td>
                          <td className="py-3 px-4 align-middle">
                            <div className="flex items-center text-slate-600 dark:text-slate-400">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span className="font-mono">{formatTimeSpent(q.timeSpentSeconds)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 align-middle max-w-xs">
                            {qd ? (
                              <div className="line-clamp-2 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                {qd.questionText.replace(/<[^>]*>/g, "")}
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic">No preview available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <div>Showing {sec.questions.length} questions</div>
                  {sec.stats && (
                    <div className="flex items-center gap-2">
                      {[
                        { label: "Correct", count: sec.stats.correct, color: "emerald" },
                        { label: "Incorrect", count: sec.stats.incorrect, color: "red" },
                        { label: "Skipped", count: sec.stats.skipped, color: "slate" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1">
                          <div className={`h-2 w-2 rounded-full bg-${item.color}-500`}></div>
                          <span>{item.label}: {item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        {overall && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 p-5">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Accuracy</span>
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {overall.totalAttempted > 0 ? ((overall.totalCorrect / overall.totalAttempted) * 100).toFixed(1) : "0"}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                    style={{ width: `${overall.totalAttempted > 0 ? (overall.totalCorrect / overall.totalAttempted) * 100 : 0}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-slate-600 dark:text-slate-400">Completion Rate</span>
                  <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {((overall.totalAttempted / overall.totalQuestions) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    style={{ width: `${(overall.totalAttempted / overall.totalQuestions) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative h-40 w-40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{overall.rawScore}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Raw Score</div>
                    </div>
                  </div>
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient1)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(overall.rawScore / overall.totalQuestions) * 251.2} 251.2`}
                      transform="rotate(-90 50 50)"
                    />
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Review your answers carefully before leaving
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600" onClick={() => window.print()}>
              Print Results
            </Button>
            <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600" onClick={navigateBack}>
              <LogOut className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={onTakeAnotherTest}
            >
              Take Another Test
            </Button>
          </div>
        </div>
      </div>
    );
  }
);