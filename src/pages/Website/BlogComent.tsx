import { useState, useEffect } from 'react';
import moment from 'moment';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import Button from '../../components/ui/button/Button';

import { toast } from 'react-toastify';
import api from '../../axiosInstance';
import { Eye, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function CommentsManagement() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedComment, setSelectedComment] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allArticles, setAllArticles] = useState([]);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        status: "",
        article: "",
        author: "",
        search: ""
    });

    useEffect(() => {
        fetchComments();
        fetchRelatedData();
    }, [filters]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy
            };
            const response = await api.get("/web/comments", { params });
            setComments(response.data?.comments || []);
            setTotal(response.data?.totalPages || 0);
        } catch (error) {
            toast.error("Failed to load comments");
        } finally {
            setLoading(false);
        }
    };

    const fetchRelatedData = async () => {
        try {
            // const articlesRes = await api.get("/web/blogs?isActive=true");
            setAllArticles([]);
        } catch (error) {
            console.error("Failed to fetch articles:", error);
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

    const approveComment = async (commentId) => {
        try {
            await api.put(`/web/${commentId}/approve`);
            toast.success("Comment approved successfully");
            fetchComments();
        } catch (error) {
            console.error("Error approving comment:", error);
            toast.error("Failed to approve comment");
        }
    };

    const rejectComment = async (commentId) => {
        try {
            await api.put(`/web/${commentId}/reject`);
            toast.success("Comment rejected successfully");
            fetchComments();
        } catch (error) {
            console.error("Error rejecting comment:", error);
            toast.error("Failed to reject comment");
        }
    };

    const deleteComment = async () => {
        if (!selectedComment) return;
        try {
            await api.delete(`/web/${selectedComment._id}`);
            toast.success("Comment deleted successfully");
            fetchComments();
            setDeleteModalOpen(false);
            setSelectedComment(null);
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast.error(error.message || "Failed to delete comment");
        }
    };

    const viewCommentDetails = (comment) => {
        setSelectedComment(comment);
        openModal();
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'approved':
                return { text: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
            case 'rejected':
                return { text: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
            case 'pending':
                return { text: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
            default:
                return { text: status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
        }
    };

    return (
        <div className="w-full overflow-x-auto">
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                                <path d="M21 6C21 7.1 20.1 8 19 8C17.9 8 17 7.1 17 6C17 4.9 17.9 4 19 4C20.1 4 21 4.9 21 6ZM19 10C20.1 10 21 10.9 21 12C21 13.1 20.1 14 19 14C17.9 14 17 13.1 17 12C17 10.9 17.9 10 19 10ZM19 18C20.1 18 21 18.9 21 20C21 21.1 20.1 22 19 22C17.9 22 17 21.1 17 20C17 18.9 17.9 18 19 18ZM5 6C5 7.1 4.1 8 3 8C1.9 8 1 7.1 1 6C1 4.9 1.9 4 3 4C4.1 4 5 4.9 5 6ZM3 10C4.1 10 5 10.9 5 12C5 13.1 4.1 14 3 14C1.9 14 1 13.1 1 12C1 10.9 1.9 10 3 10ZM5 18C5 19.1 4.1 20 3 20C1.9 20 1 19.1 1 18C1 16.9 1.9 16 3 16C4.1 16 5 16.9 5 18ZM12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Comments Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage user comments and replies
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {comments.length} comments
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                {/* Filters Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Content, Author)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search comments..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
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
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Article
                        </label>
                        <select
                            name="article"
                            value={filters.article}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Articles</option>
                            {allArticles.map(article => (
                                <option key={article._id} value={article._id}>
                                    {article.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({
                                page: 1,
                                limit: 10,
                                sortBy: "-createdAt",
                                status: "",
                                article: "",
                                author: "",
                                search: ""
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
                {/* Comments Table */}
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
                                        Author
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Content
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Article
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th scope="col" className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Reactions
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
                                {comments?.length > 0 ? (
                                    comments.map((comment) => {
                                        const article = allArticles.find(a => a._id === comment.article);
                                        const status = formatStatus(comment.status);

                                        return (
                                            <tr key={comment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="whitespace-nowrap px-2 py-3">
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {comment.author?.name}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                                                    {comment.content}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                    { comment.article ? comment?.article.title : 'N/A'}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                   
                                                    {comment.status === 'pending' ? (
                                                        <><div className='flex gap-2'>
                                                            <button
                                                                onClick={() => approveComment(comment._id)}
                                                                className="p-1 rounded-lg text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                            >
                                                                <CheckCircle className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => rejectComment(comment._id)}
                                                                className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                <XCircle className="h-5 w-5" />
                                                            </button>
                                                            </div>
                                                        </>
                                                    ): <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${status.color}`}>
                                                        {status.text}
                                                    </span>}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center">
                                                            <ThumbsUp className="h-4 w-4 text-gray-500" />
                                                            <span className="ml-1">{comment.likes?.length || 0}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <ThumbsDown className="h-4 w-4 text-gray-500" />
                                                            <span className="ml-1">{comment.dislikes?.length || 0}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm text-gray-500 dark:text-gray-300">
                                                    {moment(comment.createdAt).format("MMM D, YYYY")}
                                                </td>
                                                <td className="whitespace-nowrap px-2 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => viewCommentDetails(comment)}
                                                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setSelectedComment(comment); setDeleteModalOpen(true); }}
                                                            className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                                        >
                                            No comments found matching your criteria
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
            {/* Comment Details Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Comment Details
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Detailed information about this comment
                        </p>
                    </div>
                    <div className="flex flex-col">
                        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                            {selectedComment && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Author Information
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedComment.author?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Status Information
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${formatStatus(selectedComment.status).color}`}>
                                                        {formatStatus(selectedComment.status).text}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {moment(selectedComment.createdAt).format("MMM D, YYYY h:mm A")}
                                                    </p>
                                                </div>
                                                {selectedComment.status !== 'pending' && (
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Updated</p>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                            {moment(selectedComment.updatedAt).format("MMM D, YYYY h:mm A")}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Comment Content
                                        </h6>
                                        <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                                            <p className="text-sm text-gray-800 dark:text-white/90">
                                                {selectedComment.content}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Article
                                            </h6>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedComment.article?.title || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                                Reactions
                                            </h6>
                                            <div className="space-y-3">
                                                <div className="flex items-center">
                                                    <ThumbsUp className="h-5 w-5 text-gray-500" />
                                                    <span className="ml-2 text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedComment.likes?.length || 0} likes
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <ThumbsDown className="h-5 w-5 text-gray-500" />
                                                    <span className="ml-2 text-sm font-medium text-gray-800 dark:text-white/90">
                                                        {selectedComment.dislikes?.length || 0} dislikes
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">
                                            Additional Information
                                        </h6>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">IP Address</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedComment.ipAddress || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">User Agent</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                                    {selectedComment.userAgent || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
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
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedComment && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                                Confirm Deletion
                            </h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                                Are you sure you want to delete this comment? This action cannot be undone.
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
                                                Deleting this comment will permanently remove it from the system.
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
                                onClick={deleteComment}
                            >
                                Delete Comment
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}