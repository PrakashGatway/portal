// components/admin/CategoryTree.jsx
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import DynamicIcon from "../../components/DynamicIcon";
import { Loader } from "../../components/fullScreeLoader";

const CategoryTree = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchCategoryTree();
  }, []);

  const fetchCategoryTree = async () => {
    try {
      setLoading(true);
      const response = await api.get("/categories/tree");
      setCategories(response.data.data || []);

      const allIds = getAllCategoryIds(response.data.data || []);
      setExpandedNodes(new Set(allIds));
    } catch (error) {
      console.error("Failed to fetch category tree:", error);
      toast.error("Failed to load category tree");
    } finally {
      setLoading(false);
    }
  };

  const getAllCategoryIds = (categories) => {
    let ids = [];
    categories.forEach(category => {
      ids.push(category._id);
      if (category.children && category.children.length > 0) {
        ids = ids.concat(getAllCategoryIds(category.children));
      }
    });
    return ids;
  };

  const toggleNode = (categoryId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };


  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedNodes.has(category._id);

      return (
        <div key={category._id} className="mb-1">
          <div
            className={`flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l-2 border-r-2 ${level > 0 ? 'ml-6 border-l-4 border-gray-200 dark:border-gray-700' : ''
              }`}
            style={{ paddingLeft: `${16 + level * 20}px` }}
          >
            <button
              onClick={() => toggleNode(category._id)}
              className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              disabled={!hasChildren}
            >
              {hasChildren ? (
                <svg
                  className={`w-4 h-4 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-90' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <div className="w-4 h-4"></div>
              )}
            </button>

            {/* Category Icon */}
            <div
              className="text-lg mr-3"
              style={{ color: category.color }}
            >
              <DynamicIcon name={category.icon} className="text-blue-500" />
            </div>

            {/* Category Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className={`font-medium truncate ${category.isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500 line-through'
                  }`}>
                  {category.name}
                </span>
                {!category.isActive && (
                  <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-200">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                  {category.description}
                </p>
              )}
            </div>

            {/* Category Stats */}
            <div className="flex items-center space-x-4 mr-4">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">
                Order: {category.order}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">
                Subcats: {category.childrenCount}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300">
                Courses: {category.coursesCount}
              </span>
            </div>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
     <Loader/>
    );
  }

  return (
    <div className="w-full">
      <div className="">
        <div className=" items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Hierarchy</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visual representation of your category structure
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {categories.length} root categories
            </span>
            <button
              onClick={fetchCategoryTree}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="space-y-2">
            {renderCategoryTree(categories)}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No categories</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryTree;