// components/ielts/IeltsTestPlatform.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Timer,
  Flag,
  ChevronLeft,
  ChevronRight,
  Grid,
  Pause,
  Play,
  AlertTriangle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Book,
  Headphones,
  PenTool,
  Mic,
} from "lucide-react";
// import "./IeltsTestPlatform.css";
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

  // Core state
  const [attemptId, setAttemptId] = useState(null);
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Section state
  const [currentSection, setCurrentSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Group state
  const [currentGroup, setCurrentGroup] = useState(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groups, setGroups] = useState([]);

  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [questionTimeSpent, setQuestionTimeSpent] = useState({});

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // UI state
  const [showOverview, setShowOverview] = useState(false);
  const [showSectionOverview, setShowSectionOverview] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sectionTransition, setSectionTransition] = useState(false);

  // Refs
  const sectionTimerRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  // Initialize test
  useEffect(() => {
    const startTest = async () => {
      try {
        setLoading(true);
        
        // Fetch test data
        const testResponse = await api.get(`/ielts/test/${testId}`);
        setTestData(testResponse.data.data);

        // Start attempt
        const startResponse = await api.post(`/ielts/attempts/start`, {
          testId,
          mode: "flow",
        });

        const attemptData = startResponse.data.data;
        setAttemptId(attemptData.attemptId);
        setCurrentSection(attemptData.currentSection);
        setCurrentSectionIndex(attemptData.currentSectionIndex || 0);

        // Load current section
        await loadCurrentSection(attemptData.attemptId, attemptData.currentSection);

        setShowInstructions(true);
      } catch (error) {
        console.error("Start test error:", error);
        setError(error.response?.data?.message || "Failed to start test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    startTest();
  }, [testId]);

  // Load current section data
  const loadCurrentSection = useCallback(async (attemptIdToUse, sectionName) => {
    if (!attemptIdToUse) return;

    try {
      const response = await api.get(
        `/ielts/attempts/${attemptIdToUse}/current-section`
      );

      const sectionData = response.data.data;
      setGroups(sectionData.groups || []);
      setCurrentSection(sectionData.section.name);
      setCurrentSectionIndex(sectionData.section.order - 1 || 0);
      setCurrentGroupIndex(sectionData.currentGroupIndex || 0);
      setCurrentQuestionIndex(sectionData.currentQuestionIndex || 0);

      // Set timer
      if (sectionData.section.duration) {
        setTimeRemaining(sectionData.section.duration * 60);
      }

      // Load first group if available
      if (sectionData.groups && sectionData.groups.length > 0) {
        const firstGroupIndex = sectionData.currentGroupIndex || 0;
        await loadGroup(attemptIdToUse, sectionData.groups[firstGroupIndex]._id);
      }

      return sectionData;
    } catch (error) {
      console.error("Load section error:", error);
      setError("Failed to load section");
    }
  }, []);

  // Load specific group
  const loadGroup = useCallback(async (attemptIdToUse, groupId) => {
    if (!attemptIdToUse || !groupId) return;

    try {
      const response = await api.get(
        `/ielts/attempts/${attemptIdToUse}/groups/${groupId}`
      );

      const groupData = response.data.data;
      setCurrentGroup(groupData.group);

      // Initialize answers from attempt data if exists
      if (groupData.group.attempt?.questionSets) {
        const existingAnswers = {};
        const existingFlags = {};
        const existingTimeSpent = {};

        groupData.group.attempt.questionSets.forEach((qs) => {
          qs.questions.forEach((q) => {
            const questionId = q.question.toString();
            if (q.answer !== null && q.answer !== undefined) {
              existingAnswers[questionId] = q.answer;
            }
            if (q.flagged) {
              existingFlags[questionId] = true;
            }
            if (q.timeSpent > 0) {
              existingTimeSpent[questionId] = q.timeSpent;
            }
          });
        });

        setAnswers(prev => ({ ...prev, ...existingAnswers }));
        setFlaggedQuestions(prev => ({ ...prev, ...existingFlags }));
        setQuestionTimeSpent(prev => ({ ...prev, ...existingTimeSpent }));
      }

      // Reset question timer
      questionStartTimeRef.current = Date.now();

      return groupData;
    } catch (error) {
      console.error("Load group error:", error);
      setError("Failed to load group");
    }
  }, []);

  // Section timer
  useEffect(() => {
    if (timeRemaining > 0 && !isPaused && !showInstructions) {
      sectionTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            clearInterval(sectionTimerRef.current);
            handleSectionTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(sectionTimerRef.current);
  }, [timeRemaining, isPaused, showInstructions]);

  // Get current question
  const getCurrentQuestion = () => {
    if (!currentGroup?.questionSets) return null;

    let questionCounter = 0;
    for (const questionSet of currentGroup.questionSets) {
      for (const question of questionSet.questions || []) {
        if (questionCounter === currentQuestionIndex) {
          return {
            question,
            questionSet,
            index: currentQuestionIndex,
          };
        }
        questionCounter++;
      }
    }

    return null;
  };

  // Get all questions in current group
  const getAllQuestionsInGroup = () => {
    const questions = [];
    if (!currentGroup?.questionSets) return questions;

    for (const questionSet of currentGroup.questionSets) {
      for (const question of questionSet.questions || []) {
        questions.push(question);
      }
    }

    return questions;
  };

  // Save single answer (local state only)
  const saveAnswerLocally = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));

    // Track time spent on question
    if (questionStartTimeRef.current) {
      const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      setQuestionTimeSpent(prev => ({
        ...prev,
        [questionId]: timeSpent,
      }));
    }
  };

  // Toggle flag
  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Navigate to specific question
  const navigateToQuestion = (questionIndex) => {
    setCurrentQuestionIndex(questionIndex);
    questionStartTimeRef.current = Date.now();
  };

  // Submit current group
  const submitCurrentGroup = async () => {
    if (!attemptId || !currentGroup) return;

    try {
      const allQuestions = getAllQuestionsInGroup();
      
      const groupAnswers = allQuestions.map(question => {
        const questionId = question._id;
        const answer = answers[questionId];
        
        return {
          questionId,
          answer: answer || null,
          timeSpent: questionTimeSpent[questionId] || 0,
          flagged: flaggedQuestions[questionId] || false,
          skipped: !answer,
        };
      });

      const response = await api.post(
        `/ielts/attempts/${attemptId}/groups/${currentGroup._id}/submit`,
        {
          answers: groupAnswers,
          timeSpent: allQuestions.reduce((total, q) => 
            total + (questionTimeSpent[q._id] || 0), 0
          ),
        }
      );

      const result = response.data.data;

      // Clear answers for this group
      const questionIds = allQuestions.map(q => q._id);
      setAnswers(prev => {
        const newAnswers = { ...prev };
        questionIds.forEach(id => delete newAnswers[id]);
        return newAnswers;
      });

      // Check if test is completed
      if (result.next?.testCompleted) {
        await handleSubmitTest();
        return;
      }

      // Check if section is completed
      if (result.section?.status === "completed" && !result.next?.group) {
        // Section completed, show transition
        if (result.next?.section) {
          await handleSectionComplete(result.next.section);
        } else {
          await handleSubmitTest();
        }
        return;
      }

      // Move to next group
      if (result.next?.group) {
        await loadGroup(attemptId, result.next.group.groupId);
        setCurrentQuestionIndex(0);
      }

    } catch (error) {
      console.error("Submit group error:", error);
      setError("Failed to submit group");
    }
  };

  // Handle section complete
  const handleSectionComplete = async (nextSectionInfo) => {
    setSectionTransition(true);
    
    // Show transition screen briefly
    setTimeout(async () => {
      try {
        await api.post(`/ielts/attempts/${attemptId}/start-next-section`);
        
        setCurrentSection(nextSectionInfo.section);
        setCurrentSectionIndex(nextSectionInfo.order - 1);
        setCurrentGroupIndex(0);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setFlaggedQuestions({});
        setQuestionTimeSpent({});
        
        await loadCurrentSection(attemptId, nextSectionInfo.section);
        setSectionTransition(false);
      } catch (error) {
        console.error("Start next section error:", error);
        setSectionTransition(false);
        setError("Failed to start next section");
      }
    }, 2000);
  };

  // Handle section timeout
  const handleSectionTimeout = async () => {
    setConfirmationModal({
      title: "Time's Up!",
      message: "Your time for this section has ended. Your answers have been saved.",
      onConfirm: async () => {
        await submitCurrentGroup();
        setConfirmationModal(null);
      },
    });
  };

  // Handle test submission
  const handleSubmitTest = async () => {
    setConfirmationModal({
      title: "Submit Test",
      message: "Are you sure you want to submit your test? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await api.post(`/ielts/attempts/${attemptId}/submit`);
          setConfirmationModal(null);
          navigate(`/ielts/result/${attemptId}`);
        } catch (error) {
          console.error("Submit test error:", error);
          setError("Failed to submit test");
        }
      },
    });
  };

  // Pause/Resume test
  const handlePauseResume = async () => {
    try {
      const endpoint = isPaused ? "resume" : "pause";
      await api.post(`/ielts/attempts/${attemptId}/${endpoint}`);
      setIsPaused(!isPaused);
    } catch (error) {
      console.error("Pause/Resume error:", error);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render question content based on type
  const renderQuestionContent = () => {
    const currentQuestionData = getCurrentQuestion();
    if (!currentQuestionData?.question) return null;

    const question = currentQuestionData.question;
    const questionType = question.questionType;

    switch (questionType) {
      case "mcq_single":
        return (
          <SingleChoiceQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "mcq_multiple":
        return (
          <MultipleChoiceQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "true_false_ng":
      case "yes_no_ng":
        return (
          <TrueFalseNGQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
            questionType={questionType}
          />
        );

      case "matching_headings":
      case "matching_information":
      case "matching_features":
      case "matching_sentence_endings":
        return (
          <MatchingQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "sentence_completion":
      case "summary_completion":
      case "note_completion":
      case "table_completion":
      case "flow_chart_completion":
      case "form_completion":
      case "short_answer":
      case "diagram_labeling":
        return (
          <CompletionQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "matching":
      case "classification":
      case "plan_labeling":
      case "map_labeling":
        return (
          <ListeningMatchingQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "pick_from_list":
        return (
          <PickFromListQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "formal_letter":
      case "semi_formal_letter":
      case "informal_letter":
        return (
          <LetterWritingQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
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
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      case "speaking_part_1":
      case "speaking_part_2":
      case "speaking_part_3":
        return (
          <SpeakingQuestion
            question={question}
            answer={answers[question._id]}
            setAnswer={(ans) => saveAnswerLocally(question._id, ans)}
          />
        );

      default:
        return null;
    }
  };

  // Get section icon
  const getSectionIcon = (sectionName) => {
    switch (sectionName) {
      case "reading": return <Book size={24} />;
      case "listening": return <Headphones size={24} />;
      case "writing": return <PenTool size={24} />;
      case "speaking": return <Mic size={24} />;
      default: return <Book size={24} />;
    }
  };

  if (loading) {
    return (
      <div className="ielts-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your test...</p>
      </div>
    );
  }

  if (showInstructions && testData) {
    return (
      <TestInstructions
        testData={testData}
        onStart={() => setShowInstructions(false)}
      />
    );
  }

  if (error) {
    return (
      <div className="ielts-error">
        <AlertTriangle size={48} />
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/ielts/tests")}>Back to Tests</button>
      </div>
    );
  }

  if (sectionTransition) {
    return (
      <div className="section-transition">
        <div className="transition-content">
          <h2>Section Completed!</h2>
          <p>Great job! Your answers have been saved.</p>
          <p>Get ready for the next section...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const allQuestions = getAllQuestionsInGroup();
  const currentQuestionData = getCurrentQuestion();
  const totalQuestions = allQuestions.length;
  const answeredCount = allQuestions.filter(q => answers[q._id]).length;

  return (
    <div className="ielts-test-platform">
      {/* Header */}
      <header className="ielts-header">
        <div className="header-left">
          <h1>IELTS Test</h1>
          {testData && <span className="test-title">{testData.title}</span>}
        </div>

        <div className="header-center">
          <div className="current-section-indicator">
            {getSectionIcon(currentSection)}
            <span>{currentSection?.toUpperCase()}</span>
          </div>
          <div className="timer-display">
            <Timer size={20} />
            <span className={timeRemaining < 300 ? "timer-warning" : ""}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="header-btn"
            onClick={() => setShowOverview(true)}
            title="Question Overview"
          >
            <Grid size={20} />
            <span>Overview</span>
          </button>

          <button
            className="header-btn"
            onClick={handlePauseResume}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          <button
            className="header-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="ielts-main">
        {isPaused ? (
          <div className="paused-overlay">
            <div className="paused-content">
              <h2>Test Paused</h2>
              <p>Your progress has been saved. Click resume to continue.</p>
              <button className="primary-btn" onClick={handlePauseResume}>
                <Play size={20} />
                Resume Test
              </button>
            </div>
          </div>
        ) : (
          <div className="test-content">
            {/* Sidebar */}
            <aside className="ielts-sidebar">
              <div className="group-info-header">
                <h3>{currentGroup?.title || "Current Group"}</h3>
                <p>{answeredCount} of {totalQuestions} answered</p>
              </div>

              <div className="question-navigator">
                <h4>Questions</h4>
                <div className="question-grid">
                  {allQuestions.map((question, idx) => (
                    <button
                      key={question._id}
                      className={`question-number ${
                        idx === currentQuestionIndex ? "active" : ""
                      } ${
                        answers[question._id] ? "answered" : ""
                      } ${
                        flaggedQuestions[question._id] ? "flagged" : ""
                      }`}
                      onClick={() => navigateToQuestion(idx)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="legend">
                <div className="legend-item">
                  <span className="legend-color answered"></span>
                  <span>Answered</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color current"></span>
                  <span>Current</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color flagged"></span>
                  <span>Flagged</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color unanswered"></span>
                  <span>Unanswered</span>
                </div>
              </div>

              <button 
                className="submit-group-btn"
                onClick={submitCurrentGroup}
                disabled={answeredCount < totalQuestions}
              >
                Submit Group
                <ChevronRight size={16} />
              </button>
            </aside>

            {/* Question Area */}
            <section className="question-area">
              {/* Group Info */}
              {currentGroup && (
                <div className="group-info">
                  {currentGroup.title && (
                    <h2>{currentGroup.title}</h2>
                  )}
                  {currentGroup.instructions && (
                    <p className="instructions">{currentGroup.instructions}</p>
                  )}

                  {/* Audio Player for Listening */}
                  {currentGroup.groupType === "listening_section" && (
                    <div className="audio-player">
                      <button
                        className="audio-btn"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                      >
                        {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                      </button>
                      <div className="audio-controls">
                        <button className="play-btn">Play Audio</button>
                      </div>
                    </div>
                  )}

                  {/* Passage for Reading */}
                  {currentGroup.passage && (
                    <div className="passage-panel">
                      <div className="passage-header">
                        <h3>{currentGroup.passage.title}</h3>
                      </div>
                      <div className="passage-content">
                        <p>{currentGroup.passage.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Question Content */}
              {currentQuestionData && (
                <div className="question-content">
                  <div className="question-header">
                    <span className="question-number">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <button
                      className={`flag-btn ${
                        flaggedQuestions[currentQuestionData.question._id] ? "flagged" : ""
                      }`}
                      onClick={() => toggleFlag(currentQuestionData.question._id)}
                    >
                      <Flag size={20} />
                      {flaggedQuestions[currentQuestionData.question._id] ? "Flagged" : "Flag"}
                    </button>
                  </div>

                  {renderQuestionContent()}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="ielts-footer">
        <div className="footer-left">
          <button
            className="nav-btn"
            onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
        </div>

        <div className="footer-center">
          <span className="question-counter">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>

        <div className="footer-right">
          {currentQuestionIndex === totalQuestions - 1 ? (
            <button className="primary-btn" onClick={submitCurrentGroup}>
              Submit Group
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              className="nav-btn"
              onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </footer>

      {/* Overview Modal */}
      {showOverview && (
        <div className="modal-overlay">
          <div className="overview-modal">
            <div className="modal-header">
              <h2>Test Overview</h2>
              <button onClick={() => setShowOverview(false)}>✕</button>
            </div>
            <div className="overview-content">
              <div className="overview-section current">
                <h3>Current Section: {currentSection?.toUpperCase()}</h3>
                <p>Group: {currentGroup?.title || "Current Group"}</p>
                <div className="overview-questions">
                  {allQuestions.map((question, idx) => (
                    <button
                      key={question._id}
                      className={`overview-question ${
                        idx === currentQuestionIndex ? "current" : ""
                      } ${answers[question._id] ? "answered" : ""} ${
                        flaggedQuestions[question._id] ? "flagged" : ""
                      }`}
                      onClick={() => {
                        navigateToQuestion(idx);
                        setShowOverview(false);
                      }}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="test-progress">
                <h3>Test Progress</h3>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${((currentSectionIndex + 1) / testData?.sections?.length) * 100}%` 
                    }}
                  />
                </div>
                <p>Section {currentSectionIndex + 1} of {testData?.sections?.length}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowOverview(false)}>
                Close
              </button>
              <button className="danger-btn" onClick={handleSubmitTest}>
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <div className="modal-header">
              <h2>{confirmationModal.title}</h2>
              <button onClick={() => setConfirmationModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{confirmationModal.message}</p>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setConfirmationModal(null)}
              >
                Cancel
              </button>
              <button className="danger-btn" onClick={confirmationModal.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IeltsTestPlatform;