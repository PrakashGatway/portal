import { useState } from 'react';
import { Star, Clock, Users, TrendingUp, Calendar, MapPin, BookOpen } from 'lucide-react';
import { ImageBaseUrl } from '../../axiosInstance';
import { useNavigate } from 'react-router';

const CourseCard = ({ course, primaryColor = "#daff02", secondaryColor = "#fe572a" }) => {
    const [imageError, setImageError] = useState(false);
    const navigate = useNavigate();

    const formatPrice = (amount, currency = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysRemaining = (date) => {
        const today = new Date();
        const targetDate = new Date(date);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const discountPercent =
        course.pricing.earlyBird?.discount > 0 &&
            new Date() < new Date(course.pricing.earlyBird.deadline)
            ? course.pricing.earlyBird.discount
            : course.pricing.discount > 0
                ? course.pricing.discount
                : 0;

    const isEarlyBirdActive = course.pricing.earlyBird?.discount > 0 &&
        new Date() < new Date(course.pricing.earlyBird.deadline);

    const originalPrice = course.pricing.originalAmount || course.pricing.amount;
    const finalPrice = discountPercent > 0
        ? originalPrice * (1 - discountPercent / 100)
        : originalPrice;

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
            style={{
                border: `2px solid ${primaryColor}`,
                boxShadow: `0 4px 12px rgba(0,0,0,0.08), 0 0 0 4px ${primaryColor}10`,
                transition: 'all 0.3s ease'
            }}
        >
            {/* Thumbnail */}
            <div className="relative overflow-hidden">
                <img
                    src={!course.thumbnail?.url
                        ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                        : `${ImageBaseUrl}/${course.thumbnail.url}`
                    }
                    alt={course.title}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() => setImageError(true)}
                />

                {/* Overlay */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div> */}

                {/* Badges */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-10">
                    {course.featured && (
                        <span
                            className="text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            FEATURED
                        </span>
                    )}
                    {discountPercent > 0 && (
                        <span
                            className="text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            {discountPercent}% OFF {isEarlyBirdActive && '(Early Bird)'}
                        </span>
                    )}
                </div>

                {/* Level indicator */}
                <div className="absolute top-3 right-3 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${
                        course.level === 'beginner' ? 'bg-green-500' :
                        course.level === 'intermediate' ? 'bg-blue-500' :
                        'bg-purple-500'
                    }`}>
                        {course.level.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold capitalize text-gray-800 dark:text-white line-clamp-2 leading-tight">
                            {course.title} ({course.code})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                            {course.shortDescription || course.subtitle}
                        </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0 whitespace-nowrap">
                        <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                                {course.rating || '4.8'}
                            </span>
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                ({course.reviews || '1000+'})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Schedule Info */}
                {/* <div className="mt-3 flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <Calendar
                        className="h-4 w-4 mr-1 flex-shrink-0"
                        style={{ color: primaryColor }}
                    />
                    <span>Starts: {formatDate(course.schedule.startDate)}</span>
                    {course.status === 'upcoming' && (
                        <span
                            className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        >
                            {getDaysRemaining(course.schedule.startDate)} days left
                        </span>
                    )}
                </div> */}

                {/* Metadata Grid */}
                {/* <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-1.5">
                        <Users className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                        <span>{course.studentsEnrolled?.toLocaleString() || '300+'} enrolled</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <TrendingUp className="h-4 w-4 flex-shrink-0" style={{ color: secondaryColor }} />
                        <span className="capitalize">{course.language || 'English'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: primaryColor }} />
                        <span>{course.instructors?.length || 1} instructors</span>
                    </div>
                </div> */}

                {/* Pricing & CTA */}
                <div className="mt-2 flex flex-col space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatPrice(finalPrice, course.pricing.currency)}
                            </span>
                            {discountPercent > 0 && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 line-through self-center">
                                    {formatPrice(originalPrice, course.pricing.currency)}
                                </span>
                            )}
                            <span
                                className="px-1.5 py-0.5 text-xs font-bold text-white rounded-full flex items-center justify-center"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                {discountPercent}%
                            </span>
                        </div>
                        {isEarlyBirdActive && (
                            <div
                                className="text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap"
                                style={{ backgroundColor: `${primaryColor}40`, color: '#000' }}
                            >
                                Ends {formatDate(course.pricing.earlyBird.deadline)}
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate(`/course/${course.slug}`)}
                            className="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all"
                            style={{
                                backgroundColor: primaryColor,
                                color: '#000',
                                fontWeight: 600
                            }}
                        >
                            Explore
                        </button>
                        <button
                            className="flex-1 py-2 px-3 rounded-lg font-medium text-sm text-white transition-all"
                            style={{
                                backgroundColor: secondaryColor,
                                fontWeight: 600
                            }}
                        >
                            Enroll Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;