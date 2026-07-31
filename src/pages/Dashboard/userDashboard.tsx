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
    Box,
    CalendarDays,
    Clock3,
    BookOpen,
    Bookmark,
    Play,
    CircleHelp,
    Radio,
    Calendar,
    Filter,
    Search
} from 'lucide-react';
import {
    XAxis, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
    PieChart as RechartsPieChart, Pie, Legend
} from 'recharts';
import api, { ImageBaseUrl } from '../../axiosInstance';
import { useAuth } from '../../context/UserContext';

const quickAccess = [
    {
        title: "Mock TEST",
        count: "12 Tests",
        icon: ClipboardList,
    },
    {
        title: "Practice Test",
        count: "156 Questions",
        icon: Target,
    },
    {
        title: "Quiz",
        count: "24 Quiz",
        icon: CircleHelp,
    },
    {
        title: "Study Material",
        count: "58 PDFs",
        icon: BookOpen,
    },
]

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
const TestActivityList = ({ tests }) =>
(
    <>

    </>
)

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
    <section className="w-full py-6 px-1">
        <div className="relative  rounded-3xl bg-[#FF764B] min-h-[220px] md:min-h-[280px] lg:min-h-[250px] px-6 sm:px-10 lg:px-8 flex flex-col md:flex-row items-center justify-between">

            {/* Left Content */}
            <div className="relative z-10 w-full md:w-full text-center md:text-left py-8 md:py-0">
                <h3 className="text-white text-2xl sm:text-3xl md:text-4xl font-medium">
                    Hi Rohan!
                </h3>

                <h1 className="mt-2 text-white font-black uppercase leading-none text-[42px] sm:text-[60px] md:text-[72px] lg:text-[86px]">
                    IELTS EXAM
                </h1>

                <p className="mt-4 text-white text-base sm:text-lg md:text-xl font-medium">
                    Expert Guidance. Smart Practice. Top Results.
                </p>
            </div>

            {/* Right Illustration */}
            <div className="relative w-full md:w-2/5 flex justify-center items-end mt-6 md:-mt-16">

                {/* Paper */}
                <img
                    src={"/images/banner-dashboard.webp"}
                    alt=""
                    className=" w-[170px] sm:w-[220px] md:w-[170px]"
                />


            </div>
        </div>
    </section>
);


import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";
import { toast } from 'react-toastify';

// ==================== MAIN DASHBOARD COMPONENT ====================
const GREDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
      const { user } = useAuth() as any

      const [courses,setcourses] = useState([])
      const [allCourses,setallCourses] = useState([])
    

    const progress = 82;

       useEffect(()=>{
        const FetchCourses = async()=>{
            try{
                const res = await api.get(`courses?category=${user.category?._id}`)
                const res2  = await api.get("/courses") 
                setcourses(res?.data?.data)
                setallCourses(res2?.data?.data)
            }
            catch{
                toast.error("something went wrong...")
            }
        }
        FetchCourses()
    },[])

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


    const [sliderRef] = useKeenSlider(
  {
    loop: true,
    slides: {
      perView: 3,
      spacing: 10,
    },
    breakpoints: {
      "(max-width:1023px)": { 
        slides: { 
          perView: 2,
          spacing: 16,
        },
      },
      "(max-width:640px)": {
        slides: {
          perView: 1,
          spacing: 12,
        },
      },
    },
  },
  [
    (slider) => {
      let timeout;

      const clearNextTimeout = () => clearTimeout(timeout);

      const nextTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
         if(courses.length>0){
             slider.next();
         }
        }, 3000);
      };

      slider.on("created", nextTimeout);
      slider.on("dragStarted", clearNextTimeout);
      slider.on("animationEnded", nextTimeout);
      slider.on("updated", nextTimeout);
    },
  ]
);


 const [sliderRef2] = useKeenSlider(
  {
    loop: true,
    slides: {
      perView: 4,
      spacing: 20,
    },
    breakpoints: {
      "(max-width:1023px)": { 
        slides: { 
          perView: 2,
          spacing: 16,
        },
      },
      "(max-width:640px)": {
        slides: {
          perView: 1,
          spacing: 12,
        },
      },
    },
  },
  [
    (slider) => {
      let timeout;

      const clearNextTimeout = () => clearTimeout(timeout);

      const nextTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
       
             slider.next();
         
        }, 2000);
      };

      slider.on("created", nextTimeout);
      slider.on("dragStarted", clearNextTimeout);
      slider.on("animationEnded", nextTimeout);
      slider.on("updated", nextTimeout);
    },
  ]
);

useEffect(() => {
  instanceRef.current?.update();
}, [courses.length]);

 
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

        <div className=" mx-auto max-w-7xl">
            <div className='grid grid-cols-[1.5fr_0.5fr] gap-6'>
                <HeaderBanner data={data} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_0.5fr] gap-6 mb-2 ">
                <div className="flex flex-col gap-4 lg:col-span-2 ">
                    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_0.5fr] gap-4">

                        {/* 1. Pink/Orange Gradient Card */}
                        <section className="w-full bg-[#f7f7f7] py-0 ">

                            <div className="max-w-7xl mx-auto px-2 ">


                                <div className="relative bg-white rounded-3xl shadow-lg p-6 lg:p-4">



                                    <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-4 ">

                                        {/* Left Image */}
                                        <div className="flex flex-col gap-4 py-4 px-2">
                                            <div><h2 className="text-2xl font-bold text-[#202020]">
                                                My Courses
                                            </h2></div>

                                            <div className='rounded-xl overflow-hidden'> <img
                                                src="/images/course-thumbnail.webp"
                                                alt=""
                                                className="w-full h-[230px] lg:h-full  object-contain"
                                            /></div>
                                        </div>


                                        <div className='flex flex-col gap-4'>
                                            {/* Center */}
                                            <div className="xl:col-span-3">
                                                <div className='flex'>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            IELTS Intensive Batch
                                                        </h3>

                                                        <p className="text-gray-500  text-sm ">
                                                            Master the skills required for university admissions and
                                                            professional registration abroad.
                                                        </p>
                                                    </div>
                                                    <div className="bg-[#FFF3EC] w-1/2 mx-auto rounded-2xl p-2 mb-5">
                                                        <div className='flex gap-3 justify-center items-center'>
                                                            <Target className='text-[#FF5A14] ' />
                                                            <div>
                                                                <p className="text-xs text-center font-semibold uppercase text-gray-500">
                                                                    Target Band
                                                                </p>

                                                                <h2 className="text-sm font-bold text-[#FF5A14]  text-left">
                                                                    7+
                                                                </h2>

                                                            </div>


                                                        </div>



                                                    </div>

                                                </div>


                                            </div>

                                            {/* Right */}

                                            <div className="flex gap-6">


                                                <div className="flex flex-col lg:flex-col items-center gap-2 mt-4">

                                                    {/* Progress */}

                                                    <div className="relative w-30 h-30">

                                                        <svg
                                                            className="w-full h-full -rotate-90"
                                                            viewBox="0 0 120 120"
                                                        >
                                                            <circle
                                                                cx="60"
                                                                cy="60"
                                                                r="50"
                                                                fill="none"
                                                                stroke="#F2F2F2"
                                                                strokeWidth="10"
                                                            />

                                                            <circle
                                                                cx="60"
                                                                cy="60"
                                                                r="50"
                                                                fill="none"
                                                                stroke="#FF5A14"
                                                                strokeWidth="10"
                                                                strokeLinecap="round"
                                                                strokeDasharray={314}
                                                                strokeDashoffset={314 - (314 * progress) / 100}
                                                            />
                                                        </svg>

                                                        <div className="absolute inset-0 flex flex-col justify-center items-center">
                                                            <h2 className="text-base font-bold">{progress}%</h2>
                                                            <span className="text-xs text-gray-500 font-semibold mt-1">
                                                                COMPLETE
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Buttons */}

                                                    <div className="flex items-center  gap-2 w-full">

                                                        <button className="bg-[#FF5A14] hover:bg-[#f04d08] text-xs text-white rounded-xl py-3 px-4 flex gap-2 items-center justify-center  font-semibold transition">
                                                            <Play size={18} fill="white" />
                                                            CONTINUE LEARNING
                                                        </button>



                                                    </div>
                                                </div>


                                                {/* Stats */}

                                                <div className="space-y-2 border-l border-gray-100 pl-4">

                                                    <div className="flex gap-4 items-start">

                                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                                            <BookOpen size={22} />
                                                        </div>

                                                        <div>
                                                            <p className="text-gray-500 text-base">
                                                                Lessons Completed
                                                            </p>

                                                            <h3 className="font-bold text-sm">
                                                                48 / 60
                                                                <span className="font-normal text-base text-gray-500">
                                                                    {" "}
                                                                    Lessons
                                                                </span>
                                                            </h3>
                                                        </div>

                                                    </div>

                                                    <hr />

                                                    <div className="flex gap-4 items-start">

                                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                                            <Clock3 size={22} />
                                                        </div>

                                                        <div>
                                                            <p className="text-gray-500 text-base">
                                                                Last Activity
                                                            </p>

                                                            <h3 className="font-bold text-sm">
                                                                Today
                                                            </h3>
                                                        </div>

                                                    </div>

                                                    <hr />

                                                    <div className="flex gap-4 items-start">

                                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                                            <CalendarDays
                                                                size={22}

                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="text-gray-500 text-base">
                                                                Batch Validity
                                                            </p>

                                                            <h3 className="font-bold text-sm text-[#FF5A14]">
                                                                120
                                                                <span className="text-gray-500 text-base font-normal">
                                                                    {" "}
                                                                    Days Left
                                                                </span>
                                                            </h3>
                                                        </div>

                                                    </div>

                                                </div>

                                            </div>
                                        </div>


                                    </div>

                                    {/* Right Arrow */}

                                    <button className="hidden xl:flex absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border items-center justify-center hover:bg-orange-50">
                                        <ChevronRight className="text-[#FF5A14]" />
                                    </button>

                                    {/* Dots */}

                                    <div className="flex justify-center gap-2 mt-3">
                                        <span className="w-2 h-2 rounded-full bg-[#FF5A14]" />
                                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                                    </div>

                                </div>
                            </div>
                        </section>

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


                    <section className="w-full  py-6 md:py-1">
                        <div className="max-w-7xl mx-auto px-2">

                            <div className="bg-white rounded-[28px] shadow-sm border border-[#F5F5F5] p-5 md:p-8 lg:p-4">

                                {/* Heading */}

                                <h2 className="text-[28px] md:text-[36px] lg:text-2xl font-bold text-[#181818] mb-4">
                                    Quick Access
                                </h2>

                                {/* Cards */}

                                <div className="grid grid-cols-2 lg:grid-cols-4 ">

                                    {quickAccess.map((item, index) => {
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={index}
                                                className="group flex flex-col items-center text-center"
                                            >
                                                {/* Icon */}

                                                <div className="relative bg-white">

                                                    {/* Glow */}

                                                    <div className="absolute inset-0 bg-[#FFEFE7] rounded-full blur-xl scale-110 opacity-70" />

                                                    {/* Circle */}

                                                    <div className="relative flex items-center justify-center
                      w-24 h-24
                      sm:w-28 sm:h-28
                      md:w-22 md:h-22
                      rounded-full
                      bg-white
                      shadow-lg
                      border
                      p-1
                      border-[#F4F4F4]
                    ">


                                                        <div className='bg-orange-100 w-full h-full rounded-full flex justify-center items-center'>
                                                            <div>
                                                                <Icon
                                                                    className="text-[#FF5B1F]"
                                                                    strokeWidth={1.8}
                                                                    size={30}
                                                                />
                                                            </div>
                                                        </div>


                                                    </div>
                                                </div>

                                                {/* Count */}

                                                <p className="mt-5 text-[#FF5B1F] text-sm sm:text-base md:text-base font-medium">
                                                    {item.count}
                                                </p>

                                                {/* Title */}

                                                <h3 className="mt-1 text-lg sm:text-2xl md:text-xl font-bold text-[#171717] leading-tight">
                                                    {item.title}
                                                </h3>
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        </div>
                    </section>

                    <div className="bg-white rounded-3xl p-5 md:px-6">
                        {/* Heading */}

                        <h2 className="text-2xl md:text-2xl font-bold text-[#151515]">
                            Browse IELTS Courses
                        </h2>

                        {/* Search */}

                        <div className="mt-7 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search
                                    className="absolute left-5 top-6 -translate-y-1/2 text-gray-500"
                                    size={20}
                                />

                                <input
                                    type="text"
                                    placeholder="Search for test series..."
                                    className="w-full h-12 rounded-2xl border border-[#FF8356] bg-white pl-14 pr-4 outline-none text-base"
                                />
                            </div>

                            <button className="h-12 px-4 rounded-2xl border border-[#FF8356] flex items-center justify-center gap-3 bg-white hover:bg-orange-50 transition">
                                <Filter size={22} />
                                <span className="text-base font-medium">Filters</span>
                            </button>
                        </div>

                        {/* Cards */}

                     
                          <div ref={sliderRef}  className="keen-slider  mt-10  ">
                            {courses.map((course) => {
                                const realPrice = course?.pricing?.amount
                                const offerPrice = realPrice - (realPrice*course?.pricing?.discount)/100
                                return(
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
                            )})}
                        </div>
                     
                    </div>
                </div>


               
            </div>

            {/* BOTTOM GRID */}
             <section className="w-full rounded-3xl bg-white p-4 sm:p-6 lg:p-7">
      {/* Heading */}
      <h2 className="mb-6 text-xl md:text-2xl font-bold text-[#222]">
        Explore Other Test Preps
      </h2>

      {/* Cards */}
      <div ref={sliderRef2} className="keen-slider">
        {allCourses.map((item) => {
             const realPrice = item?.pricing?.amount
                                const offerPrice = realPrice - (realPrice*item?.pricing?.discount)/100
                                return (
        <div className='bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-black p-[2px] rounded-[22px] keen-slider__slide'>
              <div
            key={item.id}
            className="overflow-hidden rounded-[22px] border border-[#d8d8d8] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Banner */}
          <div className='p-[6px] rounded-2xl bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-white'>
              <div className="relative  overflow-hidden">
              <img
                src={item?.thumbnail?.url && `${ImageBaseUrl}/${item?.thumbnail?.url}`}
                alt={item.title}
                className="h-35 w-full rounded-2xl object-cover"
              />
            </div>
          </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-xl font-bold leading-none">
                <span className="text-orange-500">{item.title.split(" ")[0]}</span>{" "}
                <span className="text-black text-base font-semibold">
                  {item.title.split(" ").slice(1).join(" ")}
                </span>
              </h3>

              {/* Price */}
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <span className="text-base font-bold text-[#222]">
                  ₹ {offerPrice}
                </span>

                <span className="text-base text-gray-400 line-through">
                  ₹{item.pricing?.amount}
                </span>

                <span className="text-base font-semibold text-green-600">
                  {item?.pricing?.discount}%
                </span>
              </div>

              {/* Button */}
            <div className='mx-auto w-1/2'>
                  <button className="mt-5 py-2 w-full text-base   rounded-xl border border-[#ff5b2e] text-[#ff5b2e] font-medium transition-all duration-300 hover:bg-[#ff5b2e] hover:text-white">
                Explore
              </button>
            </div>
            </div>
          </div>
        </div>
        )})}
      </div>
    </section>
         
        </div>
    );
};

export default GREDashboard;