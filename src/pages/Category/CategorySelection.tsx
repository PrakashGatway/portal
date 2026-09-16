import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import api from '../../axiosInstance';
import { toast } from 'react-toastify';
import DynamicIcon from '../../components/DynamicIcon';
import { Loader } from '../../components/fullScreeLoader';
import { useAuth } from '../../context/UserContext';
import { CreateTicket } from '../Support/Supports';

const CategorySelectionPage = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categorySelect,setcategorySelect] = useState(null)
    const [showPopup, setShowPopup] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [showcreateSupport, setshowcreateSupport] = useState(false)
    const [loading, setLoading] = useState(true);
      const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();
    const { fetchUserProfile,user } = useAuth() as any;
    const [newTicket, setNewTicket] = useState({
        subject: "",
        description: "",
        category: "general",
        priority: "medium",
      });

      useEffect(()=>{
        if(categorySelect){
          setNewTicket((prev)=>({
            ...prev,
            subject: `Intrested in ${categorySelect}`
          }))
        }
      },[categorySelect])

      console.log(categorySelect)
 const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "account", label: "Account" },
    { value: "payment", label: "Payment" },
    { value: "technical", label: "Technical" },
    { value: "content", label: "Content" },
    { value: "billing", label: "Billing" },
    { value: "feature_request", label: "Feature Request" },
    { value: "general", label: "General" },
    { value: "other", label: "Other" },
  ];

   const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

   const handleCreateTicket = async () => {
    const newErrors: Record<string, string> = {};
    if (!newTicket.subject.trim()) newErrors.subject = "Subject is required";
    if (!newTicket.description.trim())
      newErrors.description = "Description is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await api.post("/support", newTicket);
      toast.success("Support ticket created successfully!");
      setshowcreateSupport(false);
      setNewTicket({
        subject: "",
        description: "",
        category: "general",
        priority: "medium",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    }
  };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/categories?limit=50');
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const updateUserCategory = async ({ category, subCategory }: any) => {
        try {
            setLoading(true);
            await api.put("/auth/categories", {
                ...(category !== undefined && { category }),
                ...(subCategory !== undefined && { subCategory }),
            });
            await fetchUserProfile()
        } catch (error: any) {
            toast.error('Failed to update categories');
        } finally {
            setLoading(false)
        }
    };

    const getSubcategories = (categoryId) => {
        return categories.filter(category =>
            category.parent && category.parent.toString() === categoryId.toString()
        );
    };

    const handleCategoryClick = async (category) => {
        const subcategories = getSubcategories(category._id);
        if (subcategories.length === 0) {
            await updateUserCategory({ category: category._id, subCategory: null })
            navigate('/');
            return;
        }
        setSelectedCategory({
            ...category,
            subcategories
        });
        setShowPopup(true);
    };

    const handleSubcategoryClick = async (subcategory) => {
        await updateUserCategory({ category: subcategory.parent, subCategory: subcategory._id })
        navigate('/');
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedCategory(null);
    };

    const popularCategories = categories.filter(category => !category.parent);

    const groupedCategories = popularCategories.map(category => ({
        ...category,
        subcategories: getSubcategories(category._id)
    }));

    const getCategoryColorClasses = (category) => {
        if (!category.color) {
            return {
                bg: 'bg-gray-50 dark:bg-gray-800',
                bgLight: 'bg-gray-100 dark:bg-gray-700'
            };
        }

        const hexToTailwind = (hex) => {
            if (!hex) return 'gray';
            hex = hex.replace('#', '');

            const colorMap = {
                '3b82f6': 'blue',    // blue-500
                '10b981': 'emerald', // emerald-500
                'f59e0b': 'amber',   // amber-500
                'ef4444': 'red',     // red-500
                '8b5cf6': 'purple',  // purple-500
                '06b6d4': 'cyan',    // cyan-500
                'f97316': 'orange'   // orange-500
            };

            // Find closest match or use blue as default
            for (const [key, value] of Object.entries(colorMap)) {
                if (hex.toLowerCase().startsWith(key)) {
                    return value;
                }
            }
            return 'blue';
        };

        const colorClass = hexToTailwind(category.color);
        return {
            bg: `bg-${colorClass}-50 dark:bg-${colorClass}-900/20`,
            bgLight: `bg-${colorClass}-100 dark:bg-${colorClass}-900/30`
        };
    };

    if (loading) {
        return <div className='h-screen'>
            <Loader />
        </div>
    }




    return (
        <div className="min-h-screen bg-white text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#fdf4ef] dark:bg-gray-800  border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-1" />
                        Back
                    </button>
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Select your Goal</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <>
                    {/* Popular Categories */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Popular Categories</h2>
                        <div className="
    grid
    grid-cols-2
    sm:grid-cols-2
    md:grid-cols-3
    lg:grid-cols-4
    xl:grid-cols-5
    gap-4
    md:gap-6
    justify-items-center
  ">
                           {popularCategories.map((category) => {
  const isActive = category.isActive;

  return (
    <div
      key={category._id}
      className="relative flex justify-center w-full max-w-[180px] sm:max-w-[200px] md:max-w-[220px] pt-1.5"
    >
      {/* Top Color Bar */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[75%] h-4 rounded-t-lg"
        style={{ backgroundColor: category.color }}
      />

      <motion.button
        whileHover={
          isActive
            ? {
                scale: 1.01,
                y: -1,
                boxShadow: `20px 22px 40px ${category.color}65`,
              }
            : {
                scale: 1.005,
              }
        }
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (isActive) {
            handleCategoryClick(category);
          } else {
            setShowComingSoon(true);
          }
          setcategorySelect(category.name)
        }}
        className="relative z-1 w-full h-44 rounded-lg !bg-white overflow-hidden cursor-pointer transition-all duration-200"
        style={{
          background: `linear-gradient(180deg, ${category.color}30 100%)`,
        }}
      >
        <div className="flex flex-col items-center justify-center h-full px-3">
          <h3
            className={`text-4xl font-bold mb-2 ${
              !isActive ? "text-gray-400" : ""
            }`}
            style={{
              color: isActive ? category.color : undefined,
            }}
          >
            {category.name}
          </h3>

          {category.description && (
            <p
              className={`text-center text-[15px] font-medium leading-6 line-clamp-2 ${
                !isActive ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {category.description}
            </p>
          )}

        </div>
      </motion.button>
    </div>
  );
})}
                        </div>
                    </section>

                    {/* All Categories */}
                   <section className="mb-8 p-6 rounded-xl bg-[#fdf4ef]">
  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
    All Categories
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {groupedCategories.map((category) => {
      const isActive = category.isActive;

      return (
        <motion.button
          key={category._id}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (isActive) {
              handleCategoryClick(category);
            } else {
              setShowComingSoon(true);
            }
          }}
          className="p-2.5 px-4 rounded-xl dark:border-gray-700
            bg-white dark:bg-gray-800
            hover:shadow-lg
            transition-all duration-100
            flex items-center space-x-3 cursor-pointer"
        >
          {/* Icon */}
          <div className="p-3 rounded-full bg-[#f36e45]">
            <DynamicIcon
              name={category.icon}
              className="h-7 w-7 text-white stroke-[1.30]"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-lg text-gray-800 dark:text-white block">
              {category.name}
            </span>

            <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
              {category.subcategories?.length || 0} subcategories
            </span>
          </div>
        </motion.button>
      );
    })}
  </div>
</section>

                    {/* Other Offerings */}
                    <section className="mb-8 p-6 rounded-xl bg-[#fdf4ef]">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Other Offerings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.01, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-2.5
                                 px-4 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all duration-100 flex items-center space-x-3 cursor-pointer"
                            >
                                <div className={`p-3 rounded-full bg-[#f36e45]`}>
                                    <DynamicIcon
                                        name={"Target"}
                                        className="h-7 w-7 text-white stroke-[1.30]"
                                    />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-medium text-gray-800 dark:text-white block">
                                        Career Guidance
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Get expert career advice and planning
                                    </span>
                                </div>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.01, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-2.5 px-4 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-all duration-100 flex items-center space-x-3 cursor-pointer"
                            >
                                <div className={`p-3 rounded-full bg-[#f36e45]`}>
                                    <DynamicIcon
                                        name={"Rocket"}
                                        className="h-7 w-7 text-white stroke-[1.30]"
                                    />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-medium text-gray-800 dark:text-white block">
                                        Skill Development
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Enhance your professional skills
                                    </span>
                                </div>
                            </motion.button>
                        </div>
                    </section>
                </>
            </main>

            {/* Popup Modal */}
            <AnimatePresence>
                {showPopup && selectedCategory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                        Select Subcategory
                                    </h2>
                                </div>
                                <button
                                    onClick={handleClosePopup}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="space-y-6 max-h-96 overflow-y-auto p-1">
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 flex items-center">
                                        <span className="mr-2">
                                            <DynamicIcon
                                                name={selectedCategory.icon}
                                                className="h-5 w-5"
                                                color={selectedCategory.color}
                                            />
                                        </span>
                                        {selectedCategory.name}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedCategory.subcategories.map((subcategory) => {
                                            const colorClasses = getCategoryColorClasses(subcategory);
                                            return (
                                                <motion.button
                                                    key={subcategory._id}
                                                    whileHover={{ scale: 1.02, y: -1 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleSubcategoryClick(subcategory)}
                                                    className="p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-100 flex items-center space-x-3 cursor-pointer"
                                                >
                                                    <div className={`p-2 rounded-lg ${colorClasses.bgLight}`}>
                                                        <DynamicIcon
                                                            name={subcategory.icon}
                                                            className="h-5 w-5"
                                                            color={subcategory.color}
                                                        />
                                                    </div>
                                                    <span className="font-medium text-gray-800 dark:text-white text-left">
                                                        {subcategory.name}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleClosePopup}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showComingSoon && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px]">
    <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">

      {/* Close Button */}
      <button
        type="button"
        onClick={() => setShowComingSoon(false)}
        className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Content */}
      <div className="flex min-h-[380px] flex-col items-center justify-center px-6 py-12 text-center sm:px-10 md:min-h-[400px]">

        {/* Icon */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F36D45]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-[#F36D45]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.7}
          >
            <circle cx="12" cy="12" r="9" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7v5l3 2"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Coming Soon
        </h2>

        {/* Description */}
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
          This feature is coming soon. Stay tuned for something exciting!
        </p>

        {/* Buttons */}
        <div className="mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">

          {/* Query Button */}
          <button
            type="button"
            onClick={()=>{
                setshowcreateSupport(true)
                setShowComingSoon(false)
            }}
            className="w-full rounded-full border border-[#F36D45] bg-white px-6 py-3 text-sm font-semibold text-[#F36D45] transition-all duration-200 hover:bg-[#F36D45]/5 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#F36D45]/20 sm:w-auto sm:min-w-[160px]"
          >
            Have a Query?
          </button>

          {/* Got It */}
          <button
            type="button"
            onClick={() => setShowComingSoon(false)}
            className="w-full rounded-full bg-[#F36D45] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#e85d38] hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#F36D45]/20 sm:w-auto sm:min-w-[120px]"
          >
            Got it
          </button>

        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 bg-[#F36D45]" />
    </div>
  </div>
)}

{showcreateSupport && (
    <CreateTicket setShowCreateForm={setshowcreateSupport} newTicket={newTicket} setNewTicket={setNewTicket} categoryOptions={categoryOptions} priorityOptions={priorityOptions} handleCreateTicket={handleCreateTicket} errors={errors} disabledSubject={true} title="Raise a Query" disabledCategory={true} disabledPriority={true} disabledAttach={true} />
)}
        </div>
    );
};

export default CategorySelectionPage;