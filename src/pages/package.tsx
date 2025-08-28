import { useState, useEffect } from "react";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal/index";
import Button from "../components/ui/button/Button";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { CSVLink } from "react-csv";

const CommissionPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        order: -1,
        search: "",
        isActive: ""
    });

    // Modal states
    const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
    const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const [currentPackage, setCurrentPackage] = useState(null);
    const [formData, setFormData] = useState({
        packageName: "",
        packageInfo: "",
        isActive: true,
        payInCharges: {
            limit: 0,
            lowerOrEqual: {
                chargeType: "percentage",
                chargeValue: 0
            },
            higher: {
                chargeType: "percentage",
                chargeValue: 0
            }
        },
        payOutCharges: {
            limit: 0,
            lowerOrEqual: {
                chargeType: "percentage",
                chargeValue: 0
            },
            higher: {
                chargeType: "percentage",
                chargeValue: 0
            }
        }
    });

    useEffect(() => {
        fetchPackages();
    }, [filters]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                exportCsv: false
            };

            const response = await api.get("/package", { params });
            setPackages(response.data.data);
            setTotal(response.data?.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching packages:", error);
            toast.error("Failed to fetch packages");
        } finally {
            setLoading(false);
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

    const handleSort = (column) => {
        setFilters(prev => ({
            ...prev,
            sortBy: column,
            order: prev.sortBy === column ? prev.order * -1 : -1,
            page: 1
        }));
    };

    const renderSortIcon = (column) => {
        if (filters.sortBy !== column) return null;
        return filters.order === -1 ? "▼" : "▲";
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            sortBy: "createdAt",
            order: -1,
            search: "",
            isActive: ""
        });
    };

    const prepareAddPackage = () => {
        setFormData({
            packageName: "",
            packageInfo: "",
            isActive: true,
            payInCharges: {
                limit: 0,
                lowerOrEqual: {
                    chargeType: "percentage",
                    chargeValue: 0
                },
                higher: {
                    chargeType: "percentage",
                    chargeValue: 0
                }
            },
            payOutCharges: {
                limit: 0,
                lowerOrEqual: {
                    chargeType: "percentage",
                    chargeValue: 0
                },
                higher: {
                    chargeType: "percentage",
                    chargeValue: 0
                }
            }
        });
        openAddModal();
    };

    const prepareEditPackage = (pkg) => {
        setCurrentPackage(pkg);
        setFormData({
            packageName: pkg.packageName,
            packageInfo: pkg.packageInfo,
            isActive: pkg.isActive,
            payInCharges: pkg.payInCharges,
            payOutCharges: pkg.payOutCharges
        });
        openEditModal();
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const keys = name.split('.');
            setFormData(prev => {
                const newData = { ...prev };
                let current = newData;

                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }

                current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
                return newData;
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentPackage) {
                // Update existing package
                await api.post(`/package`, formData);
                toast.success("Package updated successfully");
            } else {
                // Create new package
                await api.post("/package", formData);
                toast.success("Package created successfully");
            }
            fetchPackages();
            currentPackage ? closeEditModal() : closeAddModal();
        } catch (error) {
            console.error("Error saving package:", error);
            toast.error(error.message || "Failed to save package");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this package?")) return;

        try {
            await api.delete(`/commission-packages/${id}`);
            toast.success("Package deleted successfully");
            fetchPackages();
        } catch (error) {
            console.error("Error deleting package:", error);
            toast.error("Failed to delete package");
        }
    };

    const handleExportCSV = async () => {
        try {
            toast.success("Preparing CSV...");

            const params = {
                ...filters,
                exportCsv: true
            };

            const response = await api.get("/package", {
                params,
                responseType: "blob"
            });

            const filename = `commission-packages-${new Date().toISOString().slice(0, 10)}.csv`;
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("CSV exported successfully!");
        } catch (error) {
            console.error("Failed to export CSV:", error);
            toast.error("Failed to export CSV.");
        }
    };

    return (
        <div>
            <PageMeta
                title="Commission Packages | Your App Name"
                description="Manage commission packages"
            />
            <PageBreadcrumb pageTitle="Commission Packages" />

            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                {/* Filters Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {/* Search Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search Packages
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search package names..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Status Filter */}
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
                </div>

                {/* Actions Section */}
                <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={resetFilters}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            Reset Filters
                        </button>
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
                    <div className="flex space-x-2">
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                        >
                            Export to CSV
                        </button>
                        <button
                            onClick={prepareAddPackage}
                            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-800"
                        >
                            Add New Package
                        </button>
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
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                                        onClick={() => handleSort("packageName")}
                                    >
                                        Package Name {renderSortIcon("packageName")}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                    >
                                        Description
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                                        onClick={() => handleSort("isActive")}
                                    >
                                        Status {renderSortIcon("isActive")}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                    >
                                        Pay-In Charges
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                    >
                                        Pay-Out Charges
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 cursor-pointer"
                                        onClick={() => handleSort("createdAt")}
                                    >
                                        Created {renderSortIcon("createdAt")}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {packages.length > 0 ? (
                                    packages.map((pkg) => (
                                        <tr key={pkg._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {pkg.packageName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {pkg.packageInfo || "N/A"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${pkg.isActive
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                        }`}
                                                >
                                                    {pkg.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {pkg.payInCharges.limit} : {pkg.payInCharges.lowerOrEqual.chargeValue}
                                                {pkg.payInCharges.lowerOrEqual.chargeType === "percentage" ? "%" : "₹"}<br />
                                                {pkg.payInCharges.limit} : {pkg.payInCharges.higher.chargeValue}
                                                {pkg.payInCharges.higher.chargeType === "percentage" ? "%" : "₹"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {pkg.payOutCharges.limit} : {pkg.payOutCharges.lowerOrEqual.chargeValue}
                                                {pkg.payOutCharges.lowerOrEqual.chargeType === "percentage" ? "%" : "₹"}<br />
                                                {pkg.payOutCharges.limit} : {pkg.payOutCharges.higher.chargeValue}
                                                {pkg.payOutCharges.higher.chargeType === "percentage" ? "%" : "₹"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {new Date(pkg.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                <button
                                                    onClick={() => prepareEditPackage(pkg)}
                                                    className="mr-3 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pkg._id)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
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

            {/* Add Package Modal */}
            <Modal isOpen={isAddModalOpen} onClose={closeAddModal} className="max-w-3xl">
                <PackageForm
                    formData={formData}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleSubmit}
                    onClose={closeAddModal}
                    isEditing={false}
                />
            </Modal>

            {/* Edit Package Modal */}
            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-3xl">
                <PackageForm
                    formData={formData}
                    handleFormChange={handleFormChange}
                    handleSubmit={handleSubmit}
                    onClose={closeEditModal}
                    isEditing={true}
                />
            </Modal>
        </div>
    );
};

// Package Form Component
const PackageForm = ({ formData, handleFormChange, handleSubmit, onClose, isEditing }) => {
    return (
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                    {isEditing ? "Edit Commission Package" : "Add New Commission Package"}
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                    {isEditing ? "Update the package details" : "Fill in the details for the new commission package"}
                </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="custom-scrollbar h-[calc(100vh-200px)] overflow-y-auto px-2 pb-3">
                    <div className="mt-7">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                            <div className="col-span-2 lg:col-span-1">
                                <Label>Package Name*</Label>
                                <Input
                                    type="text"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleFormChange}
                                    required
                                    disabled={isEditing}
                                />
                            </div>

                            <div className="col-span-2 lg:col-span-1">
                                <Label>Status</Label>
                                <div className="mt-2">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleFormChange}
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-800"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            Active Package
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <Label>Package Description</Label>
                                <textarea
                                    name="packageInfo"
                                    value={formData.packageInfo}
                                    onChange={handleFormChange}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Pay-In Charges Section */}
                            <div className="col-span-2">
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                        Pay-In Charges Configuration
                                    </h5>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Limit Amount*</Label>
                                            <Input
                                                type="number"
                                                name="payInCharges.limit"
                                                value={formData.payInCharges.limit}
                                                onChange={handleFormChange}
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <h6 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                For Amount ≤ {formData.payInCharges.limit || 0}
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Charge Type*</Label>
                                                    <select
                                                        name="payInCharges.lowerOrEqual.chargeType"
                                                        value={formData.payInCharges.lowerOrEqual.chargeType}
                                                        onChange={handleFormChange}
                                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    >
                                                        <option value="percentage">Percentage</option>
                                                        <option value="flat">Flat Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label>Charge Value*</Label>
                                                    <Input
                                                        type="number"
                                                        name="payInCharges.lowerOrEqual.chargeValue"
                                                        value={formData.payInCharges.lowerOrEqual.chargeValue}
                                                        onChange={handleFormChange}
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <h6 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                For Amount  {formData.payInCharges.limit || 0}
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Charge Type*</Label>
                                                    <select
                                                        name="payInCharges.higher.chargeType"
                                                        value={formData.payInCharges.higher.chargeType}
                                                        onChange={handleFormChange}
                                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    >
                                                        <option value="percentage">Percentage</option>
                                                        <option value="flat">Flat Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label>Charge Value*</Label>
                                                    <Input
                                                        type="number"
                                                        name="payInCharges.higher.chargeValue"
                                                        value={formData.payInCharges.higher.chargeValue}
                                                        onChange={handleFormChange}
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pay-Out Charges Section */}
                            <div className="col-span-2">
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                                        Pay-Out Charges Configuration
                                    </h5>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Limit Amount*</Label>
                                            <Input
                                                type="number"
                                                name="payOutCharges.limit"
                                                value={formData.payOutCharges.limit}
                                                onChange={handleFormChange}
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <h6 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                For Amount ≤ {formData.payOutCharges.limit || 0}
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Charge Type*</Label>
                                                    <select
                                                        name="payOutCharges.lowerOrEqual.chargeType"
                                                        value={formData.payOutCharges.lowerOrEqual.chargeType}
                                                        onChange={handleFormChange}
                                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    >
                                                        <option value="percentage">Percentage</option>
                                                        <option value="flat">Flat Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label>Charge Value*</Label>
                                                    <Input
                                                        type="number"
                                                        name="payOutCharges.lowerOrEqual.chargeValue"
                                                        value={formData.payOutCharges.lowerOrEqual.chargeValue}
                                                        onChange={handleFormChange}
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <h6 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                For Amount  {formData.payOutCharges.limit || 0}
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label>Charge Type*</Label>
                                                    <select
                                                        name="payOutCharges.higher.chargeType"
                                                        value={formData.payOutCharges.higher.chargeType}
                                                        onChange={handleFormChange}
                                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                        required
                                                    >
                                                        <option value="percentage">Percentage</option>
                                                        <option value="flat">Flat Amount</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label>Charge Value*</Label>
                                                    <Input
                                                        type="number"
                                                        name="payOutCharges.higher.chargeValue"
                                                        value={formData.payOutCharges.higher.chargeValue}
                                                        onChange={handleFormChange}
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        type="submit"
                    >
                        {isEditing ? "Update Package" : "Create Package"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CommissionPackages;