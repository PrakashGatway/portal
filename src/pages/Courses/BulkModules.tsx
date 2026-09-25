// components/admin/BulkImportModal.jsx
import { useState, useCallback, useMemo } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "../../axiosInstance";

const ARRAY_FIELDS = ["objectives", "prerequisites"];
const NUMBER_FIELDS = ["order", "duration"];
const BOOLEAN_FIELDS = ["isPublished"];

const BulkImportModal = ({
  isOpen,
  onClose,
  onSuccess,
  courses,
  from,
  course,
}) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map columns, 3: Preview & Import
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const targetFields = useMemo(() => {
    const fields = [
      { key: "title", label: "Module Title", required: true },
      { key: "description", label: "Description", required: false },
      { key: "order", label: "Order", required: false },
      { key: "isPublished", label: "Published (true/false)", required: false },
    ];
    if (!from) {
      fields.splice(2, 0, {
        key: "course",
        label: "Course (title or ID)",
        required: false,
      });
    }
    return fields;
  }, [from]);

  // Auto-map columns based on header similarity
  const autoMapColumns = useCallback(
    (headers) => {
      const mapping = {};
      headers.forEach((header) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchedField = targetFields.find((field) => {
          const normalizedField = field.key
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          const normalizedLabel = field.label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          return (
            normalizedHeader === normalizedField ||
            normalizedHeader === normalizedLabel
          );
        });
        if (matchedField) {
          mapping[header] = matchedField.key;
        }
      });
      return mapping;
    },
    [targetFields],
  );

  // Handle file drop/selection
  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  const parseFile = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (jsonData.length < 2) {
        toast.error("File must contain a header row and at least one data row");
        return;
      }

      const fileHeaders = jsonData[0]
        .map((h) => String(h).trim())
        .filter(Boolean);
      const rows = jsonData
        .slice(1)
        .filter((row) => row.some((cell) => String(cell).trim() !== ""));

      // Convert rows to objects
      const dataRows = rows.map((row) => {
        const obj = {};
        fileHeaders.forEach((header, index) => {
          obj[header] =
            row[index] !== undefined ? String(row[index]).trim() : "";
        });
        return obj;
      });

      setHeaders(fileHeaders);
      setRawData(dataRows);

      // Auto-map columns
      const autoMapping = autoMapColumns(fileHeaders);
      setColumnMapping(autoMapping);

      setStep(2);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file. Please check the file format.");
    }
  };

  // Handle column mapping change
  const handleMappingChange = (header, fieldKey) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };
      // Remove any existing mapping to this field (prevent duplicates)
      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key] === fieldKey && fieldKey !== "") {
          delete newMapping[key];
        }
      });
      if (fieldKey === "") {
        delete newMapping[header];
      } else {
        newMapping[header] = fieldKey;
      }
      return newMapping;
    });
  };

  // Transform raw data based on mapping
  const transformData = useCallback(() => {
    // Create reverse mapping: field -> header
    const fieldToHeader = {};
    Object.entries(columnMapping).forEach(([header, field]) => {
      if (field) fieldToHeader[field] = header;
    });

    return rawData.map((row, index) => {
      const transformed = { _rowIndex: index + 2 }; // Excel row number (1-indexed + header)

      targetFields.forEach((field) => {
        const header = fieldToHeader[field.key];
        let value = header ? row[header] : "";
        if (ARRAY_FIELDS.includes(field.key)) {
          if (value) {
            // Split by comma or pipe
            transformed[field.key] = value
              .split(/[,|]/)
              .map((item) => item.trim())
              .filter(Boolean);
          } else {
            transformed[field.key] = [];
          }
        } else if (NUMBER_FIELDS.includes(field.key)) {
          const num = parseFloat(value);
          transformed[field.key] = isNaN(num) ? 0 : num;
        } else if (BOOLEAN_FIELDS.includes(field.key)) {
          const lowerValue = String(value).toLowerCase().trim();
          transformed[field.key] = ["true", "1", "yes", "published"].includes(
            lowerValue,
          );
        } else if (field.key === "course") {
          // Try to match course by ID or title
          if (value) {
            const matchedCourse = courses.find(
              (c) =>
                c._id === value ||
                c.title.toLowerCase() === value.toLowerCase(),
            );
            transformed[field.key] = matchedCourse ? matchedCourse._id : value;
          } else {
            transformed[field.key] = "";
          }
        } else {
          transformed[field.key] = value || "";
        }
      });

      // Set course from prop if `from` is provided
      if (from && course) {
        transformed.course = course._id;
      }

      return transformed;
    });
  }, [rawData, columnMapping, targetFields, courses, from, course]);

  // Validate transformed data
  const validateData = useCallback(
    (data) => {
      const errors = [];
      const validData = [];

      data.forEach((row) => {
        const rowErrors = [];

        if (!row.title || !row.title.trim()) {
          rowErrors.push("Title is required");
        }

        if (!from && !row.course) {
          rowErrors.push("Course is required");
        }

        if (row.order < 0) {
          rowErrors.push("Order must be a positive number");
        }

        if (rowErrors.length > 0) {
          errors.push({ row: row._rowIndex, errors: rowErrors, data: row });
        } else {
          const { _rowIndex, ...cleanRow } = row;
          validData.push(row);
        }
      });

      return { validData, errors };
    },
    [from],
  );

  // Handle import
  const handleImport = async () => {
    const transformedData = transformData();
    const { validData, errors } = validateData(transformedData);

    if (validData.length === 0) {
      toast.error("No valid rows to import. Please check your data.");
      setImportResult({ success: 0, failed: errors.length, errors });
      setShowErrors(true);
      return;
    }

    setImporting(true);
    try {
      const response = await api.post("/modules/bulk", {
        modules: validData,
      });

      const result = {
        success: response.data?.data?.created?.length || validData.length,
        failed: (response.data?.data?.failed?.length || 0) + errors.length,
        errors: [
          ...errors,
          ...(response.data?.data?.failed || []).map((f) => ({
            row: f.row || "?",
            errors: [f.error || "Failed to create"],
            data: f.data,
          })),
        ],
      };

      setImportResult(result);

      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.success} modules!`);
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 1500);
      } else {
        toast.warning(
          `Imported ${result.success} modules, ${result.failed} failed.`,
        );
        setShowErrors(true);
        setStep(4); // Show results
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      toast.error(error?.message || "Failed to import modules");
    } finally {
      setImporting(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setStep(1);
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({});
    setImportResult(null);
    setShowErrors(false);
    onClose();
  };

  // Check if required fields are mapped
  const requiredFieldsMapped = useMemo(() => {
    const mappedFields = Object.values(columnMapping);
    return targetFields
      .filter((f) => f.required)
      .every((f) => mappedFields.includes(f.key));
  }, [columnMapping, targetFields]);

  // Download sample template
  const downloadTemplate = () => {
    const sampleData = [
      {
        title: "Introduction to React",
        description: "Learn the basics of React",
        order: 1,
        isPublished: "true",
        ...(from ? {} : { course: "Course Title or ID" }),
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modules");
    XLSX.writeFile(wb, "module_import_template.xlsx");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl">
      <div className="relative w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
        {/* Header */}
        <div className="px-2 pr-14 mb-4">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Bulk Import Modules
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Import modules from Excel or CSV file
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 px-2">
          {[
            { num: 1, label: "Upload" },
            { num: 2, label: "Map Columns" },
            { num: 3, label: "Preview & Import" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= s.num
                    ? "bg-brand-500 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`ml-2 text-sm ${
                  step >= s.num
                    ? "text-gray-800 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {s.label}
              </span>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    step > s.num
                      ? "bg-brand-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-2">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-brand-400"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-brand-50 dark:bg-brand-900/30 rounded-full">
                    <Upload className="w-8 h-8 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-800 dark:text-white">
                      {isDragActive
                        ? "Drop your file here"
                        : "Drag & drop your file here"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Supported formats: .xlsx, .xls, .csv
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      Need a template?
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Download the sample template with all required columns
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={downloadTemplate}>
                  Download Template
                </Button>
              </div>

              {file && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setRawData([]);
                      setHeaders([]);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">
                    Map your file columns to module fields
                  </p>
                  <p className="text-xs mt-1">
                    We've auto-detected some columns. Please verify and adjust
                    the mapping below. Required fields are marked with{" "}
                    <span className="text-red-500">*</span>
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        File Column
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Sample Value
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Maps To
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {headers.map((header) => (
                      <tr key={header} className="bg-white dark:bg-gray-900">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                          {header}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                          {rawData[0]?.[header] || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={columnMapping[header] || ""}
                            onChange={(e) =>
                              handleMappingChange(header, e.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">-- Ignore --</option>
                            {targetFields.map((field) => (
                              <option
                                key={field.key}
                                value={field.key}
                                disabled={
                                  Object.values(columnMapping).includes(
                                    field.key,
                                  ) && columnMapping[header] !== field.key
                                }
                              >
                                {field.label}
                                {field.required ? " *" : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!requiredFieldsMapped && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Please map all required fields (
                    {targetFields
                      .filter((f) => f.required)
                      .map((f) => f.label)
                      .join(", ")}
                    )
                  </p>
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>📊 {rawData.length} rows detected</p>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Import */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium">Ready to import</p>
                  <p className="text-xs mt-1">
                    Review the data below before importing. {rawData.length}{" "}
                    rows will be processed.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                          #
                        </th>
                        {targetFields
                          .filter((f) =>
                            Object.values(columnMapping).includes(f.key),
                          )
                          .map((field) => (
                            <th
                              key={field.key}
                              className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                            >
                              {field.label}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {transformData()
                        .slice(0, 50)
                        .map((row, index) => (
                          <tr key={index} className="bg-white dark:bg-gray-900">
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </td>
                            {targetFields
                              .filter((f) =>
                                Object.values(columnMapping).includes(f.key),
                              )
                              .map((field) => (
                                <td
                                  key={field.key}
                                  className="px-3 py-2 text-gray-800 dark:text-white max-w-[200px] truncate"
                                >
                                  {Array.isArray(row[field.key])
                                    ? row[field.key].join(", ") || "-"
                                    : String(row[field.key] ?? "-")}
                                </td>
                              ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {rawData.length > 50 && (
                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Showing first 50 of {rawData.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {importResult.success}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Successful
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {importResult.failed}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Failed
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {showErrors ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    View {importResult.errors.length} error(s)
                  </button>
                  {showErrors && (
                    <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden max-h-[200px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50 dark:bg-red-900/20 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-red-700 dark:text-red-300">
                              Row
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-red-700 dark:text-red-300">
                              Errors
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                          {importResult.errors.map((err, i) => (
                            <tr key={i} className="bg-white dark:bg-gray-900">
                              <td className="px-3 py-2 text-red-600 dark:text-red-400 font-medium">
                                {err.row}
                              </td>
                              <td className="px-3 py-2 text-red-600 dark:text-red-400">
                                {err.errors.join(", ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {step > 1 && step < 4 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={importing}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClose}
              disabled={importing}
            >
              {step === 4 ? "Close" : "Cancel"}
            </Button>
            {step === 2 && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setStep(3)}
                disabled={!requiredFieldsMapped}
              >
                Preview
              </Button>
            )}
            {step === 3 && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing
                  ? "Importing..."
                  : `Import ${rawData.length} Modules`}
              </Button>
            )}
            {step === 4 && importResult?.success > 0 && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  handleClose();
                  onSuccess();
                }}
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;
