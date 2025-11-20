// src/pages/admin/PagesManagement.js
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import api from "../../axiosInstance";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import DynamicFormFields from "../../components/DynamicFields";
import { PAGE_TYPES_SCHEMA } from "../../utils/pageSchema";

const PagesManagement = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: "",
        status: "",
        pageType: "",
    });

    const { isOpen, openModal, closeModal } = useModal();
    const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const [selectedPage, setSelectedPage] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        subTitle: "",
        slug: "",
        pageType: "",
        metaTitle: "",
        metaDescription: "",
        keywords: "",
        canonicalUrl: "",
        status: "draft",
        isFeatured: false,
        tags: "",
        sections: [],
        pageContent: {},
    });
    const [formErrors, setFormErrors] = useState({});
    useEffect(() => {
        fetchPages();
    }, [filters]);

    const prepareDeleteEntity = (entity) => {
        setSelectedPage(entity);
        openDeleteModal();
    };

    const deleteEntity = async () => {
        if (!selectedPage) return;
        try {
            await api.delete(`/page/${selectedPage._id}`);
            toast.success("Page deleted successfully");
            fetchPages();
            closeDeleteModal();
        } catch (error) {
            console.error("Error deleting page:", error);
            toast.error(error.message || "Failed to delete page");
        }
    };


    const fetchPages = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/page", { params: filters });
            setPages(data.data);
            setTotal(data.pagination?.totalItems || data.data.length);
        } catch (error) {
            toast.error(error.message || "Failed to fetch pages");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleTagsChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value ? value.split(",").map((tag) => tag) : [],
        }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.title) errors.title = "Title is required";
        if (!formData.slug) errors.slug = "Slug is required";
        if (!formData.pageType) errors.pageType = "Page Type is required";
        else {
            const schema = PAGE_TYPES_SCHEMA[formData.pageType];
            if (schema) {
                schema.fields.forEach((field) => {
                    if (field.required && !formData[field.name]) {
                        errors[field.name] = `${field.label} is required`;
                    }
                });
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            ...formData,
            keywords: Array.isArray(formData.keywords) ? formData.keywords : formData.keywords?.split(",").map(t => t.trim()) || [],
            tags: Array.isArray(formData.tags) ? formData.tags : formData.tags?.split(",").map(t => t.trim()) || [],
        };

        try {
            setLoading(true);
            if (selectedPage) {
                await api.put(`/page/${selectedPage._id}`, payload);
                toast.success("Page updated successfully");
            } else {
                await api.post("/page", payload);
                toast.success("Page created successfully");
            }
            closeModal();
            fetchPages();
        } catch (error) {
            toast.error(error.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setSelectedPage(null);
        setFormData({
            title: "",
            subTitle: "",
            slug: "",
            pageType: "",
            metaTitle: "",
            metaDescription: "",
            keywords: "",
            canonicalUrl: "",
            status: "draft",
            isFeatured: false,
            tags: "",
            sections: [],
            pageContent: {},
        });
        setFormErrors({});
        openModal();
    };

    const openEditModal = (page) => {
        setSelectedPage(page);
        setFormData({
            title: page.title || "",
            subTitle: page.subTitle || "",
            slug: page.slug || "",
            pageType: page.pageType || "",
            metaTitle: page.metaTitle || "",
            metaDescription: page.metaDescription || "",
            keywords: Array.isArray(page.keywords) ? page.keywords.join(", ") : "",
            canonicalUrl: page.canonicalUrl || "",
            status: page.status || "draft",
            isFeatured: page.isFeatured || false,
            tags: Array.isArray(page.tags) ? page.tags.join(", ") : "",
            sections: Array.isArray(page.sections) ? [...page.sections] : [],
            pageContent: { ...(page.pageContent || {}) },
        });
        setFormErrors({});
        openModal();
    };

    return (
        <div>
            <PageMeta title="Pages | Admin Dashboard" description="Manage website pages" />
            <PageBreadcrumb pageTitle="Manage Pages" />


            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-4 lg:px-4">
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search
                        </Label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search by title, slug..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </Label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    <div>
                        <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Page Type
                        </Label>
                        <select
                            name="pageType"
                            value={filters.pageType}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Select Type</option>
                            {Object.keys(PAGE_TYPES_SCHEMA).map((key) => (
                                <option key={key} value={key}>
                                    {PAGE_TYPES_SCHEMA[key].label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                    <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Per page:
                        </Label>
                        <select
                            name="limit"
                            value={filters.limit}
                            onChange={handleFilterChange}
                            className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>

                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Add New Page
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">Type</th>
                                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">Slug</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">Featured</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300 sm:px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {pages.length > 0 ? (
                                    pages.map((page) => (
                                        <tr key={page._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-1 py-4 text-sm font-medium text-gray-900 dark:text-white sm:px-6">
                                                {page.title.split(' ').slice(0, 4).join(" ")}....
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:px-6">
                                                {page.pageType}
                                            </td>
                                            <td className="hidden md:table-cell whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:px-6 truncate max-w-xs">
                                                /{page.slug}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:px-6">
                                                <button
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${page.status === "published"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        }`}
                                                >
                                                    {page.status}
                                                </button>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:px-6">
                                                {page.isFeatured ? (
                                                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    "No"
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium sm:px-6 flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(page)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => prepareDeleteEntity(page)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No pages found.
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
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page === 1
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700"
                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white"
                                    }`}
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => i + 1)
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
                                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page * filters.limit >= total}
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page * filters.limit >= total
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700"
                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white"
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} isFullscreen className="">
                <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11 lg:py-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                {selectedPage ? "Edit" : "Add"} Page Information
                            </h4>
                            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400 lg:mb-5">
                                Update your details to keep your Page up-to-date.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col">
                            <div className="custom-scrollbar h-[75vh] overflow-y-auto px-2 pb-3">
                                <div className="mt-2">
                                    <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                                        Basic Information
                                    </h5>
                                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                        <div>
                                            <Label>Page Type *</Label>
                                            <select
                                                name="pageType"
                                                value={formData.pageType}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="">Select Type</option>
                                                {Object.keys(PAGE_TYPES_SCHEMA).map((key) => (
                                                    <option key={key} value={key}>
                                                        {PAGE_TYPES_SCHEMA[key].label}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.pageType && <p className="text-red-600 text-sm">{formErrors.pageType}</p>}
                                        </div>

                                        <div>
                                            <Label>Title *</Label>
                                            <Input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="w-full border rounded p-2"
                                            />
                                            {formErrors.title && <p className="text-red-600 text-sm">{formErrors.title}</p>}
                                        </div>
                                        <div>
                                            <Label>Sub Title *</Label>
                                            <Input
                                                type="text"
                                                name="subTitle"
                                                value={formData.subTitle}
                                                onChange={handleInputChange}
                                                className="w-full border rounded p-2"
                                            />
                                        </div>
                                        <div>
                                            <Label>Slug *</Label>
                                            <Input
                                                type="text"
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                className="w-full border rounded p-2"
                                            />
                                            {formErrors.slug && <p className="text-red-600 text-sm">{formErrors.slug}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <Label>Meta Title</Label>
                                            <Input
                                                type="text"
                                                name="metaTitle"
                                                value={formData.metaTitle}
                                                onChange={handleInputChange}
                                                className="w-full border rounded p-2"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Meta Description</Label>
                                            <Input
                                                type="text"
                                                name="metaDescription"
                                                value={formData.metaDescription}
                                                onChange={handleInputChange}
                                                className="w-full border rounded p-2"
                                            />
                                        </div>

                                        <div>
                                            <Label>Status</Label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>isFeatured</Label>
                                            <select
                                                name="isFeatured"
                                                value={formData.isFeatured}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            >
                                                <option value="false">No</option>
                                                <option value="true">Yes</option>
                                            </select>
                                        </div>
                                    </div>
                                    <DynamicFormFields formData={formData} setFormData={setFormData} pageType={formData.pageType} />
                                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                        <div>
                                            <Label>Keywords (comma-separated)</Label>
                                            <Input
                                                type="text"
                                                name="keywords"
                                                value={formData.keywords}
                                                onChange={handleTagsChange}
                                                placeholder="seo, marketing"
                                                className="w-full border rounded p-2"
                                            />
                                        </div>
                                        <div>
                                            <Label>Tags (comma-separated)</Label>
                                            <Input
                                                type="text"
                                                name="tags"
                                                value={formData.tags}
                                                onChange={handleTagsChange}
                                                placeholder="blog, featured"
                                                className="w-full border rounded p-2"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>Canonical URL</Label>
                                            <Input
                                                type="url"
                                                name="canonicalUrl"
                                                value={formData.canonicalUrl}
                                                onChange={handleInputChange}
                                                className="w-full border rounded p-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-3">
                                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                                <Button type="submit" loading={loading}>Save Page</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-lg">
                {selectedPage && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Confirm Deletion
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                Are you sure you want to delete this entity? This action cannot be undone.
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
                                                Deleting "{selectedPage.title}" will permanently remove it from the system.
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
                                onClick={closeDeleteModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={deleteEntity}
                            >
                                Delete Entity
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PagesManagement;