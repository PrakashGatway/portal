import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Play,
  Pause,
  Trash2,
  Loader2,
  Volume2,
  Mic,
  Download,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import api from "../../axiosInstance";

interface AudioUploadComponentProps {
  questionText: string;
  initialAudioUrl?: string;
  onAudioChange: (audioUrl?: string) => void;
  disabled?: boolean;
  uploadLocation?: 'questionAudio' | 'pteAnswer' | 'iletsAnswer';
}

const AudioUploadComponent: React.FC<AudioUploadComponentProps> = ({
  questionText,
  initialAudioUrl,
  onAudioChange,
  disabled = false,
  uploadLocation = 'questionAudio',
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudioUrl ? "https://m8j3lq9z-5000.inc1.devtunnels.ms/" + initialAudioUrl : undefined);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("ended", () => setIsPlaying(false));
        audioRef.current = null;
      }
    };
  }, []);

  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      setIsPlaying(false); // Reset play state when URL changes
    }
  }, [audioUrl]);

  useEffect(() => {
    onAudioChange(uploadingFileName);
  }, [uploadingFileName, onAudioChange]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error("Please select an audio file (MP3, WAV, M4A, etc.)");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Audio file size must be less than 20MB");
      return;
    }

    setAudioFile(file);
    
    if (audioUrl && audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    toast.info("Audio file selected. Click 'Upload' to save to server.");
  };

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error("Please select an audio file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);

      const response = await api.post("/upload/audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          location: uploadLocation
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      if (response.data?.success) {
        const uploadedFilePath = response.data?.file?.path || 
                               response.data.file?.url || 
                               response.data.file?.filePath;
        
        let uploadedUrl = uploadedFilePath;
        if (uploadedFilePath && !uploadedFilePath.startsWith('http')) {
          uploadedUrl = `${'https://m8j3lq9z-5000.inc1.devtunnels.ms'}${uploadedFilePath.startsWith('/') ? '' : '/'}${uploadedFilePath}`;
        }

        if (audioUrl && audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        setUploadingFileName(uploadedFilePath)
        setAudioUrl(uploadedUrl);
        setAudioFile(null); // Clear local file after upload
        
        toast.success("Audio uploaded successfully! You can now play it.");
      } else {
        throw new Error(response.data?.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload audio");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const generateWithElevenLabs = async () => {
    if (!questionText.trim()) {
      toast.error("Please enter question text first");
      return;
    }

    setIsGenerating(true);

    try {
      toast.info("Generating audio with AI...");

      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": "sk_1263d3dcda23bf6c6478839cd3d61e9d15a858853c003e4a",
          },
          body: JSON.stringify({
            text: questionText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            }
          }),
        }
      );

      if (!elevenLabsResponse.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await elevenLabsResponse.blob();
      
      // Clean up previous URL if exists
      if (audioUrl && audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioUrl);
      }

      // Create local URL for preview
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Create File object for upload
      const file = new File([audioBlob], `generated_${Date.now()}.mp3`, {
        type: "audio/mpeg",
      });
      setAudioFile(file);

      toast.success("Audio generated successfully! Click 'Upload' to save to server.");
    } catch (error: any) {
      console.error("Eleven Labs error:", error);
      toast.error("Failed to generate audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error("Playback failed:", error);
          toast.error("Failed to play audio");
          setIsPlaying(false);
        });
    }
  };

  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    if (audioUrl && audioUrl.startsWith("blob:")) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioFile(null);
    setAudioUrl(undefined);
    setIsPlaying(false);
    
    onAudioChange(undefined);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast.info("Audio removed");
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `audio_${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Volume2 className="h-4 w-4" />
        Audio
      </Label>

      {/* Audio Player - Shows when audio is available */}
      {audioUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={togglePlayPause}
                type="button"
                disabled={disabled}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {audioFile?.name || "Audio File"}
                  {!audioUrl.startsWith("blob:") && (
                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Uploaded
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {audioUrl.startsWith("blob:") ? "Local preview" : "Ready to play"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={disabled}
                className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleRemoveAudio}
                disabled={disabled}
                className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300"
                title="Remove Audio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload button for local/generated audio */}
          {audioUrl.startsWith("blob:") && !isUploading && (
            <div className="mt-3 space-y-2">
              <Button
                onClick={handleUpload}
                size="sm"
                className="w-full"
                disabled={disabled}
              >
                <Upload className="mr-2 h-3 w-3" />
                Upload to Server
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Location: {uploadLocation}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Upload and Generate Options - Shows when no audio is loaded */}
      {!audioUrl && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* File Upload Section */}
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/30">
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Upload audio file
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                MP3, WAV, M4A up to 50MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isUploading || isGenerating}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading || isGenerating}
                className="mt-4"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>

            {/* AI Generation Section */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center gap-2 mb-4">
                <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Generate with AI
                </h3>
              </div>

              <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {questionText.length > 100
                    ? `${questionText.substring(0, 100)}...`
                    : questionText || "Enter text above to generate audio"}
                </p>
              </div>

              <Button
                onClick={generateWithElevenLabs}
                disabled={disabled || isGenerating || !questionText.trim()}
                isLoading={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Generate Audio with AI
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default AudioUploadComponent;