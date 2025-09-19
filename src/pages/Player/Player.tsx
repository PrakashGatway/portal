import { useState, useEffect } from "react"; // Added useEffect
import {
    ArrowLeft,
    Star,
    Play,
    FileText,
    Clock,
    User,
    X,
    TriangleAlert,
    RadioIcon,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router"; // Added useParams
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import Checkbox from "../../components/form/input/Checkbox";
import Radio from "../../components/form/input/Radio";
import api from "../../axiosInstance"; // Import your axios instance
import { VideoWithChat } from "./YoutubeChat";
import WaitingRoom from "../liveClass/WaitingRoom";


export default function VideoPlayerPage() {
    const { contentId, courseId } = useParams();
    const [searchParams] = useSearchParams();
    const moduleId = searchParams.get("module");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [rating, setRating] = useState(0);
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

    const [moduleDetails, setModuleDetails] = useState(null);
    const [contentDetails, setContentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showWaitingRoom, setWaitingRoom] = useState(false);
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
                `/modules/overview/${moduleId}?course=${courseId}`
            );
            setModuleDetails(moduleResponse.data?.data); // Adjust based on your API response structure

            const contentResponse = await api.get(
                `/content/${contentId}`
            );
            setContentDetails(contentResponse.data.data); // Adjust based on your API response structure
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

    const handleReportSubmit = (e) => {
        e.preventDefault();
        setIsReportModalOpen(false);
        setReportForm({
            issueType: "",
            description: "",
            severity: "low",
            specificIssue: "",
            errorTime: { hours: "", minutes: "", seconds: "" },
            isPresentThroughout: false,
            screenshot: null,
        });
    };
    useEffect(() => {
        if (contentDetails?.contentType === "LiveClasses") {
            const now = new Date();
            setWaitingRoom(true)
            let timeUntilStart = null;

            if (contentDetails.scheduledStart) {
                const scheduledStartTime = new Date(contentDetails.scheduledStart);
                timeUntilStart = scheduledStartTime - now;
                const bufferMinutes = 1;
                const bufferMilliseconds = bufferMinutes * 60 * 1000;
                if (timeUntilStart <= bufferMilliseconds) {
                    setWaitingRoom(false)
                }
            } else {
                setWaitingRoom(false)
            }
        }
    }, [contentDetails])

    const handleRatingSubmit = (e) => {
        e.preventDefault();
        setIsRatingModalOpen(false);
        setRating(0);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "Video":
            case "RecordedClasses": // Map RecordedClasses to Video icon
                return <Play className="w-4 h-4" />;
            case "LiveClasses": // Map RecordedClasses to Video icon
                return <RadioIcon className="w-4 h-4" />;
            case "PDF":
            case "StudyMaterials": // Map StudyMaterials to PDF icon
                return <FileText className="w-4 h-4" />;
            case "Quiz":
            case "Tests": // Map Tests to Quiz/Clock icon
                return <Clock className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const getTypeColorClasses = (type) => {
        switch (type) {
            case "Video":
            case "RecordedClasses":
                return "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30";
            case "PDF":
            case "StudyMaterials":
                return "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30";
            case "Quiz":
            case "Tests":
                return "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30";
            default:
                return "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700";
        }
    };

    const getStatusBadgeClasses = (status) => {
        const displayStatus = status === 'scheduled' ? 'pending' : status;

        if (displayStatus === "completed") {
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        } else if (displayStatus === "published") {
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        }
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    };

    const handleFeedbackChange = (id) => {
        setFeedbackOptions((prev) =>
            prev.map((option) =>
                option.id === id ? { ...option, checked: !option.checked } : option
            )
        );
    };

    if (loading) {
        return (
            <div className="flex h-[85vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[85vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-red-500 dark:text-red-400">Error: {error}</div>
            </div>
        );
    }

    if (!moduleDetails || !contentDetails) {
        return (
            <div className="flex h-[85vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-500 dark:text-gray-400">Data not found.</div>
            </div>
        );
    }

    const batchContentList = [
        ...(moduleDetails.recordedClasses?.map(item => ({
            id: item._id,
            type: "RecordedClasses",
            title: item.title,
            duration: item.duration ? `${item.duration} mins` : (item.video?.duration ? `${item.video.duration} secs` : "N/A"),
            status: item.status, // 'published'
        })) || []),
        ...(moduleDetails.liveClasses?.map(item => ({
            id: item._id,
            type: "LiveClasses", // Use actual type from API if different
            title: item.title,
            duration: item.duration ? `${item.duration} mins` : "N/A", // Format duration
            status: item.status, // 'published' or 'scheduled'
        })) || []),
        // ...(moduleDetails.tests?.map(item => ({
        //     id: item._id,
        //     type: "Tests",
        //     title: item.title,
        //     duration: "N/A", // Tests usually don't have a duration like videos
        //     status: item.status, // 'published'
        // })) || []),
        // ...(moduleDetails.studyMaterials?.map(item => ({
        //     id: item._id,
        //     type: "StudyMaterials",
        //     title: item.title,
        //     duration: "N/A",
        //     status: item.status, // 'published'
        // })) || []),
    ];

    return (
        <div className="flex h-[85vh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div
                className={`${isSidebarOpen ? "w-80" : "w-0 opacity-0"
                    } transition-all rounded-xl duration-300 ease-in-out flex flex-col bg-white dark:bg-gray-900 overflow-hidden`}
            >
                <div className="p-4 py-1 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {moduleDetails.title || "Module"}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className={`w-4 h-4 ${isSidebarOpen ? '' : 'rotate-180'}`} /> {/* Rotate icon based on state */}
                    </Button>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {batchContentList.length > 0 ? (
                        batchContentList.map((item) => (
                            <div
                                key={item.id}
                                className={`p-3 rounded-lg border ${item.id === contentId // Highlight the currently playing content
                                    ? "ring-2 ring-blue-500 border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                                    : item.status === "completed"
                                        ? "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10"
                                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                    } transition-colors duration-200 cursor-pointer hover:shadow-sm`}
                                onClick={() => {
                                    navigate(`/class/${item.id}/${courseId}?module=${moduleId}`);
                                }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColorClasses(
                                            item.type
                                        )}`}
                                    >
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate flex-1">
                                        {item.title}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>{item.duration}</span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                                            item.status
                                        )}`}
                                    >
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                            No content available in this batch.
                        </div>
                    )}
                </div>
            </div>

            {!isSidebarOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="h-8 w-8 self-start mt-4 ml-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 z-10"
                >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
            )}

            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 py-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {contentDetails.contentType == "RecordedClasses" ?

                            <div className="relative w-full" style={{ paddingBottom: "57.25%" }}>
                                {contentDetails.video?.url ? ( // Check if video URL exists
                                    <iframe
                                        src={contentDetails.video.url.trim()} // Trim whitespace
                                        frameBorder="0"
                                        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        title={contentDetails.title}
                                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                                        onError={(e) => console.error("Error loading video:", e)}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            {contentDetails.materialType === 'pdf' ? 'PDF Content' : 'Video not available'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            :
                            <div className="pb-4"> {/* 16:9 Aspect Ratio */}
                                {showWaitingRoom ? (
                                    <WaitingRoom setWaitingRoom={setWaitingRoom} contentDetails={contentDetails} classId={contentId} />
                                ) : (
                                    <VideoWithChat status={contentDetails.status} classTitle={contentDetails?.title || ""} classId={contentId} videoId={contentDetails?.meetingId} />
                                )}
                            </div>
                        }

                        {/* Video Info Section */}
                        <div className="bg-white dark:bg-gray-800 p-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-xl mt-2 sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                            {contentDetails.title}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {contentDetails.description}
                                        </p>
                                    </div>
                                    {contentDetails.instructorInfo && (contentDetails.instructorInfo.name || contentDetails.instructorInfo.email) && (
                                        <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {contentDetails.instructorInfo.name || contentDetails.instructorInfo.email}
                                                </h3>
                                                {/* You can add more instructor details here if available in instructorInfo */}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsReportModalOpen(true)}
                                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            <TriangleAlert className="w-4 h-4 mr-2" />
                                            Report Issue
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() => setIsRatingModalOpen(true)}
                                            className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                        >
                                            <Star className="w-4 h-4 mr-2" />
                                            Rate Video
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} className="max-w-md">
                <div className="no-scrollbar relative w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Please select Issue(s)</h3>
                        <button
                            onClick={() => setIsReportModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specific Issue</Label>
                            <div className="space-y-2">
                                {[
                                    { value: "wrong_content", label: "Wrong content/information/teaching" },
                                    { value: "audio_issue", label: "Audio - Not able to hear properly" },
                                    { value: "buffering", label: "Video Buffering Issues" },
                                    { value: "blank_screen", label: "Showing Blank Screen" },
                                    { value: "screenshot", label: "Can't take screenshot" },
                                    { value: "chat_not_working", label: "Chat Not Working Properly" },
                                    { value: "sync_issue", label: "Audio and Video are not in Sync" },
                                    { value: "stuck", label: "The video keeps getting stuck" }
                                ].map((issue) => (
                                    <Radio
                                        key={issue.value}
                                        name="specificIssue"
                                        value={issue.value}
                                        checked={reportForm.specificIssue === issue.value}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, specificIssue: e }))}
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
                                onChange={(e) => setReportForm(prev => ({ ...prev, isPresentThroughout: e }))}
                                label="Issue was present throughout the video"
                                className="text-sm text-gray-700 dark:text-gray-300"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="error-hours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hours</Label>
                                <Input
                                    id="error-hours"
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={reportForm.errorTime.hours}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, errorTime: { ...prev.errorTime, hours: e.target.value } }))}
                                    placeholder="HH"
                                    className="text-sm"
                                />
                            </div>
                            <div>
                                <Label htmlFor="error-minutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minutes</Label>
                                <Input
                                    id="error-minutes"
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={reportForm.errorTime.minutes}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, errorTime: { ...prev.errorTime, minutes: e.target.value } }))}
                                    placeholder="MM"
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="issue-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tell us more about the issue</Label>
                            <Input
                                id="issue-description"
                                type="textarea"
                                value={reportForm.description}
                                onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
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
                                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="default"
                                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                            >
                                Submit Report
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Rating Modal - Using your Modal component */}
            <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} className="max-w-md">
                <div className="no-scrollbar relative w-full max-w-md overflow-y-auto rounded-3xl bg-white dark:bg-gray-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Please share your faculty feedback</h3>
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
                                className={`transition-colors p-1 ${rating >= star ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300' : 'text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-400'}`}
                                aria-label={`Rate ${star} stars`}
                            >
                                <Star
                                    className="w-8 h-8"
                                    fill={rating >= star ? 'currentColor' : 'none'}
                                />
                            </Button>
                        ))}
                    </div>
                    <div className="mb-6">
                        <h4 className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Hi User! What can be improved?</h4>
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
                        <Label htmlFor="rating-feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tell us more about the issue</Label>
                        <Input
                            id="rating-feedback"
                            type="textarea"
                            value={reportForm.description}
                            onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
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
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="default"
                            disabled={rating === 0}
                            onClick={handleRatingSubmit}
                            className={`${rating === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                                }`}
                        >
                            Submit Feedback
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}