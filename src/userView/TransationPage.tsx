import { useState, useEffect } from "react";
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
    ExternalLink,
    Download,
    Copy,
    Check,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";

interface Transaction {
    _id: string;
    orderId: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    type: 'credit' | 'debit';
    date: string;
    time: string;
    method: string;
    description: string;
    courseId?: string;
    courseTitle?: string;
    instructor?: string;
    referenceId: string;
}

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "secondary";
    className?: string;
}) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all";

    const variants = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        secondary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };

    return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const statuses = [
        { id: "all", name: "All Status", icon: Filter, count: 0 },
        { id: "completed", name: "Completed", icon: CheckCircle, count: 0 },
        { id: "pending", name: "Pending", icon: Clock, count: 0 },
        { id: "failed", name: "Failed", icon: XCircle, count: 0 },
        { id: "refunded", name: "Refunded", icon: TrendingDown, count: 0 },
    ];

    const types = [
        { id: "all", name: "All Types", icon: Filter, count: 0 },
        { id: "credit", name: "Credit", icon: TrendingUp, count: 0 },
        { id: "debit", name: "Debit", icon: TrendingDown, count: 0 },
    ];

    const sortOptions = [
        { id: "newest", name: "Newest First" },
        { id: "oldest", name: "Oldest First" },
        { id: "amount-high", name: "Amount: High to Low" },
        { id: "amount-low", name: "Amount: Low to High" },
    ];

    useEffect(() => {
        fetchTransactions();
    }, [searchTerm, selectedStatus, selectedType, sortBy]);

    const fetchTransactions = async () => {
        try {
            // Simulate API call
            setTimeout(() => {
                const mockTransactions: Transaction[] = [
                    {
                        _id: "1",
                        orderId: "ORD-2024-001",
                        amount: 4999,
                        status: "completed",
                        type: "debit",
                        date: "2024-01-15",
                        time: "10:30 AM",
                        method: "Credit Card",
                        description: "Complete Web Development Bootcamp",
                        courseId: "c1",
                        courseTitle: "Complete Web Development Bootcamp",
                        instructor: "John Doe",
                        referenceId: "REF-2024-001"
                    },
                    {
                        _id: "2",
                        orderId: "ORD-2024-002",
                        amount: 2999,
                        status: "pending",
                        type: "debit",
                        date: "2024-01-14",
                        time: "02:15 PM",
                        method: "UPI",
                        description: "React Masterclass",
                        courseId: "c2",
                        courseTitle: "React Masterclass",
                        instructor: "Jane Smith",
                        referenceId: "REF-2024-002"
                    },
                    {
                        _id: "3",
                        orderId: "ORD-2024-003",
                        amount: 1999,
                        status: "failed",
                        type: "debit",
                        date: "2024-01-13",
                        time: "11:45 AM",
                        method: "Net Banking",
                        description: "UI/UX Design Course",
                        courseId: "c3",
                        courseTitle: "UI/UX Design Course",
                        instructor: "Alex Johnson",
                        referenceId: "REF-2024-003"
                    },
                    {
                        _id: "4",
                        orderId: "ORD-2024-004",
                        amount: 500,
                        status: "completed",
                        type: "credit",
                        date: "2024-01-12",
                        time: "09:20 AM",
                        method: "Refund",
                        description: "Refund for course cancellation",
                        referenceId: "REF-2024-004"
                    },
                    {
                        _id: "5",
                        orderId: "ORD-2024-005",
                        amount: 7999,
                        status: "refunded",
                        type: "debit",
                        date: "2024-01-11",
                        time: "04:30 PM",
                        method: "Credit Card",
                        description: "Advanced Data Science Course",
                        courseId: "c5",
                        courseTitle: "Advanced Data Science Course",
                        instructor: "Michael Brown",
                        referenceId: "REF-2024-005"
                    }
                ];
                
                setTransactions(mockTransactions);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'failed': return 'danger';
            case 'refunded': return 'secondary';
            default: return 'default';
        }
    };

    const getTypeIcon = (type: string) => {
        return type === 'credit' ? TrendingUp : TrendingDown;
    };

    const getTypeColor = (type: string) => {
        return type === 'credit' ? 'text-green-600' : 'text-red-600';
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        </div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex gap-3">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {sortOptions.map(option => (
                                <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {statuses.map(status => {
                        const IconComponent = status.icon;
                        return (
                            <button
                                key={status.id}
                                onClick={() => setSelectedStatus(status.id)}
                                className={`flex items-center px-3 py-1.5 rounded-md border transition-all text-sm ${selectedStatus === status.id
                                    ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500"
                                    }`}
                            >
                                <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                                {status.name}
                            </button>
                        );
                    })}
                </div>

                {/* Type Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {types.map(type => {
                        const IconComponent = type.icon;
                        return (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex items-center px-3 py-1.5 rounded-md border transition-all text-sm ${selectedType === type.id
                                    ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500"
                                    }`}
                            >
                                <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                                {type.name}
                            </button>
                        );
                    })}
                </div>

                {/* Transactions List */}
                <div className="space-y-4 mb-6">
                    {transactions
                        .filter(tx => {
                            const matchesStatus = selectedStatus === "all" || tx.status === selectedStatus;
                            const matchesType = selectedType === "all" || tx.type === selectedType;
                            const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 tx.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                 tx.referenceId.toLowerCase().includes(searchTerm.toLowerCase());
                            return matchesStatus && matchesType && matchesSearch;
                        })
                        .map(transaction => {
                            const TypeIcon = getTypeIcon(transaction.type);
                            return (
                                <Card key={transaction._id} className="overflow-hidden">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <TypeIcon className={`h-5 w-5 ${getTypeColor(transaction.type)}`} />
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {transaction.description}
                                                    </h3>
                                                    <Badge variant={getStatusColor(transaction.status)}>
                                                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center">
                                                        <Calendar className="h-3.5 w-3.5 mr-1" />
                                                        {transaction.date} at {transaction.time}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                                                        {transaction.method}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium">Order ID:</span> {transaction.orderId}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end">
                                                <div className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                                                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => toggleExpand(transaction._id)}
                                                    className="text-xs mt-1 p-1 h-auto"
                                                >
                                                    {expandedId === transaction._id ? (
                                                        <>
                                                            <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                                            Hide Details
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                                            Show Details
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedId === transaction._id && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Transaction Details</h4>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Reference ID:</span>
                                                                <span className="text-gray-900 dark:text-white">{transaction.referenceId}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Method:</span>
                                                                <span className="text-gray-900 dark:text-white">{transaction.method}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                                                <Badge variant={getStatusColor(transaction.status)}>
                                                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Course Details</h4>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Course:</span>
                                                                <span className="text-gray-900 dark:text-white">{transaction.courseTitle || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Instructor:</span>
                                                                <span className="text-gray-900 dark:text-white">{transaction.instructor || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600 dark:text-gray-400">Order ID:</span>
                                                                <span className="text-gray-900 dark:text-white">{transaction.orderId}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-4 gap-2">
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Copy className="h-3.5 w-3.5 mr-1" />
                                                        Copy ID
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Download className="h-3.5 w-3.5 mr-1" />
                                                        Download Receipt
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Spent</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{transactions
                                    .filter(t => t.type === 'debit' && t.status === 'completed')
                                    .reduce((sum, t) => sum + t.amount, 0)
                                    .toLocaleString()}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-500" />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Refunded</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{transactions
                                    .filter(t => t.type === 'credit' && t.status === 'completed')
                                    .reduce((sum, t) => sum + t.amount, 0)
                                    .toLocaleString()}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Net Amount</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    ₹{transactions
                                        .filter(t => (t.type === 'debit' && t.status === 'completed') || 
                                                     (t.type === 'credit' && t.status === 'completed'))
                                        .reduce((sum, t) => 
                                            t.type === 'debit' ? sum + t.amount : sum - t.amount, 0)
                                        .toLocaleString()}
                                </p>
                            </div>
                            <Wallet className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* No Results */}
                {transactions.length === 0 && (
                    <div className="text-center py-8">
                        <CreditCard className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            No transactions found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Your transaction history will appear here once you make purchases.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}