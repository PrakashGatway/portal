// src/components/DynamicFormFields.js
import { useState } from "react";
import { PAGE_TYPES_SCHEMA } from "../utils/pageSchema";
import Button from "./ui/button/Button";
import TinyMceEditor from "./TextEditor";
import api from "../axiosInstance";
import { toast } from "react-toastify";

export const DynamicFormFields = ({ formData, setFormData, pageType }) => {
  const schema = pageType ? PAGE_TYPES_SCHEMA[pageType] : null;

  if (!schema) {
    return (
      <div className="text-gray-500 my-4">
        {pageType ? "No schema found for this page type." : "Select a page type to configure."}
      </div>
    );
  }

  const { fields, sections } = schema;

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      pageContent: {
        ...prev.pageContent,
        [name]: value       
      }
    }));
  };

  const addSection = (sectionType) => {
    const sectionConfig = sections.find((s) => s.type === sectionType);
    const newSection = {
      type: sectionConfig.type,
      order: formData.sections.length,
      content: {},
    };

    sectionConfig.fields.forEach((field) => {
      if (field.type === "array") {
        newSection.content[field.name] = [];
      } else {
        newSection.content[field.name] = "";
      }
    });

    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSectionContent = (sectionIndex, key, value) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].content[key] = value;
    setFormData((prev) => ({ ...prev, sections: newSections }));
  };

  const removeSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex),
    }));
  };

  const updateSectionOrder = (sectionIndex, order) => {
    const newSections = [...formData.sections];
    newSections[sectionIndex].order = Number(order);
    setFormData((prev) => ({ ...prev, sections: newSections }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-white pb-2 my-6 mb-4">
          {schema.label} Fields
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name}>
              <DynamicField
                field={field}
                value={formData[field.name]}
                onChange={handleFieldChange}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Sections */}
      {sections && sections.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white py-4 pb-2 mb-4">
            Sections Fields
          </h3>
          {sections.map((sectionConfig) => {
            const section = formData.sections.find((s) => s.type === sectionConfig.type);
            const sectionIndex = formData.sections.findIndex((s) => s.type === sectionConfig.type);

            if (!section) {
              return (
                <div key={sectionConfig.type} className="mb-6 text-center">
                  <Button
                    type="button"
                    onClick={() => addSection(sectionConfig.type)}
                    className=""
                  >
                    + Add {sectionConfig.label}
                  </Button>
                </div>
              );
            }

            return (
              <div
                key={sectionConfig.type}
                className="border rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50 mb-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white">
                    {sectionConfig.label}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-500">Order:</label>
                    <input
                      type="number"
                      value={section.order}
                      onChange={(e) => updateSectionOrder(sectionIndex, e.target.value)}
                      className="w-16 rounded border border-gray-300 py-1 px-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    />
                    <Button
                      size="sm"
                      onClick={(e) => { e.preventDefault(); removeSection(sectionIndex) }}
                      className=""
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {sectionConfig.fields.map((field) => (
                  <div key={field.name} className="mb-4">
                    <DynamicField
                      field={field}
                      value={section.content[field.name]}
                      onChange={(name, value) => updateSectionContent(sectionIndex, name, value)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Nested: DynamicField Component
// Nested: DynamicField Component
const DynamicField = ({ field, value, onChange }) => {
  const { name, type, label, required, itemFields } = field;

  const handleChange = (e) => {
    onChange(name, type === "editor" ? e : e.target.value);
  };

  // --- ARRAY TYPE HANDLING ---
  if (type === "array") {
    const [items, setItems] = useState(value || []);

    const addItem = () => {
      const newItem = {};
      itemFields.forEach((f) => {
        // Initialize based on field type
        if (f.type === "array") newItem[f.name] = [];
        else if (f.type === "editor" || f.type === "textarea") newItem[f.name] = "";
        else newItem[f.name] = "";
      });
      const newItems = [...items, newItem];
      setItems(newItems);
      onChange(name, newItems);
    };

    const updateItem = (index, key, val) => {
      const newItems = [...items];
      newItems[index][key] = val;
      setItems(newItems);
      onChange(name, newItems);
    };

    const removeItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      onChange(name, newItems);
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No items added.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 border rounded bg-white dark:bg-gray-700 space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b pb-2 mb-2 dark:border-gray-600">
                  <span className="text-xs font-bold text-gray-500 uppercase">Item #{idx + 1}</span>
                  <Button
                    size="sm"
                    onClick={(e) => { e.preventDefault(); removeItem(idx) }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </Button>
                </div>

                {/* Render sub-fields based on their type */}
             {itemFields.map((subField) => (
  <div key={subField.name} className="mb-2">
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
      {subField.label}
    </label>

    {/* Editor Type */}
    {subField.type === "editor" ? (
      <TinyMceEditor
        initialValue={item[subField.name] || ""}
        onChange={(content) => updateItem(idx, subField.name, content)}
      />
    ) 
    /* File Type */
    : subField.type === "file" ? (
      <div className="space-y-2">
        <input
          type="file"
          accept={subField.accept || "*/*"}
          multiple={subField.multiple || false}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              // Handle single or multiple files
              const fileData = subField.multiple 
                ? Array.from(files) 
                : files[0];
              updateItem(idx, subField.name, fileData);
            }
          }}
          className="w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100
            dark:file:bg-gray-700 dark:file:text-gray-200
            dark:hover:file:bg-gray-600"
        />
        {/* Show selected file name(s) */}
        {item[subField.name] && (
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {Array.isArray(item[subField.name]) 
              ? `${item[subField.name].length} file(s) selected`
              : `Selected: ${item[subField.name].name}`
            }
          </div>
        )}
      </div>
    )
    /* Textarea Type */
    : subField.type === "textarea" ? (
      <textarea
        value={item[subField.name] || ""}
        onChange={(e) => updateItem(idx, subField.name, e.target.value)}
        rows="3"
        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    )
    /* Number Type */
    : subField.type === "number" ? (
      <input
        type="number"
        value={item[subField.name] || ""}
        onChange={(e) => updateItem(idx, subField.name, e.target.value)}
        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    )
    /* Date Type */
    : subField.type === "date" ? (
      <input
        type="date"
        value={item[subField.name] || ""}
        onChange={(e) => updateItem(idx, subField.name, e.target.value)}
        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    )
    /* Default: Text Input */
    : (
      <input
        type="text"
        value={item[subField.name] || ""}
        onChange={(e) => updateItem(idx, subField.name, e.target.value)}
        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    )}
  </div>
))}
              </div>
            ))}
          </div>
        )}
        
        <Button
          size="sm"
          onClick={(e) => { e.preventDefault(); addItem() }}
          className="text-xs text-indigo-600 hover:text-indigo-800 mt-2"
        >
          + Add {label}
        </Button>
      </div>
    );
  }

  // --- ROOT LEVEL FIELD TYPES (unchanged) ---

  if (type === "textarea") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={value || ""}
          onChange={handleChange}
          rows="3"
          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
    );
  }

  if (type === "editor") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <TinyMceEditor
          initialValue={value}
          onChange={handleChange}
        />
      </div>
    );
  }

  if (type === "date") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <input
          type="date"
          value={value || ""}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
    );
  }

  if (type === "number") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <input
          type="number"
          value={value || ""}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
    );
  }

  if (type === "file") {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState('');

    const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await api.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onChange(name, data?.file?.filename);
      } catch (err) {
        toast.error(`Upload error : ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };

    const triggerFileInput = () => {
      const fileInput = document.getElementById(`file-upload-${name}`);
      fileInput?.click();
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <input
            id={`file-upload-${name}`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            className={`flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isUploading
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isUploading ? 'Uploading...' : '📎 Upload Image'}
          </button>
          {value && (
            <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
              {typeof value === 'string' && !value.startsWith('blob:')
                ? value.split('/').pop()
                : 'Selected: Image ready to upload'}
            </span>
          )}
        </div>

        {preview && (
          <div className="mt-3">
            <div className="inline-block p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" style={{ maxWidth: '180px' }}>
              <img
                src={preview}
                alt="Preview"
                className="h-24 rounded object-cover transition-transform duration-200 hover:scale-105"
                style={{ width: '160px', height: '96px', objectFit: 'cover' }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: Text Input
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
};

export default DynamicFormFields;