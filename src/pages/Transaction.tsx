// pages/admin/AdminTransactionsPage.tsx
import { useState, useEffect } from "react";
import {
    Search,
    Calendar,
    TrendingUp,
    TrendingDown,
    CreditCard,
    User,
    Download,
    Filter,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Eye
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import TransactionDetailModal from "./TransactionModal";

// Types
interface Transaction {
    _id: string;
    user: { _id: string; name: string; email: string };
    course?: { _id: string; title: string };
    type: string;
    amount: number;
    status: "pending" | "success" | "failed" | "refunded" | "cancelled";
    paymentMethod: string;
    transactionId: string;
    orderId?: string;
    createdAt: string;
}

interface Stats {
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    transactionCount: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
}

const AdminTransactionsPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Inside TransactionsPage component
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openTransactionModal = (id: string) => {
        setSelectedTransactionId(id);
        setIsModalOpen(true);
    };

    const closeTransactionModal = () => {
        setIsModalOpen(false);
        setSelectedTransactionId(null);
    };

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        limit: 10,
        type: "",
        status: "",
        userId: "",
        search: "",
        fromDate: "",
        toDate: ""
    });

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                page,
                ...filters
            };

            const response = await api.get("/payments/all", { params });

            if (response.data.success) {
                setTransactions(response.data.data);
                setStats(response.data.stats);
                setTotalPages(response.data.pagination.pages);
            } else {
                setError("Failed to load transactions");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters({
            limit: 10,
            type: "",
            status: "",
            userId: "",
            search: "",
            fromDate: "",
            toDate: ""
        });
        setPage(1);
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

    const getTypeDisplayName = (type: string) => {
        const map: Record<string, string> = {
            purchase: "Purchase",
            course_purchase: "Course Purchase",
            subscription: "Subscription",
            refund: "Refund",
            referral_bonus: "Referral Bonus",
            discount: "Discount",
            purchase_bonus: "Purchase Bonus"
        };
        return map[type] || type.replace(/_/g, ' ');
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('en-IN');
    };

    return (
        <div className="w-full">
            <PageMeta title="Transactions | Admin Dashboard" description="Manage all transactions" />

            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-white/[0.03]">

                {/* Stats Summary */}
                {stats && (
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                                <h3 className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                ₹{stats.totalRevenue.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center">
                                <TrendingDown className="h-6 w-6 text-red-500" />
                                <h3 className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total Refunds</h3>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                ₹{stats.totalRefunds.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center">
                                <CreditCard className="h-6 w-6 text-blue-500" />
                                <h3 className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Net Revenue</h3>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                ₹{stats.netRevenue.toLocaleString()}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center">
                                <User className="h-6 w-6 text-purple-500" />
                                <h3 className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</h3>
                            </div>
                            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.transactionCount}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Transaction ID, Order ID..."
                                className="w-full pl-10 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Types</option>
                            <option value="purchase">Purchase</option>
                            <option value="course_purchase">Course Purchase</option>
                            <option value="subscription">Subscription</option>
                            <option value="refund">Refund</option>
                            <option value="referral_bonus">Referral Bonus</option>
                            <option value="discount">Discount</option>
                            <option value="purchase_bonus">Purchase Bonus</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="success">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* User ID (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User ID</label>
                        <input
                            type="text"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            placeholder="Mongo ID"
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleDateChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                        <input
                            type="date"
                            name="toDate"
                            value={filters.toDate}
                            onChange={handleDateChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Limit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rows per page</label>
                        <select
                            name="limit"
                            value={filters.limit}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>

                    {/* Reset */}
                    <div className="flex items-end">
                        <Button
                            onClick={resetFilters}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Course</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {transactions.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
                                            <div className="font-medium">{txn.user?.name || '—'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{txn.user?.email}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {txn.course?.title || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {getTypeDisplayName(txn.type)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">
                                            ₹{txn.amount.toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(txn.status) === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                getStatusColor(txn.status) === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    getStatusColor(txn.status) === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            {formatDate(txn.createdAt)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openTransactionModal(txn._id)}
                                                className=""
                                            ><Eye className="h-3.5 w-3.5" />
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center space-x-2">
                        <Button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            variant="outline"
                            size="sm"
                        >
                            Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            variant="outline"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                )}

                {error && (
                    <div className="mt-4 text-center text-red-500">{error}</div>
                )}
            </div>

            <TransactionDetailModal
                isOpen={isModalOpen}
                onClose={closeTransactionModal}
                transactionId={selectedTransactionId}
            />
        </div>
    );
};

export default AdminTransactionsPage;