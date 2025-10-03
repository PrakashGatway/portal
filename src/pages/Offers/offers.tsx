import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2 } from "lucide-react";

export default function PromoCodeManagement() {
    const [promoCodes, setPromoCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPromoCode, setSelectedPromoCode] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        isActive: "",
        type: "",
        search: "",
        course: "",
        category: ""
    });

    const [formData, setFormData] = useState({
        code: "",
        title: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        minPurchase: 0,
        maxDiscount: 0,
        validFrom: "",
        validUntil: "",
        usageLimit: 0,
        type: "general",
        courses: [],
        categories: [],
        applicableUsers: [],
        applicableUserRoles: [],
        maxUsesPerUser: 0,
        terms: [""],
        isFeatured: false,
        isActive: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchPromoCodes();
        fetchRelatedData();
    }, [filters]);

    const fetchPromoCodes = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy
            };
            const response = await api.get("/promo-codes", { params });
            setPromoCodes(response.data?.data || []);
            setTotal(response.data?.total || 0);
        } catch (error) {
            toast.error("Failed to load promo codes");
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedData = async () => {
        try {
            const [usersRes, coursesRes, categoriesRes] = await Promise.all([
                api.get("/users"),
                api.get("/courses"),
                api.get("/categories")
            ]);
            setAllUsers(usersRes.data?.data || []);
            setAllCourses(coursesRes.data?.data || []);
            setAllCategories(categoriesRes.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch related data:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const togglePromoCodeStatus = async (promoCodeId, currentStatus) => {
        try {
            await api.put(`/promo-codes/${promoCodeId}`, { isActive: !currentStatus });
            toast.success(`Promo code ${currentStatus ? "deactivated" : "activated"} successfully`);
            fetchPromoCodes();
        } catch (error) {
            console.error("Error toggling promo code status:", error);
            toast.error("Failed to update promo code status");
        }
    };

    const viewPromoCodeDetails = (promoCode) => {
        setSelectedPromoCode(promoCode);
        openModal();
    };

    const openEditModal = (promoCode) => {
        setSelectedPromoCode(promoCode);
        setFormData({
            code: promoCode.code || "",
            title: promoCode.title || "",
            description: promoCode.description || "",
            discountType: promoCode.discountType || "percentage",
            discountValue: promoCode.discountValue || 0,
            minPurchase: promoCode.minPurchase || 0,
            maxDiscount: promoCode.maxDiscount || 0,
            validFrom: promoCode.validFrom ? moment(promoCode.validFrom).format('YYYY-MM-DDTHH:mm') : "",
            validUntil: promoCode.validUntil ? moment(promoCode.validUntil).format('YYYY-MM-DDTHH:mm') : "",
            usageLimit: promoCode.usageLimit || 0,
            type: promoCode.type || "general",
            courses: promoCode.courses || [],
            categories: promoCode.categories || [],
            applicableUsers: promoCode.applicableUsers || [],
            applicableUserRoles: promoCode.applicableUserRoles || [],
            maxUsesPerUser: promoCode.maxUsesPerUser || 0,
            terms: promoCode.terms?.length > 0 ? promoCode.terms : [""],
            isFeatured: promoCode.isFeatured || false,
            isActive: promoCode.isActive !== undefined ? promoCode.isActive : true
        });
        setEditModalOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.code.trim()) {
            newErrors.code = 'Promo code is required';
        } else if (formData.code.length > 20) {
            newErrors.code = 'Code cannot exceed 20 characters';
        }
        
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        
        if (formData.discountValue <= 0) {
            newErrors.discountValue = 'Discount value must be greater than 0';
        }
        
        if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
            newErrors.validUntil = 'End date must be after start date';
        }
        
        if (formData.type === 'user_course_specific' && 
            (!formData.applicableUsers.length || !formData.courses.length)) {
            newErrors.type = 'User and course must be selected for user-course specific promo';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSavePromoCode = async () => {
        if (!validateForm()) return;
        try {
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minPurchase: parseFloat(formData.minPurchase),
                maxDiscount: parseFloat(formData.maxDiscount),
                usageLimit: parseInt(formData.usageLimit) || 0,
                maxUsesPerUser: parseInt(formData.maxUsesPerUser) || 0
            };
            await api.put(`/promo-codes/${selectedPromoCode._id}`, payload);
            toast.success("Promo code updated successfully");
            fetchPromoCodes();
            setEditModalOpen(false);
        } catch (error) {
            console.error("Error saving promo code:", error);
            toast.error(error.message || "Failed to save promo code");
        }
    };

    const handleCreatePromoCode = async () => {
        if (!validateForm()) return;
        try {
            const payload = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minPurchase: parseFloat(formData.minPurchase),
                maxDiscount: parseFloat(formData.maxDiscount),
                usageLimit: parseInt(formData.usageLimit) || 0,
                maxUsesPerUser: parseInt(formData.maxUsesPerUser) || 0
            };
            await api.post("/promo-codes", payload);
            toast.success("Promo code created successfully");
            fetchPromoCodes();
            setEditModalOpen(false);
        } catch (error) {
            console.error("Error creating promo code:", error);
            toast.error(error.message || "Failed to create promo code");
        }
    };

    const deletePromoCode = async () => {
        if (!selectedPromoCode) return;
        try {
            await api.delete(`/promo-codes/${selectedPromoCode._id}`);
            toast.success("Promo code deleted successfully");
            fetchPromoCodes();
            setDeleteModalOpen(false);
            setSelectedPromoCode(null);
        } catch (error) {
            console.error("Error deleting promo code:", error);
            toast.error(error.message || "Failed to delete promo code");
        }
    };

    const openCreateModal = () => {
        setSelectedPromoCode(null);
        setFormData({
            code: "",
            title: "",
            description: "",
            discountType: "percentage",
            discountValue: 0,
            minPurchase: 0,
            maxDiscount: 0,
            validFrom: "",
            validUntil: "",
            usageLimit: 0,
            type: "general",
            courses: [],
            categories: [],
            applicableUsers: [],
            applicableUserRoles: [],
            maxUsesPerUser: 0,
            terms: [""],
            isFeatured: false,
            isActive: true
        });
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (value, name) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayChange = (value, name) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addTerm = () => {
        setFormData(prev => ({
            ...prev,
            terms: [...prev.terms, ""]
        }));
    };

    const removeTerm = (index) => {
        setFormData(prev => ({
            ...prev,
            terms: prev.terms.filter((_, i) => i !== index)
        }));
    };

    const updateTerm = (index, value) => {
        setFormData(prev => ({
            ...prev,
            terms: prev.terms.map((term, i) => i === index ? value : term)
        }));
    };

    const formatDiscount = (promo) => {
        if (promo.discountType === 'percentage') {
            return `${promo.discountValue}%`;
        }
        return `₹${promo.discountValue}`;
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H12V17H10V12H5V10H10V5H12V10H17V12Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Promo Code Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your promotional codes
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {promoCodes.length} promo codes
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                            >
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                                    fill=""
                                />
                            </svg>
                            Add Promo Code
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                {/* Filters Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Code, Title, Description)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search promo codes..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                        </label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Types</option>
                            <option value="general">General</option>
                            <option value="course_specific">Course Specific</option>
                            <option value="user_specific">User Specific</option>
                            <option value="category_specific">Category Specific</option>
                            <option value="user_course_specific">User-Course Specific</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            name="isActive"
                            value={filters.isActive}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({
                                page: 1,
                                limit: 10,
                                sortBy: "-createdAt",
                                isActive: "",
                                type: "",
                                search: "",
                                course: "",
                                category: ""
                            })}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
                
                {/* Actions Section */}
                <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Rows per page:
                            </label>
                            <select
                                name="limit"
                                value={filters.limit}
                                onChange={handleFilterChange}
                                className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Promo Codes Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Code
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Title
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Discount
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Validity
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Usage
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Type
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Created
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {promoCodes?.length > 0 ? (
                                    promoCodes.map((promo) => (
                                        <tr key={promo._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {promo.code}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {promo.title}
                                                </div>
                                               
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {formatDiscount(promo)}
                                                {promo.maxDiscount > 0 && promo.discountType === 'percentage' && (
                                                    <div className="text-xs text-gray-400">Max: ₹{promo.maxDiscount}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <div>
                                                    {moment(promo.validFrom).format("MMM D, YYYY")}
                                                </div>
                                                <div>
                                                    {moment(promo.validUntil).format("MMM D, YYYY")}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <div>
                                                    Used: {promo.usedCount}
                                                    {promo.usageLimit > 0 && ` / ${promo.usageLimit}`}
                                                </div>
                                                {promo.maxUsesPerUser > 0 && (
                                                    <div className="text-xs text-gray-400">Max per user: {promo.maxUsesPerUser}</div>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300 capitalize">
                                                {promo.type.replace('_', ' ')}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <span
                                                    onClick={() => togglePromoCodeStatus(promo._id, promo.isActive)}
                                                    className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${promo.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                        }`}
                                                >
                                                    {promo.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {moment(promo.createdAt).format("MMM D, YYYY")}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => viewPromoCodeDetails(promo)}
                                                        className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(promo)}
                                                        className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedPromoCode(promo); setDeleteModalOpen(true); }}
                                                        className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                                        >
                                            No promo codes found matching your criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Pagination */}
                {total > 0 && (
                    <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                            Showing{" "}
                            <span className="font-medium">
                                {(filters.page - 1) * filters.limit + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                                {Math.min(filters.page * filters.limit, total)}
                            </span>{" "}
                            of <span className="font-medium">{total}</span> results
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${filters.page === 1
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    }`}
                            >
                                Previous
                            </button>
                            {Array.from(
                                { length: Math.ceil(total / filters.limit) },
                                (_, i) => i + 1
                            )
                                .slice(
                                    Math.max(0, filters.page - 3),
                                    Math.min(Math.ceil(total / filters.limit), filters.page + 2)
                                )
                                .map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`rounded-md border px-3 py-1 text-sm ${filters.page === pageNum
                                            ? "border-indigo-500 bg-indigo-500 text-white"
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page * filters.limit >= total}
                                className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${filters.page * filters.limit >= total
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Promo Code Details Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Promo Code Details
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Detailed information about this promo code
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            {selectedPromoCode && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Basic Information
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Code</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.code}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.title}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Discount Details
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Discount Type</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                                                        {selectedPromoCode.discountType}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Discount Value</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {formatDiscount(selectedPromoCode)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Min Purchase</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        ₹{selectedPromoCode.minPurchase}
                                                    </p>
                                                </div>
                                                {selectedPromoCode.maxDiscount > 0 && (
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Max Discount</p>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                            ₹{selectedPromoCode.maxDiscount}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Validity Period
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Valid From</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {moment(selectedPromoCode.validFrom).format("MMM D, YYYY h:mm A")}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Valid Until</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {moment(selectedPromoCode.validUntil).format("MMM D, YYYY h:mm A")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Usage Limits
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Usage Limit</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.usageLimit > 0 ? selectedPromoCode.usageLimit : 'Unlimited'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Used Count</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.usedCount}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Max Uses Per User</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.maxUsesPerUser > 0 ? selectedPromoCode.maxUsesPerUser : 'Unlimited'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Targeting
                                        </h6>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                                                    {selectedPromoCode.type.replace('_', ' ')}
                                                </p>
                                            </div>
                                            {selectedPromoCode.courses.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Courses</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.courses.map(courseId => {
                                                            const course = allCourses.find(c => c._id === courseId);
                                                            return course ? course.title : courseId;
                                                        }).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedPromoCode.categories.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.categories.map(catId => {
                                                            const category = allCategories.find(c => c._id === catId);
                                                            return category ? category.name : catId;
                                                        }).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedPromoCode.applicableUsers.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Applicable Users</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPromoCode.applicableUsers.map(userId => {
                                                            const user = allUsers.find(u => u._id === userId);
                                                            return user ? user.name || user.email : userId;
                                                        }).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Terms & Conditions
                                        </h6>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {selectedPromoCode.terms?.map((term, index) => (
                                                <li key={index} className="text-sm text-gray-800 dark:text-white/90">
                                                    {term}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={closeModal}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
            
            {/* Edit/Create Promo Code Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {selectedPromoCode ? 'Edit Promo Code' : 'Add New Promo Code'}
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {selectedPromoCode
                                ? 'Update promo code details below'
                                : 'Create a new promo code for your customers'}
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            selectedPromoCode ? handleSavePromoCode() : handleCreatePromoCode();
                        }}
                        className="flex flex-col"
                    >
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="col-span-1">
                                        <Label>Promo Code *</Label>
                                        <Input
                                            type="text"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            placeholder="Enter promo code"
                                        />
                                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                                    </div>
                                    <div className="col-span-1">
                                        <Label>Title *</Label>
                                        <Input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Enter title"
                                        />
                                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <Label>Description</Label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                            placeholder="Enter description"
                                        />
                                    </div>
                                    <div>
                                        <Label>Discount Type *</Label>
                                        <Select
                                            // name="discountType"
                                            defaultValue={formData.discountType}
                                            options={[
                                                { value: "percentage", label: "Percentage" },
                                                { value: "fixed", label: "Fixed Amount" }
                                            ]}
                                            onChange={(value) => handleSelectChange(value, "discountType")}
                                        />
                                    </div>
                                    <div>
                                        <Label>Discount Value *</Label>
                                        <Input
                                            type="number"
                                            name="discountValue"
                                            value={formData.discountValue}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                        {errors.discountValue && <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>}
                                    </div>
                                    <div>
                                        <Label>Min Purchase</Label>
                                        <Input
                                            type="number"
                                            name="minPurchase"
                                            value={formData.minPurchase}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Max Discount</Label>
                                        <Input
                                            type="number"
                                            name="maxDiscount"
                                            value={formData.maxDiscount}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Valid From *</Label>
                                        <Input
                                            type="datetime-local"
                                            name="validFrom"
                                            value={formData.validFrom}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <Label>Valid Until *</Label>
                                        <Input
                                            type="datetime-local"
                                            name="validUntil"
                                            value={formData.validUntil}
                                            onChange={handleChange}
                                        />
                                        {errors.validUntil && <p className="mt-1 text-sm text-red-600">{errors.validUntil}</p>}
                                    </div>
                                    <div>
                                        <Label>Usage Limit</Label>
                                        <Input
                                            type="number"
                                            name="usageLimit"
                                            value={formData.usageLimit}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Max Uses Per User</Label>
                                        <Input
                                            type="number"
                                            name="maxUsesPerUser"
                                            value={formData.maxUsesPerUser}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Type *</Label>
                                        <Select
                                            name="type"
                                            defaultValue={formData.type}
                                            options={[
                                                { value: "general", label: "General" },
                                                { value: "course_specific", label: "Course Specific" },
                                                { value: "user_specific", label: "User Specific" },
                                                { value: "category_specific", label: "Category Specific" },
                                                { value: "user_course_specific", label: "User-Course Specific" }
                                            ]}
                                            onChange={(value) => handleSelectChange(value, "type")}
                                        />
                                        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                                    </div>
                                </div>
                                
                                {/* Conditional fields based on type */}
                                {formData.type === 'course_specific' || formData.type === 'user_course_specific' ? (
                                    <div>
                                        <Label>Applicable Courses</Label>
                                        <Select
                                            isMulti
                                            name="courses"
                                            defaultValue={formData.courses}
                                            options={allCourses.map(course => ({
                                                value: course._id,
                                                label: course.title
                                            }))}
                                            onChange={(value) => handleArrayChange(value, "courses")}
                                        />
                                    </div>
                                ) : null}
                                
                                {formData.type === 'category_specific' ? (
                                    <div>
                                        <Label>Applicable Categories</Label>
                                        <Select
                                            isMulti
                                            name="categories"
                                            defaultValue={formData.categories}
                                            options={allCategories.map(category => ({
                                                value: category._id,
                                                label: category.name
                                            }))}
                                            onChange={(value) => handleArrayChange(value, "categories")}
                                        />
                                    </div>
                                ) : null}
                                
                                {formData.type === 'user_specific' || formData.type === 'user_course_specific' ? (
                                    <div>
                                        <Label>Applicable Users</Label>
                                        <Select
                                            isMulti
                                            name="applicableUsers"
                                            defaultValue={formData.applicableUsers}
                                            options={allUsers.map(user => ({
                                                value: user._id,
                                                label: user.name || user.email
                                            }))}
                                            onChange={(value) => handleArrayChange(value, "applicableUsers")}
                                        />
                                    </div>
                                ) : null}
                                
                                <div>
                                    <Label>Terms & Conditions</Label>
                                    {formData.terms.map((term, index) => (
                                        <div key={index} className="flex items-center gap-2 mb-2">
                                            <Input
                                                type="text"
                                                value={term}
                                                onChange={(e) => updateTerm(index, e.target.value)}
                                                placeholder="Enter term"
                                                className="flex-1"
                                            />
                                            {formData.terms.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTerm(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addTerm}
                                        className="mt-2 text-blue-600 hover:text-blue-800"
                                    >
                                        + Add Term
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="col-span-2">
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="isFeatured"
                                                checked={formData.isFeatured}
                                                onChange={handleChange}
                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Featured Promo Code</span>
                                        </Label>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleChange}
                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Active Promo Code</span>
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <button
                                type="button"
                                onClick={() => setEditModalOpen(false)}
                                className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {selectedPromoCode ? "Save Changes" : "Create Promo Code"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedPromoCode && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Confirm Deletion
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                Are you sure you want to delete this promo code? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-2">
                            <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Warning
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>
                                                Deleting "{selectedPromoCode.title}" will permanently remove it from the system.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={deletePromoCode}
                            >
                                Delete Promo Code
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}