import React, { useEffect, useState } from "react";
import api, { ImageBaseUrl } from "../axiosInstance";

const FeedbackPage = () => {
    const [activeTab, setActiveTab] = useState("report");
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [debounce, setDebounce] = useState("");
    const [pagination, setPagination] = useState({
        total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false,
    });
    const [filters, setFilters] = useState({
        search: "", contentref: "", type: "report_issue", severity: "", rating: ""
    });
    const [selectedItem, setSelectedItem] = useState(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebounce(filters.search), 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Sync tab → type filter & reset page
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFilters((prev) => ({
            ...prev,
            type: tab === "report" ? "report_issue" : "rate_video",
            severity: "", // reset severity when switching tabs
            rating: ""
        }));
        setPage(1);
    };

    // Fetch from backend with ALL filters server-side
    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (debounce) params.append("search", debounce);
            if (filters.contentref) params.append("contentref", filters.contentref);
            if (filters.type) params.append("type", filters.type);
            if (filters.rating) {
                params.append("rating", filters.rating);
            }
            if (filters.severity) params.append("severity", filters.severity);
            params.append("page", page);
            params.append("limit", 10);

            const response = await api.get(`/feedback?${params.toString()}`);
            setFeedbacks(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [page, debounce, filters.contentref, filters.type, filters.severity, filters.rating]);

    // Reset page when filters change (except page itself)
    useEffect(() => {
        setPage(1);
    }, [debounce, filters.contentref, filters.type, filters.severity,filters.rating]);

    // Helpers
    const severityStyle = (sev) => {
        if (sev === "high") return "bg-red-100 text-red-700";
        if (sev === "medium") return "bg-yellow-100 text-yellow-700";
        return "bg-green-100 text-green-700";
    };
    const refStyle = (ref) => {
        if (ref === "LiveClasses") return "bg-red-50 text-red-600 border-red-200";
        if (ref === "RecordedClasses") return "bg-blue-50 text-blue-600 border-blue-200";
        return "bg-purple-50 text-purple-600 border-purple-200";
    };
    const Stars = ({ rating }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className={`w-4 h-4 ${s <= rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
    const fmtTime = (t) => {
        if (!t) return "—";
        return `${String(t.hours || 0).padStart(2, "0")}:${String(t.minutes || 0).padStart(2, "0")}:${String(t.seconds || 0).padStart(2, "0")}`;
    };
    const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const formatContentRef = (value) => {
    return value
        ?.replace(/([a-z])([A-Z])/g, "$1 $2")
        .trim();
};

    return (
        <div className="min-h-screen p-4 md:p-8 font-sans text-gray-800">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Feedback Management</h1>
                <p className="text-gray-500 mt-1">Manage user reports and content reviews</p>
            </div>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Tabs + Filters Row */}
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

    {/* Top Section */}
    <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            {/* Tabs */}
            <div className="inline-flex items-center bg-gray-100/80 rounded-lg p-1 border border-gray-100 w-fit">
                {["report", "review"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`
                            relative min-w-[105px]
                            px-5 py-2.5
                            rounded-md
                            text-sm font-semibold
                            capitalize
                            transition-all duration-200
                            ${
                                activeTab === tab
                                    ? "bg-white text-orange-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }
                        `}
                    >
                        {tab === "report" ? "Reports" : "Reviews"}

                        {/* Active indicator */}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-orange-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-[320px]">
                <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>

                <input
                    type="text"
                    placeholder={`Search ${activeTab === "report" ? "reports" : "reviews"}...`}
                    value={filters.search}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            search: e.target.value,
                        }))
                    }
                    className="
                        w-full
                        pl-10 pr-10
                        py-2.5
                        rounded-lg
                        border border-gray-200
                        bg-gray-50/50
                        text-sm text-gray-700
                        placeholder:text-gray-400
                        focus:outline-none
                        focus:bg-white
                        focus:border-orange-300
                        focus:ring-4
                        focus:ring-orange-50
                        transition-all duration-200
                    "
                />

                {/* Search shortcut / icon */}
                {filters.search && (
                    <button
                        onClick={() =>
                            setFilters((prev) => ({
                                ...prev,
                                search: "",
                            }))
                        }
                        className="
                            absolute right-3 top-1/2
                            -translate-y-1/2
                            w-5 h-5
                            rounded-full
                            flex items-center justify-center
                            text-gray-400
                            hover:text-orange-500
                            hover:bg-orange-50
                            transition
                        "
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    </div>

    {/* Divider */}
    <div className="border-t border-gray-100" />

    {/* Filters */}
    <div className="px-4 sm:px-5 py-3.5 bg-gray-50/40">
        <div className="flex flex-wrap items-center gap-2.5">

            {/* Filter Label */}
            <div className="flex items-center gap-2 mr-1">
                <div className="w-7 h-7 rounded-md bg-orange-50 flex items-center justify-center">
                    <svg
                        className="w-3.5 h-3.5 text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 11.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-9.586L3.293 6.707A1 1 0 013 6V4z"
                        />
                    </svg>
                </div>

                <span className="text-xs font-semibold text-gray-500">
                    Filters
                </span>
            </div>

            {/* Content Type */}
            <select
                value={filters.contentref}
                onChange={(e) =>
                    setFilters((prev) => ({
                        ...prev,
                        contentref: e.target.value,
                    }))
                }
                className="
                    h-9
                    text-xs sm:text-sm
                    font-medium
                    text-gray-600
                    bg-white
                    border border-gray-200
                    rounded-lg
                    px-3
                    pr-8
                    outline-none
                    cursor-pointer
                    hover:border-orange-200
                    focus:border-orange-300
                    focus:ring-4
                    focus:ring-orange-50
                    transition-all
                "
            >
                <option value="">All Content Types</option>
                <option value="LiveClasses">Live Classes</option>
                <option value="RecordedClasses">Recorded Classes</option>
                <option value="StudyMaterials">Study Materials</option>
            </select>

            {/* Rating */}
            {activeTab === "review" && (
                <select
                    value={filters.rating}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            rating: e.target.value,
                        }))
                    }
                    className="
                        h-9
                        text-xs sm:text-sm
                        font-medium
                        text-gray-600
                        bg-white
                        border border-gray-200
                        rounded-lg
                        px-3
                        pr-8
                        outline-none
                        cursor-pointer
                        hover:border-orange-200
                        focus:border-orange-300
                        focus:ring-4
                        focus:ring-orange-50
                        transition-all
                    "
                >
                    <option value="">All Ratings</option>
                    <option value="5">⭐ 5 Stars</option>
                    <option value="4">⭐ 4 Stars</option>
                    <option value="3">⭐ 3 Stars</option>
                    <option value="2">⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                </select>
            )}

            {/* Severity */}
            {activeTab === "report" && (
                <select
                    value={filters.severity}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            severity: e.target.value,
                        }))
                    }
                    className="
                        h-9
                        text-xs sm:text-sm
                        font-medium
                        text-gray-600
                        bg-white
                        border border-gray-200
                        rounded-lg
                        px-3
                        pr-8
                        outline-none
                        cursor-pointer
                        hover:border-orange-200
                        focus:border-orange-300
                        focus:ring-4
                        focus:ring-orange-50
                        transition-all
                    "
                >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            )}

            {/* Clear Filters */}
            {(filters.contentref ||
                filters.severity ||
                filters.rating ||
                filters.search) && (
                <button
                    onClick={() =>
                        setFilters((prev) => ({
                            ...prev,
                            search: "",
                            contentref: "",
                            severity: "",
                            rating: "",
                        }))
                    }
                    className="
                        ml-auto
                        inline-flex items-center gap-1.5
                        h-9
                        px-3
                        rounded-lg
                        text-xs
                        font-semibold
                        text-orange-600
                        bg-orange-50
                        border border-orange-100
                        hover:bg-orange-100
                        hover:border-orange-200
                        transition-all
                    "
                >
                    <span className="text-sm">×</span>
                    Clear filters
                </button>
            )}
        </div>
    </div>
</div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && feedbacks.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No {activeTab}s found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
                    </div>
                )}

                {/* Cards Grid — NO client-side filtering, data is already filtered by API */}
                {!loading && feedbacks.length > 0 && (
                    <>
                       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    {feedbacks.map((item) => (
        <div
            key={item._id}
            onClick={() => setSelectedItem(item)}
            className="
                group relative bg-white rounded-xl
                border border-gray-200
                cursor-pointer
                overflow-hidden
                transition-all duration-200
                hover:border-orange-300
                hover:shadow-[0_8px_30px_rgba(234,88,12,0.08)]
            "
        >
            {/* Left Highlight */}

            <div className="p-5 pl-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">

                        {/* Content Type */}
                        <span
                            className="
                                inline-flex items-center
                                px-2.5 py-1
                                rounded-md
                                bg-orange-50
                                border border-orange-100
                                text-[11px]
                                font-semibold
                                text-orange-600
                            "
                        >
                            {formatContentRef(item.contentref)}
                        </span>

                        {/* Severity */}
                        {activeTab === "report" && (
                            <span
                                className={`
                                    px-2.5 py-1
                                    rounded-md
                                    text-[11px]
                                    font-semibold
                                    capitalize
                                    ${severityStyle(item.severity)}
                                `}
                            >
                                {item.severity}
                            </span>
                        )}
                    </div>

                    {/* Date */}
                    <span className="text-[11px] text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }
                        )}
                    </span>
                </div>

                {/* Content Title */}
                <div className="mb-4">
                    <h3
                        className="
                            text-[15px]
                            font-semibold
                            text-gray-900
                            leading-5
                            line-clamp-2
                            group-hover:text-orange-600
                            transition-colors
                        "
                    >
                        {item.content?.title || "Unknown Content"}
                    </h3>

                    {/* User */}
                    <div className="flex items-center gap-2 mt-2">
                        <div
                            className="
                                w-6 h-6
                                rounded-full
                                bg-orange-100
                                text-orange-600
                                flex items-center justify-center
                                text-[10px]
                                font-bold
                            "
                        >
                            {(item.user?.name || "A")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <span className="text-xs text-gray-500">
                            {item.user?.name || "Anonymous"}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mb-4" />

                {/* REPORT */}
                {activeTab === "report" ? (
                    <>
                        {/* Issue Type */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400">
                                Issue Type
                            </span>

                            <span className="text-xs font-medium text-gray-700">
                                {item.issueType || "General Issue"}
                            </span>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                            <p className="text-xs leading-5 text-gray-600 line-clamp-2">
                                {item.description ||
                                    item.message ||
                                    "No description provided."}
                            </p>
                        </div>

                        {/* Screenshot */}
                        {item.screenshot && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                                <span>📎</span>
                                <span>Screenshot attached</span>
                            </div>
                        )}
                    </>
                ) : (
                    /* REVIEW */
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-400">
                                Student Rating
                            </span>

                            <div className="flex items-center gap-1.5">
                                <Stars rating={item.rating} />

                                <span className="text-xs font-semibold text-gray-700">
                                    {item.rating}/5
                                </span>
                            </div>
                        </div>

                        <div className="bg-orange-50/50 rounded-lg px-3 py-2.5 border border-orange-100">
                            <p className="text-xs leading-5 text-gray-600 line-clamp-2">
                                {item.message ||
                                    "No review message provided."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bottom */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400">
                        {activeTab === "report"
                            ? "Issue Report"
                            : "Video Review"}
                    </span>

                    <span
                        className="
                            text-[11px]
                            font-semibold
                            text-orange-500
                            opacity-0
                            group-hover:opacity-100
                            transition-opacity
                        "
                    >
                        View details →
                    </span>
                </div>
            </div>
        </div>
    ))}
</div>

                        {/* Pagination */}
                        {pagination?.totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
                                <p className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        disabled={!pagination.hasPrevPage}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={!pagination.hasNextPage}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${refStyle(selectedItem.contentref)}`}>
                                    {formatContentRef(selectedItem.contentref)}
                                </span>
                                {activeTab === "report" && (
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityStyle(selectedItem.severity)}`}>
                                        {selectedItem.severity} severity
                                    </span>
                                )}
                                {activeTab === "review" && <Stars rating={selectedItem.rating} />}
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {selectedItem.content && (
                                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                    {selectedItem.content.thumbnailPic && (
                                        <img src={`${ImageBaseUrl}/${selectedItem.content.thumbnailPic}`} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{selectedItem.content.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{selectedItem.content.description}</p>
                                        {selectedItem.content.slug && <p className="text-xs text-orange-500 mt-2 font-mono">/{selectedItem.content.slug}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                                    {(selectedItem.user?.name || "?")[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedItem.user?.name || "Anonymous"}</p>
                                    <p className="text-gray-400 text-xs">{formatDate(selectedItem.createdAt)}</p>
                                </div>
                            </div>

                            {activeTab === "report" && (
                                <div className="space-y-4">
                                    {selectedItem.issueType && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Issue Type</label>
                                            <p className="text-sm text-gray-800 mt-1">{selectedItem.issueType}</p>
                                        </div>
                                    )}
                                    {selectedItem.specificIssue && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Specific Issue</label>
                                            <p className="text-sm text-gray-800 mt-1">{selectedItem.specificIssue}</p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</label>
                                        <p className="text-sm text-gray-800 mt-1 leading-relaxed">{selectedItem.description || selectedItem.message || "—"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Error Timestamp</label>
                                            <p className="text-sm text-gray-800 mt-1 font-mono">{fmtTime(selectedItem.errorTime)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Present Throughout</label>
                                            <p className="text-sm text-gray-800 mt-1">{selectedItem.isPresentThroughout ? "Yes" : "No"}</p>
                                        </div>
                                    </div>
                                    {selectedItem.screenshot && (
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Screenshot</label>
                                            <img src={selectedItem.screenshot} alt="Screenshot" className="mt-2 rounded-lg border border-gray-200 max-w-full" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "review" && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Review Message</label>
                                    <p className="text-sm text-gray-800 mt-1 leading-relaxed">{selectedItem.message || "No message provided."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackPage;