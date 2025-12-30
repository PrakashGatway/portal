import React, { useEffect, useRef, useState, useCallback, useMemo, use } from "react";
import {
  AlertTriangle,
  BookOpen,
  Edit3,
  BarChart3,
  Headphones

} from "lucide-react";
import SpeakingQuestion, { RecordingOnlyComponent, TTSPlayer } from "./SpeakingQuestion";
import PTEFillDrag, { PTEFillListeningInput, PTEFillSelect, PTEHighlightText, PTEMCQMultiple, PTEReorder } from "./DragandFill";

import {
  Flag,
  Save,
  LogOut,
  BookmarkCheck,
  BookmarkIcon,
  ChevronDown,
  Clock,
  ChevronUp,
  Volume2,
  Mic,
  Play,
  Pause,
  StopCircle,
  Check,
  X,
} from "lucide-react";
import Button from "../../components/ui/button/Button";

const QuestionRenderer: any = React.memo(
  ({
    qDoc,
    currentQuestion,
    isCompleted,
    handleOptionClick,
    handleTextAnswerChange,
    toggleMarkForReview,
    saveCurrentQuestionProgress,
    updateCurrentQuestionAsync,
    activeQuestionIndex,
    updateCurrentQuestion,
    sectionTotal,
    isLastQuestionInCurrentSection,
    isNextDisabled,
    goToQuestion,
    goNextQuestion,
    sectionQuestions,
    onReviewSection,
    onShowInstructions,
  }: any) => {
    const questionNumber = currentQuestion.order || activeQuestionIndex + 1;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const draggingRef = useRef(false);
    const [leftPercent, setLeftPercent] = useState(45);
    const [showEliminationMode, setShowEliminationMode] = useState(true);
    const [crossedOptions, setCrossedOptions] = useState<number[]>([]);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [startRecordingCountdown, setStartRecordingCountdown] = useState<(() => void) | null>(null);

    const [showRecordFirstPopup, setShowRecordFirstPopup] = useState(false);
    const [showConfirmNextPopup, setShowConfirmNextPopup] = useState(false);
    const [isRecordingInProgress, setIsRecordingInProgress] = useState(false);


    const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
      setRecordedAudio(audioBlob);
      const audioPath = await uploadAudioAndGetPath(audioBlob);
      handleTextAnswerChange({ target: { value: audioPath } })
    }, [])


    const handleStartCountdownCallback = useCallback((startFn: () => void) => {
      setStartRecordingCountdown(() => startFn);
    }, []);

    const onTTSFinished = useCallback(() => {
      if (startRecordingCountdown) {
        startRecordingCountdown();
      }
    }, [startRecordingCountdown]);

    useEffect(() => {
      if (qDoc?.questionType === "describe_image" || qDoc?.questionType === "read_aloud" && startRecordingCountdown) {
        const timer = setTimeout(() => {
          startRecordingCountdown();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [qDoc?.questionType, startRecordingCountdown]);

    useEffect(() => {
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }, [currentQuestion?._id, qDoc?._id]); // Clean up when question ID changes


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


    const uploadAudioAndGetPath = async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("file", audioBlob, "answer.webm");

      const res = await api.post("/upload/pteupload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!res.data?.success) {
        throw new Error("Audio upload failed");
      }
      return res.data.file.path;
    };

    const isMCQ = Array.isArray(qDoc.options) && qDoc.options.length > 0;
    const type = qDoc.questionType || "";
    const isPTE = type.startsWith("pte_") || [
      "read_aloud",
      "repeat_sentence",
      "describe_image",
      "retell_lesson",
      "short_answer"
    ].includes(type);

    const renderPassage = () => {
      if (qDoc.stimulus) {
        return (
          <div
            className="prose text-base prose-sm dark:prose-invert max-w-none mb-3"
            dangerouslySetInnerHTML={{ __html: qDoc.stimulus }}
          />
        );
      }
      return null;
    };

    const renderHeader = () => (
      <div className="flex items-center justify-between mb-4 bg-slate-300 dark:bg-slate-700 border-b-3 border-dashed border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="bg-slate-800 dark:bg-slate-100 text-slate-100 dark:text-slate-800 p-2">
            {questionNumber}
          </span>
          <span className="flex cursor-pointer" onClick={toggleMarkForReview}>
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
        {isPTE && (
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
        )}
      </div>
    );

    const renderQuestionText = () => (
      <div className="mb-4">
        <h2
          className="text-base "
          dangerouslySetInnerHTML={{
            __html: qDoc.questionText || "Question missing",
          }}
        />
      </div>
    );

    const renderOptions = (isListening = false) => {
      if (!isMCQ) return null;
      return (
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
                    className={`w-full text-left rounded-lg border-2 px-4 py-2 flex items-start gap-3 transition ${selected
                      ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                      : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      } ${isCrossed && !selected ? "opacity-60" : "opacity-100"}`}
                  >
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected
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
                  {showEliminationMode && isCrossed && !selected && (
                    <span className="absolute h-0.5 w-full bg-slate-900 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
                {/* {showEliminationMode && (
                  <div className="relative">
                    <div
                      onClick={() => toggleCrossOption(i)}
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center border border-slate-400 text-slate-700 dark:border-slate-500 dark:text-slate-300 rounded-full text-sm font-bold cursor-pointer select-none ${isCrossed ? "bg-slate-800 text-slate-100" : ""
                        }`}
                    >
                      {isCrossed ? "X" : String.fromCharCode(65 + i)}
                    </div>
                    {isCrossed && (
                      <span className="absolute h-0.5 w-full bg-slate-900 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                )} */}
              </div>
            );
          })}
        </div>
      );
    };

    const onOptionClick = (index: number) => {
      if (isCompleted) return;
      setCrossedOptions((prev) => prev.filter((i) => i !== index));
      handleOptionClick(index);
    };

    const renderPTEQuestion = () => {

      switch (type) {
        case "read_aloud":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderPassage()}

              <div
                className="text- mt-4 "
                dangerouslySetInnerHTML={{
                  __html: qDoc.questionText || "Question missing",
                }}
              />
              <div className="w-full md:w-3/5
mx-auto">
                <RecordingOnlyComponent
                  key={qDoc._id}
                  recordingDurationSeconds={35}
                  preRecordingWaitSeconds={40}
                  onRecordingComplete={handleRecordingComplete}
                  onStartCountdown={handleStartCountdownCallback}
                />

              </div>

            </div>
          );
        case "repeat_sentence":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderPassage()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TTSPlayer
                  key={`player-${qDoc._id}`}
                  audioUrl={qDoc.typeSpecific?.audio
                    ? audioBaseUrl + qDoc.typeSpecific.audio
                    : undefined}
                  text={qDoc.questionText}   // 🔁 fallback
                  delayBeforePlay={3000}
                  onPlaybackEnd={onTTSFinished}
                />

                <RecordingOnlyComponent
                  key={qDoc._id}
                  recordingDurationSeconds={20}
                  preRecordingWaitSeconds={10}
                  onRecordingComplete={handleRecordingComplete}
                  onStartCountdown={handleStartCountdownCallback}
                />
              </div>
            </div>
          );

        case "describe_image":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderPassage()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2
                  className="text-base sm:text-lg"
                  dangerouslySetInnerHTML={{
                    __html: qDoc.questionText || "Question missing",
                  }}
                />
                <RecordingOnlyComponent
                  key={qDoc._id}
                  recordingDurationSeconds={40}
                  preRecordingWaitSeconds={25}
                  onRecordingComplete={handleRecordingComplete}
                  onStartCountdown={handleStartCountdownCallback}
                />
              </div>
            </div>
          );

        case "retell_lesson":
        case "pte_situational":
        case "short_answer":
          return qDoc && (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              <div className="flex-block">
                {qDoc?.stimulus && (
                  <div
                    className="prose text-base prose-sm dark:prose-invert max-w-none mb-6"
                    dangerouslySetInnerHTML={{ __html: qDoc.stimulus }}
                  />
                )}
                {qDoc?.questionType != "retell_lesson" && <div className="mb-6">
                  <h2 className="" dangerouslySetInnerHTML={{ __html: qDoc?.questionText }} />
                </div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TTSPlayer
                  key={`player-${qDoc._id}`}
                  audioUrl={qDoc.typeSpecific?.audio
                    ? audioBaseUrl + qDoc.typeSpecific.audio
                    : undefined}
                  text={qDoc.questionText}   // 🔁 fallback
                  delayBeforePlay={3000}
                  onPlaybackEnd={onTTSFinished}
                />

                <RecordingOnlyComponent
                  key={qDoc._id}
                  recordingDurationSeconds={40}
                  preRecordingWaitSeconds={10}
                  onRecordingComplete={handleRecordingComplete}
                  onStartCountdown={handleStartCountdownCallback}
                />
              </div>
            </div>
          );

        case "summarize_group_discussions":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {renderPassage()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TTSPlayer
                  key={`player-${qDoc._id}`}
                  audioUrl={qDoc.typeSpecific?.audio
                    ? audioBaseUrl + qDoc.typeSpecific.audio
                    : undefined}
                  text={qDoc.questionText}   // 🔁 fallback
                  delayBeforePlay={3000}
                  onPlaybackEnd={onTTSFinished}
                />
                <RecordingOnlyComponent
                  key={qDoc._id}
                  recordingDurationSeconds={120}
                  preRecordingWaitSeconds={10}
                  onRecordingComplete={handleRecordingComplete}
                  onStartCountdown={handleStartCountdownCallback}
                />
              </div>
            </div>
          );
        case "pte_summarize_writing":
        case "pte_writing":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-2 min-h-[65vh] overflow-y-auto">
              {renderPassage()}
              {renderQuestionText()}
              <textarea
                value={currentQuestion.answerText || ""}
                onChange={handleTextAnswerChange}
                rows={8}
                disabled={isCompleted}
                className="w-full rounded-lg outline-none border border-slate-300 dark:border-slate-600 px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-white"
                placeholder="Write your response..."
              />
            </div>
          );
        case "pte_writing_listening":
        case "pte_summarize_listening":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {renderPassage()}

              {/* {renderQuestionText()} */}
              <TTSPlayer
                key={qDoc._id}
                audioUrl={qDoc.typeSpecific?.audio
                  ? audioBaseUrl + qDoc.typeSpecific.audio
                  : undefined}
                text={qDoc?.questionText || "Describe the image shown."}
                delayBeforePlay={3000} // 1 second
                onPlaybackEnd={onTTSFinished}
                rate={0.8}
                pitch={0.8}
              />
              <textarea
                value={currentQuestion.answerText || ""}
                onChange={handleTextAnswerChange}
                rows={4}
                disabled={isCompleted}
                className="w-full mt-4 rounded-lg border outline-none border-slate-300 dark:border-slate-600 px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-white"
                placeholder="Write your summary..."
              />
            </div>
          );
        case "pte_fill_in_blanks":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderPassage()}
              <PTEFillSelect
                key={qDoc._id} // 🔥 VERY IMPORTANT
                questionHTML={qDoc.questionText || ""}
                optionsText={qDoc?.typeSpecific?.listeningText || ""}
                currentAnswer={currentQuestion.answerText || ""}
                isCompleted={isCompleted}
                onAnswerChange={(answer) => {
                  handleTextAnswerChange({ target: { value: answer } });
                }}
              />
            </div>
          );
        case "pte_fill_listening":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {renderPassage()}
              {/* <SpeakingQuestion key={qDoc?._id} qDoc={qDoc} /> */}


              <TTSPlayer
                key={"player-" + qDoc._id}
                audioUrl={qDoc.typeSpecific?.audio
                  ? audioBaseUrl + qDoc.typeSpecific.audio
                  : undefined}
                text={qDoc?.typeSpecific?.listeningText || "Describe the image shown."}
                delayBeforePlay={5000}
                onPlaybackEnd={() => null}
                rate={0.7}
                pitch={0.8}
              />

              <div className="mt-4">
                <PTEFillListeningInput
                  key={"iuii" + qDoc._id}
                  questionHTML={qDoc.questionText || ""}
                  currentAnswer={currentQuestion.answerText || ""}
                  isCompleted={isCompleted}
                  onAnswerChange={(answer) => {
                    handleTextAnswerChange({ target: { value: answer } });
                  }}
                />
              </div>
            </div>
          );

        case "pte_mcq_single":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              <div className="grid grid-cols-2 gap-6">
                {renderPassage()}
                <div>
                  {renderQuestionText()}
                  {renderOptions()}
                </div>
              </div>
            </div>
          );

        case "pte_highlight":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderPassage()}
              <TTSPlayer
                key={"dfdf" + qDoc._id}
                audioUrl={qDoc.typeSpecific?.audio
                  ? audioBaseUrl + qDoc.typeSpecific.audio
                  : undefined}
                text={qDoc?.typeSpecific?.listeningText || "Describe the image shown."}
                delayBeforePlay={5000} // 1 second
                onPlaybackEnd={onTTSFinished}
                rate={0.8}
                pitch={0.8}
              />
              <div className="mt-4">
                <PTEHighlightText
                  key={"a" + qDoc._id} // 🔥 VERY IMPORTANT
                  html={qDoc?.questionText || ""}
                  currentAnswer={currentQuestion.answerText || ""}
                  isCompleted={false}
                  onAnswerChange={(answer) => {
                    handleTextAnswerChange({ target: { value: answer } });
                  }}
                />
              </div>
            </div>
          )
        case "pte_mcq_single_listening":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              <div className="">
                {renderPassage()}

                <TTSPlayer
                  key={qDoc._id}
                  audioUrl={qDoc.typeSpecific?.audio
                    ? audioBaseUrl + qDoc.typeSpecific.audio
                    : undefined}
                  text={qDoc?.typeSpecific?.listeningText || "Describe the image shown."}
                  delayBeforePlay={5000} // 1 second
                  onPlaybackEnd={onTTSFinished}
                  rate={0.8}
                  pitch={0.8}
                />
                <div className="mt-4">
                  {renderQuestionText()}
                  {renderOptions()}
                </div>
              </div>
            </div>
          );
        case "pte_mcq_multiple":
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
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {renderPassage()}
                <div>
                  {renderQuestionText()}
                  <div className="space-y-2">
                    {qDoc.options?.map((opt, idx) => {
                      const selected = mainSelected.has(idx);
                      const label = opt.label || String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleMainOption(idx)}
                          disabled={isCompleted}
                          className={`flex items-start w-full gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${selected
                            ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            }`}
                        >
                          <span className="font-semibold">{label}.</span>
                          <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        case "pte_mcq_multiple_listening":
          const mainSelected1 = new Set<number>(currentQuestion.answerOptionIndexes || []);
          const toggleMainOption1 = (idx: number) => {
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
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              <div className="grid gap-4">
                {renderPassage()}

                <TTSPlayer
                  key={qDoc._id}
                  audioUrl={qDoc.typeSpecific?.audio
                    ? audioBaseUrl + qDoc.typeSpecific.audio
                    : undefined}
                  text={qDoc?.typeSpecific?.listeningText || "Describe the image shown."}
                  delayBeforePlay={5000} // 1 second
                  onPlaybackEnd={onTTSFinished}
                  rate={0.8}
                  pitch={0.8}
                />

                <div>
                  {renderQuestionText()}
                  <div className="space-y-2">
                    {qDoc.options?.map((opt, idx) => {
                      const selected = mainSelected1.has(idx);
                      const label = opt.label || String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleMainOption1(idx)}
                          disabled={isCompleted}
                          className={`flex items-start w-full gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${selected
                            ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            }`}
                        >
                          <span className="font-semibold">{label}.</span>
                          <span dangerouslySetInnerHTML={{ __html: opt.text }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        case "pte_fill_drag":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {renderPassage()}
              {/* {renderHeader()} */}

              <PTEFillDrag
                key={qDoc._id}
                questionText={qDoc.questionText || ""}
                listeningText={qDoc?.typeSpecific?.listeningText || ""}
                currentAnswer={currentQuestion.answerText || ""}
                isCompleted={isCompleted}
                onAnswerChange={(answer) => {
                  handleTextAnswerChange({ target: { value: answer } });
                }}
              />
            </div>
          );
        case "pte_reorder":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderQuestionText()}

              <PTEReorder
                key={qDoc._id} // 🔥 VERY IMPORTANT
                items={qDoc.typeSpecific?.listeningText.split("||")}
                currentAnswer={currentQuestion.answerText || ""}
                isCompleted={isCompleted}
                onAnswerChange={(answer) => {
                  handleTextAnswerChange({ target: { value: answer } });
                }}
              />
            </div>
          );
        case "pte_summarize_spoken":
          return (
            <div className="bg-white rounded dark:bg-slate-900 p-4 min-h-[65vh] overflow-y-auto">
              {/* {renderHeader()} */}
              {renderPassage()}

              {["pte_summarize_spoken"].includes(type) && <TTSPlayer
                key={qDoc._id}
                audioUrl={qDoc.typeSpecific?.audio
                  ? audioBaseUrl + qDoc.typeSpecific.audio
                  : undefined}
                text={qDoc?.questionText || "Describe the image shown."}
                delayBeforePlay={5000} // 1 second
                onPlaybackEnd={onTTSFinished}
                rate={0.8}
                pitch={0.8}
              />}
              {/* {renderQuestionText()} */}
              <textarea
                value={currentQuestion.answerText || ""}
                onChange={handleTextAnswerChange}
                rows={6}
                disabled={isCompleted}
                className="w-full mt-3 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-base dark:bg-slate-800 dark:text-white"
                placeholder="Type your response..."
              />
            </div>
          );

        default:
          // Fallback to your original non-PTE logic
          if (isMCQ) {
            return (
              <div ref={containerRef} className="flex gap-3">
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
                  {renderHeader()}
                  {renderQuestionText()}
                  {renderOptions()}
                </div>
              </div>
            );
          } else if (isMCQ) {
            return (
              <div className="bg-white rounded dark:bg-slate-900 p-2 min-h-[65vh] max-h-[65vh] overflow-y-auto">
                {renderHeader()}
                {renderQuestionText()}
                {renderOptions()}
              </div>
            );
          } else {
            return (
              <div className="bg-white rounded dark:bg-slate-900 p-2 min-h-[65vh] max-h-[65vh] overflow-y-auto">
                {renderHeader()}
                {renderQuestionText()}
                <div className="space-y-3 mt-4">
                  <textarea
                    value={currentQuestion.answerText || ""}
                    onChange={handleTextAnswerChange}
                    rows={2}
                    disabled={isCompleted}
                    className="min-w-2xl rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:text-white"
                    placeholder="Type your answer..."
                  />
                </div>
              </div>
            );
          }
      }
    };

    return (
      <>
        <div className="flex items-center justify-between py-[6px] bg-white-300">
        </div>
        <div className="flex items-center justify-between py-4 bg-[#0080a3] ">
        </div>
        <div className="max-w-7xl mx-auto p-2 space-y-4">
          {renderPTEQuestion()}

          {/* Question Palette */}
          <div
            className={`fixed left-0 right-0 z-30 max-w-3xl mx-auto transition-transform duration-300 ease-out ${isPaletteOpen ? "translate-y-0" : "translate-y-[200%]"
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
          <div className="fixed bottom-0 left-0 right-0 z-40  dark:border-slate-700 bg-[#bfbbbc]  backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-3 ">
              <div className="grid grid-cols-2 items-center gap-3">
                <div className="flex text-lg text-slate-900 dark:text-slate-100 flex-wrap gap-2">
                  PTE Practice
                </div>

                <div className="flex justify-end gap-2">
                  {activeQuestionIndex > 0 && (
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
                    onClick={async () => {
                      const isSpeakingQuestion = [
                        "read_aloud",
                        "repeat_sentence",
                        "describe_image",
                        "retell_lesson",
                        "short_answer",
                        "pte_situational",
                        "summarize_group_discussions"
                      ].includes(qDoc?.questionType || "");

                      // if (isSpeakingQuestion && !recordedAudio && !isRecordingInProgress) {
                      //   setShowRecordFirstPopup(true);
                      //   return;
                      // }

                      // if (isRecordingInProgress) {
                      //   setShowConfirmNextPopup(true);
                      //   return;
                      // }

                      // if (recordedAudio) {
                      //   const audioPath = await uploadAudioAndGetPath(recordedAudio);
                      //   await updateCurrentQuestionAsync({
                      //     answerText: audioPath,
                      //     isAnswered: true,
                      //   });
                      //   setRecordedAudio(null);
                      // }
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
        </div>

        {/* Return statement ke andar, sabse last mein */}
        {showRecordFirstPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-bold mb-4">Recording Required</h3>
              <p className="mb-4">Please record your response before proceeding.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowRecordFirstPopup(false)} className="px-4 py-2">Cancel</button>
                <button onClick={() => setShowRecordFirstPopup(false)} className="px-4 py-2 bg-blue-600 text-white">OK</button>
              </div>
            </div>
          </div>
        )}

        {showConfirmNextPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-bold mb-4">Confirm Navigation</h3>
              <p className="mb-4">Recording is in progress. Proceeding will stop the recording.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirmNextPopup(false)} className="px-4 py-2">Cancel</button>
                <button onClick={() => {
                  setShowConfirmNextPopup(false);
                  goNextQuestion();
                  setCrossedOptions([]);
                }} className="px-4 py-2 bg-blue-600 text-white">Proceed</button>
              </div>
            </div>
          </div>
        )}
      </>
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

import { Eye, ArrowLeft, CheckCircle2 } from "lucide-react";
import api, { audioBaseUrl } from "../../axiosInstance";

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

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="">
          {/* Left palette */}
          <aside className=" max-w-4xl flex-shrink-0 mx-auto">
            <div className="">
              <div className="py-6">
                <h4 className="text-3xl text-center font-semibold text-slate-900 dark:text-slate-50">Check Your Work</h4>
                <div className="text-base text-center text-slate-500">On the test day you will not be able to return to this section review. and go to next section without time completed</div>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 p-6">
                <div className="mt-3 flex gap-1 flex-wrap">
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
                        className={`px-3 py-1 rounded-full ${bgClass}`}
                      >
                        {f === "not_answered" ? "Not answered" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                          className={`group flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-colors ${isBookmarked
                            ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10"
                            : isAnsweredLocal
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white dark:bg-slate-900 hover:border-indigo-300"
                            }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${isBookmarked
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

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t-3 border-dashed border-slate-900 dark:border-slate-700 bg-[#bfbbbc]  backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex text-lg text-slate-900 dark:text-slate-100 flex-wrap gap-2">
                SAT TEST
              </div>

              <div className="flex gap-2">


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
  }
);


interface GRETestResultsProps {
  attempt: any;
  navigateBack: () => void;
  onTakeAnotherTest: () => void;
}

export const GRETestResults: React.FC<GRETestResultsProps> = React.memo(
  ({ attempt, navigateBack, onTakeAnotherTest }) => {
    const overall = attempt.overallStats;

    // ✅ State for active tab
    const [activeTab, setActiveTab] = useState('');

    // ✅ Get unique section names from attempt
    const sectionNames = attempt.sections.reduce((acc, section) => {
      if (section.name && !acc.includes(section.name)) {
        acc.push(section.name);
      }
      return acc;
    }, []);

    const getSectionsForActiveTab = () => {
      if (!activeTab) {
        return [];
      }
      return attempt.sections.filter(section => section.name === activeTab);
    };

    const activeSections = getSectionsForActiveTab();

    // ✅ Get icon for section
    const getSectionIcon = (sectionName: string) => {
      const name = sectionName?.toLowerCase() || '';
      if (name.includes('speaking') || name.includes('writing')) {
        return Mic;
      } else if (name.includes('reading')) {
        return BookOpen;
      } else if (name.includes('listening')) {
        return Headphones;
      }
      return BookOpen;
    };

    // ✅ Audio URL check function
    const isAudioUrl = (text: string) => {
      return text && (
        text.includes('.mp3') ||
        text.includes('.wav') ||
        text.includes('.webm') ||
        text.includes('.ogg') ||
        text.startsWith('/uploads/') ||
        text.includes('blob:')
      );
    };

    const formatStructuredAnswer = (answer: any) => {
      try {
        const parsed =
          typeof answer === "string" ? JSON.parse(answer) : answer;

        // ✅ ARRAY CASE
        if (Array.isArray(parsed)) {
          return parsed.map((item, index) => (
            <div key={index}>
              {index + 1}. {String(item).trim()}
            </div>
          ));
        }

        // ✅ OBJECT CASE (zone-1, zone-2 etc.)
        if (typeof parsed === "object" && parsed !== null) {
          return Object.values(parsed).map((value: any, index: number) => (
            <div key={index}>
              {index + 1}. {String(value).trim()}
            </div>
          ));
        }

        return null;
      } catch {
        return null;
      }
    };



    // ✅ Render user answer
    const renderUserAnswer = (q: any, qd: any) => {
      const userAnswer = q.answerText || "";

      // 🎤 AUDIO
      if (isAudioUrl(userAnswer)) {
        const audioUrl = userAnswer.startsWith("http")
          ? userAnswer
          : `${audioBaseUrl}${userAnswer}`;

        return (
          <div className="flex flex-col gap-1">
            <div className="text-xs text-slate-500 mb-1">🎤 Recording</div>
            <audio controls className="h-8 w-full">
              <source src={audioUrl} type="audio/webm" />
              <source src={audioUrl} type="audio/mp3" />
            </audio>
          </div>
        );
      }

      // ✅ ARRAY / OBJECT JSON ANSWERS
      const structured = formatStructuredAnswer(userAnswer);
      if (structured) {
        return (
          <div className="text-sm  text-slate-700 dark:text-slate-300 space-y-1">
            {structured}
          </div>
        );
      }

      // 📝 NORMAL HTML TEXT
      if (q.answerText) {
        return (
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: q.answerText }}
          />
        );
      }

      // 🔠 MCQ
      const getOptionLabel = (idx: number) => {
        if (!qd?.options || !qd.options[idx]) return "--";
        return (
          qd.options[idx].label ||
          String.fromCharCode("A".charCodeAt(0) + idx)
        );
      };

      if (q.answerOptionIndexes?.length > 0) {
        return q.answerOptionIndexes.map(getOptionLabel).join(", ");
      }

      return "--";
    };



    // ✅ Render correct answer
    const renderCorrectAnswer = (qd: any, q: any) => {
      const correctLabels = qd?.options
        ?.filter((o: any) => o.isCorrect)
        .map((o: any) => `${o.label}. ${o.text}`);

      const evaluationMeta = q?.evaluationMeta;

      return (
        <div className="space-y-3">

          {/* MCQ correct answers */}
          {correctLabels?.length > 0 && (
            <div className="space-y-1">
              {correctLabels.map((label: string, idx: number) => (
                <div key={idx} className="text-emerald-700 dark:text-emerald-300">
                  {label}
                </div>
              ))}
            </div>
          )}

          {/* Text correct answer */}
          {!correctLabels?.length && qd?.correctAnswerText && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-emerald-700 dark:text-emerald-300"
              dangerouslySetInnerHTML={{ __html: qd.correctAnswerText }}
            />
          )}

          {/* Explanation */}
          {qd?.explanation && (
            <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/30">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Explanation
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {qd.explanation}
              </div>
            </div>
          )}


          {evaluationMeta && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 space-y-3">

              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Evaluation Feedback
              </div>

              {evaluationMeta.transcript && (
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-bold">Transcript :</span> {evaluationMeta.transcript}
                </p>
              )}

              {typeof evaluationMeta.accuracy === "number" && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-800 dark:text-slate-200"><span className="font-bold">Accuracy :</span> <span className="text-xs font-bold">
                    {Math.round(evaluationMeta.accuracy * 100)}%
                  </span></p>

                </div>
              )}

              {evaluationMeta.missingKeywords?.length > 0 && (
                <div className="text-sm text-red-600">
                  <span className="font-bold">Missing Keywords: </span>
                  {evaluationMeta.missingKeywords.join(", ")}
                </div>
              )}


              {evaluationMeta.extraWords?.length > 0 && (
                <div className="text-sm text-amber-600">
                  <span className="font-bold">Extra Words: </span>
                  {evaluationMeta.extraWords.join(", ")}
                </div>
              )}

            </div>
          )}

          {!correctLabels?.length &&
            !qd?.correctAnswerText &&
            !qd?.explanation &&
            !evaluationMeta &&
            "--"}
        </div>
      );
    };



    useEffect(() => {
      if (sectionNames.length > 0 && !activeTab) {
        setActiveTab(sectionNames[0]);
      }
    }, [sectionNames, activeTab]);

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

    const formatFillUps = (text: string) => {
      if (!text) return "";

      // {{1}}, {{2}}, {{10}} → _____
      return text.replace(/\{\{\d+\}\}/g, "_____");
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

          <div className="flex">
            <Button
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 mx-2"
              onClick={onTakeAnotherTest}
            >
              Take Another Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={navigateBack}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button variant="outline" size="sm" className="border-slate-300 mx-2 dark:border-slate-600" onClick={() => window.print()}>
              Print Results
            </Button>
          </div>


        </div>

        {/* Overall Stats */}
        {overall && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Total Questions",
                value: overall.totalQuestions,
                icon: BookOpen,
                color: "indigo",
              },
              {
                label: "Attempted",
                value: `${overall.totalAttempted} (${Math.round(
                  (overall.totalAttempted / overall.totalQuestions) * 100
                )}%)`,
                icon: Edit3,
                color: "blue",
              },
              {
                label: "Correct",
                value: `${overall.totalCorrect} (${Math.round(
                  (overall.totalCorrect / overall.totalQuestions) * 100
                )}%)`,
                icon: CheckCircle2,
                color: "emerald",
              },
              {
                label: "Incorrect",
                value: `${overall.totalIncorrect} (${Math.round(
                  (overall.totalIncorrect / overall.totalQuestions) * 100
                )}%)`,
                icon: AlertTriangle,
                color: "red",
              },
              {
                label: "Raw Score",
                value: `${overall.rawScore}/${overall.totalQuestions}`,
                icon: Flag,
                color: "purple",
              },
            ].map((item, i) => {
              const colorMap: any = {
                indigo:
                  "from-indigo-500/10 to-indigo-500/0 text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30",
                blue:
                  "from-blue-500/10 to-blue-500/0 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
                emerald:
                  "from-emerald-500/10 to-emerald-500/0 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
                red:
                  "from-red-500/10 to-red-500/0 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
                purple:
                  "from-purple-500/10 to-purple-500/0 text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
              };

              return (
                <div
                  key={i}
                  className="
            relative overflow-hidden rounded-2xl
            border border-slate-200/60 dark:border-slate-700/60
            bg-white/80 dark:bg-slate-900/60
            backdrop-blur-md
            p-2
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-xl
          "
                >

                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${colorMap[item.color].split(" ")[0]} pointer-events-none`}
                  />

                  <div className="relative flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                        {item.value}
                      </p>
                    </div>

                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorMap[item.color].split(" ").slice(-2).join(" ")}`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${colorMap[item.color].split(" ")[2]}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Performance Summary */}
        {overall && (
          <div className="
    relative overflow-hidden rounded-2xl
    border border-slate-200/60 dark:border-slate-700/60
    bg-white/70 dark:bg-slate-900/60
    backdrop-blur-xl
    shadow-xl
    p-6
  ">
            {/* Soft background glow */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-cyan-600 dark:from-slate-50 dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent tracking-tight">
              Performance Summary
            </h3>

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ===== LEFT: METRICS ===== */}
              <div className="space-y-6">

                {/* Accuracy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Accuracy
                    </span>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      {overall.totalAttempted > 0
                        ? ((overall.totalCorrect / overall.totalAttempted) * 100).toFixed(1)
                        : "0"}%
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700 ease-out"
                      style={{
                        width: `${overall.totalAttempted > 0
                            ? (overall.totalCorrect / overall.totalAttempted) * 100
                            : 0
                          }%`
                      }}
                    />
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Completion Rate
                    </span>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {((overall.totalAttempted / overall.totalQuestions) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700 ease-out"
                      style={{
                        width: `${(overall.totalAttempted / overall.totalQuestions) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ===== RIGHT: SCORE CIRCLE ===== */}
              <div className="flex items-center justify-center">
                <div className="relative h-44 w-44">

                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                        {overall.rawScore}
                      </div>
                      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Raw Score
                      </div>
                    </div>
                  </div>

                  {/* SVG Ring */}
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      className="dark:stroke-slate-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(overall.rawScore / overall.totalQuestions) * 251.2
                        } 251.2`}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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



        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
            {/* All Sections Tab */}


            {/* Individual Section Tabs */}
            {sectionNames.map((sectionName) => {
              const Icon = getSectionIcon(sectionName);
              const sectionData = attempt.sections.find(sec => sec.name === sectionName);
              const sectionStats = sectionData?.stats || {};
              const sectionQuestions = sectionData?.questions?.length || 0;

              return (
                <button
                  key={sectionName}
                  onClick={() => setActiveTab(sectionName)}
                  className={`flex-shrink-0 flex items-center justify-center p-4 gap-3 transition-colors ${activeTab === sectionName
                    ? ' border-b-2 border-indigo-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${activeTab === sectionName
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{sectionName}</div>

                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}

          <div className="p-4">
            {activeSections.length > 0 ? (
              <div className="space-y-6">
                {activeSections.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden transition-all duration-200 hover:shadow-lg"
                  >


                    {/* ✅ UPDATED: Questions in Card/Block Layout */}
                    <div className="p-4 space-y-4">
                      {sec.questions.map((q, qIdx) => {
                        const qd = q.questionDoc;
                        const status = getQuestionStatus(q, qd);
                        const statusClass = getStatusColor(status);

                        return (
                          <div
                            key={qIdx}
                            className={`rounded-lg border ${status === "correct"
                              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
                              : status === "incorrect"
                                ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                              } p-4 transition-all duration-200 hover:shadow-md`}
                          >
                            {/* Question Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${status === "correct"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                  : status === "incorrect"
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  }`}>
                                  <span className="font-bold text-sm">{q.order || qIdx + 1}</span>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ${statusClass}`}>
                                  {getStatusIcon(status)}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </div>

                              <div className="flex items-center text-slate-600 dark:text-slate-400">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                <span className="font-mono text-xs">{formatTimeSpent(q.timeSpentSeconds)}</span>
                              </div>
                            </div>

                            {/* Question Text */}
                            <div className="mb-4">
                              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Question:
                              </h5>

                              {qd ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: formatFillUps(qd.questionText),
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="text-slate-400 dark:text-slate-500 italic p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                  No question preview available
                                </div>
                              )}
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Correct Answer */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                  <h5 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Correct Answer</h5>
                                </div>
                                <div className={`p-3 rounded-lg ${status === "correct"
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 "
                                  : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  }`}>
                                  {renderCorrectAnswer(qd, q)}
                                </div>
                              </div>

                              {/* User's Answer */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`h-2 w-2 rounded-full ${status === "correct"
                                    ? "bg-emerald-500"
                                    : status === "incorrect"
                                      ? "bg-red-500"
                                      : "bg-slate-500"
                                    }`}></div>
                                  <h5 className={`text-sm font-medium ${status === "correct"
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : status === "incorrect"
                                      ? "text-red-700 dark:text-red-300"
                                      : "text-slate-700 dark:text-slate-300"
                                    }`}>Your Answer</h5>
                                </div>
                                <div className={`p-3 rounded-lg ${status === "correct"
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                                  : status === "incorrect"
                                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                    : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                                  }`}>
                                  <div className={` ${status === "correct"
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : status === "incorrect"
                                      ? "text-red-700  dark:text-red-300"
                                      : "text-slate-700 dark:text-slate-300"
                                    }`}>
                                    {renderUserAnswer(q, qd)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Loading section results...
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Please wait or select a section
                </p>
              </div>
            )}
          </div>
        </div>



      </div>
    );
  }
);
