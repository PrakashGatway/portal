"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  Flame,
  Info,
  Layers3,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface RecentTest {
  id: string;
  title: string;
  exam: string;
  category: string;
  questions: number;
  duration: number;
  score?: number;
  maxScore?: number;
  status: "completed" | "in-progress" | "not-started";
  createdAt: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

// ============================================================
// DUMMY DATA
// ============================================================

const dummyUser = {
  name: "Prakash",
  tokens: 8,
  totalTokens: 10,
};

const examDetails = {
  name: "SAT",
  description:
    "Build a personalized SAT practice test by selecting the sections, difficulty, question types, and number of questions you want to practice.",
  sections: [
    {
      name: "Reading & Writing",
      questions: "27–54",
      duration: "32–64 min",
      icon: BookOpen,
    },
    {
      name: "Math",
      questions: "22–44",
      duration: "35–70 min",
      icon: Target,
    },
  ],
  features: [
    "Choose specific sections",
    "Select difficulty level",
    "Customize question count",
    "Practice specific question types",
  ],
};

const recentTests: RecentTest[] = [
  {
    id: "1",
    title: "SAT Math – Algebra Practice",
    exam: "SAT",
    category: "Math",
    questions: 20,
    duration: 35,
    score: 17,
    maxScore: 20,
    status: "completed",
    createdAt: "Today, 10:30 AM",
    difficulty: "Medium",
  },
  {
    id: "2",
    title: "SAT Reading & Writing Drill",
    exam: "SAT",
    category: "Reading & Writing",
    questions: 25,
    duration: 40,
    score: 21,
    maxScore: 25,
    status: "completed",
    createdAt: "Yesterday, 6:20 PM",
    difficulty: "Hard",
  },
  {
    id: "3",
    title: "SAT Mixed Practice Test",
    exam: "SAT",
    category: "Mixed",
    questions: 40,
    duration: 60,
    status: "in-progress",
    createdAt: "Sep 21, 2026",
    difficulty: "Medium",
  },
  {
    id: "4",
    title: "SAT Math – Easy Warm Up",
    exam: "SAT",
    category: "Math",
    questions: 15,
    duration: 25,
    status: "not-started",
    createdAt: "Sep 20, 2026",
    difficulty: "Easy",
  },
];

// ============================================================
// SKELETONS
// ============================================================

const TokenSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-3 h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
    <div className="mt-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
  </div>
);

const TestCardSkeleton = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
    <div className="animate-pulse">
      <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />

      <div className="mt-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="mt-5 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

// ============================================================
// HELPERS
// ============================================================

const getStatusConfig = (status: RecentTest["status"]) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      };

    case "in-progress":
      return {
        label: "In Progress",
        icon: RefreshCw,
        className:
          "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
      };

    default:
      return {
        label: "Not Started",
        icon: Clock3,
        className:
          "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700/40 dark:text-gray-300 dark:border-gray-600",
      };
  }
};

const getDifficultyClass = (difficulty: RecentTest["difficulty"]) => {
  switch (difficulty) {
    case "Easy":
      return "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400";

    case "Hard":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";

    default:
      return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
  }
};

// ============================================================
// MAIN PAGE
// ============================================================

const CustomTestPage = () => {
  const [loading, setLoading] = useState(true);
  const [user] = useState(dummyUser);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const tokenPercentage = Math.min(
    (user.tokens / user.totalTokens) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Background decorations */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl dark:bg-orange-500/10" />

        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-500/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            {/* Hero content */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                <Sparkles size={15} />
                Personalized Practice
              </div>

              <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Create Your{" "}
                <span className="text-orange-500">Custom Test</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-lg">
                Build a practice test that matches exactly what you want to
                practice. Choose your exam, sections, difficulty, question
                types, and test length.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="
                    group inline-flex items-center justify-center gap-2
                    rounded-xl bg-orange-500 px-6 py-3.5
                    text-sm font-semibold text-white
                    shadow-lg shadow-orange-500/20
                    transition
                    hover:bg-orange-600
                    hover:shadow-xl hover:shadow-orange-500/25
                  "
                >
                  <Plus size={19} />

                  Start Creating Test

                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-xl border border-gray-200
                    bg-white px-6 py-3.5
                    text-sm font-semibold text-gray-700
                    transition hover:bg-gray-50
                    dark:border-gray-700 dark:bg-gray-800
                    dark:text-gray-200 dark:hover:bg-gray-750
                  "
                >
                  <Info size={18} />
                  How It Works
                </button>
              </div>
            </div>

            {/* Token Card */}
            <div
              className="
                relative overflow-hidden rounded-3xl
                border border-orange-200
                bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500
                p-6 text-white shadow-xl shadow-orange-500/20
              "
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-white/10" />

              {loading ? (
                <div className="relative rounded-2xl bg-white/10 p-4">
                  <div className="animate-pulse">
                    <div className="h-4 w-32 rounded bg-white/20" />
                    <div className="mt-4 h-12 w-28 rounded bg-white/20" />
                    <div className="mt-5 h-2 rounded-full bg-white/20" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-100">
                        Your Available Tokens
                      </p>

                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-4xl font-bold">
                          {user.tokens}
                        </span>

                        <span className="mb-1 text-sm text-orange-100">
                          tokens
                        </span>
                      </div>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                      <Zap size={24} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-orange-100">
                      <span>Token usage</span>
                      <span>
                        {user.tokens}/{user.totalTokens}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${tokenPercentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-orange-100">
                    1 token is used whenever you create a new custom test.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EXAM DETAILS
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />

                <span className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                  Selected Exam
                </span>
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                {examDetails.name} Custom Test
              </h2>
            </div>

            <button
              type="button"
              className="hidden items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600 sm:flex"
            >
              Change Exam
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid lg:grid-cols-[1.1fr_1fr]">
              {/* Description */}
              <div className="border-b border-gray-200 p-6 dark:border-gray-800 lg:border-b-0 lg:border-r lg:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                    <Award size={27} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">SAT</h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Digital SAT
                    </p>
                  </div>
                </div>

                <p className="mt-6 leading-7 text-gray-600 dark:text-gray-400">
                  {examDetails.description}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {examDetails.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-green-500"
                      />

                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="p-6 lg:p-8">
                <div className="mb-5">
                  <h3 className="font-bold">SAT Sections</h3>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Choose one or both sections while creating your test.
                  </p>
                </div>

                <div className="space-y-3">
                  {examDetails.sections.map((section) => {
                    const Icon = section.icon;

                    return (
                      <div
                        key={section.name}
                        className="
                          flex items-center gap-4 rounded-2xl
                          border border-gray-200 p-4
                          transition hover:border-orange-300
                          hover:bg-orange-50/40
                          dark:border-gray-700
                          dark:hover:border-orange-500/40
                          dark:hover:bg-orange-500/5
                        "
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold">
                            {section.name}
                          </h4>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{section.questions} questions</span>
                            <span>{section.duration}</span>
                          </div>
                        </div>

                        <ChevronRight
                          size={18}
                          className="text-gray-400"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            PROCESS
        ====================================================== */}

        <section className="mt-12">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />

              <span className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                Simple Process
              </span>
            </div>

            <h2 className="text-2xl font-bold sm:text-3xl">
              How to attempt a Custom Test
            </h2>

            <p className="mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
              Create a test in a few simple steps and start practicing
              exactly what you need.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Choose Exam",
                description:
                  "Select the exam and section you want to practice.",
                icon: Layers3,
              },
              {
                step: "02",
                title: "Customize",
                description:
                  "Select question count, difficulty and question types.",
                icon: SlidersHorizontalIcon,
              },
              {
                step: "03",
                title: "Create Test",
                description:
                  "Use one token to generate your personalized test.",
                icon: Sparkles,
              },
              {
                step: "04",
                title: "Start Attempt",
                description:
                  "Begin your test and review your performance afterwards.",
                icon: Play,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.step}
                  className="
                    relative rounded-2xl border border-gray-200
                    bg-white p-5 shadow-sm
                    dark:border-gray-800 dark:bg-gray-900
                  "
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10">
                      <Icon size={21} />
                    </div>

                    <span className="text-3xl font-black text-gray-100 dark:text-gray-800">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="mt-5 font-bold">{item.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            RECENT TESTS
        ====================================================== */}

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />

                <span className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                  Your Practice
                </span>
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Recent Custom Tests
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Continue an unfinished test or review your previous attempts.
              </p>
            </div>

            <button
              type="button"
              className="hidden items-center gap-1 text-sm font-semibold text-orange-500 sm:flex"
            >
              View All
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <TestCardSkeleton />
              <TestCardSkeleton />
              <TestCardSkeleton />
              <TestCardSkeleton />
            </div>
          ) : recentTests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentTests.map((test) => {
                const status = getStatusConfig(test.status);
                const StatusIcon = status.icon;

                const percentage =
                  test.score && test.maxScore
                    ? Math.round((test.score / test.maxScore) * 100)
                    : 0;

                return (
                  <div
                    key={test.id}
                    className="
                      group rounded-2xl border border-gray-200
                      bg-white p-5 shadow-sm
                      transition-all duration-200
                      hover:-translate-y-0.5
                      hover:border-orange-200
                      hover:shadow-lg hover:shadow-orange-500/5
                      dark:border-gray-800
                      dark:bg-gray-900
                      dark:hover:border-orange-500/30
                    "
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10">
                          <FileQuestion size={21} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold">
                            {test.title}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {test.exam} • {test.category}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getDifficultyClass(
                          test.difficulty
                        )}`}
                      >
                        {test.difficulty}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon size={13} />

                        {status.label}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <CalendarDays size={13} />
                        {test.createdAt}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-[11px] text-gray-400">
                          Questions
                        </p>

                        <p className="mt-1 font-bold">{test.questions}</p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-[11px] text-gray-400">Duration</p>

                        <p className="mt-1 font-bold">{test.duration} min</p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                        <p className="text-[11px] text-gray-400">
                          {test.status === "completed" ? "Score" : "Progress"}
                        </p>

                        <p className="mt-1 font-bold">
                          {test.status === "completed"
                            ? `${percentage}%`
                            : test.status === "in-progress"
                              ? "Continue"
                              : "Ready"}
                        </p>
                      </div>
                    </div>

                    {/* Score Progress */}
                    {test.status === "completed" && (
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-gray-500">Performance</span>

                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {test.score}/{test.maxScore}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    <button
                      type="button"
                      className={`
                        mt-5 flex w-full items-center justify-center gap-2
                        rounded-xl px-4 py-3 text-sm font-semibold
                        transition
                        ${
                          test.status === "completed"
                            ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }
                      `}
                    >
                      {test.status === "completed" ? (
                        <>
                          <Trophy size={17} />
                          View Result
                        </>
                      ) : test.status === "in-progress" ? (
                        <>
                          <Play size={17} />
                          Continue Test
                        </>
                      ) : (
                        <>
                          <Play size={17} />
                          Start Test
                        </>
                      )}

                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 dark:bg-orange-500/10">
                <FileQuestion size={25} />
              </div>

              <h3 className="mt-4 font-bold">No Custom Tests Yet</h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                Create your first personalized test and start practicing
                according to your preparation needs.
              </p>

              <button
                type="button"
                className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Create Your First Test
              </button>
            </div>
          )}
        </section>

        {/* =====================================================
            TOKEN INFO
        ====================================================== */}

        <section className="mt-12">
          <div className="overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 dark:border-orange-500/20 dark:from-orange-500/5 dark:to-amber-500/5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <WalletCards size={23} />
                </div>

                <div>
                  <h3 className="font-bold">
                    Need more Custom Test tokens?
                  </h3>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
                    Your tokens are used to create personalized tests. Check
                    available token plans if you need more practice.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 dark:border-orange-500/20 dark:bg-gray-900 dark:text-orange-400 dark:hover:bg-orange-500/10"
              >
                View Token Plans
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// ============================================================
// SMALL ICON WRAPPER
// ============================================================

const SlidersHorizontalIcon = ({
  size = 24,
}: {
  size?: number;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
};

export default CustomTestPage;