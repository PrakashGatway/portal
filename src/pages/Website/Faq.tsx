import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2 } from "lucide-react";
// import RichTextEditor from "../../components/TextEditor";
import RichTextEditor from "../../components/CkEditor";

export default function FaqManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const { isOpen, openModal, closeModal } = useModal();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    category: "",
    search: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "About",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, [filters]);

  const [allCategories, setAllCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/web/cat?isActive=true&from=admin");
      setAllCategories(res.data?.data || []);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };    

  const fetchFaqs = async () => {
    setLoading(true);

    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await api.get("/web/faq", {
        params,
      });

      setFaqs(response.data?.data || []);

      setTotal(response.data?.pagination?.total || response.data?.total || 0);
    } catch (error) {
      console.error("Failed to load FAQs:", error);

      toast.error(error.response?.data?.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;

    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const viewFaq = (faq) => {
    setSelectedFaq(faq);
    openModal();
  };

  const openCreateModal = () => {
    setSelectedFaq(null);

    setFormData({
      title: "",
      content: "",
      category: "About",
    });

    setErrors({});

    setEditModalOpen(true);
  };

  const openEditModal = (faq) => {
    setSelectedFaq(faq);

    setFormData({
      title: faq.title || "",
      content: faq.content || "",
      category: faq.category || "About",
    });

    setErrors({});
    setEditModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));

    if (errors.content) {
      setErrors((prev) => ({
        ...prev,
        content: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Question is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Answer is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content,
        category: formData.category.toLowerCase().trim(),
      };

      if (selectedFaq) {
        await api.put(`/web/faq/${selectedFaq._id}`, payload);

        toast.success("FAQ updated successfully");
      } else {
        await api.post("/web/faq", payload);

        toast.success("FAQ created successfully");
      }

      setEditModalOpen(false);

      setSelectedFaq(null);

      fetchFaqs();
    } catch (error) {
      console.error("FAQ save error:", error);

      toast.error(error.response?.data?.message || "Failed to save FAQ");
    }
  };

  const deleteFaq = async () => {
    if (!selectedFaq) return;

    try {
      await api.delete(`/web/faq/${selectedFaq._id}`);

      toast.success("FAQ deleted successfully");

      setDeleteModalOpen(false);
      setSelectedFaq(null);

      fetchFaqs();
    } catch (error) {
      console.error("Delete FAQ error:", error);

      toast.error(error.response?.data?.message || "Failed to delete FAQ");
    }
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      category: "",
      search: "",
    });
  };

  const totalPages = Math.ceil(total / Number(filters.limit));

  return (
    <div className="w-full overflow-x-auto">
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 mb-3 bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-indigo-50">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-indigo-600"
              >
                <path
                  d="M12 2C6.48 2 2 5.58 2 10c0 2.84 1.76 5.35 4.5 6.85L6 21l5.5-3.5c.17.01.33.02.5.02 5.52 0 10-3.58 10-8S17.52 2 12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                FAQ Management
              </h4>

              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage frequently asked questions
                </p>

                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {total} FAQs
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
            <button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 lg:inline-flex lg:w-auto"
            >
              <span className="text-lg">+</span>
              Add FAQ
            </button>
          </div>
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>

          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search questions or answers..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>

          {/* <input
            type="text"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            placeholder="e.g. About"
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          /> */}

          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Select Option</option>
            {allCategories.map((ele, idx) => (
              <option key={idx} value={ele.name.toLowerCase()}>
                {ele.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Rows per page:
          </label>

          <select
            name="limit"
            value={filters.limit}
            onChange={handleFilterChange}
            className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Question
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Category
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Created
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {faqs.length > 0 ? (
                  faqs.map((faq) => (
                    <tr
                      key={faq._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-4">
                        <div className="max-w-xl">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {faq.title}
                          </div>

                          <div
                            className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: faq.content || "",
                            }}
                          />
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <span className="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {faq.category || "About"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {faq.createdAt
                          ? new Date(faq.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewFaq(faq)}
                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                          >
                            <Eye className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => openEditModal(faq)}
                            className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedFaq(faq);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400"
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
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-300"
                    >
                      No FAQs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ================= PAGINATION ================= */}

        {total > 0 && (
          <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div className="text-sm text-gray-500 dark:text-gray-300">
              Showing{" "}
              <span className="font-medium">
                {(filters.page - 1) * Number(filters.limit) + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(filters.page * Number(filters.limit), total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> results
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="rounded-md border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;

                if (pageNum < filters.page - 2 || pageNum > filters.page + 2) {
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      filters.page === pageNum
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="rounded-md border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= VIEW MODAL ================= */}

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              FAQ Details
            </h4>
          </div>

          {selectedFaq && (
            <div className="space-y-5 px-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Question
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedFaq.title}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Category
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedFaq.category || "About"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Answer
                </p>

                <div
                  className="mt-2 text-sm text-gray-800 dark:text-white/90 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: selectedFaq.content || "",
                  }}
                />
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

      {/* ================= CREATE / EDIT MODAL ================= */}

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        isFullscreen
        className="bg-white dark:bg-gray-900"
      >
        <div className="no-scrollbar relative max-w-5xl mx-auto w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedFaq ? "Edit FAQ" : "Create New FAQ"}
            </h4>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="px-2 max-h-[83vh] overflow-y-auto no-scrollbar"
          >
            <div className="grid grid-cols-1 gap-6">
              {/* QUESTION */}

              <div>
                <Label>Question *</Label>

                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter FAQ question"
                />

                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* CATEGORY */}

              <div>
                <Label>Category *</Label>

                {/* <Input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. About, Visa, Study Abroad"
                /> */}

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Option</option>
                  {allCategories.map((ele, idx) => (
                    <option key={idx} value={ele?.name.toLowerCase()}>
                      {ele?.name}
                    </option>
                  ))}
                </select>

                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* ANSWER */}

              <div>
                <Label>Answer *</Label>

                {/* <RichTextEditor
                  initialValue={formData.content}
                  onChange={handleContentChange}
                /> */}

                <RichTextEditor
                  value={formData.content}
                  onChange={(content)=> { setFormData((prev) => ({
                      ...prev,
                      content: content,
                  }));}}
                />

                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {selectedFaq ? "Update FAQ" : "Create FAQ"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ================= DELETE MODAL ================= */}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        className="max-w-lg"
      >
        {selectedFaq && (
          <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Confirm Deletion
              </h4>

              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <strong>"{selectedFaq.title}"</strong>?
              </p>
            </div>

            <div className="px-2">
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone.
                </p>
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

              <Button size="sm" variant="primary" onClick={deleteFaq}>
                Delete FAQ
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
