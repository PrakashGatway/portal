import { useState, useEffect } from "react";
import moment from "moment";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Eye, Pencil, Trash2, User } from "lucide-react";
import TextArea from "../../components/form/input/TextArea";
import { useAuth } from "../../context/UserContext";

const LeadStatuses = [
    'new',
    'contacted',
    'interested',
    'notInterested',
    'enrolled',
    'rejected',
    'inactive'
];

const LeadSources = [
    'googleAds',
    'website',
    'education_fair',
    'referral',
    'social_media',
    'partner'
];


export default function LeadManagement() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [allCounselors, setAllCounselors] = useState([]);
    const { user } = useAuth();

    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        sortBy: "-createdAt",
        status: "",
        source: "",
        assignedCounselor: "",
        coursePreference: "",
        countryOfResidence: "",
        intakeDateRange: ""
    });
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        countryOfResidence: "",
        intendedIntake: null,
        coursePreference: "",
        status: "new",
        source: "website",
        assignedCounselor: ""
    });
    const [errors, setErrors] = useState({});
    const [newNote, setNewNote] = useState('');

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await api.post(`/leads/${selectedLead._id}/notes`, { text: newNote });
            toast.success("Note added");
            fetchLeads(); // or just refetch the single lead
            setNewNote("");
        } catch (error) {
            toast.error("Failed to add note");
        }
    };

    useEffect(() => {
        fetchLeads();
        if (user.role === 'admin') {
            fetchCounselors();
        }
    }, [filters]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                page: filters.page,
                limit: filters.limit,
                sort: filters.sortBy
            };
            const response = await api.get("/leads", { params });
            setLeads(response.data?.data || []);
            setTotal(response.data?.pagination?.totalLeads || 0);
        } catch (error) {
            toast.error(error.error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCounselors = async () => {
        try {
            const res = await api.get("/users?role=counselor"); // adjust endpoint as needed
            setAllCounselors(res.data?.users || []);
        } catch (error) {
            console.error("Failed to fetch counselors:", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: 1
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters((prev) => ({
            ...prev,
            page: newPage
        }));
    };

    const viewLeadDetails = (lead) => {
        setSelectedLead(lead);
        openModal();
    };

    const openEditModal = (lead) => {
        setSelectedLead(lead);
        setFormData({
            fullName: lead.fullName || "",
            email: lead.email || "",
            phone: lead.phone || "",
            countryOfResidence: lead.countryOfResidence || "",
            intendedIntake: lead.intendedIntake
                ? moment(lead.intendedIntake).format("YYYY-MM-DD")
                : null,
            coursePreference: lead.coursePreference || "",
            status: lead.status || "new",
            source: lead.source || "website",
            assignedCounselor: lead.assignedCounselor?._id || ""
        });
        setEditModalOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email?.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email";
        }
        if (!formData.coursePreference?.trim()) {
            newErrors.coursePreference = "Course preference is required";
        }
        if (!formData.source) newErrors.source = "Source is required";
        if (formData.intendedIntake && new Date(formData.intendedIntake) <= new Date()) {
            newErrors.intendedIntake = "Intake must be in the future";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveLead = async () => {
        if (!validateForm()) return;
        try {
            const payload = { ...formData };
            if (!payload.assignedCounselor) delete payload.assignedCounselor;

            await api.put(`/leads/${selectedLead._id}`, payload);
            toast.success("Lead updated successfully");
            fetchLeads();
            setEditModalOpen(false);
        } catch (error) {
            toast.error(error.error || "Failed to update lead");
        }
    };

    const handleCreateLead = async () => {
        if (!validateForm()) return;
        try {
            const payload = { ...formData };
            if (!payload.assignedCounselor) delete payload.assignedCounselor;

            await api.post("/leads", payload);
            toast.success("Lead created successfully");
            fetchLeads();
            setEditModalOpen(false);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error?.includes("email")) {
                setErrors({ email: "A lead with this email already exists." });
            } else {
                toast.error(error.message || "Failed to create lead");
            }
        }
    };

    const deleteLead = async () => {
        if (!selectedLead) return;
        try {
            await api.delete(`/leads/${selectedLead._id}`);
            toast.success("Lead deleted successfully");
            fetchLeads();
            setDeleteModalOpen(false);
            setSelectedLead(null);
        } catch (error) {
            toast.error("Failed to delete lead");
        }
    };

    const openCreateModal = () => {
        setSelectedLead(null);
        setFormData({
            fullName: "",
            email: "",
            phone: "",
            countryOfResidence: "",
            intendedIntake: null,
            coursePreference: "",
            status: "new",
            source: "website",
            assignedCounselor: ""
        });
        setErrors({});
        setEditModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            interested: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            notInterested: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
            enrolled: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            inactive: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
        };
        return colors[status] || colors.new;
    };

    return (
        <div className="w-full overflow-x-auto">
            {/* Header Card */}
            <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                        <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-indigo-50">
                            <User className="text-indigo-600 h-8 w-8" />
                        </div>
                        <div className="order-3 xl:order-2">
                            <h4 className="mb-1 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                                Lead Management
                            </h4>
                            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage prospective students
                                </p>
                                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {total} leads
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
                        <button
                            onClick={openCreateModal}
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
                        >
                            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="currentColor" />
                            </svg>
                            Add New Lead
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Search (Name, Email, Phone)
                        </label>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Search leads..."
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            {LeadStatuses.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {user.role && user.role === "admin" && <> <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
                        <select
                            name="source"
                            value={filters.source}
                            onChange={handleFilterChange}
                            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">All Sources</option>
                            {LeadSources.map((s) => (
                                <option key={s} value={s}>
                                    {s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                </option>
                            ))}
                        </select>
                    </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Counselor
                            </label>
                            <select
                                name="assignedCounselor"
                                value={filters.assignedCounselor}
                                onChange={handleFilterChange}
                                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="">All Counselors</option>
                                {allCounselors.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name || c.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>}
                    {/* <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course Preference
            </label>
            <input
              type="text"
              name="coursePreference"
              value={filters.coursePreference}
              onChange={handleFilterChange}
              placeholder="e.g. MBA, Computer Science"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country of Residence
            </label>
            <input
              type="text"
              name="countryOfResidence"
              value={filters.countryOfResidence}
              onChange={handleFilterChange}
              placeholder="e.g. India, Nigeria"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Intake Date Range
            </label>
            <input
              type="text"
              name="intakeDateRange"
              value={filters.intakeDateRange}
              onChange={handleFilterChange}
              placeholder="YYYY-MM-DD_YYYY-MM-DD"
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div> */}
                    <div className="flex items-end">
                        <button
                            onClick={() =>
                                setFilters({
                                    page: 1,
                                    limit: 10,
                                    sortBy: "-createdAt",
                                    status: "",
                                    source: "",
                                    assignedCounselor: "",
                                    coursePreference: "",
                                    countryOfResidence: "",
                                    intakeDateRange: ""
                                })
                            }
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Table */}
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
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Contact</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Course</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Intake</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Counselor</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                                    {user.role && user.role === "admin" && <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Source</th>}
                                    <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {leads.length > 0 ? (
                                    leads.map((lead) => (
                                        <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium capitalize text-gray-900 dark:text-white">
                                                {lead?.fullName || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300">
                                                Email:{lead.email || "—"} <br />
                                                Mob:{lead.phone || "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {lead.coursePreference}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {lead.intendedIntake
                                                    ? moment(lead.intendedIntake).format("MMM YYYY")
                                                    : "—"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                                                {lead.assignedCounselor?.name || lead.assignedCounselor?.email || "Unassigned"}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-4">
                                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${getStatusColor(lead.status)}`}>
                                                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                                </span>
                                            </td>
                                            {user.role && user.role === "admin" && <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 dark:text-gray-300 capitalize">
                                                {lead.source.replace(/_/g, " ")} <br />
                                                {lead.createdAt && moment(lead.createdAt).format("MMM D, YYYY h:mm A")}
                                            </td>}
                                            <td className="whitespace-nowrap px-2 py-4 text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => viewLeadDetails(lead)}
                                                        className="p-1 rounded-lg text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(lead)}
                                                        className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Pencil className="h-5 w-5" />
                                                    </button>
                                                    {user.role == 'admin' && <button
                                                        onClick={() => {
                                                            setSelectedLead(lead);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                            No leads found
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
                                className={`rounded-md border px-3 py-1 text-sm ${filters.page * filters.limit >= total
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
                <div className=" relative w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Lead Details</h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Detailed information about this lead
                        </p>
                    </div>
                    {selectedLead && (
                        <div className="space-y-6 px-2 max-h-[60vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="text-sm font-medium text-gray-800 capitalize dark:text-white">{selectedLead.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.phone || "—"} </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Country</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.countryOfResidence || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Course Preference</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedLead.coursePreference}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Intended Intake</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                                        {selectedLead.intendedIntake
                                            ? moment(selectedLead.intendedIntake).format("MMM D, YYYY")
                                            : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(selectedLead.status)}`}>
                                        {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                                    </span>
                                </div>
                                {user.role && user.role === "admin" && <div>
                                    <p className="text-sm text-gray-500">Source</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                                        {selectedLead.source.replace(/_/g, " ")}
                                    </p>
                                </div>}
                                {user.role && user.role === "admin" && <div className="md:col-span-1">
                                    <p className="text-sm text-gray-500">Assigned Counselor</p>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                                        {selectedLead.assignedCounselor?.name || selectedLead.assignedCounselor?.email || "Unassigned"}
                                    </p>
                                </div>}
                                <div className="col-span-3">
                                    <p className="text-sm text-gray-500">Extra Details</p>
                                    <div className="mt-1 text-sm text-gray-800 dark:text-white font-medium">
                                        {selectedLead.extraDetails && typeof selectedLead.extraDetails === "object" ? (
                                            Object.entries(selectedLead.extraDetails).map(([key, value]) => (
                                                <div key={key} className="flex items-start mb-1">
                                                    <span className="font-medium text-gray-600 mr-1 dark:text-gray-400">
                                                        {key.replace(/_/g, ' ').replace(/\?/g, '').replace(/\b\w/g, c => c.toUpperCase())}:
                                                    </span>
                                                    <span className="text-sm text-gray-800 dark:text-white font-medium">{String(value)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <span>{selectedLead.extraDetails || "N/A"}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Label>Add Note</Label>
                                <TextArea
                                    value={newNote}
                                    onChange={setNewNote}
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                    placeholder="Type your note here..."
                                />
                                <button
                                    onClick={handleAddNote}
                                    className="mt-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                                    disabled={!newNote.trim()}
                                >
                                    Add Note
                                </button>
                            </div>

                            {selectedLead.notes && selectedLead.notes.length > 0 && (
                                <div>
                                    <h6 className="mb-3 text-base font-medium text-gray-800 dark:text-white/90">Notes</h6>
                                    <div className="space-y-3">
                                        {selectedLead.notes.map((note, i) => (
                                            <div key={i} className="border-l-4 border-indigo-500 pl-3 py-1">
                                                <p className="text-sm text-gray-800 dark:text-white">{note.text}</p>
                                                <p className="text-xs text-gray-500">
                                                    by {note.createdBy === user._id ? "You" : note.createdBy == selectedLead.assignedCounselor?._id ? "Counselor" : "Admin"} •{" "}
                                                    {moment(note.createdAt).format("MMM D, YYYY h:mm A")}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-[700px] m-4">
                <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            {selectedLead ? "Edit Lead" : "Add New Lead"}
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            {selectedLead ? "Update lead information" : "Enter new lead details"}
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            selectedLead ? handleSaveLead() : handleCreateLead();
                        }}
                        className="px-2"
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Full Name *</Label>
                                    <Input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                    />
                                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                                </div>
                                <div>
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <Label>Country of Residence</Label>
                                    <Input
                                        type="text"
                                        name="countryOfResidence"
                                        value={formData.countryOfResidence}
                                        onChange={handleChange}
                                        placeholder="e.g. India"
                                    />
                                </div>
                                <div>
                                    <Label>Course Preference *</Label>
                                    <Input
                                        type="text"
                                        name="coursePreference"
                                        value={formData.coursePreference}
                                        onChange={handleChange}
                                        placeholder="e.g. MBA, Data Science"
                                    />
                                    {errors.coursePreference && (
                                        <p className="mt-1 text-sm text-red-600">{errors.coursePreference}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Intended Intake</Label>
                                    <Input
                                        type="date"
                                        name="intendedIntake"
                                        value={formData.intendedIntake}
                                        onChange={handleChange}
                                    />
                                    {errors.intendedIntake && (
                                        <p className="mt-1 text-sm text-red-600">{errors.intendedIntake}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Status *</Label>
                                    <Select
                                        name="status"
                                        defaultValue={formData.status}
                                        options={LeadStatuses.map((s) => ({
                                            value: s,
                                            label: s.charAt(0).toUpperCase() + s.slice(1)
                                        }))}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                                    />
                                </div>
                                {user.role && user.role === "admin" && <div>
                                    <Label>Source *</Label>
                                    <Select
                                        name="source"
                                        defaultValue={formData.source}
                                        options={LeadSources.map((s) => ({
                                            value: s,
                                            label: s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                                        }))}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
                                    />
                                    {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source}</p>}
                                </div>}
                                {user.role && user.role === "admin" && <div className="md:col-span-2">
                                    <Label>Assigned Counselor</Label>
                                    <Select
                                        name="assignedCounselor"
                                        defaultValue={formData.assignedCounselor}
                                        options={allCounselors.map((c) => ({
                                            value: c._id,
                                            label: c.name || c.email
                                        }))}
                                        onChange={(value) => setFormData((prev) => ({ ...prev, assignedCounselor: value }))}
                                    />
                                </div>}
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
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {selectedLead ? "Save Changes" : "Create Lead"}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} className="max-w-lg">
                {selectedLead && (
                    <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                        <div className="px-2 pr-14">
                            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirm Deletion</h4>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete lead <strong>{selectedLead.fullName}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="px-2">
                            <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Warning</h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>Deleting this lead will permanently remove all associated data.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={deleteLead}>
                                Delete Lead
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}