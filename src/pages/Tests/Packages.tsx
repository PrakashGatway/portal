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
import MultiSelect from "../../components/form/MultiSelect";

export default function PackageManagement() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allExams, setAllExams] = useState([]);
    const [allTestSeries, setAllTestSeries] = useState([]);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        isActive: "",
        search: "",
        exam: ""
    });
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        examId: "",
        testIds: [],
        price: {
            amount: 0,
            discount: 0,
            currency: "INR"
        },
        isActive: true,
        metadata: {
            bundleSize: 0,
            validityDays: 0
        }
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchPackages();
        fetchRelatedData();
    }, [filters]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy
            };
            const response = await api.get("/test/package", { params });
            setPackages(response.data?.data || []);
            setTotal(response.data?.total || 0);
        } catch (error) {
            toast.error("Failed to load packages");
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedData = async () => {
        try {
            const [examsRes, testSeriesRes] = await Promise.all([
                api.get("/test/exams"),
                api.get("/test/series")
            ]);
            setAllExams(examsRes.data?.data || []);
            setAllTestSeries(testSeriesRes.data?.data || []);
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

    const togglePackageStatus = async (packageId, currentStatus) => {
        try {
            await api.put(`/test/package/${packageId}`, { isActive: !currentStatus });
            toast.success(`Package ${currentStatus ? "deactivated" : "activated"} successfully`);
            fetchPackages();
        } catch (error) {
            console.error("Error toggling package status:", error);
            toast.error("Failed to update package status");
        }
    };

    const viewPackageDetails = (pkg) => {
        setSelectedPackage(pkg);
        openModal();
    };

    const openEditModal = (pkg) => {
        setSelectedPackage(pkg);
        setFormData({
            name: pkg.name || "",
            description: pkg.description || "",
            examId: pkg.examId || "",
            testIds: pkg.testIds || [],
            price: {
                amount: pkg.price?.amount || 0,
                discount: pkg.price?.discount || 0,
                currency: pkg.price?.currency || "INR"
            },
            isActive: pkg.isActive !== undefined ? pkg.isActive : true,
            metadata: {
                bundleSize: pkg.metadata?.bundleSize || 0,
                validityDays: pkg.metadata?.validityDays || 0
            }
        });
        setEditModalOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Package name is required';
        }
        if (formData.price.amount < 0) {
            newErrors.amount = 'Amount cannot be negative';
        }
        if (formData.price.discount < 0 || formData.price.discount > 100) {
            newErrors.discount = 'Discount must be between 0 and 100';
        }
        if (!formData.examId) {
            newErrors.examId = 'Exam is required';
        }
        if (!formData.testIds.length) {
            newErrors.testIds = 'At least one test series must be selected';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSavePackage = async () => {
        if (!validateForm()) return;
        try {
            const payload = {
                ...formData,
                price: {
                    ...formData.price,
                    amount: parseFloat(formData.price.amount),
                    discount: parseFloat(formData.price.discount),
                },
                metadata: {
                    ...formData.metadata,
                    bundleSize: parseInt(formData.metadata.bundleSize),
                    validityDays: parseInt(formData.metadata.validityDays)
                }
            };
            await api.put(`/test/package/${selectedPackage._id}`, payload);
            toast.success("Package updated successfully");
            fetchPackages();
            setEditModalOpen(false);
        } catch (error) {
            console.error("Error saving package:", error);
            toast.error(error.message || "Failed to save package");
        }
    };

    const handleCreatePackage = async () => {
        if (!validateForm()) return;
        try {
            const payload = {
                ...formData,
                price: {
                    ...formData.price,
                    amount: parseFloat(formData.price.amount),
                    discount: parseFloat(formData.price.discount),
                },
                metadata: {
                    ...formData.metadata,
                    bundleSize: parseInt(formData.metadata.bundleSize),
                    validityDays: parseInt(formData.metadata.validityDays)
                }
            };
            await api.post("/test/package", payload);
            toast.success("Package created successfully");
            fetchPackages();
            setEditModalOpen(false);
        } catch (error) {
            console.error("Error creating package:", error);
            toast.error(error.message || "Failed to create package");
        }
    };

    const deletePackage = async () => {
        if (!selectedPackage) return;
        try {
            await api.delete(`/test/package/${selectedPackage._id}`);
            toast.success("Package deleted successfully");
            fetchPackages();
            setDeleteModalOpen(false);
            setSelectedPackage(null);
        } catch (error) {
            console.error("Error deleting package:", error);
            toast.error(error.message || "Failed to delete package");
        }
    };

    const openCreateModal = () => {
        setSelectedPackage(null);
        setFormData({
            name: "",
            description: "",
            examId: "",
            testIds: [],
            price: {
                amount: 0,
                discount: 0,
                currency: "INR"
            },
            isActive: true,
            metadata: {
                bundleSize: 0,
                validityDays: 0
            }
        });
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('price.') || name.startsWith('metadata.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (value, name) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleArrayChange = (value, name) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const formatPrice = (pkg) => {
        const { amount, discount, currency } = pkg.price;
        const finalAmount = discount ? amount * (1 - discount / 100) : amount;
        return `${currency} ${finalAmount.toFixed(2)} ${discount ? `(Disc. ${discount}%)` : ''}`;
    };

    const getExamName = (examId) => {
        const exam = allExams.find(e => e._id === examId);
        return exam ? exam.name : examId;
    };

    const getTestNames = (testIds) => {
        return testIds?.map(id => {
            const test = allTestSeries.find(t => t._id === id);
            return test ? test.title : id;
        }).join(', ');
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
                                Package Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your course packages
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {packages.length} packages
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
                            Add Package
                        </button>
                    </div>
                </div>
            </div>
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                {/* Filters Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Name, Description)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search packages..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Exam
                        </label>
                        <select
                            name="exam"
                            value={filters.exam}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Exams</option>
                            {allExams.map(exam => (
                                <option key={exam._id} value={exam._id}>{exam.name}</option>
                            ))}
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
                                search: "",
                                exam: ""
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
                {/* Packages Table */}
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
                                        Name
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Exam
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Price
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Bundle Size
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Validity
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
                                {packages?.length > 0 ? (
                                    packages.map((pkg) => (
                                        <tr key={pkg._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {pkg.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                    {pkg.description}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {getExamName(pkg.examId)}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {formatPrice(pkg)}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {pkg.metadata?.bundleSize || 0} Tests
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {pkg.metadata?.validityDays || 0} Days
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <span
                                                    onClick={() => togglePackageStatus(pkg._id, pkg.isActive)}
                                                    className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${pkg.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                        }`}
                                                >
                                                    {pkg.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {moment(pkg.createdAt).format("MMM D, YYYY")}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => viewPackageDetails(pkg)}
                                                        className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(pkg)}
                                                        className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedPackage(pkg); setDeleteModalOpen(true); }}
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
                                            colSpan={8}
                                            className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                                        >
                                            No packages found matching your criteria
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

            {/* Package Details Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Package Details
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Detailed information about this package
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            {selectedPackage && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Basic Information
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.description}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Exam</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {getExamName(selectedPackage.examId)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Pricing
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Base Price</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.price.currency} {selectedPackage.price.amount.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Discount (%)</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.price.discount}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Final Price</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {formatPrice(selectedPackage)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Metadata
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Bundle Size</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.metadata?.bundleSize || 0} Tests
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Validity (Days)</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.metadata?.validityDays || 0} Days
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Status
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedPackage.isActive ? "Yes" : "No"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {moment(selectedPackage.createdAt).format("MMM D, YYYY h:mm A")}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Updated At</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {moment(selectedPackage.updatedAt).format("MMM D, YYYY h:mm A")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Included Test Series
                                        </h6>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {getTestNames(selectedPackage?.testIds)?.split(', ').map((test, index) => (
                                                <li key={index} className="text-sm text-gray-800 dark:text-white/90">
                                                    {test}
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

            {/* Edit/Create Package Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {selectedPackage ? 'Edit Package' : 'Add New Package'}
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {selectedPackage
                                ? 'Update package details below'
                                : 'Create a new package for your customers'}
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            selectedPackage ? handleSavePackage() : handleCreatePackage();
                        }}
                        className="flex flex-col"
                    >
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="col-span-2">
                                        <Label>Name *</Label>
                                        <Input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Enter package name"
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
                                    <div className="col-span-1">
                                        <Label>Exam *</Label>
                                        <Select
                                            name="examId"
                                            defaultValue={formData.examId}
                                            options={allExams.map(exam => ({
                                                value: exam._id,
                                                label: exam.name
                                            }))}
                                            onChange={(value) => handleSelectChange(value, "examId")}
                                        />
                                        {errors.examId && <p className="mt-1 text-sm text-red-600">{errors.examId}</p>}
                                    </div>
                                    <div className="col-span-1">
                                        <Label>Base Price *</Label>
                                        <Input
                                            type="number"
                                            name="price.amount"
                                            value={formData.price.amount}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                        />
                                        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                                    </div>
                                    <div className="col-span-1">
                                        <Label>Discount (%)</Label>
                                        <Input
                                            type="number"
                                            name="price.discount"
                                            value={formData.price.discount}
                                            onChange={handleChange}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                        {errors.discount && <p className="mt-1 text-sm text-red-600">{errors.discount}</p>}
                                    </div>
                                    <div className="col-span-1">
                                        <Label>Bundle Size</Label>
                                        <Input
                                            type="number"
                                            name="metadata.bundleSize"
                                            value={formData.metadata.bundleSize}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Label>Validity (Days)</Label>
                                        <Input
                                            type="number"
                                            name="metadata.validityDays"
                                            value={formData.metadata.validityDays}
                                            onChange={handleChange}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Included Test Series *</Label>
                                    <MultiSelect
                                        name="testIds"
                                        defaultValue={formData.testIds}
                                        options={allTestSeries.map(test => ({
                                            value: test._id,
                                            text: test.title
                                        }))}
                                        onChange={(value) => handleArrayChange(value, "testIds")}
                                    />
                                    {errors.testIds && <p className="mt-1 text-sm text-red-600">{errors.testIds}</p>}
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="col-span-2">
                                        <Label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleChange}
                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Active Package</span>
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
                                {selectedPackage ? "Save Changes" : "Create Package"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedPackage && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Confirm Deletion
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                Are you sure you want to delete this package? This action cannot be undone.
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
                                                Deleting "{selectedPackage.name}" will permanently remove it from the system.
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
                                onClick={deletePackage}
                            >
                                Delete Package
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}