// TestSeriesManagementPage.tsx
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  Tag,
  IndianRupee,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Package,
  Calendar,
  Check,
  X as XIcon,
} from "lucide-react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

interface Exam {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface TestTemplate {
  _id: string;
  title: string;
  description?: string;
  testType: string;
  totalQuestions?: number;
  totalDurationMinutes?: number;
  pricing?: {
    isFree: boolean;
    price: number;
    salePrice?: number;
  };
}

interface SeriesTestItem {
  test: string; // TestTemplate ID
  isMandatory: boolean;
  label?: string;
  accessDays?: number;
}

interface SeriesPricing {
  isFree: boolean;
  price: number;
  salePrice?: number;
  currency: string;
}

interface TestSeries {
  _id: string;
  title: string;
  description?: string;
  exam: { _id: string; name: string };
  category: { _id: string; name: string };
  defaultTestType: "full_length" | "sectional" | "quiz" | "mixed";
  tests: SeriesTestItem[];
  testsData?: TestTemplate[];
  totalTests: number;
  pricing: SeriesPricing;
  isActive: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TestSeriesFormValues {
  title: string;
  description: string;
  exam: string;
  category: string;
  defaultTestType: "full_length" | "sectional" | "quiz" | "mixed";
  tests: SeriesTestItem[];
  pricingIsFree: boolean;
  pricingPrice: number;
  pricingSalePrice?: number;
  isActive: boolean;
  isPublished: boolean;
}

const DEFAULT_TEST_TYPE_OPTIONS = [
  { value: "full_length", label: "Full Length" },
  { value: "sectional", label: "Sectional" },
  { value: "quiz", label: "Quiz" },
  { value: "mixed", label: "Mixed" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

const PUBLISH_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

export default function TestSeriesManagementPage() {
  // State
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTests, setAvailableTests] = useState<TestTemplate[]>([]);
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);

  const [filters, setFilters] = useState({
    search: "",
    examId: "",
    categoryId: "",
    status: "",
    publishStatus: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSeries, setTotalSeries] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Form
  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TestSeriesFormValues>({
    defaultValues: {
      title: "",
      description: "",
      exam: "",
      category: "",
      defaultTestType: "mixed",
      tests: [],
      pricingIsFree: false,
      pricingPrice: 0,
      pricingSalePrice: 0,
      isActive: true,
      isPublished: false,
    },
  });

  const { fields: testFields, append, remove } = useFieldArray({
    control,
    name: "tests",
  });

  const watchExam = watch("exam");
  const watchCategory = watch("category");
  const watchTests = watch("tests");
  const watchPricingIsFree = watch("pricingIsFree");
  const watchIsActive = watch("isActive");
  const watchIsPublished = watch("isPublished");

  // Fetch data functions
  const fetchExams = async () => {
    try {
      const res = await api.get("/test/exams", { params: { isActive: true, limit: 200, category: watchCategory || filters.categoryId, method: "true" } });
      if (res.data?.success) {
        setExams(res.data.data || res.data?.data?.data || []);
      } else {
        setExams([]);
      }
    } catch (err: any) {
      console.error("Fetch exams error:", err);
      toast.error("Failed to load exams");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories", { params: { isActive: true, limit: 200 } });
      if (res.data?.success) {
        setCategories(res.data.data || res.data?.data?.data || []);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error("Fetch categories error:", err);
      toast.error("Failed to load categories");
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const res = await api.get("/mcu/test", { params: { isActive: true, limit: 200 } });
      if (res.data?.success) {
        setAvailableTests(res.data.data || res.data?.data?.data || []);
      } else {
        setAvailableTests([]);
      }
    } catch (err: any) {
      console.error("Fetch tests error:", err);
      toast.error("Failed to load available tests");
    }
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        limit,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.examId !== "all") params.examId = filters.examId;
      if (filters.categoryId !== "all") params.categoryId = filters.categoryId;
      if (filters.status !== "all") params.isActive = filters.status === "active";
      if (filters.publishStatus !== "all") params.isPublished = filters.publishStatus === "published";

      const res = await api.get("/mcu/series/admin", { params });

      if (res.data?.success) {
        const data = res.data.data || res.data?.data?.data || [];
        setSeriesList(data);

        const pagination = res.data.pagination || res.data?.data?.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalSeries(pagination.total || data.length);
        } else {
          setTotalPages(1);
          setTotalSeries(data.length);
        }
      } else {
        setSeriesList([]);
        setTotalPages(1);
        setTotalSeries(0);
        setError("Failed to load test series");
      }
    } catch (err: any) {
      console.error("Fetch series error:", err);
      setError(err.response?.data?.message || "Failed to load test series");
      toast.error(err.response?.data?.message || "Failed to load test series");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filters.categoryId || watchCategory) {
      fetchExams();
    }
  }, [filters.categoryId, watchCategory]);

  // Initial data fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (watchExam) {
      fetchAvailableTests();
    }
  }, [])

  // Fetch series when filters change
  useEffect(() => {
    fetchSeries();
  }, [page, limit, debouncedSearch, filters]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeoutId = setTimeout(() => setDebouncedSearch(filters.search), 600);
    setSearchTimeout(timeoutId);
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      examId: "",
      categoryId: "",
      status: "",
      publishStatus: "",
    });
    setDebouncedSearch("");
    setPage(1);
  };

  // Open create drawer
  const openCreateDrawer = () => {
    setEditingId(null);
    reset({
      title: "",
      description: "",
      exam: "",
      category: "",
      defaultTestType: "mixed",
      tests: [],
      pricingIsFree: false,
      pricingPrice: 0,
      pricingSalePrice: 0,
      isActive: true,
      isPublished: false,
    });
    setSideOpen(true);
  };

  // Open edit drawer
  const openEditDrawer = async (id: string) => {
    try {
      setSideOpen(true);
      setEditingId(id);
      setFormLoading(true);

      const res = await api.get(`/mcu/series/${id}`);
      if (!res.data?.success) {
        throw new Error("Failed to load test series");
      }

      const series: TestSeries = res.data.data;
      reset({
        title: series.title,
        description: series.description || "",
        exam: series.exam?._id || "",
        category: series.category?._id || "",
        defaultTestType: series.defaultTestType,
        tests: series.tests || [],
        pricingIsFree: series.pricing?.isFree || false,
        pricingPrice: series.pricing?.price || 0,
        pricingSalePrice: series.pricing?.salePrice || 0,
        isActive: series.isActive,
        isPublished: series.isPublished,
      });
    } catch (err: any) {
      console.error("Load series detail error:", err);
      toast.error(err.message || "Failed to load test series");
      setSideOpen(false);
      setEditingId(null);
    } finally {
      setFormLoading(false);
    }
  };

  // Close drawer
  const closeDrawer = () => {
    if (saving) return;
    setSideOpen(false);
    setEditingId(null);
  };

  // Format date
  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-IN") : "";

  // Handle form submission
  const onSubmit = async (values: TestSeriesFormValues) => {
    try {
      // Validation
      if (!values.title.trim()) {
        toast.error("Title is required");
        return;
      }
      if (!values.exam) {
        toast.error("Please select an exam");
        return;
      }
      if (!values.category) {
        toast.error("Please select a category");
        return;
      }
      if (!values.pricingIsFree && values.pricingPrice <= 0) {
        toast.error("Price must be greater than 0 for paid series");
        return;
      }
      if (values.tests.length === 0) {
        toast.error("Please add at least one test to the series");
        return;
      }

      setSaving(true);

      // Prepare payload
      const payload: any = {
        title: values.title,
        description: values.description || "",
        exam: values.exam,
        category: values.category,
        defaultTestType: values.defaultTestType,
        tests: values.tests,
        pricing: {
          isFree: values.pricingIsFree,
          price: values.pricingIsFree ? 0 : Number(values.pricingPrice),
          salePrice: values.pricingIsFree ? undefined : (values.pricingSalePrice ? Number(values.pricingSalePrice) : undefined),
          currency: "INR",
        },
        isActive: values.isActive,
        isPublished: values.isPublished,
      };

      if (editingId) {
        await api.put(`/mcu/series/${editingId}`, payload);
        toast.success("Test series updated successfully");
      } else {
        await api.post("/mcu/series", payload);
        toast.success("Test series created successfully");
      }

      closeDrawer();
      fetchSeries();
    } catch (err: any) {
      console.error("Save series error:", err);
      toast.error(err.response?.data?.message || "Failed to save test series");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (series: TestSeries) => {
    if (!window.confirm(`Delete test series "${series.title}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/mcu/series/${series._id}`);
      toast.success("Test series deleted");
      fetchSeries();
    } catch (err: any) {
      console.error("Delete series error:", err);
      toast.error(err.response?.data?.message || "Failed to delete test series");
    }
  };

  // Toggle publish status
  const togglePublish = async (series: TestSeries) => {
    try {
      const res = await api.patch(`/mcu/series/${series._id}/toggle`);
      if (res.data?.success) {
        toast.success(`Series ${res.data.isPublished ? 'published' : 'unpublished'}`);
        fetchSeries();
      }
    } catch (err: any) {
      console.error("Toggle publish error:", err);
      toast.error(err.response?.data?.message || "Failed to toggle publish status");
    }
  };

  // Toggle active status
  const toggleActive = async (series: TestSeries) => {
    try {
      await api.put(`/mcu/series/${series._id}`, { isActive: !series.isActive });
      toast.success(`Series ${!series.isActive ? 'activated' : 'deactivated'}`);
      fetchSeries();
    } catch (err: any) {
      console.error("Toggle active error:", err);
      toast.error(err.response?.data?.message || "Failed to toggle active status");
    }
  };

  // Add test to series
  const addTestToSeries = (testId: string) => {
    const existing = watchTests.find(t => t.test === testId);
    if (existing) {
      toast.info("Test already added to series");
      return;
    }

    const test = availableTests.find(t => t._id === testId);
    if (test) {
      append({
        test: testId,
        isMandatory: true,
        label: test.title,
        accessDays: 365, // Default 1 year access
      });
      setTestModalOpen(false);
    }
  };

  // Remove test from series
  const removeTestFromSeries = (index: number) => {
    remove(index);
  };

  // Update test in series
  const updateTestInSeries = (index: number, updates: Partial<SeriesTestItem>) => {
    const currentTests = [...watchTests];
    currentTests[index] = { ...currentTests[index], ...updates };
    setValue("tests", currentTests);
  };

  // Get test details by ID
  const getTestDetails = (testId: string) => {
    return availableTests.find(t => t._id === testId);
  };

  // Price label
  const priceLabel = (series: TestSeries) => {
    if (series.pricing.isFree) return "Free";
    if (series.pricing.salePrice && series.pricing.salePrice > 0) {
      return `₹${series.pricing.salePrice} (₹${series.pricing.price})`;
    }
    return `₹${series.pricing.price}`;
  };

  return (
    <>
      <div className="relative">
        {/* Filters Section */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/60">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                Clear filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openCreateDrawer}
              >
                <Plus className="h-4 w-4" />
                New Series
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by title or description"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <Select
                defaultValue={filters.categoryId}
                options={[
                  ...categories.map((c) => ({ value: c._id, label: c.name })),
                ]}
                onChange={(value: string) => {
                  setFilters(prev => ({ ...prev, categoryId: value }));
                  setPage(1);
                }}
              />
            </div>

            <div>
              <Select
                defaultValue={filters.examId}
                options={[
                  ...exams.map((e) => ({ value: e._id, label: e.name })),
                ]}
                onChange={(value: string) => {
                  setFilters(prev => ({ ...prev, examId: value }));
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Select
                defaultValue={filters.status}
                options={STATUS_OPTIONS}
                onChange={(value: string) => {
                  setFilters(prev => ({ ...prev, status: value }));
                  setPage(1);
                }}
              />
            </div>

            <div>
              <Select
                defaultValue={filters.publishStatus}
                options={PUBLISH_OPTIONS}
                onChange={(value: string) => {
                  setFilters(prev => ({ ...prev, publishStatus: value }));
                  setPage(1);
                }}
              />
            </div>

            <div>
              <Select
                options={LIMIT_OPTIONS.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
                defaultValue={limit.toString()}
                onChange={(value: string) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              Showing page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> •{" "}
              <span className="font-semibold">{totalSeries}</span> series
            </div>
          </div>
        </div>

        {/* Series List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading test series...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="col-span-full rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && seriesList.length === 0 && (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              No test series found. Try changing filters or create a new one.
            </div>
          )}

          {!loading && !error && seriesList.map((series) => (
            <motion.div
              key={series._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {series.title}
                    </h3>
                    {series.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                        {series.description}
                      </p>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col gap-1">
                    {series.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <Globe className="h-3 w-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <Lock className="h-3 w-3" />
                        Draft
                      </span>
                    )}

                    {series.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <XIcon className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {series.exam?.name || "Unknown exam"}
                  </span>

                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {series.category?.name || "Unknown category"}
                  </span>

                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                    <Package className="mr-1 inline h-3 w-3" />
                    {series.totalTests || 0} Tests
                  </span>

                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <IndianRupee className="mr-1 inline h-3 w-3" />
                    {priceLabel(series)}
                  </span>
                </div>

                {/* Test Types */}
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Type:</span>{" "}
                  {DEFAULT_TEST_TYPE_OPTIONS.find(t => t.value === series.defaultTestType)?.label || series.defaultTestType}
                </div>

                {/* Created Date */}
                {series.createdAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3" />
                    Created: {formatDate(series.createdAt)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl px-2 py-1 text-xs"
                    onClick={() => openEditDrawer(series._id)}
                  >
                    <Edit3 className="mr-1 h-3 w-3" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl px-2 py-1 text-xs"
                    onClick={() => togglePublish(series)}
                  >
                    {series.isPublished ? (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        Publish
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl px-2 py-1 text-xs"
                    onClick={() => toggleActive(series)}
                  >
                    {series.isActive ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl px-2 py-1 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(series)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{page}</span>{" "}
              of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Drawer */}
      <AnimatePresence>
        {sideOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={saving ? undefined : closeDrawer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Panel */}
            <motion.div
              className="relative ml-auto flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <div>
                  <p className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {editingId ? "Edit Test Series" : "Create Test Series"}
                    <Package className="h-3 w-3 text-gray-400" />
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Configure test bundle with multiple tests.
                  </p>
                </div>
                <button
                  onClick={saving ? undefined : closeDrawer}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {formLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading series details...
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
                >
                  {/* Basic Info */}
                  <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        type="text"
                        placeholder="GMAT Complete Practice Bundle"
                        value={watch("title")}
                        onChange={(e) => setValue("title", e.target.value)}
                        error={!!errors.title}
                        hint={errors.title?.message}
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <textarea
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        placeholder="Describe this test series bundle..."
                        value={watch("description")}
                        onChange={(e) => setValue("description", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label>Category *</Label>
                        <Select
                          defaultValue={watchCategory || ""}
                          options={[
                            ...categories.map((c) => ({ value: c._id, label: c.name })),
                          ]}
                          onChange={(value: string) => setValue("category", value)}
                        />
                        {errors.category && (
                          <p className="mt-1 text-xs text-red-500">Category is required</p>
                        )}
                      </div>
                      <div>
                        <Label>Exam *</Label>
                        <Select
                          defaultValue={watchExam || ""}
                          options={[
                            ...exams.map((e) => ({ value: e._id, label: e.name })),
                          ]}
                          onChange={(value: string) => setValue("exam", value)}
                        />
                        {errors.exam && (
                          <p className="mt-1 text-xs text-red-500">Exam is required</p>
                        )}
                      </div>


                    </div>

                    <div>
                      <Label>Default Test Type</Label>
                      <Select
                        defaultValue={watch("defaultTestType")}
                        options={DEFAULT_TEST_TYPE_OPTIONS}
                        onChange={(value: any) =>
                          setValue("defaultTestType", value as TestSeriesFormValues["defaultTestType"])
                        }
                      />
                    </div>
                  </div>

                  {/* Tests in Series */}
                  <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <Label>Tests in this Series *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTestModalOpen(true)}
                        className="text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Test
                      </Button>
                    </div>

                    {watchTests.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No tests added yet. Click "Add Test" to select from available tests.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {watchTests.map((testItem, index) => {
                          const testDetails = getTestDetails(testItem.test);
                          return (
                            <div
                              key={index}
                              className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {testItem.label || testDetails?.title || "Unknown Test"}
                                    </h4>
                                    {testDetails?.pricing?.isFree && (
                                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                        Free
                                      </span>
                                    )}
                                  </div>

                                  {testDetails && (
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{testDetails.testType}</span>
                                      {testDetails.totalQuestions && (
                                        <span>• {testDetails.totalQuestions} Q</span>
                                      )}
                                      {testDetails.totalDurationMinutes && (
                                        <span>• {testDetails.totalDurationMinutes} min</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeTestFromSeries(index)}
                                  className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <label className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={testItem.isMandatory}
                                    onChange={(e) =>
                                      updateTestInSeries(index, { isMandatory: e.target.checked })
                                    }
                                    className="h-3 w-3"
                                  />
                                  <span>Mandatory</span>
                                </label>

                                <div>
                                  <Label className="text-xs">Label</Label>
                                  <Input
                                    type="text"
                                    size="sm"
                                    placeholder="Optional custom label"
                                    value={testItem.label || ""}
                                    onChange={(e) =>
                                      updateTestInSeries(index, { label: e.target.value })
                                    }
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Access Days</Label>
                                  <Input
                                    type="number"
                                    size="sm"
                                    placeholder="365"
                                    value={testItem.accessDays || ""}
                                    onChange={(e) =>
                                      updateTestInSeries(index, {
                                        accessDays: e.target.value ? parseInt(e.target.value) : undefined
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total: {watchTests.length} test{watchTests.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                    <Label>Pricing</Label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={watchPricingIsFree}
                          onChange={(e) => setValue("pricingIsFree", e.target.checked)}
                          className="h-4 w-4"
                        />
                        Free Series
                      </label>
                    </div>

                    {!watchPricingIsFree && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Price (INR) *</Label>
                          <Input
                            type="number"
                            value={watch("pricingPrice")}
                            onChange={(e) => setValue("pricingPrice", parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <Label>Sale Price (INR)</Label>
                          <Input
                            type="number"
                            value={watch("pricingSalePrice") || ""}
                            onChange={(e) => setValue("pricingSalePrice", parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                    <Label>Status</Label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={watchIsActive}
                          onChange={(e) => setValue("isActive", e.target.checked)}
                          className="h-4 w-4"
                        />
                        Active
                      </label>

                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={watchIsPublished}
                          onChange={(e) => setValue("isPublished", e.target.checked)}
                          className="h-4 w-4"
                        />
                        Published
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="sticky bottom-0 mt-2 flex justify-end gap-2 border-t border-gray-200 bg-white py-3 dark:border-gray-800 dark:bg-gray-900">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={closeDrawer}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} isLoading={saving}>
                      {editingId ? "Save Changes" : "Create Series"}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Selection Modal */}
      <AnimatePresence>
        {testModalOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setTestModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Select Tests for Series
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose from available tests to add to this series
                  </p>
                </div>
                <button
                  onClick={() => setTestModalOpen(false)}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Filter */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Tests List */}
              <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800">
                {availableTests.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No tests available.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {availableTests.map((test) => {
                      const alreadyAdded = watchTests.some(t => t.test === test._id);
                      return (
                        <div
                          key={test._id}
                          className={`flex items-center justify-between p-3 ${alreadyAdded ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {test.title}
                              </h4>
                              {test.pricing?.isFree && (
                                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                  Free
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                                {test.testType}
                              </span>
                              {test.totalQuestions && (
                                <span>{test.totalQuestions} Q</span>
                              )}
                              {test.totalDurationMinutes && (
                                <span>{test.totalDurationMinutes} min</span>
                              )}
                              {test.pricing && !test.pricing.isFree && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  ₹{test.pricing.salePrice || test.pricing.price}
                                </span>
                              )}
                            </div>

                            {test.description && (
                              <p className="mt-1 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                                {test.description}
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            disabled={alreadyAdded}
                            onClick={() => addTestToSeries(test._id)}
                            className="ml-2"
                          >
                            {alreadyAdded ? "Added" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}