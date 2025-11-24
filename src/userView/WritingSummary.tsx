// WritingSummary.tsx
import React from 'react';

interface WritingSummaryProps {
  results: any;
  onClose: () => void;
  darkMode?: boolean;
}

interface WritingQuestion {
  sectionType: string;
  questionId: string;
  userAnswer: string;
  evaluation?: {
    score: number;
    feedback: string;
    criteria: {
      taskAchievement: number;
      coherenceCohesion: number;
      lexicalResource: number;
      grammaticalRange: number;
    };
  };
  isCorrect?: boolean;
  timeSpent: number;
}

interface SectionAnalysis {
  sectionType: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalScore: number;
  averageScore: number;
  timeSpent: number;
  averageTimePerQuestion: number;
}

interface Summary {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  totalScore: number;
  accuracy: number;
  timeSpent: number;
  averageTimePerQuestion: number;
}

interface AnalysisResults {
  summary: Summary;
  sectionWiseAnalysis: SectionAnalysis[];
  questionAnalysis: WritingQuestion[];
}

const WritingSummary: React.FC<WritingSummaryProps> = ({ 
  results, 
  onClose, 
  darkMode = true 
}) => {
  if (!results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Results Available</h2>
          <p className="text-gray-400 mb-6">Unable to load writing results.</p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const analysis = results as AnalysisResults;
  const { summary, sectionWiseAnalysis, questionAnalysis } = analysis;
  
  // Find writing section analysis
  const writingAnalysis = sectionWiseAnalysis?.find((section: SectionAnalysis) => 
    section.sectionType === 'writing' || section.sectionType === 'Writing'
  );
  
  // Filter writing questions
  const writingQuestions = questionAnalysis?.filter((q: WritingQuestion) => 
    q.sectionType === 'writing' || q.sectionType === 'Writing'
  );

  // Calculate band score based on writing performance
  const getBandScore = () => {
    // If we have evaluation scores from writing questions, use those
    if (writingQuestions && writingQuestions.length > 0 && writingQuestions[0].evaluation) {
      const evalScores = writingQuestions[0].evaluation.criteria;
      const averageScore = (evalScores.taskAchievement + evalScores.coherenceCohesion + 
                           evalScores.lexicalResource + evalScores.grammaticalRange) / 4;
      
      return calculateBandScore(averageScore);
    }
    
    // Otherwise use total score from summary
    return calculateBandScore(summary.totalScore);
  };

  const calculateBandScore = (score: number) => {
    // IELTS Writing band score calculation
    if (score >= 8.5) return { band: 9, feedback: "Expert User" };
    if (score >= 7.5) return { band: 8, feedback: "Very Good User" };
    if (score >= 6.5) return { band: 7, feedback: "Good User" };
    if (score >= 5.5) return { band: 6, feedback: "Competent User" };
    if (score >= 4.5) return { band: 5, feedback: "Modest User" };
    if (score >= 3.5) return { band: 4, feedback: "Limited User" };
    if (score >= 2.5) return { band: 3, feedback: "Extremely Limited User" };
    if (score >= 1.5) return { band: 2, feedback: "Intermittent User" };
    return { band: 1, feedback: "Non-User" };
  };

  const bandScore = getBandScore();

  // Calculate completed tasks
  const completedTasks = writingAnalysis ? 
    writingAnalysis.totalQuestions - writingAnalysis.skippedQuestions : 
    summary.totalQuestions - summary.skippedQuestions;

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 lg:p-8 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 lg:w-20 lg:h-20 ${
              bandScore.band >= 7 ? 'bg-green-500' : 
              bandScore.band >= 5 ? 'bg-yellow-500' : 'bg-red-500'
            } rounded-full flex items-center justify-center`}>
              <span className="text-2xl lg:text-3xl">
                {bandScore.band >= 7 ? '🏆' : 
                 bandScore.band >= 5 ? '📝' : '🎯'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Writing Test Results
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm lg:text-base`}>
                Detailed writing performance analysis
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 lg:p-8 space-y-6">
          
          {/* Band Score */}
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6 text-center`}>
            <h3 className="text-lg lg:text-xl font-semibold mb-4">IELTS Writing Band Score</h3>
            <div className="text-6xl lg:text-8xl font-bold text-blue-400 mb-2">
              {bandScore.band}
            </div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {bandScore.feedback}
            </p>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Basic Stats */}
            <div className="space-y-6">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6`}>
                <h3 className="text-lg lg:text-xl font-semibold mb-4">Performance Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Total Tasks</span>
                    <span className="font-semibold">{writingAnalysis?.totalQuestions || summary.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400">Completed</span>
                    <span className="font-semibold text-green-400">
                      {completedTasks}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Skipped</span>
                    <span className="font-semibold text-red-400">
                      {writingAnalysis?.skippedQuestions || summary.skippedQuestions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-400">Time Spent</span>
                    <span className="font-semibold text-blue-400">
                      {formatTime(writingAnalysis?.timeSpent || summary.timeSpent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Analysis */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6`}>
                <h3 className="text-lg lg:text-xl font-semibold mb-4">Time Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Total Time</span>
                    <span className="font-semibold">
                      {formatTime(writingAnalysis?.timeSpent || summary.timeSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Average per Task</span>
                    <span className="font-semibold">
                      {writingAnalysis?.averageTimePerQuestion?.toFixed(1) || summary.averageTimePerQuestion.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Analysis */}
            <div className="space-y-6">
              
              {/* Writing Criteria */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6`}>
                <h3 className="text-lg lg:text-xl font-semibold mb-4">Writing Assessment</h3>
                <div className="space-y-4">
                  {writingQuestions?.map((question: WritingQuestion, index: number) => (
                    <div key={index} className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-xl p-4`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Task {index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          question.isCorrect ? 'bg-green-500' : 'bg-red-500'
                        } text-white`}>
                          {question.isCorrect ? 'Completed' : 'Skipped'}
                        </span>
                      </div>
                      {question.evaluation && (
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2 space-y-2`}>
                          <div className="grid grid-cols-2 gap-2">
                            <div><strong>Task Achievement:</strong> {question.evaluation.criteria.taskAchievement}/9</div>
                            <div><strong>Coherence & Cohesion:</strong> {question.evaluation.criteria.coherenceCohesion}/9</div>
                            <div><strong>Lexical Resource:</strong> {question.evaluation.criteria.lexicalResource}/9</div>
                            <div><strong>Grammatical Range:</strong> {question.evaluation.criteria.grammaticalRange}/9</div>
                          </div>
                          {question.evaluation.feedback && (
                            <p className="mt-2"><strong>Feedback:</strong> {question.evaluation.feedback}</p>
                          )}
                        </div>
                      )}
                      {!question.evaluation && question.isCorrect && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
                          Evaluation in progress...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6`}>
                <h3 className="text-lg lg:text-xl font-semibold mb-4">Next Steps</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.href = '/writing-practice'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                  >
                    <span className="mr-3">📚</span>
                    Practice More Writing
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                  >
                    <span className="mr-3">🏠</span>
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl p-6`}>
            <h3 className="text-lg lg:text-xl font-semibold mb-4 flex items-center">
              <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              Writing Performance Insights
            </h3>
            <div className="space-y-3">
              {bandScore.band >= 7 ? (
                <div className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-xl p-4`}>
                  <span className="text-green-400 text-lg mt-0.5">✅</span>
                  <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                    Excellent writing skills! Your band score of {bandScore.band} demonstrates strong language proficiency.
                    Focus on maintaining this level with regular practice.
                  </p>
                </div>
              ) : bandScore.band >= 5 ? (
                <div className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-xl p-4`}>
                  <span className="text-yellow-400 text-lg mt-0.5">💡</span>
                  <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                    Good attempt! Band {bandScore.band} shows competent writing skills. 
                    Practice task response structure and vocabulary enhancement to reach higher bands.
                  </p>
                </div>
              ) : (
                <div className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-xl p-4`}>
                  <span className="text-red-400 text-lg mt-0.5">🎯</span>
                  <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                    Focus on building fundamental writing skills. Practice basic sentence structures, 
                    vocabulary, and task response formatting to improve your band score.
                  </p>
                </div>
              )}
              
              {summary.skippedQuestions > 0 && (
                <div className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-xl p-4`}>
                  <span className="text-yellow-400 text-lg mt-0.5">⚠️</span>
                  <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                    You skipped {summary.skippedQuestions} writing task(s). Try to complete all tasks 
                    to get a comprehensive assessment of your writing abilities.
                  </p>
                </div>
              )}

              {writingQuestions?.[0]?.evaluation && (
                <div className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-xl p-4`}>
                  <span className="text-blue-400 text-lg mt-0.5">📊</span>
                  <div className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} leading-relaxed`}>
                    <p className="font-semibold mb-2">Detailed Criteria Scores:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Task Achievement: {writingQuestions[0].evaluation.criteria.taskAchievement}/9</div>
                      <div>Coherence & Cohesion: {writingQuestions[0].evaluation.criteria.coherenceCohesion}/9</div>
                      <div>Lexical Resource: {writingQuestions[0].evaluation.criteria.lexicalResource}/9</div>
                      <div>Grammatical Range: {writingQuestions[0].evaluation.criteria.grammaticalRange}/9</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritingSummary;