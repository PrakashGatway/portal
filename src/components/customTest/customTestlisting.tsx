"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleQuestionMarkIcon,
  Clock3,
  FileQuestion,
  RefreshCw,
  Target,
} from "lucide-react";
import { useAuth } from "../../context/UserContext";
import api from "../../axiosInstance";
import { Link } from "react-router";

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

const getStatusConfig = (status: RecentTest["status"]) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        className:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      };

    case "started":
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

const CustomTestPage = () => {
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);

  const { user, wallet } = useAuth();
  const [examDetails, setExamDetail] = useState();
  const [recentTests, setRecentTests] = useState<any[]>([]);

  useEffect(() => {
    if (!user.category) return;
    const fetchExamDetail = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/test/exams/category/${user?.category?._id}`,
        );
        setExamDetail(response.data.data);
      } catch (error) {
        console.error("Failed to fetch exam detail:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchRecentTests = async () => {
      try {
        setLoading2(true);

        const response = await api.get("/mcu/custom", {
          params: {
            page: 1,
            limit: 4,
            // exam: examId || undefined,
          },
        });

        if (response.data.success) {
          setRecentTests(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch recent custom tests:", error);
        setRecentTests([]);
      } finally {
        setLoading2(false);
      }
    };

    fetchRecentTests();
    fetchExamDetail();
  }, [user]);

  if (loading) return <TestCardSkeleton />;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-2 sm:px-4 overflow-hidden">
      <section className="relative mx-auto overflow-hidden rounded-3xl bg-[#ff7048]">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-14 -top-14 h-28 w-28 rounded-full bg-[#ff8968]" />
        <div className="pointer-events-none absolute -bottom-2 -right-10 h-32 w-32 rounded-full bg-[#ff8968]" />

        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-[200px] items-center px-6 py-6 sm:px-10">
          {/* Content */}
          <div className="relative z-10 max-w-[520px] col-span-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[34px] lg:text-[36px]">
              Create Your Custom Test
            </h1>

            <p className="mt-2 max-w-[500px] text-sm font-medium leading-5 text-white sm:text-[15px]">
              Build a practice test that matches exactly what you want to
              practice. Choose your exam, sections, difficulty, question types,
              and test length.
            </p>

            <Link
              to={"/custom-test/create"}
              state={{ examId: examDetails?._id }}
              className="
          mt-5 inline-flex items-center justify-center
          rounded-full bg-white px-4 py-2
          text-sm font-semibold text-gray-700
          shadow-sm transition-all duration-200
          hover:-translate-y-0.5 hover:bg-gray-50
          hover:shadow-md
        "
            >
              Start Creating Test
            </Link>
          </div>

          {/* Illustration */}
          <img
            src="/custom.png"
            alt="Create custom test"
            className="max-h-[200px] scale-110 w-auto object-contain"
          />
        </div>
      </section>

      <main className="mx-auto mt-3">
        <section className="w-full py-2">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_332px]">
            {/* ================= MAIN EXAM CARD ================= */}
            <div className="rounded-3xl bg-white px-5 py-5 sm:px-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#ff6b4a]">
                    Selected Exam
                  </p>

                  <h2 className="mt-0.5 text-[20px] font-semibold leading-tight text-gray-900">
                    {examDetails?.name} Custom Test
                  </h2>
                </div>

                <Link
                  to={"/course/category"}
                  className="mt-4 hidden shrink-0 text-sm font-medium text-[#ff6748] transition hover:text-[#e95536] sm:block"
                >
                  Change Exam &gt;
                </Link>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 font-medium lg:grid-cols-[1.05fr_0.95fr]">
                {/* ================= EXAM DESCRIPTION ================= */}
                <div className="border-b border-gray-200 py-5 lg:border-b-0 lg:border-r lg:pr-7">
                  <h3 className="text-[14px] font-semibold text-gray-900">
                    {examDetails?.name}
                  </h3>

                  <p className="mt-2  text-sm text-gray-600">
                    {examDetails?.description}
                  </p>
                </div>

                {/* ================= SECTIONS ================= */}
                <div className="py-5 lg:pl-7">
                  <h3 className="text-[14px] font-semibold text-gray-900">
                    {examDetails?.name} Sections
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Choose one sections while creating your test.
                  </p>

                  <div className="mt-3 space-y-2">
                    {examDetails?.sections?.map(
                      (section: any, index: number) => {
                        return (
                          <div
                            key={section.name}
                            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                              index === 0 ? "bg-[#fff9ed]" : "bg-[#fff0eb]"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-gray-800">
                                {section.name}
                              </h4>
                              <p className="mt-px text-xs text-gray-600">
                                {section.description}
                              </p>

                              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                <span>{section.totalQuestions} questions</span>

                                <span className="text-gray-300">•</span>

                                <span>{section.duration / 60} min</span>
                              </div>
                            </div>

                            <ChevronRight
                              size={15}
                              className="shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5"
                            />
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= TOKEN CARD ================= */}
            <div className="rounded-3xl bg-white p-4 sm:p-5">
              {loading ? (
                <div className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gray-100" />

                    <div>
                      <div className="h-3 w-28 rounded bg-gray-100" />
                      <div className="mt-2 h-7 w-16 rounded bg-gray-100" />
                    </div>
                  </div>

                  <div className="mt-7 h-3 w-28 rounded bg-gray-100" />
                  <div className="mt-3 h-2 rounded-full bg-gray-100" />
                  <div className="mt-4 h-10 rounded-lg bg-gray-100" />
                </div>
              ) : (
                <>
                  {/* Token Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 text-4xl shrink-0 items-center justify-center rounded-xl bg-[#fff7ef]">
                      🪙
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Your Available Tokens
                      </p>

                      <div className="flex items-baseline gap-1">
                        <span className="text-[36px] font-bold leading-none text-gray-800">
                          {wallet.customTestToken}
                        </span>

                        <span className="text-sm font-medium text-gray-600">
                          Tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Used */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        Total Tokens Used
                      </span>

                      <span className="text-lg font-semibold text-[#ff6547]">
                        {wallet.totalConsumeTokens}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-1 rounded-lg bg-[#fff0eb] px-3 py-2.5 text-center">
                    <p className="text-xs font-medium leading-4 text-gray-600">
                      Tokens are used whenever
                      <br />
                      you generate a new custom test.
                    </p>
                  </div>

                  {/* Button */}
                  <div className="mt-3">
                    <p className="mb-3 text-sm font-bold text-gray-700">
                      How Tokens Work
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-orange-50 p-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white">
                            1
                          </span>

                          <span className="text-sm font-bold text-gray-900">
                            Get Tokens
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-4 text-gray-600">
                          Get tokens with a course/test series, free rewards, or
                          purchase them separately.
                        </p>
                      </div>

                      <div className="rounded-xl bg-red-50 p-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-xs font-bold text-white">
                            2
                          </span>

                          <span className="text-sm font-bold text-gray-900">
                            Use a Token
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-4 text-gray-600">
                          Creating one custom test consumes
                          <span className="font-bold text-red-500">
                            {" "}
                            1 token
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mt-3 font-medium">
          {/* Section Header */}
          <div className="mb-3 px-2">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              How to attempt a Custom Test
            </h2>

            <p className="mt-px text-xs text-gray-600 sm:text-sm dark:text-gray-400">
              Create a test in 4 simple steps and start practicing exactly what
              you need.
            </p>
          </div>

          {/* Process Container */}
          <div className="rounded-3xl bg-white p-4 sm:p-6 dark:bg-gray-900">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Choose Exam",
                  description:
                    "Select the exam and section you want to practice.",
                  icon: "📝",
                  bg: "bg-[#fff4ef]",
                },
                {
                  step: "02",
                  title: "Customize",
                  description:
                    "Select question count, difficulty and question types.",
                  icon: "⚙️",
                  bg: "bg-[#fffaf0]",
                },
                {
                  step: "03",
                  title: "Create Test",
                  description:
                    "Use one token to generate your personalized test.",
                  icon: "🎯",
                  bg: "bg-[#fff4ef]",
                },
                {
                  step: "04",
                  title: "Start Attempt",
                  description:
                    "Begin your test and review your performance afterwards.",
                  icon: "⚡",
                  bg: "bg-[#fffaf0]",
                },
              ].map((item) => {
                return (
                  <div
                    key={item.step}
                    className={`
              relative min-h-[130px] rounded-xl p-4
              ${item.bg}
              transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-sm
            `}
                  >
                    <div className="flex items-start justify-between">
                      {/* Icon */}
                      <div className="flex text-3xl items-center justify-center">
                        {item.icon}
                      </div>

                      <span className="text-3xl font-semibold leading-none text-orange-500">
                        {item.step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="mt-3">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-900">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600 ">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 font-medium">
          {/* Section Header */}
          <div className="mb-4 px-2">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              Recent Custom Test
            </h2>

            <p className="mt-px text-xs text-gray-600 sm:text-sm dark:text-gray-400">
              Continue an unfinished test or review your previous attempts
            </p>
          </div>

          {/* Loading */}
          {loading2 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <TestCardSkeleton />
              <TestCardSkeleton />
              <TestCardSkeleton />
            </div>
          ) : recentTests.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recentTests.map((test, index) => {
                return (
                  <div
                    key={test.id}
                    className={`
              group relative rounded-3xl bg-white p-4
              transition-all duration-200
              dark:bg-gray-900
              hover:-translate-y-0.5
              hover:border-orange-300
              hover:shadow-[0_8px_25px_rgba(255,99,55,0.08)]
            `}
                  >
                    <div>
                      <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                        {test.title || `Test-00${index + 1}`}
                      </h3>

                      <p className="mt-px text-sm text-gray-500 dark:text-gray-400">
                        {test?.exam?.name}
                      </p>
                    </div>

                    {/* Status + Difficulty */}
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`
                  inline-flex items-center gap-1.5
                  rounded-full px-2 py-1
                  text-xs border text-orange-500 capitalize font-medium 
                `}
                      >
                        {test.status}
                      </span>

                      <span
                        className={`
    rounded-full px-2.5 py-1
    text-xs font-medium
    ${getDifficultyClass(test?.filters?.difficulties?.[0])}
  `}
                      >
                        {test?.filters?.difficulties
                          ?.map((item) => item)
                          .join(", ")}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {/* Questions */}
                      <div className="rounded-md border border-gray-200 bg-gray-50/50 px-2 py-2 text-center dark:border-gray-700 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Questions
                        </p>

                        <p className="mt-0.5 font-semibold text-orange-500">
                          {test.totalQuestions}
                        </p>
                      </div>

                      {/* Duration */}
                      <div className="rounded-md border border-gray-200 bg-gray-50/50 px-2 py-2 text-center dark:border-gray-700 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Duration
                        </p>

                        <p className="mt-0.5 font-semibold text-orange-500">
                          {test.durationMinutes} min
                        </p>
                      </div>

                      {/* Score */}
                      <div className="rounded-md border border-gray-200 bg-gray-50/50 px-2 py-2 text-center dark:border-gray-700 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Type
                        </p>

                        <p className="mt-0.5 font-semibold text-orange-500">
                          Custom
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mt-3 text-gray-600">
                      Attempted:{" "}
                      {test.startedAt
                        ? new Date(test.startedAt).toLocaleString()
                        : "Not started"}
                    </p>

                    {/* Action */}
                    <div className="mt-4 flex">
                      <Link
                        to={test?.attempt && `/mcq/tests/${test?.attempt}?type=custom`}
                        className="
                  inline-flex items-center gap-1.5
                  rounded-full bg-orange-500
                  px-3.5 py-2
                  text-sm font-medium text-white
                  transition-all duration-200
                  hover:bg-orange-600
                  hover:shadow-md hover:shadow-orange-500/20
                "
                      >
                        {test.status === "completed"
                          ? "View Result"
                          : test.status === "started"
                            ? "Continue Test"
                            : "Start Test"}

                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div
              className="
        rounded-2xl border border-dashed
        border-gray-300 bg-white
        px-6 py-10 text-center
        dark:border-gray-700 dark:bg-gray-900
      "
            >
              <div className="mx-auto flex items-center justify-center text-orange-500 dark:bg-orange-500/10">
                <CircleQuestionMarkIcon size={32} />
              </div>

              <h3 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
                No Custom Tests Yet
              </h3>

              <p className="mx-auto mt-1.5 mb-6 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                Create your first personalized test and start practicing
                according to your preparation needs.
              </p>

              <Link
                to={"/custom-test/create"}
                state={{ examId: examDetails?._id }}
                className="
           rounded-full bg-orange-500
          px-4 py-2.5 text-sm font-semibold
          text-white transition
          hover:bg-orange-600
        "
              >
                Create Your First Test
              </Link>
            </div>
          )}
        </section>
        <div className="mb-12"></div>
      </main>
    </div>
  );
};

export default CustomTestPage;
