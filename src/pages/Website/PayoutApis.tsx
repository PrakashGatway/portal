import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal/index";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import api from "../../axiosInstance";

const PayoutApisTable = () => {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    provider: "",
    isActive: ""
  });
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedApi, setSelectedApi] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "",
    apiKey: "",
    apiSecret: "",
    provider: "Razorpay",
    isActive: true,
    meta: {}
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchApis();
  }, [filters]);

  const fetchApis = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        provider: filters.provider,
        isActive: filters.isActive
      };

      const { data } = await api.get("/payOut", { params });
      setApis(data.data);
      setTotal(data.totalCount);
    } catch (error) {
      toast.error(error.message || "Failed to fetch APIs");
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

  const toggleStatus = async (id) => {
    try {
      const { data } = await api.patch(`/payOut/${id}/toggle-status`);
      setApis(prev => prev.map(api => 
        api._id === id ? { ...api, isActive: data.isActive } : api
      ));
      toast.success(`API is now ${data.isActive ? "active" : "inactive"}`);
    } catch (error) {
      toast.error(error.message || "Failed to toggle status");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [name]: value
      }
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.baseUrl) errors.baseUrl = "Base URL is required";
    if (!formData.apiKey) errors.apiKey = "API Key is required";
    if (!formData.apiSecret) errors.apiSecret = "API Secret is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (selectedApi) {
        // Update existing API
        await api.put(`/payOut/${selectedApi._id}`, formData);
        toast.success("API updated successfully");
      } else {
        // Create new API
        await api.post("/payOut", formData);
        toast.success("API created successfully");
      }
      closeModal();
      fetchApis();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSelectedApi(null);
    setFormData({
      name: "",
      baseUrl: "",
      apiKey: "",
      apiSecret: "",
      provider: "Razorpay",
      isActive: true,
      meta: {}
    });
    setFormErrors({});
    openModal();
  };

  const openEditModal = (api) => {
    setSelectedApi(api);
    setFormData({
      name: api.name,
      baseUrl: api.baseUrl,
      apiKey: api.apiKey,
      apiSecret: api.apiSecret,
      provider: api.provider,
      isActive: api.isActive,
      meta: api.meta || {}
    });
    setFormErrors({});
    openModal();
  };

  return (
    <div>
      <PageMeta
        title="Payout APIs | Admin Dashboard"
        description="Manage Payout APIs configuration"
      />
      <PageBreadcrumb pageTitle="Payout APIs" />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 lg:px-8">
        {/* Filters Section */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search Filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, URL or provider"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Provider Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Provider
            </label>
            <select
              name="provider"
              value={filters.provider}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Providers</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Cashfree">Cashfree</option>
              <option value="PayPal">PayPal</option>
              <option value="Stripe">Stripe</option>
            </select>
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

          <button
            onClick={openAddModal}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-700 dark:hover:bg-indigo-800"
          >
            Add New API
          </button>
        </div>

        {/* APIs Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="min-w-full">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6">
                      Provider
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:table-cell sm:px-6">
                      Base URL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {apis.length > 0 ? (
                    apis.map((api) => (
                      <tr key={api._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-white sm:px-6">
                          {api.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:px-6">
                          {api.provider}
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:table-cell sm:px-6">
                          <div className="max-w-xs truncate">{api.baseUrl}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-300 sm:px-6">
                          <button
                            onClick={() => toggleStatus(api._id)}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${api.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                          >
                            {api.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-white sm:px-6">
                          <button
                            onClick={() => openEditModal(api)}
                            className="mr-3 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-300 sm:px-6"
                      >
                        No APIs found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

      {/* Add/Edit API Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl">
        <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {selectedApi ? "Edit Payout API" : "Add New Payout API"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedApi ? "Update the API details" : "Configure a new payout API"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${formErrors.name ? "border-red-300" : "border-gray-300"} bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provider
                </label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Razorpay">Razorpay</option>
                  <option value="Cashfree">Cashfree</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Stripe">Stripe</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="baseUrl"
                  value={formData.baseUrl}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${formErrors.baseUrl ? "border-red-300" : "border-gray-300"} bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                />
                {formErrors.baseUrl && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.baseUrl}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${formErrors.apiKey ? "border-red-300" : "border-gray-300"} bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                />
                {formErrors.apiKey && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.apiKey}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apiSecret"
                  value={formData.apiSecret}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${formErrors.apiSecret ? "border-red-300" : "border-gray-300"} bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white`}
                />
                {formErrors.apiSecret && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.apiSecret}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              {/* Meta Fields */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Configuration
                </h4>
                <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Merchant ID
                    </label>
                    <input
                      type="text"
                      name="merchantId"
                      value={formData.meta.merchantId || ""}
                      onChange={handleMetaChange}
                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Webhook Secret
                    </label>
                    <input
                      type="text"
                      name="webhookSecret"
                      value={formData.meta.webhookSecret || ""}
                      onChange={handleMetaChange}
                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Callback URL
                    </label>
                    <input
                      type="text"
                      name="callbackUrl"
                      value={formData.meta.callbackUrl || ""}
                      onChange={handleMetaChange}
                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
              >
                {selectedApi ? "Update API" : "Add API"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default PayoutApisTable;