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

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface GRETestResultsProps {
  attempt: any;
  navigateBack: () => void;
  onTakeAnotherTest: () => void;
}

type TabType = "reading-writing" | "math";

export const GRETestResults: React.FC<GRETestResultsProps> = React.memo(
  ({ attempt, navigateBack, onTakeAnotherTest }) => {
    const overall = attempt.overallStats;

    // Default to Reading & Writing
    const [activeTab, setActiveTab] = useState<TabType>(0);

    // State ONLY for expanding/collapsing explanations
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
      new Set(),
    );

    const toggleQuestion = (questionId: string) => {
      setExpandedQuestions((prev) => {
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
      if (!attempt?.sections?.length) return [];

      return [attempt.sections[activeTab]];
    }, [attempt?.sections, activeTab]);

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
          total,
        };
      });
    }, [filteredSections]);

    // Calculate performance by difficulty (filtered)
    const difficultyData = useMemo(() => {
      const difficultyStats = {
        Easy: { correct: 0, total: 0 },
        Medium: { correct: 0, total: 0 },
        Hard: { correct: 0, total: 0 },
      };

      filteredSections.forEach((sec: any) => {
        sec.questions.forEach((q: any) => {
          const difficulty = q.questionDoc?.difficulty || "Medium";
          const normalizedDifficulty =
            difficulty.charAt(0).toUpperCase() +
            difficulty.slice(1).toLowerCase();

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
        accuracy:
          stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        correct: stats.correct,
        total: stats.total,
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
        const totalTimeSeconds = sec.questions.reduce(
          (acc: number, q: any) => acc + (q.timeSpentSeconds || 0),
          0,
        );
        const hours = Math.floor(totalTimeSeconds / 3600);
        const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
        const seconds = totalTimeSeconds % 60;
        const timeUsed = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        return {
          name: sec.name || `Section ${sec.order || 1}`,
          questions: total,
          correct,
          incorrect,
          skipped,
          accuracy,
          timeUsed,
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
      if (accuracy >= 70) return "#10b981"; // emerald-500
      if (accuracy >= 50) return "#3b82f6"; // blue-500
      if (accuracy >= 30) return "#f59e0b"; // amber-500
      return "#ef4444"; // red-500
    };

    const readingWritingSections =
      attempt?.sections?.filter(
        (section: any) =>
          section?.name?.toLowerCase() === attempt?.sections?.name,
      ) || [];

    const mathSections =
      attempt?.sections?.filter(
        (section: any) => section?.name?.toLowerCase() === "math",
      ) || [];

    const renderModule = (section: any, moduleNumber: number) => {
      const correct = section?.stats?.correct || 0;
      const incorrect = section?.stats?.incorrect || 0;
      const total = section?.questions?.length || 0;

      const attempted = correct + incorrect;

      const accuracy =
        attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

      const correctWidth = total > 0 ? (correct / total) * 100 : 0;

      const incorrectWidth = total > 0 ? (incorrect / total) * 100 : 0;

      return (
        <div key={section?.sectionConfigId}>
          {/* Correct */}
          <div className="grid grid-cols-[65px_1fr_40px] items-center gap-2 mb-4">
            <span className="text-[14px] text-[#555]">Correct</span>

            <div className="h-[45px] bg-[#fff5f1] overflow-hidden">
              <div
                className="h-full bg-[#fff0eb]"
                style={{
                  width: `${correctWidth}%`,
                }}
              />
            </div>

            <span className="text-[14px] text-[#555]">{correct}</span>
          </div>

          {/* Incorrect */}
          <div className="grid grid-cols-[65px_1fr_40px] items-center gap-2 mb-4">
            <span className="text-[14px] text-[#555]">Incorrect</span>

            <div className="h-[45px] bg-[#fff5f1] overflow-hidden">
              <div
                className="h-full bg-[#ffd1d1]"
                style={{
                  width: `${incorrectWidth}%`,
                }}
              />
            </div>

            <span className="text-[14px] text-[#555]">{incorrect}</span>
          </div>

          {/* Accuracy */}
          <div className="grid grid-cols-[65px_1fr_40px] items-center gap-2">
            <span className="text-[14px] text-[#555]">Accuracy</span>

            <div className="h-[45px] bg-[#fff8e8] overflow-hidden">
              <div
                className="h-full bg-[#fff4d9]"
                style={{
                  width: `${accuracy}%`,
                }}
              />
            </div>

            <span className="text-[14px] text-[#555]">{accuracy}%</span>
          </div>
        </div>
      );
    };

    if (!attempt) return null;
    console.log(attempt);

    return (
      <div className="bg-[#fdf4ef] min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
          <Button
            variant="outline"
            size="sm"
            className="text-orange-500 dark:border-slate-600 dark:hover:bg-slate-800 hover:text-[#f6673c] transition-colors"
            onClick={navigateBack}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <AttemptAnalysis sections={attempt?.sections} />

          {/* Overall Stats Grid */}
          <div>
            <span className="text-xl md:text-2xl font-bold px-2 md:px-6 block">
              <span className="text-[#f6673c]">Your</span> Practice Score Report
            </span>

            {overall && (
              <div className="rounded-[22px] bg-white p-4 md:p-7 mt-4 shadow-sm">
                {/* Section Header */}
                <div className="border-b border-gray-200 pb-5">
                  <h2 className="text-lg md:text-xl font-semibold text-[#4a4a4a]">
                    Question Overview
                  </h2>
                </div>

                {/* Stats - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 py-5">
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
                        border border-transparent bg-[#fff0eb]
                        hover:border-[#ff7048] hover:bg-[#fff0eb]
                      `}
                    >
                      {/* Label */}
                      <p className="text-[14px] md:text-[16px] font-medium text-[#4b4b4b] mb-2">
                        {item.label}
                      </p>

                      {/* Value */}
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-[24px] md:text-[29px] font-bold leading-none text-[#f6673c]">
                          {item.value}
                          {item.suffix && ` ${item.suffix}`}
                        </span>

                        {item.total && (
                          <span className="text-[13px] md:text-[15px] font-medium text-[#777]">
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

                    <p className="text-[14px] md:text-[15px] font-semibold text-[#555]">
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
              <div className="mb-5 px-2 md:px-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#3f3f3f]">
                  <span className="text-[#f6673c]">Sectional</span> Summary
                </h2>

                <p className="text-[13px] md:text-[14px] text-[#555] mt-1">
                  View your performance across the content domains measured on
                  that sat
                </p>
              </div>

              {/* Individual Module Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {attempt.sections.map((section: any, index: number) => (
                  <div
                    key={section?.sectionConfigId || index}
                    className="
                      bg-white
                      rounded-[20px]
                      p-4 md:p-6
                      shadow-sm
                    "
                  >
                    {/* Module Header */}
                    <h3
                      className="
                        text-lg md:text-xl
                        font-bold
                        text-[#4a4a4a]
                        pb-4
                        border-b
                        border-gray-200
                      "
                    >
                      Module {index + 1}
                    </h3>

                    {/* Module Stats */}
                    <div className="mt-8">
                      {renderModule(section, index + 1)}
                    </div>

                    {/* View Solutions */}
                    <button
                      type="button"
                      className="
                        w-full
                        h-[53px]
                        mt-8
                        rounded-[10px]
                        border
                        border-[#ff7048]
                        bg-white
                        text-[#f6673c]
                        text-[16px] md:text-[18px]
                        font-medium
                        hover:bg-[#fff5f1]
                        transition
                      "
                    >
                      View Solutions
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs - No "All" option, defaults to RW */}
          <TotalSATScore/>

          {/* Section-wise Results */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-2 md:px-6">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                <span className="text-[#f6673c]">Section</span> Breakdown
              </h3>
              
              {/* Scrollable tabs for mobile */}
              <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto gap-2 no-scrollbar">
                {attempt?.sections?.map((item: any, index: number) => (
                  <button
                    key={item?.sectionConfigId || index}
                    onClick={() => setActiveTab(index)}
                    className={`
                      flex-shrink-0
                      flex items-center gap-2
                      px-4 md:px-5 py-2.5
                      rounded-xl
                      text-sm font-medium
                      transition-all duration-200
                      ${
                        activeTab === index
                          ? "bg-white text-[#f6673c] border-l-4 border-[#f6673c]"
                          : "bg-white text-slate-600 hover:text-[#f6673c]"
                      }
                    `}
                  >
                    <BookOpenText className="h-4 w-4" />

                    {item?.name}
                  </button>
                ))}
              </div>
            </div>

                                  {filteredSections.length > 0 ? (
              filteredSections.map((sec: any, sIdx: number) => (
                <div
                  key={`${sec.sectionConfigId}-${sIdx}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:border-slate-800 overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg">
                          {sec.name || `Section ${sIdx + 1}`}
                        </h4>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                          {sec.questions.length} Questions •{" "}
                          {sec.durationMinutes || 45} mins
                        </p>
                      </div>
                    </div>

                    {/* Mini Stats for Section */}
                    {sec.stats && (
                      <div className="flex gap-4 text-sm w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 pt-2 md:pt-0">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-black">
                            {sec.stats.correct}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400">
                            Correct
                          </span>
                        </div>
                        <div className="w-px bg-slate-200 dark:bg-slate-700 h-8"></div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-black">
                            {sec.stats.incorrect}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400">
                            Wrong
                          </span>
                        </div>
                        <div className="w-px bg-slate-200 dark:bg-slate-700 h-8"></div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-black">
                            {sec.stats.skipped}
                          </span>
                          <span className="text-[10px] uppercase text-slate-400">
                            Skip
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Questions List - No Horizontal Scroll */}
                  <div className="divide-y divide-slate-300">
                    {sec.questions.map((q: any, qIdx: number) => {
                      const qd = q.questionDoc;
                      const status = getQuestionStatus(q, qd);
                      const isExpanded = expandedQuestions.has(q.question);

                      const getOptionLabel = (idx: number) => {
                        if (!qd?.options || !qd.options[idx]) return "--";
                        return (
                          qd.options[idx].label ||
                          String.fromCharCode("A".charCodeAt(0) + idx)
                        );
                      };

                      const userLabel =
                        q.answerOptionIndexes.length > 0
                          ? q.answerOptionIndexes
                              .map(getOptionLabel)
                              .join(", ")
                          : q.answerText || "--";

                      const correctLabels = qd?.options
                        ?.filter((o: any) => o.isCorrect)
                        .map((o: any) => `${o.label}. ${o.text}`);

                      const correctLabel =
                        correctLabels?.length > 0
                          ? correctLabels.join(", ")
                          : qd?.correctAnswerText || "--";

                      const hasExplanation = !!qd?.explanation;

                      return (
                        <div key={q.question} className={`${isExpanded ? "px-8" : ""}`}>
                          <div
                            className={`
                              transition-all duration-300
                              ${
                                isExpanded
                                  ? "bg-[#fff5ef] rounded-[24px] my-2 px-4 md:px-8 py-4"
                                  : "bg-white px-4 md:px-8 py-5"
                              }
                            `}
                          >
                            {/* ================================
            QUESTION ROW
        ================================= */}
                            
                            {/* DESKTOP VIEW (Hidden on Mobile) - Original Layout */}
                            <div className="hidden md:grid grid-cols-[58px_110px_minmax(0,1fr)_50px] items-center gap-3">
                                {/* QUESTION NUMBER */}
                                <div className="flex items-center justify-center">
                                  <div className="w-[43px] h-[43px] rounded-[11px] bg-[#ffe1d0] flex items-center justify-center text-[16px] font-medium text-[#4a4a4a]">
                                    {String(q.order || qIdx + 1).padStart(2, "0")}
                                  </div>
                                </div>

                                {/* STATUS */}
                                <div>
                                  <span className={`flex items-center justify-center w-[100px] h-[33px] rounded-[8px] text-sm font-semibold whitespace-nowrap ${status === "incorrect" ? "bg-[#df0000] text-white" : status === "correct" ? "bg-[#ff704b] text-white" : "bg-[#ffedc0] text-black"}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                </div>

                                {/* QUESTION TEXT & ANSWERS */}
                                <div className="min-w-0 pr-2">
                                  <p className="text-[17px] leading-[1.55] font-medium text-[#4a4a4a] line-clamp-2">
                                    {qd ? qd.questionText.replace(/<[^>]*>/g, "") : "No question text available"}
                                  </p>
                                  <div className="flex items-center mt-5 text-[16px] text-[#4b4b4b] relative">
                                    <div className="flex items-center pr-2 w-40">
                                      <span className="font-medium text-sm">Your Answer:</span>
                                      <span className={`ml-2 font-medium text-sm ${status === "correct" ? "text-[#159600]" : status === "incorrect" ? "text-[#df0000]" : "text-[#4b4b4b]"}`}>{userLabel}</span>
                                    </div>
                                    <div className="h-8 w-px bg-[#ff8060]" />
                                    <div className="flex items-center px-3 gap-2 w-180">
                                      <span className="font-medium text-sm">Correct:</span>
                                      <span className="ml-2 font-medium text-sm line-clamp-2">{correctLabel}</span>
                                    </div>
                                    <div className="flex items-center  absolute -right-15">
                                      <div className="h-8 w-px bg-[#ff8060] mr-4" />
                                      <span className="font-medium text-sm">Time:</span>
                                      <span className="ml-2 font-medium text-sm">{formatTimeSpent(q.timeSpentSeconds)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* CHEVRON */}
                                <div className="flex items-center justify-end">
                                  {hasExplanation ? (
                                    <button type="button" onClick={() => toggleQuestion(q.question)} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/60 transition-all duration-200">
                                      <ChevronDown className={`w-[25px] h-[25px] text-[#4b4b4b] transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#f6673c]" : ""}`} />
                                    </button>
                                  ) : (
                                    <ChevronDown className="w-[25px] h-[25px] text-[#4b4b4b] -rotate-90" />
                                  )}
                                </div>
                            </div>

                            {/* MOBILE VIEW (Visible only on Mobile) - Stacked Layout with Separate Rows */}
                            <div className="md:hidden flex flex-col gap-3">
                                {/* Top Row: Number & Chevron */}
                                <div className="flex justify-between items-center">
                                    <div className="w-[38px] h-[38px] rounded-[10px] bg-[#ffe1d0] flex items-center justify-center text-[14px] font-medium text-[#4a4a4a]">
                                        {String(q.order || qIdx + 1).padStart(2, "0")}
                                    </div>
                                    
                                    {hasExplanation ? (
                                        <button type="button" onClick={() => toggleQuestion(q.question)} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/60 transition-all duration-200">
                                          <ChevronDown className={`w-[24px] h-[24px] text-[#4b4b4b] transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#f6673c]" : ""}`} />
                                        </button>
                                      ) : (
                                        <ChevronDown className="w-[24px] h-[24px] text-[#4b4b4b] -rotate-90" />
                                      )}
                                </div>

                                {/* Question Text */}
                                <p className="text-[15px] leading-[1.5] font-medium text-[#4a4a4a]">
                                    {qd ? qd.questionText.replace(/<[^>]*>/g, "") : "No question text available"}
                                </p>

                                {/* Info Block */}
                                <div className="bg-white/60 rounded-xl p-3 space-y-2">
                                    
                                    {/* Row 1: Status & Time */}
                                    <div className="flex justify-between items-center">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${status === "incorrect" ? "bg-[#df0000] text-white" : status === "correct" ? "bg-[#ff704b] text-white" : "bg-[#ffedc0] text-black"}`}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                        
                                        <div className="flex items-center text-xs font-medium text-slate-500">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTimeSpent(q.timeSpentSeconds)}
                                        </div>
                                    </div>

                                    {/* Row 2: Your Answer */}
                                    <div className="flex items-start text-[13px]">
                                        <span className="font-medium text-slate-500 min-w-[70px]">Yours:</span>
                                        <span className={`font-semibold ${status === "correct" ? "text-[#159600]" : status === "incorrect" ? "text-[#df0000]" : "text-[#4b4b4b]"}`}>
                                            {userLabel}
                                        </span>
                                    </div>

                                    {/* Row 3: Correct Answer (Full Width) */}
                                    <div className="flex items-start text-[13px] pt-1 border-t border-slate-200/50 mt-1">
                                        <span className="font-medium text-slate-500 min-w-[70px]">Correct:</span>
                                        <span className="font-semibold text-slate-800 break-words">
                                            {correctLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* =================================
            EXPANDED CONTENT
        ================================== */}
                            {isExpanded && (
                              <div className="px-2 md:px-5 pb-4 md:pb-7 pt-2">
                                {hasExplanation && (
                                  <div
                                    className="
                                      ml-0 md:ml-[180px]
                                      mr-0 md:mr-[50px]
                                      bg-white
                                      rounded-[15px]
                                      px-4 md:px-6
                                      py-4
                                      shadow-sm
                                    "
                                  >
                                    <div
                                      className="
                                        text-[14px] md:text-[16px]
                                        leading-[1.6]
                                        text-[#4b4b4b]
                                      "
                                    >
                                      <span className="text-[#f6673c] font-medium">
                                        Explanation:
                                      </span>
                                      <br />
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html: qd.explanation,
                                        }}
                                      ></span>
                                    </div>
                                  </div>
                                )}
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
                <p className="text-slate-500 dark:text-slate-400">
                  No sections found for the selected category.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
              Ready to improve your score?
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="w-full sm:w-auto border-slate-300 dark:border-slate-600"
              >
                Print Report
              </Button>
              <Button
                className="w-full sm:w-auto bg-[#f6673c] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5"
                onClick={onTakeAnotherTest}
              >
                Take Another Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export const AttemptAnalysis = ({
  correct = 14,
  incorrect = 12,
  unattempted = 30,
  sections,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const allQuestions = sections.flatMap(
    (section: any) => section.questions || [],
  );

  const totalQuestions = allQuestions.length;

  const correctCount = allQuestions.filter(
    (question: any) => question.isCorrect === true,
  ).length;

  const incorrectCount = allQuestions.filter(
    (question: any) =>
      question.isAnswered === true && question.isCorrect === false,
  ).length;

  const unattemptedCount = allQuestions.filter(
    (question: any) => question.isAnswered !== true,
  ).length;

  const correctPercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const incorrectPercent =
    totalQuestions > 0
      ? Math.round((incorrectCount / totalQuestions) * 100)
      : 0;

  const unattemptedPercent =
    totalQuestions > 0 ? 100 - correctPercent - incorrectPercent : 0;

  const getLabelPosition = (startPercentage: number, percentage: number) => {
    const middlePercentage = startPercentage + percentage / 2;

    const angle = (middlePercentage / 100) * 360 - 90;

    const radius = 125;

    const x = Math.cos((angle * Math.PI) / 180) * radius;

    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`,
    };
  };

  const correctPosition = getLabelPosition(0, correctPercent);

  const incorrectPosition = getLabelPosition(correctPercent, incorrectPercent);

  const unattemptedPosition = getLabelPosition(
    correctPercent + incorrectPercent,
    unattemptedPercent,
  );

  return (
    <div className="w-full bg-[#fff8f5]">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 p-4 md:p-0">
        {/* Left Card */}
        <div
          className="relative overflow-hidden rounded-[24px] md:rounded-[36px] min-h-[200px] md:max-h-[300px] flex items-center p-6 md:p-10"
          style={{
            background: "linear-gradient(135deg, #ff7048 0%, #f6673c 100%)",
          }}
        >
          <div className="relative z-10">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">
              SAT Test Result Analysis
            </h1>

            <p className="text-base md:text-lg text-white max-w-2xl leading-relaxed">
              Review your performance. Click on a question to reveal the correct
              answer.
            </p>
          </div>
        </div>

        {/* Right Card */}
        <div className="bg-white rounded-[24px] md:rounded-[36px] px-4 md:px-8 py-5 flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#484848] mb-4 md:mb-0">
            Attempt Analysis
          </h2>

          {/* Chart Container */}
          <div className="relative h-[180px] md:h-[140px] mt-2 flex justify-center items-center">
            {/* Pie */}
            <div
              className="
                relative
                w-[160px] md:w-[135px]
                h-[160px] md:h-[135px]
              "
            >
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full overflow-visible transform -rotate-90"
              >
                {/* Correct */}
                <path
                  d={`
                    M 50 50
                    L 50 0
                    A 50 50 0 ${correctPercent > 50 ? 1 : 0} 1 ${
                    50 + 50 * Math.sin((correctPercent * 3.6 * Math.PI) / 180)
                  } ${50 - 50 * Math.cos((correctPercent * 3.6 * Math.PI) / 180)}
                    Z
                  `}
                  fill="#ff9b89"
                  className="cursor-pointer transition-opacity hover:opacity-90"
                  onMouseEnter={() => setHoveredSegment("correct")}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Incorrect */}
                <path
                  d={`
                    M 50 50
                    L ${
                      50 + 50 * Math.sin((correctPercent * 3.6 * Math.PI) / 180)
                    } ${
                    50 - 50 * Math.cos((correctPercent * 3.6 * Math.PI) / 180)
                  }
                    A 50 50 0 ${incorrectPercent > 50 ? 1 : 0} 1 ${
                    50 +
                    50 *
                      Math.sin(
                        ((correctPercent + incorrectPercent) * 3.6 * Math.PI) /
                          180,
                      )
                  } ${
                    50 -
                    50 *
                      Math.cos(
                        ((correctPercent + incorrectPercent) * 3.6 * Math.PI) /
                          180,
                      )
                  }
                    Z
                  `}
                  fill="#d90000"
                  className="cursor-pointer transition-opacity hover:opacity-90"
                  onMouseEnter={() => setHoveredSegment("incorrect")}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Unattempted */}
                <path
                  d={`
                    M 50 50
                    L ${
                      50 +
                      50 *
                        Math.sin(
                          ((correctPercent + incorrectPercent) * 3.6 * Math.PI) /
                            180,
                        )
                    } ${
                    50 -
                    50 *
                      Math.cos(
                        ((correctPercent + incorrectPercent) * 3.6 * Math.PI) /
                          180,
                      )
                  }
                    A 50 50 0 ${unattemptedPercent > 50 ? 1 : 0} 1 50 0
                    Z
                  `}
                  fill="#ff7048"
                  className="cursor-pointer transition-opacity hover:opacity-90"
                  onMouseEnter={() => setHoveredSegment("unattempted")}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              </svg>

              {hoveredSegment && (
                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    -translate-x-1/2
                    -translate-y-1/2
                    z-20
                    whitespace-nowrap
                    rounded-lg
                    bg-white
                    px-3
                    py-2
                    shadow-md
                    text-sm
                    font-medium
                    pointer-events-none
                  "
                >
                  {hoveredSegment === "correct" && (
                    <span className="text-[#ff8f7e]">
                      Correct {correctPercent}%
                    </span>
                  )}

                  {hoveredSegment === "incorrect" && (
                    <span className="text-[#d90000]">
                      Incorrect {incorrectPercent}%
                    </span>
                  )}

                  {hoveredSegment === "unattempted" && (
                    <span className="text-[#f6673c]">
                      Unattempted {unattemptedPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mt-2" />

          {/* Legend - Responsive Layout */}
          <div className="flex  justify-center gap-4 md:gap-8 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#ff9b89]" />
              <span className="text-[#ff8f7e] text-xs md:text-sm">
                Correct({correctPercent}%)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#d90000]" />
              <span className="text-[#d90000] text-xs md:text-sm">
                Incorrect({incorrectPercent}%)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#ff7048]" />
              <span className="text-[#f6673c] text-xs md:text-sm">
                Unattempted({unattemptedPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export const TotalSATScore = ({
  totalScore = 1240,
  readingWritingScore = 620,
  mathScore = 620,
}) => {
  const maxScore = 1600;
  const scorePercentage = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="w-full rounded-[28px] bg-white p-5 sm:p-6 lg:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[#f6673c] uppercase tracking-wide">
          SAT Result
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#484848]">
          Total SAT Score
        </h2>

        <p className="text-sm text-[#777]">
          Your overall performance across Reading & Writing and Math.
        </p>
      </div>

      {/* Main Score */}
      <div
        className="
          mt-6
          rounded-[22px]
          p-5 sm:p-7
          bg-gradient-to-br
          from-[#fff4ef]
          to-[#fff9f7]
          border
          border-[#ffe1d6]
        "
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          {/* Score */}
          <div>
            <p className="text-sm font-medium text-[#777]">
              Your Total Score
            </p>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl sm:text-6xl font-bold text-[#f6673c]">
                {totalScore}
              </span>

              <span className="text-lg sm:text-xl font-medium text-[#999]">
                / {maxScore}
              </span>
            </div>

            <p className="mt-2 text-sm text-[#555]">
              {scorePercentage}% of the maximum score
            </p>
          </div>

          {/* Score Circle */}
          <div className="flex justify-center md:justify-end">
            <div
              className="
                relative
                w-[125px]
                h-[125px]
                sm:w-[140px]
                sm:h-[140px]
                rounded-full
                flex
                items-center
                justify-center
              "
              style={{
                background: `conic-gradient(
                  #f6673c 0% ${scorePercentage}%,
                  #ffe5dc ${scorePercentage}% 100%
                )`,
              }}
            >
              <div
                className="
                  w-[92px]
                  h-[92px]
                  sm:w-[104px]
                  sm:h-[104px]
                  rounded-full
                  bg-white
                  flex
                  flex-col
                  items-center
                  justify-center
                "
              >
                <span className="text-xl sm:text-2xl font-bold text-[#484848]">
                  {scorePercentage}%
                </span>

                <span className="text-xs text-[#888]">
                  Score
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        
        {/* Reading & Writing */}
        <div
          className="
            rounded-[18px]
            border
            border-[#ffe2d8]
            bg-[#fffaf8]
            p-5
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777]">
                Reading & Writing
              </p>

              <p className="mt-1 text-2xl font-bold text-[#484848]">
                {readingWritingScore}
                <span className="text-sm font-medium text-[#999]">
                  {" "}
                  / 800
                </span>
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-[#ffe5dc] flex items-center justify-center">
              <BookOpenText className="w-5 h-5 text-[#f6673c]" />
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-[#ffe8df] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#f6673c]"
              style={{
                width: `${(readingWritingScore / 800) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Math */}
        <div
          className="
            rounded-[18px]
            border
            border-[#ffe2d8]
            bg-[#fffaf8]
            p-5
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#777]">
                Math
              </p>

              <p className="mt-1 text-2xl font-bold text-[#484848]">
                {mathScore}
                <span className="text-sm font-medium text-[#999]">
                  {" "}
                  / 800
                </span>
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-[#ffe5dc] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#f6673c]" />
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-[#ffe8df] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#ff7048]"
              style={{
                width: `${(mathScore / 800) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};