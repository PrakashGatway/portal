import { useState } from 'react';
import { Star, Clock, Users, TrendingUp, Calendar, MapPin, BookOpen } from 'lucide-react';
import { ImageBaseUrl } from '../../axiosInstance';
import { useNavigate } from 'react-router';

const CourseCard = ({ course }) => {
    const [imageError, setImageError] = useState(false);

    const formatPrice = (amount, currency = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    };
    let navigate = useNavigate()

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

    // Calculate final price
    const originalPrice = course.pricing.originalAmount || course.pricing.amount;
    const finalPrice = discountPercent > 0
        ? originalPrice * (1 - discountPercent / 100)
        : originalPrice;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 group h-full flex flex-col">
            {/* Thumbnail */}
            <div className="relative overflow-hidden">
                <img
                    src={!course.thumbnail?.url
                        ? 'https://www.gatewayabroadeducations.com/images/logo.svg'
                        : `${ImageBaseUrl}/${course.thumbnail.url}`
                    }
                    alt={course.title}
                    className="w-full h-50 object-cover transition-transform duration-500"
                    onError={() => setImageError(true)}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-100 transition-opacity duration-300"></div>

                {/* Badges */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {course.featured && (
                        <span className="bg-blue-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                            FEATURED
                        </span>
                    )}
                    {discountPercent > 0 && (
                        <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
                            {discountPercent}% OFF {isEarlyBirdActive && '(Early Bird)'}
                        </span>
                    )}
                </div>

                {/* Level indicator */}
                <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${course.level === 'beginner' ? 'bg-green-500' :
                        course.level === 'intermediate' ? 'bg-blue-500' :
                            'bg-purple-500'
                        }`}>
                        {course.level.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-2 px-3 flex flex-col flex-grow">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
                            {course.title} ({course.code})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{course.shortDescription || course.subtitle}</p>

                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                        <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">{course.rating || '4.8'}</span>
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({course.reviews || '1000+'})</span>
                        </div>
                    </div>
                </div>

                {/* Schedule Information */}
                <div className="mt-3 flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span>Starts: {formatDate(course.schedule.startDate)}</span>
                    {course.status === 'upcoming' && (
                        <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                            {getDaysRemaining(course.schedule.startDate)} days left
                        </span>
                    )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-1.5">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{course.studentsEnrolled?.toLocaleString() || '300+'} enrolled</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <TrendingUp className="h-4 w-4 flex-shrink-0" />
                        <span className="capitalize">{course.language || 'English'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <BookOpen className="h-4 w-4 flex-shrink-0" />
                        <span>{course.instructors?.length || 1} instructors</span>
                    </div>
                </div>

                {/* Pricing & CTA */}
                <div className="mt-3 flex flex-col space-y-3">
                    <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline space-x-1.5">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(finalPrice, course.pricing.currency)}
                            </span>
                            {discountPercent > 0 && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                    {formatPrice(originalPrice, course.pricing.currency)}
                                </span>
                            )}
                            <span className="px-2 py-0.5 text-sm font-medium text-white bg-red-500 rounded-full">
                                {discountPercent}%
                            </span>
                        </div>
                        {isEarlyBirdActive && (
                            <div className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-1 rounded-full">
                                Early bird ends {formatDate(course.pricing.earlyBird.deadline)}
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <button onClick={()=>navigate(`/course/${course.slug}`)} className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1 px-4 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            Explore
                        </button>
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded-lg font-medium transition-colors">
                            Enroll Now
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CourseCard;