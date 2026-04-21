// src/components/DynamicFormFields.js
import { useState, useEffect } from "react";
import { PAGE_TYPES_SCHEMA } from "../utils/pageSchema";
import Button from "./ui/button/Button";
import TinyMceEditor from "./TextEditor";
import api from "../axiosInstance";
import { toast } from "react-toastify";
import { Plus, X, ChevronRight, Image as ImageIcon } from "lucide-react";

export const DynamicFormFields = ({ formData, setFormData, pageType }) => {
  const schema = pageType ? PAGE_TYPES_SCHEMA[pageType] : null;
  
  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({});

  if (!schema) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg dark:border-gray-700">
        {pageType ? "No schema found." : "Select a page type to start."}
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
      newSection.content[field.name] = field.type === "array" ? [] : "";
    });

    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    
    // Auto-expand newly added section
    setExpandedSections(prev => ({ ...prev, [sectionType]: true }));
  };

  const updateSectionContent = (sectionIndex, key, value) => {
    const newSections = JSON.parse(JSON.stringify(formData.sections));
    if (newSections[sectionIndex]) {
        newSections[sectionIndex].content[key] = value;
    }
    setFormData((prev) => ({ ...prev, sections: newSections }));
  };

  const removeSection = (sectionIndex) => {
    const sectionType = formData.sections[sectionIndex]?.type;
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== sectionIndex),
    }));
    if (sectionType) {
        setExpandedSections(prev => {
            const newState = { ...prev };
            delete newState[sectionType];
            return newState;
        });
    }
  };

  const updateSectionOrder = (sectionIndex, order) => {
    const newSections = [...formData.sections];
    if (newSections[sectionIndex]) {
        newSections[sectionIndex].order = Number(order);
        setFormData((prev) => ({ ...prev, sections: newSections }));
    }
  };

  const toggleSection = (sectionType) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionType]: !prev[sectionType]
    }));
  };

  const isExpanded = (sectionType) => !!expandedSections[sectionType];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* --- Global Fields (Always Visible) --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {schema.label} Settings
          </h3>
        </div>
        <div className="p-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className={field.type === 'editor' ? 'md:col-span-2' : ''}>
              <DynamicField
                field={field}
                value={formData.pageContent?.[field.name] || formData[field.name]} 
                onChange={handleFieldChange}
              />
            </div>
          ))}
        </div>
      </div>

      {/* --- Collapsible Sections --- */}
      {sections && sections.length > 0 && (
        <div className="space-y-3">
          {sections.map((sectionConfig) => {
            const sectionIndex = formData.sections.findIndex((s) => s.type === sectionConfig.type);
            const section = formData.sections[sectionIndex];
            const expanded = isExpanded(sectionConfig.type);

            if (!section) {
              return (
                <button
                // type="button"
                  key={sectionConfig.type}
                  onClick={() => addSection(sectionConfig.type)}
                  className="w-full py-3 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 group bg-transparent"
                >
                  <Plus size={16} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Add {sectionConfig.label}</span>
                </button>
              );
            }

            return (
              <div
                key={sectionConfig.type}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(sectionConfig.type)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`transform transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                      <ChevronRight size={16} className="text-gray-400" />
                    </span>
                    <span className="text-sm font-semibold border- border-gray-300 text-gray-700 dark:text-gray-200">
                      {sectionConfig.label}
                    </span>
                    {sectionConfig.fields.some(f => f.type === 'array') && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                        {Array.isArray(section.content[sectionConfig.fields.find(f => f.type === 'array')?.name]) 
                            ? section.content[sectionConfig.fields.find(f => f.type === 'array').name].length 
                            : 0} items
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 bg-white dark:bg-gray-700 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600 transition-opacity ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <span className="text-[10px] font-medium text-gray-500 uppercase">Order</span>
                      <input
                        type="number"
                        value={section.order}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); updateSectionOrder(sectionIndex, e.target.value); }}
                        className="w-10 text-[11px] bg-transparent border border-gray-400 text-center font-mono"
                      />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(sectionIndex); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="space-y-5">
                      {sectionConfig.fields.map((field) => (
                        <div key={field.name}>
                          <DynamicField
                            field={field}
                            value={section.content[field.name]}
                            onChange={(name, value) => updateSectionContent(sectionIndex, name, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Dynamic Field Component (Logic unchanged - Fully Controlled) ---
const DynamicField = ({ field, value, onChange }) => {
  const { name, type, label, required, itemFields, accept } = field;

  const handleChange = (e) => {
    const val = e?.target ? e.target.value : e;
    onChange(name, val);
  };

  // --- Array Renderer (Logic unchanged) ---
  if (type === "array") {
    const items = Array.isArray(value) ? value : [];

    const addItem = () => {
      const newItem = {};
      itemFields.forEach((f) => {
        newItem[f.name] = f.type === "array" ? [] : "";
      });
      onChange(name, [...items, newItem]);
    };

    const updateItem = (index, key, val) => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [key]: val };
      onChange(name, newItems);
    };

    const removeItem = (index) => {
      const newItems = items.filter((_, i) => i !== index);
      onChange(name, newItems);
    };

    return (
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div key={idx} className="group bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3.5">
              
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {itemFields.map((subField) => (
                  <div key={subField.name}>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {subField.label}
                    </label>

                    {subField.type === "editor" ? (
                      <TinyMceEditor
                        initialValue={item[subField.name] || ""}
                        onChange={(content) => updateItem(idx, subField.name, content)}
                      />
                    ) : subField.type === "file" ? (
                      <FileUploader 
                        value={item[subField.name]}
                        onChange={(val) => updateItem(idx, subField.name, val)}
                        accept={subField.accept || "image/*"}
                        compact
                      />
                    ) : subField.type === "textarea" ? (
                      <textarea
                        value={item[subField.name] || ""}
                        onChange={(e) => updateItem(idx, subField.name, e.target.value)}
                        rows={2}
                        className="w-full text-xs rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <input
                        type={subField.type === "number" ? "number" : subField.type === "date" ? "date" : "text"}
                        value={item[subField.name] || ""}
                        onChange={(e) => updateItem(idx, subField.name, e.target.value)}
                        className="w-full text-xs rounded-md p-2 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={addItem}
          className="flex items-center justify-center w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all"
        >
          <Plus size={14} className="mr-1.5" /> Add {label}
        </button>
      </div>
    );
  }

  // --- Root Level Renderers (Logic unchanged) ---

  if (type === "editor") {
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <TinyMceEditor
          initialValue={value}
          onChange={(content) => onChange(name, content)}
        />
      </div>
    );
  }

  if (type === "file") {
     return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
            </label>
            <FileUploader 
                value={value}
                onChange={(val) => onChange(name, val)}
                accept={accept || "image/*"}
            />
        </div>
     )
  }

  // Default Inputs (Logic unchanged)
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === "textarea" ? (
        <textarea
          value={value || ""}
          onChange={handleChange}
          rows={3}
          className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
        />
      ) : (
        <input
          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
          value={value || ""}
          onChange={handleChange}
          className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
        />
      )}
    </div>
  );
};

// --- File Uploader (Minimal safety fixes only - logic unchanged) ---
const FileUploader = ({ value, onChange, accept, compact }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState('');

    // Cleanup blob URLs on unmount or value change (safety fix only)
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Update preview when value changes (logic unchanged, added null safety)
    useEffect(() => {
        // Clean up previous blob URL
        if (preview && preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview);
        }

        // Safety check: ensure value is valid before processing
        if (!value) {
            setPreview('');
            return;
        }

        if (typeof value === 'string') {
            const imageUrl = value.startsWith('http') || value.startsWith('/') 
                ? value 
                : '';
            setPreview(imageUrl);
        }
        // Note: We don't handle File objects here because our logic uploads immediately
        // and only stores the string filename/URL in state
    }, [value]);

    const handleFileChange = async (e) => {
      // Safety check
      if (!e?.target?.files) return;
      
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      
      let objectUrl = null;
      try {
        // Create immediate preview for better UX
        objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Upload to server (logic unchanged)
        const formData = new FormData();
        formData.append('image', file);
        
        const { data } = await api.post('/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const filePath = data?.file?.filename || data?.url; 
        
        if (filePath) {
            onChange(filePath);
        } else {
            throw new Error("Invalid response from server");
        }

      } catch (err) {
        console.error('Upload error:', err);
        
        // Revert preview on error
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
        setPreview(value || '');
        toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
        
      } finally {
        setIsUploading(false);
        // Reset input so same file can be selected again
        if (e.target) {
            e.target.value = '';
        }
      }
    };

    const sizeClass = compact ? 'h-20' : 'h-28';

    return (
      <div className={`relative group ${sizeClass}`}>
        <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />
        
        <div className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all overflow-hidden bg-gray-50/50 dark:bg-gray-800/30
            ${isUploading 
                ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' 
                : preview 
                    ? 'border-transparent bg-gray-100 dark:bg-gray-700' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5'
            }
        `}>
            {isUploading ? (
                <div className="flex flex-col items-center text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mb-1.5"></div>
                    <span className="text-[10px] font-medium">Uploading...</span>
                </div>
            ) : preview ? (
                <>
                    <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover rounded-lg"
                        onError={() => {
                            // Fallback if image fails to load
                            setPreview('');
                        }}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-medium bg-black/40 px-2 py-1 rounded">Change</span>
                    </div>
                </>
            ) : (
                <div className="text-center pointer-events-none">
                    <ImageIcon className="mx-auto h-4 w-4 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Upload</span>
                </div>
            )}
        </div>
      </div>
    );
};

export default DynamicFormFields;