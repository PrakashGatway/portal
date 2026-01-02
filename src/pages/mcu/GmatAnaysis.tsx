import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Award,
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  MinusCircle,
  Brain,
  MessageSquare,
  Database,
  Trophy,
  Target,
  TrendingUp,
  PieChartIcon,
  AlertCircle 
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
    CartesianGrid,
  LineChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
  AreaChart,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import api from "../../axiosInstance";
import FullScreenLoader from "../../components/fullScreeLoader";

// ========= Types (match your attempt structure) =========

interface QuestionDoc {
  _id: string;
  questionText: string;
  questionType: string;
  difficulty?: string;
  stimulus?: string;
  options?: {
    label?: string;
    text: string;
  }[];
  marks?: number;
  negativeMarks?: number;
}

interface AttemptQuestion {
  question: string;
  order: number;
  answerOptionIndexes: number[];
  answerText?: string;
  isAnswered: boolean;
  markedForReview: boolean;
  timeSpentSeconds: number;
  isCorrect?: boolean;
  marksAwarded?: number;
  questionDoc?: QuestionDoc | null;
}

interface AttemptSection {
  sectionConfigId?: string | null;
  sectionRef?: string | null;
  name?: string;
  durationMinutes?: number;
  startedAt?: string;
  endedAt?: string;
  status: "not_started" | "in_progress" | "completed";
  questions: AttemptQuestion[];
  stats?: {
    correct: number;
    incorrect: number;
    skipped: number;
    rawScore: number;
  };
}

interface OverallStats {
  totalQuestions: number;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  rawScore: number;
}

interface TestAttempt {
  _id: string;
  user: string;
  exam: {
    _id: string;
    name: string;
    description?: string;
  };
  testTemplate: {
    _id: string;
    title: string;
    description?: string;
    testType: "full_length" | "sectional" | "quiz";
  };
  testType: "full_length" | "sectional" | "quiz";
  status: "in_progress" | "completed" | "cancelled" | "expired";
  totalDurationMinutes?: number;
  totalTimeUsedSeconds: number;
  startedAt?: string;
  completedAt?: string;
  sections: AttemptSection[];
  overallStats?: OverallStats;
}

const formatTime = (seconds: number) => {
  if (!seconds || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
};

const GmatTestAnalysisPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ======== Load attempt with results ========
  useEffect(() => {
    const fetchAttempt = async () => {
      if (!attemptId) {
        setError("Missing attemptId in route");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // If you have a special "with-results" endpoint, use that instead
        const res = await api.get(`/mcu/attempts/${attemptId}`);
        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to load test analysis");
        }
        const data: TestAttempt = res.data.data;

        if (data.status !== "completed") {
          // Optional: redirect back if test not completed
          // navigate(`/student/gmat-test/${data.testTemplate._id}`);
          console.warn("Attempt is not completed yet");
        }

        setAttempt(data);
      } catch (err: any) {
        console.error("fetchAttempt error:", err);
        setError(
          err?.response?.data?.message || err.message || "Failed to load analysis"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  // ========= Derive / fallback overall stats =========
  const overallStats: OverallStats | null = useMemo(() => {
    if (!attempt) return null;

    if (attempt.overallStats) return attempt.overallStats;

    // Fallback: compute from sections
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalSkipped = 0;
    let rawScore = 0;

    attempt.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        totalQuestions += 1;
        if (q.isCorrect) totalCorrect += 1;
        else if (q.isAnswered && q.isCorrect === false) totalIncorrect += 1;
        else if (!q.isAnswered) totalSkipped += 1;

        if (typeof q.marksAwarded === "number") {
          rawScore += q.marksAwarded;
        }
      });
    });

    const totalAttempted = totalCorrect + totalIncorrect;

    return {
      totalQuestions,
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      rawScore,
    };
  }, [attempt]);

  // ========= Chart Data =========

  const correctIncorrectSkippedData = useMemo(() => {
    if (!overallStats) return [];
    return [
      { name: "Correct", value: overallStats.totalCorrect },
      { name: "Incorrect", value: overallStats.totalIncorrect },
      { name: "Skipped", value: overallStats.totalSkipped },
    ];
  }, [overallStats]);

  const sectionAccuracyData = useMemo(() => {
    if (!attempt) return [];
    return attempt.sections.map((sec, idx) => {
      const stats = sec.stats;
      const total =
        stats?.correct && stats?.incorrect && stats?.skipped != null
          ? stats.correct + stats.incorrect + stats.skipped
          : sec.questions.length;

      const correct = stats?.correct ?? sec.questions.filter((q) => q.isCorrect)
        .length;

      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        name: sec.name || `Section ${idx + 1}`,
        accuracy,
        correct,
        total,
      };
    });
  }, [attempt]);

  const difficultyData = useMemo(() => {
    if (!attempt) return [];

    const bucket: Record<
      string,
      { difficulty: string; correct: number; total: number }
    > = {};

    attempt.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        const diff = q.questionDoc?.difficulty || "Medium";
        if (!bucket[diff]) {
          bucket[diff] = { difficulty: diff, correct: 0, total: 0 };
        }
        bucket[diff].total += 1;
        if (q.isCorrect) bucket[diff].correct += 1;
      });
    });

    return Object.values(bucket).map((b) => ({
      difficulty: b.difficulty,
      accuracy: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
      total: b.total,
    }));
  }, [attempt]);

  const totalTimeFormatted = useMemo(() => {
    if (!attempt) return "00:00";
    return formatTime(attempt.totalTimeUsedSeconds || 0);
  }, [attempt]);

  const avgTimePerQuestion = useMemo(() => {
    if (!attempt || !overallStats) return "-";
    if (!overallStats.totalQuestions) return "-";
    const avg = Math.round(
      (attempt.totalTimeUsedSeconds || 0) / overallStats.totalQuestions
    );
    return formatTime(avg);
  }, [attempt, overallStats]);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (error || !attempt || !overallStats) {
    return (
      <>
        <PageMeta title="GMAT Analysis" description="GMAT test performance" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            <div className="mb-2 flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <h2 className="font-semibold">Unable to load analysis</h2>
            </div>
            <p className="mb-3">
              {error || "Something went wrong while loading your GMAT analysis."}
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" size="sm">
              Go Back
            </Button>
          </div>
        </div>
      </>
    );
  }

  const testTitle =
    attempt.testTemplate?.title ||
    (attempt as any)?.testTemplate?.name ||
    "GMAT Practice Test";

  const completionDate = attempt.completedAt
    ? new Date(attempt.completedAt).toLocaleString()
    : "";

  const accuracyPercent =
    overallStats.totalQuestions > 0
      ? Math.round((overallStats.totalCorrect / overallStats.totalQuestions) * 100)
      : 0;

  return (
    <>
      <PageMeta title="GMAT Analysis" description="GMAT test performance" />
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
        {/* Top Header */}
        <div className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[11px] uppercase tracking-[.16em] text-slate-500 dark:text-slate-400 font-semibold">
                  GMAT Performance Analysis
                </p>
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {testTitle}
                </h1>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold uppercase tracking-[.16em]">
                Completed
              </p>
              <p>{completionDate}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 space-y-6 pb-12">

          <GmatScoreDisplay attempt={attempt} />
          {/* Overall summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                    <Award className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[.14em] text-slate-500 dark:text-slate-400">
                    Overall Performance
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {overallStats.totalCorrect} / {overallStats.totalQuestions} correct
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
                    Accuracy
                  </p>
                  <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-50">
                    {accuracyPercent}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Attempted {overallStats.totalAttempted} of{" "}
                    {overallStats.totalQuestions} questions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[.18em] text-slate-500 dark:text-slate-400">
                    Total Time
                  </p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1 justify-end">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    {totalTimeFormatted}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Avg {avgTimePerQuestion} per question
                  </p>
                </div>
              </div>
            </div>

            {/* Small stat cards */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500 dark:text-slate-400">
                  Correct
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Score: {overallStats.rawScore}
                </span>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {overallStats.totalCorrect}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {overallStats.totalCorrect} questions answered correctly
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500 dark:text-slate-400">
                  Incorrect / Skipped
                </span>
              </div>
              <p className="text-3xl font-bold text-rose-500 dark:text-rose-400">
                {overallStats.totalIncorrect + overallStats.totalSkipped}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {overallStats.totalIncorrect} incorrect,{" "}
                {overallStats.totalSkipped} skipped
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar: Section Accuracy */}
            <div className="col-span-1  rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Section-wise Accuracy
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionAccuracyData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" name="Accuracy (%)" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Performance by Difficulty
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helps identify which level needs more practice
              </p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData}>
                  <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" name="Accuracy (%)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>

          {/* Difficulty breakdown */}


          {/* Section Detail Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Section Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View your performance for each module
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <th className="py-2 px-3 text-left font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Section
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Questions
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Correct
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Incorrect
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Skipped
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Accuracy
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Time Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempt.sections.map((sec, idx) => {
                    const stats = sec.stats;
                    const total = stats
                      ? stats.correct + stats.incorrect + stats.skipped
                      : sec.questions.length;
                    const correct =
                      stats?.correct ??
                      sec.questions.filter((q) => q.isCorrect).length;
                    const incorrect =
                      stats?.incorrect ??
                      sec.questions.filter(
                        (q) => q.isAnswered && q.isCorrect === false
                      ).length;
                    const skipped =
                      stats?.skipped ??
                      sec.questions.filter((q) => !q.isAnswered).length;

                    const accuracy =
                      total > 0 ? Math.round((correct / total) * 100) : 0;

                    const timeUsed = sec.questions.reduce(
                      (sum, q) => sum + (q.timeSpentSeconds || 0),
                      0
                    );

                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {sec.name || `Section ${idx + 1}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-200">
                          {total}
                        </td>
                        <td className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                          {correct}
                        </td>
                        <td className="py-2 px-3 text-center text-rose-500 dark:text-rose-400 font-semibold">
                          {incorrect}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400">
                          {skipped}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {accuracy}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-200">
                          {formatTime(timeUsed)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Use this analysis to identify which sections and difficulty levels
              need more practice.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/student/tests")}
              >
                Back to Tests
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/student/gmat-test/${attempt.testTemplate._id}`)
                }
              >
                Retake Similar Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GmatTestAnalysisPage;


interface Question {
  id: string;
  isCorrect: boolean | null;
  isAnswered: boolean;
  timeSpentSeconds?: number;
  marksAwarded?: number;
  questionDoc?: {
    difficulty?: string;
    questionType?: string;
  };
}

interface SectionStats {
  correct?: number;
  total?: number;
  accuracy?: number;
}

interface Section {
  id: string;
  name?: string;
  questions: Question[];
  stats?: SectionStats;
}

interface TestAttempt {
  id: string;
  sections: Section[];
  overallStats?: {
    totalQuestions: number;
    totalAttempted: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalSkipped: number;
    rawScore: number;
  };
}

// ============ GMAT ESTIMATED SCORE CALCULATION (GMAT-STYLE) ============

const DIFFICULTY_WEIGHT: Record<string, number> = {
  Easy: 0.7,
  Medium: 1.0,
  Hard: 1.3,
};

const SECTION_SCALE = [
  { r: 0.92, s: 90 },
  { r: 0.88, s: 88 },
  { r: 0.84, s: 85 },
  { r: 0.80, s: 82 },
  { r: 0.75, s: 78 },
  { r: 0.70, s: 74 },
  { r: 0.65, s: 70 },
  { r: 0.60, s: 67 },
  { r: 0.55, s: 64 },
  { r: 0.0, s: 60 },
];

const TOTAL_SCORE_TABLE = [
  { avg: 90, score: 805 },
  { avg: 88, score: 775 },
  { avg: 85, score: 735 },
  { avg: 82, score: 705 },
  { avg: 80, score: 685 },
  { avg: 78, score: 665 },
  { avg: 75, score: 645 },
  { avg: 72, score: 625 },
  { avg: 70, score: 605 },
  { avg: 68, score: 585 },
  { avg: 65, score: 565 },
  { avg: 62, score: 545 },
  { avg: 60, score: 505 },
  { avg: 58, score: 485 },
  { avg: 55, score: 465 },
  { avg: 52, score: 445 },
  { avg: 50, score: 425 },
  { avg: 48, score: 405 },
  { avg: 45, score: 385 },
  { avg: 42, score: 365 },
  { avg: 40, score: 345 },
  { avg: 38, score: 325 },
  { avg: 35, score: 305 },
  { avg: 32, score: 285 },
  { avg: 30, score: 265 },
  { avg: 28, score: 245 },
  { avg: 25, score: 225 },
  { avg: 22, score: 205 },
];

const estimateSectionScore = (questions: Question[]) => {
  let weightedCorrect = 0;
  let weightedTotal = 0;
  let correct = 0;

  questions.forEach(q => {
    const diff = q.questionDoc?.difficulty || "Medium";
    const weight = DIFFICULTY_WEIGHT[diff] ?? 1.0;
    weightedTotal += weight;

    if (q.isCorrect === true) {
      weightedCorrect += weight;
      correct++;
    }
  });

  const ratio = weightedTotal > 0 ? weightedCorrect / weightedTotal : 0;

  const scaled = SECTION_SCALE.find(x => ratio >= x.r)?.s ?? 60;

  return {
    correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100),
    weightedRatio: Math.round(ratio * 100),
    scaled,
  };
};

const estimateTotalScore = (q: number, v: number, d: number) => {
  const avg = Math.round((q + v + d) / 3);
  return TOTAL_SCORE_TABLE.find(x => avg >= x.avg)?.score ?? 205;
};

const estimatePercentile = (score: number) => {
  if (score >= 780) return 99;
  if (score >= 740) return 97;
  if (score >= 700) return 90;
  if (score >= 660) return 82;
  if (score >= 620) return 72;
  if (score >= 580) return 62;
  if (score >= 540) return 50;
  if (score >= 500) return 40;
  if (score >= 460) return 32;
  if (score >= 420) return 25;
  if (score >= 380) return 18;
  if (score >= 340) return 12;
  if (score >= 300) return 8;
  if (score >= 260) return 5;
  if (score >= 220) return 3;
  return 1;
};

const calculateSectionPercentile = (score: number, sectionType: 'quant' | 'verbal' | 'di'): number => {
  // Section percentiles based on GMAT Focus Edition official percentiles
  if (score >= 90) return 99;
  if (score >= 85) return 97;
  if (score >= 80) return 93;
  if (score >= 78) return 89;
  if (score >= 75) return 85;
  if (score >= 72) return 80;
  if (score >= 70) return 75;
  if (score >= 67) return 70;
  if (score >= 65) return 65;
  if (score >= 62) return 60;
  if (score >= 60) return 55;
  return 50;
};

const calculateGmatScores = (attempt: TestAttempt | null): any | null => {
  if (!attempt || attempt.sections.length < 3) return null;

  const quant = attempt.sections.find(s => 
    s.name?.toLowerCase().includes("quant") || 
    s.name?.toLowerCase().includes("quantitative")
  );
  const verbal = attempt.sections.find(s => 
    s.name?.toLowerCase().includes("verbal")
  );
  const di = attempt.sections.find(s => 
    s.name?.toLowerCase().includes("data") || 
    s.name?.toLowerCase().includes("di")
  );

  if (!quant || !verbal || !di) {
    console.warn('Missing required sections:', { quant, verbal, di });
    return null;
  }

  const q = estimateSectionScore(quant.questions);
  const v = estimateSectionScore(verbal.questions);
  const d = estimateSectionScore(di.questions);

  const totalScore = estimateTotalScore(q.scaled, v.scaled, d.scaled);

  return {
    rawScores: {
      quant: q.correct,
      verbal: v.correct,
      dataInsights: d.correct,
      total: q.correct + v.correct + d.correct,
    },
    scaledScores: {
      quant: q.scaled,
      verbal: v.scaled,
      dataInsights: d.scaled,
      total: totalScore,
    },
    percentages: {
      quant: q.percentage,
      verbal: v.percentage,
      dataInsights: d.percentage,
    },
    weightedScores: {
      quant: q.weightedRatio,
      verbal: v.weightedRatio,
      dataInsights: d.weightedRatio,
    },
    percentiles: {
      quant: calculateSectionPercentile(q.scaled, 'quant'),
      verbal: calculateSectionPercentile(v.scaled, 'verbal'),
      dataInsights: calculateSectionPercentile(d.scaled, 'di'),
      total: estimatePercentile(totalScore),
    },
    sectionDetails: {
      quant: q,
      verbal: v,
      dataInsights: d,
    },
    meta: {
      type: "ESTIMATED_GMAT_FOCUS",
      note: "Difficulty-weighted adaptive estimation based on GMAT scoring algorithm.",
      calculationMethod: "weighted"
    },
  };
};

// ============ Comprehensive GMAT Analysis Dashboard ============

const GmatScoreDisplay: React.FC<{ attempt: TestAttempt }> = ({ attempt }) => {
  const gmatScores = useMemo(() => calculateGmatScores(attempt), [attempt]);
  
  const overallStats = useMemo(() => {
    if (!attempt) return null;
    
    // Use provided stats or calculate them
    if (attempt.overallStats) return attempt.overallStats;
    
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalSkipped = 0;
    let totalTime = 0;

    attempt.sections.forEach((section) => {
      section.questions.forEach((question) => {
        totalQuestions++;
        
        if (question.isCorrect === true) {
          totalCorrect++;
        } else if (question.isAnswered && question.isCorrect === false) {
          totalIncorrect++;
        } else {
          totalSkipped++;
        }
        
        if (question.timeSpentSeconds) {
          totalTime += question.timeSpentSeconds;
        }
      });
    });

    const totalAttempted = totalCorrect + totalIncorrect;
    const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
    const averageTime = totalAttempted > 0 ? totalTime / totalAttempted : 0;

    return {
      totalQuestions,
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      totalSkipped,
      accuracy: Math.round(accuracy),
      averageTime: Math.round(averageTime)
    };
  }, [attempt]);

  // Chart Data Preparation
  const answerDistributionData = useMemo(() => {
    if (!overallStats) return [];
    return [
      { 
        name: "Correct", 
        value: overallStats.totalCorrect, 
        color: "#22c55e", 
        icon: <CheckCircle className="h-4 w-4" /> 
      },
      { 
        name: "Incorrect", 
        value: overallStats.totalIncorrect, 
        color: "#ef4444", 
        icon: <XCircle className="h-4 w-4" /> 
      },
      { 
        name: "Skipped", 
        value: overallStats.totalSkipped, 
        color: "#6b7280", 
        icon: <MinusCircle className="h-4 w-4" /> 
      },
    ];
  }, [overallStats]);

  const sectionPerformanceData = useMemo(() => {
    if (!attempt || !gmatScores) return [];
    
    return attempt.sections.map((section, index) => {
      const total = section.questions.length;
      const correct = section.stats?.correct ?? section.questions.filter(q => q.isCorrect === true).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      
      let icon;
      let color;
      let displayName;
      
      if (section.name?.toLowerCase().includes("quant")) {
        icon = <Brain className="h-4 w-4" />;
        color = "#3b82f6";
        displayName = "Quantitative";
      } else if (section.name?.toLowerCase().includes("verbal")) {
        icon = <MessageSquare className="h-4 w-4" />;
        color = "#10b981";
        displayName = "Verbal";
      } else {
        icon = <Database className="h-4 w-4" />;
        color = "#8b5cf6";
        displayName = "Data Insights";
      }

      return {
        name: displayName,
        accuracy,
        correct,
        total,
        attempted: section.questions.filter(q => q.isAnswered).length,
        icon,
        color,
      };
    });
  }, [attempt, gmatScores]);

  const gmatScoreComparisonData = useMemo(() => {
    if (!gmatScores) return [];
    
    return [
      { 
        section: "Quantitative", 
        score: gmatScores.scaledScores.quant, 
        scaledScore: gmatScores.scaledScores.quant,
        rawScore: gmatScores.rawScores.quant,
        percentile: gmatScores.percentiles.quant, 
        weightedScore: gmatScores.weightedScores?.quant || 0,
        color: "#3b82f6",
        percentage: gmatScores.percentages.quant
      },
      { 
        section: "Verbal", 
        score: gmatScores.scaledScores.verbal, 
        scaledScore: gmatScores.scaledScores.verbal,
        rawScore: gmatScores.rawScores.verbal,
        percentile: gmatScores.percentiles.verbal, 
        weightedScore: gmatScores.weightedScores?.verbal || 0,
        color: "#10b981",
        percentage: gmatScores.percentages.verbal
      },
      { 
        section: "Data Insights", 
        score: gmatScores.scaledScores.dataInsights, 
        scaledScore: gmatScores.scaledScores.dataInsights,
        rawScore: gmatScores.rawScores.dataInsights,
        percentile: gmatScores.percentiles.dataInsights, 
        weightedScore: gmatScores.weightedScores?.dataInsights || 0,
        color: "#8b5cf6",
        percentage: gmatScores.percentages.dataInsights
      },
    ];
  }, [gmatScores]);

  const difficultyPerformanceData = useMemo(() => {
    if (!attempt) return [];
    
    const difficultyMap: Record<string, { total: number; correct: number; timeSpent: number }> = {
      'Easy': { total: 0, correct: 0, timeSpent: 0 },
      'Medium': { total: 0, correct: 0, timeSpent: 0 },
      'Hard': { total: 0, correct: 0, timeSpent: 0 }
    };
    
    attempt.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const difficulty = question.questionDoc?.difficulty || 'Medium';
        const key = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        if (!difficultyMap[key]) {
          difficultyMap[key] = { total: 0, correct: 0, timeSpent: 0 };
        }
        
        difficultyMap[key].total += 1;
        if (question.isCorrect === true) {
          difficultyMap[key].correct += 1;
        }
        if (question.timeSpentSeconds) {
          difficultyMap[key].timeSpent += question.timeSpentSeconds;
        }
      });
    });

    return Object.entries(difficultyMap)
      .filter(([_, stats]) => stats.total > 0)
      .map(([difficulty, stats]) => ({
        difficulty,
        accuracy: Math.round((stats.correct / stats.total) * 100),
        total: stats.total,
        correct: stats.correct,
        averageTime: Math.round(stats.timeSpent / stats.total),
        weight: DIFFICULTY_WEIGHT[difficulty] || 1.0
      }));
  }, [attempt]);

  const timeDistributionData = useMemo(() => {
    if (!attempt) return [];
    
    const timeRanges = [
      { range: "< 30s", min: 0, max: 30, color: "#22c55e" },
      { range: "30-60s", min: 30, max: 60, color: "#3b82f6" },
      { range: "1-2m", min: 60, max: 120, color: "#f59e0b" },
      { range: "2-3m", min: 120, max: 180, color: "#ef4444" },
      { range: "> 3m", min: 180, max: Infinity, color: "#8b5cf6" },
    ];

    const distribution = timeRanges.map(range => ({
      ...range,
      count: 0,
      correct: 0
    }));

    attempt.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const time = question.timeSpentSeconds || 0;
        const range = distribution.find(r => time >= r.min && time < r.max);
        if (range) {
          range.count += 1;
          if (question.isCorrect === true) {
            range.correct += 1;
          }
        }
      });
    });

    const totalQuestions = distribution.reduce((sum, r) => sum + r.count, 0);
    
    return distribution.map(r => ({
      range: r.range,
      count: r.count,
      correct: r.correct,
      percentage: totalQuestions > 0 ? Math.round((r.count / totalQuestions) * 100) : 0,
      accuracy: r.count > 0 ? Math.round((r.correct / r.count) * 100) : 0,
      color: r.color
    }));
  }, [attempt]);

  const questionTypePerformanceData = useMemo(() => {
    if (!attempt) return [];
    
    const typeMap: Record<string, { total: number; correct: number; timeSpent: number }> = {};
    
    attempt.sections.forEach((section) => {
      section.questions.forEach((question) => {
        const type = question.questionDoc?.questionType || "Unknown";
        const simplifiedType = type
          .replace("gmat_", "")
          .replace(/_/g, " ")
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        
        if (!typeMap[simplifiedType]) {
          typeMap[simplifiedType] = { total: 0, correct: 0, timeSpent: 0 };
        }
        
        typeMap[simplifiedType].total += 1;
        if (question.isCorrect === true) {
          typeMap[simplifiedType].correct += 1;
        }
        if (question.timeSpentSeconds) {
          typeMap[simplifiedType].timeSpent += question.timeSpentSeconds;
        }
      });
    });

    return Object.entries(typeMap).map(([type, stats]) => ({
      type,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      total: stats.total,
      correct: stats.correct,
      averageTime: Math.round(stats.timeSpent / stats.total)
    }));
  }, [attempt]);

  // Difficulty breakdown for scoring explanation
  const difficultyBreakdown = useMemo(() => {
    if (!attempt) return [];
    
    const breakdown: Array<{
      difficulty: string;
      correct: number;
      total: number;
      weight: number;
      contribution: number;
    }> = [];
    
    ['Easy', 'Medium', 'Hard'].forEach(diff => {
      const stats = difficultyPerformanceData.find(d => d.difficulty === diff);
      if (stats) {
        const weight = DIFFICULTY_WEIGHT[diff] || 1.0;
        const contribution = (stats.correct * weight);
        breakdown.push({
          difficulty: diff,
          correct: stats.correct,
          total: stats.total,
          weight,
          contribution
        });
      }
    });
    
    return breakdown;
  }, [difficultyPerformanceData]);

  if (!gmatScores || !overallStats) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Calculating GMAT analysis...
          </p>
        </div>
      </div>
    );
  }

  // Performance insights
  const strengths = difficultyPerformanceData
    .filter(item => item.accuracy >= 75)
    .slice(0, 3);
  
  const improvementAreas = difficultyPerformanceData
    .filter(item => item.accuracy < 50)
    .slice(0, 3);
  
  const estimatedPotentialScore = Math.min(805, gmatScores.scaledScores.total + 
    (gmatScores.percentiles.total < 90 ? 50 : 30));

  return (
    <div className="space-y-6">
      {/* Score Summary Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="text-center lg:text-left mb-4 lg:mb-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-[.16em] opacity-90">
                GMAT Focus Edition Estimated Score
              </h3>
              <AlertCircle className="h-4 w-4 opacity-80" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-bold">{gmatScores.scaledScores.total}</span>
              <span className="text-lg opacity-90">/ 805</span>
            </div>
            <p className="text-sm opacity-90 mt-1">
              <span className="font-semibold">{gmatScores.percentiles.total}th Percentile</span> • Higher than {gmatScores.percentiles.total}% of test takers
            </p>
            <p className="text-xs opacity-75 mt-2">
              *Difficulty-weighted adaptive scoring simulation
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{gmatScores.scaledScores.quant}</div>
              <div className="text-xs opacity-90">Quantitative</div>
              <div className="text-xs">{gmatScores.percentiles.quant}%ile</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{gmatScores.scaledScores.verbal}</div>
              <div className="text-xs opacity-90">Verbal</div>
              <div className="text-xs">{gmatScores.percentiles.verbal}%ile</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{gmatScores.scaledScores.dataInsights}</div>
              <div className="text-xs opacity-90">Data Insights</div>
              <div className="text-xs">{gmatScores.percentiles.dataInsights}%ile</div>
            </div>
          </div>
        </div>
      </div>

      {/* First Row: Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-indigo-500" />
              Answer Distribution
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total: {overallStats.totalQuestions} questions
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={answerDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {answerDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} questions`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderColor: '#e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {answerDistributionData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
                <div className="text-lg font-bold mt-1" style={{ color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Accuracy Radar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-indigo-500" />
            Weighted Section Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={gmatScoreComparisonData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="section" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Weighted Score"
                  dataKey="weightedScore"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Scaled Score"
                  dataKey="scaledScore"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'weightedScore') return [`${value}%`, 'Weighted Accuracy'];
                    if (name === 'scaledScore') return [value, 'GMAT Score'];
                    return [value, name];
                  }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {gmatScoreComparisonData.map((section) => (
              <div key={section.section} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {section.section.split(' ')[0]}
                  </span>
                </div>
                <div className="text-lg font-bold mt-1" style={{ color: section.color }}>
                  {section.scaledScore}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {section.weightedScore}% weighted
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GMAT Score Comparison */}

      </div>

      {/* Second Row: Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            GMAT Score vs Percentile
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={gmatScoreComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="section" />
                <YAxis 
                  yAxisId="left"
                  domain={[60, 90]}
                  label={{ value: 'GMAT Score', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  label={{ value: 'Percentile', angle: 90, position: 'insideRight' }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'score') return [value, 'GMAT Score'];
                    if (name === 'percentile') return [`${value}%`, 'Percentile'];
                    if (name === 'rawScore') return [`${value} correct`, 'Raw Score'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="score" 
                  name="GMAT Score" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                >
                  {gmatScoreComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="percentile" 
                  name="Percentile" 
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {gmatScoreComparisonData.map((item) => (
              <div key={item.section} className="text-center">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {item.section.split(' ')[0]}
                </div>
                <div className="text-lg font-bold mt-1" style={{ color: item.color }}>
                  {item.score}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.percentile}%ile • {item.rawScore}/{item.rawScore + (overallStats.totalQuestions/3 - item.rawScore)}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Time Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Time Distribution Analysis
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Time spent per question
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" />
                <YAxis label={{ value: 'Questions', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'count') return [value, 'Questions'];
                    if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Questions" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  name="Accuracy %" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: Question Type Analysis */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Question Type Performance
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Accuracy by question type
          </span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                dataKey="total" 
                name="Total Questions" 
                domain={[0, 'auto']}
                label={{ value: 'Total Questions', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="accuracy" 
                name="Accuracy %" 
                domain={[0, 100]}
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis 
                type="number" 
                dataKey="correct" 
                range={[50, 400]} 
                name="Correct Answers"
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                  if (name === 'total') return [value, 'Total Questions'];
                  if (name === 'correct') return [value, 'Correct Answers'];
                  return [value, name];
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderColor: '#e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Scatter 
                name="Question Types" 
                data={questionTypePerformanceData} 
                fill="#8884d8"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {questionTypePerformanceData.slice(0, 8).map((item) => (
            <div 
              key={item.type} 
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                {item.type}
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {item.accuracy}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  accuracy
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.correct}/{item.total} correct • {item.averageTime}s avg
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

