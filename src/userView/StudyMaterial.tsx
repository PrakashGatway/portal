// src/pages/StudyMaterialPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Image,
  Music,
  Video,
  File,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
  Calendar,
  Radio
} from 'lucide-react';
import Button from '../components/ui/button/Button';
import SecureMaterialViewer from './SecureMaterial';
import api from '../axiosInstance';
import { useNavigate } from 'react-router';

const StudyMaterialPage = () => {
  const [materials, setMaterials] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState<any>({
    total: 0,
    page: 1,
    totalPages: 1,
    count: 0
  });
  const [pageSize] = useState(12);

  const navigate = useNavigate();

  const fetchMaterials = useCallback(async (page: number, search: string, tab: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: search || ''
      });

      if (tab !== 'all') {
        let materialType = tab;
        if (tab === 'documents') materialType = 'pdf,document';
        params.append('materialType', materialType);
      }

      const response = await api.get(`/content/resources?${params.toString()}`);

      if (response.data.success) {
        setMaterials(response.data.data);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          totalPages: response.data.totalPages,
          count: response.data.count
        });
      } else {
        setError('Failed to fetch study materials');
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Unable to load study materials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length > 0 && searchInput.length < 3) {
        return;
      }
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchMaterials(1, searchQuery, activeTab);
  }, [fetchMaterials, searchQuery, activeTab]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchMaterials(newPage, searchQuery, activeTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


 const courses = [
  {
    id: 1,
    title: "IELTS Basics & Test Overview",
    description:
      "Exam format, band system, Academic vs General Training",
    image: "/images/resource-1.webp",
    bgColor: "#fef0bf63",
  },
  {
    id: 2,
    title: "Listening Foundation Course",
    description:
      "Question types, common traps, basic practice sets",
    image: "/images/resource-2.webp",
    bgColor: "#fcd6a565",
  },
  {
    id: 3,
    title: "Reading Skills Builder",
    description:
      "Skimming, scanning, true/false/not given practice",
    image: "/images/resource-3.webp",
    bgColor: "#fdefbe5c",
  },
];

  const getIcon = (type: string) => {
    const iconClass = "h-14 w-14";
    switch (type) {
      case 'pdf':
        return <img src="https://static.vecteezy.com/system/resources/previews/019/016/806/non_2x/adobe-acrobat-reader-icon-free-png.png" alt="PDF" className={`${iconClass} text-red-500`} />;
      case 'image':
        return <Image className={`${iconClass} text-green-500`} />;
      case 'audio':
        return <Music className={`${iconClass} text-blue-500`} />;
      case 'video':
        return <Video className={`${iconClass} text-purple-500`} />;
      case 'document':
        return <File className={`${iconClass} text-orange-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  }

  if (selectedMaterial) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Button
            onClick={() => setSelectedMaterial(null)}
            className="absolute -top-2 -right-2 z-60 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            variant="ghost"
            size="sm"
          >
            <X className="h-9 w-9 text-gray-400 rounded-full border dark:border-gray-700 p-2 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" />
          </Button>
          <SecureMaterialViewer material={selectedMaterial} />
        </div>
      </div>
    );
  }

  if (loading && materials.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading study materials...</p>
        </div>
      </div>
    );
  }

  if (error && materials.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => fetchMaterials(1, searchQuery, activeTab)} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section>
        
      <div
        className="
          flex flex-col md:flex-row
          items-start md:items-center
          justify-between
          gap-6
          rounded-[28px]
          bg-[#FF7048]
          px-6
          py-8
          md:px-12
          md:py-10
          shadow-sm
          my-5
        "
      >
        {/* Left Content */}
        <div>
          <h1
            className="
              text-white
              font-bold
              leading-tight
              text-3xl
              sm:text-4xl
              lg:text-[54px]
            "
          >
            Resources Library
          </h1>

          <p
            className="
              mt-2
              text-white/95
              text-base
              sm:text-lg
              lg:text-[22px]
              font-medium
            "
          >
            High quality study material to help you crack your dream exam.
          </p>
        </div>

        {/* Right Button */}
        <button
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-white
            px-5
            py-3
            text-sm
            sm:text-base
            font-semibold
            text-[#3C3C3C]
            shadow-md
            transition-all
            duration-300
            hover:scale-105
            hover:shadow-lg
          "
        >
          <Download className="h-4 w-4 text-[#FF7048]" />

          My Downloads
        </button>
      </div>
    
    <div className="min-h-screen  rounded-2xl py-4">
      <div className="max-w-7xl mx-auto px-2 sm:px-0">
       
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials, courses, or tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-10 py-4 text-sm border-2 border-orange-500/50 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
          {/* Minimum character hint */}
          {searchInput.length > 0 && searchInput.length < 3 && (
            <p className="text-xs text-orange-500 mt-2 ml-4">
              Please enter at least 3 characters to search
            </p>
          )}
        </div>

        {/* Tabs */}
       {/* <div className="flex flex-wrap items-center gap-3 mb-6">
  
  <h3 className="text-[#2F2F2F] text-lg font-medium whitespace-nowrap mr-2">
    Filter by Type -
  </h3>

  {[
    { id: "all", label: "All Types" },
    { id: "pdf", label: "Documents" },
    { id: "document", label: "Image" },
    { id: "link", label: "Videos" },
    { id: "image", label: "Audio" },
    { id: "audio", label: "Audio" },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`
        min-w-[110px]
        sm:min-w-[130px]
        px-5
        py-2.5
        rounded-xl
        text-sm
        font-medium
        transition-all
        duration-300
        whitespace-nowrap

        ${
          activeTab === tab.id
            ? "bg-[#FF7048] text-white shadow-[0_8px_20px_rgba(255,112,72,0.25)]"
            : "bg-[#FBE9E3] text-[#2F2F2F] hover:bg-[#F7DDD4]"
        }
      `}
    >
      {tab.label}
    </button>
  ))}
</div> */}

     

        {/* File Grid */}
        {materials.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className=" max-w-md mx-auto">
              <img src='https://assets-v2.lottiefiles.com/a/5ecf6cd8-5414-486b-a397-7fb86ed2761e/98tLq7HpYS.gif' alt="Empty" className="mx-auto mb-4 w-60" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No materials found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2 text-base leading-relaxed">
                {searchQuery ? 'No results match your search criteria.' : 'No materials available in this category.'}
              </p>
              {(searchQuery || activeTab !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setActiveTab('all');
                  }}
                  variant="primary"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
//           <motion.div
//   className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
// >
//             <AnimatePresence>
//               {materials.map(material => (
//                 <motion.div
//                   key={material._id}
//                   layout
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, scale: 0.8 }}
//                   transition={{ duration: 0.3 }}
//                   className="rounded-2xl p-[2px] hover:shadow-lg hover:scale-[.99] transition-all duration-300 "
               
//                   onClick={() => navigate(`/resources/${material.slug}`)}
//                 >
//                  <div className="bg-[#fff9e6] h-full dark:bg-gray-800 rounded-2xl shadow-sm dark:border-gray-700 cursor-pointer transition-all duration-300 overflow-hidden group flex flex-col justify-between">
//   {/* Top Section */}
//   <div className="p-4 flex gap-4">
//     {/* PDF Icon */}
//     <div className="flex-shrink-0">
//       <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white flex items-center justify-center shadow-sm">
//         {getIcon(material.materialType)}
//       </div>
//     </div>

//     {/* Content */}
//     <div className="flex-1 min-w-0">
//       <h4 className="text-[15px] sm:text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
//         {material.title}
//       </h4>

//       <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
//         {material.shortDescription ||
//           material.description ||
//           "50+ practice questions with model answers for band 7+"}
//       </p>
//     </div>
//   </div>

//   {/* Bottom Buttons */}
//   <div className="px-4 pb-4 mt-auto">
//     <div className="grid grid-cols-2 gap-12">
//       <button
//         onClick={(e) => {
//           e.stopPropagation();
//           window.open(material.file, "_blank");
//         }}
//         className="h-10 rounded-md border border-[#ff6b35] text-gray-600 bg-white hover:bg-[#fff4ef] transition font-medium text-sm"
//       >
//         View PDF
//       </button>

//       <button
//         onClick={(e) => {
//           e.stopPropagation();
//           const link = document.createElement("a");
//           link.href = material.file;
//           link.download = "";
//           link.click();
//         }}
//         className="h-10 rounded-md bg-[#ff6b35] hover:bg-[#f45b26] text-white font-semibold transition text-sm"
//       >
//         Download
//       </button>
//     </div>
//   </div>
// </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </motion.div>
 <div className="grid lg:grid-cols-[0.6fr_1.4fr] gap-2">
  
   
  <div className="rounded-[28px] h-100 bg-white shadow-md overflow-hidden border border-gray-100">

  {/* Image */}
  <div className="rounded-2xl p-2.5 bg-gradient-to-b from-[#CFCFCF] via-[#ECECEC] to-white">
    <div className="rounded-2xl overflow-hidden">
      <img
        src="/images/course-thumbnail.webp"
        alt="IELTS Course"
        className="w-full h-full lg:h-full object-contain"
      />
    </div>
  </div>

  {/* Body */}
  <div className="px-6 ">
    <h3 className="text-xl font-bold">
      <span className="text-[#FF6736]">IELTS</span>{" "}
      <span className="text-gray-900 dark:text-white">
        Basics & Test Overview
      </span>
    </h3>

    <div className=" space-y-3 text-gray-600 dark:text-gray-300">
      <div className="flex items-center gap-3">
        <Radio size={20} className="text-[#FF6736]" />
        <span className="text-sm">Online Live Classes</span>
      </div>

      <div className="flex items-center gap-3">
        <Calendar size={20} className="text-[#FF6736]" />
        <span className="text-sm">Starts on 20 August 2026</span>
      </div>
    </div>

    {/* Price */}
    <div className=" flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">₹4,999</span>

          <span className="text-gray-400 line-through text-sm">
            ₹7,999
          </span>
        </div>

        <p className=" text-sm font-semibold text-[#16A34A]">
          38% OFF
        </p>
      </div>

      <button className="rounded-2xl border border-[#FF6736] px-6 py-2 text-sm font-medium text-[#FF6736] transition hover:bg-[#FF6736] hover:text-white">
        Explore
      </button>
    </div>
  </div>

  {/* Footer */}
  <div className="px-5 pb-5 my-2 hidden lg:block">
    <div className="flex items-center rounded-full bg-[#FCE7D3] p-2 dark:bg-gray-700">
      <span className="rounded-full bg-[#FF6D42] px-4 py-1 text-xs font-semibold text-white">
        Ooshas Prep
      </span>

      <span className="ml-3 text-xs text-gray-700 dark:text-white">
        Limited Time Offer
      </span>
    </div>
  </div>
</div>

   <section className="w-full  px-4 md:px-5 py-4 bg-white rounded-xl">
      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-[#FF6B35] text-3xl md:text-4xl font-bold">
          IELTS
        </h2>

        <p className="text-gray-600 text-lg mt-1">
          International English Language Testing System
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {courses.map((item) => (
          <div
          style={{ backgroundColor: item.bgColor }}
            key={item.id}
            className={`
            rounded-[28px]
            p-5 md:p-4
            flex flex-col md:flex-row
            items-center
            gap-6
          `}
          >
            {/* Image */}
            <div
              className="bg-white
              rounded-3xl
              w-full
              md:w-[135px]
              h-[120px]
              md:h-[120px]
              flex
              items-center
              justify-center
              shrink-0
              shadow-sm"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-[90px] md:w-[110px] object-cover"
              />
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-[#FF5A2C] font-bold text-xl md:text-xl">
                {item.title}
              </h3>

              <p className="text-gray-600 mt-2 text-base md:text-lg leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>

 </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              variant="outline"
              size="sm"
              className="px-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-full font-medium transition-all duration-200 ${pagination.page === pageNum
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              variant="outline"
              size="sm"
              className="px-4"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Security Notice */}
        {/* <div className="mt-12 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center justify-center">
            <Lock className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
            <p className="text-blue-700 dark:text-blue-300 text-sm text-center">
              All materials are protected with digital rights management. Downloads, printing, and sharing are disabled to protect intellectual property.
            </p>
          </div>
        </div> */}
     
      </div>
    </div>
    </section>
  );
};

export default StudyMaterialPage;