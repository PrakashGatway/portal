// components/ielts/IeltsTestPlatform.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  Book,
  ChevronLeft,
  ChevronRight,
  Flag,
  Grid,
  Headphones,
  Maximize2,
  Minimize2,
  Mic,
  Pause,
  PenTool,
  Play,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";

import api from "../../axiosInstance";

import {
  CompletionQuestion,
  EssayWritingQuestion,
  LetterWritingQuestion,
  ListeningMatchingQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  PickFromListQuestion,
  SingleChoiceQuestion,
  SpeakingQuestion,
  TestInstructions,
  TrueFalseNGQuestion,
} from "./ieltsTestComponnet";

const IeltsTestPlatform = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Core state
  // ---------------------------------------------------------------------------
  const [attemptId, setAttemptId] = useState(null);
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // ---------------------------------------------------------------------------
  // Section / group position
  // Controller uses:
  // currentSectionIndex -> currentGroupIndex -> currentQuestionSetIndex
  // -> currentQuestionIndex
  // ---------------------------------------------------------------------------
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionDataa, setSectionData] = useState();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const [currentQuestionSetIndex, setCurrentQuestionSetIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // Answer state
  // ---------------------------------------------------------------------------
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});

  // ---------------------------------------------------------------------------
  // UI / timer
  // ---------------------------------------------------------------------------
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showOverview, setShowOverview] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sectionTransition, setSectionTransition] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);
  const [startingAttempt, setStartingAttempt] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const sectionTimerRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const questionRefs = useRef({});
  const timeoutHandledRef = useRef(false);

  const audioRef = useRef(null);
  const [audioVolume, setAudioVolume] = useState(1);
  const previousVolumeRef = useRef(1);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const idOf = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && value._id) return String(value._id);
    return String(value);
  };

  const getGroupStorageKey = useCallback(
    (attemptIdValue, groupIdValue) =>
      `ielts-attempt-${idOf(attemptIdValue)}-group-${idOf(groupIdValue)}`,
    [],
  );

  const isAnswered = useCallback((answer) => {
    if (Array.isArray(answer)) return answer.length > 0;

    if (answer && typeof answer === "object") {
      return Object.values(answer).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== "";
      });
    }

    return answer !== undefined && answer !== null && answer !== "";
  }, []);

  const formatTime = useCallback((seconds) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  }, []);

  const getQuestionNumber = useCallback(
    (questionSet, questionIndex, globalIndex) => {
      const from = Number(questionSet?.questionRange?.from);

      // If this question set explicitly defines a starting number,
      // use it.
      if (Number.isFinite(from) && from > 0) {
        return from + questionIndex;
      }

      // If question itself has an explicit order, use it.
      const questionOrder = Number(
        questionSet?.questions?.[questionIndex]?.order,
      );

      if (Number.isFinite(questionOrder) && questionOrder > 0) {
        return questionOrder;
      }

      // IMPORTANT:
      // Otherwise continue numbering globally.
      return globalIndex + 1;
    },
    [],
  );

  const questionItems = useMemo(() => {
    if (!currentGroup?.questionSets?.length) return [];

    let globalIndex = 0;

    return currentGroup.questionSets.flatMap((questionSet, questionSetIndex) =>
      (questionSet.questions || []).map((question, questionIndex) => {
        const questionNumber = getQuestionNumber(
          questionSet,
          questionIndex,
          globalIndex,
        );

        const item = {
          globalIndex,
          questionSet,
          questionSetIndex,
          questionIndex,
          question,
          questionNumber,
        };

        globalIndex += 1;

        return item;
      }),
    );
  }, [currentGroup, getQuestionNumber]);

  const currentQuestionItem = useMemo(() => {
    return (
      questionItems.find(
        (item) =>
          item.questionSetIndex === currentQuestionSetIndex &&
          item.questionIndex === currentQuestionIndex,
      ) ||
      questionItems[0] ||
      null
    );
  }, [questionItems, currentQuestionSetIndex, currentQuestionIndex]);

  const totalQuestions = questionItems.length;

  const answeredCount = useMemo(() => {
    return questionItems.filter((item) =>
      isAnswered(answers[idOf(item.question?._id)]),
    ).length;
  }, [questionItems, answers, isAnswered]);

  // ---------------------------------------------------------------------------
  // Load one group.
  //
  // IMPORTANT:
  // The controller's GET GROUP endpoint returns:
  //
  // group.questionSets               -> LIVE title/instructions/questions
  // group.attempt.questionSets       -> user's answer/flag/time state
  //
  // We merge those two sources here.
  // ---------------------------------------------------------------------------
  const loadGroup = useCallback(async (attemptIdToUse, groupId) => {
    if (!attemptIdToUse || !groupId) return null;

    try {
      const response = await api.get(
        `/ielts/attempts/${attemptIdToUse}/groups/${idOf(groupId)}`,
      );

      const groupData = response?.data?.data;

      if (!groupData?.group) {
        throw new Error("Group data was not returned by the server");
      }

      const group = groupData.group;

      setCurrentGroup(group);

      let localDraft = null;

      try {
        const rawDraft = window.localStorage.getItem(
          getGroupStorageKey(attemptIdToUse, group._id),
        );
        localDraft = rawDraft ? JSON.parse(rawDraft) : null;
      } catch (storageError) {
        console.warn("Unable to restore IELTS group draft:", storageError);
      }

      // The server is authoritative. A local draft is used only to restore
      // answers that had not yet reached the group submission endpoint.
      // live questionSets. Use the attempt data only for user state.
      const existingAnswers = {};
      const existingFlags = {};
      const existingTimeSpent = {};

      for (const attemptQuestionSet of group.attempt?.questionSets || []) {
        for (const questionAttempt of attemptQuestionSet.questions || []) {
          const questionId = idOf(questionAttempt.question);

          if (!questionId) continue;

          if (
            questionAttempt.answer !== null &&
            questionAttempt.answer !== undefined
          ) {
            existingAnswers[questionId] = questionAttempt.answer;
          }

          if (questionAttempt.flagged === true) {
            existingFlags[questionId] = true;
          }

          if (Number(questionAttempt.timeSpent) > 0) {
            existingTimeSpent[questionId] = Number(questionAttempt.timeSpent);
          }
        }
      }

      const restoredAnswers = {
        ...existingAnswers,
        ...(localDraft?.answers || {}),
      };
      const restoredFlags = {
        ...existingFlags,
        ...(localDraft?.flaggedQuestions || {}),
      };
      const restoredTimeSpent = {
        ...existingTimeSpent,
        ...(localDraft?.questionTimeSpent || {}),
      };

      setAnswers((prev) => ({ ...prev, ...restoredAnswers }));
      setFlaggedQuestions((prev) => ({ ...prev, ...restoredFlags }));
      setQuestionTimeSpent((prev) => ({
        ...prev,
        ...restoredTimeSpent,
      }));

      questionStartTimeRef.current = Date.now();

      return groupData;
    } catch (err) {
      console.error("Load group error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to load group",
      );
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Load current section.
  //
  // The controller returns groups already populated with:
  // passage + questionSets.questions + current position.
  // ---------------------------------------------------------------------------
  const loadCurrentSection = useCallback(
    async (attemptIdToUse) => {
      if (!attemptIdToUse) return null;

      try {
        const response = await api.get(
          `/ielts/attempts/${attemptIdToUse}/current-section`,
        );

        const sectionData = response?.data?.data;

        if (!sectionData?.section) {
          throw new Error("Current section data was not returned");
        }
        setSectionData(sectionData);

        const nextGroups = Array.isArray(sectionData.groups)
          ? sectionData.groups
          : [];

        const nextGroupIndex = Math.max(
          0,
          Number(sectionData.currentGroupIndex) || 0,
        );

        const nextQuestionSetIndex = Math.max(
          0,
          Number(sectionData.currentQuestionSetIndex) || 0,
        );

        const nextQuestionIndex = Math.max(
          0,
          Number(sectionData.currentQuestionIndex) || 0,
        );

        setGroups(nextGroups);
        setCurrentSection(sectionData.section.name);
        setCurrentSectionIndex(
          Math.max(0, (Number(sectionData.section.order) || 1) - 1),
        );
        setCurrentGroupIndex(nextGroupIndex);
        setCurrentQuestionSetIndex(nextQuestionSetIndex);
        setCurrentQuestionIndex(nextQuestionIndex);

        if (Number(sectionData.section.duration) > 0) {
          const durationSeconds = Number(sectionData.section.duration) * 60;
          const savedTimeSpent = Number(sectionData.section.timeSpent) || 0;
          setTimeRemaining(Math.max(0, durationSeconds - savedTimeSpent));
        } else {
          setTimeRemaining(0);
        }

        const groupFromSection = nextGroups[nextGroupIndex];

        if (groupFromSection?._id) {
          await loadGroup(attemptIdToUse, groupFromSection._id);
        } else {
          setCurrentGroup(null);
        }

        return sectionData;
      } catch (err) {
        console.error("Load section error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load section",
        );
        return null;
      }
    },
    [loadGroup],
  );

  // ---------------------------------------------------------------------------
  // Load test first. The user chooses a section from the instruction screen.
  // No attempt is started until the user clicks Resume/Start Section.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const loadTest = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/ielts/test/${testId}`);
        const fetchedTest = response?.data?.data;

        if (!fetchedTest) {
          throw new Error("Test data was not returned");
        }

        if (!cancelled) {
          setTestData(fetchedTest);
          setShowInstructions(true);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Load test error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load IELTS test. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (testId) {
      loadTest();
    }

    return () => {
      cancelled = true;
    };
  }, [testId]);

  // Start a brand-new test at a selected section or resume the saved cursor.
  const startAttempt = useCallback(
    async (mode = "flow", selectedSection = null) => {
      if (!testId || startingAttempt) return;

      try {
        setStartingAttempt(true);
        setError(null);

        const response = await api.post(`/ielts/attempts/start`, {
          testId,
          mode,
          ...(mode === "section" && selectedSection
            ? { section: selectedSection }
            : {}),
        });

        const attemptData = response?.data?.data;

        if (!attemptData?.attemptId) {
          if (attemptData?.completed) {
            navigate(`/ielts/result/${attemptData.attemptId}`);
            return;
          }

          throw new Error("Attempt ID was not returned");
        }

        setAttemptId(idOf(attemptData.attemptId));
        setCurrentSection(attemptData.currentSection || null);
        setCurrentSectionIndex(
          Math.max(0, Number(attemptData.currentSectionIndex) || 0),
        );
        setCurrentGroupIndex(
          Math.max(0, Number(attemptData.currentGroupIndex) || 0),
        );
        setCurrentQuestionSetIndex(
          Math.max(0, Number(attemptData.currentQuestionSetIndex) || 0),
        );
        setCurrentQuestionIndex(
          Math.max(0, Number(attemptData.currentQuestionIndex) || 0),
        );
        timeoutHandledRef.current = false;

        const loadedSection = await loadCurrentSection(
          idOf(attemptData.attemptId),
        );

        if (!loadedSection?.groups?.length) {
          throw new Error("No groups are available for the selected section");
        }

        setShowInstructions(false);
      } catch (err) {
        console.error("Start/resume attempt error:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to start or resume the IELTS test.",
        );
      } finally {
        setStartingAttempt(false);
      }
    },
    [testId, startingAttempt, loadCurrentSection, navigate],
  );

  // ---------------------------------------------------------------------------
  // Fix timer bug:
  // Old code restarted the interval every second and never called timeout
  // when 1 second changed to 0.
  // ---------------------------------------------------------------------------
  const handleSectionTimeout = useCallback(() => {
    if (timeoutHandledRef.current) return;

    timeoutHandledRef.current = true;

    setConfirmationModal({
      title: "Time's Up!",
      message:
        "Your time for this section has ended. Your answers will be submitted.",
      confirmText: "Continue",
      destructive: false,
      onConfirm: async () => {
        setConfirmationModal(null);

        try {
          await submitCurrentGroup();
        } finally {
          timeoutHandledRef.current = false;
        }
      },
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    const audioUrl = sectionDataa?.section?.audioUrl || "";

    const normalizedSection = String(currentSection || "")
      .trim()
      .toLowerCase();

    const isListening = normalizedSection === "listening";

    console.log("🎧 AUDIO CHECK", {
      audioElement: audio,
      audioUrl,
      currentSection,
      normalizedSection,
      isListening,
      loading,
      sectionTransition,
    });

    // IMPORTANT:
    // During loading / section transition the <audio> element is not rendered
    // because the component has an early return.
    if (!audio) {
      console.log("⏳ Audio element is not mounted yet");
      return;
    }

    // No audio URL
    if (!audioUrl) {
      console.log("❌ Audio URL not available");

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      return;
    }

    // Not Listening section
    if (!isListening) {
      console.log("⏹️ Current section is not Listening");

      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      return;
    }

    console.log("🎵 Loading IELTS Listening audio:", audioUrl);

    // Set source
    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }

    // Set volume
    audio.volume = audioEnabled ? audioVolume : 0;
    audio.muted = !audioEnabled;

    const handleCanPlay = async () => {
      try {
        await audio.play();

        console.log("✅ IELTS Listening audio started");
      } catch (error) {
        console.warn(
          "⚠️ Browser blocked autoplay. User interaction is required.",
          error,
        );
      }
    };

    audio.addEventListener("canplay", handleCanPlay, {
      once: true,
    });

    // If browser already loaded enough data
    if (audio.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.pause();
    };
  }, [
    sectionDataa?.section?.audioUrl,
    currentSection,
    loading,
    sectionTransition,
  ]);

  const handleVolumeChange = useCallback((event) => {
    const volume = Number(event.target.value);

    setAudioVolume(volume);

    if (volume > 0) {
      previousVolumeRef.current = volume;
    }

    setAudioEnabled(volume > 0);

    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = false;
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (!audioRef.current) return;

    if (audioEnabled) {
      previousVolumeRef.current = audioVolume || 1;

      audioRef.current.volume = 0;
      audioRef.current.muted = true;

      setAudioEnabled(false);
    } else {
      const restoredVolume = previousVolumeRef.current || 1;

      audioRef.current.muted = false;
      audioRef.current.volume = restoredVolume;

      setAudioVolume(restoredVolume);
      setAudioEnabled(true);

      // If autoplay was blocked earlier, try again after user interaction
      audioRef.current.play().catch(() => {});
    }
  }, [audioEnabled, audioVolume]);

  useEffect(() => {
    clearInterval(sectionTimerRef.current);

    if (
      timeRemaining <= 0 ||
      isPaused ||
      showInstructions ||
      sectionTransition ||
      !attemptId
    ) {
      return undefined;
    }

    sectionTimerRef.current = setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          clearInterval(sectionTimerRef.current);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(sectionTimerRef.current);
  }, [timeRemaining, isPaused, showInstructions, sectionTransition, attemptId]);

  // Timeout is handled separately so it does not depend on a stale interval.
  useEffect(() => {
    if (
      timeRemaining === 0 &&
      attemptId &&
      !isPaused &&
      !showInstructions &&
      !sectionTransition
    ) {
      handleSectionTimeout();
    }
  }, [
    timeRemaining,
    attemptId,
    isPaused,
    showInstructions,
    sectionTransition,
    handleSectionTimeout,
  ]);

  // ---------------------------------------------------------------------------
  // Save answer locally.
  //
  // Group submission is the authoritative save operation in your controller.
  // ---------------------------------------------------------------------------
  const saveAnswerLocally = useCallback(
    (questionId, answer) => {
      const id = idOf(questionId);

      if (!id) return;

      setAnswers((prev) => {
        const nextAnswers = { ...prev, [id]: answer };

        const currentGroupId = idOf(currentGroup?._id);
        if (attemptId && currentGroupId) {
          try {
            const key = getGroupStorageKey(attemptId, currentGroupId);
            const previousDraft = JSON.parse(
              window.localStorage.getItem(key) || "{}",
            );

            window.localStorage.setItem(
              key,
              JSON.stringify({
                ...previousDraft,
                answers: nextAnswers,
                flaggedQuestions,
                questionTimeSpent,
              }),
            );
          } catch (storageError) {
            console.warn("Unable to persist IELTS draft:", storageError);
          }
        }

        return nextAnswers;
      });

      if (questionStartTimeRef.current) {
        const timeSpent = Math.max(
          0,
          Math.floor((Date.now() - questionStartTimeRef.current) / 1000),
        );

        setQuestionTimeSpent((prev) => ({
          ...prev,
          [id]: timeSpent,
        }));
      }
    },
    [
      attemptId,
      currentGroup,
      flaggedQuestions,
      questionTimeSpent,
      getGroupStorageKey,
    ],
  );

  // ---------------------------------------------------------------------------
  // Navigate to a question and persist the controller cursor.
  // Controller expects questionSetIndex + questionIndex separately.
  // ---------------------------------------------------------------------------
  const navigateToQuestion = useCallback(
    async (item, { closeOverview = false } = {}) => {
      if (!item) return;

      const nextSetIndex = Number(item.questionSetIndex) || 0;
      const nextQuestionIndex = Number(item.questionIndex) || 0;

      setCurrentQuestionSetIndex(nextSetIndex);
      setCurrentQuestionIndex(nextQuestionIndex);

      questionStartTimeRef.current = Date.now();

      if (closeOverview) {
        setShowOverview(false);
      }

      const questionKey = item.question?._id
        ? idOf(item.question._id)
        : `${nextSetIndex}-${nextQuestionIndex}`;

      requestAnimationFrame(() => {
        questionRefs.current[questionKey]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [attemptId, currentSectionIndex, currentGroupIndex],
  );

  const navigateRelative = useCallback(
    (direction) => {
      if (!currentQuestionItem) return;

      const nextFlatIndex = currentQuestionItem.globalIndex + direction;
      const nextItem = questionItems[nextFlatIndex];

      if (nextItem) {
        navigateToQuestion(nextItem);
      }
    },
    [currentQuestionItem, questionItems, navigateToQuestion],
  );

  // ---------------------------------------------------------------------------
  // Toggle flag locally.
  //
  // Flags are included in submitIeltsGroup, which is the main group-save API.
  // ---------------------------------------------------------------------------
  const toggleFlag = useCallback(
    (questionId) => {
      const id = idOf(questionId);

      if (!id) return;

      setFlaggedQuestions((prev) => {
        const nextFlags = { ...prev, [id]: !prev[id] };
        const currentGroupId = idOf(currentGroup?._id);

        if (attemptId && currentGroupId) {
          try {
            const key = getGroupStorageKey(attemptId, currentGroupId);
            const previousDraft = JSON.parse(
              window.localStorage.getItem(key) || "{}",
            );

            window.localStorage.setItem(
              key,
              JSON.stringify({
                ...previousDraft,
                answers,
                flaggedQuestions: nextFlags,
                questionTimeSpent,
              }),
            );
          } catch (storageError) {
            console.warn("Unable to persist IELTS flag state:", storageError);
          }
        }

        return nextFlags;
      });
    },
    [attemptId, currentGroup, answers, questionTimeSpent, getGroupStorageKey],
  );

  // ---------------------------------------------------------------------------
  // Submit CURRENT GROUP.
  //
  // Controller expects ALL answers for the current group:
  // questionId, answer, timeSpent, flagged, skipped.
  // ---------------------------------------------------------------------------
  const submitCurrentGroup = useCallback(async () => {
    if (!attemptId || !currentGroup || submittingGroup) return;

    const allQuestions = questionItems.map((item) => item.question);

    if (!allQuestions.length) {
      setError("This group does not contain any questions.");
      return;
    }

    try {
      setSubmittingGroup(true);
      setError(null);

      const groupAnswers = allQuestions.map((question) => {
        const questionId = idOf(question?._id);
        const answer = answers[questionId];

        return {
          questionId,
          answer: answer !== undefined ? answer : null,
          timeSpent: Number(questionTimeSpent[questionId]) || 0,
          flagged: Boolean(flaggedQuestions[questionId]),
          skipped: !isAnswered(answer),
        };
      });

      const totalTimeSpent = groupAnswers.reduce(
        (total, item) => total + (Number(item.timeSpent) || 0),
        0,
      );

      const response = await api.post(
        `/ielts/attempts/${attemptId}/groups/${idOf(currentGroup._id)}/submit`,
        {
          answers: groupAnswers,
          timeSpent: totalTimeSpent,
        },
      );

      const result = response?.data?.data;

      if (!result) {
        throw new Error("Invalid group submission response");
      }

      try {
        window.localStorage.removeItem(
          getGroupStorageKey(attemptId, currentGroup._id),
        );
      } catch (storageError) {
        console.warn("Unable to clear IELTS group draft:", storageError);
      }

      // Test finished.
      if (result.next?.testCompleted) {
        await submitTestImmediately();
        return;
      }

      // The controller returns next.section after all groups in the section
      // are completed. It does NOT start the next section automatically.
      if (result.next?.section && result.next?.sectionCompleted) {
        await handleSectionComplete(result.next.section);
        return;
      }

      // Move to the next group in the same section.
      if (result.next?.group?.groupId) {
        const nextGroupIndex = groups.findIndex(
          (groupItem) =>
            idOf(groupItem?._id) === idOf(result.next.group.groupId),
        );

        setCurrentGroupIndex(
          nextGroupIndex >= 0
            ? nextGroupIndex
            : Math.max(0, currentGroupIndex + 1),
        );
        setCurrentQuestionSetIndex(0);
        setCurrentQuestionIndex(0);

        setAnswers({});
        setFlaggedQuestions({});
        setQuestionTimeSpent({});

        questionStartTimeRef.current = Date.now();

        await loadGroup(attemptId, result.next.group.groupId);
        return;
      }

      // Defensive fallback: reload current section if the response contains
      // neither a next group nor a next section.
      await loadCurrentSection(attemptId);
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err?.response?.data?.message || err?.message || "Failed to submit",
      );
    } finally {
      setSubmittingGroup(false);
    }
  }, [
    attemptId,
    currentGroup,
    questionItems,
    answers,
    questionTimeSpent,
    flaggedQuestions,
    isAnswered,
    submittingGroup,
    currentGroupIndex,
    groups,
    getGroupStorageKey,
    loadGroup,
    loadCurrentSection,
  ]);

  // ---------------------------------------------------------------------------
  // Group navigation
  // ---------------------------------------------------------------------------
  const orderedGroups = useMemo(
    () =>
      [...groups].sort(
        (a, b) => (Number(a?.order) || 0) - (Number(b?.order) || 0),
      ),
    [groups],
  );

  const navigateToGroup = useCallback(
    async (targetIndex) => {
      if (submittingGroup || !attemptId) return;

      const safeIndex = Number(targetIndex);
      const targetGroup = orderedGroups[safeIndex];

      if (!targetGroup?._id || safeIndex === currentGroupIndex) return;

      // Moving forward means completing/saving the current group. The group
      // submission endpoint then advances the server cursor to the next group.
      if (safeIndex > currentGroupIndex) {
        await submitCurrentGroup();
        return;
      }

      // Moving backward is review navigation. Do not submit the current group
      // again because that could complete the whole section when the current
      // group is the last group. The current React state remains in memory, and
      // the requested previous group is loaded from the server.
      setCurrentGroupIndex(safeIndex);
      setCurrentQuestionSetIndex(0);
      setCurrentQuestionIndex(0);
      questionStartTimeRef.current = Date.now();

      await loadGroup(attemptId, targetGroup._id);
    },
    [
      submittingGroup,
      attemptId,
      orderedGroups,
      currentGroupIndex,
      submitCurrentGroup,
      loadGroup,
    ],
  );

  // ---------------------------------------------------------------------------
  // Submit test immediately when group controller says the test is complete.
  // ---------------------------------------------------------------------------
  const submitTestImmediately = useCallback(async () => {
    if (!attemptId) return;

    try {
      await api.post(`/ielts/attempts/${attemptId}/submit`);
      navigate(`/ielts/result/${attemptId}`);
    } catch (err) {
      console.error("Final test submission error:", err);
      setError(err?.response?.data?.message || "Failed to submit IELTS test");
    }
  }, [attemptId, navigate]);

  // ---------------------------------------------------------------------------
  // Section completion.
  //
  // The controller marks the current section completed but keeps it active
  // until start-next-section is called. The next incomplete section is then
  // selected in test order (wrapping to earlier incomplete sections if needed).
  // ---------------------------------------------------------------------------
  const handleSectionComplete = useCallback(
    async (nextSectionInfo) => {
      if (!attemptId || !nextSectionInfo?.section) return;

      setSectionTransition(true);

      window.setTimeout(async () => {
        try {
          const response = await api.post(
            `/ielts/attempts/${attemptId}/start-next-section`,
          );

          const nextData = response?.data?.data;

          setCurrentSection(
            nextData?.section || nextSectionInfo.section || null,
          );

          setCurrentSectionIndex(
            Number(nextData?.sectionIndex) ||
              Math.max(0, Number(nextSectionInfo.order) - 1),
          );

          setCurrentGroupIndex(0);
          setCurrentQuestionSetIndex(0);
          setCurrentQuestionIndex(0);

          setAnswers({});
          setFlaggedQuestions({});
          setQuestionTimeSpent({});

          setTimeRemaining(
            Number(nextData?.duration || 0) > 0
              ? Number(nextData.duration) * 60
              : 0,
          );

          await loadCurrentSection(attemptId);

          setShowInstructions(false);
        } catch (err) {
          console.error("Start next section error:", err);
          setError(
            err?.response?.data?.message || "Failed to start next section",
          );
        } finally {
          setSectionTransition(false);
        }
      }, 1200);
    },
    [attemptId, loadCurrentSection],
  );

  // ---------------------------------------------------------------------------
  // Submit confirmation.
  // ---------------------------------------------------------------------------
  const handleSubmitTest = useCallback(() => {
    if (!attemptId) return;

    setConfirmationModal({
      title: "Submit Test",
      message:
        "Are you sure you want to submit your IELTS test? This action cannot be undone.",
      confirmText: "Submit Test",
      destructive: true,
      onConfirm: async () => {
        try {
          setConfirmationModal(null);
          await submitTestImmediately();
        } catch (err) {
          console.error(err);
        }
      },
    });
  }, [attemptId, submitTestImmediately]);

  // ---------------------------------------------------------------------------
  // Pause / resume.
  // ---------------------------------------------------------------------------
  const handlePauseResume = useCallback(async () => {
    if (!attemptId) return;

    try {
      const endpoint = isPaused ? "resume" : "pause";

      const response = await api.post(
        `/ielts/attempts/${attemptId}/${endpoint}`,
      );

      if (response?.data?.success === false) {
        throw new Error(response?.data?.message || "Unable to change state");
      }

      setIsPaused((prev) => !prev);
    } catch (err) {
      console.error("Pause/Resume error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update test state",
      );
    }
  }, [attemptId, isPaused]);

  // ---------------------------------------------------------------------------
  // Fullscreen.
  // ---------------------------------------------------------------------------
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ---------------------------------------------------------------------------
  // Render question by questionType.
  // ---------------------------------------------------------------------------
  const renderQuestion = useCallback(
    ({ question, questionNumber, questionSet }) => {
      if (!question) return null;

      const questionType = question.questionType;
      const questionId = idOf(question._id);

      const setAnswer = (answer) => {
        saveAnswerLocally(questionId, answer);
      };

      switch (questionType) {
        case "mcq_single":
          return (
            <SingleChoiceQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
              questionNumber={questionNumber}
            />
          );

        case "mcq_multiple":
          return (
            <MultipleChoiceQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
            />
          );

        case "true_false_ng":
        case "yes_no_ng":
          return (
            <TrueFalseNGQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
              questionType={questionType}
              questionNumber={questionNumber}
            />
          );

        case "matching_headings":
        case "matching_information":
        case "matching_features":
        case "matching_sentence_endings":
          return (
            <MatchingQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
              questionNumber={questionNumber}
              questionSet={questionSet}
            />
          );

        case "sentence_completion":
        case "summary_completion":
        case "note_completion":
        case "table_completion":
        case "flow_chart_completion":
        case "short_answer":
        case "diagram_labeling":
        case "form_completion":
          return (
            <CompletionQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
              questionNumber={questionNumber}
              questionSet={questionSet}
            />
          );

        case "classification":
        case "plan_labeling":
        case "map_labeling":
        case "matching":
          return (
            <ListeningMatchingQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
              questionNumber={questionNumber}
              questionSet={questionSet}
            />
          );

        case "pick_from_list":
          return (
            <PickFromListQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
            />
          );

        case "formal_letter":
        case "semi_formal_letter":
        case "informal_letter":
          return (
            <LetterWritingQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
              questionNumber={questionNumber}
              questionSet={questionSet}
            />
          );

        case "opinion":
        case "discussion":
        case "problem_solution":
        case "advantages_disadvantages":
        case "double_question":
          return (
            <EssayWritingQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
            />
          );

        case "speaking_part_1":
        case "speaking_part_2":
        case "speaking_part_3":
          return (
            <SpeakingQuestion
              question={question}
              answer={answers[questionId]}
              setAnswer={setAnswer}
            />
          );

        default:
          return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Unsupported question type:
              <strong className="ml-1">{questionType || "unknown"}</strong>
            </div>
          );
      }
    },
    [answers, saveAnswerLocally],
  );

  // ---------------------------------------------------------------------------
  // Derived UI
  // ---------------------------------------------------------------------------
  const sectionCount = testData?.sections?.length || 0;

  const sectionProgress = sectionCount
    ? Math.min(100, ((currentSectionIndex + 1) / sectionCount) * 100)
    : 0;

  const sectionTheme = {
    reading: {
      icon: <Book size={18} />,
      label: "Reading",
    },
    listening: {
      icon: <Headphones size={18} />,
      label: "Listening",
    },
    writing: {
      icon: <PenTool size={18} />,
      label: "Writing",
    },
    speaking: {
      icon: <Mic size={18} />,
      label: "Speaking",
    },
  };

  const activeTheme = sectionTheme[currentSection] || sectionTheme.reading;

  const currentGroupQuestionSets = currentGroup?.questionSets || [];

  const activeWritingQuestionSet =
    currentGroupQuestionSets[currentQuestionSetIndex];

  const activeWritingQuestion = activeWritingQuestionSet?.questions?.[0];

  // ---------------------------------------------------------------------------
  // Loading / error / transition
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">
            Preparing your test...
          </p>
        </div>
      </div>
    );
  }

  if (error && !currentGroup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={28} />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>

          <button
            onClick={() => navigate("/ielts/tests")}
            className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  if (sectionTransition) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <h2 className="text-2xl font-bold text-slate-900">
            Section Completed!
          </h2>

          <p className="mt-2 text-slate-600">Your answers have been saved.</p>

          <p className="mt-1 text-sm text-slate-500">
            Preparing the next section...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Instructions / section selection screen
  // ---------------------------------------------------------------------------
  if (showInstructions && testData) {
    return (
      <TestInstructions
        testData={testData}
        loading={startingAttempt}
        onResume={() => startAttempt("flow")}
        onStartSection={(section) => startAttempt("section", section)}
      />
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-white text-slate-900">
      <audio ref={audioRef} preload="auto" />
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 shrink-0">
              <img
                src="https://www.ooshasprep.com/image/logo.png"
                alt="ooshasprep"
                className="h-full object-contain"
              />
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-slate-900">
                {testData?.title || "IELTS Practice Test"}
              </p>

              <p className="text-xs capitalize text-slate-500">
                IELTS • {activeTheme.label}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              timeRemaining <= 60
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <Timer size={21} />

            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              {formatTime(timeRemaining)}
            </span>

            <span className="hidden text-xs font-medium sm:inline">
              remaining
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sectionDataa?.section?.audioUrl && (
              <>
                {/* Hidden audio element */}
                {/* <audio
                    ref={audioRef}
                    src={sectionDataa.section.audioUrl}
                    preload="auto"
                  /> */}

                {/* Volume Control */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleMuteToggle}
                    title={audioEnabled ? "Mute" : "Unmute"}
                    className="flex h-9 items-center justify-center rounded-lg text-cyan-600 transition hover:bg-slate-100"
                  >
                    {audioEnabled && audioVolume > 0 ? (
                      <Volume2 size={21} />
                    ) : (
                      <VolumeX size={21} />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={audioEnabled ? audioVolume : 0}
                    onChange={handleVolumeChange}
                    aria-label="Audio volume"
                    className="h-1 w-22 cursor-pointer accent-cyan-500"
                  />
                </div>
              </>
            )}
            <button
              onClick={() => setShowOverview(true)}
              title="Question Overview"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:gap-2 sm:px-3"
            >
              <Grid size={19} />
              <span className="hidden text-sm font-medium sm:inline">
                Overview
              </span>
            </button>

            <button
              onClick={handlePauseResume}
              title={isPaused ? "Resume" : "Pause"}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:w-auto sm:gap-2 sm:px-3"
            >
              {isPaused ? <Play size={19} /> : <Pause size={19} />}

              <span className="hidden text-sm font-medium sm:inline">
                {isPaused ? "Resume" : "Pause"}
              </span>
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 sm:flex"
            >
              {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="h-[calc(100vh-76px-74px)] min-h-0 overflow-hidden">
        {isPaused ? (
          <div className="flex h-full items-center justify-center bg-slate-50">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Pause size={25} />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-900">
                Test Paused
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your current progress is still available. Resume when you are
                ready.
              </p>

              <button
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                onClick={handlePauseResume}
              >
                <Play size={18} />
                Resume Test
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto flex h-full min-h-0 max-w-[1920px] px-4 sm:px-7 xl:px-10">
              {currentSection == "reading" && (
                <section className="hidden w-1/2 min-w-0 overflow-y-auto border-r border-slate-200 lg:block">
                  <div className="mx-auto max-w-4xl py-6 pe-5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      {activeTheme.icon}
                      <span>{activeTheme.label}</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      {currentGroup?.title || "Current Group"}
                    </h1>

                    {currentGroup?.instructions && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {currentGroup.instructions}
                      </div>
                    )}

                    {/* Passage */}
                    {currentGroup?.passage ? (
                      <article className="mt-6">
                        <div className="border-b border-slate-200 py-4">
                          <h2 className="text-xl font-bold text-slate-900">
                            {currentGroup.passage?.topic ||
                              currentGroup.passage?.title ||
                              "Passage"}
                          </h2>
                        </div>

                        <div
                          className="py-4 text-[15px] leading-7 text-slate-800"
                          dangerouslySetInnerHTML={{
                            __html:
                              currentGroup.passage?.content ||
                              currentGroup.passage?.text ||
                              "",
                          }}
                        />
                      </article>
                    ) : currentGroup?.content ? (
                      <article className="mt-6">
                        <div
                          className="text-[15px] leading-7 text-slate-800"
                          dangerouslySetInnerHTML={{
                            __html: currentGroup.content,
                          }}
                        />
                      </article>
                    ) : (
                      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                        No passage/content is available for this group.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* RIGHT: QUESTIONS */}
              <section className="min-w-0 flex-1 overflow-y-auto bg-white">
                <div className="mx-auto px-4 py-6">
                  {/* Mobile passage */}
                  {/* {currentGroup?.passage && (
                    <details className="mb-5 rounded-xl border border-slate-200 bg-slate-50 lg:hidden">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
                        View Passage
                      </summary>

                      <div className="border-t border-slate-200 px-4 py-4 text-sm leading-7 text-slate-700">
                        <h3 className="mb-2 font-bold">
                          {currentGroup.passage?.topic ||
                            currentGroup.passage?.title ||
                            "Passage"}
                        </h3>
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              currentGroup.passage?.content ||
                              currentGroup.passage?.text ||
                              "",
                          }}
                        />
                      </div>
                    </details>
                  )} */}

                  <div className="space-y-8">
                    {currentGroupQuestionSets.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                        No question sets are available in this group.
                      </div>
                    ) : (currentSection != "writing" ) ? (
                      currentGroupQuestionSets.map(
                        (questionSet, questionSetIndex) => {
                          const rangeFrom = Number(
                            questionSet?.questionRange?.from,
                          );
                          const rangeTo = Number(
                            questionSet?.questionRange?.to,
                          );

                          const hasRange =
                            Number.isFinite(rangeFrom) &&
                            Number.isFinite(rangeTo);

                          return (
                            <section
                              key={
                                idOf(questionSet?._id) ||
                                `question-set-${questionSetIndex}`
                              }
                              className="overflow-hidden"
                            >
                              {/* QUESTION SET HEADER */}
                              <div className="py-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900">
                                      {questionSet?.title ||
                                        `Questions ${
                                          hasRange
                                            ? `${rangeFrom}–${rangeTo}`
                                            : questionSetIndex + 1
                                        }`}
                                    </h3>
                                  </div>
                                </div>
                                {questionSet?.instructions && (
                                  <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800">
                                    {questionSet.instructions}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-5">
                                {(questionSet.questions || []).map(
                                  (question, questionIndex) => {
                                    const questionId = idOf(question?._id);

                                    const item = questionItems.find(
                                      (entry) =>
                                        entry.questionSetIndex ===
                                          questionSetIndex &&
                                        entry.questionIndex === questionIndex,
                                    );

                                    const questionNumber =
                                      item?.questionNumber ||
                                      getQuestionNumber(
                                        questionSet,
                                        questionIndex,
                                        questionIndex + 1,
                                      );

                                    console.log(item?.questionNumber);

                                    const isCurrent =
                                      currentQuestionSetIndex ===
                                        questionSetIndex &&
                                      currentQuestionIndex === questionIndex;

                                    const questionAnswered = isAnswered(
                                      answers[questionId],
                                    );

                                    const questionFlagged = Boolean(
                                      flaggedQuestions[questionId],
                                    );

                                    return (
                                      <article
                                        key={
                                          questionId ||
                                          `${questionSetIndex}-${questionIndex}`
                                        }
                                        ref={(element) => {
                                          if (questionId) {
                                            questionRefs.current[questionId] =
                                              element;
                                          }
                                        }}
                                        className={`scroll-mt-6 rounded-2xl p-3 transition ${
                                          isCurrent ? "bg-emerald-50/50" : ""
                                        }`}
                                      >
                                        {/* <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (item) {
                                              navigateToQuestion(item);
                                            }
                                          }}
                                          className="flex items-center gap-3 text-left"
                                        >
                                          

                                         <span>
                                            <span className="block text-xs text-slate-500">
                                              {questionAnswered
                                                ? "Answered"
                                                : "Not answered"}
                                            </span>
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => toggleFlag(questionId)}
                                          className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                            questionFlagged
                                              ? "border-amber-200 bg-amber-50 text-amber-700"
                                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                          }`}
                                        >
                                          <Flag size={16} />

                                          <span className="hidden sm:inline">
                                            {questionFlagged
                                              ? "Flagged"
                                              : "Flag"}
                                          </span>
                                        </button>
                                      </div> */}

                                        {renderQuestion({
                                          question,
                                          questionNumber,
                                          questionSet,
                                        })}
                                      </article>
                                    );
                                  },
                                )}
                              </div>
                            </section>
                          );
                        },
                      )
                    ) : (
                      <div className="">
                        {activeWritingQuestionSet && activeWritingQuestion && (
                          <div
                            key={idOf(activeWritingQuestion?._id)}
                            ref={(element) => {
                              if (activeWritingQuestion?._id) {
                                questionRefs.current[
                                  idOf(activeWritingQuestion._id)
                                ] = element;
                              }
                            }}
                          >
                            {renderQuestion({
                              question: activeWritingQuestion,
                              questionNumber:
                                activeWritingQuestionSet?.questionRange?.from ||
                                1,
                              questionSet: activeWritingQuestionSet,
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sticky-ish end summary */}
                  {/* <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                   

                      <button
                        type="button"
                        onClick={submitCurrentGroup}
                        disabled={submittingGroup || totalQuestions === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {submittingGroup ? "Saving..." : "Submit"}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div> */}

                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      <footer className="h-[74px] shrink-0 border-t border-slate-200 bg-white px-4 sm:px-6">
        <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-4">
          <div className="flex shrink-0 items-center gap-1.5 pr-2 md:hidden">
            <button
              type="button"
              onClick={() => navigateToGroup(currentGroupIndex - 1)}
              disabled={currentGroupIndex <= 0 || submittingGroup}
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="whitespace-nowrap text-xs font-bold text-slate-600">
              G {currentGroupIndex + 1}/{orderedGroups.length}
            </span>
            <button
              type="button"
              onClick={() => navigateToGroup(currentGroupIndex + 1)}
              disabled={
                currentGroupIndex >= orderedGroups.length - 1 || submittingGroup
              }
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* QUESTION NUMBERS */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex w-full items-center gap-1.5 overflow-x-auto py-1">
              {currentGroupQuestionSets.map((questionSet, questionSetIndex) => {
                const rangeFrom = Number(questionSet?.questionRange?.from);

                const rangeTo = Number(questionSet?.questionRange?.to);
                if (
                  Number.isFinite(rangeFrom) &&
                  Number.isFinite(rangeTo) &&
                  rangeTo >= rangeFrom
                ) {
                  return Array.from(
                    {
                      length: rangeTo - rangeFrom + 1,
                    },
                    (_, index) => {
                      const questionNumber = rangeFrom + index;
                      const item = questionItems.find(
                        (questionItem) =>
                          questionItem.questionSetIndex === questionSetIndex &&
                          questionItem.questionIndex === index,
                      );

                      if (!item) {
                        return (
                          <div
                            key={`range-${questionSetIndex}-${questionNumber}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500"
                            title={`Question ${questionNumber}`}
                          >
                            {questionNumber}
                          </div>
                        );
                      }

                      const questionId = idOf(item.question?._id);

                      const answered = isAnswered(answers[questionId]);

                      const flagged = Boolean(flaggedQuestions[questionId]);

                      const isCurrent =
                        item.questionSetIndex === currentQuestionSetIndex &&
                        item.questionIndex === currentQuestionIndex;

                      return (
                        <button
                          key={`${questionSetIndex}-${questionNumber}-${questionId}`}
                          type="button"
                          onClick={() => navigateToQuestion(item)}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                            isCurrent
                              ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                              : answered
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : flagged
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                          title={`Question ${questionNumber}`}
                        >
                          {questionNumber}
                        </button>
                      );
                    },
                  );
                }

                /*
                 * No range:
                 * Use the questions that actually exist.
                 */
                return questionItems
                  .filter((item) => item.questionSetIndex === questionSetIndex)
                  .map((item) => {
                    const questionId = idOf(item.question?._id);

                    const answered = isAnswered(answers[questionId]);

                    const flagged = Boolean(flaggedQuestions[questionId]);

                    const isCurrent =
                      item.questionSetIndex === currentQuestionSetIndex &&
                      item.questionIndex === currentQuestionIndex;

                    return (
                      <button
                        key={`${item.questionSetIndex}-${item.questionIndex}-${questionId}`}
                        type="button"
                        onClick={() => navigateToQuestion(item)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          isCurrent
                            ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                            : answered
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : flagged
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                        title={`Question ${item.questionNumber}`}
                      >
                        {item.questionNumber}
                      </button>
                    );
                  });
              })}
            </div>
          </div>

          {/* PREVIOUS / NEXT */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigateRelative(-1)}
              disabled={
                !currentQuestionItem || currentQuestionItem.globalIndex === 0
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {currentQuestionItem &&
            currentQuestionItem.globalIndex === totalQuestions - 1 ? (
              <button
                type="button"
                onClick={submitCurrentGroup}
                disabled={submittingGroup || totalQuestions === 0}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
              >
                {submittingGroup ? "Saving..." : "Submit"}
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateRelative(1)}
                disabled={!currentQuestionItem}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* OVERVIEW MODAL */}
      {showOverview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setShowOverview(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  IELTS Test
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Question Overview
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowOverview(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold capitalize text-slate-900">
                      {currentSection || "Current Section"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {currentGroup?.title || "Current Group"}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-emerald-700">
                    {answeredCount}/{totalQuestions}
                  </span>
                </div>

                {/* Overview grouped by question set */}
                <div className="mt-5 space-y-5">
                  {currentGroupQuestionSets.map(
                    (questionSet, questionSetIndex) => {
                      const setItems = questionItems.filter(
                        (item) => item.questionSetIndex === questionSetIndex,
                      );

                      return (
                        <div
                          key={
                            idOf(questionSet?._id) ||
                            `overview-${questionSetIndex}`
                          }
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="mb-3">
                            <p className="font-bold text-slate-900">
                              {questionSet?.title ||
                                `Question Set ${questionSetIndex + 1}`}
                            </p>

                            {questionSet?.instructions && (
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {questionSet.instructions}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {setItems.map((item) => {
                              const questionId = idOf(item.question?._id);

                              const answered = isAnswered(answers[questionId]);

                              const flagged = Boolean(
                                flaggedQuestions[questionId],
                              );

                              const isCurrent =
                                item.questionSetIndex ===
                                  currentQuestionSetIndex &&
                                item.questionIndex === currentQuestionIndex;

                              return (
                                <button
                                  key={`${item.questionSetIndex}-${item.questionIndex}`}
                                  type="button"
                                  onClick={() =>
                                    navigateToQuestion(item, {
                                      closeOverview: true,
                                    })
                                  }
                                  className={`h-10 min-w-10 rounded-lg border px-2 text-sm font-bold transition ${
                                    isCurrent
                                      ? "border-emerald-700 bg-emerald-700 text-white"
                                      : answered
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : flagged
                                          ? "border-amber-200 bg-amber-50 text-amber-700"
                                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {item.questionNumber}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Test Progress</h3>

                  <span className="text-sm font-semibold text-slate-600">
                    {currentSectionIndex + 1}/{sectionCount}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${sectionProgress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Section {currentSectionIndex + 1} of {sectionCount}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setShowOverview(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                onClick={handleSubmitTest}
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {confirmationModal.title}
                </h2>

                <button
                  type="button"
                  onClick={() => setConfirmationModal(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                {confirmationModal.message}
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setConfirmationModal(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${
                  confirmationModal.destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-700 hover:bg-emerald-800"
                }`}
                onClick={confirmationModal.onConfirm}
              >
                {confirmationModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IeltsTestPlatform;
