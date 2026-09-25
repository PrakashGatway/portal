import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

import api from "../../axiosInstance";
import StepOneSATDetails from "./step1";
import CustomTestInstructionPopup from "./InstructionPopup";
import { useLocation } from "react-router";
import { useAuth } from "../../context/UserContext";

interface FilterSection {
  _id: string;
  name: string;
  tags?: string[];
}

interface FilterApiData {
  sections?: FilterSection[];
  difficulties?: string[];
  difficulty?: string[];
  questionTypes?: string[];
  question_types?: string[];
}

interface FilterState {
  sections: string[];
  tags: string[];
  difficulties: string[];
  questionPool: "unanswered" | "answered" | "answered_unanswered";
}

interface QuestionIdsApiResponse {
  success: boolean;
  data?: {
    questionIds?: string[];
    count?: number;
  };
  message?: string;
}

type TestType = "quiz" | "sectional" | "full_length";

function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function CreateCustomTestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const location = useLocation();

  const examId = location.state?.examId;

  const [testType, setTestType] = useState<TestType>("quiz");

  const [durationMinutes, setDurationMinutes] = useState(30);

  const [filterData, setFilterData] = useState<FilterApiData>({
    sections: [],
    difficulties: [],
    questionTypes: [],
  });

  const [loadingFilters, setLoadingFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    sections: [],
    tags: [],
    difficulties: [],
    questionPool: "answered_unanswered",
  });

  const [questionCount, setQuestionCount] = useState(10);

  const [filteredQuestionIds, setFilteredQuestionIds] = useState<string[]>([]);

  const [availableCount, setAvailableCount] = useState(0);

  const [loadingFilterQuestions, setLoadingFilterQuestions] = useState(false);

  const [step, setStep] = useState(1);
  const [loadingStep, setLoadingStep] = useState(null);

  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const [tagInput, setTagInput] = useState("");

  const debouncedFilters = useDebounce(
    {
      sections: filters.sections,
      tags: filters.tags,
      difficulties: filters.difficulties,
      questionPool: filters.questionPool,
      questionCount,
    },
    500,
  );

  useEffect(() => {
    if (!examId) {
      setFilterData({
        sections: [],
        difficulties: [],
        questionTypes: [],
      });

      return;
    }

    loadFilters();
  }, [examId]);

  const loadFilters = async () => {
    try {
      setLoadingFilters(true);
      setError("");

      const response = await api.get("/mcu/questions/filters", {
        params: {
          examId,
        },
      });

      const data: FilterApiData = response?.data?.data || {};

      const sections = Array.isArray(data?.sections) ? data.sections : [];
      const difficulties = Array.isArray(data?.difficulties)
        ? data.difficulties
        : Array.isArray(data?.difficulty)
          ? data.difficulty
          : [];

      const questionTypes = Array.isArray(data?.questionTypes)
        ? data.questionTypes
        : Array.isArray(data?.question_types)
          ? data.question_types
          : [];

      setFilterData({
        sections,
        difficulties: difficulties.filter(Boolean).map(String),

        questionTypes: questionTypes.filter(Boolean).map(String),
      });
      setFilters((previous) => ({
        ...previous,
        sections: previous.sections.filter((sectionId) =>
          sections.some((section) => String(section._id) === String(sectionId)),
        ),

        tags: previous.tags.filter((tag) =>
          sections.some((section) =>
            Array.isArray(section.tags) ? section.tags.includes(tag) : false,
          ),
        ),

        difficulties: previous.difficulties.filter((difficulty) =>
          difficulties.includes(difficulty),
        ),
      }));
    } catch (error: any) {
      console.error("Load question filters error:", error);

      setFilterData({
        sections: [],
        difficulties: [],
        questionTypes: [],
      });

      setError(
        error?.response?.data?.message || "Failed to load question filters.",
      );
    } finally {
      setLoadingFilters(false);
    }
  };

  const availableSections = useMemo(() => {
    return Array.isArray(filterData.sections) ? filterData.sections : [];
  }, [filterData.sections]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();

    availableSections.forEach((section) => {
      if (!Array.isArray(section.tags)) {
        return;
      }

      section.tags.forEach((tag) => {
        if (typeof tag === "string" && tag.trim()) {
          tagSet.add(tag.trim());
        }
      });
    });

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [availableSections]);

  const availableDifficulties = useMemo(() => {
    const defaultDifficulties = ["Easy", "Medium", "Hard"];

    return Array.from(new Set([...defaultDifficulties])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [filterData.difficulties]);

  const visibleTags = useMemo(() => {
    if (filters.sections.length === 0) {
      return availableTags;
    }

    const selectedSectionIds = new Set(filters.sections);

    const tagSet = new Set<string>();

    availableSections
      .filter((section) => selectedSectionIds.has(String(section._id)))
      .forEach((section) => {
        if (!Array.isArray(section.tags)) {
          return;
        }

        section.tags.forEach((tag) => {
          if (typeof tag === "string" && tag.trim()) {
            tagSet.add(tag.trim());
          }
        });
      });

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [availableSections, availableTags, filters.sections]);

  const fetchFilteredQuestions = async () => {
    if (!examId) {
      return;
    }
    if (
      debouncedFilters.questionCount == 0 ||
      !debouncedFilters.questionCount
    ) {
      return;
    }

    try {
      setLoadingFilterQuestions(true);
      setError("");

      const params: Record<string, string | number | undefined> = {
        examId,
        sections:
          debouncedFilters.sections.length > 0
            ? debouncedFilters.sections.join(",")
            : undefined,
        tags:
          debouncedFilters.tags.length > 0
            ? debouncedFilters.tags.join(",")
            : undefined,
        difficulties:
          debouncedFilters.difficulties.length > 0
            ? debouncedFilters.difficulties.join(",")
            : undefined,
        questionPool: debouncedFilters.questionPool,
        questionCount: Number(debouncedFilters.questionCount),
      };

      const response = await api.get<QuestionIdsApiResponse>(
        "/mcu/questions/list",
        {
          params,
        },
      );

      const apiData = response?.data?.data || {};

      const questionIds = Array.isArray(apiData?.questionIds)
        ? apiData.questionIds.filter(Boolean).map(String)
        : [];

      const count = Number(apiData?.count || 0);

      setFilteredQuestionIds(questionIds);

      setAvailableCount(count);

      if (count === 0) {
        setError("No questions match your selected filters.");
      }
    } catch (error: any) {
      console.error("Fetch question IDs error:", error);

      setFilteredQuestionIds([]);
      setAvailableCount(0);

      setError(error?.response?.data?.message || "Failed to fetch questions.");
    } finally {
      setLoadingFilterQuestions(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || !examId) {
      return;
    }

    fetchFilteredQuestions();
  }, [
    step,
    examId,
    debouncedFilters.sections,
    debouncedFilters.tags,
    debouncedFilters.difficulties,
    debouncedFilters.questionPool,
    debouncedFilters.questionCount,
  ]);

  const toggleFilter = (
    key: "sections" | "tags" | "difficulties",
    value: string,
  ) => {
    setError("");

    setFilters((previous) => {
      const current = previous[key];
      const exists = current.includes(value);

      // Section: only one selection
      if (key === "sections") {
        return {
          ...previous,
          sections: exists ? [] : [value],
          tags: [], // Reset tags whenever section changes
        };
      }

      // Difficulty: only one selection
      if (key === "difficulties") {
        return {
          ...previous,
          difficulties: exists ? [] : [value],
        };
      }

      // Tags: multiple selection
      return {
        ...previous,
        tags: exists
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const setQuestionPool = (value: FilterState["questionPool"]) => {
    setError("");

    setFilters((previous) => ({
      ...previous,
      questionPool: value,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();

    if (!tag) {
      return;
    }

    const matchingTag = availableTags.find(
      (item) => item.toLowerCase() === tag.toLowerCase(),
    );

    if (matchingTag && !filters.tags.includes(matchingTag)) {
      setFilters((previous) => ({
        ...previous,
        tags: [...previous.tags, matchingTag],
      }));
    }

    setTagInput("");
  };

  const clearFilters = () => {
    setFilters({
      sections: [],
      tags: [],
      difficulties: [],
      questionPool: "answered_unanswered",
    });

    setQuestionCount(10);

    setFilteredQuestionIds([]);

    setAvailableCount(0);

    setError("");
  };

  useEffect(() => {
    if (availableSections.length > 0 && filters.sections.length === 0) {
      setFilters((previous) => ({
        ...previous,
        sections: [availableSections[0]._id],
        tags: [],
      }));
    }
  }, [availableSections]);

  const validateStep = () => {
    setError("");

    if (step === 2) {
      if (loadingFilterQuestions) {
        setError("Please wait while questions are being loaded.");

        return false;
      }

      if (availableCount <= 0 || filteredQuestionIds.length === 0) {
        setError("No questions are available for the selected filters.");

        return false;
      }

      if (questionCount > 0 && filteredQuestionIds.length < questionCount) {
        setError(
          `Only ${filteredQuestionIds.length} questions are available for the selected filters.`,
        );

        return false;
      }
    }

    return true;
  };

  /* =========================================================
     CREATE CUSTOM TEST
  ========================================================= */

  const handleCreate = async () => {
    if (!validateStep()) return;
    if (loadingStep) return;

    try {
      setError("");
      setLoadingStep("creating");

      const payload = {
        exam: examId,

        title: title.trim() || "Custom SAT Practice Test",

        description: description.trim(),

        testType,

        selectionMode: "filters",

        durationMinutes: Number(durationMinutes),

        questionIds: filteredQuestionIds,

        filters: {
          sections: filters.sections,
          tags: filters.tags,
          difficulties: filters.difficulties,
          questionPool: filters.questionPool,
          questionCount: Number(questionCount),
        },
      };

      // -----------------------------
      // STEP 1: CREATE CUSTOM TEST
      // -----------------------------
      const response = await api.post("/mcu/custom", payload);

      if (!response?.data?.success) {
        throw new Error(
          response?.data?.message || "Failed to create custom test.",
        );
      }

      const customTest = response?.data?.data;

      if (!customTest?._id) {
        throw new Error("Custom test was created but no test ID was returned.");
      }

      // -----------------------------
      // STEP 2: START CUSTOM TEST
      // -----------------------------
      setLoadingStep("loading");

      const startres = await api.post(`/mcu/custom/${customTest._id}/start`);

      if (!startres?.data?.success) {
        throw new Error(
          startres?.data?.message || "Failed to start custom test.",
        );
      }

      const startTest = startres?.data?.data;

      if (!startTest?._id) {
        throw new Error("Test started but no test ID was returned.");
      }

      // -----------------------------
      // SUCCESS
      // -----------------------------
      window.location.href = `/mcq/tests/${startTest._id}?type=custom`;

      return customTest;
    } catch (error) {
      console.error("Create custom test error:", error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create custom test.",
      );
      setLoadingStep(null);
    } finally {
      setShowInstructions(false);
    }
  };

  const previousStep = () => {
    setError("");

    setStep(1);
  };

  const resetBuilder = () => {
    setTitle("");
    setDescription("");

    setTestType("quiz");

    setDurationMinutes(30);

    setFilters({
      sections: [],
      tags: [],
      difficulties: [],
      questionPool: "answered_unanswered",
    });

    setQuestionCount(10);

    setFilteredQuestionIds([]);

    setAvailableCount(0);

    setStep(1);

    setError("");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl rounded-3xl  p-4 sm:p-6">
        <div className="bg-white p-5 rounded-2xl mb-6">
          <div className="mb-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">
                Create Custom Test
              </h1>

              <p className="mt-px max-w-2xl text-sm text-black md:text-base">
                Build your own practice test by selecting filters and generating
                your question pool.
              </p>
            </div>

            <button
              type="button"
              onClick={resetBuilder}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-black hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
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

                  {index < 1 && (
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
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600 dark:border-red-900/50 dark:bg-red-500/10">
            <X size={18} className="mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="mx-auto rounded-2xl  bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Test Details
              </h2>

              <p className="mt-px text-sm text-black">
                Review instructions & set your duration
              </p>
            </div>

            <StepOneSATDetails
              category={user.category}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
            />

            <div className="pt-6 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 font-semibold text-white   hover:bg-orange-600"
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
              <FilterSelection
                sections={availableSections}
                difficulties={availableDifficulties}
                tags={visibleTags}
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
                loading={loadingFilterQuestions || loadingFilters}
              />

              <div className="h-fit rounded-2xl bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-20">
                <div className="mb-3">
                  <h3 className="font-bold text-lg">Selected Questions</h3>

                  <p className="mt-px text-sm text-black">
                    Questions matching your selected filters.
                  </p>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-2xl bg-orange-50 p-3 dark:bg-orange-500/10">
                  <div className="text-sm font-medium text-black">
                    Total Questions
                  </div>

                  <div className="text-2xl font-black text-orange-600">
                    {availableCount}
                  </div>
                </div>

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
                      {filteredQuestionIds.map((id, index) => (
                        <div
                          key={id}
                          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full dark:bg-slate-800"
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
                  <div className="flex justify-between text-sm">
                    <span className="text-black">Requested</span>

                    <span className="font-bold">
                      {questionCount === 0 ? "No Limit" : questionCount}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-black">Available</span>

                    <span className="font-bold text-orange-600">
                      {availableCount}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-black">Selected</span>

                    <span className="font-bold text-orange-600">
                      {filteredQuestionIds.length}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex justify-between">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  {/* CREATE DIRECTLY - NO REVIEW STEP */}

                  <button
                    type="button"
                    onClick={() => {
                      setShowInstructions(true);
                    }}
                    disabled={
                      creating ||
                      loadingFilterQuestions ||
                      filteredQuestionIds.length === 0 ||
                      availableCount === 0 ||
                      (questionCount > 0 &&
                        filteredQuestionIds.length < questionCount)
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 font-semibold text-white  hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}

                    {creating ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {
        <CustomTestInstructionPopup
          isOpen={showInstructions}
          onClose={() => {
            if (!loadingStep) {
              setShowInstructions(false);
            }
          }}
          onStartTest={handleCreate}
          loadingStep={loadingStep}
        />
      }
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
}: {
  sections: FilterSection[];
  difficulties: string[];
  tags: string[];
  filters: FilterState;

  toggleFilter: (
    key: "sections" | "tags" | "difficulties",
    value: string,
  ) => void;

  setQuestionPool: (value: FilterState["questionPool"]) => void;

  clearFilters: () => void;

  questionCount: number;

  setQuestionCount: (value: number) => void;

  tagInput: string;

  setTagInput: (value: string) => void;

  addTag: () => void;

  availableCount: number;

  loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4  dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:p-6">
      {/* =================================================
      HEADER
  ================================================= */}
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white md:text-2xl">
            Question Filters
          </h2>

          <p className="mt-1 text-xs text-black sm:text-sm">
            Select filters to automatically generate your question pool.
          </p>
        </div>

        {loading && (
          <Loader2
            size={20}
            className="shrink-0 animate-spin text-orange-500"
          />
        )}
      </div>

      {/* =================================================
      NUMBER OF QUESTIONS
  ================================================= */}
      <div className="mb-4 rounded-xl  bg-orange-50/70 p-4 dark:border-orange-900/40 dark:bg-orange-500/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Number of Questions
            </h3>

            <p className="mt-1 text-xs text-black">
              {availableCount} questions match your filters.
            </p>
          </div>

          {/* KEEPING YOUR EXISTING LOGIC */}
          <div className="w-full sm:w-40">
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="
            w-full
            appearance-none
            rounded-lg
            border
            border-orange-200
            bg-white
            px-3
            py-2.5
            text-sm
            font-bold
            text-black
            outline-none
            transition
            focus:border-orange-500
            focus:ring-2
            focus:ring-orange-500/10
            dark:border-orange-900
            dark:bg-slate-900
            dark:text-white
          "
            >
              <option value={0}>No Limit</option>

              {Array.from(
                {
                  length: 12,
                },
                (_, index) => {
                  const count = (index + 1) * 5;

                  return (
                    <option key={count} value={count}>
                      {count} questions
                    </option>
                  );
                },
              )}
            </select>
          </div>
        </div>
      </div>

      {/* =================================================
      FILTER SECTIONS
  ================================================= */}
      <div className="space-y-3">
        {/* =================================================
        SECTIONS
    ================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-lg font-bold text-slate-900 dark:text-white">
              Sections
            </label>

            {filters.sections.length > 0 && (
              <span className="text-sm font-medium text-orange-500">
                {filters.sections.length} selected
              </span>
            )}
          </div>

          {sections.length === 0 ? (
            <p className="text-sm text-slate-400">No sections available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const value = String(section._id);
                const active = filters.sections.includes(value);

                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleFilter("sections", value)}
                    className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  transition-all
                  duration-200
                  ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white "
                      : "border-slate-200 bg-white text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-orange-500"
                  }
                `}
                  >
                    {section.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* =================================================
        SUBJECTS / TAGS
    ================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <label className="text-lg font-bold text-black dark:text-white">
                Subjects
              </label>

              <p className="mt-0.5 text-[11px] text-black">
                Select one or more subjects
              </p>
            </div>

            {filters.tags.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  filters.tags.forEach((tag) => toggleFilter("tags", tag));
                }}
                className="
          text-sm
          font-semibold
          text-orange-500
          transition
          hover:text-orange-600
        "
              >
                Clear All
              </button>
            )}
          </div>

          {/* Selected count */}
          <div className="mb-3 flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-500/10">
            <span className="text-base font-medium text-black dark:text-slate-400">
              Selected Subjects
            </span>

            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {filters.tags.length}
            </span>
          </div>

          {/* Subjects */}
          {tags.length > 0 ? (
            <div className="max-h-44 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tags.map((tag) => {
                  const checked = filters.tags.includes(tag);

                  return (
                    <label
                      key={tag}
                      className={`
                group
                flex
                cursor-pointer
                items-center
                gap-3
                rounded-lg
                border
                px-3
                py-2.5
                transition-all
                duration-200
                ${
                  checked
                    ? `
                      border-orange-300
                      bg-orange-50
                      dark:border-orange-500/40
                      dark:bg-orange-500/10
                    `
                    : `
                      border-slate-200
                      bg-white
                      hover:border-orange-200
                      hover:bg-orange-50/50
                      dark:border-slate-700
                      dark:bg-slate-800
                      dark:hover:border-orange-500/40
                    `
                }
              `}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFilter("tags", tag)}
                        className="
                  h-4
                  w-4
                  shrink-0
                  cursor-pointer
                  rounded
                  border-slate-300
                  text-orange-500
                  accent-orange-500
                  focus:ring-orange-500
                  dark:border-slate-600
                "
                      />

                      {/* Subject name */}
                      <span
                        className={`
                  min-w-0
                  truncate
                  text-sm
                  font-medium
                  ${
                    checked
                      ? "font-semibold text-orange-600 dark:text-orange-400"
                      : "text-black dark:text-slate-300"
                  }
                `}
                        title={tag}
                      >
                        {tag}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 dark:border-slate-700">
              <p className="text-sm text-slate-400">No subjects available.</p>
            </div>
          )}
        </div>

        {/* =================================================
        DIFFICULTY
    ================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-lg font-bold text-black dark:text-white">
              Difficulty
            </label>

            {filters.difficulties.length > 0 && (
              <span className="text-sm font-medium text-orange-500">
                {filters.difficulties.length} selected
              </span>
            )}
          </div>

          <FilterGroup
            title=""
            values={difficulties}
            selected={filters.difficulties}
            onToggle={(value) => toggleFilter("difficulties", value)}
          />
        </div>

        {/* =================================================
        QUESTION POOL
    ================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <label className="mb-3 block text-lg font-bold text-black dark:text-white">
            Question Pool
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                  onClick={() =>
                    setQuestionPool(item.value as FilterState["questionPool"])
                  }
                  className={`
                rounded-lg
                border
                px-3
                py-2.5
                text-sm
                font-semibold
                transition-all
                duration-200
                ${
                  active
                    ? "border-orange-500 bg-orange-500 text-white "
                    : "border-slate-200 bg-white text-black hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }
              `}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================
      FOOTER
  ================================================= */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="text-sm text-black">
          {availableCount} questions available
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="
        inline-flex
        items-center
        gap-1.5
        rounded-lg
        px-3
        py-2
        text-sm
        font-semibold
        text-black
        transition
        hover:bg-orange-50
        hover:text-orange-600
        dark:hover:bg-orange-500/10
      "
        >
          <RotateCcw size={14} />
          Clear Filters
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER GROUP
========================================================= */

function FilterGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-sm font-bold">{title}</label>

      {values.length === 0 ? (
        <p className="text-sm text-slate-400">No options available.</p>
      ) : (
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {values.map((value) => {
            const active = selected.includes(value);

            return (
              <button
                type="button"
                key={value}
                onClick={() => onToggle(value)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-semibold capitalize transition ${
                  active
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-slate-200 bg-white text-black hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
