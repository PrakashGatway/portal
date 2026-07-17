'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, TrendingUp, ChevronRight, Target,
    FileText, PlayCircle, MoreHorizontal, ArrowUpRight,
    AlertCircle, ArrowUp, ArrowDown, Link as LinkIcon,
     Circle,
    ClipboardList,
    FileQuestion,
    Box
} from 'lucide-react';
import {
    XAxis,Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
    PieChart as RechartsPieChart, Pie, Legend
} from 'recharts';

// ==================== MOCK API SERVICE ====================
const mockApi = {
    getDashboardData: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    summary: {
                        testsAttempted: 24,
                        avgScore: 85,
                        dayStreak: 112,
                        allIndiaRank: 156,
                        targetScore: 330,
                        currentScore: 320,
                        improvement: 12,
                        accuracyTrend: 8,
                        timeEfficiency: 92
                    },
                    recentTests: [
                        {
                            id: 1,
                            name: 'GRE General Test 01',
                            type: 'Full Length Test',
                            score: '320/340',
                            percentile: 85,
                            quant: 165,
                            verbal: 155,
                            date: '2025-05-15',
                            accuracy: 82,
                            timeSpent: '3h 45m',
                            status: 'completed',
                            improvement: '+5'
                        },
                        {
                            id: 2,
                            name: 'GRE Quantitative Sectional',
                            type: 'Sectional Test',
                            score: '38/51',
                            percentile: 78,
                            quant: 38,
                            verbal: null,
                            date: '2025-05-12',
                            accuracy: 76,
                            timeSpent: '35m',
                            status: 'completed',
                            improvement: '+3'
                        },
                        {
                            id: 3,
                            name: 'GRE Verbal Sectional',
                            type: 'Sectional Test',
                            score: '41/51',
                            percentile: 88,
                            quant: null,
                            verbal: 41,
                            date: '2025-05-10',
                            accuracy: 84,
                            timeSpent: '38m',
                            status: 'completed',
                            improvement: '+7'
                        }
                    ],
                    upcomingTests: [
                        {
                            id: 1,
                            name: 'GRE Full Test 03',
                            type: 'Full Length Test',
                            date: '2025-05-20',
                            time: '09:00 AM',
                            duration: '3h 45m',
                            sections: 6
                        },
                        {
                            id: 2,
                            name: 'GRE Quant Sectional',
                            type: 'Sectional Test',
                            date: '2025-05-22',
                            time: '11:00 AM',
                            duration: '35m',
                            sections: 2
                        }
                    ],
                    performanceData: [
                        { date: 'May 12', score: 65, quant: 162, verbal: 153, accuracy: 72 },
                        { date: 'May 13', score: 72, quant: 164, verbal: 155, accuracy: 75 },
                        { date: 'May 14', score: 68, quant: 163, verbal: 154, accuracy: 73 },
                        { date: 'May 15', score: 80, quant: 165, verbal: 158, accuracy: 79 },
                        { date: 'May 16', score: 75, quant: 164, verbal: 156, accuracy: 77 },
                        { date: 'May 17', score: 85, quant: 166, verbal: 159, accuracy: 82 },
                        { date: 'May 18', score: 90, quant: 168, verbal: 162, accuracy: 86 }
                    ],
                    weakAreas: [
                        { topic: 'Text Completion', accuracy: 62, questions: 45, priority: 'High' },
                        { topic: 'Geometry', accuracy: 68, questions: 38, priority: 'High' },
                        { topic: 'Reading Comprehension', accuracy: 71, questions: 52, priority: 'Medium' },
                        { topic: 'Algebra', accuracy: 75, questions: 41, priority: 'Medium' }
                    ],
                    strengthsData: [
                        { name: 'Quantitative', value: 85, color: '#8b5cf6' },
                        { name: 'Verbal', value: 78, color: '#f97316' },
                        { name: 'Analytical', value: 82, color: '#10b981' }
                    ],
                    weeklyActivity: [
                        { day: 'Mon', hours: 2.5, tests: 2 },
                        { day: 'Tue', hours: 3, tests: 1 },
                        { day: 'Wed', hours: 1.5, tests: 2 },
                        { day: 'Thu', hours: 4, tests: 3 },
                        { day: 'Fri', hours: 2, tests: 1 },
                        { day: 'Sat', hours: 5, tests: 2 },
                        { day: 'Sun', hours: 3.5, tests: 2 }
                    ],
                    topicDistribution: [
                        { name: 'Quantitative', value: 45, color: '#8b5cf6' },
                        { name: 'Verbal', value: 35, color: '#f97316' },
                        { name: 'AWA', value: 20, color: '#10b981' }
                    ]
                });
            }, 1200);
        });
    }
};

// ==================== SKELETON ====================
export const SkeletonCard = ({ className = '' }) => (
    <div className={`animate-pulse bg-white dark:bg-gray-800 rounded-2xl ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="min-h-screen">
        <div className="p-8 space-y-6">
            <div className="flex justify-between"><SkeletonCard className="w-40 h-10" /><SkeletonCard className="w-60 h-10" /></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SkeletonCard className="h-64 lg:col-span-1" />
                <SkeletonCard className="h-64 lg:col-span-1" />
                <SkeletonCard className="h-64 lg:col-span-1" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SkeletonCard className="h-40 lg:col-span-2" />
                <SkeletonCard className="h-40" />
            </div>
        </div>
    </div>
);

const GradientStatsCard = ({ title, value, subValues, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl bg-gradient-to-br from-[#ff7e5f] to-[#feb47b]"
    >
        <div className="absolute top-4 right-4">
            <MoreHorizontal className="w-5 h-5 opacity-50" />
        </div>
        <p className="text-sm font-medium opacity-80 mb-2">{title}</p>
        <h2 className="text-4xl font-bold mb-4 tracking-tight">{value}</h2>

        {/* Decorative Graph Lines */}
        <div className="h-16 w-full mb-6 relative">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <path d="M0,30 Q20,20 40,25 T80,15 T100,20" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                <path d="M0,35 Q30,10 60,30 T100,10" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                <path d="M0,20 Q40,35 80,10 T100,30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </svg>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center border-t border-white/20 pt-4">
            {subValues.map((sub, idx) => (
                <div key={idx}>
                    <p className="text-[10px] opacity-70 mb-1">{sub.label}</p>
                    <p className="text-lg font-bold">{sub.value}</p>
                </div>
            ))}
        </div>
    </motion.div>
);

// Circular Donut Card (Exact Pink/Yellow colors)
const CircularStatCard = ({ title, value, data, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative"
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <h2 className="text-3xl font-bold text-gray-900 mt-1">{value}</h2>
            </div>
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex items-center justify-between mt-4">
            <div className="relative w-28 h-28">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            stroke="none"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-xl">🎯</div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <div>
                            <p className="text-xs text-gray-500">{item.name}</p>
                            <p className="text-sm font-bold text-gray-800">{item.value}%</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);


// Post Stats Chart (Pink highlighted bar chart)
const ActivityChartCard = ({ data }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 col-span-1 lg:col-span-2"
    >
        <div className="flex justify-between items-center mb-6">
            <p className="text-lg font-bold text-gray-900">Weekly Progress</p>
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </div>

        <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="hours" radius={[10, 10, 0, 0]} barSize={12}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 4 ? '#f43f5e' : '#e5e7eb'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            {/* Overlay Line (Simulated) */}
            <div className="relative -mt-32 h-32 w-full pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path d="M0,30 Q20,20 40,25 T80,15 T100,20" fill="none" stroke="#f43f5e" strokeWidth="2" />
                </svg>
            </div>
        </div>
    </motion.div>
);

// Post Activity List (Table style)
const TestActivityList = ({ tests }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-3"
    >
        <div className="flex gap-6 mb-6 border-b border-gray-100 pb-4">
            <h3 className="font-bold text-gray-900 border-b-2 border-gray-900 pb-2">Test Activity</h3>
            <h3 className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">Study Plan</h3>
        </div>

        <div className="space-y-4">
            {tests.map((item, idx) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (idx * 0.05) }}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">
                            {item.type.includes('Full') ? '📝' : '📖'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                <LinkIcon className="w-3 h-3 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400">Test {idx + 1}</p>
                        </div>
                    </div>

                    <div className="hidden sm:block text-sm text-gray-500">
                        {item.type}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-[10px] text-white">
                                <Circle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-800">{item.score}</span>
                        </div>

                        <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${parseInt(item.improvement) > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                            }`}>
                            {parseInt(item.improvement) > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(parseInt(item.improvement))}%
                        </div>

                        <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </motion.div>
            ))}
        </div>
    </motion.div>
);

// Right Bottom Card (Blue background from image)
const BottomRightCard = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
    >
        <div className="flex items-start justify-between mb-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-800" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">874</p>
            </div>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-900">Tests Completed</p>
            <p className="text-xs text-gray-400">Last 30 Days</p>
        </div>
    </motion.div>
);

const QuickActions = () => {
    const items = [
        { icon: ClipboardList, label: 'Full Test Series', desc: 'Attempt full length tests', color: 'bg-blue-50', iconColor: 'text-blue-600' },
        { icon: FileQuestion, label: 'Sectional Tests', desc: 'Practice by sections', color: 'bg-purple-50', iconColor: 'text-purple-600' },
        { icon: Target, label: 'Topic Tests', desc: 'Practice specific topics', color: 'bg-green-50', iconColor: 'text-green-600' },
        { icon: Box, label: 'Previous Papers', desc: 'Solve past papers', color: 'bg-orange-50', iconColor: 'text-orange-600' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 gap-2"
        >
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-3xl p-6 py-4 shadow-sm border border-gray-100 relative cursor-pointer hover:shadow-lg transition-shadow">
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{item.label}</h4>
                        {/* <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p> */}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
            ))}
        </motion.div>
    );
};

const HeaderBanner = ({ data }) => (
    <motion.div
        style={{ background: "url(/bg.webp)", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
        className="relative rounded-3xl overflow-hidden flex flex-col lg:flex-row mb-8 px-4"
    >
        <div className="relative w-full lg:w-[46%] p-8 text-white flex flex-col justify-between z-10 ">
            {/* <div className="absolute right-0 top-0 h-full w-32 bg-white/5 skew-x-12" /> */}
            <div>
                <h1 className="text-3xl lg:text-4xl font-medium mb-2">Your Success Starts Here</h1>
                <p className="text-white/80 text-base mb-6">Practice. Analyze. Improve. Succeed. lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <button className=" text-white border border-white px-4 py-2 rounded-lg font-bold hover:shadow-lg transition-shadow flex items-center gap-2">
                    Start a Test <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Dark Blue Side */}
        <div className="relative flex-1 p-8 flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <h3 className="text-white text-lg font-semibold">Your Preparation Summary</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1 */}
                <div className="bg-[#273142] rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-1">

                    <span className="text-2xl font-bold text-white">{data.summary.testsAttempted}</span>
                    <span className="text-[10px] text-gray-400">Tests Attempted</span>
                </div>
                {/* Stat 2 */}
                <div className="bg-[#273142] rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-1">

                    <span className="text-2xl font-bold text-white">{data.summary.avgScore}%</span>
                    <span className="text-[10px] text-gray-400">Avg. Score</span>
                </div>
                {/* Stat 3 */}
                <div className="bg-[#273142] rounded-xl p-4 text-center flex flex-col items-center justify-center space-y-1">

                    <span className="text-2xl font-bold text-white">{data.summary.dayStreak}</span>
                    <span className="text-[10px] text-gray-400">Day Streak</span>
                </div>

            </div>
        </div>
    </motion.div>
);



// ==================== MAIN DASHBOARD COMPONENT ====================
const GREDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await mockApi.getDashboardData();
                setData(response);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (!data) {
        return (
            <div className="min-h-screen max-w-7xl mx-auto flex items-center justify-center pl-20">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center p-8 rounded-2xl shadow-xl"
                >
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
                    <p className="text-gray-500 mb-6">Please try again later</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-[#1e293b] text-white rounded-xl font-bold"
                    >
                        Retry
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (

        <div className="p-3 max-w-7xl mx-auto mx-auto">
            <HeaderBanner data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* 1. Pink/Orange Gradient Card */}
                        <GradientStatsCard
                            title="Total Score"
                            value="320 / 340"
                            subValues={[
                                { label: 'Quant', value: '168' },
                                { label: 'Verbal', value: '152' },
                                { label: 'AWA', value: '5.0' }
                            ]}
                            delay={0.1}
                        />

                        {/* 2. Donut Chart Card */}
                        <CircularStatCard
                            title="Weak Areas"
                            value="4 Topics"
                            data={[
                                { name: 'Text Completion', value: 30, color: '#fb7185' }, // Pink
                                { name: 'Geometry', value: 50, color: '#1e293b' }, // Dark Slate
                                { name: 'Algebra', value: 20, color: '#fcd34d' } // Yellow
                            ]}
                            delay={0.1}
                        />

                    </div>
                    <TestActivityList tests={data.recentTests} />
                </div>


                {/* 3. Right Stack (Progress Card + Completed Card) */}
                <div className="flex flex-col gap-4">
                    <QuickActions />
                    <BottomRightCard />
                </div>
            </div>

            {/* BOTTOM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Activity List (Spans 2 cols) */}

                {/* Right: Bar Chart (Spans 1 col) */}
                <ActivityChartCard data={data.weeklyActivity} />

                {/* Bottom Left: Streak Card (Spans 1 col) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4"
                >
                    <div className="w-14 h-14 rounded-2xl bg-[#ffe4e6] flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-gray-800" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xl font-bold text-gray-900">{data.summary.dayStreak}</p>
                            <p className="text-sm font-medium text-gray-800">Day Streak</p>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '80%' }}
                                transition={{ duration: 1, delay: 0.7 }}
                                className="h-full bg-[#1e293b] rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
            <div className="relative overflow-hidden py-10">
                <p
                    className="text-[100px]
      font-black 
      leading-none
      text-transparent
      opacity-70
      pointer-events-none
      select-none
      whitespace-nowrap
    "
                    style={{
                        WebkitTextStroke: "1px #00000047",
                        textShadow:
                            "0 0 2px rgba(255, 255, 255, 0), 0 0 10px rgb(255, 255, 255)",
                    }}
                >
                    Ooshas <br /> prep
                </p>

                <div className="relative z-10">
                    {/* Your Content */}
                </div>
            </div>
        </div>
    );
};

export default GREDashboard;