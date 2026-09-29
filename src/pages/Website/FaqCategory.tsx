import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Pencil, Trash2, FolderOpen } from "lucide-react";

export default function FaqCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const { isOpen, openModal, closeModal } = useModal();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  const [formData, setFormData] = useState({
    name: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, [filters]);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      const response = await api.get("/web/faq/category");

      let data = response.data?.data || [];

      // Client-side search filter (since backend returns all)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter((cat) => cat.name?.toLowerCase().includes(q));
      }

      setTotal(data.length);

      // Client-side pagination
      const start = (filters.page - 1) * Number(filters.limit);
      const paginated = data.slice(start, start + Number(filters.limit));

      setCategories(paginated);
    } catch (error) {
      console.error("Failed to load FAQ categories:", error);
      toast.error(
        error.response?.data?.message || "Failed to load FAQ categories"
      );
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

  const viewCategory = (category) => {
    setSelectedCategory(category);
    openModal();
  };

  const openCreateModal = () => {
    setSelectedCategory(null);
    setFormData({ name: "" });
    setErrors({});
    setEditModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name || "" });
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        name: formData.name.trim(),
      };

      if (selectedCategory) {
        await api.put(`/web/faq/category/${selectedCategory._id}`, payload);
        toast.success("FAQ category updated successfully");
      } else {
        await api.post("/web/faq/category", payload);
        toast.success("FAQ category created successfully");
      }

      setEditModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("FAQ category save error:", error);
      toast.error(
        error.response?.data?.message || "Failed to save FAQ category"
      );
    }
  };

  const deleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await api.delete(`/web/faq/category/${selectedCategory._id}`);

      toast.success("FAQ category deleted successfully");

      setDeleteModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error("Delete FAQ category error:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete FAQ category"
      );
    }
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
    });
  };

  const totalPages = Math.ceil(total / Number(filters.limit));

  return (
    <div className="w-full overflow-x-auto">
      {/* ================= HEADER ================= */}
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 mb-3 bg-white dark:bg-gray-800">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-indigo-50">
              <FolderOpen className="h-6 w-6 text-indigo-600" />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                FAQ Category Management
              </h4>

              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage FAQ categories
                </p>

                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {total} Categories
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
              Add Category
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
            placeholder="Search categories..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
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
                    Category Name
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
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCategory(category);
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
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-300"
                    >
                      No categories found
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
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Category Details
            </h4>
          </div>

          {selectedCategory && (
            <div className="space-y-5 px-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Category Name
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedCategory.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created At
                </p>

                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {selectedCategory.createdAt
                    ? new Date(selectedCategory.createdAt).toLocaleString()
                    : "—"}
                </p>
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
        className="max-w-[500px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedCategory ? "Edit Category" : "Create New Category"}
            </h4>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="px-2"
          >
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label>Category Name *</Label>

                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. About, Visa, Study Abroad"
                />

                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                {selectedCategory ? "Update Category" : "Create Category"}
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
        {selectedCategory && (
          <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Confirm Deletion
              </h4>

              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <strong>"{selectedCategory.name}"</strong>?
              </p>
            </div>

            <div className="px-2">
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone. FAQs using this category may be
                  affected.
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

              <Button size="sm" variant="primary" onClick={deleteCategory}>
                Delete Category
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}