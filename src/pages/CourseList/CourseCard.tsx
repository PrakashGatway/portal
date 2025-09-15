// components/CourseCard.jsx
import { useState } from "react";
import { Star, Clock, Users, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

const CourseCard = ({ course }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Card animation variants
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  // Badge variants
  const badgeVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative">
        <img 
          src={course.image} 
          alt={course.title} 
          className="w-full h-48 object-cover"
        />
        
        {/* Badges */}
        {course.isNew && (
          <motion.div
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          >
            NEW
          </motion.div>
        )}
        
        {course.isPopular && (
          <motion.div
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          >
            POPULAR
          </motion.div>
        )}
        
        {/* Discount badge */}
        {course.discount > 0 && (
          <motion.div
            variants={badgeVariants}
            initial="initial"
            animate="animate"
            className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          >
            {course.discount}% OFF
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{course.title}</h3>
          <PlayCircle className="h-5 w-5 text-indigo-600" />
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

        {/* Price */}
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 mr-2">₹{course.price.toLocaleString()}</span>
            {course.originalPrice && (
              <span className="text-sm text-gray-500 line-through">₹{course.originalPrice.toLocaleString()}</span>
            )}
          </div>
          {course.discount > 0 && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
              {course.discount}% OFF
            </span>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {course.features.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {course.duration}
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {course.students} students
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium">{course.rating}</span>
            <span className="ml-1 text-xs text-gray-500">({course.reviews} reviews)</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            EXPLORE
          </button>
          <button className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            BUY NOW
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;