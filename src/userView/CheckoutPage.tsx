import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    CheckCircle,
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
    Loader2,
    AlertCircle,
    UserRoundSearch,
    ArrowLeft,
    FileText,
    Layers,
    Zap,
    CreditCard,
    Lock,
    BadgePercent,
    GraduationCap,
    Timer,
    BarChart3,
    Tag,
    TrendingDown,
    Check
} from "lucide-react";
import api, { ImageBaseUrl } from "../axiosInstance";
import { useParams, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/UserContext";
import Button from "../components/ui/button/Button";
import Loader from "./Loader";

// --- Types (keeping your existing types) ---
interface BaseProduct {
    _id: string;
    title: string;
    description: string;
}

interface CoursePricing {
    amount: number;
    originalAmount?: number;
    currency: string;
    discount?: number;
    earlyBird?: {
        discount: number;
        deadline: string;
    };
}

interface TestSeriesPricing {
    isSellable: boolean;
    isFree: boolean;
    price: number;
    salePrice: number;
    currency: string;
}

interface CourseProduct extends BaseProduct {
    type: 'course';
    slug: string;
    shortDescription: string;
    thumbnail: { url: string };
    instructors: string[];
    instructorNames?: string[];
    studentsEnrolled?: number;
    duration: string;
    level: string;
    categoryInfo: { name: string };
    rating?: number;
    reviews?: number;
    features: string[];
    mode: string;
    pricing: CoursePricing;
}

interface TestProduct extends BaseProduct {
    type: 'test';
    exam: {
        _id: string;
        name: string;
    };
    testType: string;
    difficultyLabel: string;
    sections: Array<{
        customName: string;
        durationMinutes: number;
        questionCount: number;
    }>;
    totalDurationMinutes: number;
    totalQuestions: number;
    pricing: TestSeriesPricing;
}

interface SeriesProduct extends BaseProduct {
    type: 'series';
    exam: string;
    category: {
        _id: string;
        name: string;
    };
    tests: Array<{
        test: string;
        label: string;
        testData: {
            title: string;
            testType: string;
            totalDurationMinutes: number;
            totalQuestions: number;
        };
    }>;
    totalTests: number;
    slug: string;
    thumbnailPic?: string;
    overview?: string;
    pricing: TestSeriesPricing;
}

type Product = CourseProduct | TestProduct | SeriesProduct;

const getProductType = (data: any): Product['type'] => {
    if (data.slug && data.thumbnail && data.mode !== undefined) return 'course';
    if (data.testType && data.sections && data.totalDurationMinutes !== undefined) return 'test';
    if (data.tests && data.totalTests !== undefined) return 'series';
    return 'course';
};

// --- Animated Background Component ---
const AnimatedBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
);

// --- Confetti Component ---
const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                    background: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: -10,
                }}
                animate={{
                    y: ['0vh', '100vh'],
                    x: ['0%', `${(Math.random() - 0.5) * 100}%`],
                    rotate: [0, 720],
                    opacity: [1, 0],
                }}
                transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut",
                }}
            />
        ))}
    </div>
);

// --- Countdown Timer Component ---
const CountdownTimer = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(deadline).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft('Expired');
                clearInterval(timer);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    return <span className="font-mono font-bold">{timeLeft}</span>;
};

export default function CheckoutPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isTestSeries = location.state?.testSeries ?? false;
    const isTest = location.state?.isTest ?? false;
    const { wallet: userWallet, loading: walletLoading } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<'initial' | 'promo' | 'payment' | 'none'>('initial');
    const [error, setError] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
    const [promoMessage, setPromoMessage] = useState<string | null>(null);
    const [useWalletBalance, setUseWalletBalance] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (!slug) {
            setError("Product not specified.");
            setLoading('none');
            return;
        }

        const fetchProduct = async () => {
            try {
                setLoading('initial');
                let response;

                if (isTestSeries) {
                    response = await api.get(`/mcu/series/${slug}`);
                } else if (isTest) {
                    response = await api.get(`/mcu/test/${slug}`);
                } else {
                    response = await api.get(`/courses/${slug}`);
                }

                const productData = response.data.data;
                const productType = getProductType(productData);

                setProduct({
                    ...productData,
                    type: productType
                });

                if (productData.pricing?.earlyBird || productData.pricing?.discount > 30) {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 3000);
                }
            } catch (err: any) {
                console.error("Failed to fetch product:", err);
                setError(err?.message || "Failed to load product details.");
            } finally {
                setLoading('none');
            }
        };

        fetchProduct();
    }, [slug, isTestSeries, isTest]);

    // --- Price Calculations (keeping your existing logic) ---
    const getOriginalPrice = (): number => {
        if (!product) return 0;
        if (product.type === 'course') {
            return product.pricing.originalAmount || product.pricing.amount || 0;
        }
        return product.pricing.price || 0;
    };

    const getCurrentPrice = (): number => {
        if (!product) return 0;
        if (product.type === 'course') {
            return (product.pricing?.amount- product.pricing?.amount * product?.pricing?.discount/100) || 0;
        }
        return product.pricing.salePrice || product.pricing.price || 0;
    };

    const isEarlyBirdActive = (): boolean => {
        if (!product || product.type !== 'course') return false;
        if (!product.pricing.earlyBird) return false;
        const now = new Date();
        const deadline = new Date(product.pricing.earlyBird.deadline);
        return now <= deadline;
    };

    const calculateEffectivePrice = () => {
        if (!product) return {
            originalPrice: 0,
            currentPrice: 0,
            effectivePrice: 0,
            discountBreakdown: [] as Array<{ label: string, amount: number, percentage?: number }>
        };

        const originalPrice = getOriginalPrice()

        const currentPrice = getCurrentPrice();
        let effectivePrice = currentPrice;
        const discountBreakdown: Array<{ label: string, amount: number, percentage?: number }> = [];

        if (product.type === 'course') {


            if (product.pricing.discount && product.pricing.discount > 0) {
                const mainDiscountAmount = originalPrice - currentPrice;
                if (mainDiscountAmount > 0) {
                    discountBreakdown.push({
                        label: `Course Discount (${product.pricing.discount}%)`,
                        amount: mainDiscountAmount,
                        percentage: product.pricing.discount
                    });
                }
            }
        } else {
            if (product.pricing.price > product.pricing.salePrice) {
                const discountAmount = product.pricing.price - product.pricing.salePrice;
                const discountPercentage = Math.round((discountAmount / product.pricing.price) * 100);
                discountBreakdown.push({
                    label: `Discount (${discountPercentage}%)`,
                    amount: discountAmount,
                    percentage: discountPercentage
                });
            }
        }

        if (isEarlyBirdActive() && product.type === 'course' && product.pricing.earlyBird) {
            const earlyBirdDiscountAmount = (currentPrice * product.pricing.earlyBird.discount) / 100;
            effectivePrice = currentPrice - earlyBirdDiscountAmount;
            discountBreakdown.push({
                label: `Early Bird Discount (${product.pricing.earlyBird.discount}%)`,
                amount: earlyBirdDiscountAmount,
                percentage: product.pricing.earlyBird.discount
            });
        }

        return { originalPrice, currentPrice, effectivePrice, discountBreakdown };
    };

    const handlePromoApply = async () => {
        if (!promoCode.trim() || !product) return;
        try {
            setLoading('promo');
            setError(null);
            setPromoMessage(null);
            const { effectivePrice } = calculateEffectivePrice();
            const response = await api.post(`/promo-codes/validate`, {
                code: promoCode.trim().toUpperCase(),
                productId: product._id,
                productType: product.type,
                currentPrice: effectivePrice
            });
            const { success, discountAmount, message } = response.data;
            if (success) {
                setPromoDiscountAmount(discountAmount);
                setPromoApplied(true);
                setPromoMessage(message || "Promo code applied successfully!");
            } else {
                setPromoMessage(message || "Invalid promo code.");
            }
        } catch (err: any) {
            setPromoMessage(err.response?.data?.message || "Failed to validate promo code.");
        } finally {
            setLoading('none');
        }
    };

    const handleRemovePromo = () => {
        setPromoCode("");
        setPromoApplied(false);
        setPromoDiscountAmount(0);
        setPromoMessage(null);
    };

    const handleWalletToggle = () => {
        if (userWallet && userWallet.balance > 0) {
            setUseWalletBalance(!useWalletBalance);
        }
    };

    const handlePurchase = async () => {
        if (!product || !userWallet) return;
        try {
            setLoading('payment');
            setError(null);
            const paymentData = {
                productId: product._id,
                productType: isTestSeries ? "test-series" : isTest ? "test" : "course",
                promoCode: promoApplied ? promoCode : undefined,
                useWallet: useWalletBalance,
                finalAmount: finalPrice
            };
            const response = await api.post(`/payments/create`, paymentData);
            const { success, redirectUrl, orderId, message } = response.data;
            if (success && redirectUrl) {
                navigate(redirectUrl, { state: { orderId } });
            } else {
                setError(message || "Payment initiation failed.");
            }
        } catch (err: any) {
            setError(err?.message || "Failed to process payment.");
        } finally {
            setLoading('none');
        }
    };

    const currency = product?.type === 'course'
        ? product.pricing.currency
        : (product as TestProduct | SeriesProduct)?.pricing?.currency || userWallet?.currency || "INR";

    const isFree = product?.type !== 'course' && (product as TestProduct | SeriesProduct)?.pricing?.isFree || false;

    const {
        originalPrice,
        currentPrice,
        effectivePrice: effectiveBasePrice,
        discountBreakdown
    } = calculateEffectivePrice();

    const promoDiscount = promoApplied ? promoDiscountAmount : 0;
    const maxWalletUsage = effectiveBasePrice * 0.1;
    const actualWalletUsage = useWalletBalance
        ? Math.min(userWallet?.balance || 0, maxWalletUsage)
        : 0;

    const priceAfterPromo = Math.max(0, effectiveBasePrice - promoDiscount);
    const finalPrice = Math.max(0, priceAfterPromo - actualWalletUsage);
    const totalSavings = (originalPrice - effectiveBasePrice) + promoDiscount + actualWalletUsage;

    const formatPrice = (amount: number, curr = currency) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // --- Loading State ---
    if (loading === 'initial' || walletLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                <Loader/>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md mx-auto p-8"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.5 }}
                        className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center"
                    >
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => navigate(-1)} className="px-6 py-3 !text-black bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl">
                            Go Back
                        </Button>
                        <Button onClick={() => window.location.reload()} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl">
                            Try Again
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!product || !userWallet) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-400">Product or wallet data unavailable.</p>
            </div>
        );
    }

    const earlyBirdActive = isEarlyBirdActive();
    const discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

    const ProductTypeLabel = () => {
        switch (product.type) {
            case 'course': return 'Course';
            case 'test': return 'Test';
            case 'series': return 'Test Series';
        }
    };

    return (
        <div className="min-h-screen relative">
            <AnimatedBackground />
            {showConfetti && <Confetti />}

            {/* Premium Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="sticky top-0 z-50 bg-white border-b"
            >
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <motion.button
                            whileHover={{ x: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(-1)}
                            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back</span>
                        </motion.button>

                        <div className="flex items-center space-x-3">

                            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                Checkout
                            </h1>
                        </div>

                        <div></div>
                    </div>
                </div>
            </motion.header>

            <div className="max-w-7xl bg-white dark:bg-gray-800 mx-auto px-4 my-4 py-4 rounded-2xl relative z-10">
                <div className="grid lg:grid-cols-6 gap-4">
                    {/* Product Details - Takes 3 columns */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-4 space-y-6"
                    >
                        {/* Premium Product Card */}
                        <div className="relative group">

                            <div className="relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                                {/* Product Header with Gradient */}
                                <div className={`bg-gray-200 p-4 text-gray-600 dark:text-gray-400 border-b`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div>
                                                <p className="text-base font-bold">{ProductTypeLabel()}</p>
                                            </div>
                                        </div>
                                        {earlyBirdActive && (
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-xl font-bold text-sm"
                                            >
                                                ⚡ EARLY BIRD
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Course Content */}
                                    {product.type === 'course' && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row  gap-6">
                                                <motion.div
                                                    className="relative flex-shrink-0"
                                                >
                                                    <img
                                                        src={product.thumbnail?.url ? `${ImageBaseUrl}/${product.thumbnail.url}` : "/placeholder-course.jpg"}
                                                        alt={product.title}
                                                        className="w-full sm:w-48 sm:h-32 object-cover bg-gray-100 rounded-xl"
                                                        onError={(e) => (e.currentTarget.src = "https://www.ooshasprep.com/image/logo.png")}
                                                    />

                                                </motion.div>
                                                <div className="flex-1">
                                                    <h2 className="text-xl text-slate-800 dark:text-white font-semibold">{product.title}</h2>
                                                    <p className="text-gray-700 line-clamp-2 dark:text-gray-300 mb-3">
                                                        {product.shortDescription || product.description}
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <Clock className="w-4 h-4 text-blue-500" />
                                                            <span className="text-gray-600 dark:text-gray-300">{product.duration || "Self-paced"}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <Award className="w-4 h-4 text-purple-500" />
                                                            <span className="text-gray-600 dark:text-gray-300 capitalize">{product.level}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                            <span className="text-gray-600 dark:text-gray-300">{product.rating || 4.5} Rating</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-sm">
                                                            <Users className="w-4 h-4 text-green-500" />
                                                            <span className="text-gray-600 dark:text-gray-300">{(product.studentsEnrolled || 1000).toLocaleString()}+ Students</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features Grid */}
                                            {product.features && product.features.length > 0 && (
                                                <div className="border rounded-xl p-4">
                                                    <h3 className="font-medium text-xl text-gray-900 dark:text-white mb-3">What You'll Get</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {product.features.map((feature, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="flex items-center space-x-3 text-sm"
                                                            >
                                                                <Check className="w-5 shadow border rounded-full p-1 h-5 text-green-500 flex-shrink-0" />
                                                                <span className="text-gray-700 font-medium dark:text-gray-300">{feature}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Test Content */}
                                    {product.type === 'test' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                {[
                                                    { icon: GraduationCap, label: 'Exam', value: product.exam.name, color: 'blue' },
                                                    { icon: BarChart3, label: 'Type', value: product.testType.replace('_', ' '), color: 'green' },
                                                    { icon: Timer, label: 'Duration', value: `${product.totalDurationMinutes} mins`, color: 'purple' },
                                                    { icon: FileText, label: 'Questions', value: product.totalQuestions.toString(), color: 'orange' },
                                                ].map((item, index) => (
                                                    <motion.div
                                                        key={index}
                                                        whileHover={{ y: -5 }}
                                                        className={`bg-${item.color}-50 dark:bg-${item.color}-900/20 p-4 rounded-xl`}
                                                    >
                                                        <item.icon className={`w-6 h-6 text-${item.color}-500 mb-2`} />
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{item.value}</p>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {product.sections.length > 0 && (
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Test Sections</h3>
                                                    <div className="space-y-2">
                                                        {product.sections.map((section, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 p-3 rounded-xl"
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{section.customName}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="flex items-center space-x-1">
                                                                        <FileText className="w-3 h-3" />
                                                                        <span>{section.questionCount} Q</span>
                                                                    </span>
                                                                    <span className="flex items-center space-x-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        <span>{section.durationMinutes} min</span>
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Series Content */}
                                    {product.type === 'series' && (
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                {product.thumbnailPic && (
                                                    <motion.img
                                                        whileHover={{ scale: 1.05 }}
                                                        src={product.thumbnailPic}
                                                        alt={product.title}
                                                        className="w-32 h-32 object-cover rounded-xl shadow-lg"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-gray-600 dark:text-gray-300 mb-4">{product.overview}</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                                            <p className="text-xs text-gray-500">Category</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{product.category.name}</p>
                                                        </div>
                                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                                                            <p className="text-xs text-gray-500">Total Tests</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{product.totalTests}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Included Tests</h3>
                                                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                                                    {product.tests.map((test, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            whileHover={{ x: 5 }}
                                                            className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-700 dark:to-purple-900/20 p-3 rounded-xl group"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{test.label}</p>
                                                                <p className="text-xs text-gray-500 capitalize">{test.testData.testType.replace('_', ' ')}</p>
                                                            </div>
                                                            <div className="text-xs text-gray-500 space-x-2">
                                                                <span>{test.testData.totalQuestions} Q</span>
                                                                <span>•</span>
                                                                <span>{test.testData.totalDurationMinutes} min</span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Discount Tags */}
                                    <div className="flex flex-wrap gap-2 mt-6">
                                        {earlyBirdActive && product.type === 'course' && (
                                            <motion.span
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="inline-flex items-center space-x-1 bg-gradient-to-r from-orange-400 to-red-400 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg"
                                            >
                                                <Zap className="w-4 h-4" />
                                                <span>Early Bird {product.pricing.earlyBird?.discount}% OFF</span>
                                            </motion.span>
                                        )}
                                        {discountPercent > 0 && (
                                            <span className="inline-flex items-center space-x-1 bg-gradient-to-r from-green-400 to-emerald-400 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                                                <TrendingDown className="w-4 h-4" />
                                                <span>{discountPercent}% OFF</span>
                                            </span>
                                        )}
                                        {product.type !== 'course' && (
                                            <span className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-sm">
                                                <Tag className="w-4 h-4" />
                                                <span>Limited Time Offer</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="sticky top-24 space-y-6">
                            <div className="relative group">
                                <div className="relative bg-white border dark:bg-gray-800 rounded-xl overflow-hidden">
                                    <div className="bg-orange-400 p-4 text-white">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-bold">Order Summary</h3>
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        {earlyBirdActive && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 bg-white/20 backdrop-blur-sm rounded-xl p-3"
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <span>⏰ Early Bird Ends In:</span>
                                                    <CountdownTimer deadline={product.pricing.earlyBird!.deadline} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="space-y-3">
                                            {originalPrice > currentPrice && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex justify-between items-center text-sm"
                                                >
                                                    <span className="text-gray-500">Original Price</span>
                                                    <span className="text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                                                </motion.div>
                                            )}

                                            {discountBreakdown.map((discount, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex justify-between items-center text-sm"
                                                >
                                                    <span className="text-gray-500">{discount.label}</span>
                                                    <span className={`font-medium ${discount.label.includes('Early Bird')
                                                        ? 'text-orange-500'
                                                        : 'text-green-500'
                                                        }`}>
                                                        -{formatPrice(discount.amount)}
                                                    </span>
                                                </motion.div>
                                            ))}

                                            <div className="pt-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-900 dark:text-white font-semibold">Current Price</span>
                                                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                        {isFree ? 'FREE' : formatPrice(effectiveBasePrice)}
                                                    </span>
                                                </div>
                                            </div>
                                            {!isFree && product.type == 'course' && (
                                                <AnimatePresence>
                                                    {!promoApplied ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="pt-2"
                                                        >
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={promoCode}
                                                                    onChange={(e) => setPromoCode(e.target.value)}
                                                                    placeholder="Have a promo code?"
                                                                    className="w-full pl-10 pr-24 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                                    disabled={loading !== 'none'}
                                                                />
                                                                <BadgePercent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={handlePromoApply}
                                                                    disabled={!promoCode.trim() || loading !== 'none'}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                                                                >
                                                                    {loading === 'promo' ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        'Apply'
                                                                    )}
                                                                </motion.button>
                                                            </div>
                                                            {promoMessage && (
                                                                <motion.p
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="mt-2 text-xs text-red-500"
                                                                >
                                                                    {promoMessage}
                                                                </motion.p>
                                                            )}
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-xl"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                                                    Promo Applied!
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-green-600 dark:text-green-400 font-bold">
                                                                    -{formatPrice(promoDiscount)}
                                                                </span>
                                                                <button
                                                                    onClick={handleRemovePromo}
                                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            )}

                                            {/* Wallet Balance */}
                                            {!isFree && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <Wallet className="w-5 h-5 text-blue-500" />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Wallet Balance
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {formatPrice(userWallet.balance, userWallet.currency)}
                                                        </span>
                                                    </div>

                                                    <label className="flex items-center justify-between cursor-pointer">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            Use wallet balance (Max 10%)
                                                        </span>
                                                        <motion.div
                                                            whileTap={{ scale: 0.95 }}
                                                            className="relative"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={useWalletBalance}
                                                                onChange={handleWalletToggle}
                                                                disabled={!userWallet || userWallet.balance <= 0}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-14 h-7 rounded-full transition-all duration-300 ${useWalletBalance
                                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                                }`}>
                                                                <motion.div
                                                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                                                    animate={{ left: useWalletBalance ? 'calc(100% - 1.5rem)' : '0.25rem' }}
                                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    </label>

                                                    {useWalletBalance && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="mt-3 flex justify-between text-sm text-green-600 dark:text-green-400"
                                                        >
                                                            <span>Wallet Discount</span>
                                                            <span className="font-bold">-{formatPrice(actualWalletUsage)}</span>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Total */}
                                        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                                                <div className="text-right">
                                                    <motion.div
                                                        key={finalPrice}
                                                        initial={{ scale: 1.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                                                    >
                                                        {isFree ? 'FREE' : formatPrice(finalPrice)}
                                                    </motion.div>
                                                    {totalSavings > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-sm text-green-600 dark:text-green-400 font-semibold"
                                                        >
                                                            You save {formatPrice(totalSavings)}! 🎉
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Purchase Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handlePurchase}
                                            disabled={loading !== 'none' || (!isFree && finalPrice < 0)}
                                            className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2.5 px-6 rounded-xl font-bold text-base shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                            <span className="relative flex items-center justify-center space-x-2">
                                                {loading === 'payment' ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <span>Processing Payment...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-5 h-5" />
                                                        <span>{isFree ? 'Enroll Now - Free' : 'Complete Purchase'}</span>
                                                        <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </span>
                                        </motion.button>

                                        {/* Trust Badges */}
                                        <div className="flex flex-col w-full items-start font-medium  gap-2">
                                            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Shield className="w-4 h-4 text-green-500" />
                                                <span>256-bit SSL Encrypted Payment</span>
                                            </div>
                                            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <span>Instant Access After Payment</span>
                                            </div>
                                            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Lock className="w-4 h-4 text-purple-500" />
                                                <span>100% Secure & Trusted</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}