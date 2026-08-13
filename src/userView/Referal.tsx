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
    const [codeCopied, setCodeCopied] = useState(false); // ✅ New state
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
            badgeColor: "#666666",
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
            badgeColor: "#666666",
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
        <div className="min-h-screen  dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
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
                                className={`flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
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

                <AnimatePresence mode="wait" >
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 bg-white rounded-3xl px-4"
                    >
                        {activeTab === "refer" && (
                            <>
                                   <section className="w-full ">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 xl:px-1">

    

        {/* Main Content */}
        <div className="grid grid-cols-1 items-center justify-center gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-5">

          {/* Left Card */}
          <div>
               <h1 className="mb-6 text-center text-[38px] font-extrabold leading-tight tracking-tight text-[#222222] sm:text-[46px] lg:text-4xl">
          Refer and
         {" "}  <span className="text-[#ff7047]">Earn</span>

        </h1>
          <div className="w-full overflow-hidden rounded-[38px]">
                {/* Heading */}
     

            {/* Orange Section */}
            <div className="flex min-h-[205px] flex-col justify-center bg-[#fb7048] px-8 py-10 sm:px-12 lg:px-16">
              <h2 className="mb-2 text-[25px] font-bold leading-tight text-white sm:text-[30px] lg:text-3xl">
                Invite your friends
              </h2>

              <p className="text-[30px] font-extrabold leading-tight text-white sm:text-[38px] lg:text-3xl">
                Earn ₹250* Per Share
              </p>
            </div>

            {/* Rewards Section */}
            <div className="flex min-h-[133px] items-center gap-5 bg-[#fff0c5] px-7 py-5 sm:px-12 lg:px-14">

              {/* Coin */}
              <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-[#ffbd17] shadow-inner sm:h-[68px] sm:w-[68px]">
                <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-[2px] border-[#ffe28a]">
                  <span className="text-[28px] text-white">♜</span>
                </div>
              </div>

              {/* Reward Text */}
              <div className="min-w-0 flex-1">
                <h3 className="text-[25px] font-extrabold leading-tight text-[#292929] sm:text-[30px]">
                  My rewards
                </h3>

                <p className="mt-1 text-[21px] font-bold text-[#292929] sm:text-[27px]">
                  1 Point = ₹1
                </p>
              </div>

              {/* Points */}
              <div className="flex h-[62px] w-[110px] shrink-0 items-center justify-center rounded-[18px] border-[2px] border-[#ff7047] bg-white sm:h-[82px] sm:w-[138px] sm:rounded-[18px]">
                <span className="text-[38px] font-bold text-[#ff7047] sm:text-[46px]">
                  {wallet?.totalEarned || 0}
                </span>
              </div>

              {/* Arrow */}
              <button
                type="button"
                className="flex shrink-0 items-center justify-center text-[#ff7047] transition-transform duration-200 hover:translate-x-1"
              >
                <ChevronRight
                  size={48}
                  strokeWidth={4}
                  className="sm:h-[52px] sm:w-[52px]"
                />
              </button>
            </div>
          </div> </div>

          {/* Right Illustration */}
          <div className="flex items-center justify-center lg:justify-end mt-20">
            <img
              src="/images/refer-img.webp"
              alt="Refer and earn"
              className="
                h-full
                w-full
                max-w-[540px]
                object-contain
                lg:w-[480px]
              "
            />
          </div>
        </div>
      </div>
    </section>
                                {/* Referral Journey Section */}
                                <div className="relative w-full w-5xl mx-auto ">
                                    <div className=" px-6 lg:px-10 py-8">

                                        {/* Desktop Dashed Line */}
                                        <svg
                                            className="hidden lg:block absolute top-[58px] left-[110px] right-[110px] w-[calc(100%-220px)] h-12"
                                            viewBox="0 0 900 80"
                                            preserveAspectRatio="none"
                                        >
                                            <path
                                                d="M0 40
           C120 70 180 10 300 40
           C420 70 480 10 600 40
           C720 70 780 10 900 40"
                                                stroke="#7d7d7d"
                                                strokeWidth="2"
                                                strokeDasharray="10 12"
                                                fill="none"
                                            />
                                        </svg>

                                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-0">

                                            {/* Step 1 */}
                                            <div className="relative flex lg:flex-col items-center lg:items-center gap-4">
                                                <div className="absolute left-8 top-16 bottom-[-35px] border-l-2 border-dashed border-gray-300 lg:hidden"></div>

                                                <img
                                                    src="https://png.pngtree.com/png-vector/20250217/ourmid/pngtree-red-megaphone-3d-icon-speaker-png-image_15469706.png"
                                                    className="w-16 h-16 object-contain shrink-0"
                                                />

                                                <div className="text-left lg:text-center">
                                                    <p className="font-semibold text-gray-700 lg:text-lg">
                                                        Share Link
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        Share with your friends
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Step 2 */}
                                            <div className="relative flex lg:flex-col items-center lg:items-center gap-4">
                                                <div className="absolute left-8 top-16 bottom-[-35px] border-l-2 border-dashed border-gray-300 lg:hidden"></div>

                                                <img
                                                    src="https://static.vecteezy.com/system/resources/previews/059/023/139/non_2x/3d-render-of-yellow-abstract-user-icon-minimalist-avatar-for-website-free-png.png"
                                                    className="w-12 h-12 object-contain shrink-0"
                                                />

                                                <div className="text-left lg:text-center">
                                                    <p className="mt-1 lg:text-[17px] font-medium text-[#555]">
                                                        Each Share
                                                    </p>

                                                    <h3 className="text-[22px] font-bold text-[#555]">
                                                        ₹250
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Step 3 */}
                                            <div className="relative flex lg:flex-col items-center lg:items-center gap-4">
                                                <div className="absolute left-8 top-16 bottom-[-35px] border-l-2 border-dashed border-gray-300 lg:hidden"></div>

                                                <img
                                                    src="https://static.vecteezy.com/system/resources/previews/059/023/139/non_2x/3d-render-of-yellow-abstract-user-icon-minimalist-avatar-for-website-free-png.png"
                                                    className="w-12 h-12 object-contain shrink-0"
                                                />

                                                <div className="text-left lg:text-center">
                                                    <p className="mt-1 lg:text-[17px] font-medium text-[#555]">
                                                        10 Shares
                                                    </p>

                                                    <div className="flex items-center gap-1 lg:justify-center">
                                                        <span className="text-yellow-400 text-xl">🌟</span>

                                                        <h3 className="text-[22px] font-bold text-[#ff6b3d]">
                                                            ₹3600
                                                        </h3>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Step 4 */}
                                            <div className="relative flex lg:flex-col items-center lg:items-center gap-4">

                                                <img
                                                    src="https://static.vecteezy.com/system/resources/thumbnails/049/025/475/small_2x/cartoon-mountain-with-trees-and-grass-png.png"
                                                    className="w-16 h-16 object-contain shrink-0"
                                                />

                                                <div className="text-left lg:text-center">
                                                    <p className="lg:text-[15px] leading-5 text-[#555] font-medium">
                                                        Refer More & Earn
                                                        <br />
                                                        More
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 overflow-hidden">

                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className=" lg:p-8 lg:w-3xl mx-auto"
                                    >
                                        {/* Heading */}
                                        <h2 className="text-center text-2xl font-bold text-[#5A5A5A]">
                                            Share Your Referral Code
                                        </h2>

                                        {/* Referral Box */}
                                        <div className="mt-8 border-2 border-dashed border-[#8A8A8A] rounded-[22px] px-6 py-2 flex items-center justify-between">

                                            {/* Referral Code */}
                                            <h3 className="text-[#FF6436] lg:text-[22px] font-extrabold tracking-wide">
                                                {referralCode || "------"}
                                            </h3>

                                            {/* Icons */}
                                            <div className="flex items-center gap-8">

                                                {/* Copy */}
                                                <button
                                                    onClick={copyReferralCode}
                                                    className="transition hover:scale-110"
                                                >
                                                    {codeCopied ? (
                                                        <CheckCircle
                                                            size={22}
                                                            className="text-green-500"
                                                        />
                                                    ) : (
                                                        <Copy
                                                            size={22}
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
                                                    className="transition hover:scale-110"
                                                >
                                                    <Mail
                                                        size={22}
                                                        className="text-[#EA4335]"
                                                    />
                                                </button>

                                            </div>

                                        </div>

                                        {/* WhatsApp */}

                                        <div className="flex justify-center mt-8">

                                            <button
                                                onClick={
                                                    shareOptions.find(
                                                        (item) => item.platform === "whatsapp"
                                                    )?.onClick
                                                }
                                                className="
      flex
      items-center
      gap-4
      bg-[#25D366]
      hover:bg-[#22C45A]
      rounded-2xl
      px-10
      h-[52px]
      shadow-lg
      transition
      "
                                            >
                                                <MessageCircle
                                                    size={22}
                                                    fill="white"
                                                    className="text-white"
                                                />

                                                <span className="text-white text-sm font-semibold lg:text-[16px]">
                                                    Refer Via WhatsApp
                                                </span>
                                            </button>

                                        </div>



                                    </motion.div>


                                </div>



                            </>
                        )}

                        {activeTab === "history" && (
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Referral History
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {referrals.length > 0 ? (
                                        referrals.map((referral) => (
                                            <motion.div
                                                key={referral._id}
                                                whileHover={{ x: 4 }}
                                                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div
                                                        className={`p-3 rounded-xl ${referral.status === 'completed'
                                                            ? 'bg-green-100 dark:bg-green-900/30'
                                                            : referral.status === 'pending'
                                                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                                                : 'bg-gray-100 dark:bg-gray-700'
                                                            }`}
                                                    >
                                                        <Users
                                                            className={`h-5 w-5 ${referral.status === 'completed'
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : referral.status === 'pending'
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : 'text-gray-600 dark:text-gray-400'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {referral.user.name || referral.user.email}
                                                        </div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            Sign up on {new Date(referral.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <RewardBadge status="available" amount={50} />
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            No referrals yet. Start sharing your link or code!
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                           {/* How It Works */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="mt-0  p-4  max-w-5xl mx-auto"
                    >
                        <h2 className="text-center text-xl font-bold text-[#555] mb-12">
                            How it Works
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                            {referralSteps.map((step) => (

                                <motion.div
                                    whileHover={{ y: -6 }}
                                    key={step.step}
                                    className="flex flex-col items-center"
                                >

                                    {/* Card */}

                                    <div className="relative w-50 h-[175px] rounded-[22px] bg-[#F5F5F5] shadow-sm flex items-center justify-center">

                                        {/* Step Badge */}

                                        <div
                                            className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-2 rounded-b-2xl text-white font-bold text-xs"
                                            style={{ background: step.badgeColor }}
                                        >
                                            STEP-{step.step}
                                        </div>

                                        {/* Icon */}

                                        <img
                                            src={step.image}
                                            alt=""
                                            className="w-24 h-24 object-contain"
                                        />

                                    </div>

                                    {/* Text */}

                                    <p className="lg:mt-7 mt-2 text-center text-sm lg:text-[18px] font-medium text-[#555] whitespace-pre-line">
                                        {step.description}
                                    </p>

                                </motion.div>

                            ))}

                        </div>

                    </motion.div>
                    </motion.div>

                 
                </AnimatePresence>
            </div>
        </div>
    );
}