// IeltsTestManagementPage.tsx
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  Filter,
  Calendar,
  Award,
  Layers,
  Clock,
  Eye,
  Star,
  DollarSign,
  FileText,
  CheckCircle2,
  Archive,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "../../components/ui/modal";

interface IeltsTest {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  instructions?: string;
  category?: any;
  testType: string;
  difficulty: string;
  sections: Array<{
    section: string;
    order: number;
    duration: number;
    questionCount: number;
    groups: Array<{
      group: any;
      order: number;
      _id: string;
    }>;
    _id: string;
  }>;
  totalQuestions: number;
  duration: number;
  pricing: {
    isFree: boolean;
    currency: string;
    regularPrice: number;
    salePrice: number;
    discount: number;
  };
  settings: {
    randomizeQuestions: boolean;
    showTimer: boolean;
  };
  scoring: {
    passingBand: number | null;
  };
  status: string;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface QuestionGroup {
  _id: string;
  name?: string;
  title?: string;
  passageTitle?: string;
  passage?: {
    _id: string;
    title?: string;
  };
  section?: string;
  questionType?: string;
  questionCount?: number;
  questions?: Array<any>;
  isActive?: boolean;
  createdAt?: string;
}

interface TestFormValues {
  title: string;
  slug: string;
  description: string;
  instructions: string;
  category: string;
  testType: string;
  difficulty: string;
  sections: Array<{
    section: string;
    order: number;
    duration: number;
    questionCount: number;
    groups: Array<{
      group: string;
      order: number;
    }>;
  }>;
  totalQuestions: number;
  duration: number;
  isFree: boolean;
  currency: string;
  regularPrice: number;
  salePrice: number;
  discount: number;
  randomizeQuestions: boolean;
  showTimer: boolean;
  passingBand: number | null;
  status: string;
  isFeatured: boolean;
}

const TEST_TYPE_OPTIONS = [
  { value: "full_length", label: "Full Length Test" },
  { value: "sectional", label: "Sectional Test" },
  { value: "mini_test", label: "Mini Test" },
  { value: "practice", label: "Practice Test" },
  { value: "quiz", label: "Quiz" },
  { value: "mock", label: "Mock Test" },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
  { value: "Mixed", label: "Mixed" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const SECTION_OPTIONS = [
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "writing", label: "Writing" },
  { value: "speaking", label: "Speaking" },
];

const LIMIT_OPTIONS = [
  { value: 10, label: "10 per page" },
  { value: 20, label: "20 per page" },
  { value: 50, label: "50 per page" },
  { value: 100, label: "100 per page" },
];

export default function IeltsTestManagementPage() {
  const [tests, setTests] = useState<IeltsTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<IeltsTest | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewTest, setPreviewTest] = useState<IeltsTest | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Group selection states
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupModalSection, setGroupModalSection] = useState<number | null>(null);
  const [groupFilters, setGroupFilters] = useState({
    search: "",
    section: "all",
    isActive: "true",
  });
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsLimit] = useState(10);
  const [groupsTotalPages, setGroupsTotalPages] = useState(1);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [selectedGroups, setSelectedGroups] = useState<QuestionGroup[]>([]);
  const [groupsSearchTimeout, setGroupsSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [debouncedGroupsSearch, setDebouncedGroupsSearch] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    testType: "all",
    difficulty: "all",
    status: "all",
    isFeatured: "all",
    isFree: "all",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TestFormValues>({
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      instructions: "",
      category: "",
      testType: "",
      difficulty: "Mixed",
      sections: [],
      totalQuestions: 0,
      duration: 0,
      isFree: true,
      currency: "INR",
      regularPrice: 0,
      salePrice: 0,
      discount: 0,
      randomizeQuestions: false,
      showTimer: true,
      passingBand: null,
      status: "draft",
      isFeatured: false,
    },
  });

  const watchTitle = watch("title");
  const watchSlug = watch("slug");
  const watchDescription = watch("description");
  const watchInstructions = watch("instructions");
  const watchTestType = watch("testType");
  const watchDifficulty = watch("difficulty");
  const watchSections = watch("sections");
  const watchTotalQuestions = watch("totalQuestions");
  const watchDuration = watch("duration");
  const watchIsFree = watch("isFree");
  const watchCurrency = watch("currency");
  const watchRegularPrice = watch("regularPrice");
  const watchSalePrice = watch("salePrice");
  const watchDiscount = watch("discount");
  const watchRandomizeQuestions = watch("randomizeQuestions");
  const watchShowTimer = watch("showTimer");
  const watchPassingBand = watch("passingBand");
  const watchStatus = watch("status");
  const watchIsFeatured = watch("isFeatured");

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.testType !== "all") params.testType = filters.testType;
      if (filters.difficulty !== "all") params.difficulty = filters.difficulty;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.isFeatured !== "all") params.isFeatured = filters.isFeatured;
      if (filters.isFree !== "all") params.isFree = filters.isFree;

      const res = await api.get("/ielts/test", { params });

      if (res.data?.success) {
        const data = res.data.data || [];
        setTests(data);
        const pagination = res.data.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalTests(pagination.total || data.length);
        } else {
          setTotalPages(1);
          setTotalTests(data.length);
        }
      } else {
        setTests([]);
        setTotalPages(1);
        setTotalTests(0);
        setError("Failed to load tests");
      }
    } catch (err: any) {
      console.error("Fetch tests error:", err);
      setError(err.response?.data?.message || "Failed to load tests");
      toast.error(err.response?.data?.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [page, limit, debouncedSearch, filters.testType, filters.difficulty, filters.status, filters.isFeatured, filters.isFree]);

  const fetchGroups = useCallback(async () => {
    try {
      setGroupsLoading(true);
      const params: any = {
        page: groupsPage,
        limit: groupsLimit,
      };
      
      if (debouncedGroupsSearch) params.search = debouncedGroupsSearch;
      if (groupFilters.section !== "all") params.section = groupFilters.section;
      if (groupFilters.isActive !== "all") params.isActive = groupFilters.isActive;
      
      const res = await api.get("/ielts/group", { params });
      
      if (res.data?.success) {
        const data = res.data.data || [];
        setGroups(data);
        const pagination = res.data.pagination;
        if (pagination) {
          setGroupsTotalPages(pagination.totalPages || 1);
          setGroupsTotal(pagination.total || data.length);
        } else {
          setGroupsTotalPages(1);
          setGroupsTotal(data.length);
        }
      }
    } catch (err: any) {
      console.error("Fetch groups error:", err);
      toast.error(err.response?.data?.message || "Failed to load question groups");
    } finally {
      setGroupsLoading(false);
    }
  }, [groupsPage, groupsLimit, debouncedGroupsSearch, groupFilters]);

  useEffect(() => {
    if (groupModalOpen) {
      fetchGroups();
    }
  }, [groupModalOpen, fetchGroups]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeoutId = setTimeout(() => setDebouncedSearch(value), 600);
    setSearchTimeout(timeoutId);
  };

  const handleGroupsSearchChange = (value: string) => {
    setGroupFilters((prev) => ({ ...prev, search: value }));
    if (groupsSearchTimeout) {
      clearTimeout(groupsSearchTimeout);
    }
    const timeoutId = setTimeout(() => setDebouncedGroupsSearch(value), 600);
    setGroupsSearchTimeout(timeoutId);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      testType: "all",
      difficulty: "all",
      status: "all",
      isFeatured: "all",
      isFree: "all",
    });
    setDebouncedSearch("");
    setPage(1);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const openCreateDrawer = () => {
    setEditingTest(null);
    reset({
      title: "",
      slug: "",
      description: "",
      instructions: "",
      category: "",
      testType: "",
      difficulty: "Mixed",
      sections: [
        {
          section: "reading",
          order: 1,
          duration: 60,
          questionCount: 0,
          groups: [],
        },
        {
          section: "listening",
          order: 2,
          duration: 30,
          questionCount: 0,
          groups: [],
        },
      ],
      totalQuestions: 0,
      duration: 0,
      isFree: true,
      currency: "INR",
      regularPrice: 0,
      salePrice: 0,
      discount: 0,
      randomizeQuestions: false,
      showTimer: true,
      passingBand: null,
      status: "draft",
      isFeatured: false,
    });
    setSideOpen(true);
  };

  const openEditDrawer = (test: IeltsTest) => {
    setEditingTest(test);
    reset({
      title: test.title,
      slug: test.slug,
      description: test.description || "",
      instructions: test.instructions || "",
      category: test.category?._id || test.category || "",
      testType: test.testType,
      difficulty: test.difficulty,
      sections: test.sections.map((s) => ({
        section: s.section,
        order: s.order,
        duration: s.duration,
        questionCount: s.questionCount,
        groups: s.groups.map((g) => ({
          group: typeof g.group === 'object' ? g.group._id : g.group,
          order: g.order,
        })),
      })),
      totalQuestions: test.totalQuestions,
      duration: test.duration,
      isFree: test.pricing.isFree,
      currency: test.pricing.currency,
      regularPrice: test.pricing.regularPrice,
      salePrice: test.pricing.salePrice,
      discount: test.pricing.discount,
      randomizeQuestions: test.settings.randomizeQuestions,
      showTimer: test.settings.showTimer,
      passingBand: test.scoring.passingBand,
      status: test.status,
      isFeatured: test.isFeatured,
    });
    setSideOpen(true);
  };

  const closeDrawer = () => {
    setSideOpen(false);
    setTimeout(() => {
      setEditingTest(null);
    }, 150);
  };

  const onSubmit = async (values: TestFormValues) => {
    try {
      if (!values.title.trim()) {
        toast.error("Title is required");
        return;
      }
      if (!values.slug.trim()) {
        toast.error("Slug is required");
        return;
      }
      if (!values.testType) {
        toast.error("Test type is required");
        return;
      }

      setSaving(true);

      const payload: any = {
        title: values.title.trim(),
        slug: values.slug.trim().toLowerCase(),
        description: values.description || undefined,
        instructions: values.instructions || undefined,
        category: values.category || null,
        testType: values.testType,
        difficulty: values.difficulty,
        sections: values.sections.map((s) => ({
          section: s.section,
          order: s.order,
          duration: Number(s.duration) || 0,
          questionCount: Number(s.questionCount) || 0,
          groups: s.groups.map((g) => ({
            group: g.group,
            order: g.order,
          })),
        })),
        totalQuestions: Number(values.totalQuestions) || 0,
        duration: Number(values.duration) || 0,
        pricing: {
          isFree: values.isFree,
          currency: values.currency || "INR",
          regularPrice: Number(values.regularPrice) || 0,
          salePrice: Number(values.salePrice) || 0,
          discount: Number(values.discount) || 0,
        },
        settings: {
          randomizeQuestions: values.randomizeQuestions,
          showTimer: values.showTimer,
        },
        scoring: {
          passingBand: values.passingBand || null,
        },
        status: values.status,
        isFeatured: values.isFeatured,
      };

      if (editingTest) {
        await api.put(`/ielts/test/${editingTest._id}`, payload);
        toast.success("Test updated successfully");
      } else {
        await api.post("/ielts/test", payload);
        toast.success("Test created successfully");
      }
      closeDrawer();
      fetchTests();
    } catch (err: any) {
      console.error("Save test error:", err);
      toast.error(err.response?.data?.message || "Failed to save test");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: IeltsTest) => {
    if (!window.confirm(`Are you sure you want to delete "${test.title}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/ielts/test/${test._id}`);
      toast.success("Test deleted successfully");
      fetchTests();
    } catch (err: any) {
      console.error("Delete test error:", err);
      toast.error(err.response?.data?.message || "Failed to delete test");
    }
  };

  const handleStatusChange = async (test: IeltsTest, newStatus: string) => {
    try {
      await api.patch(`/ielts/test/${test._id}/status`, { status: newStatus });
      toast.success(`Test ${newStatus} successfully`);
      fetchTests();
    } catch (err: any) {
      console.error("Update status error:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleToggleFeatured = async (test: IeltsTest) => {
    try {
      await api.patch(`/ielts/test/${test._id}/featured`);
      toast.success(test.isFeatured ? "Removed from featured" : "Marked as featured");
      fetchTests();
    } catch (err: any) {
      console.error("Toggle featured error:", err);
      toast.error(err.response?.data?.message || "Failed to update featured status");
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedTests.length === 0) {
      toast.error("Please select tests first");
      return;
    }
    try {
      await api.patch("/ielts/test/bulk/status", {
        ids: selectedTests,
        status,
      });
      toast.success(`Updated ${selectedTests.length} tests to ${status}`);
      setSelectedTests([]);
      setBulkMode(false);
      fetchTests();
    } catch (err: any) {
      console.error("Bulk update error:", err);
      toast.error(err.response?.data?.message || "Failed to update tests");
    }
  };

  const toggleSelectTest = (id: string) => {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTests.length === tests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map((t) => t._id));
    }
  };

  const openGroupModal = (sectionIndex: number) => {
    setGroupModalSection(sectionIndex);
    setGroupModalOpen(true);
    setGroupsPage(1);
    setDebouncedGroupsSearch("");
    setGroupFilters({
      search: "",
      section: "all",
      isActive: "true",
    });
    setSelectedGroups([]);
  };

  const closeGroupModal = () => {
    setGroupModalOpen(false);
    setGroupModalSection(null);
    setSelectedGroups([]);
  };

  const addGroupsToSection = () => {
    if (groupModalSection === null || selectedGroups.length === 0) return;
    
    const currentSections = watchSections || [];
    const section = currentSections[groupModalSection];
    
    if (!section) return;
    
    const existingGroups = section.groups || [];
    
    // Filter out groups that are already added
    const newGroups = selectedGroups.filter(sg => 
      !existingGroups.some((eg: any) => 
        (typeof eg.group === 'object' ? eg.group._id : eg.group) === sg._id
      )
    );
    
    const groupsToAdd = newGroups.map((g, idx) => ({
      group: g._id,
      order: existingGroups.length + idx + 1,
    }));
    
    const updatedGroups = [...existingGroups, ...groupsToAdd];
    
    setValue(`sections.${groupModalSection}.groups`, updatedGroups);
    
    // Calculate total questions from selected groups
    const totalQuestions = updatedGroups.reduce((sum, g) => {
      const groupData = selectedGroups.find(sg => sg._id === g.group);
      return sum + (groupData?.questionCount || groupData?.questions?.length || 0);
    }, 0);
    
    setValue(`sections.${groupModalSection}.questionCount`, totalQuestions);
    
    closeGroupModal();
    toast.success(`${newGroups.length} group(s) added successfully`);
  };

  const removeGroupFromSection = (sectionIndex: number, groupIndex: number) => {
    const currentSections = watchSections || [];
    const section = currentSections[sectionIndex];
    
    if (!section) return;
    
    const groups = section.groups || [];
    const updatedGroups = groups.filter((_, i) => i !== groupIndex);
    
    // Reorder remaining groups
    const reorderedGroups = updatedGroups.map((g, idx) => ({
      ...g,
      order: idx + 1,
    }));
    
    setValue(`sections.${sectionIndex}.groups`, reorderedGroups);
    
    // Recalculate question count (subtract removed group's questions)
    const currentCount = watchSections?.[sectionIndex]?.questionCount || 0;
    setValue(`sections.${sectionIndex}.questionCount`, Math.max(0, currentCount - 10)); // Adjust as needed
    
    toast.success("Group removed from section");
  };

  const getGroupDisplayName = (group: QuestionGroup) => {
    return group.name || group.title || group.passageTitle || group.passage?.title || "Untitled Group";
  };

  const getGroupSectionLabel = (section: string) => {
    return SECTION_OPTIONS.find(s => s.value === section)?.label || section;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
      case 'archived':
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/30';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'draft':
        return <FileText className="h-3 w-3" />;
      case 'archived':
        return <Archive className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTestTypeLabel = (type: string) => {
    return TEST_TYPE_OPTIONS.find(t => t.value === type)?.label || type;
  };

  return (
    <>
      <div className="relative min-h-screen dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
        {/* Preview Modal */}
        <Modal
          isOpen={preview}
          onClose={() => {
            setPreview(false);
            setPreviewTest(null);
          }}
          className="max-w-4xl"
        >
          <div className="flex flex-col h-full max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Test Preview
                </h3>
                {previewTest && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getTestTypeLabel(previewTest.testType)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {previewTest.difficulty}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setPreview(false);
                  setPreviewTest(null);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {previewTest && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {previewTest.title}
                    </h2>
                    {previewTest.description && (
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {previewTest.description}
                      </p>
                    )}
                  </div>

                  {previewTest.instructions && (
                    <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                      <h4 className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Instructions
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {previewTest.instructions}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Questions</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {previewTest.totalQuestions}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatDuration(previewTest.duration)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Difficulty</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {previewTest.difficulty}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Price</div>
                      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {previewTest.pricing.isFree ? "Free" : `${previewTest.pricing.currency} ${previewTest.pricing.salePrice}`}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Sections
                    </h4>
                    <div className="space-y-2">
                      {previewTest.sections.map((section, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                              {section.section}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {section.questionCount} questions • {formatDuration(section.duration)} • {section.groups.length} groups
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Order: {section.order}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {previewTest && (
              <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Status:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {previewTest.status}
                      </span>
                    </span>
                    {previewTest.isFeatured && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="h-4 w-4 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreview(false);
                      openEditDrawer(previewTest);
                    }}
                    className="rounded-xl px-4 py-2 text-xs"
                  >
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    Edit Test
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Group Selection Modal */}
        <Modal
          isOpen={groupModalOpen}
          onClose={closeGroupModal}
          className="max-w-4xl"
        >
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Select Question Groups
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {groupModalSection !== null && watchSections?.[groupModalSection]?.section && (
                    <>
                      Section: <span className="capitalize">{watchSections[groupModalSection].section}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={closeGroupModal}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-700">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={groupFilters.search}
                      onChange={(e) => handleGroupsSearchChange(e.target.value)}
                      placeholder="Search groups..."
                      className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Sections" },
                      ...SECTION_OPTIONS,
                    ]}
                    defaultValue={groupFilters.section}
                    onChange={(value: string) => {
                      setGroupFilters(prev => ({ ...prev, section: value }));
                      setGroupsPage(1);
                    }}
                    className="rounded-xl border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "true", label: "Active" },
                      { value: "false", label: "Inactive" },
                    ]}
                    defaultValue={groupFilters.isActive}
                    onChange={(value: string) => {
                      setGroupFilters(prev => ({ ...prev, isActive: value }));
                      setGroupsPage(1);
                    }}
                    className="rounded-xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {groupsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No question groups found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => {
                    const isSelected = selectedGroups.some(g => g._id === group._id);
                    const isAlreadyAdded = groupModalSection !== null && 
                      watchSections?.[groupModalSection]?.groups?.some(
                        (g: any) => (typeof g.group === 'object' ? g.group._id : g.group) === group._id
                      );
                    
                    return (
                      <div
                        key={group._id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                            : isAlreadyAdded
                            ? 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/10'
                        }`}
                        onClick={() => {
                          if (isAlreadyAdded) return;
                          setSelectedGroups(prev =>
                            isSelected
                              ? prev.filter(g => g._id !== group._id)
                              : [...prev, group]
                          );
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={isSelected || isAlreadyAdded}
                              disabled={isAlreadyAdded}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {getGroupDisplayName(group)}
                            </span>
                          </div>
                          <div className="ml-6 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize">
                              {getGroupSectionLabel(group.section || '')}
                            </span>
                            {group.questionType && (
                              <>
                                <span>•</span>
                                <span>{group.questionType}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              {group.questionCount || group.questions?.length || 0} Questions
                            </span>
                          </div>
                        </div>
                        {isAlreadyAdded && (
                          <span className="ml-4 text-xs text-gray-400">
                            Already added
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {groupsTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                  Page {groupsPage} of {groupsTotalPages} ({groupsTotal} groups)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={groupsPage <= 1}
                    onClick={() => setGroupsPage(p => Math.max(1, p - 1))}
                    className="rounded-xl px-3 py-1.5 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={groupsPage >= groupsTotalPages}
                    onClick={() => setGroupsPage(p => Math.min(groupsTotalPages, p + 1))}
                    className="rounded-xl px-3 py-1.5 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedGroups.length} group(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeGroupModal}
                  className="rounded-2xl px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={addGroupsToSection}
                  disabled={selectedGroups.length === 0}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Add Selected Groups
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        <div className="container mx-auto px-4">
          <div className="relative flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
                IELTS Test Management
                <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-medium">
                  {totalTests}
                </span>
              </h1>
              <p className="text-sm">
                Create, manage and organize IELTS practice tests
              </p>
            </div>
            <div className="flex gap-2">
              {bulkMode && (
                <div className="flex items-center gap-2">
                  <Select
                    options={STATUS_OPTIONS}
                    defaultValue=""
                    onChange={(value: string) => handleBulkStatusChange(value)}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                    placeholder="Bulk Status"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkMode(false);
                      setSelectedTests([]);
                    }}
                    className="rounded-2xl px-3"
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkMode(!bulkMode)}
                className="rounded-2xl px-3"
              >
                Bulk Select
              </Button>
              <Button
                onClick={openCreateDrawer}
                size="sm"
                className="flex items-center gap-1 rounded-2xl font-medium bg-orange-600 transition-all hover:scale-105 px-3 !py-2.5"
              >
                <Plus className="h-4 w-4" />
                New Test
              </Button>
            </div>
          </div>

          {/* Filters Card */}
          <div className="border mb-4 bg-white dark:border-gray-800/50 dark:bg-gray-900/80">
            <div className="p-6 pb-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 text-white">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span>Filters</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({Object.values(filters).filter(v => v !== "all" && v !== "").length} active)
                  </span>
                </div>
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search tests..."
                      className="w-full rounded-lg border border-gray-200 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Types" },
                      ...TEST_TYPE_OPTIONS,
                    ]}
                    defaultValue={filters.testType}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, testType: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Difficulties" },
                      ...DIFFICULTY_OPTIONS,
                    ]}
                    defaultValue={filters.difficulty}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, difficulty: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div>
                  <Select
                    options={[
                      { value: "all", label: "All Status" },
                      ...STATUS_OPTIONS,
                    ]}
                    defaultValue={filters.status}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, status: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div>
                  <Select
                    options={[
                      { value: "all", label: "All" },
                      { value: "true", label: "Featured" },
                      { value: "false", label: "Not Featured" },
                    ]}
                    defaultValue={filters.isFeatured}
                    onChange={(value: string) => {
                      setFilters((prev) => ({ ...prev, isFeatured: value }));
                      setPage(1);
                    }}
                    className="rounded-2xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{totalTests}</span>
                    <span>tests found</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <span>Page</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{page}</span>
                    <span>of</span>
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="h-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {LIMIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {bulkMode && selectedTests.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-700 dark:bg-blue-900/20">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedTests.length} tests selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {selectedTests.length === tests.length ? "Deselect All" : "Select All"}
              </button>
            </div>
          )}

          {/* Test List */}
          <div className="space-y-2">
            {loading && (
              <div className="flex flex-col items-center justify-center border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading tests...</p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5" />
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && tests.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No tests found
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or create a new test
                </p>
                <Button
                  onClick={openCreateDrawer}
                  className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Test
                </Button>
              </div>
            )}

            {!loading && !error && tests.map((test) => (
              <motion.div
                key={test._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group relative overflow-hidden border border-gray-200 bg-white backdrop-blur-sm transition-all hover:-translate-y-1 dark:border-gray-800/50 dark:bg-gray-900/80"
              >
                <div className="relative p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 min-w-0">
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={selectedTests.includes(test._id)}
                          onChange={() => toggleSelectTest(test._id)}
                          className="mb-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}

                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-3 py-1 text-xs font-medium text-blue-700 dark:from-blue-500/20 dark:to-indigo-500/20 dark:text-blue-300">
                          <Layers className="h-3 w-3" />
                          {getTestTypeLabel(test.testType)}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                          <Award className="h-3 w-3" />
                          {test.difficulty}
                        </span>

                        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(test.status)}`}>
                          {getStatusIcon(test.status)}
                          <span className="capitalize">{test.status}</span>
                        </span>

                        {test.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                            <Star className="h-3 w-3 fill-current" />
                            Featured
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          test.pricing.isFree
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
                        }`}>
                          <DollarSign className="h-3 w-3" />
                          {test.pricing.isFree ? 'Free' : `${test.pricing.currency} ${test.pricing.salePrice}`}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {test.title}
                      </h3>

                      {test.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-1 dark:text-gray-400">
                          {test.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {test.totalQuestions} Questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(test.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {test.sections.length} Sections
                        </span>
                        {test.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(test.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 lg:flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl px-3 py-2 text-xs border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:border-gray-700 dark:hover:border-green-500 dark:hover:bg-green-500/10"
                          onClick={() => {
                            setPreviewTest(test);
                            setPreview(true);
                          }}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl px-3 py-2 text-xs border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                          onClick={() => openEditDrawer(test)}
                        >
                          <Edit3 className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-2xl px-3 py-2 text-xs border-gray-200 text-rose-600 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:border-gray-700 dark:hover:border-rose-500 dark:hover:bg-rose-500/10"
                          onClick={() => handleDelete(test)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          onClick={() => handleToggleFeatured(test)}
                          className={`flex items-center gap-1 rounded-xl px-2 py-1 transition-colors ${
                            test.isFeatured
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                              : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                          }`}
                          title={test.isFeatured ? "Remove from featured" : "Mark as featured"}
                        >
                          <Star className="h-3.5 w-3.5" />
                          {test.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <select
                          value={test.status}
                          onChange={(e) => handleStatusChange(test, e.target.value)}
                          className="h-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setExpandedTest(expandedTest === test._id ? null : test._id)}
                          className="flex items-center gap-1 rounded-xl px-2 py-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {expandedTest === test._id ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          Sections
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedTest === test._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Test Sections
                          </h4>
                          <div className="grid gap-2 md:grid-cols-2">
                            {test.sections.map((section, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                    {section.section}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Order: {section.order}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                  <span>{section.questionCount} Questions</span>
                                  <span>•</span>
                                  <span>{formatDuration(section.duration)}</span>
                                  <span>•</span>
                                  <span>{section.groups.length} Groups</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Side Drawer - Create/Edit Test */}
          <AnimatePresence>
            {sideOpen && (
              <motion.div
                className="fixed inset-0 z-50 flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"
                  onClick={saving ? undefined : closeDrawer}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />

                <motion.div
                  className="relative ml-auto flex h-full overflow-hidden w-full max-w-3xl rounded-3xl border-4 border-gray-400 flex-col bg-white shadow-2xl dark:bg-gray-900"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 dark:border-gray-800">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                        {editingTest ? "Edit Test" : "Create New Test"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {watchTestType ? getTestTypeLabel(watchTestType) : "Select test type"}
                      </p>
                    </div>
                    <button
                      onClick={saving ? undefined : closeDrawer}
                      className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      disabled={saving}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
                    <div className="px-6 space-y-3 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Title *
                          </Label>
                          <Input
                            type="text"
                            placeholder="Enter test title"
                            value={watchTitle}
                            onChange={(e) => {
                              setValue("title", e.target.value);
                              if (!editingTest) {
                                setValue("slug", generateSlug(e.target.value));
                              }
                            }}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                          {errors.title && (
                            <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Slug *
                          </Label>
                          <Input
                            type="text"
                            placeholder="test-slug"
                            value={watchSlug}
                            onChange={(e) => setValue("slug", e.target.value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                          {errors.slug && (
                            <p className="mt-1 text-xs text-rose-500">{errors.slug.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </Label>
                        <textarea
                          placeholder="Enter test description"
                          value={watchDescription}
                          onChange={(e) => setValue("description", e.target.value)}
                          rows={3}
                          className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Instructions
                        </Label>
                        <textarea
                          placeholder="Enter test instructions"
                          value={watchInstructions}
                          onChange={(e) => setValue("instructions", e.target.value)}
                          rows={3}
                          className="mt-1 w-full rounded-2xl border border-gray-200 p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Test Type *
                          </Label>
                          <Select
                            options={TEST_TYPE_OPTIONS}
                            defaultValue={watchTestType}
                            onChange={(value: string) => setValue("testType", value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                          {errors.testType && (
                            <p className="mt-1 text-xs text-rose-500">{errors.testType.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Difficulty
                          </Label>
                          <Select
                            options={DIFFICULTY_OPTIONS}
                            defaultValue={watchDifficulty}
                            onChange={(value: string) => setValue("difficulty", value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total Questions
                          </Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={watchTotalQuestions || ""}
                            onChange={(e) => setValue("totalQuestions", parseInt(e.target.value) || 0)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Duration (minutes)
                          </Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={watchDuration || ""}
                            onChange={(e) => setValue("duration", parseInt(e.target.value) || 0)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>

                      {/* Sections with Groups */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sections
                          </Label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentSections = watchSections || [];
                              setValue("sections", [
                                ...currentSections,
                                {
                                  section: "reading",
                                  order: currentSections.length + 1,
                                  duration: 0,
                                  questionCount: 0,
                                  groups: [],
                                },
                              ]);
                            }}
                            className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs text-white"
                          >
                            <Plus className="h-3 w-3" />
                            Add Section
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {(watchSections || []).map((section, index) => (
                            <div
                              key={index}
                              className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  Section {index + 1}
                                </h5>
                                {(watchSections || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentSections = watchSections || [];
                                      const newSections = currentSections.filter((_, i) => i !== index);
                                      setValue("sections", newSections);
                                    }}
                                    className="text-rose-500 hover:text-rose-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Section Type
                                  </Label>
                                  <Select
                                    options={SECTION_OPTIONS}
                                    defaultValue={watchSections?.[index]?.section}
                                    onChange={(value: string) => setValue(`sections.${index}.section`, value)}
                                    className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Order
                                  </Label>
                                  <Input
                                    type="number"
                                    placeholder="Order"
                                    value={watchSections?.[index]?.order || ""}
                                    onChange={(e) => setValue(`sections.${index}.order`, parseInt(e.target.value) || 0)}
                                    className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Duration (minutes)
                                  </Label>
                                  <Input
                                    type="number"
                                    placeholder="Duration"
                                    value={watchSections?.[index]?.duration || ""}
                                    onChange={(e) => setValue(`sections.${index}.duration`, parseInt(e.target.value) || 0)}
                                    className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Question Count
                                  </Label>
                                  <Input
                                    type="number"
                                    placeholder="Questions"
                                    value={watchSections?.[index]?.questionCount || ""}
                                    onChange={(e) => setValue(`sections.${index}.questionCount`, parseInt(e.target.value) || 0)}
                                    className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                                  />
                                </div>
                              </div>

                              {/* Question Groups */}
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Question Groups ({watchSections?.[index]?.groups?.length || 0})
                                  </Label>
                                  <button
                                    type="button"
                                    onClick={() => openGroupModal(index)}
                                    className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Add Groups
                                  </button>
                                </div>

                                {watchSections?.[index]?.groups?.length > 0 ? (
                                  <div className="space-y-2">
                                    {watchSections[index].groups.map((group: any, groupIndex: number) => {
                                      const groupData = group.group;
                                      const groupId = typeof groupData === 'object' ? groupData._id : groupData;
                                      const groupName = typeof groupData === 'object' 
                                        ? (groupData.name || groupData.title || groupData.passage?.title || "Untitled Group")
                                        : `Group ${groupIndex + 1}`;
                                      
                                      return (
                                        <div
                                          key={groupIndex}
                                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                              {group.order || groupIndex + 1}
                                            </span>
                                            <div>
                                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {groupName}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                ID: {groupId}
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeGroupFromSection(index, groupIndex)}
                                            className="text-rose-500 hover:text-rose-700"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400 dark:border-gray-600">
                                    No question groups added yet. Click "Add Groups" to select groups.
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Pricing
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            checked={watchIsFree}
                            onChange={(e) => setValue("isFree", e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Free Test
                          </Label>
                        </div>
                        {!watchIsFree && (
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Currency
                              </Label>
                              <Select
                                options={[
                                  { value: "INR", label: "INR (₹)" },
                                  { value: "USD", label: "USD ($)" },
                                  { value: "EUR", label: "EUR (€)" },
                                  { value: "GBP", label: "GBP (£)" },
                                ]}
                                defaultValue={watchCurrency}
                                onChange={(value: string) => setValue("currency", value)}
                                className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Regular Price
                              </Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={watchRegularPrice || ""}
                                onChange={(e) => setValue("regularPrice", parseFloat(e.target.value) || 0)}
                                className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Sale Price
                              </Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={watchSalePrice || ""}
                                onChange={(e) => setValue("salePrice", parseFloat(e.target.value) || 0)}
                                className="mt-1 rounded-xl border-gray-200 dark:border-gray-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Settings */}
                      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                        <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Settings
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={watchRandomizeQuestions}
                              onChange={(e) => setValue("randomizeQuestions", e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Randomize Questions
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={watchShowTimer}
                              onChange={(e) => setValue("showTimer", e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Show Timer
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Scoring */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Passing Band
                        </Label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="e.g., 6.5"
                          value={watchPassingBand || ""}
                          onChange={(e) => setValue("passingBand", parseFloat(e.target.value) || null)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Status and Featured */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </Label>
                          <Select
                            options={STATUS_OPTIONS}
                            defaultValue={watchStatus}
                            onChange={(value: string) => setValue("status", value)}
                            className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            checked={watchIsFeatured}
                            onChange={(e) => setValue("isFeatured", e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Featured Test
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 z-10 px-6 w-full flex justify-end gap-3 border-t-2 border-gray-200 bg-white/80 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={closeDrawer}
                        disabled={saving}
                        className="rounded-2xl py-2.5 font-medium border-gray-200 px-6 dark:border-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={saving}
                        isLoading={saving}
                        className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-medium py-2.5 text-white"
                      >
                        {editingTest ? "Save Changes" : "Create Test"}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}