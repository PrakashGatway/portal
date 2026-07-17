import { useState } from 'react';
import { Star, Clock, Users, TrendingUp, Calendar, MapPin, BookOpen, Languages } from 'lucide-react';
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
        <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
            <div className="relative rounded-2xl h-full bg-white p-1.5 overflow-hidden">

                {/* Top Highlight */}
                <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />

                {/* Image */}
                <div
                    style={{ borderRadius: "15px 15px 0px 0px" }}
                    className="relative overflow-hidden h-[170px]"
                >
                    <img
                        src={
                            !course.thumbnail?.url
                                ? "/images/logo.png"
                                : `${ImageBaseUrl}/${course.thumbnail.url}`
                        }
                        alt={course.title}
                        className="object-cover h-full w-full"
                        onError={(e) => {
                            e.currentTarget.src =
                                "https://foundr.com/wp-content/uploads/2023/04/How-to-create-an-online-course.jpg";
                        }}
                    />

                    {course.featured && (
                        <span className="absolute top-3 left-3 bg-[#FF6A3D] text-white text-xs font-medium px-3 py-1 rounded-full">
                            Featured
                        </span>
                    )}

                    {discountPercent > 0 && (
                        <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                            {discountPercent}% OFF
                        </span>
                    )}
                </div>

                {/* Content */}
                <div
                    onClick={() => navigate(`/course/${course.slug}`)}
                    className="py-2 px-1 space-y-1 cursor-pointer"
                >
                    <h3 className="text-lg font-medium capitalize text-gray-900 line-clamp-2">
                        {course.title}
                    </h3>

                    <p className="text-sm text-[#FF6A3D] font-medium line-clamp-1">
                        {course.shortDescription || course.subtitle}
                    </p>

                    {/* Rating */}
                    {/* <div className="flex items-center gap-2 pt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                            {course.rating || "4.8"}
                        </span>
                        <span className="text-xs text-gray-500">
                            ({course.reviews || "1000+"})
                        </span>
                    </div> */}

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 pt-2 pb-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[#FF6A3D]" />
                            {course.instructors?.length || 1} Instructor
                        </div>

                        <div className="flex capitalize items-center gap-2">
                            <Languages className="h-4 w-4 text-[#FF6A3D]" />
                            {course.language || "English"}
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#FF6A3D]" />
                            {course.level || "Beginner"}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-start">

                    <div
                        style={{ borderRadius: "0px 0px 0px 15px" }}
                        className="flex items-center flex-1 gap-1 bg-[#FF6A3D] text-center text-white px-2 py-2"
                    >
                        {course.pricing.isFree ? (
                            <div className="text-3xl font-bold">
                                Free
                            </div>
                        ) : (
                            <>
                                {discountPercent > 0 && (
                                    <div className="text-sm line-through opacity-70">
                                        {formatPrice(originalPrice, course.pricing.currency)}
                                    </div>
                                )}

                                <div className="text-2xl font-bold">
                                    {formatPrice(finalPrice, course.pricing.currency)}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => navigate(`/course/${course.slug}`)}
                        style={{ borderRadius: "0px 0px 15px 0px" }}
                        className="flex-1 bg-[#3B3B3B] text-white font-medium py-3 bg-gradient-to-b from-[#545454] via-[#ffffff]/30 to-[#545454] hover:bg-black transition"
                    >
                        {course.pricing.isFree ? "Start Course" : "Enroll Now"}
                    </button>

                </div>

            </div>
        </div>
    );
};

export default CourseCard;