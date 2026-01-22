'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import moment from "moment";
import { Modal } from "../../components/ui/modal";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import {
    X,
    Filter,
    Calendar,
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    PhoneOff,
    Clock,
    User,
    ChevronDown,
    ChevronUp,
    Search,
    Download,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ActivityLogsModal = ({ leadId, leadName, isOpen, onClose }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        callType: "",
        status: "",
        dateRange: "",
        duration: "",
        search: ""
    });
    const [dateRangeStart, setDateRangeStart] = useState("");
    const [dateRangeEnd, setDateRangeEnd] = useState("");
    const [expandedActivities, setExpandedActivities] = useState(new Set());
    const [stats, setStats] = useState({
        totalCalls: 0,
        answered: 0,
        missed: 0,
        abandoned: 0,
        averageDuration: 0
    });
    const observerRef = useRef();
    const lastActivityRef = useRef();

    const callTypes = [
        { value: "incoming", label: "Incoming Call", icon: PhoneIncoming, color: "text-green-600" },
        { value: "outgoing", label: "Outgoing Call", icon: PhoneOutgoing, color: "text-blue-600" },
        { value: "missed", label: "Missed Call", icon: PhoneMissed, color: "text-red-600" },
        { value: "abandoned", label: "Abandoned", icon: PhoneOff, color: "text-orange-600" }
    ];

    const statusOptions = [
        { value: "1", label: "Ringing" },
        { value: "2", label: "Answered" },
        { value: "3", label: "Completed" },
        { value: "4", label: "Busy" },
        { value: "5", label: "Failed" },
        { value: "6", label: "No Answer" },
        { value: "7", label: "Canceled" }
    ];

    const durationOptions = [
        { value: "0-30", label: "0-30 seconds" },
        { value: "30-60", label: "30-60 seconds" },
        { value: "60-300", label: "1-5 minutes" },
        { value: "300+", label: "5+ minutes" }
    ];

    const fetchActivities = useCallback(async (reset = false) => {
        if (loading) return;

        try {
            setLoading(true);
            const currentPage = reset ? 1 : page;

            const params = {
                page: currentPage,
                limit: 20,
                phone:leadId,
                ...filters
            };

            // Clean up empty params
            Object.keys(params).forEach(key => {
                if (!params[key] && params[key] !== 0) delete params[key];
            });

            const response = await api.get("/leads/activity", { params });
            const newActivities = response.data?.data || [];

            if (reset) {
                setActivities(newActivities);
            } else {
                setActivities(prev => [...prev, ...newActivities]);
            }

            setHasMore(newActivities.length === 20);
            if (!reset) setPage(prev => prev + 1);

            // Update stats if resetting
            if (reset) {
                updateStats(newActivities);
            }
        } catch (error) {
            toast.error("Failed to fetch activities");
        } finally {
            setLoading(false);
        }
    }, [page, filters, leadId, loading]);

    const updateStats = (activities) => {
        const total = activities.length;
        const answered = activities.filter(a => a.status === "2" || a.status === "3").length;
        const missed = activities.filter(a => a.status === "6").length;
        const abandoned = activities.filter(a => a.extraDetails?.hungupby === 1).length;
        const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
        const averageDuration = total > 0 ? Math.round(totalDuration / total) : 0;

        setStats({
            totalCalls: total,
            answered,
            missed,
            abandoned,
            averageDuration
        });
    };

    const resetFilters = () => {
        setFilters({
            callType: "",
            status: "",
            dateRange: "",
            duration: "",
            search: ""
        });
        setDateRangeStart("");
        setDateRangeEnd("");
        setPage(1);
        fetchActivities(true);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (type, value) => {
        if (type === "start") {
            setDateRangeStart(value);
            if (value && dateRangeEnd) {
                setFilters(prev => ({ ...prev, dateRange: `${value}_${dateRangeEnd}` }));
            }
        } else {
            setDateRangeEnd(value);
            if (dateRangeStart && value) {
                setFilters(prev => ({ ...prev, dateRange: `${dateRangeStart}_${value}` }));
            }
        }
    };

    const toggleExpand = (id) => {
        setExpandedActivities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getCallIcon = (activity) => {
        if (activity.extraDetails?.hungupby === 1) return { icon: PhoneOff, color: "text-orange-600" };
        if (activity.status === "6") return { icon: PhoneMissed, color: "text-red-600" };
        if (activity.status === "2" || activity.status === "3") return { icon: PhoneOutgoing, color: "text-green-600" };
        return { icon: PhoneIncoming, color: "text-blue-600" };
    };

    const getStatusText = (status) => {
        const statusMap = {
            "1": "Ringing",
            "2": "Answered",
            "3": "Completed",
            "4": "Busy",
            "5": "Failed",
            "6": "No Answer",
            "7": "Canceled"
        };
        return statusMap[status] || "Unknown";
    };

    const getStatusColor = (status) => {
        const colors = {
            "1": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            "2": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            "3": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            "4": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            "5": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            "6": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            "7": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        };
        return colors[status] || colors["1"];
    };

    // Infinite scroll observer
    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    fetchActivities();
                }
            },
            { threshold: 1.0 }
        );

        if (lastActivityRef.current) {
            observer.observe(lastActivityRef.current);
        }

        return () => {
            if (lastActivityRef.current) {
                observer.unobserve(lastActivityRef.current);
            }
        };
    }, [loading, hasMore, fetchActivities]);

    // Initial fetch
    useEffect(() => {
        if (isOpen) {
            setPage(1);
            fetchActivities(true);
        }
    }, [isOpen, filters]);

    const exportToCSV = () => {
        // Simple CSV export implementation
        const headers = ["Date", "Time", "Type", "Status", "Duration", "From", "To", "Recording"];
        const csvData = activities.map(activity => [
            moment(activity.createdAt).format("YYYY-MM-DD"),
            moment(activity.createdAt).format("HH:mm:ss"),
            getCallIcon(activity).icon === PhoneOutgoing ? "Outgoing" : "Incoming",
            getStatusText(activity.status),
            `${activity.duration || 0}s`,
            activity.masterCallNumber || "",
            activity.phone || "",
            activity.recordingData ? "Available" : "No"
        ]);

        const csvContent = [
            headers.join(","),
            ...csvData.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-logs-${leadName || "lead"}-${moment().format("YYYY-MM-DD")}.csv`;
        a.click();
    };

    // Group activities by date
    const groupedActivities = activities.reduce((acc, activity) => {
        const date = moment(activity.createdAt).format("DD MMM YY");
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
    }, {});

    const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
        moment(b, "DD MMM YY").diff(moment(a, "DD MMM YY"))
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-full h-screen m-0">
            <div className="flex h-full bg-white dark:bg-gray-900">
                {/* Left Sidebar - Timeline */}
                <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col overflow-y-auto">
                    {/* Header with close button */}
                    <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Student</h3>
                            {leadName && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{leadName}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Date Range Selector */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            <input
                                type="date"
                                value={dateRangeStart}
                                onChange={(e) => handleDateChange("start", e.target.value)}
                                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRangeEnd}
                                onChange={(e) => handleDateChange("end", e.target.value)}
                                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Refresh button */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => fetchActivities(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto">
                        {sortedDates.map((date) => (
                            <div key={date} className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{date}</p>
                                <div className="space-y-2">
                                    {groupedActivities[date].map((activity) => {
                                        const CallIcon = getCallIcon(activity).icon;
                                        const iconColor = getCallIcon(activity).color;
                                        return (
                                            <div
                                                key={activity._id}
                                                className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                                onClick={() => toggleExpand(activity._id)}
                                            >
                                                <CallIcon className={`w-4 h-4 ${iconColor}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                        {moment(activity.createdAt).format("HH:mm")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {activity.extraDetails?.hungupby === 1 ? "Abandoned" : 
                                                         activity.status === "6" ? "Missed" :
                                                         getStatusText(activity.status)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Top Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Activity Logs</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Tags and Actions */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {filters.callType && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                                    Call Type: {callTypes.find(t => t.value === filters.callType)?.label}
                                    <button onClick={() => setFilters(prev => ({ ...prev, callType: "" }))} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                                </span>
                            )}
                            {filters.status && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                                    Status: {statusOptions.find(s => s.value === filters.status)?.label}
                                    <button onClick={() => setFilters(prev => ({ ...prev, status: "" }))} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                                </span>
                            )}
                            {filters.duration && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full">
                                    Duration: {durationOptions.find(d => d.value === filters.duration)?.label}
                                    <button onClick={() => setFilters(prev => ({ ...prev, duration: "" }))} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                                </span>
                            )}
                            {Object.values(filters).some(f => f) && (
                                <button
                                    onClick={resetFilters}
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Quick Filters */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400">Show:</div>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, callType: prev.callType === "incoming" ? "" : "incoming" }))}
                                className={`px-2 py-1 text-xs rounded ${filters.callType === "incoming" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                            >
                                Incoming
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, callType: prev.callType === "outgoing" ? "" : "outgoing" }))}
                                className={`px-2 py-1 text-xs rounded ${filters.callType === "outgoing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                            >
                                Outgoing
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, callType: prev.callType === "missed" ? "" : "missed" }))}
                                className={`px-2 py-1 text-xs rounded ${filters.callType === "missed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                            >
                                Missed
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search activities..."
                                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Activity Feed - Vertical Timeline */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="relative">
                            {/* Vertical Timeline Line */}
                            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 to-gray-300 dark:from-blue-600 dark:to-gray-600"></div>

                            <div className="space-y-6">
                                {activities.map((activity, index) => {
                                    const CallIcon = getCallIcon(activity).icon;
                                    const iconColor = getCallIcon(activity).color;
                                    const isExpanded = expandedActivities.has(activity._id);
                                    const isLast = index === activities.length - 1;

                                    // Determine activity title
                                    let activityTitle = "Activity";
                                    if (activity.extraDetails?.hungupby === 1) {
                                        activityTitle = "Abandoned";
                                    } else if (activity.status === "6") {
                                        activityTitle = "Missed Call";
                                    } else if (activity.callType === "outgoing") {
                                        activityTitle = "Outgoing Call";
                                    } else if (activity.callType === "incoming") {
                                        activityTitle = "Incoming Call";
                                    }

                                    return (
                                        <motion.div
                                            key={activity._id}
                                            ref={isLast ? lastActivityRef : null}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="relative pl-24"
                                        >
                                            {/* Timeline Circle Badge */}
                                            <div className="absolute left-0 top-2 w-14 h-14 flex items-center justify-center">
                                                <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
                                                <div className={`relative z-10 p-3 rounded-full ${iconColor} bg-opacity-20 flex items-center justify-center`}>
                                                    <CallIcon className="w-6 h-6" />
                                                </div>
                                            </div>

                                            {/* Activity Card */}
                                            <div
                                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                                onClick={() => toggleExpand(activity._id)}
                                            >
                                                {/* Activity Header */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                                    {activityTitle}
                                                                </span>
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                                    {getStatusText(activity.status)}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                                <div>{moment(activity.createdAt).format("MMM DD, YYYY")}</div>
                                                                {activity.masterCallNumber && (
                                                                    <div className="flex items-center gap-1">
                                                                        <User className="w-3 h-3" />
                                                                        {activity.masterCallNumber}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {moment(activity.createdAt).format("HH:mm")}
                                                            </span>
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                        >
                                                            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-sm">
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 dark:text-white mb-3">Call Details</p>
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600 dark:text-gray-400">From:</span>
                                                                                <span className="font-medium text-gray-900 dark:text-white">{activity.masterCallNumber || "N/A"}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600 dark:text-gray-400">To:</span>
                                                                                <span className="font-medium text-gray-900 dark:text-white">{activity.phone || "N/A"}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                                                                <span className="font-medium text-gray-900 dark:text-white">{activity.duration || 0}s</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900 dark:text-white mb-3">Additional Info</p>
                                                                        <div className="space-y-2">
                                                                            {activity.extraDetails && Object.entries(activity.extraDetails).slice(0, 4).map(([key, value]) => (
                                                                                <div key={key} className="flex justify-between">
                                                                                    <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                                                                                    <span className="font-medium text-gray-900 dark:text-white">{String(value)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {loading && (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {!loading && activities.length === 0 && (
                                    <div className="text-center py-12">
                                        <Phone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            No activity found
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            No calls or activities match your current filters.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ActivityLogsModal;
