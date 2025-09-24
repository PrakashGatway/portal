import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    CheckCircle,
    Zap,
    Gift,
    Wallet,
    ArrowRight,
    Clock,
    Users,
    Award,
    BookOpen,
    Star,
    X,
    Sparkles,
    Loader2, // Added for loading states
    AlertCircle // Added for error messages
} from "lucide-react";
import api from "../axiosInstance"; // Adjust the path to your axios instance
import { useParams, useNavigate } from "react-router"; // For routing

// --- Types ---
interface Course {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    thumbnail: { url: string };
    pricing: {
        amount: number; // Final price after base discount
        originalAmount?: number;
        currency?: string;
        discount: number; // Percentage discount applied
        earlyBird?: {
            discount: number;
            deadline: string;
        };
    };
    instructorNames: string[];
    studentsEnrolled: number;
    duration: string;
    level: string;
    categoryInfo: { name: string };
    rating: number;
    reviews: number;
    // Add other necessary fields from your API response
}

interface UserWallet {
    balance: number; // Assuming balance is in smallest currency unit (e.g., cents)
    currency: string;
    // Add other necessary fields
}

// --- Mock/Fetch Functions (Replace with real API calls) ---
const fetchCourse = async (courseSlug: string): Promise<Course> => {
    // In a real app:
    // const response = await api.get(`/courses/${courseSlug}`);
    // return response.data.data;

    // Mock data for demonstration
    return Promise.resolve({
        _id: "course_123",
        title: "Complete React Development Masterclass 2024",
        slug: "complete-react-development-masterclass-2024",
        shortDescription: "Master React with Hooks, Context API, and Redux. Build real projects!",
        thumbnail: { url: "/placeholder-course.jpg" },
        pricing: {
            amount: 14999, // 149.99
            originalAmount: 19999, // 199.99
            currency: "USD",
            discount: 25, // 25% base discount
            earlyBird: {
                discount: 30, // 30% early bird
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            }
        },
        instructorNames: ["Sarah Johnson"],
        studentsEnrolled: 2847,
        duration: "42 hours",
        level: "Intermediate",
        categoryInfo: { name: "Web Development" },
        rating: 4.8,
        reviews: 521
    });
};

const fetchUserWallet = async (): Promise<UserWallet> => {
    // In a real app:
    // const response = await api.get(`/user/wallet`);
    // return response.data;

    // Mock data for demonstration
    return Promise.resolve({
        balance: 5000, // 50.00
        currency: "USD"
    });
};

const validatePromoCode = async (code: string, courseId: string): Promise<{ isValid: boolean; discountAmount: number; message: string }> => {
    // In a real app:
    // const response = await api.post(`/promo/validate`, { code, courseId });
    // return response.data;

    // Mock validation logic
    const validCodes: Record<string, number> = {
        "SAVE20": 20, // 20% discount
        "WELCOME10": 10, // 10% discount
        "FLAT50": 50, // 50 USD flat discount (you'd need to adjust logic for flat)
    };

    const upperCode = code.toUpperCase();
    if (validCodes.hasOwnProperty(upperCode)) {
        return Promise.resolve({
            isValid: true,
            discountAmount: validCodes[upperCode] / 100, // Return as a decimal for percentage
            message: `Promo code ${upperCode} applied successfully!`
        });
    } else {
        return Promise.resolve({
            isValid: false,
            discountAmount: 0,
            message: "Invalid or expired promo code."
        });
    }
};

const initiatePayment = async (paymentData: any): Promise<{ success: boolean; redirectUrl?: string; orderId?: string; message?: string }> => {
    // In a real app:
    // const response = await api.post(`/payment/create`, paymentData);
    // return response.data; // Should contain success status and redirect URL/order ID

    // Mock payment initiation
    console.log("Initiating payment with data:", paymentData);
    return Promise.resolve({
        success: true,
        redirectUrl: "/payment-success", // Example redirect
        orderId: "order_abc123",
        message: "Payment initiated successfully."
    });
};

// --- Helper Function ---
const formatPrice = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount / 100); // Assuming amount is in cents
};

export default function CheckoutPage() {
    const { slug } = useParams<{ slug: string }>(); // Get course slug from URL
    const navigate = useNavigate(); // Hook for navigation

    // --- State ---
    const [course, setCourse] = useState<Course | null>(null);
    const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
    const [loading, setLoading] = useState<'initial' | 'promo' | 'payment' | 'none'>('initial');
    const [error, setError] = useState<string | null>(null);

    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoDiscountDecimal, setPromoDiscountDecimal] = useState(0); // As a decimal (e.g., 0.2 for 20%)
    const [promoMessage, setPromoMessage] = useState<string | null>(null);

    const [useWalletBalance, setUseWalletBalance] = useState(false);

    // --- Effects ---
    useEffect(() => {
        const loadData = async () => {
            if (!slug) {
                setError("Course slug is missing.");
                setLoading('none');
                return;
            }
            try {
                setLoading('initial');
                const [fetchedCourse, fetchedWallet] = await Promise.all([
                    fetchCourse(slug),
                    fetchUserWallet()
                ]);
                setCourse(fetchedCourse);
                setUserWallet(fetchedWallet);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load checkout information. Please try again.");
            } finally {
                setLoading('none');
            }
        };

        loadData();
    }, [slug]);

    // --- Handlers ---
    const handlePromoApply = async () => {
        if (!promoCode.trim() || !course) return;

        try {
            setLoading('promo');
            setError(null);
            setPromoMessage(null);

            const result = await validatePromoCode(promoCode, course._id);
            if (result.isValid) {
                setPromoDiscountDecimal(result.discountAmount); // Assuming percentage for now
                setPromoApplied(true);
                setPromoMessage(result.message);
            } else {
                setPromoMessage(result.message); // Show error message
            }
        } catch (err) {
            console.error("Error applying promo code:", err);
            setError("An error occurred while applying the promo code.");
        } finally {
            setLoading('none');
        }
    };

    const handleRemovePromo = () => {
        setPromoCode("");
        setPromoApplied(false);
        setPromoDiscountDecimal(0);
        setPromoMessage(null);
    };

    const handleWalletToggle = () => {
        setUseWalletBalance(!useWalletBalance);
    };

    const handlePurchase = async () => {
        if (!course || !userWallet) return;

        try {
            setLoading('payment');
            setError(null);

            // Prepare data for payment API
            const paymentData = {
                courseId: course._id,
                amount: finalPriceInCents, // The final amount to be charged
                currency: course.pricing.currency,
                promoCode: promoApplied ? promoCode : undefined,
                walletAmountUsed: actualWalletUsageInCents,
                // Add other necessary details
            };

            const result = await initiatePayment(paymentData);

            if (result.success && result.redirectUrl) {
                // Redirect to payment gateway or success page
                 navigate(result.redirectUrl, { state: { orderId: result.orderId } });
                // window.location.href = result.redirectUrl; // Alternative
            } else {
                setError(result.message || "Payment initiation failed.");
            }
        } catch (err) {
            console.error("Error initiating payment:", err);
            setError("Failed to initiate payment. Please try again.");
        } finally {
            setLoading('none');
        }
    };

    // --- Calculations (only if data is loaded) ---
    if (loading === 'initial' && !course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checkout details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!course || !userWallet) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">Course or user data not available.</p>
                </div>
            </div>
        );
    }

    // Calculate pricing based on fetched data
    const basePriceInCents = course.pricing.amount;
    const originalPriceInCents = course.pricing.originalAmount || basePriceInCents;
    const currency = course.pricing.currency || userWallet.currency || "USD";

    // Calculate promo discount amount in cents
    const promoDiscountAmountInCents = Math.round(basePriceInCents * promoDiscountDecimal);

    // Calculate wallet usage (5% of base price)
    const maxWalletUsageInCents = Math.round(basePriceInCents * 0.05);
    const actualWalletUsageInCents = useWalletBalance ? Math.min(userWallet.balance, maxWalletUsageInCents) : 0;

    // Calculate final price
    const priceAfterPromoInCents = basePriceInCents - promoDiscountAmountInCents;
    const finalPriceInCents = Math.max(0, priceAfterPromoInCents - actualWalletUsageInCents);

    // Calculate total savings
    const baseDiscountAmountInCents = originalPriceInCents - basePriceInCents;
    const totalSavingsInCents = baseDiscountAmountInCents + promoDiscountAmountInCents + actualWalletUsageInCents;

    // --- Render UI ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 transition-all duration-500">
            <div className="max-w-7xl mx-auto p-6">
                <div className="grid lg:grid-cols-3 gap-4 mx-auto">
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                        <BookOpen className="w-6 h-6 mr-3 text-blue-500" />
                                        Course Details
                                    </h2>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                        <span>{course.rating}</span>
                                        <span>•</span>
                                        <Users className="w-4 h-4" />
                                        <span>{course.studentsEnrolled?.toLocaleString()} students</span>
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-6">
                                    <div className="relative">
                                        <img
                                            src={course.thumbnail?.url ? `/api/images/${course.thumbnail.url}` : "/placeholder-course.jpg"} // Adjust image path
                                            alt={course.title}
                                            className="w-full lg:w-64 h-48 object-cover rounded-2xl shadow-lg"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-course.jpg"; }}
                                        />
                                        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            Bestseller
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                                            by {course.instructorNames?.join(", ") || "Instructor"}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                {course.duration}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Award className="w-4 h-4 mr-2 text-green-500" />
                                                {course.level}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                <Shield className="w-4 h-4 mr-2 text-purple-500" />
                                                {course.categoryInfo?.name || "Category"}
                                            </div>
                                            {/* You might want to add lessons count if available */}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                                                Lifetime Access
                                            </span>
                                            <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm">
                                                Certificate
                                            </span>
                                            <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm">
                                                Q&A Support
                                            </span>
                                            {/* Add other features dynamically if needed */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="sticky top-8"
                        >
                            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                                    <h3 className="text-xl font-bold flex items-center">
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Order Summary
                                    </h3>
                                    <p className="text-blue-100 text-sm mt-1">One-time payment • Lifetime access</p>
                                </div>

                                <div className="p-6">
                                    {/* Pricing Breakdown */}
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                                            <span className="text-gray-900 dark:text-white line-through">
                                                {formatPrice(originalPriceInCents, currency)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Discount</span>
                                            <span className="text-green-600 dark:text-green-400">
                                                -{formatPrice(baseDiscountAmountInCents, currency)}
                                            </span>
                                        </div>

                                        {/* Promo Code Section */}
                                        <AnimatePresence>
                                            {!promoApplied ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="border-t border-gray-200 dark:border-gray-600 pt-4"
                                                >
                                                    <div className="flex gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={promoCode}
                                                            onChange={(e) => setPromoCode(e.target.value)}
                                                            placeholder="Enter promo code"
                                                            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                            disabled={loading !== 'none'}
                                                        />
                                                        <button
                                                            onClick={handlePromoApply}
                                                            disabled={!promoCode.trim() || loading !== 'none'}
                                                            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center"
                                                        >
                                                            {loading === 'promo' ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                "Apply"
                                                            )}
                                                        </button>
                                                    </div>
                                                    {promoMessage && (
                                                        <div className={`mt-2 text-xs ${promoApplied ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {promoMessage}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Try: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">SAVE20</span> or <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">WELCOME10</span>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex justify-between items-center text-sm text-green-600 dark:text-green-400"
                                                >
                                                    <span className="flex items-center">
                                                        <Gift className="w-4 h-4 mr-1" />
                                                        Promo Applied
                                                    </span>
                                                    <div className="flex items-center">
                                                        <span>-{formatPrice(promoDiscountAmountInCents, currency)}</span>
                                                        <button
                                                            onClick={handleRemovePromo}
                                                            disabled={loading !== 'none'}
                                                            className="ml-2 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Wallet Balance Section */}
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="flex items-center space-x-3 cursor-pointer group">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={useWalletBalance}
                                                            onChange={handleWalletToggle}
                                                            disabled={loading !== 'none' || userWallet.balance <= 0}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                                                            useWalletBalance
                                                                ? 'bg-blue-500'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                        }`} />
                                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 transform ${
                                                            useWalletBalance ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                    </div>
                                                    <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        <Wallet className="w-4 h-4 mr-2" />
                                                        Use Wallet Balance
                                                    </span>
                                                </label>
                                            </div>
                                            {useWalletBalance && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex justify-between text-sm text-green-600 dark:text-green-400"
                                                >
                                                    <span>Wallet Credit Applied</span>
                                                    <span>-{formatPrice(actualWalletUsageInCents, currency)}</span>
                                                </motion.div>
                                            )}
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Available: {formatPrice(userWallet.balance, userWallet.currency)} (Max 5% of course price: {formatPrice(maxWalletUsageInCents, currency)})
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-6">
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span className="text-gray-900 dark:text-white">Total Amount</span>
                                            <div className="text-right">
                                                <div className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                                    {formatPrice(finalPriceInCents, currency)}
                                                </div>
                                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                    You save {formatPrice(totalSavingsInCents, currency)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {/* Checkout Button */}
                                    <motion.button
                                        onClick={handlePurchase}
                                        disabled={loading !== 'none' || finalPriceInCents <= 0}
                                        whileHover={{ scale: loading === 'none' && finalPriceInCents > 0 ? 1.02 : 1 }}
                                        whileTap={{ scale: loading === 'none' && finalPriceInCents > 0 ? 0.98 : 1 }}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                                    >
                                        <div className="relative z-10 flex items-center justify-center">
                                            {loading === 'payment' ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                    Processing Payment...
                                                </>
                                            ) : (
                                                <>
                                                    Complete Purchase
                                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </motion.button>

                                    {/* Security & Guarantee */}
                                    <div className="mt-6 space-y-3 text-center">
                                        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                            <Shield className="w-4 h-4 text-green-500" />
                                            <span>SSL Secure Payment • Encrypted</span>
                                        </div>
                                        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                            <span>30-Day Money-Back Guarantee</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Benefits */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="mt-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                            >
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                    What's Included
                                </h4>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        Lifetime access to course content
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        Certificate of completion
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        Q&A support from instructor
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        Downloadable resources
                                    </li>
                                </ul>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}