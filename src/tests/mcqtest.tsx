import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Search,
    Clock,
    Sparkles,
    Crown,
    X,
    Filter,
    TrendingUp,
    Play,
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api from "../axiosInstance";
import { useNavigate } from "react-router";
import { LeftSlider, RightOffer } from "../usercomponent/TestSeriesSlider"; // Adjust path if needed
import { useAuth } from "../context/UserContext";

// Types
interface TestTemplate {
    _id: string;
    title: string;
    description?: string;
    exam: {
        _id: string;
        name: string;
        logo?: string;
    };
    testType: "full_length" | "sectional" | "quiz";
    difficultyLabel: "Easy" | "Medium" | "Hard" | "Mixed";
    totalDurationMinutes?: number;
    totalQuestions?: number;
    isFree?: boolean;
    isSellable?: boolean;
    seriesOnly?: boolean;
    price?: number;
    salePrice?: number;
}

// Card Component
export const MockTestCard = ({ test }: { test: TestTemplate }) => {
    let navigate = useNavigate();

    const getPriceLabel = () => {
        if (test.isFree) return "Free";
        if (!test.isSellable && test.seriesOnly) return "Bundle";
        if (test.salePrice && test.salePrice > 0) return `₹ ${test.salePrice}`;
        if (test.price && test.price > 0) return `₹ ${test.price}`;
        return "Free";
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'bg-green-100 text-green-700';
            case 'Medium': return 'bg-yellow-100 text-yellow-700';
            case 'Hard': return 'bg-red-100 text-red-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    const handleAction = () => {
        if (test.isFree) {
            const examName = test.exam?.name?.toLowerCase() || "";
            if (examName.includes("gmat")) navigate(`/gmat/tests/${test._id}`);
            else if (examName.includes("pte")) navigate(`/pte/tests/${test._id}`);
            else if (examName.includes("gre")) navigate(`/gre/tests/${test._id}`);
            else navigate(`/mcq/tests/${test._id}`);
        } else {
            navigate(`/test-details/${test._id}`);
        }
    };

    return (
        <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868] hover:scale-[1.02] transition-transform duration-300">
            <div className="relative rounded-2xl h-full bg-white p-1 sm:p-2 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-[#ADADAC]/20 to-[#ADADAC]/0" />
                <div className="py-3 px-2 space-y-1 bg-white">
                    <h3 className="text-sm sm:text-lg font-semibold capitalize text-gray-900 line-clamp-1">
                        {test.title}
                    </h3>

                    <p className="text-sm text-[#FF6A3D] font-medium line-clamp-1">
                        {test.exam?.name || "Unknown Exam"}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(test.difficultyLabel)}`}>
                            {test.difficultyLabel}
                        </span>
                        {test.isFree && (
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                Free
                            </span>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-y-2 text-gray-600 text-xs pt-2 pb-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[#FF6A3D]" />
                            {test.totalQuestions || 0} Ques...
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#FF6A3D]" />
                            {test.totalDurationMinutes || 0} Mins
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                            <TrendingUp className="h-4 w-4 text-[#FF6A3D]" />
                            Language: English
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-start">
                    <div style={{ borderRadius: "0px 0px 12px 15px" }} className="flex-1 bg-[#FF6A3D] text-center text-white text-lg font-bold px-1 py-1.5">
                        {getPriceLabel()}
                    </div>
                    <button
                        style={{ borderRadius: "0px 0px 15px 0px" }}
                        onClick={handleAction}
                        className="flex-1 bg-[#3B3B3B] text-white text-sm font-medium py-1.5 bg-gradient-to-b from-[#545454] via-[#ffffff]/30 to-[#545454] hover:bg-black transition flex items-center justify-center gap-2"
                    >
                        {test.isFree ? (
                            <>
                                Start Test
                            </>
                        ) : (
                            <>
                                Buy Test
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Skeleton Loader
const MockTestSkeleton = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 animate-pulse overflow-hidden">
            <div className="w-full h-36 bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="flex justify-between">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
        </div>
    );
};

// Main Page Component
export default function MockTests({testType}: any) {
    const [tests, setTests] = useState<TestTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const { user } = useAuth() as any
    const [activeFilterTab, setActiveFilterTab] = useState<"type" | "difficulty" | "price" | "exam">("difficulty");

    const [filters, setFilters] = useState({
        exam: "",
        difficulty: "",
        price: "",
    });

    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const testsRes = await api.get("/mcu/test", {
                    params: {
                        isActive: true,
                        limit: 100,
                        category: user?.category?._id,
                        testType: testType || ""
                    }
                });
                if (testsRes.data?.success) {
                    setTests(testsRes.data.data || []);
                } else {
                    setTests([]);
                }
            } catch (err: any) {
                console.error("Failed to fetch tests:", err);
                setError(err.response?.data?.message || "Failed to load tests");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [testType]);

    const filteredTests = useMemo(() => {
        return tests.filter(test => {
            const matchesSearch =
                test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                test.exam.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesExam = !filters.exam || test.exam._id === filters.exam;
            // const matchesType = !filters.testType || test.testType === filters.testType;
            const matchesDifficulty = !filters.difficulty || test.difficultyLabel === filters.difficulty;

            let matchesPrice = true;
            if (filters.price === "free") matchesPrice = test.isFree;
            else if (filters.price === "paid") matchesPrice = !test.isFree;

            return matchesSearch && matchesExam && matchesDifficulty && matchesPrice;
        });
    }, [tests, searchQuery, filters]);

    return (
        <div className="min-h-[85vh]">
            <div className="max-w-7xl p-0 mx-auto sm:p-4 rounded-xl min-h-[87vh]">
                {/* Top Slider */}
                <div className="grid max-h-[250px] grid-cols-3 lg:grid-cols-3 gap-1 rounded-3xl space-x-2 mb-4">
                    <LeftSlider />
                    <RightOffer />
                </div>

                {/* Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="flex lg:items-center lg:justify-between gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search for mock tests..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 border-1 border-[#FD7149]/70 focus:border-[#FD7149] rounded-xl bg-white text-base text-gray-900 placeholder-gray-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border-1 border-[#FD7149]/70 hover:border-[#FD7149] bg-white text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="h-4 w-4 text-[#FF7046]" />
                                Filters
                                {(filters.exam || filters.testType || filters.difficulty || filters.price) && (
                                    <span className="h-2 w-2 rounded-full bg-[#FF7046]"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showFilters && (
                                    <>
                                        {/* Backdrop */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                                            onClick={() => setShowFilters(false)}
                                        />
                                        {/* Popup */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 top-14 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                                        >
                                            {/* Header */}
                                            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                                                <h3 className="text-base font-semibold text-gray-800">Filters</h3>
                                                <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                                                    <X className="h-5 w-5 text-gray-500" />
                                                </button>
                                            </div>

                                            {/* Body */}
                                            <div className="flex h-[300px]">
                                                {/* Left Tabs */}
                                                <div className="w-1/3 border-r bg-gray-50">
                                                    {[
                                                        // { id: "type", label: "Test Type" },
                                                        { id: "difficulty", label: "Difficulty" },
                                                        { id: "price", label: "Price" },
                                                        { id: "exam", label: "Exam" },
                                                    ].map((tab) => (
                                                        <button
                                                            key={tab.id}
                                                            onClick={() => setActiveFilterTab(tab.id as any)}
                                                            className={`w-full px-4 py-3 text-left text-sm font-medium border-l-4 transition-colors ${activeFilterTab === tab.id
                                                                    ? "border-[#FF7046] bg-white text-[#FF7046]"
                                                                    : "border-transparent text-gray-600 hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Right Options */}
                                                <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
                                                    {/* {activeFilterTab === "type" && (
                                                        <>
                                                            {[
                                                                { value: "", label: "All Types" },
                                                                { value: "full_length", label: "Full Length" },
                                                                { value: "sectional", label: "Sectional" },
                                                                { value: "quiz", label: "Quiz" },
                                                            ].map((opt) => (
                                                                <label key={opt.value} className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                                                                    {opt.label}
                                                                    <input
                                                                        type="radio"
                                                                        name="testType"
                                                                        checked={filters.testType === opt.value}
                                                                        onChange={() => setFilters((p) => ({ ...p, testType: opt.value }))}
                                                                        className="accent-[#FF7046]"
                                                                    />
                                                                </label>
                                                            ))}
                                                        </>
                                                    )} */}

                                                    {activeFilterTab === "difficulty" && (
                                                        <>
                                                            {[
                                                                { value: "", label: "All Levels" },
                                                                { value: "Easy", label: "Easy" },
                                                                { value: "Medium", label: "Medium" },
                                                                { value: "Hard", label: "Hard" },
                                                                { value: "Mixed", label: "Mixed" },
                                                            ].map((opt) => (
                                                                <label key={opt.value} className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                                                                    {opt.label}
                                                                    <input
                                                                        type="radio"
                                                                        name="difficulty"
                                                                        checked={filters.difficulty === opt.value}
                                                                        onChange={() => setFilters((p) => ({ ...p, difficulty: opt.value }))}
                                                                        className="accent-[#FF7046]"
                                                                    />
                                                                </label>
                                                            ))}
                                                        </>
                                                    )}

                                                    {activeFilterTab === "price" && (
                                                        <>
                                                            {[
                                                                { value: "", label: "All" },
                                                                { value: "free", label: "Free Tests" },
                                                                { value: "paid", label: "Paid Tests" },
                                                            ].map((opt) => (
                                                                <label key={opt.value} className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                                                                    {opt.label}
                                                                    <input
                                                                        type="radio"
                                                                        name="price"
                                                                        checked={filters.price === opt.value}
                                                                        onChange={() => setFilters((p) => ({ ...p, price: opt.value }))}
                                                                        className="accent-[#FF7046]"
                                                                    />
                                                                </label>
                                                            ))}
                                                        </>
                                                    )}

                                                    {activeFilterTab === "exam" && (
                                                        <>
                                                            <label className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                                                                All Exams
                                                                <input
                                                                    type="radio"
                                                                    name="exam"
                                                                    checked={filters.exam === ""}
                                                                    onChange={() => setFilters((p) => ({ ...p, exam: "" }))}
                                                                    className="accent-[#FF7046]"
                                                                />
                                                            </label>
                                                            {exams.map((exam) => (
                                                                <label key={exam._id} className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                                                                    {exam.name}
                                                                    <input
                                                                        type="radio"
                                                                        name="exam"
                                                                        checked={filters.exam === exam._id}
                                                                        onChange={() => setFilters((p) => ({ ...p, exam: exam._id }))}
                                                                        className="accent-[#FF7046]"
                                                                    />
                                                                </label>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t bg-gray-50">
                                                <button
                                                    onClick={() =>
                                                        setFilters({
                                                            exam: "",
                                                            testType: "",
                                                            difficulty: "",
                                                            price: "",
                                                        })
                                                    }
                                                    className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-100 transition"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => setShowFilters(false)}
                                                    className="flex-1 py-2 rounded-lg bg-[#FF7046] text-white text-sm font-medium hover:bg-[#e65d36] transition"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* Results */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-5 gap-2">
                            {[...Array(6)].map((_, index) => (
                                <MockTestSkeleton key={index} />
                            ))}
                        </div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                                {/* <BookOpen className="h-16 w-16 text-red-400 mx-auto mb-4" /> */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                                <Button
                                    onClick={() => window.location.reload()}
                                    size="lg"
                                    className="rounded-xl px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                                >
                                    Try Again
                                </Button>
                            </div>
                        </motion.div>
                    ) : filteredTests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="">
                                <img className="w-80 mx-auto" src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-illustration-svg-download-png-9404367.png" alt="no data"/>
                                {/* <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {searchQuery || filters.exam || filters.testType || filters.difficulty || filters.price
                                        ? "No tests match your criteria"
                                        : "Start Your Test Preparation"}
                                </h3> */}
                                {/* <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                                    {searchQuery || filters.exam || filters.testType || filters.difficulty || filters.price
                                        ? "Try adjusting your search or filter to find what you're looking for."
                                        : "Explore our mock tests and start preparing for your exams today."
                                    }
                                </p> */}
                                <Button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilters({ exam: "", testType: "", difficulty: "", price: "" });
                                    }}
                                    size="lg"
                                    className="rounded-xl px-8 py-2.5 mt-1 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                    Showing <span className="text-[#FF7046] font-bold">{filteredTests.length}</span> {filteredTests.length === 1 ? 'test' : 'tests'}
                                    {searchQuery && ` for "${searchQuery}"`}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-1 sm:gap-3">
                                <AnimatePresence>
                                    {filteredTests.map((test) => (
                                        <motion.div
                                            key={test._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <MockTestCard test={test} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Support Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10"
                >
                    <div className="mx-auto">
                        <div className="flex items-center gap-4 rounded-2xl border border-[#E5E5E5] bg-white p-2 px-4 shadow-sm">
                            <div className="flex-shrink-0">
                                <img
                                    src="/images/iels/listening.png" // Ensure this path exists
                                    alt="Support"
                                    className="h-full w-24 object-contain"
                                />
                            </div>
                            <div className="flex-1 text-sm">
                                <p className="text-[#FF7046] font-semibold text-base">
                                    Still have some queries?
                                </p>
                                <p className="text-gray-600 leading-snug">
                                    Call Us at{" "}
                                    <a
                                        href="tel:09509829849"
                                        className="text-[#FF7046] font-semibold hover:underline"
                                    >
                                        09509829849
                                    </a>
                                    <br />
                                    Or chat with our customer support
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}