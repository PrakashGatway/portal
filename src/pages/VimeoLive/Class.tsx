import { useState } from "react";
import { ArrowLeft, Star, Play, FileText, Clock, User, X, ArrowRight, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal"; // Import your Modal component
import Checkbox from "../../components/form/input/Checkbox";
import Radio from "../../components/form/input/Radio";
import { VideoWithChat } from "../Player/YoutubeChat";

// --- Mock data (Replace with actual API calls) ---
const mockVideo = {
    id: "1",
    title: "Alphabetical Series",
    description: "Learn the concepts of alphabetical series with expert guidance. Master pattern recognition and sequence solving techniques used in competitive examinations.",
    duration: "36 Mins",
    module: "Clear WBP/KP Constable Reasoning Concepts",
    instructor: {
        name: "Dibyendu Kundu",
        role: "Reasoning Expert",
        experience: "4+ Years Experience",
        achievements: "Cleared SSC (CHSL 2020 & 2021 Tier 1 and Tier 2), RRC GROUP D 2019"
    },
    thumbnailUrl: "https://via.placeholder.com/1280x720?text=Video+Thumbnail",
    vimeoId: "1117388925",
    videoUrl: "https://player.vimeo.com/video/1117397798?h=f549a05166&badge=0&autopause=0&player_id=0&app_id=58479"
};

const mockBatchDetails = [
    { id: "1", type: "Video", title: "Alphabetical Series", duration: "36 Mins", status: "completed" },
    { id: "2", type: "PDF", title: "Practice Questions", duration: "N/A", status: "pending" },
    { id: "3", type: "Quiz", title: "Self-Assessment Quiz", duration: "15 Mins", status: "pending" },
    { id: "4", type: "Video", title: "Number Series Advanced", duration: "42 Mins", status: "pending" },
    { id: "6", type: "PDF", title: "Formula Sheet", duration: "N/A", status: "pending" },
    { id: "7", type: "PDF", title: "Formula Sheet", duration: "N/A", status: "pending" },
    { id: "8", type: "PDF", title: "Formula Sheet", duration: "N/A", status: "pending" },
    { id: "9", type: "PDF", title: "Formula Sheet", duration: "N/A", status: "pending" },
    { id: "10", type: "PDF", title: "Formula Sheet", duration: "N/A", status: "pending" },
    { id: "11", type: "PDF", title: "Formula Sheet", duration: "N/A", status: "pending" },

];

export default function LiveClassPage() {
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
        screenshot: null
    });
    const navigate = useNavigate();

    const handleReportSubmit = (e) => {
        e.preventDefault();
        console.log("Report submitted:", reportForm);
        // TODO: Implement actual API call
        setIsReportModalOpen(false);
        setReportForm({ issueType: "", description: "", severity: "low", specificIssue: "", errorTime: { hours: "", minutes: "", seconds: "" }, isPresentThroughout: false, screenshot: null });
    };

    const handleRatingSubmit = (e) => {
        e.preventDefault();
        console.log("Rating submitted:", rating, reportForm.feedbackOptions);
        // TODO: Implement actual API call
        setIsRatingModalOpen(false);
        setRating(0);
        setFeedbackOptions([]);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "Video":
                return <Play className="w-4 h-4" />;
            case "PDF":
                return <FileText className="w-4 h-4" />;
            case "Quiz":
                return <Clock className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    // Define colors using Tailwind classes that work for both light and dark modes
    const getTypeColorClasses = (type) => {
        switch (type) {
            case "Video":
                return "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30";
            case "PDF":
                return "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30";
            case "Quiz":
                return "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30";
            default:
                return "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700";
        }
    };

    // Status badge colors
    const getStatusBadgeClasses = (status) => {
        if (status === "completed") {
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        }
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    };

    // State for feedback options in the Rating modal
    const [feedbackOptions, setFeedbackOptions] = useState([
        { id: "presentation", label: "Good Presentation", checked: true },
        { id: "exam_oriented", label: "Content covered is exam oriented", checked: true },
        { id: "clear_explanation", label: "Explanation is clear", checked: false },
        { id: "engaging", label: "Engaging teaching style", checked: false },
        { id: "good_examples", label: "Good examples provided", checked: false }
    ]);

    // Handle checkbox change in Rating modal
    const handleFeedbackChange = (id) => {
        setFeedbackOptions(prev =>
            prev.map(option =>
                option.id === id ? { ...option, checked: !option.checked } : option
            )
        );
    };

    return (
        <div className="flex h-[85vh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Sidebar - Batch Details */}
            <div
                className={`${isSidebarOpen ? "w-80" : "w-0 opacity-0"} transition-all rounded-xl duration-300 ease-in-out flex flex-col bg-white dark:bg-gray-900 overflow-hidden`}
            >
                <div className="p-4 py-1 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200"> <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className=" text-gray-700 p-2 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" />Modules Classes
                    </Button></h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {mockBatchDetails.map((item) => (
                        <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${item.status === "completed"
                                ? "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10"
                                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                                } transition-colors duration-200`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColorClasses(item.type)}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{item.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>{item.duration}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {!isSidebarOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                </Button>
            )}

            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-4 py-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="max-h-[80vh]" style={{ paddingBottom: '56.25%' }}> {/* 16:9 Aspect Ratio */}
                            <VideoWithChat/>
                        </div>

                        {/* Video Info Section */}
                        <div className="bg-white dark:bg-gray-800 p-5 mt-[-10px] sm:p-6 rounded-xl">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-xl mt-2 sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{mockVideo.title}</h2>
                                        <p className="text-gray-600 dark:text-gray-400">{mockVideo.description}</p>
                                    </div>

                                    {/* Instructor Info */}
                                    <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{mockVideo.instructor.name}</h3>
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{mockVideo.instructor.role}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {mockVideo.instructor.experience}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {mockVideo.instructor.achievements}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
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

            {/* Report Issue Modal - Using your Modal component */}
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