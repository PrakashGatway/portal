// components/admin/CourseSteppedForm.jsx
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../axiosInstance";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import MultiSelect from "../../components/form/MultiSelect"; // Import MultiSelect
import DynamicIcon from "../../components/DynamicIcon";

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
        // Validate current step before submitting
        if (!validateStep(currentStep)) {
            return;
        }

        try {
            // Prepare payload with proper date formatting
            const payload = {
                ...formData,
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
                // Update existing course
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
                <div>
                    <Label>Timezone</Label>
                    <Input
                        type="text"
                        name="schedule.timezone"
                        value={formData.schedule.timezone}
                        onChange={handleChange}
                        placeholder="Enter timezone"
                    />
                </div>
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
            </div>
            <div>
                <Label>Thumbnail URL</Label>
                <Input
                    type="text"
                    name="thumbnail.url"
                    value={formData.thumbnail.url}
                    onChange={handleChange}
                    placeholder="Enter thumbnail URL"
                />
            </div>
            <div>
                <Label>Preview URL</Label>
                <Input
                    type="text"
                    name="preview.url"
                    value={formData.preview.url}
                    onChange={handleChange}
                    placeholder="Enter preview URL"
                />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <Label>Preview Duration (seconds)</Label>
                    <Input
                        type="number"
                        name="preview.duration"
                        value={formData.preview.duration}
                        onChange={handleChange}
                        min="0"
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