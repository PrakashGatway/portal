import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2 } from "lucide-react";
import moment from "moment";

export default function SectionManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, openModal, closeModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    thumbnailPic: "",
    duration: 0,
    totalQuestions: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSections();
  }, [filters]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
      };

      const response = await api.get("/test/sections", { params });
      setSections(response.data?.data || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      toast.error("Failed to load sections");
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
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const viewSectionDetails = (section) => {
    setSelectedSection(section);
    openModal();
  };

  const openEditModal = (section) => {
    setSelectedSection(section);
    setFormData({
      name: section.name || "",
      description: section.description || "",
      instructions: section.instructions || "",
      thumbnailPic: section.thumbnailPic || "",
      duration: section.duration || 0,
      totalQuestions: section.totalQuestions || 0,
    });
    setEditModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (formData.duration <= 0) newErrors.duration = "Duration must be > 0";
    if (formData.totalQuestions <= 0) newErrors.totalQuestions = "Total questions must be > 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSection = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        totalQuestions: Number(formData.totalQuestions),
        order: Number(formData.order),
      };

      await api.put(`/test/sections/${selectedSection._id}`, payload);
      toast.success("Section updated successfully");
      fetchSections();
      setEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update section");
    }
  };

  const handleCreateSection = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        ...formData,
        duration: Number(formData.duration),
        totalQuestions: Number(formData.totalQuestions),
      };

      await api.post("/test/sections", payload);
      toast.success("Section created successfully");
      fetchSections();
      setEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create section");
    }
  };

  const deleteSection = async () => {
    if (!selectedSection) return;
    try {
      await api.delete(`/test/sections/${selectedSection._id}`);
      toast.success("Section deleted successfully");
      fetchSections();
      setDeleteModalOpen(false);
      setSelectedSection(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete section");
    }
  };

  const openCreateModal = () => {
    setSelectedSection(null);
    setFormData({
      name: "",
      description: "",
      instructions: "",
      thumbnailPic: "",
      duration: 0,
      totalQuestions: 0,
    });
    setErrors({});
    setEditModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value, name) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Header */}
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                <path d="M3 19V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2zm2-16v14h14V3H5zm2 2h10v2H7V5zm0 4h10v2H7V9zm0 4h7v2H7v-2z" fill="currentColor" />
              </svg>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                Section Management
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage test sections</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{sections.length} sections</p>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
            <button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
            >
              <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="" />
              </svg>
              Add Section
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
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
              placeholder="Search sections..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 10,
                  search: "",
                })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table Actions */}
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

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Name</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Description</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Duration</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Questions</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Created</th>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <tr key={section._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{section.name}</div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300 line-clamp-1">
                        {section.description}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {formatDuration(section.duration)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {section.totalQuestions}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                        {moment(section.createdAt).format("MMM D, YYYY")}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewSectionDetails(section)}
                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(section)}
                            className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSection(section);
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
                    <td colSpan={5} className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                      No sections found
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
                className={`rounded-md border px-3 py-1 text-sm ${
                  filters.page === 1
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(total / filters.limit) }, (_, i) => i + 1)
                .slice(Math.max(0, filters.page - 3), Math.min(Math.ceil(total / filters.limit), filters.page + 2))
                .map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded-md border px-3 py-1 text-sm ${
                      filters.page === pageNum
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
                className={`rounded-md border px-3 py-1 text-sm ${
                  filters.page * filters.limit >= total
                    ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
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
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Section Details</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Detailed information</p>
          </div>
          {selectedSection && (
            <div className="space-y-4 px-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSection.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedSection.description || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Instructions</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedSection.instructions || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatDuration(selectedSection.duration)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedSection.totalQuestions}</p>
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

      {/* Edit/Create Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedSection ? "Edit Section" : "Add New Section"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {selectedSection ? "Update section details" : "Create a new test section"}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              selectedSection ? handleSaveSection() : handleCreateSection();
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
                      placeholder="Section name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Instructions</Label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label>Duration (seconds) *</Label>
                    <Input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      min="1"
                    />
                    {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
                  </div>
                  <div>
                    <Label>Total Questions *</Label>
                    <Input
                      type="number"
                      name="totalQuestions"
                      value={formData.totalQuestions}
                      onChange={handleChange}
                      min="1"
                    />
                    {errors.totalQuestions && <p className="mt-1 text-sm text-red-600">{errors.totalQuestions}</p>}
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
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {selectedSection ? "Save Changes" : "Create Section"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
        {selectedSection && (
          <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Deletion</h4>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this section? This action cannot be undone.
              </p>
            </div>
            <div className="px-2">
              <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Deleting "{selectedSection.name}" will permanently remove it.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={deleteSection}>
                Delete Section
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}