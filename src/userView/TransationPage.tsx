// pages/TransactionsPage.tsx or components/TransactionsPage.tsx
import { useState, useEffect, useRef } from "react";
import {
    Search,
    Filter,
    Calendar,
    Clock,
    CreditCard,
    Wallet,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Copy,
    ChevronDown,
    ChevronUp,
    Receipt,
    Tag,
    Coins,
    Shield,
    BookOpen,
    FileText,
    GraduationCap,
    ChevronRight,
    ChevronLeft,
    Check,
    X
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";

// ✅ Updated to match your actual API response
interface Transaction {
    _id: string;
    user: string;
    paymentFor: "McuTestSeries" | "TestTemplate" | "Course";
    type: string;
    amount: number;
    breakdown: {
        baseAmount: number;
        tax: number;
        discount: number;
        platformFee: number;
        creditsUsed: number;
        creditsEarned: number;
    };
    status: "pending" | "success" | "failed" | "refunded" | "cancelled";
    paymentMethod: "wallet" | "bank";
    transactionId: string;
    orderId?: string;
    coupon?: {
        code: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
    } | null;
    createdAt: string;
    // Dynamic entity fields
    McuTestSeries?: {
        _id: string;
        title: string;
        pricing: {
            price: number;
            salePrice: number;
            currency: string;
        };
        totalTests: number;
        tests: Array<any>;
    };
    TestTemplate?: {
        _id: string;
        title: string;
        pricing: {
            price: number;
            salePrice: number;
            currency: string;
        };
        totalDurationMinutes: number;
        totalQuestions: number;
    };
    Course?: {
        _id: string;
        title: string;
        code: string;
        pricing: {
            amount: number;
            currency: string;
            discount: number;
        };
        level: string;
        mode: string;
    };
}

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "secondary" | "info";
    className?: string;
}) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold transition-all duration-200";

    const variants = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        secondary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        info: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const LoadingSkeleton = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const PriceBreakdown = ({ breakdown }: { breakdown: Transaction['breakdown'] }) => {
    return (
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 mt-3">
            <h5 className="font-medium text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Price Breakdown
            </h5>
            <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                    <span className="text-gray-900 dark:text-white">₹{breakdown.baseAmount?.toLocaleString() || '0'}</span>
                </div>
                {breakdown.tax > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                        <span className="text-red-600 dark:text-red-400">+₹{breakdown.tax.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.discount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <span className="text-green-600 dark:text-green-400">-₹{breakdown.discount.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.platformFee > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Platform Fee:</span>
                        <span className="text-red-600 dark:text-red-400">+₹{breakdown.platformFee.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.creditsUsed > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5" />
                            Credits Used:
                        </span>
                        <span className="text-green-600 dark:text-green-400">-₹{breakdown.creditsUsed.toLocaleString()}</span>
                    </div>
                )}
                {breakdown.creditsEarned > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5" />
                            Credits Earned:
                        </span>
                        <span className="text-green-600 dark:text-green-400">+₹{breakdown.creditsEarned.toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to get entity details based on paymentFor type
const getEntityDetails = (transaction: Transaction) => {
    switch (transaction.paymentFor) {
        case 'McuTestSeries':
            return {
                title: transaction.McuTestSeries?.title || 'Test Series',
                type: 'Test Series',
                icon: BookOpen,
                details: transaction.McuTestSeries ? {
                    'Total Tests': transaction.McuTestSeries.totalTests,
                    'Original Price': `₹${transaction.McuTestSeries.pricing.price}`,
                    'Sale Price': `₹${transaction.McuTestSeries.pricing.salePrice}`,
                } : {}
            };
        case 'TestTemplate':
            return {
                title: transaction.TestTemplate?.title || 'Test',
                type: 'Test',
                icon: FileText,
                details: transaction.TestTemplate ? {
                    'Duration': `${transaction.TestTemplate.totalDurationMinutes} mins`,
                    'Questions': transaction.TestTemplate.totalQuestions,
                    'Original Price': `₹${transaction.TestTemplate.pricing.price}`,
                    'Sale Price': `₹${transaction.TestTemplate.pricing.salePrice}`,
                } : {}
            };
        case 'Course':
            return {
                title: transaction.Course?.title || 'Course',
                type: 'Course',
                icon: GraduationCap,
                details: transaction.Course ? {
                    'Course Code': transaction.Course.code,
                    'Level': transaction.Course.level,
                    'Mode': transaction.Course.mode,
                    'Original Price': `₹${transaction.Course.pricing.amount}`,
                    'Discount': `${transaction.Course.pricing.discount}%`,
                } : {}
            };
        default:
            return {
                title: 'Unknown',
                type: 'Unknown',
                icon: CreditCard,
                details: {}
            };
    }
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedType, setSelectedType] = useState("all");

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchChange = (value: string) => {
        setDebouncedSearchTerm(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 700);
    };
    
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const statuses = [
        { id: "all", name: "All", icon: Filter, color: "gray" },
        { id: "success", name: "Completed", icon: CheckCircle, color: "green" },
        { id: "pending", name: "Pending", icon: Clock, color: "yellow" },
        { id: "failed", name: "Failed", icon: XCircle, color: "red" },
        { id: "refunded", name: "Refunded", icon: TrendingDown, color: "blue" },
        { id: "cancelled", name: "Cancelled", icon: AlertCircle, color: "red" },
    ];

    const paymentForTypes = [
        { id: "all", name: "All Types", icon: Filter },
        { id: "McuTestSeries", name: "Test Series", icon: BookOpen },
        { id: "TestTemplate", name: "Tests", icon: FileText },
        { id: "Course", name: "Courses", icon: GraduationCap },
    ];

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
            page,
            limit,
        };

        if (selectedStatus !== "all") params.status = selectedStatus;
        if (selectedType !== "all") params.type = selectedType;
        if (searchTerm) params.search = searchTerm;

        try {
            const response = await api.get("/payments", { params });

            if (response.data.success) {
                setTransactions(response.data.data);
                setTotalPages(response.data.pagination.pages);
            } else {
                setError("Failed to load transactions");
            }
        } catch (err: any) {
            console.error("API Error:", err);
            setError(err.response?.data?.message || "Unable to fetch transactions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, selectedStatus, selectedType, searchTerm]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [selectedStatus, selectedType, searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'danger';
            case 'refunded': return 'secondary';
            case 'cancelled': return 'danger';
            default: return 'default';
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            }),
            datetime: date.toISOString()
        };
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="min-h-screen dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-3 sm:px-3 py-2">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Transaction History
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track all your payments and purchases
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-all duration-300">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Transaction ID, or Item name..."
                                value={debouncedSearchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className=" flex justify-between items-center">
                        {/* Status Filters */}
                       

                        {/* Type Filters */}
                        <div>
                           
                            <div className="flex flex-wrap gap-2">
                                {paymentForTypes.map(type => {
                                    const IconComponent = type.icon;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id)}
                                            className={`flex items-center px-4 py-2.5 rounded-full border transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95 ${
                                                selectedType === type.id
                                                    ? "bg-orange-500 text-white"
                                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            }`}
                                        >
                                            <IconComponent className="h-4 w-4 mr-2" />
                                            {type.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
    
  


    {/* RIGHT SIDE FILTER BUTTON */}
    <button
        type="button"
        onClick={() => setIsFilterOpen(true)}
        className="
            group
            flex
            items-center
            gap-2
            rounded-full
            border
            border-gray-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-gray-700
            shadow-sm
            transition-all
            duration-200

            hover:border-[#f6673c]
            hover:bg-[#fff7f4]
            hover:text-[#f6673c]
            hover:shadow-md

            dark:border-gray-700
            dark:bg-gray-800
            dark:text-gray-300
            dark:hover:border-[#f6673c]
            dark:hover:bg-[#f6673c]/10
            dark:hover:text-[#f6673c]
        "
    >
        <Filter className="h-4 w-4 transition-transform group-hover:rotate-12" />

        <span>Filter</span>

        {/* SELECTED COUNT */}
        {selectedStatus && (
            <span
                className="
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-[#f6673c]
                    px-1.5
                    text-[10px]
                    font-bold
                    text-white
                "
            >
                1
            </span>
        )}
    </button>


    {/* ====================================================== */}
    {/* BACKDROP + RIGHT FILTER PANEL */}
    {/* ====================================================== */}

    {isFilterOpen && (
        <div className="fixed inset-0 z-[999]">

            {/* BACKDROP */}

            <div
                onClick={() => setIsFilterOpen(false)}
                className="
                    absolute
                    inset-0
                    bg-black/30
                    backdrop-blur-[3px]
                    animate-in
                    fade-in
                    duration-200
                "
            />


            {/* ================================================== */}
            {/* RIGHT COMPACT FILTER CARD */}
            {/* ================================================== */}

            <div
                className="
                    absolute
                    right-24
                    bottom-14
                    w-[280px]
                    max-w-[calc(100vw-2rem)]
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                    shadow-2xl
                    animate-in
                    slide-in-from-right-5
                    duration-300

                    dark:border-gray-700
                    dark:bg-gray-900
                "
            >

                {/* ============================================== */}
                {/* HEADER */}
                {/* ============================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-gray-100
                        bg-gradient-to-r
                        from-[#fff8f5]
                        to-white
                        px-5
                        py-2

                        dark:border-gray-800
                        dark:from-[#f6673c]/10
                        dark:to-gray-900
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                bg-[#f6673c]
                                text-white
                                shadow-sm
                            "
                        >
                            <Filter className="h-4 w-4" />
                        </div>

                        <div>
                            <h3
                                className="
                                    text-sm
                                    font-bold
                                    text-gray-900
                                    dark:text-white
                                "
                            >
                                Filter Transactions
                            </h3>

                            <p className="mt-0.5 text-[10px] text-gray-400">
                                Select a status
                            </p>
                        </div>

                    </div>


                    {/* CLOSE */}

                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-gray-400
                            transition

                            hover:bg-gray-100
                            hover:text-gray-700

                            dark:hover:bg-gray-800
                            dark:hover:text-gray-200
                        "
                    >
                        <X className="h-4 w-4" />
                    </button>

                </div>


                {/* ============================================== */}
                {/* FILTER CONTENT */}
                {/* ============================================== */}

                <div className="max-h-[40vh] overflow-y-auto p-2">

                    <p
                        className="
                            mb-3
                            text-[11px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-gray-400
                        "
                    >
                        Status
                    </p>


                    <div className="space-y-">

                        {statuses.map((status) => {

                            const IconComponent = status.icon;

                            const colorClasses = {
                                green: {
                                    active:
                                        "bg-green-500 border-green-500 text-white shadow-green-500/20",
                                    icon:
                                        "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
                                    hover:
                                        "hover:border-green-300 hover:bg-green-50",
                                },

                                yellow: {
                                    active:
                                        "bg-yellow-500 border-yellow-500 text-white shadow-yellow-500/20",
                                    icon:
                                        "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
                                    hover:
                                        "hover:border-yellow-300 hover:bg-yellow-50",
                                },

                                red: {
                                    active:
                                        "bg-red-500 border-red-500 text-white shadow-red-500/20",
                                    icon:
                                        "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
                                    hover:
                                        "hover:border-red-300 hover:bg-red-50",
                                },

                                blue: {
                                    active:
                                        "bg-blue-500 border-blue-500 text-white shadow-blue-500/20",
                                    icon:
                                        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
                                    hover:
                                        "hover:border-blue-300 hover:bg-blue-50",
                                },

                                gray: {
                                    active:
                                        "bg-[#f6673c] border-orange-600 text-white shadow-orange-500/20",
                                    icon:
                                        "bg-orange-100 text-orange-600 dark:bg-gray-700 dark:text-gray-300",
                                    hover:
                                        "hover:border-orange-300 hover:bg-orange-50",
                                },

                                orange: {
                                    active:
                                        "bg-[#f6673c] border-[#f6673c] text-white shadow-[#f6673c]/20",
                                    icon:
                                        "bg-[#fff1ec] text-[#f6673c]",
                                    hover:
                                        "hover:border-[#f6673c]/40 hover:bg-[#fff7f4]",
                                },
                            };

                            const colors =
                                colorClasses[status.color] ||
                                colorClasses.orange;

                            const isSelected =
                                selectedStatus === status.id;


                            return (
                                <button
                                    key={status.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedStatus(status.id)
                                    }
                                    className={`
                                        flex
                                        w-full
                                        items-center
                                        justify-between
                                       rounded-full
                                        px-3
                                        py-1
                                        text-sm
                                        font-medium
                                       

                                        ${
                                            isSelected
                                                ? `${colors.active} shadow-lg`
                                                : `
                                                    border-gray-200
                                                    
                                                    text-gray-700
                                                    ${colors.hover}

                                                    dark:border-gray-700
                                                    dark:bg-gray-800
                                                    dark:text-gray-300
                                                `
                                        }
                                    `}
                                >

                                    <div className="flex items-center justify-between gap-7">

                                        {/* ICON */}

                                        <div
                                            className={`
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-lg

                                                ${
                                                    isSelected
                                                        ? "bg-white/20 text-white"
                                                        : colors.icon
                                                }
                                            `}
                                        >
                                            <IconComponent className="h-4 w-4" />
                                        </div>


                                        {/* NAME */}

                                        <span>
                                            {status.name}
                                        </span>

                                    </div>


                                    {/* CHECK */}

                                    {isSelected && (
                                        <div
                                            className="
                                                flex
                                                h-5
                                                w-5
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-white/20
                                            "
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}

                                </button>
                            );
                        })}

                    </div>

                </div>


                {/* ============================================== */}
                {/* FOOTER */}
                {/* ============================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        border-t
                        border-gray-100
                        bg-gray-50/70
                        px-4
                        py-3

                        dark:border-gray-800
                        dark:bg-gray-800/50
                    "
                >

                    {/* CLEAR */}

                    <button
                        type="button"
                        onClick={() => setSelectedStatus("")}
                        className="
                            rounded-lg
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-gray-500
                            transition
                            hover:bg-gray-100
                            hover:text-gray-800
                            dark:hover:bg-gray-800
                            dark:hover:text-gray-200
                        "
                    >
                        Clear
                    </button>


                    {/* APPLY */}

                    <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="
                            rounded-lg
                            bg-[#f6673c]
                            px-5
                            py-2
                            text-xs
                            font-semibold
                            text-white
                            shadow-sm
                            transition-all
                            duration-200
                            hover:bg-[#e9572d]
                            hover:shadow-md
                            active:scale-95
                        "
                    >
                        Apply Filter
                    </button>

                </div>

            </div>

        </div>
    )}

</div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {(loading && transactions.length === 0) && (
                    <div className="space-y-3">
                        <LoadingSkeleton />
                    </div>
                )}

                {/* Transactions List */}
               {/* ============================================================= */}
{/* TRANSACTION TABLE */}
{/* ============================================================= */}

<div
    className="
        mb-8
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-[0_4px_20px_rgba(0,0,0,0.03)]
        dark:border-gray-800
        dark:bg-gray-900
    "
>

    {/* ========================================================= */}
    {/* TABLE TOP BAR */}
    {/* ========================================================= */}

    <div
        className="
            flex
            min-h-[58px]
            items-center
            justify-between
            border-b
            border-gray-100
            px-5
            py-3
            dark:border-gray-800
        "
    >

        {/* LEFT */}

        <div>

            <h3
                className="
                    text-lg
                    font-bold
                    text-gray-900
                    dark:text-white
                "
            >
                All Transactions
            </h3>

        </div>


        {/* RIGHT */}

        <div className="flex items-center gap-3">

            <span
                className="
                    hidden
                    text-sm
                    text-gray-500
                    sm:block
                    dark:text-gray-400
                "
            >
                Showing 1 to {transactions.length} of{" "}
                {transactions.length}
            </span>


            <div className="flex items-center gap-1">

                <button
                    type="button"
                    className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        text-gray-400
                        transition-all
                        duration-200
                        hover:border-[#f6673c]
                        hover:bg-[#fff7f4]
                        hover:text-[#f6673c]
                        dark:border-gray-700
                        dark:bg-gray-900
                    "
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>


                <button
                    type="button"
                    className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-gray-200
                        bg-white
                        text-gray-400
                        transition-all
                        duration-200
                        hover:border-[#f6673c]
                        hover:bg-[#fff7f4]
                        hover:text-[#f6673c]
                        dark:border-gray-700
                        dark:bg-gray-900
                    "
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

            </div>

        </div>

    </div>


    {/* ========================================================= */}
    {/* TABLE HEADER */}
    {/* ========================================================= */}

    <div
        className="
            hidden
            grid-cols-[110px_minmax(260px,1.8fr)_120px_140px_110px_40px]
            items-center
            gap-4
            border-b
            border-gray-100
            bg-[#fff8f5]
            px-5
            py-3
            md:grid
            dark:border-gray-800
            dark:bg-[#f6673c]/5
        "
    >

        {/* DATE */}

        <div
            className="
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-gray-500
                dark:text-gray-400
            "
        >
            Date
        </div>


        {/* DESCRIPTION */}

        <div
            className="
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-gray-500
                dark:text-gray-400
            "
        >
            Description
        </div>


        {/* TYPE */}

        <div
            className="
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-gray-500
                dark:text-gray-400
            "
        >
            Type
        </div>


        {/* STATUS */}

        <div
            className="
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-gray-500
                dark:text-gray-400
            "
        >
            Status
        </div>


        {/* AMOUNT */}

        <div
            className="
                text-right
                text-sm
                font-bold
                uppercase
                tracking-wide
                text-gray-500
                dark:text-gray-400
            "
        >
            Amount
        </div>


        {/* ACTION */}

        <div />

    </div>


    {/* ========================================================= */}
    {/* TRANSACTION CONTENT */}
    {/* ========================================================= */}

    <div className="divide-y divide-gray-100 dark:divide-gray-800">

        {!loading &&
            transactions.map((transaction, index) => {

                const { date, time } =
                    formatDate(transaction.createdAt);

                const entityDetails =
                    getEntityDetails(transaction);

                const EntityIcon =
                    entityDetails.icon;

                const status =
                    transaction.status?.toLowerCase();

                const isRefunded =
                    status === "refunded";


                return (

                    <div
                        key={transaction._id}
                        className="
                            group
                            w-full
                            transition-colors
                            duration-200
                            hover:bg-[#fffaf8]
                            dark:hover:bg-gray-800/40
                        "
                        style={{
                            animationDelay: `${index * 100}ms`,
                        }}
                    >

                        {/* ================================================= */}
                        {/* DESKTOP TRANSACTION ROW */}
                        {/* ================================================= */}

                        <div
                            className="
                                hidden
                                min-h-[82px]
                                grid-cols-[110px_minmax(260px,1.8fr)_120px_140px_110px_40px]
                                items-center
                                gap-4
                                px-5
                                py-3
                                md:grid
                            "
                        >

                            {/* ============================================= */}
                            {/* DATE */}
                            {/* ============================================= */}

                            <div className="leading-none">

                                <p
                                    className="
                                        text-lg
                                        font-bold
                                        leading-none
                                        text-gray-800
                                        dark:text-white
                                    "
                                >
                                    {date
                                        ? new Date(date).toLocaleDateString(
                                              "en-IN",
                                              {
                                                  day: "2-digit",
                                              }
                                          )
                                        : "--"}
                                </p>


                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        font-semibold
                                        uppercase
                                        text-gray-400
                                    "
                                >
                                    {date
                                        ? new Date(date).toLocaleDateString(
                                              "en-IN",
                                              {
                                                  month: "short",
                                                  year: "numeric",
                                              }
                                          )
                                        : "--"}
                                </p>


                                <p
                                    className="
                                        mt-1
                                        text-sm
                                        text-gray-400
                                    "
                                >
                                    {time}
                                </p>

                            </div>


                            {/* ============================================= */}
                            {/* DESCRIPTION */}
                            {/* ============================================= */}

                            <div
                                className="
                                    flex
                                    min-w-0
                                    items-center
                                    gap-3
                                "
                            >

                                {/* ICON */}

                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#fff0eb]
                                        text-[#f6673c]
                                        transition-all
                                        duration-200
                                        group-hover:bg-[#f6673c]
                                        group-hover:text-white
                                    "
                                >
                                    <EntityIcon className="h-4 w-4" />
                                </div>


                                {/* TEXT */}

                                <div className="min-w-0">

                                    <h3
                                        className="
                                            truncate
                                            text-sm
                                            font-semibold
                                            text-gray-800
                                            dark:text-white
                                        "
                                    >
                                        {entityDetails.title}
                                    </h3>


                                    <p
                                        className="
                                            mt-1
                                            truncate
                                            text-sm
                                            text-gray-400
                                        "
                                    >
                                        Order ID:{" "}

                                        <span
                                            className="
                                                font-medium
                                                text-gray-500
                                                dark:text-gray-300
                                            "
                                        >
                                            {transaction.orderId || "—"}
                                        </span>
                                    </p>

                                </div>

                            </div>


                            {/* ============================================= */}
                            {/* TYPE */}
                            {/* ============================================= */}

                            <div>

                                <span
                                    className="
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        rounded-md
                                        bg-[#fff5f1]
                                        px-2.5
                                        py-1.5
                                        text-sm
                                        font-semibold
                                        text-[#f6673c]
                                    "
                                >

                                    <Receipt className="h-3 w-3" />

                                    {entityDetails.type}

                                </span>

                            </div>


                            {/* ============================================= */}
                            {/* STATUS */}
                            {/* ============================================= */}

                            <div>

                                {status === "completed" && (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-green-50
                                            px-2.5
                                            py-1.5
                                            text-sm
                                            font-semibold
                                            text-green-600
                                            dark:bg-green-500/10
                                            dark:text-green-400
                                        "
                                    >

                                        <span
                                            className="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                bg-green-500
                                            "
                                        />

                                        Completed

                                    </span>

                                )}


                                {status === "pending" && (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-yellow-50
                                            px-2.5
                                            py-1.5
                                            text-sm
                                            font-semibold
                                            text-yellow-600
                                        "
                                    >

                                        <span
                                            className="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                bg-yellow-500
                                            "
                                        />

                                        Pending

                                    </span>

                                )}
                                {status === "success" && (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-green-50
                                            px-2.5
                                            py-1.5
                                            text-sm
                                            font-semibold
                                            text-green-600
                                        "
                                    >

                                        <span
                                            className="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                bg-green-500
                                            "
                                        />

                                        Success

                                    </span>

                                )}


                                {status === "failed" && (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-red-50
                                            px-2.5
                                            py-1.5
                                            text-sm
                                            font-semibold
                                            text-red-600
                                        "
                                    >

                                        <span
                                            className="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                bg-red-500
                                            "
                                        />

                                        Failed

                                    </span>

                                )}


                                {status === "refunded" && (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-blue-50
                                            px-2.5
                                            py-1.5
                                            text-sm
                                            font-semibold
                                            text-blue-600
                                            dark:bg-blue-500/10
                                            dark:text-blue-400
                                        "
                                    >

                                        <span
                                            className="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                bg-blue-500
                                            "
                                        />

                                        Refunded

                                    </span>

                                )}


                                {status === "cancelled" && (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            rounded-md
                                            bg-gray-100
                                            px-2.5
                                            py-1.5
                                            text-sm
                                            font-semibold
                                            text-gray-600
                                            dark:bg-gray-800
                                            dark:text-gray-300
                                        "
                                    >

                                        <span
                                            className="
                                                h-1.5
                                                w-1.5
                                                rounded-full
                                                bg-gray-500
                                            "
                                        />

                                        Cancelled

                                    </span>

                                )}

                            </div>


                            {/* ============================================= */}
                            {/* AMOUNT */}
                            {/* ============================================= */}

                            <div
                                className={`
                                    text-right
                                    text-sm
                                    font-bold
                                    sm:text-base
                                    ${
                                        isRefunded
                                            ? "text-green-600"
                                            : "text-[#f6673c]"
                                    }
                                `}
                            >

                                {isRefunded ? "+" : "-"}₹
                                {transaction.amount?.toLocaleString(
                                    "en-IN"
                                )}

                            </div>


                            {/* ============================================= */}
                            {/* ACTION */}
                            {/* ============================================= */}

                            <div className="flex justify-end">

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleExpand(
                                            transaction._id
                                        )
                                    }
                                    className="
                                        flex
                                        h-8
                                        w-8
                                        items-center
                                        justify-center
                                        rounded-full
                                        text-gray-400
                                        transition-all
                                        duration-200
                                        hover:bg-[#fff1ec]
                                        hover:text-[#f6673c]
                                    "
                                >

                                    {expandedId ===
                                    transaction._id ? (

                                        <ChevronUp
                                            className="h-4 w-4"
                                        />

                                    ) : (

                                        <ChevronDown
                                            className="h-4 w-4"
                                        />

                                    )}

                                </button>

                            </div>

                        </div>


                        {/* ================================================= */}
                        {/* MOBILE TRANSACTION ROW */}
                        {/* ================================================= */}

                        <div
                            className="
                                block
                                px-4
                                py-4
                                md:hidden
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-start
                                    gap-3
                                "
                            >

                                {/* ICON */}

                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#fff0eb]
                                        text-[#f6673c]
                                    "
                                >
                                    <EntityIcon className="h-4 w-4" />
                                </div>


                                {/* CONTENT */}

                                <div
                                    className="
                                        min-w-0
                                        flex-1
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            items-start
                                            justify-between
                                            gap-3
                                        "
                                    >

                                        <div className="min-w-0">

                                            <h3
                                                className="
                                                    truncate
                                                    text-sm
                                                    font-semibold
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                {entityDetails.title}
                                            </h3>

                                            <p
                                                className="
                                                    mt-1
                                                    text-sm
                                                    text-gray-400
                                                "
                                            >
                                                Order ID:{" "}
                                                {transaction.orderId ||
                                                    "—"}
                                            </p>

                                        </div>


                                        <span
                                            className={`
                                                shrink-0
                                                text-sm
                                                font-bold
                                                ${
                                                    isRefunded
                                                        ? "text-green-600"
                                                        : "text-[#f6673c]"
                                                }
                                            `}
                                        >
                                            {isRefunded
                                                ? "+"
                                                : "-"}₹
                                            {transaction.amount?.toLocaleString(
                                                "en-IN"
                                            )}
                                        </span>

                                    </div>


                                    <div
                                        className="
                                            mt-2
                                            flex
                                            flex-wrap
                                            items-center
                                            gap-2
                                        "
                                    >

                                        <span
                                            className="
                                                text-sm
                                                text-gray-400
                                            "
                                        >
                                            {date} · {time}
                                        </span>


                                        <span
                                            className="
                                                h-1
                                                w-1
                                                rounded-full
                                                bg-gray-300
                                            "
                                        />


                                        <span
                                            className="
                                                rounded-md
                                                bg-[#fff5f1]
                                                px-2
                                                py-1
                                                text-[9px]
                                                font-semibold
                                                text-[#f6673c]
                                            "
                                        >
                                            {entityDetails.type}
                                        </span>


                                        <Badge
                                            variant={getStatusColor(
                                                transaction.status
                                            )}
                                            className="
                                                rounded-md
                                                px-2
                                                py-1
                                                text-[9px]
                                                font-semibold
                                            "
                                        >
                                            {transaction.status}
                                        </Badge>

                                    </div>

                                </div>


                                {/* ARROW */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleExpand(
                                            transaction._id
                                        )
                                    }
                                    className="
                                        shrink-0
                                        rounded-full
                                        p-1
                                        text-gray-400
                                        hover:bg-[#fff1ec]
                                        hover:text-[#f6673c]
                                    "
                                >

                                    {expandedId ===
                                    transaction._id ? (

                                        <ChevronUp
                                            className="h-4 w-4"
                                        />

                                    ) : (

                                        <ChevronDown
                                            className="h-4 w-4"
                                        />

                                    )}

                                </button>

                            </div>

                        </div>


                        {/* ================================================= */}
                        {/* EXPANDED DETAILS */}
                        {/* ================================================= */}

                        {expandedId === transaction._id && (

                            <div
                                className="
                                    border-t
                                    border-[#f6673c]/10
                                    bg-[#fffaf8]
                                    px-4
                                    py-5
                                    sm:px-5
                                    dark:border-gray-800
                                    dark:bg-gray-900/60
                                "
                            >

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        gap-4
                                        lg:grid-cols-3
                                    "
                                >

                                    {/* ===================================== */}
                                    {/* TRANSACTION DETAILS */}
                                    {/* ===================================== */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-gray-100
                                            bg-white
                                            p-4
                                            dark:border-gray-800
                                            dark:bg-gray-900
                                        "
                                    >

                                        <div
                                            className="
                                                mb-4
                                                flex
                                                items-center
                                                gap-2
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-[#fff1ec]
                                                    text-[#f6673c]
                                                "
                                            >
                                                <CreditCard
                                                    className="h-4 w-4"
                                                />
                                            </div>


                                            <h4
                                                className="
                                                    text-sm
                                                    font-bold
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                Transaction Details
                                            </h4>

                                        </div>


                                        <div className="space-y-3">

                                            {/* TRANSACTION ID */}

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                "
                                            >

                                                <span
                                                    className="
                                                        text-sm
                                                        text-gray-500
                                                        dark:text-gray-400
                                                    "
                                                >
                                                    Transaction ID
                                                </span>


                                                <div
                                                    className="
                                                        flex
                                                        min-w-0
                                                        items-center
                                                        gap-2
                                                    "
                                                >

                                                    <code
                                                        className="
                                                            max-w-[190px]
                                                            truncate
                                                            rounded-md
                                                            bg-gray-50
                                                            px-2
                                                            py-1.5
                                                            font-mono
                                                            text-sm
                                                            text-gray-700
                                                            dark:bg-gray-800
                                                            dark:text-gray-300
                                                        "
                                                    >
                                                        {
                                                            transaction.transactionId
                                                        }
                                                    </code>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyToClipboard(
                                                                transaction.transactionId,
                                                                transaction._id
                                                            )
                                                        }
                                                        className="
                                                            rounded-md
                                                            p-1.5
                                                            text-gray-400
                                                            transition
                                                            hover:bg-[#fff1ec]
                                                            hover:text-[#f6673c]
                                                        "
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>

                                                </div>

                                            </div>


                                            {/* PAYMENT METHOD */}

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                "
                                            >

                                                <span className="text-sm text-gray-500">
                                                    Payment Method
                                                </span>


                                                <span
                                                    className="
                                                        rounded-full
                                                        bg-blue-50
                                                        px-2.5
                                                        py-1
                                                        text-sm
                                                        font-semibold
                                                        capitalize
                                                        text-blue-600
                                                    "
                                                >
                                                    {
                                                        transaction.paymentMethod
                                                    }
                                                </span>

                                            </div>


                                            {/* STATUS */}

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                "
                                            >

                                                <span className="text-sm text-gray-500">
                                                    Status
                                                </span>


                                                <Badge
                                                    variant={getStatusColor(
                                                        transaction.status
                                                    )}
                                                    className="
                                                        rounded-full
                                                        px-2.5
                                                        py-1
                                                        text-sm
                                                    "
                                                >
                                                    {
                                                        transaction.status
                                                    }
                                                </Badge>

                                            </div>


                                            {/* COUPON */}

                                            {transaction.coupon && (

                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-3
                                                    "
                                                >

                                                    <span className="text-sm text-gray-500">
                                                        Coupon
                                                    </span>

                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {
                                                            transaction.coupon
                                                                .code
                                                        }
                                                    </span>

                                                </div>

                                            )}

                                        </div>

                                    </div>


                                    {/* ===================================== */}
                                    {/* ITEM DETAILS */}
                                    {/* ===================================== */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-gray-100
                                            bg-white
                                            p-4
                                            dark:border-gray-800
                                            dark:bg-gray-900
                                        "
                                    >

                                        <div
                                            className="
                                                mb-4
                                                flex
                                                items-center
                                                gap-2
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-[#fff1ec]
                                                    text-[#f6673c]
                                                "
                                            >
                                                <EntityIcon
                                                    className="h-4 w-4"
                                                />
                                            </div>


                                            <h4
                                                className="
                                                    text-sm
                                                    font-bold
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                {entityDetails.type} Details
                                            </h4>

                                        </div>


                                        <div className="space-y-3">

                                            {/* NAME */}

                                            <div
                                                className="
                                                    flex
                                                    items-start
                                                    justify-between
                                                    gap-4
                                                "
                                            >

                                                <span className="text-sm text-gray-500">
                                                    Name
                                                </span>


                                                <span
                                                    className="
                                                        max-w-[65%]
                                                        text-right
                                                        text-sm
                                                        font-semibold
                                                        text-gray-800
                                                        dark:text-gray-200
                                                    "
                                                >
                                                    {
                                                        entityDetails.title
                                                    }
                                                </span>

                                            </div>


                                            {/* DETAILS */}

                                            {Object.entries(
                                                entityDetails.details
                                            ).map(
                                                ([key, value]) => (

                                                    <div
                                                        key={key}
                                                        className="
                                                            flex
                                                            items-center
                                                            justify-between
                                                            gap-4
                                                        "
                                                    >

                                                        <span className="text-sm text-gray-500">
                                                            {key}
                                                        </span>


                                                        <span
                                                            className="
                                                                text-right
                                                                text-sm
                                                                font-medium
                                                                capitalize
                                                                text-gray-800
                                                                dark:text-gray-200
                                                            "
                                                        >
                                                            {value}
                                                        </span>

                                                    </div>

                                                )
                                            )}


                                            {/* ORDER ID */}

                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-4
                                                "
                                            >

                                                <span className="text-sm text-gray-500">
                                                    Order ID
                                                </span>


                                                <span
                                                    className="
                                                        text-sm
                                                        font-semibold
                                                        text-gray-800
                                                        dark:text-gray-200
                                                    "
                                                >
                                                    {
                                                        transaction.orderId ||
                                                        "—"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    </div>


                                    {/* ===================================== */}
                                    {/* PRICE BREAKDOWN */}
                                    {/* ===================================== */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-[#f6673c]/10
                                            bg-gradient-to-br
                                            from-[#fff8f5]
                                            to-[#fff1ec]
                                            p-4
                                            dark:border-[#f6673c]/20
                                            dark:from-[#f6673c]/10
                                            dark:to-gray-900
                                        "
                                    >

                                        <div
                                            className="
                                                mb-4
                                                flex
                                                items-center
                                                gap-2
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    bg-[#f6673c]
                                                    text-white
                                                "
                                            >
                                                <Receipt
                                                    className="h-4 w-4"
                                                />
                                            </div>


                                            <h4
                                                className="
                                                    text-sm
                                                    font-bold
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                Price Breakdown
                                            </h4>

                                        </div>


                                        <PriceBreakdown
                                            breakdown={
                                                transaction.breakdown
                                            }
                                        />


                                        <div
                                            className="
                                                my-4
                                                border-t
                                                border-dashed
                                                border-[#f6673c]/20
                                            "
                                        />


                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                            "
                                        >

                                            <span
                                                className="
                                                    text-sm
                                                    font-bold
                                                    text-gray-900
                                                    dark:text-white
                                                "
                                            >
                                                Total Paid
                                            </span>


                                            <span
                                                className={`
                                                    text-xl
                                                    font-bold
                                                    ${
                                                        isRefunded
                                                            ? "text-green-600"
                                                            : "text-[#f6673c]"
                                                    }
                                                `}
                                            >
                                                {isRefunded
                                                    ? "+"
                                                    : "-"}₹
                                                {transaction.amount?.toLocaleString(
                                                    "en-IN"
                                                ) || "0"}
                                            </span>

                                        </div>

                                    </div>

                                </div>


                                {/* ========================================= */}
                                {/* COPY BUTTONS */}
                                {/* ========================================= */}

                                <div
                                    className="
                                        mt-4
                                        flex
                                        flex-wrap
                                        justify-end
                                        gap-2
                                        border-t
                                        border-gray-100
                                        pt-4
                                        dark:border-gray-800
                                    "
                                >

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            copyToClipboard(
                                                transaction.transactionId,
                                                transaction._id
                                            )
                                        }
                                        className="
                                            h-9
                                            rounded-lg
                                            border-gray-200
                                            bg-white
                                            px-4
                                            text-sm
                                            hover:border-[#f6673c]
                                            hover:bg-[#fff7f4]
                                            hover:text-[#f6673c]
                                        "
                                    >

                                        <Copy className="mr-2 h-3.5 w-3.5" />

                                        {copiedId === transaction._id
                                            ? "Copied!"
                                            : "Copy Transaction ID"}

                                    </Button>


                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!transaction.orderId}
                                        onClick={() =>
                                            copyToClipboard(
                                                transaction.orderId || "",
                                                `order-${transaction._id}`
                                            )
                                        }
                                        className="
                                            h-9
                                            rounded-lg
                                            border-gray-200
                                            bg-white
                                            px-4
                                            text-sm
                                            hover:border-[#f6673c]
                                            hover:bg-[#fff7f4]
                                            hover:text-[#f6673c]
                                        "
                                    >

                                        <Copy className="mr-2 h-3.5 w-3.5" />

                                        {copiedId ===
                                        `order-${transaction._id}`
                                            ? "Copied!"
                                            : "Copy Order ID"}

                                    </Button>

                                </div>

                            </div>

                        )}

                    </div>

                );

            })}

    </div>


    {/* ========================================================= */}
    {/* BOTTOM PAGINATION */}
    {/* ========================================================= */}

    <div
        className="
            flex
            flex-col
            gap-3
            border-t
            border-gray-100
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            dark:border-gray-800
        "
    >

        <span className="text-sm text-gray-400">
            Showing 1 to {transactions.length} of{" "}
            {transactions.length} transactions
        </span>


       <div className="flex items-center gap-1">

    {/* PREVIOUS */}

    <button
        type="button"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className={`
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            border
            border-gray-200
            text-gray-400
            transition-all
            duration-200

            ${
                page === 1
                    ? "cursor-not-allowed opacity-40"
                    : "hover:border-[#f6673c] hover:bg-[#fff7f4] hover:text-[#f6673c]"
            }

            dark:border-gray-700
        `}
    >
        <ChevronLeft className="h-4 w-4" />
    </button>


    {/* PAGE NUMBERS */}

    {Array.from(
        { length: page },
        (_, index) => index + 1
    ).map((pageNumber) => (

        <button
            key={pageNumber}
            type="button"
            onClick={() =>
                handlePageChange(pageNumber)
            }
            className={`
                flex
                h-8
                min-w-8
                items-center
                justify-center
                rounded-lg
                px-2
                text-sm
                font-medium
                transition-all
                duration-200

                ${
                 page === pageNumber
                        ? `
                            bg-[#f6673c]
                            text-white
                            shadow-sm
                        `
                        : `
                            text-gray-500
                            hover:bg-[#fff1ec]
                            hover:text-[#f6673c]
                            dark:text-gray-400
                        `
                }
            `}
        >
            {pageNumber}
        </button>

    ))}


    {/* NEXT */}

    <button
        type="button"
        onClick={() =>
            handlePageChange(page + 1)
        }
        disabled={
            page === totalPages
        }
        className={`
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            border
            border-gray-200
            text-gray-400
            transition-all
            duration-200

            ${
                page === totalPages
                    ? "cursor-not-allowed opacity-40"
                    : "hover:border-[#f6673c] hover:bg-[#fff7f4] hover:text-[#f6673c]"
            }

            dark:border-gray-700
        `}
    >
        <ChevronRight className="h-4 w-4" />
    </button>

</div>

    </div>

</div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-8 animate-in fade-in duration-500">
                        <Button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            variant="outline"
                            size="lg"
                            className="px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        >
                            Previous
                        </Button>
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                            Page <span className="text-blue-600 dark:text-blue-400">{page}</span> of {totalPages}
                        </span>
                        <Button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            variant="outline"
                            size="lg"
                            className="px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                        >
                            Next
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {transactions.length === 0 && !loading && (
                    <div className="text-center py-16 animate-in fade-in duration-500">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
                            <CreditCard className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-6 transition-colors duration-300" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No transactions found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {searchTerm || selectedStatus !== "all" || selectedType !== "all"
                                    ? "Try adjusting your filters to see more results."
                                    : "Your transaction history will appear here once you make your first purchase."
                                }
                            </p>
                            {(searchTerm || selectedStatus !== "all" || selectedType !== "all") && (
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setDebouncedSearchTerm("");
                                        setSelectedStatus("all");
                                        setSelectedType("all");
                                    }}
                                    variant="primary"
                                    size="lg"
                                    className="rounded-xl px-8 py-3 transition-all duration-200 transform hover:scale-105"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="text-center py-8 animate-in fade-in duration-300">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 max-w-md mx-auto">
                            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Unable to load transactions</h3>
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                            <Button
                                onClick={fetchTransactions}
                                variant="outline"
                                size="sm"
                                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}