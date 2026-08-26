import { useState, useEffect, useRef } from "react"; // Added useRef
import {
  ArrowLeft,
  Star,
  Play,
  FileText,
  Clock,
  User,
  X,
  TriangleAlert,
  CheckCircle2,
  Circle,
  PlayCircle,
  Download,
  BookOpen,
  MessageCircleQuestion,
  NotebookPen,
  MessageSquare,
} from "lucide-react";

import { useNavigate, useParams, useSearchParams } from "react-router"; // Added useParams
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import Checkbox from "../../components/form/input/Checkbox";
import Radio from "../../components/form/input/Radio";
import api, { ImageBaseUrl } from "../../axiosInstance";
import WaitingRoom from "../liveClass/WaitingRoom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";
import StudentChatComponent from "./StudentChat";
import TeacherChatComponent from "./TeacherChat";
import { VideoPlayer } from "./youtube";
import ResourceLink from "../../components/ResourceLink";

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "material", label: " Material", icon: FileText },
  { id: "qna", label: "Q&A", icon: MessageCircleQuestion },
];

export default function VideoPlayerPage() {
  const { contentId, courseId } = useParams();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("module");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  // Controls the live-class chat from the parent so Q&A can open it.
  const [isChatOpen, setIsChatOpen] = useState(false);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const username = user?.name || user?.email;
  const isTeacher = user?.role === "teacher";

  // Keep the sidebar and chat mutually exclusive.
  const handleChatToggle = () => {
    setIsChatOpen((prev) => {
      const next = !prev;
      setIsSidebarOpen(!next);
      return next;
    });
  };

  const [reportForm, setReportForm] = useState({
    issueType: "",
    description: "",
    severity: "low",
    specificIssue: "",
    errorTime: { hours: "", minutes: "", seconds: "" },
    isPresentThroughout: false,
    screenshot: null,
  });
  const navigate = useNavigate();

  // Open Q&A/chat, hide the sidebar, and scroll the main content area to the top.
  const handleQnaClick = () => {
    setActiveTab("qna");
    setIsChatOpen(true);
    setIsSidebarOpen(false);

    requestAnimationFrame(() => {
      contentScrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  };

  const [moduleDetails, setModuleDetails] = useState(null);
  const [contentDetails, setContentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWaitingRoom, setWaitingRoom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackOptions, setFeedbackOptions] = useState([
    { id: "presentation", label: "Good Presentation", checked: true },
    {
      id: "exam_oriented",
      label: "Content covered is exam oriented",
      checked: true,
    },
    { id: "clear_explanation", label: "Explanation is clear", checked: false },
    { id: "engaging", label: "Engaging teaching style", checked: false },
    { id: "good_examples", label: "Good examples provided", checked: false },
  ]);

  const fetchData = async () => {
    if (!moduleId || !contentId) {
      setError("Module ID or Content ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const moduleResponse = await api.get(
        `/modules/overview/${moduleId}?course=${courseId}`,
      );
      setModuleDetails(moduleResponse.data?.data);

      const contentResponse = await api.get(
        `/content/${contentId}/${courseId}`,
      );
      setContentDetails(contentResponse.data.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleId, contentId]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post("/feedback", {
        content: contentId,
        type: "report_issue",
        contentref: contentDetails?.contentType,
        issueType: reportForm.issueType,
        description: reportForm.description,
        severity: reportForm.severity,
        specificIssue: reportForm.specificIssue,

        errorTime: reportForm.errorTime,

        isPresentThroughout: reportForm.isPresentThroughout,

        screenshot: reportForm.screenshot,
      });

      toast.success("Report Submit Successfully...");

      setIsReportModalOpen(false);

      setReportForm({
        issueType: "",
        description: "",
        severity: "low",
        specificIssue: "",
        errorTime: {
          hours: "",
          minutes: "",
          seconds: "",
        },
        isPresentThroughout: false,
        screenshot: null,
      });
    } catch (error) {
      console.log(
        "Report submit error:",
        error.response?.data || error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (contentDetails?.contentType === "LiveClasses") {
      const now = new Date();
      setWaitingRoom(true);
      let timeUntilStart = null;

      if (contentDetails.scheduledStart) {
        const scheduledStartTime = new Date(contentDetails.scheduledStart);
        timeUntilStart = scheduledStartTime - now;
        const bufferMinutes = 1;
        const bufferMilliseconds = bufferMinutes * 60 * 1000;
        if (timeUntilStart <= bufferMilliseconds) {
          setWaitingRoom(false);
        }
      } else {
        setWaitingRoom(false);
      }
    }
  }, [contentDetails]);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get only selected feedback
      const selectedFeedback = feedbackOptions
        .filter((option) => option.checked)
        .map((option) => option.label);

      const response = await api.post("/feedback", {
        content: contentId,
        contentref: contentDetails?.contentType,

        type: "rate_video",

        rating: rating,
        description: reportForm.description,

        message: selectedFeedback.join(", "),
      });

      toast.success("Rating Submit Successfully...");

      setIsRatingModalOpen(false);

      setRating(0);

      setFeedbackOptions([
        {
          id: "presentation",
          label: "Good Presentation",
          checked: true,
        },
        {
          id: "exam_oriented",
          label: "Content covered is exam oriented",
          checked: true,
        },
        {
          id: "clear_explanation",
          label: "Explanation is clear",
          checked: false,
        },
        {
          id: "engaging",
          label: "Engaging teaching style",
          checked: false,
        },
        {
          id: "good_examples",
          label: "Good examples provided",
          checked: false,
        },
      ]);
    } catch (error) {
      console.log(
        "Rating submit error:",
        error.response?.data || error.message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackChange = (id) => {
    setFeedbackOptions((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, checked: !option.checked } : option,
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex h-[85vh] items-center justify-center bg-orange-50/60 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[85vh] items-center justify-center bg-orange-50/60 dark:bg-gray-900">
        <div className="text-red-500 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!moduleDetails || !contentDetails) {
    return (
      <div className="flex h-[85vh] items-center justify-center bg-orange-50/60 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Data not found.</div>
      </div>
    );
  }

  const batchContentList = [
    ...(moduleDetails.recordedClasses?.map((item) => ({
      id: item._id,
      type: "RecordedClasses",
      thumbnailPic: item.thumbnailPic,
      locked: item.locked,
      title: item.title,
      duration: item.duration
        ? `${item.duration} mins`
        : item.video?.duration
          ? `${item.video.duration} secs`
          : "N/A",
      status: item.status, // 'published'
      scheduledStart: item.scheduledStart,
    })) || []),
    ...(moduleDetails.liveClasses?.map((item) => ({
      id: item._id,
      type: "LiveClasses", // Use actual type from API if different
      title: item.title,
      duration: item.duration ? `${item.duration} mins` : "N/A", // Format duration
      status: item.status, // 'published' or 'scheduled'
      scheduledStart: item.scheduledStart,
      thumbnailPic: item.thumbnailPic,
      locked: item.locked,
    })) || []),
  ];

  const totalSessions = batchContentList.length;
  const completedSessions = batchContentList.filter(
    (item) => item.status === "completed",
  ).length;
  const percentComplete = totalSessions
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0;

  const upcomingSessions = batchContentList.filter(
    (item) => item.status === "scheduled" && item.scheduledStart,
  );

  const learningOutcomes =
    contentDetails.learningOutcomes || contentDetails.topics || [];
  const sessionMaterials = moduleDetails.studyMaterials || [];

  const formatSessionDate = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    const datePart = d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      weekday: "short",
    });
    const timePart = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart}, ${timePart}`;
  };

  const renderChat = () => {
    if (isTeacher) {
      return (
        <TeacherChatComponent
          classTitle={contentDetails?.title || ""}
          classId={contentId}
          username={username}
        />
      );
    }

    return (
      <StudentChatComponent
        classTitle={contentDetails?.title || ""}
        classId={contentId}
        username={username}
      />
    );
  };

  return (
    <div className="flex h-[85vh] gap-4 bg-orange-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-1">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          ref={contentScrollRef}
          className="flex-1 p-1 overflow-y-auto no-scrollbar"
        >
          <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 overflow-hidden rounded-2xl shadow-sm">
            {/* Header strip */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100 dark:border-gray-700">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {contentDetails.title}
                </h1>
                {contentDetails.status === "live" && (
                  <span className="flex items-center gap-1 bg-orange-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live
                  </span>
                )}
              </div>
            </div>

            {contentDetails.contentType == "RecordedClasses" ? (
              <div
                className="relative w-full bg-black"
                style={{ paddingBottom: "57.25%" }}
              >
                {contentDetails.video?.url ? (
                  <iframe
                    src={contentDetails.video.url.trim()}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={contentDetails.title}
                    className="absolute top-0 left-0 w-full h-full"
                    onError={(e) => console.error("Error loading video:", e)}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-center px-6">
                    <button
                      type="button"
                      className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center shadow-lg"
                      aria-label="Play"
                    >
                      <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                    </button>
                    <div>
                      <p className="text-white font-semibold">
                        Video unavailable
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        {contentDetails.materialType === "pdf"
                          ? "PDF Content"
                          : "This recording is not available."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {showWaitingRoom ? (
                  <WaitingRoom
                    setWaitingRoom={setWaitingRoom}
                    contentDetails={contentDetails}
                    classId={contentId}
                  />
                ) : (
                  <div className="relative flex w-full rounded-xl bg-white dark:bg-gray-800 overflow-hidden border border-orange-100 dark:border-gray-700">
                    {/* Video Container */}
                    <div className="relative w-full bg-black transition-all duration-300">
                      <VideoPlayer
                        videoId={contentDetails?.meetingId}
                        title={`Class ${contentDetails?.title || ""}`}
                      />

                      {contentDetails.status === "live" && (
                        <button
                          type="button"
                          onClick={handleChatToggle}
                          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transition-all shadow-lg z-10 border border-white/20"
                          aria-label={isChatOpen ? "Hide chat" : "Show chat"}
                          title={isChatOpen ? "Hide chat" : "Show chat"}
                        >
                          <MessageSquare className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-b border-orange-100 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                {contentDetails.instructorInfo &&
                  (contentDetails.instructorInfo.name ||
                    contentDetails.instructorInfo.email) && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Instructor
                        </p>
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {contentDetails.instructorInfo.name || "Instructor"}
                        </p>
                      </div>
                    </div>
                  )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsReportModalOpen(true)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <TriangleAlert className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => setIsRatingModalOpen(true)}
                    className="bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate Video
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 px-4 border-b border-orange-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === "qna") {
                      handleQnaClick();
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`relative py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-orange-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 dark:bg-gray-700/40 border border-orange-100 dark:border-gray-700 rounded-xl p-4">
                      <h3 className="text-orange-600 dark:text-orange-400 font-semibold text-sm mb-3">
                        Class Details
                      </h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Topic
                          </dt>
                          <dd className="text-gray-800 dark:text-gray-200 font-medium text-right">
                            {contentDetails.topic ||
                              contentDetails.title ||
                              "—"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Session Type
                          </dt>
                          <dd className="text-gray-800 dark:text-gray-200 font-medium text-right">
                            {contentDetails.contentType === "LiveClasses"
                              ? "Live One-on-One Class"
                              : "Recorded Class"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Duration
                          </dt>
                          <dd className="text-gray-800 dark:text-gray-200 font-medium text-right">
                            {contentDetails.duration
                              ? `${contentDetails.duration} Minutes`
                              : "N/A"}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-orange-50 dark:bg-gray-700/40 border border-orange-100 dark:border-gray-700 rounded-xl p-4">
                      <h3 className="text-orange-600 dark:text-orange-400 font-semibold text-sm mb-3">
                        What You will Learn
                      </h3>
                      {learningOutcomes.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {learningOutcomes.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                            >
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {contentDetails.description ||
                            "No learning outcomes added for this session yet."}
                        </p>
                      )}
                    </div>
                  </div>

                </>
              )}

              {activeTab === 'material' && (
                
                  <div className="bg-white dark:bg-gray-700/20 border border-orange-100 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="text-orange-600 dark:text-orange-400 font-semibold text-sm mb-3">
                      Module Material
                    </h3>
                    {sessionMaterials.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white dark:border-gray-700 dark:bg-gray-900">
                        {/* Module Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-orange-100 bg-[#FFF0E6] px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
                          <div className="flex items-center gap-4">
                            {/* Module Number */}
                            <div className="flex w-12 flex-col items-center justify-center">
                              <span className="text-lg font-bold text-orange-500">
                                {String(
                                  sessionMaterials.moduleNumber || 1,
                                ).padStart(2, "0")}
                              </span>
                            </div>

                            {/* Module Info */}
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {"Total modules"}
                              </h3>

                              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                {sessionMaterials.length} Materials
                              </p>
                            </div>
                          </div>

                          {/* Material Count */}
                          <div className="flex h-8 min-w-11 items-center justify-center rounded-full bg-white px-3 text-sm font-semibold text-orange-500 shadow-sm dark:bg-gray-700">
                            {sessionMaterials.length}
                          </div>
                        </div>

                        {/* Materials */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {sessionMaterials.map((material, idx) => {
                            const type = (
                              material.fileType || "PDF"
                            ).toLowerCase();

                            const isLink = type === "link" || type === "url";
                            const isImage =
                              type === "image" ||
                              ["jpg", "jpeg", "png", "webp", "gif"].includes(
                                type,
                              );

                            const Icon = isLink
                              ? LinkIcon
                              : isImage
                                ? ImageIcon
                                : FileText;

                            return (
                              <div
                                key={material._id || idx}
                                className={`group flex items-center justify-between gap-4 px-5 py-4 transition-colors
                                  ${
                                    material.locked
                                      ? "cursor-not-allowed opacity-60"
                                      : "cursor-pointer hover:bg-orange-50/40 dark:hover:bg-gray-800"
                                  }`}
                              >
                                {/* Left Content */}
                                <div className="flex min-w-0 items-center gap-4">
                                  {/* Material Icon */}
                                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-[#FFF9F5] text-orange-500 dark:border-orange-900/40 dark:bg-gray-800">
                                    <Icon
                                      className="h-6 w-6"
                                      strokeWidth={1.8}
                                    />
                                  </div>

                                  {/* Material Details */}
                                  <div className="min-w-0">
                                    <p className="truncate text-[17px] font-semibold text-gray-900 dark:text-white">
                                      {material.title || material.name}
                                    </p>

                                    <div className="mt-1 flex min-w-0 items-center gap-2">
                                      {/* Type Badge */}
                                      <span className="flex-shrink-0 rounded-md bg-[#FFF1EA] px-2.5 py-1 text-sm font-medium capitalize text-orange-500 dark:bg-orange-950/40 dark:text-orange-400">
                                        {material.fileType || "PDF"}
                                      </span>

                                      {/* Separator */}
                                      <span className="text-gray-300 dark:text-gray-600">
                                        •
                                      </span>

                                      {/* Description */}
                                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                        {material.description ||
                                          "No description available"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Arrow / Resource Link */}
                                <div className="flex-shrink-0">
                                  <ResourceLink
                                    slug={contentDetails.courseInfo.slug}
                                    locked={material.locked}
                                    link={`/resources/${material.slug}`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-8 text-center dark:border-gray-700 dark:bg-gray-900">
                        <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No material has been added for this session yet.
                        </p>
                      </div>
                    )}
                  </div>
              )}

              {activeTab === "qna" && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-1">
                    <MessageCircleQuestion className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    No questions yet
                  </p>
                  <p className="text-xs text-gray-400">
                    Questions asked during the session will show up here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* sidebar */}
      <div
        className={`${
          isSidebarOpen
            ? "w-80 opacity-100 translate-x-0"
            : "w-0 opacity-0 -translate-x-4"
        }
          relative flex flex-col overflow-hidden rounded-2xl
          border border-gray-200/80 bg-white shadow-sm
          transition-all duration-300 ease-in-out
          dark:border-gray-700 dark:bg-gray-900`}
      >
        {/* Sidebar Header */}
        <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <BookOpen className="h-4 w-4 text-orange-500" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                    Course Content
                  </h2>

                  <p className="mt-0.5 truncate text-[11px] font-medium text-orange-500">
                    {moduleDetails.title || "Module"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-8 w-8 flex-shrink-0 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Course Progress */}
          {/* {batchContentList.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Course Progress
                  </span>

                  <span className="text-[11px] font-semibold text-orange-500">
                    {
                      batchContentList.filter(
                        (item) => item.status === "completed"
                      ).length
                    }
                    /{batchContentList.length}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
                    style={{
                      width: `${
                        (batchContentList.filter(
                          (item) => item.status === "completed"
                        ).length /
                          batchContentList.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )} */}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          {batchContentList.length > 0 ? (
            <div className="space-y-2">
              {batchContentList.map((item, index) => {
                const isActive = item.id === contentId;
                const isCompleted = item.status === "completed";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.locked) {
                        navigate(
                          `/class/${item.id}/${courseId}?module=${moduleId}`,
                        );
                      }
                    }}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-200
                        ${
                          item.locked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        }
                        ${
                          isActive
                            ? "border-orange-200 bg-orange-50 shadow-sm dark:border-orange-900/50 dark:bg-orange-900/20"
                            : isCompleted
                              ? "border-gray-100 bg-gray-50/70 hover:border-orange-200 hover:bg-orange-50/50 dark:border-gray-700 dark:bg-gray-800/60"
                              : "border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/40 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800"
                        }`}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-orange-500" />
                    )}

                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="relative h-[58px] w-[82px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {item.thumbnailPic ? (
                          <img
                            src={`${ImageBaseUrl}/${item.thumbnailPic}`}
                            alt={item.title || "Course content"}
                            className={`h-full w-full object-cover transition-transform duration-300 ${
                              !item.locked && "group-hover:scale-105"
                            }`}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-5 w-5 text-gray-400" />
                          </div>
                        )}

                        {/* Thumbnail Overlay */}
                        <div
                          className={`absolute inset-0 flex items-center justify-center transition-colors ${
                            isActive
                              ? "bg-orange-500/20"
                              : "bg-black/0 group-hover:bg-black/10"
                          }`}
                        >
                          {isActive ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
                              <Play className="ml-0.5 h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                            </div>
                          ) : isCompleted ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 shadow-sm">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          ) : item.locked ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
                              <Lock className="h-3 w-3 text-white" />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`line-clamp-2 text-[13px] font-semibold leading-5 ${
                              isActive
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-gray-800 dark:text-gray-100"
                            }`}
                          >
                            {item.title}
                          </h3>

                          {/* Item Number */}
                          <span
                            className={`flex-shrink-0 text-[10px] font-semibold ${
                              isActive
                                ? "text-orange-500"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        {/* Bottom Info */}
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                            <Clock className="h-3 w-3" />
                            {item.duration || "—"}
                          </span>

                          {isActive && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                              Playing
                            </span>
                          )}

                          {isCompleted && !isActive && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-orange-500">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                          )}

                          {item.locked && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 dark:bg-gray-800">
                <BookOpen className="h-6 w-6 text-orange-400" />
              </div>

              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                No content available
              </h3>

              <p className="mt-1 max-w-[200px] text-xs leading-5 text-gray-400 dark:text-gray-500">
                Course content will appear here once it has been added.
              </p>
            </div>
          )}

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Upcoming Sessions
                  </h3>

                  <p className="mt-0.5 text-[10px] text-gray-400">
                    Stay on track with your classes
                  </p>
                </div>

                <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-500 dark:bg-orange-900/20">
                  {upcomingSessions.length}
                </span>
              </div>

              <div className="space-y-2">
                {upcomingSessions.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50/50 p-3 transition-all hover:border-orange-200 hover:shadow-sm dark:border-amber-900/30 dark:from-amber-900/10 dark:to-orange-900/10"
                  >
                    {/* Session Number */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white shadow-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </div>

                    {/* Session Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {item.title}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-orange-500">
                        <CalendarDays className="h-3 w-3" />
                        <span className="truncate">
                          {formatSessionDate(item.scheduledStart)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {contentDetails.status === "live" && (
        <div
          className={` flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-orange-100 dark:border-gray-700 ${
            isChatOpen
              ? "w-[20rem] h-[560px] opacity-100"
              : "w-0 h-0 opacity-0 border-0 pointer-events-none"
          }`}
        >
          <div className="flex-1 min-h-0 overflow-hidden">{renderChat()}</div>
        </div>
      )}

      {!isSidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(true)}
          className="h-8 w-8 border shadow-xl !rounded-full bg-orange-500 text-white mt-4 ml-2 hover:bg-orange-600 z-10"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Button>
      )}

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        className="max-w-md"
      >
        <div className="no-scrollbar relative w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Please select Issue(s)
            </h3>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specific Issue
              </Label>
              <div className="space-y-2">
                {[
                  {
                    value: "wrong_content",
                    label: "Wrong content/information/teaching",
                  },
                  {
                    value: "audio_issue",
                    label: "Audio - Not able to hear properly",
                  },
                  { value: "buffering", label: "Video Buffering Issues" },
                  { value: "blank_screen", label: "Showing Blank Screen" },
                  { value: "screenshot", label: "Can't take screenshot" },
                  {
                    value: "chat_not_working",
                    label: "Chat Not Working Properly",
                  },
                  {
                    value: "sync_issue",
                    label: "Audio and Video are not in Sync",
                  },
                  { value: "stuck", label: "The video keeps getting stuck" },
                ].map((issue) => (
                  <Radio
                    key={issue.value}
                    name="specificIssue"
                    value={issue.value}
                    checked={reportForm.specificIssue === issue.value}
                    onChange={(e) =>
                      setReportForm((prev) => ({ ...prev, specificIssue: e }))
                    }
                    label={issue.label}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="present-throughout"
                checked={reportForm.isPresentThroughout}
                onChange={(e) =>
                  setReportForm((prev) => ({ ...prev, isPresentThroughout: e }))
                }
                label="Issue was present throughout the video"
                className="text-sm text-gray-700 dark:text-gray-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="error-hours"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Hours
                </Label>
                <Input
                  id="error-hours"
                  type="number"
                  min="0"
                  max="23"
                  value={reportForm.errorTime.hours}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      errorTime: { ...prev.errorTime, hours: e.target.value },
                    }))
                  }
                  placeholder="HH"
                  className="text-sm"
                />
              </div>
              <div>
                <Label
                  htmlFor="error-minutes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Minutes
                </Label>
                <Input
                  id="error-minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={reportForm.errorTime.minutes}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      errorTime: { ...prev.errorTime, minutes: e.target.value },
                    }))
                  }
                  placeholder="MM"
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="issue-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tell us more about the issue
              </Label>
              <Input
                id="issue-description"
                type="textarea"
                value={reportForm.description}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the problem in detail..."
                rows={3}
                className="mt-1 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReportModalOpen(false)}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="default"
                className="bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        className="max-w-md"
      >
        <div className="no-scrollbar relative w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Please share your faculty feedback
            </h3>
            <button
              onClick={() => setIsRatingModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-center mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRating(star)}
                className={`transition-colors p-1 ${rating >= star ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300" : "text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-400"}`}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className="w-8 h-8"
                  fill={rating >= star ? "currentColor" : "none"}
                />
              </Button>
            ))}
          </div>
          <div className="mb-6">
            <h4 className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Hi User! What can be improved?
            </h4>
            <div className="space-y-3">
              {feedbackOptions.map((option) => (
                <div key={option.id} className="flex items-center">
                  <Checkbox
                    id={option.id}
                    checked={option.checked}
                    onChange={() => handleFeedbackChange(option.id)}
                    label={option.label}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label
              htmlFor="rating-feedback"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Tell us more about the issue
            </Label>
            <Input
              id="rating-feedback"
              type="textarea"
              value={reportForm.description}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Share any additional feedback..."
              rows={3}
              className="mt-1 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRatingModalOpen(false)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting || rating === 0}
              onClick={handleRatingSubmit}
              className={`${
                rating === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// // import { useState, useEffect } from "react"; // Added useEffect
// // import {
// //   ArrowLeft,
// //   Star,
// //   Play,
// //   FileText,
// //   Clock,
// //   User,
// //   X,
// //   TriangleAlert,
// //   RadioIcon,
// // } from "lucide-react";
// // import { useNavigate, useParams, useSearchParams } from "react-router"; // Added useParams
// // import Button from "../../components/ui/button/Button";
// // import Label from "../../components/form/Label";
// // import Input from "../../components/form/input/InputField";
// // import { Modal } from "../../components/ui/modal";
// // import Checkbox from "../../components/form/input/Checkbox";
// // import Radio from "../../components/form/input/Radio";
// // import api from "../../axiosInstance";
// // import { VideoWithChat } from "./YoutubeChat";
// // import WaitingRoom from "../liveClass/WaitingRoom";
// // import { toast } from "react-toastify";

// // export default function VideoPlayerPage() {
// //   const { contentId, courseId } = useParams();
// //   const [searchParams] = useSearchParams();
// //   const moduleId = searchParams.get("module");
// //   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
// //   const [isReportModalOpen, setIsReportModalOpen] = useState(false);
// //   const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
// //   const [rating, setRating] = useState(0);
// //   const [reportForm, setReportForm] = useState({
// //     issueType: "",
// //     description: "",
// //     severity: "low",
// //     specificIssue: "",
// //     errorTime: { hours: "", minutes: "", seconds: "" },
// //     isPresentThroughout: false,
// //     screenshot: null,
// //   });
// //   const navigate = useNavigate();

// //   const [moduleDetails, setModuleDetails] = useState(null);
// //   const [contentDetails, setContentDetails] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [showWaitingRoom, setWaitingRoom] = useState(false);
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [feedbackOptions, setFeedbackOptions] = useState([
// //     { id: "presentation", label: "Good Presentation", checked: true },
// //     {
// //       id: "exam_oriented",
// //       label: "Content covered is exam oriented",
// //       checked: true,
// //     },
// //     { id: "clear_explanation", label: "Explanation is clear", checked: false },
// //     { id: "engaging", label: "Engaging teaching style", checked: false },
// //     { id: "good_examples", label: "Good examples provided", checked: false },
// //   ]);
// //   const fetchData = async () => {
// //     if (!moduleId || !contentId) {
// //       setError("Module ID or Content ID is missing.");
// //       setLoading(false);
// //       return;
// //     }

// //     setLoading(true);
// //     setError(null);
// //     try {
// //       const moduleResponse = await api.get(
// //         `/modules/overview/${moduleId}?course=${courseId}`,
// //       );
// //       setModuleDetails(moduleResponse.data?.data); // Adjust based on your API response structure

// //       const contentResponse = await api.get(
// //         `/content/${contentId}/${courseId}`,
// //       );
// //       setContentDetails(contentResponse.data.data); // Adjust based on your API response structure
// //     } catch (err) {
// //       console.error("Error fetching data:", err);
// //       setError(err.message || "Failed to load data.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchData();
// //   }, [moduleId, contentId]);

// //   const handleReportSubmit = async (e) => {
// //     e.preventDefault();
// //     setIsSubmitting(true);

// //     try {
// //       const response = await api.post("/feedback", {
// //         content: contentId,
// //         type: "report_issue",
// //         contentref: contentDetails?.contentType,
// //         issueType: reportForm.issueType,
// //         description: reportForm.description,
// //         severity: reportForm.severity,
// //         specificIssue: reportForm.specificIssue,

// //         errorTime: reportForm.errorTime,

// //         isPresentThroughout: reportForm.isPresentThroughout,

// //         screenshot: reportForm.screenshot,
// //       });

// //       toast.success("Report Submit Successfully...");

// //       setIsReportModalOpen(false);

// //       setReportForm({
// //         issueType: "",
// //         description: "",
// //         severity: "low",
// //         specificIssue: "",
// //         errorTime: {
// //           hours: "",
// //           minutes: "",
// //           seconds: "",
// //         },
// //         isPresentThroughout: false,
// //         screenshot: null,
// //       });
// //     } catch (error) {
// //       console.log(
// //         "Report submit error:",
// //         error.response?.data || error.message,
// //       );
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };
// //   useEffect(() => {
// //     if (contentDetails?.contentType === "LiveClasses") {
// //       const now = new Date();
// //       setWaitingRoom(true);
// //       let timeUntilStart = null;

// //       if (contentDetails.scheduledStart) {
// //         const scheduledStartTime = new Date(contentDetails.scheduledStart);
// //         timeUntilStart = scheduledStartTime - now;
// //         const bufferMinutes = 1;
// //         const bufferMilliseconds = bufferMinutes * 60 * 1000;
// //         if (timeUntilStart <= bufferMilliseconds) {
// //           setWaitingRoom(false);
// //         }
// //       } else {
// //         setWaitingRoom(false);
// //       }
// //     }
// //   }, [contentDetails]);

// //   const handleRatingSubmit = async (e) => {
// //     e.preventDefault();
// //     setIsSubmitting(true);

// //     try {
// //       // Get only selected feedback
// //       const selectedFeedback = feedbackOptions
// //         .filter((option) => option.checked)
// //         .map((option) => option.label);

// //       const response = await api.post("/feedback", {
// //         content: contentId,
// //         contentref: contentDetails?.contentType,

// //         type: "rate_video",

// //         rating: rating,
// //         description: reportForm.description,

// //         message: selectedFeedback.join(", "),
// //       });

// //       toast.success("Rating Submit Successfully...");

// //       setIsRatingModalOpen(false);

// //       setRating(0);

// //       setFeedbackOptions([
// //         {
// //           id: "presentation",
// //           label: "Good Presentation",
// //           checked: true,
// //         },
// //         {
// //           id: "exam_oriented",
// //           label: "Content covered is exam oriented",
// //           checked: true,
// //         },
// //         {
// //           id: "clear_explanation",
// //           label: "Explanation is clear",
// //           checked: false,
// //         },
// //         {
// //           id: "engaging",
// //           label: "Engaging teaching style",
// //           checked: false,
// //         },
// //         {
// //           id: "good_examples",
// //           label: "Good examples provided",
// //           checked: false,
// //         },
// //       ]);
// //     } catch (error) {
// //       console.log(
// //         "Rating submit error:",
// //         error.response?.data || error.message,
// //       );
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   const handleFeedbackChange = (id) => {
// //     setFeedbackOptions((prev) =>
// //       prev.map((option) =>
// //         option.id === id ? { ...option, checked: !option.checked } : option,
// //       ),
// //     );
// //   };

// //   if (loading) {
// //     return (
// //       <div className="flex h-[85vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
// //         <div className="text-gray-500 dark:text-gray-400">Loading...</div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="flex h-[85vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
// //         <div className="text-red-500 dark:text-red-400">Error: {error}</div>
// //       </div>
// //     );
// //   }

// //   if (!moduleDetails || !contentDetails) {
// //     return (
// //       <div className="flex h-[85vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
// //         <div className="text-gray-500 dark:text-gray-400">Data not found.</div>
// //       </div>
// //     );
// //   }

// //   const batchContentList = [
// //     ...(moduleDetails.recordedClasses?.map((item) => ({
// //       id: item._id,
// //       type: "RecordedClasses",
// //       title: item.title,
// //       duration: item.duration
// //         ? `${item.duration} mins`
// //         : item.video?.duration
// //           ? `${item.video.duration} secs`
// //           : "N/A",
// //       status: item.status, // 'published'
// //     })) || []),
// //     ...(moduleDetails.liveClasses?.map((item) => ({
// //       id: item._id,
// //       type: "LiveClasses", // Use actual type from API if different
// //       title: item.title,
// //       duration: item.duration ? `${item.duration} mins` : "N/A", // Format duration
// //       status: item.status, // 'published' or 'scheduled'
// //     })) || []),
// //     // ...(moduleDetails.tests?.map(item => ({
// //     //     id: item._id,
// //     //     type: "Tests",
// //     //     title: item.title,
// //     //     duration: "N/A", // Tests usually don't have a duration like videos
// //     //     status: item.status, // 'published'
// //     // })) || []),
// //     // ...(moduleDetails.studyMaterials?.map(item => ({
// //     //     id: item._id,
// //     //     type: "StudyMaterials",
// //     //     title: item.title,
// //     //     duration: "N/A",
// //     //     status: item.status, // 'published'
// //     // })) || []),
// //   ];

// //   return (
// //     <div className="flex h-[85vh] text-gray-900 dark:text-gray-100">
// //       <div className="flex-1 flex flex-col">
// //         <div className="flex-1 p-4 py-1 overflow-y-auto">
// //           <div className="max-w-5xl mx-auto bg-white border overflow-hidden rounded-2xl">
// //             {contentDetails.contentType == "RecordedClasses" ? (
// //               <div
// //                 className="relative w-full"
// //                 style={{ paddingBottom: "57.25%" }}
// //               >
// //                 {contentDetails.video?.url ? ( // Check if video URL exists
// //                   <iframe
// //                     src={contentDetails.video.url.trim()} // Trim whitespace
// //                     frameBorder="0"
// //                     allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
// //                     referrerPolicy="strict-origin-when-cross-origin"
// //                     title={contentDetails.title}
// //                     className="absolute top-0 left-0 w-full h-full rounded-lg"
// //                     onError={(e) => console.error("Error loading video:", e)}
// //                   />
// //                 ) : (
// //                   <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
// //                     <p className="text-gray-500 dark:text-gray-400">
// //                       {contentDetails.materialType === "pdf"
// //                         ? "PDF Content"
// //                         : "Video not available"}
// //                     </p>
// //                   </div>
// //                 )}
// //               </div>
// //             ) : (
// //               <div className="pb-4">
// //                 {" "}
// //                 {showWaitingRoom ? (
// //                   <WaitingRoom
// //                     setWaitingRoom={setWaitingRoom}
// //                     contentDetails={contentDetails}
// //                     classId={contentId}
// //                   />
// //                 ) : (
// //                   <VideoWithChat
// //                     status={contentDetails.status}
// //                     classTitle={contentDetails?.title || ""}
// //                     classId={contentId}
// //                     videoId={contentDetails?.meetingId}
// //                   />
// //                 )}
// //               </div>
// //             )}
// //             <div className="px-4 py-2 pb-4">
// //               <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
// //                 <div className="flex-1 space-y-4">
// //                   <div>
// //                     <h2 className="text-xl mt-1 sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
// //                       {contentDetails.title}
// //                     </h2>
// //                     <p className="text-gray-600 text-sm dark:text-gray-400">
// //                       {contentDetails.description}
// //                     </p>
// //                   </div>
// //                   {contentDetails.instructorInfo &&
// //                     (contentDetails.instructorInfo.name ||
// //                       contentDetails.instructorInfo.email) && (
// //                       <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
// //                         <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
// //                           <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
// //                         </div>
// //                         <div className="flex-1">
// //                           <h3 className="font-semibold text-gray-800 dark:text-gray-200">
// //                             {contentDetails.instructorInfo.name || "Instructor"}
// //                           </h3>
// //                         </div>
// //                       </div>
// //                     )}

// //                   <div className="flex gap-3 pt-2">
// //                     <Button
// //                       variant="outline"
// //                       onClick={() => setIsReportModalOpen(true)}
// //                       className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
// //                     >
// //                       <TriangleAlert className="w-4 h-4 mr-2" />
// //                       Report Issue
// //                     </Button>
// //                     <Button
// //                       variant="default"
// //                       onClick={() => setIsRatingModalOpen(true)}
// //                       className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
// //                     >
// //                       <Star className="w-4 h-4 mr-2" />
// //                       Rate Video
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //       <div
// //         className={`${
// //           isSidebarOpen ? "w-80" : "w-0 opacity-0"
// //         } transition-all rounded-2xl border duration-300 ease-in-out flex flex-col bg-white dark:bg-gray-900 overflow-hidden`}
// //       >
// //         <div className="p-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm">
// //           <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
// //             {moduleDetails.title || "Module"}
// //           </h2>
// //           <Button
// //             variant="ghost"
// //             size="icon"
// //             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
// //             className="h-8 w-8 border shadow-xl !rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
// //           >
// //             <ArrowLeft
// //               className={`w-4 h-4 ${isSidebarOpen ? "" : "rotate-180"}`}
// //             />{" "}
// //           </Button>
// //         </div>
// //         <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1">
// //           {batchContentList.length > 0 ? (
// //             <div className="space-y-2">
// //               {batchContentList.map((item) => (
// //                 <div
// //                   key={item.id}
// //                   className={`group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
// //                     ${
// //                       item.id === contentId
// //                         ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
// //                         : item.status === "completed"
// //                           ? "border-green-200 bg-green-50/50 dark:bg-green-900/10 hover:border-green-300"
// //                           : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300"
// //                     } hover:shadow-md`}
// //                   onClick={() => {
// //                     navigate(
// //                       `/class/${item.id}/${courseId}?module=${moduleId}`,
// //                     );
// //                   }}
// //                 >
// //                   <div className="flex items-center gap-3">
// //                     <div className="relative flex-shrink-0">
// //                       {item.status === "completed" && (
// //                         <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
// //                       )}
// //                       {item.status === "in-progress" && (
// //                         <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
// //                       )}
// //                     </div>

// //                     <div className="flex-1 min-w-0">
// //                       <div className="flex items-center justify-between gap-2 mb-1">
// //                         <h3
// //                           className={`font-semibold text-sm
// //                                 ${
// //                                   item.id === contentId
// //                                     ? "text-blue-900 dark:text-blue-100 font-semibold"
// //                                     : "text-gray-900 dark:text-white"
// //                                 }`}
// //                         >
// //                           {item.title}
// //                         </h3>
// //                       </div>

// //                       <div className="flex items-center justify-between">
// //                         <div className="flex items-center gap-2">
// //                           <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
// //                             {item.duration}
// //                           </span>

// //                           {item.status === "in-progress" && item.progress && (
// //                             <span className="text-xs text-gray-500 dark:text-gray-400">
// //                               {item.progress}% viewed
// //                             </span>
// //                           )}
// //                         </div>

// //                         {item.id === contentId && (
// //                           <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
// //                             <div className="flex gap-0.5">
// //                               <div
// //                                 className="w-1 h-2 bg-current animate-pulse"
// //                                 style={{ animationDelay: "0ms" }}
// //                               />
// //                               <div
// //                                 className="w-1 h-2 bg-current animate-pulse"
// //                                 style={{ animationDelay: "150ms" }}
// //                               />
// //                               <div
// //                                 className="w-1 h-2 bg-current animate-pulse"
// //                                 style={{ animationDelay: "300ms" }}
// //                               />
// //                             </div>
// //                             <span className="text-xs font-medium">Playing</span>
// //                           </div>
// //                         )}
// //                       </div>
// //                     </div>

// //                     <div
// //                       className={`transform transition-transform duration-200 group-hover:translate-x-0.5
// //                         ${item.id === contentId ? "text-blue-500" : "text-gray-400"}`}
// //                     >
// //                       <svg
// //                         className="w-4 h-4"
// //                         fill="none"
// //                         stroke="currentColor"
// //                         viewBox="0 0 24 24"
// //                       >
// //                         <path
// //                           strokeLinecap="round"
// //                           strokeLinejoin="round"
// //                           strokeWidth={2}
// //                           d="M9 5l7 7-7 7"
// //                         />
// //                       </svg>
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div className="text-center py-8 px-4">
// //               <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
// //                 <svg
// //                   className="w-6 h-6 text-gray-400"
// //                   fill="none"
// //                   stroke="currentColor"
// //                   viewBox="0 0 24 24"
// //                 >
// //                   <path
// //                     strokeLinecap="round"
// //                     strokeLinejoin="round"
// //                     strokeWidth={1.5}
// //                     d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
// //                   />
// //                 </svg>
// //               </div>
// //               <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
// //                 No content available
// //               </h3>
// //               <p className="text-xs text-gray-400 dark:text-gray-500">
// //                 Content will be added soon
// //               </p>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {!isSidebarOpen && (
// //         <Button
// //           variant="ghost"
// //           size="icon"
// //           onClick={() => setIsSidebarOpen(true)}
// //           className="h-8 w-8 border shadow-xl !rounded-full bg-gray-500 text-white mt-4 ml-2 text-gray-500 hover:bg-gray-400 dark:text-gray-400 dark:hover:bg-gray-700 z-10"
// //         >
// //           <ArrowLeft className="w-4 h-4 rotate-180" />
// //         </Button>
// //       )}

// //       <Modal
// //         isOpen={isReportModalOpen}
// //         onClose={() => setIsReportModalOpen(false)}
// //         className="max-w-md"
// //       >
// //         <div className="no-scrollbar relative w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6">
// //           <div className="flex justify-between items-center mb-4">
// //             <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
// //               Please select Issue(s)
// //             </h3>
// //             <button
// //               onClick={() => setIsReportModalOpen(false)}
// //               className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
// //             >
// //               <X className="w-5 h-5" />
// //             </button>
// //           </div>
// //           <form onSubmit={handleReportSubmit} className="space-y-4">
// //             <div className="space-y-2">
// //               <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
// //                 Specific Issue
// //               </Label>
// //               <div className="space-y-2">
// //                 {[
// //                   {
// //                     value: "wrong_content",
// //                     label: "Wrong content/information/teaching",
// //                   },
// //                   {
// //                     value: "audio_issue",
// //                     label: "Audio - Not able to hear properly",
// //                   },
// //                   { value: "buffering", label: "Video Buffering Issues" },
// //                   { value: "blank_screen", label: "Showing Blank Screen" },
// //                   { value: "screenshot", label: "Can't take screenshot" },
// //                   {
// //                     value: "chat_not_working",
// //                     label: "Chat Not Working Properly",
// //                   },
// //                   {
// //                     value: "sync_issue",
// //                     label: "Audio and Video are not in Sync",
// //                   },
// //                   { value: "stuck", label: "The video keeps getting stuck" },
// //                 ].map((issue) => (
// //                   <Radio
// //                     key={issue.value}
// //                     name="specificIssue"
// //                     value={issue.value}
// //                     checked={reportForm.specificIssue === issue.value}
// //                     onChange={(e) =>
// //                       setReportForm((prev) => ({ ...prev, specificIssue: e }))
// //                     }
// //                     label={issue.label}
// //                     className="text-sm text-gray-700 dark:text-gray-300"
// //                   />
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="flex items-center">
// //               <Checkbox
// //                 id="present-throughout"
// //                 checked={reportForm.isPresentThroughout}
// //                 onChange={(e) =>
// //                   setReportForm((prev) => ({ ...prev, isPresentThroughout: e }))
// //                 }
// //                 label="Issue was present throughout the video"
// //                 className="text-sm text-gray-700 dark:text-gray-300"
// //               />
// //             </div>

// //             <div className="grid grid-cols-2 gap-2">
// //               <div>
// //                 <Label
// //                   htmlFor="error-hours"
// //                   className="block text-sm font-medium text-gray-700 dark:text-gray-300"
// //                 >
// //                   Hours
// //                 </Label>
// //                 <Input
// //                   id="error-hours"
// //                   type="number"
// //                   min="0"
// //                   max="23"
// //                   value={reportForm.errorTime.hours}
// //                   onChange={(e) =>
// //                     setReportForm((prev) => ({
// //                       ...prev,
// //                       errorTime: { ...prev.errorTime, hours: e.target.value },
// //                     }))
// //                   }
// //                   placeholder="HH"
// //                   className="text-sm"
// //                 />
// //               </div>
// //               <div>
// //                 <Label
// //                   htmlFor="error-minutes"
// //                   className="block text-sm font-medium text-gray-700 dark:text-gray-300"
// //                 >
// //                   Minutes
// //                 </Label>
// //                 <Input
// //                   id="error-minutes"
// //                   type="number"
// //                   min="0"
// //                   max="59"
// //                   value={reportForm.errorTime.minutes}
// //                   onChange={(e) =>
// //                     setReportForm((prev) => ({
// //                       ...prev,
// //                       errorTime: { ...prev.errorTime, minutes: e.target.value },
// //                     }))
// //                   }
// //                   placeholder="MM"
// //                   className="text-sm"
// //                 />
// //               </div>
// //             </div>

// //             <div>
// //               <Label
// //                 htmlFor="issue-description"
// //                 className="block text-sm font-medium text-gray-700 dark:text-gray-300"
// //               >
// //                 Tell us more about the issue
// //               </Label>
// //               <Input
// //                 id="issue-description"
// //                 type="textarea"
// //                 value={reportForm.description}
// //                 onChange={(e) =>
// //                   setReportForm((prev) => ({
// //                     ...prev,
// //                     description: e.target.value,
// //                   }))
// //                 }
// //                 placeholder="Describe the problem in detail..."
// //                 rows={3}
// //                 className="mt-1 text-sm"
// //               />
// //             </div>

// //             <div className="flex gap-3 pt-4">
// //               <Button
// //                 type="button"
// //                 variant="outline"
// //                 onClick={() => setIsReportModalOpen(false)}
// //                 className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
// //               >
// //                 Cancel
// //               </Button>
// //               <Button
// //                 type="submit"
// //                 disabled={isSubmitting}
// //                 variant="default"
// //                 className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
// //               >
// //                 {isSubmitting ? "Submitting..." : "Submit Report"}
// //               </Button>
// //             </div>
// //           </form>
// //         </div>
// //       </Modal>

// //       <Modal
// //         isOpen={isRatingModalOpen}
// //         onClose={() => setIsRatingModalOpen(false)}
// //         className="max-w-md"
// //       >
// //         <div className="no-scrollbar relative w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6">
// //           <div className="flex justify-between items-center mb-4">
// //             <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
// //               Please share your faculty feedback
// //             </h3>
// //             <button
// //               onClick={() => setIsRatingModalOpen(false)}
// //               className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
// //             >
// //               <X className="w-5 h-5" />
// //             </button>
// //           </div>
// //           <div className="flex justify-center mb-6">
// //             {[1, 2, 3, 4, 5].map((star) => (
// //               <Button
// //                 key={star}
// //                 type="button"
// //                 variant="ghost"
// //                 size="icon"
// //                 onClick={() => setRating(star)}
// //                 className={`transition-colors p-1 ${rating >= star ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300" : "text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-400"}`}
// //                 aria-label={`Rate ${star} stars`}
// //               >
// //                 <Star
// //                   className="w-8 h-8"
// //                   fill={rating >= star ? "currentColor" : "none"}
// //                 />
// //               </Button>
// //             ))}
// //           </div>
// //           <div className="mb-6">
// //             <h4 className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
// //               Hi User! What can be improved?
// //             </h4>
// //             <div className="space-y-3">
// //               {feedbackOptions.map((option) => (
// //                 <div key={option.id} className="flex items-center">
// //                   <Checkbox
// //                     id={option.id}
// //                     checked={option.checked}
// //                     onChange={() => handleFeedbackChange(option.id)}
// //                     label={option.label}
// //                     className="text-sm text-gray-700 dark:text-gray-300"
// //                   />
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //           <div>
// //             <Label
// //               htmlFor="rating-feedback"
// //               className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
// //             >
// //               Tell us more about the issue
// //             </Label>
// //             <Input
// //               id="rating-feedback"
// //               type="textarea"
// //               value={reportForm.description}
// //               onChange={(e) =>
// //                 setReportForm((prev) => ({
// //                   ...prev,
// //                   description: e.target.value,
// //                 }))
// //               }
// //               placeholder="Share any additional feedback..."
// //               rows={3}
// //               className="mt-1 text-sm"
// //             />
// //           </div>
// //           <div className="flex gap-3 pt-4">
// //             <Button
// //               type="button"
// //               variant="outline"
// //               onClick={() => setIsRatingModalOpen(false)}
// //               className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
// //             >
// //               Cancel
// //             </Button>
// //             <Button
// //               type="submit"
// //               variant="default"
// //               disabled={isSubmitting || rating === 0}
// //               onClick={handleRatingSubmit}
// //               className={`${
// //                 rating === 0
// //                   ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
// //                   : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
// //               }`}
// //             >
// //               {isSubmitting ? "Submitting..." : "Submit Rating"}
// //             </Button>
// //           </div>
// //         </div>
// //       </Modal>
// //     </div>
// //   );
// // }
