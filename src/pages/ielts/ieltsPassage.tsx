// IELTSPassageManagementPage.tsx
import { useEffect, useState } from "react";
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
  Tag,
  Filter,
  Calendar,
  Clock,
  Eye,
  FileText,
  Headphones,
  Upload,
  Link,
} from "lucide-react";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import RichTextEditor from "../../components/TextEditor";
import { Modal } from "../../components/ui/modal";
import TextArea from "../../components/form/input/TextArea";

const LIMIT_OPTIONS = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

interface Passage {
  _id: string;
  title: string;
  content: string;
  contentType: "passage" | "audio";
  topic?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PassageFormValues {
  title: string;
  content: string;
  contentType: "passage" | "audio";
  topic: string;
}

const getWordCount = (text: string) => {
  if (!text) return 0;
  const plainText = text.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
  const words = plainText.trim().split(/\s+/).filter(Boolean);
  return words.length;
};

const getReadingTime = (wordCount: number) => {
  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
};

export default function IELTSPassageManagementPage() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewPassage, setPreviewPassage] = useState<Passage | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    topic: "all",
    contentType: "all",
    fromDate: "",
    toDate: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPassages, setTotalPassages] = useState(0);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      title: "",
      content: "",
      instructions: "",
      contentType: "passage",
      topic: "",
    },
  });

  const watchTitle = watch("title");
  const watchContent = watch("content");
  const watchTopic = watch("topic");
  const watchInstructions = watch("instructions");
  const watchContentType = watch("contentType");

  const wordCount = getWordCount(watchContent);
  const readingTime = getReadingTime(wordCount);

  const fetchPassages = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.topic !== "all") params.topic = filters.topic;
      if (filters.contentType !== "all") params.contentType = filters.contentType;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const res = await api.get("/ielts/passages", { params });

      if (res.data?.success) {
        const data = res.data.data || [];
        setPassages(data);
        const pagination = res.data.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
          setTotalPassages(pagination.total || data.length);
        } else {
          setTotalPages(1);
          setTotalPassages(data.length);
        }
      } else {
        setPassages([]);
        setTotalPages(1);
        setTotalPassages(0);
        setError("Failed to load passages");
      }
    } catch (err: any) {
      console.error("Fetch passages error:", err);
      setError(err.response?.data?.message || "Failed to load passages");
      toast.error(err.response?.data?.message || "Failed to load passages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassages();
  }, [
    page,
    limit,
    debouncedSearch,
    filters.topic,
    filters.contentType,
    filters.fromDate,
    filters.toDate,
  ]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/ielts/passages/topics");
      if (res.data?.success) {
        setAvailableTopics(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    }
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeoutId = setTimeout(() => setDebouncedSearch(value), 600);
    setSearchTimeout(timeoutId);
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      topic: "all",
      contentType: "all",
      fromDate: "",
      toDate: "",
    });
    setDebouncedSearch("");
    setPage(1);
  };

  const openCreateDrawer = () => {
    setEditingPassage(null);
    reset({
      title: "",
      content: "",
      contentType: "passage",
      topic: "",
    });
    setSideOpen(true);
  };

  const openEditDrawer = (passage: Passage) => {
    setEditingPassage(passage);
    reset({
      title: passage.title,
      content: passage.content,
      instructions: passage.instructions,
      contentType: passage.contentType || "passage",
      topic: passage.topic || "",
    });
    setSideOpen(true);
  };

  const closeDrawer = () => {
    setSideOpen(false);
    setTimeout(() => {
      setEditingPassage(null);
    }, 150);
  };

  const handleAudioUpload = async (file: File) => {
    try {
      setUploadingAudio(true);
      const formData = new FormData();
      formData.append("audio", file);

      const res = await api.post("/ielts/upload-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        const audioUrl = res.data.data?.url || res.data.data?.audioUrl;
        setValue("content", audioUrl);
        toast.success("Audio uploaded successfully");
      } else {
        toast.error("Failed to upload audio");
      }
    } catch (err: any) {
      console.error("Upload audio error:", err);
      toast.error(err.response?.data?.message || "Failed to upload audio");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAudioUpload(file);
    }
  };

  const onSubmit = async (values: PassageFormValues) => {
    try {
      if (!values.title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (values.contentType === "passage" && !values.content.trim()) {
        toast.error("Passage content is required");
        return;
      }

      if (values.contentType === "audio" && !values.content.trim()) {
        toast.error("Audio URL is required");
        return;
      }

      setSaving(true);

      const payload = {
        title: values.title.trim(),
        instructions: values.instructions,
        content: values.content, // For passage: HTML content, For audio: audio URL
        contentType: values.contentType,
        topic: values.topic?.trim() || null,
      };

      if (editingPassage) {
        await api.put(`/ielts/passages/${editingPassage._id}`, payload);
        toast.success("Passage updated successfully");
      } else {
        await api.post("/ielts/passages", payload);
        toast.success("Passage created successfully");
      }
      closeDrawer();
      fetchPassages();
    } catch (err: any) {
      console.error("Save passage error:", err);
      toast.error(err.response?.data?.message || "Failed to save passage");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (passage: Passage) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this passage? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/ielts/passages/${passage._id}`);
      toast.success("Passage deleted successfully");
      fetchPassages();
    } catch (err: any) {
      console.error("Delete passage error:", err);
      toast.error(err.response?.data?.message || "Failed to delete passage");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getContentPreview = (content: string, contentType: string, maxLength: number = 150) => {
    if (contentType === "audio") {
      return content; // Return URL for audio
    }
    const plainText = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
    const normalized = plainText.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    return normalized.substring(0, maxLength) + "...";
  };

  const getContentTypeBadge = (contentType: string) => {
    if (contentType === "audio") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Headphones className="h-3 w-3" />
          Audio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-300">
        <BookOpen className="h-3 w-3" />
        Passage
      </span>
    );
  };

  return (
    <>
      <div className="relative min-h-screen">
        {/* Preview Modal */}
        <Modal
          isOpen={preview}
          onClose={() => {
            setPreview(false);
            setPreviewPassage(null);
          }}
          className="max-w-4xl"
        >
          <div className="flex flex-col h-full max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Passage Preview
                </h3>
                {previewPassage && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {previewPassage.topic || "No topic"}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {previewPassage.contentType === "audio"
                        ? "Audio Content"
                        : `${getWordCount(previewPassage.content)} words`}
                    </span>
                    {previewPassage.contentType === "passage" && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ~{getReadingTime(getWordCount(previewPassage.content))} min read
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setPreview(false);
                  setPreviewPassage(null);
                }}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {previewPassage && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {previewPassage.title}
                  </h2>

                  <div className="flex items-center gap-2">
                    {getContentTypeBadge(previewPassage.contentType)}
                    {previewPassage.topic && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        <Tag className="h-3 w-3" />
                        {previewPassage.topic}
                      </div>
                    )}
                  </div>

                  {previewPassage.contentType === "audio" ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                        <audio controls className="w-full">
                          <source src={previewPassage.content} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">
                          Audio URL: {previewPassage.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: previewPassage.content,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {previewPassage && (
              <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Created:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(previewPassage.createdAt || "")}
                      </span>
                    </span>
                    <span>
                      Last Updated:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(previewPassage.updatedAt || "")}
                      </span>
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreview(false);
                      if (previewPassage) {
                        openEditDrawer(previewPassage);
                      }
                    }}
                    className="rounded-xl px-4 py-2 text-xs"
                  >
                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                    Edit Passage
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        <div className="container mx-auto px-4">
          <div className="relative flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl flex items-center gap-2">
                IELTS Passage Management
                <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-medium">
                  {totalPassages}
                </span>
              </h1>
              <p className="text-sm">
                Create and manage reading passages and audio content for IELTS questions
              </p>
            </div>
            <Button
              onClick={openCreateDrawer}
              size="sm"
              className="flex items-center gap-1 rounded-2xl font-medium bg-orange-600 transition-all hover:scale-105 px-3 !py-2.5"
            >
              <Plus className="h-4 w-4" />
              New Passage
            </Button>
          </div>

          {/* Filters Card */}
          <div className="border mb-4 bg-white dark:border-gray-800/50 dark:bg-gray-900/80 rounded-2xl">
            <div className="p-6 pb-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <div className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 p-1.5 text-white">
                    <Filter className="h-4 w-4" />
                  </div>
                  <span>Filters</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    (
                    {
                      Object.values(filters).filter(
                        (v) => v !== "all" && v !== "",
                      ).length
                    }{" "}
                    active)
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

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Search */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search passages by title, content, or topic..."
                      className="w-full rounded-lg border border-gray-200 bg-white/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Content Type Filter */}
                <div>
                  <select
                    value={filters.contentType}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        contentType: e.target.value,
                      }));
                      setPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white/50 py-2.5 px-3 text-sm text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100"
                  >
                    <option value="all">All Types</option>
                    <option value="passage">Passage</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                {/* Date filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          fromDate: e.target.value,
                        }));
                        setPage(1);
                      }}
                      className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => {
                        setFilters((prev) => ({
                          ...prev,
                          toDate: e.target.value,
                        }));
                        setPage(1);
                      }}
                      className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Meta line */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pb-4">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {totalPassages}
                    </span>
                    <span>passages found</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <span>Page</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {page}
                    </span>
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

          {/* Passage List */}
          <div className="space-y-3">
            {loading && (
              <div className="flex flex-col items-center justify-center border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80 rounded-2xl">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading passages...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-700 backdrop-blur-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5" />
                  {error}
                </div>
              </div>
            )}

            {!loading && !error && passages.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/50 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/80">
                <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No passages found
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Try adjusting your filters or create a new passage
                </p>
                <Button
                  onClick={openCreateDrawer}
                  className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-white"
                >
                  <Plus className="h-4 w-4" />
                  Create Passage
                </Button>
              </div>
            )}

            {!loading &&
              !error &&
              passages.map((passage) => {
                const passageWordCount = getWordCount(passage.content);
                const passageReadingTime = getReadingTime(passageWordCount);

                return (
                  <motion.div
                    key={passage._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="group relative overflow-hidden border border-gray-200 bg-white backdrop-blur-sm transition-all hover:-translate-y-1 dark:border-gray-800/50 dark:bg-gray-900/80 rounded-2xl"
                  >
                    <div className="relative p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Tags Row */}
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {/* Content Type Badge */}
                            {getContentTypeBadge(passage.contentType)}

                            {/* Topic Badge */}
                            {passage.topic && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                                <Tag className="h-3 w-3" />
                                {passage.topic}
                              </span>
                            )}

                            {/* Word Count Badge - only for passages */}
                            {passage.contentType === "passage" && (
                              <>
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                                  <FileText className="h-3 w-3" />
                                  {passageWordCount} words
                                </span>

                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                  <Clock className="h-3 w-3" />
                                  ~{passageReadingTime} min read
                                </span>
                              </>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {passage.title}
                          </h3>

                          {/* Content Preview */}
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 break-all">
                            {getContentPreview(passage.content, passage.contentType)}
                          </p>
                        </div>

                        <div className="flex flex-col items-center gap-2 lg:flex-shrink-0">
                          <div className="flex items-center gap-2 lg:flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl px-4 py-2 text-xs border-gray-200 hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:border-gray-700 dark:hover:border-green-500 dark:hover:bg-green-500/10"
                              onClick={() => {
                                setPreviewPassage(passage);
                                setPreview(true);
                              }}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl px-4 py-2 text-xs border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-500/10"
                              onClick={() => openEditDrawer(passage)}
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl px-4 py-2 text-xs border-gray-200 text-rose-600 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:border-gray-700 dark:hover:border-rose-500 dark:hover:bg-rose-500/10"
                              onClick={() => handleDelete(passage)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                          {passage.createdAt && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(passage.createdAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Side Drawer */}
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
                        {editingPassage ? "Edit Passage" : "Create New Passage"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {watchContentType === "audio"
                          ? "Audio Content"
                          : `${wordCount} words • ~${readingTime} min read`}
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

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto"
                  >
                    <div className="px-6 space-y-4 py-4">
                      {/* Title */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Title *
                        </Label>
                        <Input
                          type="text"
                          placeholder="Enter passage title"
                          value={watchTitle}
                          onChange={(e) => setValue("title", e.target.value)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Content Type */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Content Type *
                        </Label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setValue("contentType", "passage");
                              if (watchContentType === "audio") {
                                setValue("content", "");
                              }
                            }}
                            className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                              watchContentType === "passage"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                            }`}
                          >
                            <BookOpen className={`h-5 w-5 ${
                              watchContentType === "passage"
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`} />
                            <span className={`text-sm font-medium ${
                              watchContentType === "passage"
                                ? "text-blue-600"
                                : "text-gray-600 dark:text-gray-400"
                            }`}>
                              Passage
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setValue("contentType", "audio");
                              if (watchContentType === "passage") {
                                setValue("content", "");
                              }
                            }}
                            className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                              watchContentType === "audio"
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                                : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                            }`}
                          >
                            <Headphones className={`h-5 w-5 ${
                              watchContentType === "audio"
                                ? "text-amber-600"
                                : "text-gray-400"
                            }`} />
                            <span className={`text-sm font-medium ${
                              watchContentType === "audio"
                                ? "text-amber-600"
                                : "text-gray-600 dark:text-gray-400"
                            }`}>
                              Audio
                            </span>
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Instructions
                        </Label>
                        <TextArea
                          placeholder="e.g., Environment, Technology, Education"
                          value={watchInstructions}
                          onChange={(e) => setValue("instructions", e)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Topic */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Topic
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g., Environment, Technology, Education"
                          value={watchTopic}
                          onChange={(e) => setValue("topic", e.target.value)}
                          className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      {/* Content - Conditional based on contentType */}
                      {watchContentType === "passage" ? (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Content *
                          </Label>
                          <RichTextEditor
                            header={true}
                            initialValue={watchContent}
                            onChange={(html) => setValue("content", html)}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Audio *
                          </Label>
                          <div className="mt-2 space-y-3">
                            {/* Audio URL Input */}
                            <div className="relative">
                              <Link className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Enter audio URL or upload a file"
                                value={watchContent}
                                onChange={(e) => setValue("content", e.target.value)}
                                className="mt-1 rounded-2xl border-gray-200 dark:border-gray-700 pl-10"
                              />
                            </div>

                            {/* Audio Upload */}
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 cursor-pointer hover:border-amber-500 hover:text-amber-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-amber-500 dark:hover:text-amber-400">
                                <Upload className="h-4 w-4" />
                                {uploadingAudio ? "Uploading..." : "Upload Audio"}
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={handleAudioFileChange}
                                  className="hidden"
                                  disabled={uploadingAudio}
                                />
                              </label>
                              {uploadingAudio && (
                                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                              )}
                            </div>

                            {/* Audio Preview */}
                            {watchContent && (
                              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                <audio controls className="w-full">
                                  <source src={watchContent} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Word Count Info - only for passages */}
                      {watchContentType === "passage" && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {wordCount} words
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            ~{readingTime} min read
                          </span>
                        </div>
                      )}
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
                        disabled={saving || uploadingAudio}
                        isLoading={saving}
                        className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 font-medium py-2.5 text-white"
                      >
                        {editingPassage ? "Save Changes" : "Create Passage"}
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