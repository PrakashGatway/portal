import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api, { ImageBaseUrl } from "../../axiosInstance";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import MultiSelect from "../../components/form/MultiSelect"; // Import MultiSelect
import DynamicIcon from "../../components/DynamicIcon";
import { useDropzone } from 'react-dropzone';
import { Upload, X, Youtube, FileVideo } from 'lucide-react';
import Button from "../../components/ui/button/Button";
import RecordedVideoUploadModal from "../Content/UploadClass";


const ThumbnailDropzone = ({ value, onChange, error, onRemove }: any) => {
    const [preview, setPreview] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            onChange(file);
        }
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        maxSize: 2 * 1024 * 1024, // 5MB
        multiple: false
    });

    const handleRemove = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(null);
        onRemove();
    };

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    } ${error ? 'border-red-500' : ''}`}
            >
                <input {...getInputProps()} />
                {preview || value?.url ? (
                    <div className="flex flex-col items-center">
                        <img
                            src={preview || `${ImageBaseUrl}/${value?.url}`}
                            alt="Thumbnail preview"
                            className="h-32 w-full object-cover rounded-md mb-4"
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Click to replace or drag and drop a new image
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isDragActive
                                ? 'Drop the image here'
                                : 'Drag & drop an image here, or click to select'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG, GIF up to 5MB. Preferred size: 1280x720px
                        </p>
                    </div>
                )}
            </div>
            {(preview || value?.url) && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="flex items-center text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                    <X className="h-4 w-4 mr-1" />
                    Remove image
                </button>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
};

const PreviewUrlField = ({ value, onChange }) => {
    const [inputType, setInputType] = useState(value?.type || 'youtube');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

    const handleTypeChange = (type) => {
        setInputType(type);
        if (type === 'youtube') {
            onChange({ url: '', publicId: 'youtube' }); // Clear upload data
        } else {
            onChange({ url: '', publicId: 'upload' });
        }
    };

    const handleModalUploadComplete = (uploadResult) => {
        onChange({
            publicId: 'upload',
            url: uploadResult?.vimeoId || '',
            duration: uploadResult?.duration
        })
        setIsUploadModalOpen(false);
        toast.success("Preview video uploaded successfully!"); // Optional
    };

    return (
        <div className="space-y-4">
            <div className="flex rounded-md overflow-hidden w-fit border border-gray-300 dark:border-gray-600">
                <button
                    type="button"
                    onClick={() => handleTypeChange('youtube')}
                    className={`px-4 py-2 text-sm font-medium flex items-center ${inputType === 'youtube'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                >
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube URL
                </button>
                <button
                    type="button"
                    onClick={() => handleTypeChange('upload')}
                    className={`px-4 py-2 text-sm font-medium flex items-center ${inputType === 'upload'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                >
                    <FileVideo className="h-4 w-4 mr-2" />
                    Upload Video
                </button>
            </div>

            {inputType === 'youtube' ? (
                <div>
                    <Label>YouTube URL</Label>
                    <Input
                        type="url"
                        name="preview.url" // This name might cause issues with nested handleChange, but onChange overrides it
                        value={value?.url || ''} // Use value?.url
                        onChange={(e) => onChange({ url: e.target.value, publicId: 'youtube' })} // Include type and clear others
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                </div>
            ) : (
                <div>
                    <Label>Upload Video</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                        {value?.url && value?.publicId === 'upload' ? ( // Check if an upload URL exists
                            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                                Video uploaded: {value.url.split('/').pop() || 'Success'}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Select a video file to upload.
                            </p>
                        )}
                        <Button onClick={(e) => { e.preventDefault(); setIsUploadModalOpen(true) }} variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            {value?.url && value?.publicId === 'upload' ? "Change Video" : "Select Video File"} {/* Button text based on state */}
                        </Button>
                    </div>
                    <RecordedVideoUploadModal
                        isOpen={isUploadModalOpen}
                        onClose={() => setIsUploadModalOpen(false)}
                        content={{ title: "Preview Video for Course" }}
                        onUploadComplete={handleModalUploadComplete} // <-- Key Change: Pass the callback
                    />
                </div>
            )}
        </div>
    );
};

const CourseSteppedForm = ({ course = null, onSave, onCancel, categories, users }: any) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        code: "",
        description: "",
        shortDescription: "",
        slug: "",
        category: "", // Will hold category ID
        subcategory: "", // Will hold subcategory ID
        instructors: [], // Will hold array of instructor IDs
        level: "beginner",
        language: "English",
        thumbnail: {
            url: "",
            publicId: ""
        },
        schedule: {
            startDate: "",
            endDate: "",
            enrollmentDeadline: "",
            timezone: "Asia/Kolkata"
        },
        pricing: {
            amount: 0,
            currency: "INR",
            earlyBird: {
                discount: 0,
                deadline: ""
            },
            discount: 0
        },
        preview: {
            url: "",
            publicId: "",
            duration: 0
        },
        mode: "online",
        schedule_pattern: {
            frequency: "daily",
            days: [],
            time: {
                start: "",
                end: ""
            },
            duration: 0
        },
        features: [""],
        requirements: [""],
        objectives: [""],
        targetAudience: [""],
        tags: [""],
        status: "upcoming",
        featured: false
    });
    const [errors, setErrors] = useState({});
    const [subcategories, setSubcategories] = useState([]);

    useEffect(() => {
        if (categories) {
            formData.category = course?.category || "";
        }
    }, [categories, course]);

    useEffect(() => {
        if (course) {
            const categoryId = course.category || course.category || "";
            const subcategoryId = course.subcategory || course.subcategory || "";
            const instructorIds = Array.isArray(course.instructors)
                ? course.instructors.map(inst => (typeof inst === 'object' ? inst._id : inst))
                : [];

            setFormData({
                title: course.title || "",
                code: course.code || "",
                description: course.description || "",
                shortDescription: course.shortDescription || "",
                slug: course.slug || "",
                category: categoryId,
                subcategory: subcategoryId,
                instructors: instructorIds,
                level: course.level || "beginner",
                language: course.language || "English",
                thumbnail: {
                    url: course.thumbnail?.url || "",
                    publicId: course.thumbnail?.publicId || ""
                },
                schedule: {
                    startDate: course.schedule?.startDate ? new Date(course.schedule.startDate).toISOString().slice(0, 16) : "",
                    endDate: course.schedule?.endDate ? new Date(course.schedule.endDate).toISOString().slice(0, 16) : "",
                    enrollmentDeadline: course.schedule?.enrollmentDeadline ? new Date(course.schedule.enrollmentDeadline).toISOString().slice(0, 16) : "",
                    timezone: course.schedule?.timezone || "Asia/Kolkata"
                },
                pricing: {
                    amount: course.pricing?.amount || 0,
                    currency: course.pricing?.currency || "INR",
                    earlyBird: {
                        discount: course.pricing?.earlyBird?.discount || 0,
                        deadline: course.pricing?.earlyBird?.deadline ? new Date(course.pricing.earlyBird.deadline).toISOString().slice(0, 16) : ""
                    },
                    discount: course.pricing?.discount || 0
                },
                preview: {
                    url: course.preview?.url || "",
                    publicId: course.preview?.publicId || "",
                    duration: course.preview?.duration || 0
                },
                mode: course.mode || "online",
                schedule_pattern: {
                    frequency: course.schedule_pattern?.frequency || "daily",
                    days: course.schedule_pattern?.days || [],
                    time: {
                        start: course.schedule_pattern?.time?.start || "",
                        end: course.schedule_pattern?.time?.end || ""
                    },
                    duration: course.schedule_pattern?.duration || 0
                },
                features: course.features?.length ? [...course.features] : [""],
                requirements: course.requirements?.length ? [...course.requirements] : [""],
                objectives: course.objectives?.length ? [...course.objectives] : [""],
                targetAudience: course.targetAudience?.length ? [...course.targetAudience] : [""],
                tags: course.tags?.length ? [...course.tags] : [""],
                status: course.status || "upcoming",
                featured: course.featured || false
            });
        } else {
            // Reset form for new course
            setFormData({
                title: "",
                code: "",
                description: "",
                shortDescription: "",
                slug: "",
                category: "",
                subcategory: "",
                instructors: [],
                level: "beginner",
                language: "English",
                thumbnail: {
                    url: "",
                    publicId: ""
                },
                schedule: {
                    startDate: "",
                    endDate: "",
                    enrollmentDeadline: "",
                    timezone: "Asia/Kolkata"
                },
                pricing: {
                    amount: 0,
                    currency: "INR",
                    earlyBird: {
                        discount: 0,
                        deadline: ""
                    },
                    discount: 0
                },
                preview: {
                    url: "",
                    publicId: "",
                    duration: 0
                },
                mode: "online",
                schedule_pattern: {
                    frequency: "daily",
                    days: [],
                    time: {
                        start: "",
                        end: ""
                    },
                    duration: 0
                },
                features: [""],
                requirements: [""],
                objectives: [""],
                targetAudience: [""],
                tags: [""],
                status: "upcoming",
                featured: false
            });
        }
        setErrors({});
        setCurrentStep(1);
    }, [course, categories, users]);

    // Update subcategories when category changes
    useEffect(() => {
        if (formData.category) {
            const filteredSubcategories = categories.filter(
                cat => cat.parent && cat.parent === formData.category
            );
            setSubcategories(filteredSubcategories);

            // If current subcategory is not valid for new category, clear it
            if (formData.subcategory && !filteredSubcategories.some(sub => sub._id === formData.subcategory)) {
                setFormData(prev => ({ ...prev, subcategory: "" }));
            }
        } else {
            setSubcategories([]);
            // Clear subcategory if category is cleared
            if (formData.subcategory) {
                setFormData(prev => ({ ...prev, subcategory: "" }));
            }
        }
    }, [formData.category, categories, formData.subcategory]);


    const handleSchedulePatternDaysChange = (day, isChecked) => {
        setFormData(prev => {
            let newDays;
            if (isChecked) {
                newDays = prev.schedule_pattern.days.includes(day)
                    ? prev.schedule_pattern.days
                    : [...prev.schedule_pattern.days, day];
            } else {
                newDays = prev.schedule_pattern.days.filter(d => d !== day);
            }
            return {
                ...prev,
                schedule_pattern: {
                    ...prev.schedule_pattern,
                    days: newDays
                }
            };
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested object updates like "schedule.startDate"
            const parts = name.split('.');
            setFormData(prev => {
                const updated = { ...prev };
                let current = updated;
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = type === 'checkbox' ? checked : value;
                return updated;
            });
        } else {
            // Handle simple field updates
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Clear error when user types/changes
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Corrected function to handle nested changes from Select components
    const handleNestedChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        // Clear error for this field
        if (errors[fieldName]) {
            setErrors(prev => ({ ...prev, [fieldName]: '' }));
        }
    };

    // Handle MultiSelect changes
    const handleMultiSelectChange = (fieldName, selectedValues) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: selectedValues
        }));
    };

    const handleArrayChange = (field, index, value) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({
            ...prev,
            [field]: newArray
        }));
    };

    const addArrayField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }));
    };

    const removeArrayField = (field, index) => {
        // Prevent removing the last item if it's the only one
        if (formData[field].length <= 1) {
            setFormData(prev => ({
                ...prev,
                [field]: [""]
            }));
        } else {
            const newArray = [...formData[field]];
            newArray.splice(index, 1);
            setFormData(prev => ({
                ...prev,
                [field]: newArray
            }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};
        switch (step) {
            case 1:
                if (!formData.title.trim()) newErrors.title = 'Title is required';
                if (!formData.code.trim()) newErrors.code = 'Course code is required';
                if (!formData.description.trim()) newErrors.description = 'Description is required';
                if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
                if (!formData.category) newErrors.category = 'Category is required';
                break;
            case 2:
                if (!formData.schedule.startDate) newErrors['schedule.startDate'] = 'Start date is required';
                if (!formData.schedule.endDate) newErrors['schedule.endDate'] = 'End date is required';
                if (formData.schedule.startDate && formData.schedule.endDate &&
                    new Date(formData.schedule.startDate) >= new Date(formData.schedule.endDate)) {
                    newErrors['schedule.endDate'] = 'End date must be after start date';
                }
                if (!formData.pricing.amount || formData.pricing.amount <= 0) {
                    newErrors['pricing.amount'] = 'Price must be greater than 0';
                }
                break;
            case 3:
                if (!formData.mode) newErrors.mode = 'Mode is required';
                break;
            default:
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) {
            return;
        }
        let finalThumbnailData = formData.thumbnail; // Start with current thumbnail data

        if (formData.thumbnail.file) {
            const uploadFormData = new FormData();
            uploadFormData.append('image', formData.thumbnail.file);
            try {
                const uploadResponse = await api.post('/upload/single', uploadFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                const url = uploadResponse.data?.file?.filename; // Adjust based on your API response
                finalThumbnailData = { url, publicId: '' };
            } catch (uploadError) {
                toast.error(uploadError.message || "Failed to upload thumbnail");
                return;
            }
        }

        try {
            // Prepare payload with proper date formatting
            const payload = {
                ...formData,
                thumbnail: finalThumbnailData,
                schedule: {
                    ...formData.schedule,
                    startDate: formData.schedule.startDate ? new Date(formData.schedule.startDate).toISOString() : null,
                    endDate: formData.schedule.endDate ? new Date(formData.schedule.endDate).toISOString() : null,
                    enrollmentDeadline: formData.schedule.enrollmentDeadline ? new Date(formData.schedule.enrollmentDeadline).toISOString() : null
                },
                pricing: {
                    ...formData.pricing,
                    earlyBird: {
                        ...formData.pricing.earlyBird,
                        deadline: formData.pricing.earlyBird.deadline ? new Date(formData.pricing.earlyBird.deadline).toISOString() : null
                    }
                }
            };

            if (course && course._id) {
                await api.put(`/courses/${course._id}`, payload);
                toast.success("Course updated successfully");
            } else {
                // Create new course
                await api.post("/courses", payload);
                toast.success("Course created successfully");
            }
            onSave(); // Notify parent component
        } catch (error) {
            console.error("Error saving course:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to save course");
        }
    };
    const handleThumbnailChange = (file) => {
        setFormData(prev => ({
            ...prev,
            thumbnail: {
                ...prev.thumbnail,
                file: file
            }
        }));
    };

    const handleThumbnailRemove = () => {
        setFormData(prev => ({
            ...prev,
            thumbnail: {
                url: "", // Clear existing URL
                publicId: "", // Clear existing publicId
                file: null // Clear the stored file object
            }
        }));
    };

    const handlePreviewChange = (previewData) => {
        setFormData(prev => ({
            ...prev,
            preview: previewData
        }));
    };
    const renderStep1 = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <Label>Course Title *</Label>
                    <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter course title"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>
                <div>
                    <Label>Course Code *</Label>
                    <Input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="Enter course code"
                    />
                    {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                </div>
                <div className="md:col-span-2">
                    <Label>Description *</Label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Enter detailed course description"
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
                <div>
                    <Label>Short Description</Label>
                    <textarea
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                        placeholder="Enter brief description (max 200 characters)"
                    />
                </div>
                <div>
                    <Label>Slug *</Label>
                    <Input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="Enter course slug"
                    />
                    {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                </div>
                <div>
                    <Label>Category *</Label>
                    <Select
                        options={[
                            ...categories
                                .filter(cat => !cat.parent)
                                .map(cat => ({ value: cat._id, label: cat.name }))
                        ]}
                        defaultValue={formData.category}
                        onChange={(value) => handleNestedChange('category', value)}
                    />
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>
                <div>
                    <Label>Subcategory</Label>
                    <Select
                        options={[
                            ...subcategories.map(cat => ({ value: cat._id, label: cat.name }))
                        ]}
                        defaultValue={formData.subcategory}
                        onChange={(value) => handleNestedChange('subcategory', value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <Label>Instructors</Label>
                    <MultiSelect
                        label="" // Label is already above
                        options={users.map(user => ({
                            value: user._id,
                            text: user.name || user.email || user._id
                        }))}
                        defaultSelected={formData.instructors}
                        onChange={(selected) => handleMultiSelectChange('instructors', selected)}
                    />
                </div>
                <div>
                    <Label>Level</Label>
                    <Select
                        options={[
                            { value: "beginner", label: "Beginner" },
                            { value: "intermediate", label: "Intermediate" },
                            { value: "advanced", label: "Advanced" }
                        ]}
                        defaultValue={formData.level}
                        onChange={(value) => handleNestedChange('level', value)}
                    />
                </div>
                <div>
                    <Label>Language</Label>
                    <Input
                        type="text"
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        placeholder="Enter language"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule & Pricing</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <Label>Start Date *</Label>
                    <Input
                        type="datetime-local"
                        name="schedule.startDate"
                        value={formData.schedule.startDate}
                        onChange={handleChange}
                    />
                    {errors['schedule.startDate'] && <p className="mt-1 text-sm text-red-600">{errors['schedule.startDate']}</p>}
                </div>
                <div>
                    <Label>End Date *</Label>
                    <Input
                        type="datetime-local"
                        name="schedule.endDate"
                        value={formData.schedule.endDate}
                        onChange={handleChange}
                    />
                    {errors['schedule.endDate'] && <p className="mt-1 text-sm text-red-600">{errors['schedule.endDate']}</p>}
                </div>
                <div>
                    <Label>Enrollment Deadline</Label>
                    <Input
                        type="datetime-local"
                        name="schedule.enrollmentDeadline"
                        value={formData.schedule.enrollmentDeadline}
                        onChange={handleChange}
                    />
                </div>
                {/* <div>
                    <Label>Timezone</Label>
                    <Input
                        type="text"
                        name="schedule.timezone"
                        value={formData.schedule.timezone}
                        onChange={handleChange}
                        placeholder="Enter timezone"
                    />
                </div> */}
                <div>
                    <Label>Price Amount *</Label>
                    <Input
                        type="number"
                        name="pricing.amount"
                        value={formData.pricing.amount}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                    />
                    {errors['pricing.amount'] && <p className="mt-1 text-sm text-red-600">{errors['pricing.amount']}</p>}
                </div>
                <div>
                    <Label>Currency</Label>
                    <Input
                        type="text"
                        name="pricing.currency"
                        value={formData.pricing.currency}
                        onChange={handleChange}
                        placeholder="Enter currency code"
                    />
                </div>
                <div>
                    <Label>Discount (%)</Label>
                    <Input
                        type="number"
                        name="pricing.discount"
                        value={formData.pricing.discount}
                        onChange={handleChange}
                        min="0"
                        max="100"
                    />
                </div>
                <div>
                    <Label>Early Bird Discount (%)</Label>
                    <Input
                        type="number"
                        name="pricing.earlyBird.discount"
                        value={formData.pricing.earlyBird.discount}
                        onChange={handleChange}
                        min="0"
                        max="100"
                    />
                </div>
                <div>
                    <Label>Early Bird Deadline</Label>
                    <Input
                        type="datetime-local"
                        name="pricing.earlyBird.deadline"
                        value={formData.pricing.earlyBird.deadline}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <Label>Thumbnail</Label>
                    <ThumbnailDropzone
                        value={formData.thumbnail}
                        onChange={handleThumbnailChange}
                        onRemove={handleThumbnailRemove}
                        error={errors['thumbnail']}
                    />
                </div>

                <div>
                    <Label>Preview</Label>
                    <PreviewUrlField
                        value={formData.preview}
                        onChange={handlePreviewChange}
                    />
                </div>
            </div>

        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Details</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <Label>Mode *</Label>
                    <Select
                        options={[
                            { value: "online", label: "Online" },
                            { value: "offline", label: "Offline" },
                            { value: "hybrid", label: "Hybrid" },
                            { value: "recorded", label: "Recorded" }
                        ]}
                        defaultValue={formData.mode}
                        onChange={(value) => handleNestedChange('mode', value)}
                    />
                    {errors.mode && <p className="mt-1 text-sm text-red-600">{errors.mode}</p>}
                </div>
                <div>
                    <Label>Status</Label>
                    <Select
                        options={[
                            { value: "upcoming", label: "Upcoming" },
                            { value: "ongoing", label: "Ongoing" },
                            { value: "completed", label: "Completed" },
                            { value: "cancelled", label: "Cancelled" }
                        ]}
                        defaultValue={formData.status}
                        onChange={(value) => handleNestedChange('status', value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <Label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleChange}
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Featured Course</span>
                    </Label>
                </div>
            </div>
            <div>
                <Label>Schedule Pattern Frequency</Label>
                <Select
                    options={[
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Bi-weekly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "custom", label: "Custom" }
                    ]}
                    defaultValue={formData.schedule_pattern.frequency}
                    onChange={(value) => handleNestedChange('schedule_pattern.frequency', value)}
                />
            </div>
            <div>
                <Label>Schedule Pattern Days</Label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <Label key={day} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                // Remove the name attribute as it's not needed for this implementation
                                checked={formData.schedule_pattern.days.includes(day)}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    handleSchedulePatternDaysChange(day, isChecked);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="capitalize">{day}</span>
                        </Label>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <Label>Start Time (HH:MM)</Label>
                    <Input
                        type="time"
                        name="schedule_pattern.time.start"
                        value={formData.schedule_pattern.time.start}
                        onChange={handleChange}
                        placeholder="HH:MM"
                    />
                </div>
                <div>
                    <Label>End Time (HH:MM)</Label>
                    <Input
                        type="time"
                        name="schedule_pattern.time.end"
                        value={formData.schedule_pattern.time.end}
                        onChange={handleChange}
                        placeholder="HH:MM"
                    />
                </div>
                <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                        type="number"
                        name="schedule_pattern.duration"
                        value={formData.schedule_pattern.duration}
                        onChange={handleChange}
                        min="0"
                    />
                </div>
            </div>
            <div className="w-full">
                <Label>Features</Label>
                <div className="space-y-2 w-full">
                    {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                className="w-full"
                                type="text"
                                value={feature}
                                onChange={(e) => handleArrayChange('features', index, e.target.value)}
                                placeholder="Enter feature"
                            />
                            {formData.features.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('features', index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <DynamicIcon name="Trash" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayField('features')}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                        + Add Feature
                    </button>
                </div>
            </div>
            <div>
                <Label>Requirements</Label>
                <div className="space-y-2">
                    {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={requirement}
                                onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                                placeholder="Enter requirement"
                            />
                            {formData.requirements.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('requirements', index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <DynamicIcon name="Trash" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayField('requirements')}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                        + Add Requirement
                    </button>
                </div>
            </div>
            <div>
                <Label>Objectives</Label>
                <div className="space-y-2">
                    {formData.objectives.map((objective, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={objective}
                                onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                                placeholder="Enter objective"
                            />
                            {formData.objectives.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('objectives', index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <DynamicIcon name="Trash" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayField('objectives')}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                        + Add Objective
                    </button>
                </div>
            </div>
            <div>
                <Label>Target Audience</Label>
                <div className="space-y-2">
                    {formData.targetAudience.map((audience, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={audience}
                                onChange={(e) => handleArrayChange('targetAudience', index, e.target.value)}
                                placeholder="Enter target audience"
                            />
                            {formData.targetAudience.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('targetAudience', index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <DynamicIcon name="Trash" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayField('targetAudience')}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                        + Add Target Audience
                    </button>
                </div>
            </div>
            <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                    {formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                type="text"
                                value={tag}
                                onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                                placeholder="Enter tag"
                            />
                            {formData.tags.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('tags', index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <DynamicIcon name="Trash" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayField('tags')}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                        + Add Tag
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex justify-between">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="flex flex-col items-center w-1/3">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step
                                    ? "bg-blue-600 text-white"
                                    : step < currentStep
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                            >
                                {step}
                            </div>
                            <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                {step === 1 && "Basic Info"}
                                {step === 2 && "Schedule & Pricing"}
                                {step === 3 && "Details"}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 3) * 100}%` }}
                    ></div>
                </div>
            </div>
            {/* Step Content */}
            <div className="min-h-[400px]">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
            </div>
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
                <button
                    className="bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-2"
                    type="button"
                    onClick={currentStep === 1 ? onCancel : prevStep}
                >
                    {currentStep === 1 ? "Cancel" : "Previous"}
                </button>

                {currentStep < 3 ? (
                    <button className="bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-2" type="button" onClick={nextStep}>
                        Next
                    </button>
                ) : (
                    <button className="bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-2 " type="submit">
                        {course ? "Update Course" : "Create Course"}
                    </button>
                )}
            </div>
        </form>
    );
};

export default CourseSteppedForm;