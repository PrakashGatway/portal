import { useState, useEffect } from "react";
import {
    X,
    CreditCard,
    Calendar,
    Tag,
    Coins,
    AlertCircle,
    Download,
    Copy,
    User,
    Receipt,
} from "lucide-react";
import api from "../axiosInstance";
import Button from "../components/ui/button/Button";

interface Transaction {
    _id: string;
    user: string | { _id: string; name: string; email: string };
    course?: { _id: string; title: string };
    type:
    | "purchase"
    | "subscription"
    | "refund"
    | "discount"
    | "referral_bonus"
    | "purchase_bonus"
    | "course_purchase";
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
    invoiceNumber?: string;
    receiptUrl?: string;
    reason?: string;
    refund?: {
        isRefunded: boolean;
        refundId?: string;
        refundAmount?: number;
        refundDate?: string;
        reason?: string;
    };
    coupon?: {
        code: string;
        discountType: "percentage" | "fixed";
        discountValue: number;
    };
    createdAt: string;
    updatedAt: string;
}

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string | null;
}

const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) => {
    const variants = {
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        secondary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        info: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant as keyof typeof variants]}`}>
            {children}
        </span>
    );
};

const TransactionDetailModal = ({ isOpen, onClose, transactionId }: TransactionDetailModalProps) => {
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);


    useEffect(() => {
        if (isOpen && transactionId) {
            fetchTransaction();
        } else {
            setTransaction(null);
            setLoading(true);
        }
    }, [isOpen, transactionId]);

    const fetchTransaction = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/payments/${transactionId}`);
            if (response.data.success) {
                setTransaction(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch transaction:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "success": return "success";
            case "pending": return "warning";
            case "failed": return "danger";
            case "refunded": return "secondary";
            case "cancelled": return "danger";
            default: return "default";
        }
    };

    const getTypeDisplayName = (type: string) => {
        const map: Record<string, string> = {
            purchase: "Purchase",
            subscription: "Subscription",
            refund: "Refund",
            discount: "Discount",
            referral_bonus: "Referral Bonus",
            purchase_bonus: "Purchase Bonus",
            course_purchase: "Course Purchase"
        };
        return map[type] || type.replace(/_/g, " ");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transaction Details</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[70vh] overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                    ) : transaction ? (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
                                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {transaction.course?.title || getTypeDisplayName(transaction.type)}
                                        </h4>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant={getStatusVariant(transaction.status)}>
                                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                            </Badge>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                via {transaction.paymentMethod}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        ₹{transaction.amount.toLocaleString("en-IN")}
                                    </div>
                                </div>
                            </div>

                            {/* Core Details */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Transaction Info */}
                                <div>
                                    <h5 className="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <CreditCard className="h-4 w-4" /> Transaction Info
                                    </h5>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Transaction ID</span>
                                            <div className="flex items-center gap-2">
                                                <code className="font-mono text-gray-900 dark:text-white">
                                                    {transaction.transactionId}
                                                </code>
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(transaction.transactionId)}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        {transaction.orderId && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                                                <span className="text-gray-900 dark:text-white">{transaction.orderId}</span>
                                            </div>
                                        )}
                                        {transaction.invoiceNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Invoice Number</span>
                                                <span className="text-gray-900 dark:text-white">{transaction.invoiceNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Type</span>
                                            <span className="text-gray-900 dark:text-white">{getTypeDisplayName(transaction.type)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Status</span>
                                            <Badge variant={getStatusVariant(transaction.status)}>
                                                {transaction.status}
                                            </Badge>
                                        </div>
                                        {transaction.reason && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Reason</span>
                                                <span className="text-gray-900 dark:text-white">{transaction.reason}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* User & Course */}
                                <div>
                                    <h5 className="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <User className="h-4 w-4" /> User & Course
                                    </h5>
                                    <div className="space-y-2.5 text-sm">
                                        {typeof transaction.user === "object" && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">User</span>
                                                    <span className="text-gray-900 dark:text-white">{transaction.user.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Email</span>
                                                    <span className="text-gray-900 dark:text-white">{transaction.user.email}</span>
                                                </div>
                                            </>
                                        )}
                                        {transaction.course && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Course</span>
                                                <span className="text-gray-900 dark:text-white">{transaction.course.title}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamps */}
                                    <h5 className="mb-3 mt-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <Calendar className="h-4 w-4" /> Timestamps
                                    </h5>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Created</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {new Date(transaction.createdAt).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Updated</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {new Date(transaction.updatedAt).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div>
                                <h5 className="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                    <Receipt className="h-4 w-4" /> Price Breakdown
                                </h5>
                                <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/30">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Base Amount</span>
                                        <span className="text-gray-900 dark:text-white">
                                            ₹{transaction.breakdown.baseAmount?.toLocaleString("en-IN") || "0"}
                                        </span>
                                    </div>
                                    {transaction.breakdown.tax > 0 && (
                                        <div className="flex justify-between text-red-600 dark:text-red-400">
                                            <span>Tax</span>
                                            <span>+₹{transaction.breakdown.tax.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    {transaction.breakdown.discount > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span>Discount</span>
                                            <span>-₹{transaction.breakdown.discount.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    {transaction.breakdown.platformFee > 0 && (
                                        <div className="flex justify-between text-red-600 dark:text-red-400">
                                            <span>Platform Fee</span>
                                            <span>+₹{transaction.breakdown.platformFee.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    {transaction.breakdown.creditsUsed > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span className="flex items-center gap-1">
                                                <Coins className="h-3.5 w-3.5" /> Credits Used
                                            </span>
                                            <span>-₹{transaction.breakdown.creditsUsed.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    {transaction.breakdown.creditsEarned > 0 && (
                                        <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span className="flex items-center gap-1">
                                                <Coins className="h-3.5 w-3.5" /> Credits Earned
                                            </span>
                                            <span>+₹{transaction.breakdown.creditsEarned.toLocaleString("en-IN")}</span>
                                        </div>
                                    )}
                                    <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total Amount</span>
                                            <span>₹{transaction.amount.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon */}
                            {transaction.coupon && (
                                <div>
                                    <h5 className="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <Tag className="h-4 w-4" /> Coupon Applied
                                    </h5>
                                    <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                                        <div className="flex justify-between">
                                            <span className="text-purple-800 dark:text-purple-300">Code</span>
                                            <span className="font-medium text-purple-800 dark:text-purple-300">
                                                {transaction.coupon.code}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-sm text-purple-700 dark:text-purple-400">
                                            {transaction.coupon.discountType === "percentage"
                                                ? `${transaction.coupon.discountValue}% off`
                                                : `₹${transaction.coupon.discountValue} off`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Refund Info */}
                            {transaction.refund?.isRefunded && (
                                <div>
                                    <h5 className="mb-3 flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-300">
                                        <AlertCircle className="h-4 w-4" /> Refund Processed
                                    </h5>
                                    <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-yellow-700 dark:text-yellow-400">Refund Amount</span>
                                                <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                                                    ₹{transaction.refund.refundAmount?.toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                            {transaction.refund.refundId && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-700 dark:text-yellow-400">Refund ID</span>
                                                    <code className="font-mono text-yellow-800 dark:text-yellow-300">
                                                        {transaction.refund.refundId}
                                                    </code>
                                                </div>
                                            )}
                                            {transaction.refund.refundDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-700 dark:text-yellow-400">Refund Date</span>
                                                    <span className="text-yellow-800 dark:text-yellow-300">
                                                        {new Date(transaction.refund.refundDate).toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            )}
                                            {transaction.refund.reason && (
                                                <div className="text-yellow-700 dark:text-yellow-400">
                                                    Reason: {transaction.refund.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">Transaction not found.</div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                    {transaction?.receiptUrl && (
                        <a
                            href={transaction.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                        >
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-3.5 w-3.5" />
                                Download Receipt
                            </Button>
                        </a>
                    )}
                    <Button onClick={onClose} size="sm">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailModal;