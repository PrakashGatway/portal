import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import api from '../axiosInstance';
import WritingSummary from './WritingSummary';

// Timer Component (Add this in same file or import from separate file)
const Timer: React.FC<{ initialTime: number; onTimeUp: () => void }> = ({ initialTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`text-lg font-mono px-3 py-1 rounded-lg ${
      timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
    } text-white`}>
      {formatTime(timeLeft)}
    </div>
  );
};

const WritingSection: React.FC = () => {
  const { testId } = useParams();
  const { register, watch, setValue, handleSubmit } = useForm();
  
  // All states
  const [timeLeft, setTimeLeft] = useState(0);
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [writingResults, setWritingResults] = useState<any>(null);
  const [isWritingCompleted, setIsWritingCompleted] = useState(false);

  // Helper functions
  const calculateWordCount = (text: string) => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCurrentQuestionData = () => {
    if (!testData) return null;
    return testData.currentQuestion || testData;
  };

  const extractTitle = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Writing Test";
    return currentQuestion.title || "Writing Test";
  };

  const extractInstruction = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Complete the writing task below.";
    return currentQuestion.instruction || 
           currentQuestion.content?.instruction || 
           "Complete the writing task below.";
  };

  const extractContent = () => {
    const currentQuestion = getCurrentQuestionData();
    if (!currentQuestion) return "Writing task content will appear here.";
    
    if (currentQuestion.content && typeof currentQuestion.content === 'object') {
      return currentQuestion.content.passageText || 
             currentQuestion.content.text || 
             JSON.stringify(currentQuestion.content);
    }
    
    if (typeof currentQuestion.content === 'string') {
      return currentQuestion.content;
    }
    
    return "Writing task content will appear here.";
  };

  const getProgressInfo = () => {
    if (!testData) return { current: 1, total: 1 };
    return {
      current: testData?.currentQuestion ?? 1,
      total: testData?.totalQuestions ?? 1
    };
  };

  const formatAnswersForSubmission = (formData: any) => {
    const progress = getProgressInfo();
    const questionId = `writing_${progress.current}`;
    
    const answers = [{
      questionGroupId: `writing_${progress.current}`,
      questionId: questionId,
      answer: formData[questionId] || ''
    }];

    return answers;
  };

  const handleTimeUp = () => {
    console.log("Time's up! Auto-submitting...");
    handleSubmit(handleWritingSubmit)();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Fetch test data
  useEffect(() => {
    if (!testId) return;
    
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const response = await api.post('/test/start', {
          testSeriesId: testId
        });
        
        setTestData(response.data);
        setSessionId(
          response.data?.sessionId ||
          response.data?.testSessionId ||
          response.data?.data?.sessionId ||
          response.data?.data?.testSessionId
        );

        // Set initial time
        let initialTime = 60 * 60;
        if (response.data.timeRemaining) {
          initialTime = response.data.timeRemaining;
        } else if (response.data.duration || response.data?.data?.duration) {
          const duration = response.data.duration || response.data?.data?.duration;
          initialTime = duration * 60;
        }
        setTimeLeft(initialTime);

      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to load test");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestData();
  }, [testId]);

  // Word count calculation
  const progress = getProgressInfo();
  const questionId = `writing_${progress.current}`;
  const writingAnswer = watch(questionId);

  useEffect(() => {
    if (writingAnswer) {
      setWordCount(calculateWordCount(writingAnswer));
    }
  }, [writingAnswer]);

  // Handle writing submission
  const handleWritingSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const formattedAnswers = formatAnswersForSubmission(data);
      const submissionData = {
        answers: formattedAnswers,
        timeSpent: 60 * 60 - timeLeft,
        completed: true
      };

      const response = await api.post(`/test/session/${sessionId}/submit`, submissionData);
      
      if (response.data.success && response.data.isTestCompleted) {
        setWritingResults(response.data.analysis);
        setIsWritingCompleted(true);
      }
    } catch (error) {
      console.error("Writing submission error:", error);
      alert("Error submitting writing test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    // For writing, usually there's only one question per section
    console.log("Moving to next writing task...");
  };

  const goToPreviousQuestion = () => {
    console.log("Going to previous question...");
  };

  // Show writing results if completed
  if (isWritingCompleted && writingResults) {
    return (
      <WritingSummary 
        results={writingResults} 
        onClose={() => {
          setIsWritingCompleted(false);
          setWritingResults(null);
          // You can navigate or reset here
        }}
        darkMode={darkMode}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl">Loading writing test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Test</h2>
          <p className="text-gray-400 mb-2">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isLastQuestion = progress.current === progress.total;

  // Main writing UI
  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">{extractTitle()}</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className={`px-3 py-1 rounded-lg ${wordCount < 150 ? 'bg-yellow-600' : 'bg-green-600'} text-white`}>
              Words: {wordCount}/150
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-700 text-white hover:opacity-80 transition-all"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            {/* Timer */}
            <Timer
              initialTime={timeLeft}
              onTimeUp={handleTimeUp}
            />
            
            {isLastQuestion ? (
              <button
                onClick={handleSubmit(handleWritingSubmit)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-all duration-200 text-white disabled:opacity-50"
              >
                {isSubmitting ? "Loading..." : "Next Task"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex w-full" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left Panel - Instructions and Content */}
        <div className="w-2/5 bg-gray-800 p-6 overflow-y-auto">
          <div className="">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Instructions:</h3>
              <div className="bg-gray-600 rounded-lg p-4">
                <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-line">
                  {extractInstruction()}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-3">Task Content:</h3>
              <div className="bg-gray-600 rounded-lg p-4">
                {getCurrentQuestionData()?.content?.imageUrl && (
                  <img
                    src={getCurrentQuestionData().content.imageUrl}
                    alt="Writing task diagram"
                    className="max-w-full max-h-96 mx-auto rounded-lg mb-4"
                  />
                )}
                <div
                  className="prose prose-invert max-w-none text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: extractContent() }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Writing Area */}
        <div className="w-3/5 bg-gray-900 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit(handleWritingSubmit)} className="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
            {/* Word Count Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Word Count: {wordCount}</span>
                <span>Minimum: 150 words</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    wordCount < 75 ? 'bg-red-500' :
                    wordCount < 150 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((wordCount / 150) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Writing Textarea */}
            <textarea
              {...register(questionId)}
              placeholder="Start writing your answer here... (Minimum 150 words)"
              className="flex-1 w-full px-4 py-3 border border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white resize-none font-mono text-lg leading-relaxed"
              style={{ minHeight: '400px' }}
              onChange={(e) => {
                const text = e.target.value;
                setWordCount(calculateWordCount(text));
              }}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={goToPreviousQuestion}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
              >
                Previous Task
              </button>
              
              {isLastQuestion ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Writing"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Loading..." : "Next Task"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WritingSection;