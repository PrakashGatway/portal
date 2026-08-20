// IeltsTestResultPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Award,
  Clock,
  FileText,
  Headphones,
  PenTool,
  Mic,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Lightbulb,
  RotateCcw,
  Download,
  Share2,
} from "lucide-react";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreData {
  reading: number | null;
  listening: number | null;
  writing: number | null;
  speaking: number | null;
  overall: number | null;
}

interface SectionAnalysis {
  section: string;
  status: string;
  timeSpent: number;
  rawScore: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  accuracy: number;
  bandScore: number | null;
  averageTimePerQuestion: number;
  aiScore?: number | null;
  feedback?: string | null;
  strengths?: string[];
  weaknesses?: string[];
}

interface OverallAnalysis {
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedQuestions: number;
  accuracy: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  readingBand?: number | null;
  listeningBand?: number | null;
  writingBand?: number | null;
  speakingBand?: number | null;
  overallBand?: number | null;
  summary?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

interface ResultData {
  attemptId: string;
  test: {
    _id: string;
    title: string;
    slug: string;
    testType?: string;
    difficulty?: string;
    duration?: number;
  };
  status: string;
  score: ScoreData;
  analysis: OverallAnalysis;
  sections: Array<{
    section: string;
    status: string;
    timeSpent: number;
    analysis: SectionAnalysis;
  }>;
  startedAt: string;
  submittedAt: string;
  completedAt: string;
}

const SECTION_ICONS = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic,
};

const SECTION_COLORS = {
  reading: "from-blue-500 to-blue-600",
  listening: "from-purple-500 to-purple-600",
  writing: "from-green-500 to-green-600",
  speaking: "from-orange-500 to-orange-600",
};

export default function IeltsTestResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<ResultData | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const fetchResult = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [resultRes, analysisRes] = await Promise.all([
        api.get(`/ielts/attempts/${attemptId}/result`),
        api.get(`/ielts/attempts/${attemptId}/analysis`),
      ]);

      if (resultRes.data?.success) {
        setResult(resultRes.data.data);
      }
      if (analysisRes.data?.success) {
        setAnalysisData(analysisRes.data.data);
      }
    } catch (err: any) {
      console.error("Fetch result error:", err);
      setError(err.response?.data?.message || "Failed to load results");
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const formatTime = (seconds: number) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBandColor = (band: number | null | undefined) => {
    if (!band) return "text-gray-400";
    if (band >= 8) return "text-emerald-600";
    if (band >= 7) return "text-green-600";
    if (band >= 6) return "text-blue-600";
    if (band >= 5) return "text-amber-600";
    return "text-rose-600";
  };

  const getBandBackground = (band: number | null | undefined) => {
    if (!band) return "bg-gray-100";
    if (band >= 8) return "bg-emerald-50 border-emerald-200";
    if (band >= 7) return "bg-green-50 border-green-200";
    if (band >= 6) return "bg-blue-50 border-blue-200";
    if (band >= 5) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  const getBandLabel = (band: number | null | undefined) => {
    if (!band) return "N/A";
    if (band >= 8.5) return "Expert User";
    if (band >= 7.5) return "Very Good User";
    if (band >= 6.5) return "Good User";
    if (band >= 5.5) return "Competent User";
    if (band >= 4.5) return "Modest User";
    if (band >= 3.5) return "Limited User";
    return "Extremely Limited";
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-emerald-600";
    if (accuracy >= 60) return "text-green-600";
    if (accuracy >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-rose-500" />
          <p className="mt-4 text-lg font-medium">{error || "Result not found"}</p>
          <Button onClick={() => navigate("/ielts/tests")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  const overallBand = result.score.overall || result.analysis?.overallBand || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Test Results</h1>
            <p className="text-gray-500">{result.test.title}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/ielts/tests")}
              className="rounded-xl"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              New Test
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl"
            >
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Overall Band Score</h2>
              <p className="text-sm opacity-90">
                {getBandLabel(overallBand)}
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold">{overallBand?.toFixed(1) || "N/A"}</div>
              <div className="text-sm opacity-90">out of 9.0</div>
            </div>
          </div>
        </motion.div>

        {/* Section Scores */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {["reading", "listening", "writing", "speaking"].map((section) => {
            const Icon = SECTION_ICONS[section as keyof typeof SECTION_ICONS];
            const score = result.score[section as keyof ScoreData];
            const sectionAnalysis = result.sections.find(s => s.section === section);
            
            return (
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-4 ${getBandBackground(score)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className={`text-2xl font-bold ${getBandColor(score)}`}>
                    {score?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <h3 className="font-semibold capitalize">{section}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {sectionAnalysis?.analysis?.correctAnswers || 0} correct / {sectionAnalysis?.analysis?.totalQuestions || 0} total
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          {[
            { id: "overview", label: "Overview" },
            { id: "sections", label: "Section Analysis" },
            { id: "questions", label: "Question Review" },
            { id: "recommendations", label: "Recommendations" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-500">Accuracy</span>
                  </div>
                  <span className={`text-2xl font-bold ${getAccuracyColor(result.analysis?.accuracy || 0)}`}>
                    {(result.analysis?.accuracy || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-500">Correct</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {result.analysis?.correctAnswers || 0}
                  </span>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="text-sm text-gray-500">Incorrect</span>
                  </div>
                  <span className="text-2xl font-bold text-rose-600">
                    {result.analysis?.incorrectAnswers || 0}
                  </span>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-500">Time Spent</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {formatTime(result.analysis?.totalTimeSpent || 0)}
                  </span>
                </div>
              </div>

              {/* Summary */}
              {result.analysis?.summary && (
                <div className="rounded-2xl border p-6">
                  <h3 className="mb-3 font-semibold">Performance Summary</h3>
                  <p className="text-gray-600 dark:text-gray-400">{result.analysis.summary}</p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid gap-4 md:grid-cols-2">
                {result.analysis?.strengths && result.analysis.strengths.length > 0 && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-700">
                      <TrendingUp className="h-5 w-5" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {result.analysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.analysis?.weaknesses && result.analysis.weaknesses.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-rose-700">
                      <TrendingDown className="h-5 w-5" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {result.analysis.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-rose-800">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "sections" && (
            <motion.div
              key="sections"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {result.sections.map((section, idx) => {
                const Icon = SECTION_ICONS[section.section as keyof typeof SECTION_ICONS];
                const gradient = SECTION_COLORS[section.section as keyof typeof SECTION_COLORS];
                const isExpanded = expandedSection === section.section;
                
                return (
                  <div key={idx} className="rounded-2xl border overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.section)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg bg-gradient-to-r ${gradient} p-2 text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold capitalize">{section.section}</h3>
                          <p className="text-xs text-gray-500">
                            {section.analysis?.correctAnswers || 0}/{section.analysis?.totalQuestions || 0} correct
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${getBandColor(section.analysis?.bandScore)}`}>
                          {section.analysis?.bandScore?.toFixed(1) || "N/A"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t"
                        >
                          <div className="p-4 space-y-4">
                            {/* Section Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-500">Accuracy</div>
                                <div className={`text-lg font-bold ${getAccuracyColor(section.analysis?.accuracy || 0)}`}>
                                  {(section.analysis?.accuracy || 0).toFixed(1)}%
                                </div>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-500">Attempted</div>
                                <div className="text-lg font-bold">
                                  {section.analysis?.attemptedQuestions || 0}/{section.analysis?.totalQuestions || 0}
                                </div>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-500">Skipped</div>
                                <div className="text-lg font-bold">
                                  {section.analysis?.skippedQuestions || 0}
                                </div>
                              </div>
                              <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-500">Avg Time/Q</div>
                                <div className="text-lg font-bold">
                                  {formatTime(section.analysis?.averageTimePerQuestion || 0)}
                                </div>
                              </div>
                            </div>

                            {/* Feedback */}
                            {section.analysis?.feedback && (
                              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <h4 className="mb-2 text-sm font-semibold text-blue-700">Feedback</h4>
                                <p className="text-sm text-blue-800">{section.analysis.feedback}</p>
                              </div>
                            )}

                            {/* Strengths */}
                            {section.analysis?.strengths && section.analysis.strengths.length > 0 && (
                              <div>
                                <h4 className="mb-2 text-sm font-semibold text-green-700">Strengths</h4>
                                <ul className="space-y-1">
                                  {section.analysis.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Weaknesses */}
                            {section.analysis?.weaknesses && section.analysis.weaknesses.length > 0 && (
                              <div>
                                <h4 className="mb-2 text-sm font-semibold text-rose-700">Areas for Improvement</h4>
                                <ul className="space-y-1">
                                  {section.analysis.weaknesses.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-rose-800">
                                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                      {w}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {analysisData?.sections?.map((section: any, sectionIdx: number) => (
                <div key={sectionIdx} className="rounded-2xl border overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold capitalize">{section.section}</h3>
                  </div>
                  <div className="divide-y">
                    {section.groups?.map((group: any, groupIdx: number) => (
                      <div key={groupIdx} className="p-4">
                        {group.group?.title && (
                          <h4 className="mb-3 text-sm font-medium text-gray-600">
                            {group.group.title}
                          </h4>
                        )}
                        <div className="space-y-3">
                          {group.questions?.map((q: any, qIdx: number) => (
                            <div
                              key={qIdx}
                              className={`rounded-xl border p-4 ${
                                q.isCorrect === true
                                  ? "border-green-200 bg-green-50"
                                  : q.isCorrect === false
                                  ? "border-rose-200 bg-rose-50"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <span className="text-xs text-gray-500">Question {q.order}</span>
                                  <p className="text-sm font-medium mt-1">{q.question?.content || "Question content not available"}</p>
                                </div>
                                {q.isCorrect === true && (
                                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                )}
                                {q.isCorrect === false && (
                                  <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                                )}
                                {q.skipped && (
                                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="mt-2 text-xs">
                                <span className="text-gray-500">Your Answer: </span>
                                <span className="font-medium">
                                  {q.answer !== null && q.answer !== undefined && q.answer !== ""
                                    ? Array.isArray(q.answer)
                                      ? q.answer.join(", ")
                                      : String(q.answer)
                                    : "Not answered"}
                                </span>
                              </div>
                              {q.question?.correctAnswer && (
                                <div className="mt-1 text-xs">
                                  <span className="text-gray-500">Correct Answer: </span>
                                  <span className="font-medium text-green-700">
                                    {q.question.correctAnswer}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {result.analysis?.recommendations && result.analysis.recommendations.length > 0 && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-blue-700">
                    <Lightbulb className="h-5 w-5" />
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-3">
                    {result.analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-blue-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Section-specific recommendations */}
              {result.sections.map((section, idx) => {
                if (!section.analysis?.weaknesses || section.analysis.weaknesses.length === 0) return null;
                
                const Icon = SECTION_ICONS[section.section as keyof typeof SECTION_ICONS];
                
                return (
                  <div key={idx} className="rounded-2xl border p-6">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold capitalize">
                      <Icon className="h-5 w-5 text-gray-500" />
                      {section.section} - Focus Areas
                    </h4>
                    <ul className="space-y-2">
                      {section.analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Zap className="mt-0.5 h-4 w-4 text-amber-500 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Info */}
        <div className="mt-6 rounded-2xl border p-4 text-sm text-gray-500">
          <div className="flex flex-wrap gap-4">
            <span>Started: {formatDate(result.startedAt)}</span>
            <span>Submitted: {formatDate(result.submittedAt)}</span>
            <span>Completed: {formatDate(result.completedAt)}</span>
            <span>Test Type: {result.test.testType || "N/A"}</span>
            <span>Difficulty: {result.test.difficulty || "N/A"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}