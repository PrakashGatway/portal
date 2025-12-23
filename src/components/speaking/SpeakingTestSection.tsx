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
  Send,
  User,
  Lock,
} from "lucide-react";
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

  const MAX_RECORDING_TIME = 120;
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<string>("");
  const [userManuallyStopped, setUserManuallyStopped] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [autoSpeaking, setAutoSpeaking] = useState(false);
  const [speechEnded, setSpeechEnded] = useState(false);
  const [hasQuestionSpoken, setHasQuestionSpoken] = useState(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(
    progress.sectionTimeRemaining || question.timeLimit * 60
  );

  


  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voicesLoadedRef = useRef<boolean>(false);
  const audioBlobsRef = useRef<Map<string, Blob>>(new Map());

  const handleRecordClickRef = useRef<() => Promise<void>>();

  // ✅ useMemo for computed values
  const allQuestions = useMemo(() => {
    const questions: any[] = [];
    if (!question.questionGroup || question.questionGroup.length === 0) return questions;
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
    // Priority 1: API से आया sectionTimeRemaining (progress object में)
    if (progress.sectionTimeRemaining !== undefined) {
     
      return progress.sectionTimeRemaining;
    }
    
    // Priority 2: Question का timeLimit (minutes में, convert to seconds)
   
    return question.timeLimit * 60;
  }, [progress.sectionTimeRemaining, question.timeLimit]);
  // ✅ useCallback for functions


  
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const drawVisualizer = useCallback(() => {
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

  const stopVisualization = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (analyserRef.current && audioContextRef.current) {
      analyserRef.current.disconnect();
      // audioContextRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const getAccurateDuration = useCallback((blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          resolve(Math.round(audioBuffer.duration));
          audioContext.close();
        } catch (err) {
          resolve(0);
        }
      };
      reader.onerror = () => resolve(0);
      reader.readAsArrayBuffer(blob);
    });
  }, []);


  const handleBack = useCallback(() => {

  
  // 1. Text-to-speech stop करें
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  // 2. Recording stop करें (अगर चल रही है)
  if (isRecording) {

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopVisualization();
    setIsRecording(false);
  }
  
  // 3. All timers clear करें
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  
  if (audioTimerRef.current) {
    clearInterval(audioTimerRef.current);
    audioTimerRef.current = null;
  }
  
  if (autoRecordTimeoutRef.current) {
    clearTimeout(autoRecordTimeoutRef.current);
    autoRecordTimeoutRef.current = null;
  }
  
  // 4. Audio playback stop करें
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  
  // 5. Media streams cleanup
  if (mediaStreamRef.current) {
    mediaStreamRef.current.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
  }
  
  // 6. Audio context cleanup
  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }
  
  // 7. Animation cleanup
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }
  
  // 8. Clean up recorded audio URLs
  answers.forEach(answer => {
    if (answer.audioUrl) {
      URL.revokeObjectURL(answer.audioUrl);
    }
  });
  
  if (recordedAudio) {
    URL.revokeObjectURL(recordedAudio);
  }
  
 
  
  // 9. Parent के onBack को call करें
  onBack();
  
}, [isRecording, stopVisualization, answers, recordedAudio, onBack]);


  const stopAutoSpeak = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setAutoSpeaking(false);
    speechSynthesisRef.current = null;
  }, []);

 const startAutoSpeak = useCallback(() => {
  if (!currentQuestion || !('speechSynthesis' in window)) {
    setRecordingStatus("Speech synthesis not available.");
    return;
  }

  // पहले की speech cancel करें
  window.speechSynthesis.cancel();
  
  stopAutoSpeak();
  setSpeechEnded(false);
  setUserManuallyStopped(false);
  setAutoSpeaking(true);

  const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
  utterance.rate = 0.8;
  utterance.pitch = 1.0;
  utterance.volume = 1;

  utterance.onstart = () => {
 
    setRecordingStatus("Listening to question...");
  };

  utterance.onend = () => {
  
    setAutoSpeaking(false);
    setSpeechEnded(true);
    setHasQuestionSpoken(true);
    setRecordingStatus("Question spoken. Auto-recording in 1 second...");

    // ✅ 1 second के बाद auto-record start करें
    setTimeout(() => {
      if (!currentQuestion || hasRecorded || isRecording) {
       
        return;
      }
      
     
      
      // ✅ Ref के through handleRecordClick call करें
      if (handleRecordClickRef.current) {
        handleRecordClickRef.current();
      } else {
     
      }
    }, 1000);
  };

  utterance.onerror = (event) => {

    setAutoSpeaking(false);
    setHasQuestionSpoken(true);
    setRecordingStatus("Speech error. Click microphone to record manually.");
  };

  // Voice selection
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const femaleVoices = voices.filter(voice => {
      const voiceName = voice.name.toLowerCase();
      return voice.lang.startsWith('en') && (
        voiceName.includes('female') || voiceName.includes('woman') ||
        voiceName.includes('samantha') || voiceName.includes('zira')
      );
    });
    if (femaleVoices.length > 0) {
      utterance.voice = femaleVoices[0];
    } else {
      const englishVoice = voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
    }
  }

  speechSynthesisRef.current = utterance;
  
  // Speech start करें
 
  window.speechSynthesis.speak(utterance);

}, [currentQuestion, hasRecorded, isRecording, stopAutoSpeak]);
// ✅ NO handleRecordClick in dependencies!


  

  const toggleQuestionSpeech = useCallback(() => {
    if (!currentQuestion || !('speechSynthesis' in window)) return;

    if (window.speechSynthesis.speaking) {
      stopAutoSpeak();
      setRecordingStatus("Speech stopped");
    } else {
      startAutoSpeak();
    }
  }, [currentQuestion, stopAutoSpeak, startAutoSpeak]);

  const startAudioRecording = useCallback((stream: MediaStream) => {
    try {
      const aacMimeType = 'audio/mp4;codecs=mp4a.40.2';
      const aacAlternative = 'audio/aac';
      
      let options: MediaRecorderOptions = {
        audioBitsPerSecond: 32000,
      };
      
      if (MediaRecorder.isTypeSupported(aacMimeType)) {
        options.mimeType = aacMimeType;
      } else if (MediaRecorder.isTypeSupported(aacAlternative)) {
        options.mimeType = aacAlternative;
      } else {
        const fallbackTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          ''
        ];
        for (const mimeType of fallbackTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            if (mimeType) options.mimeType = mimeType;
            break;
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      const recordingStartTime = Date.now();
      
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
          setRecordingStatus(`Recording completed successfully ✓ (${formatTime(finalDuration)})`);
          
        } catch (error) {
     
          setRecordingStatus("Recording failed");
        }
      };
      
      mediaRecorder.start(100);
      
    } catch (err) {
    
      setRecordingStatus("Audio recording not supported");
    }
  }, [currentQuestion, recordingTime, formatTime]);

 

  const createAudioZip = useCallback(async (): Promise<{
    zipBlob: Blob; fileInfo: Array<{
      name: string;
      duration: number;
      questionNum: number;
      questionId: string;
      testId?: string;
      questionText: string;
    }>
  }> => {
    setRecordingStatus("Creating ZIP file...");
    const files: { [name: string]: Uint8Array } = {};
    const fileInfo: Array<{
      name: string;
      duration: number;
      questionNum: number;
      questionId: string;
      testId?: string;
      questionText: string;
    }> = [];

    const testId = question._id;
    const sortedAnswers = [...answers].sort((a, b) => {
      const qa = allQuestions.find(q => q._id === a.questionId);
      const qb = allQuestions.find(q => q._id === b.questionId);
      return (qa?.groupOrder || 0) * 100 + (qa?.questionInGroupIndex || 0)
        - (qb?.groupOrder || 0) * 100 - (qb?.questionInGroupIndex || 0);
    });

    let validCount = 0;
    for (const ans of sortedAnswers) {
      if (!ans.audioBlob) continue;
      validCount++;

      const filename = `question_${validCount}_${ans.questionId}.webm`;
      const duration = await getAccurateDuration(ans.audioBlob);
      const arrayBuffer = await ans.audioBlob.arrayBuffer();
      files[filename] = new Uint8Array(arrayBuffer);

      fileInfo.push({
        name: filename,
        duration: duration,
        questionNum: validCount,
        questionId: ans.questionId,
        questionText: currentQuestion.question || ""
      });
    }

    const totalDuration = fileInfo.reduce((sum, f) => sum + f.duration, 0);
    const metadata = {
      sectionId: question?.sectionId,
      testId: testId,
      testTitle: question.title,
      questionGroupId: question?._id,
      totalQuestions: allQuestions.length,
      recordedQuestions: validCount,
      totalDurationSeconds: totalDuration,
      totalDurationFormatted: formatTime(Math.round(totalDuration)),
      files: fileInfo,
    };

    files['metadata.json'] = new TextEncoder().encode(JSON.stringify(metadata, null, 2));
    const zipped = zipSync(files, { level: 6, mtime: new Date() });
    const zipBlob = new Blob([zipped], { type: 'application/zip' });
    setRecordingStatus("ZIP file created");
    return { zipBlob, fileInfo };
  }, [answers, allQuestions, currentQuestion, question, formatTime, getAccurateDuration]);





  const uploadAudioZip = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const validAnswers = answers.filter(a => a.audioUrl);
      
      if (validAnswers.length === 0) {
        setRecordingStatus("No recordings found to submit");
        return;
      }
      
      const files: { [name: string]: Uint8Array } = {};
      const fileInfo: Array<{
        name: string;
        duration: number;
        questionNum: number;
        questionId: string;
        questionText: string;
      }> = [];
      
      for (let i = 0; i < validAnswers.length; i++) {
        const ans = validAnswers[i];
        const q = allQuestions.find(q => q._id === ans.questionId);
        
        let audioBlob: Blob;
        
        if (audioBlobsRef.current.has(ans.questionId)) {
          audioBlob = audioBlobsRef.current.get(ans.questionId)!;
        } else if (ans.audioBlob) {
          audioBlob = ans.audioBlob;
        } else if (ans.audioUrl) {
          try {
            const response = await fetch(ans.audioUrl);
            audioBlob = await response.blob();
          } catch (error) {
          
            continue;
          }
        } else {
       
          continue;
        }
        
        const extension = audioBlob.type.includes('mp4') ? 'm4a' : 
                         audioBlob.type.includes('webm') ? 'webm' : 'wav';
        const filename = `question_${i+1}_${ans.questionId}.${extension}`;
        
        const arrayBuffer = await audioBlob.arrayBuffer();
        files[filename] = new Uint8Array(arrayBuffer);
        
        fileInfo.push({
          name: filename,
          duration: ans.duration || 0,
          questionNum: i + 1,
          questionId: ans.questionId,
          questionText: q?.question || ""
        });
      }
      
      const metadata = {
        testId: question._id,
        sectionId: question?.sectionId,
        testTitle: question.title,
        totalQuestions: allQuestions.length,
        recordedQuestions: validAnswers.length,
        files: fileInfo,
      };
      
      files['metadata.json'] = new TextEncoder().encode(JSON.stringify(metadata, null, 2));
      
      setRecordingStatus("Creating ZIP file...");
      const zipped = zipSync(files, { level: 6, mtime: new Date() });
      const zipBlob = new Blob([zipped], { type: 'application/zip' });
      
      const formData = new FormData();
      formData.append('file', zipBlob, `speaking_test_${question.title.replace(/\s+/g, '_')}.zip`);
      
      const response = await api.post('/upload/audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 300000,
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setRecordingStatus(`Uploading ZIP: ${pct}%`);
          }
        }
      });
      
      const formattedAnswers = validAnswers.map(a => ({
        questionId: a.questionId,
        audioUrl: a.audioUrl || '',
        transcript: "",
        sectionId: sectionId,
        questionGroupId: a.questionGroupId,
        testId: question._id
      }));
      
      onSubmit(formattedAnswers);
      setRecordingStatus("Test submitted successfully!");
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setRecordingStatus("Error uploading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, allQuestions, question, sectionId, onSubmit]);

 

  const handleRecordClick = useCallback(async () => {
  if (!currentQuestion) return;

  if (hasRecorded && !isRecording) {
    setRecordingStatus("Recording already completed for this question");
    return;
  }

  if (isRecording) {
    // Stop recording
    setUserManuallyStopped(true);
    setRecordingStatus("Stopping recording...");

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    stopVisualization();
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await onRecord("stop", currentQuestion._id);
    } catch (e) {
      // handle error
    }

  } else {
    // Start recording
    setUserManuallyStopped(false);
    setRecordingStatus("Preparing to record...");
    audioChunksRef.current = [];
    setRecordedAudio("");
    setRecordingTime(0); // ✅ Line ~30: Recording start पर reset करें

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
      
      // Recording setup
      const aacMimeType = 'audio/mp4;codecs=mp4a.40.2';
      const aacAlternative = 'audio/aac';
      
      let options: MediaRecorderOptions = {
        audioBitsPerSecond: 32000,
      };
      
      if (MediaRecorder.isTypeSupported(aacMimeType)) {
        options.mimeType = aacMimeType;
      } else if (MediaRecorder.isTypeSupported(aacAlternative)) {
        options.mimeType = aacAlternative;
      } else {
        const fallbackTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          ''
        ];
        for (const mimeType of fallbackTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            if (mimeType) options.mimeType = mimeType;
            break;
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      const recordingStartTime = Date.now();
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setRecordingStatus("Recording failed: No audio data");
          return;
        }
        
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
      };
      
      mediaRecorder.start(100);
      
      startVisualization(stream);
      setIsRecording(true);
      setRecordingStatus(`${MAX_RECORDING_TIME/60} minutes max`); // ✅ Line ~95: Constant use करें

      const startTime = Date.now();
     
      // ✅ पहले existing timer clear करें (Line ~103-105)
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedSeconds);

        if (elapsedSeconds >= MAX_RECORDING_TIME) { // ✅ Line ~111: Constant use करें
          // Auto stop करें
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          stopVisualization();
          setIsRecording(false);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 1000);

      try {
        await onRecord("start", currentQuestion._id);
      } catch (e) {
        // handle error
      }

    } catch (err) {
      setRecordingStatus("Microphone access denied");
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }
}, [currentQuestion, hasRecorded, isRecording, stopVisualization, startVisualization, formatTime, onRecord, MAX_RECORDING_TIME]); // ✅ Line ~148: MAX_RECORDING_TIME को dependencies में add करें

// ✅ handleRecordClick को ref में store करें
useEffect(() => {
  handleRecordClickRef.current = handleRecordClick;
}, [handleRecordClick]);


 const handleSubmitTest = useCallback(async () => {
    const recordedCount = answers.filter(a => a.audioUrl).length;
    
    if (recordedCount < allQuestions.length) {
      const missingIndices = answers
        .map((ans, idx) => !ans.audioUrl ? idx + 1 : null)
        .filter(idx => idx !== null);
      
      setRecordingStatus(
        `Please record all questions. ${recordedCount}/${allQuestions.length} recorded. ` +
        `Missing questions: ${missingIndices.join(', ')}`
      );
      return;
    }
    
    await uploadAudioZip();
  }, [answers, allQuestions, uploadAudioZip]);

 

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
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
      setPlaybackProgress(0);
      setPlaybackCurrentTime(0);
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
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
      if (sectionTimerRef.current) clearInterval(sectionTimerRef.current);
    };
  }, [sectionTimeRemaining]);

  useEffect(() => {
  if (currentQuestion) {
    const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);
    if (currentAnswer?.audioUrl) {
      setHasRecorded(true);
      setRecordingStatus("Recording already completed for this question");
    } else {
      setHasRecorded(false);
    }

    // Auto-speak start करें
    if (!hasQuestionSpoken && !hasRecorded && !autoSpeaking) {
    
      
      // थोड़ा delay देकर start करें
      const timer = setTimeout(() => {
        startAutoSpeak();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }
  
  return () => {
    stopAutoSpeak();
  };
}, [currentQuestion, answers, hasRecorded, hasQuestionSpoken, autoSpeaking, startAutoSpeak, stopAutoSpeak]);

  useEffect(() => {
    if ('speechSynthesis' in window && !voicesLoadedRef.current) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) voicesLoadedRef.current = true;
      };
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
      return () => window.speechSynthesis.onvoiceschanged = null;
    }
  }, []);

  useEffect(() => {
  if (isRecording && !timerRef.current) {
    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setRecordingTime(elapsedSeconds);

      if (elapsedSeconds >= MAX_RECORDING_TIME) { // ✅ Constant use करें
        // handleRecordClick call करें
        if (handleRecordClickRef.current) {
          handleRecordClickRef.current();
        }
      }
    }, 1000);
  } else if (!isRecording && timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
}, [isRecording, MAX_RECORDING_TIME]); // ✅ MAX_RECORDING_TIME को dependencies में add करें

  useEffect(() => {
    if (recordedAudio && currentQuestion) {
      setAnswers(prev => prev.map(answer => {
        if (answer.questionId === currentQuestion._id && !answer.audioUrl) {
          return {
            ...answer,
            audioUrl: recordedAudio,
            duration: recordingTime
          };
        }
        return answer;
      }));
    }
  }, [recordedAudio, currentQuestion, recordingTime]);

  useEffect(() => {
    if (speechEnded && !isRecording && !userManuallyStopped && !hasRecorded) {
      setRecordingStatus("Question spoken. Click microphone to record your answer.");
    }
  }, [speechEnded, isRecording, userManuallyStopped, hasRecorded]);

 useEffect(() => {
  return () => {
    stopVisualization();
    stopAutoSpeak();
    if (audioRef.current) audioRef.current.pause();
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
    
    // ✅ ADD TIMER CLEANUP
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  };
}, [stopVisualization, stopAutoSpeak]);

  // ✅ UI remains exactly the same
  // ... (UI code remains unchanged, exactly as in your original component)
  
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
    // ✅ UI JSX remains exactly the same as your original code
    // ... (paste your exact UI JSX here)
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
       <TestHeader
        title={question.title}
        currentSection={currentQuestionGroup?.title || "Speaking Section"}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        initialTimeRemaining={initialTimeRemaining} // ✅ केवल initial time
        autoSpeaking={autoSpeaking}
        hasQuestionSpoken={hasQuestionSpoken}
        onBack={handleBack}
        formatTime={formatTime}
        onTimeUp={() => {
         
      
          handleSubmitTest(); 
        }}// ✅ Optional callback
      />

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
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${currentQuestion.isCueCard ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-600 text-white'
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
                      className={`p-2 rounded-full transition-colors ${hasQuestionSpoken ? 'cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      title={hasQuestionSpoken ? "Question already spoken" : autoSpeaking ? "Stop speech" : "Play question with female voice"}
                      disabled={hasQuestionSpoken}
                    >
                      <Volume2 className={`h-5 w-5 ${hasQuestionSpoken ? 'text-green-600' : autoSpeaking ? 'text-blue-600 animate-pulse' : 'text-gray-600'}`} />
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
                </div>
              </div>
            )}
            
          </div>

          {/* Right: Recording */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">Record Your Answer</h3>
                <p className="text-sm text-gray-600">Speak into your microphone.</p>
              </div>
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
                              speechEnded && !isRecording && !userManuallyStopped && !hasRecorded ? 'Auto-recording soon' :
                                'Ready'}
                    </span>
                  </span>
                  
                </div>
                {recordingStatus && (
                  <div className={`mt-3 p-3 rounded-lg text-center text-sm ${recordingStatus.includes('failed') || recordingStatus.includes('error')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                    {recordingStatus}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center space-x-8 mb-4">
                 <button
  onClick={() => handleRecordClickRef.current?.() || handleRecordClick()}
  disabled={(hasRecorded && !isRecording) || autoSpeaking}
  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
    isRecording
      ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-200'
      : hasRecorded
        ? 'bg-gray-300 cursor-not-allowed'
        : autoSpeaking
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
  } text-white ${(hasRecorded && !isRecording) || autoSpeaking ? 'opacity-70' : ''}`}
  title={
    autoSpeaking 
      ? "Cannot record while question is being spoken" 
      : hasRecorded && !isRecording
        ? "Recording already completed"
        : isRecording
          ? "Stop recording"
          : "Start recording"
  }
>
  {isRecording ? (
    <Square className="h-7 w-7" />
  ) : hasRecorded ? (
    <CheckCircle className="h-7 w-7" />
  ) : autoSpeaking ? (
    <Volume2 className="h-7 w-7" />
  ) : (
    <Mic className="h-7 w-7" />
  )}
</button>
                 

 <button
                    onClick={handleNextQuestion}
                    disabled={!hasRecorded}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${!hasRecorded
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : currentQuestionIndex < totalQuestions - 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                          : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                      }`}
                  >
                    {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'Submit Test'}
                  </button>



                </div>
                <div className="mb-6">
                  <p className="text-gray-600 text-sm">
  {isRecording 
    ? `Recording... ${formatTime(MAX_RECORDING_TIME - recordingTime)} remaining` 
    : recordedAudio || currentAnswer?.audioUrl
    ? 'Recording already completed for this question'
    : speechEnded && autoRecordEnabled && !isRecording && !userManuallyStopped
    ? 'Question spoken. Recording will start in 1 second...'
    : autoSpeaking
    ? 'Listening to question... Please wait'
    : hasQuestionSpoken && !hasRecorded
    ? 'Question spoken. Ready for recording.'
    : 'Click the microphone to start recording your answer'}
</p>
                </div>
              </div>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestSection;