import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Gift,
    Share2,
    Copy,
    CheckCircle,
    Star,
    Award,
    TrendingUp,
    DollarSign,
    Mail,
    Facebook,
    Twitter,
    Linkedin,
    UserPlus,
    Sparkles,
    Crown,
    BarChart3,
    Rocket,
    ChevronRight,
    Zap,
    Target,
    Calendar,
    CreditCard,
    Eye,
    EyeOff,
    Download,
    QrCode,
    Link,
    Bell,
    Clock,
    Check,
    X,
    ArrowUpRight,
    PieChart,
    RotateCw
} from "lucide-react";
import Button from "../components/ui/button/Button";

interface Referral {
    _id: string;
    referredEmail: string;
    status: 'pending' | 'completed' | 'expired';
    dateReferred: string;
    dateCompleted?: string;
    rewardAmount: number;
    friendName?: string;
}

interface Reward {
    _id: string;
    type: 'signup' | 'purchase' | 'completion';
    amount: number;
    description: string;
    dateEarned: string;
    status: 'pending' | 'available' | 'used';
    icon: any;
}

interface ReferralStats {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    availableBalance: number;
    potentialEarnings: number;
    nextTier: string;
    progressToNextTier: number;
    conversionRate: number;
    avgReward: number;
}

const StatCard = ({ icon: Icon, label, value, change, className = "", loading = false }: {
    icon: any;
    label: string;
    value: string | number;
    change?: string;
    className?: string;
    loading?: boolean;
}) => (
    <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 ${className}`}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {loading ? (
                            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                            value
                        )}
                    </div>
                    {change && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {change}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
);

const RewardBadge = ({ status, amount }: { status: string; amount: number }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'available' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : status === 'used' 
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
        }`}
    >
        <DollarSign className="h-3 w-3 mr-1" />
        +₹{amount}
        <div className={`ml-2 w-2 h-2 rounded-full ${
            status === 'available' ? 'bg-green-500' :
            status === 'used' ? 'bg-gray-500' : 'bg-amber-500'
        }`}></div>
    </motion.div>
);

const ShareButton = ({ icon: Icon, label, color, onClick }: {
    icon: any;
    label: string;
    color: string;
    onClick: () => void;
}) => (
    <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${color} text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex flex-col items-center space-y-2`}
    >
        <Icon className="h-5 w-5" />
        <span className="text-xs font-medium">{label}</span>
    </motion.button>
);

const ProgressBar = ({ value, max, color = "from-blue-500 to-purple-600", label }: {
    value: number;
    max: number;
    color?: string;
    label: string;
}) => (
    <div className="space-y-2">
        <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{value}/{max}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / max) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${color} rounded-full shadow-lg`}
            />
        </div>
    </div>
);

export default function ReferAndEarnPage() {
    const [referralCode, setReferralCode] = useState("EDUCODE250");
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("refer");
    const [email, setEmail] = useState("");
    const [showBalance, setShowBalance] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [stats, setStats] = useState<ReferralStats>({
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalEarned: 0,
        availableBalance: 0,
        potentialEarnings: 0,
        nextTier: "Pro",
        progressToNextTier: 0,
        conversionRate: 0,
        avgReward: 0,
    });

    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);

    useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setStats({
                totalReferrals: 12,
                completedReferrals: 8,
                pendingReferrals: 4,
                totalEarned: 2400,
                availableBalance: 1600,
                potentialEarnings: 1200,
                nextTier: "Pro",
                progressToNextTier: 83,
                conversionRate: 67,
                avgReward: 333,
            });

            setReferrals([
                {
                    _id: "1",
                    referredEmail: "sarah@example.com",
                    status: "completed",
                    dateReferred: "2024-01-15",
                    dateCompleted: "2024-01-20",
                    rewardAmount: 300,
                    friendName: "Sarah Chen"
                },
                {
                    _id: "2",
                    referredEmail: "mike@example.com",
                    status: "pending",
                    dateReferred: "2024-01-18",
                    rewardAmount: 300,
                    friendName: "Mike Johnson"
                },
                {
                    _id: "3",
                    referredEmail: "priya@example.com",
                    status: "completed",
                    dateReferred: "2024-01-10",
                    dateCompleted: "2024-01-12",
                    rewardAmount: 300,
                    friendName: "Priya Patel"
                },
            ]);

            setRewards([
                {
                    _id: "1",
                    type: "signup",
                    amount: 200,
                    description: "Sarah signed up for course",
                    dateEarned: "2024-01-20",
                    status: "available",
                    icon: UserPlus
                },
                {
                    _id: "2",
                    type: "purchase",
                    amount: 300,
                    description: "Mike purchased premium course",
                    dateEarned: "2024-01-15",
                    status: "used",
                    icon: CreditCard
                },
                {
                    _id: "3",
                    type: "completion",
                    amount: 500,
                    description: "Priya completed full course",
                    dateEarned: "2024-01-18",
                    status: "available",
                    icon: Award
                },
            ]);

            setIsLoading(false);
        }, 1000);
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOptions = [
        { platform: "whatsapp", icon: Bell, color: "bg-green-500 hover:bg-green-600", label: "WhatsApp" },
        { platform: "facebook", icon: Facebook, color: "bg-blue-600 hover:bg-blue-700", label: "Facebook" },
        { platform: "twitter", icon: Twitter, color: "bg-blue-400 hover:bg-blue-500", label: "Twitter" },
        { platform: "linkedin", icon: Linkedin, color: "bg-blue-700 hover:bg-blue-800", label: "LinkedIn" },
        { platform: "email", icon: Mail, color: "bg-gray-600 hover:bg-gray-700", label: "Email" },
    ];

    const referralSteps = [
        {
            step: 1,
            icon: Share2,
            title: "Share Your Link",
            description: "Share your unique referral link with friends",
            color: "from-blue-500 to-blue-600",
        },
        {
            step: 2,
            icon: UserPlus,
            title: "Friend Signs Up",
            description: "Your friend signs up using your link",
            color: "from-green-500 to-green-600",
        },
        {
            step: 3,
            icon: Gift,
            title: "Both Get Rewards",
            description: "You both receive rewards when they enroll",
            color: "from-purple-500 to-purple-600",
        },
    ];

    const rewardTiers = [
        {
            level: "Starter",
            referrals: "1-5",
            reward: "₹200 per referral",
            bonus: "₹500 course completion bonus",
            icon: Star,
            color: "from-gray-500 to-gray-600",
            current: false,
        },
        {
            level: "Pro",
            referrals: "6-15",
            reward: "₹300 per referral",
            bonus: "₹1000 course completion bonus",
            icon: TrendingUp,
            color: "from-blue-500 to-purple-600",
            current: true,
        },
        {
            level: "Elite",
            referrals: "16+",
            reward: "₹500 per referral",
            bonus: "₹2000 bonus + Premium features",
            icon: Crown,
            color: "from-amber-500 to-orange-500",
            current: false,
        },
    ];

    const tabs = [
        { id: "refer", label: "Refer Friends", icon: Share2, count: stats.totalReferrals },
        { id: "rewards", label: "My Rewards", icon: Gift, count: rewards.length },
        { id: "history", label: "Referral History", icon: BarChart3, count: referrals.length },
        { id: "how-it-works", label: "How It Works", icon: Rocket },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-3 lg:px-4 py-3">
                {/* Navigation Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                >
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-2 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`}
                            >
                                <IconComponent className="h-4 w-4 mr-2" />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                        activeTab === tab.id 
                                            ? "bg-white/20" 
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Refer Friends Tab */}
                        {activeTab === "refer" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Referral Code Card */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    Your Referral Code
                                                </h3>
                                                <motion.div
                                                    whileHover={{ scale: 1.05 }}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <button 
                                                        onClick={() => setShowBalance(!showBalance)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                    >
                                                        {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                        <QrCode className="h-4 w-4" />
                                                    </button>
                                                </motion.div>
                                            </div>
                                            
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 shadow-lg">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="text-blue-100 text-sm font-medium mb-2">YOUR UNIQUE CODE</div>
                                                        <div className="font-mono text-3xl font-bold text-white tracking-wider">
                                                            {referralCode}
                                                        </div>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={copyToClipboard}
                                                        className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2"
                                                    >
                                                        {copied ? (
                                                            <>
                                                                <CheckCircle className="h-4 w-4" />
                                                                <span>Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="h-4 w-4" />
                                                                <span>Copy Code</span>
                                                            </>
                                                        )}
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Share via</h4>
                                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                                    {shareOptions.map((option) => (
                                                        <ShareButton
                                                            key={option.platform}
                                                            icon={option.icon}
                                                            label={option.label}
                                                            color={option.color}
                                                            onClick={() => console.log(`Share via ${option.platform}`)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Email Invite */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Mail className="h-5 w-5 mr-2 text-blue-500" />
                                            Invite by Email
                                        </h3>
                                        <div className="flex gap-3">
                                            <input
                                                type="email"
                                                placeholder="Enter friend's email address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6">
                                                Send Invite
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Earnings Summary */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Award className="h-5 w-5 mr-2 text-amber-500" />
                                            Earnings Overview
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</span>
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {showBalance ? `₹${stats.availableBalance}` : "••••"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</span>
                                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{stats.potentialEarnings}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earned</span>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{stats.totalEarned}</span>
                                            </div>
                                        </div>
                                        <Button className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold">
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Withdraw Funds
                                        </Button>
                                    </motion.div>

                                    {/* Progress Card */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Target className="h-5 w-5 mr-2 text-purple-500" />
                                            Tier Progress
                                        </h3>
                                        <div className="space-y-4">
                                            <ProgressBar 
                                                value={stats.completedReferrals} 
                                                max={6} 
                                                label="Pro Tier Progress" 
                                                color="from-blue-500 to-purple-600"
                                            />
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-3 rounded-lg">
                                                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                                                {15 - stats.totalReferrals} more to reach Elite tier
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {/* My Rewards Tab */}
                        {activeTab === "rewards" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Reward Tiers */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                            Reward Tiers
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {rewardTiers.map((tier, index) => {
                                                const IconComponent = tier.icon;
                                                return (
                                                    <motion.div
                                                        key={tier.level}
                                                        whileHover={{ scale: 1.02 }}
                                                        className={`relative rounded-xl p-4 border-2 ${
                                                            tier.current 
                                                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' 
                                                                : 'border-gray-200 dark:border-gray-700'
                                                        }`}
                                                    >
                                                        {tier.current && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="absolute -top-2 -right-2"
                                                            >
                                                                <Sparkles className="h-5 w-5 text-amber-500" />
                                                            </motion.div>
                                                        )}
                                                        <div className={`bg-gradient-to-r ${tier.color} rounded-lg p-4 text-white mb-3 shadow-lg`}>
                                                            <IconComponent className="h-6 w-6 mb-2" />
                                                            <div className="font-bold text-lg">{tier.level}</div>
                                                            <div className="text-xs opacity-90">{tier.referrals} referrals</div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                {tier.reward}
                                                            </div>
                                                            <div className="text-gray-600 dark:text-gray-400 text-xs">
                                                                {tier.bonus}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>

                                    {/* Recent Rewards */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                Recent Rewards
                                            </h3>
                                            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center">
                                                <Download className="h-4 w-4 mr-1" />
                                                Export
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {rewards.map((reward) => {
                                                const IconComponent = reward.icon;
                                                return (
                                                    <motion.div
                                                        key={reward._id}
                                                        whileHover={{ x: 4 }}
                                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl"
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div className={`p-3 rounded-xl ${
                                                                reward.status === 'available' ? 'bg-green-100 dark:bg-green-900/30' :
                                                                reward.status === 'used' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-amber-100 dark:bg-amber-900/30'
                                                            }`}>
                                                                <IconComponent className={`h-5 w-5 ${
                                                                    reward.status === 'available' ? 'text-green-600 dark:text-green-400' :
                                                                    reward.status === 'used' ? 'text-gray-600 dark:text-gray-400' : 'text-amber-600 dark:text-amber-400'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                                    {reward.description}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {new Date(reward.dateEarned).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <RewardBadge status={reward.status} amount={reward.amount} />
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Rewards Summary */}
                                <div className="space-y-6">
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                            Rewards Summary
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: "Available Rewards", value: "₹1600", color: "text-green-600 dark:text-green-400", bg: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20" },
                                                { label: "Used Rewards", value: "₹800", color: "text-gray-600 dark:text-gray-400", bg: "from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-800/20" },
                                                { label: "Pending Rewards", value: "₹1200", color: "text-amber-600 dark:text-amber-400", bg: "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20" },
                                            ].map((item, index) => (
                                                <div key={index} className={`p-3 rounded-lg bg-gradient-to-r ${item.bg}`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                                                        <span className={`font-semibold ${item.color}`}>{item.value}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span className="text-gray-900 dark:text-white">Total Earned</span>
                                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                        ₹2400
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Performance */}
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                            <PieChart className="h-5 w-5 mr-2 text-purple-500" />
                                            Performance
                                        </h3>
                                        <div className="space-y-4">
                                            <ProgressBar 
                                                value={stats.conversionRate} 
                                                max={100} 
                                                label="Conversion Rate" 
                                                color="from-green-500 to-green-600"
                                            />
                                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Reward</span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">₹{stats.avgReward}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {/* Other tabs would follow similar enhanced patterns */}
                        {/* How It Works Tab */}
                        {activeTab === "how-it-works" && (
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-8"
                            >
                                <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
                                    How It Works in 3 Simple Steps
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {referralSteps.map((step) => {
                                        const IconComponent = step.icon;
                                        return (
                                            <motion.div
                                                key={step.step}
                                                whileHover={{ scale: 1.05 }}
                                                className="text-center"
                                            >
                                                <div className={`bg-gradient-to-r ${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                                    <IconComponent className="h-8 w-8 text-white" />
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                    Step {step.step}
                                                </div>
                                                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-lg">
                                                    {step.title}
                                                </div>
                                                <div className="text-gray-600 dark:text-gray-400">
                                                    {step.description}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Referral History Tab */}
                        {activeTab === "history" && (
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Referral History
                                    </h3>
                                    <button className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center">
                                        <RotateCw className="h-4 w-4 mr-1" />
                                        Refresh
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {referrals.map((referral) => (
                                        <motion.div
                                            key={referral._id}
                                            whileHover={{ x: 4 }}
                                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-3 rounded-xl ${
                                                    referral.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                                                    referral.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'
                                                }`}>
                                                    <Users className={`h-5 w-5 ${
                                                        referral.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                                                        referral.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {referral.friendName}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {referral.referredEmail}
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {new Date(referral.dateReferred).toLocaleDateString()}
                                                        {referral.dateCompleted && (
                                                            <>
                                                                <ChevronRight className="h-3 w-3 mx-1" />
                                                                {new Date(referral.dateCompleted).toLocaleDateString()}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <RewardBadge status={referral.status} amount={referral.rewardAmount} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}