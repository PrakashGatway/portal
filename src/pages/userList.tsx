import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal/index";
import Button from "../components/ui/button/Button";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import {
  Search,
  Filter,
  RotateCcw,
  Eye,
  Edit,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { isOpen, openModal, closeModal } = useModal();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortDirection, setSortDirection] = useState('desc');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: "-createdAt",
    role: "",
    isActive: "",
    search: ""
  });

  const userRoles = ["admin", "manager", "user", "teacher", "super_admin", "editor", "counselor"];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    getValues
  } = useForm({
    defaultValues: {
      role: "user",
      name: "",
      email: "",
      phoneNumber: "",
      course: "",
      isActive: true,
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: ""
      }
    }
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sortBy
      };

      const response = await api.get("/users", { params });
      setUsers(response.data?.users);
      setTotal(response.data?.pagination?.total);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async (userId) => {
    setWalletLoading(true);
    try {
      const response = await api.get(`/users/${userId}`);
      setWalletData(response.data);
      console.log("Wallet Data:", response.data);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet information");
      setWalletData(null);
    } finally {
      setWalletLoading(false);
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

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const viewUserDetails = async (user) => {
    setSelectedUser(user);
    await fetchWalletData(user._id);
    openModal();
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    reset({
      ...user,
      package: user.package || "",
      payInApi: user.payInApiInfo?._id || "",
      payOutApi: user.payOutApiInfo?._id || "",
      address: user.address || {
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: ""
      }
    });
    setEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    const formData = getValues();
    try {
      await api.put(`/users/${selectedUser._id}`, formData);
      toast.success("User updated successfully");
      fetchUsers();
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.message || "Failed to save user");
    }
  };

  const toggleSort = () => {
    const newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(newDirection);
    setFilters(prev => ({
      ...prev,
      sortBy: newDirection === 'desc' ? '-createdAt' : 'createdAt'
    }));
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      user: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      teacher: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      super_admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      editor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      counselor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    };
    return colors[role] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  return (
    <div className="w-full overflow-x-auto">
      <PageBreadcrumb pageTitle="User Management" />

      <div className="min-h-screen overflow-x-auto rounded-2xl bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header Section */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Users Management</h2>
          </div>

        </div>

        {/* Search Section - Always visible */}
        <div className="mb-6 flex items-center gap-2 justify-between">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, email, or phone number..."
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 transition-colors"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </button>
            <button
              onClick={() => setFilters({
                page: 1,
                limit: 10,
                sortBy: "-createdAt",
                role: "",
                isActive: "",
                search: ""
              })}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Filters Section - Collapsible */}
        {showFilters && (
          <div className="mb-6 animate-fadeIn">
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Role
                </label>
                <select
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">All Roles</option>
                  {userRoles.map(role => (
                    <option key={role} value={role} className="capitalize">{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Status
                </label>
                <select
                  name="isActive"
                  value={filters.isActive}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Sort By
                </label>
                <button
                  onClick={toggleSort}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-left focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors flex items-center justify-between"
                >
                  <span>Creation Date</span>
                  {sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Rows per page
                </label>
                <select
                  name="limit"
                  value={filters.limit}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-y-auto border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750">
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    User
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Contact
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Verified
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 cursor-pointer group" onClick={toggleSort}>
                    <div className="flex items-center">
                      Created
                      {sortDirection === 'desc' ?
                        <ChevronDown className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" /> :
                        <ChevronUp className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      }
                    </div>
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Last Active
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {users?.length > 0 ? (
                  users.map((user, index) => (
                    <tr
                      key={user._id}
                      className={`group transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                        }`}
                    >
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-800 font-medium text-base">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-sm capitalize font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {user.name || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getRoleColor(user.role)}`}>
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                            <Mail className="mr-2 h-3.5 w-3.5 text-gray-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="mr-2 h-3.5 w-3.5 text-gray-400" />
                            {user.phoneNumber || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <button

                        >
                          <span
                            className={`inline-flex items-center cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${user.isVerified
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                              : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                              }`}
                          >
                            {user.isVerified ? "Verified" : "Not Verified"}
                          </span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className="group/status relative"
                          title={`Click to ${user.isActive ? 'deactivate' : 'activate'} user`}
                        >
                          <span
                            className={`inline-flex items-center cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${user.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                              : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                              }`}
                          >
                            {user.isActive ? (
                              <UserCheck className="mr-1 h-3.5 w-3.5" />
                            ) : (
                              <UserX className="mr-1 h-3.5 w-3.5" />
                            )}
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          {moment(user.createdAt).format("MMM D, YYYY")}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-gray-400" />
                          {user.lastActive ? moment(user.lastActive).format("MMM D, YYYY") : 'N/A'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => viewUserDetails(user)}
                            className="rounded-lg border border-indigo-200 p-2 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                          No users found
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Try adjusting your filters or search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between space-y-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {(filters.page - 1) * filters.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.min(filters.page * filters.limit, total)}
              </span>{" "}
              of <span className="font-semibold text-gray-900 dark:text-white">{total}</span> users
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${filters.page === 1
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
              >
                <ChevronLeft className="h-4 w-4" />
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
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${filters.page === pageNum
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page * filters.limit >= total}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${filters.page * filters.limit >= total
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[800px] m-4">
        <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              User Details
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Detailed information about this user
            </p>
          </div>
          <div className="flex flex-col">
            <div className="custom-scrollbar h-[65vh] overflow-y-auto px-2 pb-3">
              {selectedUser && (
                <div className="space-y-6">
                  {/* Wallet Information Section */}
                  <div>
                    <h6 className="mb-3 flex items-center text-base font-medium text-gray-800 dark:text-white/90">
                      <Wallet className="mr-2 h-5 w-5 text-indigo-500" />
                      Wallet Information
                    </h6>
                    {walletLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                      </div>
                    ) : walletData ? (
                      <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 dark:border-gray-600 dark:from-gray-800 dark:to-gray-750 sm:grid-cols-5">
                        <div className="text-center">
                          <div className="mb-2 inline-flex rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Balance</p>
                          <p className="text-lg font-bold text-gray-800 dark:text-white/90">
                            ₹{walletData.balance || walletData.data?.balance || walletData.wallet?.balance || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="mb-2 inline-flex rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Earned</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            ₹{walletData.totalEarned || walletData.data?.totalEarned || walletData.wallet?.totalEarned || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="mb-2 inline-flex rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                            ₹{walletData.totalSpent || walletData.data?.totalSpent || walletData.wallet?.totalSpent || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="mb-2 inline-flex rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Referrals</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {walletData.totalReferrals || walletData.data?.totalReferrals || walletData.wallet?.totalReferrals || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="mb-2 inline-flex rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
                            <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Referral Earnings</p>
                          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                            ₹{walletData.referralEarnings || walletData.data?.referralEarnings || walletData.wallet?.referralEarnings || 0}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-600 dark:bg-gray-800">
                        <Wallet className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No wallet information available
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h6 className="mb-3 flex items-center text-base font-medium text-gray-800 dark:text-white/90">
                        <Users className="mr-2 h-5 w-5 text-indigo-500" />
                        Basic Information
                      </h6>
                      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {selectedUser.name}
                          </p>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {selectedUser.profile?.gender || "N/A"}
                          </p>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getRoleColor(selectedUser.role)}`}>
                            {selectedUser.role}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {selectedUser?.profile?.dateOfBirth
                              ? new Date(selectedUser.profile.dateOfBirth).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Bio</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90 max-w-[200px] text-right">
                            {selectedUser.profile?.bio || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h6 className="mb-3 flex items-center text-base font-medium text-gray-800 dark:text-white/90">
                        <Mail className="mr-2 h-5 w-5 text-indigo-500" />
                        Contact Information
                      </h6>
                      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {selectedUser.email}
                          </p>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                            {selectedUser.phoneNumber || "N/A"}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${selectedUser.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              }`}
                          >
                            {selectedUser.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h6 className="mb-3 flex items-center text-base font-medium text-gray-800 dark:text-white/90">
                      <MapPin className="mr-2 h-5 w-5 text-indigo-500" />
                      Address Information
                    </h6>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {selectedUser.fullAddress || "No address provided"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h6 className="mb-3 flex items-center text-base font-medium text-gray-800 dark:text-white/90">
                      <Calendar className="mr-2 h-5 w-5 text-indigo-500" />
                      Timestamps
                    </h6>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {moment(selectedUser.createdAt).format("MMM D, YYYY h:mm A")}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Active At</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {selectedUser.lastActive
                            ? moment(selectedUser.lastActive).format("MMM D, YYYY h:mm A")
                            : "N/A"}
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
                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit User</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update user details for {selectedUser?.name}
            </p>
          </div>

          <form onSubmit={handleSubmit(handleSaveUser)} className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="space-y-6">
                {/* Username & Role */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="userName" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      id="userName"
                      type="text"
                      {...register("name")}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <select
                      id="role"
                      {...register("role", { required: "Role is required" })}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                    >
                      {userRoles.map((role) => (
                        <option key={role} value={role} className="capitalize">
                          {role.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register("email", {
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      disabled
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="mobileNumber" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mobile Number
                    </label>
                    <input
                      id="mobileNumber"
                      type="tel"
                      {...register("phoneNumber")}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                    />
                    {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>}
                  </div>
                </div>

                {/* Address Fields */}
                <div>
                  <h6 className="mb-3 flex items-center text-base font-medium text-gray-800 dark:text-white/90">
                    <MapPin className="mr-2 h-5 w-5 text-indigo-500" />
                    Address Information
                  </h6>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="street" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Street
                      </label>
                      <input
                        id="street"
                        type="text"
                        {...register("address.street")}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        {...register("address.city")}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        {...register("address.state")}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Country
                      </label>
                      <input
                        id="country"
                        type="text"
                        {...register("address.country")}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Postal Code
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        {...register("address.zipCode")}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default UserListPage;