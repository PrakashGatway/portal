import { useState } from "react";
import {
  Star,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  BookOpen,
  Languages,
  Check,
} from "lucide-react";
import { ImageBaseUrl } from "../../axiosInstance";
import { useNavigate } from "react-router";

const CourseCard = ({
  course,
  primaryColor = "#daff02",
  secondaryColor = "#fe572a",
}) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const formatPrice = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };


  const realPrice = course?.pricing?.amount || 0;

  const earlyBird = course?.pricing?.earlyBird;

  const isEarlyBirdActive =
    !!earlyBird?.deadline &&
    new Date(earlyBird.deadline).getTime() > Date.now();

  let price = realPrice;

  // Apply early bird discount first
  if (isEarlyBirdActive) {
    price = price - (price * (earlyBird?.discount || 0)) / 100;
  }
  const earlyBirdDiscount = isEarlyBirdActive ? earlyBird?.discount || 0 : 0;
  // Then apply normal discount
  const normalDiscount = course?.pricing?.discount || 0;

  price = price - (price * normalDiscount) / 100;

  return (
    // <div className="p-[1.5px] rounded-2xl overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
    //     <div className="relative rounded-2xl h-full bg-white p-1.5 overflow-hidden">

    //         {/* Top Highlight */}
    //         <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-[#ADADAC] to-[#ADADAC]/0" />

    //         {/* Image */}
    //         <div
    //             style={{ borderRadius: "15px 15px 0px 0px" }}
    //             className="relative overflow-hidden h-[170px]"
    //         >
    //             <img
    //                 src={
    //                     !course.thumbnail?.url
    //                         ? "/images/logo.png"
    //                         : `${ImageBaseUrl}/${course.thumbnail.url}`
    //                 }
    //                 alt={course.title}
    //                 className="object-cover h-full w-full"
    //                 onError={(e) => {
    //                     e.currentTarget.src =
    //                         "https://foundr.com/wp-content/uploads/2023/04/How-to-create-an-online-course.jpg";
    //                 }}
    //             />

    //             {course.featured && (
    //                 <span className="absolute top-3 left-3 bg-[#FF6A3D] text-white text-xs font-medium px-3 py-1 rounded-full">
    //                     Featured
    //                 </span>
    //             )}

    //             {discountPercent > 0 && (
    //                 <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
    //                     {discountPercent}% OFF
    //                 </span>
    //             )}
    //         </div>

    //         {/* Content */}
    //         <div
    //             onClick={() => navigate(`/course/${course.slug}`)}
    //             className="py-2 px-1 space-y-1 cursor-pointer"
    //         >
    //             <h3 className="text-lg font-medium capitalize text-gray-900 line-clamp-2">
    //                 {course.title}
    //             </h3>

    //             <p className="text-sm text-[#FF6A3D] font-medium line-clamp-1">
    //                 {course.shortDescription || course.subtitle}
    //             </p>

    //             {/* Rating */}
    //             {/* <div className="flex items-center gap-2 pt-1">
    //                 <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
    //                 <span className="text-sm font-medium">
    //                     {course.rating || "4.8"}
    //                 </span>
    //                 <span className="text-xs text-gray-500">
    //                     ({course.reviews || "1000+"})
    //                 </span>
    //             </div> */}

    //             {/* Meta */}
    //             <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600 pt-2 pb-2">
    //                 <div className="flex items-center gap-2">
    //                     <BookOpen className="h-4 w-4 text-[#FF6A3D]" />
    //                     {course.instructors?.length || 1} Instructor
    //                 </div>

    //                 <div className="flex capitalize items-center gap-2">
    //                     <Languages className="h-4 w-4 text-[#FF6A3D]" />
    //                     {course.language || "English"}
    //                 </div>

    //                 <div className="flex items-center gap-2">
    //                     <Clock className="h-4 w-4 text-[#FF6A3D]" />
    //                     {course.level || "Beginner"}
    //                 </div>
    //             </div>
    //         </div>

    //         {/* Footer */}
    //         <div className="flex items-start">

    //             <div
    //                 style={{ borderRadius: "0px 0px 0px 15px" }}
    //                 className="flex items-center flex-1 gap-1 bg-[#FF6A3D] text-center text-white px-2 py-2"
    //             >
    //                 {course.pricing.isFree ? (
    //                     <div className="text-3xl font-bold">
    //                         Free
    //                     </div>
    //                 ) : (
    //                     <>
    //                         {discountPercent > 0 && (
    //                             <div className="text-sm line-through opacity-70">
    //                                 {formatPrice(originalPrice, course.pricing.currency)}
    //                             </div>
    //                         )}

    //                         <div className="text-2xl font-bold">
    //                             {formatPrice(finalPrice, course.pricing.currency)}
    //                         </div>
    //                     </>
    //                 )}
    //             </div>

    //             <button
    //                 onClick={() => navigate(`/checkout/${course.slug}`)}
    //                 style={{ borderRadius: "0px 0px 15px 0px" }}
    //                 className="flex-1 bg-[#3B3B3B] text-white font-medium py-3 bg-gradient-to-b from-[#545454] via-[#ffffff]/30 to-[#545454] hover:bg-black transition"
    //             >
    //                 {course.pricing.isFree ? "Start Course" : "Enroll Now"}
    //             </button>

    //         </div>

    //     </div>
    // </div>

    <div className="w-full">
      {/* Outer Gradient Border */}
      <div className="rounded-3xl p-[1.5px] bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-black overflow-hidden">
        <div className="relative rounded-3xl bg-white overflow-hidden h-full">
          {/* ================= IMAGE ================= */}
          <div className="p-2.5">
            <div className="rounded-2xl p-2.5 bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-white">
              <div className="rounded-2xl overflow-hidden h-full sm:h-full lg:h-[180px]">
                <img
                  src={
                    !course.thumbnail?.url
                      ? "/images/logo.png"
                      : `${ImageBaseUrl}/${course.thumbnail.url}`
                  }
                  alt={course?.title}
                  className="w-full h-full object-contain lg:object-cover"
                />
              </div>
            </div>
          </div>

          {/* Discount Badge */}
          {isEarlyBirdActive && (
            <span className="absolute top-5 left-5 z-10 bg-gradient-to-r from-[#FF6B35] to-[#FF8A3D] text-white text-xs font-medium px-3 py-1.5 rounded-full">
              Early Bird
            </span>
          )}

          {/* Discount Badge */}
          {normalDiscount > 0 && (
            <span className="absolute top-5 right-5 z-10 bg-green-500 text-white px-3 py-1 rounded-full">
              <span className="text-xs font-medium">{normalDiscount}% OFF</span>

              {isEarlyBirdActive && (
                <span className="ml-0.5 text-[10px] font-semibold ">
                  +{earlyBirdDiscount}%
                </span>
              )}
            </span>
          )}

          {/* ================= BODY ================= */}
          <div
            onClick={() => navigate(`/course/${course.slug}`)}
            className="px-6 pb-4 cursor-pointer"
          >
            {/* Title */}
            <h3 className="text-xl md:text-xl font-bold text-gray-900 leading-tight">
              <span className="text-[#FF6736]">
                {course?.title?.split(" ")[0]}
              </span>{" "}
              <span className="text-gray-900">
                {course?.title?.split(" ").slice(1).join(" ")}
              </span>
            </h3>

            {/* Description */}
            <p className="text-[#FF6A3D] text-sm font-medium mt-2 line-clamp-2">
              {course.shortDescription || course.subtitle}
            </p>

            {/* ================= META ================= */}
            <div className="mt-3  text-gray-600 flex items-center gap-4 ">
              {/* Instructor */}
              <div className="flex items-center gap-1 text-base">
                <BookOpen size={20} className="text-[#FF6736] shrink-0" />

                <span className="text-sm">
                  {course.instructors?.length || 1} Instructor
                </span>
              </div>

              {/* Language */}
              <div className="flex items-center gap-1 text-base">
                <Languages size={20} className="text-[#FF6736] shrink-0" />

                <span className="text-sm">{course.language || "English"}</span>
              </div>

              {/* Level */}
              <div className="flex items-center gap-1 text-base">
                <Clock size={20} className="text-[#FF6736] shrink-0" />

                <span className="text-sm">{course.level || "Beginner"}</span>
              </div>
            </div>

            {/* ================= PRICE ================= */}
            <div className="mt-3 flex justify-between items-center gap-3">
              <div>
                {course?.isPurchased === true ? (
                  <div className="flex items-center gap-1.5">
                    <Check
                      size={16}
                      strokeWidth={3}
                      className="text-green-600"
                    />
                    <span className="text-sm font-semibold text-green-600">
                      Already Enrolled
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-gray-900 text-sm">
                      {course?.pricing?.currency}
                    </span>

                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(price, course.pricing.currency)}
                    </span>

                    {normalDiscount > 0 && (
                      <span className="line-through text-gray-400 text-sm">
                        {formatPrice(realPrice, course.pricing.currency)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                {/* Explore */}
                {course?.isPurchased === true ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/course/${course.slug}`);
                    }}
                    className="border border-[#FF6736] rounded-2xl px-5 py-2 text-[#FF6736] text-sm font-medium hover:bg-[#FF6736] hover:text-white transition-all duration-300 whitespace-nowrap"
                  >
                    Start Course
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/checkout/${course?.slug}`);
                    }}
                    className="border border-[#FF6736] rounded-2xl px-5 py-2 text-[#FF6736] text-sm font-medium hover:bg-[#FF6736] hover:text-white transition-all duration-300 whitespace-nowrap"
                  >
                    Enroll Now
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ================= FOOTER ================= */}
          <div className="px-5 pb-2 mt-1 hidden lg:block">
            <div className="rounded-full bg-[#FCE7D3] flex items-center p-2">
              <span className="bg-[#FF6D42] text-white rounded-full px-4 py-1 text-xs font-semibold">
                Ooshas Prep
              </span>

              <span className="ml-3 text-gray-700 text-xs">
                Limited Time Offer
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
