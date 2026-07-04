import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    Clock,
    Users,
    Star,
    Crown,
    Gift,
    ChevronDown,
    Copy,
    CheckCircle,
    TrendingUp,
    Share2,
    Sparkles,
    Zap,
    Tag,
    Calendar,
    Filter,
    ArrowUpDown,
    Loader,
    HelpCircle
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
    type: 'general' | 'course_specific' | 'user_specific' | 'category_specific' | 'user_course_specific';
    courses: Array<{
        _id: string;
        title: string;
        thumbnail: string;
        instructor: string;
        price: number;
        discountPrice?: number;
    }>;
    categories: Array<{
        _id: string;
        name: string;
    }>;
    applicableUsers: Array<{
        _id: string;
        name: string;
        email: string;
    }>;
    terms: string[];
    isActive: boolean;
    isFeatured: boolean;
    createdAt: string;
}

const getTimeRemaining = (validUntil: string) => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
};

const Badge = ({
    children,
    variant = "default",
    className = "",
}: {
    children: React.ReactNode;
    variant?: "default" | "secondary" | "premium" | "success" | "warning" | "danger" | "info";
    className?: string;
}) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200";

    const variants = {
        default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        premium: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        info: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    };

    return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>;
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:bg-gray-800 dark:border-gray-700  ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);

const DiscountTag = ({ discountType, discountValue, maxDiscount }: { discountType: string; discountValue: number; maxDiscount?: number }) => (
    <div className="relative">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
            <div className="text-center">
                <div className="text-2xl font-bold leading-none">
                    {discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}
                </div>
                <div className="text-xs opacity-90 mt-1">OFF</div>
            </div>
            {maxDiscount && discountType === 'percentage' && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full border shadow-sm">
                    Up to ₹{maxDiscount}
                </div>
            )}
        </div>
    </div>
);

const ProgressBar = ({ used, total }: { used: number; total?: number }) => {
    const percentage = total ? Math.min((used / total) * 100, 100) : 0;
    
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{used} used</span>
                <span>{total ? `${total - used} left` : 'Unlimited'}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                        percentage > 80 ? 'bg-red-500' : 
                        percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const PromoCard = React.memo(({
    promo,
    copiedCode,
    onCopy
}: {
    promo: PromoCode;
    copiedCode: string | null;
    onCopy: (code: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isExpired = new Date(promo.validUntil) < new Date();
    const isEndingSoon = !isExpired && new Date(promo.validUntil) < new Date(Date.now() + 24 * 60 * 60 * 1000);

    return (
        <div
  className="rounded-2xl p-[1px] h-full "
  style={{
    background: `
      linear-gradient(
        -360deg,
        #2f2f2f 0%,
        #4b4b4b 28%,
        #7d7d7d 45%,
        rgba(255,255,255,0.7) 85%,
        rgba(255,255,255,0.95) 95%,
        rgba(255,255,255,1) 100%
      )
    `,
  }}
>
        <Card
  className={`relative pb-10 h-full       ${isExpired ? 'opacity-70 grayscale' : ''}`}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  {/* Expired Overlay */}
  {isExpired && (
    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-20 backdrop-blur-sm rounded-2xl">
      <Badge variant="danger" className="text-lg py-3 px-6 animate-pulse">
        Expired
      </Badge>
    </div>
  )}

  {/* Discount Badge - Top Left Overlapping */}
  <div className="absolute -top-2 -left-2 z-10"> 
    <div className="relative">
      {/* Main Red Badge */}
      <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white px-6 py-3 rounded-xl shadow-lg transform -rotate-4 min-w-[140px] text-center">
        <div className="text-3xl font-extrabold leading-none">
          {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `₹${promo.discountValue}`}
        </div>
        <div className="text-sm font-semibold tracking-wide">OFF</div>
      </div>
      {/* Max Discount Pill */}
      {promo.maxDiscount > 0 && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-md -rotate-4 ">
          Up to ₹{promo.maxDiscount}
        </div>
      )}
    </div>
  </div>

  <CardContent className="p-6 pt-24 ">
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <h3 className="font-extrabold text-lg lg:text-3xl leading-tight text-orange-500 dark:text-orange-400 mb-3">
          {promo.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
          {promo.description}
        </p>
      </div>

      {/* Timer */}
      <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 font-medium">
        <Clock className="h-4 w-4 mr-2 text-gray-500" />
        {getTimeRemaining(promo.validUntil)}
      </div>

      {/* Terms & Conditions */}
      {promo.terms?.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors duration-200 font-medium"
          >
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Terms & Conditions
            <ChevronDown
              className={`h-4 w-4 ml-1 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isExpanded && (
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400 animate-in fade-in duration-300">
              {promo.terms.map((term, index) => (
                <li
                  key={index}
                  className="flex items-start bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                >
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                  <span className="leading-relaxed">{term}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    
    </div>
  </CardContent>

    {/* Promo Code Box - Bottom */}
      <div className="lg:absolute lg:-bottom-15 lg:left-15 bg-red-50 dark:bg-red-900/20 rounded-3xl p-4 mx-2 lg:mx-0 mt-2 z-10">
        <div className="text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mb-3">
          PROMO CODE
        </div>
        <div className="flex items-center gap-2">
          <code className="font-mono font-bold text-sm text-gray-900 dark:text-white tracking-wider bg-white dark:bg-gray-800 px-4 py-2.5 rounded-lg flex-1 min-w-0 truncate shadow-sm">
            {promo.code}
          </code>
          <Button
            onClick={() => onCopy(promo.code)}
            disabled={isExpired}
            variant="outline"
            size="sm"
            className={`min-w-[90px] h-11 font-semibold transition-all duration-300 transform hover:scale-105 bg-white text-sm dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
              isExpired ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
            }`}
          >
            {copiedCode === promo.code ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
</Card>
</div>
    );
});

const LoadingSkeleton = () => (
    <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-32">
                            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-80 space-y-4">
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="flex gap-3">
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-12"></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);

export default function OffersPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [sortBy, setSortBy] = useState("-createdAt");
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(6);
    const observerTarget = useRef<HTMLDivElement>(null);

    const types = [
        { id: "all", name: "All Offers", icon: Gift, color: "orange" },
        { id: "featured", name: "Featured", icon: Crown, color: "orange" },
        { id: "new", name: "New Arrivals", icon: Star, color: "orange" },
        { id: "popular", name: "Most Popular", icon: TrendingUp, color: "orange" },
        { id: "ending", name: "Ending Soon", icon: Clock, color: "orange" },
    ];

    const sortOptions = [
        { id: "-createdAt", name: "Newest First" },
        { id: "createdAt", name: "Oldest First" },
        { id: "-discountValue", name: "Highest Discount" },
        { id: "-usedCount", name: "Most Popular" },
        { id: "validUntil", name: "Ending Soon" },
    ];

    const fetchPromoCodes = useCallback(async () => {
        try {
            setLoading(page === 1);
            setLoadingMore(page > 1);

            let filterParams: Record<string, any> = {};
            const selectedTypeObj = types.find(t => t.id === selectedType);

            if (selectedType !== "all") {
                if (selectedType === "ending") {
                    filterParams.validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                } else if (selectedTypeObj) {
                    filterParams = { ...selectedTypeObj.filter };
                }
            }

            const params = {
                page,
                limit: 12,
                search: searchTerm,
                sort: sortBy,
                ...filterParams
            };

            Object.keys(params).forEach(key => {
                if (params[key] === "" || params[key] === undefined) delete params[key];
            });

            const response = await api.get("/promo-codes", { params });
            
            if (page === 1) {
                setPromoCodes(response.data.data || []);
            } else {
                setPromoCodes(prev => [...prev, ...(response.data.data || [])]);
            }
            setHasMore(response.data.totalPages > page);
        } catch (error) {
            console.error("Error fetching promo codes:", error);
            setPromoCodes([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [page, searchTerm, selectedType, sortBy]);

    useEffect(() => {
        setPage(1);
        setVisibleCount(6);
    }, [searchTerm, selectedType, sortBy]);

    useEffect(() => {
        fetchPromoCodes();
    }, [fetchPromoCodes]);

    useEffect(() => {
        if (!hasMore || loadingMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore]);

    const copyToClipboard = useCallback((code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    }, []);

    const handleTypeChange = useCallback((typeId: string) => {
        setSelectedType(typeId);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-colors duration-500">
            <div className="max-w-7xl mx-auto p-2">
                {/* Search and Filters */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow border border-orange-500 dark:border-gray-700 p-6 mb-2 animate-in slide-in-from-top duration-500">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-500" />
                                <input
                                    type="text"
                                    placeholder="Search offers, courses, or codes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-orange-500 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base shadow-inner transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <ArrowUpDown className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-10 pr-8 py-3 border border-orange-500 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base appearance-none shadow-inner transition-all duration-300 cursor-pointer"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Type Filters */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {types.map((type, index) => {
                            const IconComponent = type.icon;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id)}
                                    className={`flex items-center px-4 py-2.5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 font-medium text-sm ${
                                        selectedType === type.id
                                            ? `bg-${type.color}-500 border-${type.color}-500 text-white shadow-lg scale-105`
                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <IconComponent className="h-4 w-4 mr-2.5" />
                                    {type.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Loading State */}
                {loading && <LoadingSkeleton />}

                {/* Promo Codes Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 ">
                        {promoCodes
                            .slice(0, visibleCount)
                            .map((promo, index) => (
                                <div 
                                    key={promo._id}
                                    className="animate-in fade-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <PromoCard
                                        promo={promo}
                                        copiedCode={copiedCode}
                                        onCopy={copyToClipboard}
                                    />
                                </div>
                            ))}
                    </div>
                )}

                {/* Load More Button */}
                {visibleCount < promoCodes.length && (
                    <div className="text-center mb-8 animate-in fade-in duration-500">
                        <Button
                            onClick={() => setVisibleCount(prev => prev + 6)}
                            variant="outline"
                            size="lg"
                            className="px-8 py-4 border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                            <ChevronDown className="h-5 w-5 mr-2" />
                            Load More ({promoCodes.length - visibleCount} remaining)
                        </Button>
                    </div>
                )}

                {/* Infinite Scroll Loader */}
                {hasMore && visibleCount >= promoCodes.length && (
                    <div ref={observerTarget} className="h-20 flex items-center justify-center">
                        {loadingMore && (
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                <Loader className="h-6 w-6 animate-spin" />
                                <span className="text-sm">Loading more offers...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!loading && promoCodes.length === 0 && (
                    <div className="text-center py-16 animate-in fade-in duration-500">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-2xl border border-gray-200 dark:border-gray-700">
                            <Gift className="h-24 w-24 text-gray-300 dark:text-gray-600 mx-auto mb-6 transition-colors duration-300" />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                No offers found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                                {searchTerm || selectedType !== "all"
                                    ? "Try adjusting your search or filters to find more offers."
                                    : "Check back later for new exciting offers!"
                                }
                            </p>
                            {(searchTerm || selectedType !== "all") && (
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedType("all");
                                    }}
                                    variant="primary"
                                    size="lg"
                                    className="rounded-xl px-8 py-4 text-base font-semibold transition-all duration-300 transform hover:scale-105"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}