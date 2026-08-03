// src/pages/TestSeriesPage.tsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Search,
    Grid,
    Trophy,
    Clock,
    Sparkles,
    Crown,
    X,
    Filter,
    TrendingUp,
    Lock,
    CalendarDays,
    FileText,
    Radio,
    Calendar
} from "lucide-react";
import Button from "../components/ui/button/Button";
import api, { ImageBaseUrl } from "../axiosInstance";
import { useNavigate } from "react-router";
import { LeftSlider, RightOffer } from "../usercomponent/TestSeriesSlider";

// Types
interface TestSeries {
    _id: string;
    title: string;
    description: string;
    exam: {
        _id: string;
        name: string;
        slug: string;
        logo?: string;
    };
    category: {
        _id: string;
        name: string;
    };
    defaultTestType: "full_length" | "sectional" | "quiz" | "mixed";
    tests: Array<{
        test: {
            _id: string;
            title: string;
            slug: string;
        };
        isMandatory: boolean;
        label: string;
        accessDays: number;
    }>;
    totalTests: number;
    pricing: {
        isFree: boolean;
        price: number;
        salePrice?: number;
        currency: string;
    };
    isActive: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    usersEnrolled?: number;
    rating?: number;
}

export const TestSeriesCard = ({ series }: { series: TestSeries }) => {
    let navigate = useNavigate();
    return (
        <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
            <div className="relative rounded-2xl h-full bg-white p-2 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />
                <div style={{ borderRadius: "15px 15px 0px 0px" }} className="relative overflow-hidden h-[170px]">
                    <img
                        src={series?.thumbnailPic || "/images/logo.png"}
                        alt={series?.title}
                        className="object-cover h-full w-full"
                    />
                </div>

                <div onClick={() => navigate(`/test-series/${series?.slug}`)} className="py-2 px-1 space-y-1 cursor-pointer">
                    <h3 className="text-lg font-medium capitalize text-gray-900">
                        {series?.title}
                    </h3>

                    <p className="text-sm text-[#FF6A3D] font-medium">
                        {series?.description || series?.exam?.name}
                    </p>

                    {/* TAGS */}
                    {/* <div className="flex flex-wrap gap-2">
                        <span
                            className="px-3 py-1 rounded-full shadow  bg-[#FFF1EB] text-[#FF6A3D] text-sm uppercase font-medium"
                        >
                            {series?.defaultTestType}
                        </span>
                        <span
                            className="px-3 py-1 rounded-full shadow  bg-[#FFF1EB] text-[#FF6A3D] text-sm uppercase font-medium"
                        >
                            {series?.category?.name}
                        </span>
                    </div> */}

                    {/* META */}
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 pt-2 pb-2">

                        {/* VALIDITY */}
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#FF6A3D]" />
                            Valid for 1 year
                        </div>

                        {/* TOTAL TESTS */}
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[#FF6A3D]" />
                            Include: {series?.totalTests} Tests
                        </div>

                        {/* MEDIUM */}
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#FF6A3D]" />
                            Language: English
                        </div>

                    </div>

                </div>

                {/* FOOTER */}
                <div className="flex items-start">
                    <div style={{ borderRadius: "0px 0px 12px 15px" }} className="flex-1 f bg-[#FF6A3D] text-center text-white text-3xl font-bold px-4 py-2">
                        {series?.pricing?.isFree ? "Free" : `₹ ${series?.finalPrice}`}
                    </div>
                    <button style={{ borderRadius: "0px 0px 15px 0px" }} onClick={() => { series?.pricing?.isFree ? navigate(`/test-series/${series?.slug}`) : navigate(`/checkout/${series?.slug}`, { state: { testSeries: true } }) }} className="flex-1 bg-[#3B3B3B] text-white font-medium py-2 bg-gradient-to-b from-[#545454] via-[#ffffff]/30 to-[#545454] hover:bg-black transition">
                        {series?.pricing?.isFree ? "Start Test" : "Buy Test"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TestSeriesSkeleton = () => {

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 animate-pulse overflow-hidden">
            <div className="w-full h-40 bg-gray-200 dark:bg-gray-700"></div>
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

export default function TestSeriesPage() {
    const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState<"type" | "mode">("type");

    const [filters, setFilters] = useState({
        type: "",
        mode: "",
    });


    useEffect(() => {
        const fetchTestSeries = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get("/mcu/series", {
                    params: {
                        populate: "exam,category",
                        sort: "-createdAt",
                        limit: 100
                    }
                });
                setTestSeries(response.data.data || []);
            } catch (err: any) {
                console.error("Failed to fetch test series:", err);
                setError(err.response?.data?.message || "Failed to load test series");
            } finally {
                setLoading(false);
            }
        };

        fetchTestSeries();
    }, []);

    // Derived data
    const filteredTestSeries = useMemo(() => {
        return testSeries.filter(series => {
            const matchesSearch =
                series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (series.description && series.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                series.exam.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter =
                filter === "all" ||
                (filter === "free" && series.pricing.isFree) ||
                (filter === "paid" && !series.pricing.isFree);

            return matchesSearch && matchesFilter;
        });
    }, [testSeries, searchQuery, filter]);

    return (
        <div className="min-h-[85vh] ">
            <div className="max-w-7xl p-0 mx-auto sm:p-4 rounded-xl min-h-[87vh]">

                <div className="grid max-h-[170px] grid-cols-3 lg:grid-cols-[1.4fr_0.6fr] gap-1 rounded-3xl space-x-2 mb-4">
                    <div className="h-fit">
                        <LeftSlider />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div>  
                         {filteredTestSeries.map((course) => {
                        const realPrice = course?.pricing?.amount
                        const offerPrice = realPrice - (realPrice * course?.pricing?.discount) / 100
                        return (
                            <div className=''>
                                <div className='bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-black rounded-[28px] p-[2px] '>
                                    <div
                                        key={course.id}
                                        className="rounded-[28px]  bg-white overflow-hidden shadow-sm hover:shadow-xl duration-300 keen-slider__slide"
                                    >
                                        {/* Image */}

                                        <div className="rounded-2xl p-2.5 bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-white ">
                                            <div className=" rounded-2xl overflow-hidden h-50">
                                                <img
                                                    src={course?.thumbnail?.url && `${ImageBaseUrl}/${course?.thumbnail?.url}`}
                                                    alt=""
                                                    className=" w-full h-full  object-cover"
                                                />
                                            </div>
                                        </div>

                                        {/* Body */}

                                        <div className="px-6 py-2">
                                            <h3 className="text-[20px] md:text-xl font-bold">
                                                <span className="text-[#FF6736]">{course.title.split(" ")[0]}</span>{" "}
                                                {course.title.split(" ").slice(1).join(" ")}
                                            </h3>

                                            <div className="mt-4 space-y-2 text-gray-600">
                                                <div className="flex items-center gap-3 text-base">
                                                    <Radio size={20} className="text-[#FF6736]" />
                                                    <span className='text-sm'> {course?.mode}</span>
                                                </div>

                                                <div className="flex items-center gap-3 text-base">
                                                    <Calendar size={20} className="text-[#FF6736]" />
                                                    <span className='text-sm'>Starts on {new Date(course?.schedule?.startDate).toLocaleDateString("en-GB")}</span>
                                                </div>
                                            </div>

                                            {/* Price */}

                                            <div className="mt-3 flex justify-between items-end">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {course?.pricing?.currency}
                                                        <span className="text-base font-bold"></span>

                                                        <span className="text-base font-bold">
                                                            {offerPrice}
                                                        </span>

                                                        <span className="line-through text-gray-400 text-base">
                                                            {course?.pricing?.amount} {" "}
                                                            {course?.pricing?.currency}
                                                        </span>
                                                    </div>

                                                    <p className="text-[#16A34A] text-base font-semibold mt-2">
                                                        {course?.pricing?.discount}% off
                                                    </p>
                                                </div>

                                                <button className="border border-[#FF6736] rounded-2xl px-6 py-2 text-[#FF6736] text-base hover:bg-[#FF6736] hover:text-white transition ">
                                                    Explore
                                                </button>
                                            </div>
                                        </div>

                                        {/* Footer */}

                                        <div className="px-5 pb-5">
                                            <div className="rounded-full bg-[#FCE7D3] flex items-center p-2">
                                                <span className="bg-[#FF6D42] text-white rounded-full px-4 py-1 text-sm font-semibold">
                                                    Ooshas Prep
                                                </span>

                                                <span className="ml-3 text-gray-700 text-sm">
                                                    Limited Time Offer
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}</div>

                       <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className=""
>
  <div className="w-full rounded-2xl bg-[#FFF8E8] px-5 py-4">
    <div className="flex items-center gap-4">

      {/* Image */}
      <div className="flex-shrink-0">
        <img
          src="/images/iels/listening.png"
          alt="Support"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-[#FF6B3D] text-lg sm:text-base font-bold leading-none">
          Still have some queries?
        </h3>

        <p className="mt-2 text-sm sm:text-sm text-[#333333]">
          Give us a missed call at{" "}
          <a
            href="tel:0719-243-492"
            className="text-[#FF6B3D] font-semibold"
          >
            0719-243-492
          </a>
        </p>

        <p className="mt-1 text-sm sm:text-sm text-[#333333]">
          We'll get back to you within 24 hours.
        </p>
      </div>

    </div>
  </div>
</motion.div>
                    </div>
                 
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_0.6fr] gap-6 mb-4 ">
                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4"
                    >
                        <div className="flex lg:items-center lg:justify-between gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search for test series..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-2.5 border-2 border-[#FD7149]/70 focus:border-[#FD7149] rounded-2xl bg-white text-base text-gray-900 placeholder-gray-500 focus:outline-none "
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilters(true)}
                                    className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#FD7149]/70 hover:border-[#FD7149] bg-white text-sm font-medium hover:bg-gray-50"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </button>
                                <AnimatePresence>
                                    {showFilters && (
                                        <>
                                            {/* Popup */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute right-0 top-12 z-50 w-[300px] bg-white rounded-2xl shadow-xl border"
                                            >
                                                {/* Header */}
                                                <div className="flex items-center justify-between px-5 py-4 border-b">
                                                    <h3 className="text-base font-semibold">Filters</h3>
                                                    <button onClick={() => setShowFilters(false)}>
                                                        <X className="h-5 w-5 text-gray-500" />
                                                    </button>
                                                </div>

                                                {/* Body */}
                                                <div className="flex h-[240px]">
                                                    {/* Left Tabs */}
                                                    <div className="w-1/3 border-r bg-gray-50">
                                                        {["type", "mode"].map((tab) => (
                                                            <button
                                                                key={tab}
                                                                onClick={() => setActiveFilterTab(tab as any)}
                                                                className={`w-full px-4 py-3 text-left text-sm font-medium border-l-4 ${activeFilterTab === tab
                                                                    ? "border-[#FF7046] bg-white text-[#FF7046]"
                                                                    : "border-transparent text-gray-600"
                                                                    }`}
                                                            >
                                                                {tab === "type" ? "Type" : "Mode"}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Right Options */}
                                                    <div className="flex-1 px-5 py-4 space-y-4">
                                                        {activeFilterTab === "type" && (
                                                            <label className="flex items-center justify-between text-sm">
                                                                Test Pass
                                                                <input
                                                                    type="radio"
                                                                    name="type"
                                                                    checked={filters.type === "test_pass"}
                                                                    onChange={() =>
                                                                        setFilters((p) => ({ ...p, type: "test_pass" }))
                                                                    }
                                                                />
                                                            </label>
                                                        )}

                                                        {activeFilterTab === "mode" && (
                                                            <label className="flex items-center justify-between text-sm">
                                                                Test Series
                                                                <input
                                                                    type="radio"
                                                                    name="mode"
                                                                    checked={filters.mode === "test_series"}
                                                                    onChange={() =>
                                                                        setFilters((p) => ({ ...p, mode: "test_series" }))
                                                                    }
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t">
                                                    <button
                                                        onClick={() =>
                                                            setFilters({
                                                                type: "",
                                                                mode: "",
                                                            })
                                                        }
                                                        className="flex-1 py-2 rounded-lg border text-sm font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                    <button
                                                        onClick={() => setShowFilters(false)}
                                                        className="flex-1 py-2 rounded-lg bg-[#FF7046] text-white text-sm font-medium"
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

                </div>


                {/* Results */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {filteredTestSeries.length} {filteredTestSeries.length === 1 ? 'test series' : 'test series'} found
                            {searchQuery && ` for "${searchQuery}"`}
                        </p>
                        {filteredTestSeries.length > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <Sparkles className="h-4 w-4" />
                                <span>Sorted by: Newest First</span>
                            </div>
                        )}
                    </div> */}

                    {loading ? (
                        <div className={"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
                            {[...Array(viewMode === "grid" ? 8 : 4)].map((_, index) => (
                                <TestSeriesSkeleton key={index} />
                            ))}
                        </div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                                <BookOpen className="h-16 w-16 text-red-400 mx-auto mb-4" />
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
                    ) : filteredTestSeries.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="p-10 ">
                                <BookOpen className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {searchQuery || filter !== "all"
                                        ? "No test series match your criteria"
                                        : "Start Your Test Preparation"}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
                                    {searchQuery || filter !== "all"
                                        ? "Try adjusting your search or filter to find what you're looking for."
                                        : "Explore our test series and start preparing for your exams today."
                                    }
                                </p>
                                <Button
                                    onClick={() => navigate('/test-series')}
                                    size="lg"
                                    className="rounded-xl px-8 py-2.5 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                                >
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Browse Test Series
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className={"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"}>
                            <AnimatePresence>
                                {filteredTestSeries.map((series) => (

                                    <TestSeriesCard
                                        key={series._id}
                                        series={series}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                <div className="max-w-3xl bg-white rounded-3xl p-6 my-4">

                    {/* Heading */}
                    <h1 className="text-xl font-bold">
                        <span className="text-[#FF6A3D]">Ielts</span>{" "}
                        <span className="text-[#555]">
                            General Test Practice
                        </span>
                    </h1>

                    {/* Tabs */}
                    <div className="mt-8 border rounded-2xl overflow-hidden px-4">

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

                            <button className="py-2 text-base font-medium">
                                Description
                            </button>

                            <button className="p-2 bg-[#FF6A3D] text-base text-white font-semibold">
                                Test
                            </button>

                            <button className="py-2 text-base font-medium">
                                Study Material
                            </button>

                            <button className="py-2 text-base font-medium">
                                Announcements
                            </button>

                        </div>

                    </div>

                    <h2 className="mt-8 text-base font-semibold">
                        All Test
                    </h2>

                    <div className="space-y-3 mt-2">
                        <div className="w-full rounded-2xl border border-[#CFCFCF] bg-white overflow-hidden transition-all hover:shadow-sm">

                            {/* Badge */}
                            <div className="px-4 pt-3">
                                <span className="inline-flex items-center rounded-full bg-[#FF6A3D] px-3 py-1 text-sm font-semibold text-white">
                                    GRE Test 01
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 py-5">

                                {/* Left */}
                                <div className="flex-1">

                                    {/* Top Info */}
                                    <div className="flex flex-wrap items-center text-base gap-y-2">

                                        <div className="flex items-center">
                                            <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                            <span className="text-[#FF6A3D] font-semibold">75.</span>
                                            <span className="ml-1 text-[#555]">Questions</span>
                                        </div>

                                        <span className="mx-3 text-gray-400 hidden sm:block">|</span>

                                        <div>
                                            <span className="text-[#FF6A3D] font-semibold">300</span>
                                            <span className="ml-1 text-[#555]">Marks</span>
                                        </div>

                                        <span className="ml-2 text-[#FF6A3D] font-semibold">
                                            180
                                        </span>

                                        <span className="mx-3 text-gray-400 hidden sm:block">|</span>

                                        <div>
                                            <span className="text-[#555]">Mins Attempts:</span>
                                            <span className="text-[#FF6A3D] font-semibold ml-1">0</span>
                                        </div>

                                    </div>

                                    {/* Earn */}
                                    <p className="text-base font-medium text-[#555] mt-2">
                                        Earn upto 225
                                    </p>

                                    {/* Date */}
                                    <div className="flex items-center gap-2 mt-4 text-[#555] text-base">
                                        <CalendarDays className="w-4 h-4" />
                                        Held on Jan 07, 2026 at 09:00 AM
                                    </div>

                                    {/* Syllabus */}
                                    <button className="flex items-center gap-2 mt-4 text-[#FF6A3D] underline text-base font-medium">
                                        <BookOpen className="w-4 h-4" />
                                        View Syllabus
                                    </button>

                                </div>

                                {/* Right */}
                                <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:min-w-[120px]">

                                    <div className="w-16 h-16 rounded-full bg-[#FFE8A3] flex items-center justify-center">
                                        <Lock className="w-8 h-8 fill-black text-black" />
                                    </div>

                                    <p className="text-[28px] md:text-xl text-[#555] font-medium">
                                        Locked
                                    </p>

                                </div>

                            </div>

                        </div>
                    </div>

                </div>

           
            </div>
        </div>
    );
}