// components/speaking/SpeakingTestSection.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Clock,
  Mic,
  Square,
  ArrowLeft,
  ArrowRight,
  Volume2,
  Pause,
  Play,
  CheckCircle,
  Download,
  Headphones,
  Send,
  Shrink,
} from "lucide-react";
import axios from "axios";
import api from "../../axiosInstance";

interface SpeakingTestSectionProps {
  question: {
    _id: string;
    title: string;
    isQuestionGroup: boolean;
    questionGroup: Array<{
      _id: string;
      title: string;
      instruction: string;
      questions: Array<{
        _id: string;
        question: string;
        options: Array<{ label: string; text: string }>;
        explanation: string;
      }>;
      order: number;
      type: string;
      marks: number;
    }>;
    totalQuestions: number;
    content: {
      instruction: string;
      passageTitle?: string;
      passageText?: string;
      transcript?: string;
      imageUrl?: string;
      audioUrl?: string;
      videoUrl?: string;
    };
    cueCard?: {
      prompts: string[];
    };
    timeLimit: number;
  };
  progress: {
    currentSection: number;
    totalSections: number;
    currentQuestion?: number;
    questionsAnswered?: number;
    totalQuestions?: number;
    completionPercentage?: number;
  };
  onBack: () => void;
  onSubmit: (answers: Array<{ questionId: string; audioUrl: string; transcript: string }>) => void;
  onRecord: (action: "start" | "stop", questionId?: string) => Promise<void>;
  recording: boolean;
  recordedUrl: string | null;
  currentQuestionId?: string;
}

interface QuestionAnswer {
  questionId: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
}

const SpeakingTestSection: React.FC<SpeakingTestSectionProps> = ({
  question,
  progress,
  onBack,
  onSubmit,
  onRecord,
  recording,
  recordedUrl,
  currentQuestionId,
}) => {
  // State management
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionGroupIndex, setCurrentQuestionGroupIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuestionsOverview, setShowQuestionsOverview] = useState(false);
  
  // Recording specific states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<string>("");
  const [userManuallyStopped, setUserManuallyStopped] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  
  // Auto functionality states
  const [autoSpeaking, setAutoSpeaking] = useState(false);
  const [speechEnded, setSpeechEnded] = useState(false);
  const [hasQuestionSpoken, setHasQuestionSpoken] = useState(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Combined audio states
  const [combinedAudioUrl, setCombinedAudioUrl] = useState<string | null>(null);
  const [combinedAudioBlob, setCombinedAudioBlob] = useState<Blob | null>(null);
  const [compressedAudioBlob, setCompressedAudioBlob] = useState<Blob | null>(null);
  const [isPlayingCombined, setIsPlayingCombined] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
    bitrate: number;
  } | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const combinedAudioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Speech recognition refs
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  
  // Auto functionality refs
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voicesLoadedRef = useRef<boolean>(false);
  const audioBlobsRef = useRef<Map<string, Blob>>(new Map());

  // Get all questions from all groups
  const allQuestions = React.useMemo(() => {
    const questions: any[] = [];
    
    if (!question.questionGroup || question.questionGroup.length === 0) {
      return questions;
    }
    
    // Sort groups by order
    const sortedGroups = [...question.questionGroup].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Loop through each group
    sortedGroups.forEach((group, groupIndex) => {
      // Add each question
      group.questions?.forEach((q, qIndex) => {
        questions.push({
          _id: q._id,
          question: q.question,
          options: q.options || [],
          explanation: q.explanation || "",
          groupId: group._id,
          groupTitle: group.title,
          groupOrder: group.order || groupIndex + 1,
          groupType: group.type || 'speaking_part_1',
          groupIndex: groupIndex,
          questionInGroupIndex: qIndex,
          isCueCard: group.type === 'speaking_part_2' || 
                    group.title.toLowerCase().includes('cue') ||
                    (group.instruction && group.instruction.toLowerCase().includes('you should say'))
        });
      });
    });
    
    return questions;
  }, [question.questionGroup]);

  // Ensure currentQuestionIndex is valid
  useEffect(() => {
    if (allQuestions.length > 0 && currentQuestionIndex >= allQuestions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [allQuestions, currentQuestionIndex]);

  // Current question - safely get
  const currentQuestion = allQuestions[currentQuestionIndex] || allQuestions[0] || null;

  // Current question group
  const currentQuestionGroup = React.useMemo(() => {
    if (!currentQuestion) return question.questionGroup?.[0];
    return question.questionGroup?.find(group => group._id === currentQuestion.groupId);
  }, [currentQuestion, question.questionGroup]);

  // Initialize answers
  useEffect(() => {
    if (allQuestions.length > 0) {
      const initialAnswers: QuestionAnswer[] = allQuestions.map(q => ({
        questionId: q._id,
        audioBlob: null,
        audioUrl: null,
        transcript: ""
      }));
      setAnswers(initialAnswers);
    }
  }, [allQuestions]);

  // Component mount पर ही auto speak start करें
  useEffect(() => {
    if (currentQuestion) {
      // Check करें कि क्या इस question की recording पहले से है
      const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);
      if (currentAnswer?.audioUrl) {
        setHasRecorded(true);
        setRecordingStatus("Recording already completed for this question");
      } else {
        setHasRecorded(false);
      }
      
      // Check करें कि क्या इस question की auto speak पहले ही हो चुकी है
      if (!hasQuestionSpoken) {
        // Small delay for better UX
        setTimeout(() => {
          startAutoSpeak();
        }, 1000);
      }
      
      initSpeechRecognition();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAutoSpeak();
    };
  }, [currentQuestion, answers, hasRecorded, hasQuestionSpoken]);

  // Load voices for speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window && !voicesLoadedRef.current) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          voicesLoadedRef.current = true;
        }
      };
      
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
      
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setRecordingTime(0);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Speech ended होने पर auto recording start करें
  useEffect(() => {
    // केवल तभी auto record करें जब:
    // 1. Speech ended हो
    // 2. Auto record enabled हो  
    // 3. Currently recording न हो
    // 4. User ने manually stop न किया हो
    // 5. पहले से recording न हुई हो
    if (speechEnded && autoRecordEnabled && !isRecording && !userManuallyStopped && !hasRecorded) {
      // 1 सेकंड का delay देकर recording start करें
      autoRecordTimeoutRef.current = setTimeout(() => {
        if (!isRecording && currentQuestion && !userManuallyStopped && !hasRecorded) {
          console.log("Auto recording starting...");
          handleRecordClick();
        }
      }, 1000);
    }
    
    return () => {
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
    };
  }, [speechEnded, autoRecordEnabled, isRecording, currentQuestion, userManuallyStopped, hasRecorded]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Initialize speech recognition
  const initSpeechRecognition = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }
      
      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setTranscript(prev => prev + finalTranscript);
        
        // Update answer with transcript
        if (currentQuestion) {
          setAnswers(prev => prev.map(answer => 
            answer.questionId === currentQuestion._id
              ? { ...answer, transcript: transcriptRef.current }
              : answer
          ));
        }
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognitionRef.current = recognition;
  };

  // Auto speak function
  const startAutoSpeak = () => {
    if (!currentQuestion || !('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported");
      setRecordingStatus("Speech synthesis not available. Click microphone to record manually.");
      return;
    }
    
    // Check करें कि क्या यह question पहले ही speak हो चुका है
    if (hasQuestionSpoken) {
      setRecordingStatus("Question already spoken. Ready for recording.");
      return;
    }
    
    // पहले से चल रही speech को रोकें
    stopAutoSpeak();
    
    // Reset flags
    setSpeechEnded(false);
    setUserManuallyStopped(false);
    
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    
    // Voice settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Voice events
    utterance.onstart = () => {
      console.log("Auto speech started");
      setAutoSpeaking(true);
      setRecordingStatus("Listening to question...");
    };
    
    utterance.onend = () => {
      console.log("Auto speech ended");
      setAutoSpeaking(false);
      setSpeechEnded(true);
      setHasQuestionSpoken(true);
      setRecordingStatus("Question spoken. Recording will start in 1 second...");
    };
    
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setAutoSpeaking(false);
      setSpeechEnded(true);
      setHasQuestionSpoken(true);
      setRecordingStatus("Speech error. Click microphone to record manually.");
    };
    
    // Select voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }
    
    speechSynthesisRef.current = utterance;
    
    // Small delay for better UX
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 300);
  };

  // Stop auto speak
  const stopAutoSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAutoSpeaking(false);
    speechSynthesisRef.current = null;
  };

  // Manual speech toggle
  const toggleQuestionSpeech = () => {
    if (!currentQuestion || !('speechSynthesis' in window)) return;
    
    // अगर पहले ही speak हो चुका है तो दोबारा नहीं होगा
    if (hasQuestionSpoken) {
      setRecordingStatus("Question already spoken. Ready for recording.");
      return;
    }
    
    if (window.speechSynthesis.speaking && autoSpeaking) {
      stopAutoSpeak();
    } else {
      startAutoSpeak();
    }
  };

  // Audio visualization
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyserRef.current!.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 1.5;
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  // Start visualization
  const startVisualization = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    analyser.minDecibels = -60;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    analyserRef.current = analyser;
    audioContextRef.current = audioContext;
    mediaStreamRef.current = stream;
    
    drawVisualizer();
  };

  // Stop visualization
  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (analyserRef.current && audioContextRef.current) {
      analyserRef.current.disconnect();
      audioContextRef.current.close();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Start audio recording
  const startAudioRecording = (stream: MediaStream) => {
     try {
    // Low bitrate recording settings for speech
    const options = {
      audioBitsPerSecond: 16000, // 16 kbps recording
    };
    
    // Try different MIME types
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4;codecs="mp4a.40.2"',
      ''
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        if (mimeType) {
          options.mimeType = mimeType;
        }
        break;
      }
    }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          setRecordingStatus("Recording failed: No audio data");
          return;
        }
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/webm' 
          });
          
          // Store blob in ref
          if (currentQuestion) {
            audioBlobsRef.current.set(currentQuestion._id, audioBlob);
          }
          
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudio(audioUrl);
          
          // Mark that recording has been completed for this question
          setHasRecorded(true);
          
          // Update answer with recorded audio
          if (currentQuestion) {
            setAnswers(prev => prev.map(answer => 
              answer.questionId === currentQuestion._id 
                ? { ...answer, audioBlob, audioUrl, transcript }
                : answer
            ));
          }
          
          setRecordingStatus("Recording completed successfully");
        } catch (blobError) {
          console.error("Blob creation error:", blobError);
          setRecordingStatus("Recording failed: Could not create audio file");
        }
      };
      
      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setRecordingStatus("Recording error occurred");
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      
    } catch (err) {
      console.error("Audio recording initialization failed:", err);
      setRecordingStatus("Audio recording not supported in this browser");
    }
  };

  // Combine all audio blobs into one
  const combineAudioBlobs = async (): Promise<Blob | null> => {
    const audioBlobs = Array.from(audioBlobsRef.current.values());
    
    if (audioBlobs.length === 0) {
      return null;
    }
    
    if (audioBlobs.length === 1) {
      return audioBlobs[0];
    }
    
    try {
      setIsCombining(true);
      setRecordingStatus("Combining all recordings...");
      
      // Create a new audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Array to hold decoded audio buffers
      const audioBuffers = [];
      
      // Decode each audio blob
      for (const blob of audioBlobs) {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push(audioBuffer);
      }
      
      // Calculate total length
      let totalLength = 0;
      for (const buffer of audioBuffers) {
        totalLength += buffer.length;
      }
      
      // Create new buffer for combined audio
      const combinedBuffer = audioContext.createBuffer(
        audioBuffers[0].numberOfChannels,
        totalLength,
        audioBuffers[0].sampleRate
      );
      
      // Copy audio data from each buffer
      let offset = 0;
      for (const buffer of audioBuffers) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          combinedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;
      }
      
      // Convert back to blob (WAV format)
      const wavBlob = await audioBufferToWav(combinedBuffer);
      
      setIsCombining(false);
      setRecordingStatus("All recordings combined successfully");
      
      return wavBlob;
      
    } catch (error) {
      console.error("Error combining audio blobs:", error);
      setIsCombining(false);
      setRecordingStatus("Error combining recordings");
      
      // Fallback: simple concatenation
      try {
        const combinedChunks: BlobPart[] = [];
        for (const blob of audioBlobs) {
          const arrayBuffer = await blob.arrayBuffer();
          combinedChunks.push(arrayBuffer);
        }
        return new Blob(combinedChunks, { type: 'audio/wav' });
      } catch (fallbackError) {
        console.error("Fallback combining also failed:", fallbackError);
        return null;
      }
    }
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const length = buffer.length;
      
      // Create WAV header
      const wav = new DataView(new ArrayBuffer(44 + length * numberOfChannels * 2));
      
      // RIFF identifier
      writeString(wav, 0, 'RIFF');
      // File length
      wav.setUint32(4, 36 + length * numberOfChannels * 2, true);
      // RIFF type
      writeString(wav, 8, 'WAVE');
      // Format chunk identifier
      writeString(wav, 12, 'fmt ');
      // Format chunk length
      wav.setUint32(16, 16, true);
      // Sample format (PCM)
      wav.setUint16(20, 1, true);
      // Channel count
      wav.setUint16(22, numberOfChannels, true);
      // Sample rate
      wav.setUint32(24, sampleRate, true);
      // Byte rate (sample rate * block align)
      wav.setUint32(28, sampleRate * numberOfChannels * 2, true);
      // Block align (channel count * bytes per sample)
      wav.setUint16(32, numberOfChannels * 2, true);
      // Bits per sample
      wav.setUint16(34, 16, true);
      // Data chunk identifier
      writeString(wav, 36, 'data');
      // Data chunk length
      wav.setUint32(40, length * numberOfChannels * 2, true);
      
      // Write audio data
      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
          wav.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      resolve(new Blob([wav], { type: 'audio/wav' }));
    });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Compress audio using Web Audio API
 const compressAudio = async (audioBlob: Blob): Promise<{ compressedBlob: Blob; info: any }> => {
  return new Promise(async (resolve, reject) => {
    let audioContext: AudioContext | null = null;
    let offlineContext: OfflineAudioContext | null = null;
    
    try {
      setIsCompressing(true);
      setRecordingStatus("Compressing audio for optimal upload...");
      
      // Create audio context
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decode the audio data
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Calculate duration in minutes
      const durationInMinutes = audioBuffer.duration / 60;
      
      // TARGET: 1MB per 3 minutes
      const targetBytesPerMinute = 350 * 1024; // ~350KB per minute
      const targetSizeBytes = Math.max(
        100 * 1024, // Minimum 100KB
        Math.round(durationInMinutes * targetBytesPerMinute)
      );
      
      // Calculate required bitrate
      const durationInSeconds = audioBuffer.duration;
      const targetBitrate = Math.round((targetSizeBytes * 8) / durationInSeconds);
      
      // Speech के लिए optimal bitrate range
      const minBitrate = 8000;
      const optimalBitrate = 16000;
      const maxBitrate = 32000;
      
      // Bitrate को optimal range में लाएं
      let adjustedBitrate = targetBitrate;
      if (targetBitrate < minBitrate) adjustedBitrate = minBitrate;
      if (targetBitrate > maxBitrate) adjustedBitrate = maxBitrate;
      
      // मोनो में convert करें
      const isMono = audioBuffer.numberOfChannels === 1;
      let monoBuffer = audioBuffer;
      
      if (!isMono) {
        monoBuffer = audioContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
        const monoData = monoBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
          let sum = 0;
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            sum += audioBuffer.getChannelData(channel)[i];
          }
          monoData[i] = sum / audioBuffer.numberOfChannels;
        }
      }
      
      // Speech के लिए sample rate
      const targetSampleRate = adjustedBitrate <= 16000 ? 8000 : 16000;
      const ratio = targetSampleRate / monoBuffer.sampleRate;
      const newLength = Math.round(monoBuffer.length * ratio);
      
      // Offline context create करें
      offlineContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
        1, // channels (mono)
        newLength,
        targetSampleRate
      );
      
      // Create buffer source
      const source = offlineContext.createBufferSource();
      source.buffer = monoBuffer;
      source.connect(offlineContext.destination);
      source.start(0);
      
      // Render to new buffer
      const renderedBuffer = await offlineContext.startRendering();
      
      // Codec select करें
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4;codecs="mp4a.40.2"',
        'audio/ogg;codecs=opus',
        'audio/webm',
      ];
      
      let selectedMimeType = 'audio/webm;codecs=opus';
      for (const mimeType of supportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      // Create new audio context for MediaRecorder
      const compressionAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const mediaStream = compressionAudioContext.createMediaStreamDestination();
      const sourceNode = compressionAudioContext.createBufferSource();
      sourceNode.buffer = renderedBuffer;
      sourceNode.connect(mediaStream);
      
      const mediaRecorder = new MediaRecorder(mediaStream.stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: adjustedBitrate
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: selectedMimeType });
        
        // Calculate compression info - यहाँ audioBuffer का use करें
        const originalSize = audioBlob.size;
        const compressedSize = compressedBlob.size;
        const ratio = compressedSize / originalSize;
        const actualBitrate = Math.round((compressedSize * 8) / durationInSeconds);
        const bytesPerMinute = durationInMinutes > 0 ? compressedSize / durationInMinutes : 0;
        
        // Cleanup contexts
        try {
          compressionAudioContext.close();
          if (audioContext.state !== 'closed') audioContext.close();
          if (offlineContext) {
            // OfflineAudioContext को close करने का कोई method नहीं है
          }
        } catch (cleanupError) {
          console.warn("Context cleanup warning:", cleanupError);
        }
        
        setCompressionInfo({
          originalSize,
          compressedSize,
          ratio,
          bitrate: actualBitrate
        });
        
        setIsCompressing(false);
        setRecordingStatus(`Audio compressed: ${formatFileSize(compressedSize)}`);
        
        resolve({
          compressedBlob,
          info: {
            originalSize,
            compressedSize,
            ratio,
            bitrate: actualBitrate,
            duration: durationInSeconds,
            bytesPerMinute,
            estimatedSize: `${formatFileSize(compressedSize)} for ${durationInMinutes.toFixed(1)} minutes`
          }
        });
      };
      
      mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        try {
          compressionAudioContext.close();
          if (audioContext.state !== 'closed') audioContext.close();
        } catch (cleanupError) {
          console.warn("Context cleanup warning:", cleanupError);
        }
        
        // Fallback
        resolve({
          compressedBlob: audioBlob,
          info: {
            originalSize: audioBlob.size,
            compressedSize: audioBlob.size,
            ratio: 1,
            bitrate: 0,
            duration: durationInSeconds,
            bytesPerMinute: 0,
            estimatedSize: "Compression failed"
          }
        });
      };
      
      // Start recording
      mediaRecorder.start();
      sourceNode.start(0);
      
      // Stop after duration
      const stopTimeout = setTimeout(() => {
        try {
          mediaRecorder.stop();
          sourceNode.stop();
        } catch (stopError) {
          console.error("Error stopping recorder:", stopError);
        }
      }, (renderedBuffer.duration * 1000) + 1000);
      
    } catch (error) {
      console.error("Audio compression error:", error);
      
      // Cleanup
      try {
        if (audioContext && audioContext.state !== 'closed') audioContext.close();
      } catch (cleanupError) {
        console.warn("Context cleanup warning:", cleanupError);
      }
      
      setIsCompressing(false);
      setRecordingStatus("Compression failed, using original audio");
      
      // Fallback
      resolve({
        compressedBlob: audioBlob,
        info: {
          originalSize: audioBlob.size,
          compressedSize: audioBlob.size,
          ratio: 1,
          bitrate: 0,
          duration: 0,
          bytesPerMinute: 0,
          estimatedSize: "Compression failed"
        }
      });
    }
  });
};

  // Preview combined audio
  const previewCombinedAudio = async () => {
    try {
      setRecordingStatus("Preparing combined audio preview...");
      
      // Combine audio first
      const combinedBlob = await combineAudioBlobs();
      
      if (!combinedBlob) {
        setRecordingStatus("No recordings available to preview");
        return;
      }
      
      // Compress the audio
      const { compressedBlob, info } = await compressAudio(combinedBlob);
      
      // Create URL for compressed audio
      const audioUrl = URL.createObjectURL(compressedBlob);
      setCombinedAudioUrl(audioUrl);
      setCombinedAudioBlob(combinedBlob);
      setCompressedAudioBlob(compressedBlob);
      
      // Show review modal
      setShowReviewModal(true);
      
      setRecordingStatus("Combined audio ready for preview");
      
    } catch (error) {
      console.error("Error previewing combined audio:", error);
      setRecordingStatus("Error preparing preview");
    }
  };

  // Play combined audio
  const playCombinedAudio = () => {
    if (!combinedAudioUrl || !combinedAudioRef.current) return;
    
    if (!combinedAudioRef.current) {
      combinedAudioRef.current = new Audio(combinedAudioUrl);
    } else {
      combinedAudioRef.current.src = combinedAudioUrl;
    }
    
    const audioElement = combinedAudioRef.current;
    
    audioElement.onended = () => {
      setIsPlayingCombined(false);
    };
    
    audioElement.onerror = () => {
      setRecordingStatus("Error playing combined audio");
      setIsPlayingCombined(false);
    };
    
    if (isPlayingCombined) {
      audioElement.pause();
      setIsPlayingCombined(false);
    } else {
      audioElement.play()
        .then(() => {
          setIsPlayingCombined(true);
          setRecordingStatus("Playing combined recording...");
        })
        .catch(err => {
          console.error("Play failed:", err);
          setRecordingStatus(`Cannot play: ${err.message}`);
        });
    }
  };

  // Download combined audio (original)
  const downloadCombinedAudio = () => {
    if (!combinedAudioBlob) {
      setRecordingStatus("No combined audio available to download");
      return;
    }
    
    try {
      const url = URL.createObjectURL(combinedAudioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speaking_test_${question.title.replace(/\s+/g, '_')}_${new Date().getTime()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setRecordingStatus("Original audio downloaded successfully");
      
    } catch (error) {
      console.error("Error downloading audio:", error);
      setRecordingStatus("Error downloading audio");
    }
  };

  // Download compressed audio
  const downloadCompressedAudio = () => {
    if (!compressedAudioBlob) {
      setRecordingStatus("No compressed audio available to download");
      return;
    }
    
    try {
      const url = URL.createObjectURL(compressedAudioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speaking_test_compressed_${question.title.replace(/\s+/g, '_')}_${new Date().getTime()}.m4a`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setRecordingStatus("Compressed audio downloaded successfully");
      
    } catch (error) {
      console.error("Error downloading compressed audio:", error);
      setRecordingStatus("Error downloading compressed audio");
    }
  };

  // Upload compressed audio to API
  const uploadCombinedAudio = async () => {
    if (!compressedAudioBlob) {
      setRecordingStatus("No audio to upload");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', compressedAudioBlob, 'speaking_test_compressed.m4a');

      
      // Add compression info
      if (compressionInfo) {
        formData.append('compressionInfo', JSON.stringify({
          originalSize: compressionInfo.originalSize,
          compressedSize: compressionInfo.compressedSize,
          compressionRatio: compressionInfo.ratio,
          bitrate: compressionInfo.bitrate,
          estimatedSizePerMinute: Math.round((compressionInfo.compressedSize / (compressionInfo.originalSize > 0 ? compressionInfo.originalSize / (1024 * 1024) : 1)) * 1024 * 1024)
        }));
      }
      
      // Add transcripts
      const transcripts = answers.map(answer => ({
        questionId: answer.questionId,
        transcript: answer.transcript
      }));
      formData.append('transcripts', JSON.stringify(transcripts));
      
      const response = await api.post('/upload/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // Add timeout and progress
        timeout: 300000, // 5 minutes timeout
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setRecordingStatus(`Uploading: ${percentCompleted}%`);
          }
        }
      });
      
      console.log('Audio uploaded successfully:', response.data);
      
      // Prepare answers for parent component
      const formattedAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        audioUrl: answer.audioUrl || '',
        transcript: answer.transcript
      }));
      
      // Call parent onSubmit
      onSubmit(formattedAnswers);
      
      setRecordingStatus("Test submitted successfully!");
      setShowReviewModal(false);
      
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      
      if (error.code === 'ECONNABORTED') {
        setRecordingStatus("Upload timeout. Please try again.");
      } else if (error.response) {
        setRecordingStatus(`Upload failed: ${error.response.data.message || error.response.statusText}`);
      } else {
        setRecordingStatus("Error uploading audio. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit test - show review modal
  const handleSubmitTest = async () => {
    // Check if all questions are recorded
    const recordedCount = answers.filter(a => a.audioBlob).length;
    if (recordedCount < allQuestions.length) {
      setRecordingStatus(`Please record all questions. ${recordedCount}/${allQuestions.length} recorded.`);
      return;
    }
    
    // Show review modal
    previewCombinedAudio();
  };

  // Complete recording function
  const handleRecordClick = async () => {
    if (!currentQuestion) return;
    
    // अगर पहले ही recording हो चुकी है तो return करें
    if (hasRecorded && !isRecording) {
      setRecordingStatus("Recording already completed for this question");
      return;
    }
    
    if (isRecording) {
      // User ने manually recording stop की है
      setUserManuallyStopped(true);
      
      // Stop recording
      setRecordingStatus("Recording completed");
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      stopVisualization();
      setIsRecording(false);
      
      try {
        await onRecord("stop", currentQuestion._id);
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
      
    } else {
      // Start recording - reset manually stopped flag
      setUserManuallyStopped(false);
      setRecordingStatus("Starting recording...");
      transcriptRef.current = "";
      setTranscript("");
      audioChunksRef.current = [];
      setRecordedAudio("");
      
       try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Low sample rate for speech
          channelCount: 1,    // Mono recording
          bitrate: 16000     // Low bitrate
        }
      });
        
        mediaStreamRef.current = stream;
        
        // Start audio recording
        startAudioRecording(stream);
        
        // Start speech recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (recognitionError) {
            console.error("Speech recognition start error:", recognitionError);
          }
        }
        
        // Start visualization
        startVisualization(stream);
        
        setIsRecording(true);
        setRecordingStatus("Recording... Speak now");
        setRecordingTime(0);
        
        try {
          await onRecord("start", currentQuestion._id);
        } catch (error) {
          console.error("Error starting recording:", error);
        }
        
      } catch (err) {
        console.error("Microphone access error:", err);
        setRecordingStatus("Microphone access denied or not available");
        setIsRecording(false);
      }
    }
  };

  // Play recording
  const handlePlayRecording = () => {
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id);
    const audioUrl = recordedAudio || currentAnswer?.audioUrl;
    
    if (!audioUrl) {
      setRecordingStatus("No recording available to play");
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
    }
    
    const audioElement = audioRef.current;
    
    audioElement.onended = () => {
      setIsPlaying(false);
    };
    
    audioElement.onerror = () => {
      setRecordingStatus("Error playing audio");
      setIsPlaying(false);
    };
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play()
        .then(() => {
          setIsPlaying(true);
          setRecordingStatus("Playing recording...");
        })
        .catch(err => {
          console.error("Play failed:", err);
          setRecordingStatus(`Cannot play: ${err.message}`);
        });
    }
  };

  // Navigation functions
  const handleNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Reset states for new question
      setRecordingTime(0);
      setIsRecording(false);
      setRecordedAudio("");
      setRecordingStatus("");
      setAutoSpeaking(false);
      setSpeechEnded(false);
      setUserManuallyStopped(false);
      setHasQuestionSpoken(false);
      
      // Stop any ongoing recording/playback/speech
      stopAutoSpeak();
      stopVisualization();
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      // Clear auto record timeout
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      
    } else {
      // Last question - show review modal
      handleSubmitTest();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      
      // Reset states for previous question
      setRecordingTime(0);
      setIsRecording(false);
      setRecordedAudio("");
      setRecordingStatus("");
      setAutoSpeaking(false);
      setSpeechEnded(false);
      setUserManuallyStopped(false);
      setHasQuestionSpoken(false);
      
      // Stop any ongoing recording/playback/speech
      stopAutoSpeak();
      stopVisualization();
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      
      // Clear auto record timeout
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopVisualization();
      stopAutoSpeak();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (combinedAudioRef.current) {
        combinedAudioRef.current.pause();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }
      // Cleanup URLs
      if (combinedAudioUrl) {
        URL.revokeObjectURL(combinedAudioUrl);
      }
    };
  }, []);

  // Get answer for current question
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id);

  // Calculate progress
  const answeredQuestions = answers.filter(a => a.audioBlob).length;
  const totalQuestions = allQuestions.length;

  // Error handling
  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-red-600">No questions available</h3>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-semibold text-sm">{question.title}</h1>
                <div className="text-xs text-gray-500">
                  {currentQuestion?.groupTitle} • 
                  Question {currentQuestionIndex + 1} of {allQuestions.length}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Question spoken indicator */}
              {hasQuestionSpoken && !autoSpeaking && (
                <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                  <Volume2 className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Question Spoken</span>
                </div>
              )}
              
              {/* Recording completed indicator */}
              {hasRecorded && !isRecording && (
                <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Recorded</span>
                </div>
              )}
              
              {/* Auto speaking indicator */}
              {autoSpeaking && (
                <div className="flex items-center space-x-1 bg-purple-50 px-3 py-1 rounded-full">
                  <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-purple-700">Speaking...</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full">
                <Clock className="h-3 w-3 text-red-600" />
                <span className="font-bold text-red-700 text-sm">
                  {formatTime(recordingTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className=" gap-4 p-4  mx-auto">
        {/* Right Column - Question & Recording */}
        <div className="lg:col-span-4">
          <div className="space-y-4 flex flex-wrap justify-around">
            {/* Current Group Info */}
            {currentQuestionGroup && (
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-xl mb-2">{currentQuestionGroup.title}</h2>
                    <p className="text-gray-600 whitespace-pre-line">{currentQuestionGroup.instruction}</p>
                  </div>
                  <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {currentQuestionGroup.type.replace('speaking_', 'Part ').toUpperCase()}
                  </div>
                </div>
                <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      {currentQuestion.isCueCard ? 'Cue Card' : `Question ${currentQuestionIndex + 1}`}
                    </div>
                    {hasQuestionSpoken && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        ✓ Spoken
                      </div>
                    )}
                    {hasRecorded && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        ✓ Recorded
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {currentQuestionIndex + 1} of {totalQuestions}
                    </div>
                  </div>
                  <button
                    onClick={toggleQuestionSpeech}
                    className="p-2 hover:bg-gray-100 rounded-full relative"
                    title={hasQuestionSpoken ? "Question already spoken" : autoSpeaking ? "Stop speech" : "Play question aloud"}
                  >
                    <Volume2 className={`h-5 w-5 ${
                      hasQuestionSpoken ? 'text-green-600' : 
                      autoSpeaking ? 'text-blue-600' : 
                      'text-gray-600'
                    }`} />
                    {autoSpeaking && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full animate-ping"></div>
                    )}
                    {hasQuestionSpoken && !autoSpeaking && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-600 rounded-full"></div>
                    )}
                  </button>
                </div>

                {/* Question Text */}
                <h3 className="text-xl font-bold mb-4">
                  {currentQuestion.question}
                </h3>

                {/* Cue Card Prompts */}
                {currentQuestion.isCueCard && question.cueCard?.prompts && question.cueCard.prompts.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-3 text-gray-800">You should say:</h4>
                    <ul className="space-y-2">
                      {question.cueCard.prompts.map((prompt, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-6 h-6 bg-gray-800 text-white rounded-full text-sm leading-6 text-center mr-3 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-md p-5 w-[50%]">
              
              {/* Recording Section */}
              <div className="border-t pt-3">
                <div className="space-y-6">
                    {/* Audio Visualizer */}
                    <div className="mb-4">
                      <div className="bg-gray-900 rounded-xl p-3">
                        <canvas
                          ref={canvasRef}
                          width={800}
                          height={100}
                          className="w-full h-12 rounded"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-2 px-1">
                        <span>Status: <span className={
                          isRecording ? "text-green-500 font-bold" : 
                          hasRecorded ? "text-green-600" :
                          autoSpeaking ? "text-purple-500" :
                          hasQuestionSpoken ? "text-green-600" :
                          speechEnded && !isRecording && !userManuallyStopped && !hasRecorded ? "text-orange-500" : 
                          "text-gray-500"
                        }>
                          {isRecording ? '● Recording' : 
                           hasRecorded ? '✓ Recorded' :
                           autoSpeaking ? 'Speaking question...' :
                           hasQuestionSpoken ? '✓ Question Spoken' :
                           speechEnded && !isRecording && !userManuallyStopped && !hasRecorded ? 'Recording starting...' : 
                           'Ready'}
                        </span></span>
                        <span className="font-mono">
                          {isRecording ? formatTime(recordingTime) : "00:00"}
                        </span>
                      </div>
                      
                      {recordingStatus && (
                        <div className={`mt-2 p-2 rounded text-center text-sm ${
                          recordingStatus.includes('failed') || recordingStatus.includes('error') 
                            ? 'bg-red-50 text-red-700'
                            : recordingStatus.includes('success') || recordingStatus.includes('completed')
                            ? 'bg-green-50 text-green-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {recordingStatus}
                        </div>
                      )}
                    </div>

                    {/* Recording Controls */}
                    <div className="text-center">
                      <div className="flex justify-center items-center space-x-6 mb-2">
                        <button
                          onClick={handleRecordClick}
                          disabled={hasRecorded && !isRecording}
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isRecording 
                              ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-xl' 
                              : hasRecorded
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white transition-all shadow-lg ${hasRecorded && !isRecording ? 'opacity-50' : ''}`}
                        >
                          {isRecording ? (
                            <Square className="h-6 w-6" />
                          ) : hasRecorded ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Mic className="h-6 w-6" />
                          )}
                        </button>
                        
                        {(recordedAudio || currentAnswer?.audioUrl) && (
                          <button
                            onClick={handlePlayRecording}
                            className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-lg"
                          >
                            {isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-600">
                          {isRecording 
                            ? 'Recording... Speak clearly and confidently' 
                            : recordedAudio || currentAnswer?.audioUrl
                            ? 'Recording completed. You can listen to your answer.'
                            : hasRecorded
                            ? 'Recording already completed for this question'
                            : speechEnded && autoRecordEnabled && !isRecording && !userManuallyStopped
                            ? 'Question spoken. Auto recording will start in 1 second...'
                            : autoSpeaking
                            ? 'Listening to question... Please wait'
                            : hasQuestionSpoken && !hasRecorded
                            ? 'Question spoken. Ready for recording.'
                            : 'Click the microphone to start recording your answer'}
                        </p>
                      </div>
                    </div>

                    {/* Playback Section */}
                    {(recordedAudio || currentAnswer?.audioUrl) && (
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold">Your Recording</h4>
                          <div className="flex space-x-2">
                            <div className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg bg-green-50 text-sm">
                              Recording Completed
                            </div>
                          </div>
                        </div>
                        <audio 
                          ref={audioRef}
                          controls 
                          className="w-full"
                        />
                      </div>
                    )}
                  
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-[100%] bg-white border-t shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Previous
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="font-medium text-gray-600">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={handleNextQuestion}
                disabled={isCombining || isSubmitting || isCompressing}
                className={`flex items-center ${isCombining || isSubmitting || isCompressing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-3 rounded-lg font-medium text-lg`}
              >
                {isCombining ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Combining...
                  </>
                ) : isCompressing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Compressing...
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Review & Submit'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Combined Audio Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Review & Submit Recording</h2>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                {/* Compression Info */}
            
{/* // Review modal section में: */}
{compressionInfo && (
  <div className="bg-blue-50 p-4 rounded-xl mb-4">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-lg flex items-center">
        <Shrink className="h-5 w-5 mr-2 text-blue-600" />
        Audio Compression
      </h3>
      <span className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
        Optimized for Upload
      </span>
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="bg-white p-3 rounded-lg border">
        <div className="text-sm text-gray-500">Original Size</div>
        <div className="font-bold">{formatFileSize(compressionInfo.originalSize)}</div>
      </div>
      <div className="bg-white p-3 rounded-lg border">
        <div className="text-sm text-gray-500">Compressed Size</div>
        <div className="font-bold text-green-600">{formatFileSize(compressionInfo.compressedSize)}</div>
      </div>
      <div className="bg-white p-3 rounded-lg border">
        <div className="text-sm text-gray-500">Compression Ratio</div>
        <div className="font-bold">{Math.round(compressionInfo.ratio * 100)}%</div>
      </div>
      <div className="bg-white p-3 rounded-lg border">
        <div className="text-sm text-gray-500">Bitrate</div>
        <div className="font-bold">{Math.round(compressionInfo.bitrate / 1000)} kbps</div>
      </div>
    </div>
    
    <div className="text-sm text-gray-600">
      ✓ Target achieved: ~1MB per 3 minutes
      <br />
      ✓ Audio optimized for speech clarity
      <br />
      ✓ Perfect for online submission
    </div>
  </div>
)}
                {/* Combined Audio Player */}
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Final Recording</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {answeredQuestions} of {totalQuestions} questions
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">
                      Listen to your combined recording. Audio has been compressed for optimal upload speed while maintaining speech clarity.
                    </p>
                  </div>
                  
                  {/* Combined Audio Player */}
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-6">
                      <button
                        onClick={playCombinedAudio}
                        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg"
                      >
                        {isPlayingCombined ? (
                          <Pause className="h-7 w-7" />
                        ) : (
                          <Headphones className="h-7 w-7" />
                        )}
                      </button>
                      
                      <button
                        onClick={downloadCompressedAudio}
                        className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-lg"
                        title="Download Compressed Version"
                      >
                        <Download className="h-7 w-7" />
                      </button>
                      
                      <button
                        onClick={downloadCombinedAudio}
                        className="w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg"
                        title="Download Original (Larger)"
                      >
                        <Download className="h-7 w-7" />
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full"></div>
                      </button>
                    </div>
                    
                    <div className="text-center text-xs text-gray-500">
                      <div>Left: Play • Middle: Compressed • Right: Original</div>
                    </div>
                    
                    <audio 
                      ref={combinedAudioRef}
                      controls 
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Transcript Summary */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold mb-3">Transcript Summary</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {answers.map((answer, index) => {
                      const question = allQuestions.find(q => q._id === answer.questionId);
                      return (
                        <div key={answer.questionId} className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Question {index + 1}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${answer.audioBlob ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {answer.audioBlob ? 'Recorded' : 'Not Recorded'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {answer.transcript || "No transcript available"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Test
                </button>
                
                <div className="flex space-x-4">
                  <button
                    onClick={downloadCompressedAudio}
                    className="flex items-center px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Compressed
                  </button>
                  
                  <button
                    onClick={uploadCombinedAudio}
                    disabled={isSubmitting}
                    className="flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Submit Test
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingTestSection;