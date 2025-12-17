import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Clock,
  Mic,
  Square,
  Volume2,
  Pause,
  Play,
  CheckCircle,
} from "lucide-react";
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
    sectionTimeRemaining?: number;
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
  duration: number;
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [transcript, setTranscript] = useState("");
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
  
  // Timer states
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(
    progress.sectionTimeRemaining || question.timeLimit * 60
  );
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
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
        transcript: "",
        duration: 0
      }));
      setAnswers(initialAnswers);
    }
  }, [allQuestions]);

  // Section timer
  useEffect(() => {
    if (sectionTimeRemaining > 0) {
      sectionTimerRef.current = setInterval(() => {
        setSectionTimeRemaining(prev => {
          if (prev <= 1) {
            if (sectionTimerRef.current) clearInterval(sectionTimerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (sectionTimerRef.current) {
        clearInterval(sectionTimerRef.current);
      }
    };
  }, []);

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

  // Load voices for speech synthesis - Female voice preference
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
          if (prev >= 120) { // 2 minutes = 120 seconds
            handleRecordClick(); // Auto stop recording
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

  // Generate beep sound for combining
  const generateBeep = (duration = 0.5, frequency = 1000, sampleRate = 44100): Float32Array => {
    const numSamples = Math.round(duration * sampleRate);
    const beepData = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      beepData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3; // 30% volume
    }
    
    return beepData;
  };

  // Auto speak function with FEMALE voice
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
    
    // Voice settings for female voice
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    // Voice events
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
    
    // Select FEMALE voice
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
      
      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
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

  // Combine audio with beep between questions
  const combineAudioWithBeeps = async (): Promise<Blob | null> => {
    const audioBlobs = Array.from(audioBlobsRef.current.values());
    
    if (audioBlobs.length === 0) {
      return null;
    }
    
    try {
      setRecordingStatus("Combining recordings with beep markers...");
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      
      // Create beep sound
      const beepDuration = 0.5; // 500ms beep
      const beepData = generateBeep(beepDuration, 1000, sampleRate);
      const beepBuffer = audioContext.createBuffer(1, beepData.length, sampleRate);
      beepBuffer.copyToChannel(beepData, 0);
      
      // Array to hold decoded audio buffers
      const audioBuffers: AudioBuffer[] = [];
      let totalLength = 0;
      
      // Decode each audio blob and calculate total length
      for (let i = 0; i < audioBlobs.length; i++) {
        const blob = audioBlobs[i];
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers.push(audioBuffer);
        
        // Add actual audio length
        totalLength += audioBuffer.length;
        
        // Add beep between questions (except after last one)
        if (i < audioBlobs.length - 1) {
          totalLength += beepBuffer.length;
        }
      }
      
      // Create new buffer for combined audio
      const combinedBuffer = audioContext.createBuffer(1, totalLength, sampleRate);
      const output = combinedBuffer.getChannelData(0);
      
      let offset = 0;
      
      // Mix in all audio with beeps
      for (let i = 0; i < audioBuffers.length; i++) {
        const audioBuffer = audioBuffers[i];
        
        // Add actual recorded audio
        const audioData = audioBuffer.getChannelData(0);
        for (let j = 0; j < audioData.length; j++) {
          output[offset + j] = audioData[j];
        }
        offset += audioData.length;
        
        // Add beep between questions (except after last one)
        if (i < audioBuffers.length - 1) {
          const beepChannelData = beepBuffer.getChannelData(0);
          for (let j = 0; j < beepChannelData.length; j++) {
            output[offset + j] = beepChannelData[j];
          }
          offset += beepChannelData.length;
        }
      }
      
      // Convert back to blob (WAV format)
      const wavBlob = await audioBufferToWav(combinedBuffer);
      
      setRecordingStatus("Recordings combined with beep markers");
      
      return wavBlob;
      
    } catch (error) {
      console.error("Error combining audio:", error);
      setRecordingStatus("Error combining recordings");
      
      // Fallback: simple concatenation
      try {
        const combinedChunks: BlobPart[] = [];
        for (const blob of audioBlobs) {
          const arrayBuffer = await blob.arrayBuffer();
          combinedChunks.push(arrayBuffer);
        }
        return new Blob(combinedChunks, { type: 'audio/webm;codecs=opus' });
      } catch (fallbackError) {
        console.error("Fallback combining also failed:", fallbackError);
        return null;
      }
    }
  };

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const length = buffer.length;
      
      // Create WAV header
      const wav = new DataView(new ArrayBuffer(44 + length * numberOfChannels * 2));
      
      // RIFF identifier
      writeString(wav, 0, 'RIFF');
      wav.setUint32(4, 36 + length * numberOfChannels * 2, true);
      writeString(wav, 8, 'WAVE');
      writeString(wav, 12, 'fmt ');
      wav.setUint32(16, 16, true);
      wav.setUint16(20, 1, true);
      wav.setUint16(22, numberOfChannels, true);
      wav.setUint32(24, sampleRate, true);
      wav.setUint32(28, sampleRate * numberOfChannels * 2, true);
      wav.setUint16(32, numberOfChannels * 2, true);
      wav.setUint16(34, 16, true);
      writeString(wav, 36, 'data');
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

  // Start audio recording with Opus
  const startAudioRecording = (stream: MediaStream) => {
    try {
      const opusMimeType = 'audio/webm;codecs=opus';
      const isOpusSupported = MediaRecorder.isTypeSupported(opusMimeType);
      
      let options: MediaRecorderOptions = {
        audioBitsPerSecond: 16000,
      };
      
      if (isOpusSupported) {
        options.mimeType = opusMimeType;
      } else {
        const fallbackTypes = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          ''
        ];
        
        for (const mimeType of fallbackTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            if (mimeType) {
              options.mimeType = mimeType;
            }
            break;
          }
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
          
          // Always accept recording - NO WORD COUNT CHECK
          if (currentQuestion) {
            audioBlobsRef.current.set(currentQuestion._id, audioBlob);
          }
          
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudio(audioUrl);
          setHasRecorded(true);
          
          if (currentQuestion) {
            setAnswers(prev => prev.map(answer => 
              answer.questionId === currentQuestion._id 
                ? { 
                    ...answer, 
                    audioBlob, 
                    audioUrl, 
                    transcript: transcriptRef.current,
                    duration: recordingTime
                  }
                : answer
            ));
          }
          
          setRecordingStatus("Recording completed ✓");
          
        } catch (error) {
          console.error("Blob creation error:", error);
          setRecordingStatus("Recording failed");
        }
      };
      
      mediaRecorder.start(100);
      
    } catch (err) {
      console.error("Audio recording initialization failed:", err);
      setRecordingStatus("Audio recording not supported");
    }
  };

  // Upload all audio directly - NO REVIEW
  const uploadAllAudio = async () => {
    setIsSubmitting(true);
    setRecordingStatus("Preparing submission...");
    
    try {
      // Combine audio with beeps
      const combinedBlob = await combineAudioWithBeeps();
      
      if (!combinedBlob) {
        setRecordingStatus("No recordings to submit");
        setIsSubmitting(false);
        return;
      }
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', combinedBlob, 'speaking_test_with_beeps.wav');
      
      // Add transcripts for all recordings
      const transcripts = answers
        .filter(answer => answer.audioBlob)
        .map(answer => ({
          questionId: answer.questionId,
          transcript: answer.transcript
        }));
      
      formData.append('transcripts', JSON.stringify(transcripts));
      
      // Upload
      const response = await api.post('/upload/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 60000,
      });
      
      console.log('Audio uploaded successfully:', response.data);
      
      // Prepare answers for parent component
      const formattedAnswers = answers
        .filter(answer => answer.audioBlob)
        .map(answer => ({
          questionId: answer.questionId,
          audioUrl: answer.audioUrl || '',
          transcript: answer.transcript
        }));
      
      // Submit directly
      onSubmit(formattedAnswers);
      
      setRecordingStatus("Test submitted successfully!");
      
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

  // Submit test - DIRECT without review
  const handleSubmitTest = async () => {
    // Check if all questions are recorded (NO WORD COUNT CHECK)
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
            sampleRate: 16000,
            channelCount: 1
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
        setRecordingStatus("Recording... Speak now (2 minutes max)");
        setRecordingTime(0);
        
        try {
          await onRecord("start", currentQuestion._id);
        } catch (error) {
          console.error("Error starting recording:", error);
        }
        
      } catch (err) {
        console.error("Microphone access error:", err);
        setRecordingStatus("Microphone access denied");
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

  // Next question function - only if current question is recorded
  const handleNextQuestion = () => {
    const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);
    
    // ONLY CHECK IF RECORDED - NO WORD COUNT CHECK
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
  };

  // Cleanup
  useEffect(() => {
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
    };
  }, []);

  // Get answer for current question
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id);

  // Calculate answered questions
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
      {/* Header with section timer ONLY */}
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
            
            {/* Section Timer ONLY */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="text-center">
                  <div className="text-xs text-blue-500">Section Time</div>
                  <div className="font-bold text-blue-700 text-sm">
                    {formatTime(sectionTimeRemaining)}
                  </div>
                </div>
              </div>
              
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Question */}
          <div className="space-y-6">
            {/* Current Group Info */}
            {currentQuestionGroup && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {currentQuestionGroup.type.replace('speaking_', 'Part ').toUpperCase()}
                      </div>
                    </div>
                    <h2 className="font-bold text-xl text-gray-900 mb-3">{currentQuestionGroup.title}</h2>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {currentQuestionGroup.instruction}
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                        currentQuestion.isCueCard 
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
                      className={`p-2 rounded-full transition-colors ${
                        autoSpeaking 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title={hasQuestionSpoken ? "Question already spoken" : autoSpeaking ? "Stop speech" : "Play question with female voice"}
                      disabled={hasQuestionSpoken}
                    >
                      <Volume2 className={`h-5 w-5 ${
                        hasQuestionSpoken ? 'text-green-600' : 
                        autoSpeaking ? 'text-blue-600 animate-pulse' : 
                        'text-gray-600'
                      }`} />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 leading-relaxed">
                      {currentQuestion.question}
                    </h3>

                    {/* Cue Card Prompts */}
                    {currentQuestion.isCueCard && question.cueCard?.prompts && question.cueCard.prompts.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                          <div className="mr-2 p-1 bg-gray-800 rounded">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          You should say:
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

                  {/* Next Button ONLY */}
                  <div className="mt-6">
                    <button
                      onClick={handleNextQuestion}
                      disabled={!currentAnswer?.audioBlob || isSubmitting}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                        !currentAnswer?.audioBlob || isSubmitting
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

          {/* Right Column - Recording */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Record Your Answer</h3>
                <p className="text-sm text-gray-600">
                  Speak clearly into your microphone. Recording will automatically stop after 2 minutes.
                  <br />
                  <span className="text-xs text-blue-600 mt-1 block">
                    Audio will be combined with beep markers between questions for easy backend processing.
                  </span>
                </p>
              </div>
              
              {/* Audio Visualizer */}
              <div className="mb-6">
                <div className="bg-gray-900 rounded-xl p-3">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={100}
                    className="w-full h-12 rounded-lg"
                  />
                </div>
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
                  <span className="font-mono">
                    {isRecording ? formatTime(recordingTime) : "00:00"}
                  </span>
                </div>
                
                {recordingStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-center text-sm ${
                    recordingStatus.includes('failed') || recordingStatus.includes('error')
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

              {/* Recording Controls */}
              <div className="text-center">
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <button
                    onClick={handleRecordClick}
                    disabled={hasRecorded && !isRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-200' 
                        : hasRecorded
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                    } text-white ${hasRecorded && !isRecording ? 'opacity-50' : ''}`}
                  >
                    {isRecording ? (
                      <Square className="h-7 w-7" />
                    ) : hasRecorded ? (
                      <CheckCircle className="h-7 w-7" />
                    ) : (
                      <Mic className="h-7 w-7" />
                    )}
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
                      ? `Recording... ${120 - recordingTime} seconds remaining` 
                      : recordedAudio || currentAnswer?.audioUrl
                      ? 'Recording completed. Listen to your answer.'
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
                    <h4 className="font-bold text-gray-900">Your Recording</h4>
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-1 px-3 py-1 border-2 border-green-600 text-green-600 rounded-lg bg-green-50 text-sm">
                        <CheckCircle className="h-3 w-3" />
                        <span>Recorded</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestSection;