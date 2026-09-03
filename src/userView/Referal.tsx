
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Gift,
    Share2,
    Copy,
    CheckCircle,
    Award,
    Mail,
    Facebook,
    Twitter,
    Linkedin,
    UserPlus,
    BarChart3,
    Calendar,
    CreditCard,
    Eye,
    EyeOff,
    Bell,
    Info,
    ChevronRight,
    Zap,
    MessageCircle,
    Banknote,
    Link2
} from "lucide-react";
import Button from "../components/ui/button/Button";
import { useAuth } from "../context/UserContext";
import { Loader } from "../components/fullScreeLoader";
import api from "../axiosInstance";

const RewardBadge = ({ status, amount }: { status: string; amount: number }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status === 'available'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : status === 'used'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            }`}
    >
        +₹{amount}
        <div
            className={`ml-2 w-2 h-2 rounded-full ${status === 'available'
                ? 'bg-green-500'
                : status === 'used'
                    ? 'bg-gray-500'
                    : 'bg-amber-500'
                }`}
        ></div>
    </motion.div>
);

const ShareButton = ({
    icon: Icon,
    label,
    color,
    onClick,
}: {
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

export default function ReferAndEarnPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "refer";
    const { wallet } = useAuth() as any;

    const [referralCode, setReferralCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false); 
    const [activeTab, setActiveTab] = useState(initialTab);
    const [email, setEmail] = useState("");
    const [showBalance, setShowBalance] = useState(true);
    const [loading, setLoading] = useState(true);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Sync tab from URL
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["refer", "history"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const updateUrlTab = (tabId: string) => {
        setSearchParams({ tab: tabId });
    };

    // Fetch referral data
    useEffect(() => {
        const fetchReferData = async () => {
            try {
                setLoading(true);
                const res = await api.get("/wallet/history");
                setReferrals(res.data.referrals || []);
                setReferralCode(wallet?.referralCode || "");
            } catch (err: any) {
                console.error("Failed to load referral data", err);
                setError(err.response?.data?.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        if (wallet) fetchReferData();
    }, [wallet]);

    // Copy full link
    const copyToClipboard = () => {
        const link = `https://www.gatewayabroadeducations.com?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ✅ Copy just the code
    const copyReferralCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };

    // Share config
    const shareLink = `https://www.gatewayabroadeducations.com?ref=${referralCode}`;
    const shareText = encodeURIComponent("Join me on Gateway Abroad and get started! Use my link:");

    const shareOptions = [
        {
            platform: "whatsapp",
            icon: Bell,
            color: "bg-green-500 hover:bg-green-600",
            label: "WhatsApp",
            onClick: () =>
                window.open(
                    `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "facebook",
            icon: Facebook,
            color: "bg-blue-600 hover:bg-blue-700",
            label: "Facebook",
            onClick: () =>
                window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "twitter",
            icon: Twitter,
            color: "bg-blue-400 hover:bg-blue-500",
            label: "Twitter",
            onClick: () =>
                window.open(
                    `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "linkedin",
            icon: Linkedin,
            color: "bg-blue-700 hover:bg-blue-800",
            label: "LinkedIn",
            onClick: () =>
                window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
                    "_blank"
                ),
        },
        {
            platform: "email",
            icon: Mail,
            color: "bg-gray-600 hover:bg-gray-700",
            label: "Email",
            onClick: () =>
                (window.location.href = `mailto:?subject=Join%20me%20on%20Gateway%20Abroad&body=${shareText}%0A${shareLink}`),
        },
    ];

    const referralSteps = [
        {
            step: 1,
            title: "STEP-1",
            badgeColor: "#FF5B2E",
            image:
                "https://png.pngtree.com/png-clipart/20250425/original/pngtree-d-isolated-render-of-a-chain-link-icon-with-modern-and-png-image_20809111.png",
            description: "Share the app link\nwith your friends",
        },
        {
            step: 2,
            title: "STEP-2",
            badgeColor: "#FF5B2E",
            image:
                "https://cdn-icons-png.flaticon.com/512/11488/11488571.png",
            description: "Friends sign up using\nyour unique Referral\ncode",
        },
        {
            step: 3,
            title: "STEP-3",
            badgeColor: "#FF5B2E",
            image:
                "https://static.vecteezy.com/system/resources/previews/016/327/497/non_2x/gift-box-3d-icon-render-illustration-png.png",
            description:
                "Earn points when\nfriend signs up, and\nextra points on\ncourse purchase!",
        },
        {
            step: 4,
            title: "STEP-4",
            badgeColor: "#FF5B2E",
            image:
                "https://cdn3d.iconscout.com/3d/premium/thumb/money-3d-icon-png-download-10033543.png",
            description: "Your Friend gets 100\npoints on Sign up",
        },
    ];

    const tabs = [
        { id: "refer", label: "Refer Friends", icon: Share2 },
        { id: "history", label: "Referral History", icon: BarChart3 },
    ];

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center text-red-500 p-6 max-w-md">
                    <p className="text-lg font-medium">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
                >
                    {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    updateUrlTab(tab.id);
                                }}
                                className={`flex items-center px-3 py-2.5 rounded-full border border-gray-200 font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-orange-500 text-white shadow-lg"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                    }`}
                            >
                                <IconComponent className="h-4 w-4 mr-2" />
                                {tab.label}
                            </motion.button>
                        );
                    })}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 bg-white rounded-3xl px-2 sm:px-4 py-4 sm:py-8"
                    >
                        {activeTab === "refer" && (
                            <>
                                <section className="w-full px-1 sm:px-4">
                                    <div
                                        className="
                                            mx-auto
                                            w-full
                                            max-w-[1400px]
                                            px-1
                                            sm:px-4
                                            lg:px-10
                                            xl:px-1
                                            pb-4
                                            sm:pb-8
                                        "
                                    >
                                        {/* Main Content */}
                                        <div className="grid grid-cols-1 items-center justify-center gap-4 lg:gap-5">

                                            {/* Main Referral Card */}
                                            <div className="w-full">

                                                <div className="w-full overflow-hidden rounded-[20px] sm:rounded-[28px] lg:rounded-[38px]">

                                                    {/* ================= MAIN FLEX ================= */}
                                                    <div
                                                        className="
                                                            flex
                                                            flex-col
                                                            lg:flex-row
                                                            bg-[#fb7048]
                                                        "
                                                    >

                                                        {/* ================= ORANGE HEADING ================= */}
                                                        <div
                                                            className="
                                                                flex
                                                                min-h-[140px]
                                                                sm:min-h-[180px]
                                                                lg:min-h-[205px]
                                                                w-full
                                                                lg:w-auto
                                                                lg:min-w-[300px]
                                                                xl:min-w-[340px]
                                                                flex-col
                                                                justify-center
                                                                px-4
                                                                sm:px-8
                                                                lg:px-16
                                                                py-6
                                                                sm:py-10
                                                                text-center
                                                                lg:text-left
                                                            "
                                                        >
                                                            <h2
                                                                className="
                                                                    mb-2
                                                                    text-[22px]
                                                                    sm:text-[28px]
                                                                    lg:text-4xl
                                                                    font-bold
                                                                    leading-tight
                                                                    text-white
                                                                "
                                                            >
                                                                Refer &{" "}
                                                                <span className="text-[#fff600]">
                                                                    Earn
                                                                </span>
                                                            </h2>

                                                            {/* Earnings Badge */}
                                                            <div
                                                                className="
                                                                    w-fit
                                                                    max-w-full
                                                                    -rotate-1
                                                                    rounded-[7px]
                                                                    bg-gradient-to-b
                                                                    from-gray-300
                                                                    via-gray-500
                                                                    to-black
                                                                    p-[1px]
                                                                    mx-auto
                                                                    lg:mx-0
                                                                "
                                                            >
                                                                <div
                                                                    className="
                                                                        inline-flex
                                                                        w-fit
                                                                        max-w-full
                                                                        items-center
                                                                        justify-center
                                                                        rounded-[7px]
                                                                        bg-[#fff600]
                                                                        px-2.5
                                                                        py-2
                                                                        sm:px-3
                                                                        sm:py-2.5
                                                                        lg:py-3
                                                                        text-[12px]
                                                                        sm:text-[16px]
                                                                        lg:text-xl
                                                                        font-extrabold
                                                                        leading-none
                                                                        tracking-[-0.02em]
                                                                        text-black
                                                                        whitespace-nowrap
                                                                    "
                                                                >
                                                                    Earn ₹50* Per Share
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ================= STEPS SECTION ================= */}
                                                        <div
                                                            className="
                                                                relative
                                                                w-full
                                                                flex-1
                                                                min-w-0
                                                            "
                                                        >
                                                            <div
                                                                className="
                                                                    relative
                                                                    px-3
                                                                    sm:px-8
                                                                    lg:px-10
                                                                    py-5
                                                                    sm:py-8
                                                                    lg:py-8
                                                                "
                                                            >

                                                                {/* ================= DESKTOP DASHED LINE ================= */}
                                                                <svg
                                                                    className="
                                                                        hidden
                                                                        lg:block
                                                                        absolute
                                                                        top-[58px]
                                                                        left-[110px]
                                                                        right-[110px]
                                                                        w-[calc(100%-220px)]
                                                                        h-12
                                                                    "
                                                                    viewBox="0 0 900 80"
                                                                    preserveAspectRatio="none"
                                                                >
                                                                    <path
                                                                        d="
                                                                            M0 40
                                                                            C120 70 180 10 300 40
                                                                            C420 70 480 10 600 40
                                                                            C720 70 780 10 900 40
                                                                        "
                                                                        stroke="#fff"
                                                                        strokeWidth="2"
                                                                        strokeDasharray="10 12"
                                                                        fill="none"
                                                                    />
                                                                </svg>

                                                                {/* ================= STEPS ================= */}
                                                                <div
                                                                    className="
                                                                        relative
                                                                        z-10
                                                                        grid
                                                                        grid-cols-2
                                                                        sm:grid-cols-2
                                                                        lg:grid-cols-4
                                                                        gap-3
                                                                        sm:gap-8
                                                                        lg:gap-0
                                                                    "
                                                                >

                                                                    {/* ================= STEP 1 ================= */}
                                                                    <div
                                                                        className="
                                                                            relative
                                                                            flex
                                                                            flex-col
                                                                            items-center
                                                                            lg:flex-col
                                                                            lg:items-center
                                                                            gap-1
                                                                            sm:gap-2
                                                                            min-w-0
                                                                            text-center
                                                                        "
                                                                    >
                                                                        <img
                                                                            src="https://png.pngtree.com/png-vector/20250217/ourmid/pngtree-red-megaphone-3d-icon-speaker-png-image_15469706.png"
                                                                            alt="Share Link"
                                                                            className="
                                                                                w-10
                                                                                h-10
                                                                                sm:w-14
                                                                                sm:h-14
                                                                                lg:w-16
                                                                                lg:h-16
                                                                                object-contain
                                                                                shrink-0
                                                                            "
                                                                        />

                                                                        <div>
                                                                            <p
                                                                                className="
                                                                                    font-semibold
                                                                                    text-white
                                                                                    text-[11px]
                                                                                    sm:text-base
                                                                                    lg:text-lg
                                                                                "
                                                                            >
                                                                                Share Link
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* ================= STEP 2 ================= */}
                                                                    <div
                                                                        className="
                                                                            relative
                                                                            flex
                                                                            flex-col
                                                                            items-center
                                                                            lg:flex-col
                                                                            lg:items-center
                                                                            gap-1
                                                                            sm:gap-2
                                                                            min-w-0
                                                                            text-center
                                                                        "
                                                                    >
                                                                        <img
                                                                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Yellow_-_replace_this_image_male.svg/960px-Yellow_-_replace_this_image_male.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail"
                                                                            alt="Each Share"
                                                                            className="
                                                                                w-8
                                                                                h-8
                                                                                sm:w-14
                                                                                sm:h-14
                                                                                lg:w-12
                                                                                lg:h-12
                                                                                object-contain
                                                                                shrink-0
                                                                            "
                                                                        />

                                                                        <div>
                                                                            <p
                                                                                className="
                                                                                    text-[11px]
                                                                                    sm:text-base
                                                                                    lg:text-[17px]
                                                                                    font-medium
                                                                                    text-white
                                                                                "
                                                                            >
                                                                                Each Share
                                                                            </p>

                                                                            <h3
                                                                                className="
                                                                                    text-lg
                                                                                    sm:text-[22px]
                                                                                    text-white
                                                                                    font-bold
                                                                                "
                                                                            >
                                                                                ₹50
                                                                            </h3>
                                                                        </div>
                                                                    </div>

                                                                    {/* ================= STEP 3 ================= */}
                                                                    <div
                                                                        className="
                                                                            relative
                                                                            flex
                                                                            flex-col
                                                                            items-center
                                                                            lg:flex-col
                                                                            lg:items-center
                                                                            gap-1
                                                                            sm:gap-2
                                                                            min-w-0
                                                                            text-center
                                                                            col-start-1
                                                                            sm:col-start-auto
                                                                        "
                                                                    >
                                                                        <img
                                                                            src="https://cdn3.emoji.gg/emojis/9345-yellow-gift.png"
                                                                            alt="Earn Unlimited"
                                                                            className="
                                                                                w-8
                                                                                h-8
                                                                                sm:w-14
                                                                                sm:h-14
                                                                                lg:w-12
                                                                                lg:h-12
                                                                                object-contain
                                                                                shrink-0
                                                                            "
                                                                        />

                                                                        <div>
                                                                            <div className="flex flex-col items-center">
                                                                                <h3
                                                                                    className="
                                                                                        text-[11px]
                                                                                        sm:text-[15px]
                                                                                        font-bold
                                                                                        text-white
                                                                                    "
                                                                                >
                                                                                    Earn Unlimited
                                                                                </h3>

                                                                                <span className="text-base sm:text-xl">
                                                                                    🌟
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* ================= STEP 4 ================= */}
                                                                    <div
                                                                        className="
                                                                            relative
                                                                            flex
                                                                            flex-col
                                                                            items-center
                                                                            lg:flex-col
                                                                            lg:items-center
                                                                            gap-1
                                                                            sm:gap-2
                                                                            min-w-0
                                                                            text-center
                                                                            col-start-2
                                                                            sm:col-start-auto
                                                                        "
                                                                    >
                                                                        <img
                                                                            src="https://static.vecteezy.com/system/resources/thumbnails/049/025/475/small_2x/cartoon-mountain-with-trees-and-grass-png.png"
                                                                            alt="Refer More"
                                                                            className="
                                                                                w-10
                                                                                h-10
                                                                                sm:w-16
                                                                                sm:h-16
                                                                                object-contain
                                                                                shrink-0
                                                                            "
                                                                        />

                                                                        <div>
                                                                            <p
                                                                                className="
                                                                                    text-[10px]
                                                                                    sm:text-[15px]
                                                                                    lg:text-[15px]
                                                                                    leading-4
                                                                                    sm:leading-5
                                                                                    text-white
                                                                                    font-medium
                                                                                "
                                                                            >
                                                                                Refer More & Earn
                                                                                <br />
                                                                                More
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Referral Journey Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 overflow-hidden w-full px-1 sm:px-4">

                                    <motion.div className="w-full">

                                        {/* Referral Box */}
                                        <div
                                            className="
                                                border
                                                border-orange-500
                                                rounded-[18px]
                                                sm:rounded-[22px]
                                                px-2
                                                sm:px-5
                                                lg:px-6
                                                py-3
                                                sm:py-4
                                                lg:py-2
                                                flex
                                                flex-col
                                                lg:flex-row
                                                items-center
                                                justify-between
                                                gap-3
                                                sm:gap-4
                                                lg:gap-6
                                                w-full
                                            "
                                        >

                                            {/* Heading */}
                                            <h2
                                                className="
                                                    text-center
                                                    text-base
                                                    sm:text-xl
                                                    lg:text-2xl
                                                    font-bold
                                                    text-[#5A5A5A]
                                                    whitespace-nowrap
                                                "
                                            >
                                                Share Your Referral Code
                                            </h2>

                                            {/* Referral Code + Icons */}
                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    sm:gap-6
                                                    bg-orange-100/30
                                                    p-2
                                                    sm:p-3
                                                    rounded-lg
                                                    min-w-0
                                                    max-w-full
                                                    w-full
                                                    sm:w-auto
                                                    flex-wrap
                                                "
                                            >

                                                {/* Referral Code */}
                                                <h3
                                                    className="
                                                        text-[#FF6436]
                                                        text-base
                                                        sm:text-xl
                                                        lg:text-[22px]
                                                        font-extrabold
                                                        tracking-wide
                                                        truncate
                                                    "
                                                >
                                                    {referralCode || "------"}
                                                </h3>

                                                {/* Icons */}
                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        gap-3
                                                        sm:gap-7
                                                        lg:gap-8
                                                        shrink-0
                                                    "
                                                >

                                                    {/* Copy */}
                                                    <button
                                                        onClick={copyReferralCode}
                                                        className="
                                                            transition
                                                            hover:scale-110
                                                            active:scale-95
                                                        "
                                                    >
                                                        {codeCopied ? (
                                                            <CheckCircle
                                                                size={18}
                                                                sm:size={22}
                                                                className="text-green-500"
                                                            />
                                                        ) : (
                                                            <Copy
                                                                size={18}
                                                                sm:size={22}
                                                                className="text-[#444]"
                                                            />
                                                        )}
                                                    </button>

                                                    {/* Gmail Share */}
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                                `https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(
                                                                    shareLink
                                                                )}`
                                                            )
                                                        }
                                                        className="
                                                            transition
                                                            hover:scale-110
                                                            active:scale-95
                                                        "
                                                    >
                                                        <Mail
                                                            size={18}
                                                            sm:size={22}
                                                            className="text-[#EA4335]"
                                                        />
                                                    </button>

                                                </div>
                                            </div>

                                            {/* WhatsApp */}
                                            <div className="flex justify-center w-full lg:w-auto">

                                                <button
                                                    onClick={
                                                        shareOptions.find(
                                                            (item) =>
                                                                item.platform === "whatsapp"
                                                        )?.onClick
                                                    }
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-center
                                                        gap-2
                                                        sm:gap-4
                                                        bg-[#25D366]
                                                        hover:bg-[#22C45A]
                                                        rounded-2xl
                                                        px-4
                                                        sm:px-8
                                                        lg:px-10
                                                        h-[40px]
                                                        sm:h-[52px]
                                                        shadow-lg
                                                        transition
                                                        w-full
                                                        sm:w-auto
                                                        whitespace-nowrap
                                                    "
                                                >
                                                    <MessageCircle
                                                        size={18}
                                                        sm:size={22}
                                                        fill="white"
                                                        className="text-white shrink-0"
                                                    />

                                                    <span
                                                        className="
                                                            text-white
                                                            text-xs
                                                            sm:text-[16px]
                                                            font-semibold
                                                        "
                                                    >
                                                        Refer Via WhatsApp
                                                    </span>
                                                </button>

                                            </div>

                                        </div>

                                    </motion.div>

                                </div>

                            </>
                        )}

                        {activeTab === "history" && (
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4 sm:p-6"
                            >
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                        Referral History
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {referrals.length > 0 ? (
                                        referrals.map((referral) => (
                                            <motion.div
                                                key={referral._id}
                                                whileHover={{ x: 4 }}
                                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl gap-2 sm:gap-0"
                                            >
                                                <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                                                    <div
                                                        className={`p-2 sm:p-3 rounded-xl ${referral.status === 'completed'
                                                            ? 'bg-green-100 dark:bg-green-900/30'
                                                            : referral.status === 'pending'
                                                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                                                : 'bg-gray-100 dark:bg-gray-700'
                                                            }`}
                                                    >
                                                        <Users
                                                            className={`h-4 w-4 sm:h-5 sm:w-5 ${referral.status === 'completed'
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : referral.status === 'pending'
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : 'text-gray-600 dark:text-gray-400'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                                                            {referral.user.name || referral.user.email}
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                                            <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                                            Sign up on {new Date(referral.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right w-full sm:w-auto">
                                                    <RewardBadge status="available" amount={50} />
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                                            No referrals yet. Start sharing your link or code!
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* How It Works */}
                        <div className="px-1 sm:px-4">
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="py-4 sm:py-3 w-full bg-orange-200/20 rounded-2xl px-2 sm:px-4"
                            >
                                <h2 className="text-center text-lg sm:text-xl font-bold text-[#555] mb-6 sm:mb-12">
                                    How it Works
                                </h2>

                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">

                                    {referralSteps.map((step) => (

                                        <motion.div
                                            whileHover={{ y: -6 }}
                                            key={step.step}
                                            className="flex flex-col items-center"
                                        >

                                            {/* Card */}
                                            <div className="relative w-20 h-[80px] sm:w-30 sm:h-[105px] rounded-[18px] sm:rounded-[22px] bg-white shadow-sm flex items-center justify-center">

                                                {/* Step Badge */}
                                                <div
                                                    className="absolute top-0 left-1/2 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-b-2xl text-white font-bold text-[8px] sm:text-xs"
                                                    style={{ background: step.badgeColor }}
                                                >
                                                    STEP-{step.step}
                                                </div>

                                                {/* Icon */}
                                                <img
                                                    src={step.image}
                                                    alt=""
                                                    className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
                                                />

                                            </div>

                                            {/* Text */}
                                            <p className="mt-1 sm:mt-2 lg:mt-7 text-center text-[9px] sm:text-sm lg:text-base font-medium text-[#555] whitespace-pre-line">
                                                {step.description}
                                            </p>

                                        </motion.div>

                                    ))}

                                </div>

                            </motion.div>
                        </div>
                    </motion.div>

                </AnimatePresence>
            </div>
        </div>
    );
}








// import { useState, useEffect } from "react";
// import { useSearchParams } from "react-router";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//     Users,
//     Gift,
//     Share2,
//     Copy,
//     CheckCircle,
//     Award,
//     Mail,
//     Facebook,
//     Twitter,
//     Linkedin,
//     UserPlus,
//     BarChart3,
//     Calendar,
//     CreditCard,
//     Eye,
//     EyeOff,
//     Bell,
//     Info,
//     ChevronRight,
//     Zap,
//     MessageCircle,
//     Banknote,
//     Link2
// } from "lucide-react";
// import Button from "../components/ui/button/Button";
// import { useAuth } from "../context/UserContext";
// import { Loader } from "../components/fullScreeLoader";
// import api from "../axiosInstance";

// const RewardBadge = ({ status, amount }: { status: string; amount: number }) => (
//     <motion.div
//         whileHover={{ scale: 1.05 }}
//         className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${status === 'available'
//             ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
//             : status === 'used'
//                 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
//                 : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
//             }`}
//     >
//         +₹{amount}
//         <div
//             className={`ml-2 w-2 h-2 rounded-full ${status === 'available'
//                 ? 'bg-green-500'
//                 : status === 'used'
//                     ? 'bg-gray-500'
//                     : 'bg-amber-500'
//                 }`}
//         ></div>
//     </motion.div>
// );

// const ShareButton = ({
//     icon: Icon,
//     label,
//     color,
//     onClick,
// }: {
//     icon: any;
//     label: string;
//     color: string;
//     onClick: () => void;
// }) => (
//     <motion.button
//         whileHover={{ scale: 1.05, y: -2 }}
//         whileTap={{ scale: 0.95 }}
//         onClick={onClick}
//         className={`${color} text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-xl flex flex-col items-center space-y-2`}
//     >
//         <Icon className="h-5 w-5" />
//         <span className="text-xs font-medium">{label}</span>
//     </motion.button>
// );

// export default function ReferAndEarnPage() {
//     const [searchParams, setSearchParams] = useSearchParams();
//     const initialTab = searchParams.get("tab") || "refer";
//     const { wallet } = useAuth() as any;

//     const [referralCode, setReferralCode] = useState("");
//     const [copied, setCopied] = useState(false);
//     const [codeCopied, setCodeCopied] = useState(false); 
//     const [activeTab, setActiveTab] = useState(initialTab);
//     const [email, setEmail] = useState("");
//     const [showBalance, setShowBalance] = useState(true);
//     const [loading, setLoading] = useState(true);
//     const [referrals, setReferrals] = useState<any[]>([]);
//     const [error, setError] = useState<string | null>(null);

//     // Sync tab from URL
//     useEffect(() => {
//         const tab = searchParams.get("tab");
//         if (tab && ["refer", "history"].includes(tab)) {
//             setActiveTab(tab);
//         }
//     }, [searchParams]);

//     const updateUrlTab = (tabId: string) => {
//         setSearchParams({ tab: tabId });
//     };

//     // Fetch referral data
//     useEffect(() => {
//         const fetchReferData = async () => {
//             try {
//                 setLoading(true);
//                 const res = await api.get("/wallet/history");
//                 setReferrals(res.data.referrals || []);
//                 setReferralCode(wallet?.referralCode || "");
//             } catch (err: any) {
//                 console.error("Failed to load referral data", err);
//                 setError(err.response?.data?.message || "Failed to load data");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         if (wallet) fetchReferData();
//     }, [wallet]);

//     // Copy full link
//     const copyToClipboard = () => {
//         const link = `https://www.gatewayabroadeducations.com?ref=${referralCode}`;
//         navigator.clipboard.writeText(link);
//         setCopied(true);
//         setTimeout(() => setCopied(false), 2000);
//     };

//     // ✅ Copy just the code
//     const copyReferralCode = () => {
//         navigator.clipboard.writeText(referralCode);
//         setCodeCopied(true);
//         setTimeout(() => setCodeCopied(false), 2000);
//     };

//     // Share config
//     const shareLink = `https://www.gatewayabroadeducations.com?ref=${referralCode}`;
//     const shareText = encodeURIComponent("Join me on Gateway Abroad and get started! Use my link:");

//     const shareOptions = [
//         {
//             platform: "whatsapp",
//             icon: Bell,
//             color: "bg-green-500 hover:bg-green-600",
//             label: "WhatsApp",
//             onClick: () =>
//                 window.open(
//                     `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareLink)}`,
//                     "_blank"
//                 ),
//         },
//         {
//             platform: "facebook",
//             icon: Facebook,
//             color: "bg-blue-600 hover:bg-blue-700",
//             label: "Facebook",
//             onClick: () =>
//                 window.open(
//                     `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
//                     "_blank"
//                 ),
//         },
//         {
//             platform: "twitter",
//             icon: Twitter,
//             color: "bg-blue-400 hover:bg-blue-500",
//             label: "Twitter",
//             onClick: () =>
//                 window.open(
//                     `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareLink)}`,
//                     "_blank"
//                 ),
//         },
//         {
//             platform: "linkedin",
//             icon: Linkedin,
//             color: "bg-blue-700 hover:bg-blue-800",
//             label: "LinkedIn",
//             onClick: () =>
//                 window.open(
//                     `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
//                     "_blank"
//                 ),
//         },
//         {
//             platform: "email",
//             icon: Mail,
//             color: "bg-gray-600 hover:bg-gray-700",
//             label: "Email",
//             onClick: () =>
//                 (window.location.href = `mailto:?subject=Join%20me%20on%20Gateway%20Abroad&body=${shareText}%0A${shareLink}`),
//         },
//     ];


//     const referralSteps = [
//         {
//             step: 1,
//             title: "STEP-1",
//             badgeColor: "#FF5B2E",
//             image:
//                 "https://png.pngtree.com/png-clipart/20250425/original/pngtree-d-isolated-render-of-a-chain-link-icon-with-modern-and-png-image_20809111.png",
//             description: "Share the app link\nwith your friends",
//         },
//         {
//             step: 2,
//             title: "STEP-2",
//             badgeColor: "#FF5B2E",
//             image:
//                 "https://cdn-icons-png.flaticon.com/512/11488/11488571.png",
//             description: "Friends sign up using\nyour unique Referral\ncode",
//         },
//         {
//             step: 3,
//             title: "STEP-3",
//             badgeColor: "#FF5B2E",
//             image:
//                 "https://static.vecteezy.com/system/resources/previews/016/327/497/non_2x/gift-box-3d-icon-render-illustration-png.png",
//             description:
//                 "Earn points when\nfriend signs up, and\nextra points on\ncourse purchase!",
//         },
//         {
//             step: 4,
//             title: "STEP-4",
//             badgeColor: "#FF5B2E",
//             image:
//                 "https://cdn3d.iconscout.com/3d/premium/thumb/money-3d-icon-png-download-10033543.png",
//             description: "Your Friend gets 100\npoints on Sign up",
//         },
//     ];


//     const tabs = [
//         { id: "refer", label: "Refer Friends", icon: Share2 },
//         { id: "history", label: "Referral History", icon: BarChart3 },
//     ];

//     if (loading) {
//         return <Loader />;
//     }

//     if (error) {
//         return (
//             <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//                 <div className="text-center text-red-500 p-6 max-w-md">
//                     <p className="text-lg font-medium">{error}</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen  dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-all duration-300">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//                 {/* Tabs */}
//                 <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.1 }}
//                     className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
//                 >
//                     {tabs.map((tab) => {
//                         const IconComponent = tab.icon;
//                         return (
//                             <motion.button
//                                 key={tab.id}
//                                 whileHover={{ scale: 1.02 }}
//                                 whileTap={{ scale: 0.98 }}
//                                 onClick={() => {
//                                     setActiveTab(tab.id);
//                                     updateUrlTab(tab.id);
//                                 }}
//                                 className={`flex items-center px-3 py-2.5 rounded-full border border-gray-200 font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
//                                     ? "bg-orange-500 text-white shadow-lg"
//                                     : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
//                                     }`}
//                             >
//                                 <IconComponent className="h-4 w-4 mr-2" />
//                                 {tab.label}
//                             </motion.button>
//                         );
//                     })}
//                 </motion.div>

//                 <AnimatePresence mode="wait" >
//                     <motion.div
//                         key={activeTab}
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         exit={{ opacity: 0, y: -20 }}
//                         transition={{ duration: 0.3 }}
//                         className="space-y-6 bg-white rounded-3xl px-4 py-8"
//                     >
//                         {activeTab === "refer" && (
//                             <>
//                                <section className="w-full px-4">
//     <div
//         className="
//             mx-auto
//             w-full
//             max-w-[1400px]
//             px-2
//             sm:px-4
//             lg:px-10
//             xl:px-1
//             pb-8
//         "
//     >
//         {/* Main Content */}
//         <div className="grid grid-cols-1 items-center justify-center gap-8 lg:gap-5">

//             {/* Main Referral Card */}
//             <div className="w-full">

//                 <div className="w-full overflow-hidden rounded-[28px] sm:rounded-[34px] lg:rounded-[38px]">

//                     {/* ================= MAIN FLEX ================= */}
//                     <div
//                         className="
//                             flex
//                             flex-col
//                             lg:flex-row
//                             bg-[#fb7048]
//                         "
//                     >

//                         {/* ================= ORANGE HEADING ================= */}
//                         <div
//                             className="
//                                 flex
//                                 min-h-[180px]
//                                 sm:min-h-[190px]
//                                 lg:min-h-[205px]
//                                 w-full
//                                 lg:w-auto
//                                 lg:min-w-[300px]
//                                 xl:min-w-[340px]
//                                 flex-col
//                                 justify-center
//                                 px-5
//                                 sm:px-8
//                                 lg:px-16
//                                 py-8
//                                 sm:py-10
//                             "
//                         >
//                             <h2
//                                 className="
//                                     mb-2
//                                     text-[24px]
//                                     sm:text-[28px]
//                                     lg:text-4xl
//                                     font-bold
//                                     leading-tight
//                                     text-white
//                                 "
//                             >
//                                 Refer &{" "}
//                                 <span className="text-[#fff600]">
//                                     Earn
//                                 </span>
//                             </h2>

//                             {/* Earnings Badge */}
//                             <div
//                                 className="
//                                     w-fit
//                                     max-w-full
//                                     -rotate-1
//                                     rounded-[7px]
//                                     bg-gradient-to-b
//                                     from-gray-300
//                                     via-gray-500
//                                     to-black
//                                     p-[1px]
//                                 "
//                             >
//                                 <div
//                                     className="
//                                         inline-flex
//                                         w-fit
//                                         max-w-full
//                                         items-center
//                                         justify-center
//                                         rounded-[7px]
//                                         bg-[#fff600]
//                                         px-2.5
//                                         py-2
//                                         sm:px-3
//                                         sm:py-2.5
//                                         lg:py-3
//                                         text-[13px]
//                                         sm:text-[16px]
//                                         lg:text-xl
//                                         font-extrabold
//                                         leading-none
//                                         tracking-[-0.02em]
//                                         text-black
//                                         whitespace-nowrap
//                                     "
//                                 >
//                                     Earn ₹50* Per Share
//                                 </div>
//                             </div>
//                         </div>

//                         {/* ================= STEPS SECTION ================= */}
//                         <div
//                             className="
//                                 relative
//                                 w-full
//                                 flex-1
//                                 min-w-0
//                             "
//                         >
//                             <div
//                                 className="
//                                     relative
//                                     px-5
//                                     py-7
//                                     sm:px-8
//                                     sm:py-8
//                                     lg:px-10
//                                     lg:py-8
//                                 "
//                             >

//                                 {/* ================= DESKTOP DASHED LINE ================= */}
//                                 <svg
//                                     className="
//                                         hidden
//                                         lg:block
//                                         absolute
//                                         top-[58px]
//                                         left-[110px]
//                                         right-[110px]
//                                         w-[calc(100%-220px)]
//                                         h-12
//                                     "
//                                     viewBox="0 0 900 80"
//                                     preserveAspectRatio="none"
//                                 >
//                                     <path
//                                         d="
//                                             M0 40
//                                             C120 70 180 10 300 40
//                                             C420 70 480 10 600 40
//                                             C720 70 780 10 900 40
//                                         "
//                                         stroke="#fff"
//                                         strokeWidth="2"
//                                         strokeDasharray="10 12"
//                                         fill="none"
//                                     />
//                                 </svg>

//                                 {/* ================= STEPS ================= */}
//                                 <div
//                                     className="
//                                         relative
//                                         z-10
//                                         grid
//                                         grid-cols-1
//                                         sm:grid-cols-2
//                                         lg:grid-cols-4
//                                         gap-6
//                                         sm:gap-8
//                                         lg:gap-0
//                                     "
//                                 >

//                                     {/* ================= STEP 1 ================= */}
//                                     <div
//                                         className="
//                                             relative
//                                             flex
//                                             items-center
//                                             lg:flex-col
//                                             lg:items-center
//                                             gap-4
//                                             min-w-0
//                                         "
//                                     >
//                                         {/* Mobile connector */}
//                                         <div
//                                             className="
//                                                 absolute
//                                                 left-[31px]
//                                                 top-[64px]
//                                                 bottom-[-24px]
//                                                 border-l-2
//                                                 border-dashed
//                                                 border-white/50
//                                                 sm:hidden
//                                             "
//                                         />

//                                         <img
//                                             src="https://png.pngtree.com/png-vector/20250217/ourmid/pngtree-red-megaphone-3d-icon-speaker-png-image_15469706.png"
//                                             alt="Share Link"
//                                             className="
//                                                 w-14
//                                                 h-14
//                                                 sm:w-16
//                                                 sm:h-16
//                                                 object-contain
//                                                 shrink-0
//                                             "
//                                         />

//                                         <div className="text-left lg:text-center">
//                                             <p
//                                                 className="
//                                                     font-semibold
//                                                     text-white
//                                                     text-sm
//                                                     sm:text-base
//                                                     lg:text-lg
//                                                 "
//                                             >
//                                                 Share Link
//                                             </p>
//                                         </div>
//                                     </div>

//                                     {/* ================= STEP 2 ================= */}
//                                     <div
//                                         className="
//                                             relative
//                                             flex
//                                             items-center
//                                             lg:flex-col
//                                             lg:items-center
//                                             gap-4
//                                             min-w-0
//                                         "
//                                     >
//                                         <div
//                                             className="
//                                                 absolute
//                                                 left-[31px]
//                                                 top-[64px]
//                                                 bottom-[-24px]
//                                                 border-l-2
//                                                 border-dashed
//                                                 border-white/50
//                                                 sm:hidden
//                                             "
//                                         />

//                                         <img
//                                             src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Yellow_-_replace_this_image_male.svg/960px-Yellow_-_replace_this_image_male.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail"
//                                             alt="Each Share"
//                                             className="
//                                                 w-12
//                                                 h-12
//                                                 sm:w-14
//                                                 sm:h-14
//                                                 lg:w-12
//                                                 lg:h-12
//                                                 object-contain
//                                                 shrink-0
//                                             "
//                                         />

//                                         <div className="text-left lg:text-center">
//                                             <p
//                                                 className="
//                                                     mt-1
//                                                     text-sm
//                                                     sm:text-base
//                                                     lg:text-[17px]
//                                                     font-medium
//                                                     text-white
//                                                 "
//                                             >
//                                                 Each Share
//                                             </p>

//                                             <h3
//                                                 className="
//                                                     text-xl
//                                                     sm:text-[22px]
//                                                     text-white
//                                                     font-bold
//                                                 "
//                                             >
//                                                 ₹50
//                                             </h3>
//                                         </div>
//                                     </div>

//                                     {/* ================= STEP 3 ================= */}
//                                     <div
//                                         className="
//                                             relative
//                                             flex
//                                             items-center
//                                             lg:flex-col
//                                             lg:items-center
//                                             gap-4
//                                             min-w-0
//                                         "
//                                     >
//                                         <div
//                                             className="
//                                                 absolute
//                                                 left-[31px]
//                                                 top-[64px]
//                                                 bottom-[-24px]
//                                                 border-l-2
//                                                 border-dashed
//                                                 border-white/50
//                                                 sm:hidden
//                                             "
//                                         />

//                                         <img
//                                             src="https://cdn3.emoji.gg/emojis/9345-yellow-gift.png"
//                                             alt="Earn Unlimited"
//                                             className="
//                                                 w-12
//                                                 h-12
//                                                 sm:w-14
//                                                 sm:h-14
//                                                 lg:w-12
//                                                 lg:h-12
//                                                 object-contain
//                                                 shrink-0
//                                             "
//                                         />

//                                         <div className="text-left lg:text-center">
//                                             <div className="flex flex-col items-start lg:items-center">
//                                                 <h3
//                                                     className="
//                                                         text-sm
//                                                         sm:text-[15px]
//                                                         font-bold
//                                                         text-white
//                                                     "
//                                                 >
//                                                     Earn Unlimited
//                                                 </h3>

//                                                 <span className="text-lg sm:text-xl">
//                                                     🌟
//                                                 </span>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* ================= STEP 4 ================= */}
//                                     <div
//                                         className="
//                                             relative
//                                             flex
//                                             items-center
//                                             lg:flex-col
//                                             lg:items-center
//                                             gap-4
//                                             min-w-0
//                                         "
//                                     >
//                                         <img
//                                             src="https://static.vecteezy.com/system/resources/thumbnails/049/025/475/small_2x/cartoon-mountain-with-trees-and-grass-png.png"
//                                             alt="Refer More"
//                                             className="
//                                                 w-14
//                                                 h-14
//                                                 sm:w-16
//                                                 sm:h-16
//                                                 object-contain
//                                                 shrink-0
//                                             "
//                                         />

//                                         <div className="text-left lg:text-center">
//                                             <p
//                                                 className="
//                                                     text-sm
//                                                     sm:text-[15px]
//                                                     lg:text-[15px]
//                                                     leading-5
//                                                     text-white
//                                                     font-medium
//                                                 "
//                                             >
//                                                 Refer More & Earn
//                                                 <br />
//                                                 More
//                                             </p>
//                                         </div>
//                                     </div>

//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </div>
//     </div>
// </section>
//                                 {/* Referral Journey Section */}


//                               <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 overflow-hidden w-full px-2 sm:px-4">

//     <motion.div className="w-full">

//         {/* Referral Box */}
//         <div
//             className="
//                 border
//                 border-orange-500
//                 rounded-[22px]
//                 px-3
//                 sm:px-5
//                 lg:px-6
//                 py-4
//                 lg:py-2
//                 flex
//                 flex-col
//                 lg:flex-row
//                 items-center
//                 justify-between
//                 gap-4
//                 lg:gap-6
//                 w-full
//             "
//         >

//             {/* Heading */}
//             <h2
//                 className="
//                     text-center
//                     text-xl
//                     sm:text-2xl
//                     font-bold
//                     text-[#5A5A5A]
//                     whitespace-nowrap
//                 "
//             >
//                 Share Your Referral Code
//             </h2>

//             {/* Referral Code + Icons */}
//             <div
//                 className="
//                     flex
//                     items-center
//                     justify-center
//                     gap-4
//                     sm:gap-6
//                     bg-orange-100/30
//                     p-2.5
//                     sm:p-3
//                     rounded-lg
//                     min-w-0
//                     max-w-full
//                 "
//             >

//                 {/* Referral Code */}
//                 <h3
//                     className="
//                         text-[#FF6436]
//                         text-lg
//                         sm:text-xl
//                         lg:text-[22px]
//                         font-extrabold
//                         tracking-wide
//                         truncate
//                     "
//                 >
//                     {referralCode || "------"}
//                 </h3>

//                 {/* Icons */}
//                 <div
//                     className="
//                         flex
//                         items-center
//                         gap-5
//                         sm:gap-7
//                         lg:gap-8
//                         shrink-0
//                     "
//                 >

//                     {/* Copy */}
//                     <button
//                         onClick={copyReferralCode}
//                         className="
//                             transition
//                             hover:scale-110
//                             active:scale-95
//                         "
//                     >
//                         {codeCopied ? (
//                             <CheckCircle
//                                 size={22}
//                                 className="text-green-500"
//                             />
//                         ) : (
//                             <Copy
//                                 size={22}
//                                 className="text-[#444]"
//                             />
//                         )}
//                     </button>

//                     {/* Gmail Share */}
//                     <button
//                         onClick={() =>
//                             window.open(
//                                 `https://mail.google.com/mail/?view=cm&body=${encodeURIComponent(
//                                     shareLink
//                                 )}`
//                             )
//                         }
//                         className="
//                             transition
//                             hover:scale-110
//                             active:scale-95
//                         "
//                     >
//                         <Mail
//                             size={22}
//                             className="text-[#EA4335]"
//                         />
//                     </button>

//                 </div>
//             </div>

//             {/* WhatsApp */}
//             <div className="flex justify-center w-full lg:w-auto">

//                 <button
//                     onClick={
//                         shareOptions.find(
//                             (item) =>
//                                 item.platform === "whatsapp"
//                         )?.onClick
//                     }
//                     className="
//                         flex
//                         items-center
//                         justify-center
//                         gap-3
//                         sm:gap-4
//                         bg-[#25D366]
//                         hover:bg-[#22C45A]
//                         rounded-2xl
//                         px-6
//                         sm:px-8
//                         lg:px-10
//                         h-[48px]
//                         sm:h-[52px]
//                         shadow-lg
//                         transition
//                         w-full
//                         sm:w-auto
//                         whitespace-nowrap
//                     "
//                 >
//                     <MessageCircle
//                         size={22}
//                         fill="white"
//                         className="text-white shrink-0"
//                     />

//                     <span
//                         className="
//                             text-white
//                             text-sm
//                             font-semibold
//                             sm:text-[16px]
//                         "
//                     >
//                         Refer Via WhatsApp
//                     </span>
//                 </button>

//             </div>

//         </div>

//     </motion.div>

// </div>



//                             </>
//                         )}

//                         {activeTab === "history" && (
//                             <motion.div
//                                 whileHover={{ y: -2 }}
//                                 className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
//                             >
//                                 <div className="flex items-center justify-between mb-6">
//                                     <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
//                                         Referral History
//                                     </h3>
//                                 </div>
//                                 <div className="space-y-3">
//                                     {referrals.length > 0 ? (
//                                         referrals.map((referral) => (
//                                             <motion.div
//                                                 key={referral._id}
//                                                 whileHover={{ x: 4 }}
//                                                 className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl"
//                                             >
//                                                 <div className="flex items-center space-x-4">
//                                                     <div
//                                                         className={`p-3 rounded-xl ${referral.status === 'completed'
//                                                             ? 'bg-green-100 dark:bg-green-900/30'
//                                                             : referral.status === 'pending'
//                                                                 ? 'bg-amber-100 dark:bg-amber-900/30'
//                                                                 : 'bg-gray-100 dark:bg-gray-700'
//                                                             }`}
//                                                     >
//                                                         <Users
//                                                             className={`h-5 w-5 ${referral.status === 'completed'
//                                                                 ? 'text-green-600 dark:text-green-400'
//                                                                 : referral.status === 'pending'
//                                                                     ? 'text-amber-600 dark:text-amber-400'
//                                                                     : 'text-gray-600 dark:text-gray-400'
//                                                                 }`}
//                                                         />
//                                                     </div>
//                                                     <div>
//                                                         <div className="font-semibold text-gray-900 dark:text-white">
//                                                             {referral.user.name || referral.user.email}
//                                                         </div>
//                                                         <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
//                                                             <Calendar className="h-3 w-3 mr-1" />
//                                                             Sign up on {new Date(referral.createdAt).toLocaleDateString()}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                                 <div className="text-right">
//                                                     <RewardBadge status="available" amount={50} />
//                                                 </div>
//                                             </motion.div>
//                                         ))
//                                     ) : (
//                                         <div className="text-center py-8 text-gray-500 dark:text-gray-400">
//                                             No referrals yet. Start sharing your link or code!
//                                         </div>
//                                     )}
//                                 </div>
//                             </motion.div>
//                         )}

//                         {/* How It Works */}
//                         <div className="px-4 ">
//                         <motion.div
//                             whileHover={{ y: -2 }}
//                             className=" py-3   w-full  bg-orange-200/20 rounded-2xl"
//                         >
//                             <h2 className="text-center text-xl font-bold text-[#555] mb-12">
//                                 How it Works
//                             </h2>

//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

//                                 {referralSteps.map((step) => (

//                                     <motion.div
//                                         whileHover={{ y: -6 }}
//                                         key={step.step}
//                                         className="flex flex-col items-center"
//                                     >

//                                         {/* Card */}

//                                         <div className="relative w-30 h-[105px] rounded-[22px] bg-white shadow-sm flex items-center justify-center">

//                                             {/* Step Badge */}

//                                             <div
//                                                 className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-1 rounded-b-2xl text-white font-bold text-xs"
//                                                 style={{ background: step.badgeColor }}
//                                             >
//                                                 STEP-{step.step}
//                                             </div>

//                                             {/* Icon */}

//                                             <img
//                                                 src={step.image}
//                                                 alt=""
//                                                 className="w-14 h-14 object-contain"
//                                             />

//                                         </div>

//                                         {/* Text */}

//                                         <p className="lg:mt-7 mt-2 text-center text-sm lg:text-base font-medium text-[#555] whitespace-pre-line">
//                                             {step.description}
//                                         </p>

//                                     </motion.div>

//                                 ))}

//                             </div>

//                         </motion.div>
//                         </div>
//                     </motion.div>


//                 </AnimatePresence>
//             </div>
//         </div>
//     );
// }


