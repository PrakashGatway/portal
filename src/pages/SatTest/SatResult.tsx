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
  AlertTriangle,
  CheckCircle2,
  Edit3,
  BookOpen,
} from "lucide-react";
import Button from "../../components/ui/button/Button";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';



interface GRETestResultsProps {
  attempt: any;
  navigateBack: () => void;
  onTakeAnotherTest: () => void;
}

type TabType = 'reading-writing' | 'math';

export const GRETestResults: React.FC<GRETestResultsProps> = React.memo(
  ({ attempt, navigateBack, onTakeAnotherTest }) => {
    const overall = attempt.overallStats;
    
    // Default to Reading & Writing
    const [activeTab, setActiveTab] = useState<TabType>('reading-writing');
    
    // State ONLY for expanding/collapsing explanations
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

    const toggleQuestion = (questionId: string) => {
      setExpandedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) {
          newSet.delete(questionId);
        } else {
          newSet.add(questionId);
        }
        return newSet;
      });
    };

    // Filter sections based on active tab
    const filteredSections = useMemo(() => {
      if (activeTab === 'reading-writing') {
        return attempt.sections.filter((sec: any) => 
          sec.name.toLowerCase().includes('reading') || 
          sec.name.toLowerCase().includes('writing')
        );
      }
      if (activeTab === 'math') {
        return attempt.sections.filter((sec: any) => 
          sec.name.toLowerCase().includes('math')
        );
      }
      return attempt.sections;
    }, [attempt.sections, activeTab]);

    // Calculate section-wise accuracy data (filtered)
    const sectionAccuracyData = useMemo(() => {
      return filteredSections.map((sec: any) => {
        const total = sec.questions?.length || 0;
        const correct = sec.stats?.correct || 0;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        return {
          name: sec.name || `Section ${sec.order || 1}`,
          accuracy: accuracy,
          correct,
          total
        };
      });
    }, [filteredSections]);

    // Calculate performance by difficulty (filtered)
    const difficultyData = useMemo(() => {
      const difficultyStats = {
        Easy: { correct: 0, total: 0 },
        Medium: { correct: 0, total: 0 },
        Hard: { correct: 0, total: 0 }
      };

      filteredSections.forEach((sec: any) => {
        sec.questions.forEach((q: any) => {
          const difficulty = q.questionDoc?.difficulty || 'Medium';
          const normalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
          
          if (difficultyStats[normalizedDifficulty]) {
            difficultyStats[normalizedDifficulty].total++;
            if (q.isCorrect) {
              difficultyStats[normalizedDifficulty].correct++;
            }
          }
        });
      });

      return Object.entries(difficultyStats).map(([level, stats]) => ({
        level,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        correct: stats.correct,
        total: stats.total
      }));
    }, [filteredSections]);

    // Section breakdown table data (filtered)
    const sectionBreakdownData = useMemo(() => {
      return filteredSections.map((sec: any) => {
        const total = sec.questions?.length || 0;
        const correct = sec.stats?.correct || 0;
        const incorrect = sec.stats?.incorrect || 0;
        const skipped = sec.stats?.skipped || 0;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // Calculate total time
        const totalTimeSeconds = sec.questions.reduce((acc: number, q: any) => 
          acc + (q.timeSpentSeconds || 0), 0
        );
        const hours = Math.floor(totalTimeSeconds / 3600);
        const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
        const seconds = totalTimeSeconds % 60;
        const timeUsed = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        return {
          name: sec.name || `Section ${sec.order || 1}`,
          questions: total,
          correct,
          incorrect,
          skipped,
          accuracy,
          timeUsed
        };
      });
    }, [filteredSections]);

    const getQuestionStatus = (q: any, qd?: any | null) => {
      if (!q.isAnswered) return "skipped";
      if (typeof q.isCorrect === "boolean") {
        return q.isCorrect ? "correct" : "incorrect";
      }
      if (
        qd &&
        typeof qd.correctOptionIndex === "number" &&
        qd.correctOptionIndex >= 0
      ) {
        const userIdx = q.answerOptionIndexes[0];
        return userIdx === qd.correctOptionIndex ? "correct" : "incorrect";
      }
      return "attempted";
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "correct":
          return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
        case "incorrect":
          return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
        case "skipped":
          return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
        default:
          return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "correct":
          return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
        case "incorrect":
          return <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />;
        case "skipped":
          return <Clock className="h-3.5 w-3.5 mr-1.5" />;
        default:
          return <Edit3 className="h-3.5 w-3.5 mr-1.5" />;
      }
    };

    const formatTimeSpent = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const getAccuracyColor = (accuracy: number) => {
      if (accuracy >= 70) return '#10b981'; // emerald-500
      if (accuracy >= 50) return '#3b82f6'; // blue-500
      if (accuracy >= 30) return '#f59e0b'; // amber-500
      return '#ef4444'; // red-500
    };

    const readingWritingSections =
  attempt?.sections?.filter(
    (section: any) =>
      section?.name?.toLowerCase() === "reading and writing"
  ) || [];

const mathSections =
  attempt?.sections?.filter(
    (section: any) =>
      section?.name?.toLowerCase() === "math"
  ) || [];


  const renderModule = (
  section: any,
  moduleNumber: number
) => {
  const correct = section?.stats?.correct || 0;
  const incorrect = section?.stats?.incorrect || 0;
  const total = section?.questions?.length || 0;

  const attempted = correct + incorrect;

  const accuracy =
    attempted > 0
      ? Math.round((correct / attempted) * 100)
      : 0;

  const correctWidth =
    total > 0
      ? (correct / total) * 100
      : 0;

  const incorrectWidth =
    total > 0
      ? (incorrect / total) * 100
      : 0;

  return (
    <div key={section?.sectionConfigId}>
      <h4 className="text-lg font-bold text-[#4a4a4a] mb-4">
        Module {moduleNumber}
      </h4>

      {/* Correct */}
      <div className="grid grid-cols-[65px_1fr_40px] items-center gap-2 mb-4">
        <span className="text-[14px] text-[#555]">
          Correct
        </span>

        <div className="h-[45px] bg-[#fff5f1] overflow-hidden">
          <div
            className="h-full bg-[#fff0eb]"
            style={{
              width: `${correctWidth}%`,
            }}
          />
        </div>

        <span className="text-[14px] text-[#555]">
          {correct}
        </span>
      </div>

      {/* Incorrect */}
      <div className="grid grid-cols-[65px_1fr_40px] items-center gap-2 mb-4">
        <span className="text-[14px] text-[#555]">
          Incorrect
        </span>

        <div className="h-[45px] bg-[#fff5f1] overflow-hidden">
          <div
            className="h-full bg-[#ffd1d1]"
            style={{
              width: `${incorrectWidth}%`,
            }}
          />
        </div>

        <span className="text-[14px] text-[#555]">
          {incorrect}
        </span>
      </div>

      {/* Accuracy */}
      <div className="grid grid-cols-[65px_1fr_40px] items-center gap-2">
        <span className="text-[14px] text-[#555]">
          Accuracy
        </span>

        <div className="h-[45px] bg-[#fff8e8] overflow-hidden">
          <div
            className="h-full bg-[#fff4d9]"
            style={{
              width: `${accuracy}%`,
            }}
          />
        </div>

        <span className="text-[14px] text-[#555]">
          {accuracy}%
        </span>
      </div>
    </div>
  );
};

    

    if (!attempt) return null;
    console.log(attempt)

    return (
      <div className="bg-[#fdf4ef]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        
      <Button
            variant="outline"
            size="sm"
            className=" text-orange-500 dark:border-slate-600  dark:hover:bg-slate-800 hover:text-[#f6673c] transition-colors"
            onClick={navigateBack}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        <AttemptAnalysis sections={attempt?.sections}/>

          {/* Overall Stats Grid */}
     <div>
                <span className="text-2xl font-bold px-6 "><span className="text-[#f6673c]">Your</span> Practice Score Report</span>
     
{overall && (
  <div className="rounded-[22px] bg-white p-6 md:p-7 mt-4">

    {/* Section Header */}
    <div className="border-b border-gray-200 pb-5">
      <h2 className="text-xl font-semibold text-[#4a4a4a]">
        Question Overview
      </h2>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-5">

      {[
        {
          label: "Correct answer",
          value: overall.totalCorrect,
          total: overall.totalQuestions,
        },
        {
          label: "Attempted",
          value: overall.totalAttempted,
          total: overall.totalQuestions,
        },
        {
          label: "Question Unattempted",
          value: overall.totalQuestions - overall.totalAttempted,
          total: overall.totalQuestions,
        },
        {
          label: "Raw Score",
          value: overall.rawScore,
          total: null,
        },
      ].map((item, i) => (
        <div
          key={i}
          className={`
            min-h-[108px]
            rounded-[14px]
            flex
            flex-col
            items-center
            justify-center
            text-center
            px-4
            py-4
            transition-all
            duration-200
            ${
              i === 0
                ? "border border-[#ff7048] bg-[#fff0eb]"
                : "border border-transparent bg-[#fff0eb]"
            }
          `}
        >
          {/* Label */}
          <p className="text-[16px] font-medium text-[#4b4b4b] mb-2">
            {item.label}
          </p>

          {/* Value */}
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-[29px] font-bold leading-none text-[#f6673c]">
              {item.value}
              {item.suffix && ` ${item.suffix}`}
            </span>

            {item.total && (
              <span className="text-[15px] font-medium text-[#777]">
                /{item.total}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Improvement Tips */}
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[17px] text-[#f6673c]">♧</span>

        <p className="text-[15px] font-semibold text-[#555]">
          Improvement Tips
        </p>
      </div>

      <p className="text-[12px] text-[#666]">
        Practice Today. Improve Your SAT Score Tomorrow.
      </p>
    </div>

  </div>
)}
</div>


{attempt?.sections?.length > 0 && (
  <div className="w-full">

    {/* Header */}
    <div className="mb-5 px-6">
      <h2 className="text-2xl font-bold text-[#3f3f3f]">
        <span className="text-[#f6673c]">
          Sectional
        </span>{" "}
        Summary
      </h2>

      <p className="text-[14px] text-[#555] mt-1">
        View your performance across the content domains measured on that sat
      </p>
    </div>

    {/* Two Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

      {/* Reading & Writing */}
      {readingWritingSections.length > 0 && (
        <div className="bg-white rounded-[20px] p-5 md:p-6">

          <h3 className="text-xl font-bold text-[#4a4a4a] border-b border-gray-200 pb-3">
            Reading and Writing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
            {readingWritingSections.map(
              (section: any, index: number) =>
                renderModule(section, index + 1)
            )}
          </div>

          <button
            type="button"
            className="
              w-full
              h-[37px]
              mt-6
              rounded-[8px]
              border
              border-[#ff7048]
              bg-white
              text-[#f6673c]
              text-[15px]
              font-medium
              hover:bg-[#fff5f1]
              transition
            "
          >
            View Solutions
          </button>
        </div>
      )}

      {/* Math */}
      {mathSections.length > 0 && (
        <div className="bg-white rounded-[20px] p-5 md:p-6">

          <h3 className="text-xl font-bold text-[#4a4a4a] border-b border-gray-200 pb-3">
            Math
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
            {mathSections.map(
              (section: any, index: number) =>
                renderModule(section, index + 1)
            )}
          </div>

          <button
            type="button"
            className="
              w-full
              h-[37px]
              mt-6
              rounded-[8px]
              border
              border-[#ff7048]
              bg-white
              text-[#f6673c]
              text-[15px]
              font-medium
              hover:bg-[#fff5f1]
              transition
            "
          >
            View Solutions
          </button>
        </div>
      )}

    </div>
  </div>
)}



        {/* Tabs - No "All" option, defaults to RW */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('reading-writing')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'reading-writing'
                ? 'bg-white dark:bg-slate-700 text-[#f6673c] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpenText className="h-4 w-4" />
            Reading & Writing
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'math'
                ? 'bg-white dark:bg-slate-700 text-[#f6673c] shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Math
          </button>
        </div>



   

        {/* Section-wise Results */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              <span className="text-[#f6673c]">Section</span> Breakdown
            </h3>
          </div>

          {filteredSections.length > 0 ? (
            filteredSections.map((sec: any, sIdx: number) => (
              <div key={`${sec.sectionConfigId}-${sIdx}`} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Section Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#f6673c] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-500/20">
                      {sIdx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                        {sec.name || `Section ${sIdx + 1}`}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {sec.questions.length} Questions • {sec.durationMinutes || 45} mins
                      </p>
                    </div>
                  </div>
                  
                  {/* Mini Stats for Section */}
                  {sec.stats && (
                     <div className="flex gap-4 text-sm">
                       <div className="flex flex-col items-end">
                         <span className="font-bold text-emerald-600">{sec.stats.correct}</span>
                         <span className="text-[10px] uppercase text-slate-400">Correct</span>
                       </div>
                       <div className="w-px bg-slate-200 dark:bg-slate-700 h-8"></div>
                       <div className="flex flex-col items-end">
                         <span className="font-bold text-red-600">{sec.stats.incorrect}</span>
                         <span className="text-[10px] uppercase text-slate-400">Wrong</span>
                       </div>
                       <div className="w-px bg-slate-200 dark:bg-slate-700 h-8"></div>
                       <div className="flex flex-col items-end">
                         <span className="font-bold text-slate-500">{sec.stats.skipped}</span>
                         <span className="text-[10px] uppercase text-slate-400">Skip</span>
                       </div>
                     </div>
                  )}
                </div>

                {/* Questions List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sec.questions.map((q: any, qIdx: number) => {
                    const qd = q.questionDoc;
                    const status = getQuestionStatus(q, qd);
                    const statusClass = getStatusColor(status);
                    const isExpanded = expandedQuestions.has(q.question);

                    const getOptionLabel = (idx: number) => {
                      if (!qd?.options || !qd.options[idx]) return "--";
                      return (qd.options[idx].label || String.fromCharCode("A".charCodeAt(0) + idx));
                    };

                    const userLabel = q.answerOptionIndexes.length > 0
                      ? q.answerOptionIndexes.map(getOptionLabel).join(", ")
                      : q.answerText || "--";

                    const correctLabels = qd?.options?.filter((o: any) => o.isCorrect).map((o: any) => `${o.label}. ${o.text}`);
                    const correctLabel = correctLabels?.length > 0 ? correctLabels.join(", ") : qd?.correctAnswerText || "--";
                    const hasExplanation = !!qd?.explanation;

                    return (
                      <div 
                        key={q.question} 
                        className="group relative bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-200"
                      >
                        {/* Status Indicator Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-200 ${
                          status === 'correct' ? 'bg-emerald-500' : 
                          status === 'incorrect' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}></div>

                        <div className="p-4 md:p-6 flex flex-col gap-4 pl-6 md:pl-8">
                          
                          {/* Top Row: Number & Meta */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                               <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                                 status === 'correct' ? 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' :
                                 status === 'incorrect' ? 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' :
                                 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                              }`}>
                                {q.order || qIdx + 1}
                              </div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusClass}`}>
                                {getStatusIcon(status)}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                            
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeSpent(q.timeSpentSeconds)}
                            </span>
                          </div>

                          {/* Question Text */}
                          <div className="space-y-3">
                            <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                              {qd ? qd.questionText.replace(/<[^>]*>/g, "") : "No question text available"}
                            </p>
                            
                            {/* User Answer Display */}
                            <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-700 inline-block">
                              <span className="text-slate-500 text-xs uppercase font-semibold">Your Answer:</span>
                              <span className={`font-semibold ${
                                status === 'correct' ? 'text-emerald-600 dark:text-emerald-400' :
                                status === 'incorrect' ? 'text-red-600 dark:text-red-400' :
                                'text-slate-600 dark:text-slate-300'
                              }`}>
                                {userLabel}
                              </span>
                            </div>
                          </div>

                          {/* ALWAYS VISIBLE: Correct Answer Block */}
                          <div className="mt-2 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                             <div className="flex flex-col gap-2">
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Correct Answer
                                  </div>
                                  <div className="text-sm font-medium p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:text-emerald-300">
                                    {correctLabel}
                                  </div>
                             </div>

                             {/* EXPANDABLE: Explanation Section (Only if explanation exists) */}
                             {hasExplanation && (
                               <div className={`grid transition-all duration-300 ease-in-out ${
                                 isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
                               }`}>
                                 <div className="overflow-hidden">
                                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                      <div className="flex items-center gap-2 mb-2">
                                         <div className="h-5 w-5 rounded-full bg-[#f6673c]/10 text-[#f6673c] flex items-center justify-center">
                                            <span className="text-[10px] font-bold">?</span>
                                         </div>
                                         <span className="text-xs font-bold text-[#f6673c] uppercase tracking-wider">Explanation</span>
                                      </div>
                                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                         {qd.explanation}
                                      </p>
                                   </div>
                                 </div>
                               </div>
                             )}
                          </div>

                          {/* Toggle Button (Only renders if there is an explanation to show) */}
                          {hasExplanation && (
                            <div className="flex justify-end pt-2">
                              <button 
                                onClick={() => toggleQuestion(q.question)}
                                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#f6673c] dark:text-slate-400 dark:hover:text-[#f6673c] transition-colors group/btn"
                              >
                                <span>{isExpanded ? 'Hide Explanation' : 'Show Explanation'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">No sections found for the selected category.</p>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Ready to improve your score?
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => window.print()} className="border-slate-300 dark:border-slate-600">
               Print Report
             </Button>
             <Button 
                className="bg-[#f6673c] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5"
                onClick={onTakeAnotherTest}
             >
               Take Another Test
             </Button>
          </div>
        </div>

      </div></div>
    );
  },
);



export const AttemptAnalysis = ({
  correct = 14,
  incorrect = 12,
  unattempted = 30,
  sections
}) => {
     const allQuestions = sections.flatMap(
    (section: any) => section.questions || []
  );

  const totalQuestions = allQuestions.length;

  const correctCount = allQuestions.filter(
    (question: any) => question.isCorrect === true
  ).length;

  const incorrectCount = allQuestions.filter(
    (question: any) =>
      question.isAnswered === true &&
      question.isCorrect === false
  ).length;

  const unattemptedCount = allQuestions.filter(
    (question: any) => question.isAnswered !== true
  ).length;

  const correctPercent =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  const incorrectPercent =
    totalQuestions > 0
      ? Math.round((incorrectCount / totalQuestions) * 100)
      : 0;

  const unattemptedPercent =
    totalQuestions > 0
      ? 100 - correctPercent - incorrectPercent
      : 0;

  const getLabelPosition = (
    startPercentage: number,
    percentage: number
  ) => {
    const middlePercentage =
      startPercentage + percentage / 2;

    const angle =
      (middlePercentage / 100) * 360 - 90;

    const radius = 125;

    const x =
      Math.cos((angle * Math.PI) / 180) * radius;

    const y =
      Math.sin((angle * Math.PI) / 180) * radius;

    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
    };
  };

  const correctPosition = getLabelPosition(
    0,
    correctPercent
  );

  const incorrectPosition = getLabelPosition(
    correctPercent,
    incorrectPercent
  );

  const unattemptedPosition = getLabelPosition(
    correctPercent + incorrectPercent,
    unattemptedPercent
  );

  return (
    <div className="w-full bg-[#fff8f5] ">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">

        {/* Left Card */}
        <div
          className="relative overflow-hidden rounded-[36px] max-h-[300px] flex items-center"
          style={{
            background:
              "linear-gradient(135deg, #ff7048 0%, #f6673c 100%)",
          }}
        >
   
          <div className="relative z-10 px-10 lg:px-6">
            <h1 className="text-4xl lg:text-4xl font-bold text-white mb-4">
              SAT Test Result Analysis
            </h1>

            <p className="text-lg lg:text-xl text-white max-w-2xl leading-relaxed">
              Review your performance. Click on a question to reveal the
              correct answer.
            </p>
          </div>
        </div>

        {/* Right Card */}
        <div className="bg-white rounded-[36px] max-h-[300px] px-8 py-5 shadow-sm">
          <h2 className="text-2xl lg:text-xl font-bold text-[#484848]">
            Attempt Analysis
          </h2>

          {/* Chart */}
          <div className="relative h-[140px] mt-4">

        {/* Pie */}
        <div
          className="
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            w-[135px]
            h-[135px]
            rounded-full
          "
          style={{
            background: `conic-gradient(
              #ff9b89 0% ${correctPercent}%,
              #d90000 ${correctPercent}% ${
                correctPercent + incorrectPercent
              }%,
              #ff7048 ${
                correctPercent + incorrectPercent
              }% 100%
            )`,
          }}
        />

        {/* Correct */}
        <span
          className="
            absolute
            -translate-x-1/2
            translate-y-3
            whitespace-nowrap
            text-[#ff8f7e]
            text-sm
            font-medium
          "
          style={correctPosition}
        >
          Correct {correctPercent}%
        </span>

        {/* Incorrect */}
        <span
          className="
            absolute
            -translate-y-1/2
            whitespace-nowrap
            text-[#d90000]
            text-sm
            font-medium
          "
          style={incorrectPosition}
        >
          Incorrect {incorrectPercent}%
        </span>

        {/* Unattempted */}
        <span
          className="
            absolute
            -translate-x-28
            -translate-y-15
            whitespace-nowrap
            text-[#f6673c]
            text-sm
            font-medium
          "
          style={unattemptedPosition}
        >
          Unattempted {unattemptedPercent}%
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 mt-3" />

      {/* Legend */}
      <div className="flex justify-center gap-8 mt-3">

        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#ff9b89]" />
          <span className="text-[#ff8f7e] text-[18px]">
            Correct
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#d90000]" />
          <span className="text-[#d90000] text-[18px]">
            Incorrect
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-[#ff7048]" />
          <span className="text-[#f6673c] text-[18px]">
            Unattempted
          </span>
        </div>

      </div>
        </div>
      </div>
    </div>
  );
};