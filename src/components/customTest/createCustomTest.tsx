import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  Loader2,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";
import api from "../../axiosInstance";
import StepOneSATDetails from "./step1";

/* =========================================================
   TYPES
========================================================= */

interface Exam {
  _id: string;
  name: string;
  description?: string;
}

interface QuestionOption {
  _id?: string;
  text?: string;
  label?: string;
}

interface Question {
  _id: string;

  question?: string;
  questionText?: string;
  title?: string;

  section?: string | any;
  sectionName?: string;

  questionType?: string;
  type?: string;

  difficulty?: string;

  tags?: string[];

  options?: QuestionOption[];

  [key: string]: any;
}

type TestType = "quiz" | "sectional" | "full_length";

type SelectionMode = "questions" | "filters";

interface FilterState {
  sections: string[];
  questionTypes: string[];
  difficulties: string[];
  tags: string[];
}

export default function CreateCustomTestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testType, setTestType] = useState<TestType>("quiz");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [examId, setExamId] = useState("6924328024d744b891c17172");
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("questions");

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<any>({
    sections: [],
    tags: [],
    difficulties: [],
    questionPool: "answered_unanswered",
  });

  const [questionCount, setQuestionCount] = useState(10);

  const [filteredQuestionIds, setFilteredQuestionIds] = useState<string[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [loadingFilterQuestions, setLoadingFilterQuestions] = useState(false);

  const [tagInput, setTagInput] = useState("");

  const [step, setStep] = useState(1);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!examId) {
      return;
    }

    loadFilters();
  }, [examId]);

  const fetchFilteredQuestions = async () => {
    if (!examId) return;

    try {
      setLoadingFilterQuestions(true);
      setError("");

      const response = await api.get("/mcu/questions/list", {
        params: {
          examId,

          sections:
            filters.sections.length > 0
              ? filters.sections.join(",")
              : undefined,

          tags: filters.tags.length > 0 ? filters.tags.join(",") : undefined,

          difficulties:
            filters.difficulties.length > 0
              ? filters.difficulties.join(",")
              : undefined,

          questionPool: filters.questionPool,

          questionCount: Number(questionCount),
        },
      });

      const data = response?.data?.data || response?.data;

      setFilteredQuestionIds(data?.questionIds || []);
      setAvailableCount(Number(data?.count || 0));
    } catch (error: any) {
      console.error("Filter questions error:", error);

      setFilteredQuestionIds([]);
      setAvailableCount(0);

      setError(error?.response?.data?.message || "Failed to fetch questions.");
    } finally {
      setLoadingFilterQuestions(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || !examId) return;

    fetchFilteredQuestions();
  }, [
    step,
    examId,
    filters.sections,
    filters.tags,
    filters.difficulties,
    filters.questionPool,
    questionCount,
  ]);

  const loadFilters = async () => {
    try {
      setLoadingQuestions(true);
      setError("");

      const response = await api.get(`/mcu/questions/filters`, {
        params: {
          examId: examId
        },
      });

      const data = response.data

      
    } catch (error: any) {
      console.error("Load questions error:", error);

      setError(error?.response?.data?.message || "Failed to load questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const toggleFilter = (
    key: "sections" | "tags" | "difficulties",
    value: string,
  ) => {
    setFilters((previous) => {
      const current = previous[key];

      return {
        ...previous,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const setQuestionPool = (value: FilterState["questionPool"]) => {
    setFilters((previous) => ({
      ...previous,
      questionPool: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      sections: [],
      tags: [],
      difficulties: [],
      questionPool: "answered_unanswered",
    });

    setQuestionCount(10);
  };

  const availableSections = useMemo(() => {
    const values = new Set<string>();

    questions.forEach((question) => {
      const section =
        question.sectionName || question.section?.name || question.section;

      if (typeof section === "string" && section.trim()) {
        values.add(section);
      }
    });

    return Array.from(values).sort();
  }, [questions]);


  const availableDifficulties = useMemo(() => {
    const values = new Set<string>();

    questions.forEach((question) => {
      if (question.difficulty) {
        values.add(String(question.difficulty));
      }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const availableTags = useMemo(() => {
    const values = new Set<string>();

    questions.forEach((question) => {
      if (Array.isArray(question.tags)) {
        question.tags.forEach((tag) => {
          if (tag) {
            values.add(String(tag));
          }
        });
      }
    });

    return Array.from(values).sort();
  }, [questions]);

  const clearSelection = () => {
    setSelectedQuestions([]);
  };


  const addTag = () => {
    const tag = tagInput.trim();

    if (!tag) return;

    if (!filters.tags.includes(tag)) {
      setFilters((previous) => ({
        ...previous,
        tags: [...previous.tags, tag],
      }));
    }

    setTagInput("");
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateStep = () => {
    setError("");

    // if (step === 1) {
    //   if (!examId) {
    //     setError(
    //       "Please select an exam.",
    //     );
    //     return false;
    //   }

    //   if (!title.trim()) {
    //     setError(
    //       "Please enter a test title.",
    //     );
    //     return false;
    //   }

    //   if (
    //     !durationMinutes ||
    //     durationMinutes < 1
    //   ) {
    //     setError(
    //       "Please enter a valid duration.",
    //     );
    //     return false;
    //   }
    // }

    // if (step === 2) {
    //   if (
    //     selectionMode ===
    //     "questions"
    //   ) {
    //     if (
    //       selectedQuestions.length ===
    //       0
    //     ) {
    //       setError(
    //         "Please select at least one question.",
    //       );
    //       return false;
    //     }
    //   }

    //   if (
    //     selectionMode ===
    //     "filters"
    //   ) {
    //     if (
    //       questionCount < 1
    //     ) {
    //       setError(
    //         "Question count must be at least 1.",
    //       );
    //       return false;
    //     }

    //     const possible =
    //       getFilteredQuestionCount();

    //     if (
    //       possible <
    //       questionCount
    //     ) {
    //       setError(
    //         `Only ${possible} questions match your filters.`,
    //       );
    //       return false;
    //     }
    //   }
    // }

    return true;
  };


  const handleCreate = async () => {
    if (!validateStep()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const payload: any = {
        exam: examId,

        title: title.trim(),

        description: description.trim(),

        testType,

        selectionMode,

        durationMinutes: Number(durationMinutes),
      };

      if (selectionMode === "questions") {
        payload.questionIds = selectedQuestions;
      }

      if (selectionMode === "filters") {
        payload.filters = {
          sections: filters.sections,

          questionTypes: filters.questionTypes,

          difficulties: filters.difficulties,

          tags: filters.tags,

          questionCount: Number(questionCount),
        };
      }

      const response = await api.post("/mcu/custom", payload);

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to create custom test.",
        );
      }

      const customTest = response.data.data;

      /*
        After creation you can either:

        1. Go to My Custom Tests
        2. Immediately start the test

        Here we go to My Custom Tests.
      */

      window.location.href = "/custom-tests";

      return customTest;
    } catch (error: any) {
      console.error("Create custom test error:", error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create custom test.",
      );
    } finally {
      setCreating(false);
    }
  };

  const nextStep = () => {
    if (!validateStep()) {
      return;
    }

    setStep((previous) => Math.min(3, previous + 1));
  };

  const previousStep = () => {
    setError("");

    setStep((previous) => Math.max(1, previous - 1));
  };

  const resetBuilder = () => {
    setTitle("");
    setDescription("");
    setExamId("");
    setTestType("quiz");
    setDurationMinutes(30);

    setSelectionMode("questions");

    setSelectedQuestions([]);

    setSearch("");

    clearFilters();

    setQuestionCount(10);

    setStep(1);

    setError("");
  };

  /* =======================================================
     SELECTED QUESTION OBJECTS
  ======================================================= */

  const selectedQuestionObjects = useMemo(() => {
    const map = new Map(questions.map((question) => [question._id, question]));

    return selectedQuestions.map((id) => map.get(id)).filter(Boolean);
  }, [selectedQuestions, questions]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
              Create Custom Test
            </h1>

            <p className="mt-px max-w-2xl text-sm text-slate-600 md:text-base">
              Build your own practice test by selecting specific questions or
              generating a test using filters.
            </p>
          </div>

          <button
            type="button"
            onClick={resetBuilder}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        <div className="mb-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {[
              {
                number: 1,
                label: "Test Details",
              },
              {
                number: 2,
                label: "Questions",
              },
              {
                number: 3,
                label: "Review",
              },
            ].map((item, index) => (
              <React.Fragment key={item.number}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.number < step) {
                      setStep(item.number);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      step >= item.number
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}
                  >
                    {step > item.number ? <Check size={16} /> : item.number}
                  </span>

                  <span
                    className={`hidden text-sm font-semibold sm:block ${
                      step >= item.number
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>

                {index < 2 && (
                  <div
                    className={`h-px flex-1 ${
                      step > item.number
                        ? "bg-orange-500"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-500/10">
            <X size={18} className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <div className="rounded-2xl mx-auto border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                Test Details
              </h2>

              <p className="mt-px text-sm text-slate-500">
                Review instructions & set your duration
              </p>
            </div>

            {/* <div className="grid gap-6 md:grid-cols-2">


              <div>
                <label className="mb-2 block text-sm font-bold">
                  Exam
                </label>

                <div className="relative">
                  <select
                    value={examId}
                    onChange={(e) =>
                      setExamId(
                        e.target.value,
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      {loadingExams
                        ? "Loading exams..."
                        : "Select Exam"}
                    </option>

                    {exams.map(
                      (exam) => (
                        <option
                          key={
                            exam._id
                          }
                          value={
                            exam._id
                          }
                        >
                          {
                            exam.name
                          }
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-4 text-slate-400"
                  />
                </div>
              </div>


              <div>
                <label className="mb-2 block text-sm font-bold">
                  Test Type
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value:
                        "quiz",
                      label:
                        "Quiz",
                    },
                    {
                      value:
                        "sectional",
                      label:
                        "Sectional",
                    },
                    {
                      value:
                        "full_length",
                      label:
                        "Full Length",
                    },
                  ].map(
                    (item) => (
                      <button
                        type="button"
                        key={
                          item.value
                        }
                        onClick={() =>
                          setTestType(
                            item.value as TestType,
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-xs font-bold transition md:text-sm ${
                          testType ===
                          item.value
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {
                          item.label
                        }
                      </button>
                    ),
                  )}
                </div>
              </div>


              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Test Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value,
                    )
                  }
                  placeholder="e.g. SAT Math — Algebra Practice"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>


              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value,
                    )
                  }
                  placeholder="Describe what you want to practice..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>


              <div>
                <label className="mb-2 block text-sm font-bold">
                  Duration
                </label>

                <div className="relative">
                  <Clock3
                    size={17}
                    className="absolute left-4 top-4 text-slate-400"
                  />

                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={
                      durationMinutes
                    }
                    onChange={(e) =>
                      setDurationMinutes(
                        Number(
                          e.target
                            .value,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>


              <div className="rounded-2xl bg-orange-50 p-5 dark:bg-orange-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                    <Target
                      size={19}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      Test Type
                    </div>

                    <div className="font-bold capitalize text-orange-600">
                      {testType.replace(
                        "_",
                        " ",
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

            <StepOneSATDetails />

            {/* Footer */}

            <div className="pt-6 dark:border-slate-800">
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              {/* FILTERS */}
              <FilterSelection
                sections={availableSections}
                difficulties={availableDifficulties}
                tags={availableTags}
                filters={filters}
                toggleFilter={toggleFilter}
                setQuestionPool={setQuestionPool}
                clearFilters={clearFilters}
                questionCount={questionCount}
                setQuestionCount={setQuestionCount}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                availableCount={availableCount}
                loading={loadingFilterQuestions}
              />

              {/* SELECTED QUESTIONS */}
              <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-5">
                <div className="mb-3">
                  <h3 className="font-semibold">Selected Questions</h3>

                  <p className="mt-px text-xs text-slate-500">
                    Questions matching your selected filters.
                  </p>
                </div>

                {/* TOTAL */}
                <div className="mb-4 flex items-end justify-between rounded-2xl bg-orange-50 p-3 dark:bg-orange-500/10">
                  <div className="text-sm font-medium text-slate-500">
                    Total Questions
                  </div>

                  <div className="text-2xl font-black text-orange-600">
                    {filteredQuestionIds.length}
                  </div>
                </div>

                {/* QUESTION IDS */}
                {loadingFilterQuestions ? (
                  <div className="flex min-h-[180px] items-center justify-center">
                    <Loader2
                      size={28}
                      className="animate-spin text-orange-500"
                    />
                  </div>
                ) : filteredQuestionIds.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
                    <ListChecks
                      size={28}
                      className="mx-auto mb-3 text-slate-400"
                    />

                    <p className="text-sm font-semibold">No questions found</p>

                    <p className="mt-1 text-xs text-slate-500">
                      Try changing your filters.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {filteredQuestionIds.map((id: string, index: number) => (
                        <div
                          key={id}
                          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800"
                          title={`Question ID: ${id}`}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REQUESTED VS AVAILABLE */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Requested</span>

                    <span className="font-bold">{questionCount}</span>
                  </div>

                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-slate-500">Available</span>

                    <span className="font-bold text-orange-600">
                      {availableCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={previousStep}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <button
                type="button"
                onClick={nextStep}
                disabled={
                  loadingFilterQuestions ||
                  filteredQuestionIds.length === 0 ||
                  filteredQuestionIds.length < questionCount
                }
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Review Test
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 3 && (
          <Review
            exam={exams.find((item) => item._id === examId)}
            title={title}
            description={description}
            testType={testType}
            selectionMode={selectionMode}
            durationMinutes={durationMinutes}
            questionCount={
              selectionMode === "questions"
                ? selectedQuestions.length
                : questionCount
            }
            filters={filters}
            selectedQuestionObjects={selectedQuestionObjects}
          />
        )}

        {/* =================================================
            STEP 3 FOOTER
        ================================================= */}

        {step === 3 && (
          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={previousStep}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-60"
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : ""}

              {creating ? "Creating..." : "Create  Test"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   MANUAL SELECTION
========================================================= */

function ManualSelection({
  questions,
  selectedQuestions,
  search,
  setSearch,
  toggleQuestion,
  selectAllVisible,
  clearSelection,
  loading,
}: any) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* QUESTIONS */}

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={selectAllVisible}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-orange-300 hover:text-orange-600 dark:border-slate-700"
          >
            Select Visible
          </button>

          <button
            type="button"
            onClick={clearSelection}
            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:border-red-900"
          >
            Clear
          </button>
        </div>

        <div className="mb-3 px-1 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Question Bank</h3>

            <p className="text-xs text-slate-600">
              {questions.length} questions available
            </p>
          </div>

          <div className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-600 dark:bg-orange-500/10">
            {selectedQuestions.length} Selected
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={30} />
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <Search size={32} className="mx-auto mb-3 text-slate-400" />

            <p className="font-semibold">No questions found</p>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or selecting another exam.
            </p>
          </div>
        ) : (
          <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1">
            {questions.map((question: Question, index: number) => {
              const selected = selectedQuestions.includes(question._id);

              const text =
                question.question ||
                question.questionText ||
                question.title ||
                "Question";

              const textWithoutImages = text.replace(/<img\b[^>]*>/gi, "");

              return (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => toggleQuestion(question._id)}
                  className={`w-full rounded-2xl border p-3 py-2.5 text-left transition ${
                    selected
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                      : "border-slate-200 hover:border-orange-300 dark:border-slate-700"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        selected
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected && <Check size={10} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-px flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          Q{index + 1}
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                          {question.difficulty && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold capitalize dark:bg-slate-800">
                              {question.difficulty}
                            </span>
                          )}

                          {/* {(question.questionType ||
                              question.type) && (
                              <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600 dark:bg-orange-500/10">
                                {question.questionType ||
                                  question.type}
                              </span>
                            )} */}
                        </div>
                      </div>

                      <div
                        className="line-clamp-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200"
                        dangerouslySetInnerHTML={{
                          __html: String(textWithoutImages),
                        }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SELECTED */}

      <div className="h-fit rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-5">
        <div className="mb-3">
          <h3 className="font-semibold">Selected Questions</h3>

          <p className="mt-px text-xs text-slate-500">
            These questions will be included in your test.
          </p>
        </div>

        <div className="mb-4 flex justify-between items-end rounded-2xl bg-orange-50 p-3 py-3 dark:bg-orange-500/10">
          <div className="text-sm font-medium text-slate-500">
            Total Questions
          </div>

          <div className="mt-1 text-2xl font-black text-orange-600">
            {selectedQuestions.length}
          </div>
        </div>

        {selectedQuestions.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
            <ListChecks size={28} className="mx-auto mb-3 text-slate-400" />

            <p className="text-sm font-semibold">No questions selected</p>
          </div>
        ) : (
          <div className="max-h-[400px] flex flex-wrap gap-2 justify-between overflow-y-auto">
            {selectedQuestions.map((id: string, index: number) => (
              <div
                key={id}
                className="flex relative items-center gap-3 rounded-full bg-slate-200 p-1 dark:bg-slate-800"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                  {index + 1}
                </span>

                {/* <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  Question {index + 1}
                </span> */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(id)}
                  className="absolute top-0 right-0 bg-white border rounded-full p-px text-slate-400 hover:text-red-500"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SELECTION
========================================================= */

function FilterSelection({
  sections,
  difficulties,
  tags,
  filters,
  toggleFilter,
  setQuestionPool,
  clearFilters,
  questionCount,
  setQuestionCount,
  tagInput,
  setTagInput,
  addTag,
  availableCount,
  loading,
}: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:p-7">
      {/* HEADER */}
      <div className="mb-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Question Filters</h2>

            <p className="mt-1 text-sm text-slate-500">
              Select filters to automatically generate your question pool.
            </p>
          </div>

          {loading && (
            <Loader2 size={20} className="animate-spin text-orange-500" />
          )}
        </div>
      </div>

      {/* NUMBER OF QUESTIONS */}
      <div className="mb-7 rounded-2xl bg-orange-50 p-4 dark:bg-orange-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Number of Questions</h3>
            </div>

            <p className="mt-px text-sm text-slate-500">
              {availableCount} questions match your filters.
            </p>
          </div>

          <div className="w-full sm:w-44">
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-orange-200 bg-white px-4 py-3 text-base font-bold text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 dark:border-orange-900 dark:bg-slate-900 dark:text-white"
            >
              <option value={0}>No Limit</option>

              {Array.from({ length: 12 }, (_, index) => {
                const count = (index + 1) * 5;

                return (
                  <option key={count} value={count}>
                    {count} questions
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-7">
        {/* SECTIONS */}
        <FilterGroup
          title="Sections"
          values={sections}
          selected={filters.sections}
          onToggle={(value: string) => toggleFilter("sections", value)}
        />

        {/* TAGS */}
        <div>
          <label className="mb-3 block text-sm font-bold">Subjects</label>
          {filters.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.tags.map((tag: string) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleFilter("tags", tag)}
                  className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-600 dark:bg-orange-500/10"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-4 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {tags
                .filter((tag: string) => !filters.tags.includes(tag))
                .slice(0, 40)
                .map((tag: string) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleFilter("tags", tag)}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-orange-100 hover:text-orange-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* DIFFICULTY */}
        <FilterGroup
          title="Difficulty"
          values={difficulties}
          selected={filters.difficulties}
          onToggle={(value: string) => toggleFilter("difficulties", value)}
        />

        {/* QUESTION POOL */}
        <div>
          <label className="mb-3 block text-sm font-bold">Question Pool</label>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                value: "unanswered",
                label: "Unanswered",
              },
              {
                value: "answered",
                label: "Answered",
              },
              {
                value: "answered_unanswered",
                label: "Answered & Unanswered",
              },
            ].map((item) => {
              const active = filters.questionPool === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setQuestionPool(item.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CLEAR */}
      <div className="mt-8 flex justify-end border-t border-slate-200 pt-5 dark:border-slate-800">
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-600"
        >
          <RotateCcw size={15} />
          Clear Filters
        </button>
      </div>
    </div>
  );
}


function FilterGroup({ title, values, selected, onToggle }: any) {
  return (
    <div>
      <label className="mb-3 block text-sm font-bold">{title}</label>

      {values.length === 0 ? (
        <p className="text-sm text-slate-400">No options available.</p>
      ) : (
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {values.map((value: string) => {
            const active = selected.includes(value);

            return (
              <button
                type="button"
                key={value}
                onClick={() => onToggle(value)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold capitalize transition ${
                  active
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {value.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   REVIEW
========================================================= */

function Review({
  exam,
  title,
  description,
  testType,
  selectionMode,
  durationMinutes,
  questionCount,
  filters,
  selectedQuestionObjects,
}: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Review Your Test</h2>

          <p className="mt-px text-sm text-slate-500">
            Everything looks ready. Create your personalized test.
          </p>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Exam" value={exam?.name || "SAT"} />

        <SummaryCard label="Questions" value={questionCount} />

        <SummaryCard label="Duration" value={`${durationMinutes} min`} />

        <SummaryCard label="Type" value={testType.replace("_", " ")} />
      </div>

      {/* MODE */}

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Selection Method
        </div>

        <div className="mt-2 text-lg font-semibold capitalize">
          {selectionMode === "questions"
            ? "Individual Questions"
            : "Filter Based Generation"}
        </div>
      </div>

      {selectionMode === "filters" && (
        <div className="mt-5 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
          <div className="mb-4 text-sm font-semibold">Applied Filters</div>

          <div className="space-y-3 text-sm">
            <ReviewFilter label="Sections" values={filters.sections} />

            <ReviewFilter
              label="Question Types"
              values={filters.questionTypes}
            />

            <ReviewFilter label="Difficulty" values={filters.difficulties} />

            <ReviewFilter label="Tags" values={filters.tags} />
          </div>
        </div>
      )}

      {/* SELECTED QUESTIONS */}

      {selectionMode === "questions" && (
        <div className="mt-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-bold">Selected Questions</div>

            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600 dark:bg-orange-500/10">
              {selectedQuestionObjects.length}
            </span>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {selectedQuestionObjects.map(
              (question: Question, index: number) => {
                const text =
                  question.question ||
                  question.questionText ||
                  question.title ||
                  "Question";

                const textWithoutImages = text.replace(/<img\b[^>]*>/gi, "");

                return (
                  <div
                    key={question._id}
                    className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {index + 1}
                    </span>

                    <div
                      className="line-clamp-2 text-sm !font-medium leading-5"
                      dangerouslySetInnerHTML={{
                        __html: String(textWithoutImages),
                      }}
                    />
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* FINAL NOTE */}

      <div className="mt-6 rounded-2xl bg-orange-50 p-5 text-sm text-slate-600 dark:bg-orange-500/10 dark:text-slate-300">
        <strong className="text-orange-600">Ready to practice?</strong> Your
        selected questions will be snapshotted into this custom test. You can
        then start it from your Custom Tests.
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-px truncate text-lg font-bold text-slate-700 capitalize">
        {value}
      </div>
    </div>
  );
}

function ReviewFilter({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <span className="font-semibold">{label}:</span>

      <span className="text-slate-500">
        {values.length ? values.join(", ") : "All"}
      </span>
    </div>
  );
}
