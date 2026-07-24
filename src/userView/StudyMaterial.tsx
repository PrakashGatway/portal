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
  AlertCircle
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-px">
            Study Materials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse through our collection of free study materials
          </p>
        </div>
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
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { id: '', label: 'All' },
            { id: "pdf", label: "PDF" },
            { id: "document", label: "Document" },
            { id: "link", label: "Link" },
            { id: "image", label: "Image" },
            { id: "audio", label: "Audio" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 !py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 '
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {materials.length} of {pagination.total} materials
          </p>
          {loading && materials.length > 0 && (
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          )}
        </div>

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
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-2"
          >
            <AnimatePresence>
              {materials.map(material => (
                <motion.div
                  key={material._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl p-[2px] hover:shadow-lg hover:scale-[.99] transition-all duration-300 "
                  style={{
                    background: "linear-gradient(405deg, #ff5a2f 0%, #ff6b35 18%, #ffe4da 35%, #ffffff 55%, #ececec 82%, #cfcfcf 100%)",
                  }}
                  onClick={() => navigate(`/resources/${material.slug}`)}
                >
                  <div className="bg-white h-full dark:bg-gray-800 rounded-2xl shadow-sm dark:border-gray-700 cursor-pointer transition-all duration-300  overflow-hidden group">
                    {/* File Icon & Title */}
                    <div className="p-4 py-6 pb-3 flex flex-col items-center">
                      <div className="dark:bg-gray-700 rounded-2xl mb-3 dark:group-hover:bg-gray-600 transition-colors">
                        {getIcon(material.materialType)}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-center line-clamp-2 text-base">
                        {material.title}
                      </h4>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
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
    </div>
  );
};

export default StudyMaterialPage;