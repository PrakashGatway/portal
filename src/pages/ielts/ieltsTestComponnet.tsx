// components/ielts/questions/SingleChoiceQuestion.jsx
import React, { useMemo, useRef, useState } from "react";

export const SingleChoiceQuestion = ({
  question,
  answer,
  setAnswer,
  questionNumber,
}) => {
  const questionId = question?._id || question?.id || questionNumber;

  return (
    <div className="">
      {question.instructions && (
        <p className="question-instructions">{question.instructions}</p>
      )}

      <div className="flex gap-2">
        <span className="rounded-full text-white flex items-center font-medium justify-center !h-8 !w-8 bg-slate-700 flex-shrink-0">
          {questionNumber}
        </span>

        <div
          dangerouslySetInnerHTML={{
            __html: question?.content || "",
          }}
        />
      </div>

      <div className="choices">
        {question.choices?.map((choice, idx) => (
          <label
            key={choice?._id || choice?.label || idx}
            className="px-4 flex gap-3"
          >
            <input
              type="radio"
              name={`answer-${questionId}`}
              value={choice.label}
              checked={answer === choice.label}
              onChange={(e) => setAnswer(e.target.value)}
            />

            <span className="choice-label">{choice.label}</span>

            <span className="choice-text">{choice.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const MultipleChoiceQuestion = ({ question, answer, setAnswer }) => {
  const handleAnswerChange = (choiceLabel) => {
    const currentAnswers = Array.isArray(answer) ? answer : [];
    const newAnswers = currentAnswers.includes(choiceLabel)
      ? currentAnswers.filter((a) => a !== choiceLabel)
      : [...currentAnswers, choiceLabel];
    setAnswer(newAnswers);
  };

  return (
    <div className="">
      {question.instructions && (
        <p className="question-instructions">{question.instructions}</p>
      )}

      <div dangerouslySetInnerHTML={{ __html: question?.content || "" }} />

      <div className="choices">
        {question.choices?.map((choice, idx) => (
          <label key={idx} className="px-4 flex gap-3">
            <input
              type="checkbox"
              checked={Array.isArray(answer) && answer.includes(choice.label)}
              onChange={() => handleAnswerChange(choice.label)}
            />
            <span className="choice-label">{choice.label}</span>
            <span className="choice-text">{choice.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const TrueFalseNGQuestion = ({
  question,
  answer,
  setAnswer,
  questionType,
  questionNumber,
}) => {
  const options =
    questionType === "true_false_ng"
      ? ["True", "False", "Not Given"]
      : ["Yes", "No", "Not Given"];

  const questionId = question?._id || question?.id || "question";

  return (
    <div className=" true-false-ng">
      <div className="flex gap-2">
        <span className="rounded-full text-white flex items-center font-medium justify-center !h-8 !w-8 bg-slate-700">
          {questionNumber}
        </span>{" "}
        <div dangerouslySetInnerHTML={{ __html: question?.content || "" }} />
      </div>

      <div className="flex gap-2 py-2">
        {options.map((option) => {
          const isSelected = answer === option;

          return (
            <label
              key={option}
              className={`flex items-center justify-center border rounded-xl gap-1 px-2 py-1  ${
                isSelected ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name={`answer-${questionId}`}
                value={option}
                checked={isSelected}
                onChange={() => setAnswer(option)}
              />

              <span className="choice-text">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

import { Fragment, createElement } from "react";

const attrsToProps = (el) => {
  const props = { key: undefined };
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name;
    const value = attr.value;

    if (name === "class") {
      props.className = value;
    } else if (name === "style") {
      // Convert "color: red; font-weight: bold;" -> { color: 'red', fontWeight: 'bold' }
      const styleObj = {};
      value.split(";").forEach((decl) => {
        const [prop, val] = decl.split(":");
        if (prop && val) {
          const camelProp = prop
            .trim()
            .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          styleObj[camelProp] = val.trim();
        }
      });
      props.style = styleObj;
    } else if (name === "for") {
      props.htmlFor = value;
    } else {
      // data-*, id, title, etc. pass through as-is
      props[name] = value;
    }
  }
  return props;
};

export const CompletionQuestion = ({
  question,
  answer,
  setAnswer,
  questionNumber,
  questionSet,
}) => {
  const parsedAnswers = useMemo(() => {
    if (!answer) return {};
    const values = String(answer).split(",");
    return values.reduce((acc, value, index) => {
      acc[index + 1] = value.trim();
      return acc;
    }, {});
  }, [answer]);

  const [inputValues, setInputValues] = useState(parsedAnswers);

  useEffect(() => {
    setInputValues(parsedAnswers);
  }, [parsedAnswers]);

  const inputNumbers = useMemo(() => {
    if (!question?.content) return [];
    const matches = [...String(question.content).matchAll(/\{\{(\d+)\}\}/g)];
    return [...new Set(matches.map((match) => Number(match[1])))];
  }, [question?.content]);

  const handleInputChange = (inputNumber, value) => {
    setInputValues((prev) => {
      const updated = {
        ...prev,
        [inputNumber]: value,
      };

      const formattedAnswer = inputNumbers
        .sort((a, b) => a - b)
        .map((number) => updated[number] || "")
        .join(",");

      setAnswer(formattedAnswer);

      return updated;
    });
  };

  const renderInputForNumber = (inputNumber, keySuffix) => {
    const placeholder =
      inputNumber + (questionSet?.questionRange?.from || questionNumber) - 1;

    return (
      <span key={`input-wrap-${inputNumber}-${keySuffix}`}>
        <span className="rounded-full text-white inline-flex items-center font-medium justify-center !h-8 !w-8 bg-slate-700">
          {placeholder}
        </span>{" "}
        <input
          type="text"
          className="completion-input"
          value={inputValues[inputNumber] || ""}
          onChange={(e) => handleInputChange(inputNumber, e.target.value)}
          placeholder={`Answer ${placeholder}`}
          autoComplete="off"
        />
      </span>
    );
  };

  // Walk a text string, replacing {{n}} tokens with real input elements,
  // leaving surrounding text untouched.
  const renderTextWithPlaceholders = (text, keyPrefix) => {
    const parts = text.split(/(\{\{\d+\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/^\{\{(\d+)\}\}$/);
      if (match) {
        return renderInputForNumber(Number(match[1]), `${keyPrefix}-${i}`);
      }
      return part ? (
        <Fragment key={`${keyPrefix}-text-${i}`}>{part}</Fragment>
      ) : null;
    });
  };

  const domNodeToReact = (node, keyPrefix) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return renderTextWithPlaceholders(node.textContent || "", keyPrefix);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const tag = node.tagName.toLowerCase();
    const props = attrsToProps(node);
    props.key = keyPrefix;

    const children = Array.from(node.childNodes).map((child, idx) =>
      domNodeToReact(child, `${keyPrefix}-${idx}`),
    );

    return createElement(tag, props, ...children);
  };

  const renderContent = () => {
    if (!question?.content) return null;
    const container = document.createElement("div");
    container.innerHTML = String(question.content);

    return Array.from(container.childNodes).map((node, index) =>
      domNodeToReact(node, `root-${index}`),
    );
  };

  return (
    <div className="question-type completion">
      {question?.instructions && (
        <p
          className="question-instructions"
          dangerouslySetInnerHTML={{
            __html: question.instructions,
          }}
        />
      )}

      <div className="completion-content">{renderContent()}</div>

      {question?.constraints?.maxWords && (
        <p className="word-limit">
          Write NO MORE THAN {question.constraints.maxWords} WORDS
        </p>
      )}
    </div>
  );
};
export const MatchingQuestion = ({
  question,
  answer,
  setAnswer,
  questionNumber,
  questionSet,
}) => {
  const commonOptions = questionSet?.commonOptions
    ? questionSet.commonOptions
        .split(",")
        .map((choice) => choice.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="w-full">
      {question.instructions && (
        <p className="question-instructions mb-3">{question.instructions}</p>
      )}

      <div className="flex w-full items-center gap-2">
        {/* Question Number */}
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
          {questionNumber}
        </span>

        {/* Question Content */}
        <div
          className="min-w-0 flex-1 text-gray-900 dark:text-gray-100"
          dangerouslySetInnerHTML={{
            __html: question?.content || "",
          }}
        />

        {/* Answer Select */}
        <div className="w-full max-w-[120px] flex-shrink-0">
          <select
            value={answer || ""}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Select...</option>

            {commonOptions.map((choice, idx) => (
              <option key={`${choice}-${idx}`} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export const EssayWritingQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type essay-writing">
      <div className="writing-prompt">
        <h3>{question.content}</h3>
        {question.instructions && (
          <p className="instructions">{question.instructions}</p>
        )}

        {question.metadata?.taskType && (
          <p className="task-type">Task: {question.metadata.taskType}</p>
        )}

        {question.metadata?.minWords && (
          <p className="word-requirement">
            You should write at least {question.metadata.minWords} words.
          </p>
        )}
      </div>

      <div className="writing-area">
        <div className="writing-toolbar">
          <span>
            Word Count:{" "}
            {answer ? answer.split(/\s+/).filter((w) => w).length : 0}
          </span>
        </div>
        <textarea
          className="essay-textarea"
          value={answer || ""}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your essay here..."
          rows={15}
        />
      </div>
    </div>
  );
};

export const LetterWritingQuestion = ({
  question,
  answer,
  setAnswer,
  questionSet,
}) => {
  const wordCount = useMemo(() => {
    if (!answer || typeof answer !== "string") return 0;

    return answer.trim().split(/\s+/).filter(Boolean).length;
  }, [answer]);

  const taskTitle = questionSet?.title || question?.title || "Task 1";

  return (
    <div className="grid min-h-0 h-[calc(100vh-126px-74px)] w-full grid-cols-1 lg:grid-cols-[50%_50%]">
      <div
        className="
            h-full
            min-w-0
            overflow-y-auto
            border-r
            border-slate-200
            bg-white
          "
      >
        <div className="py-3">
          <h1
            className="
                mb-5
                text-2xl
                font-bold
                uppercase
                tracking-tight
                text-[#234b70]
              "
          >
            {taskTitle}
          </h1>

          {/* QUESTION INSTRUCTIONS */}
          {question?.instructions && (
            <div
              className="
                  mb-6
                  text-[17px]
                  leading-7
                  text-slate-800

                  [&_p]:mb-4
                  [&_p:last-child]:mb-0

                  [&_strong]:font-bold
                  [&_b]:font-bold

                  [&_ul]:my-4
                  [&_ul]:list-disc
                  [&_ul]:pl-6

                  [&_ol]:my-4
                  [&_ol]:list-decimal
                  [&_ol]:pl-6
                "
              dangerouslySetInnerHTML={{
                __html: question.instructions,
              }}
            />
          )}

          {/* QUESTION CONTENT */}
          {question?.content && (
            <div
              className="
                  min-w-0
                  text-[17px]
                  leading-7
                  text-slate-800

                  [&_p]:mb-4
                  [&_p:last-child]:mb-0

                  [&_strong]:font-bold
                  [&_b]:font-bold

                  [&_ul]:my-4
                  [&_ul]:list-disc
                  [&_ul]:pl-6

                  [&_ol]:my-4
                  [&_ol]:list-decimal
                  [&_ol]:pl-6

                  [&_img]:my-6
                  [&_img]:max-w-full
                  [&_img]:h-auto
                  [&_img]:rounded-sm
                "
              dangerouslySetInnerHTML={{
                __html: question.content,
              }}
            />
          )}
        </div>
      </div>
      <div
        className="
            flex
            min-h-0
            min-w-0
            flex-col
            bg-white
          "
      >
        {/* TEXTAREA AREA */}
        <div className="min-h-0 p-4">
          {/* WORD COUNT */}
          <div
            className="
              shrink-0
              pb-2
              text-end
              text-[17px]
              font-medium
              text-slate-800
            "
          >
            Words Count: {wordCount}
          </div>
          <textarea
            value={answer || ""}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your essay here..."
            spellCheck={true}
            className="
                block
                h-full
                min-h-[450px]
                w-full
                resize-none
                rounded-[5px]
                border
                border-slate-300
                bg-white
                p-4
                text-[16px]
                leading-7
                text-slate-800
                outline-none
                transition

                placeholder:text-slate-400

                focus:border-slate-400
                focus:ring-0
              "
          />
        </div>
      </div>
    </div>
  );
};

import { Square, Pause, ChevronRight } from "lucide-react";

export const SpeakingQuestion = ({
  question,
  answer,
  setAnswer,
  audioRecordings = {},
  setAudioRecordings,
}) => {
  const parsedContent = useMemo(() => {
    const content = question?.content;

    if (!content) {
      return {
        question: "",
        followUpQuestions: [],
        tips: [],
      };
    }

    // Already object
    if (typeof content === "object") {
      return content;
    }

    // JSON string
    if (typeof content === "string") {
      const value = content.trim();

      if (!value) {
        return {
          question: "",
          followUpQuestions: [],
          tips: [],
        };
      }

      try {
        const parsed = JSON.parse(value);

        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (error) {
        // Not JSON.
        // Treat it as normal question text.
      }

      return {
        question: value,
        followUpQuestions: [],
        tips: [],
      };
    }

    return {
      question: String(content),
      followUpQuestions: [],
      tips: [],
    };
  }, [question?.content]);

  const speakingQuestions = useMemo(() => {
    const list = [];
      if (parsedContent?.question) {
      list.push({
        id: "main",
        type: "main",
        text: parsedContent.question,
        mediaType: "none",
      });
    }
    if (Array.isArray(parsedContent?.followUpQuestions)) {
      parsedContent.followUpQuestions.forEach((item, index) => {
        const text =
          typeof item === "string" ? item : item?.text || item?.question || "";

        if (!text) return;

        list.push({
          id: `followup-${index}`,
          type: "followup",
          text,
          mediaType:
            typeof item === "object" ? item?.mediaType || "none" : "none",
          mediaUrl: "",
        });
      });
    }

    return list;
  }, [parsedContent]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentSpeakingQuestion =
    speakingQuestions[currentQuestionIndex] || null;


  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);

  const [recordingTime, setRecordingTime] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const [recordingError, setRecordingError] = useState("");

  const [audioUrls, setAudioUrls] = useState({});

  const audioElementRef = useRef(null);


  const questionId = String(question?._id || "question");

  const recordingKey = `${questionId}-${currentQuestionIndex}`;

  const currentRecording = audioRecordings?.[recordingKey] || null;


  useEffect(() => {
    const recording = audioRecordings?.[recordingKey];

    if (!recording?.blob) {
      setAudioUrls((prev) => {
        const next = { ...prev };

        delete next[recordingKey];

        return next;
      });

      return;
    }

    const url = URL.createObjectURL(recording.blob);

    setAudioUrls((prev) => ({
      ...prev,
      [recordingKey]: url,
    }));

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioRecordings, recordingKey]);


  useEffect(() => {
    setRecordingTime(currentRecording?.duration || 0);

    setIsPlaying(false);
    setRecordingError("");

    clearInterval(timerRef.current);
  }, [currentQuestionIndex, currentRecording]);

  // ============================================================
  // CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      mediaStreamRef.current?.getTracks()?.forEach((track) => {
        track.stop();
      });
    };
  }, []);

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (seconds) => {
    const safeSeconds = Number(seconds) || 0;

    const minutes = Math.floor(safeSeconds / 60);

    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  // ============================================================
  // START RECORDING
  // ============================================================

  const startRecording = async () => {
    try {
      setRecordingError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported by this browser.");
      }

      /*
       * Stop previous microphone stream.
       */
      mediaStreamRef.current?.getTracks()?.forEach((track) => {
        track.stop();
      });

      /*
       * Request microphone.
       */
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      chunksRef.current = [];

      /*
       * Select browser-supported format.
       */
      let mimeType = "";

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: finalMimeType,
        });

        const extension = finalMimeType.includes("mp4") ? "mp4" : "webm";

        const file = new File(
          [blob],
          `speaking-${questionId}-${currentQuestionIndex}.${extension}`,
          {
            type: finalMimeType,
          },
        );

        setAudioRecordings?.((prev) => ({
          ...prev,

          [recordingKey]: {
            blob,
            file,
            mimeType: finalMimeType,
            duration: recordingTime,
            questionId,
            questionIndex: currentQuestionIndex,
            questionText: currentSpeakingQuestion?.text || "",
          },
        }));

        mediaStreamRef.current?.getTracks()?.forEach((track) => {
          track.stop();
        });

        mediaStreamRef.current = null;
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);

        setRecordingError("Unable to record audio.");
      };
      recorder.start(250);

      setRecordingTime(0);
      setIsRecording(true);

      clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch (error) {
      console.error("Start recording error:", error);

      setRecordingError(
        error?.message ||
          "Please allow microphone access to record your answer.",
      );

      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.stop();
    }

    clearInterval(timerRef.current);

    setIsRecording(false);
  };

  const handleNextQuestion = () => {

    if (isRecording) {
      stopRecording();
      return;
    }
    if (currentQuestionIndex >= speakingQuestions.length - 1) {
      return;
    }
    setCurrentQuestionIndex((previous) => previous + 1);

    setRecordingTime(0);
    setIsPlaying(false);
    setRecordingError("");
  };

  const handlePreviousQuestion = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (currentQuestionIndex <= 0) {
      return;
    }

    setCurrentQuestionIndex((previous) => previous - 1);

    setIsPlaying(false);
    setRecordingError("");
  };

  if (!currentSpeakingQuestion) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
        No Speaking question available.
      </div>
    );
  }

  const currentAudioUrl = audioUrls[recordingKey];

  const hasRecording = Boolean(currentRecording);

  const isLastQuestion = currentQuestionIndex === speakingQuestions.length - 1;

  return (
    <div className="w-full py-4">
      <div className="">
        <div className="rounded-xl max-w-2xl bg-[#f5f6f8] p-6 py-4 mx-auto">
          {/* Question counter */}
          <div className="">
            <span className="text-sm font-semibold text-slate-500">
              Question {currentQuestionIndex + 1} of {speakingQuestions.length}
            </span>
            <h2 className="text-[21px] font-medium leading-9 text-[#172033]">
              {currentSpeakingQuestion.text}
            </h2>
          </div>

          {question?.questionType === "speaking_part_2" &&
            currentQuestionIndex === 0 &&
            question?.metadata?.cueCardPoints?.length > 0 && (
              <div className="mt-5 rounded-xl bg-white p-5">
                <h3 className="mb-3 font-bold text-[#173d64]">
                  You should say:
                </h3>

                <ul className="list-disc space-y-2 pl-5 text-[16px] leading-7 text-slate-700">
                  {question.metadata.cueCardPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        <div className="mt-6">
          {/* Waveform-style area */}
          <div className="relative flex min-h-[100px] items-center justify-center overflow-hidden">
            <div className="absolute left-0 right-0 flex items-center justify-center">
              <div className="flex w-full max-w-2xl items-center gap-[2px] opacity-70">
                {Array.from({
                  length: 120,
                }).map((_, index) => {
                  const height = isRecording
                    ? 5 + Math.random() * 32
                    : 3 + Math.abs(Math.sin(index * 0.7)) * 12;

                  return (
                    <span
                      key={index}
                      className="flex-1 rounded-full bg-[#dc7182]"
                      style={{
                        height: `${height}px`,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Microphone button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`
                relative
                z-10
                flex
                h-[76px]
                w-[76px]
                items-center
                justify-center
                rounded-full
                bg-white
                shadow-[0_5px_25px_rgba(0,0,0,0.12)]
                transition
                ${isRecording ? "ring-4 ring-red-100" : "hover:scale-105"}
              `}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <Square size={28} fill="#d95770" color="#d95770" />
              ) : (
                <Mic size={34} color="#d95770" />
              )}
            </button>
          </div>

          {/* ==================================================
              TIMER
          ================================================== */}

          <div className="mt-1 text-center">
            <span className="text-[21px] font-bold text-[#d95770]">
              {formatTime(
                isRecording
                  ? recordingTime
                  : currentRecording?.duration || recordingTime,
              )}
            </span>
          </div>

          {/* Recording status */}
          <div className="mt-2 text-center">
            {isRecording ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-red-500">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                Recording...
              </div>
            ) : hasRecording ? (
              <span className="text-sm font-medium text-emerald-600">
                Recording saved
              </span>
            ) : (
              <span className="text-sm text-slate-400">
                Click the microphone to start
              </span>
            )}
          </div>

          {/* Error */}
          {recordingError && (
            <p className="mt-4 text-center text-sm font-medium text-red-500">
              {recordingError}
            </p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          {currentQuestionIndex > 0 && (
            <button
              type="button"
              onClick={handlePreviousQuestion}
              disabled={isRecording}
              className="rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
          )}

          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={isRecording}
              className="flex items-center gap-2 rounded-full bg-[#b95068] px-7 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#a9445b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next question
              <ChevronRight size={19} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isRecording}
              className="flex items-center gap-2 rounded-full bg-[#b95068] px-7 py-3 text-base font-bold text-white shadow-sm transition hover:bg-[#a9445b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finish Speaking
              <ChevronRight size={19} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ListeningMatchingQuestion = ({
  question,
  answer,
  setAnswer,
  questionNumber,
  questionSet,
}) => {
  const commonOptions = questionSet?.commonOptions
    ? questionSet.commonOptions
        .split(",")
        .map((choice) => choice.trim())
        .filter(Boolean)
    : [];
  const parsedAnswers = useMemo(() => {
    if (!answer) return {};
    const values = Array.isArray(answer) ? answer : String(answer).split(",");
    return values.reduce((acc, value, index) => {
      acc[index + 1] = (value || "").toString().trim();
      return acc;
    }, {});
  }, [answer]);

  const [inputValues, setInputValues] = useState(parsedAnswers);

  useEffect(() => {
    setInputValues(parsedAnswers);
  }, [parsedAnswers]);

  const inputNumbers = useMemo(() => {
    if (!question?.content) return [];
    const matches = [...String(question.content).matchAll(/\{\{(\d+)\}\}/g)];
    return [...new Set(matches.map((match) => Number(match[1])))];
  }, [question?.content]);

  const handleSelectChange = (inputNumber, value) => {
    setInputValues((prev) => {
      const updated = {
        ...prev,
        [inputNumber]: value,
      };

      const formattedAnswer = inputNumbers
        .sort((a, b) => a - b)
        .map((number) => updated[number] || "")
        .join(",");

      setAnswer(formattedAnswer);

      return updated;
    });
  };

  const renderSelectForNumber = (inputNumber, keySuffix) => {
    const placeholder =
      inputNumber + (questionSet?.questionRange?.from || questionNumber) - 1;

    return (
      <span
        key={`select-wrap-${inputNumber}-${keySuffix}`}
        className="inline-flex items-center gap-2"
      >
        <span className="rounded-full text-white inline-flex items-center font-medium justify-center !h-8 !w-8 px-2 bg-slate-700">
          {placeholder}
        </span>
        <select
          value={inputValues[inputNumber] || ""}
          onChange={(e) => handleSelectChange(inputNumber, e.target.value)}
          className="w-full min-w-[80px] max-w-[160px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Select...</option>
          {commonOptions?.map((choice, choiceIdx) => (
            <option key={choiceIdx} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      </span>
    );
  };

  const renderTextWithPlaceholders = (text, keyPrefix) => {
    const parts = text.split(/(\{\{\d+\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/^\{\{(\d+)\}\}$/);
      if (match) {
        return renderSelectForNumber(Number(match[1]), `${keyPrefix}-${i}`);
      }
      return part ? (
        <Fragment key={`${keyPrefix}-text-${i}`}>{part}</Fragment>
      ) : null;
    });
  };
  const domNodeToReact = (node, keyPrefix) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return renderTextWithPlaceholders(node.textContent || "", keyPrefix);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const tag = node.tagName.toLowerCase();
    const props = attrsToProps(node);
    props.key = keyPrefix;

    const children = Array.from(node.childNodes).map((child, idx) =>
      domNodeToReact(child, `${keyPrefix}-${idx}`),
    );

    return createElement(tag, props, ...children);
  };

  const renderContent = () => {
    if (!question?.content) return null;

    const container = document.createElement("div");
    container.innerHTML = String(question.content);

    return Array.from(container.childNodes).map((node, index) =>
      domNodeToReact(node, `root-${index}`),
    );
  };

  return (
    <div className="">
      {question?.instructions && (
        <p
          className="question-instructions"
          dangerouslySetInnerHTML={{
            __html: question.instructions,
          }}
        />
      )}

      <div className="">{renderContent()}</div>
    </div>
  );
};

export const PickFromListQuestion = ({ question, answer, setAnswer }) => {
  return (
    <div className="question-type pick-from-list">
      <div className="question-text">
        <p>{question.content}</p>
      </div>

      <div className="pick-list">
        {question.choices?.map((choice, idx) => (
          <label key={idx} className="pick-item">
            <input
              type="checkbox"
              checked={Array.isArray(answer) && answer.includes(choice.label)}
              onChange={(e) => {
                const current = Array.isArray(answer) ? answer : [];
                const newAnswer = e.target.checked
                  ? [...current, choice.label]
                  : current.filter((a) => a !== choice.label);
                setAnswer(newAnswer);
              }}
            />
            <span className="choice-label">{choice.label}</span>
            <span className="choice-text">{choice.text}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

import {
  Book,
  Clock,
  Headphones,
  Mic,
  PenTool,
  Play,
  RotateCcw,
} from "lucide-react";

export const TestInstructions = ({
  testData,
  onStartSection,
  onResume,
  loading = false,
}) => {
  const [selectedSection, setSelectedSection] = useState(null);

  const orderedSections = useMemo(() => {
    return [...(testData?.sections || [])].sort(
      (a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0),
    );
  }, [testData?.sections]);

  const getSectionIcon = (section) => {
    switch (section) {
      case "reading":
        return <Book size={24} />;
      case "listening":
        return <Headphones size={24} />;
      case "writing":
        return <PenTool size={24} />;
      case "speaking":
        return <Mic size={24} />;
      default:
        return <Book size={24} />;
    }
  };

  const handleStartSelectedSection = () => {
    if (!selectedSection || loading) return;
    onStartSection?.(selectedSection);
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:p-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              IELTS Test
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {testData?.title || "IELTS Test"}
            </h1>

            {testData?.description && (
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                {testData.description}
              </p>
            )}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Clock size={20} className="shrink-0 text-emerald-700" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Duration
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {testData?.duration || 0} minutes
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Test Type
              </p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                {(testData?.testType || "full_length").replaceAll("_", " ")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Difficulty
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {testData?.difficulty || "Mixed"}
              </p>
            </div>
          </div>

          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Choose a section to start
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  You can start from any section. After that, the test continues
                  in the configured section order and never restarts a completed
                  section.
                </p>
              </div>

              <button
                type="button"
                onClick={onResume}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={17} />
                Resume / Continue Test
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {orderedSections.map((section, index) => {
                const isSelected = selectedSection === section.section;

                return (
                  <button
                    key={`${section.section}-${section.order || index}`}
                    type="button"
                    onClick={() => setSelectedSection(section.section)}
                    disabled={loading}
                    className={`group rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        isSelected
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                      }`}
                    >
                      {getSectionIcon(section.section)}
                    </div>

                    <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Section {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold capitalize text-slate-900">
                      {section.section}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {section.duration || 0} minutes •{" "}
                      {section.questionCount || 0} questions
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {testData?.instructions && (
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <h2 className="text-lg font-bold text-slate-900">Instructions</h2>
              <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {testData.instructions}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Important Notes
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>• Make sure you have a stable internet connection.</li>
              <li>• Your answers are saved when a group is submitted.</li>
              <li>• You can flag questions and return to previous groups.</li>
              <li>• Completed sections will not be started again.</li>
              <li>• Listening audio is controlled by the listening section.</li>
              <li>• Keep track of the timer for the active section.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleStartSelectedSection}
              disabled={!selectedSection || loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play size={18} />
              {loading
                ? "Preparing..."
                : selectedSection
                  ? `Start ${selectedSection}`
                  : "Select a section"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// components/ielts/IeltsResult.jsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import {
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart2,
  Download,
  RefreshCw,
  Home,
} from "lucide-react";
import "./IeltsResult.css";

export const IeltsResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overall");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/ielts/attempts/${attemptId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setResult(response.data.data);
      } catch (error) {
        setError("Failed to load test results");
        console.error("Fetch result error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <p>Calculating your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/ielts/tests")}>Back to Tests</button>
      </div>
    );
  }

  const analysis = result.analysis || {};
  const score = result.score || {};

  return (
    <div className="ielts-result-page">
      <header className="result-header">
        <h1>Test Results</h1>
        <div className="result-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/ielts/tests")}
          >
            <Home size={20} />
            All Tests
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate(`/ielts/take/${result.test._id}`)}
          >
            <RefreshCw size={20} />
            Retake Test
          </button>
          <button className="primary-btn" onClick={() => window.print()}>
            <Download size={20} />
            Download
          </button>
        </div>
      </header>

      <main className="result-content">
        {/* Overall Score Card */}
        <section className="score-card">
          <div className="score-header">
            <h2>{result.test?.title || "IELTS Test"}</h2>
            <p>Completed on {formatDate(result.submittedAt)}</p>
          </div>

          <div className="overall-band">
            <div className="band-score">
              <span className="band-number">
                {analysis.overallBand || score.overall || "N/A"}
              </span>
              <span className="band-label">Overall Band Score</span>
            </div>
          </div>

          <div className="section-bands">
            {result.sections?.map((section, idx) => (
              <div key={idx} className="section-band">
                <div className="band-header">
                  <h3>{section.section.toUpperCase()}</h3>
                  <span className="band-value">
                    {section.analysis?.bandScore ||
                      section.analysis?.rawScore ||
                      "N/A"}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${section.analysis?.accuracy || 0}%` }}
                  />
                </div>
                <div className="section-stats">
                  <span>Correct: {section.analysis?.correctAnswers || 0}</span>
                  <span>Accuracy: {section.analysis?.accuracy || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Analysis */}
        <section className="analysis-section">
          <div className="analysis-tabs">
            <button
              className={activeSection === "overall" ? "active" : ""}
              onClick={() => setActiveSection("overall")}
            >
              Overall
            </button>
            {result.sections?.map((section, idx) => (
              <button
                key={idx}
                className={activeSection === section.section ? "active" : ""}
                onClick={() => setActiveSection(section.section)}
              >
                {section.section.toUpperCase()}
              </button>
            ))}
          </div>

          {activeSection === "overall" ? (
            <OverallAnalysis analysis={analysis} />
          ) : (
            <SectionAnalysis
              section={result.sections?.find(
                (s) => s.section === activeSection,
              )}
            />
          )}
        </section>

        {/* Strengths and Weaknesses */}
        {analysis.strengths?.length > 0 && (
          <section className="strengths-weaknesses">
            <div className="strengths">
              <h3>
                <TrendingUp size={20} /> Strengths
              </h3>
              <ul>
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
            {analysis.weaknesses?.length > 0 && (
              <div className="weaknesses">
                <h3>
                  <BarChart2 size={20} /> Areas for Improvement
                </h3>
                <ul>
                  {analysis.weaknesses.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Recommendations */}
        {analysis.recommendations?.length > 0 && (
          <section className="recommendations">
            <h3>
              <Award size={20} /> Recommendations
            </h3>
            <ul>
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};

const OverallAnalysis = ({ analysis }) => {
  return (
    <div className="overall-analysis">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-value">{analysis.correctAnswers || 0}</div>
          <div className="stat-label">Correct Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-value">{analysis.incorrectAnswers || 0}</div>
          <div className="stat-label">Incorrect Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-value">
            {analysis.totalTimeSpent
              ? Math.round(analysis.totalTimeSpent / 60)
              : 0}
            m
          </div>
          <div className="stat-label">Time Spent</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-value">{analysis.accuracy || 0}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
      </div>

      {analysis.summary && (
        <div className="summary">
          <h4>Summary</h4>
          <p>{analysis.summary}</p>
        </div>
      )}
    </div>
  );
};

const SectionAnalysis = ({ section }) => {
  if (!section) return null;

  const analysis = section.analysis || {};

  return (
    <div className="section-analysis">
      <h3>{section.section.toUpperCase()} Section Analysis</h3>

      <div className="section-stats-grid">
        <div className="stat-item">
          <span className="stat-label">Raw Score</span>
          <span className="stat-value">{analysis.rawScore || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Questions</span>
          <span className="stat-value">{analysis.totalQuestions || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Correct</span>
          <span className="stat-value">{analysis.correctAnswers || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Incorrect</span>
          <span className="stat-value">{analysis.incorrectAnswers || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Skipped</span>
          <span className="stat-value">{analysis.skippedQuestions || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{analysis.accuracy || 0}%</span>
        </div>
      </div>

      {analysis.feedback && (
        <div className="feedback">
          <h4>Feedback</h4>
          <p>{analysis.feedback}</p>
        </div>
      )}

      {/* Question-wise breakdown */}
      <div className="question-breakdown">
        <h4>Question Breakdown</h4>
        {section.groups?.map((group, groupIdx) => (
          <div key={groupIdx} className="breakdown-group">
            <h5>Group {groupIdx + 1}</h5>
            {group.questionSets?.map((set, setIdx) => (
              <div key={setIdx} className="breakdown-set">
                {set.questions?.map((question, questionIdx) => (
                  <div key={questionIdx} className="breakdown-question">
                    <span className="question-number">Q{questionIdx + 1}</span>
                    <span
                      className={`question-status ${question.isCorrect ? "correct" : "incorrect"}`}
                    >
                      {question.isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="question-time">{question.timeSpent}s</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
