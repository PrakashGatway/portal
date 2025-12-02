import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Award,
  BookOpen,
  Loader2,
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
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <BarChart3 className="h-5 w-5" />
              </div>
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
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 pb-12">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Pie: Correct/Incorrect/Skipped */}
            <div className="col-span-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                Answer Distribution
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={correctIncorrectSkippedData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {correctIncorrectSkippedData.map((entry, index) => {
                        const colors = ["#22c55e", "#ef4444", "#6b7280"];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar: Section Accuracy */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
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
          </div>

          {/* Difficulty breakdown */}
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
