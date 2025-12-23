import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { zipSync } from 'fflate';
import {
  ChevronLeft,
  Clock,
  Mic,
  Square,
  Volume2,
  Pause,
  Play,
  CheckCircle,
  Download,
  Package,
} from "lucide-react";
import * as fflate from 'fflate';
import api from "../../axiosInstance";
import TestHeader from "./speakingHeader";

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
    sectionTimeRemaining?: number;
  };
  onBack: () => void;
  onSubmit: (answers: Array<{
    questionId: string;
    audioUrl: string;
    transcript: string;
    sectionId?: string;
    questionGroupId?: string;
    testId?: string;
    questionText?: string;
  }>) => void;
 onRecord: (action: string, questionId: string) => Promise<void> | void;
  recording?: boolean;
  recordedUrl?: string;
  currentQuestionId?: string;
  sectionId?: string;
}



interface QuestionAnswer {
  questionId: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
  duration: number;
  questionGroupId?: string;
  testId?: string;
  sectionId?: string;
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
  sectionId,
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

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
  const [combinedAudioBlob, setCombinedAudioBlob] = useState<Blob | null>(null);
  const [combinedAudioUrl, setCombinedAudioUrl] = useState<string>("");
  const [combinedFileSize, setCombinedFileSize] = useState<string>("");
  const [isCombining, setIsCombining] = useState(false);

  // ZIP download states
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [zipUrl, setZipUrl] = useState<string>("");
  const [zipFileSize, setZipFileSize] = useState<string>("");

  // Timer states
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(
    progress.sectionTimeRemaining || question.timeLimit * 60
  );

  // Audio quality settings - Using AAC/M4A for best compatibility and quality
  const [audioQuality, setAudioQuality] = useState({
    sampleRate: 24000,     // 24kHz for better voice quality
    bitrate: 48000,        // 48 kbps = high quality (1MB per ~3.5 minutes)
    format: 'audio/mp4',   // M4A/AAC format
    codec: 'aac',
    extension: 'm4a'
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  // Combined audio ref
  const combinedBlobRef = useRef<Blob | null>(null);
  const zipBlobRef = useRef<Blob | null>(null);

  // Get all questions from all groups
  const allQuestions = React.useMemo(() => {
    const questions: any[] = [];

    if (!question.questionGroup || question.questionGroup.length === 0) {
      return questions;
    }

    const sortedGroups = [...question.questionGroup].sort((a, b) => (a.order || 0) - (b.order || 0));

    sortedGroups.forEach((group, groupIndex) => {
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

  const currentQuestion = useMemo(() => 
    allQuestions[currentQuestionIndex] || allQuestions[0] || null
  , [allQuestions, currentQuestionIndex]);

const currentQuestionGroup = useMemo(() => {
  if (!currentQuestion || !question.questionGroup) return null;
  return question.questionGroup.find(group => group._id === currentQuestion.groupId);
}, [currentQuestion, question.questionGroup]);

  const currentAnswer = useMemo(() => 
    answers.find(a => a.questionId === currentQuestion?._id)
  , [answers, currentQuestion]);

  const validAnsweredQuestions = useMemo(() => 
    answers.filter(a => a.audioUrl).length
  , [answers]);

  const totalQuestions = useMemo(() => allQuestions.length, [allQuestions]);

   const initialTimeRemaining = useMemo(() => {
    
    if (progress.sectionTimeRemaining !== undefined) {
     
      return progress.sectionTimeRemaining;
    }

    return () => {
      if (sectionTimerRef.current) {
        clearInterval(sectionTimerRef.current);
      }
    };
  }, []);

  // Detect and set optimal audio format on mount
  useEffect(() => {
    const detectOptimalFormat = () => {
      // Try AAC/M4A first for best quality and compression
      const formatTests = [
        // AAC/M4A formats (best for speech)
        { 
          mimeType: 'audio/mp4; codecs=mp4a.40.2', 
          bitrate: 48000, 
          sampleRate: 24000, 
          codec: 'aac',
          extension: 'm4a'
        },
        { 
          mimeType: 'audio/mp4; codecs=mp4a.40.5', 
          bitrate: 48000, 
          sampleRate: 24000, 
          codec: 'aac',
          extension: 'm4a'
        },
        // Opus as fallback
        { 
          mimeType: 'audio/webm; codecs=opus', 
          bitrate: 32000, 
          sampleRate: 24000, 
          codec: 'opus',
          extension: 'opus'
        },
        // Browser default
        { 
          mimeType: '', 
          bitrate: 64000, 
          sampleRate: 44100, 
          codec: 'default',
          extension: 'webm'
        }
      ];

      for (const test of formatTests) {
        if (!test.mimeType || MediaRecorder.isTypeSupported(test.mimeType)) {
          setAudioQuality({
            sampleRate: test.sampleRate,
            bitrate: test.bitrate,
            format: test.mimeType.split(';')[0] || 'audio/webm',
            codec: test.codec,
            extension: test.extension
          });
          console.log(`Using audio format: ${test.mimeType || 'default'} at ${test.bitrate} bps, extension: ${test.extension}`);
          break;
        }
      }
    };

    detectOptimalFormat();
  }, []);

  // Component mount पर ही auto speak start करें
  useEffect(() => {
    if (currentQuestion) {
      const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);
      if (currentAnswer?.audioUrl) {
        setHasRecorded(true);
        setRecordingStatus("Recording already completed for this question");
      } else {
        setHasRecorded(false);
      }

      if (!hasQuestionSpoken) {
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

  // Handle recording timer and auto stop after 2 minutes
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            handleRecordClick();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, [isRecording]);

  // Speech ended होने पर auto recording start करें
  useEffect(() => {
    if (speechEnded && autoRecordEnabled && !isRecording && !userManuallyStopped && !hasRecorded) {
      autoRecordTimeoutRef.current = setTimeout(() => {
        if (!isRecording && currentQuestion && !userManuallyStopped && !hasRecorded) {
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
  }, []);

  // Calculate estimated size
  const calculateEstimatedSize = (durationSeconds: number, bitrate: number): string => {
    const bytes = (bitrate * durationSeconds) / 8;
    const megabytes = bytes / (1024 * 1024);
    return megabytes.toFixed(2);
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

  // Auto speak function with FEMALE voice
  const startAutoSpeak = () => {
    if (!currentQuestion || !('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported");
      setRecordingStatus("Speech synthesis not available. Click microphone to record manually.");
      return;
    }

    if (hasQuestionSpoken) {
      setRecordingStatus("Question already spoken. Ready for recording.");
      return;
    }

    stopAutoSpeak();

    setSpeechEnded(false);
    setUserManuallyStopped(false);

    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);

    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setAutoSpeaking(true);
      setRecordingStatus("Listening to question...");
    };

    utterance.onend = () => {
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

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const femaleVoices = voices.filter(voice => {
        const voiceName = voice.name.toLowerCase();
        return (
          voice.lang.startsWith('en') &&
          (voiceName.includes('female') ||
            voiceName.includes('woman') ||
            voiceName.includes('samantha') ||
            voiceName.includes('zira') ||
            voiceName.includes('google uk female') ||
            voice.pitch > 1.0)
        );
      });

      if (femaleVoices.length > 0) {
        utterance.voice = femaleVoices[0];
      } else {
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
    }

    speechSynthesisRef.current = utterance;

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

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 1.5;

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
  }, []);

  const startVisualization = useCallback((stream: MediaStream) => {
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
  }, [drawVisualizer]);

  // Stop visualization
  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (analyserRef.current && audioContextRef.current) {
      analyserRef.current.disconnect();
      // audioContextRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  // Start audio recording with AAC/M4A compression
  const startAudioRecording = (stream: MediaStream) => {
    try {
      const startTime = Date.now();
      
      // Use best available format
      const mimeTypes = [
        'audio/mp4; codecs=mp4a.40.2',
        'audio/mp4; codecs=mp4a.40.5',
        'audio/mp4',
        'audio/webm; codecs=opus',
        'audio/webm',
        ''
      ];
      
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (!mime || MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const options: MediaRecorderOptions = {
        mimeType: selectedMimeType,
        audioBitsPerSecond: audioQuality.bitrate,
      };

      console.log(`Recording with: ${selectedMimeType} at ${audioQuality.bitrate} bps`);

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const actualDuration = (Date.now() - startTime) / 1000;
        setRecordingTime(Math.floor(actualDuration));
        
        if (audioChunksRef.current.length === 0) return;

        try {
          // Determine file extension based on mime type
          let extension = 'm4a';
          if (selectedMimeType.includes('webm')) {
            extension = selectedMimeType.includes('opus') ? 'opus' : 'webm';
          }

          const audioBlob = new Blob(audioChunksRef.current, {
            type: selectedMimeType.split(';')[0] || 'audio/mp4',
          });

          // Store in map with question index for naming
          if (currentQuestion) {
            audioBlobsRef.current.set(currentQuestion._id, audioBlob);
          }

          const audioUrl = URL.createObjectURL(audioBlob);
          
          setAnswers(prev => prev.map(answer => {
            if (answer.questionId === currentQuestion._id) {
              return {
                ...answer,
                audioBlob: audioBlob,
                audioUrl: audioUrl,
                duration: finalDuration,
              };
            }
            return answer;
          }));
          
          setRecordedAudio(audioUrl);
          setHasRecorded(true);

          // Update answers
          if (currentQuestion) {
            setAnswers((prev) =>
              prev.map((answer) =>
                answer.questionId === currentQuestion._id
                  ? {
                    ...answer,
                    audioBlob,
                    audioUrl,
                    transcript: transcriptRef.current,
                    duration: actualDuration,
                  }
                  : answer
              )
            );
          }

          const sizeKB = (audioBlob.size / 1024).toFixed(1);
          setRecordingStatus(`Recording saved (${sizeKB} KB, ${actualDuration.toFixed(1)}s) ✓`);

          // Clear previous combined audio and ZIP
          if (combinedAudioUrl) {
            URL.revokeObjectURL(combinedAudioUrl);
            setCombinedAudioUrl("");
            setCombinedFileSize("");
            combinedBlobRef.current = null;
          }
          
          if (zipUrl) {
            URL.revokeObjectURL(zipUrl);
            setZipUrl("");
            setZipFileSize("");
            zipBlobRef.current = null;
          }

        } catch (error) {
          console.error("Error saving recording:", error);
          setRecordingStatus("Recording saved");
        }
      };

      mediaRecorder.start(1000);
      
    } catch (err) {
      console.error("Recording failed:", err);
      setRecordingStatus("Recording failed");
    }
  }, [currentQuestion, recordingTime, formatTime]);

  // Create ZIP file of all individual recordings
  const createZipFile = async (): Promise<Blob | null> => {
    const audioBlobs = Array.from(audioBlobsRef.current.values());
    if (audioBlobs.length === 0) return null;

    setIsCreatingZip(true);
    setRecordingStatus("Creating ZIP file...");

    try {
      const files: Record<string, Uint8Array> = {};
      let totalSize = 0;

      // Create file entries for each recording
      for (let i = 0; i < allQuestions.length; i++) {
        const question = allQuestions[i];
        const blob = audioBlobsRef.current.get(question._id);
        
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const fileName = `q${i + 1}.${audioQuality.extension}`;
          
          files[fileName] = uint8Array;
          totalSize += blob.size;
        }
      }

      // Add a manifest file with transcripts
      const manifestData = {
        testTitle: question.title,
        totalQuestions: allQuestions.length,
        recordedQuestions: audioBlobs.length,
        recordings: allQuestions.map((q, index) => {
          const answer = answers.find(a => a.questionId === q._id);
          return {
            questionNumber: index + 1,
            question: q.question,
            duration: answer?.duration || 0,
            transcript: answer?.transcript || "",
            fileName: `q${index + 1}.${audioQuality.extension}`
          };
        })
      };

      files['manifest.json'] = new TextEncoder().encode(JSON.stringify(manifestData, null, 2));

      // Create ZIP using fflate
      const zipped = fflate.zipSync(files, {
        level: 6, // Maximum compression
      });

      const zipBlob = new Blob([zipped], { type: 'application/zip' });
      const zipSizeMB = (zipBlob.size / (1024 * 1024)).toFixed(2);
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      zipBlobRef.current = zipBlob;
      setZipFileSize(`${zipSizeMB} MB (from ${totalSizeMB} MB)`);
      setRecordingStatus(`ZIP created: ${zipSizeMB} MB`);
      
      return zipBlob;

    } catch (error) {
      console.error("Error creating ZIP:", error);
      setRecordingStatus("Failed to create ZIP");
      return null;
    } finally {
      setIsCreatingZip(false);
    }
  };

  // Download ZIP file
  const downloadZipFile = async () => {
    if (isCreatingZip) return;
    
    let zipBlob = zipBlobRef.current;
    
    if (!zipBlob) {
      setRecordingStatus("Creating ZIP file...");
      zipBlob = await createZipFile();
    }
    
    if (zipBlob) {
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speaking_test_individuals_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setRecordingStatus("ZIP download started!");
    }
  };

  // Combined audio function (optional - keeps existing functionality)
  const combineAudioSimple = (): Blob | null => {
    const audioBlobs = Array.from(audioBlobsRef.current.values());
    if (audioBlobs.length === 0) return null;

    const combinedBlob = new Blob(audioBlobs, { 
      type: audioQuality.format === 'audio/mp4' ? 'audio/mp4' : 'audio/webm' 
    });
    
    const totalDuration = answers
      .filter(a => a.duration)
      .reduce((sum, a) => sum + a.duration, 0);
    
    const sizeMB = (combinedBlob.size / (1024 * 1024)).toFixed(2);
    const durationMinutes = (totalDuration / 60).toFixed(1);
    const bitrate = totalDuration > 0 ? (combinedBlob.size * 8) / (totalDuration * 1000) : 0;
    
    setCombinedFileSize(`${sizeMB} MB • ${durationMinutes} min • ${bitrate.toFixed(1)} kbps`);
    
    setCombinedAudioBlob(combinedBlob);
    const url = URL.createObjectURL(combinedBlob);
    setCombinedAudioUrl(url);
    combinedBlobRef.current = combinedBlob;
    
    setRecordingStatus(`Audio combined: ${sizeMB} MB`);
    
    return combinedBlob;
  };

  // Download combined audio
  const downloadCombinedAudio = () => {
    if (!combinedBlobRef.current) {
      combineAudioSimple();
      return;
    }
    
    const blob = combinedBlobRef.current;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speaking_test_combined_${Date.now()}.${audioQuality.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setRecordingStatus("Combined audio download started!");
  };

  // Upload all audio
  const uploadAllAudio = async () => {
    setIsSubmitting(true);
    setRecordingStatus("Preparing final submission...");

    try {
      // Create combined audio for upload
      const combinedBlob = combineAudioSimple();
      
      if (validAnswers.length === 0) {
        setRecordingStatus("No recordings found to submit");
        return;
      }

      const sizeMB = (combinedBlob.size / (1024 * 1024)).toFixed(2);
      setRecordingStatus(`Uploading ${sizeMB} MB...`);

      // Upload combined audio
      const formData = new FormData();
      formData.append('file', combinedBlob, `speaking_test_${Date.now()}.${audioQuality.extension}`);

      const response = await api.post('/upload/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setRecordingStatus(`Uploading: ${percentCompleted}%`);
          }
        },
      });

      console.log('Upload successful:', response.data);

      // Prepare answers for parent
      const formattedAnswers = answers
        .filter(answer => answer.audioBlob)
        .map(answer => ({
          questionId: answer.questionId,
          audioUrl: answer.audioUrl || '',
          transcript: answer.transcript
        }));

      onSubmit(formattedAnswers);
      setRecordingStatus(`Test submitted! (${sizeMB} MB)`);

    } catch (error: any) {
      console.error('Error:', error);
      setRecordingStatus("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, allQuestions, question, sectionId, onSubmit]);

  // Auto submit when time is up
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;

    const recordingsCount = answers.filter(a => a.audioBlob).length;

    if (recordingsCount === 0) {
      setRecordingStatus("Time's up! No recordings to submit.");
      return;
    }

    setRecordingStatus("Time's up! Submitting your test...");
    await uploadAllAudio();
  };

  // Submit test
  const handleSubmitTest = async () => {
    const recordingsCount = answers.filter(a => a.audioBlob).length;

    if (recordingsCount < allQuestions.length) {
      setRecordingStatus(`Please record all questions. ${recordingsCount}/${allQuestions.length} recorded.`);
      return;
    }

    await uploadAllAudio();
  };

  // Complete recording function
  const handleRecordClick = async () => {
    if (!currentQuestion) return;

    if (hasRecorded && !isRecording) {
      setRecordingStatus("Recording already completed for this question");
      return;
    }

    if (isRecording) {
      // Stop recording
      setUserManuallyStopped(true);
      setRecordingStatus("Stopping recording...");

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      stopVisualization();
      setIsRecording(false);
      setRecordingTime(0);

      try {
        await onRecord("stop", currentQuestion._id);
      } catch (error) {
        console.error("Error stopping recording:", error);
      }

    } else {
      // Start recording
      setUserManuallyStopped(false);
      setRecordingStatus("Preparing to record...");
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
            sampleRate: audioQuality.sampleRate,
            channelCount: 1,
          }
        });

        mediaStreamRef.current = stream;

        startAudioRecording(stream);

        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (recognitionError) {
            console.error("Speech recognition start error:", recognitionError);
          }
        }

        startVisualization(stream);

        setIsRecording(true);

        const estimatedSize = calculateEstimatedSize(120, audioQuality.bitrate);
        setRecordingStatus(`Recording... Max 2 min (~${estimatedSize} MB)`);
        setRecordingTime(0);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/mp4' 
          });
          
          const recordingEndTime = Date.now();
          const accurateDuration = Math.round((recordingEndTime - recordingStartTime) / 1000);
          const finalDuration = Math.max(recordingTime, accurateDuration);
          
          if (currentQuestion) {
            audioBlobsRef.current.set(currentQuestion._id, audioBlob);
          }
          
          const audioUrl = URL.createObjectURL(audioBlob);
          
          setAnswers(prev => prev.map(answer => {
            if (answer.questionId === currentQuestion._id) {
              return {
                ...answer,
                audioBlob: audioBlob,
                audioUrl: audioUrl,
                duration: finalDuration,
              };
            }
            return answer;
          }));
          
          setRecordedAudio(audioUrl);
          setHasRecorded(true);
          setRecordingStatus(`Recording completed ✓ (${formatTime(finalDuration)})`);
          
        } catch (error) {
          setRecordingStatus("Recording failed");
        }

      } catch (err) {
        console.error("Microphone access error:", err);
        setRecordingStatus("Microphone access denied.");
        setIsRecording(false);
      }
    }
  }
}, [currentQuestion, hasRecorded, isRecording, stopVisualization, startVisualization, formatTime, onRecord, MAX_RECORDING_TIME]); 

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

  // Next question function
  const handleNextQuestion = () => {
    const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);

    if (!currentAnswer?.audioBlob) {
      setRecordingStatus("Please record your answer before proceeding");
      return;
    }

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

      stopAutoSpeak();
      stopVisualization();
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }

      if (autoRecordTimeoutRef.current) {
        clearTimeout(autoRecordTimeoutRef.current);
      }

    } else {
      handleSubmitTest();
    }
  }, [currentQuestionIndex, allQuestions.length, stopAutoSpeak, stopVisualization, handleSubmitTest]);

  // ✅ useEffect hooks
  useEffect(() => {
    if (allQuestions.length > 0 && currentQuestionIndex >= allQuestions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [allQuestions, currentQuestionIndex]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      const initialAnswers: QuestionAnswer[] = allQuestions.map(q => ({
        questionId: q._id,
        audioBlob: null,
        audioUrl: null,
        transcript: "",
        duration: 0,
        questionGroupId: q.groupId,
        testId: question._id,
        sectionId: sectionId
      }));
      setAnswers(initialAnswers);
    }
  }, [allQuestions, sectionId, question._id]);

  useEffect(() => {
    if (sectionTimeRemaining > 0) {
      sectionTimerRef.current = setInterval(() => {
        setSectionTimeRemaining(prev => prev <= 1 ? 0 : prev - 1);
      }, 1000);
    }
    return () => {
      stopVisualization();
      stopAutoSpeak();
      if (audioRef.current) {
        audioRef.current.pause();
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

      // Clean up all object URLs
      answers.forEach(answer => {
        if (answer.audioUrl) {
          URL.revokeObjectURL(answer.audioUrl);
        }
      });
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
      }
      if (combinedAudioUrl) {
        URL.revokeObjectURL(combinedAudioUrl);
      }
      if (zipUrl) {
        URL.revokeObjectURL(zipUrl);
      }
    };
  }, [answers, recordedAudio, combinedAudioUrl, zipUrl]);

  useEffect(() => {
  if (isRecording && !timerRef.current) {
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const startTime = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setRecordingTime(elapsedSeconds);

      if (elapsedSeconds >= MAX_RECORDING_TIME) {
        
        if (handleRecordClickRef.current) {
          handleRecordClickRef.current();
        }
      }
    }, 1000);
  } else if (!isRecording && timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  // Calculate current recording estimated size
  const currentRecordingSize = calculateEstimatedSize(recordingTime, audioQuality.bitrate);

  // Error handling
  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-red-600">No questions available</h3>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go Back</button>
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-semibold text-sm text-gray-900">{question.title}</h1>
                <div className="text-xs text-gray-500">
                  {currentQuestion?.groupTitle} •
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Section Timer */}
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="text-center">
                  <div className="text-xs text-blue-500">Section Time</div>
                  <div className="font-bold text-blue-700 text-sm">
                    {formatTime(sectionTimeRemaining)}
                  </div>
                </div>
              </div>

              {/* Audio format indicator */}
              <div className="flex items-center space-x-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">
                  {audioQuality.codec.toUpperCase()} • {audioQuality.bitrate / 1000}kbps
                </span>
              </div>

              {/* Size estimator during recording */}
              {isRecording && (
                <div className="flex items-center space-x-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <div className="h-2 w-2 bg-amber-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-amber-700">
                    ~{currentRecordingSize} MB
                  </span>
                </div>
              )}

              {/* Question spoken indicator */}
              {hasQuestionSpoken && !autoSpeaking && (
                <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <Volume2 className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Question Spoken</span>
                </div>
              )}

              {/* Recording completed indicator */}
              {hasRecorded && !isRecording && (
                <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Recorded</span>
                </div>
              )}

              {/* Auto speaking indicator */}
              {autoSpeaking && (
                <div className="flex items-center space-x-1 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-purple-700">Speaking...</span>
                </div>
              )}

              {/* Recording timer */}
              {isRecording && (
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="font-bold text-red-700 text-sm">
                    {formatTime(recordingTime)} / 2:00
                  </span>
                </div>
              )}

              {/* Combined audio info */}
              {combinedFileSize && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">
                      Combined: {combinedFileSize}
                    </span>
                  </div>
                  <button
                    onClick={downloadCombinedAudio}
                    className="flex items-center space-x-1 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg border border-green-200 transition-colors"
                    title="Download combined audio"
                  >
                    <Download className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Audio</span>
                  </button>
                </div>
              )}

              {/* ZIP download button (show when all questions recorded) */}
              {answeredQuestions > 0 && (
                <button
                  onClick={downloadZipFile}
                  disabled={isCreatingZip}
                  className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg border border-purple-200 transition-colors disabled:opacity-50"
                  title="Download ZIP of all individual recordings"
                >
                  {isCreatingZip ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-xs font-medium text-purple-700">Zipping...</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">
                        ZIP ({answeredQuestions}/{totalQuestions})
                      </span>
                    </>
                  )}
                </button>
              )}

              {zipFileSize && !isCreatingZip && (
                <div className="flex items-center space-x-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <div className="h-2 w-2 bg-amber-600 rounded-full"></div>
                  <span className="text-xs font-medium text-amber-700">
                    ZIP: {zipFileSize}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Question */}
          <div className="space-y-6">
            {currentQuestionGroup && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {currentQuestionGroup.type.replace('speaking_', 'Part ').toUpperCase()}
                      </div>
                      {hasQuestionSpoken && (
                        <div className="flex items-center text-xs text-green-600">
                          <User className="h-3 w-3 mr-1" /> Female Voice
                        </div>
                      )}
                    </div>
                    <h2 className="font-bold text-xl text-gray-900 mb-3">{currentQuestionGroup.title}</h2>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{currentQuestionGroup.instruction}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${currentQuestion.isCueCard
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-600 text-white'
                        }`}>
                        {currentQuestion.isCueCard ? 'Cue Card' : `Question ${currentQuestionIndex + 1}`}
                      </div>

                      {hasQuestionSpoken && (
                        <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Spoken</span>
                        </div>
                      )}
                      {hasRecorded && (
                        <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Recorded</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={toggleQuestionSpeech}
                      className={`p-2 rounded-full transition-colors ${autoSpeaking
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      title={hasQuestionSpoken ? "Question already spoken" : autoSpeaking ? "Stop speech" : "Play question with female voice"}
                      disabled={hasQuestionSpoken}
                    >
                      <Volume2 className={`h-5 w-5 ${hasQuestionSpoken ? 'text-green-600' :
                        autoSpeaking ? 'text-blue-600 animate-pulse' :
                          'text-gray-600'
                        }`} />
                    </button>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">{currentQuestion.question}</h3>
                    {currentQuestion.isCueCard && question.cueCard?.prompts && question.cueCard.prompts.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                          <div className="mr-2 p-1 bg-gray-800 rounded"><CheckCircle className="h-3 w-3 text-white" /></div> You should say:
                        </h4>
                        <ul className="space-y-2">
                          {question.cueCard.prompts.map((prompt, index) => (
                            <li key={index} className="flex items-start group">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-800 text-white rounded-full text-xs leading-6 text-center mr-3 mt-0.5 group-hover:bg-gray-700 transition-colors">
                                {index + 1}
                              </span>
                              <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{prompt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Next Button */}
                  <div className="mt-6">
                    <button
                      onClick={handleNextQuestion}
                      disabled={!currentAnswer?.audioBlob || isSubmitting}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${!currentAnswer?.audioBlob || isSubmitting
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : currentQuestionIndex < totalQuestions - 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                        }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2 inline-block"></div>
                          Submitting...
                        </>
                      ) : !currentAnswer?.audioBlob ? (
                        'Record First'
                      ) : currentQuestionIndex < totalQuestions - 1 ? (
                        `Next Question (${answeredQuestions}/${totalQuestions})`
                      ) : (
                        `Submit Test (${answeredQuestions}/${totalQuestions})`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Right: Recording */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Record Your Answer</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Speak clearly into your microphone. Recording stops after 2 minutes.</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      <span><strong>Format:</strong> {audioQuality.codec.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <span><strong>Bitrate:</strong> {audioQuality.bitrate / 1000} kbps</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                      <span><strong>Target:</strong> ~1 MB per 3.5 min</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <strong>Note:</strong> Each recording saved as q1.{audioQuality.extension}, q2.{audioQuality.extension}, etc.
                  </div>
                </div>
              </div>

              {/* Audio Visualizer */}
              <div className="mb-6">
                <div className="bg-gray-900 rounded-xl p-3">
                  <canvas ref={canvasRef} width={600} height={100} className="w-full h-12 rounded-lg" />
                </div>
                {/* Recording status display */}
                <div className="flex justify-between text-sm text-gray-600 mt-2 px-1">
                  <span>
                    Status: <span className={
                      isRecording ? "text-green-500 font-bold animate-pulse" :
                        hasRecorded ? "text-green-600" :
                          autoSpeaking ? "text-purple-500" :
                            hasQuestionSpoken ? "text-green-600" :
                              speechEnded && !isRecording && !userManuallyStopped && !hasRecorded ? "text-amber-500" :
                                "text-gray-500"
                    }>
                      {isRecording ? '● Recording' :
                        hasRecorded ? '✓ Recorded' :
                          autoSpeaking ? 'Speaking question...' :
                            hasQuestionSpoken ? '✓ Question Spoken' :
                              speechEnded && !isRecording && !userManuallyStopped && !hasRecorded ? 'Recording starting...' :
                                'Ready'}
                    </span>
                  </span>
                  
                </div>

                {recordingStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-center text-sm ${recordingStatus.includes('failed') || recordingStatus.includes('error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : recordingStatus.includes('success') || recordingStatus.includes('completed') || recordingStatus.includes('✓')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : recordingStatus.includes('Uploading') || recordingStatus.includes('Preparing') || recordingStatus.includes('Combining')
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                    {recordingStatus}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <button
                    onClick={handleRecordClick}
                    disabled={hasRecorded && !isRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-200'
                      : hasRecorded
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                      } text-white ${hasRecorded && !isRecording ? 'opacity-50' : ''}`}
                  >
                    {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Submit Test'}
                  </button>

                  {(recordedAudio || currentAnswer?.audioUrl) && (
                    <button
                      onClick={handlePlayRecording}
                      className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7" />
                      ) : (
                        <Play className="h-7 w-7" />
                      )}
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 text-sm">
                    {isRecording
                      ? `Recording... ${120 - recordingTime}s left (~${currentRecordingSize} MB)`
                      : recordedAudio || currentAnswer?.audioUrl
                        ? `Recording completed. File: q${currentQuestionIndex + 1}.${audioQuality.extension}`
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

              {/* Individual Recording Playback */}
              {(recordedAudio || currentAnswer?.audioUrl) && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Your Recording</h4>
                      <p className="text-sm text-gray-500">
                        File: q{currentQuestionIndex + 1}.{audioQuality.extension}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-1 px-3 py-1 border-2 border-green-600 text-green-600 rounded-lg bg-green-50 text-sm">
                        <CheckCircle className="h-3 w-3" />
                        <span>Recorded</span>
                      </div>
                      <div className="flex items-center space-x-1 px-3 py-1 border-2 border-blue-600 text-blue-600 rounded-lg bg-blue-50 text-sm">
                        <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        <span>{audioQuality.codec.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    controls
                    className="w-full"
                  />

                  {/* Transcript */}
                  {currentAnswer?.transcript && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">Transcript</h5>
                        <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          Transcript
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{currentAnswer.transcript}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Combined Audio Section */}
              {combinedAudioUrl && combinedFileSize && (
                <div className="border-t mt-6 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Final Combined Audio</h4>
                      <p className="text-sm text-gray-600">{combinedFileSize}</p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-1 px-3 py-1 border-2 border-green-600 text-green-600 rounded-lg bg-green-50 text-sm">
                        <CheckCircle className="h-3 w-3" />
                        <span>Ready</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <audio
                      src={combinedAudioUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={downloadCombinedAudio}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Combined Audio (.{audioQuality.extension})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ZIP Download Section */}
              {answeredQuestions > 0 && (
                <div className="border-t mt-6 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Individual Recordings (ZIP)</h4>
                      <p className="text-sm text-gray-600">
                        Download all individual recordings as ZIP file
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-1 px-3 py-1 border-2 border-purple-600 text-purple-600 rounded-lg bg-purple-50 text-sm">
                        <Package className="h-3 w-3" />
                        <span>ZIP Ready</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                    <div className="flex items-start space-x-3">
                      <Package className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">What's included:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Individual recordings: q1.{audioQuality.extension}, q2.{audioQuality.extension}, etc.</li>
                          <li>• Transcripts in manifest.json</li>
                          <li>• Question details and timing information</li>
                          <li>• Maximum compression with fflate library</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={downloadZipFile}
                      disabled={isCreatingZip}
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isCreatingZip
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                    >
                      {isCreatingZip ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          <span>Creating ZIP...</span>
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4" />
                          <span>Download All Recordings as ZIP</span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      {zipFileSize ? `Compressed size: ${zipFileSize}` : 'Click to create ZIP file'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestSection;