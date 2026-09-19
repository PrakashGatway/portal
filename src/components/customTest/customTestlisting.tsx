import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Filter,
  Loader2,
  MoreVertical,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import api from "../../axiosInstance";
type CustomTestStatus =
  | "draft"
  | "ready"
  | "started"
  | "completed"
  | "cancelled"
  | "expired";

interface Exam {
  _id: string;
  name?: string;
  title?: string;
  code?: string;
}

interface CustomTest {
  _id: string;
  user?: string | { _id: string };

  exam?: Exam | string;

  title: string;
  description?: string;

  testType: "quiz" | "sectional" | "full_length";
  selectionMode: "questions" | "filters";

  totalQuestions: number;
  durationMinutes: number;

  status: CustomTestStatus;

  questionIds?: string[];

  selectedQuestions?: Array<{
    question: string | { _id: string };
    order: number;
  }>;

  filters?: {
    sections?: string[];
    questionTypes?: string[];
    difficulties?: string[];
    tags?: string[];
    questionCount?: number;
  };

  attempt?: string | {
    _id: string;
    status?: string;
  };

  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;

  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  customTests?: CustomTest[];
  tests?: CustomTest[];
  data?: CustomTest[] | {
    customTests?: CustomTest[];
    tests?: CustomTest[];
    items?: CustomTest[];
  };
}

const statusConfig: Record<
  CustomTestStatus,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    icon: FileQuestion,
  },
  ready: {
    label: "Ready",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    icon: Sparkles,
  },
  started: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    icon: Play,
  },
  completed: {
    label: "Completed",
    className:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
    icon: Clock3,
  },
};

const getExamName = (exam?: Exam | string) => {
  if (!exam) return "Custom Practice";

  if (typeof exam === "string") {
    return exam;
  }

  return exam.name || exam.title || exam.code || "Custom Practice";
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const getStatus = (status?: CustomTestStatus): CustomTestStatus => {
  return status || "draft";
};

export default function CustomTestsPage() {
  const navigate = useNavigate();

  const [tests, setTests] = useState<CustomTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | CustomTestStatus
  >("all");
  const [examFilter, setExamFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [deleteTest, setDeleteTest] = useState<CustomTest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [startingTestId, setStartingTestId] = useState<string | null>(null);

  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * GET CUSTOM TESTS
   * ---------------------------------------------------------
   */

  const fetchCustomTests = useCallback(
    async (showLoader = true) => {
      try {
        setError("");

        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await api.get("/mcu/custom");

        const responseData = response.data;

        let list: CustomTest[] = [];

        if (Array.isArray(responseData?.customTests)) {
          list = responseData.customTests;
        } else if (Array.isArray(responseData?.tests)) {
          list = responseData.tests;
        } else if (Array.isArray(responseData?.data)) {
          list = responseData.data;
        } else if (
          responseData?.data &&
          !Array.isArray(responseData.data)
        ) {
          list =
            responseData.data.customTests ||
            responseData.data.tests ||
            responseData.data.items ||
            [];
        }

        setTests(list);
      } catch (err: any) {
        console.error("Fetch custom tests error:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load your custom tests.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCustomTests();
  }, [fetchCustomTests]);

  /*
   * ---------------------------------------------------------
   * EXAM FILTER OPTIONS
   * ---------------------------------------------------------
   */

  const exams = useMemo(() => {
    const map = new Map<string, string>();

    tests.forEach((test) => {
      if (!test.exam) return;

      if (typeof test.exam === "string") {
        map.set(test.exam, test.exam);
      } else {
        const id = test.exam._id;

        map.set(
          id,
          test.exam.name ||
            test.exam.title ||
            test.exam.code ||
            "Exam",
        );
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [tests]);

  /*
   * ---------------------------------------------------------
   * FILTERED TESTS
   * ---------------------------------------------------------
   */

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tests.filter((test) => {
      const examName = getExamName(test.exam).toLowerCase();

      const matchesSearch =
        !query ||
        test.title?.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query) ||
        examName.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        getStatus(test.status) === statusFilter;

      const matchesExam =
        examFilter === "all" ||
        (typeof test.exam === "string"
          ? test.exam === examFilter
          : test.exam?._id === examFilter);

      return matchesSearch && matchesStatus && matchesExam;
    });
  }, [tests, search, statusFilter, examFilter]);

  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */

  const stats = useMemo(() => {
    return {
      total: tests.length,

      inProgress: tests.filter(
        (test) => test.status === "started",
      ).length,

      completed: tests.filter(
        (test) => test.status === "completed",
      ).length,

      ready: tests.filter(
        (test) => test.status === "ready",
      ).length,
    };
  }, [tests]);

  /*
   * ---------------------------------------------------------
   * START / CONTINUE TEST
   * ---------------------------------------------------------
   */

  const handleStart = async (test: CustomTest) => {
    try {
      setStartingTestId(test._id);
      setError("");

      /*
       * If your backend route is:
       *
       * POST /custom-tests/:id/start
       *
       * use this.
       */

      const response = await api.post(
        `/mcu/custom/${test._id}/start`,
      );

      const attempt =
        response.data?.attempt ||
        response.data?.data?.attempt ||
        response.data?.testAttempt;

      const attemptId =
        typeof attempt === "string"
          ? attempt
          : attempt?._id;

      if (attemptId) {
        navigate(`/test-attempt/${attemptId}`);
        return;
      }

      /*
       * Fallback if backend directly returns attempt ID.
       */

      if (response.data?.attemptId) {
        navigate(`/test-attempt/${response.data.attemptId}`);
        return;
      }

      /*
       * If API only updates CustomTest, refresh the list.
       */

      await fetchCustomTests(false);

      setError(
        "Test started, but the attempt ID was not returned by the server.",
      );
    } catch (err: any) {
      console.error("Start custom test error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to start this custom test.",
      );
    } finally {
      setStartingTestId(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  const handleDelete = async () => {
    if (!deleteTest) return;

    try {
      setDeleting(true);
      setError("");

      await api.delete(`/custom-tests/${deleteTest._id}`);

      setTests((prev) =>
        prev.filter((item) => item._id !== deleteTest._id),
      );

      setDeleteTest(null);
    } catch (err: any) {
      console.error("Delete custom test error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to delete this custom test.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * ACTION BUTTON
   * ---------------------------------------------------------
   */

  const getPrimaryAction = (test: CustomTest) => {
    if (test.status === "started") {
      return {
        label: "Continue Test",
        icon: Play,
      };
    }

    if (test.status === "completed") {
      return {
        label: "View Result",
        icon: Trophy,
      };
    }

    if (
      test.status === "ready" ||
      test.status === "draft"
    ) {
      return {
        label: "Start Test",
        icon: Play,
      };
    }

    return {
      label: "View Test",
      icon: ArrowRight,
    };
  };

  const handlePrimaryAction = (test: CustomTest) => {
    if (test.status === "completed") {
      if (typeof test.attempt === "string") {
        navigate(`/test-result/${test.attempt}`);
      } else if (test.attempt?._id) {
        navigate(`/test-result/${test.attempt._id}`);
      } else {
        navigate(`/custom-tests/${test._id}/result`);
      }

      return;
    }

    if (
      test.status === "ready" ||
      test.status === "draft" ||
      test.status === "started"
    ) {
      handleStart(test);
      return;
    }

    navigate(`/custom-tests/${test._id}`);
  };

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-xl bg-gray-200 dark:bg-gray-800" />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>

            <div className="h-16 rounded-2xl bg-gray-200 dark:bg-gray-800" />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-72 rounded-3xl bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white"
      onClick={() => setOpenMenu(null)}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
              <Sparkles size={14} />
              Personalized Practice
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              My Custom Tests
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Create, manage and practice tests built specifically
              for your preparation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fetchCustomTests(false);
              }}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/custom-tests/create");
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]"
            >
              <Plus size={18} />
              Create Custom Test
            </button>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={18} />

            <div className="flex-1 text-sm font-medium">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =====================================================
            STATS
        ====================================================== */}


        {/* =====================================================
            FILTER BAR
        ====================================================== */}

        <div
          onClick={(e) => e.stopPropagation()}
          className="mb-7 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search custom tests..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:focus:border-orange-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status */}

            <div className="relative min-w-[170px]">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | CustomTestStatus,
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm font-medium outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="started">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Exam */}

            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="h-11 min-w-[170px] rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">All Exams</option>

              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =====================================================
            RESULT COUNT
        ====================================================== */}

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredTests.length}
            </span>{" "}
            {filteredTests.length === 1 ? "test" : "tests"}
          </div>

          {(search ||
            statusFilter !== "all" ||
            examFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setExamFilter("all");
              }}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}

        {filteredTests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <FileQuestion size={30} />
            </div>

            <h2 className="text-lg font-bold">
              {tests.length === 0
                ? "No custom tests yet"
                : "No tests found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {tests.length === 0
                ? "Build your own personalized practice test by selecting questions or applying filters."
                : "Try changing your search or filters to find another custom test."}
            </p>

            {tests.length === 0 ? (
              <button
                type="button"
                onClick={() =>
                  navigate("/custom-tests/create")
                }
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <Plus size={18} />
                Create Your First Test
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setExamFilter("all");
                }}
                className="mt-6 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold dark:border-gray-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* =====================================================
             TEST GRID
          ====================================================== */

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTests.map((test) => {
              const status = getStatus(test.status);
              const config = statusConfig[status];
              const StatusIcon = config.icon;

              const primaryAction = getPrimaryAction(test);
              const PrimaryIcon = primaryAction.icon;

              const isStarting =
                startingTestId === test._id;

              return (
                <div
                  key={test._id}
                  onClick={(e) => e.stopPropagation()}
                  className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-black/20"
                >
                  {/* Orange top accent */}

                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400" />

                  <div className="p-5 sm:p-6">
                    {/* Card Header */}

                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                          <BookOpen size={21} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                            {getExamName(test.exam)}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {test.testType
                              .replace("_", " ")
                              .replace(/\b\w/g, (c) =>
                                c.toUpperCase(),
                              )}
                          </p>
                        </div>
                      </div>

                      {/* Menu */}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setOpenMenu((current) =>
                              current === test._id
                                ? null
                                : test._id,
                            );
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenu === test._id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                navigate(
                                 test.status !== "started" ? `/custom-tests/${test._id}` : `/mcq/tests/${test.attempt}?type=custom`
                                );
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <ArrowRight size={16} />
                              View Details
                            </button>

                            {test.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenu(null);
                                  handlePrimaryAction(test);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <Play size={16} />
                                {test.status === "started"
                                  ? "Continue"
                                  : "Start Test"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                setDeleteTest(test);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}

                    <div className="mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${config.className}`}
                      >
                        <StatusIcon size={13} />
                        {config.label}
                      </span>
                    </div>

                    {/* Title */}

                    <h2 className="line-clamp-2 min-h-[56px] text-lg font-bold leading-7 text-gray-900 dark:text-white">
                      {test.title}
                    </h2>

                    <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-gray-500 dark:text-gray-400">
                      {test.description ||
                        "Personalized practice test created from your selected questions."}
                    </p>

                    {/* Stats */}

                    <div className="my-5 grid grid-cols-2 gap-2">
                      <InfoItem
                        icon={FileQuestion}
                        label="Questions"
                        value={test.totalQuestions}
                      />

                      <InfoItem
                        icon={Clock3}
                        label="Duration"
                        value={`${test.durationMinutes} min`}
                      />
                    </div>

                    {/* Selection */}

                    <div className="mb-5 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-gray-800/70">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Created using
                        </span>

                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {test.selectionMode ===
                          "questions"
                            ? "Selected Questions"
                            : "Smart Filters"}
                        </span>
                      </div>

                      {test.selectionMode ===
                        "filters" &&
                        test.filters && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {test.filters.difficulties
                              ?.slice(0, 3)
                              .map((difficulty) => (
                                <span
                                  key={difficulty}
                                  className="rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                                >
                                  {difficulty}
                                </span>
                              ))}

                            {test.filters.questionCount && (
                              <span className="rounded-md bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {test.filters.questionCount} selected
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Date */}

                    <div className="mb-5 flex items-center gap-2 text-xs text-gray-400">
                      <CalendarDays size={14} />
                      Created {formatDate(test.createdAt)}
                    </div>

                    {/* Primary Action */}

                    <button
                      type="button"
                      disabled={isStarting}
                      onClick={() =>
                        handlePrimaryAction(test)
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStarting ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Starting...
                        </>
                      ) : (
                        <>
                          <PrimaryIcon size={17} />
                          {primaryAction.label}
                          <ArrowRight
                            size={16}
                            className="ml-auto"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =======================================================
          DELETE MODAL
      ======================================================== */}

      {deleteTest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTest(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2 size={22} />
            </div>

            <h3 className="text-lg font-bold">
              Delete custom test?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                "{deleteTest.title}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTest(null)}
                className="h-11 flex-1 rounded-xl border border-gray-200 px-4 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
          <Icon size={19} />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-0.5 text-xl font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| INFO ITEM
|--------------------------------------------------------------------------
*/

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          className="text-orange-500"
        />

        <span className="text-[11px] font-medium text-gray-400">
          {label}
        </span>
      </div>

      <p className="mt-1 text-sm font-bold text-gray-800 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}