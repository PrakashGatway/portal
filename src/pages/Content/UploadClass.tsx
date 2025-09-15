import { useState, useRef } from 'react';
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { Upload, FileVideo, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../axiosInstance";

const RecordedVideoUploadModal = ({ isOpen, onClose, content, onUploadComplete }: any) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'processing', 'completed', 'error'
    const [videoData, setVideoData] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.type.startsWith('video/')) {
            toast.error('Please select a valid video file');
            return;
        }

        // Validate file size (5GB limit for Vimeo)
        if (selectedFile.size > 5 * 1024 * 1024 * 1024) {
            toast.error('File size exceeds 5GB limit');
            return;
        }

        setFile(selectedFile);
        setUploadStatus('idle');
        setUploadProgress(0);
        setVideoData(null);
    };

    // Upload video to Vimeo
    const uploadToVimeo = async () => {

        if (!file) return;

        setIsUploading(true);
        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            const ticketResponse = await api.post('/live/videos/upload', {
                name: content?.title || file.name,
                size: file.size,
                is360: false,
                description: content?.description,
                contentType: file.type
            });
            const { uploadLink, uri, videoId } = ticketResponse.data.data;
            await uploadFileToVimeo(uploadLink, uri, videoId);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const uploadFileToVimeo = (uploadLink, videoUri, videoId) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Listen to upload progress
            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                    console.log(`Upload progress: ${percentComplete}%`);
                }
            });

            xhr.addEventListener("load", async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setUploadStatus("processing");

                    await new Promise(resolve => setTimeout(resolve, 3000));

                    try {
                        const verifyResponse = await api.get(`/live/videos/status/${encodeURIComponent(videoUri)}`);

                        const videoUrl = `https://vimeo.com/${videoId}`;
                        setVideoData({
                            url: videoUrl,
                            vimeoId: videoId,
                            ...verifyResponse.data.data
                        });

                        setUploadStatus("completed");

                        if (onUploadComplete) {
                            onUploadComplete({
                                url: verifyResponse.data?.data?.player_embed_url || videoUrl,
                                vimeoId: videoId,
                                duration: verifyResponse.data?.data?.duration || 0
                            });
                        }

                        resolve();
                    } catch (error) {
                        console.error('Error in post-upload processing:', error);
                        setUploadStatus('error');
                        toast.error('Video processing failed');
                        reject(error);
                    }
                } else {
                    throw new Error(`Upload failed with status: ${xhr.status}`);
                }
            });

            xhr.addEventListener("error", () => {
                setUploadStatus('error');
                toast.error('Upload failed');
                reject(new Error('Upload failed'));
            });

            xhr.open("POST", uploadLink);
            const formData = new FormData();
            formData.append("file_data", file);
            xhr.send(formData);
        });
    };

    // Reset the uploader
    const resetUploader = () => {
        setFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        setVideoData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Close modal and reset
    const handleClose = () => {
        resetUploader();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl">
            <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Upload Recorded Video
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Upload video for "{content?.title}"
                        </p>
                    </div>
                    {uploadStatus === 'uploading' && (
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                            {uploadProgress}%
                        </div>
                    )}
                </div>

                {/* Upload Area */}
                {!file ? (
                    <div
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="video/*"
                            className="hidden"
                        />
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Upload a video
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Drag and drop or click to select a video file
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            MP4, MOV, AVI up to 5GB
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* File Info Card */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FileVideo className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                            {file.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upload Status */}
                        {uploadStatus !== 'idle' && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {uploadStatus === 'uploading' && 'Uploading to Vimeo...'}
                                        {uploadStatus === 'processing' && 'Processing video...'}
                                        {uploadStatus === 'completed' && 'Upload Complete!'}
                                        {uploadStatus === 'error' && 'Upload Failed'}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {uploadStatus === 'uploading' && (
                                            <span className="font-medium">{uploadProgress}%</span>
                                        )}
                                        {uploadStatus === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                        {uploadStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                    </span>
                                </div>

                                {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                                    <div className="space-y-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        {uploadStatus === 'uploading' && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {Math.round((file.size * uploadProgress) / 100 / (1024 * 1024))} MB of {(file.size / (1024 * 1024)).toFixed(2)} MB uploaded
                                            </div>
                                        )}
                                        {uploadStatus === 'processing' && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                Processing video on Vimeo servers...
                                            </div>
                                        )}
                                    </div>
                                )}

                                {uploadStatus === 'completed' && videoData && (
                                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Your video is now available at:
                                            <a
                                                href={videoData.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium underline hover:text-green-900 dark:hover:text-green-100 ml-1"
                                            >
                                                View on Vimeo
                                            </a>
                                        </p>
                                    </div>
                                )}

                                {uploadStatus === 'error' && (
                                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                        <p className="text-sm text-red-800 dark:text-red-200">
                                            Upload failed. Please try again.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={resetUploader}
                                disabled={isUploading && uploadStatus !== 'error'}
                                className="flex-1"
                            >
                                Change File
                            </Button>

                            <Button
                                variant="primary"
                                onClick={(e) => { e.preventDefault(); console.log("dfidkjfkdjfkjdkf"); uploadToVimeo() }}
                                disabled={isUploading || uploadStatus === 'completed'}
                                className="flex-1"
                            >
                                {isUploading ? (
                                    <span className="flex items-center">
                                        <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                                        {uploadStatus === 'uploading' ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                                    </span>
                                ) : (
                                    'Upload to Vimeo'
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RecordedVideoUploadModal;