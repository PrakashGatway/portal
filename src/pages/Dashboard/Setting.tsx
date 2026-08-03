import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import moment from "moment";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import { Pencil, Trash2, X, Plus, Image as ImageIcon, Bell, Layout, FileText } from "lucide-react";
import RichTextEditor from "../../components/TextEditor";
import NotificationManagement from "../../components/notificationManagement"; 


const BANNER_TYPE = "Banner";
const OTHER_TYPE = "other";

const LAYOUT_OPTIONS = [
  { value: "layout-1", label: "Layout 1 (50:50)" },
  { value: "layout-2", label: "Layout 2 (70:30)" },
  { value: "layout-3", label: "Layout 3 (30:70)" },
  { value: "layout-4", label: "Layout 4 (100%)" },
];


interface BannerItem {
  Banner: {
    file: string;
    alt: string;
  };
  subBanner: {
    file: string;
    alt: string;
  };
}

interface Banner {
  _id: string;
  name: string;
  description: string;
  key: string;
  isActive: boolean;
  bannerLayout: string;
  Banners: BannerItem[];
  extraData?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  key: string;
  isActive: boolean;
  bannerLayout: string;
  extraData?: string;
  Banners: {
    Banner: {
      file: string;
      alt: string;
    };
    subBanner: {
      file: string;
      alt: string;
    };
  }[];
}

interface Filters {
  page: number;
  limit: number;
  sortBy: string;
  isActive: string;
  search: string;
}

type BannerType = typeof BANNER_TYPE | typeof OTHER_TYPE;


const INITIAL_FORM_DATA: FormData = {
  name: "",
  description: "",
  key: "",
  isActive: true,
  bannerLayout: "",
  extraData: "",
  Banners: [
    {
      Banner: {
        file: "",
        alt: "",
      },
      subBanner: {
        file: "",
        alt: "",
      },
    },
  ],
};

const INITIAL_FILTERS: Filters = {
  page: 1,
  limit: 10,
  sortBy: "-createdAt",
  isActive: "",
  search: "",
};


const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


const bannerService = {
  fetchAll: (params: any) => api.get("/Banner", { params }),
  create: (data: any) => api.post("/Banner", data),
  update: (id: string, data: any) => api.put(`/Banner/${id}`, data),
  delete: (id: string) => api.delete(`/Banner/${id}`),
  toggleStatus: (id: string, status: boolean) =>
    api.put(`/Banner/${id}`, { isActive: status }),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};


const validateBannerForm = (data: FormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = "Banner name is required";
  } else if (data.name.length > 50) {
    errors.name = "Name cannot exceed 50 characters";
  }

  if (!data.key.trim()) {
    errors.key = "Key is required";
  } else if (!/^[a-z0-9-]+$/.test(data.key)) {
    errors.key = "Key can only contain lowercase letters, numbers, and hyphens";
  }

  if (data.description.length > 500) {
    errors.description = "Description cannot exceed 500 characters";
  }

  data.Banners.forEach((bannerPair, index) => {
    if (!bannerPair.Banner.file) {
      errors[`banner_${index}`] = `Banner ${index + 1} image is required`;
    }
    if (!bannerPair.Banner.alt) {
      errors[`banner_alt_${index}`] = `Banner ${index + 1} alt text is required`;
    }
  });

  return errors;
};



// Image Preview Component
const ImagePreview: React.FC<{ url: string; alt: string; onRemove?: () => void }> = ({
  url,
  alt,
  onRemove,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!url) return null;

  return (
    <>
      <div className="relative group">
        <img
          src={url}
          alt={alt}
          className="w-16 h-16 object-cover cursor-pointer rounded border border-gray-200 dark:border-gray-600"
          onClick={() => setIsOpen(true)}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Image Preview Modal */}
      {isOpen && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-4xl">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{alt || "Image Preview"}</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <img src={url} alt={alt} className="w-full h-auto max-h-[70vh] object-contain" />
          </div>
        </Modal>
      )}
    </>
  );
};

// Banner Pair Component
interface BannerPairProps {
  index: number;
  pair: BannerItem;
  errors: Record<string, string>;
  uploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number, type: "banner" | "subBanner") => void;
  onAltChange: (index: number, type: "banner" | "subBanner", value: string) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
}

const BannerPair: React.FC<BannerPairProps> = ({
  index,
  pair,
  errors,
  uploading,
  onFileUpload,
  onAltChange,
  onRemove,
  isRemovable,
}) => {
  return (
    <div className="border rounded-lg p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex justify-between items-center mb-4">
        <span className="font-medium text-sm">Pair {index + 1}</span>
        {isRemovable && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 px-2 py-1 text-sm flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Remove
          </button>
        )}
      </div>

      {/* Banner Image */}
      <div className="mb-4">
        <Label>Banner Image *</Label>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onFileUpload(e, index, "banner")}
              className="flex-1"
              disabled={uploading}
            />
          </div>
          {pair.Banner.file && (
            <ImagePreview
              url={pair.Banner.file}
              alt={pair.Banner.alt}
              onRemove={() => {
                onAltChange(index, "banner", "");
                // Reset file input
                const input = document.querySelector(`input[data-index="${index}"][data-type="banner"]`) as HTMLInputElement;
                if (input) input.value = "";
              }}
            />
          )}
        </div>
        {errors[`banner_${index}`] && (
          <p className="mt-1 text-sm text-red-600">{errors[`banner_${index}`]}</p>
        )}
      </div>

      {/* Banner Alt Text */}
      <div className="mb-4">
        <Label>Banner Alt Text *</Label>
        <Input
          type="text"
          value={pair.Banner.alt}
          onChange={(e) => onAltChange(index, "banner", e.target.value)}
          placeholder="Enter banner alt text"
          className={errors[`banner_alt_${index}`] ? "border-red-500" : ""}
        />
        {errors[`banner_alt_${index}`] && (
          <p className="mt-1 text-sm text-red-600">{errors[`banner_alt_${index}`]}</p>
        )}
      </div>

      {/* Sub-Banner Image */}
      <div className="mb-4">
        <Label>Sub-Banner Image</Label>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => onFileUpload(e, index, "subBanner")}
              className="flex-1"
              disabled={uploading}
            />
          </div>
          {pair.subBanner.file && (
            <ImagePreview
              url={pair.subBanner.file}
              alt={pair.subBanner.alt}
              onRemove={() => {
                onAltChange(index, "subBanner", "");
                const input = document.querySelector(`input[data-index="${index}"][data-type="subBanner"]`) as HTMLInputElement;
                if (input) input.value = "";
              }}
            />
          )}
        </div>
        {errors[`subbanner_${index}`] && (
          <p className="mt-1 text-sm text-red-600">{errors[`subbanner_${index}`]}</p>
        )}
      </div>

      {/* Sub-Banner Alt Text */}
      <div>
        <Label>Sub-Banner Alt Text</Label>
        <Input
          type="text"
          value={pair.subBanner.alt}
          onChange={(e) => onAltChange(index, "subBanner", e.target.value)}
          placeholder="Enter sub-banner alt text"
          className={errors[`subbanner_alt_${index}`] ? "border-red-500" : ""}
        />
        {errors[`subbanner_alt_${index}`] && (
          <p className="mt-1 text-sm text-red-600">{errors[`subbanner_alt_${index}`]}</p>
        )}
      </div>
    </div>
  );
};



// Section Header Component
interface SectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  onAdd: () => void;
  addButtonText: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  count,
  onAdd,
  addButtonText,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {count !== undefined && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {count} items
          </p>
        )}
      </div>
    </div>
    <button
      onClick={onAdd}
      className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-theme-xs"
    >
      <Plus className="w-4 h-4" />
      {addButtonText}
    </button>
  </div>
);

// Banner Section Component
const BannerSection: React.FC<{
  banners: any[];
  loading: boolean;
  filters: Filters;
  total: number;
  loadingStates: Record<string, boolean>;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onToggleStatus: (id: string, status: boolean) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onAdd: () => void;
}> = ({
  banners,
  loading,
  filters,
  total,
  loadingStates,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onToggleStatus,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const memoizedBanners = useMemo(() => {
    return banners.map((banner) => ({
      ...banner,
      formattedDate: moment(banner.createdAt).format("MMM D, YYYY"),
      bannerCount: banner.Banners?.length || 0,
      displayType: banner.bannerLayout && banner.bannerLayout.startsWith('layout-') 
        ? 'Banner' 
        : 'Other',
    }));
  }, [banners]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <SectionHeader
        title="Banners & Content"
        icon={<Layout className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        count={banners.length}
        onAdd={onAdd}
        addButtonText="Add Banner"
      />

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={onFilterChange}
            placeholder="Search banners..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            name="isActive"
            value={filters.isActive}
            onChange={onFilterChange}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rows per page
          </label>
          <select
            name="limit"
            value={filters.limit}
            onChange={onFilterChange}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {[5, 10, 20, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onResetFilters}
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
                {[
                  "Name",
                  "Key",
                  "Type",
                  "Layout",
                  "Banners",
                  "Status",
                  "Created",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {memoizedBanners.length > 0 ? (
                memoizedBanners.map((banner) => (
                  <tr
                    key={banner._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                        {banner.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {banner.key}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        banner.displayType === 'Banner' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {banner.displayType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {banner.bannerLayout || "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {banner.bannerCount} pairs
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <span
                        onClick={() => onToggleStatus(banner._id, banner.isActive)}
                        className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${
                          loadingStates[banner._id]
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        } ${
                          banner.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {loadingStates[banner._id]
                          ? "Updating..."
                          : banner.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {banner.formattedDate}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(banner)}
                          className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          aria-label="Edit banner"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onDelete(banner)}
                          className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          aria-label="Delete banner"
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
                    colSpan={8}
                    className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-300"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                      <p>No banners found</p>
                      <button
                        onClick={onAdd}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Create your first banner
                      </button>
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
              onClick={() => onPageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${
                filters.page === 1
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
                  onClick={() => onPageChange(pageNum)}
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
              onClick={() => onPageChange(filters.page + 1)}
              disabled={filters.page * filters.limit >= total}
              className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${
                filters.page * filters.limit >= total
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
  );
};

// Other Content Section Component
const OtherContentSection: React.FC<{
  banners: any[];
  loading: boolean;
  filters: Filters;
  total: number;
  loadingStates: Record<string, boolean>;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onToggleStatus: (id: string, status: boolean) => void;
  onEdit: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onAdd: () => void;
}> = ({
  banners,
  loading,
  filters,
  total,
  loadingStates,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onToggleStatus,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const otherBanners = banners.filter(b => !b.bannerLayout || !b.bannerLayout.startsWith('layout-'));
  
  const memoizedOtherBanners = useMemo(() => {
    return otherBanners.map((banner) => ({
      ...banner,
      formattedDate: moment(banner.createdAt).format("MMM D, YYYY"),
      bannerCount: banner.Banners?.length || 0,
      displayType: 'Other',
    }));
  }, [otherBanners]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
      <SectionHeader
        title="Other Content"
        icon={<FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        count={otherBanners.length}
        onAdd={onAdd}
        addButtonText="Add Content"
      />

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
                {[
                  "Name",
                  "Key",
                  "Content",
                  "Status",
                  "Created",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {memoizedOtherBanners.length > 0 ? (
                memoizedOtherBanners.map((banner) => (
                  <tr
                    key={banner._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
                        {banner.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {banner.key}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                        {banner.extraData ? 'Content available' : 'No content'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <span
                        onClick={() => onToggleStatus(banner._id, banner.isActive)}
                        className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${
                          loadingStates[banner._id]
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        } ${
                          banner.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {loadingStates[banner._id]
                          ? "Updating..."
                          : banner.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {banner.formattedDate}
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(banner)}
                          className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          aria-label="Edit content"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onDelete(banner)}
                          className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          aria-label="Delete content"
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
                    colSpan={6}
                    className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-300"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p>No other content found</p>
                      <button
                        onClick={onAdd}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Create your first content
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Notification Section Component
const NotificationSection: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
     
      <NotificationManagement />
    </div>
  );
};


export default function BannerManagement() {
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [bannerType, setBannerType] = useState<BannerType>(BANNER_TYPE);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'banners' | 'content' | 'notifications'>('banners');

  // Debounced search
  const debouncedSearch = useDebounce(filters.search, 500);

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sortBy,
      };

      const response = await bannerService.fetchAll(params);
      setBanners(response.data?.data || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      toast.error("Failed to load banners");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners, debouncedSearch]);

  // Upload image helper
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large (max 5MB)");
      return null;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return null;
    }

    try {
      const { data } = await bannerService.uploadImage(file);
      return data?.file?.filename || data?.file?.path || null;
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  // Handle file upload
  const handleBannerFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    type: "banner" | "subBanner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadedUrl = await uploadImage(file);
    setUploading(false);

    if (!uploadedUrl) return;

    const field = type === "banner" ? "Banner" : "subBanner";

    setFormData((prev) => {
      const updatedBanners = [...prev.Banners];
      updatedBanners[index] = {
        ...updatedBanners[index],
        [field]: {
          ...updatedBanners[index][field],
          file: uploadedUrl,
        },
      };
      return { ...prev, Banners: updatedBanners };
    });
  };

  // Handle alt text change
  const handleAltChange = (
    index: number,
    type: "banner" | "subBanner",
    value: string
  ) => {
    const field = type === "banner" ? "Banner" : "subBanner";

    setFormData((prev) => {
      const updatedBanners = [...prev.Banners];
      updatedBanners[index] = {
        ...updatedBanners[index],
        [field]: {
          ...updatedBanners[index][field],
          alt: value,
        },
      };
      return { ...prev, Banners: updatedBanners };
    });
  };

  // Add/Remove banner pairs
  const addBannerPair = () => {
    setFormData((prev) => ({
      ...prev,
      Banners: [
        ...prev.Banners,
        {
          Banner: { file: "", alt: "" },
          subBanner: { file: "", alt: "" },
        },
      ],
    }));
  };

  const removeBannerPair = (index: number) => {
    if (formData.Banners.length <= 1) {
      toast.warning("At least one banner pair is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      Banners: prev.Banners.filter((_, i) => i !== index),
    }));
  };

  // Save banner
  const handleSaveBanner = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        key: formData.key,
        bannerLayout: formData.bannerLayout,
        Banners: formData.Banners,
        extraData: formData.extraData,
        isActive: formData.isActive
      };

      if (selectedBanner) {
        await bannerService.update(selectedBanner._id, payload);
        toast.success("Banner updated successfully");
      } else {
        await bannerService.create(payload);
        toast.success("Banner created successfully");
      }

      fetchBanners();
      closeModal();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      const errorMessage =
        error.response?.status === 409
          ? "A banner with this key already exists"
          : error.response?.data?.message || error.message || "Failed to save banner";
      toast.error(errorMessage);
    }
  };

  // Toggle status
  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [bannerId]: true }));
    try {
      await bannerService.toggleStatus(bannerId, !currentStatus);
      toast.success(`Banner ${currentStatus ? "deactivated" : "activated"} successfully`);
      fetchBanners();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update banner status");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bannerId]: false }));
    }
  };

  // Delete banner
  const deleteBanner = async () => {
    if (!selectedBanner) return;

    try {
      await bannerService.delete(selectedBanner._id);
      toast.success("Banner deleted successfully");
      fetchBanners();
      setDeleteModalOpen(false);
      setSelectedBanner(null);
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Failed to delete banner");
    }
  };

  // Modal handlers
  const openCreateModal = (type: BannerType = BANNER_TYPE) => {
    setBannerType(type);
    setSelectedBanner(null);
    setFormData({
      ...INITIAL_FORM_DATA,
      extraData: type === OTHER_TYPE ? "" : "",
      bannerLayout: type === BANNER_TYPE ? "" : "",
    });
    setErrors({});
    setEditModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    const type = banner.bannerLayout && banner.bannerLayout.startsWith('layout-') 
      ? BANNER_TYPE 
      : OTHER_TYPE;
    
    setBannerType(type);
    setSelectedBanner(banner);
    
    setFormData({
      name: banner.name || "",
      description: banner.description || "",
      key: banner.key || "",
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      bannerLayout: banner.bannerLayout || "",
      extraData: banner.extraData || "",
      Banners: banner.Banners?.length > 0
        ? banner.Banners.map(bannerPair => ({
            Banner: {
              file: bannerPair.Banner?.file || "",
              alt: bannerPair.Banner?.alt || "",
            },
            subBanner: {
              file: bannerPair.subBanner?.file || "",
              alt: bannerPair.subBanner?.alt || "",
            },
          }))
        : [
            {
              Banner: { file: "", alt: "" },
              subBanner: { file: "", alt: "" },
            },
          ],
    });
    
    setErrors({});
    setEditModalOpen(true);
  };

  const closeModal = () => {
    setEditModalOpen(false);
    setSelectedBanner(null);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  // Filter handlers
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: name !== "page" ? 1 : prev.page,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Section navigation
  const sections = [
    { id: 'banners', label: 'Banners', icon: Layout },
    { id: 'content', label: 'Other Content', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="w-full">
      
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-blue-600"
              >
                <path
                  d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H12V17H10V12H5V10H10V5H12V10H17V12Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                Setting
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage banners, content, and notifications
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {banners.length} items total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4" aria-label="Tabs">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeSection === section.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>


      <div className="space-y-4">
        {/* Banners Section */}
        {activeSection === 'banners' && (
          <BannerSection
            banners={banners.filter(b => b.bannerLayout && b.bannerLayout.startsWith('layout-'))}
            loading={loading}
            filters={filters}
            total={total}
            loadingStates={loadingStates}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
            onPageChange={handlePageChange}
            onToggleStatus={toggleBannerStatus}
            onEdit={openEditModal}
            onDelete={(banner) => {
              setSelectedBanner(banner);
              setDeleteModalOpen(true);
            }}
            onAdd={() => openCreateModal(BANNER_TYPE)}
          />
        )}

        {/* Other Content Section */}
        {activeSection === 'content' && (
          <OtherContentSection
            banners={banners}
            loading={loading}
            filters={filters}
            total={total}
            loadingStates={loadingStates}
            onFilterChange={handleFilterChange}
            onResetFilters={resetFilters}
            onPageChange={handlePageChange}
            onToggleStatus={toggleBannerStatus}
            onEdit={openEditModal}
            onDelete={(banner) => {
              setSelectedBanner(banner);
              setDeleteModalOpen(true);
            }}
            onAdd={() => openCreateModal(OTHER_TYPE)}
          />
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <NotificationSection />
        )}
      </div>


      <Modal
        isOpen={editModalOpen}
        onClose={closeModal}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {selectedBanner ? "Edit " : "Add New "} {bannerType}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {selectedBanner
                ? "Update banner details below"
                : `Create a new ${bannerType.toLowerCase()} with images and alt text`}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveBanner();
            }}
            className="flex flex-col"
          >
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Name */}
                  <div className="col-span-1">
                    <Label>Name *</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setFormData((prev) => ({ ...prev, [name]: value }));
                        if (errors[name]) {
                          setErrors((prev) => ({ ...prev, [name]: "" }));
                        }
                      }}
                      placeholder="Enter banner name"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Key */}
                  <div className="col-span-1">
                    <Label>Key *</Label>
                    <Input
                      type="text"
                      name="key"
                      value={formData.key}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setFormData((prev) => ({ ...prev, [name]: value }));
                        if (errors[name]) {
                          setErrors((prev) => ({ ...prev, [name]: "" }));
                        }
                      }}
                      placeholder="Enter unique key (e.g., home-page)"
                      className={errors.key ? "border-red-500" : ""}
                    />
                    {errors.key && (
                      <p className="mt-1 text-sm text-red-600">{errors.key}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setFormData((prev) => ({ ...prev, [name]: value }));
                        if (errors[name]) {
                          setErrors((prev) => ({ ...prev, [name]: "" }));
                        }
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                        errors.description ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter banner description"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Banner Layout - Only for Banner type */}
                  {bannerType === BANNER_TYPE && (
                    <div className="col-span-2">
                      <Label>Banner Layout</Label>
                      <Select
                        defaultValue={formData.bannerLayout}
                        options={LAYOUT_OPTIONS}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            bannerLayout: value,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* Banner Pairs - Only for Banner type */}
                  {bannerType === BANNER_TYPE && (
                    <div className="col-span-2">
                      <Label className="flex justify-between items-center">
                        Banner Pairs
                        <button
                          type="button"
                          className="rounded border-2 border-green-500 px-3 py-1 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-1"
                          onClick={addBannerPair}
                        >
                          <Plus className="w-4 h-4" /> Add Pair
                        </button>
                      </Label>
                      <div className="space-y-4 mt-2">
                        {formData.Banners.map((bannerPair, idx) => (
                          <BannerPair
                            key={`pair-${idx}`}
                            index={idx}
                            pair={bannerPair}
                            errors={errors}
                            uploading={uploading}
                            onFileUpload={handleBannerFileUpload}
                            onAltChange={handleAltChange}
                            onRemove={removeBannerPair}
                            isRemovable={formData.Banners.length > 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rich Text Editor - Only for Other type */}
                  {bannerType === OTHER_TYPE && (
                    <div className="col-span-2">
                      <Label>Content</Label>
                      <RichTextEditor
                        initialValue={formData.extraData || ""}
                        onChange={(content) =>
                          setFormData((prev) => ({
                            ...prev,
                            extraData: content,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* Active Status */}
                  <div className="col-span-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Active</span>
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading
                  ? "Uploading..."
                  : selectedBanner
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </div>
      </Modal>


      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedBanner(null);
        }}
        className="max-w-lg"
      >
        {selectedBanner && (
          <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
            <div className="px-2 pr-14">
              <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Confirm Deletion
              </h4>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
                Are you sure you want to delete this item? This action cannot
                be undone.
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
                        Deleting "<strong>{selectedBanner.name}</strong>" will
                        permanently remove it from the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedBanner(null);
                }}
                className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteBanner}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
















// import { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import moment from "moment";
// import { Modal } from "../../components/ui/modal";
// import Button from "../../components/ui/button/Button";
// import Input from "../../components/form/input/InputField";
// import Label from "../../components/form/Label";
// import Select from "../../components/form/Select";
// import { toast } from "react-toastify";
// import api from "../../axiosInstance";
// import { Pencil, Trash2, X, Plus, Image as ImageIcon } from "lucide-react";
// import RichTextEditor from "../../components/TextEditor";


// const BANNER_TYPE = "Banner";
// const OTHER_TYPE = "other";

// const LAYOUT_OPTIONS = [
//   { value: "layout-1", label: "Layout 1 (50:50)" },
//   { value: "layout-2", label: "Layout 2 (70:30)" },
//   { value: "layout-3", label: "Layout 3 (30:70)" },
//   { value: "layout-4", label: "Layout 4 (100%)" },
// ];


// interface BannerItem {
//   Banner: {
//     file: string;
//     alt: string;
//   };
//   subBanner: {
//     file: string;
//     alt: string;
//   };
// }

// interface Banner {
//   _id: string;
//   name: string;
//   description: string;
//   key: string;
//   isActive: boolean;
//   bannerLayout: string;
//   Banners: BannerItem[];
//   extraData?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface FormData {
//   name: string;
//   description: string;
//   key: string;
//   isActive: boolean;
//   bannerLayout: string;
//   extraData?: string;
//   Banners: {
//     Banner: {
//       file: string;
//       alt: string;
//     };
//     subBanner: {
//       file: string;
//       alt: string;
//     };
//   }[];
// }

// interface Filters {
//   page: number;
//   limit: number;
//   sortBy: string;
//   isActive: string;
//   search: string;
// }

// type BannerType = typeof BANNER_TYPE | typeof OTHER_TYPE;

// // ============================================
// // INITIAL STATE
// // ============================================
// const INITIAL_FORM_DATA: FormData = {
//   name: "",
//   description: "",
//   key: "",
//   isActive: true,
//   bannerLayout: "",
//   extraData: "",
//   Banners: [
//     {
//       Banner: {
//         file: "",
//         alt: "",
//       },
//       subBanner: {
//         file: "",
//         alt: "",
//       },
//     },
//   ],
// };

// const INITIAL_FILTERS: Filters = {
//   page: 1,
//   limit: 10,
//   sortBy: "-createdAt",
//   isActive: "",
//   search: "",
// };

// // ============================================
// // CUSTOM HOOKS
// // ============================================
// const useDebounce = <T,>(value: T, delay: number): T => {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// // ============================================
// // BANNER SERVICE
// // ============================================
// const bannerService = {
//   fetchAll: (params: any) => api.get("/Banner", { params }),
//   create: (data: any) => api.post("/Banner", data),
//   update: (id: string, data: any) => api.put(`/Banner/${id}`, data),
//   delete: (id: string) => api.delete(`/Banner/${id}`),
//   toggleStatus: (id: string, status: boolean) =>
//     api.put(`/Banner/${id}`, { isActive: status }),
//   uploadImage: (file: File) => {
//     const formData = new FormData();
//     formData.append("image", file);
//     return api.post("/upload/single", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });
//   },
// };

// // ============================================
// // VALIDATION
// // ============================================
// const validateBannerForm = (data: FormData): Record<string, string> => {
//   const errors: Record<string, string> = {};

//   if (!data.name.trim()) {
//     errors.name = "Banner name is required";
//   } else if (data.name.length > 50) {
//     errors.name = "Name cannot exceed 50 characters";
//   }

//   if (!data.key.trim()) {
//     errors.key = "Key is required";
//   } else if (!/^[a-z0-9-]+$/.test(data.key)) {
//     errors.key = "Key can only contain lowercase letters, numbers, and hyphens";
//   }

//   if (data.description.length > 500) {
//     errors.description = "Description cannot exceed 500 characters";
//   }

//   data.Banners.forEach((bannerPair, index) => {
//     if (!bannerPair.Banner.file) {
//       errors[`banner_${index}`] = `Banner ${index + 1} image is required`;
//     }
//     if (!bannerPair.Banner.alt) {
//       errors[`banner_alt_${index}`] = `Banner ${index + 1} alt text is required`;
//     }
//   });

//   return errors;
// };

// // ============================================
// // SUB-COMPONENTS
// // ============================================

// // Image Preview Component
// const ImagePreview: React.FC<{ url: string; alt: string; onRemove?: () => void }> = ({
//   url,
//   alt,
//   onRemove,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);

//   if (!url) return null;

//   return (
//     <>
//       <div className="relative group">
//         <img
//           src={url}
//           alt={alt}
//           className="w-16 h-16 object-cover cursor-pointer rounded border border-gray-200 dark:border-gray-600"
//           onClick={() => setIsOpen(true)}
//         />
//         {onRemove && (
//           <button
//             onClick={onRemove}
//             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//           >
//             <X className="w-3 h-3" />
//           </button>
//         )}
//       </div>

//       {/* Image Preview Modal */}
//       {isOpen && (
//         <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-4xl">
//           <div className="p-4">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold">{alt || "Image Preview"}</h3>
//               <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
//                 <X className="w-6 h-6" />
//               </button>
//             </div>
//             <img src={url} alt={alt} className="w-full h-auto max-h-[70vh] object-contain" />
//           </div>
//         </Modal>
//       )}
//     </>
//   );
// };

// // Banner Pair Component
// interface BannerPairProps {
//   index: number;
//   pair: BannerItem;
//   errors: Record<string, string>;
//   uploading: boolean;
//   onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, index: number, type: "banner" | "subBanner") => void;
//   onAltChange: (index: number, type: "banner" | "subBanner", value: string) => void;
//   onRemove: (index: number) => void;
//   isRemovable: boolean;
// }

// const BannerPair: React.FC<BannerPairProps> = ({
//   index,
//   pair,
//   errors,
//   uploading,
//   onFileUpload,
//   onAltChange,
//   onRemove,
//   isRemovable,
// }) => {
//   return (
//     <div className="border rounded-lg p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
//       <div className="flex justify-between items-center mb-4">
//         <span className="font-medium text-sm">Pair {index + 1}</span>
//         {isRemovable && (
//           <button
//             type="button"
//             onClick={() => onRemove(index)}
//             className="text-red-500 hover:text-red-700 px-2 py-1 text-sm flex items-center gap-1"
//           >
//             <X className="w-4 h-4" /> Remove
//           </button>
//         )}
//       </div>

//       {/* Banner Image */}
//       <div className="mb-4">
//         <Label>Banner Image *</Label>
//         <div className="flex items-center gap-3 flex-wrap">
//           <div className="flex-1 min-w-[200px]">
//             <Input
//               type="file"
//               accept="image/*"
//               onChange={(e) => onFileUpload(e, index, "banner")}
//               className="flex-1"
//               disabled={uploading}
//             />
//           </div>
//           {pair.Banner.file && (
//             <ImagePreview
//               url={pair.Banner.file}
//               alt={pair.Banner.alt}
//               onRemove={() => {
//                 onAltChange(index, "banner", "");
//                 // Reset file input
//                 const input = document.querySelector(`input[data-index="${index}"][data-type="banner"]`) as HTMLInputElement;
//                 if (input) input.value = "";
//               }}
//             />
//           )}
//         </div>
//         {errors[`banner_${index}`] && (
//           <p className="mt-1 text-sm text-red-600">{errors[`banner_${index}`]}</p>
//         )}
//       </div>

//       {/* Banner Alt Text */}
//       <div className="mb-4">
//         <Label>Banner Alt Text *</Label>
//         <Input
//           type="text"
//           value={pair.Banner.alt}
//           onChange={(e) => onAltChange(index, "banner", e.target.value)}
//           placeholder="Enter banner alt text"
//           className={errors[`banner_alt_${index}`] ? "border-red-500" : ""}
//         />
//         {errors[`banner_alt_${index}`] && (
//           <p className="mt-1 text-sm text-red-600">{errors[`banner_alt_${index}`]}</p>
//         )}
//       </div>

//       {/* Sub-Banner Image */}
//       <div className="mb-4">
//         <Label>Sub-Banner Image</Label>
//         <div className="flex items-center gap-3 flex-wrap">
//           <div className="flex-1 min-w-[200px]">
//             <Input
//               type="file"
//               accept="image/*"
//               onChange={(e) => onFileUpload(e, index, "subBanner")}
//               className="flex-1"
//               disabled={uploading}
//             />
//           </div>
//           {pair.subBanner.file && (
//             <ImagePreview
//               url={pair.subBanner.file}
//               alt={pair.subBanner.alt}
//               onRemove={() => {
//                 onAltChange(index, "subBanner", "");
//                 const input = document.querySelector(`input[data-index="${index}"][data-type="subBanner"]`) as HTMLInputElement;
//                 if (input) input.value = "";
//               }}
//             />
//           )}
//         </div>
//         {errors[`subbanner_${index}`] && (
//           <p className="mt-1 text-sm text-red-600">{errors[`subbanner_${index}`]}</p>
//         )}
//       </div>

//       {/* Sub-Banner Alt Text */}
//       <div>
//         <Label>Sub-Banner Alt Text</Label>
//         <Input
//           type="text"
//           value={pair.subBanner.alt}
//           onChange={(e) => onAltChange(index, "subBanner", e.target.value)}
//           placeholder="Enter sub-banner alt text"
//           className={errors[`subbanner_alt_${index}`] ? "border-red-500" : ""}
//         />
//         {errors[`subbanner_alt_${index}`] && (
//           <p className="mt-1 text-sm text-red-600">{errors[`subbanner_alt_${index}`]}</p>
//         )}
//       </div>
//     </div>
//   );
// };

// // ============================================
// // MAIN COMPONENT
// // ============================================
// export default function BannerManagement() {
//   // State
//   const [banners, setBanners] = useState<Banner[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [total, setTotal] = useState(0);
//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
//   const [bannerType, setBannerType] = useState<BannerType>(BANNER_TYPE);
//   const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
//   const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
//   const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [uploading, setUploading] = useState(false);
//   const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

//   // Debounced search
//   const debouncedSearch = useDebounce(filters.search, 500);

//   // Fetch banners
//   const fetchBanners = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = {
//         ...filters,
//         page: filters.page,
//         limit: filters.limit,
//         sort: filters.sortBy,
//       };

//       const response = await bannerService.fetchAll(params);
//       setBanners(response.data?.data || []);
//       setTotal(response.data?.total || 0);
//     } catch (error) {
//       toast.error("Failed to load banners");
//       console.error("Fetch error:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [filters]);

//   useEffect(() => {
//     fetchBanners();
//   }, [fetchBanners, debouncedSearch]);

//   // Upload image helper
//   const uploadImage = async (file: File): Promise<string | null> => {
//     if (!file) return null;

//     // Validate file size (5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image file is too large (max 5MB)");
//       return null;
//     }

//     // Validate file type
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please upload an image file");
//       return null;
//     }

//     try {
//       const { data } = await bannerService.uploadImage(file);
//       return data?.file?.filename || data?.file?.path || null;
//     } catch (error) {
//       console.error("Upload failed:", error);
//       toast.error("Failed to upload image");
//       return null;
//     }
//   };

//   // Handle file upload
//   const handleBannerFileUpload = async (
//     e: React.ChangeEvent<HTMLInputElement>,
//     index: number,
//     type: "banner" | "subBanner"
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setUploading(true);
//     const uploadedUrl = await uploadImage(file);
//     setUploading(false);

//     if (!uploadedUrl) return;

//     const field = type === "banner" ? "Banner" : "subBanner";

//     setFormData((prev) => {
//       const updatedBanners = [...prev.Banners];
//       updatedBanners[index] = {
//         ...updatedBanners[index],
//         [field]: {
//           ...updatedBanners[index][field],
//           file: uploadedUrl,
//         },
//       };
//       return { ...prev, Banners: updatedBanners };
//     });
//   };

//   // Handle alt text change
//   const handleAltChange = (
//     index: number,
//     type: "banner" | "subBanner",
//     value: string
//   ) => {
//     const field = type === "banner" ? "Banner" : "subBanner";

//     setFormData((prev) => {
//       const updatedBanners = [...prev.Banners];
//       updatedBanners[index] = {
//         ...updatedBanners[index],
//         [field]: {
//           ...updatedBanners[index][field],
//           alt: value,
//         },
//       };
//       return { ...prev, Banners: updatedBanners };
//     });
//   };

//   // Add/Remove banner pairs
//   const addBannerPair = () => {
//     setFormData((prev) => ({
//       ...prev,
//       Banners: [
//         ...prev.Banners,
//         {
//           Banner: { file: "", alt: "" },
//           subBanner: { file: "", alt: "" },
//         },
//       ],
//     }));
//   };

//   const removeBannerPair = (index: number) => {
//     if (formData.Banners.length <= 1) {
//       toast.warning("At least one banner pair is required");
//       return;
//     }
//     setFormData((prev) => ({
//       ...prev,
//       Banners: prev.Banners.filter((_, i) => i !== index),
//     }));
//   };

//   // Save banner
//   const handleSaveBanner = async () => {

//     try {
//       const payload = {
//         name: formData.name,
//         description: formData.description,
//         key: formData.key,
//         bannerLayout: formData.bannerLayout,
//         Banners: formData.Banners,
//         extraData: formData.extraData,
//         isActive: formData.isActive
//       };

//       if (selectedBanner) {
//         await bannerService.update(selectedBanner._id, payload);
//         toast.success("Banner updated successfully");
//       } else {
//         await bannerService.create(payload);
//         toast.success("Banner created successfully");
//       }

//       fetchBanners();
//       closeModal();
//     } catch (error: any) {
//       console.error("Error saving banner:", error);
//       const errorMessage =
//         error.response?.status === 409
//           ? "A banner with this key already exists"
//           : error.response?.data?.message || error.message || "Failed to save banner";
//       toast.error(errorMessage);
//     }
//   };

//   // Toggle status
//   const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
//     setLoadingStates((prev) => ({ ...prev, [bannerId]: true }));
//     try {
//       await bannerService.toggleStatus(bannerId, !currentStatus);
//       toast.success(`Banner ${currentStatus ? "deactivated" : "activated"} successfully`);
//       fetchBanners();
//     } catch (error) {
//       console.error("Error toggling status:", error);
//       toast.error("Failed to update banner status");
//     } finally {
//       setLoadingStates((prev) => ({ ...prev, [bannerId]: false }));
//     }
//   };

//   // Delete banner
//   const deleteBanner = async () => {
//     if (!selectedBanner) return;

//     try {
//       await bannerService.delete(selectedBanner._id);
//       toast.success("Banner deleted successfully");
//       fetchBanners();
//       setDeleteModalOpen(false);
//       setSelectedBanner(null);
//     } catch (error) {
//       console.error("Error deleting banner:", error);
//       toast.error("Failed to delete banner");
//     }
//   };

//   // Modal handlers
//   const openCreateModal = (type: BannerType = BANNER_TYPE) => {
//     setBannerType(type);
//     setSelectedBanner(null);
//     setFormData({
//       ...INITIAL_FORM_DATA,
//       extraData: type === OTHER_TYPE ? "" : "",
//       // Set default layout based on type
//       bannerLayout: type === BANNER_TYPE ? "" : "",
//     });
//     setErrors({});
//     setEditModalOpen(true);
//   };

//   // UPDATED: Open edit modal with proper data mapping
//   const openEditModal = (banner: Banner) => {
//     // Determine the type based on bannerLayout
//     const type = banner.bannerLayout && banner.bannerLayout.startsWith('layout-') 
//       ? BANNER_TYPE 
//       : OTHER_TYPE;
    
//     setBannerType(type);
//     setSelectedBanner(banner);
    
//     // Map the form data based on type
//     setFormData({
//       name: banner.name || "",
//       description: banner.description || "",
//       key: banner.key || "",
//       isActive: banner.isActive !== undefined ? banner.isActive : true,
//       bannerLayout: banner.bannerLayout || "",
//       extraData: banner.extraData || "",
//       Banners: banner.Banners?.length > 0
//         ? banner.Banners.map(bannerPair => ({
//             Banner: {
//               file: bannerPair.Banner?.file || "",
//               alt: bannerPair.Banner?.alt || "",
//             },
//             subBanner: {
//               file: bannerPair.subBanner?.file || "",
//               alt: bannerPair.subBanner?.alt || "",
//             },
//           }))
//         : [
//             {
//               Banner: { file: "", alt: "" },
//               subBanner: { file: "", alt: "" },
//             },
//           ],
//     });
    
//     setErrors({});
//     setEditModalOpen(true);
//   };

//   const closeModal = () => {
//     setEditModalOpen(false);
//     setSelectedBanner(null);
//     setFormData(INITIAL_FORM_DATA);
//     setErrors({});
//   };

//   // Filter handlers
//   const handleFilterChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({
//       ...prev,
//       [name]: value,
//       page: name !== "page" ? 1 : prev.page,
//     }));
//   };

//   const handlePageChange = (newPage: number) => {
//     setFilters((prev) => ({ ...prev, page: newPage }));
//   };

//   const resetFilters = () => {
//     setFilters(INITIAL_FILTERS);
//   };

//   // Memoized data
//   const memoizedBanners = useMemo(() => {
//     return banners.map((banner) => ({
//       ...banner,
//       formattedDate: moment(banner.createdAt).format("MMM D, YYYY"),
//       bannerCount: banner.Banners?.length || 0,
//       // Determine if it's a banner or other type
//       displayType: banner.bannerLayout && banner.bannerLayout.startsWith('layout-') 
//         ? 'Banner' 
//         : 'Other',
//     }));
//   }, [banners]);

//   return (
//     <div className="w-full overflow-x-auto">
//       {/* ============================================ */}
//       {/* HEADER SECTION */}
//       {/* ============================================ */}
//       <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-4 mb-3 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
//         <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
//           <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
//             <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 flex items-center justify-center bg-blue-50">
//               <svg
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 className="text-blue-600"
//               >
//                 <path
//                   d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H12V17H10V12H5V10H10V5H12V10H17V12Z"
//                   fill="currentColor"
//                 />
//               </svg>
//             </div>
//             <div className="order-3 xl:order-2">
//               <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
//                 Setting 
//               </h4>
//               <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   Manage your banners and Other things
//                 </p>
//                 <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {banners.length} banners
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:gap-4">
//             <button
//               onClick={() => openCreateModal(BANNER_TYPE)}
//               className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
//             >
//               <Plus className="w-4 h-4" />
//               Add Banner
//             </button>

//             <button
//               onClick={() => openCreateModal(OTHER_TYPE)}
//               className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
//             >
//               <Plus className="w-4 h-4" />
//               Add Other Data
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ============================================ */}
//       {/* TABLE SECTION */}
//       {/* ============================================ */}
//       <div className="min-h-[70vh] overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-white/[0.03] xl:px-4 xl:py-4">
//         {/* Filters */}
//         <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Search
//             </label>
//             <input
//               type="text"
//               name="search"
//               value={filters.search}
//               onChange={handleFilterChange}
//               placeholder="Search banners..."
//               className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Status
//             </label>
//             <select
//               name="isActive"
//               value={filters.isActive}
//               onChange={handleFilterChange}
//               className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//             >
//               <option value="">All Statuses</option>
//               <option value="true">Active</option>
//               <option value="false">Inactive</option>
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//               Rows per page
//             </label>
//             <select
//               name="limit"
//               value={filters.limit}
//               onChange={handleFilterChange}
//               className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//             >
//               {[5, 10, 20, 50].map((value) => (
//                 <option key={value} value={value}>
//                   {value}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="flex items-end">
//             <button
//               onClick={resetFilters}
//               className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
//             >
//               Reset Filters
//             </button>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
//           {loading ? (
//             <div className="flex h-64 items-center justify-center">
//               <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
//             </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//               <thead className="bg-gray-50 dark:bg-gray-800">
//                 <tr>
//                   {[
//                     "Name",
//                     "Key",
//                     "Type",
//                     "Layout",
//                     "Banners",
//                     "Status",
//                     "Created",
//                     "Actions",
//                   ].map((header) => (
//                     <th
//                       key={header}
//                       scope="col"
//                       className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
//                     >
//                       {header}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
//                 {memoizedBanners.length > 0 ? (
//                   memoizedBanners.map((banner) => (
//                     <tr
//                       key={banner._id}
//                       className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//                     >
//                       <td className="whitespace-nowrap px-2 py-4">
//                         <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">
//                           {banner.name}
//                         </span>
//                       </td>
//                       <td className="whitespace-nowrap px-2 py-4">
//                         <span className="text-sm text-gray-500 dark:text-gray-300">
//                           {banner.key}
//                         </span>
//                       </td>
//                       <td className="whitespace-nowrap px-2 py-4">
//                         <span className={`text-sm px-2 py-1 rounded-full ${
//                           banner.displayType === 'Banner' 
//                             ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
//                             : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
//                         }`}>
//                           {banner.displayType}
//                         </span>
//                       </td>
//                       <td className="whitespace-nowrap px-2 py-4">
//                         <span className="text-sm text-gray-500 dark:text-gray-300">
//                           {banner.bannerLayout || "N/A"}
//                         </span>
//                       </td>
//                       <td className="px-2 py-4">
//                         <span className="text-sm text-gray-500 dark:text-gray-300">
//                           {banner.bannerCount} pairs
//                         </span>
//                       </td>
//                       <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
//                         <span
//                           onClick={() =>
//                             toggleBannerStatus(banner._id, banner.isActive)
//                           }
//                           className={`inline-flex cursor-pointer rounded-full px-2 text-xs font-semibold leading-5 ${
//                             loadingStates[banner._id]
//                               ? "opacity-50 cursor-not-allowed"
//                               : ""
//                           } ${
//                             banner.isActive
//                               ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
//                               : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
//                           }`}
//                         >
//                           {loadingStates[banner._id]
//                             ? "Updating..."
//                             : banner.isActive
//                             ? "Active"
//                             : "Inactive"}
//                         </span>
//                       </td>
//                       <td className="whitespace-nowrap px-2 py-4 text-sm text-gray-500 dark:text-gray-300">
//                         {banner.formattedDate}
//                       </td>
//                       <td className="whitespace-nowrap px-2 py-4 text-sm font-medium text-gray-900 dark:text-white">
//                         <div className="flex space-x-2">
//                           <button
//                             onClick={() => {openEditModal(banner)}}
//                             className="p-1 rounded-lg text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
//                             aria-label="Edit banner"
//                           >
//                             <Pencil className="h-5 w-5" />
//                           </button>
//                           <button
//                             onClick={() => {
//                               setSelectedBanner(banner);
//                               setDeleteModalOpen(true);
//                             }}
//                             className="p-1 rounded-lg text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
//                             aria-label="Delete banner"
//                           >
//                             <Trash2 className="h-5 w-5" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td
//                       colSpan={8}
//                       className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-300"
//                     >
//                       <div className="flex flex-col items-center gap-2">
//                         <ImageIcon className="w-12 h-12 text-gray-300" />
//                         <p>No banners found</p>
//                         <button
//                           onClick={() => openCreateModal(BANNER_TYPE)}
//                           className="text-blue-600 hover:text-blue-700 text-sm"
//                         >
//                           Create your first banner
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>

//         {/* Pagination */}
//         {total > 0 && (
//           <div className="mt-4 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
//             <div className="text-sm text-gray-500 dark:text-gray-300">
//               Showing{" "}
//               <span className="font-medium">
//                 {(filters.page - 1) * filters.limit + 1}
//               </span>{" "}
//               to{" "}
//               <span className="font-medium">
//                 {Math.min(filters.page * filters.limit, total)}
//               </span>{" "}
//               of <span className="font-medium">{total}</span> results
//             </div>
//             <div className="flex space-x-2">
//               <button
//                 onClick={() => handlePageChange(filters.page - 1)}
//                 disabled={filters.page === 1}
//                 className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${
//                   filters.page === 1
//                     ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
//                     : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
//                 }`}
//               >
//                 Previous
//               </button>
//               {Array.from(
//                 { length: Math.ceil(total / filters.limit) },
//                 (_, i) => i + 1
//               )
//                 .slice(
//                   Math.max(0, filters.page - 3),
//                   Math.min(Math.ceil(total / filters.limit), filters.page + 2)
//                 )
//                 .map((pageNum) => (
//                   <button
//                     key={pageNum}
//                     onClick={() => handlePageChange(pageNum)}
//                     className={`rounded-md border px-3 py-1 text-sm ${
//                       filters.page === pageNum
//                         ? "border-indigo-500 bg-indigo-500 text-white"
//                         : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 ))}
//               <button
//                 onClick={() => handlePageChange(filters.page + 1)}
//                 disabled={filters.page * filters.limit >= total}
//                 className={`rounded-md border border-gray-300 px-3 py-1 text-sm ${
//                   filters.page * filters.limit >= total
//                     ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
//                     : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
//                 }`}
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ============================================ */}
//       {/* EDIT/CREATE MODAL */}
//       {/* ============================================ */}
//       <Modal
//         isOpen={editModalOpen}
//         onClose={closeModal}
//         className="max-w-[700px] m-4"
//       >
//         <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
//           <div className="px-2 pr-14">
//             <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
//               {selectedBanner ? "Edit " : "Add New "} {bannerType}
//             </h4>
//             <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
//               {selectedBanner
//                 ? "Update banner details below"
//                 : `Create a new ${bannerType.toLowerCase()} with images and alt text`}
//             </p>
//           </div>

//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               handleSaveBanner();
//             }}
//             className="flex flex-col"
//           >
//             <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
//               <div className="space-y-6">
//                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                   {/* Name */}
//                   <div className="col-span-1">
//                     <Label>Name *</Label>
//                     <Input
//                       type="text"
//                       name="name"
//                       value={formData.name}
//                       onChange={(e) => {
//                         const { name, value } = e.target;
//                         setFormData((prev) => ({ ...prev, [name]: value }));
//                         if (errors[name]) {
//                           setErrors((prev) => ({ ...prev, [name]: "" }));
//                         }
//                       }}
//                       placeholder="Enter banner name"
//                       className={errors.name ? "border-red-500" : ""}
//                     />
//                     {errors.name && (
//                       <p className="mt-1 text-sm text-red-600">{errors.name}</p>
//                     )}
//                   </div>

//                   {/* Key */}
//                   <div className="col-span-1">
//                     <Label>Key *</Label>
//                     <Input
//                       type="text"
//                       name="key"
//                       value={formData.key}
//                       onChange={(e) => {
//                         const { name, value } = e.target;
//                         setFormData((prev) => ({ ...prev, [name]: value }));
//                         if (errors[name]) {
//                           setErrors((prev) => ({ ...prev, [name]: "" }));
//                         }
//                       }}
//                       placeholder="Enter unique key (e.g., home-page)"
//                       className={errors.key ? "border-red-500" : ""}
//                     />
//                     {errors.key && (
//                       <p className="mt-1 text-sm text-red-600">{errors.key}</p>
//                     )}
//                   </div>

//                   {/* Description */}
//                   <div className="col-span-2">
//                     <Label>Description</Label>
//                     <textarea
//                       name="description"
//                       value={formData.description}
//                       onChange={(e) => {
//                         const { name, value } = e.target;
//                         setFormData((prev) => ({ ...prev, [name]: value }));
//                         if (errors[name]) {
//                           setErrors((prev) => ({ ...prev, [name]: "" }));
//                         }
//                       }}
//                       rows={3}
//                       className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
//                         errors.description ? "border-red-500" : "border-gray-300"
//                       }`}
//                       placeholder="Enter banner description"
//                     />
//                     {errors.description && (
//                       <p className="mt-1 text-sm text-red-600">
//                         {errors.description}
//                       </p>
//                     )}
//                   </div>

//                   {/* Banner Layout - Only for Banner type */}
//                   {bannerType === BANNER_TYPE && (
//                     <div className="col-span-2">
//                       <Label>Banner Layout</Label>
//                       <Select
//                         defaultValue={formData.bannerLayout}
//                         options={LAYOUT_OPTIONS}
//                         onChange={(value) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             bannerLayout: value,
//                           }))
//                         }
//                       />
//                     </div>
//                   )}

//                   {/* Banner Pairs - Only for Banner type */}
//                   {bannerType === BANNER_TYPE && (
//                     <div className="col-span-2">
//                       <Label className="flex justify-between items-center">
//                         Banner Pairs
//                         <button
//                           type="button"
//                           className="rounded border-2 border-green-500 px-3 py-1 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-1"
//                           onClick={addBannerPair}
//                         >
//                           <Plus className="w-4 h-4" /> Add Pair
//                         </button>
//                       </Label>
//                       <div className="space-y-4 mt-2">
//                         {formData.Banners.map((bannerPair, idx) => (
//                           <BannerPair
//                             key={`pair-${idx}`}
//                             index={idx}
//                             pair={bannerPair}
//                             errors={errors}
//                             uploading={uploading}
//                             onFileUpload={handleBannerFileUpload}
//                             onAltChange={handleAltChange}
//                             onRemove={removeBannerPair}
//                             isRemovable={formData.Banners.length > 1}
//                           />
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Rich Text Editor - Only for Other type */}
//                   {bannerType === OTHER_TYPE && (
//                     <div className="col-span-2">
//                       <Label>Content</Label>
//                       <RichTextEditor
//                         initialValue={formData.extraData || ""}
//                         onChange={(content) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             extraData: content,
//                           }))
//                         }
//                       />
//                     </div>
//                   )}

//                   {/* Active Status */}
//                   <div className="col-span-2">
//                     <Label className="flex items-center gap-2">
//                       <input
//                         type="checkbox"
//                         name="isActive"
//                         checked={formData.isActive}
//                         onChange={(e) =>
//                           setFormData((prev) => ({
//                             ...prev,
//                             isActive: e.target.checked,
//                           }))
//                         }
//                         className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//                       />
//                       <span>Active Banner</span>
//                     </Label>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Modal Actions */}
//             <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
//               <button
//                 type="button"
//                 onClick={closeModal}
//                 className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={uploading}
//                 className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//               >
//                 {uploading
//                   ? "Uploading..."
//                   : selectedBanner
//                   ? "Update Banner"
//                   : "Create Banner"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </Modal>

//       {/* ============================================ */}
//       {/* DELETE CONFIRMATION MODAL */}
//       {/* ============================================ */}
//       <Modal
//         isOpen={isDeleteModalOpen}
//         onClose={() => {
//           setDeleteModalOpen(false);
//           setSelectedBanner(null);
//         }}
//         className="max-w-lg"
//       >
//         {selectedBanner && (
//           <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
//             <div className="px-2 pr-14">
//               <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
//                 Confirm Deletion
//               </h4>
//               <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 lg:mb-2">
//                 Are you sure you want to delete this banner? This action cannot
//                 be undone.
//               </p>
//             </div>
//             <div className="px-2">
//               <div className="rounded-md bg-red-50 p-2 py-4 dark:bg-red-900/20">
//                 <div className="flex">
//                   <div className="ml-3">
//                     <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
//                       Warning
//                     </h3>
//                     <div className="mt-2 text-sm text-red-700 dark:text-red-300">
//                       <p>
//                         Deleting "<strong>{selectedBanner.name}</strong>" will
//                         permanently remove it from the system.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setDeleteModalOpen(false);
//                   setSelectedBanner(null);
//                 }}
//                 className="rounded-md border border-gray-300 bg-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={deleteBanner}
//                 className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
//               >
//                 Delete Banner
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }


