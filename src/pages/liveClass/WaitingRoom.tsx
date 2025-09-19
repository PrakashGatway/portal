import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import moment from 'moment';
import NotFound from '../OtherPage/NotFound';

const WaitingRoom = ({setWaitingRoom, classId, contentDetails }: any) => {
    const navigate = useNavigate();
    const [classInfo, setClassInfo] = useState(null);
    const [courseInfo, setCourseInfo] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isClassForToday, setIsClassForToday] = useState(false); // New state

    if(!contentDetails){
        return <NotFound/>
    }

    useEffect(() => {
        let timerInterval: any;

        const fetchDataAndSetupTimer = async () => {
            if (!classId) {
                setError("Class ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const liveClassData = contentDetails;
                setClassInfo(liveClassData);
                setCourseInfo(liveClassData.courseInfo);

                const calculateTimeLeft = () => {
                    if (!liveClassData.scheduledStart) {
                        setError("Class start time is not set.");
                        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
                    }

                    const now = new Date();
                    const startTime = new Date(liveClassData.scheduledStart);
                    const difference = startTime - now;

                    const isToday = moment(startTime).isSame(moment(), 'day');
                    setIsClassForToday(isToday);

                    if (difference <= 0) {
                        setWaitingRoom(false)
                        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
                    }

                    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                    return { days, hours, minutes, seconds };
                };

                const initialTimeLeft = calculateTimeLeft();
                setTimeLeft(initialTimeLeft);

                timerInterval = setInterval(() => {
                    const newTimeLeft = calculateTimeLeft();
                    setTimeLeft(newTimeLeft);

                    if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
                        clearInterval(timerInterval);
                        toast.success("Class is starting now!");
                        setWaitingRoom(false)
                    }
                }, 1000);

            } catch (err) {
                console.error("Failed to fetch class or course details:", err);
                setError("Failed to load class information. Please try again later.");
                toast.error("Failed to load class information.");
            } finally {
                setLoading(false);
            }
        };

        fetchDataAndSetupTimer();

        return () => {
            if (timerInterval) clearInterval(timerInterval);
        };
    }, [classId, navigate, classInfo?._id]); // Added classInfo?._id to deps

    const formatTimeUnit = (unit) => {
        return unit.toString().padStart(2, '0');
    };

    // Function to get a descriptive date string
    const getClassDateString = () => {
        if (!classInfo?.scheduledStart) return "N/A";
        const startTime = new Date(classInfo.scheduledStart);
        return moment(startTime).format("MMM D, YYYY [at] h:mm A");
    };

    if (loading) {
        return (
            <div className="min-h-[84vh] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading class details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[84vh] dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
                    <div className="text-red-500 dark:text-red-400 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Error</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()} // Reload the component/page
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!classInfo) {
        return (
            <div className="min-h-[84vh] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
                <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Class Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400">The requested live class could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[84vh] dark:from-gray-800 dark:to-gray-900">
            <div className="max-w-8xl mx-auto h-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-[calc(100vh-100px)] flex flex-col">

                    <div className="p-4 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-700 dark:to-blue-700 text-white">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl md:text-2xl font-bold capitalize">{classInfo.title || "Live Class"}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm sm:text-sm">
                                    <span className="bg-white/20 px-3 py-1 rounded-full">
                                        Scheduled: {getClassDateString()}
                                    </span>
                                    {courseInfo && (
                                        <>
                                            <span className="bg-white/20 px-3 py-1 rounded-full">
                                                {courseInfo.title}
                                            </span>
                                            {/* <span className="bg-white/20 px-3 py-1 rounded-full">
                                                {courseInfo.code}
                                            </span> */}
                                            <span className="bg-white/20 px-3 py-1 rounded-full">
                                                {courseInfo.categoryInfo?.name || "N/A"}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                        {/* Left Panel - Class Details */}
                        <div className="w-full md:w-1/2 p-5 sm:p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Live Class Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">Scheduled Start</p>
                                            <p className="font-medium text-gray-800 dark:text-white">
                                                {getClassDateString()}
                                            </p>
                                            {/* Show "Today" indicator if applicable */}
                                            {isClassForToday && (
                                                <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    Today
                                                </span>
                                            )}
                                        </div>
                                        {/* Add End Time if available */}
                                        {classInfo.scheduledEnd && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Scheduled End</p>
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {moment(classInfo.scheduledEnd).format("MMM D, YYYY [at] h:mm A")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {courseInfo && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Course Description</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            {courseInfo.description || "No description available for this course."}
                                        </p>
                                    </div>
                                )}

                                {courseInfo?.schedule && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Course Schedule</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Course Start Date</p>
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {courseInfo.schedule.startDate
                                                        ? moment(courseInfo.schedule.startDate).format("MMM D, YYYY")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Enrollment Deadline</p>
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {courseInfo.schedule.enrollmentDeadline
                                                        ? moment(courseInfo.schedule.enrollmentDeadline).format("MMM D, YYYY")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {courseInfo?.instructorNames && courseInfo?.instructorNames.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Instructors</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {courseInfo.instructorNames.map((instructor, index) => (
                                                <span
                                                    key={instructor._id || index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                >
                                                    {instructor.name || instructor.email || "Unknown Instructor"}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {courseInfo?.pricing && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Course Pricing</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">Price</p>
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {courseInfo.pricing.currency} {courseInfo.pricing.amount || "N/A"}
                                                    {courseInfo.pricing.discount && (
                                                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded dark:bg-red-900 dark:text-red-200">
                                                            {courseInfo.pricing.discount}% off
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            {courseInfo.pricing.earlyBird && (
                                                <>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">Early Bird Discount</p>
                                                        <p className="font-medium text-gray-800 dark:text-white">
                                                            {courseInfo.pricing.earlyBird.discount
                                                                ? `${courseInfo.pricing.earlyBird.discount}%`
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">Early Bird Deadline</p>
                                                        <p className="font-medium text-gray-800 dark:text-white">
                                                            {courseInfo.pricing.earlyBird.deadline
                                                                ? moment(courseInfo.pricing.earlyBird.deadline).format("MMM D, YYYY")
                                                                : "N/A"}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {courseInfo?.tags && courseInfo.tags.length > 0 && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Course Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {courseInfo.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel - Countdown and Tips */}
                        <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col bg-gray-50 dark:bg-gray-700/30">

                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
                                    {isClassForToday ? "Class Starts In" : "Class Starts On"}
                                </h3>
                                <div className="text-center mb-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {isClassForToday
                                            ? "Get ready, the class is scheduled for later today."
                                            : `The class is scheduled for ${moment(classInfo.scheduledStart).format("MMM D, YYYY")}.`}
                                    </p>
                                </div>
                                <div className="flex justify-center space-x-2 sm:space-x-3">
                                    {/* Conditionally render Days */}
                                    {timeLeft.days > 0 && (
                                        <>
                                            <div className="flex flex-col items-center">
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-col items-center justify-center shadow">
                                                    <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{formatTimeUnit(timeLeft.days)}</span>
                                                </div>
                                                <span className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Days</span>
                                            </div>
                                            <div className="flex flex-col h-12 items-center justify-center pt-4">
                                                <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-col items-center justify-center shadow">
                                            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{formatTimeUnit(timeLeft.hours)}</span>
                                        </div>
                                        <span className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Hours</span>
                                    </div>

                                    <div className="flex flex-col h-12 items-center justify-center pt-4">
                                        <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-col items-center justify-center shadow">
                                            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{formatTimeUnit(timeLeft.minutes)}</span>
                                        </div>
                                        <span className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Minutes</span>
                                    </div>

                                    <div className="flex flex-col h-12 items-center justify-center pt-4">
                                        <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex flex-col items-center justify-center shadow">
                                            <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{formatTimeUnit(timeLeft.seconds)}</span>
                                        </div>
                                        <span className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Seconds</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Section */}
                            <div className="flex-1 bg-white dark:bg-gray-700/50 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-600">
                                <h4 className="text-base font-semibold mb-3 flex items-center text-gray-800 dark:text-gray-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    While You Wait
                                </h4>
                                <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                    <li className="flex items-start">
                                        <span className="text-cyan-500 mr-2 mt-1 flex-shrink-0">•</span>
                                        <span>Ensure your microphone and camera are working properly.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-500 mr-2 mt-1 flex-shrink-0">•</span>
                                        <span>Find a quiet space to minimize distractions.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-500 mr-2 mt-1 flex-shrink-0">•</span>
                                        <span>Have your notes or materials ready.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-500 mr-2 mt-1 flex-shrink-0">•</span>
                                        <span>Prepare any questions you might have for the session.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
                                You will be automatically redirected when the class begins.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;