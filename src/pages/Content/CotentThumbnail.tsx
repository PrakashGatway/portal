import { useState, useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import { Upload, X, /* ... other icons you use ... */ } from 'lucide-react';   

export const ContentThumbnailDropzone = ({ value, onChange, onRemove, error }:any) => {
    const [preview, setPreview] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            onChange(file);
        }
    }, [onChange, preview]); // Re-create callback if onChange or preview changes

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
        },
        maxSize: 2 * 1024 * 1024, // 2MB
        multiple: false,
        maxFiles: 1
    });

    const handleRemove = () => {
        if (preview) {
            URL.revokeObjectURL(preview);
            setPreview(null);
        }
        onRemove();
    };


    const imageSrc = preview || value?.url || null;

    return (
        <div className="space-y-2">
            {/* Dropzone Area */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                } ${error ? 'border-red-500' : ''}`}
            >
                <input {...getInputProps()} />
                {imageSrc ? (
                    <div className="flex flex-col items-center">
                        <img
                            src={imageSrc} // Use the determined source (preview or existing URL)
                            alt="Thumbnail preview"
                            className="h-32 w-full object-cover rounded-md mb-2"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Click to replace or drag & drop
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <Upload className="mx-auto h-6 w-6 text-gray-400" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {isDragActive
                                ? 'Drop the image here'
                                : 'Drag & drop an image here, or click to select'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG, GIF, SVG up to 2MB
                        </p>
                    </div>
                )}
            </div>

            {(imageSrc) && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="flex items-center text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                    <X className="h-3 w-3 mr-1" />
                    Remove Thumbnail
                </button>
            )}

            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};
