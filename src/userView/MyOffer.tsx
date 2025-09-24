import { useState, useEffect, useRef } from "react";
import {
    Search,
    Filter,
    Tag,
    Clock,
    Calendar,
    Users,
    Star,
    Zap,
    Crown,
    Gift,
    Sparkles,
    ArrowRight,
    ChevronDown,
    Copy,
    CheckCircle,
    ExternalLink,
    Shield,
    Award,
    TrendingUp,
    Heart,
    Share2,
    Eye,
    Book,
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";

interface PromoCode {
    _id: string;
    code: string;
    title: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usedCount: number;
    category: string;
    tags: string[];
    isFeatured: boolean;
    isActive: boolean;
    courses: Array<{
        _id: string;
        title: string;
        thumbnail: string;
        instructor: string;
        price: number;
        discountPrice?: number;
    }>;
    terms: string[];
}

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "premium" | "success" | "warning";
    className?: string;
}) => {
    const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-all";

    const variants = {
        default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        premium: "bg-gradient-to-r from-amber-400 to-orange-500 text-white",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    };

    return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

export default function OffersPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(6);
    const observerTarget = useRef<HTMLDivElement>(null);

    const categories = [
        { id: "all", name: "All Offers", icon: Gift, count: 0 },
        { id: "featured", name: "Featured", icon: Crown, count: 0 },
        { id: "new", name: "New Arrivals", icon: Zap, count: 0 },
        { id: "popular", name: "Most Popular", icon: TrendingUp, count: 0 },
        { id: "ending", name: "Ending Soon", icon: Clock, count: 0 },
        { id: "courses", name: "Course Specific", icon: Book, count: 0 },
        { id: "seasonal", name: "Seasonal", icon: Sparkles, count: 0 },
    ];

    const sortOptions = [
        { id: "newest", name: "Newest First" },
        { id: "popular", name: "Most Popular" },
        { id: "discount", name: "Highest Discount" },
        { id: "ending", name: "Ending Soon" },
    ];

    useEffect(() => {
        fetchPromoCodes();
    }, [page, searchTerm, selectedCategory, sortBy]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore]);

    const fetchPromoCodes = async () => {
        try {
            const response = await api.get("/promo-codes", {
                params: {
                    page,
                    limit: 12,
                    search: searchTerm,
                    category: selectedCategory !== "all" ? selectedCategory : undefined,
                    sort: sortBy,
                },
            });

            if (page === 1) {
                setPromoCodes(response.data.data);
            } else {
                setPromoCodes(prev => [...prev, ...response.data.data]);
            }

            setHasMore(response.data.hasMore);
        } catch (error) {
            console.error("Failed to fetch promo codes:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            setPage(prev => prev + 1);
        }
    };

    const showMore = () => {
        setVisibleCount(prev => prev + 6);
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filterPromoCodes = (codes: PromoCode[]) => {
        return codes.slice(0, visibleCount);
    };

    const getTimeRemaining = (validUntil: string) => {
        const now = new Date();
        const end = new Date(validUntil);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return "Expired";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h left`;
    };

    const getDiscountText = (promo: PromoCode) => {
        if (promo.discountType === 'percentage') {
            return `${promo.discountValue}% OFF`;
        }
        return `₹${promo.discountValue} OFF`;
    };

    if (loading && page === 1) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                                    <div className="flex">
                                        <div className="flex-1">
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                                        </div>
                                        <div className="w-40 ml-4">
                                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        </div>
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
                                placeholder="Search offers, courses, or codes..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                    setVisibleCount(6);
                                }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex gap-3">
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setPage(1);
                                setVisibleCount(6);
                            }}
                            className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {sortOptions.map(option => (
                                <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map(category => {
                        const IconComponent = category.icon;
                        return (
                            <button
                                key={category.id}
                                onClick={() => {
                                    setSelectedCategory(category.id);
                                    setPage(1);
                                    setVisibleCount(6);
                                }}
                                className={`flex items-center px-3 py-1.5 rounded-md border transition-all text-sm ${selectedCategory === category.id
                                    ? "bg-blue-500 text-white border-blue-500 shadow-lg transform scale-105"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500"
                                    }`}
                            >
                                <IconComponent className="h-3.5 w-3.5 mr-1.5" />
                                {category.name}
                            </button>
                        );
                    })}
                </div>

                {/* Promo Codes List - Horizontal Cards */}
                <div className="space-y-4 mb-6">
                    {[
                        {
                            "_id": "1",
                            "code": "WELCOME50",
                            "title": "Welcome Offer - 50% Off",
                            "description": "Get started with your learning journey with this amazing welcome discount",
                            "discountType": "percentage",
                            "discountValue": 50,
                            "minPurchase": 1000,
                            "maxDiscount": 5000,
                            "validFrom": "2024-01-01",
                            "validUntil": "2024-12-31",
                            "usageLimit": 1000,
                            "usedCount": 450,
                            "category": "new",
                            "tags": ["welcome", "new-user", "discount"],
                            "isFeatured": true,
                            "isActive": true,
                            "courses": [
                                {
                                    "_id": "c1",
                                    "title": "Complete Web Development Bootcamp",
                                    "thumbnail": "/course1.jpg",
                                    "instructor": "John Doe",
                                    "price": 9999,
                                    "discountPrice": 4999
                                }
                            ],
                            "terms": [
                                "Valid for new users only",
                                "Minimum purchase of ₹1000 required",
                                "Maximum discount capped at ₹5000",
                                "Cannot be combined with other offers"
                            ]
                        }
                    ].map((promo) => (
                        <PromoCard
                            key={promo._id}
                            promo={promo}
                            copiedCode={copiedCode}
                            onCopy={copyToClipboard}
                        />
                    ))}
                </div>

                {/* Load More Button */}
                {visibleCount < promoCodes.length && (
                    <div className="text-center mb-6">
                        <Button
                            onClick={showMore}
                            variant="outline"
                            className="px-6 py-2.5 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                        >
                            <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                            Show More ({promoCodes.length - visibleCount})
                        </Button>
                    </div>
                )}

                {/* Infinite Scroll Trigger */}
                {hasMore && visibleCount >= promoCodes.length && (
                    <div ref={observerTarget} className="h-16 flex items-center justify-center">
                        {loadingMore && (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        )}
                    </div>
                )}

                {/* No Results */}
                {!loading && promoCodes.length === 0 && (
                    <div className="text-center py-8">
                        <Gift className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            No offers found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Try adjusting your search or filters to find more offers.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

const PromoCard = ({
    promo,
    copiedCode,
    onCopy
}: {
    promo: PromoCode;
    copiedCode: string | null;
    onCopy: (code: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className={`relative overflow-hidden transition-transform hover:scale-[1.01] ${promo.isFeatured ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''
            }`}>
            {/* Premium Ribbon */}
            {promo.isFeatured && (
                <div className="absolute top-2 right-2 z-10">
                    <Badge variant="premium">
                        <Crown className="h-2.5 w-2.5 mr-0.5" />
                        Featured
                    </Badge>
                </div>
            )}

            {/* Time-sensitive Badge */}
            {/* {new Date(promo.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <div className="absolute top-2 left-2 z-10">
                    <Badge variant="warning">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        Ending Soon
                    </Badge>
                </div>
            )} */}

            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Left Content */}
                    <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2">
                                    {promo.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Badge variant="default" className="text-xs py-1 px-2">
                                        {/* {getDiscountText(promo)} */}
                                    </Badge>
                                    {promo.maxDiscount && promo.discountType === 'percentage' && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Up to ₹{promo.maxDiscount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                            {promo.description}
                        </p>

                        {/* Terms and Conditions */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {/* {getTimeRemaining(promo.validUntil)} */}
                                </div>
                                <div className="flex items-center">
                                    <Users className="h-3 w-3 mr-1" />
                                    {promo.usedCount}/{promo.usageLimit || '∞'} used
                                </div>
                            </div>

                            {promo.minPurchase > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Min. purchase: ₹{promo.minPurchase}
                                </div>
                            )}

                            {/* Expandable Terms */}
                            {promo.terms && promo.terms.length > 0 && (
                                <div>
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Terms & Conditions
                                        <ChevronDown className={`h-2.5 w-2.5 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isExpanded && (
                                        <ul className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                                            {promo.terms.map((term, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="w-0.5 h-0.5 bg-gray-400 rounded-full mt-1.5 mr-1.5 flex-shrink-0"></span>
                                                    {term}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Content - Promo Code and Actions */}
                    <div className="md:w-64 flex flex-col gap-3">
                        {/* Promo Code */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-md p-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Promo Code</span>
                                    <span className="font-mono font-bold text-base text-gray-900 dark:text-white">
                                        {promo.code}
                                    </span>
                                </div>
                                <Button
                                    onClick={() => onCopy(promo.code)}
                                    variant={copiedCode === promo.code ? "default" : "outline"}
                                    size="sm"
                                    className={`${copiedCode === promo.code
                                        ? 'bg-green-500 hover:bg-green-600 border-green-500'
                                        : 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        }`}
                                >
                                    {copiedCode === promo.code ? (
                                        <CheckCircle className="h-3.5 w-3.5 mr-0.5" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5 mr-0.5" />
                                    )}
                                    {copiedCode === promo.code ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm">
                                Apply Code
                            </Button>
                            <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-sm">
                                <Share2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};