import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal/index";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import api from "../../axiosInstance";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import Input from "../../components/form//input/InputField";

const EntityManagement = () => {
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sort: "-createdAt",
        search: "",
        type: "",
        country: ""
    });
    const [countries, setCountries] = useState(["uk", "usa", "ca"]);
    const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
    const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const [currentEntity, setCurrentEntity] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        subTitle: "",
        type: "",
        description: "",
        country: "",
        city: "",
        logo: "",
        duration: "",
        keyFeatures: [],
        slug: "",
        studentCount: 0,
        rating: 0,
        icon:''
    });
    const [newFeature, setNewFeature] = useState("");

    useEffect(() => {
        fetchEntities();
    }, [filters]);

    const fetchEntities = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters
            };
            const response = await api.get("/entities", { params });
            setEntities(response.data?.data || []);
            setTotal(response.data?.pagination?.totalItems || 0);
        } catch (error) {
            console.error("Error fetching entities:", error);
            toast.error("Failed to fetch entities");
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

    const prepareAddEntity = () => {
        setFormData({
            title: "",
            subTitle: "",
            type: "",
            description: "",
            country: "",
            city: "",
            logo: "",
            duration: "",
            keyFeatures: [],
            slug: "",
            studentCount: 0,
            rating: 0
        });
        setNewFeature("");
        openAddModal();
    };

    const prepareEditEntity = (entity) => {
        setCurrentEntity(entity);
        setFormData({
            title: entity.title,
            subTitle: entity.subTitle,
            type: entity.type,
            description: entity.description || "",
            country: entity.country || "",
            city: entity.city || "",
            logo: entity.logo || "",
            duration: entity.duration || "",
            keyFeatures: entity.keyFeatures || [],
            slug: entity.slug || "",
            studentCount: entity.studentCount || 0,
            rating: entity.rating || 0
        });
        setNewFeature("");
        openEditModal();
    };

    const prepareDeleteEntity = (entity) => {
        setCurrentEntity(entity);
        openDeleteModal();
    };

    const handleFormChange = (e) => {
        const { name, type, value, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "file" ? files[0] : value, // 👈 handle file input
        }));
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                keyFeatures: [...prev.keyFeatures, newFeature.trim()]
            }));
            setNewFeature("");
        }
    };

    const removeFeature = (index) => {
        setFormData(prev => ({
            ...prev,
            keyFeatures: prev.keyFeatures.filter((_, i) => i !== index)
        }));
    };

    const createEntity = async () => {
        if (!formData.title) return toast.error("Title is required");
        if (!formData.subTitle) return toast.error("Subtitle is required");
        if (!formData.slug) return toast.error("Slug is required");
        if (!formData.type) return toast.error("Page Type is required");

        let logo = null;

        if (formData.logo) {
            const logoData = new FormData();
            logoData.append("image", formData.logo);
            const uploadRes = await api.post("/upload/single", logoData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            logo = uploadRes.data?.file?.filename; // backend should return uploaded file URL
        }

        try {
            await api.post("/entities", { ...formData, logo: logo });
            toast.success("Entity created successfully");
            fetchEntities();
            closeAddModal();
        } catch (error) {
            toast.error(error.error || "Failed to create entity");
        }
    };

    const updateEntity = async () => {
        if (!currentEntity) return;
        try {
            await api.put(`/entities/${currentEntity._id}`, formData);
            toast.success("Entity updated successfully");
            fetchEntities();
            closeEditModal();
        } catch (error) {
            console.error("Error updating entity:", error);
            toast.error(error.response?.data?.message || "Failed to update entity");
        }
    };

    const deleteEntity = async () => {
        if (!currentEntity) return;

        try {
            await api.delete(`/entities/${currentEntity._id}`);
            toast.success("Entity deleted successfully");
            fetchEntities();
            closeDeleteModal();
        } catch (error) {
            console.error("Error deleting entity:", error);
            toast.error(error.response?.data?.message || "Failed to delete entity");
        }
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            sort: "-createdAt",
            search: "",
            type: "",
            country: ""
        });
    };

    return (
        <div>
            <PageMeta
                title="Entity Management | Your App Name"
                description="Manage universities and courses"
            />
            <PageBreadcrumb pageTitle="Entity Management" />

            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                {/* Filters Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {/* Search Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search entities..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* Type Filter */}
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
                            <option value="university">University</option>
                            <option value="course">Course</option>
                        </select>
                    </div>

                    {/* Country Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country
                        </label>
                        <select
                            name="country"
                            value={filters.country}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Countries</option>
                            {countries.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sort By
                        </label>
                        <select
                            name="sort"
                            value={filters.sort}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="-createdAt">Newest First</option>
                            <option value="createdAt">Oldest First</option>
                            <option value="title">Title A-Z</option>
                            <option value="-title">Title Z-A</option>
                            <option value="rating">Rating Low-High</option>
                            <option value="-rating">Rating High-Low</option>
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
                    <button
                        onClick={prepareAddEntity}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                    >
                        Add New Entity
                    </button>
                </div>

                {/* Entities Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Country
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Students
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {entities.length > 0 ? (
                                    entities.map((entity) => (
                                        <tr key={entity._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {entity.title.split(' ').slice(0, 3).join(' ')}...
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-300">
                                                        {entity.subTitle.split(' ').slice(0, 3).join(' ')}...
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${entity.type === 'university'
                                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                        }`}
                                                >
                                                    {entity.type}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {entity.country || "N/A"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {entity.studentCount}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                <div className="flex items-center">
                                                    <span className="mr-1">{entity.rating}</span>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg
                                                                key={i}
                                                                className={`h-4 w-4 ${i < Math.floor(entity.rating)
                                                                    ? "text-yellow-400"
                                                                    : "text-gray-300"
                                                                    }`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                <button
                                                    onClick={() => prepareEditEntity(entity)}
                                                    className="mr-3 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => prepareDeleteEntity(entity)}
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
                                            colSpan={6}
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                                        >
                                            No entities found matching your criteria
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

            {/* Add Entity Modal */}
            <Modal isOpen={isAddModalOpen} onClose={closeAddModal} className="max-w-3xl">
                <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Add New Entity
                        </h4>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                            Create a new university or course
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="custom-scrollbar overflow-y-auto px-2 pb-3 max-h-[70vh]">
                            <div className="mt-2 space-y-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Title *</Label>
                                        <Input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div>
                                        <Label>Subtitle *</Label>
                                        <Input
                                            type="text"
                                            name="subTitle"
                                            value={formData.subTitle}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Type *</Label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleFormChange}
                                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="university">University</option>
                                            <option value="course">Course</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Slug</Label>
                                        <Input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div>
                                        <Label>Icon</Label>
                                        <Input
                                            type="text"
                                            name="icon"
                                            value={formData.icon}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Description</Label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Country</Label>
                                        <Input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div>
                                        <Label>City</Label>
                                        <Input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                                    <div>
                                        <Label>Logo URL</Label>
                                        <Input
                                            type="file"
                                            name="logo"
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Duration</Label>
                                        <Input
                                            type="text"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleFormChange}
                                            placeholder="e.g., 4 years, 6 months"
                                        />
                                    </div>
                                    <div>
                                        <Label>Student Count</Label>
                                        <Input
                                            type="number"
                                            name="studentCount"
                                            value={formData.studentCount}
                                            onChange={handleFormChange}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <Label>Rating</Label>
                                        <Input
                                            type="number"
                                            name="rating"
                                            value={formData.rating}
                                            onChange={handleFormChange}
                                            min="0"
                                            max="5"
                                            step="0.1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Key Features</Label>
                                    <div className="flex">
                                        <Input
                                            type="text"
                                            value={newFeature}
                                            onChange={(e) => setNewFeature(e.target.value)}
                                            placeholder="Add a feature"
                                            className="rounded-r-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={addFeature}
                                            className="rounded-md rounded-l-none border border-l-0 border-gray-300 bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {formData.keyFeatures.length > 0 && (
                                        <ul className="mt-2 space-y-1">
                                            {formData.keyFeatures.map((feature, index) => (
                                                <li key={index} className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                                                    <span>{feature}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFeature(index)}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        Remove
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={closeAddModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    createEntity();
                                }}
                            >
                                Create Entity
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Entity Modal */}
            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-3xl">
                {currentEntity && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Edit Entity
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                Update entity details
                            </p>
                        </div>
                        <form className="flex flex-col">
                            <div className="custom-scrollbar overflow-y-auto px-2 pb-3 max-h-[60vh]">
                                <div className="mt-4 space-y-5">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Title *</Label>
                                            <Input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleFormChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Subtitle *</Label>
                                            <Input
                                                type="text"
                                                name="subTitle"
                                                value={formData.subTitle}
                                                onChange={handleFormChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Type *</Label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleFormChange}
                                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                required
                                            >
                                                <option value="">Select Type</option>
                                                <option value="university">University</option>
                                                <option value="course">Course</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Slug</Label>
                                            <Input
                                                type="text"
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                        <div>
                                            <Label>Icon</Label>
                                            <Input
                                                type="text"
                                                name="icon"
                                                value={formData.icon}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleFormChange}
                                            rows={3}
                                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Country</Label>
                                            <Input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                        <div>
                                            <Label>City</Label>
                                            <Input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Logo URL</Label>
                                            <Input
                                                type="file"
                                                name="logo"
                                                onChange={handleFormChange}
                                            />
                                        </div>
                                        <div>
                                            <Label>Duration</Label>
                                            <Input
                                                type="text"
                                                name="duration"
                                                value={formData.duration}
                                                onChange={handleFormChange}
                                                placeholder="e.g., 4 years, 6 months"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Student Count</Label>
                                            <Input
                                                type="number"
                                                name="studentCount"
                                                value={formData.studentCount}
                                                onChange={handleFormChange}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label>Rating</Label>
                                            <Input
                                                type="number"
                                                name="rating"
                                                value={formData.rating}
                                                onChange={handleFormChange}
                                                min="0"
                                                max="5"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Key Features</Label>
                                        <div className="flex">
                                            <Input
                                                type="text"
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                placeholder="Add a feature"
                                                className="rounded-r-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={addFeature}
                                                className="rounded-md rounded-l-none border border-l-0 border-gray-300 bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {formData.keyFeatures.length > 0 && (
                                            <ul className="mt-2 space-y-1">
                                                {formData.keyFeatures.map((feature, index) => (
                                                    <li key={index} className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                                                        <span>{feature}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFeature(index)}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            Remove
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={closeEditModal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        updateEntity();
                                    }}
                                >
                                    Update Entity
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} className="max-w-lg">
                {currentEntity && (
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
                                                Deleting "{currentEntity.title}" will permanently remove it from the system.
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

export default EntityManagement;