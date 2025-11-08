// pages/admin/ArticleManagement.jsx
import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2 } from "lucide-react";
import RichTextEditor from "../../components/TextEditor";

export default function ArticleManagement() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allCategories, setAllCategories] = useState([]);

    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        status: "",
        category: "",
        search: "",
    });

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        description: "",
        content: "",
        coverImage: "",
        category: "",
        meta: {
            keywords: [],
            metaDescription: "",
        },
        status: true,
    });

    const [errors, setErrors] = useState({});
    const [coverImageFile, setCoverImageFile] = useState(null); // For the file upload
    const [coverImagePreview, setCoverImagePreview] = useState(''); // For image preview

    useEffect(() => {
        fetchArticles();
        fetchCategories();
    }, [filters]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            const response = await api.get("/web/blog?from=admin", { params });
            setArticles(response.data?.data || []);
            setTotal(response.data?.total || 0);
        } catch (error) {
            toast.error("Failed to load articles");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/web/cat?isActive=true");
            setAllCategories(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load categories");
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({ ...prev, page: newPage }));
    };

    const toggleArticleStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/web/blog/${id}/status`);
            toast.success(`Article ${currentStatus ? "deactivated" : "activated"}`);
            fetchArticles();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const viewArticle = (article) => {
        setSelectedArticle(article);
        openModal();
    };

    const openEditModal = (article) => {
        setSelectedArticle(article);
        setFormData({
            title: article.title || "",
            slug: article.slug || "",
            description: article.description || "",
            content: article.content && decodeURIComponent(escape(atob(article.content))) || "",
            coverImage: article.coverImage || "",
            category: article.category?._id || "",
            meta: {
                keywords: article.meta?.keywords || [],
                metaDescription: article.meta?.metaDescription || "",
            },
            status: article.status !== undefined ? article.status : true,
        });
        setCoverImagePreview("https://uat.gatewayabroadeducations.com/uploads/" + article.coverImage);
        setCoverImageFile(null);
        setEditModalOpen(true);
    };

    // Generate slug from title
    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const handleTitleChange = (e) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            title: value,
            slug: generateSlug(value) // Auto-generate slug when title changes
        }));
        if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
    };

    // Cover image handling
    const handleCoverImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCoverImageFile(file);

        const previewUrl = URL.createObjectURL(file);
        setCoverImagePreview(previewUrl);
        setFormData(prev => ({ ...prev, coverImage: previewUrl }));
    };

    const triggerCoverImageInput = () => {
        const fileInput = document.getElementById('cover-image-upload');
        fileInput?.click();
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.slug.trim()) newErrors.slug = "Slug is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.content.trim()) newErrors.content = "Content is required";
        if (!formData.category) newErrors.category = "Category is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            const payload = { ...formData, content: btoa(unescape(encodeURIComponent(formData.content))) };
            let coverImageUrl = formData.coverImage;

            // Upload image if it's a new file
            if (coverImageFile) {
                const imageFormData = new FormData();
                imageFormData.append('image', coverImageFile);
                const uploadResponse = await api.post('/upload/single', imageFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                coverImageUrl = uploadResponse.data?.file?.filename;
                payload.coverImage = coverImageUrl;
            }

            if (selectedArticle) {
                await api.put(`/web/blog/${selectedArticle?._id}`, payload);
                toast.success("Article updated");
            } else {
                await api.post("/web/blog", payload);
                toast.success("Article created");
            }
            fetchArticles();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const deleteArticle = async () => {
        if (!selectedArticle) return;
        try {
            await api.delete(`/web/blog/${selectedArticle._id}`);
            toast.success("Article deleted");
            fetchArticles();
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete article");
        }
    };

    const openCreateModal = () => {
        setSelectedArticle(null);
        setFormData({
            title: "",
            slug: "",
            description: "",
            content: "",
            coverImage: "",
            category: "",
            meta: { keywords: [], metaDescription: "" },
            status: true,
        });
        setCoverImagePreview('');
        setCoverImageFile(null);
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleMetaChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            meta: { ...prev.meta, [name]: value },
        }));
    };

    const handleContentChange = (content) => {
        setFormData((prev) => ({ ...prev, content }));
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Header */}
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-indigo-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-600">
                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Article Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage blog articles</p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{articles.length} articles</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z" fill="" />
                            </svg>
                            Add Article
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Search (Title, Description)
                    </label>
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Search articles..."
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                    </label>
                    <select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">All Categories</option>
                        {allCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                    </label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="">All</option>
                        <option value="true">Published</option>
                        <option value="false">Draft</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() =>
                            setFilters({ page: 1, limit: 10, status: "", category: "", search: "" })
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-4 flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rows per page:</label>
                        <select
                            name="limit"
                            value={filters.limit}
                            onChange={handleFilterChange}
                            className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Title</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Category</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Created</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {articles.length > 0 ? (
                                    articles.map((art) => (
                                        <tr key={art._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{art.title}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{art.slug}</div>
                                            </td>

                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {art.category?.name || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <span
                                                    onClick={() => toggleArticleStatus(art._id, art.status)}
                                                    className={`cursor-pointer inline-flex rounded-full px-2 text-xs font-semibold ${art.status
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                        }`}
                                                >
                                                    {art.status ? "Published" : "Draft"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {new Date(art.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button onClick={() => viewArticle(art)} className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => openEditModal(art)} className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedArticle(art);
                                                            setDeleteModalOpen(true);
                                                        }}
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
                                        <td colSpan={6} className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No articles found
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
                            Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(filters.page * filters.limit, total)}</span> of{" "}
                            <span className="font-medium">{total}</span> results
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(filters.page - 1)}
                                disabled={filters.page === 1}
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page === 1
                                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                                    : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                                    }`}
                            >
                                Previous
                            </button>
                            {[...Array(Math.ceil(total / filters.limit))].map((_, i) => {
                                const pageNum = i + 1;
                                if (pageNum < filters.page - 2 || pageNum > filters.page + 2) return null;
                                return (
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
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(filters.page + 1)}
                                disabled={filters.page * filters.limit >= total}
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page * filters.limit >= total
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

            {/* View Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Article Details</h4>
                    </div>
                    {selectedArticle && (
                        <div className="space-y-4 px-2">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{selectedArticle.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Slug</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{selectedArticle.slug}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{selectedArticle.description}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {selectedArticle.category?.name || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <span
                                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${selectedArticle.status
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        }`}
                                >
                                    {selectedArticle.status ? "Published" : "Draft"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Keywords</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedArticle?.meta?.keywords?.map((keyword, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300">
                                            {keyword}
                                        </span>
                                    )) || "—"}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Cover Image</p>
                                {selectedArticle.coverImage ? (
                                    <img
                                        src={"https://uat.gatewayabroadeducations.com/uploads/" + selectedArticle.coverImage}
                                        alt="Cover"
                                        className="mt-2 w-32 object-fit rounded border border-gray-200 dark:border-gray-700"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No image</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Create/Edit Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} isFullscreen className="bg-white dark:bg-gray-900">
                <div className="no-scrollbar relative max-w-7xl mx-auto w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {selectedArticle ? "Edit Article" : "Create New Article"}
                        </h4>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                            e.preventDefault();
                        }
                    }} className="px-2 max-h-[83vh] overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <Label>Title *</Label>
                                <Input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    placeholder="Article title"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                            </div>
                            <div>
                                <Label>Slug *</Label>
                                <Input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    placeholder="article-slug"
                                />
                                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Auto-generated from title (can be edited)
                                </p>
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="">Select category</option>
                                    {allCategories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label>Description *</Label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    placeholder="Short description"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label>Cover Image</Label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <input
                                        id="cover-image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverImageChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerCoverImageInput}
                                        className="flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
                                    >
                                        📎 Upload Image
                                    </button>
                                    {formData.coverImage && (
                                        <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {coverImageFile ? coverImageFile.name : 'Image selected'}
                                        </span>
                                    )}
                                </div>
                                {coverImagePreview && (
                                    <div className="mt-3">
                                        <div className="inline-block p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <img
                                                src={coverImagePreview}
                                                alt="Preview"
                                                className="h-24 rounded object-cover transition-transform duration-200 hover:scale-105"
                                                style={{ width: '160px', height: '96px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <Label>Meta Description (SEO)</Label>
                                <textarea
                                    name="metaDescription"
                                    value={formData.meta.metaDescription}
                                    onChange={handleMetaChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    placeholder="Up to 160 characters"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>Meta Keywords (SEO)</Label>
                                <input
                                    type="text"
                                    name="keywords"
                                    value={formData.meta.keywords.join(', ')}
                                    onChange={(e) => {
                                        const keywordsArray = e.target.value
                                            .split(',')
                                            .map((keyword) => keyword.trim());
                                        setFormData(prev => ({
                                            ...prev,
                                            meta: { ...prev.meta, keywords: keywordsArray }
                                        }));
                                    }}
                                    placeholder="e.g. IELTS, Study Abroad, Canada"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Separate keywords with commas (e.g. IELTS, Study Abroad, Canada)
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Label>Content *</Label>
                            <RichTextEditor
                                initialValue={formData.content}
                                onChange={handleContentChange}
                            />
                            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
                        </div>

                        <div className="mt-4 flex items-center">
                            <Label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.status}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked }))}
                                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Publish immediately</span>
                            </Label>
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
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {selectedArticle ? "Update Article" : "Create Article"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedArticle && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Deletion</h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete <strong>"{selectedArticle.title}"</strong>?
                            </p>
                        </div>
                        <div className="px-2">
                            <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                        <p>This action cannot be undone.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={deleteArticle}>
                                Delete Article
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}